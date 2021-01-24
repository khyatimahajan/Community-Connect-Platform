import { Component, OnInit } from '@angular/core';
import {Notif} from '../../../model/Notif';
import {Router} from '@angular/router';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';

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
        this.openSnackBar('Marked Notification as Read');
      }, error => {
        this.openSnackBar(error.error.status);
      });
  }

  // tslint:disable-next-line:variable-name
  openDetailPage(post_id: string) {

    console.log('Open Details Page ... ');
  }
}
