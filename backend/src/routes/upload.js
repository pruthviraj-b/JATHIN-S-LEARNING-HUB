const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tuition-app', // Folder in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }] // Resize limit
    }
});

const upload = multer({ storage: storage }).single('file');

/**
 * POST /api/upload
 * Authentication: Required
 */
// File Upload Endpoint
router.post('/', authMiddleware(), (req, res) => {
    // router.post('/', (req, res) => { // TEMP: Disable auth for testing
    console.log('Upload Route Hit');
    upload(req, res, (err) => {
        console.log('Multer/Cloudinary Callback. Error:', err);
        if (err) {
            console.error('Upload Error:', err);
            // Ensure we send a string, even if err.message is missing
            const errorMsg = err.message || (typeof err === 'string' ? err : 'Unknown Upload Error');
            return res.status(400).json({ error: errorMsg, details: err });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return Cloudinary URL
        // Cloudinary returns the full SSL URL in req.file.path
        res.json({
            message: 'File uploaded successfully',
            url: req.file.path
        });
    });
});

module.exports = router;
