const Model = require('../../models/models');
const db = require('../../utils/dbutils');

exports.getcompare = async (req, res, next) => {
    try {
        // Get vehicle types for dropdown
        const vehicleTypes = await getVehicleTypes();
        
        // Get popular models for recommendations
        const popularModels = await Model.getPopularModels(8);
        
        res.render('./publicpages/compare', {
            vehicleTypes: vehicleTypes || [],
            popularModels: popularModels || [],
            selectedModels: [],
            comparisonData: null,
            currentPage: 'compare     '
        });
    } catch (error) {
        console.error('Error in compare controller:', error);
        res.render('./publicpages/compare', {
            vehicleTypes: [],
            popularModels: [],
            selectedModels: [],
            comparisonData: null,
            error: 'Error loading comparison page'
        });
    }
};

// Get vehicle types
async function getVehicleTypes() {
    try {
        const [rows] = await db.execute(`
            SELECT vehicle_type_id, vehicle_type_name 
            FROM vehicletype 
            ORDER BY vehicle_type_name
        `);
        return rows;
    } catch (error) {
        console.error('Error fetching vehicle types:', error);
        return [];
    }
}

// Get brands by vehicle type
exports.getBrandsByVehicleType = async (req, res, next) => {
    try {
        const { vehicleTypeId } = req.params;
        
        const [brands] = await db.execute(`
            SELECT DISTINCT b.brand_id, b.name 
            FROM brands b
            JOIN models m ON b.brand_id = m.brand_id
            WHERE m.vehicle_type_id = ?
            ORDER BY b.name
        `, [vehicleTypeId]);
        
        res.json({
            success: true,
            brands: brands || []
        });
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching brands'
        });
    }
};

// Get models by brand and vehicle type
exports.getModelsByBrand = async (req, res, next) => {
    try {
        const { vehicleTypeId, brandId } = req.params;
        
        const [models] = await db.execute(`
            SELECT m.id, m.model_name, m.model_image, m.starting_price
            FROM models m
            WHERE m.vehicle_type_id = ? AND m.brand_id = ?
            AND (m.status = 'published' OR m.status = 'import')
            ORDER BY m.model_name
        `, [vehicleTypeId, brandId]);
        
        res.json({
            success: true,
            models: models || []
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching models'
        });
    }
};

// Get model details for comparison
exports.getModelDetails = async (req, res, next) => {
    try {
        const { modelId } = req.params;
        
        const model = await Model.getModelById(modelId);
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found'
            });
        }
        
        const details = await Model.getModelDetails(modelId);
        
        res.json({
            success: true,
            model: {
                ...model,
                details: details
            }
        });
    } catch (error) {
        console.error('Error fetching model details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching model details'
        });
    }
};

// Handle comparison
exports.postCompare = async (req, res, next) => {
    try {
        const { modelIds } = req.body;
        
        if (!modelIds || !Array.isArray(modelIds) || modelIds.length < 2 || modelIds.length > 4) {
            return res.status(400).json({
                success: false,
                message: 'Please select 2 to 4 vehicles to compare'
            });
        }

        // Get models data
        const models = [];
        for (const modelId of modelIds) {
            const model = await Model.getModelById(modelId);
            if (model) {
                const details = await Model.getModelDetails(modelId);
                models.push({
                    ...model,
                    details: details
                });
            }
        }

        if (models.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Could not find selected models'
            });
        }

        // Generate comparison data
        const comparisonData = generateComparisonData(models);
        
        // Get popular models for recommendations
        const popularModels = await Model.getPopularModels(8);

        res.json({
            success: true,
            comparisonData: comparisonData,
            popularModels: popularModels || []
        });

    } catch (error) {
        console.error('Error in postCompare:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing comparison'
        });
    }
};

