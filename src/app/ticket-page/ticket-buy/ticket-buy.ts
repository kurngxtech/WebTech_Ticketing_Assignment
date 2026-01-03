// src/app/ticket-page/ticket-buy/ticket-buy.ts
import { Component, Injectable, OnInit, ChangeDetectorRef, inject, NgZone } from '@angular/core';

// Declare Midtrans Snap window object
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: any) => void;
          onPending: (result: any) => void;
          onError: (result: any) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { ToastService } from '../../services/toast.service';
import { EventItem, TicketCategory, Booking } from '../../data-event-service/data-event';
import { FormsModule } from '@angular/forms';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';
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
  category: string; // 'VIP', 'PREMIUM', 'GENERAL', or 'PROMO'
}

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-buy.html',
  styleUrls: ['./ticket-buy.css'],
})
export class TicketBuy implements OnInit {
  isLoading = false;

  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  // Definisikan semua blok kursi dengan dimensi baru
  seatingBlocks: SeatingBlock[] = [
    // LOWER FOYER (Generals)
    { name: 'LF-A', rows: 12, seatsPerRow: 15, seatsData: [], category: 'GENERAL' },
    // VIP Section
    { name: 'VIP', rows: 4, seatsPerRow: 15, seatsData: [], category: 'VIP' },
    // LOWER FOYER (More Generals)
    { name: 'LF-B', rows: 8, seatsPerRow: 15, seatsData: [], category: 'GENERAL' },
    { name: 'LF-C', rows: 12, seatsPerRow: 15, seatsData: [], category: 'GENERAL' },
    // BALCONY (Premium?) Let's assume Balcony is Premium or General, based on typical layout
    // For this app, let's map Balcony to PREMIUM
    { name: 'B-A', rows: 5, seatsPerRow: 11, seatsData: [], category: 'PREMIUM' },
    { name: 'B-B', rows: 5, seatsPerRow: 23, seatsData: [], category: 'PREMIUM' },
    { name: 'B-C', rows: 5, seatsPerRow: 11, seatsData: [], category: 'PREMIUM' },
  ];

  event?: EventItem;
  eventId!: string;
  couponCode = '';
  appliedDiscount = 0;
  message = '';
  quantities: { [ticketId: string]: number } = {};
  currentUserId = '';
  isAuthenticated = false;
  showSelectionSeats = false;

  // Booking state
  bookingInProgress = false;
  paymentInProgress = false; // Prevents double payment submissions
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
  selectedTicketCategory: TicketCategory | null = null; // The ticket category user is buying
  paymentMethods = [
    { id: 'credit-card', name: 'Credit Card' },
    { id: 'debit-card', name: 'Debit Card' },
    { id: 'e-wallet', name: 'E-Wallet' },
    { id: 'bank-transfer', name: 'Bank Transfer' },
  ];

  // Max seats allowed based on cart quantity
  get maxSeatsAllowed(): number {
    return this.cart.reduce((total, item) => total + item.qty, 0) || 1;
  }

  calculatePriceFromSeats(seats: Array<string>): number {
    let totalPrice = 0;

    seats.forEach((seatId) => {
      // Find the block for this seat to get its category
      const block = this.seatingBlocks.find((b) =>
        b.seatsData.some((row) => row.some((s) => s.id === seatId))
      );
      if (!block) return;

      // Find the ticket definition for this category
      const ticket = this.event?.tickets.find(
        (t) => (t.section || 'GENERAL').toUpperCase() === block.category
      );
      if (ticket) {
        totalPrice += this.ticketPriceAfterDiscount(ticket);
      } else {
        // Fallback if ticket not found (shouldn't happen if data is consistent)
        // Try to find any ticket
        const fallbackTicket = this.event?.tickets[0];
        totalPrice += fallbackTicket ? this.ticketPriceAfterDiscount(fallbackTicket) : 50;
      }
    });

    return totalPrice;
  }

