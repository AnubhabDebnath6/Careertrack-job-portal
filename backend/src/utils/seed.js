require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Job = require('../models/Job');

const inDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const jobs = [
  {
    title: 'Frontend Developer',
    company: 'Nimbus Labs',
    location: 'Bhubaneswar',
    employmentType: 'Full-time',
    experienceLevel: 'Junior',
    salaryMin: 400000,
    salaryMax: 700000,
    description: 'Build responsive user interfaces for our analytics products using React and modern CSS.',
    responsibilities: ['Develop reusable React components', 'Work with designers to ship pixel-accurate screens', 'Write clean and testable code'],
    qualifications: ['B.Tech or equivalent in a technical field', '1 to 2 years of experience with React', 'Good understanding of HTML, CSS and JavaScript'],
    skills: ['React', 'JavaScript', 'CSS', 'Git'],
    benefits: ['Health insurance', 'Flexible working hours', 'Learning budget'],
    applicationInstructions: 'Attach your latest resume and include links to any projects you have built.',
    deadline: inDays(45),
    status: 'published'
  },
  {
    title: 'Backend Developer (Node.js)',
    company: 'Orbit Systems',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    experienceLevel: 'Mid-level',
    salaryMin: 900000,
    salaryMax: 1500000,
    description: 'Design and maintain REST APIs and data pipelines that power our logistics platform.',
    responsibilities: ['Design scalable REST APIs', 'Optimise MongoDB queries and indexes', 'Review code and mentor junior developers'],
    qualifications: ['3+ years of backend experience', 'Strong knowledge of Node.js and Express', 'Experience with MongoDB'],
    skills: ['Node.js', 'Express', 'MongoDB', 'REST'],
    benefits: ['Performance bonus', 'Remote-friendly', 'Health insurance'],
    applicationInstructions: 'Mention your notice period in the cover letter.',
    deadline: inDays(30),
    status: 'published'
  },
  {
    title: 'Full Stack Intern',
    company: 'Brightpath Technologies',
    location: 'Remote',
    employmentType: 'Internship',
    experienceLevel: 'Fresher',
    salaryMin: 120000,
    salaryMax: 180000,
    description: 'Six-month internship working across the MERN stack on real customer features.',
    responsibilities: ['Fix bugs and build small features', 'Write API tests', 'Document your work'],
    qualifications: ['Pursuing or recently completed a computer science degree', 'Basic knowledge of JavaScript'],
    skills: ['JavaScript', 'React', 'Node.js'],
    benefits: ['Certificate', 'Mentorship', 'Pre-placement offer opportunity'],
    applicationInstructions: 'Share your GitHub profile in the cover letter.',
    deadline: inDays(20),
    status: 'published'
  },
  {
    title: 'UI/UX Designer',
    company: 'Pixelcraft Studio',
    location: 'Bengaluru',
    employmentType: 'Contract',
    experienceLevel: 'Mid-level',
    salaryMin: 600000,
    salaryMax: 1000000,
    description: 'Design intuitive web and mobile experiences for startup clients on a nine-month contract.',
    responsibilities: ['Create wireframes and prototypes', 'Run usability sessions', 'Maintain the design system'],
    qualifications: ['Portfolio with shipped products', '3 years of product design experience'],
    skills: ['Figma', 'Prototyping', 'User research'],
    benefits: ['Contract extension possible', 'Flexible hours'],
    applicationInstructions: 'Include a portfolio link in your cover letter.',
    deadline: inDays(25),
    status: 'published'
  },
  {
    title: 'Data Analyst',
    company: 'Quantix Analytics',
    location: 'Pune',
    employmentType: 'Full-time',
    experienceLevel: 'Junior',
    salaryMin: 450000,
    salaryMax: 800000,
    description: 'Turn raw business data into dashboards and insights for our retail clients.',
    responsibilities: ['Clean and analyse datasets', 'Build weekly dashboards', 'Present findings to stakeholders'],
    qualifications: ['Degree in statistics, mathematics or computer science', 'Good SQL skills'],
    skills: ['SQL', 'Excel', 'Python', 'Power BI'],
    benefits: ['Health insurance', 'Hybrid work', 'Annual bonus'],
    applicationInstructions: 'Applications without a resume will not be considered.',
    deadline: inDays(35),
    status: 'published'
  },
  {
    title: 'DevOps Engineer',
    company: 'Orbit Systems',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    experienceLevel: 'Senior',
    salaryMin: 1600000,
    salaryMax: 2400000,
    description: 'Own our CI/CD pipelines and cloud infrastructure.',
    responsibilities: ['Maintain CI/CD pipelines', 'Monitor production systems', 'Improve reliability and cost'],
    qualifications: ['5+ years in DevOps or SRE roles', 'Hands-on experience with Docker and cloud platforms'],
    skills: ['Docker', 'CI/CD', 'AWS', 'Linux'],
    benefits: ['Stock options', 'Remote-friendly'],
    applicationInstructions: 'Describe one production incident you resolved.',
    deadline: inDays(50),
    status: 'draft'
  }
];

const run = async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');

  let admin = await Admin.findOne({ email });
  if (admin) {
    admin.password = password;
    admin.name = process.env.ADMIN_NAME || admin.name;
    await admin.save();
    console.log('Admin account updated');
  } else {
    await Admin.create({ name: process.env.ADMIN_NAME || 'Administrator', email, password });
    console.log('Admin account created');
  }

  if ((await Job.countDocuments()) === 0) {
    await Job.insertMany(jobs);
    console.log(`${jobs.length} sample jobs added`);
  } else {
    console.log('Jobs already exist, skipping sample data');
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
