import {Component, OnInit, Inject, HostListener} from '@angular/core';
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
  toggled = false;
  imageObj: File;
  imageUrl = '';

  constructor(
      public thisDialogRef: MatDialogRef<AddCommentComponent>,
      @Inject(MAT_DIALOG_DATA) public data: Feed,
      private userService: UserService,
      private snackBar: MatSnackBar,
      private authService: AuthService
  ) { }

  ngOnInit() {
    this.thisDialogRef.updatePosition({ top: '50px' });
  }
  @HostListener('document:click', ['$event']) onDocumentClick(event) {
    this.toggled = false;
  }
  onCloseConfirm() {
    if (this.commentStr.length > 0) {
      const body = {
        body: this.commentStr,
        image: this.imageUrl && this.imageUrl.length > 0 ? this.imageUrl : null,
        userId: this.authService.currentUser.id,
        parent_id: this.data.is_repost ? this.data.parent_post._id : this.data._id
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

  handleSelection(event) {
    this.commentStr += event.emoji.native;
  }

  onImagePicked(event: Event): void {
    const FILE = (event.target as HTMLInputElement).files[0];
    this.imageObj = FILE;
    this.onImageUpload();
  }

  onImageUpload() {
    const imageForm = new FormData();
    imageForm.append('image', this.imageObj);
    this.userService.imageUpload(imageForm).subscribe(res => {
      this.imageUrl = res.image;
    }, error => {
      this.openSnackBar('Could not upload Image Properly. Please try again');
      this.imageUrl = '';
    });
  }

}
