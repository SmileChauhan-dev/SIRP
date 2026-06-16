// app.js
const State = {
  user: JSON.parse(localStorage.getItem("sirp_user") || "null"),
  view: "auth",
  roles: [],
  lastAnalysis: null,
  history: [],
  dashboard: null,
  postings: [],
  selectedPosting: null,
  candidates: null,
};

function setUser(user) {
  State.user = user;
  localStorage.setItem("sirp_user", JSON.stringify(user));
}
function logout() {
  State.user = null;
  localStorage.removeItem("sirp_user");
  State.view = "auth";
  render();
}
function toast(message, isError = false) {
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// -----------------------------------------------------------------------
// NAV
// -----------------------------------------------------------------------
function tabsForRole(role) {
  if (role === "student") return [["analyze", "Skill Gap Analyzer"], ["history", "My History"]];
  if (role === "college") return [["dashboard", "Cohort Dashboard"]];
  if (role === "sme" || role === "industry") return [["postings", "Job Postings"], ["talent", "Talent Pipeline"]];
  return [];
}

function renderNav() {
  const navTabs = document.getElementById("navTabs");
  const sessionPill = document.getElementById("sessionPill");
  if (!State.user) {
    navTabs.innerHTML = "";
    sessionPill.innerHTML = "";
    return;
  }
  const tabs = tabsForRole(State.user.role);
  navTabs.innerHTML = tabs
    .map(([key, label]) => `<button data-tab="${key}" class="${State.view === key ? "active" : ""}">${label}</button>`)
    .join("");
  navTabs.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      State.view = btn.dataset.tab;
      render();
    };
  });
  sessionPill.innerHTML = `
    <span class="dot"></span>
    <span>${escapeHtml(State.user.name)} · ${escapeHtml(roleLabel(State.user.role))}</span>
    <button id="logoutBtn">Sign out</button>
  `;
  document.getElementById("logoutBtn").onclick = logout;
}

function roleLabel(role) {
  return { student: "Student", college: "College", sme: "SME", industry: "Industry" }[role] || role;
}

// -----------------------------------------------------------------------
// ROOT RENDER
// -----------------------------------------------------------------------
function render() {
  renderNav();
  const app = document.getElementById("app");
  if (!State.user) {
    app.innerHTML = renderAuth();
    bindAuthEvents();
    return;
  }
  if (State.view === "analyze" || (State.user.role === "student" && !State.view)) {
    State.view = State.view === "history" ? "history" : "analyze";
  }
  switch (true) {
    case State.user.role === "student" && State.view === "analyze":
      app.innerHTML = renderAnalyzer();
      bindAnalyzerEvents();
      break;
    case State.user.role === "student" && State.view === "history":
      app.innerHTML = renderHistoryShell();
      loadHistory();
      break;
    case State.user.role === "college":
      app.innerHTML = renderDashboardShell();
      loadDashboard();
      break;
    case (State.user.role === "sme" || State.user.role === "industry") && State.view === "postings":
      app.innerHTML = renderPostingsShell();
      bindPostingsEvents();
      loadPostings();
      break;
    case (State.user.role === "sme" || State.user.role === "industry") && State.view === "talent":
      app.innerHTML = renderTalentShell();
      loadPostingsForTalent();
      break;
    default:
      State.view = tabsForRole(State.user.role)[0][0];
      render();
  }
}

// -----------------------------------------------------------------------
// AUTH VIEW
// -----------------------------------------------------------------------
let authMode = "register";
let selectedRole = "student";

