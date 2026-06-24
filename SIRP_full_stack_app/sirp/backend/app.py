# app.py
import os
import json
import uuid
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from resume_parser import extract_resume_text, extract_candidate_name, extract_email
from skill_gap_engine import analyze_resume
from knowledge_base import INDUSTRY_ROLES, ALL_SKILLS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "db.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md"}

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB


# ---------------------------------------------------------------------------
# Lightweight JSON "database" — no external DB dependency required to run.
# ---------------------------------------------------------------------------
def load_db():
    if not os.path.exists(DB_FILE):
        return {
            "users": [],          # students, college admins, sme/industry reps
            "colleges": [],
            "smes": [],
            "industries": [],
            "job_postings": [],
            "analyses": [],       # resume skill-gap analysis history
        }
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)


def new_id():
    return uuid.uuid4().hex[:12]


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def now_iso():
    return datetime.datetime.utcnow().isoformat() + "Z"


# ---------------------------------------------------------------------------
# Health / meta
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Smart Industry Readiness Platform API"})


@app.route("/api/meta/roles", methods=["GET"])
def get_roles():
    """Returns the industry role taxonomy used by the AI Skill Gap Analyzer."""
    roles = []
    for role, profile in INDUSTRY_ROLES.items():
        roles.append({
            "role": role,
            "required_skills": list(profile["required"].keys()),
        })
    return jsonify({"roles": roles})


@app.route("/api/meta/skills", methods=["GET"])
def get_skills():
    return jsonify({"skills": ALL_SKILLS})


