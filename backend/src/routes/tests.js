const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Protect all routes
router.use(authMiddleware(['ADMIN', 'STUDENT']));

// Helper for Admin Only
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    next();
};

// List all tests (Student sees tests for their class + their results)
router.get('/', async (req, res) => {
    try {
        const { role, sub: userId } = req.user;
        const where = {};

        if (role === 'STUDENT') {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
            if (!user?.student) return res.status(403).json({ error: 'No student profile' });

            // IMPORTANT: Use student.id, not user.id (userId)
            req.user.studentId = user.student.id;

            where.subject = { classLevel: user.student.classLevel, visible: true };
        }

        const tests = await prisma.test.findMany({
            where,
            include: {
                subject: true,
                _count: { select: { results: true, questions: true } },
                // Only include results for students to avoid fetching massive data for admin list
                results: role === 'STUDENT' ? { where: { studentId: req.user.studentId } } : false
            },
            orderBy: { scheduledAt: 'desc' }
        });
        res.json(tests);
    } catch (err) {
        console.error("GET /tests error:", err);
        res.status(500).json({ error: 'Failed to fetch tests: ' + err.message });
    }
});

// Create a new test
router.post('/', adminOnly, async (req, res) => {
    try {
        const { subjectId, title, scheduledAt, maxMarks } = req.body;
        if (!subjectId || !title || !scheduledAt || !maxMarks) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const dateObj = new Date(scheduledAt);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Validation: Prevent years like 1111 (must be > 2000)
        if (dateObj.getFullYear() < 2000) {
            return res.status(400).json({ error: 'Date must be after year 2000' });
        }

        const newTest = await prisma.test.create({
            data: {
                subjectId,
                title,
                scheduledAt: dateObj,
                maxMarks: Number(maxMarks),
                questions: req.body.questions ? {
                    create: req.body.questions.map(q => ({
                        text: q.text,
                        points: q.points || 1,
                        options: {
                            create: q.options.map(o => ({
                                text: o.text,
                                isCorrect: o.isCorrect
                            }))
                        }
                    }))
                } : undefined
            },
            include: { subject: true }
        });

        // Auto-announce
        const dateStr = dateObj.toLocaleString();
        await prisma.announcement.create({
            data: {
                title: `📝 New Test: ${newTest.subject.name}`,
                body: `A new test "${title}" has been scheduled for ${dateStr}. \nMax Marks: ${maxMarks}. Prepare well!`,
                visibleTo: 'STUDENT'
            }
        });

        res.status(201).json(newTest);
    } catch (err) {
        console.error("POST /tests error:", err);
        res.status(500).json({ error: 'Failed to create test: ' + err.message });
    }
});

// Delete a test
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if exists first
        const count = await prisma.test.count({ where: { id } });
        if (count === 0) return res.status(404).json({ error: 'Test not found' });

        // FIX: Manually delete related TestResults because schema likely lacks onDelete: Cascade
        await prisma.testResult.deleteMany({ where: { testId: id } });

        await prisma.test.delete({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error("DELETE /tests/:id error:", err);
        res.status(500).json({ error: 'Failed to delete test: ' + err.message });
    }
});

// Get test details with results
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        // Students shouldn't see everyone's results
        const include = {
            subject: { include: { students: role === 'ADMIN' } }, // Only admin sees enrolled list here
        };

        if (role === 'ADMIN') {
            include.results = { include: { student: true } };
            include.questions = { include: { options: true } }; // Ensure options are included for Admin view
        }

        const test = await prisma.test.findUnique({ where: { id }, include });
        if (!test) return res.status(404).json({ error: 'Test not found' });
        res.json(test);
    } catch (err) {
        console.error("GET /tests/:id error:", err);
        res.status(500).json({ error: 'Failed to fetch test details: ' + err.message });
    }
});

// Submit results (Marks)
router.post('/:id/results', adminOnly, async (req, res) => {
    try {
        const { id } = req.params; // testId
        const { results } = req.body; // array of { studentId, marks }

        if (!Array.isArray(results)) {
            return res.status(400).json({ error: 'Invalid results format' });
        }

        // Transaction: Delete existing results for this test and re-insert
        // Note: SQLite might error on createMany, using individual creates in transaction if needed.
        const operations = [
            prisma.testResult.deleteMany({ where: { testId: id } })
        ];

        results.forEach(r => {
            operations.push(prisma.testResult.create({
                data: {
                    testId: id,
                    studentId: r.studentId,
                    marks: Number(r.marks)
                }
            }));
        });

        await prisma.$transaction(operations);

        res.json({ ok: true });
    } catch (err) {
        console.error("POST /tests/:id/results error:", err);
        res.status(500).json({ error: 'Failed to save results: ' + err.message });
    }
});

// Quiz Play (Student)
router.get('/:id/play', async (req, res) => {
    try {
        const { id } = req.params;
        const test = await prisma.test.findUnique({
            where: { id },
            include: {
                subject: true,
                questions: {
                    include: {
                        options: { select: { id: true, text: true } } // Don't return isCorrect
                    }
                }
            }
        });
        if (!test) return res.status(404).json({ error: 'Test not found' });

        // Safety check if already attempted
        // const existing = await prisma.testResult.findFirst({ where: { testId: id, studentId: req.user.studentId } }); // Need studentId in req.user logic from auth middleware if not present.
        // Assuming Student can take multiple times or handled by UI for now.

        res.json(test);
    } catch (err) {
        console.error("GET /tests/:id/play error:", err);
        res.status(500).json({ error: 'server error' });
    }
});

// Submit Quiz (Student)
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const answers = req.body.answers; // { questionId: optionId }
        const userId = req.user.sub;

        const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
        if (!user?.student) return res.status(403).json({ error: 'Not a student' });
        const studentId = user.student.id;

        // Fetch test with correct answers
        const test = await prisma.test.findUnique({
            where: { id },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!test) return res.status(404).json({ error: 'Test not found' });

        // Calculate Score
        let score = 0;
        test.questions.forEach(q => {
            const selectedOptId = answers[q.id];
            if (selectedOptId) {
                const correctOpt = q.options.find(o => o.isCorrect);
                if (correctOpt && correctOpt.id === selectedOptId) {
                    score += q.points;
                }
            }
        });

        // Save Result
        // Check if exists
        const existing = await prisma.testResult.findFirst({ where: { testId: id, studentId } });
        if (existing) {
            await prisma.testResult.update({ where: { id: existing.id }, data: { marks: score } });
        } else {
            await prisma.testResult.create({
                data: {
                    testId: id,
                    studentId,
                    marks: score
                }
            });
        }

        res.json({ score, maxMarks: test.maxMarks });

    } catch (err) {
        console.error("POST /tests/:id/submit error:", err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
