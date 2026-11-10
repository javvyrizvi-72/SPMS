// PlaceMe Assistant
//  - Uses a real LLM when an API key is configured (ANTHROPIC_API_KEY, or LLM_API_KEY + LLM_BASE_URL + LLM_MODEL
//    for any OpenAI-compatible provider such as OpenAI, Groq, OpenRouter or Gemini's compatibility endpoint).
//  - Without a key (or if the LLM call fails) it falls back to a built-in, data-aware helper, so the chat always works.

const STOP = ['jobs', 'job', 'available', 'opening', 'openings', 'show', 'list', 'tell', 'about', 'what', 'which', 'there', 'have', 'give', 'need', 'want', 'please', 'vacancies', 'positions', 'position', 'companies', 'company', 'hiring', 'apply', 'for', 'the', 'are', 'any', 'all', 'me', 'my', 'can', 'you', 'kya', 'hai', 'hain', 'koi', 'batao', 'dikhao'];

const FEATURES = `PlaceMe is a campus placement web app with three portals.
STUDENT pages: Dashboard (stats + chart), My Profile (phone, college, degree, branch, CGPA, skills, resume upload as PDF up to 5 MB), Browse Jobs (search, filter by job type, Apply Now), My Applications (status: Applied, Shortlisted, Interview, Selected, Rejected).
COMPANY pages: Dashboard, Post Job (only after admin approval; title, description, location, salary, type, deadline, eligibility), Applicants (expand a job, change status, Schedule Interview with date/time, Online/Offline and link).
ADMIN pages: Dashboard (platform stats), Students and Companies (approve or delete), Reports.
Rules: a student can apply once per job; the only eligibility rule enforced automatically is the job's minimum CGPA (degree/branch are shown but not enforced). A student without a CGPA in the profile should update it first.
Not available yet: automatic e-mails, offer letter generation, password reset (ask the admin), chat between users.`;

const fmtJob = (j) =>
  `${j.title} - ${j.company}${j.location ? ` (${j.location})` : ''}${j.salary ? `, ${j.salary}` : ''}${j.minCGPA ? `, min CGPA ${j.minCGPA}` : ''}`;

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD');

function summarizeContext(ctx) {
  const lines = [];
  const u = ctx.user;
  lines.push(u ? `Logged-in user: ${u.name} (role: ${u.role}).` : 'The visitor is not logged in.');
  if (ctx.student) {
    const s = ctx.student;
    lines.push(`Student profile: CGPA ${s.cgpa ?? 'not set'}, branch ${s.branch || 'not set'}, skills ${s.skills?.length ? s.skills.join(', ') : 'not set'}, resume uploaded: ${s.hasResume ? 'yes' : 'no'}, approved by admin: ${s.isApproved ? 'yes' : 'no'}.`);
    lines.push(s.applications.length ? `Applications: ${s.applications.map((a) => `${a.title} at ${a.company} = ${a.status}`).join('; ')}.` : 'Applications: none yet.');
    if (s.interviews.length) lines.push(`Interviews: ${s.interviews.map((i) => `${i.title} on ${fmtDate(i.scheduledAt)} (${i.mode})`).join('; ')}.`);
  }
  if (ctx.company) {
    const c = ctx.company;
    lines.push(`Company: ${c.name}, approved by admin: ${c.isApproved ? 'yes' : 'no'}. Jobs posted: ${c.jobs.length}. Total applicants: ${c.totalApplicants}. By status: ${Object.entries(c.byStatus).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}.`);
  }
  if (ctx.admin) {
    const a = ctx.admin;
    lines.push(`Platform stats: ${a.totalStudents} students, ${a.totalCompanies} companies, ${a.totalJobs} active jobs, ${a.totalApplications} applications, ${a.placed} placed; pending approvals: ${a.pendingStudents} students, ${a.pendingCompanies} companies.`);
  }
  lines.push(ctx.jobs.length ? `Active jobs (${ctx.jobs.length}): ${ctx.jobs.map((j, i) => `${i + 1}. ${fmtJob(j)} [${j.type}]`).join(' | ')}` : 'There are no active jobs right now.');
  return lines.join('\n');
}

