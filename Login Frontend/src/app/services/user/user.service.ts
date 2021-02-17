import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {UserProfile} from '../../model/UserProfile';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Feed } from 'src/app/model/Feed';
import {Notif} from '../../model/Notif';
import {UserDetails} from '../../model/UserDetails';
import {UserMinified} from '../../model/UserMinified';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  localLink = 'localhost:3000/api';
  awsLink = 'www.communityconnect.cc:3000/api';
  link = this.localLink;

  currentFeedId: string;
  userConnections: Array<UserMinified> = [];

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  /** Log a message from Auth Service */
  private static log(message: string) {
    console.log(`User Service: ${message}`);
  }

  getConnections(userId: string): Observable<Array<UserMinified>> {
    const headers = { userId };
    return this.http.get<any>('http://' + this.link + '/get/connections', { headers });
  }

  getFeeds(id: string): Observable<Array<Feed>> {
    const headers = { id };
    return this.http.get<any>('http://' + this.link + '/get/feeds', { headers });
  }

  postFeed(body: any): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/post/feed', body);
  }

  putLike(body: any): Observable<any> {
    return this.http.put<any>('http://' + this.link + '/put/like', body);
  }

  putComment(body: any): Observable<any> {
    return this.http.put<any>('http://' + this.link + '/put/comment', body);
  }

  postQuoteOrRepost(body: any): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/post/repost', body);
  }

  getDetailsForAFeed(userId: string, feedId: string): Observable<Feed> {
    const headers = { userId };
    return this.http.get<any>('http://' + this.link + '/get/feeds/' + feedId, { headers });
  }

  imageUpload(imageForm: FormData): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/post/v1/upload', imageForm);
  }

  getNotifications(userId: string): Observable<Array<Notif>> {
    const headers = { userId };
    return this.http.get<any>('http://' + this.link + '/get/notifications', { headers });
  }

  markNotificationAsRead(userId: string, notifId: string): Observable<Array<Notif>> {
    const headers = { userId, notifId };
    return this.http.put<any>('http://' + this.link + '/put/mark-one-notif-as-read', null, { headers });
  }

  markAllNotificationAsRead(userId: string): Observable<Array<Notif>> {
    const headers = { userId };
    return this.http.put<any>('http://' + this.link + '/put/mark-all-notifs-as-read', null, { headers });
  }

  getUserProfile(username: string): Observable<UserDetails> {
    return this.http.get<UserDetails>('http://' + this.link + '/get/user/' + username);
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