function renderAuth() {
  return `
  <div class="wrap">
    <div class="auth-shell">
      <div class="eyebrow"><span class="line"></span>SDG 9 · INDUSTRY 4.0</div>
      <h1 class="hero-title" style="font-size:30px; margin-bottom:8px;">Sign in to <em>SIRP</em></h1>
      <p class="hero-desc" style="margin-bottom:28px;">Connecting students, colleges, SMEs and industries to close the Industry 4.0 skills gap.</p>

      <div class="panel">
        <div class="mini-toggle" id="authModeToggle">
          <button data-mode="register" class="${authMode === "register" ? "active" : ""}">Create account</button>
          <button data-mode="login" class="${authMode === "login" ? "active" : ""}">Sign in</button>
        </div>

        <form id="authForm">
          ${authMode === "register" ? `
            <label class="field-label">I am a...</label>
            <div class="role-grid" id="roleGrid">
              ${renderRoleCard("student", "Student", "Upload resume, get analyzed")}
              ${renderRoleCard("college", "College", "Track cohort readiness")}
              ${renderRoleCard("sme", "SME", "Post roles, find talent")}
              ${renderRoleCard("industry", "Industry", "Post roles, find talent")}
            </div>
            <label class="field-label">Full name</label>
            <input type="text" id="authName" placeholder="e.g. Smile Chauhan" required>
            <label class="field-label">Organization <span style="color:var(--steel)">(optional)</span></label>
            <input type="text" id="authOrg" placeholder="e.g. ABC Institute of Technology">
          ` : ``}
          <label class="field-label">Email</label>
          <input type="email" id="authEmail" placeholder="you@example.com" required>
          <div id="authError" class="form-error hidden"></div>
          <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;" id="authSubmitBtn">
            ${authMode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
        <div class="form-note">
          ${authMode === "register"
            ? `Already registered? <button id="switchToLogin">Sign in</button>`
            : `New here? <button id="switchToRegister">Create an account</button>`}
        </div>
      </div>
    </div>
  </div>
  `;
}

function renderRoleCard(value, title, desc) {
  return `
    <div class="role-card ${selectedRole === value ? "selected" : ""}" data-role="${value}">
      <div class="rc-title">${title}</div>
      <div class="rc-desc">${desc}</div>
    </div>
  `;
}

function bindAuthEvents() {
  document.querySelectorAll("#authModeToggle button").forEach((btn) => {
    btn.onclick = () => { authMode = btn.dataset.mode; render(); };
  });
  document.querySelectorAll(".role-card").forEach((card) => {
    card.onclick = () => { selectedRole = card.dataset.role; render(); };
  });
  const switchLogin = document.getElementById("switchToLogin");
  if (switchLogin) switchLogin.onclick = () => { authMode = "login"; render(); };
  const switchRegister = document.getElementById("switchToRegister");
  if (switchRegister) switchRegister.onclick = () => { authMode = "register"; render(); };

  document.getElementById("authForm").onsubmit = async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("authError");
    errorEl.classList.add("hidden");
    const submitBtn = document.getElementById("authSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span>`;
    try {
      const email = document.getElementById("authEmail").value.trim();
      if (authMode === "register") {
        const name = document.getElementById("authName").value.trim();
        const organization = document.getElementById("authOrg").value.trim();
        const result = await Api.register({ name, email, role: selectedRole, organization });
        setUser(result.user);
        toast(`Welcome, ${result.user.name}.`);
      } else {
        const result = await Api.login(email);
        setUser(result.user);
        toast(`Welcome back, ${result.user.name}.`);
      }
      State.view = null;
      render();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = authMode === "register" ? "Create account" : "Sign in";
    }
  };
}

// -----------------------------------------------------------------------
// STUDENT — ANALYZER
// -----------------------------------------------------------------------
let uploadMode = "file";
let selectedFile = null;

