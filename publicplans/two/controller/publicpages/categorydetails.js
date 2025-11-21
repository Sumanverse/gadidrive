const Category = require('../../models/category');
const Model = require('../../models/models');
const Brand = require('../../models/brands');

exports.getcategorydetails = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        
        // Get category details
        const category = await Category.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).render('error', { 
                message: 'Category not found',
                title: 'Category Not Found - Gyarage'
            });
        }

        // Get all models for this category
        const models = await Model.getModelsByCategoryId(categoryId);
        
        // Group models by engine type
        const electricModels = models.filter(model => 
            model.engine_type && model.engine_type.toLowerCase().includes('electric')
        );
        const iceModels = models.filter(model => 
            !model.engine_type || !model.engine_type.toLowerCase().includes('electric')
        );

        // Get related categories (same vehicle type)
        const relatedCategories = await Category.getRelatedCategories(category.vehicle_type_id, categoryId);
        
        // Get brands that have models in this category
        const brands = await Brand.getBrandsByVehicleType(category.vehicle_type_id);

        res.render('publicpages/categorydetails', {
            category: category,
            electricModels: electricModels,
            iceModels: iceModels,
            relatedCategories: relatedCategories,
            brands: brands.filter(b => b.brand_id).slice(0, 4),
            title: `All ${category.name} ${category.vehicle_type_name} Models Available in USA | Gyarage`,
            description: `Explore all ${category.name} ${category.vehicle_type_name} models available in USA. Find detailed specifications, prices, features for electric and ICE vehicles. Complete buying guide.`,
            keywords: `${category.name} ${category.vehicle_type_name}, ${category.name} models, ${category.name} USA, ${category.name} ${category.vehicle_type_name} prices, ${category.name} specifications, buy ${category.name}`
        });
    } catch (error) {
        console.error('Error in category details controller:', error);
        next(error);
    }
};