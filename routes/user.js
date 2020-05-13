const express = require('express');

const userController = require('./../controllers/user');

const route = express.Router();

route.get('/feeds', userController.getFeeds);

route.get('/notifications', userController.getNotifications);

route.get('/profile', userController.getProfile);

route.post('/profileUpdate', userController.updateProfile);

route.post('/password-reset', userController.resetPassword);

module.exports = route;