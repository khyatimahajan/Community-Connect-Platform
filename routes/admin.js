const express = require('express');

const route = express.Router();

const adminController = require('./../controllers/admin');
const isAuth = require('./../middleware/is-auth');

route.get('/login', adminController.getLogin);

route.post('/login', adminController.postLogin);

route.get('/dashboard', isAuth, adminController.getDashboard);

route.post('/add-group', isAuth, adminController.postAddGroup);

route.get('/logout', isAuth, adminController.getLogout);

route.post('/group/delete', isAuth, adminController.postGroupDelete);

route.get('/group/:id', isAuth, adminController.getGroup);

route.post('/group/add-member', isAuth, adminController.addGroupMember);

route.post('/group/member/delete', isAuth, adminController.postGroupMemberDelete);


module.exports = route;