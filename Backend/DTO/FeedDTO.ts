import { UserMiniDTO } from 'UserMiniDTO'

export class Feed {
	id: string;
    author: UserMiniDTO;
    body: string;
    created_at: string;
    like_count: string;
    reply_count: string;
    quote_count: string;
    repost_count: string;
    has_liked: boolean;
    has_reposted: boolean;
    replies: Feed[];
    image: string;
    parent_post: {
    	id: string;
    	author: UserMiniDTO;
    	body: string;
    	image: string;
    	created_at: string;
    };
    is_repost: boolean;
}
