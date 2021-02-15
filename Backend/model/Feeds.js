const mongoose = require('mongoose');

// Feeds model
const feedSchema = new mongoose.Schema({
	user_id: {
		type: String,
		ref: 'User',
	},
	body: {
		type: String,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	liked_by: [
		{
			type: String,
		},
	],
	reposted_by: [
		{
			type: String,
		},
	],
	like_count: {
		type: Number,
	},
	repost_count: {
		type: Number,
	},
	reply_count: {
		type: Number,
	},
	quote_count: {
		type: Number,
	},
	post_type: {
		type: String,
	},
	image: {
		type: String,
	},
	parent_id: {
		type: mongoose.Types.ObjectId,
		ref: 'Feeds',
	},
	replies: [
		{
			type: mongoose.Types.ObjectId,
			ref: 'Feeds'
		}
	],
	conversation_id: {
		type: mongoose.Types.ObjectId,
		ref: 'ConversationVisibility',
	},
	mentions: [
		{
			type: String,
		},
	],
});

// get user mentions inside post body
feedSchema.methods.getUserMentions = (body) => {
	let user_mentions = [];
	let user_ids = [];
	let processedMentions = 0;

	// splitting between @ sign
	let post_body_parts = body.split(' ');
	post_body_parts.forEach((part) => {
		if (part.startsWith('@')) {
			part = part.split('');
			part.shift();
			user_mentions.push(part.join('').trim());
		}
	});

	if (user_mentions.length > 0) {
		user_mentions.forEach(async (mention, index, array) => {
			processedMentions++;
			let u = await mongoose.model('user').findOne({ username: mention });
			if (u) user_ids.push(u.user_id);
			if (processedMentions == array.length) {
				console.log('Mentions');
				console.log(user_ids);
			}
		});
	}
};

module.exports = mongoose.model('Feeds', feedSchema, 'feeds');
