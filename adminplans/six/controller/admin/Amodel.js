const Model = require('../../models/models');
const VechicleType = require('../../models/vehicletype');
const Category = require('../../models/category');
const Brand = require('../../models/brands');
const db = require('../../utils/dbutils');
const path = require('path');

exports.getadminmodel = async (req, res, next) => {
    try {
        const vehicleTypes = await VechicleType.getAllVehicleTypes();
        const categories = await Category.getAllCategories();
        const brands = await Brand.getAllBrands();
        const models = await Model.getAllModels();
        
        res.render('admin/Amodel', {
            title: 'USA - Model Admin',
            vehicleTypes,
            categories,
            brands,
            models,
            user: req.user,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error fetching model data:', error);
        req.flash('error_msg', 'Failed to load model admin page: ' + error.message);
        res.redirect('/admin/model');
    }
};

exports.postAdminModel = async (req, res, next) => {
    try {
        const authorId = req.user?.user_id;
        if (!authorId) {
            req.flash('error_msg', 'Please login to create a model');
            return res.redirect('/admin/login');
        }

        const {
            vehicleType, category, brand, modelName, safetyRating, safetyLink,
            engineType, startingPrice, status
        } = req.body;

        if (!vehicleType || !category || !brand || !modelName || !engineType || !startingPrice) {
            throw new Error('All required fields (Vehicle Type, Category, Brand, Model Name, Engine Type, Starting Price) must be provided');
        }

        const [vehicleTypeRow] = await db.execute(
            `SELECT vechicle_type_id FROM vechicletype WHERE vechicle_type_name = ?`,
            [vehicleType]
        );
        if (!vehicleTypeRow[0]) throw new Error(`Invalid vehicle type: ${vehicleType}`);
        const vehicle_type_id = vehicleTypeRow[0].vechicle_type_id;

        const [categoryRow] = await db.execute(
            `SELECT category_id FROM categories WHERE name = ? AND vehicle_type_id = ?`,
            [category, vehicle_type_id]
        );
        if (!categoryRow[0]) throw new Error(`Invalid category: ${category} for vehicle type ${vehicleType}`);
        const category_id = categoryRow[0].category_id;

        const [brandRow] = await db.execute(
            `SELECT brand_id FROM brands WHERE name = ? AND vehicle_type_id = ?`,
            [brand, vehicle_type_id]
        );
        if (!brandRow[0]) throw new Error(`Invalid brand: ${brand} for vehicle type ${vehicleType}`);
        const brand_id = brandRow[0].brand_id;

        const modelImageFile = req.files?.find(f => f.fieldname === 'modelImage');
        const modelImagePath = modelImageFile ? path.join('uploads/models', modelImageFile.filename).replace(/\\/g, '/') : null;

        const modelData = {
            name: modelName,
            vehicle_type_id,
            category_id,
            brand_id,
            safety_rating: safetyRating && safetyRating !== '' ? parseFloat(safetyRating) : null,
            safety_link: safetyLink || null,
            engine_type: engineType,
            starting_price: parseFloat(startingPrice),
            status: status || 'import'
        };

        const modelId = await Model.createModel(modelData, modelImagePath, authorId);

        const exteriorColors = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('exteriorColorName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                if (name) {
                    exteriorColors.push({
                        name,
                        image: req.files?.find(f => f.fieldname === `exteriorColorImage${index}`),
                        additionalImages: req.files?.filter(f => f.fieldname.startsWith(`exteriorAdditionalColorImage${index}_`)) || []
                    });
                }
            }
        });
        for (const color of exteriorColors) {
            const colorImagePath = color.image ? path.join('uploads/exterior_colors', color.image.filename).replace(/\\/g, '/') : null;
            const exteriorColorId = await Model.createExteriorColor(modelId, { name: color.name }, colorImagePath);
            for (const img of color.additionalImages) {
                const imgPath = img ? path.join('uploads/exterior_colors', img.filename).replace(/\\/g, '/') : null;
                if (imgPath) await Model.createExteriorColorImage(exteriorColorId, imgPath);
            }
        }

        const interiorColors = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('interiorColorName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                if (name) {
                    interiorColors.push({
                        name,
                        image: req.files?.find(f => f.fieldname === `interiorColorImage${index}`),
                        additionalImages: req.files?.filter(f => f.fieldname.startsWith(`interiorAdditionalColorImage${index}_`)) || []
                    });
                }
            }
        });
        for (const color of interiorColors) {
            const colorImagePath = color.image ? path.join('uploads/interior_colors', color.image.filename).replace(/\\/g, '/') : null;
            const interiorColorId = await Model.createInteriorColor(modelId, { name: color.name }, colorImagePath);
            for (const img of color.additionalImages) {
                const imgPath = img ? path.join('uploads/interior_colors', img.filename).replace(/\\/g, '/') : null;
                if (imgPath) await Model.createInteriorColorImage(interiorColorId, imgPath);
            }
        }

        const variants = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('variantName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                const price = req.body[`variantPrice${index}`];
                if (name && price) variants.push({ name, price: parseFloat(price) });
            }
        });
        for (const variant of variants) await Model.createVariant(modelId, variant);

        const sites = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('siteName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                const link = req.body[`siteLink${index}`];
                if (name && link) sites.push({ name, link });
            }
        });
        for (const site of sites) await Model.createAvailableSite(modelId, site);

        const specifications = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('specTitle')) {
                const index = key.match(/\d+$/)?.[0];
                const title = req.body[key];
                if (title) {
                    const spec = { title, lists: [] };
                    Object.keys(req.body).forEach(listKey => {
                        if (listKey.startsWith(`specListTitle${index}_`)) {
                            const listIndex = listKey.match(/_(\d+)$/)?.[1];
                            const listTitle = req.body[listKey];
                            if (listTitle) {
                                const list = { title: listTitle, contents: [] };
                                Object.keys(req.body).forEach(contentKey => {
                                    if (contentKey.startsWith(`specContent${index}_${listIndex}_`)) {
                                        const contentIndex = contentKey.match(/_(\d+)$/)?.[1];
                                        const contentType = req.body[`specContentType${index}_${listIndex}_${contentIndex}`];
                                        if (contentType) {
                                            const content = {
                                                type: contentType,
                                                value: contentType === 'article' || contentType === 'link' ? req.body[contentKey] || null : null,
                                                image_path: contentType === 'photo' ? (req.files?.find(f => f.fieldname === `specPhoto${index}_${listIndex}_${contentIndex}`)?.filename ? path.join('uploads/specifications', req.files.find(f => f.fieldname === `specPhoto${index}_${listIndex}_${contentIndex}`).filename).replace(/\\/g, '/') : null) : null,
                                                source: contentType === 'photo' ? req.body[`specSource${index}_${listIndex}_${contentIndex}`] || null : null
                                            };
                                            if (content.value || content.image_path) list.contents.push(content);
                                        }
                                    }
                                });
                                if (list.contents.length > 0) spec.lists.push(list);
                            }
                        }
                    });
                    if (spec.lists.length > 0) specifications.push(spec);
                }
            }
        });
        for (const spec of specifications) {
            const specId = await Model.createSpecification(modelId, { title: spec.title });
            for (const list of spec.lists) {
                const listId = await Model.createSpecificationList(specId, { title: list.title });
                for (const content of list.contents) await Model.createSpecContent(listId, content);
            }
        }

        const aboutContents = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('aboutContent')) {
                const index = key.match(/\d+$/)?.[0];
                const contentType = req.body[`aboutContentType${index}`];
                if (contentType) {
                    const content = {
                        type: contentType,
                        value: contentType === 'article' || contentType === 'link' ? req.body[`aboutContent${index}`] || null : null,
                        image_path: contentType === 'photo' ? (req.files?.find(f => f.fieldname === `aboutPhoto${index}`)?.filename ? path.join('uploads/about_contents', req.files.find(f => f.fieldname === `aboutPhoto${index}`).filename).replace(/\\/g, '/') : null) : null,
                        source: contentType === 'photo' ? req.body[`aboutSource${index}`] || null : null
                    };
                    if (content.value || content.image_path) aboutContents.push(content);
                }
            }
        });
        for (let i = 0; i < aboutContents.length; i++) await Model.createAboutContent(modelId, aboutContents[i], i + 1);

        req.flash('success_msg', 'Model created successfully!');
        res.redirect('/admin/model');
    } catch (error) {
        console.error('Error creating model:', error);
        req.flash('error_msg', error.message);
        res.redirect('/admin/model');
    }
};

