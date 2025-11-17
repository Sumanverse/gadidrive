const path = require('path');
const express = require('express');

const adminRouter = require('./routes/adminrouter');
const fullpageRouter = require('./routes/fullpagesrouter');
const publicpagesRouter = require('./routes/publicpagesrouter');
const rootDir = require('./utils/pathutil');

const app = express();

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Use routers with appropriate prefixes
app.use('/admin', adminRouter);
app.use('/', fullpageRouter);
app.use('/:region', publicpagesRouter);

// Serve static files (CSS, etc.)
app.use(express.static(path.join(rootDir, 'public')));

// 404 handler (using EJS for consistency)
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', path: req.path });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});