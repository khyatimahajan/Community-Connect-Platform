const express = require('express');

const route = express.Router();

const adminController = require('./../controllers/admin');

route.get('/login', adminController.getLogin);

route.post('/login', adminController.postLogin);

route.get('/dashboard', adminController.getDashboard);

route.post('/add-group', adminController.postAddGroup);

route.get('/logout', adminController.getLogout);

route.post('/group/delete', adminController.postGroupDelete);

route.get('/group/:id', adminController.getGroup);

route.post('/group/add-member', adminController.addGroupMember);

route.post('/group/member/delete', adminController.postGroupMemberDelete);


module.exports = route;