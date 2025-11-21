// controllers/admin/Amodel.js → COMPLETE FIX (All issues 1, 3, 4 resolved) WITH SOURCES FIELD

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

// ---------- IMPROVED CHANGE DETECTORS ----------
const hasRealColorChanges = (body, existing) => {
  const exteriorKeys = Object.keys(body).filter(k => k.startsWith('exteriorColorName'));
  const interiorKeys = Object.keys(body).filter(k => k.startsWith('interiorColorName'));
  
  // If no color fields in form at all, preserve existing colors
  if (exteriorKeys.length === 0 && interiorKeys.length === 0) {
    return false;
  }
  
  // Check if any color name has actually changed from existing data
  let hasChanges = false;
  
  if (existing && existing.exteriorColors) {
    exteriorKeys.forEach((key, index) => {
      const existingColor = existing.exteriorColors[index];
      const newColorName = body[key];
      if (existingColor && existingColor.color_name !== newColorName) {
        hasChanges = true;
      }
    });
  }
  
  if (existing && existing.interiorColors) {
    interiorKeys.forEach((key, index) => {
      const existingColor = existing.interiorColors[index];
      const newColorName = body[key];
      if (existingColor && existingColor.color_name !== newColorName) {
        hasChanges = true;
      }
    });
  }
  
  return hasChanges;
};

// ---------- FIXED: IMPROVED VARIANT CHANGE DETECTOR ----------
const hasRealVariantChanges = (body, existing) => {
  const variantKeys = Object.keys(body).filter(k => k.startsWith('variantName'));
  
  // If no variant fields in form at all, preserve existing variants
  if (variantKeys.length === 0) {
    return false;
  }
  
  // Check if any variant has actually changed OR if new variants were added
  let hasChanges = false;
  
  // If number of variants in form is different from existing, definitely has changes
  if (existing && existing.variants && variantKeys.length !== existing.variants.length) {
    hasChanges = true;
  }
  
  // Check if any variant name or price has changed
  if (existing && existing.variants) {
    variantKeys.forEach((key, index) => {
      const existingVariant = existing.variants[index];
      const newVariantName = body[key];
      const newVariantPrice = body[`variantPrice${index + 1}`];
      
      // If this is a new variant (no existing variant at this index)
      if (!existingVariant) {
        hasChanges = true;
      } else if (existingVariant && 
          (existingVariant.name !== newVariantName || 
           parseFloat(existingVariant.price) !== parseFloat(newVariantPrice.replace(/[^0-9.-]+/g, '')))) {
        hasChanges = true;
      }
    });
  }
  
  return hasChanges;
};

const hasRealSiteChanges = (body, existing) => {
  const siteKeys = Object.keys(body).filter(k => k.startsWith('siteName'));
  
  if (siteKeys.length === 0) {
    return false;
  }
  
  let hasChanges = false;
  
  // If number of sites in form is different from existing, definitely has changes
  if (existing && existing.availableSites && siteKeys.length !== existing.availableSites.length) {
    hasChanges = true;
  }
  
  if (existing && existing.availableSites) {
    siteKeys.forEach((key, index) => {
      const existingSite = existing.availableSites[index];
      const newSiteName = body[key];
      const newSiteLink = body[`siteLink${index + 1}`];
      
      // If this is a new site (no existing site at this index)
      if (!existingSite) {
        hasChanges = true;
      } else if (existingSite && 
          (existingSite.name !== newSiteName || 
           existingSite.link_phone !== newSiteLink)) {
        hasChanges = true;
      }
    });
  }
  
  return hasChanges;
};

