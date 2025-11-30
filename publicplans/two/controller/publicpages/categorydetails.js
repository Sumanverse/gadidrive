const Category = require('../../models/category');
const Model = require('../../models/models');
const Brand = require('../../models/brands');

exports.getcategorydetails = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).render('error', { message: 'Category not found' });
        }

        const models = await Model.getModelsByCategoryId(categoryId);

        // Proper classification – यो एकदम accurate छ
        const electricModels = models.filter(m =>
            m.engine_type && /electric/i.test(m.engine_type) && !/hybrid|phev/i.test(m.engine_type)
        );

        const iceModels = models.filter(m =>
            !m.engine_type ||
            /(petrol|gasoline|diesel)/i.test(m.engine_type) ||
            (!/electric|hybrid|phev/i.test(m.engine_type))
        );

        const hybridModels = models.filter(m =>
            m.engine_type && /hybrid/i.test(m.engine_type) && !/phev|plug-in/i.test(m.engine_type)
        );

        const phevModels = models.filter(m =>
            m.engine_type && (/phev|plug-in|plugin/i.test(m.engine_type))
        );

        // Debug: हेर्न चाहियो भने console मा log गर
        console.log({
            total: models.length,
            electric: electricModels.length,
            ice: iceModels.length,
            hybrid: hybridModels.length,
            phev: phevModels.length
        });

        res.render('publicpages/categorydetails', {
            category,
            electricModels,
            iceModels,
            hybridModels,
            phevModels,
            title: `All ${category.name} ${category.vehicle_type_name}s in USA | Gyarage`,
            description: `Explore latest ${category.name} ${category.vehicle_type_name}s - Electric, Hybrid, PHEV, Petrol & Diesel models in USA.`,
            keywords: `${category.name}, ${category.name} USA, ${category.name} electric, ${category.name} hybrid`
        });

    } catch (error) {
        console.error('Error in categorydetails:', error);
        next(error);
    }
};