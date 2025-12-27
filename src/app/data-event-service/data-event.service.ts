// src/app/data-event-service/data-event.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  EventItem,
  TicketCategory,
  Booking,
  WaitlistEntry,
  PromotionalCode,
  EventAnalytics,
} from './data-event';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataEventService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiUrl = environment.apiUrl;

  private data: EventItem[] = [];
  private subject = new BehaviorSubject<EventItem[]>([]);
  private searchQuery = new BehaviorSubject<string>('');

  public searchResults$: Observable<EventItem[]> = this.searchQuery.pipe(
    distinctUntilChanged(),
    map((q) => {
      const term = (q || '').trim().toLowerCase();
      if (!term) return [];
      return this.data.filter((e) => e.title.toLowerCase().includes(term));
    })
  );

  public searchQuery$ = this.searchQuery.asObservable();

  constructor() {
    this.initialize();
  }

  ngOnInit(): void {
    // noop for compatibility
  }

  private initialize() {
    this.loadEventsFromAPI();
  }

  // Clear cached data (call this when user changes or on logout)
  clearCache(): void {
    this.data = [];
    this.subject.next([]);
  }

  // Force refresh from API (call this when user logs in)
  refreshEvents(): void {
    this.loadEventsFromAPI();
  }

  private loadEventsFromAPI() {
    this.http
      .get<{ success: boolean; events: EventItem[] }>(`${this.apiUrl}/events`)
      .pipe(
        catchError((err) => {
          console.error('Failed to load events from API:', err);
          return of({ success: false, events: [] });
        })
      )
      .subscribe((response) => {
        if (response.success && response.events) {
          this.data = response.events;
          this.subject.next([...this.data]);
        }
      });
  }

  // ========== EVENT MANAGEMENT ==========

  getEvents$(): Observable<EventItem[]> {
    return this.subject.asObservable();
  }

  setSearchQuery(q: string) {
    this.searchQuery.next(q || '');
  }

  getEventsAsync(): Observable<EventItem[]> {
    return this.http.get<{ success: boolean; events: EventItem[] }>(`${this.apiUrl}/events`).pipe(
      map((response) => {
        if (response.success && response.events) {
          this.data = response.events;
          this.subject.next([...this.data]);
          return response.events;
        }
        return [];
      }),
      catchError((err) => {
        console.error('Error fetching events:', err);
        return of([]);
      })
    );
  }

  getEventByIdAsync(id: string): Observable<EventItem | null> {
    return this.http
      .get<{ success: boolean; event: EventItem }>(`${this.apiUrl}/events/${id}`)
      .pipe(
        map((response) => (response.success ? response.event : null)),
        catchError((err) => {
          console.error('Error fetching event:', err);
          return of(null);
        })
      );
  }

  getEventsByOrganizerAsync(organizerId: string): Observable<EventItem[]> {
    return this.http
      .get<{ success: boolean; events: EventItem[] }>(
        `${this.apiUrl}/events/organizer/${organizerId}`
      )
      .pipe(
        map((response) => (response.success ? response.events : [])),
        catchError((err) => {
          console.error('Error fetching organizer events:', err);
          return of([]);
        })
      );
  }

  createEventAsync(
    event: Partial<EventItem>
  ): Observable<{ success: boolean; event?: EventItem; message?: string }> {
    return this.http
      .post<{ success: boolean; event: EventItem; message?: string }>(
        `${this.apiUrl}/events`,
        event
      )
      .pipe(
        tap((response) => {
          if (response.success && response.event) {
            this.data.push(response.event);
            this.subject.next([...this.data]);
          }
        }),
        catchError((err) => {
          console.error('Error creating event:', err);
          return of({ success: false, message: err.error?.message || 'Failed to create event' });
        })
      );
  }

  updateEventAsync(
    id: string,
    updates: Partial<EventItem>
  ): Observable<{ success: boolean; event?: EventItem; message?: string }> {
    return this.http
      .put<{ success: boolean; event: EventItem; message?: string }>(
        `${this.apiUrl}/events/${id}`,
        updates
      )
      .pipe(
        tap((response) => {
          if (response.success && response.event) {
            const idx = this.data.findIndex((e) => e.id?.toString() === id);
            if (idx >= 0) {
              this.data[idx] = response.event;
              this.subject.next([...this.data]);
            }
          }
        }),
        catchError((err) => {
          console.error('Error updating event:', err);
          return of({ success: false, message: err.error?.message || 'Failed to update event' });
        })
      );
  }

  deleteEventAsync(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(`${this.apiUrl}/events/${id}`)
      .pipe(
        tap((response) => {
          if (response.success) {
            const idx = this.data.findIndex((e) => e.id?.toString() === id);
            if (idx >= 0) {
              this.data.splice(idx, 1);
              this.subject.next([...this.data]);
            }
          }
        }),
        catchError((err) => {
          console.error('Error deleting event:', err);
          return of({ success: false, message: err.error?.message || 'Failed to delete event' });
        })
      );
  }

  // ========== PROMO CODES ==========

  validatePromoCodeAsync(
    eventId: string,
    code: string
  ): Observable<{ valid: boolean; discountPercentage?: number; message: string }> {
    return this.http
      .post<{ success: boolean; valid: boolean; discountPercentage?: number; message: string }>(
        `${this.apiUrl}/events/validate-promo`,
        { eventId, code }
      )
      .pipe(
        map((response) => ({
          valid: response.valid || response.success,
          discountPercentage: response.discountPercentage,
          message: response.message,
        })),
        catchError((err) => of({ valid: false, message: 'Failed to validate code' }))
      );
  }

  // ========== BOOKING ==========

  createBookingAsync(data: {
    eventId: string;
    ticketCategoryId: string;
    quantity: number;
    promoCode?: string;
    selectedSeats?: string[];
  }): Observable<{ success: boolean; message: string; booking?: Booking; remaining?: number }> {
    return this.http
      .post<{ success: boolean; message: string; booking?: any; remaining?: number }>(
        `${this.apiUrl}/bookings`,
        data
      )
      .pipe(
        catchError((err) => {
          console.error('Error creating booking:', err);
          return of({ success: false, message: err.error?.message || 'Booking failed' });
        })
      );
  }

  // ========== MIDTRANS PAYMENT ==========

  /**
   * Create Midtrans payment and get Snap token
   */
  createPaymentAsync(bookingId: string): Observable<{
    success: boolean;
    message: string;
    payment?: {
      orderId: string;
      snapToken: string;
      snapRedirectUrl: string;
      grossAmount: number;
      clientKey: string;
    };
  }> {
    return this.http.post<any>(`${this.apiUrl}/payments/create`, { bookingId }).pipe(
      catchError((err) => {
        console.error('Error creating payment:', err);
        return of({
          success: false,
          message: err.error?.message || 'Failed to create payment',
        });
      })
    );
  }

  /**
   * Check payment status from Midtrans and update booking status
   * This calls the backend which queries Midtrans API directly and updates the booking
   */
  checkPaymentStatusAsync(orderId: string): Observable<{
    success: boolean;
    status?: {
      transaction_status: string;
      payment_type: string;
      gross_amount: string;
    };
  }> {
    // Use the /check endpoint which queries Midtrans directly and updates booking
    return this.http.get<any>(`${this.apiUrl}/payments/${orderId}/check`).pipe(
      catchError((err) => {
        console.error('Error checking payment status:', err);
        return of({ success: false });
      })
    );
  }

  /**
   * Get Midtrans client key for Snap initialization
   */
  getMidtransClientKeyAsync(): Observable<{ success: boolean; clientKey?: string }> {
    return this.http.get<any>(`${this.apiUrl}/payments/client-key`).pipe(
      catchError((err) => {
        console.error('Error getting client key:', err);
        return of({ success: false });
      })
    );
  }

  /**
   * Get booked seats for an event (for seat map display)
   */
  getBookedSeatsAsync(eventId: string): Observable<{ success: boolean; bookedSeats: string[] }> {
    return this.http.get<any>(`${this.apiUrl}/bookings/seats/${eventId}`).pipe(
      catchError((err) => {
        console.error('Error getting booked seats:', err);
        return of({ success: false, bookedSeats: [] });
      })
    );
  }

  getBookingsByUserAsync(userId: string): Observable<Booking[]> {
    return this.http
      .get<{ success: boolean; bookings: Booking[] }>(`${this.apiUrl}/bookings/user/${userId}`)
      .pipe(
        map((response) => (response.success ? response.bookings : [])),
        catchError((err) => {
          console.error('Error fetching user bookings:', err);
          return of([]);
        })
      );
  }

  cancelBookingAsync(
    bookingId: string,
    reason?: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.apiUrl}/bookings/${bookingId}/cancel`, {
        reason,
      })
      .pipe(
        catchError((err) =>
          of({ success: false, message: err.error?.message || 'Failed to cancel booking' })
        )
      );
  }

  // ========== WAITLIST ==========

  joinWaitlistAsync(
    eventId: string,
    ticketCategoryId: string,
    quantity: number
  ): Observable<{ success: boolean; message: string; entry?: WaitlistEntry }> {
    return this.http
      .post<{ success: boolean; message: string; entry?: WaitlistEntry }>(
        `${this.apiUrl}/waitlist`,
        { eventId, ticketCategoryId, quantity }
      )
      .pipe(
        catchError((err) =>
          of({ success: false, message: err.error?.message || 'Failed to join waitlist' })
        )
      );
  }

  getWaitlistForUserAsync(userId: string): Observable<WaitlistEntry[]> {
    return this.http
      .get<{ success: boolean; waitlist: WaitlistEntry[] }>(
        `${this.apiUrl}/waitlist/user/${userId}`
      )
      .pipe(
        map((response) => (response.success ? response.waitlist : [])),
        catchError((err) => of([]))
      );
  }

  // ========== ANALYTICS ==========

  getEventAnalyticsAsync(eventId: string): Observable<EventAnalytics | null> {
    return this.http
      .get<{ success: boolean; analytics: any }>(`${this.apiUrl}/analytics/event/${eventId}`)
      .pipe(
        map((response) => {
          if (response.success && response.analytics) {
            return {
              eventId: parseInt(eventId),
              totalRevenue: response.analytics.summary?.totalRevenue || 0,
              totalTicketsSold: response.analytics.summary?.totalTicketsSold || 0,
              totalSeatsOccupied: response.analytics.summary?.totalTicketsSold || 0,
              occupancyRate: response.analytics.summary?.occupancyRate || 0,
              byTicketType: response.analytics.byTicketType || {},
              bookingsByDate:
                response.analytics.bookingsByDate?.reduce((acc: any, d: any) => {
                  acc[d.date] = { count: d.count, revenue: d.revenue };
                  return acc;
                }, {}) || {},
            } as EventAnalytics;
          }
          return null;
        }),
        catchError((err) => of(null))
      );
  }

  getAuditoriumAnalyticsAsync(
    period?: string,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    let url = `${this.apiUrl}/analytics/auditorium`;
    const params: string[] = [];
    if (period) params.push(`period=${period}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length) url += '?' + params.join('&');

    return this.http.get<{ success: boolean; analytics: any }>(url).pipe(
      map((response) => (response.success ? response.analytics : null)),
      catchError((err) => of(null))
    );
  }

  // ========== UTILITY ==========

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 0,
    }).format(price);
  }
}
