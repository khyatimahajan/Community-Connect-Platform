import {Component, Inject, OnInit} from '@angular/core';
import {UserProfile} from '../../../model/UserProfile';
import {AuthService} from '../../../services/auth/auth.service';
import {UserService} from '../../../services/user/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';

@Component({
  selector: 'app-copy-content-modal',
  templateUrl: './copy-content-modal.component.html',
  styleUrls: ['./copy-content-modal.component.scss']
})
export class CopyContentModalComponent implements OnInit {

  constructor(
      public thisDialogRef: MatDialogRef<CopyContentModalComponent>,
      private router: Router,
      private authService: AuthService,
      private userService: UserService,
      @Inject(MAT_DIALOG_DATA) public data: Feed,
      // tslint:disable-next-line:variable-name
      private _snackBar: MatSnackBar,
  ) { }

  currentUser: UserProfile = null;
  feedBody = '';
  feedImageUrl = '';


  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    if (this.currentUser == null) {
      this.router.navigate(['/login']);
    }
    this.feedBody = this.data.body;
    this.feedImageUrl = this.data.image;
  }

  doNothing() {
    this.thisDialogRef.close('Load');
  }

  close() {
    this.thisDialogRef.close('Cancel');
  }
}
