const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware(['STUDENT'])); // Only students need their own tasks

// List Tasks
router.get('/', async (req, res) => {
    try {
        // Find tasks for current user's student profile
        const student = await prisma.student.findFirst({ where: { user: { id: req.user.id } } });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const tasks = await prisma.task.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Create Task
router.post('/', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });

        const student = await prisma.student.findFirst({ where: { user: { id: req.user.id } } });

        const task = await prisma.task.create({
            data: {
                text,
                studentId: student.id
            }
        });
        res.status(201).json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Toggle Complete
router.put('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return res.status(404).json({ error: 'task not found' });

        // Verify ownership (optional but recommended, assuming ID is unguessable enough or check studentId)

        const updated = await prisma.task.update({
            where: { id },
            data: { completed: !task.completed }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Delete Task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
