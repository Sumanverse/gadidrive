// controller/admin/Abrand.js
const Brand = require('../../models/brands');
const VehicleType = require('../../models/vehicletype');
const upload = require('../../utils/uploadbrand');

exports.getAdminBrand = async (req, res) => {
    try {
        const [brands, vehicleTypes] = await Promise.all([
            Brand.getAllBrands(),
            VehicleType.getAllVehicleTypes()
        ]);

        res.render('admin/Abrand', {
            brands,
            vehicleTypes,
            user: req.user,
            title: 'USA - Brand Admin'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('500', { title: 'Server Error' });
    }
};

exports.postAdminBrand = (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) return res.status(400).json({ success: false, message: err.message });

            const { brandName, vehicleType } = req.body;
            const brandImage = req.file ? `/uploads/brands/${req.file.filename}` : null;
            const authorName = req.user.name;

            if (!brandName || !vehicleType) {
                return res.status(400).json({ success: false, message: 'Brand name and vehicle type required.' });
            }

            await Brand.createBrand(brandName, vehicleType, brandImage, authorName);
            res.json({ success: true, message: 'Brand created!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
};

exports.getBrandById = async (req, res) => {
    try {
        const brand = await Brand.getBrandById(req.params.brandId);
        if (!brand) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, brand });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateAdminBrand = (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) return res.status(400).json({ success: false, message: err.message });

            const { brandId, brandName, vehicleType } = req.body;
            const brandImage = req.file ? `/uploads/brands/${req.file.filename}` : null;
            const authorName = req.user.name;

            await Brand.updateBrand(brandId, brandName, vehicleType, brandImage, authorName);
            res.json({ success: true, message: 'Brand updated!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
};

exports.deleteAdminBrand = async (req, res) => {
    try {
        await Brand.deleteBrand(req.body.brandId);
        res.json({ success: true, message: 'Brand deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};