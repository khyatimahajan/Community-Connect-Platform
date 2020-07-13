const mongoose = require('mongoose');

// Groups model
let schema = mongoose.Schema;

let groupSchema = new schema({
	group_name: {
		type: String,
		required: true,
	},
	group_id: {
		type: String,
	},
	group_desc: {
		type: String,
	},
});

module.exports = mongoose.model('Group', groupSchema);
