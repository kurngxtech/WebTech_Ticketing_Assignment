import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPage } from './pages/sign-in-page-admin/login-page';
import { UserLoginPage } from './pages/sign-in-page-user/user-login-page';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    UserLoginPage,
    // LoginPage,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('web-ass-ticket');
}
