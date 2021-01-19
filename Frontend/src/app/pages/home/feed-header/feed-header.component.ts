import { Component, OnInit } from '@angular/core';
import { faImage, faSmile } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-feed-header',
  templateUrl: './feed-header.component.html',
  styleUrls: ['./feed-header.component.scss']
})
export class FeedHeaderComponent implements OnInit {

  faImage = faImage
  faSmile = faSmile
  constructor() { }

  ngOnInit(): void {
  }

}
