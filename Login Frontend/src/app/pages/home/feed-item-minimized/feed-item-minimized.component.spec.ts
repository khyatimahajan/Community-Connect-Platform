import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedItemMinimizedComponent } from './feed-item-minimized.component';

describe('FeedItemMinimizedComponent', () => {
  let component: FeedItemMinimizedComponent;
  let fixture: ComponentFixture<FeedItemMinimizedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeedItemMinimizedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedItemMinimizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
