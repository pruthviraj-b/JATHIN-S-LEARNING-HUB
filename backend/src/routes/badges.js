const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

// GET / - List all badges
router.get('/', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const badges = await prisma.badge.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(badges);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST / - Create a new badge (ADMIN only)
router.post('/', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { name, description, icon, tier } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const badge = await prisma.badge.create({
            data: {
                name,
                description,
                icon: icon || '🏆',
                tier: tier || 'BRONZE'
            }
        });
        res.json(badge);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /student/:id - Get badges for a specific student
router.get('/student/:id', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const { id } = req.params;
        const badges = await prisma.studentBadge.findMany({
            where: { studentId: id },
            include: { badge: true },
            orderBy: { awardedAt: 'desc' }
        });
        res.json(badges);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST /assign - Assign badge to student (ADMIN only)
router.post('/assign', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { studentId, badgeId } = req.body;
        if (!studentId || !badgeId) return res.status(400).json({ error: 'studentId and badgeId required' });

        // Check if already assigned
        const existing = await prisma.studentBadge.findUnique({
            where: {
                studentId_badgeId: {
                    studentId,
                    badgeId
                }
            }
        });

        if (existing) return res.status(400).json({ error: 'Student already has this badge' });

        const assignment = await prisma.studentBadge.create({
            data: {
                studentId,
                badgeId
            },
            include: { badge: true }
        });
        res.json(assignment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:id - Delete a badge (ADMIN only)
router.delete('/:id', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.badge.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
