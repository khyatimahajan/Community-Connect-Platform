const mongoose = require('mongoose');

let schema = mongoose.Schema;

let groupSchema = new schema({
    name: {
        type: String,
        required: true
    },
    members : [
        {
            type: mongoose.Types.ObjectId,
            ref: "user"
        }
    ]
})

module.exports = mongoose.model("Group", groupSchema);