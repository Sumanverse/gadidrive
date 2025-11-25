const Article = require('../../models/Article');
const UserDetails = require('../../models/userdetails');

exports.getAuthorProfile = async (req, res) => {
    try {
        const { userid } = req.params;
        
        // Get author details
        const author = await UserDetails.getUserById(userid);
        if (!author) {
            return res.status(404).render('error', { 
                message: 'Author not found',
                error: { status: 404 }
            });
        }

        // Get articles by this author
        const allArticles = await Article.findAll();
        const authorArticles = allArticles.filter(article => 
            article.author_id == userid
        );

        // Format date for articles
        const formattedArticles = authorArticles.map(article => ({
            ...article,
            formattedDate: article.published_date ? 
                new Date(article.published_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }) : 'No date'
        }));

        res.render('publicpages/authorprofile', {
            author,
            articles: formattedArticles,
            title: `${author.name} - Gyarage Author`,
            currentUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        });

    } catch (error) {
        console.error('Error in getAuthorProfile:', error);
        res.status(500).render('error', { 
            message: 'Server error loading author profile',
            error: { status: 500 }
        });
    }
};