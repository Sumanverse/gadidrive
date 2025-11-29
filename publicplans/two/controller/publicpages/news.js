const Article = require('../../models/Article');

exports.getnews = async (req, res, next) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 8; // 8 articles per page (2 columns × 4 rows)
        const offset = (page - 1) * limit;

        // Get total count and paginated articles
        const allArticles = await Article.findAll();
        const totalArticles = allArticles.length;
        const totalPages = Math.ceil(totalArticles / limit);
        
        // Get articles for current page
        const paginatedArticles = allArticles.slice(offset, offset + limit);

        res.render('./publicpages/news', {
            title: 'USA - news',
            articles: paginatedArticles,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            currentPage: 'news'
        });
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).render('error', { message: 'Failed to load news' });
    }
};