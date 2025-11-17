// routes/fullpagesrouter.js
const express = require('express');
const router = express.Router();

// Controller imports
const about = require('../controller/fulll/about');
const home = require('../controller/fulll/home');
const signin = require('../controller/fulll/signin');
const profileController = require('../controller/publicpages/profile');
const auth = require('../middleware/auth');

// FIXED: Correct file name (lowercase t)
const UserDetails = require('../models/userdetails');
const VehicleType = require('../models/vehicletype'); // Fixed

// Routes
router.get('/about', about.getabout);
router.get('/', home.gethome);
router.get('/signin', signin.getSignin);
router.post('/signin', signin.postSignin);

router.get('/profile', auth, profileController.getprofile);

// Superaccount Route
router.get('/admin/superaccount', auth, async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.redirect('/profile');
        }

        const users = await UserDetails.getAllUsers();
        const vehicleTypes = await VehicleType.getAllVehicleTypes(); // Use correct method

        res.render('admin/superaccount', {
            title: 'Gyarage - SuperAccount Dashboard',
            user: req.user,
            users: users,
            vehicleTypes: vehicleTypes
        });
    } catch (error) {
        console.error('Superaccount error:', error);
        res.status(500).send('Server Error');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/signin');
});

module.exports = router;