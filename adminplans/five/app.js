const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash'); // Add connect-flash
const multer = require('multer');
const adminRouter = require('./routes/adminrouter');
const fullpageRouter = require('./routes/fullpagesrouter');
const publicpagesRouter = require('./routes/publicpagesrouter');
const auth = require('./middleware/auth');
const rootDir = require('./utils/pathutil');

const app = express();

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'public/uploads/';
        if (file.fieldname === 'modelImage') {
            uploadPath += 'models';
        } else if (file.fieldname.includes('exteriorColorImage') || file.fieldname.includes('exteriorAdditionalColorImage')) {
            uploadPath += 'exterior_colors';
        } else if (file.fieldname.includes('interiorColorImage') || file.fieldname.includes('interiorAdditionalColorImage')) {
            uploadPath += 'interior_colors';
        } else if (file.fieldname.includes('specPhoto')) {
            uploadPath += 'specifications';
        } else if (file.fieldname.includes('aboutPhoto')) {
            uploadPath += 'about_contents';
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key-here', // Replace with a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Secure: true for HTTPS
}));
app.use(flash()); // Add flash middleware

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

// Use routers with auth middleware
app.use('/profile', auth, publicpagesRouter);
app.use('/admin', upload.any(), adminRouter); // Apply multer to admin routes
app.use('/', fullpageRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', path: req.path });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});