import { Routes } from '@angular/router';
import { Body } from './home/body/body';
import { TicketBuy } from './ticket-page/ticket-buy/ticket-buy';

export const routes: Routes = [
  { path: '', component: Body },
  { path: 'ticket/:id', component: TicketBuy },
  { path: '**', redirectTo: '' }
];
