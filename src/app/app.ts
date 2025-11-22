import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPage } from './login/sign-in-page-admin/login-page';
import { UserLoginPage } from './login/sign-in-page-user/user-login-page';
import { UserSignUp } from './login/sign-up-page-user/user-sign-up';
import { EventOrginizerLogin } from "./login/event-orginizer-login/event-orginizer-login";

@Component({
   selector: 'app-root',
   imports: [
      RouterOutlet,
      // UserLoginPage,
      // UserSignUp,
      //  LoginPage,
      EventOrginizerLogin
   ],
   templateUrl: './app.html',
   styleUrl: './app.css',
})
export class App {
   protected readonly title = signal('web-ass-ticket');
}
