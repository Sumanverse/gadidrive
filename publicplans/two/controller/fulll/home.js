// controller/fulll/home.js - UPDATED
const VehicleType = require('../../models/vehicletype');
const Category = require('../../models/category');
const Brand = require('../../models/brands');
const Model = require('../../models/models');
const Article = require('../../models/Article');

exports.gethome = async (req, res, next) => {
    try {
        // Get all data with proper error handling
        let vehicleTypes = [], allArticles = [], categories = [], brands = [], models = [];
        
        try {
            vehicleTypes = await VehicleType.getAllVehicleTypes();
            console.log('Vehicle types found:', vehicleTypes.length);
        } catch (err) {
            console.error('Error fetching vehicle types:', err);
        }
        
        try {
            allArticles = await Article.findAll();
            console.log('Articles found:', allArticles.length);
            
            // Double-check and fix any remaining image path issues
            if (Array.isArray(allArticles)) {
                allArticles.forEach(article => {
                    if (article.Article_main_image && !article.Article_main_image.startsWith('/')) {
                        article.Article_main_image = `/uploads/articles/${article.Article_main_image}`;
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching articles:', err);
        }
        
        try {
            categories = await Category.getAllCategories();
            console.log('Categories found:', categories.length);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
        
        try {
            brands = await Brand.getAllBrands();
            console.log('Brands found:', brands.length);
        } catch (err) {
            console.error('Error fetching brands:', err);
        }
        
        try {
            models = await Model.getPopularModels(4);
            console.log('Popular models found:', models ? models.length : 0);
            
            // If no models returned, try fallback
            if (!models || models.length === 0) {
                models = await Model.getAllModels();
                console.log('All models found (fallback):', models ? models.length : 0);
            }
        } catch (err) {
            console.error('Error fetching models:', err);
            try {
                models = await Model.getAllModels();
                console.log('All models found (error fallback):', models ? models.length : 0);
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
            }
        }

        // Process the data with safety checks
        const popularVehicleTypes = Array.isArray(vehicleTypes) ? vehicleTypes.slice(0, 4) : [];
        const popularArticles = Array.isArray(allArticles) ? allArticles.slice(0, 2) : [];
        const popularCategories = Array.isArray(categories) ? categories.slice(0, 4) : [];
        const popularBrands = Array.isArray(brands) ? brands.slice(0, 4) : [];
        const popularModels = Array.isArray(models) ? models.slice(0, 4) : [];

        // Get random articles avoiding redundancy
        const getRandomArticles = (startIndex, count) => {
            if (!Array.isArray(allArticles) || allArticles.length <= startIndex) return [];
            return allArticles.slice(startIndex, startIndex + count);
        };

        const articlesAfterCategories = getRandomArticles(2, 2);
        const articlesAfterBrands = getRandomArticles(4, 2);
        const articlesAfterModels = getRandomArticles(6, 2);

        // Debug: Check what we're sending to the template
        console.log('Final data for template:', {
            vehicleTypes: popularVehicleTypes.length,
            articlesAfterVehicleTypes: popularArticles.length,
            categories: popularCategories.length,
            articlesAfterCategories: articlesAfterCategories.length,
            brands: popularBrands.length,
            articlesAfterBrands: articlesAfterBrands.length,
            models: popularModels.length,
            articlesAfterModels: articlesAfterModels.length
        });

        // Debug: Check article image paths
        if (popularArticles.length > 0) {
            console.log('First article image path:', popularArticles[0].Article_main_image);
        }

        res.render('publicpages/home', {
            title: 'Gyarage - Home',
            vehicleTypes: popularVehicleTypes,
            articlesAfterVehicleTypes: popularArticles,
            categories: popularCategories,
            articlesAfterCategories: articlesAfterCategories,
            brands: popularBrands,
            articlesAfterBrands: articlesAfterBrands,
            models: popularModels,
            articlesAfterModels: articlesAfterModels
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('publicpages/home', {
            title: 'Gyarage - Home',
            vehicleTypes: [],
            articlesAfterVehicleTypes: [],
            categories: [],
            articlesAfterCategories: [],
            brands: [],
            articlesAfterBrands: [],
            models: [],
            articlesAfterModels: []
        });
    }
};