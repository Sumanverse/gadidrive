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

// Routes
router.get('/brands', brands.getbrands);
router.get('/brandsdetails', brandsdetails.getbrandsdetails);
router.get('/category', category.getcategory);
router.get('/categorydetails', categorydetails.getcategorydetails);
router.get('/compare', compare.getcompare);
router.get('/modeldetails', modeldetails.getmodeldetails);
router.get('/news', news.getnews);
router.get('/newsdetails', newsdetails.getnewsdetails);
router.get('/profile', profile.getprofile); 

// Profile update routes
router.post('/profile/update-picture', profile.updateProfilePicture);
router.post('/profile/update-name', profile.updateName);
router.post('/profile/update-username', profile.updateUsername);
router.post('/profile/update-bio', profile.updateBio);
router.post('/profile/update-socials', profile.updateSocialMedia);
router.post('/profile/update-password', profile.updatePassword);

// Multer error handler
router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'Only image files are allowed!') {
        console.error("Multer File Error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
});

module.exports = router;