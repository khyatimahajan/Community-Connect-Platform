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

  constructor(private http: HttpClient) { }

  localLink = 'localhost:3000/api';
  awsLink = 'www.communityconnect.cc:3000/api';
  link = this.awsLink;
  currentUser: UserProfile = null;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

   /** Log a message from Auth Service */
   private static log(message: string) {
    console.log(`Auth Service: ${message}`);
  }

  login(email: string, password: string): Observable<UserProfile> {
    const body = {
      email, password, timezone: 'EST'
    };
    return this.http.post<any>('http://' + this.link + '/login', body);
  }

  signup(code: string): Observable<UserSignupInfo> {
    const body = { code };
    return this.http.post<any>('http://' + this.link + '/signup', body)
      .pipe(
        catchError(this.handleError('signup'))
      );
  }

  setUser(user: UserProfile) {
     this.currentUser = user;
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
