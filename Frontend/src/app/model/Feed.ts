import DateTimeFormat = Intl.DateTimeFormat;
// tslint:disable:variable-name
export class Feed {
    tweet: {
        _id: string,
        user_id: string,
        body: string,
        created_at: DateTimeFormat,
        like_count: number,
        retweet_count: number,
        reply_count: number,
        quote_count: number,
        post_type: string,
        image: string
        parent_id: {
            _id: string,
            user_id: string,
            body: string,
            created_at: DateTimeFormat,
            like_count: number,
            retweet_count: number,
            reply_count: number,
            quote_count: number,
            post_type: string,
            image: string
        },
    };
    profile_pic: string;
    username: string;
}
