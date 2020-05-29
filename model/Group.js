const mongoose = require('mongoose');

let schema = mongoose.Schema;

let groupSchema = new schema({
    group_name: {
        type: String,
        required: true
    },
    group_id: {
        type: String
    },
    group_desc: {
        type: String,
    },
    members: [
        {
            type: mongoose.Types.ObjectId,
            ref: "user"
        }
    ]
})

module.exports = mongoose.model("Group", groupSchema);