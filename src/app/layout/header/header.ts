import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { EventItem } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

@Component({
   standalone: true,
   selector: 'app-header',
   imports: [CommonModule, FormsModule],
   templateUrl: './header.html',
   styleUrls: ['./header.css'],
})
export class Header implements OnInit {
   query = '';
   suggestions: EventItem[] = [];
   currentUser: User | null = null;
   isAuthenticated = false;

   constructor(
      private dataSrv: DataEventService,
      private authService: AuthService,
      private router: Router
   ) { }

   ngOnInit(): void {
      this.dataSrv.searchResults$.subscribe((list) => {
         this.suggestions = list.slice(0, 6);
      });

      this.authService.authState$.subscribe(state => {
         this.currentUser = state.currentUser;
         this.isAuthenticated = state.isAuthenticated;
      });
   }
   goToHome(): void {
      this.router.navigate(['/']);
   }

   goToLogin(): void {
      this.router.navigate(['/login']);
   }

   goToDashboard(): void {
      if (this.currentUser?.role === 'eo') {
         this.router.navigate(['/eo']);
      } else if (this.currentUser?.role === 'admin') {
         this.router.navigate(['/admin']);
      } else {
         this.router.navigate(['/']);
      }
   }

   goToAbout(): void {
      this.router.navigate(['/about']);
   }

   goToMyBookings(): void {
      this.router.navigate(['/my-bookings']);
   }

   logout(): void {
      this.authService.logout();
      this.router.navigate(['/']);
   }

   onSearchInput(): void {
      this.dataSrv.setSearchQuery(this.query);
   }

   selectSuggestion(ev: EventItem): void {
      this.query = ev.title;
      this.dataSrv.setSearchQuery(this.query);
      this.suggestions = [];
      this.router.navigate(['/ticket', ev.id]);
   }
}
