// models/models.js
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
      safety_rating, safety_link, engine_type, starting_price, status = 'import'
    } = data;

    const connObj = await this._getConn(conn);
    try {
      const [dup] = await connObj.conn.execute(
        `SELECT id FROM models WHERE model_name = ? AND brand_id = ?`,
        [name, brand_id]
      );
      if (dup.length) throw new Error(`Model "${name}" already exists for this brand`);

      const img = imagePath ? imagePath.replace(/\\/g, '/') : null;
      const [res] = await connObj.conn.execute(
        `INSERT INTO models
         (model_name, vehicle_type_id, category_id, brand_id, model_image,
          safety_rating, safety_link, engine_type, starting_price, author_id,
          published_date, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
        [
          name, vehicle_type_id, category_id, brand_id, img,
          safety_rating ?? null, safety_link ?? null, engine_type,
          starting_price, authorId, status
        ]
      );
      return res.insertId;
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- EXTERIOR ----------
  static async createExteriorColor(modelId, { name }, imagePath, conn) {
    const img = imagePath ? imagePath.replace(/\\/g, '/') : null;
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
    const img = imagePath.replace(/\\/g, '/');
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
    const img = imagePath ? imagePath.replace(/\\/g, '/') : null;
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
    const img = imagePath.replace(/\\/g, '/');
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
    const img = image_path ? image_path.replace(/\\/g, '/') : null;
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
    const img = image_path ? image_path.replace(/\\/g, '/') : null;
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
      // exterior
      const [exterior] = await connObj.conn.execute(
        `SELECT ec.id, ec.color_name, ec.color_image,
                GROUP_CONCAT(eci.image_path) AS extra_imgs
         FROM exterior_colors ec
         LEFT JOIN exterior_color_images eci ON ec.id = eci.exterior_color_id
         WHERE ec.model_id = ?
         GROUP BY ec.id`,
        [modelId]
      );
      const exteriorColors = exterior.map(c => ({
        ...c,
        extra_imgs: c.extra_imgs ? c.extra_imgs.split(',') : []
      }));

      // interior
      const [interior] = await connObj.conn.execute(
        `SELECT ic.id, ic.color_name, ic.color_image,
                GROUP_CONCAT(ici.image_path) AS extra_imgs
         FROM interior_colors ic
         LEFT JOIN interior_color_images ici ON ic.id = ici.interior_color_id
         WHERE ic.model_id = ?
         GROUP BY ic.id`,
        [modelId]
      );
      const interiorColors = interior.map(c => ({
        ...c,
        extra_imgs: c.extra_imgs ? c.extra_imgs.split(',') : []
      }));

      const [variants] = await connObj.conn.execute(`SELECT * FROM variants WHERE model_id = ?`, [modelId]);
      const [availableSites] = await connObj.conn.execute(`SELECT * FROM available_sites WHERE model_id = ?`, [modelId]);

      // specifications (full tree)
      const [specs] = await connObj.conn.execute(
        `SELECT id, title FROM specifications WHERE model_id = ? ORDER BY id`,
        [modelId]
      );
      const specifications = await Promise.all(
        specs.map(async s => {
          const [lists] = await connObj.conn.execute(
            `SELECT id, title FROM specification_lists WHERE specification_id = ? ORDER BY id`,
            [s.id]
          );
          const listsFull = await Promise.all(
            lists.map(async l => {
              const [contents] = await connObj.conn.execute(
                `SELECT type, value, image_path, source FROM spec_contents WHERE list_id = ? ORDER BY id`,
                [l.id]
              );
              return { ...l, contents };
            })
          );
          return { ...s, lists: listsFull };
        })
      );

      const [about] = await connObj.conn.execute(
        `SELECT type, value, image_path, source FROM about_contents WHERE model_id = ? ORDER BY content_order`,
        [modelId]
      );

      return {
        exteriorColors,
        interiorColors,
        variants,
        availableSites,
        specifications,
        aboutContents: about
      };
    } finally {
      await this._release(connObj);
    }
  }

  // ---------- UPDATE ----------
  static async updateModel(id, data, imagePath, authorId, conn) {
    const {
      name, vehicle_type_id, category_id, brand_id,
      safety_rating, safety_link, engine_type, starting_price, status
    } = data;

    const img = imagePath ? imagePath.replace(/\\/g, '/') : null;
    const connObj = await this._getConn(conn);
    try {
      // delete old image if a new one is uploaded
      if (img) {
        const [old] = await connObj.conn.execute(`SELECT model_image FROM models WHERE id = ?`, [id]);
        if (old[0]?.model_image) {
          const p = path.join(rootDir, 'public', old[0].model_image);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
      }

      await connObj.conn.execute(
        `UPDATE models SET
           model_name = ?, vehicle_type_id = ?, category_id = ?, brand_id = ?,
           model_image = COALESCE(?, model_image),
           safety_rating = ?, safety_link = ?, engine_type = ?, starting_price = ?,
           author_id = ?, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          name, vehicle_type_id, category_id, brand_id, img,
          safety_rating ?? null, safety_link ?? null, engine_type,
          starting_price, authorId, status || 'import', id
        ]
      );
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
}

module.exports = Model;