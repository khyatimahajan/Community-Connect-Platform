import {Component, OnInit, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {Feed} from '../../../model/Feed';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {MatDialog} from '@angular/material/dialog';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {FeedDetailComponent} from '../feed-detail/feed-detail.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CopyContentModalComponent} from '../copy-content-modal/copy-content-modal.component';
import {MatMenuTrigger} from '@angular/material/menu';
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
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    moment = moment;

    ngOnInit(): void {
    }

    toggleLike() {
        const body = {
            feedId: this.feed.is_repost ? this.feed.parent_post._id : this.feed._id,
            userId: this.authService.currentUser.id
        };
        this.userService.putLike(body).subscribe(response => {
            if (response) {
                this.feed.has_liked = !this.feed.has_liked;
                if (this.feed.has_liked) {
                    this.feed.like_count++;
                } else {
                    this.feed.like_count--;
                }
            }
        }, error => {
            this.openSnackBar(error.error.status);
        });
    }

    showCommentModal() {
        const dialogRef = this.feed.is_repost ?
            this.dialog.open(AddCommentComponent, {
            width: '600px',
            data: this.feed.parent_post
            })
            : this.dialog.open(AddCommentComponent, {
                width: '600px',
                data: this.feed
            });
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'Comment Added') {
                this.feed.reply_count++;
            }
        });
    }

    repost() {
        let feedID;
        if (this.feed) {
            if (this.feed.is_repost) {
                feedID = this.feed.parent_post._id;
            } else {
                feedID = this.feed._id;
            }
        } else {
            feedID = this.feed._id;
        }
        const body = {
            userId: this.authService.currentUser.id,
            parent_id: feedID
        };
        this.trigger.closeMenu();
        this.userService.postQuoteOrRepost(body).subscribe(response => {
            if (response) {
                this.feed.repost_count++;
                this.feedStatusChange.emit(true);
            }
        }, error => {
            this.openSnackBar(error.error.status);
        });
    }

    openQuoteModal() {
        this.trigger.closeMenu();
        const dataFeed = this.feed;
        if (this.feed.is_repost) {
            dataFeed._id = this.feed._id;
            dataFeed.body = this.feed.parent_post.body;
            dataFeed.created_at = this.feed.parent_post.created_at;
            dataFeed.is_repost = this.feed.is_repost;
            dataFeed.image = this.feed.parent_post.image;
            dataFeed.author = this.feed.author;
        }
        const dialogRef = this.dialog.open(AddQuoteComponent, {
            width: '600px',
            data: dataFeed
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result === 'Quote Added') {
                this.feed.quote_count++;
                this.feedStatusChange.emit(true);
            }
        });
    }

    openDetailModal(f: Feed) {
        if (f.author.user_handle !== 'news_node') {
            const dialogRef = this.dialog.open(FeedDetailComponent, {
                width: '1200px',
                data: f._id
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result && result._id) {
                    this.openDetailModal(result);
                } else {
                    this.feedStatusChange.emit(true);
                }
            });
        }
    }

    openSnackBar(message: string) {
        this.snackBar.open(message ? message : 'Error' ? message : 'Error', null, {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
        });
    }

    copyContent(feed: Feed) {
        if (feed.author.user_handle === 'news_node') {
            const dialogRef = this.dialog.open(CopyContentModalComponent, {
                width: '1200px',
                data: feed
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result === 'Load') {
                    this.feedStatusChange.emit(true);
                }
            });
        }
    }
}