function renderAnalyzer() {
  return `
  <div class="wrap">
    <section style="padding-top:40px;">
      <div class="eyebrow"><span class="line"></span>AI SKILL GAP ANALYZER</div>
      <h1 class="hero-title" style="font-size:34px;">Find your <em>Industry Readiness Score</em></h1>
      <p class="hero-desc">Upload a resume or paste its text. The engine matches your skills against six Industry 4.0 role profiles, scores your readiness, and recommends courses for every gap.</p>

      <div class="results-grid" style="margin-top:32px;">
        <div></div>
        <div></div>
      </div>

      <div class="panel" style="max-width:720px;">
        <div class="mini-toggle" id="uploadModeToggle">
          <button data-mode="file" class="${uploadMode === "file" ? "active" : ""}">Upload file</button>
          <button data-mode="text" class="${uploadMode === "text" ? "active" : ""}">Paste text</button>
        </div>

        <div id="uploadFileSection" class="${uploadMode === "file" ? "" : "hidden"}">
          <div class="dropzone" id="dropzone">
            <div class="dz-icon">⇪</div>
            <div class="dz-title">Drop your resume here, or click to browse</div>
            <div class="dz-sub">PDF, DOCX, or TXT — max 10MB</div>
          </div>
          <input type="file" id="fileInput" accept=".pdf,.docx,.txt,.md" class="hidden">
          <div id="fileChipHost"></div>
        </div>

        <div id="uploadTextSection" class="${uploadMode === "text" ? "" : "hidden"}">
          <label class="field-label">Paste resume text</label>
          <textarea id="resumeTextArea" rows="8" placeholder="Paste resume content here (skills, experience, education)..."></textarea>
        </div>

        <label class="field-label">Target role <span style="color:var(--steel)">(optional — auto-detected if left blank)</span></label>
        <select id="targetRoleSelect">
          <option value="">Auto-detect best matching role</option>
          ${State.roles.map((r) => `<option value="${escapeHtml(r.role)}">${escapeHtml(r.role)}</option>`).join("")}
        </select>

        <div id="analyzeError" class="form-error hidden"></div>
        <button class="btn btn-primary" id="analyzeBtn" style="width:100%; justify-content:center;">Run readiness analysis</button>
      </div>

      <div id="resultsHost" style="margin-top:36px;"></div>
    </section>
  </div>
  `;
}

