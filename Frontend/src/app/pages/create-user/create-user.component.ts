import {Component, Input, OnInit} from '@angular/core';
import {UserSignupInfo} from '../../model/UserSignupInfo';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  @Input() signUpData: UserSignupInfo;

  constructor() { }

  ngOnInit(): void {
  }

}
