const moment = require('moment');
const bcrypt = require('bcryptjs');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Notifications = require('../model/Notifications');
const validation = require('../validation');

var currentUserID;

// Get all users's post
async function getAllPosts(userID) {
	return new Promise(async (res, rej) => {
		var allPosts = [];
		var feedNotifications = [];
		var user_conn = await getAllConnectionInformation();

		for (var i = 0; i < user_conn.length; i++) {
			let temp_post = await Feeds.find({
				user_id: user_conn[i].user_id,
				//post_type: { $ne: "reply" }
			}).populate('parent_id');

			allPosts.push.apply(allPosts, temp_post);
		}

		let user = await User.findById(userID);

		let entireFeeds = await Feeds.find({
			'visible_to.users': { $in: [user.user_id] },
		})
			.populate('parent_id')
			.populate('visible_to.userId')
			.populate('author_id', 'name username email');

		var temp_post = await Feeds.find({
			user_id: currentUserData.user_id,
			//post_type: { $ne: "reply" }
		}).populate('parent_id');

		allPosts.push.apply(allPosts, temp_post);

		var noti = await Notifications.find({});
		for (let i = 0; i < noti.length; i++) {
			if (
				user_conn.includes(noti[i].inconn_id) &&
				!user_conn.includes(noti[i].outconn_id) &&
				currentUserID != noti[i].outconn_id
			) {
				currentFeed = await Feeds.findById(noti.post_id);
				currentFeed.timestamp = noti.timestamp;
				currentFeed.notification = noti.status;
				allPosts.push.apply(allPosts, currentFeed);
			}
		}

		for (var curPost = 0; curPost < allPosts.length; curPost++) {
			var feedComments = await allPosts[curPost]['_id'];
			allPosts[curPost].comments = feedComments;
		}

		allPosts = allPosts.concat(entireFeeds);

		let all_replys = await Feeds.find({
			post_type: 'reply',
		}).populate('parent_id');

		allPosts = allPosts.concat(all_replys);

		allPosts = removeDups(allPosts, '_id');

		allPosts.sort(function (a, b) {
			return b['created_at'] - a['created_at'];
		});

		let postsProcessed = 0;
		let processedPosts = [];

		allPosts.forEach(async (post, index, array) => {
			let postUser = await User.findOne({ user_id: post.user_id });
			postsProcessed++;
			processedPosts.push({ ...post._doc, user_id: postUser });
			if (postsProcessed == array.length) {
				callback();
			}
		});

		function callback() {
			res(removeDuplicates(processedPosts));
		}

		if (allPosts.length == 0) {
			res(removeDuplicates(processedPosts));
		}
	});

	function removeDuplicates(arr) {
		const uniqueArray = arr.filter((thing, index) => {
			const _thing = JSON.stringify(thing);
			return (
				index ===
				arr.findIndex((obj) => {
					return JSON.stringify(obj) === _thing;
				})
			);
		});
		return uniqueArray;
	}
}

function removeDups(originalArray, prop) {
	var newArray = [];
	var lookupObject = {};

	for (var i in originalArray) {
		lookupObject[originalArray[i][prop]] = originalArray[i];
	}

	for (i in lookupObject) {
		newArray.push(lookupObject[i]);
	}
	return newArray;
}

function getAllConnectionInformation() {
	function removeDuplicates(arr) {
		const uniqueArray = arr.filter((thing, index) => {
			const _thing = JSON.stringify(thing);
			return (
				index ===
				arr.findIndex((obj) => {
					return JSON.stringify(obj) === _thing;
				})
			);
		});
		return uniqueArray;
	}

	return new Promise(async (res, rej) => {
		let allConnections = [];
		let itemsProcessed = 0;
		const user = await User.findById(currentUserID);
		let group_ids = user.group_id;

		group_ids.forEach(async (group_id, index, array) => {
			let group_users = await User.find({
				group_id: { $in: [group_id] },
			}).exec();
			group_users = group_users.filter(
				(u) => JSON.stringify(u._id) != JSON.stringify(user._id)
			);
			allConnections.push(...group_users);
			itemsProcessed++;
			if (itemsProcessed == array.length) {
				callback();
			}
		});

		function callback() {
			allConnections = removeDuplicates(allConnections);
			res(allConnections);
		}
	});
}

// Get user profile
module.exports.getProfile = async (req, res) => {
	let user = req.user;
	let data = [];

	let notificationCount = await Notifications.find({
		outconn_id: user._id,
		seen: false,
	}).countDocuments();

	data = req.flash('form');
	if (!user) {
		return res.redirect('/');
	}
	res.render('../views/user-profile.ejs', {
		user: user,
		pageTitle: 'Profile',
		message: req.flash('message'),
		profileMessage: req.flash('profileMessage'),
		form: data,
		notificationCount,
		notificationViewed: req.session.notificationViewed,
		pform: req.flash('pform'),
		path: 'users/profile',
	});
};

// Update user profile
module.exports.updateProfile = async (req, res) => {
	const { name, username, email, location, bio } = req.body;
	const validationResult = validation.updateProfile(req.body);

	if (validationResult.error) {
		req.flash('profileMessage', validationResult.error.details[0].message);
		req.flash('pform', req.body);
		return res.redirect('profile');
	}

	try {
		req.user.name = name;
		req.user.location = location;
		req.user.bio = bio;

		let response = await req.user.save();

		req.flash('profileMessage', 'Profile updated successfully');
		return res.redirect('/users/profile');
	} catch (err) {
		console.log(err);
		let error = new Error('Something went wrong');
		next(error);
	}
};

