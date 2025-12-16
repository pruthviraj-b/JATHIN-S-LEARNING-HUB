const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Protect all routes
router.use(authMiddleware(['ADMIN', 'STUDENT']));

// List all classes (Admin sees all, Student sees their class level/subjects)
router.get('/', async (req, res) => {
    try {
        const { role, sub: userId } = req.user;
        const { subjectId } = req.query;
        const where = {};
        if (subjectId) where.subjectId = subjectId;

        if (role === 'STUDENT') {
            // Get student profile
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
            if (!user?.student) return res.status(403).json({ error: 'No student profile' });

            const classLevel = user.student.classLevel;
            // Filter classes by subjects in this class level
            where.subject = { classLevel: classLevel };
            // Also maybe visible subjects only?
            where.subject.visible = true;
        }

        const classes = await prisma.class.findMany({
            where,
            include: {
                subject: true,
                _count: { select: { attendances: true } },
                attendances: role === 'STUDENT' ? { where: { studentId: userId } } : false // Include own attendance for student
            },
            orderBy: { scheduledAt: 'desc' }
        });
        res.json(classes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Admin only routes
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    next();
};

// Create a new class session
router.post('/', adminOnly, async (req, res) => {
    try {
        const { subjectId, title, scheduledAt, meetingLink } = req.body;
        if (!subjectId || !title || !scheduledAt) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newClass = await prisma.class.create({
            data: {
                subjectId,
                title,
                scheduledAt: new Date(scheduledAt),
                meetingLink
            },
            include: { subject: true }
        });

        // Auto-announce
        const dateStr = new Date(scheduledAt).toLocaleString();
        await prisma.announcement.create({
            data: {
                title: `📅 New Class: ${newClass.subject.name}`,
                body: `A new class "${title}" has been scheduled for ${dateStr}. \nLink: ${meetingLink || 'See details in schedule'}.`,
                visibleTo: 'STUDENT'
            }
        });

        res.status(201).json(newClass);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Delete a class
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.class.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Get class details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cls = await prisma.class.findUnique({
            where: { id },
            include: {
                subject: { include: { students: true } },
                attendances: true
            }
        });
        if (!cls) return res.status(404).json({ error: 'Class not found' });
        res.json(cls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Mark/Update Attendance
router.post('/:id/attendance', adminOnly, async (req, res) => {
    try {
        const { id } = req.params; // classId
        const { records } = req.body; // array of { studentId, present }

        if (!Array.isArray(records)) {
            return res.status(400).json({ error: 'Invalid records format' });
        }

        // Transaction: Delete all for this class and re-create.
        await prisma.$transaction([
            prisma.attendance.deleteMany({ where: { classId: id } }),
            prisma.attendance.createMany({
                data: records.map(r => ({
                    classId: id,
                    studentId: r.studentId,
                    present: r.present
                }))
            })
        ]);

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
