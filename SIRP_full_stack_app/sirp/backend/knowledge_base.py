# knowledge_base.py
# Industry 4.0 / SDG-9 aligned skill taxonomy and role requirement profiles.
# Used by the AI Skill Gap Analyzer engine.

# Canonical skill list with synonyms/aliases for fuzzy text matching from resumes.
SKILL_ALIASES = {
    "python": ["python", "py3", "python3"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "database querying"],
    "machine learning": ["machine learning", "ml", "scikit-learn", "sklearn"],
    "deep learning": ["deep learning", "neural network", "neural networks", "cnn", "rnn"],
    "data analysis": ["data analysis", "data analytics", "analytics"],
    "data visualization": ["data visualization", "tableau", "power bi", "powerbi"],
    "artificial intelligence": ["artificial intelligence", "ai"],
    "iot": ["iot", "internet of things", "embedded systems", "sensors"],
    "cloud computing": ["cloud computing", "aws", "azure", "gcp", "google cloud"],
    "big data": ["big data", "hadoop", "spark", "pyspark"],
    "cybersecurity": ["cybersecurity", "cyber security", "network security", "infosec"],
    "robotics": ["robotics", "ros", "automation engineering"],
    "plc programming": ["plc", "plc programming", "scada", "industrial automation"],
    "cad": ["cad", "autocad", "solidworks", "catia"],
    "lean manufacturing": ["lean manufacturing", "six sigma", "kaizen"],
    "project management": ["project management", "pmp", "agile", "scrum"],
    "communication": ["communication", "presentation skills", "public speaking"],
    "teamwork": ["teamwork", "collaboration", "team player"],
    "problem solving": ["problem solving", "critical thinking", "analytical skills"],
    "web development": ["web development", "html", "css", "javascript", "react", "node.js", "nodejs"],
    "version control": ["git", "github", "version control"],
    "docker": ["docker", "containerization", "kubernetes"],
    "statistics": ["statistics", "statistical analysis", "probability"],
    "excel": ["excel", "ms excel", "spreadsheet"],
    "erp systems": ["erp", "sap", "enterprise resource planning"],
    "digital twin": ["digital twin", "simulation modeling"],
    "renewable energy systems": ["renewable energy", "solar systems", "sustainability engineering"],
    "quality control": ["quality control", "quality assurance", "qa/qc"],
    "supply chain management": ["supply chain", "logistics", "scm"],
}

ALL_SKILLS = list(SKILL_ALIASES.keys())

# Industry 4.0 aligned role requirement profiles (SDG 9 — industrial innovation focus).
# weight indicates relative importance of each skill to readiness scoring.
INDUSTRY_ROLES = {
    "Industry 4.0 / Smart Manufacturing Engineer": {
        "required": {
            "iot": 9, "plc programming": 9, "robotics": 8, "cad": 7,
            "data analysis": 7, "cloud computing": 6, "digital twin": 7,
            "lean manufacturing": 6, "quality control": 5, "problem solving": 6,
        },
        "courses": {
            "iot": "Coursera – Introduction to IoT (University of California San Diego)",
            "plc programming": "Udemy – PLC & SCADA Industrial Automation Masterclass",
            "robotics": "edX – Robotics: Aerial Robotics / Industrial Robotics (Penn)",
            "cad": "LinkedIn Learning – SolidWorks / AutoCAD Essential Training",
            "digital twin": "Coursera – Digital Twins for Industry 4.0 (Siemens/ Skill-Up)",
            "cloud computing": "AWS Educate – Cloud Practitioner Essentials",
            "lean manufacturing": "Coursera – Lean Six Sigma Fundamentals (KU Leuven)",
        },
    },
    "Data & AI Analyst (Industry Applications)": {
        "required": {
            "python": 9, "machine learning": 9, "data analysis": 9, "statistics": 8,
            "sql": 8, "data visualization": 7, "deep learning": 6, "big data": 6,
            "cloud computing": 5, "communication": 5,
        },
        "courses": {
            "python": "Coursera – Python for Everybody (University of Michigan)",
            "machine learning": "Coursera – Machine Learning Specialization (Stanford / DeepLearning.AI)",
            "statistics": "Khan Academy – Statistics and Probability",
            "sql": "Mode Analytics – SQL Tutorial / Coursera SQL for Data Science",
            "data visualization": "Coursera – Data Visualization with Tableau",
            "big data": "edX – Big Data Analysis with Apache Spark (UC Berkeley)",
        },
    },
    "IoT & Embedded Systems Engineer": {
        "required": {
            "iot": 9, "c++": 7, "python": 6, "robotics": 6, "cloud computing": 6,
            "cybersecurity": 6, "problem solving": 6, "communication": 4,
        },
        "courses": {
            "iot": "Coursera – IoT Specialization (UC San Diego)",
            "c++": "Codecademy – Learn C++",
            "cybersecurity": "Coursera – IBM Cybersecurity Fundamentals",
            "cloud computing": "Microsoft Learn – Azure IoT Fundamentals",
        },
    },
    "Cloud & Cybersecurity Specialist": {
        "required": {
            "cloud computing": 9, "cybersecurity": 9, "sql": 6, "docker": 7,
            "python": 6, "problem solving": 6, "project management": 4,
        },
        "courses": {
            "cloud computing": "AWS / Azure Fundamentals Certification",
            "cybersecurity": "Coursera – Google Cybersecurity Professional Certificate",
            "docker": "Udemy – Docker & Kubernetes: The Complete Guide",
        },
    },
    "Sustainable Industrial Operations Manager": {
        "required": {
            "supply chain management": 8, "lean manufacturing": 7, "erp systems": 7,
            "renewable energy systems": 6, "project management": 7, "quality control": 6,
            "communication": 6, "data analysis": 5,
        },
        "courses": {
            "supply chain management": "Coursera – Supply Chain Management Specialization (Rutgers)",
            "erp systems": "openSAP – SAP ERP Fundamentals",
            "renewable energy systems": "edX – Sustainable Energy (MIT)",
            "project management": "Google Project Management Professional Certificate",
        },
    },
    "Software / Web Developer (Industry Digitalization)": {
        "required": {
            "web development": 9, "python": 6, "sql": 6, "version control": 7,
            "docker": 5, "problem solving": 6, "teamwork": 5,
        },
        "courses": {
            "web development": "freeCodeCamp – Full Stack Web Development",
            "version control": "GitHub Learning Lab – Introduction to Git & GitHub",
            "docker": "Udemy – Docker for Developers",
        },
    },
}

GENERIC_COURSE_FALLBACK = "Coursera / NPTEL / edX – Search for a foundational course in this skill"


def get_course_for_skill(role, skill):
    role_courses = INDUSTRY_ROLES.get(role, {}).get("courses", {})
    return role_courses.get(skill, GENERIC_COURSE_FALLBACK)