# ---------------------------------------------------------------------------
# AUTH (simplified — demo-grade, not production security)
# ---------------------------------------------------------------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    db = load_db()
    payload = request.get_json(force=True)

    required_fields = ["name", "email", "role"]
    for f in required_fields:
        if not payload.get(f):
            return jsonify({"error": f"Missing field: {f}"}), 400

    if payload["role"] not in ("student", "college", "sme", "industry"):
        return jsonify({"error": "role must be one of student, college, sme, industry"}), 400

    if any(u["email"].lower() == payload["email"].lower() for u in db["users"]):
        return jsonify({"error": "An account with this email already exists"}), 409

    user = {
        "id": new_id(),
        "name": payload["name"],
        "email": payload["email"],
        "role": payload["role"],
        "organization": payload.get("organization", ""),
        "created_at": now_iso(),
    }
    db["users"].append(user)
    save_db(db)
    return jsonify({"user": user}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    db = load_db()
    payload = request.get_json(force=True)
    email = payload.get("email", "").lower()
    user = next((u for u in db["users"] if u["email"].lower() == email), None)
    if not user:
        return jsonify({"error": "No account found with this email"}), 404
    return jsonify({"user": user})


# ---------------------------------------------------------------------------
# STUDENT — AI Skill Gap Analyzer
# ---------------------------------------------------------------------------
@app.route("/api/student/analyze-resume", methods=["POST"])
def analyze_resume_route():
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded (field name must be 'resume')"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400

    filename = secure_filename(file.filename)
    unique_name = f"{new_id()}_{filename}"
    filepath = os.path.join(UPLOAD_DIR, unique_name)
    file.save(filepath)

    target_role = request.form.get("target_role") or None
    student_id = request.form.get("student_id") or None
    student_name_override = request.form.get("student_name") or None

    try:
        text = extract_resume_text(filepath)
        if not text.strip():
            return jsonify({"error": "Could not extract any text from this file."}), 422

        result = analyze_resume(text, target_role=target_role)
        candidate_name = student_name_override or extract_candidate_name(text)
        candidate_email = extract_email(text)

        record = {
            "id": new_id(),
            "student_id": student_id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "filename": filename,
            "target_role_requested": target_role,
            "analyzed_at": now_iso(),
            **result,
        }

        db = load_db()
        db["analyses"].append(record)
        save_db(db)

        return jsonify(record), 200

    except Exception as e:
        return jsonify({"error": f"Failed to process resume: {str(e)}"}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route("/api/student/analyze-text", methods=["POST"])
def analyze_text_route():
    """Allows pasting resume text directly instead of uploading a file."""
    payload = request.get_json(force=True)
    text = payload.get("text", "")
    target_role = payload.get("target_role") or None
    student_id = payload.get("student_id") or None

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    result = analyze_resume(text, target_role=target_role)
    record = {
        "id": new_id(),
        "student_id": student_id,
        "candidate_name": payload.get("student_name", "Candidate"),
        "candidate_email": None,
        "filename": None,
        "target_role_requested": target_role,
        "analyzed_at": now_iso(),
        **result,
    }
    db = load_db()
    db["analyses"].append(record)
    save_db(db)
    return jsonify(record), 200


@app.route("/api/student/history/<student_id>", methods=["GET"])
def student_history(student_id):
    db = load_db()
    records = [a for a in db["analyses"] if a.get("student_id") == student_id]
    records.sort(key=lambda r: r["analyzed_at"], reverse=True)
    return jsonify({"analyses": records})


@app.route("/api/analyses/<analysis_id>", methods=["GET"])
def get_analysis(analysis_id):
    db = load_db()
    record = next((a for a in db["analyses"] if a["id"] == analysis_id), None)
    if not record:
        return jsonify({"error": "Analysis not found"}), 404
    return jsonify(record)


# ---------------------------------------------------------------------------
# COLLEGE — aggregate dashboard of student readiness
# ---------------------------------------------------------------------------
@app.route("/api/college/dashboard", methods=["GET"])
def college_dashboard():
    db = load_db()
    analyses = db["analyses"]
    if not analyses:
        return jsonify({
            "total_students_analyzed": 0,
            "average_readiness_score": 0,
            "role_distribution": {},
            "top_missing_skills": [],
        })

    total = len(analyses)
    avg_score = round(sum(a["readiness_score"] for a in analyses) / total, 1)

    role_distribution = {}
    missing_skill_counts = {}
    for a in analyses:
        role_distribution[a["matched_role"]] = role_distribution.get(a["matched_role"], 0) + 1
        for skill in a["missing_skills"]:
            missing_skill_counts[skill] = missing_skill_counts.get(skill, 0) + 1

    top_missing = sorted(missing_skill_counts.items(), key=lambda x: -x[1])[:10]

    return jsonify({
        "total_students_analyzed": total,
        "average_readiness_score": avg_score,
        "role_distribution": role_distribution,
        "top_missing_skills": [{"skill": s, "count": c} for s, c in top_missing],
    })


# ---------------------------------------------------------------------------
# SME / INDUSTRY — post requirements & view talent pipeline
# ---------------------------------------------------------------------------
@app.route("/api/industry/job-postings", methods=["POST"])
def create_job_posting():
    db = load_db()
    payload = request.get_json(force=True)
    required = ["title", "organization", "required_skills"]
    for f in required:
        if not payload.get(f):
            return jsonify({"error": f"Missing field: {f}"}), 400

    posting = {
        "id": new_id(),
        "title": payload["title"],
        "organization": payload["organization"],
        "organization_type": payload.get("organization_type", "industry"),
        "required_skills": payload["required_skills"],
        "description": payload.get("description", ""),
        "location": payload.get("location", ""),
        "posted_at": now_iso(),
    }
    db["job_postings"].append(posting)
    save_db(db)
    return jsonify(posting), 201


@app.route("/api/industry/job-postings", methods=["GET"])
def list_job_postings():
    db = load_db()
    postings = sorted(db["job_postings"], key=lambda p: p["posted_at"], reverse=True)
    return jsonify({"job_postings": postings})


@app.route("/api/industry/matching-candidates/<posting_id>", methods=["GET"])
def matching_candidates(posting_id):
    """Finds analyzed students whose matched skills best overlap a job posting."""
    db = load_db()
    posting = next((p for p in db["job_postings"] if p["id"] == posting_id), None)
    if not posting:
        return jsonify({"error": "Job posting not found"}), 404

    required_skills = set(s.lower() for s in posting["required_skills"])
    candidates = []
    for a in db["analyses"]:
        found = set(a["skills_found"])
        overlap = found & required_skills
        if overlap:
            match_pct = round(len(overlap) / len(required_skills) * 100, 1)
            candidates.append({
                "analysis_id": a["id"],
                "candidate_name": a["candidate_name"],
                "matched_role": a["matched_role"],
                "readiness_score": a["readiness_score"],
                "matching_skills": sorted(overlap),
                "match_percentage": match_pct,
            })
    candidates.sort(key=lambda c: -c["match_percentage"])
    return jsonify({"posting": posting, "candidates": candidates})


# ---------------------------------------------------------------------------
# Static file serving for uploaded resumes metadata (not the files themselves)
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return jsonify({
        "message": "Smart Industry Readiness Platform API is running.",
        "sdg_alignment": "SDG 9 - Industry, Innovation and Infrastructure",
        "endpoints": [
            "/api/health",
            "/api/meta/roles",
            "/api/meta/skills",
            "/api/auth/register",
            "/api/auth/login",
            "/api/student/analyze-resume",
            "/api/student/analyze-text",
            "/api/student/history/<student_id>",
            "/api/college/dashboard",
            "/api/industry/job-postings",
            "/api/industry/matching-candidates/<posting_id>",
        ]
    })


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
