require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({
  origin: true, // Allow request origin to support credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Debug root route to verify connectivity & DB
app.get('/api/health-check', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', message: 'Backend & DB Alive!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'DB Failed', error: error.message });
  }
});

const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');
const subjectsRoutes = require('./routes/subjects');
const teamsRoutes = require('./routes/teams');
const starsRoutes = require('./routes/stars');
const timetableRoutes = require('./routes/timetable');
const classesRoutes = require('./routes/classes');
const testsRoutes = require('./routes/tests');
const announcementsRoutes = require('./routes/announcements');
const materialsRoutes = require('./routes/materials');
const notificationsRoutes = require('./routes/notifications');
const badgesRoutes = require('./routes/badges');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/stars', starsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/roles', require('./routes/roles')); // Global Roles
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/upload', require('./routes/upload'));
const path = require('path');

// Serve static files from uploads directory with CORS and absolute path
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Fallback for missing images
app.use('/uploads/*', (req, res) => {
  res.status(404).send('Image not found');
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const port = process.env.PORT || 4000;

// Only listen if run directly (local dev)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

// Export for Vercel
module.exports = app;
