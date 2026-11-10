const mongoose = require("mongoose");
const User = require("../models/User");
const Job = require("../models/Job");

const ADMIN_EMAIL = "admin@placeme.demo";
const ADMIN_PASSWORD = "Admin@123Password";

const COMPANIES_DATA = [
  {
    name: "Google Recruiter",
    email: "recruiter@google.demo",
    password: "password123",
    role: "company",
    companyName: "Google",
    website: "https://careers.google.com",
    isApproved: true,
    status: "approved",
  },
  {
    name: "Microsoft Recruiter",
    email: "recruiter@microsoft.demo",
    password: "password123",
    role: "company",
    companyName: "Microsoft",
    website: "https://careers.microsoft.com",
    isApproved: true,
    status: "approved",
  },
  {
    name: "Amazon Recruiter",
    email: "recruiter@amazon.demo",
    password: "password123",
    role: "company",
    companyName: "Amazon",
    website: "https://amazon.jobs",
    isApproved: true,
    status: "approved",
  },
  {
    name: "Infosys Recruiter",
    email: "recruiter@infosys.demo",
    password: "password123",
    role: "company",
    companyName: "Infosys",
    website: "https://infosys.com/careers",
    isApproved: true,
    status: "approved",
  },
  {
    name: "TCS Recruiter",
    email: "recruiter@tcs.demo",
    password: "password123",
    role: "company",
    companyName: "TCS",
    website: "https://tcs.com/careers",
    isApproved: true,
    status: "approved",
  },
];

const TEN_JOBS = {
  Google: [
    {
      title: "Associate Cloud Engineer",
      description:
        "Manage GCP infrastructure, monitor microservices, and deploy high-availability services.",
      location: "Bengaluru, India",
      salary: "14 - 18 LPA",
      jobType: "Full-Time",
      minCgpa: 7.5,
      requiredDegree: "BCA / B.Tech / MCA",
      branches: ["Computer Science", "AI & ML", "Information Science"],
    },
    {
      title: "Frontend Software Engineer",
      description:
        "Build performant, accessible, and responsive user interfaces using React and modern JavaScript.",
      location: "Bengaluru, India (Hybrid)",
      salary: "12 - 16 LPA",
      jobType: "Full-Time",
      minCgpa: 7.0,
      requiredDegree: "BCA / B.Tech",
      branches: ["Computer Science", "Information Science"],
    },
  ],
  Microsoft: [
    {
      title: "Full Stack Web Developer",
      description:
        "Design RESTful microservices and scalable web applications using React, Node.js, and Azure.",
      location: "Bengaluru, India",
      salary: "13 - 17 LPA",
      jobType: "Full-Time",
      minCgpa: 7.0,
      requiredDegree: "BCA / B.Tech / MCA",
      branches: ["Computer Science", "AI & ML"],
    },
    {
      title: "DevOps & Reliability Engineer",
      description:
        "Implement automated CI/CD pipelines, Docker containers, and infrastructure monitoring.",
      location: "Hyderabad / Remote",
      salary: "11 - 15 LPA",
      jobType: "Full-Time",
      minCgpa: 6.8,
      requiredDegree: "BCA / B.Tech",
      branches: ["Computer Science", "Information Technology"],
    },
  ],
  Amazon: [
    {
      title: "Software Development Engineer - I",
      description:
        "Solve complex algorithmic problems, optimize high-traffic database operations, and build core backend APIs.",
      location: "Bengaluru, India",
      salary: "15 - 20 LPA",
      jobType: "Full-Time",
      minCgpa: 7.5,
      requiredDegree: "BCA / B.Tech / MCA",
      branches: ["Computer Science", "AI & ML", "Data Science"],
    },
    {
      title: "Data Analyst Associate",
      description:
        "Analyze user behavior data, build automated business dashboards using SQL and Python.",
      location: "Bengaluru, India",
      salary: "9 - 13 LPA",
      jobType: "Full-Time",
      minCgpa: 6.5,
      requiredDegree: "BCA / B.Sc / B.Tech",
      branches: ["Computer Science", "AI & ML", "Statistics"],
    },
  ],
  Infosys: [
    {
      title: "Systems Engineer",
      description:
        "Develop enterprise software solutions, write clean unit tests, and integrate database components.",
      location: "Bengaluru / Mysuru",
      salary: "6.5 - 9 LPA",
      jobType: "Full-Time",
      minCgpa: 6.0,
      requiredDegree: "BCA / B.Tech / B.Sc",
      branches: ["Computer Science", "Information Science", "All Branches"],
    },
    {
      title: "AI & Data Science Intern",
      description:
        "Work on predictive machine learning models, data preprocessing, and automated reporting scripts.",
      location: "Bengaluru, India",
      salary: "30,000 / month Stipend",
      jobType: "Internship",
      minCgpa: 6.5,
      requiredDegree: "BCA / B.Tech",
      branches: ["AI & ML", "Data Science", "Computer Science"],
    },
  ],
  TCS: [
    {
      title: "Cybersecurity Associate",
      description:
        "Conduct vulnerability scans, inspect network traffic logs, and enforce endpoint compliance.",
      location: "Bengaluru, India",
      salary: "7 - 10 LPA",
      jobType: "Full-Time",
      minCgpa: 6.5,
      requiredDegree: "BCA / B.Tech / MCA",
      branches: ["Computer Science", "Information Security"],
    },
    {
      title: "Database Administrator Associate",
      description:
        "Maintain SQL/NoSQL databases, perform indexing optimization, and manage data backups.",
      location: "Bengaluru, India (Hybrid)",
      salary: "6.5 - 9.5 LPA",
      jobType: "Full-Time",
      minCgpa: 6.0,
      requiredDegree: "BCA / B.Tech",
      branches: ["Computer Science", "Information Technology"],
    },
  ],
};

const setupClean5Companies10Jobs = async () => {
  try {
    // 1. Purani saari jobs aur non-admin users clean karo taaki count mismatch na ho
    await User.deleteMany({ role: { $ne: "admin" } });
    if (mongoose.connection.collections["jobs"]) {
      await mongoose.connection.collections["jobs"].deleteMany({});
    }

    // 2. Admin ensure
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      admin = new User({
        name: "Super Admin",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "admin",
        isApproved: true,
      });
      await admin.save();
    }

    // 3. Exactly 5 Approved Companies Create Karo
    const companyMap = {};
    for (const cData of COMPANIES_DATA) {
      const company = new User(cData);
      await company.save();
      companyMap[cData.companyName] = company;
    }

    // 4. Exactly 10 Jobs Create Karo (Har company ki 2)
    for (const [cName, jobs] of Object.entries(TEN_JOBS)) {
      const cUser = companyMap[cName];
      for (const j of jobs) {
        await Job.create({
          title: j.title,
          description: j.description,
          location: j.location,
          salary: j.salary,
          jobType: j.jobType,
          eligibility: {
            minCgpa: j.minCgpa,
            requiredDegree: j.requiredDegree,
            branches: j.branches,
          },
          minCgpa: j.minCgpa,
          requiredDegree: j.requiredDegree,
          branch: j.branches.join(", "),
          company: cUser._id,
          companyName: cName,
          status: "Active",
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        });
      }
    }

    console.log("🎯 EXACT MATCH DONE: 5 Companies, 10 Jobs.");
  } catch (err) {
    console.error("❌ Sync error:", err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await setupClean5Companies10Jobs();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