const buildSystemPrompt = (ctx) => `You are PlaceMe Assistant, the in-app helper of the Smart Placement Management System used by a college placement cell.
Be friendly and concise (under 120 words unless the user asks for detail). Reply in the same language style as the user (English, Hindi or Hinglish).
Use ONLY the platform facts and live data below. Never invent jobs, numbers, links or features. If something is not in the data, say you do not know and point to the right page.
You cannot perform actions (apply, approve, schedule); explain which page and button to use. Never reveal other people's personal data.

${FEATURES}

LIVE DATA
${summarizeContext(ctx)}`;

// ---------- built-in (rule based, data aware) helper ----------
function ruleBasedReply(message, ctx) {
  const raw = String(message || '');
  const t = ` ${raw.toLowerCase().replace(/[^\p{L}\p{N}\s.]/gu, ' ').replace(/\s+/g, ' ').trim()} `;
  const has = (...w) => w.some((x) => t.includes(x));
  const role = ctx.user?.role || 'guest';
  const name = ctx.user?.name?.split(' ')[0];
  const s = ctx.student;
  const jobs = ctx.jobs || [];

  if (has(' thank', ' thanks', 'shukriya', 'dhanyavad')) return "You're welcome! Ask me anything else about jobs, applications or the platform.";
  if (/^\s*(hi+|hello|hey|hii+|namaste|hola|good (morning|afternoon|evening))\b/.test(t.trim()) && t.trim().split(' ').length <= 4) {
    return `Hi${name ? ` ${name}` : ''}! I'm the PlaceMe Assistant. ${role === 'student' ? 'I can show jobs you are eligible for, your application status and interviews.' : role === 'company' ? 'I can help with posting jobs, applicants and interviews.' : role === 'admin' ? 'I can show platform statistics and explain approvals.' : 'I can explain how to register and show the available jobs.'} What would you like to know?`;
  }
  if (has(' help ', 'what can you do', 'kya kar sakte', 'options')) {
    return 'I can help with: available jobs, jobs you are eligible for, how to apply, your application status, interviews, resume upload, posting jobs (companies), approvals and statistics (admin), and login/registration.';
  }
  if (has('what is placeme', 'about this', 'tech stack', 'technology', 'built with', 'who made', 'who created', 'mern', 'about placeme')) {
    return 'PlaceMe (Smart Placement Management System) is a MERN-stack web app: React + Tailwind frontend, Node/Express API, MongoDB Atlas database, JWT authentication and role-based access for Students, Companies and Admin.';
  }
  if (has('forgot', 'reset password', 'change password')) {
    return 'Password reset is not available yet. Please contact the placement admin, who can help you with your account.';
  }
  if (has('register', 'sign up', 'signup', 'create account', 'new account', 'login', 'log in', 'sign in', 'cannot login', "can't login")) {
    return role === 'guest'
      ? 'To register: open the Register page, enter your name, email and a password (min 6 characters), choose Student or Company and submit. To log in, use the same email and password on the Login page.'
      : `You are already logged in as ${ctx.user.name} (${role}). Use Logout in the top bar to switch accounts.`;
  }
  if (has('interview')) {
    if (role === 'student') {
      return s?.interviews?.length
        ? `Your interviews:\n${s.interviews.map((i) => `• ${i.title} - ${fmtDate(i.scheduledAt)} (${i.mode})${i.link ? ` - ${i.link}` : ''}`).join('\n')}`
        : 'You have no interviews scheduled yet. A company schedules one after shortlisting you; you will also see the status change in My Applications.';
    }
    if (role === 'company') return 'To schedule an interview: open Applicants, expand a job, click "Schedule Interview" next to the candidate, pick date & time, mode (Online/Offline), add the meeting link and confirm.';
    return 'Interviews are scheduled by companies from the Applicants page after they shortlist a student.';
  }
  if ((has('how') || has('kaise') || has('process') || has('steps')) && has('apply')) {
    return 'To apply: log in as a student, complete My Profile (add your CGPA), open Browse Jobs, pick a job and click "Apply Now". You can apply once per job and your CGPA must meet the job\'s minimum. Track it under My Applications.';
  }
  if (has('eligible', 'eligibility', 'can i apply', 'suitable', 'recommend', 'which job', 'best job', 'mere liye', 'kaun si job', 'kaunsi job')) {
    if (role !== 'student') return 'Eligibility is checked when a student applies: the student\'s CGPA must be at least the job\'s minimum CGPA. Log in as a student and I can list the jobs that match your profile.';
    if (s.cgpa == null) return 'Your CGPA is not saved yet. Please open My Profile, add your CGPA and save, then ask me again to see the jobs you are eligible for.';
    const ok = jobs.filter((j) => j.minCGPA <= s.cgpa && !s.appliedJobIds.includes(j.id));
    return ok.length
      ? `With CGPA ${s.cgpa}, you can apply to ${ok.length} job(s) you haven't applied to yet:\n${ok.slice(0, 6).map((j) => `• ${fmtJob(j)}`).join('\n')}${ok.length > 6 ? '\n...and more in Browse Jobs.' : ''}`
      : `I couldn't find a new job that matches CGPA ${s.cgpa} right now. Check Browse Jobs again later.`;
  }
  if (has('status', 'my application', 'applications', 'applied', 'shortlist', 'selected', 'rejected', 'result', 'track')) {
    if (role === 'student') {
      return s.applications.length
        ? `Your applications:\n${s.applications.map((a) => `• ${a.title} - ${a.company}: ${a.status}`).join('\n')}`
        : "You haven't applied to any job yet. Open Browse Jobs and click Apply Now on a job you like.";
    }
    if (role === 'company') return `You have ${ctx.company?.totalApplicants ?? 0} applicant(s) across ${ctx.company?.jobs.length ?? 0} job(s). Open Applicants to review them and change their status.`;
    return 'Students can track their applications under "My Applications" after logging in.';
  }
  if (has('resume', ' cv ')) {
    return role === 'student'
      ? `Open My Profile → Resume section and upload a PDF (max 5 MB). ${s?.hasResume ? 'You already have a resume uploaded; uploading again replaces it.' : 'You have not uploaded a resume yet.'}`
      : 'Students upload their resume (PDF, max 5 MB) from My Profile. Companies can open it from the Applicants page.';
  }
  if (has('profile', 'cgpa', 'skills')) {
    return role === 'student'
      ? `Open My Profile to update phone, college, degree, branch, CGPA and skills. Currently: CGPA ${s.cgpa ?? 'not set'}, skills ${s.skills?.length ? s.skills.join(', ') : 'not set'}.`
      : 'Students maintain their profile (phone, college, degree, branch, CGPA, skills) from My Profile.';
  }
  if ((has('post') && has('job')) || has('create job', 'add job', 'new job')) {
    return role === 'company'
      ? `Open "Post a Job", fill title, description, location, salary, type, deadline and eligibility (minimum CGPA), then submit. ${ctx.company && !ctx.company.isApproved ? 'Note: your company is not approved by the admin yet, so posting is blocked until approval.' : ''}`.trim()
      : 'Only approved company accounts can post jobs, from the "Post a Job" page.';
  }
  if (has('approve', 'approval', 'verified', 'verification', 'pending')) {
    if (role === 'admin') return `Pending approvals: ${ctx.admin?.pendingStudents ?? 0} student(s), ${ctx.admin?.pendingCompanies ?? 0} company(ies). Open Students or Companies and click the approve button.`;
    if (role === 'company') return ctx.company?.isApproved ? 'Your company is approved. You can post jobs.' : 'Your company is waiting for admin approval. You can post jobs after it is approved.';
    return 'New companies are approved by the admin before they can post jobs.';
  }
  if (has('applicant', 'candidate')) {
    return role === 'company'
      ? `You have ${ctx.company?.totalApplicants ?? 0} applicant(s). ${Object.keys(ctx.company?.byStatus || {}).length ? `By status: ${Object.entries(ctx.company.byStatus).map(([k, v]) => `${k} ${v}`).join(', ')}. ` : ''}Open Applicants, expand a job to see CGPA, branch and resume, and change status from the drop-down.`
      : 'Companies review applicants from the Applicants page.';
  }
  if (role === 'admin' && has('stat', 'report', 'analytic', 'placement rate', 'how many', 'total', 'dashboard')) {
    const a = ctx.admin;
    return a ? `Platform now: ${a.totalStudents} students, ${a.totalCompanies} companies, ${a.totalJobs} active jobs, ${a.totalApplications} applications, ${a.placed} placed. See Dashboard and Reports for charts.` : 'Open Dashboard and Reports for platform statistics.';
  }
  if (has('job', 'opening', 'vacanc', 'naukri', 'position', 'internship', 'hiring', 'compan', 'react', 'python', 'data', 'java', 'node', 'design', 'intern')) {
    const kw = t.trim().split(' ').filter((w) => w.length >= 4 && !STOP.includes(w));
    const matched = kw.length ? jobs.filter((j) => kw.some((w) => j.search.includes(w))) : [];
    const list = matched.length ? matched : jobs;
    if (!jobs.length) return 'There are no active jobs right now. Companies will post new openings soon.';
    return `${matched.length ? `Jobs matching your search (${matched.length}):` : `There are ${jobs.length} active job(s). Latest:`}\n${list.slice(0, 6).map((j) => `• ${fmtJob(j)}`).join('\n')}${list.length > 6 ? '\n...open Browse Jobs for the full list.' : ''}`;
  }
  if (has('apply')) return 'To apply: log in as a student, complete your profile, open Browse Jobs and click "Apply Now" on a job.';
  return 'I can help with jobs, eligibility, applications, interviews, resume upload, posting jobs (companies), approvals and statistics (admin). Try one of the suggestions below or rephrase your question.';
}

