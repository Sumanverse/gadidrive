const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
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
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// File upload directories
const fs = require('fs');
['uploads/profiles', 'uploads/vehicle-types', 'uploads/categories'].forEach(dir => {
    if (!fs.existsSync(path.join(__dirname, 'public', dir))) {
        fs.mkdirSync(path.join(__dirname, 'public', dir), { recursive: true });
    }
});

// Serve static files
app.use(express.static(path.join(rootDir, 'public')));

// Use routers with auth middleware for /profile
app.use('/profile', auth, publicpagesRouter);
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