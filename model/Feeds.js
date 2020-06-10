const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
    user_id: {
        type: String
    },
    body: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    liked_by: [
        {
            type: mongoose.Types.ObjectId
        }
    ],
    like_count: {
        type: Number
    },
    retweet_count: {
        type: Number
    },
    reply_count: {
        type: Number
    },
    quote_count: {
        type: Number
    },
    post_type: {
        type: String
    },
    parent_id: {
        type: mongoose.Types.ObjectId,
        ref: "Feeds"
    },
    conversation_id: {
        type: mongoose.Types.ObjectId,
        ref: "Feeds"
    },
    mentions: [
        {
            type: String
        }
    ],
    visible_to: {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "user"
        },
        userActivity: {
            type: String
        },
        users: [
            {
                type: String,
            }
        ]
    },

    /************************ */

    // author: {
    //     type: String,
    // },
    // author_id: {
    //     type: mongoose.Types.ObjectId,
    //     ref: 'user',
    //     required: true
    // },
    // author_image: {
    //     type: String 
    // },


    // receiver_id: {
    //     type: String
    // },
    /*receiver: {
        type: String,
    },
    receiver_image: {
        type: String
    },*/

    // count: {
    //     type: Number
    // },
    // love_count: {
    //     type: Number
    // },
    // love_people: {
    //     type: Array
    // },
    // com_count: {
    //     type: Number
    // },
    // retweet_edit_body: {
    //     type: String
    // },
    // retweet_edit_count: {
    //     type: Number
    // },
    // notification: {
    //     type: String
    // },
    // timestamp: {
    //     type: Date,
    //     default: Date.now
    // },
    // feedNotification: {
    //     userId: {
    //         type: mongoose.Types.ObjectId,
    //         ref: "user"
    //     },
    //     userActivity: {
    //         type: String
    //     },
    //     users: [
    //         {
    //             type: mongoose.Types.ObjectId,
    //             ref: "user"
    //         }
    //     ]
    // }
});

feedSchema.methods.getUserMentions = (body) => {
    let user_mentions = []
    let user_ids = [];
    let processedMentions = 0;

    let post_body_parts = body.split(" ");
    post_body_parts.forEach(part => {
        if (part.startsWith("@")) {
            part = part.split("");
            part.shift();
            user_mentions.push(part.join("").trim())
        }
    });

    if (user_mentions.length > 0) {
        user_mentions.forEach(async (mention, index, array) => {
            processedMentions++;
            let u = await mongoose.model("user").findOne({ username: mention });
            if (u) user_ids.push(u.user_id);
            if (processedMentions == array.length) {
                console.log("Mentions");
                console.log(user_ids);
            }
        });

    } else {
        console.log("Mentions empty");
    }
}

module.exports = mongoose.model('Feeds', feedSchema, 'feeds');