import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from "./header/header";
import { Footer } from "./footer/footer";
import { CommonModule } from '@angular/common';
import { UserLoginPage } from "./login/sign-in-page-user/user-login-page";

@Component({
   selector: 'app-root',
   imports: [
      RouterOutlet,
      CommonModule,
      Header,
      Footer
   ],
   templateUrl: './app.html',
   styleUrl: './app.css',
})
export class App {
   hideLayout = false;

   constructor(private router: Router) {
      this.router.events
         .pipe(filter(event => event instanceof NavigationEnd))
         .subscribe((event: NavigationEnd) => {
            this.hideLayout = event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects.includes('/sign-up');
         });
   }
}
