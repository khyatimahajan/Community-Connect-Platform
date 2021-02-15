import {Component, Inject, Input, OnInit} from '@angular/core';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {FeedDetailItem} from '../../../model/FeedDetailItem';
import {MatSnackBar} from '@angular/material/snack-bar';
// @ts-ignore
const moment = require('moment');

@Component({
  selector: 'app-feed-detail',
  templateUrl: './feed-detail.component.html',
  styleUrls: ['./feed-detail.component.scss']
})
export class FeedDetailComponent implements OnInit {

  public comments: Array<FeedDetailItem> = [];
  constructor(
      public thisDialogRef: MatDialogRef<FeedDetailComponent>,
      @Inject(MAT_DIALOG_DATA) public feed: Feed,
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
    if (this.feed != null && this.feed.tweet != null && this.feed.tweet._id != null) {
      this.userService.getDetailsForAFeed(this.authService.currentUser.id, this.feed.tweet._id).subscribe(response => {
        this.comments = response;
      });
    } else {
      this.userService.getDetailsForAFeed(this.authService.currentUser.id, this.userService.currentFeedId).subscribe(response => {

        if (response[0].feed !== null) {
          this.feed = new Feed();
          this.feed.tweet = response[0].feed;
          this.feed.author_name = response[0].author_username;
          this.feed.author_profile_pic = response[0].author_profile_pic;
          this.feed.is_liked = response[0].is_liked;
          this.feed.is_retweeted = response[0].is_retweeted;
          this.feed.parent_info = response[0].parent_info;

          this.comments = response;
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
        this.loadData();
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
        this.loadData();
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
        this.loadData();
      }
    });
  }

  isFeed(comment: FeedDetailItem): boolean {
    return comment.feed == null;
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
