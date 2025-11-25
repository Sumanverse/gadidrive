// controller/publicpages/newsdetails.js - UPDATED
const db = require('../../utils/dbutils');

exports.getnewsdetails = async (req, res, next) => {
    try {
        const articleId = req.params.articleId;
        const articleTitle = req.params.articleTitle;
        
        console.log('Fetching article with ID:', articleId, 'Title:', articleTitle);
        
        if (!articleId) {
            return res.status(400).render('error', { 
                message: 'Article ID is required' 
            });
        }

        // Get article with author name from JOIN query
        const [articles] = await db.query(
            `SELECT 
                a.Article_id, 
                a.Article_title, 
                a.Article_main_image, 
                a.published_date,
                a.author_id,
                a.sources,
                u.name AS author_name,
                u.user_id AS author_user_id
            FROM articles a 
            LEFT JOIN usertable u ON a.author_id = u.user_id
            WHERE a.Article_id = ?`,
            [articleId]
        );

        console.log('Articles found:', articles);

        if (!articles || articles.length === 0) {
            return res.status(404).render('error', { 
                message: 'Article not found' 
            });
        }

        const article = articles[0];
        
        // Get article contents
        const [contents] = await db.query(
            `SELECT * FROM article_contents WHERE article_id = ? ORDER BY content_order`,
            [articleId]
        );
        
        article.contents = contents;

        // Get recommended articles
        const [recommendedArticles] = await db.query(
            `SELECT 
                a.Article_id, 
                a.Article_title, 
                a.Article_main_image,
                a.published_date,
                u.name AS author_name
            FROM articles a 
            LEFT JOIN usertable u ON a.author_id = u.user_id
            WHERE a.Article_id != ? 
            ORDER BY a.published_date DESC 
            LIMIT 4`,
            [articleId]
        );

        // Format published date for SEO
        const publishedDate = article.published_date 
            ? new Date(article.published_date)
            : new Date();
            
        const formattedDate = publishedDate.toISOString();
        const readableDate = publishedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // SEO Meta Data
        const seoTitle = `${article.Article_title} - News`;
        const seoDescription = article.contents && article.contents.length > 0 
            ? article.contents.find(c => c.type === 'article')?.value?.substring(0, 160) + '...' 
            : `Read ${article.Article_title} on our news platform.`;
        
        // Current URL with SEO-friendly format
        const currentUrl = `${req.protocol}://${req.get('host')}/news/${articleId}-${article.Article_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        res.render('./publicpages/newsdetails', {
            title: seoTitle,
            article: article,
            recommendedArticles: recommendedArticles || [],
            publishedDate: readableDate,
            publishedDateISO: formattedDate,
            currentUrl: currentUrl,
            seoDescription: seoDescription,
            authorName: article.author_name || 'Staff Writer',
            authorUserId: article.author_user_id
        });
    } catch (err) {
        console.error('Error fetching news details:', err);
        res.status(500).render('error', { 
            message: 'Failed to load news article' 
        });
    }
};