const moment = require('moment');
const bcrypt = require('bcryptjs');
const bonsole = require('bonsole');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Notifications = require('../model/Notifications');
const validation = require('../validation');
const { sortArrayByUsername } = require('./../utils/index');
const { update } = require('../model/User');

var currentUserID;

// Get all users's post
async function getAllPosts(userID) {
	return new Promise(async (res, rej) => {
		var allPosts = [];
		var feedNotifications = [];

		// get all user's connection
		var user_conn = await getAllConnectionInformation();

		for (var i = 0; i < user_conn.length; i++) {
			let temp_post = await Feeds.find({
				user_id: user_conn[i].user_id,
				//post_type: { $ne: "reply" }
			}).populate('parent_id');

			allPosts.push.apply(allPosts, temp_post);
		}

		// find user
		let user = await User.findById(userID);

		// get all feeds
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

		// concat all posts
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

		// get post with reply type
		let all_replys = await Feeds.find({
			post_type: 'reply',
		}).populate('parent_id');

		allPosts = allPosts.concat(all_replys);

		// remove duplicates posts
		allPosts = removeDups(allPosts, '_id');

		// sort posts
		allPosts.sort(function (a, b) {
			return b['created_at'] - a['created_at'];
		});

		let postsProcessed = 0;
		let processedPosts = [];

		// populates user in place of user_id
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

	// func to remove duplicates
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

// get all connection informations
function getAllConnectionInformation(userId = currentUserID) {
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

	// get count of unseen notifications
	let notificationCount = await Notifications.find({
		outconn_id: user._id,
		seen: false,
	}).countDocuments();

	data = req.flash('form');
	if (!user) {
		return res.redirect('/');
	}
	// render user profile
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

	// validate user inputs
	if (validationResult.error) {
		req.flash('profileMessage', validationResult.error.details[0].message);
		req.flash('pform', req.body);
		return res.redirect('profile');
	}

	try {
		// get data from form body
		req.user.name = name;
		req.user.location = location;
		req.user.bio = bio;

		let response = await req.user.save();

		// splash message to user
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

	// get user from req object
	let user = req.user;

	try {
		// find all notifications from user's connections
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

		// render template
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
		// get data from user obj
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

		// Get all posts
		var posts = await getAllPosts(user._id);

		// Concat with user data object.
		userPosts = [currentUserData].concat(posts);

		var map = new Map();
		// Get all connection list
		var connection_list = await getAllConnectionInformation();

		var itemsProcessed = 0;
		let nPosts = [];
		let replys = [];

		// Map over users posts collections
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
			// appends comments to the post object inside array
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

				// populate user to the user_id field
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
				const { reply_count, retweet_count, like_count } = p;
				return {
					...p,
					post_order: p.created_at,
					activityLevel:
						(reply_count + retweet_count + like_count) / 3,
				};
			});

			/*if (req.session.activityPost) {
				let index = uPosts.findIndex(
					(p) =>
						JSON.stringify(p._id) ==
						JSON.stringify(req.session.activityPost)
				);

				if (index >= 0) uPosts[index].post_order = Date.now();
			}*/

			// sort posts
			uPosts.sort(function (a, b) {
				return b['created_at'] - a['created_at'];
				//return b['timestamp'] - a['timestamp'];
			});

			let popularPosts = [];
			let otherPosts = [];
			let ALL_POSTS = [];

			if (uPosts.length > 1) {
				let user_data = uPosts[0];
				let first_post = uPosts[1];

				let user_posts = uPosts.slice(1, uPosts.length);

				user_posts = user_posts
					.sort((a, b) => b.activityLevel - a.activityLevel)
					.filter((p) => {
						return p._id != first_post._id;
					});

				user_posts.forEach((post, index) => {
					if (index <= 4) {
						popularPosts.push(post);
					} else {
						otherPosts.push(post);
					}
				});

				ALL_POSTS = [...popularPosts, ...otherPosts];
				ALL_POSTS.unshift(first_post);
				ALL_POSTS.unshift(user_data);
			} else {
				ALL_POSTS = uPosts;
			}

			// render screen
			res.render('../views/feeds_page', {
				user: user,
				posts: ALL_POSTS,
				connections: sortArrayByUsername(connection_list),
				suggestions: JSON.stringify(connection_list),
				map: map,
				user1: user,
				notificationCount,
				notificationViewed: req.session.notificationViewed,
				moment,
				path: path ? path : 'users/home',
				pageTitle: 'Feeds',
				activityPost: req.session.activityPost,
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

	// validate inputs
	if (validationResult.error) {
		req.flash('message', validationResult.error.details[0].message);
		req.flash('form', req.body);
		return res.redirect('profile');
	}

	try {
		// check if current password entered is correct
		let isMatch = await bcrypt.compare(currentPassword, req.user.password);
		if (isMatch) {
			let salt = await bcrypt.genSalt(10);
			// generate new hashed password
			const hashPassword = await bcrypt.hash(newPassword, salt);
			req.user.password = hashPassword;
			// save changes to db
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

// Get user post and personal details
exports.getUserPosts = async (req, res, next) => {
	try {
		let user = await User.findById(req.params.id);

		//let user = req.user;
		if (!user) return res.redirect('/');

		try {
			// get data from user obj
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
				outconn_id: req.user._id,
				seen: false,
			}).countDocuments();

			// Get all posts
			var posts = await getAllPosts(user._id);

			// Concat with user data object.
			userPosts = [currentUserData].concat(posts);

			var map = new Map();
			// Get all connection list

			var itemsProcessed = 0;
			let nPosts = [];
			let replys = [];

			// Map over users posts collections
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
				// appends comments to the post object inside array
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

					// populate user to the user_id field
					nPosts.forEach(async (post, index, array) => {
						if (post.parent_id) {
							let p = await Feeds.findById(post.parent_id);
							let user = await User.findOne({
								user_id: p.user_id,
							});
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

			async function renderScreen(uPosts) {
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

				/*if (req.session.activityPost) {
					let index = uPosts.findIndex(
						(p) =>
							JSON.stringify(p._id) ==
							JSON.stringify(req.session.activityPost)
					);

					if (index >= 0) uPosts[index].post_order = Date.now();
                }*/

				// sort posts
				uPosts.sort(function (a, b) {
					//return b['post_order'] - a['post_order'];
					return b['timestamp'] - a['timestamp'];
				});

				let firstP = uPosts.splice(0, 1);

				// filter posts based on likes and comments
				uPosts = uPosts.filter((p) => {
					if (p.user_id._id == req.params.id) {
						return true;
					} else if (
						p.comments.findIndex(
							(comment) => comment.user_id._id == req.params.id
						) != -1
					) {
						return true;
					} else if (
						p.liked_by.findIndex((like) => like == user.username) !=
						-1
					) {
						return true;
					}
				});
				uPosts.unshift(firstP);

				currentUserID = req.user._id;
				var connection_list = await getAllConnectionInformation();
				var userConnectionList = await getAllConnectionInformation(
					req.params.id
				);

				return res.render('./../views/user-posts.ejs', {
					pageTitle: 'User Posts',
					path: 'users/home',
					user: req.user,
					posts: uPosts,
					postUser: user,
					notificationCount,
					moment: moment,
					connections: sortArrayByUsername(connection_list),
					user_connections: sortArrayByUsername(userConnectionList),
					notificationViewed: req.session.notificationViewed,
				});
			}
		} catch (err) {
			console.log(err);
			let error = new Error('Something went wrong');
			next(error);
		}
	} catch (err) {
		return res.redirect('home');
	}
};
