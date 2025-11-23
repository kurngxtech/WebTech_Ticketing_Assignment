// src/app/data-event-service/data-event.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventItem, EVENTS, TicketCategory } from './data-event';

@Injectable({
  providedIn: 'root'
})
export class DataEventService {
  private data: EventItem[] = [...EVENTS];
  private subject = new BehaviorSubject<EventItem[]>([...this.data]);

  constructor() {}

  /** Observable (optional subscribe) */
  getEvents$(): Observable<EventItem[]> {
    return this.subject.asObservable();
  }

  getEvents(): EventItem[] {
    return [...this.data];
  }

  getEventById(id: number): EventItem | undefined {
    return this.data.find(e => e.id === id);
  }

  /** Basic coupon logic: return discount percentage (0-100) */
  applyCoupon(code: string): number {
    if (!code) return 0;
    const c = code.trim().toUpperCase();
    if (c === 'SAVE20') return 20;
    if (c === 'HALFPRICE') return 50;
    if (c === 'DISC10') return 10;
    return 0;
  }

  /**
   * Buy ticket: increase sold count if available.
   * Returns object { success, message, remaining }
   */
  buyTicket(eventId: number, ticketId: string, qty = 1): { success: boolean; message: string; remaining?: number } {
    const ev = this.getEventById(eventId);
    if (!ev) return { success: false, message: 'Event not found' };
    const t = ev.tickets.find(x => x.id === ticketId);
    if (!t) return { success: false, message: 'Ticket category not found' };
    const remaining = t.total - t.sold;
    if (remaining <= 0) return { success: false, message: 'Ticket sold out', remaining: 0 };
    if (remaining < qty) return { success: false, message: `Only ${remaining} left`, remaining };
    t.sold += qty;
    // push update
    this.subject.next([...this.data]);
    return { success: true, message: 'Purchase successful', remaining: t.total - t.sold };
  }
}
