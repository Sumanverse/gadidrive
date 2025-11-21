const Brand = require('../../models/brands');
const Model = require('../../models/models');
const VehicleType = require('../../models/vehicletype');

exports.getbrandsdetails = async (req, res, next) => {
    try {
        const { brandId } = req.params;
        
        // Get brand details
        const brand = await Brand.getBrandById(brandId);
        if (!brand) {
            return res.status(404).render('error', { 
                message: 'Brand not found',
                title: 'Brand Not Found - Gyarage'
            });
        }

        // Get all models for this brand
        const models = await Model.getModelsByBrandId(brandId);
        
        // Group models by engine type
        const electricModels = models.filter(model => 
            model.engine_type && model.engine_type.toLowerCase().includes('electric')
        );
        const iceModels = models.filter(model => 
            !model.engine_type || !model.engine_type.toLowerCase().includes('electric')
        );

        // Get related brands (same vehicle type)
        const relatedBrands = await Brand.getBrandsByVehicleType(brand.vehicle_type_id);
        
        // Get categories for this brand's vehicle type
        const categories = await Model.getCategoriesByVehicleType(brand.vehicle_type_id);

        res.render('publicpages/brandsdetails', {
            brand: brand,
            electricModels: electricModels,
            iceModels: iceModels,
            relatedBrands: relatedBrands.filter(b => b.brand_id != brandId).slice(0, 4),
            categories: categories.slice(0, 4),
            title: `All ${brand.name} ${brand.vehicle_type_name} Models Available in USA | Gyarage`,
            description: `Explore all ${brand.name} ${brand.vehicle_type_name} models available in USA. Find detailed specifications, prices, features for electric and ICE vehicles. Complete buying guide.`,
            keywords: `${brand.name} ${brand.vehicle_type_name}, ${brand.name} models, ${brand.name} USA, ${brand.name} ${brand.vehicle_type_name} prices, ${brand.name} specifications, buy ${brand.name}`
        });
    } catch (error) {
        console.error('Error in brand details controller:', error);
        next(error);
    }
};