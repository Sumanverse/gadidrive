// controller/publicpages/404.js
exports.getNotFound = (req, res) => {
    res.status(404).render('publicpages/404', {
        title: 'Not Found',
        path: req.originalUrl
    });
};