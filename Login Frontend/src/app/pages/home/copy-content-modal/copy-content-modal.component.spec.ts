import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyContentModalComponent } from './copy-content-modal.component';

describe('CopyContentModalComponent', () => {
  let component: CopyContentModalComponent;
  let fixture: ComponentFixture<CopyContentModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyContentModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyContentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
