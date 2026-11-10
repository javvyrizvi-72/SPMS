// Demo data for PlaceMe. Safe to run many times: existing records are never duplicated or overwritten.
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');

const ADMIN = { name: 'Placement Admin', email: 'admin@placeme.demo', password: 'Admin@123' };
const COMPANY_PASSWORD = 'Company@123';

const COMPANIES = [
  { key: 'technova', name: 'TechNova Solutions', email: 'hr@technova.demo', industry: 'IT Services', location: 'Bengaluru', website: 'https://technova.example.com', description: 'Mid-size IT services company building web and cloud products for global clients.' },
  { key: 'codecraft', name: 'CodeCraft Labs', email: 'hr@codecraft.demo', industry: 'Software Product', location: 'Hyderabad', website: 'https://codecraft.example.com', description: 'Product start-up building developer tools and SaaS platforms.' },
  { key: 'databridge', name: 'DataBridge Analytics', email: 'hr@databridge.demo', industry: 'Data and AI', location: 'Pune', website: 'https://databridge.example.com', description: 'Analytics firm helping retail and finance clients make data-driven decisions.' },
];

const ELIG = { degree: 'BCA / B.Sc / B.Tech', branch: ['Computer Applications', 'Computer Science', 'Information Technology'] };
const JOBS = [
  { company: 'technova', title: 'Frontend Developer (React)', jobType: 'Full-Time', location: 'Bengaluru', salary: '6 LPA', minCGPA: 7, description: 'Build responsive user interfaces for client dashboards using React and Tailwind CSS.\nResponsibilities: convert designs into reusable components, integrate REST APIs, write clean and tested code.\nRequirements: good knowledge of JavaScript, React basics, Git. Knowledge of Tailwind CSS is a plus.' },
  { company: 'technova', title: 'Software Engineer Intern', jobType: 'Internship', location: 'Bengaluru (Hybrid)', salary: '20,000 / month', minCGPA: 6.5, description: 'Six-month internship working with a senior engineer on live projects.\nResponsibilities: fix bugs, write small features, learn code review and deployment practices.\nRequirements: any programming language, willingness to learn, good communication.' },
  { company: 'technova', title: 'QA Engineer', jobType: 'Full-Time', location: 'Bengaluru', salary: '4.5 LPA', minCGPA: 6, description: 'Test web applications manually and with simple automation.\nResponsibilities: prepare test cases, report defects, verify fixes and regressions.\nRequirements: attention to detail, basics of SDLC and testing, familiarity with Postman is a plus.' },
  { company: 'codecraft', title: 'Full Stack Developer (MERN)', jobType: 'Full-Time', location: 'Hyderabad / Remote', salary: '7 LPA', minCGPA: 7.5, description: 'Own features end to end on our SaaS product using MongoDB, Express, React and Node.js.\nResponsibilities: design APIs, build UI, write database queries, deploy to cloud.\nRequirements: a MERN project on GitHub, understanding of REST and JWT authentication.' },
  { company: 'codecraft', title: 'Backend Developer (Node.js)', jobType: 'Full-Time', location: 'Hyderabad', salary: '6.5 LPA', minCGPA: 7, description: 'Develop and maintain secure REST APIs and background jobs.\nResponsibilities: model data in MongoDB, write middleware, handle authentication and logging.\nRequirements: Node.js, Express, MongoDB, basic knowledge of Docker is a plus.' },
  { company: 'codecraft', title: 'UI/UX Design Intern', jobType: 'Internship', location: 'Remote', salary: '15,000 / month', minCGPA: 6, description: 'Work with the product team to design clean, accessible interfaces.\nResponsibilities: create wireframes and prototypes in Figma, collect feedback, support developers.\nRequirements: portfolio or sample designs, knowledge of Figma and basic design principles.' },
  { company: 'codecraft', title: 'Part-Time Technical Content Writer', jobType: 'Part-Time', location: 'Remote', salary: '12,000 / month', minCGPA: 0, description: 'Write blogs and documentation about web development topics.\nResponsibilities: research topics, write clear tutorials, review pull requests for docs.\nRequirements: good written English and interest in programming.' },
  { company: 'databridge', title: 'Data Analyst', jobType: 'Full-Time', location: 'Pune', salary: '5.5 LPA', minCGPA: 7, description: 'Turn raw business data into insights for retail clients.\nResponsibilities: clean data, build dashboards, present findings to stakeholders.\nRequirements: SQL, Excel, any BI tool (Power BI / Tableau), basic Python is a plus.' },
  { company: 'databridge', title: 'Machine Learning Intern (Python)', jobType: 'Internship', location: 'Pune (Hybrid)', salary: '25,000 / month', minCGPA: 7.5, description: 'Support the data science team in building and evaluating models.\nResponsibilities: prepare datasets, train baseline models, document experiments.\nRequirements: Python, pandas, basic statistics and machine learning concepts.' },
  { company: 'databridge', title: 'Business Intelligence Developer', jobType: 'Full-Time', location: 'Pune', salary: '6 LPA', minCGPA: 7.2, description: 'Design reports and data models for finance clients.\nResponsibilities: write SQL queries, create dashboards, automate monthly reporting.\nRequirements: strong SQL, data modelling basics, experience with Power BI is a plus.' },
];

