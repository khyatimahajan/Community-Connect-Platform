const router = require('express').Router();

router.get('/', (req, res) => {
	res.render('../views/login.ejs', {
		message: null,
		form: req.flash('form'),
		pageTitle: 'Login',
		input: {},
	});
});

module.exports = router;
