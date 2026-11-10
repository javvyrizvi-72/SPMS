const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

dotenv.config();

const connectDB = require('./config/db');
const mongoose = require('mongoose');
const { corsOptions, configuredOrigins } = require('./config/cors');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add it to server/.env (or the Render environment) and restart.');
  process.exit(1);
}

// Ensure local uploads directory exists on server startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory successfully');
}

connectDB().then(async () => {
  // Optional: set SEED_ON_START=true to insert the demo companies, jobs and students once (safe to repeat).
  if (process.env.SEED_ON_START === 'true') {
    try {
      const { seedSampleData } = require('./seed/sampleData');
      const r = await seedSampleData((m) => console.log('seed:', m));
      console.log(`Sample data ready (new: ${r.users} users, ${r.jobs} jobs, removed demo students: ${r.removedStudents})`);
    } catch (e) {
      console.error('Seeding failed:', e.message);
    }
  }
});

const app = express();
app.set('trust proxy', 1); // Render/Vercel proxies: needed for correct client IPs and rate limiting

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploads folder for resumes
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

app.get('/api/health', (req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', time: new Date().toISOString() })
);
app.get('/', (req, res) => {
  res.json({ message: 'PlaceMe API Running!', version: '1.1.0' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS: localhost (any port), *placement*.vercel.app${configuredOrigins().length ? `, ${configuredOrigins().join(', ')}` : ''}`);
});