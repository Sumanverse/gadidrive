const UserDetails = require('../../models/userdetails');
const VehicleType = require('../../models/vehicletype');
const Article = require('../../models/Article');
const Category = require('../../models/category');
const Brand = require('../../models/brands');
const Model = require('../../models/models');

// GET Super Account Page
exports.getadminsuperaccount = async (req, res, next) => {
    try {
        const [users, vehicleTypes, articles, categories, brands, models] = await Promise.all([
            UserDetails.getAllUsers().catch(err => { console.error('Error fetching users:', err); return []; }),
            VehicleType.getAllVehicleTypes().catch(err => { console.error('Error fetching vehicle types:', err); return []; }),
            Article.findAll().catch(err => { console.error('Error fetching articles:', err); return []; }),
            Category.getAllCategories().catch(err => { console.error('Error fetching categories:', err); return []; }),
            Brand.getAllBrands().catch(err => { console.error('Error fetching brands:', err); return []; }),
            this.getAllModels().catch(err => { console.error('Error fetching models:', err); return []; })
        ]);
        
        res.render('admin/superaccount', {
            title: 'Super Account',
            users: users || [],
            vehicleTypes: vehicleTypes || [],
            articles: articles || [],
            categories: categories || [],
            brands: brands || [],
            models: models || [],
            error: null
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('admin/superaccount', {
            title: 'Super Account',
            users: [],
            vehicleTypes: [],
            articles: [],
            categories: [],
            brands: [],
            models: [],
            error: 'Failed to load data'
        });
    }
};

// Get all models for dashboard
exports.getAllModels = async () => {
    try {
        const db = require('../../utils/dbutils');
        const connection = await db.getConnection();
        const [rows] = await connection.execute(`
            SELECT m.*, v.vehicle_type_name, c.name AS category_name,
                   b.name AS brand_name, u.name AS author_name
            FROM models m
            JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
            JOIN categories c ON m.category_id = c.category_id
            JOIN brands b ON m.brand_id = b.brand_id
            JOIN usertable u ON m.author_id = u.user_id
            ORDER BY m.published_date DESC
        `);
        connection.release();
        return rows;
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
};

// Get content data for AJAX requests
exports.getContentData = async (req, res, next) => {
    try {
        const type = req.params.type;
        let data = [];

        switch (type) {
            case 'category':
                data = await Category.getAllCategories();
                break;
            case 'brand':
                data = await Brand.getAllBrands();
                break;
            case 'model':
                data = await this.getAllModels();
                break;
            case 'news':
                data = await Article.findAll();
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid content type' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching content data:', error);
        res.status(500).json({ success: false, message: 'Failed to load data' });
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

// VEHICLE TYPE OPERATIONS
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