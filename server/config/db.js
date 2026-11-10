const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job'); // Tumhara Job model

// 1. Permanent Users List
const PERMANENT_USERS = [
  {
    name: 'Super Admin',
    email: 'admin@placeme.demo',
    password: 'Admin@123Password',
    role: 'admin',
    isApproved: true,
  },
  {
    name: 'Demo Student',
    email: 'student@placeme.demo',
    password: 'password123',
    role: 'student',
    isApproved: true,
  },
  {
    name: 'TechCorp Recruiter',
    email: 'hr@techcorp.demo',
    password: 'password123',
    role: 'company',
    companyName: 'TechCorp Solutions',
    website: 'https://techcorp.demo',
    isApproved: true,
  },
  {
    name: 'CodeCraft Recruiter',
    email: 'hr@codecraft.demo',
    password: 'password123',
    role: 'company',
    companyName: 'CodeCraft Solutions',
    website: 'https://codecraft.demo',
    isApproved: true,
  },
  {
    name: 'InnovateLabs Recruiter',
    email: 'hr@innovatelabs.demo',
    password: 'password123',
    role: 'company',
    companyName: 'InnovateLabs',
    website: 'https://innovatelabs.demo',
    isApproved: true,
  },
  {
    name: 'CyberShield Recruiter',
    email: 'hr@cybershield.demo',
    password: 'password123',
    role: 'company',
    companyName: 'CyberShield Security',
    website: 'https://cybershield.demo',
    isApproved: true,
  },
  {
    name: 'DataPulse Recruiter',
    email: 'hr@datapulse.demo',
    password: 'password123',
    role: 'company',
    companyName: 'DataPulse Analytics',
    website: 'https://datapulse.demo',
    isApproved: true,
  },
];

// 2. Demo Jobs Mapping for Each Company
const COMPANY_JOBS = {
  'TechCorp Solutions': [
    {
      title: 'Full Stack Software Engineer',
      description: 'Looking for a skilled MERN stack developer to build scalable cloud-native web applications.',
      location: 'Bengaluru, India (Hybrid)',
      salary: '8 - 12 LPA',
      jobType: 'Full-time',
      experience: '0 - 2 Years',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TailwindCSS'],
      openings: 5,
    },
    {
      title: 'Cloud DevOps Associate',
      description: 'Design CI/CD automation pipelines, manage AWS/Docker environments, and maintain zero downtime deployment.',
      location: 'Bengaluru, India',
      salary: '7 - 10 LPA',
      jobType: 'Full-time',
      experience: 'Fresher / 0 - 1 Year',
      skills: ['Docker', 'AWS', 'Linux', 'GitHub Actions', 'Node.js'],
      openings: 3,
    },
  ],
  'CodeCraft Solutions': [
    {
      title: 'Frontend React Developer',
      description: 'Develop high-performance interactive SPAs and component libraries using React and Tailwind.',
      location: 'Bengaluru, India',
      salary: '6.5 - 9.5 LPA',
      jobType: 'Full-time',
      experience: '0 - 2 Years',
      skills: ['React.js', 'JavaScript', 'HTML5', 'CSS3', 'REST API'],
      openings: 4,
    },
    {
      title: 'Backend API Engineer',
      description: 'Build secure authentication, role-based controls, and microservices architecture.',
      location: 'Remote',
      salary: '8 - 11 LPA',
      jobType: 'Full-time',
      experience: '1 - 3 Years',
      skills: ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'System Design'],
      openings: 2,
    },
  ],
  'InnovateLabs': [
    {
      title: 'AI / Machine Learning Engineer',
      description: 'Build predictive AI models, integrate LLM agents, and deploy model inference endpoints.',
      location: 'Bengaluru, India',
      salary: '10 - 15 LPA',
      jobType: 'Full-time',
      experience: '0 - 2 Years',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'FastAPI'],
      openings: 3,
    },
    {
      title: 'Junior AI Research Intern',
      description: 'Assist the research team in dataset curation, hyperparameter tuning, and model evaluation benchmarks.',
      location: 'Bengaluru, India (On-site)',
      salary: '25,000 / month Stipend',
      jobType: 'Internship',
      experience: 'Fresher',
      skills: ['Python', 'Pandas', 'NumPy', 'Data Analysis'],
      openings: 4,
    },
  ],
  'CyberShield Security': [
    {
      title: 'Cybersecurity Analyst (SOC L1)',
      description: 'Monitor security threats, conduct vulnerability scans, and implement endpoint security hardening.',
      location: 'Bengaluru, India (Hybrid)',
      salary: '7 - 11 LPA',
      jobType: 'Full-time',
      experience: '0 - 2 Years',
      skills: ['Network Security', 'SIEM', 'Wireshark', 'OWASP Top 10', 'Linux'],
      openings: 3,
    },
    {
      title: 'Application Security Engineer',
      description: 'Perform source code auditing, security assessments, penetration testing on web apps and APIs.',
      location: 'Remote',
      salary: '9 - 14 LPA',
      jobType: 'Full-time',
      experience: '1 - 3 Years',
      skills: ['Penetration Testing', 'API Security', 'Burp Suite', 'Cryptography'],
      openings: 2,
    },
  ],
  'DataPulse Analytics': [
    {
      title: 'Business Data Analyst',
      description: 'Transform complex business datasets into insightful BI dashboards and predictive reports.',
      location: 'Bengaluru, India',
      salary: '7 - 10 LPA',
      jobType: 'Full-time',
      experience: '0 - 2 Years',
      skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Data Visualization'],
      openings: 4,
    },
    {
      title: 'Data Engineering Associate',
      description: 'Design ETL pipelines, data warehouse tables, and automated data ingestion workflows.',
      location: 'Bengaluru, India (Hybrid)',
      salary: '8 - 12 LPA',
      jobType: 'Full-time',
      experience: '0 - 2 Years',
      skills: ['SQL', 'Python', 'MongoDB', 'ETL Pipelines', 'Airflow'],
      openings: 2,
    },
  ],
};

const syncAllPermanentAccountsAndJobs = async () => {
  try {
    const companyUserMap = {};

    // 1. Ensure all users exist, have matching passwords, and are APPROVED
    for (const acc of PERMANENT_USERS) {
      let user = await User.findOne({ email: acc.email });
      if (!user) {
        user = new User(acc);
        await user.save();
        console.log(`✅ Created ${acc.role.toUpperCase()}: ${acc.email}`);
      } else {
        user.password = acc.password;
        user.role = acc.role;
        user.isApproved = true; // FORCE APPROVAL
        if (acc.companyName) user.companyName = acc.companyName;
        if (acc.website) user.website = acc.website;
        await user.save();
      }

      if (acc.role === 'company') {
        companyUserMap[acc.companyName] = user;
      }
    }

    // 2. Ensure every company has active jobs
    for (const [companyName, jobsList] of Object.entries(COMPANY_JOBS)) {
      const companyUser = companyUserMap[companyName];
      if (!companyUser) continue;

      for (const jobData of jobsList) {
        const existingJob = await Job.findOne({
          title: jobData.title,
          company: companyUser._id,
        });

        if (!existingJob) {
          await Job.create({
            ...jobData,
            company: companyUser._id,
            companyName: companyName,
            status: 'Active',
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days validity
          });
          console.log(`💼 Seeded Job: "${jobData.title}" for ${companyName}`);
        }
      }
    }

    console.log('✅ All companies approved and demo jobs populated.');
  } catch (err) {
    console.error(`❌ Sync error: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await syncAllPermanentAccountsAndJobs();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;