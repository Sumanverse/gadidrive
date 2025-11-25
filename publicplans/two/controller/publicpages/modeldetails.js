// controller/publicpages/modeldetails.js - UPDATED & COMPLETE
const Model = require('../../models/models');

exports.getmodeldetails = async (req, res, next) => {
    try {
        const modelId = req.params.modelId;
        
        if (!modelId) {
            return res.status(400).render('publicpages/modeldetails', {
                error: 'Model ID is required',
                model: null,
                modelDetails: null
            });
        }

        // Get main model data
        const model = await Model.getModelById(modelId);
        
        if (!model) {
            return res.status(404).render('publicpages/modeldetails', {
                error: 'Model not found',
                model: null,
                modelDetails: null
            });
        }

        // Get all related model details
        const modelDetails = await Model.getModelDetails(modelId);

        // Get popular models for recommendations
        const popularModels = await Model.getPopularModels(5);

        res.render('publicpages/modeldetails', {
            error: null,
            model: model,
            modelDetails: modelDetails,
            popularModels: popularModels
        });

    } catch (error) {
        console.error('Error in getmodeldetails:', error);
        res.status(500).render('publicpages/modeldetails', {
            error: 'Internal server error',
            model: null,
            modelDetails: null,
            popularModels: []
        });
    }
};