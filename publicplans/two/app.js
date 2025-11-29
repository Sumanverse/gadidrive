// app.js
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const adminRouter = require('./routes/adminrouter');
const fullpageRouter = require('./routes/fullpagesrouter');
const publicpagesRouter = require('./routes/publicpagesrouter'); // PUBLIC PAGES
const auth = require('./middleware/auth');
const rootDir = require('./utils/pathutil');

// 404 Controller import
const notFoundController = require('./controller/publicpages/404');
const searchRoutes = require('./routes/search');

const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Create upload directories
const fs = require('fs');
['uploads/profiles', 'uploads/vehicle-types', 'uploads/categories', 'uploads/brands', 'uploads/models', 'uploads/exterior_colors', 'uploads/interior_colors', 'uploads/specifications', 'uploads/about_contents'].forEach(dir => {
    const fullPath = path.join(__dirname, 'public', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Serve static files
app.use(express.static(path.join(rootDir, 'public')));

// === ROUTES ===
// 1. Full pages (Home, Signin, About) → root level
app.use('/', fullpageRouter);

// 2. PUBLIC PAGES (Brands, Category, News, Compare) → root level
app.use('/', publicpagesRouter);  // NOT /profile !!

// 3. 404 Page Route (DIRECT controller use garne)
app.get('/notfound', notFoundController.getNotFound);

// 4. Admin → /admin
app.use('/admin', auth, adminRouter);

app.use('/', searchRoutes);

// 5. 404 Handler (LAST) - catch all other routes
app.use((req, res) => {
    res.redirect('/notfound');
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});