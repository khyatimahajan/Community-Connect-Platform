import { Component, Input, OnInit } from '@angular/core';
import { Feed } from 'src/app/model/Feed';
// @ts-ignore
const moment = require('moment');

@Component({
  selector: 'app-feed-item-minimized',
  templateUrl: './feed-item-minimized.component.html',
  styleUrls: ['./feed-item-minimized.component.scss']
})
export class FeedItemMinimizedComponent implements OnInit {

  @Input() authorName: string;
  @Input() authorImage: string;
  @Input() body: string;
  @Input() image: string;
  // tslint:disable-next-line:variable-name
  @Input() created_at: string;

  moment = moment;
  constructor() { }

  ngOnInit(): void {
  }

}