  startPaymentProcess(): void {
    // 1. Dapatkan daftar kursi yang dipilih secara internal
    const selectedSeatsArray = this.getSelectedSeats().map((seat) => seat.id);

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
          status: 'available',
        });
      }
      seats.push(row);
    }
    return seats;
  }

  // Fungsi Toggle dengan seat limit & category restriction
  toggleSeat(blockName: string, rowIndex: number, seatIndex: number): void {
    const block = this.seatingBlocks.find((b) => b.name === blockName);
    if (!block) return;

    const seat = block.seatsData[rowIndex][seatIndex];

    if (seat.status === 'booked') {
      return;
    }

    if (seat.status === 'available') {
      // 1. Check strict max limit
      if (this.getSelectedSeats().length >= this.maxSeatsAllowed) {
        this.toast.warning(`Maximum ${this.maxSeatsAllowed} seat(s) allowed`);
        return;
      }

      // 2. Check category restriction
      // Find which cart item corresponds to this seat's category
      // We need to count how many seats of this category are ALREADY selected
      const currentSelectedOfThisCategory = this.getSelectedSeats().filter((s) => {
        const sBlock = this.seatingBlocks.find((b) =>
          b.seatsData.some((row) => row.some((cell) => cell.id === s.id))
        );
        return sBlock?.category === block.category;
      }).length;

      // Find cart quantity for this category
      // Map ticket.section (from DB/Mock) to block.category
      // Assuming ticket.section values roughly match 'VIP', 'PREMIUM', 'GENERAL'
      const cartItemForCategory = this.cart.find(
        (item) => (item.ticket.section || 'GENERAL').toUpperCase() === block.category
      );

      if (!cartItemForCategory) {
        this.toast.warning(`You haven't purchased any ${block.category} tickets.`);
        return;
      }

      if (currentSelectedOfThisCategory >= cartItemForCategory.qty) {
        this.toast.warning(`You only have ${cartItemForCategory.qty} ${block.category} ticket(s).`);
        return;
      }

      seat.status = 'selected';
    } else {
      seat.status = 'available';
    }

    this.zone.run(() => this.cdr.detectChanges());
  }

  // Close seat map modal
  closeSeatMap(): void {
    // Reset selected seats when closing
    this.seatingBlocks.forEach((block) => {
      block.seatsData.forEach((row) => {
        row.forEach((seat) => {
          if (seat.status === 'selected') {
            seat.status = 'available';
          }
        });
      });
    });
    this.showSelectionSeats = false;
  }

  // Getter: Mendapatkan array semua kursi yang dipilih
  getSelectedSeats(): Seat[] {
    return this.seatingBlocks.flatMap((block) =>
      block.seatsData.flat().filter((seat) => seat.status === 'selected')
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
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.isAuthenticated = true;
    } else {
      this.isAuthenticated = false;
    }

    this.route.paramMap.subscribe((params) => {
      const idStr = params.get('id');
      if (!idStr) {
        this.router.navigate(['/']);
        return;
      }
      this.eventId = idStr;
      this.isLoading = true;

      // Load event from API
      this.dataSrv.getEventByIdAsync(this.eventId).subscribe({
        next: (event) => {
          if (!event) {
            this.router.navigate(['/']);
            return;
          }
          this.event = event;
          // initialize quantities for each ticket category
          for (const t of this.event.tickets) {
            this.quantities[t.id] = 1;
          }
          this.isLoading = false;
          this.zone.run(() => this.cdr.detectChanges());
        },
        error: (err) => {
          console.error('Failed to load event:', err);
          this.router.navigate(['/']);
          this.zone.run(() => this.cdr.detectChanges());
        },
      });
    });

    // Initialize seats for each block (all available initially)
    this.seatingBlocks.forEach((block) => {
      block.seatsData = this.initializeSeats(block.rows, block.seatsPerRow, block.name);
    });
  }

  applyCoupon(): void {
    if (!this.couponCode || !this.event) {
      this.toast.warning('Please enter a coupon code');
      return;
    }

    this.dataSrv.validatePromoCodeAsync(this.eventId, this.couponCode).subscribe({
      next: (result) => {
        if (result.valid && result.discountPercentage) {
          this.appliedDiscount = result.discountPercentage;
          this.toast.success(`Coupon applied: ${result.discountPercentage}% discount`);
          this.updateCartTotal();
        } else {
          this.appliedDiscount = 0;
          this.toast.error(result.message || 'Invalid coupon code');
        }
      },
      error: () => {
        this.toast.error('Failed to validate coupon');
      },
    });
  }

  incrementQuantity(ticketId: string, maxRemaining: number): void {
    const currentQty = this.quantities[ticketId] || 1;
    // Check what's already in cart for this ticket
    const inCartQty = this.cart.find((item) => item.ticket.id === ticketId)?.qty || 0;
    // Can only add up to remaining minus what's already in cart
    const effectiveMax = maxRemaining - inCartQty;

    if (currentQty < effectiveMax) {
      this.quantities[ticketId] = currentQty + 1;
    } else {
      this.toast.warning(`Only ${effectiveMax} more ticket(s) available`);
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

  /**
   * Validates and clamps the quantity input to valid range
   * Called when user manually types a value in the quantity input
   */
  validateQuantity(ticketId: string, ticket: TicketCategory): void {
    const remaining = this.getRemaining(ticket);
    const inCartQty = this.cart.find((item) => item.ticket.id === ticketId)?.qty || 0;
    const maxAllowed = remaining - inCartQty;

    let currentQty = this.quantities[ticketId];

    // Ensure it's a valid number
    if (isNaN(currentQty) || currentQty < 1) {
      currentQty = 1;
    }

    // Clamp to max allowed
    if (currentQty > maxAllowed) {
      currentQty = Math.max(1, maxAllowed);
      if (maxAllowed <= 0) {
        this.toast.warning(`All available ${ticket.type} tickets are in your cart`);
      } else {
        this.toast.warning(`Only ${maxAllowed} more ${ticket.type} ticket(s) available`);
      }
    }

    this.quantities[ticketId] = currentQty;
  }

  ticketPriceAfterDiscount(t: TicketCategory): number {
    if (!t) return 0;
    const discount = Math.max(0, Math.min(100, this.appliedDiscount || 0));
    return Math.round(t.price * (1 - discount / 100));
  }

  purchase(ticket: TicketCategory, qty = 1): void {
    // Check if user is authenticated
    if (!this.isAuthenticated) {
      this.toast.warning('Please login to purchase tickets');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    if (this.getRemaining(ticket) < qty) {
      this.toast.error('Not enough tickets available');
      return;
    }

    this.isLoading = true;
    this.dataSrv
      .createBookingAsync({
        eventId: this.eventId,
        ticketCategoryId: ticket.id,
        quantity: qty,
        promoCode: this.couponCode || undefined,
      })
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.success && result.booking) {
            this.currentBooking = result.booking;
            this.currentBooking.discountApplied = this.appliedDiscount;
            this.currentBooking.totalPrice = this.ticketPriceAfterDiscount(ticket) * qty;

            this.showPaymentModal = true;
            this.bookingInProgress = true;

            // Refresh event data
            this.dataSrv.getEventByIdAsync(this.eventId).subscribe((evt) => {
              if (evt) this.event = evt;
            });
          } else {
            this.toast.error(result.message || 'Purchase failed');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.toast.error('Purchase failed');
          console.error(err);
        },
      });
  }

  addToCart(ticket: TicketCategory): void {
    const qty = this.quantities[ticket.id] || 1;
    const remaining = this.getRemaining(ticket);

    // Check what's already in cart for this ticket
    const inCartQty = this.cart.find((item) => item.ticket.id === ticket.id)?.qty || 0;
    const totalRequestedQty = inCartQty + qty;

    // Validate against remaining tickets
    if (totalRequestedQty > remaining) {
      const canAddMore = remaining - inCartQty;
      if (canAddMore <= 0) {
        this.toast.error(`All available ${ticket.type} tickets are already in your cart`);
      } else {
        this.toast.error(`Only ${canAddMore} more ${ticket.type} ticket(s) available`);
      }
      return;
    }

    // Check if ticket already in cart
    const cartItem = this.cart.find((item) => item.ticket.id === ticket.id);
    if (cartItem) {
      cartItem.qty += qty;
    } else {
      this.cart.push({ ticket, qty });
    }

    // Reset quantity input
    this.quantities[ticket.id] = 1;
    this.updateCartTotal();
    this.toast.success(`Added ${qty} ${ticket.type} ticket(s) to cart`);
  }

  removeFromCart(ticketId: string): void {
    this.cart = this.cart.filter((item) => item.ticket.id !== ticketId);
    this.updateCartTotal();
  }

  updateCartTotal(): void {
    this.totalCartPrice = this.cart.reduce((total, item) => {
      const price = this.ticketPriceAfterDiscount(item.ticket);
      return total + price * item.qty;
    }, 0);
  }

  checkoutCart(): void {
    if (this.cart.length === 0) {
      this.message = 'Your cart is empty';
      return;
    }

    // Load booked seats from API before showing seat map
    this.isLoading = true;
    this.message = 'Loading seat availability...';

    this.dataSrv.getBookedSeatsAsync(this.eventId).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.message = '';

        // Reset all seats to available first
        this.seatingBlocks.forEach((block) => {
          block.seatsData.forEach((row) => {
            row.forEach((seat) => {
              seat.status = 'available';
            });
          });
        });

        // Mark booked seats from API
        if (result.success && result.bookedSeats) {
          result.bookedSeats.forEach((seatId: string) => {
            // Find the seat and mark as booked
            for (const block of this.seatingBlocks) {
              for (const row of block.seatsData) {
                const seat = row.find((s) => s.id === seatId);
                if (seat) {
                  seat.status = 'booked';
                  break;
                }
              }
            }
          });
        }

        this.showSelectionSeats = true;
        this.zone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load booked seats:', err);
        // Still show seat map, all seats will be available
        this.showSelectionSeats = true;
        this.zone.run(() => this.cdr.detectChanges());
      },
    });
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
    // Prevent double submission
    if (this.paymentInProgress) {
      this.toast.warning('Payment already in progress...');
      return;
    }

    // Create booking and then initiate Midtrans payment
    if (!this.event || !this.isAuthenticated) {
      this.message = 'Please login to complete purchase';
      return;
    }

    let ticketCategoryId = '';
    let quantity = 0;
    let promoCode = this.couponCode || undefined;

    // Determine booking details based on source
    if (this.selectedSeats && this.selectedSeats.length > 0) {
      // From seat selection
      quantity = this.selectedSeats.length;
      ticketCategoryId = this.event.tickets[0]?.id || '';
    } else if (this.cart.length > 0) {
      // From cart - use first item
      const firstItem = this.cart[0];
      ticketCategoryId = firstItem.ticket.id;
      quantity = firstItem.qty;
    } else {
      this.message = 'No items to purchase';
      return;
    }

    // Lock payment to prevent double submission
    this.paymentInProgress = true;
    this.isLoading = true;
    this.message = 'Creating your booking...';

    // Step 1: Create booking via API
    this.dataSrv
      .createBookingAsync({
        eventId: this.eventId,
        ticketCategoryId,
        quantity,
        promoCode,
        selectedSeats: this.selectedSeats,
      })
      .subscribe({
        next: (result) => {
          if (result.success && result.booking) {
            const bookingId = result.booking.id || (result.booking as any)._id;

            // Store booking info
            this.currentBooking = {
              id: bookingId,
              eventId: this.event!.id,
              userId: this.currentUserId,
              ticketCategoryId,
              quantity,
              pricePerTicket: result.booking.pricePerTicket || 0,
              totalPrice: result.booking.totalPrice || this.totalCartPrice,
              discountApplied: result.booking.discountApplied || this.appliedDiscount,
              status: 'pending',
              bookingDate: new Date().toISOString(),
              qrCode: result.booking.qrCode,
            };

            this.qrCodeData = result.booking.qrCode || '';

            // Step 2: Create Midtrans payment
            this.message = 'Preparing payment...';
            this.initiatePayment(bookingId);
          } else {
            this.isLoading = false;
            this.paymentInProgress = false; // Reset lock
            this.message = result.message || 'Booking failed';
            this.toast.error(result.message || 'Failed to create booking');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.paymentInProgress = false; // Reset lock
          console.error('Booking error:', err);
          this.message = 'Failed to create booking. Please try again.';
          this.toast.error('Booking failed. Please try again.');
          this.zone.run(() => this.cdr.detectChanges());
        },
      });
  }

  paymentOrderId: string = '';

  /**
   * Initiate Midtrans payment with Snap popup
   */
  private initiatePayment(bookingId: string): void {
    this.dataSrv.createPaymentAsync(bookingId).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success && response.payment) {
          const { snapToken, orderId } = response.payment;
          this.paymentOrderId = orderId;

          // Close payment modal before opening Snap
          this.showPaymentModal = false;

          // Launch Midtrans Snap popup
          if (window.snap) {
            window.snap.pay(snapToken, {
              onSuccess: (result: any) => this.onPaymentSuccess(result),
              onPending: (result: any) => this.onPaymentPending(result),
              onError: (result: any) => this.onPaymentError(result),
              onClose: () => this.onPaymentClose(),
            });
          } else {
            // Fallback: redirect to Snap URL if popup not available
            window.location.href = response.payment.snapRedirectUrl;
          }
        } else {
          this.message = response.message || 'Failed to create payment';
          this.toast.error('Failed to create payment');
          this.paymentInProgress = false; // Reset lock
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.paymentInProgress = false; // Reset lock
        console.error('Payment error:', err);
        this.message = 'Failed to create payment';
        this.toast.error('Payment failed. Please try again.');
      },
    });
  }

  private onPaymentSuccess(result: any): void {
    console.log('Payment success:', result);
    this.toast.success('Payment successful!');

    // Sync status with backend (CRITICAL for localhost/webhook failure)
    if (this.paymentOrderId) {
      this.dataSrv.checkPaymentStatusAsync(this.paymentOrderId).subscribe({
        next: () => console.log('Payment status synced with backend'),
        error: (err) => console.error('Failed to sync payment status', err),
      });
    }

    // Generate QR code image
    if (this.qrCodeData) {
      QRCode.toDataURL(this.qrCodeData, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url: string) => {
          this.qrCodeDataUrl = url;
          this.zone.run(() => this.cdr.detectChanges());
        })
        .catch((err: Error) => console.error('QR error:', err));
    }

    // Show confirmation
    this.showPaymentModal = false;
    this.showSelectionSeats = false;
    this.showQRCodeDisplay = true;
    this.cart = [];
    this.paymentInProgress = false; // Reset lock
    this.message = '✓ Payment successful! Your ticket is confirmed.';
    this.zone.run(() => this.cdr.detectChanges());
  }

  private onPaymentPending(result: any): void {
    console.log('Payment pending:', result);
    this.toast.info('Payment pending. Please complete your payment.');
    this.message = 'Payment pending - please complete your payment';
    this.showPaymentModal = false;
    this.paymentInProgress = false; // Reset lock
    this.router.navigate(['/my-bookings'], { queryParams: { payment: 'pending' } });
  }

  private onPaymentError(result: any): void {
    console.error('Payment error:', result);
    this.toast.error('Payment failed. Please try again.');
    this.message = 'Payment failed';
    this.showPaymentModal = false;
    this.paymentInProgress = false; // Reset lock to allow retry
  }

  private onPaymentClose(): void {
    console.log('Payment popup closed');
    this.message = 'Payment cancelled';
    this.showPaymentModal = false;
    this.paymentInProgress = false; // Reset lock to allow retry
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

    const ticketCategory = this.event.tickets.find(
      (t) => t.id === this.currentBooking!.ticketCategoryId
    );
    if (!ticketCategory) return;

    const userName = this.authService.getCurrentUser()?.fullName || 'Guest';

    this.pdfGeneratorService
      .generateTicketPDF(
        this.currentBooking.id,
        this.qrCodeData,
        this.event.title,
        ticketCategory.type,
        this.currentBooking.quantity,
        this.currentBooking.totalPrice,
        this.event.date,
        userName
      )
      .catch((error) => {
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
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 0,
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

    this.isLoading = true;
    this.dataSrv.joinWaitlistAsync(this.eventId, ticket.id, 1).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.message = `✓ You've been added to the waitlist for ${ticket.type}`;
          this.toast.success(`Added to waitlist for ${ticket.type}`);
        } else {
          this.message = result.message;
          this.toast.error(result.message);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = 'Failed to join waitlist';
        this.toast.error('Failed to join waitlist');
      },
    });
  }
}