exports.getModelById = async (req, res, next) => {
    try {
        const modelId = req.params.modelId;
        const model = await Model.getModelById(modelId);
        if (!model) throw new Error('Model not found');
        const details = await Model.getModelDetails(modelId);
        const vehicleTypes = await VechicleType.getAllVehicleTypes();
        const categories = await Category.getAllCategories();
        const brands = await Brand.getAllBrands();
        const models = await Model.getAllModels();
        
        res.render('admin/Amodel', {
            title: `Edit Model - ${model.model_name}`,
            model,
            details,
            vehicleTypes,
            categories,
            brands,
            models,
            user: req.user,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error fetching model:', error);
        req.flash('error_msg', 'Failed to load model: ' + error.message);
        res.redirect('/admin/model');
    }
};

exports.updateAdminModel = async (req, res, next) => {
    try {
        const modelId = req.params.modelId;
        const authorId = req.user?.user_id;
        if (!authorId) {
            req.flash('error_msg', 'Please login to update a model');
            return res.redirect('/admin/login');
        }

        const {
            vehicleType, category, brand, modelName, safetyRating, safetyLink,
            engineType, startingPrice, status
        } = req.body;

        if (!vehicleType || !category || !brand || !modelName || !engineType || !startingPrice) {
            throw new Error('All required fields (Vehicle Type, Category, Brand, Model Name, Engine Type, Starting Price) must be provided');
        }

        const [vehicleTypeRow] = await db.execute(
            `SELECT vechicle_type_id FROM vechicletype WHERE vechicle_type_name = ?`,
            [vehicleType]
        );
        if (!vehicleTypeRow[0]) throw new Error(`Invalid vehicle type: ${vehicleType}`);
        const vehicle_type_id = vehicleTypeRow[0].vechicle_type_id;

        const [categoryRow] = await db.execute(
            `SELECT category_id FROM categories WHERE name = ? AND vehicle_type_id = ?`,
            [category, vehicle_type_id]
        );
        if (!categoryRow[0]) throw new Error(`Invalid category: ${category} for vehicle type ${vehicleType}`);
        const category_id = categoryRow[0].category_id;

        const [brandRow] = await db.execute(
            `SELECT brand_id FROM brands WHERE name = ? AND vehicle_type_id = ?`,
            [brand, vehicle_type_id]
        );
        if (!brandRow[0]) throw new Error(`Invalid brand: ${brand} for vehicle type ${vehicleType}`);
        const brand_id = brandRow[0].brand_id;

        const modelImageFile = req.files?.find(f => f.fieldname === 'modelImage');
        const modelImagePath = modelImageFile ? path.join('uploads/models', modelImageFile.filename).replace(/\\/g, '/') : null;

        const modelData = {
            name: modelName,
            vehicle_type_id,
            category_id,
            brand_id,
            safety_rating: safetyRating && safetyRating !== '' ? parseFloat(safetyRating) : null,
            safety_link: safetyLink || null,
            engine_type: engineType,
            starting_price: parseFloat(startingPrice),
            status: status || 'import'
        };
        await Model.updateModel(modelId, modelData, modelImagePath, authorId);

        await db.execute(`DELETE FROM exterior_colors WHERE model_id = ?`, [modelId]);
        await db.execute(`DELETE FROM interior_colors WHERE model_id = ?`, [modelId]);
        await db.execute(`DELETE FROM variants WHERE model_id = ?`, [modelId]);
        await db.execute(`DELETE FROM available_sites WHERE model_id = ?`, [modelId]);
        await db.execute(`DELETE FROM specifications WHERE model_id = ?`, [modelId]);
        await db.execute(`DELETE FROM about_contents WHERE model_id = ?`, [modelId]);

        const exteriorColors = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('exteriorColorName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                if (name) {
                    exteriorColors.push({
                        name,
                        image: req.files?.find(f => f.fieldname === `exteriorColorImage${index}`),
                        additionalImages: req.files?.filter(f => f.fieldname.startsWith(`exteriorAdditionalColorImage${index}_`)) || []
                    });
                }
            }
        });
        for (const color of exteriorColors) {
            const colorImagePath = color.image ? path.join('uploads/exterior_colors', color.image.filename).replace(/\\/g, '/') : null;
            const exteriorColorId = await Model.createExteriorColor(modelId, { name: color.name }, colorImagePath);
            for (const img of color.additionalImages) {
                const imgPath = img ? path.join('uploads/exterior_colors', img.filename).replace(/\\/g, '/') : null;
                if (imgPath) await Model.createExteriorColorImage(exteriorColorId, imgPath);
            }
        }

        const interiorColors = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('interiorColorName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                if (name) {
                    interiorColors.push({
                        name,
                        image: req.files?.find(f => f.fieldname === `interiorColorImage${index}`),
                        additionalImages: req.files?.filter(f => f.fieldname.startsWith(`interiorAdditionalColorImage${index}_`)) || []
                    });
                }
            }
        });
        for (const color of interiorColors) {
            const colorImagePath = color.image ? path.join('uploads/interior_colors', color.image.filename).replace(/\\/g, '/') : null;
            const interiorColorId = await Model.createInteriorColor(modelId, { name: color.name }, colorImagePath);
            for (const img of color.additionalImages) {
                const imgPath = img ? path.join('uploads/interior_colors', img.filename).replace(/\\/g, '/') : null;
                if (imgPath) await Model.createInteriorColorImage(interiorColorId, imgPath);
            }
        }

        const variants = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('variantName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                const price = req.body[`variantPrice${index}`];
                if (name && price) variants.push({ name, price: parseFloat(price) });
            }
        });
        for (const variant of variants) await Model.createVariant(modelId, variant);

        const sites = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('siteName')) {
                const index = key.match(/\d+$/)?.[0];
                const name = req.body[key];
                const link = req.body[`siteLink${index}`];
                if (name && link) sites.push({ name, link });
            }
        });
        for (const site of sites) await Model.createAvailableSite(modelId, site);

        const specifications = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('specTitle')) {
                const index = key.match(/\d+$/)?.[0];
                const title = req.body[key];
                if (title) {
                    const spec = { title, lists: [] };
                    Object.keys(req.body).forEach(listKey => {
                        if (listKey.startsWith(`specListTitle${index}_`)) {
                            const listIndex = listKey.match(/_(\d+)$/)?.[1];
                            const listTitle = req.body[listKey];
                            if (listTitle) {
                                const list = { title: listTitle, contents: [] };
                                Object.keys(req.body).forEach(contentKey => {
                                    if (contentKey.startsWith(`specContent${index}_${listIndex}_`)) {
                                        const contentIndex = contentKey.match(/_(\d+)$/)?.[1];
                                        const contentType = req.body[`specContentType${index}_${listIndex}_${contentIndex}`];
                                        if (contentType) {
                                            const content = {
                                                type: contentType,
                                                value: contentType === 'article' || contentType === 'link' ? req.body[contentKey] || null : null,
                                                image_path: contentType === 'photo' ? (req.files?.find(f => f.fieldname === `specPhoto${index}_${listIndex}_${contentIndex}`)?.filename ? path.join('uploads/specifications', req.files.find(f => f.fieldname === `specPhoto${index}_${listIndex}_${contentIndex}`).filename).replace(/\\/g, '/') : null) : null,
                                                source: contentType === 'photo' ? req.body[`specSource${index}_${listIndex}_${contentIndex}`] || null : null
                                            };
                                            if (content.value || content.image_path) list.contents.push(content);
                                        }
                                    }
                                });
                                if (list.contents.length > 0) spec.lists.push(list);
                            }
                        }
                    });
                    if (spec.lists.length > 0) specifications.push(spec);
                }
            }
        });
        for (const spec of specifications) {
            const specId = await Model.createSpecification(modelId, { title: spec.title });
            for (const list of spec.lists) {
                const listId = await Model.createSpecificationList(specId, { title: list.title });
                for (const content of list.contents) await Model.createSpecContent(listId, content);
            }
        }

        const aboutContents = [];
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('aboutContent')) {
                const index = key.match(/\d+$/)?.[0];
                const contentType = req.body[`aboutContentType${index}`];
                if (contentType) {
                    const content = {
                        type: contentType,
                        value: contentType === 'article' || contentType === 'link' ? req.body[`aboutContent${index}`] || null : null,
                        image_path: contentType === 'photo' ? (req.files?.find(f => f.fieldname === `aboutPhoto${index}`)?.filename ? path.join('uploads/about_contents', req.files.find(f => f.fieldname === `aboutPhoto${index}`).filename).replace(/\\/g, '/') : null) : null,
                        source: contentType === 'photo' ? req.body[`aboutSource${index}`] || null : null
                    };
                    if (content.value || content.image_path) aboutContents.push(content);
                }
            }
        });
        for (let i = 0; i < aboutContents.length; i++) await Model.createAboutContent(modelId, aboutContents[i], i + 1);

        req.flash('success_msg', 'Model updated successfully!');
        res.redirect('/admin/model');
    } catch (error) {
        console.error('Error updating model:', error);
        req.flash('error_msg', error.message);
        res.redirect('/admin/model');
    }
};

exports.deleteAdminModel = async (req, res, next) => {
    try {
        const modelId = req.params.modelId;
        await Model.deleteModel(modelId);
        res.status(200).json({ message: 'Model deleted successfully' });
    } catch (error) {
        console.error('Error deleting model:', error);
        res.status(500).json({ error: 'Failed to delete model: ' + error.message });
    }
};

exports.getFilteredModels = async (req, res, next) => {
    try {
        const { vehicleTypeId, brandId } = req.query;
        if (!vehicleTypeId || !brandId) {
            return res.status(400).json({ error: 'vehicleTypeId and brandId are required' });
        }
        const [models] = await db.execute(
            `SELECT m.id, m.model_name AS model_name, m.model_image, c.name AS category_name
             FROM models m
             JOIN categories c ON m.category_id = c.category_id
             WHERE m.vehicle_type_id = ? AND m.brand_id = ?`,
            [vehicleTypeId, brandId]
        );
        res.json(models);
    } catch (error) {
        console.error('Error fetching filtered models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
};