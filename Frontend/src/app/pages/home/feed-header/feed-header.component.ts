import {Component, Input, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {UserProfileShortened} from '../../../model/UserProfileShortened';
import {UserProfile} from '../../../model/UserProfile';

@Component({
  selector: 'app-feed-header',
  templateUrl: './feed-header.component.html',
  styleUrls: ['./feed-header.component.scss']
})
export class FeedHeaderComponent implements OnInit {

  buttonDisabled = true;
  messageStuff: string;
  showError = false;
  @Input() currentUser: UserProfile;

  constructor(
      private router: Router,
      private userService: UserService
  ) { }

  ngOnInit(): void {

  }

  addPost() {
    console.log('message : ' + this.messageStuff);
    if (this.messageStuff.length === 0) {
      this.showError = true;
    } else {
      const body = {
        body: this.messageStuff,
        userId: this.currentUser.id
      };
      this.userService.postFeed(body).subscribe(response => {
        if (response) {
          this.userService.getFeeds(this.currentUser.id);
        } else {
          console.log('There was an error posting this post');
        }
      });
    }
  }

}
