// controllers/admin/Amodels.js → FULLY FIXED & COMPLETE
const db = require('../../utils/dbutils');
const path = require('path');
const fs = require('fs');
const rootDir = require('../../utils/pathutil');
const Model = require('../../models/models');

// ---------- HELPER: Safe File Path ----------
const getFilePath = (file) => {
  if (!file) return null;
  return file.path
    .replace(/^.*public/, '')
    .replace(/\\/g, '/');
};

// ---------- GET: render admin page ----------
const getadminmodel = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const [vehicleTypes] = await conn.execute(`SELECT * FROM vehicletype`);
    const [categories] = await conn.execute(`SELECT * FROM categories`);
    const [brands] = await conn.execute(`SELECT * FROM brands`);

    res.render('admin/Amodels', {
      title: 'Model Admin',
      path: '/admin/model',
      vehicleTypes, categories, brands,
      model: null, details: null,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load page.');
    res.redirect('/admin/model');
  } finally {
    if (conn) conn.release();
  }
};

// ---------- GET: edit model ----------
const getModelById = async (req, res) => {
  const modelId = req.params.modelId;
  let conn;
  try {
    conn = await db.getConnection();
    const model = await Model.getModelById(modelId, conn);
    const details = await Model.getModelDetails(modelId, conn);

    const [vehicleTypes] = await conn.execute(`SELECT * FROM vehicletype`);
    const [categories] = await conn.execute(`SELECT * FROM categories`);
    const [brands] = await conn.execute(`SELECT * FROM brands`);

    if (!model) return res.redirect('/admin/model');

    // Add names for select options
    const [[vt]] = await conn.execute(`SELECT vehicle_type_name FROM vehicletype WHERE vehicle_type_id = ?`, [model.vehicle_type_id]);
    const [[cat]] = await conn.execute(`SELECT name AS category_name FROM categories WHERE category_id = ?`, [model.category_id]);
    const [[br]] = await conn.execute(`SELECT name AS brand_name FROM brands WHERE brand_id = ?`, [model.brand_id]);
    model.vehicle_type_name = vt?.vehicle_type_name || '';
    model.category_name = cat?.category_name || '';
    model.brand_name = br?.brand_name || '';

    // FIX: Ensure model_image is properly formatted for display
    if (model.model_image && !model.model_image.startsWith('/')) {
      model.model_image = '/' + model.model_image;
    }

    // FIX: Process details images to ensure proper paths
    if (details) {
      // Process exterior colors
      if (details.exteriorColors) {
        details.exteriorColors.forEach(color => {
          if (color.color_image && !color.color_image.startsWith('/')) {
            color.color_image = '/' + color.color_image;
          }
        });
      }
      
      // Process interior colors
      if (details.interiorColors) {
        details.interiorColors.forEach(color => {
          if (color.color_image && !color.color_image.startsWith('/')) {
            color.color_image = '/' + color.color_image;
          }
        });
      }
      
      // Process exterior color images
      if (details.exteriorColorImages) {
        details.exteriorColorImages.forEach(img => {
          if (img.image_path && !img.image_path.startsWith('/')) {
            img.image_path = '/' + img.image_path;
          }
        });
      }
      
      // Process interior color images
      if (details.interiorColorImages) {
        details.interiorColorImages.forEach(img => {
          if (img.image_path && !img.image_path.startsWith('/')) {
            img.image_path = '/' + img.image_path;
          }
        });
      }
      
      // Process about contents images
      if (details.aboutContents) {
        details.aboutContents.forEach(content => {
          if (content.image_path && !content.image_path.startsWith('/')) {
            content.image_path = '/' + content.image_path;
          }
        });
      }
      
      // Process spec contents images
      if (details.specContents) {
        details.specContents.forEach(content => {
          if (content.image_path && !content.image_path.startsWith('/')) {
            content.image_path = '/' + content.image_path;
          }
        });
      }
    }

    res.render('admin/Amodels', {
      title: 'Edit Model',
      path: '/admin/model',
      model, details: details || {}, vehicleTypes, categories, brands,
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load model.');
    res.redirect('/admin/model');
  } finally {
    if (conn) conn.release();
  }
};

// ---------- POST: create ----------
const postAdminModel = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const {
      vehicleType, category, brand, modelName, safetyRating, safetyLink,
      engineType, startingPrice, status = 'import'
    } = req.body;

    const authorId = req.user.user_id;

    // ---- resolve foreign keys ----
    const [[vt]] = await conn.execute(
      `SELECT vehicle_type_id FROM vehicletype WHERE vehicle_type_name = ?`,
      [vehicleType]
    );
    if (!vt) throw new Error(`Vehicle type "${vehicleType}" not found`);

    const [[catRow]] = await conn.execute(
      `SELECT category_id FROM categories WHERE name = ?`,
      [category]
    );
    if (!catRow) throw new Error(`Category "${category}" not found`);
    const cat = catRow.category_id;

    const [[br]] = await conn.execute(
      `SELECT brand_id FROM brands WHERE name = ?`,
      [brand]
    );
    if (!br) throw new Error(`Brand "${brand}" not found`);

    // ---- model image (SAFE) ----
    const modelImageFile = req.files?.find(f => f.fieldname === 'modelImage');
    const modelImagePath = modelImageFile ? getFilePath(modelImageFile) : null;

    const modelId = await Model.createModel({
      name: modelName,
      vehicle_type_id: vt.vehicle_type_id,
      category_id: cat,
      brand_id: br.brand_id,
      safety_rating: safetyRating ? parseFloat(safetyRating) : null,
      safety_link: safetyLink || null,
      engine_type: engineType,
      starting_price: parseFloat(startingPrice.replace(/[^0-9.-]+/g, '')),
      status
    }, modelImagePath, authorId, conn);

    await insertRelatedData(req, modelId, conn);
    await conn.commit();

    req.flash('success_msg', 'Model published successfully!');
    res.redirect('/admin/model');
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    req.flash('error_msg', err.message || 'Failed to publish model.');
    res.redirect('/admin/model');
  } finally {
    if (conn) conn.release();
  }
};

