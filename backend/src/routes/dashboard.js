const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Removed global authMiddleware because we have mixed roles now

router.get('/stats', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        // 1. Total Students
        const studentCount = await prisma.student.count({ where: { active: true } });

        // 2. Classes (Today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const classesToday = await prisma.class.count({
            where: {
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // 3. Top Performer (Most Stars)
        // We need to group by studentId and sum points
        const starLeaders = await prisma.star.groupBy({
            by: ['studentId'],
            _sum: { points: true },
            where: { studentId: { not: null } },
            orderBy: { _sum: { points: 'desc' } },
            take: 1
        });

        let topStudentName = 'No One Yet';
        if (starLeaders.length > 0) {
            const s = await prisma.student.findUnique({ where: { id: starLeaders[0].studentId } });
            if (s) topStudentName = s.firstName + ' ' + (s.lastName || '');
        }

        // 4. Attendance Average (Global) - Simple approximation
        // Count total attendance records
        const totalRecords = await prisma.attendance.count();
        const presentRecords = await prisma.attendance.count({ where: { present: true } });
        const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

        res.json({
            totalStudents: studentCount,
            classesToday,
            topStudent: topStudentName,
            attendanceRate
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

// Student Dashboard Data
router.get('/student', authMiddleware(['STUDENT']), async (req, res) => {
    try {
        const userId = req.user.sub;
        // Get student record
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
        if (!user || !user.student) return res.status(404).json({ error: 'Student not found' });
        const studentId = user.student.id;
        const classLevel = user.student.classLevel;

        // 1. Stars (My Total)
        const starSum = await prisma.star.aggregate({
            _sum: { points: true },
            where: { studentId: studentId }
        });
        const myStars = starSum._sum.points || 0;

        // 2. Rank
        // Get all student sums, sort, find index
        const allStars = await prisma.star.groupBy({
            by: ['studentId'],
            _sum: { points: true },
            where: { studentId: { not: null } },
            orderBy: { _sum: { points: 'desc' } }
        });
        const myRankIndex = allStars.findIndex(s => s.studentId === studentId);
        const myRank = myRankIndex !== -1 ? `#${myRankIndex + 1}` : '-';

        // 3. Attendance %
        const myAttendanceTotal = await prisma.attendance.count({ where: { studentId } });
        const myAttendancePresent = await prisma.attendance.count({ where: { studentId, present: true } });
        const myAttendance = myAttendanceTotal > 0
            ? Math.round((myAttendancePresent / myAttendanceTotal) * 100) + '%'
            : '100%'; // Default to 100 if no records yet (optimistic)

        // 4. Upcoming Classes (next 3)
        const upcomingClasses = await prisma.class.findMany({
            where: {
                scheduledAt: { gte: new Date() },
                subject: { classLevel: classLevel, visible: true }
            },
            orderBy: { scheduledAt: 'asc' },
            take: 3,
            include: { subject: true }
        });

        // 5. Recent Announcements
        const announcements = await prisma.announcement.findMany({
            where: { visibleTo: { in: ['STUDENT', 'ALL'] } }, // Assuming 'ALL' or similar logic, but schema said 'visibleTo' string.
            // Schema check: visibleTo default 'STUDENT'. 
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        res.json({
            stars: myStars,
            rank: myRank,
            attendance: myAttendance,
            classes: upcomingClasses,
            announcements
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
