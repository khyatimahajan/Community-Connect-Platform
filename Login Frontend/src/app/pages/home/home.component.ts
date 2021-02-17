import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
import {UserProfile} from '../../model/UserProfile';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '../../services/user/user.service';
import { Feed } from 'src/app/model/Feed';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConnectionsComponent} from './connections/connections.component';
import {UserMinified} from '../../model/UserMinified';

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
        // tslint:disable-next-line:variable-name
        private _snackBar: MatSnackBar,
        private sanitizer: DomSanitizer) {
    }
    currentUser: UserProfile = null;

    @ViewChild(ConnectionsComponent) conn: ConnectionsComponent;
    isSelectedItem = 0;
    sidebarIconList = ['home', 'face', 'notifications_none', 'login'];
    sidebarList = ['Home', 'Profile', 'Notifications', 'Logout'];
    connectionList: Array<UserMinified> = [];
    feedList: Array<Feed> = [];
    isLoading = true;
    imageSource = null;
    selectedUserProfile: UserMinified;

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
            }, error => {
                this.openSnackBar(error.error.status);
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
        }, error => {
            this.openSnackBar(error.error.status);
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
               break;
            case 3:
                this.authService.setUser(null);
                sessionStorage.removeItem('user');
                this.router.navigate(['/login']);
                break;
        }
    }

    openSnackBar(message: string) {
        this._snackBar.open(message ? message : 'Error', null, {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
        });
    }

    getUserProfile(user: UserMinified) {
        this.selectedUserProfile = user;
        this.isSelectedItem = -1;
        this.conn.loadPosts(user.user_handle);
    }
}
