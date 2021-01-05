const bcrypt = require('bcryptjs');

const User = require('./../model/User');
const Group = require('./../model/Group');
const validation = require('./../validation');

// Login for admin
module.exports.getLogin = (req, res) => {
	try {
		console.log('getLogin in controllers/admin');
		res.render('../views/admin/login', {
		pageTitle: 'Admin login',
		form: req.flash('form'),
		message: req.flash('message'),
		});
	} catch (err) {
		console.log(err);
	};
};

// Post admin login
module.exports.postLogin = async (req, res) => {
	console.log('postLogin in controllers/admin');
	const { email, password } = req.body;

	const validationResult = validation.loginValidation(req.body);
	if (validationResult.error) {
		req.flash('message', validationResult.error.details[0].message);
		req.flash('form', req.body);
		return res.redirect('login');
	}
	let user = await User.findOne({ EmailID: email });
	if (!user) {
		req.flash('message', 'Invalid credentials');
		req.flash('form', req.body);
		return res.redirect('login');
	}
	let isMatch = await bcrypt.compare(password, user.password);
	if (isMatch) {
		req.session.user = user;
		req.session.isLoggedIn = true;
		return res.redirect('dashboard');
	} else {
		req.flash('message', 'Invalid credentials');
		req.flash('form', req.body);
		return res.redirect('login');
	}
};

// Add Group description
module.exports.addDescription = async (req, res) => {
	let { group_id, description } = req.body;

	let group = await Group.findById(group_id);
	group.group_desc = description;
	await group.save();

	req.flash('memberMessage', 'Group saved successfully');
	return res.redirect(`/admin/group/${group_id}`);
};

// Get admin dashboard
module.exports.getDashboard = async (req, res, next) => {
	console.log('getDashboard in controllers/admin');
	let users = [];
	let groups = [];
	let allusers = [];
	try {
		allusers = await User.find({
			isAdmin: false,
		});

		allusers.map((user) => {
			users.push({
				id: user._id,
				value: user.name,
				profile_pic: user.profile_pic,
			});
		});

		let allGroups = await Group.find();
		let groupIndex = 0;
		if (allGroups.length == 0) callback();
		allGroups.forEach(async (group, index, array) => {
			let group_users = await User.find({
				group_id: { $in: [group.group_id] },
			}).exec();

			groups.push({ ...group._doc, members: group_users });
			groupIndex++;

			if (groupIndex == array.length) {
				callback();
			}
		});
	} catch (err) {
		console.log(err);
		let error = new Error('Something went wrong');
		next(error);
	}
	function callback() {
		return res.render('./../views/admin/dashboard', {
			pageTitle: 'Admin Dashboard',
			user: req.user,
			groups,
			users: JSON.stringify(users),
			allusers,
			path: 'admin/dashboard',
			groupMessage: req.flash('groupMessage'),
		});
	}
};

// Post group add
module.exports.postAddGroup = async (req, res, next) => {
	var { groupName, groupDesc, members } = req.body;
	members = JSON.parse(members);
	var users = [];

	let group = await new Group({
		group_id: Math.random().toString(32).substring(2),
		group_name: groupName,
		members: users,
		group_desc: groupDesc,
	}).save();
	var itemsProcessed = 0;
	members.forEach(async (member, index, array) => {
		let currentUser = await User.findById(member.id);
		let groups = currentUser.group_id;
		groups.push(group.group_id);
		currentUser.group_id = groups;
		await currentUser.save();
		itemsProcessed++;
		if (itemsProcessed == array.length) {
			callback();
		}
	});

	function callback() {
		req.flash('groupMessage', 'Group added successfully');
		return res.redirect('dashboard');
	}
};

// Get single group
module.exports.getGroup = async (req, res, next) => {
	let id = req.params.id;
	try {
		let users = await User.find({
			isAdmin: false,
		});
		let allusers = await User.find({
			isAdmin: false,
		});
		let group = await Group.findById(id);
		let group_members = await User.find({
			group_id: { $in: [group.group_id] },
		}).exec();

		group_members.map((member) => {
			let res = false;
			users = users.filter((user) => {
				if (user._id.toString() != member._id.toString()) {
					res = true;
				} else {
					res = false;
				}
				return res;
			});
			return res;
		});

		let nonGroupUser = [];
		users.map((user) => {
			nonGroupUser.push({
				id: user._id,
				value: user.name,
				profile_pic: user.profile_pic,
			});
		});

		res.render('./../views/admin/group', {
			group,
			group_members,
			pageTitle: `${group.group_name} | Group`,
			user: req.user,
			allusers,
			users: JSON.stringify(nonGroupUser),
			path: 'admin/dashboard',
			memberMessage: req.flash('memberMessage'),
		});
	} catch (error) {
		req.flash('groupMessage', 'Something went wrong');
		return res.redirect('/admin/dashboard');
	}
};

// Get all group member inside group
module.exports.addGroupMember = async (req, res, next) => {
	let { group_id, members } = req.body;
	members = JSON.parse(members);
	let group = await Group.findById(group_id);
	var itemsProcessed = 0;

	members.forEach(async (member, index, array) => {
		let currentUser = await User.findById(member.id);
		let groups = currentUser.group_id;
		groups.push(group.group_id);
		currentUser.group_id = groups;
		await currentUser.save();

		itemsProcessed++;
		if (itemsProcessed == array.length) {
			callback();
		}
	});

	function callback() {
		req.flash('memberMessage', 'Group member added successfully');
		return res.redirect(`/admin/group/${group_id}`);
	}
};

// Delete single group
module.exports.postGroupDelete = async (req, res, next) => {
	let groupId = req.body.group_id;
	let group;
	try {
		group = await Group.findById(groupId);
		var itemsProcessed = 0;
		let group_members = await User.find({
			group_id: { $in: [group.group_id] },
		}).exec();

		if (group_members.length == 0) {
			try {
				await group.remove();
				return res.redirect('/admin/dashboard');
			} catch (error) {
				console.log(error);
			}
		}
		if (group_members.length > 0) {
			group_members.forEach(async (member, index, array) => {
				let groups = member.group_id.filter(
					(grp) => grp != group.group_id
				);
				member.group_id = groups;
				await member.save();
				itemsProcessed++;
				if (itemsProcessed == array.length) {
					callback();
				}
			});
		}
	} catch (error) {
		console.log(error);
		req.flash('groupMessage', 'Something went wrong');
		return res.redirect('/admin/dashboard');
	}

	async function callback() {
		await group.remove();
		req.flash('groupMessage', 'Group deleted successfully');
		return res.redirect('/admin/dashboard');
	}
};
// Delete single group member
module.exports.postGroupMemberDelete = async (req, res, next) => {
	let { member_id, group_id } = req.body;
	try {
		let group = await Group.findById(group_id);
		let user = await User.findById(member_id);
		let userGroups = user.group_id.filter((grp) => grp != group.group_id);

		user.group_id = userGroups;
		await user.save();

		req.flash(
			'memberMessage',
			'Member deleted successfully from this group'
		);
		return res.redirect(`/admin/group/${group_id}`);
	} catch (error) {
		console.log(error);
		req.flash('memberMessage', 'Something has went wrong');
		return res.redirect(`/admin/group/${group_id}`);
	}
};

// admin logout
module.exports.getLogout = (req, res) => {
	console.log('getLogout in controllers/admin');
	req.session.destroy();
	return res.redirect('login');
};
