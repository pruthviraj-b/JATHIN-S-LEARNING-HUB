const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// List materials (Public/Student can see visible subjects' materials, Admin sees all)
router.get('/', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const { subjectId, classLevel } = req.query;
        const where = {};
        if (subjectId) where.subjectId = subjectId;
        if (classLevel) {
            where.subject = {
                classLevel: parseInt(classLevel)
            };
        }

        const materials = await prisma.studyMaterial.findMany({
            where,
            include: { subject: true },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json(materials);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Admin: Upload (Link) Material
router.post('/', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { subjectId, title, type, url } = req.body;
        if (!subjectId || !title || !url) return res.status(400).json({ error: 'Missing fields' });

        const material = await prisma.studyMaterial.create({
            data: {
                subjectId,
                title,
                type: type || 'link',
                url
            }
        });
        res.status(201).json(material);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Admin: Delete
router.delete('/:id', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.studyMaterial.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