const hasRealAboutChanges = (body, existing) => {
  const aboutKeys = Object.keys(body).filter(k => k.startsWith('aboutContentType'));
  
  if (aboutKeys.length === 0) {
    return false;
  }
  
  let hasChanges = false;
  
  if (existing && existing.aboutContents) {
    aboutKeys.forEach((key, index) => {
      const existingAbout = existing.aboutContents[index];
      const newType = body[key];
      const newContent = body[`aboutContent${index + 1}`];
      const newSource = body[`aboutSource${index + 1}`];
      
      if (existingAbout && 
          (existingAbout.type !== newType || 
           existingAbout.value !== newContent ||
           existingAbout.source !== newSource)) {
        hasChanges = true;
      }
    });
  }
  
  return hasChanges;
};

const hasRealSpecChanges = (body, existing) => {
  const specKeys = Object.keys(body).filter(k => k.startsWith('specTitle'));
  
  if (specKeys.length === 0) {
    return false;
  }
  
  let hasChanges = false;
  
  if (existing && existing.specifications) {
    specKeys.forEach((key, index) => {
      const existingSpec = existing.specifications[index];
      const newSpecTitle = body[key];
      
      if (existingSpec && existingSpec.title !== newSpecTitle) {
        hasChanges = true;
      }
    });
  }
  
  return hasChanges;
};

// ---------- FIXED: ULTIMATE PRESERVATION UPDATE ----------
const ultimatePreservationUpdate = async (req, modelId, conn, existingDetails) => {
  const { files = [], body } = req;

  const hasNewFiles = files.length > 0;
  const hasColorChange = hasRealColorChanges(body, existingDetails);
  const hasVariantChange = hasRealVariantChanges(body, existingDetails);
  const hasSiteChange = hasRealSiteChanges(body, existingDetails);
  const hasAboutChange = hasRealAboutChanges(body, existingDetails);
  const hasSpecChange = hasRealSpecChanges(body, existingDetails);

  console.log('Change Detection:', {
    hasNewFiles, hasColorChange, hasVariantChange, 
    hasSiteChange, hasAboutChange, hasSpecChange
  });

  // Only delete and recreate data for sections that actually have changes
  // This prevents other images from being deleted when only one section changes
  if (hasColorChange || (hasNewFiles && hasColorFiles(files))) {
    console.log('Updating colors...');
    await updateColorsSmart(req, modelId, conn, existingDetails);
  } else {
    console.log('Preserving colors - no changes detected');
  }

  // ---------- FIXED: VARIANT UPDATE LOGIC ----------
  if (hasVariantChange) {
    console.log('Updating variants...');
    await Model.deleteVariantsOnly(modelId, conn);
    await insertVariants(req, modelId, conn);
  } else {
    console.log('Preserving variants - no changes detected');
  }

  // ---------- FIXED: SITE UPDATE LOGIC ----------
  if (hasSiteChange) {
    console.log('Updating sites...');
    await Model.deleteSitesOnly(modelId, conn);
    await insertSites(req, modelId, conn);
  } else {
    console.log('Preserving sites - no changes detected');
  }

  if (hasAboutChange || (hasNewFiles && hasAboutFiles(files))) {
    console.log('Updating about contents...');
    await updateAboutContentsSmart(req, modelId, conn, existingDetails);
  } else {
    console.log('Preserving about contents - no changes detected');
  }

  if (hasSpecChange || (hasNewFiles && hasSpecFiles(files))) {
    console.log('Updating specifications...');
    await updateSpecificationsSmart(req, modelId, conn, existingDetails);
  } else {
    console.log('Preserving specifications - no changes detected');
  }
};

// ---------- FIXED: Check if files are related to specific sections ----------
const hasAboutFiles = (files) => {
  return files.some(f => f.fieldname.includes('aboutPhoto'));
};

const hasSpecFiles = (files) => {
  return files.some(f => f.fieldname.includes('specPhoto'));
};

const hasColorFiles = (files) => {
  return files.some(f => f.fieldname.includes('exteriorColorImage') || f.fieldname.includes('interiorColorImage'));
};

