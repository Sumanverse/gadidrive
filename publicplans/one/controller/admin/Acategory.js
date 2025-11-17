// controller/admin/Acategory.js
const Category = require('../../models/category');
const VehicleType = require('../../models/vehicletype');
const upload = require('../../utils/uploadcategory');

exports.getAdminCategory = async (req, res, next) => {
    try {
        const vehicleTypes = await VehicleType.getAllVehicleTypes();
        const categories = await Category.getAllCategories();

        console.log('Vehicle Types:', vehicleTypes);
        console.log('Categories:', categories);

        res.render('admin/Acategory', {
            vehicleTypes,
            categories,
            user: req.user,
            title: 'USA - Category Admin'
        });
    } catch (error) {
        console.error('Error fetching admin category page:', error);
        res.status(500).render('500', { title: 'Server Error' });
    }
};

exports.postAdminCategory = (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            const { categoryName, vehicleType } = req.body;
            const categoryImage = req.file ? `/uploads/categories/${req.file.filename}` : null;
            const authorName = req.user.name;

            console.log('POST Data:', { categoryName, vehicleType, categoryImage });

            if (!categoryName || !vehicleType) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name and vehicle type are required.'
                });
            }

            await Category.createCategory(categoryName, vehicleType, categoryImage, authorName);
            res.json({ success: true, message: 'Category created successfully!' });
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    });
};

// बाँकी functions (get, update, delete) उस्तै छन्...
exports.getCategoriesByVehicleType = async (req, res) => {
    try {
        const { vehicleTypeId } = req.params;
        const categories = await Category.getCategoriesByVehicleType(vehicleTypeId);
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.getCategoryById(categoryId);
        if (!category) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.updateAdminCategory = (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) return res.status(400).json({ success: false, message: err.message });
            const { categoryId, categoryName, vehicleType } = req.body;
            const categoryImage = req.file ? `/uploads/categories/${req.file.filename}` : null;
            const authorName = req.user.name;

            if (!categoryId || !categoryName || !vehicleType) {
                return res.status(400).json({ success: false, message: 'All fields required.' });
            }

            await Category.updateCategory(categoryId, categoryName, vehicleType, categoryImage, authorName);
            res.json({ success: true, message: 'Updated!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    });
};

exports.deleteAdminCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        await Category.deleteCategory(categoryId);
        res.json({ success: true, message: 'Deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};