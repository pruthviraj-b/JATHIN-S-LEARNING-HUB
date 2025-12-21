require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('--- Config Check ---');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'OK (' + process.env.CLOUDINARY_CLOUD_NAME + ')' : 'MISSING');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'OK' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'OK' : 'MISSING');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Try to upload a sample image (using a remote URL to test connectivity)
console.log('\n--- Upload Test ---');
cloudinary.uploader.upload('https://cloudinary-res.cloudinary.com/image/upload/cloudinary_logo.png',
    { folder: 'test_upload' },
    (error, result) => {
        if (error) {
            console.error('FAIL: Upload failed:', error);
        } else {
            console.log('SUCCESS: Image uploaded!');
            console.log('URL:', result.secure_url);
        }
    }
);
