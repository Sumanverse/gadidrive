const Model = require('../../models/models');
const db = require('../../utils/dbutils');

class ModelSpecsDetailsController {
    static async getmodelspecsdetails(req, res) {
        const { modelName, specTitle } = req.params;
        
        try {
            const conn = await db.getConnection();
            
            try {
                // Decode URL parameters
                const decodedModelName = decodeURIComponent(modelName);
                const decodedSpecTitle = decodeURIComponent(specTitle);

                // Get model details
                const [models] = await conn.execute(
                    `SELECT m.*, v.vehicle_type_name, c.name AS category_name,
                            b.name AS brand_name, u.name AS author_name
                     FROM models m
                     JOIN vehicletype v ON m.vehicle_type_id = v.vehicle_type_id
                     JOIN categories c ON m.category_id = c.category_id
                     JOIN brands b ON m.brand_id = b.brand_id
                     JOIN usertable u ON m.author_id = u.user_id
                     WHERE m.model_name = ?`,
                    [decodedModelName]
                );

                if (models.length === 0) {
                    return res.status(404).send(`
                        <html>
                            <body>
                                <h1>Model Not Found</h1>
                                <p>The model "${decodedModelName}" was not found.</p>
                                <a href="/">Return to Home</a>
                            </body>
                        </html>
                    `);
                }

                const model = models[0];

                // Get specification by title for this model
                const [specifications] = await conn.execute(
                    `SELECT s.* FROM specifications s
                     WHERE s.model_id = ? AND s.title = ?`,
                    [model.id, decodedSpecTitle]
                );

                if (specifications.length === 0) {
                    return res.status(404).send(`
                        <html>
                            <body>
                                <h1>Specification Not Found</h1>
                                <p>The specification "${decodedSpecTitle}" was not found for ${model.model_name}.</p>
                                <a href="/modeldetails/${model.id}">Return to Model</a>
                            </body>
                        </html>
                    `);
                }

                const specification = specifications[0];

                // Get specification lists for this specification
                const [specificationLists] = await conn.execute(
                    `SELECT sl.* FROM specification_lists sl
                     WHERE sl.specification_id = ?
                     ORDER BY sl.created_at ASC`,
                    [specification.id]
                );

                // Get spec contents for all lists
                let specContents = [];
                if (specificationLists.length > 0) {
                    const listIds = specificationLists.map(list => list.id);
                    const placeholders = listIds.map(() => '?').join(',');
                    
                    const [contents] = await conn.execute(
                        `SELECT sc.* FROM spec_contents sc
                         WHERE sc.list_id IN (${placeholders})
                         ORDER BY sc.created_at ASC`,
                        listIds
                    );
                    specContents = contents;
                }

                // Get other specifications for the same model (for recommendations)
                const [otherSpecifications] = await conn.execute(
                    `SELECT s.* FROM specifications s
                     WHERE s.model_id = ? AND s.title != ?
                     ORDER BY s.created_at DESC
                     LIMIT 6`,
                    [model.id, decodedSpecTitle]
                );

                // Format dates for SEO
                const createdDate = new Date(model.created_at);
                const publishedDateISO = createdDate.toISOString();
                const publishedDate = createdDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // SEO data - Updated titles as requested
                const seoDescription = `${specification.title} specifications for ${model.brand_name} ${model.model_name} in Nepal. Detailed technical specifications and features.`;
                const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

                res.render('publicpages/modelspecsdetails', {
                    title: `${specification.title} of ${model.brand_name} ${model.model_name} in Nepal`,
                    model: model,
                    specification: specification,
                    specificationLists: specificationLists,
                    specContents: specContents,
                    otherSpecifications: otherSpecifications,
                    seoDescription: seoDescription,
                    currentUrl: currentUrl,
                    publishedDateISO: publishedDateISO,
                    publishedDate: publishedDate,
                    authorName: model.author_name
                });

            } finally {
                conn.release();
            }

        } catch (error) {
            console.error('Error fetching specification details:', error);
            res.status(500).send(`
                <html>
                    <body>
                        <h1>Server Error</h1>
                        <p>Something went wrong. Please try again later.</p>
                        <a href="/">Return to Home</a>
                    </body>
                </html>
            `);
        }
    }
}

module.exports = {
    getmodelspecsdetails: ModelSpecsDetailsController.getmodelspecsdetails
};