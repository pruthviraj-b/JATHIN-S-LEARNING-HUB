const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getWhatsAppStatus, sendWhatsAppMessage, logoutWhatsApp, startWhatsApp } = require('../services/whatsappClient');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Start Bot
router.post('/start', authMiddleware(['ADMIN']), async (req, res) => {
    startWhatsApp();
    res.json({ message: 'Starting WhatsApp Client...' });
});

// Get Status (for Admin Panel)
router.get('/status', authMiddleware(['ADMIN']), (req, res) => {
    res.json(getWhatsAppStatus());
});

// Logout
router.post('/logout', authMiddleware(['ADMIN']), async (req, res) => {
    await logoutWhatsApp();
    res.json({ message: 'Logged out' });
});

// Bulk Send
router.post('/send', authMiddleware(['ADMIN']), async (req, res) => {
    const { studentIds, message, broadcast } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message content empty' });
    }

    let students = [];
    if (broadcast) {
        // Fetch ALL students with phone numbers
        students = await prisma.student.findMany({
            where: { phoneNumber: { not: null } },
            select: { id: true, firstName: true, phoneNumber: true }
        });
    } else {
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'No recipients selected' });
        }
        // Fetch selected students
        students = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, firstName: true, phoneNumber: true }
        });
    }

    const results = {
        success: [],
        failed: []
    };

    // Sequential sending to avoid spam triggers? Or parallel?
    // Parallel is faster but risky. Let's do sequential with small delay.
    for (const student of students) {
        if (!student.phoneNumber) {
            results.failed.push({ name: student.firstName, error: 'No Phone Number' });
            continue;
        }

        try {
            await sendWhatsAppMessage(student.phoneNumber, message);
            results.success.push(student.firstName);
            // Wait 500ms between messages to be polite
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            results.failed.push({ name: student.firstName, error: err.message });
        }
    }

    res.json({
        message: `Processed ${students.length} messages`,
        stats: {
            total: students.length,
            sent: results.success.length,
            failed: results.failed.length
        },
        details: results
    });
});

module.exports = router;
