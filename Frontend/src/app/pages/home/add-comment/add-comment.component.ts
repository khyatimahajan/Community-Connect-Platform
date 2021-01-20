import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-comment',
  templateUrl: './add-comment.component.html',
  styleUrls: ['./add-comment.component.scss']
})
export class AddCommentComponent implements OnInit {

  commentStr = '';
  buttonDisabled = false;
  constructor(
      public thisDialogRef: MatDialogRef<AddCommentComponent>,
      @Inject(MAT_DIALOG_DATA) public data: Feed,
      private userService: UserService,
      private snackBar: MatSnackBar,
      private authService: AuthService
  ) { }

  ngOnInit() {
  }
  onCloseConfirm() {
    if (this.commentStr.length > 0) {
      const body = {
        body: this.commentStr,
        userId: this.authService.currentUser.id,
        parent_id: this.data.tweet._id
      };
      this.buttonDisabled = true;
      this.userService.putComment(body).subscribe(response => {
        if (response) {
          this.buttonDisabled = false;
          this.thisDialogRef.close('Comment Added');
        }
      }, error => {
        this.openSnackBar(error.error.status);
      });
    }
  }
  onCloseCancel() {
    this.thisDialogRef.close('Cancel');
  }

  openSnackBar(message: string) {
    this.snackBar.open(message ? message : 'Error' ? message : 'Error', null, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
