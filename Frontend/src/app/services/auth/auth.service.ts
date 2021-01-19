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

  localLink = 'localhost:3000';
  link = this.localLink;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

   /** Log a message from Auth Service */
   private static log(message: string) {
    console.log(`Auth Service: ${message}`);
  }

  login(username: string, password: string): Observable<UserProfile> {
    const body = {
      username, password
    };
    return this.http.post<any>('http://' + this.link + '/login', body)
      .pipe(
        catchError(this.handleError('login'))
      );
  }

  signup(code: string): Observable<UserSignupInfo> {
    const body = { code };
    return this.http.post<any>('http://' + this.link + '/signup', body)
      .pipe(
        catchError(this.handleError('signup'))
      );
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
