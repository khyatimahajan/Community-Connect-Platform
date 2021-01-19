import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {UserProfile} from '../../model/UserProfile';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserProfileShortened} from '../../model/UserProfileShortened';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  localLink = 'localhost:3000/api';
  link = this.localLink;

  userConnections: Array<UserProfileShortened> = [];

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  /** Log a message from Auth Service */
  private static log(message: string) {
    console.log(`User Service: ${message}`);
  }

  getConnections(userId: string): Observable<Array<UserProfileShortened>> {
    const headers = { userId };
    return this.http.get<any>('http://' + this.link + '/connections', { headers });
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
      UserService.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
