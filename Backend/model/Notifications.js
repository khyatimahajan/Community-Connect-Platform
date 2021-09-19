const mongoose = require('mongoose');

// Notifications model
const notificationSchema = new mongoose.Schema({
	incoming_from: {
		type: mongoose.Types.ObjectId,
		ref: 'User',
	},
	outgoing_to: {
		type: mongoose.Types.ObjectId,
		ref: 'User',
	},
	post_id: {
		type: mongoose.Types.ObjectId,
		ref: 'Feeds',
	},
	activity_type: {
		type: String,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	seen: {
		type: Boolean,
	},
});

module.exports = mongoose.model('Notifications', notificationSchema);
