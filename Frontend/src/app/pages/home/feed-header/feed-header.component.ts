import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {UserProfileShortened} from '../../../model/UserProfileShortened';
import {UserProfile} from '../../../model/UserProfile';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-feed-header',
  templateUrl: './feed-header.component.html',
  styleUrls: ['./feed-header.component.scss']
})
export class FeedHeaderComponent implements OnInit {

  buttonDisabled = false;
  messageStuff = '';
  showError = false;
  @Input() currentUser: UserProfile;
  @Output() postAddedStatusChange = new EventEmitter<boolean>();

  constructor(
      private router: Router,
      private snackBar: MatSnackBar,
      private userService: UserService
  ) { }

  ngOnInit(): void {

  }

  addPost() {
    if (this.messageStuff.length === 0) {
      this.showError = true;
    } else {
      console.log('message : ' + this.messageStuff);
      const body = {
        body: this.messageStuff,
        userId: this.currentUser.id
      };
      this.buttonDisabled = true;
      this.userService.postFeed(body).subscribe(response => {
        if (response) {
          this.messageStuff = '';
          this.buttonDisabled = false;
          this.openSnackBar(response.status);
          this.postAddedStatusChange.emit(true);
          // this.userService.getFeeds(this.currentUser.id);
        } else {
          console.log('There was an error posting this post');
        }
      }, error => {
        this.openSnackBar(error.error.status);
      });
    }
  }


  openSnackBar(message: string) {
    this.snackBar.open(message ? message : 'Error' ? message : 'Error', null, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

}
