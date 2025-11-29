import { Routes } from '@angular/router';
import { Home } from './home/home';
import { TicketBuy } from './ticket-page/ticket-buy/ticket-buy';
import { UserLoginPage } from './login/sign-in-page-user/user-login-page';
import { About } from './about/about';
import { MyBookings } from './user/my-bookings/my-bookings';
import { Faq } from './faq/faq/faq';
import { TicketList } from './ticket-list/ticket-list/ticket-list';

export const routes: Routes = [
   { path: '', component: Home },
   { path: 'about', component: About },
   { path: 'ticket/:id', component: TicketBuy },
   { path: 'login', component: UserLoginPage },
   { path: 'my-bookings', component: MyBookings },
   { path: 'faq', component: Faq },
   { path: 'ticket-list', component: TicketList },
   // Lazy load admin/eo modules
   {
      path: 'admin',
      loadComponent: () => import('./admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
   },
   {
      path: 'eo',
      loadComponent: () => import('./eo/eo-dashboard/eo-dashboard').then(m => m.EODashboard)
   },
   {
      path: 'eo/create-event',
      loadComponent: () => import('./eo/create-event/create-event').then(m => m.CreateEvent)
   },
   {
      path: 'eo/event/:id/edit',
      loadComponent: () => import('./eo/create-event/create-event').then(m => m.CreateEvent)
   },
   {
      path: 'analytics',
      loadComponent: () => import('./analytics/analytics-reports/analytics-reports').then(m => m.AnalyticsReports)
   },
];
