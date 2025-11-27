import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Header } from "./layout/header/header";
import { Footer } from "./layout/footer/footer";
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { UserLoginPage } from "./login/sign-in-page-user/user-login-page";
=======
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
>>>>>>> origin/adri/pages/home

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
   platformId = inject(PLATFORM_ID);

   constructor(private router: Router) {
      this.router.events
         .pipe(filter(event => event instanceof NavigationEnd))
         .subscribe((event: NavigationEnd) => {
            this.hideLayout = event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects.includes('/sign-up');
         });
   }

   onActivate() {
      if (isPlatformBrowser(this.platformId)) {
         window.scrollTo(0, 0);
      }
   }
}
