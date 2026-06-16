# skill_gap_engine.py
import re
from knowledge_base import SKILL_ALIASES, INDUSTRY_ROLES, get_course_for_skill


def normalize(text):
    return re.sub(r"\s+", " ", text.lower())


def extract_skills_from_text(text):
    """
    Scans resume text for known skill aliases (whole-word / phrase matches)
    and returns the set of canonical skills detected.
    This is the 'AI' matching layer of the analyzer: a curated NLP keyword
    + synonym model mapped against the Industry 4.0 skill taxonomy.
    """
    norm_text = normalize(text)
    found = set()
    for canonical_skill, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
            if re.search(pattern, norm_text):
                found.add(canonical_skill)
                break
    return found


def best_matching_role(found_skills):
    """Pick the industry role with the highest overlap score against found skills."""
    best_role = None
    best_score = -1
    for role, profile in INDUSTRY_ROLES.items():
        required = profile["required"]
        overlap = sum(weight for skill, weight in required.items() if skill in found_skills)
        total = sum(required.values())
        score = overlap / total if total else 0
        if score > best_score:
            best_score = score
            best_role = role
    return best_role


def analyze_resume(text, target_role=None):
    found_skills = extract_skills_from_text(text)

    if target_role and target_role in INDUSTRY_ROLES:
        role = target_role
    else:
        role = best_matching_role(found_skills)

    profile = INDUSTRY_ROLES[role]
    required_skills = profile["required"]

    matched = {s: w for s, w in required_skills.items() if s in found_skills}
    missing = {s: w for s, w in required_skills.items() if s not in found_skills}

    total_weight = sum(required_skills.values())
    matched_weight = sum(matched.values())
    readiness_score = round((matched_weight / total_weight) * 100, 1) if total_weight else 0.0

    # Sort missing skills by importance (highest weight first = highest priority gap)
    missing_sorted = sorted(missing.items(), key=lambda x: -x[1])
    recommended_courses = [
        {
            "skill": skill,
            "priority": "High" if weight >= 8 else ("Medium" if weight >= 6 else "Low"),
            "course": get_course_for_skill(role, skill),
        }
        for skill, weight in missing_sorted
    ]

    extra_skills = sorted(found_skills - set(required_skills.keys()))

    if readiness_score >= 80:
        readiness_level = "Industry Ready"
    elif readiness_score >= 60:
        readiness_level = "Near Ready"
    elif readiness_score >= 40:
        readiness_level = "Developing"
    else:
        readiness_level = "Needs Significant Upskilling"

    return {
        "matched_role": role,
        "readiness_score": readiness_score,
        "readiness_level": readiness_level,
        "skills_found": sorted(found_skills),
        "matched_skills": sorted(matched.keys()),
        "missing_skills": [s for s, _ in missing_sorted],
        "recommended_courses": recommended_courses,
        "extra_skills": extra_skills,
        "all_roles_considered": list(INDUSTRY_ROLES.keys()),
    }
