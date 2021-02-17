import DateTimeFormat = Intl.DateTimeFormat;
import { UserMinified } from './UserMinified';
// tslint:disable:variable-name
export class Feed {
    _id: string;
    author: UserMinified;
    body: string;
    created_at: string;
    like_count: number;
    reply_count: number;
    quote_count: number;
    repost_count: number;
    has_liked: boolean;
    has_reposted: boolean;
    replies: Feed[];
    image: string;
    parent_post: {
        _id: string;
        author: UserMinified;
        body: string;
        image: string;
        created_at: string;
    };
    is_repost: boolean;
}
