import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {FeedDetailItem} from '../../../model/FeedDetailItem';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {Feed} from '../../../model/Feed';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {FeedDetailComponent} from '../feed-detail/feed-detail.component';

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


  constructor(
      private userService: UserService,
      private authService: AuthService,
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
    const body = {
      userId: this.authService.currentUser.id,
      parent_id: this.feed.tweet.conversation_id
    };
    this.userService.postQuoteOrRepost(body).subscribe(response => {
      if (response) {
        this.comment.children.retweet_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
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
}
