const express = require('express');
const router = express.Router();

// Controller imports
const adminarticle = require('../controller/admin/Aarticle');
const adminbrand = require('../controller/admin/Abrand');
const admincategory = require('../controller/admin/Acategory');
const adminmodel = require('../controller/admin/Amodel');
const adminlevelam = require('../controller/admin/level3am');
const adminsuperaccount = require('../controller/admin/superaccount');

// Admin routes
router.get('/article', adminarticle.getadminarticle);
router.get('/brand', adminbrand.getadminbrand);
router.get('/category', admincategory.getadmincategory);
router.get('/model', adminmodel.getadminmodel);
router.get('/levelam', adminlevelam.getadminlevelam);
router.get('/superaccount', adminsuperaccount.getadminsuperaccount);

module.exports = router;