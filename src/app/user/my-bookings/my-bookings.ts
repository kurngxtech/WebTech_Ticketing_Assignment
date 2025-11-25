import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { Booking } from '../../data-event-service/data-event';

interface BookingDisplay {
   id: string;
   eventTitle: string;
   eventDate: string;
   ticketType: string;
   quantity: number;
   totalPrice: number;
   bookingDate: string;
   status: 'confirmed' | 'pending' | 'cancelled';
}

@Component({
   selector: 'app-my-bookings',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './my-bookings.html',
   styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {
   bookings: BookingDisplay[] = [];
   filteredBookings: BookingDisplay[] = [];
   filterStatus: 'all' | 'confirmed' | 'pending' | 'cancelled' = 'all';
   isLoading = true;
   currentUserId: string | null = null;

   constructor(
      private dataEventService: DataEventService,
      private authService: AuthService
   ) {}

   ngOnInit() {
      this.authService.authState$.subscribe(state => {
         if (state.isAuthenticated && state.currentUser) {
            this.currentUserId = state.currentUser.id || 'user_' + Date.now();
            this.loadBookings();
         } else {
            this.isLoading = false;
         }
      });
   }

   loadBookings() {
      if (!this.currentUserId) return;

      // Get bookings from service
      const userBookings = this.dataEventService.getBookingsByUser(this.currentUserId);
      const events = this.dataEventService.getEvents();

      // Map bookings to display format
      this.bookings = userBookings.map(booking => {
         const event = events.find(e => e.id === booking.eventId);
         const ticketCategory = event?.tickets.find(t => t.id === booking.ticketCategoryId);

         return {
            id: booking.id,
            eventTitle: event?.title || 'Unknown Event',
            eventDate: event?.date || '',
            ticketType: ticketCategory?.type || 'Standard',
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            bookingDate: booking.bookingDate,
            status: booking.status as 'confirmed' | 'pending' | 'cancelled'
         };
      });

      this.isLoading = false;
      this.applyFilter();
   }

   applyFilter() {
      if (this.filterStatus === 'all') {
         this.filteredBookings = this.bookings;
      } else {
         this.filteredBookings = this.bookings.filter(b => b.status === this.filterStatus);
      }
   }

   setFilter(status: 'all' | 'confirmed' | 'pending' | 'cancelled') {
      this.filterStatus = status;
      this.applyFilter();
   }

   getStatusBadgeClass(status: string): string {
      switch (status) {
         case 'confirmed':
            return 'badge-success';
         case 'pending':
            return 'badge-warning';
         case 'cancelled':
            return 'badge-danger';
         default:
            return 'badge-secondary';
      }
   }

   downloadTicket(bookingId: string) {
      console.log('Downloading ticket for booking:', bookingId);
      // Implement download logic
   }

   cancelBooking(bookingId: string) {
      const booking = this.bookings.find(b => b.id === bookingId);
      if (booking) {
         booking.status = 'cancelled';
         this.applyFilter();
      }
   }
}
