import { Component, Input, OnInit } from '@angular/core';
import { Feed } from 'src/app/model/Feed';

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

  constructor() { }

  ngOnInit(): void {
  }

}
