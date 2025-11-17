const jwt = require('jsonwebtoken');
const UserDetails = require('../models/userdetails');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/signin');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gyarage_superaccount_secret');
        console.log('Decoded token:', decoded);

        if (decoded.role === 'superadmin') {
            req.user = { user_id: 1, role: 'superadmin', name: 'Admin' };
            return next();
        }

        const user = await UserDetails.getUserById(decoded.userId);
        if (!user) {
            return res.redirect('/signin');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.clearCookie('token');
        res.redirect('/signin');
    }
};

module.exports = auth;