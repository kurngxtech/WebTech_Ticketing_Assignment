// src/app/ticket-page/ticket-buy/ticket-buy.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { EventItem, TicketCategory, Booking } from '../../data-event-service/data-event';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';

@Component({
   selector: 'app-ticket-buy',
   standalone: true,
   imports: [CommonModule, FormsModule, RouterLink],
   templateUrl: './ticket-buy.html',
   styleUrls: ['./ticket-buy.css']
})
export class TicketBuy implements OnInit {
   event?: EventItem;
   eventId!: number;
   couponCode = '';
   appliedDiscount = 0;
   message = '';
   quantities: { [ticketId: string]: number } = {};
   currentUserId = '';
   isAuthenticated = false;

   // Booking state
   bookingInProgress = false;
   currentBooking: Booking | null = null;
   showPaymentModal = false;
   showQRCodeDisplay = false;
   paymentMethod: string = '';
   qrCodeDataUrl: string = '';
   qrCodeData: string = '';
   cart: Array<{ ticket: TicketCategory; qty: number }> = [];
   showContinueShopping = false;
   totalCartPrice = 0;
   paymentMethods = [
      { id: 'credit-card', name: 'Credit Card' },
      { id: 'debit-card', name: 'Debit Card' },
      { id: 'e-wallet', name: 'E-Wallet' },
      { id: 'bank-transfer', name: 'Bank Transfer' }
   ];

   constructor(
      private route: ActivatedRoute,
      private dataSrv: DataEventService,
      private authService: AuthService,
      private pdfGeneratorService: PdfGeneratorService,
      private router: Router
   ) { }

   ngOnInit(): void {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
         this.currentUserId = currentUser.id;
         this.isAuthenticated = true;
      } else {
         this.isAuthenticated = false;
      }

