# resume_parser.py
import os
import re
from pypdf import PdfReader
import docx


def extract_text_from_pdf(filepath):
    text = []
    reader = PdfReader(filepath)
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text.append(page_text)
    return "\n".join(text)


def extract_text_from_docx(filepath):
    document = docx.Document(filepath)
    return "\n".join(p.text for p in document.paragraphs)


def extract_text_from_txt(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_resume_text(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(filepath)
    elif ext == ".docx":
        return extract_text_from_docx(filepath)
    elif ext in (".txt", ".md"):
        return extract_text_from_txt(filepath)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def extract_candidate_name(text):
    """Best-effort: first non-empty line that looks like a name."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for line in lines[:5]:
        if len(line.split()) <= 4 and not re.search(r"[@\d]", line):
            return line
    return "Candidate"


def extract_email(text):
    match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    return match.group(0) if match else None
