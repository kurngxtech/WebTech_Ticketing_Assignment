import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventOrginizerLogin } from './event-orginizer-login';

describe('EventOrginizerLogin', () => {
  let component: EventOrginizerLogin;
  let fixture: ComponentFixture<EventOrginizerLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventOrginizerLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventOrginizerLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