// ---------- FIXED: SMART COLOR UPDATE ----------
const updateColorsSmart = async (req, modelId, conn, existingDetails) => {
  const { files = [], body } = req;

  const exteriorKeys = Object.keys(body).filter(k => k.startsWith('exteriorColorName'));
  const interiorKeys = Object.keys(body).filter(k => k.startsWith('interiorColorName'));

  // If no color fields in the form, preserve existing colors
  if (exteriorKeys.length === 0 && interiorKeys.length === 0) {
    console.log('No color fields in form - preserving existing colors');
    return;
  }

  await Model.deleteColorsOnly(modelId, conn);

  // Process exterior colors
  for (const key of exteriorKeys) {
    const idx = key.match(/\d+/)[0];
    const name = body[`exteriorColorName${idx}`];
    if (!name) continue;

    const colorImgFile = files.find(f => f.fieldname === `exteriorColorImage${idx}`);
    
    // Check if we have existing color to preserve image
    let colorImagePath = null;
    if (existingDetails && existingDetails.exteriorColors && existingDetails.exteriorColors[idx - 1]) {
      const existingColor = existingDetails.exteriorColors[idx - 1];
      if (existingColor.color_image && !colorImgFile) {
        // Preserve existing image if no new file uploaded
        colorImagePath = existingColor.color_image;
      }
    }
    
    // Use new file if provided, otherwise use preserved path
    const finalColorImagePath = colorImgFile ? getFilePath(colorImgFile) : colorImagePath;

    const colorId = await Model.createExteriorColor(modelId, { name }, finalColorImagePath, conn);

    // Process additional exterior color images
    const extraImgs = files.filter(f => f.fieldname.startsWith(`exteriorAdditionalColorImage${idx}_`));
    
    // Get existing additional images for this color
    const existingAdditionalImages = existingDetails && existingDetails.exteriorColorImages ? 
      existingDetails.exteriorColorImages.filter(img => {
        const existingColor = existingDetails.exteriorColors[idx - 1];
        return existingColor && img.exterior_color_id === existingColor.id;
      }) : [];

    // Process each additional image slot
    for (let imgIndex = 1; imgIndex <= 8; imgIndex++) {
      const imgFile = files.find(f => f.fieldname === `exteriorAdditionalColorImage${idx}_${imgIndex}`);
      
      // Check if we have existing image to preserve
      let existingImagePath = null;
      if (existingAdditionalImages[imgIndex - 1] && !imgFile) {
        existingImagePath = existingAdditionalImages[imgIndex - 1].image_path;
      }
      
      // Use new file if provided, otherwise use preserved path
      const finalImagePath = imgFile ? getFilePath(imgFile) : existingImagePath;
      
      if (finalImagePath) {
        await Model.createExteriorColorImage(colorId, finalImagePath, conn);
      }
    }
  }

  // Process interior colors
  for (const key of interiorKeys) {
    const idx = key.match(/\d+/)[0];
    const name = body[`interiorColorName${idx}`];
    if (!name) continue;

    const colorImgFile = files.find(f => f.fieldname === `interiorColorImage${idx}`);
    
    // Check if we have existing color to preserve image
    let colorImagePath = null;
    if (existingDetails && existingDetails.interiorColors && existingDetails.interiorColors[idx - 1]) {
      const existingColor = existingDetails.interiorColors[idx - 1];
      if (existingColor.color_image && !colorImgFile) {
        // Preserve existing image if no new file uploaded
        colorImagePath = existingColor.color_image;
      }
    }
    
    // Use new file if provided, otherwise use preserved path
    const finalColorImagePath = colorImgFile ? getFilePath(colorImgFile) : colorImagePath;

    const colorId = await Model.createInteriorColor(modelId, { name }, finalColorImagePath, conn);

    // Process additional interior color images
    const extraImgs = files.filter(f => f.fieldname.startsWith(`interiorAdditionalColorImage${idx}_`));
    
    // Get existing additional images for this color
    const existingAdditionalImages = existingDetails && existingDetails.interiorColorImages ? 
      existingDetails.interiorColorImages.filter(img => {
        const existingColor = existingDetails.interiorColors[idx - 1];
        return existingColor && img.interior_color_id === existingColor.id;
      }) : [];

    // Process each additional image slot
    for (let imgIndex = 1; imgIndex <= 8; imgIndex++) {
      const imgFile = files.find(f => f.fieldname === `interiorAdditionalColorImage${idx}_${imgIndex}`);
      
      // Check if we have existing image to preserve
      let existingImagePath = null;
      if (existingAdditionalImages[imgIndex - 1] && !imgFile) {
        existingImagePath = existingAdditionalImages[imgIndex - 1].image_path;
      }
      
      // Use new file if provided, otherwise use preserved path
      const finalImagePath = imgFile ? getFilePath(imgFile) : existingImagePath;
      
      if (finalImagePath) {
        await Model.createInteriorColorImage(colorId, finalImagePath, conn);
      }
    }
  }
};

