import {Component, OnInit} from '@angular/core';
import {UserSignupInfo} from '../../model/UserSignupInfo';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {AuthService} from '../../services/auth/auth.service';
import {UserService} from '../../services/user/user.service';

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
      private authService: AuthService,
      private userService: UserService
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
            this.signUpData.email_id = this.signUpData.email_id + '';
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
    this.onImageUpload();
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

  onImageUpload() {
    const imageBlob = this.dataURItoBlob(this.imageSrc);
    const imageFile = new File([imageBlob], 'profile_pic', { type: 'image/png' });
    const imageForm = new FormData();
    imageForm.append('image', imageFile);
    this.userService.imageUpload(imageForm).subscribe(res => {
      this.imageSrc = res.image;
    }, error => {
      this.openSnackBar('Could not upload Image Properly. Please try again');
      // this.imageUrl = '';
    });
  }

  dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    }
    else {
      byteString = unescape(dataURI.split(',')[1]);
    }

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type: mimeString});
  }

  signUpUser() {

    const body = {
      image_src: this.imageSrc,
      name: this.signUpData.name,
      email_id: this.signUpData.email_id,
      user_handle: this.signUpData.user_handle,
      location: 'EST',
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
