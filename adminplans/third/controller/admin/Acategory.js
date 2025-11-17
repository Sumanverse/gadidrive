const Category = require('../../models/category');
const VehicleType = require('../../models/vechicletype');
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/categories');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpg, jpeg, png)!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('categoryImage');

exports.getAdminCategory = async (req, res, next) => {
    try {
        const vehicleTypes = await VehicleType.getAllVehicleTypes();
        const categories = await Category.getAllCategories();
        res.render('admin/Acategory', {
            vehicleTypes,
            categories,
            user: req.user,
            title: 'USA - Category Admin'
        });
    } catch (error) {
        console.error('Error fetching admin category page:', error);
        res.status(500).render('404', { title: 'Server Error', path: req.path });
    }
};

exports.postAdminCategory = async (req, res, next) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            const { categoryName, vehicleType } = req.body; // Updated to match form name="vehicleType"
            const categoryImage = req.file ? `/uploads/categories/${req.file.filename}` : null;
            const authorName = req.user.name; // Use req.user.name as per your auth setup

            if (!categoryName || !vehicleType) {
                return res.status(400).json({ success: false, message: 'Category name and vehicle type are required.' });
            }

            await Category.createCategory(categoryName, vehicleType, categoryImage, authorName);
            res.json({ success: true, message: 'Category created successfully.' });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ success: false, message: 'Server error while creating category.' });
        }
    });
};

exports.getCategoriesByVehicleType = async (req, res, next) => {
    try {
        const { vehicleTypeId } = req.params;
        const categories = await Category.getCategoriesByVehicleType(vehicleTypeId);
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error fetching categories by vehicle type:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching categories.' });
    }
};

exports.getCategoryById = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        res.json({ success: true, category });
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching category.' });
    }
};

exports.updateAdminCategory = async (req, res, next) => {
    upload(req, res, async (err) => { // Use upload middleware for image update
        try {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            const { categoryId, categoryName, vehicleType } = req.body; // Updated to match form name="vehicleType"
            const categoryImage = req.file ? `/uploads/categories/${req.file.filename}` : null;
            const authorName = req.user.name;

            if (!categoryId || !categoryName || !vehicleType) {
                return res.status(400).json({ success: false, message: 'Category ID, name, and vehicle type are required.' });
            }

            await Category.updateCategory(categoryId, categoryName, vehicleType, categoryImage, authorName);
            res.json({ success: true, message: 'Category updated successfully.' });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, message: 'Server error while updating category.' });
        }
    });
};

exports.deleteAdminCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.body;
        await Category.deleteCategory(categoryId);
        res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting category.' });
    }
};