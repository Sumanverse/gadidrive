const Brand = require('../../models/brands');
const VehicleType = require('../../models/vehicletype');

exports.getbrands = async (req, res, next) => {
    try {
        // Get vehicle types from database
        const vehicleTypes = await VehicleType.getAllVehicleTypes();
        
        // Get selected vehicle type from query parameter or use first one
        const selectedVehicleTypeId = req.query.vehicle_type || (vehicleTypes.length > 0 ? vehicleTypes[0].vehicle_type_id : null);
        
        // Get brands for selected vehicle type
        let brands = [];
        let selectedVehicleType = null;
        
        if (selectedVehicleTypeId) {
            brands = await Brand.getBrandsByVehicleType(selectedVehicleTypeId);
            selectedVehicleType = vehicleTypes.find(vt => vt.vehicle_type_id == selectedVehicleTypeId) || vehicleTypes[0];
        }
        
        res.render('./publicpages/brands', {
            vehicleTypes: vehicleTypes,
            brands: brands,
            selectedVehicleType: selectedVehicleType,
            title: 'USA - Brands',
            currentPage: 'brands'
        });
    } catch (error) {
        console.error('Error in brands controller:', error);
        next(error);
    }
};