import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { Booking, EventItem, WaitlistEntry } from '../../data-event-service/data-event';
import * as QRCode from 'qrcode';

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
   selectedBookingId: string | null = null;
   selectedBooking: Booking | null = null;
   selectedEvent: EventItem | null = null;
   selectedQrDataUrl: string = '';
   waitlistEntries: WaitlistEntry[] = [];

   constructor(
      public dataEventService: DataEventService,
      private authService: AuthService
   ) { }

   selectedTicketType: string = '';
   canCancelSelectedBooking = false;

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

      // Load waitlist entries for user
      this.waitlistEntries = this.dataEventService.getWaitlistForUser(this.currentUserId);

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

   selectBooking(bookingId: string) {
      if (!this.currentUserId) return;
      if (!bookingId) {
         // deselect
         this.selectedBookingId = null;
         this.selectedBooking = null;
         this.selectedEvent = null;
         this.selectedQrDataUrl = '';
         this.selectedTicketType = '';
         this.canCancelSelectedBooking = false;
         return;
      }

      const bookingObj = this.dataEventService.getBookingById(bookingId);
      if (!bookingObj) return;
      this.selectedBookingId = bookingId;
      this.selectedBooking = bookingObj;
      this.selectedEvent = this.dataEventService.getEventById(bookingObj.eventId) || null;

      // set ticket type for template
      this.selectedTicketType = this.selectedEvent?.tickets.find(t => t.id === bookingObj.ticketCategoryId)?.type || '';

      // Compute whether cancellation is allowed (>= 7 days before event)
      if (this.selectedEvent && this.selectedBooking) {
         const eventDate = new Date(this.selectedEvent.date).getTime();
         const daysUntil = (eventDate - Date.now()) / (1000 * 60 * 60 * 24);
         this.canCancelSelectedBooking = daysUntil >= 7 && this.selectedBooking.status === 'confirmed';
      } else {
         this.canCancelSelectedBooking = false;
      }

      // Generate QR image for display if booking has qrCode
      if (bookingObj.qrCode) {
         QRCode.toDataURL(bookingObj.qrCode, { width: 300 }).then(url => {
            this.selectedQrDataUrl = url;
         }).catch(() => this.selectedQrDataUrl = '');
      } else {
         this.selectedQrDataUrl = '';
      }
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
      const res = this.dataEventService.cancelBooking(bookingId);
      if (res.success) {
         // reload bookings and clear selection if it was the cancelled one
         this.loadBookings();
         if (this.selectedBookingId === bookingId) {
            this.selectedBookingId = null;
            this.selectedBooking = null;
            this.selectedEvent = null;
            this.selectedQrDataUrl = '';
         }
      } else {
         // Could show a toast; using console for now
         console.warn('Cancel failed:', res.message);
      }
   }
}
