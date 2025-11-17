// app.js
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const adminRouter = require('./routes/adminrouter');
const fullpageRouter = require('./routes/fullpagesrouter');
const publicpagesRouter = require('./routes/publicpagesrouter');
const auth = require('./middleware/auth');
const rootDir = require('./utils/pathutil');

const app = express();

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key-here', // Replace with a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Create upload directories
const fs = require('fs');
['uploads/profiles', 'uploads/vehicle-types', 'uploads/categories', 'uploads/brands', 'uploads/models', 'uploads/exterior_colors', 'uploads/interior_colors', 'uploads/specifications', 'uploads/about_contents'].forEach(dir => {
    if (!fs.existsSync(path.join(__dirname, 'public', dir))) {
        fs.mkdirSync(path.join(__dirname, 'public', dir), { recursive: true });
    }
});

// Serve static files
app.use(express.static(path.join(rootDir, 'public')));

// === ROUTES ===
// PUBLIC PAGES (including /profile) — NO /profile prefix!
app.use('/', auth, publicpagesRouter); // FIXED: /profile/profile → /profile

// ADMIN & FULLPAGE
app.use('/admin', adminRouter);
app.use('/', fullpageRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', path: req.path });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});