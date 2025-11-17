const UserDetails = require('../../models/userdetails');
const VehicleType = require('../../models/vechicletype');
const multer = require('multer');
const path = require('path');

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profile_picture') {
            cb(null, 'public/uploads/profiles/');
        } else if (file.fieldname === 'vechicle_type_photo') {
            cb(null, 'public/uploads/vehicle-types/');
        } else {
            cb(new Error('Invalid file field'), false);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// ========================================
// GET Super Account Page
// ========================================
exports.getadminsuperaccount = async (req, res, next) => {
    try {
        const [users, vehicleTypes] = await Promise.all([
            UserDetails.getAllUsers(),
            VehicleType.getAllVehicleTypes()
        ]);
        
        res.render('admin/superaccount', {
            title: 'Super Account',
            users: users,
            vehicleTypes: vehicleTypes
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('admin/superaccount', {
            title: 'Super Account',
            users: [],
            vehicleTypes: []
        });
    }
};

// ========================================
// USER OPERATIONS
// ========================================

// CREATE User
exports.createUser = async (req, res, next) => {
    try {
        upload.single('profile_picture')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            try {
                const userData = {
                    name: req.body.name,
                    username: req.body.username,
                    password: req.body.password, // TODO: Hash in production
                    position: req.body.position,
                    social_media_link: req.body.social_media_link || null,
                    bio: req.body.bio || null
                };

                const profileImagePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;
                await UserDetails.createUser(userData, profileImagePath);
                
                res.json({ 
                    success: true, 
                    message: 'User created successfully!' 
                });
            } catch (dbError) {
                console.error('Database Error:', dbError);
                res.status(400).json({ 
                    success: false, 
                    message: dbError.message || 'Error creating user' 
                });
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error creating user' 
        });
    }
};

// GET User by ID (for Edit)
exports.getUserById = async (req, res, next) => {
    try {
        const user = await UserDetails.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        res.json({ 
            success: true, 
            user: user 
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user' 
        });
    }
};

// UPDATE User
exports.updateUser = async (req, res, next) => {
    try {
        upload.single('profile_picture')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            try {
                const userData = {
                    name: req.body.name,
                    username: req.body.username,
                    password: req.body.password,
                    position: req.body.position,
                    social_media_link: req.body.social_media_link || null,
                    bio: req.body.bio || null
                };

                const profileImagePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;
                await UserDetails.updateUser(req.params.id, userData, profileImagePath);
                
                res.json({ 
                    success: true, 
                    message: 'User updated successfully!' 
                });
            } catch (dbError) {
                console.error('Database Error:', dbError);
                res.status(400).json({ 
                    success: false, 
                    message: dbError.message || 'Error updating user' 
                });
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating user' 
        });
    }
};

// DELETE User
exports.deleteUser = async (req, res, next) => {
    try {
        await UserDetails.deleteUser(req.params.id);
        res.json({ 
            success: true, 
            message: 'User deleted successfully!' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting user' 
        });
    }
};

// ========================================
// VEHICLE TYPE OPERATIONS
// ========================================

// CREATE Vehicle Type
exports.createVehicleType = async (req, res, next) => {
    try {
        upload.single('vechicle_type_photo')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            try {
                const vehicleImagePath = req.file ? `/uploads/vehicle-types/${req.file.filename}` : null;
                await VehicleType.createVehicleType(req.body.vehicleTypeName, vehicleImagePath);
                
                res.json({ 
                    success: true, 
                    message: 'Vehicle type created successfully!' 
                });
            } catch (dbError) {
                console.error('Database Error:', dbError);
                res.status(400).json({ 
                    success: false, 
                    message: dbError.message || 'Error creating vehicle type' 
                });
            }
        });
    } catch (error) {
        console.error('Error creating vehicle type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error creating vehicle type' 
        });
    }
};

// GET Vehicle Type by ID (for Edit)
exports.getVehicleTypeById = async (req, res, next) => {
    try {
        const vehicleType = await VehicleType.getVehicleTypeById(req.params.id);
        if (!vehicleType) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vehicle type not found' 
            });
        }
        res.json({ 
            success: true, 
            vehicleType: vehicleType 
        });
    } catch (error) {
        console.error('Error fetching vehicle type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching vehicle type' 
        });
    }
};

// UPDATE Vehicle Type
exports.updateVehicleType = async (req, res, next) => {
    try {
        upload.single('vechicle_type_photo')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            try {
                const vehicleImagePath = req.file ? `/uploads/vehicle-types/${req.file.filename}` : null;
                await VehicleType.updateVehicleType(req.params.id, req.body.vehicleTypeName, vehicleImagePath);
                
                res.json({ 
                    success: true, 
                    message: 'Vehicle type updated successfully!' 
                });
            } catch (dbError) {
                console.error('Database Error:', dbError);
                res.status(400).json({ 
                    success: false, 
                    message: dbError.message || 'Error updating vehicle type' 
                });
            }
        });
    } catch (error) {
        console.error('Error updating vehicle type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating vehicle type' 
        });
    }
};

// DELETE Vehicle Type
exports.deleteVehicleType = async (req, res, next) => {
    try {
        await VehicleType.deleteVehicleType(req.params.id);
        res.json({ 
            success: true, 
            message: 'Vehicle type deleted successfully!' 
        });
    } catch (error) {
        console.error('Error deleting vehicle type:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting vehicle type' 
        });
    }
};