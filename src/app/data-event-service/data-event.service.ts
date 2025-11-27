// src/app/data-event-service/data-event.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { EventItem, TicketCategory, Booking, WaitlistEntry, PromotionalCode, EventAnalytics } from './data-event';
import { environment } from '../../environments/environment';

// Try to load dev mock events when running in dev with useMocks=true
function loadDevEvents(): EventItem[] {
  if (!environment || !environment.useMocks) return [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // tslint:disable-next-line:no-var-requires
    // @ts-ignore
    const mock = require('../mock/mock-events');
    return (mock && mock.MOCK_EVENTS) ? mock.MOCK_EVENTS : [];
  } catch (e) {
    return [];
  }
}

@Injectable({
  providedIn: 'root'
})
export class DataEventService {
  private data: EventItem[] = [...(loadDevEvents().length ? loadDevEvents() : [])];
  private subject = new BehaviorSubject<EventItem[]>([...this.data]);
  private searchQuery = new BehaviorSubject<string>('');
  private bookings: Booking[] = [];
  private waitlist: WaitlistEntry[] = [];
  private nextBookingId = 1;
  private nextWaitlistId = 1;
  private STORAGE_BOOKINGS_KEY = 'demo_bookings_v1';
  private STORAGE_WAITLIST_KEY = 'demo_waitlist_v1';

  public searchResults$: Observable<EventItem[]> = this.searchQuery.pipe(
    distinctUntilChanged(),
    map(q => {
      const term = (q || '').trim().toLowerCase();
      if (!term) return [];
      return this.data.filter(e => e.title.toLowerCase().includes(term));
    })
  );

  public searchQuery$ = this.searchQuery.asObservable();

  constructor() { this.initialize(); }

  // Load saved demo state on construction
  ngOnInit?(): void {
    // noop for compatibility
  }

  // initialize after creation
  private initialize() {
    this.loadState();
  }

  // Persist bookings and waitlist to localStorage so demo state survives reloads
  private saveState() {
    try {
      localStorage.setItem(this.STORAGE_BOOKINGS_KEY, JSON.stringify(this.bookings));
      localStorage.setItem(this.STORAGE_WAITLIST_KEY, JSON.stringify(this.waitlist));
    } catch (e) {
      // ignore storage errors in restricted environments
    }
  }

  private loadState() {
    try {
      const rawBookings = localStorage.getItem(this.STORAGE_BOOKINGS_KEY);
      if (rawBookings) {
        this.bookings = JSON.parse(rawBookings) as Booking[];
        // infer nextBookingId
        const maxId = this.bookings.reduce((max, b) => {
          const m = Number(b.id?.toString().replace(/^booking_/, '') || 0);
          return isNaN(m) ? max : Math.max(max, m);
        }, 0);
        this.nextBookingId = maxId + 1;
      }

      const rawWait = localStorage.getItem(this.STORAGE_WAITLIST_KEY);
      if (rawWait) {
        this.waitlist = JSON.parse(rawWait) as WaitlistEntry[];
        const maxW = this.waitlist.reduce((max, w) => {
          const m = Number(w.id?.toString().replace(/^waitlist_/, '') || 0);
          return isNaN(m) ? max : Math.max(max, m);
        }, 0);
        this.nextWaitlistId = maxW + 1;
      }
    } catch (e) {
      // ignore
    }
  }

  // ========== EVENT MANAGEMENT ==========

  getEvents$(): Observable<EventItem[]> {
    return this.subject.asObservable();
  }

  setSearchQuery(q: string) {
    this.searchQuery.next(q || '');
  }

  getEvents(): EventItem[] {
    return [...this.data];
  }

  getEventById(id: number): EventItem | undefined {
    return this.data.find(e => e.id === id);
  }

  getEventsByOrganizer(organizerId: string): EventItem[] {
    return this.data.filter(e => e.organizerId === organizerId);
  }

