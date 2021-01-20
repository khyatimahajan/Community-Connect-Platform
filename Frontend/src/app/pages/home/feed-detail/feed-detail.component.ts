import {Component, Inject, Input, OnInit} from '@angular/core';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {FeedDetailItem} from '../../../model/FeedDetailItem';

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
      public dialog: MatDialog
  ) {
    this.loadData();
  }

  ngOnInit(): void {

  }

  loadData() {
    console.log('We come here .. ');
    if (this.feed != null && this.feed.tweet != null && this.feed.tweet._id != null && this.authService.currentUser != null) {
      this.userService.getDetailsForAFeed(this.authService.currentUser.id, this.feed.tweet._id).subscribe(response => {
        this.comments = response;
      });
    } else {
      close();
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
    var feedID;
    if (this.feed.tweet) {
        if (this.feed.tweet.post_type === "retweet") {
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
    });
  }

  openQuoteModal() {
    const dialogRef = this.dialog.open(AddQuoteComponent, {
      width: '600px',
      data: this.feed
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
}
