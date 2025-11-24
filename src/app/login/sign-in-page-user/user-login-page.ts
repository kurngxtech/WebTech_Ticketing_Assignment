import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
   selector: 'app-user-login-page',
   imports: [],
   templateUrl: './user-login-page.html',
   styleUrl: './user-login-page.css',
})
export class UserLoginPage {
   constructor (private router: Router) {}

   goToSignUp() {
      this.router.navigate(['/sign-up']);
   }
}
