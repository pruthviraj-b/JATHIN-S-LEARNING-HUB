const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');

// Get all chat rooms for a user (student sees their rooms, admin sees all)
router.get('/rooms', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const { userId, role, studentId } = req.user;

        let rooms;
        if (role === 'ADMIN') {
            // Admin sees ALL rooms
            rooms = await prisma.chatRoom.findMany({
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1 // Last message only
                    },
                    _count: { select: { messages: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
        } else {
            // Students see only rooms they're a member of
            rooms = await prisma.chatRoom.findMany({
                where: {
                    memberIds: { has: studentId }
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    _count: { select: { messages: true } }
                },
                orderBy: { updatedAt: 'desc' }
            });
        }

        res.json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get messages in a specific room
router.get('/rooms/:id/messages', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const { id } = req.params;
        const { role, studentId } = req.user;

        // Check access
        if (role === 'STUDENT') {
            const room = await prisma.chatRoom.findUnique({ where: { id } });
            if (!room || !room.memberIds.includes(studentId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const messages = await prisma.message.findMany({
            where: { roomId: id },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new chat room
router.post('/rooms', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const { name, type, memberIds, subjectId, classLevel } = req.body;
        const { userId, studentId, role } = req.user;

        // If student creates room, add themselves to members
        let finalMemberIds = memberIds || [];
        if (role === 'STUDENT' && studentId && !finalMemberIds.includes(studentId)) {
            finalMemberIds.push(studentId);
        }

        const room = await prisma.chatRoom.create({
            data: {
                name,
                type: type || 'GROUP',
                memberIds: finalMemberIds,
                subjectId,
                classLevel,
                createdBy: userId
            },
            include: {
                messages: true,
                _count: { select: { messages: true } }
            }
        });

        res.json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send a message
router.post('/messages', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
    try {
        const { roomId, content } = req.body;
        const { userId, studentId, role } = req.user;

        // Check access
        if (role === 'STUDENT') {
            const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
            if (!room || !room.memberIds.includes(studentId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        // Get sender name
        let senderName = 'Admin';
        if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { id: studentId } });
            senderName = `${student.firstName} ${student.lastName || ''}`.trim();
        }

        const message = await prisma.message.create({
            data: {
                roomId,
                senderId: studentId || userId,
                senderName,
                senderRole: role,
                content
            }
        });

        // Update room's updatedAt time
        await prisma.chatRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() }
        });

        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a room (admin only)
router.delete('/rooms/:id', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        await prisma.chatRoom.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get list of students for creating rooms (admin only)
router.get('/students-list', authMiddleware(['ADMIN']), async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            where: { active: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                classLevel: true,
                team: { select: { name: true } }
            },
            orderBy: { firstName: 'asc' }
        });
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