// ---------- PUT: update ----------
const updateAdminModel = async (req, res) => {
  const modelId = req.params.modelId;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const {
      vehicleType, category, brand, modelName, safetyRating, safetyLink,
      engineType, startingPrice, status = 'import'
    } = req.body;

    // ---- foreign keys ----
    const [[vt]] = await conn.execute(
      `SELECT vehicle_type_id FROM vehicletype WHERE vehicle_type_name = ?`,
      [vehicleType]
    );
    if (!vt) throw new Error(`Vehicle type "${vehicleType}" not found`);

    const [[catRow]] = await conn.execute(
      `SELECT category_id FROM categories WHERE name = ?`,
      [category]
    );
    if (!catRow) throw new Error(`Category "${category}" not found`);
    const cat = catRow.category_id;

    const [[br]] = await conn.execute(
      `SELECT brand_id FROM brands WHERE name = ?`,
      [brand]
    );
    if (!br) throw new Error(`Brand "${brand}" not found`);

    // ---- image handling ----
    const oldModel = await Model.getModelById(modelId, conn);
    const newImageFile = req.files?.find(f => f.fieldname === 'modelImage');
    const newImagePath = newImageFile ? getFilePath(newImageFile) : oldModel.model_image;

    if (newImageFile && oldModel.model_image) {
      const oldPath = path.join(rootDir, 'public', oldModel.model_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await Model.updateModel(modelId, {
      name: modelName,
      vehicle_type_id: vt.vehicle_type_id,
      category_id: cat,
      brand_id: br.brand_id,
      safety_rating: safetyRating ? parseFloat(safetyRating) : null,
      safety_link: safetyLink || null,
      engine_type: engineType,
      starting_price: parseFloat(startingPrice.replace(/[^0-9.-]+/g, '')),
      status
    }, newImagePath, req.user.user_id, conn);

    // ---- replace all related data ----
    await Model.deleteRelatedDataOnly(modelId, conn);
    await insertRelatedData(req, modelId, conn);

    await conn.commit();
    req.flash('success_msg', 'Model updated successfully!');
    res.redirect('/admin/model');
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    req.flash('error_msg', err.message || 'Failed to update model.');
    res.redirect('/admin/model');
  } finally {
    if (conn) conn.release();
  }
};

// ---------- Helper: Safe File Access ----------
const getFiles = (filesObj, fieldname) => {
  if (!filesObj) return [];
  return filesObj.filter(f => f.fieldname.startsWith(fieldname));
};

// ---------- FIXED Helper: Process Color Images ----------
const processColorImages = (files, colorIndex, isExterior) => {
  const prefix = isExterior ? 'exteriorAdditionalColorImage' : 'interiorAdditionalColorImage';
  const pattern = new RegExp(`^${prefix}${colorIndex}_(\\d+)$`);
  
  return files
    .filter(f => pattern.test(f.fieldname))
    .sort((a, b) => {
      const aNum = parseInt(a.fieldname.match(pattern)[1]);
      const bNum = parseInt(b.fieldname.match(pattern)[1]);
      return aNum - bNum;
    });
};

// ---------- FIXED Helper: insert everything ----------
const insertRelatedData = async (req, modelId, conn) => {
  const { files = [], body } = req;

  // ---- EXTERIOR COLORS ----
  const exteriorKeys = Object.keys(body).filter(k => k.startsWith('exteriorColorName'));
  for (const key of exteriorKeys) {
    const idx = key.match(/\d+/)[0];
    const name = body[`exteriorColorName${idx}`];
    if (!name) continue;

    const colorImgFile = files.find(f => f.fieldname === `exteriorColorImage${idx}`);
    const colorId = await Model.createExteriorColor(
      modelId,
      { name },
      colorImgFile ? getFilePath(colorImgFile) : null,
      conn
    );

    // FIXED: Use the new helper function to get additional images
    const extraImgs = processColorImages(files, idx, true);
    
    console.log(`Exterior Color ${idx}: Found ${extraImgs.length} additional images`);
    
    for (const img of extraImgs) {
      await Model.createExteriorColorImage(colorId, getFilePath(img), conn);
    }
  }

  // ---- INTERIOR COLORS ----
  const interiorKeys = Object.keys(body).filter(k => k.startsWith('interiorColorName'));
  for (const key of interiorKeys) {
    const idx = key.match(/\d+/)[0];
    const name = body[`interiorColorName${idx}`];
    if (!name) continue;

    const colorImgFile = files.find(f => f.fieldname === `interiorColorImage${idx}`);
    const colorId = await Model.createInteriorColor(
      modelId,
      { name },
      colorImgFile ? getFilePath(colorImgFile) : null,
      conn
    );

    // FIXED: Use the new helper function to get additional images
    const extraImgs = processColorImages(files, idx, false);
    
    console.log(`Interior Color ${idx}: Found ${extraImgs.length} additional images`);
    
    for (const img of extraImgs) {
      await Model.createInteriorColorImage(colorId, getFilePath(img), conn);
    }
  }

  // ---- VARIANTS ----
  const variantKeys = Object.keys(body).filter(k => k.startsWith('variantName'));
  for (const key of variantKeys) {
    const idx = key.match(/\d+/)[0];
    const name = body[`variantName${idx}`];
    const price = body[`variantPrice${idx}`];
    if (name && price) {
      await Model.createVariant(
        modelId,
        { name, price: parseFloat(price.replace(/[^0-9.-]+/g, '')) },
        conn
      );
    }
  }

  // ---- SITES ----
  const siteKeys = Object.keys(body).filter(k => k.startsWith('siteName'));
  for (const key of siteKeys) {
    const idx = key.match(/\d+/)[0];
    const name = body[`siteName${idx}`];
    const link = body[`siteLink${idx}`];
    if (name && link) {
      await Model.createAvailableSite(modelId, { name, link }, conn);
    }
  }

  // ---- ABOUT CONTENTS ----
  const aboutKeys = Object.keys(body).filter(k => k.startsWith('aboutContentType'));
  for (const key of aboutKeys) {
    const idx = key.match(/\d+/)[0];
    const type = body[`aboutContentType${idx}`];
    const order = parseInt(idx) - 1;

    if (type === 'article' && body[`aboutContent${idx}`]) {
      await Model.createAboutContent(
        modelId,
        { type: 'article', value: body[`aboutContent${idx}`] },
        order,
        conn
      );
    } else if (type === 'photo') {
      const photoFile = files.find(f => f.fieldname === `aboutPhoto${idx}`);
      if (photoFile) {
        await Model.createAboutContent(
          modelId,
          {
            type: 'photo',
            image_path: getFilePath(photoFile),
            source: body[`aboutSource${idx}`] || null
          },
          order,
          conn
        );
      }
    } else if (type === 'link' && body[`aboutContent${idx}`]) {
      await Model.createAboutContent(
        modelId,
        { type: 'link', value: body[`aboutContent${idx}`] },
        order,
        conn
      );
    }
  }

  // ---- SPECIFICATIONS ----
  const specKeys = Object.keys(body).filter(k => k.startsWith('specTitle'));
  for (const key of specKeys) {
    const sIdx = key.match(/\d+/)[0];
    const title = body[`specTitle${sIdx}`];
    if (!title) continue;

    const specId = await Model.createSpecification(modelId, { title }, conn);

    const listKeys = Object.keys(body).filter(k => k.startsWith(`specListTitle${sIdx}_`));
    for (const lKey of listKeys) {
      const lIdx = lKey.match(/_(\d+)/)[1];
      const listTitle = body[`specListTitle${sIdx}_${lIdx}`];
      if (!listTitle) continue;

      const listId = await Model.createSpecificationList(specId, { title: listTitle }, conn);

      const contentKeys = Object.keys(body).filter(k => k.startsWith(`specContentType${sIdx}_${lIdx}_`));
      for (const cKey of contentKeys) {
        const cIdx = cKey.match(/_(\d+)$/)[1];
        const cType = body[`specContentType${sIdx}_${lIdx}_${cIdx}`];

        if (cType === 'article' && body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
          await Model.createSpecContent(
            listId,
            { type: 'article', value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] },
            conn
          );
        } else if (cType === 'photo') {
          const photoFile = files.find(f => f.fieldname === `specPhoto${sIdx}_${lIdx}_${cIdx}`);
          if (photoFile) {
            await Model.createSpecContent(
              listId,
              {
                type: 'photo',
                image_path: getFilePath(photoFile),
                source: body[`specSource${sIdx}_${lIdx}_${cIdx}`] || null
              },
              conn
            );
          }
        } else if (cType === 'link' && body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
          await Model.createSpecContent(
            listId,
            { type: 'link', value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] },
            conn
          );
        }
      }
    }
  }
};

