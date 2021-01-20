import {Component, Inject, Input, OnInit} from '@angular/core';
import {UserService} from '../../../services/user/user.service';
import {AuthService} from '../../../services/auth/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-feed-detail',
  templateUrl: './feed-detail.component.html',
  styleUrls: ['./feed-detail.component.scss']
})
export class FeedDetailComponent implements OnInit {

  constructor(
      public thisDialogRef: MatDialogRef<FeedDetailComponent>,
      @Inject(MAT_DIALOG_DATA) public feedId: string,
      private userService: UserService,
      private authService: AuthService
  ) {
    this.loadData();
  }

  ngOnInit(): void {

  }

  loadData() {
    console.log('We come here .. ');
    if (this.feedId != null && this.authService.currentUser != null) {
      this.userService.getDetailsForAFeed(this.authService.currentUser.id, this.feedId).subscribe(response => {
        console.log(response);
      });
    } else {
      close();
    }
  }

  close() {
    this.thisDialogRef.close('Cancel');
  }
}
