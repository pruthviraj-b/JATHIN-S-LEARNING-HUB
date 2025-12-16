const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Public: list teams with members and total stars
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({ include: { members: true } });

    // compute star totals per team
    const starAgg = await prisma.star.groupBy({
      by: ['teamId'],
      _sum: { points: true },
      where: { teamId: { not: null } }
    });
    const map = {};
    starAgg.forEach(s => map[s.teamId] = s._sum.points || 0);

    const out = teams.map(t => ({
      id: t.id,
      name: t.name,
      captainId: t.captainId || null,
      members: t.members,
      stars: map[t.id] || 0
    }));

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin routes
router.use(authMiddleware(['ADMIN']));

// Create team
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const team = await prisma.team.create({ data: { name } });
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Update team
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await prisma.team.update({ where: { id }, data: { name } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Delete team (disconnect members first)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.student.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await prisma.team.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Add member
router.post('/:id/add-member', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const student = await prisma.student.update({ where: { id: studentId }, data: { team: { connect: { id } } }, include: { team: true } });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Remove member
router.post('/:id/remove-member', async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const student = await prisma.student.update({ where: { id: studentId }, data: { team: { disconnect: true } }, include: { team: true } });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Set captain
router.post('/:id/set-captain', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    // Optionally ensure student is a member of this team
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'student not found' });
    if (student.teamId !== id) return res.status(400).json({ error: 'student is not a member of this team' });

    const updated = await prisma.team.update({ where: { id }, data: { captainId: studentId } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Team leaderboard (stars per team)
router.get('/leaderboard/top', async (req, res) => {
  try {
    const agg = await prisma.star.groupBy({
      by: ['teamId'],
      _sum: { points: true },
      where: { teamId: { not: null } },
      orderBy: { _sum: { points: 'desc' } }
    });
    const teamIds = agg.map(a => a.teamId).filter(Boolean);
    const teams = await prisma.team.findMany({ where: { id: { in: teamIds } } });
    const mapTeams = Object.fromEntries(teams.map(t => [t.id, t]));
    const out = agg.map(a => ({ teamId: a.teamId, points: a._sum.points || 0, team: mapTeams[a.teamId] || null }));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
