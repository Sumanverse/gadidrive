exports.getnews = (req, res, next) => {
    res.render('./publicpages/news', { title: 'USA - news' });
};