// ---------- FIXED: SMART ABOUT CONTENTS UPDATE ----------
const updateAboutContentsSmart = async (req, modelId, conn, existingDetails) => {
  const { files = [], body } = req;
  const aboutKeys = Object.keys(body).filter(k => k.startsWith('aboutContentType'));

  // If no about fields in the form, preserve existing about contents
  if (aboutKeys.length === 0) {
    console.log('No about fields in form - preserving existing about contents');
    return;
  }

  await Model.deleteAboutOnly(modelId, conn);

  for (const k of aboutKeys) {
    const i = k.match(/\d+/)[0];
    const type = body[`aboutContentType${i}`];
    const order = parseInt(i) - 1;

    if (type === 'article' && body[`aboutContent${i}`]) {
      await Model.createAboutContent(modelId, { type: 'article', value: body[`aboutContent${i}`] }, order, conn);
    } else if (type === 'photo') {
      const file = files.find(f => f.fieldname === `aboutPhoto${i}`);
      const source = body[`aboutSource${i}`] || null;
      const content = body[`aboutContent${i}`] || null;
      
      // Check if we have existing content to preserve images
      let imagePath = null;
      if (existingDetails && existingDetails.aboutContents && existingDetails.aboutContents[order]) {
        const existingAbout = existingDetails.aboutContents[order];
        if (existingAbout.type === 'photo' && existingAbout.image_path && !file) {
          // Preserve existing image if no new file uploaded
          imagePath = existingAbout.image_path;
        }
      }
      
      // Use new file if provided, otherwise use preserved path
      const finalImagePath = file ? getFilePath(file) : imagePath;
      
      if (finalImagePath || content) {
        await Model.createAboutContent(modelId, {
          type: 'photo',
          image_path: finalImagePath,
          source,
          value: content
        }, order, conn);
      }
    } else if (type === 'link' && body[`aboutContent${i}`]) {
      await Model.createAboutContent(modelId, { type: 'link', value: body[`aboutContent${i}`] }, order, conn);
    }
  }
};

