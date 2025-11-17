// utils/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

ensureDir(path.join(__dirname, '../public/uploads/profiles'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // FORM FIELD NAME = 'profilePicture' → yo use gara
        if (file.fieldname === 'profilePicture') {
            cb(null, path.join(__dirname, '../public/uploads/profiles'));
        } else {
            cb(new Error('Invalid file field'), false);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'profile-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

module.exports = upload;