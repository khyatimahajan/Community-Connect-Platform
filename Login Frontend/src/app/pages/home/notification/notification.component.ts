import { Component, OnInit } from '@angular/core';
import {Notif} from '../../../model/Notif';
import {Router} from '@angular/router';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {FeedDetailComponent} from '../feed-detail/feed-detail.component';
import {Feed} from '../../../model/Feed';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {

  notificationList: Array<Notif> = [];

  constructor(
      private router: Router,
      private authService: AuthService,
      private userService: UserService,
      private snackBar: MatSnackBar,
      public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.userService.getNotifications(this.authService.currentUser.id).subscribe(response => {
      this.notificationList = response;
    }, error => {
      this.openSnackBar(error.error.status);
    });
  }

  openSnackBar(message: string) {
    this.snackBar.open(message ? message : 'Error', null, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  markNotifAsRead(item: Notif) {
    this.userService.markNotificationAsRead(this.authService.currentUser.id, item._id)
      .subscribe(response => {
        item.seen = true;
        this.authService.currentUser.notification_count = this.authService.currentUser.notification_count - 1;
        // this.openSnackBar('Marked Notification as Read');
      }, error => {
        this.openSnackBar(error.error.status);
      });
  }

  openDetailModal(f: Feed) {
    const dialogRef = this.dialog.open(FeedDetailComponent, {
      width: '800px',
      data: f
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Load') {
      } else if (result !== 'Cancel' && result != null && result.length > 5) {
        this.openDetailModal(result);
      }
    });
  }


  // tslint:disable-next-line:variable-name
  openDetailPage(notif: Notif) {
    this.userService.currentFeedId = notif.post_id;
    const dialogRef = this.dialog.open(FeedDetailComponent, {
      width: '800px',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!notif.seen) {
        this.markNotifAsRead(notif);
      }
      if (result === 'Load') {
      } else if (result && result.tweet) {
        this.openDetailModal(result);
      }
    });
  }

    markAllNotifAsRead() {
      this.userService.markAllNotificationAsRead(this.authService.currentUser.id)
          .subscribe(response => {
            for (const notification of this.notificationList) {
              notification.seen = true;
            }
            this.authService.currentUser.notification_count = 0;
            // this.openSnackBar('Marked Notification as Read');
          }, error => {
            this.openSnackBar(error.error.status);
          });
    }
}