// ---------- FIXED: SMART SPECIFICATIONS UPDATE ----------
const updateSpecificationsSmart = async (req, modelId, conn, existingDetails) => {
  const { files = [], body } = req;
  const specKeys = Object.keys(body).filter(k => k.startsWith('specTitle'));

  // If no spec fields in the form, preserve existing specifications
  if (specKeys.length === 0) {
    console.log('No spec fields in form - preserving existing specifications');
    return;
  }

  await Model.deleteSpecsOnly(modelId, conn);

  for (const k of specKeys) {
    const sIdx = k.match(/\d+/)[0];
    const title = body[`specTitle${sIdx}`];
    if (!title) continue;

    const specId = await Model.createSpecification(modelId, { title }, conn);
    const listKeys = Object.keys(body).filter(k => k.startsWith(`specListTitle${sIdx}_`));

    for (const lk of listKeys) {
      const lIdx = lk.match(/_(\d+)/)[1];
      const listTitle = body[`specListTitle${sIdx}_${lIdx}`];
      if (!listTitle) continue;

      const listId = await Model.createSpecificationList(specId, { title: listTitle }, conn);
      const contentKeys = Object.keys(body).filter(k => k.startsWith(`specContentType${sIdx}_${lIdx}_`));

      for (const ck of contentKeys) {
        const cIdx = ck.match(/_(\d+)$/)[1];
        const cType = body[`specContentType${sIdx}_${lIdx}_${cIdx}`];

        if (cType === 'article' && body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
          await Model.createSpecContent(listId, { type: 'article', value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] }, conn);
        } else if (cType === 'photo') {
          const file = files.find(f => f.fieldname === `specPhoto${sIdx}_${lIdx}_${cIdx}`);
          const source = body[`specSource${sIdx}_${lIdx}_${cIdx}`] || null;
          const content = body[`specContent${sIdx}_${lIdx}_${cIdx}`] || null;
          
          // Check if we have existing content to preserve images
          let imagePath = null;
          if (existingDetails && existingDetails.specContents) {
            // Find existing spec content with similar parameters
            const existingContent = existingDetails.specContents.find(sc => 
              sc.type === 'photo' && sc.source === source && sc.value === content
            );
            if (existingContent && existingContent.image_path && !file) {
              // Preserve existing image if no new file uploaded
              imagePath = existingContent.image_path;
            }
          }
          
          // Use new file if provided, otherwise use preserved path
          const finalImagePath = file ? getFilePath(file) : imagePath;
          
          if (finalImagePath || content) {
            await Model.createSpecContent(listId, {
              type: 'photo',
              image_path: finalImagePath,
              source,
              value: content
            }, conn);
          }
        } else if (cType === 'link' && body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
          await Model.createSpecContent(listId, { type: 'link', value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] }, conn);
        }
      }
    }
  }
};

// ---------- FIXED: INSERTION FUNCTIONS ----------
const insertAllRelatedData = async (req, modelId, conn) => {
  await updateColorsSmart(req, modelId, conn, null);
  await insertVariants(req, modelId, conn);
  await insertSites(req, modelId, conn);
  await insertAboutContents(req, modelId, conn);
  await insertSpecifications(req, modelId, conn);
};

// ---------- FIXED: VARIANT INSERTION ----------
const insertVariants = async (req, modelId, conn) => {
  const { body } = req;
  const keys = Object.keys(body).filter(k => k.startsWith('variantName'));
  
  console.log('Inserting variants:', keys.length);
  
  for (const k of keys) {
    const i = k.match(/\d+/)[0];
    const name = body[`variantName${i}`];
    const price = body[`variantPrice${i}`];
    
    console.log(`Variant ${i}:`, { name, price });
    
    if (name && price) {
      try {
        await Model.createVariant(modelId, { 
          name, 
          price: parseFloat(price.replace(/[^0-9.-]+/g, '')) 
        }, conn);
        console.log(`Variant ${name} created successfully`);
      } catch (error) {
        console.error(`Error creating variant ${name}:`, error);
        throw error;
      }
    } else {
      console.log(`Skipping variant ${i} - missing name or price`);
    }
  }
};

// ---------- FIXED: SITE INSERTION ----------
const insertSites = async (req, modelId, conn) => {
  const { body } = req;
  const keys = Object.keys(body).filter(k => k.startsWith('siteName'));
  
  console.log('Inserting sites:', keys.length);
  
  for (const k of keys) {
    const i = k.match(/\d+/)[0];
    const name = body[`siteName${i}`];
    const link = body[`siteLink${i}`];
    
    console.log(`Site ${i}:`, { name, link });
    
    if (name && link) {
      try {
        await Model.createAvailableSite(modelId, { name, link }, conn);
        console.log(`Site ${name} created successfully`);
      } catch (error) {
        console.error(`Error creating site ${name}:`, error);
        throw error;
      }
    } else {
      console.log(`Skipping site ${i} - missing name or link`);
    }
  }
};

