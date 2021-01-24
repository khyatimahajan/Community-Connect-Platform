import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {UserProfile} from '../../model/UserProfile';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserProfileShortened} from '../../model/UserProfileShortened';
import { Feed } from 'src/app/model/Feed';
import {FeedDetailItem} from '../../model/FeedDetailItem';
import {Notif} from '../../model/Notif';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  localLink = 'localhost:3000/api';
  awsLink = 'www.communityconnect.cc:3000/api';
  link = this.awsLink;

  currentFeedId: string;
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

  getFeeds(id: string): Observable<Array<Feed>> {
    const headers = { id };
    return this.http.get<any>('http://' + this.link + '/feeds', { headers });
  }

  postFeed(body: any): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/feed', body);
  }

  putLike(body: any): Observable<any> {
    return this.http.put<any>('http://' + this.link + '/like', body);
  }

  putComment(body: any): Observable<any> {
    return this.http.put<any>('http://' + this.link + '/comment', body);
  }

  postQuoteOrRepost(body: any): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/repost', body);
  }

  getDetailsForAFeed(userId: string, feedId: string): Observable<Array<FeedDetailItem>> {
    const headers = { userId };
    return this.http.get<any>('http://' + this.link + '/feeds/' + feedId, { headers });
  }

  imageUpload(imageForm: FormData): Observable<any> {
    return this.http.post<any>('http://' + this.link + '/v1/upload', imageForm);
  }

  getNotifications(userId: string): Observable<Array<Notif>> {
    const headers = { userId };
    return this.http.get<any>('http://' + this.link + '/get-notifications', { headers });
  }

  markNotificationAsRead(userId: string, notifId: string): Observable<Array<Notif>> {
    const headers = { userId, notifId };
    return this.http.put<any>('http://' + this.link + '/mark-notif-as-read', null, { headers });
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