      this.route.paramMap.subscribe(params => {
         const idStr = params.get('id');
         if (!idStr) {
            this.router.navigate(['/']);
            return;
         }
         this.eventId = Number(idStr);
         this.event = this.dataSrv.getEventById(this.eventId);
         if (!this.event) {
            this.router.navigate(['/']);
         } else {
            // initialize quantities for each ticket category
            for (const t of this.event.tickets) {
               this.quantities[t.id] = 1;
            }
         }
      });
   }

   applyCoupon(): void {
      this.appliedDiscount = this.dataSrv.applyCoupon(this.couponCode);
      this.message = this.appliedDiscount > 0
         ? `Coupon applied: ${this.appliedDiscount}% discount`
         : 'Invalid coupon code';
   }

   incrementQuantity(ticketId: string, maxRemaining: number): void {
      const currentQty = this.quantities[ticketId] || 1;
      if (currentQty < maxRemaining) {
         this.quantities[ticketId] = currentQty + 1;
      }
   }

   decrementQuantity(ticketId: string): void {
      const currentQty = this.quantities[ticketId] || 1;
      if (currentQty > 1) {
         this.quantities[ticketId] = currentQty - 1;
      }
   }

   getRemaining(t: TicketCategory): number {
      return t.total - t.sold;
   }

   ticketPriceAfterDiscount(t: TicketCategory): number {
      if (!t) return 0;
      const discount = Math.max(0, Math.min(100, this.appliedDiscount || 0));
      return Math.round(t.price * (1 - discount / 100));
   }

   purchase(ticket: TicketCategory, qty = 1): void {
      // Check if user is authenticated
      if (!this.isAuthenticated) {
         this.message = '🔐 Please login to purchase tickets';
         setTimeout(() => {
            this.router.navigate(['/login']);
         }, 2000);
         return;
      }

      if (this.getRemaining(ticket) < qty) {
         this.message = 'Not enough tickets available';
         return;
      }

      const result = this.dataSrv.buyTicket(this.eventId, ticket.id, qty, this.currentUserId);

      if (result.success && result.booking) {
         this.currentBooking = result.booking;
         this.currentBooking.discountApplied = this.appliedDiscount;
         this.currentBooking.totalPrice = this.ticketPriceAfterDiscount(ticket) * qty;

         this.showPaymentModal = true;
         this.bookingInProgress = true;
         this.message = '';

         // Refresh event data
         this.event = this.dataSrv.getEventById(this.eventId);
      } else {
         this.message = result.message || 'Purchase failed';
      }
   }

   addToCart(ticket: TicketCategory): void {
      const qty = this.quantities[ticket.id] || 1;

      if (this.getRemaining(ticket) < qty) {
         this.message = 'Not enough tickets available';
         return;
      }

      // Check if ticket already in cart
      const cartItem = this.cart.find(item => item.ticket.id === ticket.id);
      if (cartItem) {
         cartItem.qty += qty;
      } else {
         this.cart.push({ ticket, qty });
      }

      // Reset quantity input
      this.quantities[ticket.id] = 1;
      this.updateCartTotal();
      this.message = `✓ Added ${qty} ${ticket.type} ticket(s) to cart`;
   }

   removeFromCart(ticketId: string): void {
      this.cart = this.cart.filter(item => item.ticket.id !== ticketId);
      this.updateCartTotal();
   }

   updateCartTotal(): void {
      this.totalCartPrice = this.cart.reduce((total, item) => {
         const price = this.ticketPriceAfterDiscount(item.ticket);
         return total + (price * item.qty);
      }, 0);
   }

   checkoutCart(): void {
      if (this.cart.length === 0) {
         this.message = 'Your cart is empty';
         return;
      }

      this.showPaymentModal = true;
   }

   continueShopping(): void {
      this.showContinueShopping = false;
      this.cart = [];
      this.totalCartPrice = 0;
      this.quantities = {};
      for (const t of this.event?.tickets || []) {
         this.quantities[t.id] = 1;
      }
   }

   processPayment(): void {
      // Generate QR code using qrcode library
      if (!this.event) return;

      // Process all items in cart or single booking
      const itemsToProcess = this.cart.length > 0 ? this.cart :
         (this.currentBooking ? [{ ticket: this.event.tickets.find(t => t.id === this.currentBooking!.ticketCategoryId)!, qty: this.currentBooking.quantity }] : []);

      if (itemsToProcess.length === 0) return;

      // If cart has items, create bookings for each cart item
      if (this.cart.length > 0) {
         for (const cartItem of this.cart) {
            const result = this.dataSrv.buyTicket(this.eventId, cartItem.ticket.id, cartItem.qty, this.currentUserId);
            if (result.success && result.booking) {
               result.booking.discountApplied = this.appliedDiscount;
               result.booking.totalPrice = this.ticketPriceAfterDiscount(cartItem.ticket) * cartItem.qty;
               // Use the first booking for QR display
               if (!this.currentBooking) {
                  this.currentBooking = result.booking;
               }
            }
         }
      }

      // Generate QR for the first item or use cart
      const firstItem = itemsToProcess[0];
      const qrData = `${this.event.id}|${firstItem.ticket.section || 'GENERAL'}|${this.event.date}`;
      this.qrCodeData = qrData;

      if (this.currentBooking) {
         this.currentBooking.qrCode = qrData;
      }

      // Generate QR code image using qrcode library
      QRCode.toDataURL(qrData, {
         width: 300,
         margin: 2,
         color: {
            dark: '#000000',
            light: '#ffffff'
         }
      }).then((url: string) => {
         this.qrCodeDataUrl = url;
      }).catch((err: Error) => {
         console.error('Error generating QR code:', err);
      });

      this.showPaymentModal = false;
      this.showQRCodeDisplay = true;
      // After successful purchase, show button to view bookings (not continue shopping)
      this.showContinueShopping = false;
      this.message = '✓ Payment successful! Your QR code is ready';
   }

   createSimpleQRVisual(data: string): string {
      // Create a simple visual QR representation using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      canvas.width = 300;
      canvas.height = 300;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);

      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 300, 300);

      // Draw title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOOKING QR CODE', 150, 50);

      // Draw booking ID as text
      ctx.font = '11px monospace';
      ctx.fillText(data, 150, 150);

      // Draw decorative QR-like pattern
      ctx.fillStyle = '#000000';
      const gridSize = 8;
      for (let i = 0; i < 25; i++) {
         for (let j = 0; j < 25; j++) {
            if (Math.random() > 0.5) {
               ctx.fillRect(40 + i * gridSize, 180 + j * gridSize, gridSize - 1, gridSize - 1);
            }
         }
      }

      return canvas.toDataURL('image/png');
   }

   downloadQRCode(): void {
      if (!this.qrCodeDataUrl) return;

      const link = document.createElement('a');
      link.href = this.qrCodeDataUrl;
      link.download = `qr_${this.currentBooking?.id}.png`;
      link.click();
   }

   /**
    * Download complete ticket as PDF
    */
   downloadTicketPDF(): void {
      if (!this.currentBooking || !this.event) return;

      const ticketCategory = this.event.tickets.find(t => t.id === this.currentBooking!.ticketCategoryId);
      if (!ticketCategory) return;

      const userName = this.authService.getCurrentUser()?.fullName || 'Guest';

      this.pdfGeneratorService.generateTicketPDF(
         this.currentBooking.id,
         this.qrCodeData,
         this.event.title,
         ticketCategory.type,
         this.currentBooking.quantity,
         this.currentBooking.totalPrice,
         this.event.date,
         userName
      ).catch(error => {
         console.error('Error generating PDF:', error);
      });
   }

   backToHome(): void {
      this.showQRCodeDisplay = false;
      this.currentBooking = null;
      this.qrCodeData = '';
      this.message = '';
      this.router.navigate(['/my-bookings']);
   }

   cancelBooking(): void {
      this.showPaymentModal = false;
      this.currentBooking = null;
      this.message = 'Booking cancelled';
   }

   closeQRCodeDisplay(): void {
      if (this.showContinueShopping) {
         this.showQRCodeDisplay = false;
         this.continueShopping();
      } else {
         this.showQRCodeDisplay = false;
         this.currentBooking = null;
         this.qrCodeData = '';
         this.message = '';
         // Redirect to my-bookings instead of home
         this.router.navigate(['/my-bookings']);
      }
   }

   formattedPrice(priceNum: number): string {
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD',
         maximumFractionDigits: 0
      }).format(priceNum);
   }

   joinWaitlist(ticket: TicketCategory): void {
      // Check if user is authenticated
      if (!this.isAuthenticated) {
         this.message = '🔐 Please login to join waitlist';
         setTimeout(() => {
            this.router.navigate(['/login']);
         }, 2000);
         return;
      }

      if (this.getRemaining(ticket) > 0) {
         alert('Tickets still available');
         return;
      }

      const result = this.dataSrv.joinWaitlist(this.eventId, ticket.id, this.currentUserId, 1);
      if (result.success) {
         this.message = `✓ You've been added to the waitlist for ${ticket.type}`;
      } else {
         this.message = result.message;
      }
   }
}