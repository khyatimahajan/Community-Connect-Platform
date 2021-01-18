const mongoose = require('mongoose');

// Logtimes model
let schema = mongoose.Schema;

let loggerSchema = new schema({
	user: {
		type: mongoose.Schema.Types.Mixed,
	},
	loggedInAt: {
		userTime: {
			type: String,
		},
		serverTime: {
			type: String,
		},
	},
	loggedOutAt: {
		userTime: {
			type: String,
		},
		serverTime: {
			type: String,
		},
	},
});

module.exports = mongoose.model('LogTime', loggerSchema);
