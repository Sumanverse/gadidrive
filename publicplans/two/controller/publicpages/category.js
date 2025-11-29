const Category = require('../../models/category');
const VehicleType = require('../../models/vehicletype');

exports.getcategory = async (req, res, next) => {
    try {
        const vehicleTypeId = req.query.vehicle_type;
        
        // Get all vehicle types
        const vehicleTypes = await VehicleType.getAllVehicleTypes();
        
        let selectedVehicleType = null;
        let categories = [];

        if (vehicleTypeId) {
            // Get categories for specific vehicle type
            selectedVehicleType = vehicleTypes.find(vt => vt.vehicle_type_id == vehicleTypeId) || vehicleTypes[0];
            categories = await Category.getCategoriesByVehicleType(vehicleTypeId);
        } else if (vehicleTypes.length > 0) {
            // Default to first vehicle type
            selectedVehicleType = vehicleTypes[0];
            categories = await Category.getCategoriesByVehicleType(vehicleTypes[0].vehicle_type_id);
        }

        res.render('./publicpages/category', {
            vehicleTypes: vehicleTypes,
            selectedVehicleType: selectedVehicleType,
            categories: categories,
            currentPage: 'category'
        });
    } catch (error) {
        console.error('Error in getcategory:', error);
        res.render('./publicpages/category', {
            vehicleTypes: [],
            selectedVehicleType: null,
            categories: []
        });
    }
};