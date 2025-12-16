require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Debug root route to verify connectivity
app.get('/api/health-check', (req, res) => {
  res.send('Backend is Alive!');
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

app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/stars', starsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date() });
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
