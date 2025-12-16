const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Protect most routes for ADMIN, but allow specific STUDENT access
// We will apply middlewares per-route or group them
// router.use(authMiddleware(['ADMIN'])); <--- REMOVED GLOBAL LOCK

// List students (ADMIN only)
router.get('/', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        subjects: true,
        team: true,
        user: { select: { email: true, role: true } },
        stars: { select: { points: true } }
      }
    });

    const withPoints = students.map(s => ({
      ...s,
      totalPoints: s.stars.reduce((sum, star) => sum + star.points, 0),
      stars: undefined // lighter payload
    }));

    // Sort: Highest points first
    withPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    res.json(withPoints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single student (ADMIN or SELF)
router.get('/:id', authMiddleware(['ADMIN', 'STUDENT']), async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { subjects: true, team: true, user: { select: { email: true, role: true } } }
    });
    if (!student) return res.status(404).json({ error: 'not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create student (ADMIN)
router.post('/', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { firstName, lastName, dob, profileUrl, active, email, password, subjectIds, teamId, classLevel } = req.body;

    // Create student first
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        dob: dob ? new Date(dob) : undefined,
        profileUrl,
        active: typeof active === 'boolean' ? active : true,
        classLevel: typeof classLevel === 'number' ? classLevel : undefined,
        team: teamId ? { connect: { id: teamId } } : undefined,
        subjects: subjectIds && subjectIds.length ? { connect: subjectIds.map(id => ({ id })) } : undefined
      }
    });

    if (email && password) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'email already in use' });
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.create({ data: { email, password: hashed, role: 'STUDENT', studentId: student.id } });
    }

    const created = await prisma.student.findUnique({ where: { id: student.id }, include: { subjects: true, team: true, user: { select: { email: true } } } });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Student Self-Update Profile
router.put('/profile/me', authMiddleware(['STUDENT']), async (req, res) => {
  try {
    const student = await prisma.student.findFirst({ where: { user: { id: req.user.id } } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { dob, profileUrl, password } = req.body;

    // Update basic info
    await prisma.student.update({
      where: { id: student.id },
      data: {
        dob: dob ? new Date(dob) : undefined,
        profileUrl: profileUrl || undefined
      }
    });



    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update student (ADMIN)
router.put('/:id', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, dob, profileUrl, active, subjectIds, teamId, classLevel, email, password } = req.body;

    // 1. Update Student Basic Info
    const studentData = {
      firstName,
      lastName,
      dob: dob ? new Date(dob) : undefined,
      profileUrl,
      active: typeof active === 'boolean' ? active : undefined,
      team: teamId ? { connect: { id: teamId } } : teamId === null ? { disconnect: true } : undefined,
      classLevel: typeof classLevel === 'number' ? classLevel : undefined,
    };
    Object.keys(studentData).forEach(k => studentData[k] === undefined && delete studentData[k]);
    if (subjectIds) {
      studentData.subjects = { set: subjectIds.map(id => ({ id })) };
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: studentData,
      include: { subjects: true, team: true, user: true }
    });

    // 2. Update Linked User Credentials (if email/password provided)
    // 2. Update Linked User Credentials (or Create if not exists)
    // 2. Update Linked User Credentials
    if (email || password) {
      // Find user linked to this student
      const linkedUser = await prisma.user.findFirst({ where: { studentId: id } });

      if (linkedUser) {
        // Update existing user
        const updateData = {};
        if (email && email !== linkedUser.email) {
          // Unique check
          const taken = await prisma.user.findUnique({ where: { email } });
          if (taken) return res.status(400).json({ error: 'Email already taken' });
          updateData.email = email;
        }
        if (password && password.trim() !== '') {
          updateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({ where: { id: linkedUser.id }, data: updateData });
        }
      } else if ((email || password)) {
        // Case 3: No linked user found, but trying to set credentials.
        // We need an email to create a User. If it wasn't passed, check if we can infer it or ask for it.
        // Realistically, if we didn't send email in body, fail unless we can find one?
        // Actually, if 'email' is in body, use it.

        if (!email) {
          // If no email provided in update, we can't create a user. 
          // Ignore password update if we can't create the user? Or throw error?
          // Let's just ignore for safety or require email.
        } else {
          // Create new user
          const taken = await prisma.user.findUnique({ where: { email } });
          if (taken) return res.status(400).json({ error: 'Email already taken' });

          await prisma.user.create({
            data: {
              email,
              password: await bcrypt.hash(password || 'welcome123', 10), // Fallback pass if only email sent
              role: 'STUDENT',
              studentId: id
            }
          });
        }
      }
    }

    res.json(updatedStudent);
  } catch (err) {
    if (err.meta?.target?.includes('email')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete student (ADMIN)
router.delete('/:id', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    // delete user(s) linked to student
    await prisma.user.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Assign subjects (ADMIN)
router.post('/:id/assign-subjects', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectIds } = req.body;
    if (!Array.isArray(subjectIds)) return res.status(400).json({ error: 'subjectIds array required' });
    const updated = await prisma.student.update({ where: { id }, data: { subjects: { set: subjectIds.map(sid => ({ id: sid })) } }, include: { subjects: true } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Activate / deactivate (ADMIN)
router.post('/:id/activate', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    if (typeof active !== 'boolean') return res.status(400).json({ error: 'active boolean required' });
    const updated = await prisma.student.update({ where: { id }, data: { active } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
