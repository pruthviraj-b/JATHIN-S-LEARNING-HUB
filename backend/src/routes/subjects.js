const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Public: list subjects (only visible ones for general users)
router.get('/', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({ where: { visible: true }, include: { materials: true } });
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Public: get subject details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.findUnique({ where: { id }, include: { materials: true, students: true } });
    if (!subject) return res.status(404).json({ error: 'not found' });
    if (!subject.visible) return res.status(403).json({ error: 'subject not visible' });
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// ADMIN routes
router.use(authMiddleware(['ADMIN']));

// Admin: list all subjects
router.get('/admin/all', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({ include: { materials: true, students: true } });
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Create subject
router.post('/', async (req, res) => {
  try {
    const { name, code, visible, classLevel } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const created = await prisma.subject.create({ data: { name, code, visible: typeof visible === 'boolean' ? visible : true, classLevel: typeof classLevel === 'number' ? classLevel : 1 } });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Update subject
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, visible, classLevel } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (visible !== undefined) data.visible = visible;
    if (classLevel !== undefined) data.classLevel = classLevel;
    const updated = await prisma.subject.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Delete subject
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Assign students to subject (replace current students)
router.post('/:id/assign-students', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) return res.status(400).json({ error: 'studentIds array required' });
    const updated = await prisma.subject.update({ where: { id }, data: { students: { set: studentIds.map(sid => ({ id: sid })) } }, include: { students: true } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Add study material (simple stub: accepts URL and type)
router.post('/:id/materials', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, url } = req.body;
    if (!title || !type || !url) return res.status(400).json({ error: 'title,type,url required' });
    const material = await prisma.studyMaterial.create({ data: { title, type, url, subjectId: id } });
    res.status(201).json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
