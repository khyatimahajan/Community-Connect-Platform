import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
import {UserProfile} from '../../model/UserProfile';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../services/user/user.service';
import {UserProfileShortened} from '../../model/UserProfileShortened';
import { Feed } from 'src/app/model/Feed';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    constructor(
        private router: Router,
        private authService: AuthService,
        private userService: UserService,
        private sanitizer: DomSanitizer) {
    }
    currentUser: UserProfile = null;

    isSelectedItem = 0;
    sidebarIconList = ['home', 'face', 'login'];
    sidebarList = ['Home', 'Profile', 'Logout'];
    connectionList: Array<UserProfileShortened> = [];
    feedList: Array<Feed> = [];
    isLoading = true;
    imageSource = null;

    ngOnInit(): void {
        this.currentUser = this.authService.currentUser;
        if (this.currentUser == null) {
            this.router.navigate(['/login']);
        } else {
            this.sidebarList[1] = this.currentUser.name;
            this.imageSource = this.currentUser.profile_pic;
            // this.imageSource = this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/png;base64, ${this.currentUser.profile_pic}`);
            this.userService.getConnections(this.currentUser.id).subscribe(response => {
                if (response) {
                    this.connectionList = response;
                }
            });
            this.loadPosts();
        }

    }

    loadPosts() {
        this.isLoading = true;
        this.userService.getFeeds(this.currentUser.id).subscribe(response => {
            if (response) {
                this.isLoading = false;
                this.feedList = response;
            }
        });
    }

    menuSelect(i: number) {
        this.isSelectedItem = i;
        switch (i) {
            case 0:
                break;
            case 1:
                break;
            case 2:
               // break;
            case 3:
                this.authService.setUser(null);
                this.router.navigate(['/login']);
                break;
        }
    }
}
