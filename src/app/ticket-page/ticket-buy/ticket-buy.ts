// src/app/ticket-page/ticket-buy/ticket-buy.ts
import { Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { EventItem, TicketCategory, Booking } from '../../data-event-service/data-event';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';

interface Seat {
   id: string;
   status: 'available' | 'booked' | 'selected';
}

interface SeatingBlock {
   name: string; // Contoh: 'LF-A', 'VIP', 'B-B'
   rows: number;
   seatsPerRow: number;
   seatsData: Seat[][]; // Data kursi yang sebenarnya
}

@Injectable({
   providedIn: 'root'
})

@Component({
   selector: 'app-ticket-buy',
   standalone: true,
   imports: [CommonModule, FormsModule, RouterLink],
   templateUrl: './ticket-buy.html',
   styleUrls: ['./ticket-buy.css']
})
export class TicketBuy implements OnInit {

   // Definisikan semua blok kursi dengan dimensi baru
   seatingBlocks: SeatingBlock[] = [
      // LOWER FOYER
      { name: 'LF-A', rows: 12, seatsPerRow: 15, seatsData: [] },
      { name: 'VIP', rows: 4, seatsPerRow: 15, seatsData: [] },
      { name: 'LF-B', rows: 8, seatsPerRow: 15, seatsData: [] },
      { name: 'LF-C', rows: 12, seatsPerRow: 15, seatsData: [] },
      // BALCONY
      { name: 'B-A', rows: 5, seatsPerRow: 11, seatsData: [] },
      { name: 'B-B', rows: 5, seatsPerRow: 23, seatsData: [] },
      { name: 'B-C', rows: 5, seatsPerRow: 11, seatsData: [] },
   ];

   event?: EventItem;
   eventId!: number;
   couponCode = '';
   appliedDiscount = 0;
   message = '';
   quantities: { [ticketId: string]: number } = {};
   currentUserId = '';
   isAuthenticated = false;
   showSelectionSeats = false;

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
   selectedSeats: Array<string> = [];
   paymentMethods = [
      { id: 'credit-card', name: 'Credit Card' },
      { id: 'debit-card', name: 'Debit Card' },
      { id: 'e-wallet', name: 'E-Wallet' },
      { id: 'bank-transfer', name: 'Bank Transfer' }
   ];

   calculatePriceFromSeats(seats: Array<string>): number {
      // ASUMSI: Harga per kursi didasarkan pada harga tiket kategori pertama (atau kategori General)
      const firstTicket = this.event?.tickets[0];

      if (!firstTicket) {
         // Fallback price jika tidak ada kategori tiket
         return seats.length * 50;
      }

      const price = this.ticketPriceAfterDiscount(firstTicket);
      return seats.length * price;
   }

   startPaymentProcess(): void {
      // 1. Dapatkan daftar kursi yang dipilih secara internal
      const selectedSeatsArray = this.getSelectedSeats().map(seat => seat.id);

      // 2. Cek validasi (sesuai logika awal Anda)
      if (selectedSeatsArray.length === 0) {
         this.message = 'Please select at least one seat.';
         return;
      }

      // [Optional: Tambahkan logika otentikasi di sini jika belum ada di bookSelectedSeats()]
      // if (!this.isAuthenticated) { ... }

      // 3. Simpan data kursi
      this.selectedSeats = selectedSeatsArray;

      // 4. Hitung harga total baru
      // Fungsi calculatePriceFromSeats() harus menerima argumen, tapi kita sudah punya
      // selectedSeatsArray yang merupakan array<string>
      this.totalCartPrice = this.calculatePriceFromSeats(selectedSeatsArray);

      // 5. Tampilkan modal pembayaran
      this.showPaymentModal = true;
      this.showSelectionSeats = false;
      this.showQRCodeDisplay = false; // Pastikan modal QR ditutup
      this.message = ''; // Reset pesan
   }

   initializeSeats(numRows: number, seatsPerRow: number, blockName: string): Seat[][] {
      const seats: Seat[][] = [];
      for (let i = 0; i < numRows; i++) {
         const row: Seat[] = [];
         const rowLabel = this.getRowLabel(i); // Ambil label A, B, C...
         for (let j = 0; j < seatsPerRow; j++) {
            row.push({
               id: `${blockName}-${rowLabel}${j + 1}`, // Contoh: LF-A-A1
               status: 'available'
            });
         }
         seats.push(row);
      }
      return seats;
   }

   // Fungsi Toggle yang direvisi untuk bekerja dengan struktur blok
   toggleSeat(blockName: string, rowIndex: number, seatIndex: number): void {
      const block = this.seatingBlocks.find(b => b.name === blockName);
      if (!block) return;

      const seat = block.seatsData[rowIndex][seatIndex];

      if (seat.status === 'booked') {
         return;
      }

      // Toggle status: selected <-> available
      seat.status = (seat.status === 'selected') ? 'available' : 'selected';

      console.log(`Kursi ${seat.id} diubah menjadi ${seat.status}`);
   }

   // Getter: Mendapatkan array semua kursi yang dipilih
   getSelectedSeats(): Seat[] {
      return this.seatingBlocks.flatMap(block =>
         block.seatsData.flat().filter(seat => seat.status === 'selected')
      );
   }

   // Getter: Mengecek apakah ada kursi yang dipilih
   get isAnySeatSelected(): boolean {
      return this.getSelectedSeats().length > 0;
   }

   // Fungsi untuk mendapatkan label baris (A, B, C...)
   getRowLabel(index: number): string {
      return String.fromCharCode(65 + index);
   }

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

      // Inisialisasi data kursi untuk setiap blok
      this.seatingBlocks.forEach(block => {
         block.seatsData = this.initializeSeats(block.rows, block.seatsPerRow, block.name);
      });

      // Simulasikan beberapa kursi yang sudah di-booked (contoh)
      this.seatingBlocks[0].seatsData[0][0].status = 'booked'; // LF-A, R1, S1
      this.seatingBlocks[1].seatsData[1][7].status = 'booked'; // VIP, R2, S8
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

      this.showSelectionSeats = true;
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
      let qrData = '';
      let totalBookingQty = 0;

      // KASUS 1: Pengguna datang dari Pemilihan Kursi (Prioritas)
      if (this.selectedSeats && this.selectedSeats.length > 0) {
         totalBookingQty = this.selectedSeats.length;

         // 1. Tentukan kategori tiket (Asumsi: Menggunakan kategori pertama untuk harga)
         const ticketCategory = this.event.tickets[0];
         if (!ticketCategory) return;

         // 2. Buat Booking Baru di Data Service
         const result = this.dataSrv.buyTicket(this.eventId, ticketCategory.id, totalBookingQty, this.currentUserId);

         if (result.success && result.booking) {
            this.currentBooking = result.booking;
            this.currentBooking.discountApplied = this.appliedDiscount;
            // ASUMSI: totalCartPrice sudah dihitung di checkoutWithSeats()
            this.currentBooking.totalPrice = this.totalCartPrice;

            // 3. QR Data Khusus Kursi: Masukkan ID Kursi yang dipilih
            // Format: [EventID]|[Section/Type]|SEATS:[ID1,ID2,...]|[EventDate]
            const seatIdsString = this.selectedSeats.join(',');
            qrData = `${this.event.id}|SEATS|SEATS:${seatIdsString}|${this.event.date}`;
         } else {
            // Gagal membuat booking
            this.message = 'Error creating seat booking.';
            return;
         }

         // Kosongkan cart untuk menghindari duplikasi proses
         this.cart = [];

      }
      // KASUS 2: Pengguna datang dari Cart Lama
      else if (this.cart.length > 0) {

         // Logic original untuk memproses cart item
         for (const cartItem of this.cart) {
            const result = this.dataSrv.buyTicket(this.eventId, cartItem.ticket.id, cartItem.qty, this.currentUserId);
            if (result.success && result.booking) {
               result.booking.discountApplied = this.appliedDiscount;
               result.booking.totalPrice = this.ticketPriceAfterDiscount(cartItem.ticket) * cartItem.qty;
               // Gunakan booking pertama untuk QR display
               if (!this.currentBooking) {
                  this.currentBooking = result.booking;
               }
            }
         }

         // Generate QR untuk item pertama di cart (Logik original)
         const firstCartItem = this.cart[0];
         qrData = `${this.event.id}|${firstCartItem.ticket.section || 'GENERAL'}|${this.event.date}`;
      }
      // KASUS 3: Tidak ada item untuk diproses
      else {
         return;
      }

      // --- REVISI END ---

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
      this.showSelectionSeats = false;
      this.showQRCodeDisplay = true;
      // Setelah pembelian berhasil, tampilkan tombol untuk melihat booking
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