import {Component, OnInit} from '@angular/core';
import {faHome, faBell, faSignOutAlt, faSmileBeam} from '@fortawesome/free-solid-svg-icons';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
import {UserProfile} from '../../model/UserProfile';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    constructor(
        private router: Router,
        private authService: AuthService,
        private sanitizer: DomSanitizer) {
    }
    currentUser: UserProfile = null;

    isSelectedItem = 0;
    sidebarIconList = ['favorite_border', 'favorite_border', 'favorite_border', 'favorite_border'];
    sidebarList = ['Home', 'Profile', 'Notifications', 'Logout'];
    connectionList = [];
    feedList = ['', '', ''];
    isLoading = false;
    imageSource = null;

    ngOnInit(): void {
        this.currentUser = this.authService.currentUser;
        if (this.currentUser == null) {
            this.router.navigate(['/login']);
        } else {
            this.sidebarList[1] = this.currentUser.name;
            this.imageSource = this.currentUser.profile_pic;
            // this.imageSource = this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/png;base64, ${this.currentUser.profile_pic}`);
            console.log(this.imageSource);
        }
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
                this.router.navigate(['/login']);
                break;
        }
    }
}
