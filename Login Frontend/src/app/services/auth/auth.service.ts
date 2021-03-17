import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { UserProfile } from '../../model/UserProfile';
import { UserSignupInfo } from '../../model/UserSignupInfo';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      this.currentUser = userObj;
    }
  }

  localLink = 'localhost:3000/api';
  awsLink = 'www.communityconnect.cc:3000/api';
  link = this.localLink;
  currentUser: UserProfile = null;
  currentUserSignUpInfo: UserSignupInfo = null;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

   /** Log a message from Auth Service */
   private static log(message: string) {
    console.log(`Auth Service: ${message}`);
  }

  // tslint:disable-next-line:variable-name
  login(email_id: string, password: string): Observable<UserProfile> {
    const body = {
      email_id, password, timezone: 'EST'
    };
    return this.http.post<any>('http://' + this.link + '/post/login', body);
  }

  // tslint:disable-next-line:variable-name
  signup(user_code: string): Observable<UserSignupInfo> {
    const headers = { user_code };
    return this.http.get<any>('http://' + this.link + '/get/signup', { headers });
  }

  createUser(body: any): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/post/create-user', body);
  }

  changePassword(body: any, userId: string): Observable<any> {
     const headers = { userId };
     return this.http.put<any>('http://' + this.link + '/put/change-password', body, { headers });
  }

  setUser(user: UserProfile) {
     this.currentUser = user;
  }

  setNotificationCount(count: number) {
    this.currentUser.notification_count = count;
    sessionStorage.setItem('user', JSON.stringify(this.currentUser));
  }

  setSignUpInfo(user: UserSignupInfo) {
    this.currentUserSignUpInfo = user;
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      AuthService.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


}
