const router = require('express').Router();

router.get('/', (req, res) => {
	console.log('Login page');
	res.render('../views/login_succ.ejs');
});

module.exports = router;
