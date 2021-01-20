import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';

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
      this.userService.putComment(body).subscribe(response => {
        if (response) {
          this.thisDialogRef.close('Comment Added');
        }
      });
    }
  }
  onCloseCancel() {
    this.thisDialogRef.close('Cancel');
  }
}
