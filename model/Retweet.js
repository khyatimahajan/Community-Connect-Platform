const mongoose = require('mongoose');

// Retweets model
const retweetSchema = new mongoose.Schema({
	username: {
		type: String,
	},
	receiver: {
		type: String,
	},
	post_id: {
		type: String,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

retweet = mongoose.model('retweet', retweetSchema);

module.exports.retweet = retweet;