  createEvent(event: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'>): EventItem {
    const newId = Math.max(...this.data.map(e => e.id), -1) + 1;
    const newEvent: EventItem = {
      ...event,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.push(newEvent);
    this.subject.next([...this.data]);
    return newEvent;
  }

  updateEvent(id: number, updates: Partial<EventItem>): EventItem | null {
    const event = this.data.find(e => e.id === id);
    if (!event) return null;
    Object.assign(event, updates, { updatedAt: new Date().toISOString() });
    this.subject.next([...this.data]);
    return event;
  }

  deleteEvent(id: number): boolean {
    const index = this.data.findIndex(e => e.id === id);
    if (index < 0) return false;
    this.data.splice(index, 1);
    this.subject.next([...this.data]);
    return true;
  }

  // ========== TICKET MANAGEMENT ==========

  updateTickets(eventId: number, tickets: TicketCategory[]): EventItem | null {
    const event = this.getEventById(eventId);
    if (!event) return null;
    event.tickets = tickets;
    event.updatedAt = new Date().toISOString();
    this.subject.next([...this.data]);
    return event;
  }

  // ========== PROMOTIONAL CODES ==========

  addPromotionalCode(eventId: number, code: PromotionalCode): EventItem | null {
    const event = this.getEventById(eventId);
    if (!event) return null;
    if (!event.promotionalCodes) event.promotionalCodes = [];
    event.promotionalCodes.push(code);
    this.subject.next([...this.data]);
    return event;
  }

  applyCoupon(code: string): number {
    if (!code) return 0;
    const c = code.trim().toUpperCase();
    if (c === 'SAVE20') return 20;
    if (c === 'HALFPRICE') return 50;
    if (c === 'DISC10') return 10;
    return 0;
  }

  // ========== TICKET BOOKING ==========

  buyTicket(eventId: number, ticketId: string, qty = 1, userId = 'guest'): 
    { success: boolean; message: string; remaining?: number; booking?: Booking } {
    const ev = this.getEventById(eventId);
    if (!ev) return { success: false, message: 'Event not found' };
    
    const t = ev.tickets.find(x => x.id === ticketId);
    if (!t) return { success: false, message: 'Ticket category not found' };
    
    const remaining = t.total - t.sold;
    if (remaining <= 0) return { success: false, message: 'Ticket sold out', remaining: 0 };
    if (remaining < qty) return { success: false, message: `Only ${remaining} left`, remaining };
    
    t.sold += qty;

    // Create booking record
    const booking: Booking = {
      id: `booking_${this.nextBookingId++}`,
      eventId,
      userId,
      ticketCategoryId: ticketId,
      quantity: qty,
      pricePerTicket: t.price,
      totalPrice: t.price * qty,
      discountApplied: 0,
      status: 'confirmed',
      bookingDate: new Date().toISOString(),
      qrCode: this.generateQRCode(),
      checkedIn: false,
    };

    this.bookings.push(booking);
    this.saveState();
    this.subject.next([...this.data]);

    return {
      success: true,
      message: 'Purchase successful',
      remaining: t.total - t.sold,
      booking
    };
  }

  // ========== WAITLIST MANAGEMENT ==========

  joinWaitlist(eventId: number, ticketCategoryId: string, userId: string, quantity: number):
    { success: boolean; message: string; entryId?: string } {
    const event = this.getEventById(eventId);
    if (!event) return { success: false, message: 'Event not found' };

    const entry: WaitlistEntry = {
      id: `waitlist_${this.nextWaitlistId++}`,
      eventId,
      userId,
      ticketCategoryId,
      quantity,
      registeredAt: new Date().toISOString(),
      notified: false,
    };

    this.waitlist.push(entry);
    this.saveState();
    return { success: true, message: 'Added to waitlist', entryId: entry.id };
  }

  leaveWaitlist(waitlistId: string): boolean {
    const index = this.waitlist.findIndex(w => w.id === waitlistId);
    if (index < 0) return false;
    this.waitlist.splice(index, 1);
    return true;
  }

  getWaitlistForEvent(eventId: number): WaitlistEntry[] {
    return this.waitlist.filter(w => w.eventId === eventId);
  }

  getWaitlistForUser(userId: string): WaitlistEntry[] {
    return this.waitlist.filter(w => w.userId === userId);
  }

  // ========== BOOKING MANAGEMENT ==========

  getBookingsByUser(userId: string): Booking[] {
    return this.bookings.filter(b => b.userId === userId);
  }

  getBookingsByEvent(eventId: number): Booking[] {
    return this.bookings.filter(b => b.eventId === eventId);
  }

  getBookingById(bookingId: string): Booking | undefined {
    return this.bookings.find(b => b.id === bookingId);
  }

  checkInBooking(bookingId: string): { success: boolean; message: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, message: 'Booking not found' };
    if (booking.checkedIn) return { success: false, message: 'Already checked in' };

    booking.checkedIn = true;
    booking.checkedInAt = new Date().toISOString();
    return { success: true, message: 'Check-in successful' };
  }

