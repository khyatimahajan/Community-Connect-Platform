import {Component, Input, OnInit} from '@angular/core';
import {Feed} from '../../../model/Feed';
import {Router} from '@angular/router';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {UserProfileShortened} from '../../../model/UserProfileShortened';
import {UserProfile} from '../../../model/UserProfile';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnInit {

  isLoading = true;
  feedList: Array<Feed> = [];
  user: UserProfile;

  @Input() userProfileShort: UserProfileShortened;

  constructor(
      private router: Router,
      private authService: AuthService,
      private userService: UserService,
      // tslint:disable-next-line:variable-name
      private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading = true;
    this.userService.getUserProfile(this.userProfileShort.username).subscribe(response => {
      if (response) {
        this.isLoading = false;
        this.user = response.user;
        this.feedList = response.feeds;
      }
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
}
