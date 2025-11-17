const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');

class Model {
    // Create a new model
    static async createModel(modelData, imagePath, authorId) {
        const {
            name, vehicle_type_id, category_id, brand_id, safety_rating,
            safety_link, engine_type, starting_price, status = 'import'
        } = modelData;

        // Validate required fields
        if (!name || typeof name !== 'string') throw new Error('Model name is required and must be a string');
        if (!vehicle_type_id || isNaN(vehicle_type_id)) throw new Error('Vehicle type ID is required and must be a number');
        if (!category_id || isNaN(category_id)) throw new Error('Category ID is required and must be a number');
        if (!brand_id || isNaN(brand_id)) throw new Error('Brand ID is required and must be a number');
        if (!engine_type || typeof engine_type !== 'string') throw new Error('Engine type is required and must be a string');
        if (!starting_price || isNaN(starting_price)) throw new Error('Starting price is required and must be a number');
        if (!authorId || isNaN(authorId)) throw new Error('Author ID is required and must be a number');
        
        // Validate status
        const validStatuses = ['import', 'published', 'draft']; // Adjust based on your schema
        if (status && !validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Check if model already exists for the brand
        const [existing] = await db.execute(
            `SELECT id FROM models WHERE model_name = ? AND brand_id = ?`,
            [name, brand_id]
        );
        if (existing.length > 0) {
            throw new Error(`Model "${name}" already exists for this brand!`);
        }

        // Normalize image path for database (use forward slashes)
        const normalizedImagePath = imagePath ? imagePath.replace(/\\/g, '/') : null;

        // Prepare parameters
        const params = [
            name,
            vehicle_type_id,
            category_id,
            brand_id,
            normalizedImagePath,
            safety_rating !== undefined && safety_rating !== '' && !isNaN(safety_rating) ? parseFloat(safety_rating) : null,
            safety_link || null,
            engine_type,
            parseFloat(starting_price),
            authorId,
            status || 'import'
        ];

        try {
            const [result] = await db.execute(
                `INSERT INTO models (model_name, vehicle_type_id, category_id, brand_id, model_image, safety_rating, safety_link, engine_type, starting_price, author_id, published_date, created_at, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
                params
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createModel:', {
                message: err.message,
                params,
                stack: err.stack
            });
            throw new Error(`Failed to create model: ${err.message}`);
        }
    }

    // Create exterior color
    static async createExteriorColor(modelId, colorData, imagePath) {
        const { name } = colorData;
        if (!name || typeof name !== 'string') throw new Error('Exterior color name is required and must be a string');
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        
        const normalizedImagePath = imagePath ? imagePath.replace(/\\/g, '/') : null;
        
        try {
            const [result] = await db.execute(
                `INSERT INTO exterior_colors (model_id, color_name, color_image, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [modelId, name, normalizedImagePath]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createExteriorColor:', { message: err.message, modelId, name });
            throw new Error(`Failed to create exterior color: ${err.message}`);
        }
    }

    // Create exterior color additional images
    static async createExteriorColorImage(exteriorColorId, imagePath) {
        if (!imagePath) return null;
        if (!exteriorColorId || isNaN(exteriorColorId)) throw new Error('Exterior color ID is required and must be a number');
        
        const normalizedImagePath = imagePath.replace(/\\/g, '/');
        
        try {
            const [result] = await db.execute(
                `INSERT INTO exterior_color_images (exterior_color_id, image_path, created_at)
                 VALUES (?, ?, NOW())`,
                [exteriorColorId, normalizedImagePath]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createExteriorColorImage:', { message: err.message, exteriorColorId });
            throw new Error(`Failed to create exterior color image: ${err.message}`);
        }
    }

    // Create interior color
    static async createInteriorColor(modelId, colorData, imagePath) {
        const { name } = colorData;
        if (!name || typeof name !== 'string') throw new Error('Interior color name is required and must be a string');
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        
        const normalizedImagePath = imagePath ? imagePath.replace(/\\/g, '/') : null;
        
        try {
            const [result] = await db.execute(
                `INSERT INTO interior_colors (model_id, color_name, color_image, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [modelId, name, normalizedImagePath]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createInteriorColor:', { message: err.message, modelId, name });
            throw new Error(`Failed to create interior color: ${err.message}`);
        }
    }

    // Create interior color additional images
    static async createInteriorColorImage(interiorColorId, imagePath) {
        if (!imagePath) return null;
        if (!interiorColorId || isNaN(interiorColorId)) throw new Error('Interior color ID is required and must be a number');
        
        const normalizedImagePath = imagePath.replace(/\\/g, '/');
        
        try {
            const [result] = await db.execute(
                `INSERT INTO interior_color_images (interior_color_id, image_path, created_at)
                 VALUES (?, ?, NOW())`,
                [interiorColorId, normalizedImagePath]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createInteriorColorImage:', { message: err.message, interiorColorId });
            throw new Error(`Failed to create interior color image: ${err.message}`);
        }
    }

    // Create variant
    static async createVariant(modelId, variantData) {
        const { name, price } = variantData;
        if (!name || typeof name !== 'string') throw new Error('Variant name is required and must be a string');
        if (!price || isNaN(price)) throw new Error('Variant price is required and must be a number');
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        
        try {
            const [result] = await db.execute(
                `INSERT INTO variants (model_id, name, price, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [modelId, name, parseFloat(price)]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createVariant:', { message: err.message, modelId, name });
            throw new Error(`Failed to create variant: ${err.message}`);
        }
    }

    // Create available site
    static async createAvailableSite(modelId, siteData) {
        const { name, link } = siteData;
        if (!name || typeof name !== 'string') throw new Error('Site name is required and must be a string');
        if (!link || typeof link !== 'string') throw new Error('Site link or phone is required and must be a string');
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        
        try {
            const [result] = await db.execute(
                `INSERT INTO available_sites (model_id, name, link_phone, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [modelId, name, link]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createAvailableSite:', { message: err.message, modelId, name });
            throw new Error(`Failed to create available site: ${err.message}`);
        }
    }

    // Create specification
    static async createSpecification(modelId, specData) {
        const { title } = specData;
        if (!title || typeof title !== 'string') throw new Error('Specification title is required and must be a string');
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        
        try {
            const [result] = await db.execute(
                `INSERT INTO specifications (model_id, title, created_at)
                 VALUES (?, ?, NOW())`,
                [modelId, title]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createSpecification:', { message: err.message, modelId, title });
            throw new Error(`Failed to create specification: ${err.message}`);
        }
    }

    // Create specification list
    static async createSpecificationList(specificationId, listData) {
        const { title } = listData;
        if (!title || typeof title !== 'string') throw new Error('Specification list title is required and must be a string');
        if (!specificationId || isNaN(specificationId)) throw new Error('Specification ID is required and must be a number');
        
        try {
            const [result] = await db.execute(
                `INSERT INTO specification_lists (specification_id, title, created_at)
                 VALUES (?, ?, NOW())`,
                [specificationId, title]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createSpecificationList:', { message: err.message, specificationId, title });
            throw new Error(`Failed to create specification list: ${err.message}`);
        }
    }

    // Create specification content
    static async createSpecContent(listId, contentData) {
        const { type, value, image_path, source } = contentData;
        if (!type || typeof type !== 'string') throw new Error('Specification content type is required and must be a string');
        if (type !== 'photo' && (!value || typeof value !== 'string')) throw new Error('Specification content value is required for non-photo types and must be a string');
        if (type === 'photo' && (!image_path || typeof image_path !== 'string')) throw new Error('Specification content image is required for photo type and must be a string');
        if (!listId || isNaN(listId)) throw new Error('List ID is required and must be a number');
        
        const normalizedImagePath = image_path ? image_path.replace(/\\/g, '/') : null;
        
        try {
            const [result] = await db.execute(
                `INSERT INTO spec_contents (list_id, type, value, image_path, source, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [listId, type, value || null, normalizedImagePath, source || null]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createSpecContent:', { message: err.message, listId, type });
            throw new Error(`Failed to create specification content: ${err.message}`);
        }
    }

    // Create about content
    static async createAboutContent(modelId, contentData, order) {
        const { type, value, image_path, source } = contentData;
        if (!type || typeof type !== 'string') throw new Error('About content type is required and must be a string');
        if (type !== 'photo' && (!value || typeof value !== 'string')) throw new Error('About content value is required for non-photo types and must be a string');
        if (type === 'photo' && (!image_path || typeof image_path !== 'string')) throw new Error('About content image is required for photo type and must be a string');
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        if (!order || isNaN(order)) throw new Error('Content order is required and must be a number');
        
        const normalizedImagePath = image_path ? image_path.replace(/\\/g, '/') : null;
        
        try {
            const [result] = await db.execute(
                `INSERT INTO about_contents (model_id, type, content_order, value, image_path, source, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [modelId, type, order, value || null, normalizedImagePath, source || null]
            );
            return result.insertId;
        } catch (err) {
            console.error('Error in createAboutContent:', { message: err.message, modelId, type, order });
            throw new Error(`Failed to create about content: ${err.message}`);
        }
    }

    // Get all models
    static async getAllModels() {
        try {
            const [rows] = await db.execute(`
                SELECT m.id, m.model_name, m.model_image, m.safety_rating, m.safety_link, m.engine_type, m.starting_price, m.status,
                       v.vechicle_type_name, c.name AS category_name, b.name AS brand_name, u.name AS author_name, m.created_at
                FROM models m
                JOIN vechicletype v ON m.vehicle_type_id = v.vechicle_type_id
                JOIN categories c ON m.category_id = c.category_id
                JOIN brands b ON m.brand_id = b.brand_id
                JOIN usertable u ON m.author_id = u.user_id
                ORDER BY m.created_at DESC
            `);
            return rows;
        } catch (err) {
            console.error('Error in getAllModels:', { message: err.message });
            throw new Error(`Failed to fetch models: ${err.message}`);
        }
    }

    // Get model by ID
    static async getModelById(id) {
        if (!id || isNaN(id)) throw new Error('Model ID is required and must be a number');
        
        try {
            const [rows] = await db.execute(
                `SELECT m.*, v.vechicle_type_name, c.name AS category_name, b.name AS brand_name, u.name AS author_name
                 FROM models m
                 JOIN vechicletype v ON m.vehicle_type_id = v.vechicle_type_id
                 JOIN categories c ON m.category_id = c.category_id
                 JOIN brands b ON m.brand_id = b.brand_id
                 JOIN usertable u ON m.author_id = u.user_id
                 WHERE m.id = ?`,
                [id]
            );
            return rows[0];
        } catch (err) {
            console.error('Error in getModelById:', { message: err.message, id });
            throw new Error(`Failed to fetch model: ${err.message}`);
        }
    }

    // Get model details (colors, variants, sites, specs, about content)
    static async getModelDetails(modelId) {
        if (!modelId || isNaN(modelId)) throw new Error('Model ID is required and must be a number');
        
        try {
            const [exteriorColors] = await db.execute(
                `SELECT * FROM exterior_colors WHERE model_id = ?`,
                [modelId]
            );
            const [exteriorColorImages] = await db.execute(
                `SELECT * FROM exterior_color_images WHERE exterior_color_id IN (SELECT id FROM exterior_colors WHERE model_id = ?)`,
                [modelId]
            );
            const [interiorColors] = await db.execute(
                `SELECT * FROM interior_colors WHERE model_id = ?`,
                [modelId]
            );
            const [interiorColorImages] = await db.execute(
                `SELECT * FROM interior_color_images WHERE interior_color_id IN (SELECT id FROM interior_colors WHERE model_id = ?)`,
                [modelId]
            );
            const [variants] = await db.execute(
                `SELECT * FROM variants WHERE model_id = ?`,
                [modelId]
            );
            const [sites] = await db.execute(
                `SELECT * FROM available_sites WHERE model_id = ?`,
                [modelId]
            );
            const [specifications] = await db.execute(
                `SELECT * FROM specifications WHERE model_id = ?`,
                [modelId]
            );
            const [specLists] = await db.execute(
                `SELECT * FROM specification_lists WHERE specification_id IN (SELECT id FROM specifications WHERE model_id = ?)`,
                [modelId]
            );
            const [specContents] = await db.execute(
                `SELECT * FROM spec_contents WHERE list_id IN (SELECT id FROM specification_lists WHERE specification_id IN (SELECT id FROM specifications WHERE model_id = ?))`,
                [modelId]
            );
            const [aboutContents] = await db.execute(
                `SELECT * FROM about_contents WHERE model_id = ? ORDER BY content_order`,
                [modelId]
            );

            return {
                exteriorColors,
                exteriorColorImages,
                interiorColors,
                interiorColorImages,
                variants,
                availableSites: sites,
                specifications,
                specificationLists: specLists,
                specContents,
                aboutContents
            };
        } catch (err) {
            console.error('Error in getModelDetails:', { message: err.message, modelId });
            throw new Error(`Failed to fetch model details: ${err.message}`);
        }
    }

    // Update model
    static async updateModel(id, modelData, imagePath, authorId) {
        const {
            name, vehicle_type_id, category_id, brand_id, safety_rating,
            safety_link, engine_type, starting_price, status
        } = modelData;

        // Validate required fields
        if (!id || isNaN(id)) throw new Error('Model ID is required and must be a number');
        if (!name || typeof name !== 'string') throw new Error('Model name is required and must be a string');
        if (!vehicle_type_id || isNaN(vehicle_type_id)) throw new Error('Vehicle type ID is required and must be a number');
        if (!category_id || isNaN(category_id)) throw new Error('Category ID is required and must be a number');
        if (!brand_id || isNaN(brand_id)) throw new Error('Brand ID is required and must be a number');
        if (!engine_type || typeof engine_type !== 'string') throw new Error('Engine type is required and must be a string');
        if (!starting_price || isNaN(starting_price)) throw new Error('Starting price is required and must be a number');
        if (!authorId || isNaN(authorId)) throw new Error('Author ID is required and must be a number');
        
        // Validate status
        const validStatuses = ['import', 'published', 'draft'];
        if (status && !validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const normalizedImagePath = imagePath ? imagePath.replace(/\\/g, '/') : null;

        try {
            if (normalizedImagePath) {
                const [oldModel] = await db.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
                if (oldModel[0]?.model_image) {
                    const filePath = path.join(__dirname, '../public', oldModel[0].model_image);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                await db.execute(
                    `UPDATE models SET model_name = ?, vehicle_type_id = ?, category_id = ?, brand_id = ?, model_image = ?, safety_rating = ?, safety_link = ?, engine_type = ?, starting_price = ?, author_id = ?, status = ?, updated_at = NOW() WHERE id = ?`,
                    [name, vehicle_type_id, category_id, brand_id, normalizedImagePath, safety_rating !== undefined && safety_rating !== '' && !isNaN(safety_rating) ? parseFloat(safety_rating) : null, safety_link || null, engine_type, parseFloat(starting_price), authorId, status || 'import', id]
                );
            } else {
                await db.execute(
                    `UPDATE models SET model_name = ?, vehicle_type_id = ?, category_id = ?, brand_id = ?, safety_rating = ?, safety_link = ?, engine_type = ?, starting_price = ?, author_id = ?, status = ?, updated_at = NOW() WHERE id = ?`,
                    [name, vehicle_type_id, category_id, brand_id, safety_rating !== undefined && safety_rating !== '' && !isNaN(safety_rating) ? parseFloat(safety_rating) : null, safety_link || null, engine_type, parseFloat(starting_price), authorId, status || 'import', id]
                );
            }
        } catch (err) {
            console.error('Error in updateModel:', { message: err.message, id, modelData });
            throw new Error(`Failed to update model: ${err.message}`);
        }
    }

    // Delete model
    static async deleteModel(id) {
        if (!id || isNaN(id)) throw new Error('Model ID is required and must be a number');
        
        try {
            // Delete related data to avoid orphaned records
            await db.execute(`DELETE FROM exterior_colors WHERE model_id = ?`, [id]);
            await db.execute(`DELETE FROM interior_colors WHERE model_id = ?`, [id]);
            await db.execute(`DELETE FROM variants WHERE model_id = ?`, [id]);
            await db.execute(`DELETE FROM available_sites WHERE model_id = ?`, [id]);
            await db.execute(`DELETE FROM specifications WHERE model_id = ?`, [id]);
            await db.execute(`DELETE FROM about_contents WHERE model_id = ?`, [id]);

            const [model] = await db.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
            if (model[0]?.model_image) {
                const filePath = path.join(__dirname, '../public', model[0].model_image);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await db.execute(`DELETE FROM models WHERE id = ?`, [id]);
        } catch (err) {
            console.error('Error in deleteModel:', { message: err.message, id });
            throw new Error(`Failed to delete model: ${err.message}`);
        }
    }
}

module.exports = Model;