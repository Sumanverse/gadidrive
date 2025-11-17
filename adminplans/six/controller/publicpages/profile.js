// controller/publicpages/profile.js
const UserDetails = require('../../models/userdetails');
const upload = require('../../utils/upload');
const path = require('path');
const fs = require('fs');

exports.getprofile = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.redirect('/login');

        const user = await UserDetails.getUserById(userId);
        if (!user) return res.redirect('/login');

        res.render('publicpages/profile', { user, error: null });
    } catch (error) {
        console.error('Profile load error:', error);
        res.redirect('/login');
    }
};

exports.updateProfilePicture = [
    upload.single('profilePicture'),
    async (req, res) => {
        try {
            const userId = req.user?.user_id;
            if (!userId) throw new Error('Login required');
            if (!req.file) throw new Error('Please select an image');

            const oldUser = await UserDetails.getUserById(userId);
            if (oldUser.profilePicture && oldUser.profilePicture.startsWith('/uploads/profiles/')) {
                const oldPath = path.join(__dirname, '../../public', oldUser.profilePicture);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            const newPath = `/uploads/profiles/${req.file.filename}`;
            await UserDetails.updateUser(userId, {}, newPath);

            res.json({ success: true, message: 'Profile picture updated!' });
        } catch (error) {
            console.error('Profile picture update error:', error.message);
            res.status(400).json({ success: false, message: error.message });
        }
    }
];

exports.updateName = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name required' });
        await UserDetails.updateUser(userId, { name });
        res.json({ success: true, message: 'Name updated!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUsername = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { username } = req.body;
        if (!username?.trim()) return res.status(400).json({ success: false, message: 'Username required' });

        const [existing] = await require('../../utils/dbutils').execute(
            'SELECT user_id FROM usertable WHERE username = ? AND user_id != ?',
            [username.trim(), userId]
        );
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Username taken' });

        await UserDetails.updateUser(userId, { username: username.trim() });
        res.json({ success: true, message: 'Username updated!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBio = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { bio } = req.body;
        const safeBio = (bio || '').trim().substring(0, 150);
        await UserDetails.updateUser(userId, { bio: safeBio });
        res.json({ success: true, message: 'Bio updated!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSocialMedia = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { socialMedia } = req.body;

        if (!Array.isArray(socialMedia) || socialMedia.length === 0) {
            return res.status(400).json({ success: false, message: 'Add at least one link' });
        }

        const valid = socialMedia
            .map(s => ({ type: s.type?.trim(), link: s.link?.trim() }))
            .filter(s => s.type && s.link && s.link.match(/^https?:\/\//));

        if (valid.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid links' });
        }

        await UserDetails.updateUser(userId, { social_media: JSON.stringify(valid) });

        res.json({ success: true, message: 'Social media updated!' });
    } catch (error) {
        console.error('Social media update error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'All fields required' });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password too short' });

        const success = await UserDetails.updatePassword(userId, currentPassword, newPassword);
        res.json({ success, message: success ? 'Password changed!' : 'Wrong current password' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminCategory = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) return res.redirect('/login');

        const user = await UserDetails.getUserById(userId);
        if (!user || !['admin', 'level1', 'level2', 'level3'].includes(user.position)) {
            return res.status(403).send('Access denied');
        }

        const redirectMap = {
            admin: '/admin/superaccount',
            level1: '/admin/article',
            level2: '/admin/category',
            level3: '/admin/level3am'
        };

        res.redirect(`${redirectMap[user.position] || '/admin/category'}`);
    } catch (error) {
        console.error('Admin redirect error:', error);
        res.status(500).send('Server error');
    }
};