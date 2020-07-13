// Check if user is logged in
module.exports = (req, res, next) => {
	if (req.user) {
		next();
	} else {
		res.redirect('/');
	}
};
