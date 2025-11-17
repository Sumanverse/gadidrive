// controller/admin/superaccount.js
const UserDetails = require('../../models/userdetails');
const VehicleType = require('../../models/vehicletype');

// GET Super Account Page
exports.getadminsuperaccount = async (req, res, next) => {
    try {
        const [users, vehicleTypes] = await Promise.all([
            UserDetails.getAllUsers(),
            VehicleType.getAllVehicleTypes()
        ]);
        res.render('admin/superaccount', {
            title: 'Super Account',
            users: users || [],
            vehicleTypes: vehicleTypes || [],
            error: null
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('admin/superaccount', {
            title: 'Super Account',
            users: [],
            vehicleTypes: [],
            error: 'Failed to load data'
        });
    }
};

// USER OPERATIONS
exports.createUser = async (req, res, next) => {
    try {
        const userData = {
            name: req.body.name?.trim(),
            username: req.body.username?.trim(),
            password: req.body.password,
            position: req.body.position
        };
        if (!userData.name || !userData.username || !userData.password || !userData.position) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const profileImagePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;
        await UserDetails.createUser(userData, profileImagePath);
        res.json({ success: true, message: 'User created successfully!' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error creating user' });
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const user = await UserDetails.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const userData = {
            name: req.body.name?.trim(),
            username: req.body.username?.trim(),
            password: req.body.password || '',
            position: req.body.position
        };
        if (!userData.name || !userData.username || !userData.position) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const profileImagePath = req.file ? `/uploads/profiles/${req.file.filename}` : null;
        await UserDetails.updateUser(req.params.id, userData, profileImagePath);
        res.json({ success: true, message: 'User updated successfully!' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error updating user' });
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        await UserDetails.deleteUser(req.params.id);
        res.json({ success: true, message: 'User deleted successfully!' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
};

// VEHICLE TYPE OPERATIONS (Keep your original)
exports.createVehicleType = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    try {
        const vehicleTypeName = req.body.vehicleTypeName?.trim();
        if (!vehicleTypeName) {
            return res.status(400).json({ success: false, message: 'Vehicle type name is required' });
        }
        const vehicleImagePath = `/uploads/vehicle-types/${req.file.filename}`;
        await VehicleType.createVehicleType(vehicleTypeName, vehicleImagePath);
        res.json({ success: true, message: 'Vehicle type created successfully!' });
    } catch (error) {
        console.error('Error creating vehicle type:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.getVehicleTypeById = async (req, res, next) => {
    try {
        const vehicleType = await VehicleType.getVehicleTypeById(req.params.id);
        if (!vehicleType) {
            return res.status(404).json({ success: false, message: 'Vehicle type not found' });
        }
        res.json({ success: true, vehicleType });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching vehicle type' });
    }
};

exports.updateVehicleType = async (req, res, next) => {
    try {
        const vehicleTypeName = req.body.vehicleTypeName?.trim();
        if (!vehicleTypeName) {
            return res.status(400).json({ success: false, message: 'Vehicle type name is required' });
        }
        const vehicleImagePath = req.file ? `/uploads/vehicle-types/${req.file.filename}` : null;
        await VehicleType.updateVehicleType(req.params.id, vehicleTypeName, vehicleImagePath);
        res.json({ success: true, message: 'Vehicle type updated successfully!' });
    } catch (error) {
        console.error('Error updating vehicle type:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.deleteVehicleType = async (req, res, next) => {
    try {
        await VehicleType.deleteVehicleType(req.params.id);
        res.json({ success: true, message: 'Vehicle type deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting vehicle type' });
    }
};