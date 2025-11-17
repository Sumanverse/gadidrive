const express = require('express');
const router = express.Router();

// Controller imports
const adminarticle = require('../controller/admin/Aarticle');
const adminbrand = require('../controller/admin/Abrand');
const admincategory = require('../controller/admin/Acategory');
const adminmodel = require('../controller/admin/Amodel');
const adminlevelam = require('../controller/admin/level3am');
const adminsuperaccount = require('../controller/admin/superaccount');

// Existing Admin routes
router.get('/article', adminarticle.getadminarticle);
router.get('/brand', adminbrand.getadminbrand);
router.get('/category', admincategory.getadmincategory);
router.get('/model', adminmodel.getadminmodel);
router.get('/levelam', adminlevelam.getadminlevelam);

// ========================================
// SUPERACCOUNT ROUTES
// ========================================
router.get('/superaccount', adminsuperaccount.getadminsuperaccount);

// USER ROUTES
router.post('/superaccount/save-user', adminsuperaccount.createUser);
router.get('/superaccount/edit-user/:id', adminsuperaccount.getUserById);
router.put('/superaccount/update-user/:id', adminsuperaccount.updateUser);
router.delete('/superaccount/delete-user/:id', adminsuperaccount.deleteUser);

// VEHICLE TYPE ROUTES
router.post('/superaccount/save-vehicle-type', adminsuperaccount.createVehicleType);
router.get('/superaccount/edit-vehicle-type/:id', adminsuperaccount.getVehicleTypeById);
router.put('/superaccount/update-vehicle-type/:id', adminsuperaccount.updateVehicleType);
router.delete('/superaccount/delete-vehicle-type/:id', adminsuperaccount.deleteVehicleType);

module.exports = router;