const Brand = require('../../models/brands');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'public/uploads/brands';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`Created directory: ${uploadDir}`);
        }
        cb(null, uploadDir);
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
}).single('brandImage');

exports.getAdminBrand = async (req, res, next) => {
    try {
        const brands = await Brand.getAllBrands();
        console.log('Fetched brands:', brands); // Debug
        res.render('admin/Abrand', {
            brands,
            user: req.user,
            title: 'USA - Brand Admin'
        });
    } catch (error) {
        console.error('Error fetching admin brand page:', error);
        res.status(500).render('404', { title: 'Server Error', path: req.path });
    }
};

exports.postAdminBrand = async (req, res, next) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                console.error('Multer error:', err); // Debug Multer error
                return res.status(400).json({ success: false, message: err.message });
            }

            console.log('Request body:', req.body); // Debug body
            console.log('Request file:', req.file); // Debug file

            const { brandName, vehicleType } = req.body;
            const brandImage = req.file ? `/uploads/brands/${req.file.filename}` : null;
            const authorName = req.user.name;

            if (!brandName || !vehicleType) {
                return res.status(400).json({ success: false, message: 'Brand name and vehicle type are required.' });
            }

            const result = await Brand.createBrand(brandName, vehicleType, brandImage, authorName);
            console.log('Brand created with ID:', result); // Debug insert result
            res.json({ success: true, message: 'Brand created successfully.' });
        } catch (error) {
            console.error('Error creating brand:', error); // Detailed error logging
            res.status(500).json({ success: false, message: 'Server error while creating brand.' });
        }
    });
};

exports.getBrandById = async (req, res, next) => {
    try {
        const { brandId } = req.params;
        const brand = await Brand.getBrandById(brandId);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found.' });
        }
        res.json({ success: true, brand });
    } catch (error) {
        console.error('Error fetching brand by ID:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching brand.' });
    }
};

exports.updateAdminBrand = async (req, res, next) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({ success: false, message: err.message });
            }

            const { brandId, brandName, vehicleType } = req.body;
            const brandImage = req.file ? `/uploads/brands/${req.file.filename}` : null;
            const authorName = req.user.name;

            if (!brandId || !brandName || !vehicleType) {
                return res.status(400).json({ success: false, message: 'Brand ID, name, and vehicle type are required.' });
            }

            await Brand.updateBrand(brandId, brandName, vehicleType, brandImage, authorName);
            res.json({ success: true, message: 'Brand updated successfully.' });
        } catch (error) {
            console.error('Error updating brand:', error);
            res.status(500).json({ success: false, message: 'Server error while updating brand.' });
        }
    });
};

exports.deleteAdminBrand = async (req, res, next) => {
    try {
        const { brandId } = req.body;
        await Brand.deleteBrand(brandId);
        res.json({ success: true, message: 'Brand deleted successfully.' });
    } catch (error) {
        console.error('Error deleting brand:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting brand.' });
    }
};