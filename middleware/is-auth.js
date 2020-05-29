module.exports = (req, res, next) => {
    console.log("THROUGH MIDDLEWARE")
    if (req.user) {
        next();
    } else {
        res.redirect('/');
    }
}