import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPage } from './login/sign-in-page-admin/login-page';
import { UserLoginPage } from './login/sign-in-page-user/user-login-page';
import { UserSignUp } from './login/sign-up-page-user/user-sign-up';
import { Header } from "./header/header";
import { Footer } from "./footer/footer";
import { EoLoginPage } from "./login/eo-login-page/eo-login-page";
import { Body } from "./home/body/body";

@Component({
   selector: 'app-root',
   imports: [
      RouterOutlet,
      Header,
      // Body,
      // Footer,
      // UserSignUp,
      //  UserLoginPage,
      // LoginPage,
      // EoLoginPage,
   ],
   templateUrl: './app.html',
   styleUrl: './app.css',
})
export class App {
   protected readonly title = signal('web-ass-ticket');
   // protected readonly titleAdri = signal('Adri');
}
