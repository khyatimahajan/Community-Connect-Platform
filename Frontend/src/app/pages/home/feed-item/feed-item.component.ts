import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {Feed} from '../../../model/Feed';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {MatDialog} from '@angular/material/dialog';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {FeedDetailComponent} from '../feed-detail/feed-detail.component';
import {MatSnackBar} from '@angular/material/snack-bar';
// @ts-ignore
const moment = require('moment');

@Component({
    selector: 'app-feed-item',
    templateUrl: './feed-item.component.html',
    styleUrls: ['./feed-item.component.scss']
})
export class FeedItemComponent implements OnInit {

    constructor(private userService: UserService, private authService: AuthService, public dialog: MatDialog,
                private snackBar: MatSnackBar,
    ) {
    }

    @Input() feed: Feed;
    @Output() feedStatusChange = new EventEmitter<boolean>();

    moment = moment;

    ngOnInit(): void {
        if (this.feed && this.feed.tweet) {

        }
    }

    toggleLike() {
        const body = {
            feedId: this.feed.tweet._id,
            userId: this.authService.currentUser.id
        };
        this.userService.putLike(body).subscribe(response => {
            if (response) {
                this.feed.is_liked = !this.feed.is_liked;
                if (this.feed.is_liked) {
                    this.feed.tweet.like_count++;
                } else {
                    this.feed.tweet.like_count--;
                }
            }
        }, error => {
            this.openSnackBar(error.error.status);
        });
    }

    showCommentModal() {
        const dialogRef = this.dialog.open(AddCommentComponent, {
            width: '600px',
            data: this.feed
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'Comment Added') {
                this.feed.tweet.reply_count++;
            }
        });
    }

    repost() {
        let feedID;
        if (this.feed.tweet) {
            if (this.feed.tweet.post_type === 'retweet') {
                feedID = this.feed.tweet.conversation_id;
            } else {
                feedID = this.feed.tweet._id;
            }
        } else {
            feedID = this.feed.tweet._id;
        }
        const body = {
            userId: this.authService.currentUser.id,
            parent_id: feedID
        };
        this.userService.postQuoteOrRepost(body).subscribe(response => {
            if (response) {
                this.feed.tweet.retweet_count++;
                this.feedStatusChange.emit(true);
            }
        }, error => {
            this.openSnackBar(error.error.status);
        });
    }

    openQuoteModal() {
        const dataFeed = this.feed;
        if (this.feed.tweet.post_type === 'retweet') {
            dataFeed.tweet._id = this.feed.tweet.parent_id._id;
            dataFeed.tweet.user_id = this.feed.tweet.parent_id.user_id;
            dataFeed.tweet.body = this.feed.tweet.parent_id.body;
            dataFeed.tweet.created_at = this.feed.tweet.parent_id.created_at;
            dataFeed.tweet.post_type = this.feed.tweet.parent_id.post_type;
            dataFeed.tweet.image = this.feed.tweet.parent_id.image;
            dataFeed.author_profile_pic = this.feed.parent_info.parent_profile_pic;
            dataFeed.author_name = this.feed.parent_info.parent_name;
        }
        const dialogRef = this.dialog.open(AddQuoteComponent, {
            width: '600px',
            data: dataFeed
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'Quote Added') {
                this.feed.tweet.quote_count++;
                this.feedStatusChange.emit(true);
            }
        });
    }

    openDetailModal(f: Feed) {
        const dialogRef = this.dialog.open(FeedDetailComponent, {
            width: '800px',
            data: f
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'Load') {
                this.feedStatusChange.emit(true);
            } else if (result && result.tweet) {
                this.openDetailModal(result);
            }
        });
    }

    openSnackBar(message: string) {
        this.snackBar.open(message ? message : 'Error' ? message : 'Error', null, {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
        });
    }
}
