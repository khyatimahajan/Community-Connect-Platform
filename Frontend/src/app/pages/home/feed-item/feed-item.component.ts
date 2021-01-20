import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {Feed} from '../../../model/Feed';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {AddCommentComponent} from '../add-comment/add-comment.component';
import {MatDialog} from '@angular/material/dialog';
import {AddQuoteComponent} from '../add-quote/add-quote.component';
import {FeedDetailComponent} from '../feed-detail/feed-detail.component';

@Component({
  selector: 'app-feed-item',
  templateUrl: './feed-item.component.html',
  styleUrls: ['./feed-item.component.scss']
})
export class FeedItemComponent implements OnInit {

  @Input() feed: Feed;
  @Output() feedStatusChange = new EventEmitter<boolean>();

  constructor(private userService: UserService, private authService: AuthService, public dialog: MatDialog) { }

  ngOnInit(): void {
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
        this.feed.tweet.retweet_count++;
        this.feedStatusChange.emit(true);
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
      } else if (result !== 'Cancel') {
        this.openDetailModal(result);
      }
    });
  }
}
