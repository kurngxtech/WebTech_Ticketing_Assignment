import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
<<<<<<< HEAD
import { LoginPage } from './login/sign-in-page-admin/login-page';
import { UserLoginPage } from './login/sign-in-page-user/user-login-page';
import { UserSignUp } from './login/sign-up-page-user/user-sign-up';

@Component({
   selector: 'app-root',
   imports: [
      RouterOutlet,
      // UserLoginPage,
      // LoginPage,
      UserSignUp,
   ],
   templateUrl: './app.html',
   styleUrl: './app.css',
})
export class App {
   protected readonly title = signal('web-ass-ticket');
=======
import { Header } from "./header/header";
import { Footer } from "./footer/footer";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Adri');
>>>>>>> origin/adri/pages/home
}
