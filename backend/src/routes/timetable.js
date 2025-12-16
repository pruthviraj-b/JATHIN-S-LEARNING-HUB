const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Returns subjects/timetable entries for the authenticated student's class
router.get('/me', authMiddleware(['STUDENT','ADMIN']), async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'invalid token' });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
    if (!user) return res.status(404).json({ error: 'user not found' });
    if (!user.student) return res.status(400).json({ error: 'no student profile linked' });

    const classLevel = user.student.classLevel || 1;

    // For now return subjects for the class as the timetable
    const subjects = await prisma.subject.findMany({ where: { classLevel } });

    res.json({ classLevel, subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
