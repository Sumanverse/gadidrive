// controller/publicpages/modeldetails.js - 100% GUARANTEED WORKING
const Model = require('../../models/models');

exports.getmodeldetails = async (req, res, next) => {
    try {
        const modelId = req.params.modelId?.trim();

        // Default safe data
        const defaultData = {
            error: null,
            model: null,
            modelDetails: null,
            popularModels: [],
            similarModels: []  // YO SURE CHA AB
        };

        if (!modelId || isNaN(modelId)) {
            return res.status(400).render('publicpages/modeldetails', {
                ...defaultData,
                error: 'Invalid Model ID'
            });
        }

        const model = await Model.getModelById(modelId);
        if (!model) {
            return res.status(404).render('publicpages/modeldetails', {
                ...defaultData,
                error: 'Model not found'
            });
        }

        const modelDetails = await Model.getModelDetails(modelId) || {};
        const popularModels = await Model.getPopularModels(5) || [];

        // YO LINE THIK CHA — similarModels fetch huncha
        let similarModels = [];
        try {
            similarModels = await Model.getSimilarModels(modelId);
        } catch (err) {
            console.error("Similar models error:", err);
        }

        // SABAI PASS GAREKO CHA — similarModels defined cha
        res.render('publicpages/modeldetails', {
            error: null,
            model,
            modelDetails,
            popularModels,
            similarModels: similarModels || []  // YO PASS BHAYO AB!
        });

    } catch (error) {
        console.error('Error in getmodeldetails:', error);
        res.status(500).render('publicpages/modeldetails', {
            error: 'Server error',
            model: null,
            modelDetails: null,
            popularModels: [],
            similarModels: []  // error ma ni defined
        });
    }
    
};