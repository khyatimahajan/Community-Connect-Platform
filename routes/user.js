const express = require('express');

const userController = require('./../controllers/user');
const isAuth = require('./../middleware/is-auth');

const route = express.Router();

// Get user feeds - users/home
route.get('/home', isAuth, userController.getFeeds);

// Get user notifications - user/notifications
route.get('/notifications', isAuth, userController.getNotifications);

// Get user profile - user/profile
route.get('/profile', isAuth, userController.getProfile);

// Profile update - user/profileUpdate
route.post('/profileUpdate', isAuth, userController.updateProfile);

// Post password reset - user/password-reset
route.post('/password-reset', isAuth, userController.resetPassword);

module.exports = route;