// ---------- DELETE ----------
const deleteAdminModel = async (req, res) => {
  const modelId = req.params.modelId;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    await Model.deleteModel(modelId, conn);
    await conn.commit();
    req.flash('success_msg', 'Model deleted successfully.');
    res.redirect('/admin/model');
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    req.flash('error_msg', 'Failed to delete model.');
    res.redirect('/admin/model');
  } finally {
    if (conn) conn.release();
  }
};

// ---------- FILTER ----------
const getFilteredModels = async (req, res) => {
  const { vehicleTypeId, brandId } = req.query;
  let conn;
  try {
    conn = await db.getConnection();
    let sql = `SELECT m.*, v.vehicle_type_name, c.name AS category_name, b.name AS brand_name,
                      COALESCE(m.model_image, '/images/placeholder.png') AS model_image_path
               FROM models m
               JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
               JOIN categories c ON m.category_id = c.category_id
               JOIN brands b ON m.brand_id = b.brand_id
               WHERE 1=1`;
    const params = [];
    if (vehicleTypeId) { sql += ` AND m.vehicle_type_id = ?`; params.push(vehicleTypeId); }
    if (brandId) { sql += ` AND m.brand_id = ?`; params.push(brandId); }

    const [rows] = await conn.execute(sql, params);
    const formatted = rows.map(row => ({
      ...row,
      model_image: row.model_image_path
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (conn) conn.release();
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