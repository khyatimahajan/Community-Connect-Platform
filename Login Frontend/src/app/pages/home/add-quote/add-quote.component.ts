import {Component, HostListener, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Feed} from '../../../model/Feed';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-quote',
  templateUrl: './add-quote.component.html',
  styleUrls: ['./add-quote.component.scss']
})
export class AddQuoteComponent implements OnInit {

  quoteStr = '';
  buttonDisabled = false;
  toggled = false;
  imageObj: File;
  imageUrl = '';
  @HostListener('document:click', ['$event']) onDocumentClick(event) {
    this.toggled = false;
  }

  constructor(
      public thisDialogRef: MatDialogRef<AddQuoteComponent>,
      @Inject(MAT_DIALOG_DATA) public data: Feed,
      private userService: UserService,
      private snackBar: MatSnackBar,
      private authService: AuthService
  ) { }

  ngOnInit() {
  }
  onCloseConfirm() {
    if (this.quoteStr.length > 0) {

      let feedID;
      if (this.data) {
        if (this.data.is_repost) {
          feedID = this.data.parent_post._id;
        } else {
          feedID = this.data._id;
        }
      } else {
        feedID = this.data._id;
      }
      const body = {
        body: this.quoteStr,
        userId: this.authService.currentUser.id,
        parent_id: feedID
      };
      this.buttonDisabled = true;
      this.userService.postQuoteOrRepost(body).subscribe(response => {
        if (response) {
          this.buttonDisabled = false;
          this.thisDialogRef.close('Quote Added');
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
    this.quoteStr += event.emoji.native;
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
