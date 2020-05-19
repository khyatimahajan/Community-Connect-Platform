const express = require('express');

const errorController = require('./../controllers/errors');

const router = express.Router();

router.use(errorController.get404);

module.exports = router;