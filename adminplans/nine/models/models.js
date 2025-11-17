// models/models.js
const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');
const rootDir = require('../utils/pathutil');

class Model {
    // CREATE MODEL
    static async createModel(modelData, imagePath, authorId) {
        const {
            name, vehicle_type_id, category_id, brand_id, safety_rating,
            safety_link, engine_type, starting_price, status = 'import'
        } = modelData;

        if (!name || typeof name !== 'string') throw new Error('Model name is required');
        if (!vehicle_type_id || isNaN(vehicle_type_id)) throw new Error('Vehicle type ID required');
        if (!category_id || isNaN(category_id)) throw new Error('Category ID required');
        if (!brand_id || isNaN(brand_id)) throw new Error('Brand ID required');
        if (!engine_type || typeof engine_type !== 'string') throw new Error('Engine type required');
        if (!starting_price || isNaN(starting_price)) throw new Error('Starting price required');
        if (!authorId || isNaN(authorId)) throw new Error('Author ID required');

        const validStatuses = ['import', 'published', 'draft'];
        if (status && !validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        const [existing] = await db.execute(
            `SELECT id FROM models WHERE model_name = ? AND brand_id = ?`,
            [name, brand_id]
        );
        if (existing.length > 0) {
            throw new Error(`Model "${name}" already exists for this brand!`);
        }

        const normalizedImagePath = imagePath ? imagePath.replace(/\\/g, '/') : null;

        const params = [
            name, vehicle_type_id, category_id, brand_id, normalizedImagePath,
            safety_rating !== undefined && !isNaN(safety_rating) ? parseFloat(safety_rating) : null,
            safety_link || null, engine_type, parseFloat(starting_price), authorId, status
        ];

        const [result] = await db.execute(
            `INSERT INTO models 
             (model_name, vehicle_type_id, category_id, brand_id, model_image, safety_rating, safety_link, engine_type, starting_price, author_id, published_date, created_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
            params
        );

        return result.insertId;
    }

    // CREATE EXTERIOR COLOR + IMAGES
    static async createExteriorColor(modelId, { name }, imagePath) {
        if (!name) throw new Error('Exterior color name required');
        const normalized = imagePath ? imagePath.replace(/\\/g, '/') : null;

        const [result] = await db.execute(
            `INSERT INTO exterior_colors (model_id, color_name, color_image, created_at) VALUES (?, ?, ?, NOW())`,
            [modelId, name, normalized]
        );
        return result.insertId;
    }

    static async createExteriorColorImage(colorId, imagePath) {
        if (!imagePath || !colorId) return;
        const normalized = imagePath.replace(/\\/g, '/');
        await db.execute(
            `INSERT INTO exterior_color_images (exterior_color_id, image_path, created_at) VALUES (?, ?, NOW())`,
            [colorId, normalized]
        );
    }

    // INTERIOR COLOR + IMAGES
    static async createInteriorColor(modelId, { name }, imagePath) {
        if (!name) throw new Error('Interior color name required');
        const normalized = imagePath ? imagePath.replace(/\\/g, '/') : null;

        const [result] = await db.execute(
            `INSERT INTO interior_colors (model_id, color_name, color_image, created_at) VALUES (?, ?, ?, NOW())`,
            [modelId, name, normalized]
        );
        return result.insertId;
    }

    static async createInteriorColorImage(colorId, imagePath) {
        if (!imagePath || !colorId) return;
        const normalized = imagePath.replace(/\\/g, '/');
        await db.execute(
            `INSERT INTO interior_color_images (interior_color_id, image_path, created_at) VALUES (?, ?, NOW())`,
            [colorId, normalized]
        );
    }

    // VARIANT
    static async createVariant(modelId, { name, price }) {
        if (!name || !price) throw new Error('Variant name & price required');
        await db.execute(
            `INSERT INTO variants (model_id, name, price, created_at) VALUES (?, ?, ?, NOW())`,
            [modelId, name, parseFloat(price)]
        );
    }

    // AVAILABLE SITE
    static async createAvailableSite(modelId, { name, link }) {
        if (!name || !link) throw new Error('Site name & link required');
        await db.execute(
            `INSERT INTO available_sites (model_id, name, link_phone, created_at) VALUES (?, ?, ?, NOW())`,
            [modelId, name, link]
        );
    }

    // SPECIFICATION TITLE
    static async createSpecification(modelId, { title }) {
        if (!title) throw new Error('Specification title required');
        const [result] = await db.execute(
            `INSERT INTO specifications (model_id, title, created_at) VALUES (?, ?, NOW())`,
            [modelId, title]
        );
        return result.insertId;
    }

    // SPEC LIST
    static async createSpecificationList(specId, { title }) {
        if (!title) throw new Error('Spec list title required');
        const [result] = await db.execute(
            `INSERT INTO specification_lists (specification_id, title, created_at) VALUES (?, ?, NOW())`,
            [specId, title]
        );
        return result.insertId;
    }

    // SPEC CONTENT (article/photo/link)
    static async createSpecContent(listId, { type, value, image_path, source }) {
        if (!type || !listId) throw new Error('Spec content type & list ID required');
        if (type !== 'photo' && !value) throw new Error('Value required for non-photo');
        if (type === 'photo' && !image_path) throw new Error('Image required for photo');

        const normalized = image_path ? image_path.replace(/\\/g, '/') : null;

        await db.execute(
            `INSERT INTO spec_contents (list_id, type, value, image_path, source, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
            [listId, type, value || null, normalized, source || null]
        );
    }

    // ABOUT CONTENT (with order)
    static async createAboutContent(modelId, { type, value, image_path, source }, order) {
        if (!type || !modelId || !order) throw new Error('About: type, modelId, order required');
        if (type !== 'photo' && !value) throw new Error('Value required for non-photo');
        if (type === 'photo' && !image_path) throw new Error('Image required for photo');

        const normalized = image_path ? image_path.replace(/\\/g, '/') : null;

        await db.execute(
            `INSERT INTO about_contents (model_id, type, content_order, value, image_path, source, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [modelId, type, order, value || null, normalized, source || null]
        );
    }

    // GET MODEL BY ID
    static async getModelById(id) {
        if (!id || isNaN(id)) throw new Error('Invalid model ID');
        const [rows] = await db.execute(
            `SELECT m.*, v.vehicle_type_name, c.name AS category_name, b.name AS brand_name, u.name AS author_name
             FROM models m
             JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
             JOIN categories c ON m.category_id = c.category_id
             JOIN brands b ON m.brand_id = b.brand_id
             JOIN usertable u ON m.author_id = u.user_id
             WHERE m.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // GET FULL MODEL DETAILS (Grouped & Structured)
    static async getModelDetails(modelId) {
        if (!modelId || isNaN(modelId)) throw new Error('Invalid model ID');

        // EXTERIOR COLORS
        const [exteriorColorsRaw] = await db.execute(
            `SELECT ec.id, ec.color_name, ec.color_image,
                    GROUP_CONCAT(eci.image_path) AS additional_images
             FROM exterior_colors ec
             LEFT JOIN exterior_color_images eci ON ec.id = eci.exterior_color_id
             WHERE ec.model_id = ?
             GROUP BY ec.id`,
            [modelId]
        );
        const exteriorColors = exteriorColorsRaw.map(c => ({
            ...c,
            additional_images: c.additional_images ? c.additional_images.split(',') : []
        }));

        // INTERIOR COLORS
        const [interiorColorsRaw] = await db.execute(
            `SELECT ic.id, ic.color_name, ic.color_image,
                    GROUP_CONCAT(ici.image_path) AS additional_images
             FROM interior_colors ic
             LEFT JOIN interior_color_images ici ON ic.id = ici.interior_color_id
             WHERE ic.model_id = ?
             GROUP BY ic.id`,
            [modelId]
        );
        const interiorColors = interiorColorsRaw.map(c => ({
            ...c,
            additional_images: c.additional_images ? c.additional_images.split(',') : []
        }));

        // VARIANTS
        const [variants] = await db.execute(`SELECT * FROM variants WHERE model_id = ?`, [modelId]);

        // SITES
        const [availableSites] = await db.execute(`SELECT * FROM available_sites WHERE model_id = ?`, [modelId]);

        // SPECIFICATIONS (Nested: spec → lists → contents)
        const [specifications] = await db.execute(
            `SELECT id, title FROM specifications WHERE model_id = ? ORDER BY id`,
            [modelId]
        );

        const specificationsFull = await Promise.all(specifications.map(async (spec) => {
            const [lists] = await db.execute(
                `SELECT id, title FROM specification_lists WHERE specification_id = ? ORDER BY id`,
                [spec.id]
            );

            const listsFull = await Promise.all(lists.map(async (list) => {
                const [contents] = await db.execute(
                    `SELECT type, value, image_path, source FROM spec_contents WHERE list_id = ? ORDER BY id`,
                    [list.id]
                );
                return { ...list, contents };
            }));

            return { ...spec, lists: listsFull };
        }));

        // ABOUT CONTENTS (ordered)
        const [aboutContents] = await db.execute(
            `SELECT type, value, image_path, source FROM about_contents WHERE model_id = ? ORDER BY content_order ASC`,
            [modelId]
        );

        return {
            exteriorColors,
            interiorColors,
            variants,
            availableSites,
            specifications: specificationsFull,
            aboutContents
        };
    }

    // UPDATE MODEL
    static async updateModel(id, modelData, imagePath, authorId) {
        const {
            name, vehicle_type_id, category_id, brand_id, safety_rating,
            safety_link, engine_type, starting_price, status
        } = modelData;

        if (!id || isNaN(id)) throw new Error('Model ID required');
        if (!name || !vehicle_type_id || !category_id || !brand_id || !engine_type || !starting_price || !authorId)
            throw new Error('All fields required');

        const normalized = imagePath ? imagePath.replace(/\\/g, '/') : null;

        // Delete old image if new one uploaded
        if (normalized) {
            const [old] = await db.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
            if (old[0]?.model_image) {
                const oldPath = path.join(rootDir, 'public', old[0].model_image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        await db.execute(
            `UPDATE models SET 
                model_name = ?, vehicle_type_id = ?, category_id = ?, brand_id = ?,
                model_image = COALESCE(?, model_image),
                safety_rating = ?, safety_link = ?, engine_type = ?, starting_price = ?,
                author_id = ?, status = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                name, vehicle_type_id, category_id, brand_id, normalized,
                safety_rating !== undefined ? parseFloat(safety_rating) : null,
                safety_link || null, engine_type, parseFloat(starting_price),
                authorId, status || 'import', id
            ]
        );
    }

    // DELETE RELATED DATA ONLY (for update)
    static async deleteRelatedDataOnly(modelId) {
        const tables = [
            'exterior_color_images', 'interior_color_images',
            'spec_contents', 'specification_lists', 'specifications',
            'about_contents', 'available_sites', 'variants',
            'interior_colors', 'exterior_colors'
        ];

        for (const table of tables) {
            let query = `DELETE FROM ${table} WHERE `;
            let param = modelId;

            if (table.includes('images')) {
                const parent = table.replace('_images', 's');
                query += `${table.replace('_images', '_id')} IN (SELECT id FROM ${parent} WHERE model_id = ?)`;
            } else if (table.includes('contents') || table.includes('lists')) {
                const parentTable = table === 'spec_contents' ? 'specification_lists' :
                                   table === 'specification_lists' ? 'specifications' : table;
                query += table === 'about_contents' ? `model_id = ?` :
                         ` ${table === 'specification_lists' ? 'specification_id' : 'list_id'} IN (SELECT id FROM ${parentTable} WHERE model_id = ?)`;
            } else {
                query += `model_id = ?`;
            }

            await db.execute(query, [param]);
        }

        // Delete images from filesystem
        const imageTables = [
            { table: 'exterior_colors', field: 'color_image' },
            { table: 'interior_colors', field: 'color_image' },
            { table: 'exterior_color_images', field: 'image_path' },
            { table: 'interior_color_images', field: 'image_path' },
            { table: 'spec_contents', field: 'image_path', where: 'type = "photo"' },
            { table: 'about_contents', field: 'image_path', where: 'type = "photo"' }
        ];

        for (const { table, field, where } of imageTables) {
            let query = `SELECT ${field} FROM ${table} WHERE model_id = ?`;
            if (where) query += ` AND ${where}`;
            const [images] = await db.execute(query, [modelId]);
            for (const img of images) {
                if (img[field]) {
                    const filePath = path.join(rootDir, 'public', img[field]);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            }
        }
    }

    // FULL DELETE MODEL
    static async deleteModel(id) {
        if (!id || isNaN(id)) throw new Error('Invalid model ID');

        // Get model image
        const [model] = await db.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
        const modelImage = model[0]?.model_image;

        // Delete all related data + images
        await this.deleteRelatedDataOnly(id);

        // Delete model image
        if (modelImage) {
            const filePath = path.join(rootDir, 'public', modelImage);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // Delete model
        await db.execute(`DELETE FROM models WHERE id = ?`, [id]);
    }
}

module.exports = Model;