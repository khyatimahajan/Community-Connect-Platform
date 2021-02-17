import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { PickerModule } from '@ctrl/ngx-emoji-mart';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { HomeComponent } from './pages/home/home.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialogActions } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ConnectionsComponent } from './pages/home/connections/connections.component';
import { FeedHeaderComponent } from './pages/home/feed-header/feed-header.component';
import { NotificationComponent } from './pages/home/notification/notification.component';
import { ProfileComponent } from './pages/home/profile/profile.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FeedItemComponent } from './pages/home/feed-item/feed-item.component';
import { AddCommentComponent } from './pages/home/add-comment/add-comment.component';
import { AddQuoteComponent } from './pages/home/add-quote/add-quote.component';
import { FeedItemMinimizedComponent } from './pages/home/feed-item-minimized/feed-item-minimized.component';
import { FeedDetailComponent } from './pages/home/feed-detail/feed-detail.component';
import { CommentDetailComponent } from './pages/home/comment-detail/comment-detail.component';
import { CreateUserComponent } from './pages/create-user/create-user.component';
import {MatBadgeModule} from '@angular/material/badge';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    PageNotFoundComponent,
    ConnectionsComponent,
    FeedHeaderComponent,
    NotificationComponent,
    ProfileComponent,
    FeedItemComponent,
    AddCommentComponent,
    AddQuoteComponent,
    FeedItemMinimizedComponent,
    FeedDetailComponent,
    CommentDetailComponent,
    CreateUserComponent,
  ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatInputModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatDividerModule,
        MatSlideToggleModule,
        MatSelectModule,
        MatSidenavModule,
        MatListModule,
        FontAwesomeModule,
        MatProgressBarModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        PickerModule,
        MatBadgeModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
