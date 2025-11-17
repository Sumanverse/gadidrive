// controller/admin/Amodel.js
const db = require('../../utils/dbutils');
const path = require('path');
const fs = require('fs');
const rootDir = require('../../utils/pathutil');
const Model = require('../../models/models');

// GET: Render Model Admin Page
const getadminmodel = async (req, res) => {
    try {
        const [models] = await db.execute(`
            SELECT m.*, v.vehicle_type_name, c.name AS category_name, b.name AS brand_name
            FROM models m
            JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
            JOIN categories c ON m.category_id = c.category_id
            JOIN brands b ON m.brand_id = b.brand_id
            ORDER BY m.created_at DESC
        `);

        const [vehicleTypes] = await db.execute(`SELECT * FROM vehicletype`);
        const [categories] = await db.execute(`SELECT * FROM categories`);
        const [brands] = await db.execute(`SELECT * FROM brands`);

        res.render('admin/Amodels', {
            title: 'USA - Model Admin',
            path: '/admin/model',
            models,
            vehicleTypes,
            categories,
            brands,
            model: null,
            details: null,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (err) {
        console.error('Error in getadminmodel:', err);
        req.flash('error_msg', 'Failed to load models.');
        res.redirect('/admin/model');
    }
};

// GET: Edit Model (Load form with data)
const getModelById = async (req, res) => {
    const modelId = req.params.modelId;
    try {
        const model = await Model.getModelById(modelId);
        const details = await Model.getModelDetails(modelId);

        const [vehicleTypes] = await db.execute(`SELECT * FROM vehicletype`);
        const [categories] = await db.execute(`SELECT * FROM categories`);
        const [brands] = await db.execute(`SELECT * FROM brands`);

        if (!model) {
            req.flash('error_msg', 'Model not found.');
            return res.redirect('/admin/model');
        }

        res.render('admin/Amodels', {
            title: 'Edit Model',
            path: '/admin/model',
            model,
            details,
            vehicleTypes,
            categories,
            brands,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (err) {
        console.error('Error in getModelById:', err);
        req.flash('error_msg', 'Failed to load model.');
        res.redirect('/admin/model');
    }
};

// POST: Create New Model
const postAdminModel = async (req, res) => {
    const {
        vehicleType, category, brand, modelName, safetyRating, safetyLink,
        engineType, startingPrice, status = 'import', addAnother
    } = req.body;

    const authorId = req.user.user_id;

    if (!vehicleType || !category || !brand || !modelName || !engineType || !startingPrice) {
        req.flash('error_msg', 'All required fields must be filled.');
        return res.redirect('/admin/model');
    }

    let vehicleTypeId, categoryId, brandId;
    try {
        [[{ vehicle_type_id: vehicleTypeId }]] = await db.execute(
            `SELECT vehicle_type_id FROM vehicletype WHERE vehicle_type_name = ?`, [vehicleType]
        );
        [[{ category_id: categoryId }]] = await db.execute(
            `SELECT category_id FROM categories WHERE name = ?`, [category]
        );
        [[{ brand_id: brandId }]] = await db.execute(
            `SELECT brand_id FROM brands WHERE name = ?`, [brand]
        );
    } catch (err) {
        req.flash('error_msg', 'Invalid selection for Vehicle Type, Category, or Brand.');
        return res.redirect('/admin/model');
    }

    if (!vehicleTypeId || !categoryId || !brandId) {
        req.flash('error_msg', 'Please select valid options.');
        return res.redirect('/admin/model');
    }

    const modelImageFile = req.files.find(f => f.fieldname === 'modelImage');
    const modelImagePath = modelImageFile ? modelImageFile.path.replace('public', '').replace(/\\/g, '/') : null;

    try {
        const modelId = await Model.createModel({
            name: modelName,
            vehicle_type_id: vehicleTypeId,
            category_id: categoryId,
            brand_id: brandId,
            safety_rating: safetyRating ? parseFloat(safetyRating) : null,
            safety_link: safetyLink || null,
            engine_type: engineType,
            starting_price: parseFloat(startingPrice.replace(/[^0-9.-]+/g, '')),
            status
        }, modelImagePath, authorId);

        await insertRelatedData(req, modelId);

        req.flash('success_msg', 'Model published successfully!');

        if (addAnother === '1') {
            return res.redirect('/admin/model');
        }
        res.redirect('/admin/model');
    } catch (err) {
        console.error('Error creating model:', err);
        req.flash('error_msg', err.message || 'Failed to publish model.');
        res.redirect('/admin/model');
    }
};

// UPDATE: Edit Model
const updateAdminModel = async (req, res) => {
    const modelId = req.params.modelId;
    const {
        vehicleType, category, brand, modelName, safetyRating, safetyLink,
        engineType, startingPrice, status = 'import', addAnother
    } = req.body;

    const authorId = req.user.user_id;

    try {
        const [oldModel] = await db.execute(`SELECT model_image FROM models WHERE id = ?`, [modelId]);
        const oldImage = oldModel[0]?.model_image;

        const newImageFile = req.files.find(f => f.fieldname === 'modelImage');
        const newImagePath = newImageFile ? newImageFile.path.replace('public', '').replace(/\\/g, '/') : oldImage;

        if (newImageFile && oldImage) {
            const oldPath = path.join(rootDir, 'public', oldImage);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const [[{ vehicle_type_id: vehicleTypeId }]] = await db.execute(
            `SELECT vehicle_type_id FROM vehicletype WHERE vehicle_type_name = ?`, [vehicleType]
        );
        const [[{ category_id: categoryId }]] = await db.execute(
            `SELECT category_id FROM categories WHERE name = ?`, [category]
        );
        const [[{ brand_id: brandId }]] = await db.execute(
            `SELECT brand_id FROM brands WHERE name = ?`, [brand]
        );

        await Model.updateModel(modelId, {
            name: modelName,
            vehicle_type_id: vehicleTypeId,
            category_id: categoryId,
            brand_id: brandId,
            safety_rating: safetyRating ? parseFloat(safetyRating) : null,
            safety_link: safetyLink || null,
            engine_type: engineType,
            starting_price: parseFloat(startingPrice.replace(/[^0-9.-]+/g, '')),
            status
        }, newImagePath, authorId);

        await Model.deleteRelatedDataOnly(modelId);
        await insertRelatedData(req, modelId);

        req.flash('success_msg', 'Model updated successfully!');

        if (addAnother === '1') {
            return res.redirect('/admin/model');
        }
        res.redirect('/admin/model');
    } catch (err) {
        console.error('Error in updateAdminModel:', err);
        req.flash('error_msg', err.message || 'Failed to update model.');
        res.redirect('/admin/model');
    }
};

// Helper: Insert all related data
const insertRelatedData = async (req, modelId) => {
    const { files } = req;

    // EXTERIOR
    const exteriorCount = parseInt(req.body.exteriorColorCount || '0');
    for (let i = 1; i <= exteriorCount; i++) {
        if (req.body[`exteriorColorName${i}`]) {
            const colorImage = files.find(f => f.fieldname === `exteriorColorImage${i}`);
            const colorId = await Model.createExteriorColor(modelId, {
                name: req.body[`exteriorColorName${i}`]
            }, colorImage ? colorImage.path.replace('public', '').replace(/\\/g, '/') : null);

            for (let j = 1; j <= 10; j++) {
                const img = files.find(f => f.fieldname === `exteriorAdditionalColorImage${i}_${j}`);
                if (img) await Model.createExteriorColorImage(colorId, img.path.replace('public', '').replace(/\\/g, '/'));
            }
        }
    }

    // INTERIOR
    const interiorCount = parseInt(req.body.interiorColorCount || '0');
    for (let i = 1; i <= interiorCount; i++) {
        if (req.body[`interiorColorName${i}`]) {
            const colorImage = files.find(f => f.fieldname === `interiorColorImage${i}`);
            const colorId = await Model.createInteriorColor(modelId, {
                name: req.body[`interiorColorName${i}`]
            }, colorImage ? colorImage.path.replace('public', '').replace(/\\/g, '/') : null);

            for (let j = 1; j <= 10; j++) {
                const img = files.find(f => f.fieldname === `interiorAdditionalColorImage${i}_${j}`);
                if (img) await Model.createInteriorColorImage(colorId, img.path.replace('public', '').replace(/\\/g, '/'));
            }
        }
    }

    // VARIANTS
    const variantCount = parseInt(req.body.variantCount || '0');
    for (let i = 1; i <= variantCount; i++) {
        if (req.body[`variantName${i}`] && req.body[`variantPrice${i}`]) {
            await Model.createVariant(modelId, {
                name: req.body[`variantName${i}`],
                price: parseFloat(req.body[`variantPrice${i}`].replace(/[^0-9.-]+/g, ''))
            });
        }
    }

    // SITES
    const siteCount = parseInt(req.body.siteCount || '0');
    for (let i = 1; i <= siteCount; i++) {
        if (req.body[`siteName${i}`] && req.body[`siteLink${i}`]) {
            await Model.createAvailableSite(modelId, {
                name: req.body[`siteName${i}`],
                link: req.body[`siteLink${i}`]
            });
        }
    }

    // ABOUT
    const aboutCount = parseInt(req.body.aboutContentCount || '0');
    for (let i = 1; i <= aboutCount; i++) {
        const type = req.body[`aboutContentType${i}`];
        if (!type) continue;
        if (type === 'article' && req.body[`aboutContent${i}`]) {
            await Model.createAboutContent(modelId, { type: 'article', value: req.body[`aboutContent${i}`] }, i);
        } else if (type === 'photo') {
            const photo = files.find(f => f.fieldname === `aboutPhoto${i}`);
            if (photo) {
                await Model.createAboutContent(modelId, {
                    type: 'photo',
                    image_path: photo.path.replace('public', '').replace(/\\/g, '/'),
                    source: req.body[`aboutSource${i}`] || null
                }, i);
            }
        } else if (type === 'link' && req.body[`aboutContent${i}`]) {
            await Model.createAboutContent(modelId, { type: 'link', value: req.body[`aboutContent${i}`] }, i);
        }
    }

    // SPECS
    const specCount = parseInt(req.body.specCount || '0');
    for (let s = 1; s <= specCount; s++) {
        if (!req.body[`specTitle${s}`]) continue;
        const specId = await Model.createSpecification(modelId, { title: req.body[`specTitle${s}`] });
        const listCount = parseInt(req.body[`specListCount${s}`] || '0');
        for (let l = 1; l <= listCount; l++) {
            if (!req.body[`specListTitle${s}_${l}`]) continue;
            const listId = await Model.createSpecificationList(specId, { title: req.body[`specListTitle${s}_${l}`] });
            const contentCount = parseInt(req.body[`specContentCount${s}_${l}`] || '0');
            for (let c = 1; c <= contentCount; c++) {
                const cType = req.body[`specContentType${s}_${l}_${c}`];
                if (!cType) continue;
                if (cType === 'article' && req.body[`specContent${s}_${l}_${c}`]) {
                    await Model.createSpecContent(listId, { type: 'article', value: req.body[`specContent${s}_${l}_${c}`] });
                } else if (cType === 'photo') {
                    const photo = files.find(f => f.fieldname === `specPhoto${s}_${l}_${c}`);
                    if (photo) {
                        await Model.createSpecContent(listId, {
                            type: 'photo',
                            image_path: photo.path.replace('public', '').replace(/\\/g, '/'),
                            source: req.body[`specSource${s}_${l}_${c}`] || null
                        });
                    }
                } else if (cType === 'link' && req.body[`specContent${s}_${l}_${c}`]) {
                    await Model.createSpecContent(listId, { type: 'link', value: req.body[`specContent${s}_${l}_${c}`] });
                }
            }
        }
    }
};

// DELETE: Delete Model
const deleteAdminModel = async (req, res) => {
    const modelId = req.params.modelId;
    try {
        await Model.deleteModel(modelId);
        req.flash('success_msg', 'Model deleted successfully.');
        res.redirect('/admin/model');
    } catch (err) {
        console.error('Error in deleteAdminModel:', err);
        req.flash('error_msg', 'Failed to delete model.');
        res.redirect('/admin/model');
    }
};

// GET FILTERED MODELS
const getFilteredModels = async (req, res) => {
    const { brandId, categoryId, vehicleTypeId } = req.query;
    try {
        let query = `SELECT m.*, b.name AS brand_name, c.name AS category_name, v.vehicle_type_name 
                     FROM models m
                     JOIN brands b ON m.brand_id = b.brand_id
                     JOIN categories c ON m.category_id = c.category_id
                     JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
                     WHERE 1=1`;
        const params = [];
        if (brandId) { query += ` AND m.brand_id = ?`; params.push(brandId); }
        if (categoryId) { query += ` AND m.category_id = ?`; params.push(categoryId); }
        if (vehicleTypeId) { query += ` AND m.vehicle_type_id = ?`; params.push(vehicleTypeId); }

        const [models] = await db.execute(query, params);
        res.json(models);
    } catch (err) {
        console.error('Error in getFilteredModels:', err);
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