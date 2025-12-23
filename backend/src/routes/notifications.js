const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /notifications: Get notifications for logged-in student
router.get('/', authMiddleware(['STUDENT']), async (req, res) => {
    try {
        const studentId = req.user.student?.id;
        if (!studentId) return res.status(404).json({ error: 'No student profile linked' });

        const notifications = await prisma.notification.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PUT /notifications/:id/read: Mark notification as read
router.put('/:id/read', authMiddleware(['STUDENT']), async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user.student?.id;

        const notification = await prisma.notification.updateMany({
            where: {
                id,
                studentId // Ensure it belongs to this student
            },
            data: { read: true }
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// PUT /notifications/mark-all-read: Mark all as read
router.put('/mark-all-read', authMiddleware(['STUDENT']), async (req, res) => {
    try {
        const studentId = req.user.student?.id;
        if (!studentId) return res.status(404).json({ error: 'No student profile linked' });

        await prisma.notification.updateMany({
            where: { studentId, read: false },
            data: { read: true }
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

module.exports = router;
