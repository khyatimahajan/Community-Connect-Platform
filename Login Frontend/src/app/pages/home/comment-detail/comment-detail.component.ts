import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {Feed} from '../../../model/Feed';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
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
  @Input() comment: Feed;
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
      feedId: this.feed._id,
      userId: this.authService.currentUser.id
    };
    this.userService.putLike(body).subscribe(response => {
      if (response) {
        this.comment.has_liked = !this.comment.has_liked;
        if (this.comment.has_liked) {
          this.comment.like_count++;
        } else {
          this.comment.like_count--;
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
        this.comment.reply_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
    });
  }

  repost() {
    let feedID;
    if (this.comment) {
        if (this.comment.is_repost) {
          feedID = this.comment.parent_post._id;
        } else {
          feedID = this.comment._id;
        }
    } else {
      feedID = this.comment._id;
    }
    const body = {
      userId: this.authService.currentUser.id,
      parent_id: feedID
    };
    this.userService.postQuoteOrRepost(body).subscribe(response => {
      if (response) {
        this.comment.repost_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
    }, error => {
      this.openSnackBar(error.error.status);
    });
  }

  openQuoteModal() {
    const dataFeed = this.feed;
    if (this.feed.is_repost) {
      dataFeed._id = this.feed.parent_post._id;
      dataFeed.author = this.feed.author;
      dataFeed.body = this.feed.parent_post.body;
      dataFeed.created_at = this.feed.parent_post.created_at;
      dataFeed.is_repost = this.feed.is_repost;
      dataFeed.image = this.feed.parent_post.image;
    }
    const dialogRef = this.dialog.open(AddQuoteComponent, {
      width: '600px',
      data: dataFeed
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Quote Added') {
        this.comment.quote_count++;
        this.updateFeedFromComment(this.comment);
        this.loadDataEmitter.emit(true);
      }
    });
  }

  updateFeedFromComment(comment: Feed): Feed {
    // TODO! Add feed stuff to update feed from comment
    return null;
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
