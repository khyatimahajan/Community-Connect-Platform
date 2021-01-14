const router = require('express').Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const momentTZ = require('moment-timezone');

const User = require('../model/User');
const Feeds = require('../model/Feeds');
const Comments = require('../model/Comments');
const Notifications = require('../model/Notifications');
const Group = require('./../model/Group');
const authController = require('./../controllers/auth');
const Logger = require('./../model/Logger');
const { urlify, isHavingSameItems, findCommonElements } = require('./../utils');

const { firstLoginValidation, loginValidation } = require('../validation');
const session = require('express-session');

var currentUserName = 'admin'; // default [temporary]
var currentUserData;
var currentUserID;

// session configuration
router.use(
	session({
		secret: 'ssshhhhh',
		saveUninitialized: true,
		resave: true,
		cookie: {
			secure: true,
		},
	})
);
router.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

// var cart = [{postBody: req.body.myTextarea}];
var sess;
let newComment = null;

// Get all user posts
async function getAllPosts(userID) {
	var allPosts = [];
	var feedNotifications = [];

	var user_conn = await getAllConnectionInformation();
	for (var i = 0; i < user_conn.length; i++) {
		let temp_post = await Feeds.find({
			author: user_conn[i].username,
		})
			.populate('author_id', 'name username email')
			.populate('receiver_id');

		allPosts.push.apply(allPosts, temp_post);
	}

	let entireFeeds = await Feeds.find({
		'visible_to.users': { $in: [userID] },
	});

	var temp_post = await Feeds.find({
		author: currentUserData.username,
	})
		.populate('receiver_id')
		.populate('author_id', 'name username email');

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

	allPosts.sort(function (a, b) {
		return b['created_at'] - a['created_at'];
	});

	return allPosts;
}

// Get all connections
async function getAllConnectionInformation() {
	const user = await User.findOne({
		_id: currentUserID,
	});

	user_dict = [];

	return user_dict;
}

async function getAllComments(feedId) {
	var allComments = await Comments.find({
		feedId: feedId,
	});
	allComments.sort(function (a, b) {
		return b['timestamp'] - a['timestamp'];
	});

	return allComments;
}

router.post('/idlogin', async (req, res) => {
	sess = req.session;
	sess.body = req.body;

	const { error } = firstLoginValidation(req.body);

	if (error) {
		req.flash('message', error.details[0].message);
		req.flash('form', req.body);
		res.redirect('/');
	}

	const user = await User.findOne({
		username: req.body.idcode,
	});

	if (user) {
		currentUserID = user._id;
		req.session.user = user;
		req.session.isLoggedIn = true;
		const salt = user.salt;
		currentUserName = user.username;

		currentUserData = {
			username: user.username,
			name: user.name,
			bio: user.bio,
			location: user.location,
			connection: user.connection,
			image_src: user.image_src,
		};

		var map = new Map(); // only because unsued variables are part of humanity!
		var connection_list = await getAllConnectionInformation();

		var posts = await getAllPosts(user._id);
		userPosts = [currentUserData].concat(posts);

		var itemsProcessed = 0;

		let nPosts = [];

		userPosts = userPosts.map((post, index, array) => {
			if (post._id) {
				Comments.find({
					feedId: post._id,
				})
					.populate('author_id')
					.exec()
					.then((comments) => {
						nPosts.push({ ...post._doc, comments });
						itemsProcessed++;
						if (itemsProcessed === array.length) {
							callback();
						}
					});
			} else {
				nPosts.push({ ...post, comments: [] });
				itemsProcessed++;
				if (itemsProcessed === array.length) {
					callback();
				}
			}
		});

		function callback() {
			nPosts.sort(function (a, b) {
				return b['timestamp'] - a['timestamp'];
			});

			res.render('../views/feeds_page', {
				posts: nPosts,
				connections: connection_list,
				map: map,
				user1: user,
				user: user,
				suggestions: JSON.stringify(connection_list),
				moment,
			});
		}
	} else {
		req.flash('message', 'Invalid credentials');
		req.flash('form', req.body);
		res.redirect('/');
	}
});

