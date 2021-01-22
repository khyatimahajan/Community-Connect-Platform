import { Component, OnInit } from '@angular/core';
import {UserProfile} from '../../../model/UserProfile';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthService} from '../../../services/auth/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: UserProfile;
  currentPassword: string;
  newPassword: string;
  cnewPassword: string;
  constructor(
      private router: Router,
      private snackBar: MatSnackBar,
      private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    if (this.user == null) {
      this.router.navigate(['/login']);
    }
  }

  changePassword() {
    const body = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      cnewPassword: this.cnewPassword
    };
    this.authService.changePassword(body, this.user.id).subscribe(response => {
      this.cnewPassword = '';
      this.currentPassword = '';
      this.newPassword = '';
      this.openSnackBar('Successfully Changed Password');
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