const insertAboutContents = async (req, modelId, conn) => {
  const { files = [], body } = req;
  const keys = Object.keys(body).filter(k => k.startsWith('aboutContentType'));
  for (const k of keys) {
    const i = k.match(/\d+/)[0];
    const type = body[`aboutContentType${i}`];
    const order = parseInt(i) - 1;

    if (type === 'article' && body[`aboutContent${i}`]) {
      await Model.createAboutContent(modelId, { type: 'article', value: body[`aboutContent${i}`] }, order, conn);
    } else if (type === 'photo') {
      const file = files.find(f => f.fieldname === `aboutPhoto${i}`);
      const source = body[`aboutSource${i}`] || null;
      if (file || body[`aboutContent${i}`]) {
        await Model.createAboutContent(modelId, {
          type: 'photo',
          image_path: file ? getFilePath(file) : null,
          source,
          value: body[`aboutContent${i}`] || null
        }, order, conn);
      }
    } else if (type === 'link' && body[`aboutContent${i}`]) {
      await Model.createAboutContent(modelId, { type: 'link', value: body[`aboutContent${i}`] }, order, conn);
    }
  }
};

const insertSpecifications = async (req, modelId, conn) => {
  const { files = [], body } = req;
  const specKeys = Object.keys(body).filter(k => k.startsWith('specTitle'));
  for (const k of specKeys) {
    const sIdx = k.match(/\d+/)[0];
    const title = body[`specTitle${sIdx}`];
    if (!title) continue;

    const specId = await Model.createSpecification(modelId, { title }, conn);
    const listKeys = Object.keys(body).filter(k => k.startsWith(`specListTitle${sIdx}_`));

    for (const lk of listKeys) {
      const lIdx = lk.match(/_(\d+)/)[1];
      const listTitle = body[`specListTitle${sIdx}_${lIdx}`];
      if (!listTitle) continue;

      const listId = await Model.createSpecificationList(specId, { title: listTitle }, conn);
      const contentKeys = Object.keys(body).filter(k => k.startsWith(`specContentType${sIdx}_${lIdx}_`));

      for (const ck of contentKeys) {
        const cIdx = ck.match(/_(\d+)$/)[1];
        const cType = body[`specContentType${sIdx}_${lIdx}_${cIdx}`];

        if (cType === 'article' && body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
          await Model.createSpecContent(listId, { type: 'article', value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] }, conn);
        } else if (cType === 'photo') {
          const file = files.find(f => f.fieldname === `specPhoto${sIdx}_${lIdx}_${cIdx}`);
          const source = body[`specSource${sIdx}_${lIdx}_${cIdx}`] || null;
          if (file || body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
            await Model.createSpecContent(listId, {
              type: 'photo',
              image_path: file ? getFilePath(file) : null,
              source,
              value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] || null
            }, conn);
          }
        } else if (cType === 'link' && body[`specContent${sIdx}_${lIdx}_${cIdx}`]) {
          await Model.createSpecContent(listId, { type: 'link', value: body[`specContent${sIdx}_${lIdx}_${cIdx}`] }, conn);
        }
      }
    }
  }
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

    const [[vt]] = await conn.execute(`SELECT vehicle_type_name FROM vehicletype WHERE vehicle_type_id = ?`, [model.vehicle_type_id]);
    const [[cat]] = await conn.execute(`SELECT name AS category_name FROM categories WHERE category_id = ?`, [model.category_id]);
    const [[br]] = await conn.execute(`SELECT name AS brand_name FROM brands WHERE brand_id = ?`, [model.brand_id]);
    model.vehicle_type_name = vt?.vehicle_type_name || '';
    model.category_name = cat?.category_name || '';
    model.brand_name = br?.brand_name || '';

    if (model.model_image && !model.model_image.startsWith('/')) {
      model.model_image = '/' + model.model_image;
    }

    if (details) {
      const fixPath = (img) => img && !img.startsWith('/') ? '/' + img : img;
      ['exteriorColors', 'interiorColors'].forEach(key => {
        if (details[key]) details[key].forEach(c => c.color_image = fixPath(c.color_image));
      });
      ['exteriorColorImages', 'interiorColorImages'].forEach(key => {
        if (details[key]) details[key].forEach(i => i.image_path = fixPath(i.image_path));
      });
      ['aboutContents', 'specContents'].forEach(key => {
        if (details[key]) details[key].forEach(c => c.image_path = fixPath(c.image_path));
      });
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
      sources, engineType, startingPrice, releaseYear, seater, status = 'import'
    } = req.body;

    const authorId = req.user.user_id;

    const [[vt]] = await conn.execute(`SELECT vehicle_type_id FROM vehicletype WHERE vehicle_type_name = ?`, [vehicleType]);
    if (!vt) throw new Error(`Vehicle type "${vehicleType}" not found`);

    const [[catRow]] = await conn.execute(`SELECT category_id FROM categories WHERE name = ?`, [category]);
    if (!catRow) throw new Error(`Category "${category}" not found`);
    const cat = catRow.category_id;

    const [[br]] = await conn.execute(`SELECT brand_id FROM brands WHERE name = ?`, [brand]);
    if (!br) throw new Error(`Brand "${brand}" not found`);

    const modelImageFile = req.files?.find(f => f.fieldname === 'modelImage');
    const modelImagePath = modelImageFile ? getFilePath(modelImageFile) : null;

    const modelId = await Model.createModel({
      name: modelName,
      vehicle_type_id: vt.vehicle_type_id,
      category_id: cat,
      brand_id: br.brand_id,
      safety_rating: safetyRating ? parseFloat(safetyRating) : null,
      safety_link: safetyLink || null,
      sources: sources || null,
      engine_type: engineType,
      starting_price: parseFloat(startingPrice.replace(/[^0-9.-]+/g, '')),
      release_year: releaseYear || null,
      seater: seater || null,
      status
    }, modelImagePath, authorId, conn);

    await insertAllRelatedData(req, modelId, conn);
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

    const existingDetails = await Model.getModelDetails(modelId, conn);

    const {
      vehicleType, category, brand, modelName, safetyRating, safetyLink,
      sources, engineType, startingPrice, releaseYear, seater, status = 'import'
    } = req.body;

    const [[vt]] = await conn.execute(`SELECT vehicle_type_id FROM vehicletype WHERE vehicle_type_name = ?`, [vehicleType]);
    if (!vt) throw new Error(`Vehicle type "${vehicleType}" not found`);

    const [[catRow]] = await conn.execute(`SELECT category_id FROM categories WHERE name = ?`, [category]);
    if (!catRow) throw new Error(`Category "${category}" not found`);
    const cat = catRow.category_id;

    const [[br]] = await conn.execute(`SELECT brand_id FROM brands WHERE name = ?`, [brand]);
    if (!br) throw new Error(`Brand "${brand}" not found`);

    const oldModel = await Model.getModelById(modelId, conn);
    const newImageFile = req.files?.find(f => f.fieldname === 'modelImage');
    
    let newImagePath = oldModel.model_image;
    if (newImageFile) {
      newImagePath = getFilePath(newImageFile);
      if (oldModel.model_image) {
        const oldPath = path.join(rootDir, 'public', oldModel.model_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await Model.updateModel(modelId, {
      name: modelName,
      vehicle_type_id: vt.vehicle_type_id,
      category_id: cat,
      brand_id: br.brand_id,
      safety_rating: safetyRating ? parseFloat(safetyRating) : null,
      safety_link: safetyLink || null,
      sources: sources || null,
      engine_type: engineType,
      starting_price: parseFloat(startingPrice.replace(/[^0-9.-]+/g, '')),
      release_year: releaseYear || null,
      seater: seater || null,
      status
    }, newImagePath, req.user.user_id, conn);

    await ultimatePreservationUpdate(req, modelId, conn, existingDetails);

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