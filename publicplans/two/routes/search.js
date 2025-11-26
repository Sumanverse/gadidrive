// routes/search.js — FULL FINAL & PERFECT VERSION (COPY-PASTE GARA)
const express = require('express');
const router = express.Router();
const db = require('../utils/dbutils');

router.get('/search', async (req, res) => {
    const query = (req.query.q || '').toString().trim();

    // Agar query khali cha bhane home ma pathau
    if (!query) return res.redirect('/');

    const searchTerm = `%${query}%`;
    let results = [];

    try {
        // 1. Vehicle Types
        const [vtypes] = await db.query(
            `SELECT 'Vehicle Type' AS type, 
                    vehicle_type_id AS id, 
                    vehicle_type_name AS title, 
                    vehicle_type_photo_path AS image 
             FROM vehicletype 
             WHERE vehicle_type_name LIKE ? 
             LIMIT 10`,
            [searchTerm]
        );

        // 2. Brands
        const [brands] = await db.query(
            `SELECT 'Brand' AS type, 
                    brand_id AS id, 
                    name AS title, 
                    image_path AS image 
             FROM brands 
             WHERE name LIKE ? 
             LIMIT 10`,
            [searchTerm]
        );

        // 3. Categories
        const [categories] = await db.query(
            `SELECT 'Category' AS type, 
                    category_id AS id, 
                    name AS title, 
                    image_path AS image 
             FROM categories 
             WHERE name LIKE ? 
             LIMIT 10`,
            [searchTerm]
        );

        // 4. Models (brand + model name)
        const [models] = await db.query(
            `SELECT 'Model' AS type, 
                    m.id, 
                    CONCAT(b.name, ' ', m.model_name) AS title, 
                    m.model_image AS image
             FROM models m 
             JOIN brands b ON m.brand_id = b.brand_id 
             WHERE m.model_name LIKE ? 
                OR b.name LIKE ? 
                OR CONCAT(b.name, ' ', m.model_name) LIKE ? 
             LIMIT 20`,
            [searchTerm, searchTerm, searchTerm]
        );

        // 5. News/Articles
        const [articles] = await db.query(
            `SELECT 'News' AS type, 
                    Article_id AS id, 
                    Article_title AS title, 
                    Article_main_image AS image
             FROM articles 
             WHERE Article_title LIKE ? 
             LIMIT 10`,
            [searchTerm]
        );

        // 6 here: Authors from usertable (suman, ram, sabai aauncha)
        const [authors] = await db.query(
            `SELECT 'Author' AS type, 
                    user_id AS id, 
                    name AS title, 
                    profile_picture AS image
             FROM usertable 
             WHERE name LIKE ? 
             LIMIT 10`,
            [searchTerm]
        );

        // Combine all results
        results = [...vtypes, ...brands, ...categories, ...models, ...articles, ...authors];

        // Generate correct URLs
        results.forEach(item => {
            if (item.type === 'Vehicle Type') {
                item.url = `/brands?vehicle_type=${item.id}`;
            }
            else if (item.type === 'Brand') {
                item.url = `/brandsdetails/${item.id}`;
            }
            else if (item.type === 'Category') {
                item.url = `/categorydetails/${item.id}`;
            }
            else if (item.type === 'Model') {
                item.url = `/modeldetails/${item.id}`;
            }
            else if (item.type === 'News') {
                const slug = item.title.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                item.url = `/news/${item.id}-${slug}`;
            }
            else if (item.type === 'Author') {
                item.url = `/@${item.id}`;  // Tero controller le yo path expect garcha
            }
        });

        // Render search results page
        res.render('search-results', {
            query,
            results
        });

    } catch (err) {
        console.error('Search Error:', err.message);
        // Error ma ni page crash hudaina
        res.render('search-results', {
            query,
            results: []
        });
    }
});

module.exports = router;