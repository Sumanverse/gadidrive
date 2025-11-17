// controller/admin/Amodel.js
const fs = require('fs');
const path = require('path');
const rootDir = require('../../utils/pathutil');
const Brand = require('../../models/brands');
const Category = require('../../models/category');
const Model = require('../../models/models');
const VehicleType = require('../../models/vehicletype');

const getadminmodel = async (req, res) => {
    try {
        const models = await Model.findAll({
            include: [
                { model: Brand, attributes: ['name'] },
                { model: Category, attributes: ['name'] },
                { model: VehicleType, attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.render('admin/models', {
            title: 'Manage Models',
            path: '/admin/model',
            models,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to load models.');
        res.redirect('/admin/model');
    }
};

const postAdminModel = async (req, res) => {
    const { name, brandId, categoryId, vehicleTypeId } = req.body;
    const image = req.file ? `/uploads/models/${req.file.filename}` : null;

    try {
        await Model.create({ name, brandId, categoryId, vehicleTypeId, image });
        req.flash('success_msg', 'Model added successfully.');
        res.redirect('/admin/model');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to add model.');
        res.redirect('/admin/model');
    }
};

const getModelById = async (req, res) => {
    try {
        const model = await Model.findByPk(req.params.modelId, {
            include: [Brand, Category, VehicleType]
        });
        if (!model) {
            req.flash('error_msg', 'Model not found.');
            return res.redirect('/admin/model');
        }
        res.json(model);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAdminModel = async (req, res) => {
    const { modelId } = req.params;
    const { name, brandId, categoryId, vehicleTypeId } = req.body;
    let image = null;

    try {
        const model = await Model.findByPk(modelId);
        if (!model) {
            req.flash('error_msg', 'Model not found.');
            return res.redirect('/admin/model');
        }

        if (req.file) {
            // Delete old image
            if (model.image) {
                const oldPath = path.join(rootDir, 'public', model.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            image = `/uploads/models/${req.file.filename}`;
        } else {
            image = model.image;
        }

        await model.update({ name, brandId, categoryId, vehicleTypeId, image });
        req.flash('success_msg', 'Model updated successfully.');
        res.redirect('/admin/model');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to update model.');
        res.redirect('/admin/model');
    }
};

const deleteAdminModel = async (req, res) => {
    const { modelId } = req.body;

    try {
        const model = await Model.findByPk(modelId);
        if (!model) {
            req.flash('error_msg', 'Model not found.');
            return res.redirect('/admin/model');
        }

        // Delete image
        if (model.image) {
            const imgPath = path.join(rootDir, 'public', model.image);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        await model.destroy();
        req.flash('success_msg', 'Model deleted successfully.');
        res.redirect('/admin/model');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to delete model.');
        res.redirect('/admin/model');
    }
};

const getFilteredModels = async (req, res) => {
    const { brandId, categoryId, vehicleTypeId } = req.query;

    try {
        const where = {};
        if (brandId) where.brandId = brandId;
        if (categoryId) where.categoryId = categoryId;
        if (vehicleTypeId) where.vehicleTypeId = vehicleTypeId;

        const models = await Model.findAll({
            where,
            include: [Brand, Category, VehicleType]
        });

        res.json(models);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getadminmodel,
    postAdminModel,
    getModelById,
    updateAdminModel,
    deleteAdminModel,
    getFilteredModels
};