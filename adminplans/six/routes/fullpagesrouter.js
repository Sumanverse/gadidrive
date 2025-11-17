const express = require('express');
const router = express.Router();

// Controller imports
const about = require('../controller/fulll/about');
const home = require('../controller/fulll/home');
const signin = require('../controller/fulll/signin');
const profileController = require('../controller/publicpages/profile');
const auth = require('../middleware/auth');

// Routes
router.get('/about', about.getabout);
router.get('/', home.gethome);
router.get('/signin', signin.getSignin);
router.post('/signin', signin.postSignin);

// Protected Profile Route
router.get('/profile', auth, profileController.getprofile);

// Superaccount Route (protected by auth middleware)
router.get('/admin/superaccount', auth, (req, res) => {
    if (req.user.role === 'superadmin') {
        res.render('admin/superaccount', { title: 'Gyarage - SuperAccount Dashboard', user: req.user });
    } else {
        res.redirect('/profile');
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/signin');
});

module.exports = router;