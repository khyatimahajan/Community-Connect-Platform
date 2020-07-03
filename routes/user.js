const express = require('express');

const userController = require('./../controllers/user');
const isAuth = require('./../middleware/is-auth');

const route = express.Router();

route.get('/home', isAuth, userController.getFeeds);

// route.get('/feeds', isAuth, userController.getFeeds);

route.get('/notifications', isAuth, userController.getNotifications);

route.get('/profile', isAuth, userController.getProfile);

route.post('/profileUpdate', isAuth, userController.updateProfile);

route.post('/password-reset', isAuth, userController.resetPassword);

module.exports = route;