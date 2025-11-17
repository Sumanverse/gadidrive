const UserDetails = require('../../models/userdetails');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validator = require('validator');

// Multer setup for profile picture
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/uploads/profiles/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// GET PROFILE
exports.getprofile = async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        
        const user = await UserDetails.getUserById(userId);
        
        const safeUser = user || { 
            user_id: userId,
            name: 'Test User', 
            username: 'testuser', 
            bio: 'Welcome to Gyarage!', 
            socialMedia: [],
            profilePicture: null,
            position: 'user'
        };
        
        res.render('publicpages/profile', { 
            user: safeUser,
            error: null 
        });
        
    } catch (error) {
        console.error('Profile load error:', error);
        res.render('publicpages/profile', { 
            user: { 
                user_id: 1,
                name: 'Test User', 
                username: 'testuser', 
                bio: 'Welcome to Gyarage!', 
                socialMedia: [],
                profilePicture: null,
                position: 'user'
            }, 
            error: 'Error loading profile: ' + error.message 
        });
    }
};

// UPDATE PROFILE PICTURE
exports.updateProfilePicture = [
    upload.single('profilePicture'),
    async (req, res) => {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                throw new Error('User ID not found in request');
            }
            
            if (!req.file) {
                throw new Error('No file uploaded');
            }
            
            const profileImagePath = `/uploads/profiles/${req.file.filename}`;
            await UserDetails.updateUser(userId, {}, profileImagePath);
            res.json({ success: true, message: 'Profile picture updated successfully!' });
        } catch (error) {
            console.error('Picture update error:', error);
            res.status(400).json({ success: false, message: `Failed to update profile picture: ${error.message}` });
        }
    }
];

// UPDATE NAME
exports.updateName = async (req, res) => {
    console.log('Name Request Body:', req.body); // Log for debugging
    try {
        const userId = req.user?.user_id;
        if (!userId) throw new Error('User ID not found');
        const { name } = req.body || {};
        if (!name || name.trim() === '') return res.status(400).json({ success: false, message: 'Name cannot be empty' });
        if (name.length > 50) return res.status(400).json({ success: false, message: 'Name too long' });
        await UserDetails.updateUser(userId, { name: name.trim() });
        res.json({ success: true, message: 'Name updated!' });
    } catch (error) {
        console.error('Name update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE USERNAME
exports.updateUsername = async (req, res) => {
    console.log('Username Request Body:', req.body); // Log for debugging
    try {
        const userId = req.user?.user_id;
        if (!userId) throw new Error('User ID not found');
        const { username } = req.body || {};
        if (!username || username.trim() === '') return res.status(400).json({ success: false, message: 'Username cannot be empty' });
        if (username.length > 30) return res.status(400).json({ success: false, message: 'Username too long' });
        await UserDetails.updateUser(userId, { username: username.trim() });
        res.json({ success: true, message: 'Username updated!' });
    } catch (error) {
        console.error('Username update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE BIO
exports.updateBio = async (req, res) => {
    console.log('Bio Request Body:', req.body); // Log for debugging
    try {
        const userId = req.user?.user_id;
        if (!userId) throw new Error('User ID not found');
        const { bio } = req.body || {};
        const safeBio = bio ? bio.trim() : '';
        if (safeBio.length > 150) return res.status(400).json({ success: false, message: 'Bio too long' });
        await UserDetails.updateUser(userId, { bio: safeBio });
        res.json({ success: true, message: 'Bio updated!' });
    } catch (error) {
        console.error('Bio update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE SOCIAL MEDIA
exports.updateSocialMedia = async (req, res) => {
    console.log('Social Media Request Body:', req.body); // Log for debugging
    try {
        const userId = req.user?.user_id;
        if (!userId) throw new Error('User ID not found');
        const { socialMedia } = req.body || {};
        console.log('Processed socialMedia:', socialMedia); // Debug log

        if (!socialMedia || !Array.isArray(socialMedia) || socialMedia.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid social media data provided' });
        }

        const validatedSocialMedia = socialMedia.map(s => ({
            type: s.type ? s.type.trim() : '',
            link: s.link ? s.link.trim() : ''
        })).filter(s => s.type && s.link && validator.isURL(s.link, { require_protocol: true }));

        if (validatedSocialMedia.length > 5) {
            return res.status(400).json({ success: false, message: 'Too many social media links' });
        }

        if (validatedSocialMedia.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid social media links provided' });
        }

        await UserDetails.updateUser(userId, { socialMedia: validatedSocialMedia });
        res.json({ success: true, message: 'Social media updated!' });
    } catch (error) {
        console.error('Social media update error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) throw new Error('User ID not found');
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Passwords required' });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password too short' });
        const success = await UserDetails.updatePassword(userId, currentPassword, newPassword);
        if (success) {
            res.json({ success: true, message: 'Password updated!' });
        } else {
            res.status(400).json({ success: false, message: 'Current password incorrect' });
        }
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};