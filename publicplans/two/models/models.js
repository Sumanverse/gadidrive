// models/models.js - FULLY UPDATED & COMPLETE
const db = require('../utils/dbutils');
const path = require('path');
const fs = require('fs');
const rootDir = require('../utils/pathutil');

class Model {
  // ---------- connection helper ----------
  static async _getConn(provided) {
    if (provided) return { conn: provided, release: false };
    const conn = await db.getConnection();
    return { conn, release: true };
  }
  static async _release({ conn, release }) {
    if (release && conn) conn.release();
  }

  // ---------- CREATE ----------
  static async createModel(data, imagePath, authorId, conn) {
    const {
      name, vehicle_type_id, category_id, brand_id,
      safety_rating, safety_link, sources, engine_type, starting_price, 
      release_year, seater, status = 'import'
    } = data;

    const connObj = await this._getConn(conn);
    try {
      const [dup] = await connObj.conn.execute(
        `SELECT id FROM models WHERE model_name = ? AND brand_id = ?`,
        [name, brand_id]
      );
      if (dup.length) throw new Error(`Model "${name}" already exists for this brand`);

      // FIX: Ensure image path starts with /
      const img = imagePath ? (imagePath.startsWith('/') ? imagePath : '/' + imagePath) : null;
      
      const [res] = await connObj.conn.execute(
        `INSERT INTO models
         (model_name, vehicle_type_id, category_id, brand_id, model_image,
          safety_rating, safety_link, sources, engine_type, starting_price, release_year, seater, author_id,
          published_date, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
        [
          name, vehicle_type_id, category_id, brand_id, img,
          safety_rating ?? null, safety_link ?? null, sources ?? null, engine_type,
          starting_price, release_year || null, seater || null, authorId, status
        ]
      );
      return res.insertId;
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- EXTERIOR ----------
  static async createExteriorColor(modelId, { name }, imagePath, conn) {
    // FIX: Ensure image path starts with /
    const img = imagePath ? (imagePath.startsWith('/') ? imagePath : '/' + imagePath) : null;
    
    const connObj = await this._getConn(conn);
    try {
      const [res] = await connObj.conn.execute(
        `INSERT INTO exterior_colors (model_id, color_name, color_image, created_at)
         VALUES (?, ?, ?, NOW())`,
        [modelId, name, img]
      );
      return res.insertId;
    } finally {
      await this._release(connObj);
    }
  }
  
  static async createExteriorColorImage(colorId, imagePath, conn) {
    // FIX: Ensure image path starts with /
    const img = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(
        `INSERT INTO exterior_color_images (exterior_color_id, image_path, created_at)
         VALUES (?, ?, NOW())`,
        [colorId, img]
      );
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- INTERIOR ----------
  static async createInteriorColor(modelId, { name }, imagePath, conn) {
    // FIX: Ensure image path starts with /
    const img = imagePath ? (imagePath.startsWith('/') ? imagePath : '/' + imagePath) : null;
    
    const connObj = await this._getConn(conn);
    try {
      const [res] = await connObj.conn.execute(
        `INSERT INTO interior_colors (model_id, color_name, color_image, created_at)
         VALUES (?, ?, ?, NOW())`,
        [modelId, name, img]
      );
      return res.insertId;
    } finally {
      await this._release(connObj);
    }
  }
  
  static async createInteriorColorImage(colorId, imagePath, conn) {
    // FIX: Ensure image path starts with /
    const img = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(
        `INSERT INTO interior_color_images (interior_color_id, image_path, created_at)
         VALUES (?, ?, NOW())`,
        [colorId, img]
      );
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- VARIANT / SITE ----------
  static async createVariant(modelId, { name, price }, conn) {
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(
        `INSERT INTO variants (model_id, name, price, created_at)
         VALUES (?, ?, ?, NOW())`,
        [modelId, name, price]
      );
    } finally {
      await this._release(connObj);
    }
  }
  
  static async createAvailableSite(modelId, { name, link }, conn) {
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(
        `INSERT INTO available_sites (model_id, name, link_phone, created_at)
         VALUES (?, ?, ?, NOW())`,
        [modelId, name, link]
      );
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- SPEC ----------
  static async createSpecification(modelId, { title }, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [res] = await connObj.conn.execute(
        `INSERT INTO specifications (model_id, title, created_at)
         VALUES (?, ?, NOW())`,
        [modelId, title]
      );
      return res.insertId;
    } finally {
      await this._release(connObj);
    }
  }
  
  static async createSpecificationList(specId, { title }, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [res] = await connObj.conn.execute(
        `INSERT INTO specification_lists (specification_id, title, created_at)
         VALUES (?, ?, NOW())`,
        [specId, title]
      );
      return res.insertId;
    } finally {
      await this._release(connObj);
    }
  }
  
  static async createSpecContent(listId, { type, value, image_path, source }, conn) {
    // FIX: Ensure image path starts with /
    const img = image_path ? (image_path.startsWith('/') ? image_path : '/' + image_path) : null;
    
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(
        `INSERT INTO spec_contents (list_id, type, value, image_path, source, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [listId, type, value || null, img, source || null]
      );
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- ABOUT ----------
  static async createAboutContent(modelId, { type, value, image_path, source }, order, conn) {
    // FIX: Ensure image path starts with /
    const img = image_path ? (image_path.startsWith('/') ? image_path : '/' + image_path) : null;
    
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(
        `INSERT INTO about_contents
         (model_id, type, content_order, value, image_path, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [modelId, type, order, value || null, img, source || null]
      );
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- READ ----------
  static async getModelById(id, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [rows] = await connObj.conn.execute(
        `SELECT m.*, v.vehicle_type_name, c.name AS category_name,
                b.name AS brand_name, u.name AS author_name
         FROM models m
         JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
         JOIN categories c ON m.category_id = c.category_id
         JOIN brands b ON m.brand_id = b.brand_id
         JOIN usertable u ON m.author_id = u.user_id
         WHERE m.id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      await this._release(connObj);
    }
  }

  static async getModelDetails(modelId, conn) {
    const connObj = await this._getConn(conn);
    try {
      // exterior colors with images
      const [exteriorColors] = await connObj.conn.execute(
        `SELECT * FROM exterior_colors WHERE model_id = ?`,
        [modelId]
      );

      const [exteriorColorImages] = await connObj.conn.execute(
        `SELECT eci.* FROM exterior_color_images eci
         JOIN exterior_colors ec ON eci.exterior_color_id = ec.id
         WHERE ec.model_id = ?`,
        [modelId]
      );

      // interior colors with images
      const [interiorColors] = await connObj.conn.execute(
        `SELECT * FROM interior_colors WHERE model_id = ?`,
        [modelId]
      );

      const [interiorColorImages] = await connObj.conn.execute(
        `SELECT ici.* FROM interior_color_images ici
         JOIN interior_colors ic ON ici.interior_color_id = ic.id
         WHERE ic.model_id = ?`,
        [modelId]
      );

      // variants
      const [variants] = await connObj.conn.execute(
        `SELECT * FROM variants WHERE model_id = ?`,
        [modelId]
      );

      // available sites
      const [availableSites] = await connObj.conn.execute(
        `SELECT * FROM available_sites WHERE model_id = ?`,
        [modelId]
      );

      // specifications with full hierarchy
      const [specifications] = await connObj.conn.execute(
        `SELECT * FROM specifications WHERE model_id = ?`,
        [modelId]
      );

      const [specificationLists] = await connObj.conn.execute(
        `SELECT sl.* FROM specification_lists sl
         JOIN specifications s ON sl.specification_id = s.id
         WHERE s.model_id = ?`,
        [modelId]
      );

      const [specContents] = await connObj.conn.execute(
        `SELECT sc.* FROM spec_contents sc
         JOIN specification_lists sl ON sc.list_id = sl.id
         JOIN specifications s ON sl.specification_id = s.id
         WHERE s.model_id = ?`,
        [modelId]
      );

      // about contents
      const [aboutContents] = await connObj.conn.execute(
        `SELECT * FROM about_contents WHERE model_id = ? ORDER BY content_order`,
        [modelId]
      );

      return {
        exteriorColors,
        exteriorColorImages,
        interiorColors,
        interiorColorImages,
        variants,
        availableSites,
        specifications,
        specificationLists,
        specContents,
        aboutContents
      };
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- UPDATE ----------
  static async updateModel(id, data, imagePath, authorId, conn) {
    const {
      name, vehicle_type_id, category_id, brand_id,
      safety_rating, safety_link, sources, engine_type, starting_price, 
      release_year, seater, status
    } = data;

    const connObj = await this._getConn(conn);
    try {
      // FIX: Only delete old image if a new one is provided and different
      if (imagePath) {
        const [old] = await connObj.conn.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
        const oldImage = old[0]?.model_image;
        
        // Only delete if we have a new image AND old image exists AND they are different
        if (oldImage && oldImage !== imagePath) {
          const p = path.join(rootDir, 'public', oldImage);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
        
        // FIX: Ensure image path starts with /
        const img = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        
        await connObj.conn.execute(
          `UPDATE models SET
             model_name = ?, vehicle_type_id = ?, category_id = ?, brand_id = ?,
             model_image = ?,
             safety_rating = ?, safety_link = ?, sources = ?, engine_type = ?, starting_price = ?,
             release_year = ?, seater = ?, author_id = ?, status = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            name, vehicle_type_id, category_id, brand_id, img,
            safety_rating ?? null, safety_link ?? null, sources ?? null, engine_type,
            starting_price, release_year || null, seater || null, authorId, status || 'import', id
          ]
        );
      } else {
        // No new image - keep the existing one
        await connObj.conn.execute(
          `UPDATE models SET
             model_name = ?, vehicle_type_id = ?, category_id = ?, brand_id = ?,
             safety_rating = ?, safety_link = ?, sources = ?, engine_type = ?, starting_price = ?,
             release_year = ?, seater = ?, author_id = ?, status = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            name, vehicle_type_id, category_id, brand_id,
            safety_rating ?? null, safety_link ?? null, sources ?? null, engine_type,
            starting_price, release_year || null, seater || null, authorId, status || 'import', id
          ]
        );
      }
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE COLORS ONLY ----------
  static async deleteColorsOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    const c = connObj.conn;

    try {
      // Delete only colors but keep other data
      await c.execute(`DELETE FROM exterior_colors WHERE model_id = ?`, [modelId]);
      await c.execute(`DELETE FROM interior_colors WHERE model_id = ?`, [modelId]);
      
      console.log(`Deleted colors only for model ${modelId}, preserving other data`);
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE VARIANTS ONLY ----------
  static async deleteVariantsOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(`DELETE FROM variants WHERE model_id = ?`, [modelId]);
      console.log(`Deleted variants only for model ${modelId}`);
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE SITES ONLY ----------
  static async deleteSitesOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(`DELETE FROM available_sites WHERE model_id = ?`, [modelId]);
      console.log(`Deleted sites only for model ${modelId}`);
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE ABOUT ONLY ----------
  static async deleteAboutOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    try {
      await connObj.conn.execute(`DELETE FROM about_contents WHERE model_id = ?`, [modelId]);
      console.log(`Deleted about contents only for model ${modelId}`);
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE SPECS ONLY ----------
  static async deleteSpecsOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    const c = connObj.conn;

    try {
      await c.execute(`
        DELETE sc FROM spec_contents sc
        JOIN specification_lists sl ON sc.list_id = sl.id
        JOIN specifications s ON sl.specification_id = s.id
        WHERE s.model_id = ?`, [modelId]);

      await c.execute(`
        DELETE sl FROM specification_lists sl
        JOIN specifications s ON sl.specification_id = s.id
        WHERE s.model_id = ?`, [modelId]);

      await c.execute(`DELETE FROM specifications WHERE model_id = ?`, [modelId]);
      console.log(`Deleted specifications only for model ${modelId}`);
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE OTHER RELATED DATA ONLY ----------
  static async deleteOtherRelatedDataOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    const c = connObj.conn;

    try {
      // Delete everything EXCEPT colors
      await c.execute(`
        DELETE sc FROM spec_contents sc
        JOIN specification_lists sl ON sc.list_id = sl.id
        JOIN specifications s ON sl.specification_id = s.id
        WHERE s.model_id = ?`, [modelId]);

      await c.execute(`
        DELETE sl FROM specification_lists sl
        JOIN specifications s ON sl.specification_id = s.id
        WHERE s.model_id = ?`, [modelId]);

      await c.execute(`DELETE FROM specifications WHERE model_id = ?`, [modelId]);

      const direct = [
        'about_contents', 'available_sites', 'variants'
      ];
      for (const t of direct) {
        await c.execute(`DELETE FROM ${t} WHERE model_id = ?`, [modelId]);
      }

      console.log(`Deleted other related data only for model ${modelId}, preserving colors`);
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- DELETE RELATED (only) ----------
  static async deleteRelatedDataOnly(modelId, conn) {
    const connObj = await this._getConn(conn);
    const c = connObj.conn;

    try {
      // 1. spec contents → lists → specs
      await c.execute(`
        DELETE sc FROM spec_contents sc
        JOIN specification_lists sl ON sc.list_id = sl.id
        JOIN specifications s ON sl.specification_id = s.id
        WHERE s.model_id = ?`, [modelId]);

      await c.execute(`
        DELETE sl FROM specification_lists sl
        JOIN specifications s ON sl.specification_id = s.id
        WHERE s.model_id = ?`, [modelId]);

      await c.execute(`DELETE FROM specifications WHERE model_id = ?`, [modelId]);

      // 2. direct children
      const direct = [
        'about_contents', 'available_sites', 'variants',
        'exterior_colors', 'interior_colors'
      ];
      for (const t of direct) {
        await c.execute(`DELETE FROM ${t} WHERE model_id = ?`, [modelId]);
      }

      // 3. child image tables
      await c.execute(`
        DELETE eci FROM exterior_color_images eci
        JOIN exterior_colors ec ON eci.exterior_color_id = ec.id
        WHERE ec.model_id = ?`, [modelId]);

      await c.execute(`
        DELETE ici FROM interior_color_images ici
        JOIN interior_colors ic ON ici.interior_color_id = ic.id
        WHERE ic.model_id = ?`, [modelId]);

      // 4. delete files from disk
      const imgQueries = [
        { tbl: 'exterior_colors', col: 'color_image' },
        { tbl: 'interior_colors', col: 'color_image' },
        { tbl: 'exterior_color_images', col: 'image_path',
          join: 'JOIN exterior_colors ec ON exterior_color_images.exterior_color_id = ec.id WHERE ec.model_id = ?' },
        { tbl: 'interior_color_images', col: 'image_path',
          join: 'JOIN interior_colors ic ON interior_color_images.interior_color_id = ic.id WHERE ic.model_id = ?' },
        { tbl: 'spec_contents', col: 'image_path',
          where: 'type = "photo"',
          join: `JOIN specification_lists sl ON spec_contents.list_id = sl.id
                 JOIN specifications s ON sl.specification_id = s.id
                 WHERE s.model_id = ?` },
        { tbl: 'about_contents', col: 'image_path', where: 'type = "photo"', whereModel: true }
      ];

      for (const q of imgQueries) {
        let sql = `SELECT ${q.col} FROM ${q.tbl}`;
        const params = [];
        if (q.join) { sql += ` ${q.join}`; params.push(modelId); }
        else if (q.whereModel) { sql += ` WHERE model_id = ? AND ${q.where}`; params.push(modelId); }
        else if (q.where) { sql += ` WHERE ${q.where} AND model_id = ?`; params.push(modelId); }
        else { sql += ` WHERE model_id = ?`; params.push(modelId); }

        const [rows] = await c.execute(sql, params);
        for (const r of rows) {
          const p = r[q.col];
          if (!p) continue;
          const full = path.join(rootDir, 'public', p);
          if (fs.existsSync(full)) fs.unlinkSync(full);
        }
      }
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- FULL DELETE ----------
  static async deleteModel(id, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [model] = await connObj.conn.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
      const img = model[0]?.model_image;

      await this.deleteRelatedDataOnly(id, connObj.conn);

      if (img) {
        const p = path.join(rootDir, 'public', img);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }

      await connObj.conn.execute(`DELETE FROM models WHERE id = ?`, [id]);
    } finally {
      await this._release(connObj);
    }
  }
  // ---------- BRAND DETAILS METHODS ----------
  static async getModelsByBrandId(brandId, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [rows] = await connObj.conn.execute(`
        SELECT m.*, v.vehicle_type_name, c.name AS category_name,
               b.name AS brand_name, u.name AS author_name
        FROM models m
        JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
        JOIN categories c ON m.category_id = c.category_id
        JOIN brands b ON m.brand_id = b.brand_id
        JOIN usertable u ON m.author_id = u.user_id
        WHERE m.brand_id = ? AND (m.status = 'published' OR m.status = 'import')
        ORDER BY 
          CASE 
            WHEN m.engine_type LIKE '%electric%' THEN 1
            ELSE 2 
          END,
          m.starting_price ASC
      `, [brandId]);
      return rows;
    } finally {
      await this._release(connObj);
    }
  }

  static async getCategoriesByVehicleType(vehicleTypeId, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [rows] = await connObj.conn.execute(`
        SELECT DISTINCT c.category_id, c.name, c.image_path
        FROM categories c
        JOIN models m ON c.category_id = m.category_id
        WHERE m.vehicle_type_id = ?
        GROUP BY c.category_id, c.name, c.image_path
        ORDER BY COUNT(m.id) DESC
        LIMIT 8
      `, [vehicleTypeId]);
      return rows;
    } finally {
      await this._release(connObj);
    }
  }

  static async getPopularModels(limit = 4, conn) {
    const connObj = await this._getConn(conn);
    try {
      const [rows] = await connObj.conn.execute(`
        SELECT m.*, b.name AS brand_name, v.vehicle_type_name
        FROM models m
        JOIN brands b ON m.brand_id = b.brand_id
        JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
        WHERE m.status = 'published'
        ORDER BY m.created_at DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } finally {
      await this._release(connObj);
    }
  }

// Get models by category ID
static async getModelsByCategoryId(categoryId, conn) {
    const connObj = await this._getConn(conn);
    try {
        const [rows] = await connObj.conn.execute(`
            SELECT m.*, v.vehicle_type_name, c.name AS category_name,
                   b.name AS brand_name, u.name AS author_name
            FROM models m
            JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
            JOIN categories c ON m.category_id = c.category_id
            JOIN brands b ON m.brand_id = b.brand_id
            JOIN usertable u ON m.author_id = u.user_id
            WHERE m.category_id = ?
            ORDER BY 
                CASE 
                    WHEN m.engine_type LIKE '%electric%' THEN 1
                    ELSE 2 
                END,
                m.starting_price ASC
        `, [categoryId]);
        return rows;
    } finally {
        await this._release(connObj);
    }
}

// Replace the existing getPopularModels method with this fixed version:
static async getPopularModels(limit = 4, conn) {
    const connObj = await this._getConn(conn);
    try {
        // Use template literal for limit to avoid parameter issues
        const limitNum = parseInt(limit);
        const query = `
            SELECT m.*, b.name AS brand_name, v.vehicle_type_name
            FROM models m
            JOIN brands b ON m.brand_id = b.brand_id
            JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
            WHERE m.status = 'published' OR m.status = 'import'
            ORDER BY m.created_at DESC
            LIMIT ${limitNum}
        `;
        
        const [rows] = await connObj.conn.execute(query);
        return rows;
    } catch (error) {
        console.error('Error in getPopularModels:', error);
        return [];
    } finally {
        await this._release(connObj);
    }
}

}

module.exports = Model;