import { useState } from 'react';

const StudentProfileImage = ({ student, size = 40 }) => {
    const [imgError, setImgError] = useState(false);

    // Generate image URL from student data
    const getImageUrl = () => {
        if (!student.profileUrl) {
            if (student.firstName && student.lastName) {
                return `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=random&color=fff&size=128`;
            }
            return '/default-avatar.png'; // Ultimate fallback
        }

        // If it's already a full URL (Google Drive, Cloudinary, etc.)
        if (student.profileUrl.startsWith('http')) {
            // Convert Google Drive links to direct image links
            if (student.profileUrl.includes('drive.google.com')) {
                const fileId = extractGoogleDriveFileId(student.profileUrl);
                if (fileId) {
                    return `https://drive.google.com/uc?export=view&id=${fileId}`;
                }
            }
            return student.profileUrl;
        }

        // For local uploads, prepend backend URL
        // Ensure we don't double slash if profileUrl already starts with /
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : 'http://localhost:4000';
        const imagePath = student.profileUrl.startsWith('/') ? student.profileUrl : `/${student.profileUrl}`;

        return `${baseUrl}${imagePath}`;
    };

    // Extract file ID from various Google Drive URL formats
    const extractGoogleDriveFileId = (url) => {
        const patterns = [
            /\/d\/([a-zA-Z0-9_-]+)/,  // /d/FILE_ID
            /id=([a-zA-Z0-9_-]+)/,     // ?id=FILE_ID
            /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleImageError = () => {
        setImgError(true);
    };

    const finalSrc = imgError ? `https://ui-avatars.com/api/?name=${student.firstName || 'User'}+${student.lastName || ''}&background=random&color=fff&size=128` : getImageUrl();

    return (
        <div className="profile-image-container" style={{ width: size, height: size }}>
            <img
                src={finalSrc}
                alt={`${student.firstName}'s profile`}
                onError={handleImageError}
                className="profile-image"
            />
            <style jsx>{`
        .profile-image-container {
          border-radius: 50%;
          overflow: hidden;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          flex-shrink: 0;
        }
        
        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
        </div>
    );
};

export default StudentProfileImage;
