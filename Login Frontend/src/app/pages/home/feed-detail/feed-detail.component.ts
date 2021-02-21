import {Component, Inject, Input, OnInit} from '@angular/core';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {MatSnackBar} from '@angular/material/snack-bar';
// @ts-ignore
const moment = require('moment');

@Component({
  selector: 'app-feed-detail',
  templateUrl: './feed-detail.component.html',
  styleUrls: ['./feed-detail.component.scss']
})
export class FeedDetailComponent implements OnInit {

  feed: Feed;
  constructor(
      public thisDialogRef: MatDialogRef<FeedDetailComponent>,
      @Inject(MAT_DIALOG_DATA) public feedId: string,
      private userService: UserService,
      private authService: AuthService,
      private snackBar: MatSnackBar,
      public dialog: MatDialog
  ) {
  }

  moment = moment;

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    if (this.feedId != null) {
      this.userService.getDetailsForAFeed(this.authService.currentUser.id, this.feedId).subscribe(response => {
        this.feed = response;
      });
    } else {
      this.userService.getDetailsForAFeed(this.authService.currentUser.id, this.userService.currentFeedId).subscribe(response => {

        if (response !== null) {
          this.feed = response;
        } else {
          this.openSnackBar('Unable To Load this post at the moment');
          this.thisDialogRef.close('Cancel');
        }

      });
    }
  }

  close() {
    this.thisDialogRef.close('Cancel');
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
    const dialogRef = this.dialog.open(AddCommentComponent, {
      width: '600px',
      data: this.feed
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Comment Added') {
        this.feed.reply_count++;
        this.loadData();
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
    this.userService.postQuoteOrRepost(body).subscribe(response => {
      if (response) {
        this.feed.repost_count++;
        this.loadData();
      }
    }, error => {
      this.openSnackBar(error.error.status);
    });
  }

  openQuoteModal() {
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
        this.loadData();
      }
    });
  }

  loadNewFeed($event: any) {
    this.thisDialogRef.close($event);
  }

  loadDataAgain() {
    this.loadData();
  }

  openSnackBar(message: string) {
    this.snackBar.open( message ? message : 'Error' ? message : 'Error', null, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
