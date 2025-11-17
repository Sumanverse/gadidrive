const express = require('express');
const router = express.Router();

// Controller imports
const about = require('../controller/fulll/about');
const home = require('../controller/fulll/home');
const signin = require('../controller/fulll/signin');

// Routes
router.get('/about', about.getabout);
router.get('/', home.gethome);
router.get('/signin', signin.getSignin);
router.post('/signin', signin.postSignin);
router.get('/admin/superaccount', (req, res) => {
    res.render('admin/superaccount', { title: 'Gyarage - Admin Dashboard' });
});

module.exports = router;