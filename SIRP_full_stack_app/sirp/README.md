# Smart Industry Readiness Platform (SIRP)

A working full-stack web app implementing the **AI Skill Gap Analyzer** for the
SDG 9 (Industry, Innovation & Infrastructure) project, connecting Students,
Colleges, SMEs, and Industries.

## What it does

- **Students** upload a resume (PDF/DOCX/TXT) or paste resume text.
- The backend extracts text, detects skills via a keyword/synonym matching
  engine against an Industry 4.0 skill taxonomy (AI, IoT, robotics, cloud,
  data science, automation, etc.), and compares them to six real industry
  role profiles (e.g. *Smart Manufacturing Engineer*, *Data & AI Analyst*,
  *IoT Engineer*...).
- Output: **missing skills (with priority)**, **recommended courses per gap**,
  and a weighted **Industry Readiness Score (0–100%)**.
- **Colleges** see an aggregate dashboard: average cohort readiness, role
  distribution, and the most common skill gaps across all analyzed students.
- **SMEs / Industries** post roles with required skills and get a ranked list
  of matching analyzed candidates (a basic talent pipeline).

## Stack

- **Backend:** Python + Flask (REST API), file parsing via `pypdf` /
  `python-docx`, JSON file storage (no external DB setup required to run).
- **Frontend:** Vanilla HTML/CSS/JS (no build step) — single-page app calling
  the Flask API via `fetch`.

## Folder structure

```
sirp/
  backend/
    app.py                # Flask app & all API routes
    skill_gap_engine.py    # AI matching + scoring logic
    knowledge_base.py       # Skill taxonomy + industry role profiles
    resume_parser.py        # PDF/DOCX/TXT text extraction
    requirements.txt
    data/db.json            # auto-created JSON datastore
    uploads/                 # temp resume storage (auto-cleaned per request)
  frontend/
    index.html
    app.js                  # all UI logic & views
    api.js                  # API client
    config.js               # API base URL
```

## How to run

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python3 app.py
```

Runs on **http://127.0.0.1:5000**. First run auto-creates `data/db.json`.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
python3 -m http.server 8080
```

Open **http://127.0.0.1:8080** in your browser.

> If you deploy the backend elsewhere, update `API_BASE` in
> `frontend/config.js` to point to it.

## Using it

1. Open the app → **Create account** → choose a role (Student / College /
   SME / Industry) → sign up with name + email (no password needed — this is
   a demo-grade auth layer, swap in real auth for production).
2. **As a Student:** go to *Skill Gap Analyzer*, upload or paste a resume,
   optionally pick a target role, click **Run readiness analysis**.
3. **As a College:** go to *Cohort Dashboard* to see aggregate stats once
   students have run analyses.
4. **As an SME/Industry:** go to *Job Postings*, publish a role with required
   skills (comma-separated), then check *Talent Pipeline* to see matched
   candidates ranked by skill overlap.

## Notes on the "AI" in the analyzer

The skill-matching engine uses a curated synonym/alias dictionary mapped to
an Industry 4.0 skill taxonomy and weighted role-requirement profiles
(`knowledge_base.py`), so it runs fully offline with no external API key.
To upgrade it to use a real LLM for resume parsing (handling unstructured
phrasing, inferred competencies, etc.), swap the `extract_skills_from_text`
function in `skill_gap_engine.py` for a call to an LLM API (e.g. Claude) with
a structured-output prompt — the rest of the scoring/course-recommendation
pipeline will work unchanged.

## SDG 9 alignment

This prototype operationalizes the "Smart Education–Industry Integration"
and "Policy & Capacity Building" pillars from the IEngage Track proposal:
it directly targets the skills gap between higher education output and
Industry 4.0 workforce requirements, helping build the skilled, innovation-
ready workforce SDG 9 calls for.
