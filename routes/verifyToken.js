const jwt = require('jsonwebtoken');

//FUNCTIONS CHECKS IF USER HAS THE TOKEN
module.exports = function (req, res, next) {
    const token = req.header('auth-token');
    if(!token) return res.status(400).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid token');
    }
}