  cancelBooking(bookingId: string): { success: boolean; message: string } {
    const booking = this.getBookingById(bookingId);
    if (!booking) return { success: false, message: 'Booking not found' };
    
    // Only allow cancellation 7 days before event
    const event = this.getEventById(booking.eventId);
    if (!event) return { success: false, message: 'Event not found' };

    const eventDate = new Date(event.date).getTime();
    const now = Date.now();
    const daysUntilEvent = (eventDate - now) / (1000 * 60 * 60 * 24);

    if (daysUntilEvent < 7) {
      return { success: false, message: 'Can only cancel 7 days before event' };
    }

    booking.status = 'cancelled';

    // Refund tickets
    const ticket = event.tickets.find(t => t.id === booking.ticketCategoryId);
    if (ticket) {
      ticket.sold = Math.max(0, ticket.sold - booking.quantity);
    }
    this.saveState();
    this.subject.next([...this.data]);
    return { success: true, message: 'Booking cancelled successfully' };
  }

  // ========== ANALYTICS ==========

  generateEventAnalytics(eventId: number): EventAnalytics | null {
    const event = this.getEventById(eventId);
    if (!event) return null;

    const eventBookings = this.getBookingsByEvent(eventId);
    let totalRevenue = 0;
    let totalTicketsSold = 0;

    const byTicketType: { [key: string]: { sold: number; revenue: number } } = {};
    const bookingsByDate: { [date: string]: { count: number; revenue: number } } = {};

    for (const ticket of event.tickets) {
      byTicketType[ticket.id] = { sold: ticket.sold, revenue: ticket.sold * ticket.price };
      totalRevenue += ticket.sold * ticket.price;
      totalTicketsSold += ticket.sold;
    }

    for (const booking of eventBookings) {
      const date = new Date(booking.bookingDate).toISOString().split('T')[0];
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = { count: 0, revenue: 0 };
      }
      bookingsByDate[date].count++;
      bookingsByDate[date].revenue += booking.totalPrice;
    }

    const totalSeats = event.tickets.reduce((acc, t) => acc + t.total, 0);
    const totalOccupied = event.tickets.reduce((acc, t) => acc + t.sold, 0);

    return {
      eventId,
      totalRevenue,
      totalTicketsSold,
      totalSeatsOccupied: totalOccupied,
      occupancyRate: totalSeats > 0 ? (totalOccupied / totalSeats) * 100 : 0,
      byTicketType,
      bookingsByDate,
    };
  }

  getAuditoriumAnalytics(startDate?: string, endDate?: string):
    { totalBookings: number; totalRevenue: number; totalEvents: number; occupancyRate: number } {
    const events = this.data;
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalSeats = 0;
    let occupiedSeats = 0;

    for (const event of events) {
      const analytics = this.generateEventAnalytics(event.id);
      if (analytics) {
        totalBookings += analytics.totalTicketsSold;
        totalRevenue += analytics.totalRevenue;
        totalSeats += event.tickets.reduce((acc, t) => acc + t.total, 0);
        occupiedSeats += analytics.totalSeatsOccupied;
      }
    }

    return {
      totalBookings,
      totalRevenue,
      totalEvents: events.length,
      occupancyRate: totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0,
    };
  }

  // ========== UTILITY ==========

  private generateQRCode(): string {
    return `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  }
}