// User post creation
router.post('/feedPost', async (req, res, next) => {
	let { feedId } = req.query;

	let currentFeed;
	var userPosts = [];
	var nPosts = [];

	currentUserName = req.user.username;
	currentUserID = req.user._id;

	// get all user data
	currentUserData = {
		username: req.user.username,
		name: req.user.name,
		bio: req.user.bio,
		location: req.user.location,
		connection: req.user.connection,
		image_src: req.user.profile_pic,
		user_id: req.user.user_id,
	};

	if (feedId) {
		// Comment/Reply on Post
		if (req.body.comment || req.file) {
			currentFeed = await Feeds.findById(feedId);

			if (currentFeed.post_type == 'retweet') {
				currentFeed = await Feeds.findById(currentFeed.parent_id);
			}

			req.session.newCommentFeed = feedId;
			//currentFeed.created_at = +new Date();
			currentFeed.com_count++;
			currentFeed.reply_count++;
			currentFeed.timestamp = Date.now();
			await currentFeed.save();

			req.session.activityPost = currentFeed._id;

			// find user with current post
			const user = await User.findOne({
				user_id: currentFeed.user_id,
			});

			// create new feed with 'reply' type
			const newFeed = new Feeds({
				user_id: currentUserData.user_id,
				body: urlify(req.body.comment),
				created_at: +new Date(),
				liked_by: [],
				like_count: 0,
				retweet_count: 0,
				reply_count: 0,
				quote_count: 0,
				post_type: 'reply',
				parent_id: currentFeed._id,
				conversation_id: currentFeed.conversation_id,
				mentions: [],
				visible_to: { users: [...currentFeed.visible_to.users] },
				image: req.file ? req.file.location : 'null',
			});

			var status =
				currentUserName + ' commented on ' + user.username + '"s post.';

			// create notification
			const notify = new Notifications({
				inconn_id: currentUserID,
				outconn_id: user._id,
				post_id: feedId,
				activity: 'comment',
				seen: false,
				status: status,
			});
			// save notification
			await notify.save();

			try {
				await newFeed.save();
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}
		}

		// Retweet comment with text
		if (req.body.retweet_edit_body_comm) {
			currentFeed = await Feeds.findById(req.body.retweet_edit_id_comm);
			currentFeed.quote_count++;

			var author_user = currentFeed.author;
			var author_image_src = currentFeed.author_img_src;
			await currentFeed.save();
			req.session.activityPost = currentFeed._id;

			var receiverName = currentUserName;
			var find_image_src = await User.findById(currentUserID);
			var receiver_image_src = find_image_src.profile_pic;

			let recieverUser;

			// create new feed with 'quote' type
			const newFeed = new Feeds({
				user_id: req.user.user_id,
				body: urlify(req.body.retweet_edit_body_comm),
				created_at: Date.now(),
				timestamp: Date.now(),
				liked_by: 0,
				like_count: 0,
				retweet_count: 0,
				reply_count: 0,
				quote_count: 0,
				post_type: 'quote',
				parent_id: currentFeed._id,
				conversation_id: currentFeed.conversation_id,
				mentions: currentFeed.mentions,
				visible_to: currentFeed.visible_to,

				author: receiverName,
				author_image: receiver_image_src,
				author_id: req.user,
				receiver: author_user,
				receiver_id: recieverUser,
				receiver_image: author_image_src,
				count: 0,
				com_count: 0,
				love_count: 0,
				love_people: [],
				retweet_edit_count: 0,
				retweet_edit_body: req.body.retweet_edit_body_comm,
				notification: '',
			});

			try {
				// save feed
				await newFeed.save();
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}
		}

		// Retweet with text
		if (req.body.retweet_edit_body) {
			let receiverName = currentUserName;

			let find_image_src = await User.findById(currentUserID);
			let author_image_src = find_image_src.profile_pic;
			let receiver_image_src = author_image_src;

			let recieverUser;

			if (req.body.receiver != '') {
				const user = await User.findOne({
					username: req.body.receiver,
				});
				if (!user) return res.status(400).send('Receiver not found!');
				receiverName = user.username;
				receiver_image_src = user.profile_pic;
				recieverUser = user;
			}

			currentFeed = await Feeds.findById(req.body.retweet_edit_id);
			// increase quote count
			currentFeed.quote_count++;
			currentFeed.retweet_edit_count++;

			req.session.activityPost = currentFeed._id;

			try {
				// save feed
				await currentFeed.save();
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}

			// Create new feed with 'quote' type
			const newFeed = new Feeds({
				user_id: req.user.user_id,
				body: urlify(req.body.retweet_edit_body),
				created_at: Date.now(),
				timestamp: Date.now(),
				liked_by: [],
				like_count: 0,
				retweet_count: 0,
				reply_count: 0,
				quote_count: 0,
				post_type: 'quote',
				parent_id: currentFeed._id,
				conversation_id: currentFeed.conversation_id,
				mentions: [],
				visible_to: currentFeed.visible_to,

				author: currentUserName,
				author_image: author_image_src,
				receiver: receiverName,
				receiver_image: receiver_image_src,
				author_id: req.user,
				receiver_id: recieverUser,
				count: 0,
				com_count: 0,
				love_count: 0,
				love_people: [],
				retweet_edit_count: 0,
				retweet_edit_body: req.body.retweet_edit_body,
				notification: '',
			});

			try {
				// Save feed
				let nf = await newFeed.save();
				req.session.activityPost = nf._id;
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}
		}

		// Comment retweet
		if (req.body.retweet_com) {
			let find_image_src = await User.findById(currentUserID);
			let author_image_src = find_image_src.profile_pic;
			let receiver_image_src = author_image_src;

			let recieverUser;

			// find user of feed
			const user = await User.findOne({
				username: req.body.retweet_com,
			});
			receiverName = user.username;
			receiver_image_src = user.profile_pic;
			recieverUser = user;

			currentFeed = await Feeds.findById(req.body.post_id);
			currentFeed.retweet_count++;

			await currentFeed.save();
			req.session.activityPost = currentFeed._id;

			// Create new feed with type 'retweet'
			const newFeed = new Feeds({
				user_id: req.user.user_id,
				body: urlify(req.body.body),
				created_at: Date.now(),
				timestamp: Date.now(),
				liked_by: [],
				like_count: 0,
				retweet_count: 0,
				reply_count: 0,
				quote_count: 0,
				post_type: 'retweet',
				parent_id: currentFeed._id,
				conversation_id: currentFeed.conversation_id,
				mentions: currentFeed.mentions,
				visible_to: currentFeed.visible_to,

				author: currentUserName,
				author_image: author_image_src,
				author_id: req.user,
				receiver: receiverName,
				receiver_image: receiver_image_src,
				receiver_id: recieverUser,
				count: 0,
				love_count: 0,
				com_count: 0,
				love_people: [],
				retweet_edit_body: '',
				retweet_edit_count: 0,
				notification: '',
			});

			try {
				// save feed
				await newFeed.save();
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}
		}

		// Retweet post
		if (req.body.retweet) {
			let receiverName = currentUserName;

			let find_image_src = await User.findById(currentUserID);
			let author_image_src = find_image_src.profile_pic;
			let receiver_image_src = author_image_src;

			let recieverUser;

			if (req.body.receiver != '') {
				const user = await User.findOne({
					username: req.body.receiver,
				});
				if (!user) return res.status(400).send('Receiver not found!');

				receiverName = user.username;
				receiver_image_src = user.profile_pic;
				recieverUser = user;
			}

			// find feed
			currentFeed = await Feeds.findById(feedId);
			currentFeed.retweet_count++;
			currentFeed.count++;

			await currentFeed.save();

			// find user from feed user_id
			const user = await User.findOne({
				user_id: currentFeed.user_id,
			});

			if (currentFeed.parent_id) {
				currentFeed = await Feeds.findById(currentFeed.parent_id);
			}

			let postUserGroups = user.group_id;
			let currentUserGroups = req.user.group_id;

			// check if current user and post user share's common group
			var isSamegroups = findCommonElements(
				postUserGroups,
				currentUserGroups
			);

			// Create new feed with type 'retweet'
			const newFeed = new Feeds({
				user_id: req.user.user_id,
				body: urlify(req.body.body),
				created_at: Date.now(),
				timestamp: Date.now(),
				liked_by: currentFeed.liked_by,
				like_count: currentFeed.like_count,
				retweet_count: currentFeed.retweet_count,
				reply_count: currentFeed.reply_count,
				quote_count: currentFeed.quote_count,
				post_type: 'retweet',
				parent_id: currentFeed._id,
				conversation_id: currentFeed.conversation_id,
				mentions: currentFeed.mentions,
				visible_to: isSamegroups
					? currentFeed.visible_to
					: {
							...currentFeed.visible_to,
							users: currentFeed.visible_to.users.concat(
								currentFeed.user_id
							),
					  },

				author: currentUserName,
				author_image: author_image_src,
				receiver: receiverName,
				receiver_id: recieverUser,
				receiver_image: receiver_image_src,
				count: 0,
				author_id: req.user,
				com_count: 0,
				love_people: [],
				retweet_edit_body: '',
				retweet_edit_count: 0,
				notification: '',
			});

			let status =
				currentUserName + ' retweeted ' + user.username + '"s post.';

			// Create notification for retweet
			const notify = new Notifications({
				inconn_id: currentUserID,
				outconn_id: user._id,
				post_id: feedId,
				activity: 'retweet',
				seen: false,
				status: status,
			});

			try {
				// Save notification
				let nf = await newFeed.save();
				req.session.activityPost = nf._id;
				await notify.save();
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}
		}

		// Like post
		if (req.body.love) {
			currentFeed = await Feeds.findById(feedId).populate('parent_id');
			req.session.activityPost = currentFeed._id;
			let user1 = await User.findOne({
				user_id: currentFeed.user_id,
			});
			let user2;

			// check if post type is 'retweet'
			if (currentFeed.post_type == 'retweet') {
				currentFeed = await Feeds.findById(currentFeed.parent_id._id);
				user2 = await User.findOne({
					user_id: currentFeed.user_id,
				});
			}

			// increase like count
			if (!currentFeed.liked_by.includes(currentUserData.username)) {
				currentFeed.like_count++;
				currentFeed.timestamp = Date.now();
				currentFeed.liked_by.push(currentUserData.username);

				// Save feed
				await currentFeed.save();

				// Create notification
				let notifications = [
					{
						inconn_id: currentUserID,
						outconn_id: user1._id,
						post_id: feedId,
						activity: 'like',
						seen: false,
						status:
							currentUserName +
							' liked ' +
							user1.username +
							'"s post.',
					},
				];

				if (user2) {
					notifications.push({
						inconn_id: currentUserID,
						outconn_id: user2._id,
						post_id: feedId,
						activity: 'like',
						seen: false,
						status:
							currentUserName +
							' liked ' +
							user2.username +
							'"s post.',
					});
				}

				// Save to notifications
				Notifications.insertMany(notifications);
			}
		}

		// Like comment on post
		if (req.body.love_com) {
			currentFeed = await Feeds.findById(req.body.love_com);

			let parentFeed = await Feeds.findById(currentFeed.parent_id);
			parentFeed.timestamp = Date.now();
			await parentFeed.save();

			// Increase like count
			if (!currentFeed.liked_by.includes(currentUserData.username)) {
				currentFeed.like_count++;

				currentFeed.liked_by.push(currentUserData.username);
				// Save feed
				await currentFeed.save();
				req.session.activityPost = currentFeed._id;
			}

			// Find user with feed user_id
			const user = await User.findOne({
				user_id: currentFeed.user_id,
			});

			let status =
				currentUserName + ' liked ' + user.username + '"s comment.';

			// Create notification
			const notify = new Notifications({
				inconn_id: currentUserID,
				outconn_id: user._id,
				post_id: feedId,
				activity: 'like',
				seen: false,
				status: status,
			});
			try {
				// save notification
				await notify.save();
			} catch (err) {
				let error = new Error('Something went wrong');
				next(error);
			}
		}
	} else {
		let receiverName = currentUserName;

		if (req.body.receiver != '') {
			const user = await User.findOne({
				username: req.body.receiver,
			});
			if (!user) return res.status(400).send('Receiver not found!');
			receiverName = user.name;
		}

		let find_image_src = await User.findById(currentUserID);
		let author_image_src = find_image_src.profile_pic;

		// Get user mentions from post body
		let user_mentions = [];
		let post_body_parts = req.body.body.split(' ');
		post_body_parts.forEach((part) => {
			if (part.startsWith('@')) {
				part = part.split('');
				part.shift();
				user_mentions.push(part.join('').trim());
			}
		});

		req.user.getUserGroupMembers(
			currentUserID,
			async (groupUsers, groups) => {
				groupUsers = groupUsers.map((user) => user.user_id);

				req.session.newPostMade = true;

				// Create new feed with type 'tweet'
				let feed = {
					user_id: currentUserData.user_id,
					body: urlify(req.body.body),
					created_at: Date.now(),
					liked_by: [],
					like_count: 0,
					retweet_count: 0,
					reply_count: 0,
					quote_count: 0,
					post_type: 'tweet',
					parent_id: null,
					conversation_id: null,
					mentions: [...new Set(user_mentions)],
					visible_to: { users: groupUsers, groups },
					image: req.file ? req.file.location : 'null',

					author: currentUserName,
					author_image: author_image_src,
					receiver: receiverName,
					author_id: req.user,
					count: 0,
					love_count: 0,
					com_count: 0,
					love_people: [],
					retweet_edit_body: '',
					retweet_edit_count: 0,
					notification: '',
				};

				const newFeed = new Feeds(feed);

				try {
					// Save to DB
					let feed = await newFeed.save();

					// Get user mentions in feed body
					feed.getUserMentions(req.body.body);

					feed.conversation_id = feed._id;
					req.session.activityPost = feed._id;

					// Update to feed
					await feed.save();
				} catch (err) {
					let error = new Error('Something went wrong');
					next(error);
				}
			}
		);
	}

	// Get all posts from users
	var posts = await getAllPosts(req.user._id);
	var connection_list = await getAllConnectionInformation();
	userPosts = [currentUserData].concat(posts);

	let userGroups = [];
	let user;
	let userRedir;

	if (feedId && (req.body.comment || req.body.love)) {
		currentFeed = await Feeds.findById(feedId);
		user = await User.findOne({
			user_id: currentFeed.user_id,
		});
		userRedir = user;
		let u = await User.findById(currentUserID);
		userGroups = u.group_id;
	}

	if (userGroups.length > 0) {
		var feedNotificationProcessed = 0;
		let notificationUsers = [];

		userGroups.forEach(async (userGroup, index, array) => {
			let group = await Group.findOne({ group_name: userGroup });
			let group_users = await User.find({
				group_id: { $in: [group.group_id] },
				user_id: { $ne: user.user_id },
			}).exec();

			group_users = group_users.filter((member) => {
				return (
					JSON.stringify(member._id) != JSON.stringify(req.user._id)
				);
			});

			group_users.forEach(async (member) => {
				if (JSON.stringify(member) == JSON.stringify(user._id)) {
					feedNotificationProcessed++;
					if (feedNotificationProcessed === array.length) {
						addComments();
					}
					return true;
				}
				notificationUsers.push(member);
			});

			feedNotificationProcessed++;
			if (feedNotificationProcessed === array.length) {
				let currentUser = await User.findById(currentUserID);
				let found = currentFeed.visible_to.users.includes(
					currentUser._id.toString()
				);
				let currentUserGroups = currentUser.group_id;
				let otherGroups = [];
				let groupProccessed = 0;
				currentUserGroups.forEach(async (grp, index, array) => {
					let g = await Group.findOne({ group_name: grp });
					otherGroups.push(g.group_name);
					groupProccessed++;
					if (groupProccessed == array.length) {
						groupDOne();
					}
				});

				notificationUsers = currentFeed.visible_to.users.concat(
					notificationUsers.map((user) => user.user_id)
				);

				//check if user is from different group
				let isFromSame = isHavingSameItems(
					req.user.group_id,
					user.group_id
				);

				async function groupDOne() {
					otherGroups = otherGroups.concat(
						currentFeed.visible_to.groups
					);

					if (
						!found &&
						JSON.stringify(currentUser._id) !=
							JSON.stringify(user._id)
					) {
						let activity = '';
						if (req.body.comment) activity = 'comment';
						else if (req.body.retweet) activity = 'retweet';
						else activity = 'love';
						currentFeed.visible_to.users = [
							...new Set(notificationUsers),
						];
						currentFeed.visible_to.groups = [
							...new Set(otherGroups),
						];
						if (isFromSame) {
							currentFeed.visible_to.userId = req.user._id;
							currentFeed.visible_to.userActivity = activity;
							currentFeed.timestamp = req.body.comment
								? Date.now()
								: currentFeed.timestamp;
						}
						await currentFeed.save();
					}
					addComments();
				}
			}
		});
	} else {
		addComments();
	}

	// Added comments to post object
	function addComments() {
		var commentItemProcessed = 0;
		userPosts = userPosts.map((post, index, array) => {
			if (post._id) {
				Comments.find({
					feedId: post._id,
				})
					.populate('author_id')
					.exec()
					.then((comments) => {
						nPosts.push({ ...post._doc, comments });
						commentItemProcessed++;
						if (commentItemProcessed === array.length) {
							callback();
						}
					});
			} else {
				nPosts.push({ ...post, comments: [] });
				commentItemProcessed++;
				if (commentItemProcessed === array.length) {
					callback();
				}
			}
		});
	}

	function callback() {
		// Sort posts
		nPosts.sort(function (a, b) {
			return b['timestamp'] - a['timestamp'];
		});

		if (req.body.timezone) {
			res.redirect(`users/${userRedir._id}`);
		} else {
			global.nsp.emit('new-post', 'new-post');
			res.redirect('users/home');
		}
	}
});