const daysFromNow = (d, hour = 11) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(hour, 0, 0, 0); return x; };

async function upsertUser({ name, email, password, role }) {
  let user = await User.findOne({ email });
  if (user) return { user, created: false };
  user = await User.create({ name, email, password, role });
  return { user, created: true };
}

async function removeDemoStudents(log = () => {}) {
  const users = await User.find({ email: /@student\.demo$/i }).select('_id');
  if (!users.length) return 0;
  const userIds = users.map((u) => u._id);
  const studentIds = (await Student.find({ user: { $in: userIds } }).select('_id')).map((x) => x._id);
  await Interview.deleteMany({ student: { $in: studentIds } });
  await Application.deleteMany({ student: { $in: studentIds } });
  await Notification.deleteMany({ recipient: { $in: userIds } });
  await Student.deleteMany({ _id: { $in: studentIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  log(`removed ${users.length} demo student account(s)`);
  return users.length;
}

async function seedSampleData(log = () => {}) {
  const out = { users: 0, jobs: 0, applications: 0, removedStudents: await removeDemoStudents(log) };

  if (!(await User.exists({ role: 'admin' }))) {
    await User.create({ ...ADMIN, role: 'admin' });
    out.users++; log(`admin created: ${ADMIN.email}`);
  }

  const companies = {};
  for (const c of COMPANIES) {
    const { user, created } = await upsertUser({ name: c.name, email: c.email, password: COMPANY_PASSWORD, role: 'company' });
    if (created) out.users++;
    let doc = await Company.findOne({ user: user._id });
    if (!doc) doc = await Company.create({ user: user._id, companyName: c.name, industry: c.industry, location: c.location, website: c.website, description: c.description, isApproved: true });
    companies[c.key] = doc;
  }

  const jobs = {};
  for (const [i, j] of JOBS.entries()) {
    const company = companies[j.company];
    let doc = await Job.findOne({ company: company._id, title: j.title });
    if (!doc) {
      doc = await Job.create({
        company: company._id,
        title: j.title,
        description: j.description,
        location: j.location,
        salary: j.salary,
        jobType: j.jobType,
        eligibility: { minCGPA: j.minCGPA, ...ELIG },
        deadline: daysFromNow(25 + i * 3, 18),
        isActive: true
      });
      out.jobs++;
    } else {
      // Sync clean salary without dollar to existing DB records
      if (doc.salary !== j.salary) {
        doc.salary = j.salary;
        await doc.save();
      }
    }
    jobs[j.title] = doc;
  }

  return out;
}

module.exports = { seedSampleData, removeDemoStudents, ADMIN, COMPANY_PASSWORD, COMPANIES };