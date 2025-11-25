import { Routes } from '@angular/router';
import { Home } from './home/home';
import { TicketBuy } from './ticket-page/ticket-buy/ticket-buy';
import { UserLoginPage } from './login/sign-in-page-user/user-login-page';
import { UserSignUp } from './login/sign-up-page-user/user-sign-up';

export const routes: Routes = [
   { path: '', component: Home },
   { path: 'ticket/:id', component: TicketBuy },
   { path: 'login', component: UserLoginPage },
   { path: 'sign-up', component: UserSignUp },
];
