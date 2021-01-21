import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FeedDetailItem} from '../../../model/FeedDetailItem';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {Feed} from '../../../model/Feed';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {FeedDetailComponent} from '../feed-detail/feed-detail.component';
import {MatSnackBar} from '@angular/material/snack-bar';
// @ts-ignore
const moment = require('moment');

@Component({
  selector: 'app-comment-detail',
  templateUrl: './comment-detail.component.html',
  styleUrls: ['./comment-detail.component.scss']
})
export class CommentDetailComponent implements OnInit {

  feed: Feed = null;
  @Input() comment: FeedDetailItem;
  @Input() showUI: boolean;
  @Output() loadDataEmitter = new EventEmitter<boolean>();
  @Output() loadNewFeedEmitter = new EventEmitter<Feed>();

  moment = moment;

  constructor(
      private userService: UserService,
      private authService: AuthService,
      private snackBar: MatSnackBar,
      public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    if (this.showUI) {
      this.updateFeedFromComment(this.comment);
    }
  }


  toggleLike() {
    const body = {
      feedId: this.feed.tweet._id,
      userId: this.authService.currentUser.id
    };
    this.userService.putLike(body).subscribe(response => {
      if (response) {
        this.comment.is_liked = !this.comment.is_liked;
        if (this.comment.is_liked) {
          this.comment.children.like_count++;
        } else {
          this.comment.children.like_count--;
        }
        this.updateFeedFromComment(this.comment);
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
        this.comment.children.reply_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
    });
  }

  repost() {
    let feedID;
    if (this.comment.children) {
        if (this.comment.children.post_type === 'retweet') {
          feedID = this.comment.children.conversation_id;
        } else {
          feedID = this.comment.children._id;
        }
    } else {
      feedID = this.comment.children._id;
    }
    const body = {
      userId: this.authService.currentUser.id,
      parent_id: feedID
    };
    this.userService.postQuoteOrRepost(body).subscribe(response => {
      if (response) {
        this.comment.children.retweet_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
    }, error => {
      this.openSnackBar(error.error.status);
    });
  }

  openQuoteModal() {
    const dialogRef = this.dialog.open(AddQuoteComponent, {
      width: '600px',
      data: this.feed
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Quote Added') {
        this.comment.children.quote_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
    });
  }

  updateFeedFromComment(comment: FeedDetailItem): Feed {
    if (comment && comment.children != null && comment.children.post_type === 'reply') {
      this.feed = {
        tweet: comment.children,
        author_profile_pic: comment.author_profile_pic,
        author_name: comment.author_username,
        is_liked: comment.is_liked,
        is_retweeted: comment.is_retweeted,
        parent_info: comment.parent_info,
      };
    }
    else { return null; }

  }

  goInsideComment() {
    this.loadNewFeedEmitter.emit(this.feed);
  }

  openSnackBar(message: string) {
    this.snackBar.open(message ? message : 'Error' ? message : 'Error', null, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
