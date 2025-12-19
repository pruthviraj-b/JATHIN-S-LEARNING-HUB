const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save to 'uploads' folder in project root (or backend root)
        const uploadPath = path.join(process.cwd(), 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp + random + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    // Limit file size (e.g., 5MB)
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
}).single('file'); // Apply .single('file') here

/**
 * POST /api/upload
 * Authentication: Required (Any logged in user can upload? Or restricted?)
 * For now, allow any Authenticated user (Admin/Student) to upload.
 */
// File Upload Endpoint
router.post('/', authMiddleware, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error('Multer Error:', err);
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return RELATIVE URL so it works on mobile/network
        // Frontend should prepend API_BASE or host if needed, but relative usually works if served from same origin
        // Since backend is on 4000 and frontend on 3000, we need the full URL for the frontend to display it?
        // Actually, for mobile access (different IP), 'localhost' in DB is bad.
        // Best approach: Return relative path /uploads/filename. 
        // Frontend (Next.js) will treat it as relative to Frontend Origin (3000).
        // Backend (4000) serves /uploads. 
        // PROXY: We should set up Next.js rewrites to map /uploads -> localhost:4000/uploads.
        // OR: Return a protocol-relative URL? No.

        // Quick Fix: Return /uploads/filename. Frontend needs to handle the domain.
        // In StudentLayout headers: <img src={user.profileUrl} />
        // If profileUrl is '/uploads/abc.jpg', it tries 'http://localhost:3000/uploads/abc.jpg'.
        // Frontend needs to proxy this.

        // Let's return the path and assume we'll fix Proxy or usage.
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            url: fileUrl
        });
    });
});

module.exports = router;
