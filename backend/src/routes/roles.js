const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Get current leaders
router.get('/', async (req, res) => {
    try {
        const captain = await prisma.student.findFirst({
            where: { isCaptain: true }
        });
        const viceCaptain = await prisma.student.findFirst({
            where: { isViceCaptain: true }
        });

        res.json({ captain, viceCaptain });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Promote a student to a role (CAPTAIN or VICE_CAPTAIN)
router.post('/promote', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const { studentId, role } = req.body; // role: 'CAPTAIN' | 'VICE_CAPTAIN'

        if (!['CAPTAIN', 'VICE_CAPTAIN'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const isCaptain = role === 'CAPTAIN';
        const isViceCaptain = role === 'VICE_CAPTAIN';

        // Transaction:
        // 1. Remove role from current holder
        // 2. Assign role to new student
        // 3. Ensure a student can't be both (optional, but good practice)

        await prisma.$transaction(async (tx) => {
            // 1. Reset current holder
            if (isCaptain) {
                await tx.student.updateMany({
                    where: { isCaptain: true },
                    data: { isCaptain: false }
                });
            } else {
                await tx.student.updateMany({
                    where: { isViceCaptain: true },
                    data: { isViceCaptain: false }
                });
            }

            // 2. Assign new role (and remove the other role if they had it)
            // e.g. If promoting VC to Captain, remove VC status
            await tx.student.update({
                where: { id: studentId },
                data: {
                    isCaptain: isCaptain,
                    isViceCaptain: isViceCaptain
                }
            });
        });

        res.json({ success: true, studentId, role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
