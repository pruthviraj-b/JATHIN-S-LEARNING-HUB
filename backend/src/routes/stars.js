const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Public: list recent stars
router.get('/', async (req, res) => {
  try {
    const stars = await prisma.star.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { student: true, team: true } });
    res.json(stars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin only for awarding
// But leaderboards should be accessible to students too
router.post('/', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { studentId, teamId, reason, points } = req.body;
    if (!studentId && !teamId) return res.status(400).json({ error: 'studentId or teamId required' });

    let derivedTeamId = teamId;

    // If giving to a student, check if they are in a team
    if (studentId && !teamId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { teamId: true }
      });
      if (student?.teamId) {
        derivedTeamId = student.teamId;
      }
    }

    const star = await prisma.star.create({
      data: {
        studentId: studentId || null,
        teamId: derivedTeamId || null, // Associates star with team too
        reason: reason || 'admin-award',
        points: typeof points === 'number' ? points : 1,
        awardedBy: req.user.sub,
        createdAt: req.body.date ? new Date(req.body.date) : undefined
      }
    });
    res.status(201).json(star);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// List stars (Admin)
router.get('/all', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { studentId, teamId } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (teamId) where.teamId = teamId;
    const stars = await prisma.star.findMany({ where, orderBy: { createdAt: 'desc' }, include: { student: true, team: true } });
    res.json(stars);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Leaderboard - students
router.get('/leaderboard/students', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
  try {
    const agg = await prisma.star.groupBy({
      by: ['studentId'],
      _sum: { points: true },
      where: { studentId: { not: null } },
      orderBy: { _sum: { points: 'desc' } }
    });
    const studentIds = agg.map(a => a.studentId).filter(Boolean);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, profileUrl: true } // ONLY public info
    });
    const mapStudents = Object.fromEntries(students.map(s => [s.id, s]));
    const out = agg.map(a => ({ studentId: a.studentId, points: a._sum.points || 0, student: mapStudents[a.studentId] || null }));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Leaderboard - teams
router.get('/leaderboard/teams', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
  try {
    const agg = await prisma.star.groupBy({
      by: ['teamId'],
      _sum: { points: true },
      where: { teamId: { not: null } },
      orderBy: { _sum: { points: 'desc' } }
    });
    const teamIds = agg.map(a => a.teamId).filter(Boolean);
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: { members: { select: { firstName: true, lastName: true } } }
    });
    const mapTeams = Object.fromEntries(teams.map(t => [t.id, t]));
    const out = agg.map(a => ({ teamId: a.teamId, points: a._sum.points || 0, team: mapTeams[a.teamId] || null }));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
