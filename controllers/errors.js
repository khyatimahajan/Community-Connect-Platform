module.exports.get404 = (req, res, next) => {
    res.render('./errors/404.ejs', {
        pageTitle: "Page not found"
    });
};