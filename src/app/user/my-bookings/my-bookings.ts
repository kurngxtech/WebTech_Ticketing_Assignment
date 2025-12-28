import { Component, OnInit, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
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
  paymentOrderId?: string; // Track order ID for status sync
  expiresAt?: string; // 24-hour payment expiration
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
  bookings: BookingDisplay[] = [];
  filteredBookings: BookingDisplay[] = [];
  filterStatus: 'all' | 'confirmed' | 'pending' | 'cancelled' | 'waitlist' = 'all';
  isLoading = true;
  currentUserId: string | null = null;
  selectedBookingId: string | null = null;
  selectedBooking: Booking | null = null;
  selectedEvent: EventItem | null = null;
  selectedQrDataUrl: string = '';
  waitlistEntries: WaitlistEntry[] = [];
  isSortMenuOpen = false;
  bookingQrDataUrls: Map<string, string> = new Map();
  selectedTicketType: string = '';
  canCancelSelectedBooking = false;

  // Payment status sync
  paymentStatusMessage: string = '';
  isCheckingPayment: boolean = false;

  // Pagination for bookings
  displayLimit = 6;
  showAllBookings = false;

  // Store full booking objects for local lookup
  private allBookings: Booking[] = [];
  // Cache events for waitlist display
  private eventCache: Map<string, EventItem> = new Map();

  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private route = inject(ActivatedRoute);

  constructor(
    public dataEventService: DataEventService,
    private authService: AuthService,
    private pdfGeneratorService: PdfGeneratorService
  ) {}

  ngOnInit() {
    // Check for payment return URL params
    this.route.queryParams.subscribe((params) => {
      if (params['payment']) {
        this.handlePaymentReturn(params['payment']);
      }
    });

    this.authService.authState$.subscribe((state) => {
      if (state.isAuthenticated && state.currentUser) {
        this.currentUserId = state.currentUser.id || 'user_' + Date.now();
        this.loadBookings();
      } else {
        this.isLoading = false;
      }
    });
  }

  // Handle return from Midtrans payment
  private handlePaymentReturn(status: string) {
    this.isCheckingPayment = true;

    if (status === 'success') {
      this.paymentStatusMessage = 'Payment successful! Updating your booking...';
      // Force refresh after a short delay to allow webhook to process
      setTimeout(() => {
        this.syncAllPendingPayments();
      }, 2000);
    } else if (status === 'pending') {
      this.paymentStatusMessage = 'Payment is pending. Please complete the payment.';
    } else if (status === 'error') {
      this.paymentStatusMessage = 'Payment failed. Please try again.';
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      this.paymentStatusMessage = '';
      this.isCheckingPayment = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // Sync all pending payments with Midtrans status
  syncAllPendingPayments() {
    const pendingBookings = this.allBookings.filter(
      (b) => b.status === 'pending' && b.paymentOrderId
    );

    console.log('Syncing pending bookings:', pendingBookings.length, pendingBookings);

    if (pendingBookings.length === 0) {
      this.isCheckingPayment = false;
      return;
    }

    this.isCheckingPayment = true;
    this.paymentStatusMessage = 'Verifying payments...';
    let completed = 0;
    let hasUpdates = false;

    // Check each pending booking's payment status
    pendingBookings.forEach((booking) => {
      if (booking.paymentOrderId) {
        console.log('Checking order:', booking.paymentOrderId);
        this.dataEventService.checkPaymentStatusAsync(booking.paymentOrderId).subscribe({
          next: (response) => {
            console.log('Check result for', booking.id, response);
            completed++;

            // Check if status changed to success locally
            if (
              response.success &&
              response.status &&
              (response.status.transaction_status === 'capture' ||
                response.status.transaction_status === 'settlement')
            ) {
              hasUpdates = true;

              // IMMEDIATE LOCAL UPDATE
              console.log('Payment confirmed! Updating local state for', booking.id);
              booking.status = 'confirmed';
              booking.paymentStatus = 'completed';

              // Find mapped booking and update it too (for template)
              const mappedBooking = this.bookings.find((b) => b.id === booking.id);
              if (mappedBooking) {
                mappedBooking.status = 'confirmed';
              }

              // Generate QR immediately - booking always has qrCode from creation
              const qrData = booking.qrCode;
              if (qrData) {
                QRCode.toDataURL(qrData, { width: 200 })
                  .then((url: string) => {
                    this.bookingQrDataUrls.set(booking.id, url);
                    // Force update the filtered bookings to trigger re-render
                    this.applyFilter();
                    this.zone.run(() => this.cdr.detectChanges());
                  })
                  .catch((err: any) => console.error('QR Gen Error', err));
              }

              this.paymentStatusMessage = 'Payment confirmed! Loading ticket...';
            }

            if (completed >= pendingBookings.length) {
              if (hasUpdates) {
                // QR already generated locally, just update UI
                this.paymentStatusMessage = 'Ticket confirmed! QR code is ready.';
                this.applyFilter();
                this.zone.run(() => this.cdr.detectChanges());

                // Then reload in background for full data sync
                setTimeout(() => {
                  this.paymentStatusMessage = '';
                  this.isCheckingPayment = false;
                  this.loadBookings(false);
                }, 2000);
              } else {
                this.paymentStatusMessage = '';
                this.isCheckingPayment = false;
              }
            }
          },
          error: (err) => {
            console.error('Check error', err);
            completed++;
            if (completed >= pendingBookings.length) {
              this.paymentStatusMessage = '';
              this.isCheckingPayment = false;
              if (hasUpdates) this.loadBookings(false);
            }
          },
        });
      }
    });
  }

  loadBookings(autoCheck: boolean = true) {
    if (!this.currentUserId) return;

    this.dataEventService.getBookingsByUserAsync(this.currentUserId).subscribe({
      next: (userBookings: Booking[]) => {
        this.allBookings = userBookings;

        this.bookings = userBookings.map((booking: Booking) => ({
          id: booking.id,
          eventTitle: booking.eventTitle || 'Unknown Event',
          eventDate: booking.eventDate || '',
          ticketType: booking.ticketType || 'Standard',
          quantity: booking.quantity,
          totalPrice: booking.totalPrice,
          bookingDate: booking.bookingDate,
          status: booking.status as 'confirmed' | 'pending' | 'cancelled',
          expiresAt: (booking as any).expiresAt,
        }));

        userBookings.forEach((booking: Booking) => {
          // Only generate QR for confirmed bookings
          if (booking.qrCode && booking.status === 'confirmed') {
            QRCode.toDataURL(booking.qrCode, { width: 200 })
              .then((url: string) => {
                this.bookingQrDataUrls.set(booking.id, url);
                this.zone.run(() => this.cdr.detectChanges());
              })
              .catch(() => {});
          }
        });

        this.isLoading = false;
        this.applyFilter();
        this.zone.run(() => this.cdr.detectChanges());

        // auto-check pending payments status
        if (autoCheck) {
          this.syncAllPendingPayments();
        }
      },
      error: (err: any) => {
        console.error('Failed to load bookings:', err);
        this.isLoading = false;
        this.bookings = [];
        this.applyFilter();
        this.zone.run(() => this.cdr.detectChanges());
      },
    });

    this.dataEventService.getWaitlistForUserAsync(this.currentUserId).subscribe({
      next: (entries: WaitlistEntry[]) => {
        this.waitlistEntries = entries || [];
        // Pre-load event info for waitlist entries
        entries.forEach((entry: WaitlistEntry) => {
          const eventId = entry.eventId?.toString();
          if (eventId && !this.eventCache.has(eventId)) {
            this.dataEventService.getEventByIdAsync(eventId).subscribe({
              next: (event: EventItem | null) => {
                if (event) {
                  this.eventCache.set(eventId, event);
                  this.zone.run(() => this.cdr.detectChanges());
                }
              },
              error: () => {},
            });
          }
        });
      },
      error: () => {
        this.waitlistEntries = [];
      },
    });
  }

  // Helper method to get event title for waitlist entries (used in template)
  getEventTitle(eventId: number | string): string {
    const event = this.eventCache.get(eventId?.toString());
    return event?.title || 'Loading...';
  }

  selectBooking(bookingId: string) {
    if (!this.currentUserId) return;
    if (!bookingId) {
      this.selectedBookingId = null;
      this.selectedBooking = null;
      this.selectedEvent = null;
      this.selectedQrDataUrl = '';
      this.selectedTicketType = '';
      this.canCancelSelectedBooking = false;
      return;
    }

    const bookingObj = this.allBookings.find((b: Booking) => b.id === bookingId);
    if (!bookingObj) return;

    this.selectedBookingId = bookingId;
    this.selectedBooking = bookingObj;
    this.selectedTicketType = bookingObj.ticketType || '';

    // Load event asynchronously
    const eventId = bookingObj.eventId?.toString();
    if (eventId) {
      if (this.eventCache.has(eventId)) {
        this.selectedEvent = this.eventCache.get(eventId) || null;
        this.updateCancellationStatus();
        this.updateTicketType();
      } else {
        this.dataEventService.getEventByIdAsync(eventId).subscribe({
          next: (event: EventItem | null) => {
            this.selectedEvent = event;
            if (event) {
              this.eventCache.set(eventId, event);
            }
            this.updateCancellationStatus();
            this.updateTicketType();
            this.zone.run(() => this.cdr.detectChanges());
          },
          error: () => {
            this.selectedEvent = null;
          },
        });
      }
    }

    if (bookingObj.qrCode) {
      QRCode.toDataURL(bookingObj.qrCode, { width: 300 })
        .then((url: string) => {
          this.selectedQrDataUrl = url;
          this.zone.run(() => this.cdr.detectChanges());
        })
        .catch(() => (this.selectedQrDataUrl = ''));
    } else {
      this.selectedQrDataUrl = '';
    }
  }

  private updateCancellationStatus() {
    if (this.selectedEvent && this.selectedBooking) {
      const eventDate = new Date(this.selectedEvent.date).getTime();
      const daysUntil = (eventDate - Date.now()) / (1000 * 60 * 60 * 24);
      this.canCancelSelectedBooking = daysUntil >= 7 && this.selectedBooking.status === 'confirmed';
    } else {
      this.canCancelSelectedBooking = false;
    }
  }

  private updateTicketType() {
    if (this.selectedEvent && this.selectedBooking) {
      const ticket = this.selectedEvent.tickets.find(
        (t) => t.id === this.selectedBooking!.ticketCategoryId
      );
      if (ticket) {
        this.selectedTicketType = ticket.type;
      }
    }
  }

  applyFilter() {
    switch (this.filterStatus) {
      case 'confirmed':
        this.filteredBookings = this.bookings.filter((b) => b.status === 'confirmed');
        break;
      case 'pending':
        this.filteredBookings = this.bookings.filter((b) => b.status === 'pending');
        break;
      case 'cancelled':
        this.filteredBookings = this.bookings.filter((b) => b.status === 'cancelled');
        break;
      case 'waitlist':
        this.filteredBookings = [];
        break;
      default:
        this.filteredBookings = this.bookings;
    }
    // Reset pagination when filter changes
    this.showAllBookings = false;
  }

  // Get paginated bookings for display
  get displayedBookings(): BookingDisplay[] {
    if (this.showAllBookings) {
      return this.filteredBookings;
    }
    return this.filteredBookings.slice(0, this.displayLimit);
  }

  // Check if there are more bookings to show
  get hasMoreBookings(): boolean {
    return this.filteredBookings.length > this.displayLimit && !this.showAllBookings;
  }

  // Toggle view more/less
  toggleViewMore(): void {
    this.showAllBookings = !this.showAllBookings;
  }

  // Continue payment for pending booking
  continuePayment(bookingId: string): void {
    const booking = this.allBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Get snap token and open payment popup
    this.dataEventService.createPaymentAsync(bookingId).subscribe({
      next: (response) => {
        if (response.success && response.payment) {
          const { snapToken, snapRedirectUrl, orderId } = response.payment;

          // Store orderId for status check later
          if (orderId) {
            booking.paymentOrderId = orderId;
          }

          // Try to use Snap popup, fallback to redirect
          if ((window as any).snap) {
            (window as any).snap.pay(snapToken, {
              onSuccess: () => {
                this.paymentStatusMessage = 'Payment successful! Updating booking...';
                // Wait for webhook to process, then check status and refresh
                setTimeout(() => {
                  if (orderId) {
                    this.dataEventService.checkPaymentStatusAsync(orderId).subscribe({
                      next: () => {
                        this.loadBookings();
                        this.paymentStatusMessage = '';
                      },
                      error: () => {
                        this.loadBookings();
                        this.paymentStatusMessage = '';
                      },
                    });
                  } else {
                    this.loadBookings();
                    this.paymentStatusMessage = '';
                  }
                }, 2000);
              },
              onPending: () => {
                this.paymentStatusMessage = 'Payment pending. Please complete the payment.';
                setTimeout(() => {
                  this.loadBookings();
                  this.paymentStatusMessage = '';
                }, 2000);
              },
              onError: () => {
                this.paymentStatusMessage = 'Payment failed. Please try again.';
                setTimeout(() => {
                  this.paymentStatusMessage = '';
                }, 3000);
              },
              onClose: () => {
                // User closed popup - refresh to get current status
                setTimeout(() => {
                  this.loadBookings();
                }, 1000);
              },
            });
          } else {
            window.location.href = snapRedirectUrl;
          }
        }
      },
      error: (err) => {
        console.error('Failed to create payment:', err);
      },
    });
  }

  setFilter(status: 'all' | 'confirmed' | 'pending' | 'cancelled' | 'waitlist') {
    this.filterStatus = status;
    this.applyFilter();
    this.isSortMenuOpen = false;
  }

  toggleSortMenu() {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  closeSortMenu() {
    this.isSortMenuOpen = false;
  }

  getTotalBookings(): number {
    return this.bookings.length;
  }

  getConfirmedCount(): number {
    return this.bookings.filter((b) => b.status === 'confirmed').length;
  }

  getPendingCount(): number {
    return this.bookings.filter((b) => b.status === 'pending').length;
  }

  getCancelledCount(): number {
    return this.bookings.filter((b) => b.status === 'cancelled').length;
  }

  getWaitlistCount(): number {
    return this.waitlistEntries.length;
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
    const bookingObj = this.allBookings.find((b: Booking) => b.id === bookingId);
    if (!bookingObj) {
      console.error('Booking not found');
      return;
    }

    const eventId = bookingObj.eventId?.toString();
    if (!eventId) {
      console.error('Event ID not found');
      return;
    }

    // Use cached event or fetch it
    const cachedEvent = this.eventCache.get(eventId);
    if (cachedEvent) {
      this.generatePDF(bookingObj, cachedEvent);
    } else {
      this.dataEventService.getEventByIdAsync(eventId).subscribe({
        next: (event: EventItem | null) => {
          if (event) {
            this.eventCache.set(eventId, event);
            this.generatePDF(bookingObj, event);
          } else {
            console.error('Event not found');
          }
        },
        error: (err: any) => {
          console.error('Failed to load event:', err);
        },
      });
    }
  }

  private generatePDF(booking: Booking, event: EventItem) {
    const ticketCategory = event.tickets.find((t) => t.id === booking.ticketCategoryId);
    if (!ticketCategory) {
      console.error('Ticket category not found');
      return;
    }

    const userName = this.authService.getCurrentUser()?.fullName || 'Guest';
    const qrCodeData =
      booking.qrCode || `${booking.id}|${ticketCategory.section || 'GENERAL'}|${event.date}`;

    this.pdfGeneratorService
      .generateTicketPDF(
        booking.id,
        qrCodeData,
        event.title,
        ticketCategory.type,
        booking.quantity,
        booking.totalPrice,
        event.date,
        userName
      )
      .catch((error: any) => {
        console.error('Error generating PDF:', error);
      });
  }

  cancelBooking(bookingId: string) {
    this.dataEventService.cancelBookingAsync(bookingId).subscribe({
      next: (res: { success: boolean; message: string }) => {
        if (res.success) {
          this.loadBookings();
          if (this.selectedBookingId === bookingId) {
            this.selectedBookingId = null;
            this.selectedBooking = null;
            this.selectedEvent = null;
            this.selectedQrDataUrl = '';
          }
        } else {
          console.warn('Cancel failed:', res.message);
        }
      },
      error: (err: any) => {
        console.error('Cancel failed:', err);
      },
    });
  }

  // 24-hour countdown helpers
  getCountdownText(expiresAt?: string): string {
    if (!expiresAt) return 'No expiration set';

    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  }

  isExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= new Date().getTime();
  }

  isExpiringSoon(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    // Less than 1 hour remaining
    return diff > 0 && diff < 60 * 60 * 1000;
  }

  // Waitlist cancel with confirmation
  waitlistCancelConfirmId: string | null = null;
  bookingRemoveConfirmId: string | null = null;

  showWaitlistCancelConfirm(entryId: string): void {
    this.waitlistCancelConfirmId = entryId;
  }

  hideWaitlistCancelConfirm(): void {
    this.waitlistCancelConfirmId = null;
  }

  confirmCancelWaitlist(): void {
    if (!this.waitlistCancelConfirmId) return;

    this.dataEventService.leaveWaitlistAsync(this.waitlistCancelConfirmId).subscribe({
      next: (res: { success: boolean; message?: string }) => {
        if (res.success) {
          this.waitlistEntries = this.waitlistEntries.filter(
            (e) => e.id !== this.waitlistCancelConfirmId
          );
          this.zone.run(() => this.cdr.detectChanges());
        }
        this.waitlistCancelConfirmId = null;
      },
      error: (err: any) => {
        console.error('Failed to cancel waitlist:', err);
        this.waitlistCancelConfirmId = null;
      },
    });
  }

  // Remove booking (for cancelled/pending) to free up seats
  showRemoveBookingConfirm(bookingId: string): void {
    this.bookingRemoveConfirmId = bookingId;
  }

  hideRemoveBookingConfirm(): void {
    this.bookingRemoveConfirmId = null;
  }

  confirmRemoveBooking(): void {
    if (!this.bookingRemoveConfirmId) return;

    this.dataEventService.removeBookingAsync(this.bookingRemoveConfirmId).subscribe({
      next: (res: { success: boolean; message?: string }) => {
        if (res.success) {
          this.loadBookings(false);
        }
        this.bookingRemoveConfirmId = null;
      },
      error: (err: any) => {
        console.error('Failed to remove booking:', err);
        this.bookingRemoveConfirmId = null;
      },
    });
  }
}
