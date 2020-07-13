const mongoose = require('mongoose');

// Comment model
const userSchema = new mongoose.Schema({
	feedId: {
		type: mongoose.Types.ObjectId,
		ref: 'Feeds',
	},
	author: {
		type: String,
	},
	author_id: {
		type: mongoose.Types.ObjectId,
		ref: 'user',
		required: true,
	},
	author_img_src: {
		type: String,
	},
	body: {
		type: String,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	count: {
		type: Number,
	},
	love_count: {
		type: Number,
	},
	love_people: {
		type: Array,
	},
	retweet_edit_body: {
		type: String,
	},
	retweet_edit_count: {
		type: Number,
	},
});

module.exports = mongoose.model('Comments', userSchema, 'comments');