const suggestionsFor = (role) => ({
  guest: ['How do I register?', 'Show available jobs', 'What is PlaceMe?'],
  student: ['Which jobs am I eligible for?', 'Show my applications', 'Do I have any interviews?', 'How do I upload my resume?'],
  company: ['How many applicants do I have?', 'How do I post a job?', 'How do I schedule an interview?'],
  admin: ['Show platform statistics', 'Any pending approvals?', 'How do I approve a company?'],
}[role] || []);

// ---------- LLM providers ----------
const getMode = () => {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL) return 'openai';
  return 'basic';
};

const fetchWithTimeout = async (url, opts, ms = 20000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); } finally { clearTimeout(id); }
};

// keep the last turns, start with a user turn and alternate roles (required by the Messages API)
const normalizeHistory = (history, message) => {
  const turns = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  turns.push({ role: 'user', content: message });
  const out = [];
  for (const m of turns) {
    if (!out.length && m.role !== 'user') continue;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += `\n${m.content}`;
    else out.push({ ...m });
  }
  return out;
};

async function askAnthropic(system, messages) {
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5', max_tokens: 500, system, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

async function askOpenAICompatible(system, messages) {
  const base = process.env.LLM_BASE_URL.replace(/\/+$/, '');
  const res = await fetchWithTimeout(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({ model: process.env.LLM_MODEL, max_tokens: 500, messages: [{ role: 'system', content: system }, ...messages] }),
  });
  if (!res.ok) throw new Error(`LLM API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function generateReply({ message, history, ctx }) {
  const mode = getMode();
  if (mode !== 'basic') {
    try {
      const system = buildSystemPrompt(ctx);
      const messages = normalizeHistory(history, message);
      const reply = mode === 'anthropic' ? await askAnthropic(system, messages) : await askOpenAICompatible(system, messages);
      if (reply) return { reply, mode: 'ai' };
    } catch (err) {
      console.error('Chat LLM error (using built-in helper):', err.message);
    }
  }
  return { reply: ruleBasedReply(message, ctx), mode: 'basic' };
}

module.exports = { generateReply, ruleBasedReply, buildSystemPrompt, normalizeHistory, suggestionsFor, getMode };