function bindAnalyzerEvents() {
  if (!State.roles.length) {
    Api.getRoles().then((res) => { State.roles = res.roles; render(); }).catch(() => {});
  }

  document.querySelectorAll("#uploadModeToggle button").forEach((btn) => {
    btn.onclick = () => { uploadMode = btn.dataset.mode; render(); bindAnalyzerEvents(); };
  });

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  if (dropzone) {
    dropzone.onclick = () => fileInput.click();
    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add("drag"); };
    dropzone.ondragleave = () => dropzone.classList.remove("drag");
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag");
      if (e.dataTransfer.files.length) {
        selectedFile = e.dataTransfer.files[0];
        renderFileChip();
      }
    };
    fileInput.onchange = () => {
      if (fileInput.files.length) {
        selectedFile = fileInput.files[0];
        renderFileChip();
      }
    };
  }
  renderFileChip();

  document.getElementById("analyzeBtn").onclick = async () => {
    const errorEl = document.getElementById("analyzeError");
    errorEl.classList.add("hidden");
    const targetRole = document.getElementById("targetRoleSelect").value || null;
    const btn = document.getElementById("analyzeBtn");
    const originalLabel = btn.textContent;

    try {
      let result;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Analyzing...`;

      if (uploadMode === "file") {
        if (!selectedFile) throw new Error("Please choose a resume file first.");
        result = await Api.analyzeResumeFile(selectedFile, {
          targetRole, studentId: State.user.id, studentName: State.user.name,
        });
      } else {
        const text = document.getElementById("resumeTextArea").value.trim();
        if (!text) throw new Error("Please paste some resume text first.");
        result = await Api.analyzeResumeText(text, {
          targetRole, studentId: State.user.id, studentName: State.user.name,
        });
      }
      State.lastAnalysis = result;
      document.getElementById("resultsHost").innerHTML = renderResults(result);
      document.getElementById("resultsHost").scrollIntoView({ behavior: "smooth", block: "start" });
      toast("Analysis complete.");
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  };
}

function renderFileChip() {
  const host = document.getElementById("fileChipHost");
  if (!host) return;
  if (!selectedFile) { host.innerHTML = ""; return; }
  host.innerHTML = `
    <div class="file-chip">
      <span>📄 ${escapeHtml(selectedFile.name)}</span>
      <button id="clearFileBtn">✕</button>
    </div>
  `;
  document.getElementById("clearFileBtn").onclick = (e) => {
    e.stopPropagation();
    selectedFile = null;
    document.getElementById("fileInput").value = "";
    renderFileChip();
  };
}

function priorityPillClass(priority) {
  if (priority === "High") return "pill-missing-high";
  if (priority === "Medium") return "pill-missing-med";
  return "pill-missing-low";
}

function levelColor(level) {
  if (level === "Industry Ready") return { bg: "rgba(61,220,151,0.12)", color: "var(--signal-green)" };
  if (level === "Near Ready") return { bg: "rgba(255,159,28,0.12)", color: "var(--amber)" };
  if (level === "Developing") return { bg: "rgba(255,159,28,0.12)", color: "var(--amber)" };
  return { bg: "rgba(255,93,93,0.12)", color: "var(--signal-red)" };
}

function renderResults(result) {
  const lc = levelColor(result.readiness_level);
  return `
    <div class="section-head">
      <div class="section-title">Readiness Report</div>
      <div class="section-tag">CANDIDATE: ${escapeHtml(result.candidate_name || "Candidate")}${result.candidate_email ? " · " + escapeHtml(result.candidate_email) : ""}</div>
    </div>
    <div class="results-grid">
      <div class="panel">
        <div class="score-ring-wrap">
          ${gaugeSvg(result.readiness_score)}
          <div class="score-number">${result.readiness_score}%</div>
          <div class="level-badge" style="background:${lc.bg}; color:${lc.color};">${escapeHtml(result.readiness_level)}</div>
          <div class="score-role">Best-fit role:<br><strong style="color:var(--paper)">${escapeHtml(result.matched_role)}</strong></div>
        </div>
      </div>

      <div class="panel">
        <div class="section-tag" style="margin-bottom:14px;">SKILLS DETECTED VS REQUIRED</div>
        ${result.matched_skills.map((s) => `
          <div class="skill-row">
            <span class="skill-name">${escapeHtml(s)}</span>
            <span class="pill pill-have">✓ Have</span>
          </div>
        `).join("")}
        ${result.missing_skills.map((s) => {
          const courseInfo = result.recommended_courses.find((c) => c.skill === s);
          const p = courseInfo ? courseInfo.priority : "Low";
          return `
          <div class="skill-row">
            <span class="skill-name">${escapeHtml(s)}</span>
            <span class="pill ${priorityPillClass(p)}">Missing · ${p}</span>
          </div>`;
        }).join("")}
        ${(!result.matched_skills.length && !result.missing_skills.length) ? `<div class="empty-state"><div class="es-sub">No skill data found for this role.</div></div>` : ""}
      </div>
    </div>

    <div class="panel" style="margin-top:20px;">
      <div class="section-tag" style="margin-bottom:6px;">RECOMMENDED COURSES — CLOSE THE GAP</div>
      <div class="priority-legend">
        <span><span class="dot" style="background:var(--signal-red);"></span>High priority</span>
        <span><span class="dot" style="background:var(--amber);"></span>Medium priority</span>
        <span><span class="dot" style="background:var(--steel);"></span>Low priority</span>
      </div>
      ${result.recommended_courses.length ? result.recommended_courses.map((c) => `
        <div class="course-card">
          <div>
            <div class="course-skill">${escapeHtml(c.skill)}</div>
            <div class="course-name">${escapeHtml(c.course)}</div>
          </div>
          <span class="pill ${priorityPillClass(c.priority)}">${c.priority}</span>
        </div>
      `).join("") : `<div class="empty-state"><div class="es-title">No gaps detected 🎉</div><div class="es-sub">You match all required skills for this role.</div></div>`}
    </div>

    ${result.extra_skills.length ? `
    <div class="panel" style="margin-top:20px;">
      <div class="section-tag" style="margin-bottom:14px;">ADDITIONAL SKILLS DETECTED (BEYOND THIS ROLE)</div>
      <div class="job-skills">
        ${result.extra_skills.map((s) => `<span class="job-skill-chip">${escapeHtml(s)}</span>`).join("")}
      </div>
    </div>` : ""}
  `;
}

function gaugeSvg(score) {
  const pct = Math.max(0, Math.min(100, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? "var(--signal-green)" : pct >= 60 ? "var(--amber)" : pct >= 40 ? "#ffb444" : "var(--signal-red)";
  return `
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--line)" stroke-width="10"/>
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="${color}" stroke-width="10"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 70 70)"
        style="transition: stroke-dashoffset 0.8s ease;"/>
    </svg>
  `;
}

// -----------------------------------------------------------------------
// STUDENT — HISTORY
// -----------------------------------------------------------------------
function renderHistoryShell() {
  return `
    <div class="wrap">
      <section style="padding-top:40px;">
        <div class="section-head">
          <div class="section-title">My Analysis History</div>
          <div class="section-tag">PAST RUNS OF THE SKILL GAP ANALYZER</div>
        </div>
        <div id="historyHost"><div class="empty-state"><span class="spinner" style="border-top-color:var(--amber);"></span></div></div>
      </section>
    </div>
  `;
}

async function loadHistory() {
  try {
    const res = await Api.studentHistory(State.user.id);
    State.history = res.analyses;
    const host = document.getElementById("historyHost");
    if (!host) return;
    if (!res.analyses.length) {
      host.innerHTML = `<div class="panel empty-state"><div class="es-title">No analyses yet</div><div class="es-sub">Run the Skill Gap Analyzer to see your history here.</div></div>`;
      return;
    }
    host.innerHTML = `
      <div class="panel">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Matched role</th><th>Readiness</th><th>Level</th><th>Top gap</th></tr></thead>
          <tbody>
            ${res.analyses.map((a) => `
              <tr>
                <td>${new Date(a.analyzed_at).toLocaleString()}</td>
                <td>${escapeHtml(a.matched_role)}</td>
                <td>${a.readiness_score}%</td>
                <td>${escapeHtml(a.readiness_level)}</td>
                <td>${a.missing_skills[0] ? escapeHtml(a.missing_skills[0]) : "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    toast(err.message, true);
  }
}

// -----------------------------------------------------------------------
// COLLEGE — DASHBOARD
// -----------------------------------------------------------------------
function renderDashboardShell() {
  return `
    <div class="wrap">
      <section style="padding-top:40px;">
        <div class="section-head">
          <div class="section-title">Cohort Readiness Dashboard</div>
          <div class="section-tag">AGGREGATE — ALL STUDENT ANALYSES ON THE PLATFORM</div>
        </div>
        <div id="dashboardHost"><div class="empty-state"><span class="spinner" style="border-top-color:var(--amber);"></span></div></div>
      </section>
    </div>
  `;
}

async function loadDashboard() {
  try {
    const data = await Api.collegeDashboard();
    State.dashboard = data;
    const host = document.getElementById("dashboardHost");
    if (!host) return;
    if (!data.total_students_analyzed) {
      host.innerHTML = `<div class="panel empty-state"><div class="es-title">No data yet</div><div class="es-sub">Once students run the Skill Gap Analyzer, cohort insights appear here.</div></div>`;
      return;
    }
    const maxCount = Math.max(...data.top_missing_skills.map((s) => s.count), 1);
    host.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Students analyzed</div><div class="stat-value">${data.total_students_analyzed}</div></div>
        <div class="stat-card"><div class="stat-label">Avg. readiness score</div><div class="stat-value">${data.average_readiness_score}%</div></div>
        <div class="stat-card"><div class="stat-label">Roles represented</div><div class="stat-value">${Object.keys(data.role_distribution).length}</div></div>
        <div class="stat-card"><div class="stat-label">Top skill gap</div><div class="stat-value" style="font-size:16px;">${data.top_missing_skills[0] ? escapeHtml(data.top_missing_skills[0].skill) : "—"}</div></div>
      </div>

      <div class="panel" style="margin-bottom:20px;">
        <div class="section-tag" style="margin-bottom:16px;">ROLE DISTRIBUTION</div>
        ${Object.entries(data.role_distribution).map(([role, count]) => {
          const max = Math.max(...Object.values(data.role_distribution));
          return `
          <div class="bar-row">
            <div class="bar-label">${escapeHtml(role)}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%;"></div></div>
            <div class="bar-count">${count}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="panel">
        <div class="section-tag" style="margin-bottom:16px;">TOP MISSING SKILLS ACROSS COHORT</div>
        ${data.top_missing_skills.map((s) => `
          <div class="bar-row">
            <div class="bar-label">${escapeHtml(s.skill)}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${(s.count / maxCount) * 100}%;"></div></div>
            <div class="bar-count">${s.count}</div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    toast(err.message, true);
  }
}

// -----------------------------------------------------------------------
// SME / INDUSTRY — JOB POSTINGS
// -----------------------------------------------------------------------
function renderPostingsShell() {
  return `
    <div class="wrap">
      <section style="padding-top:40px;">
        <div class="section-head">
          <div class="section-title">Job &amp; Internship Postings</div>
          <div class="section-tag">DEFINE THE SKILLS YOU NEED — MATCHED AGAINST ANALYZED STUDENTS</div>
        </div>

        <div class="panel" style="max-width:720px; margin-bottom:32px;">
          <label class="field-label">Role title</label>
          <input type="text" id="jobTitle" placeholder="e.g. Junior IoT Engineer">
          <label class="field-label">Required skills (comma-separated)</label>
          <input type="text" id="jobSkills" placeholder="e.g. iot, python, cloud computing">
          <label class="field-label">Location</label>
          <input type="text" id="jobLocation" placeholder="e.g. Shimla, HP">
          <label class="field-label">Description</label>
          <textarea id="jobDesc" rows="3" placeholder="Brief role description..."></textarea>
          <div id="jobError" class="form-error hidden"></div>
          <button class="btn btn-primary" id="postJobBtn">Publish posting</button>
        </div>

        <div id="postingsHost"><div class="empty-state"><span class="spinner" style="border-top-color:var(--amber);"></span></div></div>
      </section>
    </div>
  `;
}

function bindPostingsEvents() {
  document.getElementById("postJobBtn").onclick = async () => {
    const errorEl = document.getElementById("jobError");
    errorEl.classList.add("hidden");
    const title = document.getElementById("jobTitle").value.trim();
    const skillsRaw = document.getElementById("jobSkills").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const description = document.getElementById("jobDesc").value.trim();
    try {
      if (!title || !skillsRaw) throw new Error("Role title and required skills are needed.");
      const required_skills = skillsRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      await Api.createJobPosting({
        title, organization: State.user.organization || State.user.name,
        organization_type: State.user.role, required_skills, location, description,
      });
      document.getElementById("jobTitle").value = "";
      document.getElementById("jobSkills").value = "";
      document.getElementById("jobLocation").value = "";
      document.getElementById("jobDesc").value = "";
      toast("Posting published.");
      loadPostings();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  };
}

async function loadPostings() {
  try {
    const res = await Api.listJobPostings();
    State.postings = res.job_postings;
    const host = document.getElementById("postingsHost");
    if (!host) return;
    if (!res.job_postings.length) {
      host.innerHTML = `<div class="panel empty-state"><div class="es-title">No postings yet</div><div class="es-sub">Publish your first role above to start matching candidates.</div></div>`;
      return;
    }
    host.innerHTML = res.job_postings.map((p) => `
      <div class="job-card">
        <div class="job-top">
          <div>
            <div class="job-title">${escapeHtml(p.title)}</div>
            <div class="job-org">${escapeHtml(p.organization)} ${p.location ? "· " + escapeHtml(p.location) : ""}</div>
          </div>
          <div class="section-tag">${new Date(p.posted_at).toLocaleDateString()}</div>
        </div>
        ${p.description ? `<p style="color:var(--steel); font-size:13px; margin-top:10px;">${escapeHtml(p.description)}</p>` : ""}
        <div class="job-skills">${p.required_skills.map((s) => `<span class="job-skill-chip">${escapeHtml(s)}</span>`).join("")}</div>
        <div class="job-actions">
          <button class="link-btn" data-posting-id="${p.id}">View matching candidates →</button>
        </div>
      </div>
    `).join("");
    host.querySelectorAll("[data-posting-id]").forEach((btn) => {
      btn.onclick = () => {
        State.selectedPosting = btn.dataset.postingId;
        State.view = "talent";
        render();
      };
    });
  } catch (err) {
    toast(err.message, true);
  }
}

// -----------------------------------------------------------------------
// SME / INDUSTRY — TALENT PIPELINE
// -----------------------------------------------------------------------
function renderTalentShell() {
  return `
    <div class="wrap">
      <section style="padding-top:40px;">
        <div class="section-head">
          <div class="section-title">Talent Pipeline</div>
          <div class="section-tag">CANDIDATES MATCHED TO YOUR POSTED ROLES</div>
        </div>
        <div id="talentHost"><div class="empty-state"><span class="spinner" style="border-top-color:var(--amber);"></span></div></div>
      </section>
    </div>
  `;
}

async function loadPostingsForTalent() {
  try {
    if (!State.postings.length) {
      const res = await Api.listJobPostings();
      State.postings = res.job_postings;
    }
    const host = document.getElementById("talentHost");
    if (!host) return;
    if (!State.postings.length) {
      host.innerHTML = `<div class="panel empty-state"><div class="es-title">No postings yet</div><div class="es-sub">Publish a job posting first, then matched candidates will appear here.</div></div>`;
      return;
    }
    const selectedId = State.selectedPosting || State.postings[0].id;
    host.innerHTML = `
      <div class="panel" style="margin-bottom:24px;">
        <label class="field-label">Select a posting</label>
        <select id="postingSelect">
          ${State.postings.map((p) => `<option value="${p.id}" ${p.id === selectedId ? "selected" : ""}>${escapeHtml(p.title)} — ${escapeHtml(p.organization)}</option>`).join("")}
        </select>
      </div>
      <div id="candidatesHost"><div class="empty-state"><span class="spinner" style="border-top-color:var(--amber);"></span></div></div>
    `;
    document.getElementById("postingSelect").onchange = (e) => {
      State.selectedPosting = e.target.value;
      loadCandidates(e.target.value);
    };
    loadCandidates(selectedId);
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadCandidates(postingId) {
  try {
    const res = await Api.matchingCandidates(postingId);
    const host = document.getElementById("candidatesHost");
    if (!host) return;
    if (!res.candidates.length) {
      host.innerHTML = `<div class="panel empty-state"><div class="es-title">No matches yet</div><div class="es-sub">No analyzed students currently overlap with this posting's required skills.</div></div>`;
      return;
    }
    host.innerHTML = `
      <div class="panel">
        <table class="data-table">
          <thead><tr><th>Candidate</th><th>Matched role</th><th>Match %</th><th>Readiness</th><th>Matching skills</th></tr></thead>
          <tbody>
            ${res.candidates.map((c) => `
              <tr>
                <td>${escapeHtml(c.candidate_name)}</td>
                <td>${escapeHtml(c.matched_role)}</td>
                <td><strong style="color:var(--amber)">${c.match_percentage}%</strong></td>
                <td>${c.readiness_score}%</td>
                <td>${c.matching_skills.map((s) => `<span class="job-skill-chip" style="margin:2px;">${escapeHtml(s)}</span>`).join("")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    toast(err.message, true);
  }
}

// -----------------------------------------------------------------------
// BOOT
// -----------------------------------------------------------------------
(async function boot() {
  try {
    await Api.health();
  } catch (e) {
    toast("Cannot reach backend API at " + API_BASE + ". Make sure the Flask server is running.", true);
  }
  render();
})();
