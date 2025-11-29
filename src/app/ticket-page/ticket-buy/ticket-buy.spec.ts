import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketBuy } from './ticket-buy';

describe('TicketBuy', () => {
   let component: TicketBuy;
   let fixture: ComponentFixture<TicketBuy>;

   beforeEach(async () => {
      await TestBed.configureTestingModule({
         imports: [TicketBuy]
      })
         .compileComponents();

      fixture = TestBed.createComponent(TicketBuy);
      component = fixture.componentInstance;
      fixture.detectChanges();
   });

   it('should create', () => {
      expect(component).toBeTruthy();
   });
});
