const UserDetails = require('../../models/userdetails');
const jwt = require('jsonwebtoken');

exports.getSignin = (req, res, next) => {
    res.render('signin', { error: null }); // ✅ FIXED - No 'full/'
};

exports.postSignin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('signin', { error: 'Username र Password दुवै भर्नुहोस्' });
        }

        // ========================================
        // SPECIAL ADMIN LOGIN: admin/admin
        // ========================================
        if (username === 'admin' && password === 'admin') {
            const token = jwt.sign(
                { userId: 0, username: 'admin', role: 'superadmin' },
                process.env.JWT_SECRET || 'gyarage_superaccount_secret',
                { expiresIn: '7d' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.redirect('/admin/superaccount'); // ✅ SUPERACCOUNT DASHBOARD
        }

        // ========================================
        // NORMAL USER LOGIN (Database)
        // ========================================
        const user = await UserDetails.authenticateUser(username, password);
        
        if (!user) {
            return res.render('signin', { error: 'गलत Username वा Password' });
        }

        const token = jwt.sign(
            { userId: user.user_id, username: user.username, role: 'user' },
            process.env.JWT_SECRET || 'gyarage_superaccount_secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.redirect('/profile'); // ✅ USER PROFILE
        
    } catch (error) {
        console.error(error);
        res.render('signin', { error: 'Server Error भयो!' });
    }
};