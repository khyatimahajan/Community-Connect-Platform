const mongoose = require('mongoose');

// Groups model
let schema = mongoose.Schema;

let convisSchema = new schema({
	conversation_id: {
		type: String,
	},
	visible_to: [
		{
			type: String,
		},
	],
});

module.exports = mongoose.model('ConversationVisibility', convisSchema);