// Function to generate comparison data
function generateComparisonData(models) {
    const allSpecs = new Set();
    const modelsData = [];
    
    // Collect all unique specifications from all models
    models.forEach(model => {
        // Add basic model specs to the set
        if (model.engine_type) allSpecs.add('Engine Type');
        if (model.power) allSpecs.add('Power');
        if (model.torque) allSpecs.add('Torque');
        if (model.ground_clearance) allSpecs.add('Ground Clearance');
        if (model.dimensions) allSpecs.add('Dimensions');
        if (model.drive_type) allSpecs.add('Drive Type');
        if (model.seater) allSpecs.add('Seating Capacity');
        if (model.total_airbags) allSpecs.add('Total Airbags');
        if (model.boot_space) allSpecs.add('Boot Space');
        if (model.range_mileage) allSpecs.add(model.engine_type && model.engine_type.toLowerCase().includes('electric') ? 'Range' : 'Mileage');
        if (model.battery_capacity) allSpecs.add('Battery Capacity');
        if (model.cylinders) allSpecs.add('Cylinders');
        if (model.fuel_tank) allSpecs.add('Fuel Tank Capacity');
        if (model.starting_price) allSpecs.add('Price');
        if (model.safety_rating) allSpecs.add('Safety Rating');
        if (model.release_year) allSpecs.add('Launch Year');
        if (model.engine) allSpecs.add('Engine');

        // Add detailed specifications
        if (model.details && model.details.specifications) {
            model.details.specifications.forEach(spec => {
                const specLists = model.details.specificationLists.filter(
                    list => list.specification_id === spec.id
                );
                specLists.forEach(list => {
                    allSpecs.add(list.title);
                });
            });
        }
    });

    // Prepare models data with specification availability
    models.forEach(model => {
        const modelSpecs = [];
        
        // Add basic specs
        if (model.engine_type) modelSpecs.push('Engine Type');
        if (model.power) modelSpecs.push('Power');
        if (model.torque) modelSpecs.push('Torque');
        if (model.ground_clearance) modelSpecs.push('Ground Clearance');
        if (model.dimensions) modelSpecs.push('Dimensions');
        if (model.drive_type) modelSpecs.push('Drive Type');
        if (model.seater) modelSpecs.push('Seating Capacity');
        if (model.total_airbags) modelSpecs.push('Total Airbags');
        if (model.boot_space) modelSpecs.push('Boot Space');
        if (model.range_mileage) modelSpecs.push(model.engine_type && model.engine_type.toLowerCase().includes('electric') ? 'Range' : 'Mileage');
        if (model.battery_capacity) modelSpecs.push('Battery Capacity');
        if (model.cylinders) modelSpecs.push('Cylinders');
        if (model.fuel_tank) modelSpecs.push('Fuel Tank Capacity');
        if (model.starting_price) modelSpecs.push('Price');
        if (model.safety_rating) modelSpecs.push('Safety Rating');
        if (model.release_year) modelSpecs.push('Launch Year');
        if (model.engine) modelSpecs.push('Engine');
        
        // Add detailed specifications
        if (model.details && model.details.specifications) {
            model.details.specifications.forEach(spec => {
                const specLists = model.details.specificationLists.filter(
                    list => list.specification_id === spec.id
                );
                specLists.forEach(list => {
                    modelSpecs.push(list.title);
                });
            });
        }

        modelsData.push({
            id: model.id,
            name: model.model_name,
            brand: model.brand_name,
            image: model.model_image,
            specs: modelSpecs,
            basicInfo: {
                engine_type: model.engine_type,
                power: model.power,
                torque: model.torque,
                ground_clearance: model.ground_clearance,
                dimensions: model.dimensions,
                drive_type: model.drive_type,
                seater: model.seater,
                total_airbags: model.total_airbags,
                boot_space: model.boot_space,
                range_mileage: model.range_mileage,
                battery_capacity: model.battery_capacity,
                cylinders: model.cylinders,
                fuel_tank: model.fuel_tank,
                starting_price: model.starting_price,
                safety_rating: model.safety_rating,
                release_year: model.release_year,
                engine: model.engine
            }
        });
    });

    // Calculate scores
    const totalSpecs = allSpecs.size;
    modelsData.forEach(model => {
        const score = model.specs.length;
        model.score = score;
        model.scorePercentage = totalSpecs > 0 ? Math.round((score / totalSpecs) * 100) : 0;
    });

    // Sort by score (highest first)
    modelsData.sort((a, b) => b.score - a.score);

    return {
        specifications: Array.from(allSpecs),
        models: modelsData,
        totalSpecifications: totalSpecs
    };
}