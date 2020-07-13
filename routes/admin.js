const express = require('express');

const route = express.Router();

const adminController = require('./../controllers/admin');
const isAuth = require('./../middleware/is-auth');

// Get admin login - admin/login
route.get('/login', adminController.getLogin);

// Post admin login - admin/login
route.post('/login', adminController.postLogin);

// Get admin dashboard admin/dashboard
route.get('/dashboard', isAuth, adminController.getDashboard);

// Add new group admin/add-group
route.post('/add-group', isAuth, adminController.postAddGroup);

// logout - admin/logout
route.get('/logout', isAuth, adminController.getLogout);

// Delete single group - admin/group/delete
route.post('/group/delete', isAuth, adminController.postGroupDelete);

// Get single group - admin/group/:id
route.get('/group/:id', isAuth, adminController.getGroup);

// Update group description admin/group/add-description
route.post('/group/add-description', isAuth, adminController.addDescription);

// Add group member -  admin/group/add-member
route.post('/group/add-member', isAuth, adminController.addGroupMember);

// Delete group member - admin/group/member/delete
route.post(
	'/group/member/delete',
	isAuth,
	adminController.postGroupMemberDelete
);

module.exports = route;
