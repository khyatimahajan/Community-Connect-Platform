const router = require('express').Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));

router.post('/', (req, res) => {
	console.log(req.body);
	res.send(req.body);
});

module.exports = router;
