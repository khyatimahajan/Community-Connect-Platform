import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  localLink = 'localhost:3000/api';
  link = this.localLink;

  userConnections = [];

  constructor() { }
}
