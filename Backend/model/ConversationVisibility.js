const mongoose = require('mongoose');

// Groups model
let schema = mongoose.Schema;

let convVisSchema = new schema({
	conversation_id: {
		type: String,
		required: true,
	},
	visible_to: {
		type: String,
	},
});

module.exports = mongoose.model('ConversationVisibility', groupSchema);
