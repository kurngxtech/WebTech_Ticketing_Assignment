import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
   selector: 'app-user-sign-up',
   imports: [],
   templateUrl: './user-sign-up.html',
   styleUrl: './user-sign-up.css',
})
export class UserSignUp {
   constructor(private router: Router) { }

   goToLogin() {
      this.router.navigate(['/login'])
   }
}
