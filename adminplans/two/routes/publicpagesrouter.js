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

// Routes (remove redundant /region prefix)
router.get('/brands', brands.getbrands);
router.get('/brandsdetails', brandsdetails.getbrandsdetails);
router.get('/category', category.getcategory);
router.get('/categorydetails', categorydetails.getcategorydetails);
router.get('/compare', compare.getcompare);
router.get('/modeldetails', modeldetails.getmodeldetails);
router.get('/news', news.getnews);
router.get('/newsdetails', newsdetails.getnewsdetails);
router.get('/profile', profile.getprofile); 

module.exports = router;