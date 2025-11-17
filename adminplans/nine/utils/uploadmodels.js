// utils/uploadmodels.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const dirs = [
    'public/uploads/models',
    'public/uploads/colors',
    'public/uploads/specs',
    'public/uploads/about'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'public/uploads/models';
        if (file.fieldname.includes('exterior') || file.fieldname.includes('interior')) {
            uploadPath = 'public/uploads/colors';
        } else if (file.fieldname.includes('specPhoto')) {
            uploadPath = 'public/uploads/specs';
        } else if (file.fieldname.includes('aboutPhoto')) {
            uploadPath = 'public/uploads/about';
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only! (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter
});

module.exports = upload;