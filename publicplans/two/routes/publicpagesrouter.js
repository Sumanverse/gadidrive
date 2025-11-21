// routes/publicpagesrouter.js
const express = require('express');
const router = express.Router();

// Controller imports
const brands = require('../controller/publicpages/brands');
const brandsdetails = require('../controller/publicpages/brandsdetails');
const category = require('../controller/publicpages/category');
const categorydetails = require('../controller/publicpages/categorydetails');
const compare = require('../controller/publicpages/compare');
const modeldetails = require('../controller/publicpages/modeldetails');
const news = require('../controller/publicpages/news');
const newsdetails = require('../controller/publicpages/newsdetails');
const profile = require('../controller/publicpages/profile');

// === PUBLIC ROUTES (ROOT LEVEL) ===
router.get('/brands', brands.getbrands);
router.get('/brandsdetails/:brandId', brandsdetails.getbrandsdetails);
router.get('/category', category.getcategory);
router.get('/categorydetails/:categoryId', categorydetails.getcategorydetails);
router.get('/compare', compare.getcompare);
router.get('/modeldetails/:modelId', modeldetails.getmodeldetails);
router.get('/news', news.getnews);
router.get('/newsdetails', newsdetails.getnewsdetails);

// === PROFILE ROUTES (NOW UNDER /profile) ===
router.get('/profile', profile.getprofile);
router.get('/profile/admin', profile.getAdminCategory);

// POST routes (no change)
router.post('/update-picture', profile.updateProfilePicture);
router.post('/update-name', profile.updateName);
router.post('/update-username', profile.updateUsername);
router.post('/update-bio', profile.updateBio);
router.post('/update-social', profile.updateSocialMedia);
router.post('/update-password', profile.updatePassword);

// Multer error
router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'Only image files are allowed!') {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
});

module.exports = router;