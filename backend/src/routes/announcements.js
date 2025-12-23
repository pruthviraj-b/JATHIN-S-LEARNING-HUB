const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Public / Student: List announcements
router.get('/', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Admin only: Create
router.post('/', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { title, body, visibleTo } = req.body;
        if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

        // Create announcement
        const ann = await prisma.announcement.create({
            data: {
                title,
                body,
                visibleTo: visibleTo || 'STUDENT'
            }
        });

        // Create notifications for all students
        const students = await prisma.student.findMany({
            where: { active: true },
            select: { id: true }
        });

        if (students.length > 0) {
            await prisma.notification.createMany({
                data: students.map(s => ({
                    studentId: s.id,
                    title: `📢 ${title}`,
                    message: body,
                    type: 'ANNOUNCEMENT'
                }))
            });
        }

        res.status(201).json(ann);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Admin only: Delete
router.delete('/:id', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcement.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
