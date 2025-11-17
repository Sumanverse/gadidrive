exports.getSignin = (req, res, next) => {
    res.render('signin', { error: null });
};

exports.postSignin = (req, res, next) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin') {
        // Successful login
        res.redirect('/admin/superaccount');
    } else {
        // Failed login
        res.render('signin', { error: 'Invalid username or password' });
    }
};