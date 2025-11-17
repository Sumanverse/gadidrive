// routes/adminrouter.js
const express = require('express');
const router = express.Router();

// Controllers
const adminarticle = require('../controller/admin/Aarticle');
const adminbrand = require('../controller/admin/Abrand');
const admincategory = require('../controller/admin/Acategory');
const adminmodel = require('../controller/admin/Amodel'); // Fixed typo: Amodels → Amodels
const adminlevelam = require('../controller/admin/level3am');
const adminsuperaccount = require('../controller/admin/superaccount');

// Middleware
const auth = require('../middleware/auth');

// UPLOAD MIDDLEWARES
const uploadAdmin = require('../utils/uploadadmin');       
const uploadVehicle = require('../utils/uploadVehicle'); 
const uploadModels = require('../utils/uploadmodels');

// =======================
// ARTICLE ROUTES
// =======================
router.get('/article', auth, adminarticle.getadminarticle);

// =======================
// BRAND ROUTES
// =======================
router.get('/brand', auth, adminbrand.getAdminBrand);
router.post('/brand', auth, adminbrand.postAdminBrand);
router.get('/brand/:brandId', auth, adminbrand.getBrandById);
router.post('/brand/update', auth, adminbrand.updateAdminBrand);
router.post('/brand/delete', auth, adminbrand.deleteAdminBrand);

// =======================
// CATEGORY ROUTES
// =======================
router.get('/category', auth, admincategory.getAdminCategory);
router.post('/category', auth, admincategory.postAdminCategory);
router.get('/categories/vehicle-type/:vehicleTypeId', auth, admincategory.getCategoriesByVehicleType);
router.get('/category/:categoryId', auth, admincategory.getCategoryById);
router.post('/category/update', auth, admincategory.updateAdminCategory);
router.post('/category/delete', auth, admincategory.deleteAdminCategory);

// =======================
// MODEL ROUTES
// =======================
router.get('/model', auth, adminmodel.getadminmodel);
router.post('/model', auth, uploadModels, adminmodel.postAdminModel);
router.get('/model/:modelId', auth, adminmodel.getModelById);
router.post('/model/update/:modelId', auth, uploadModels, adminmodel.updateAdminModel);
router.post('/model/delete/:modelId', auth, adminmodel.deleteAdminModel);
router.get('/models', auth, adminmodel.getFilteredModels);

// =======================
// LEVEL 3 AM ROUTE
// =======================
router.get('/level3am', auth, adminlevelam.getadminlevelam);

// =======================
// SUPERACCOUNT ROUTES
// =======================
router.get('/superaccount', auth, adminsuperaccount.getadminsuperaccount);

// USER OPERATIONS
router.post('/superaccount/save-user', auth, uploadAdmin, adminsuperaccount.createUser);
router.get('/superaccount/edit-user/:id', auth, adminsuperaccount.getUserById);
router.put('/superaccount/update-user/:id', auth, uploadAdmin, adminsuperaccount.updateUser);
router.delete('/superaccount/delete-user/:id', auth, adminsuperaccount.deleteUser);

// VEHICLE TYPE OPERATIONS
router.post('/superaccount/save-vehicle-type', auth, uploadVehicle, adminsuperaccount.createVehicleType);
router.get('/superaccount/edit-vehicle-type/:id', auth, adminsuperaccount.getVehicleTypeById);
router.put('/superaccount/update-vehicle-type/:id', auth, uploadVehicle, adminsuperaccount.updateVehicleType);
router.delete('/superaccount/delete-vehicle-type/:id', auth, adminsuperaccount.deleteVehicleType);

module.exports = router;