// Post profile
router.post('/profile', async (req, res, next) => {
	sess = req.session;
	sess.body = req.body;

	// Check if email exists
	const emailExists = await User.findOne({
		username: sess.body['username'],
	});
	if (emailExists)
		return res
			.status(400)
			.send(
				'Email already exists! Please signup with different Email address'
			);

	// Generate new hashed password
	const salt = await bcrypt.genSalt(12);
	const hashPassword = await bcrypt.hash(sess.body.password, salt);

	// new user object
	const user = new User({
		name: req.body['name'],
		username: req.body['username'],
		email: req.body['email'],
		location: req.body['location'],
		password: hashPassword,
		bio: req.body['bio'],
		image_src: req.body.image_src,
	});
	try {
		// Save to DB
		const savedUser = await user.save();
		res.render('../views/login_succ');
	} catch (err) {
		let error = new Error('Something went wrong');
		next(error);
	}
});

// Post login
router.post('/login', async (req, res) => {
	req.session.activityPost = null;

	// Validate user inputs
	const { error } = loginValidation(req.body);

	if (error) {
		return res.status(422).render('./../views/login.ejs', {
			pageTitle: 'Login',
			message: error.details[0].message,
			input: { email: req.body.email },
		});
	}

	// Find user with email
	const user = await User.findOne({
		EmailID: req.body.email,
	});
	// throw error if user not found
	if (!user) {
		return res.status(403).render('./../views/login.ejs', {
			pageTitle: 'Login',
			message: 'Invalid email address or password',
			input: { email: req.body.email },
		});
	}
	// Validate password
	if (!user.password)
		return res.status(403).render('./../views/login.ejs', {
			pageTitle: 'Login',
			message: 'Invalid email address or password',
			input: { email: req.body.email },
		});

	// Cross verifiy password
	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) {
		return res.status(403).render('./../views/login.ejs', {
			pageTitle: 'Login',
			message: 'Invalid email address or password',
			input: { email: req.body.email },
		});
	}

	//Logger for user login time
	let log = new Logger({
		user: {
			id: user._id,
			username: user.username,
			name: user.name,
		},
		loggedInAt: {
			serverTime: new Date(),
			userTime: new Date().toLocaleString('en-US', {
				timeZone: req.body.timezone || 'America/New_York',
			}),
		},
	});
	// Save it to DB
	log.save();

	currentUserID = user._id;
	req.session.user = user;
	req.session.isLoggedIn = true;
	req.session.notificationViewed = false;
	const salt = user.salt;
	currentUserName = user.username;

	// User object
	currentUserData = {
		username: user.username,
		name: user.name,
		bio: user.bio,
		location: user.location,
		connection: user.connection,
		image_src: user.profile_pic,
		user_id: user.user_id,
	};

	var map = new Map(); // only because unsued variables are part of humanity!
	var connection_list = []; //await getAllConnectionInformation();

	var posts = await getAllPosts(user._id);
	userPosts = [currentUserData].concat(posts);

	var itemsProcessed = 0;

	let nPosts = [];

	// Get all user post with comments
	userPosts = userPosts.map((post, index, array) => {
		if (post._id) {
			Comments.find({
				feedId: post._id,
			})
				.populate('author_id')
				.exec()
				.then((comments) => {
					nPosts.push({ ...post._doc, comments });
					itemsProcessed++;
					if (itemsProcessed === array.length) {
						callback();
					}
				});
		} else {
			nPosts.push({ ...post, comments: [] });
			itemsProcessed++;
			if (itemsProcessed === array.length) {
				callback();
			}
		}
	});

	// Render template
	function callback() {
		nPosts.sort(function (a, b) {
			return b['timestamp'] - a['timestamp'];
		});
		res.redirect('users/home');
	}
});

