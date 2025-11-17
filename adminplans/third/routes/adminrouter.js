const express = require('express');
const router = express.Router();
const adminarticle = require('../controller/admin/Aarticle');
const adminbrand = require('../controller/admin/Abrand');
const admincategory = require('../controller/admin/Acategory');
const adminmodel = require('../controller/admin/Amodel');
const adminlevelam = require('../controller/admin/level3am');
const adminsuperaccount = require('../controller/admin/superaccount');

// Middleware to check authentication (using JWT-based auth)
const auth = require('../middleware/auth');

// Routes
router.get('/article', auth, adminarticle.getadminarticle);

router.get('/brand', auth, adminbrand.getAdminBrand);
router.post('/brand', auth, adminbrand.postAdminBrand);
router.get('/brand/:brandId', auth, adminbrand.getBrandById);
router.post('/brand/update', auth, adminbrand.updateAdminBrand);
router.post('/brand/delete', auth, adminbrand.deleteAdminBrand);

router.get('/category', auth, admincategory.getAdminCategory);
router.post('/category', auth, admincategory.postAdminCategory);
router.get('/categories/vehicle-type/:vehicleTypeId', auth, admincategory.getCategoriesByVehicleType);
router.get('/category/:categoryId', auth, admincategory.getCategoryById);
router.post('/category/update', auth, admincategory.updateAdminCategory);
router.post('/category/delete', auth, admincategory.deleteAdminCategory);

router.get('/model', auth, adminmodel.getadminmodel);

router.get('/level3am', auth, adminlevelam.getadminlevelam);

router.get('/superaccount', auth, adminsuperaccount.getadminsuperaccount);
router.post('/superaccount/save-user', auth, adminsuperaccount.createUser);
router.get('/superaccount/edit-user/:id', auth, adminsuperaccount.getUserById);
router.put('/superaccount/update-user/:id', auth, adminsuperaccount.updateUser);
router.delete('/superaccount/delete-user/:id', auth, adminsuperaccount.deleteUser);
router.post('/superaccount/save-vehicle-type', auth, adminsuperaccount.createVehicleType);
router.get('/superaccount/edit-vehicle-type/:id', auth, adminsuperaccount.getVehicleTypeById);
router.put('/superaccount/update-vehicle-type/:id', auth, adminsuperaccount.updateVehicleType);
router.delete('/superaccount/delete-vehicle-type/:id', auth, adminsuperaccount.deleteVehicleType);

module.exports = router;