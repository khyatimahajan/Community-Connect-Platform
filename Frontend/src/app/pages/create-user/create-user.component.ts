import {Component, Input, OnInit} from '@angular/core';
import {UserSignupInfo} from '../../model/UserSignupInfo';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthService} from '../../services/auth/auth.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  signUpData: UserSignupInfo = null;
  imageSrc: string;
  password = '';
  cPassword = '';

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private snackBar: MatSnackBar,
      private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.signUpData = this.authService.currentUserSignUpInfo;
    if (this.signUpData == null) {

      const code = localStorage.getItem('user_id');
      if (code) {
        this.authService.signup(code).subscribe(response => {
          if (response == null) {
            this.openSnackBar('Some Error Occured.');
          } else {
            this.signUpData = response;
            this.signUpData.email = this.signUpData.EmailID + '';
            this.authService.setSignUpInfo(this.signUpData);
          }
        }, error => {
          this.openSnackBar(error.error.status);
        });
      } else {
        this.openSnackBar('No SignUp User Info Detected. Please try again.');
        this.router.navigate(['/login']);
      }
    }

    this.imageSrc = localStorage.getItem('avatar');
    if (this.imageSrc == null) {
      this.openSnackBar('No Avatar Detected. Please try again.');
      this.router.navigate(['/login']);
    }
  }

  openSnackBar(message: string) {
    this.snackBar.open(message ? message : 'Error', null, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  signUpUser() {

    const body = {
      image_src: this.imageSrc,
      name: this.signUpData.name,
      email: this.signUpData.EmailID,
      username: this.signUpData.username,
      bio: this.signUpData.bio,
      password: this.password,
      password_conf: this.cPassword,
    };
    this.authService.createUser(body).subscribe(response => {
      this.openSnackBar(response.status);
      this.router.navigate(['/login']);
    }, error => {
      this.openSnackBar(error.error.status);
    });
  }
}