// User logout
router.post('/logout', async (req, res, next) => {
	//Logger for user logout time

	if (req.user) {
		let log = await Logger.findOne({ 'user.id': req.user._id }).sort([
			['loggedInAt', -1],
		]);

		if (log) {
			log.loggedOutAt.serverTime = new Date();
			log.loggedOutAt.userTime = new Date().toLocaleString('en-US', {
				timeZone: req.body.timezone || 'America/New_York',
			});
			log.save();
		}
	}
	// Destroy session and return to login screen
	req.session.destroy((err) => {
		res.redirect('/');
	});
});

// Handle post profile
router.post('/profile', async (req, res, next) => {
	sess = req.session;
	sess.body = req.body;
	const emailExists = await User.findOne({
		username: sess.body['username'],
	});
	if (emailExists) return res.status(400).send('Email already exists!');

	// Generate new hashed password
	const salt = await bcrypt.genSalt(12);
	const hashPassword = await bcrypt.hash(sess.body.password, salt);

	// Create user object
	const user = new User({
		name: req.body['name'],
		username: req.body['username'],
		email: req.body['email'],
		salt: salt,
		password: hashPassword,
		bio: req.body['bio'],
	});
	try {
		// Save to DB
		await user.save();
		res.send({
			user: user._id,
		});
	} catch (err) {
		let error = new Error('Something went wrong');
		next(error);
	}
});

// Get user login
router.get('/', authController.getLogin);

// Get user sign up
router.get('/signup', authController.getSignupStepOne);

// Get user signup two
router.get('/signup-complete', authController.getSignupStepTwo);

// Post user signup
router.post('/sign-up', authController.getCheckUser);

// Post user create
router.post('/create-user', authController.postCreateUser);

module.exports = router;
