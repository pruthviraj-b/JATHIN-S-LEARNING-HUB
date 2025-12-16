const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendNotification } = require('../services/notification');

// GET /history: Get simple logs (For now mocked, or we can fetch from a log table if we add one. 
// To keep it simple, we'll just return a static list or dummy data until we add a DB table for logs)
router.get('/history', async (req, res) => {
    // In a real app, you'd store every sent message in a 'NotificationLog' table
    // For now, we'll return an empty list or mock
    res.json([
        { id: 1, date: new Date().toISOString(), recipientCount: 5, message: "Test Message", status: "Sent" }
    ]);
});

// POST /send: Send to specific students
// Body: { studentIds: [], message: "Hello {name}" }
router.post('/send', async (req, res) => {
    try {
        const { studentIds, message } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'No students selected' });
        }
        if (!message) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Fetch student details (need phone numbers)
        const students = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, firstName: true, phoneNumber: true }
        });

        const results = [];

        // Send individually
        for (const student of students) {
            if (!student.phoneNumber) {
                results.push({ id: student.id, name: student.firstName, status: 'Failed (No Phone)' });
                continue;
            }

            // Replace variables like {name}
            const personalizedMessage = message.replace(/{name}/g, student.firstName);

            // Send
            const result = await sendNotification(student.phoneNumber, personalizedMessage);
            results.push({
                id: student.id,
                name: student.firstName,
                status: result.success ? (result.mock ? 'Sent (Mock - Check Server Console)' : 'Sent') : `Failed (${result.error || 'Unknown'})`
            });
        }

        res.json({ success: true, results });

    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

module.exports = router;
