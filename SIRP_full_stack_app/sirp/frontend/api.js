// api.js
const Api = {
  async _request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
      ...options,
    });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { error: "Invalid response from server" };
    }
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  },

  health() {
    return this._request("/health");
  },
  getRoles() {
    return this._request("/meta/roles");
  },
  register(payload) {
    return this._request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },
  login(email) {
    return this._request("/auth/login", { method: "POST", body: JSON.stringify({ email }) });
  },
  analyzeResumeFile(file, { targetRole, studentId, studentName }) {
    const form = new FormData();
    form.append("resume", file);
    if (targetRole) form.append("target_role", targetRole);
    if (studentId) form.append("student_id", studentId);
    if (studentName) form.append("student_name", studentName);
    return this._request("/student/analyze-resume", { method: "POST", body: form });
  },
  analyzeResumeText(text, { targetRole, studentId, studentName }) {
    return this._request("/student/analyze-text", {
      method: "POST",
      body: JSON.stringify({ text, target_role: targetRole, student_id: studentId, student_name: studentName }),
    });
  },
  studentHistory(studentId) {
    return this._request(`/student/history/${studentId}`);
  },
  collegeDashboard() {
    return this._request("/college/dashboard");
  },
  createJobPosting(payload) {
    return this._request("/industry/job-postings", { method: "POST", body: JSON.stringify(payload) });
  },
  listJobPostings() {
    return this._request("/industry/job-postings");
  },
  matchingCandidates(postingId) {
    return this._request(`/industry/matching-candidates/${postingId}`);
  },
};
