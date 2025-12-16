const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Get attendance for logged-in student
router.get('/me', authMiddleware(['STUDENT']), async (req, res) => {
    try {
        const userId = req.user.id;
        const records = await prisma.attendance.findMany({
            where: { student: { userId: userId } },
            include: {
                class: {
                    include: { subject: true }
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get attendance for a specific date (Admin)
router.get('/', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        if (!date) return res.status(400).json({ error: 'Date required' });

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const records = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: { student: true }
        });

        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark/Update attendance (Admin)
router.post('/', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { studentId, date, present } = req.body;

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

        // Check if record exists for this student on this day
        // Since we don't have a unique constraint on (studentId, date) in schema yet, we search carefully.
        // But for daily attendance, we should probably treat one record per day.

        // Find existing within the day
        const startOfDay = new Date(targetDate);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await prisma.attendance.findFirst({
            where: {
                studentId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (existing) {
            // Update
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: { present, markedAt: new Date() }
            });
            return res.json(updated);
        } else {
            // Create
            const created = await prisma.attendance.create({
                data: {
                    studentId,
                    date: targetDate,
                    present,
                    markedAt: new Date()
                }
            });
            return res.json(created);
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

const { sendNotification } = require('../services/notification');

// Send bulk attendance notification
router.post('/notify', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { students, message } = req.body; // students: [{ id, name, phoneNumber, status }]

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ error: 'Invalid students list' });
        }

        const results = [];
        for (const s of students) {
            if (s.phoneNumber) {
                // Personalize message: "Hi parent, [Name] is present today."
                // Or use the custom message provided
                const body = message.replace('{name}', s.name).replace('{status}', s.status);
                const result = await sendNotification(s.phoneNumber, body);
                results.push({ student: s.name, success: result.success, error: result.error });
            } else {
                results.push({ student: s.name, success: false, error: 'No phone number' });
            }
        }

        res.json({ results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