// Get user notification
module.exports.getNotifications = async (req, res) => {
	req.session.notificationViewed = true;

	let user = req.user;

	try {
		let notifications = await Notifications.find({
			outconn_id: user._id,
		})
			.populate('inconn_id')
			.sort({ timestamp: -1 });

		//Update Notification to seen
		notifications.forEach((notification) => {
			notification.seen = true;
			notification.save();
		});

		return res.render('../views/notifications.ejs', {
			user: req.user,
			notifications: notifications,
			pageTitle: 'Notifications',
			moment,
			notificationCount: notifications.length,
			notificationViewed: req.session.notificationViewed,
			path: 'users/notifications',
		});
	} catch (err) {
		console.log(err);
		let error = new Error('Something went wrong');
		next(error);
	}
};

// Get user feeds
module.exports.getFeeds = async (req, res, next, path = null) => {
	let user = req.user;
	if (!user) return res.redirect('/');

	try {
		currentUserData = {
			username: user.username,
			name: user.name,
			bio: user.bio,
			location: user.location,
			connection: user.connection,
			image_src: user.profile_pic,
			user_id: user.user_id,
		};
		currentUserID = user._id;

		//Notification Count
		let notificationCount = await Notifications.find({
			outconn_id: user._id,
			seen: false,
		}).countDocuments();

		var posts = await getAllPosts(user._id);

		userPosts = [currentUserData].concat(posts);

		var map = new Map();
		var connection_list = await getAllConnectionInformation();

		var itemsProcessed = 0;
		let nPosts = [];
		let replys = [];

		userPosts = userPosts.map(async (post, index, array) => {
			if (post._id) {
				if (post.post_type == 'reply') {
					replys.push({ ...post, comments: [] });
					itemsProcessed++;
					if (itemsProcessed === array.length) {
						callback();
					}
				} else {
					nPosts.push({ ...post, comments: [] });
					itemsProcessed++;
					if (itemsProcessed === array.length) {
						callback();
					}
				}
			} else {
				nPosts.push({ ...post, comments: [] });
				itemsProcessed++;
				if (itemsProcessed === array.length) {
					callback();
				}
			}
		});

		function callback() {
			setTimeout(() => {
				replys.forEach((reply, index) => {
					let post = nPosts.filter((post) => {
						return (
							JSON.stringify(post._id) ==
							JSON.stringify(reply.parent_id._id)
						);
					});
					post = post[0];
					if (post) {
						let index = nPosts.findIndex((p) => p == post);
						nPosts[index] = {
							...post,
							comments: post.comments.concat(reply),
						};
					}
				});

				let finalPostProcessed = 0;
				let uPosts = [];

				nPosts.forEach(async (post, index, array) => {
					if (post.parent_id) {
						let p = await Feeds.findById(post.parent_id);
						let user = await User.findOne({ user_id: p.user_id });
						if (user) {
							uPosts.push({
								...post,
								parent_id: { ...p._doc, user_id: user },
							});
						}
						finalPostProcessed++;
						if (finalPostProcessed == array.length) {
							renderScreen(uPosts);
						}
					} else {
						uPosts.push({ ...post });
						finalPostProcessed++;
						if (finalPostProcessed == array.length) {
							renderScreen(uPosts);
						}
					}
				});
			}, 1500);
		}

		function renderScreen(uPosts) {
			uPosts = uPosts.map((p) => {
				//Copy Original post's comments to retweeted post.
				if (p.post_type == 'retweet') {
					let PIndex = uPosts.findIndex(
						(pst) =>
							JSON.stringify(p.parent_id._id) ==
							JSON.stringify(pst._id)
					);
					if (PIndex > -1)
						return {
							...p,
							post_order: p.created_at,
							comments: uPosts[PIndex].comments,
						};
				}
				return { ...p, post_order: p.created_at };
			});

			if (req.session.activityPost) {
				let index = uPosts.findIndex(
					(p) =>
						JSON.stringify(p._id) ==
						JSON.stringify(req.session.activityPost)
				);

				if (index >= 0) uPosts[index].post_order = Date.now();
			}

			uPosts.sort(function (a, b) {
				return b['post_order'] - a['post_order'];
			});

			res.render('../views/feeds_page', {
				user: user,
				posts: uPosts,
				connections: connection_list,
				suggestions: JSON.stringify(connection_list),
				map: map,
				user1: user,
				notificationCount,
				notificationViewed: req.session.notificationViewed,
				moment,
				path: path ? path : 'users/home',
				pageTitle: 'Feeds',
			});
		}
	} catch (err) {
		console.log(err);
		let error = new Error('Something went wrong');
		next(error);
	}
};

// Get root dashboard
module.exports.getHome = (req, res, next) => {
	this.getFeeds(req, res, next, 'users/home');
};

// Reset user password
module.exports.resetPassword = async (req, res, next) => {
	const { currentPassword, newPassword, cnewPassword } = req.body;
	const validationResult = validation.resetPassword(req.body);

	if (validationResult.error) {
		req.flash('message', validationResult.error.details[0].message);
		req.flash('form', req.body);
		return res.redirect('profile');
	}

	try {
		let isMatch = await bcrypt.compare(currentPassword, req.user.password);
		if (isMatch) {
			let salt = await bcrypt.genSalt(10);
			const hashPassword = await bcrypt.hash(newPassword, salt);
			req.user.password = hashPassword;
			let result = await req.user.save();
			req.flash('message', 'Password changed successfully');
			res.redirect('profile');
		} else {
			req.flash('form', req.body);
			req.flash('message', 'Old password is wrong');
			res.redirect('profile');
		}
	} catch (err) {
		console.log(err);
		req.flash('form', req.body);
		req.flash('message', 'Something has went wrong');
		res.redirect('profile');
	}
};
