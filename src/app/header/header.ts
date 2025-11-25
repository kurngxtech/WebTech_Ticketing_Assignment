import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataEventService } from '../data-event-service/data-event.service';
import { EventItem } from '../data-event-service/data-event';

@Component({
   standalone: true,
   selector: 'app-header',
   imports: [CommonModule, FormsModule],
   templateUrl: './header.html',
   styleUrls: ['./header.css'],
})
export class Header {
   query = '';
   suggestions: EventItem[] = [];

   constructor(private dataSrv: DataEventService, private router: Router) { }

   goToLogin() {
      this.router.navigate(['/login']);
   }

   goToSignUp() {
      this.router.navigate(['/sign-up']);
   }

   ngOnInit(): void {
      this.dataSrv.searchResults$.subscribe((list) => {
         this.suggestions = list.slice(0, 6);
      });
   }

   onSearchInput() {
      this.dataSrv.setSearchQuery(this.query);
   }

   selectSuggestion(ev: EventItem) {
      // navigate to ticket detail
      this.query = ev.title;
      this.dataSrv.setSearchQuery(this.query);
      this.suggestions = [];
      this.router.navigate(['/ticket', ev.id]);
   }
}
