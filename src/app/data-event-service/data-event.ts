import { Injectable } from '@angular/core';

@Injectable({
   providedIn: 'root',
})
export class DataEvent { }

export interface TicketCategory {
   id: string;
   type: string;
   price: number; // in USD
   total: number; // total seats
   sold: number; // sold seats
   section?: string; // e.g., "A", "B", "C" - seating section
}

export interface SeatSection {
   id: string;
   name: string;
   rows: number;
   seatsPerRow: number;
   availableSeats: Seat[];
}

export interface Seat {
   id: string;
   row: string;
   column: number;
   section: string;
   isOccupied: boolean;
   bookingId?: string;
}

export interface PromotionalCode {
   code: string;
   discountPercentage: number;
   expiryDate: string;
   applicableTicketTypes?: string[]; // empty = all types
   maxUsage: number;
   usedCount: number;
}

export interface Booking {
   id: string;
   eventId: number;
   userId: string;
   ticketCategoryId: string;
   quantity: number;
   pricePerTicket: number;
   totalPrice: number;
   discountApplied: number;
   status: 'pending' | 'confirmed' | 'cancelled';
   bookingDate: string;
   qrCode?: string;
   checkedIn?: boolean;
   checkedInAt?: string;
}

export interface WaitlistEntry {
   id: string;
   eventId: number;
   userId: string;
   ticketCategoryId: string;
   quantity: number;
   registeredAt: string;
   notified: boolean;
}

export interface EventAnalytics {
   eventId: number;
   totalRevenue: number;
   totalTicketsSold: number;
   totalSeatsOccupied: number;
   occupancyRate: number;
   byTicketType: {
      [ticketTypeId: string]: {
         sold: number;
         revenue: number;
      };
   };
   bookingsByDate: {
      [date: string]: {
         count: number;
         revenue: number;
      };
   };
}

export interface EventItem {
   id: number;
   img: string;
   title: string;
   description: string;
   date: string; // ISO-ish string
   price?: number; // starting price
   organizer: string;
   organizerId: string; // EO user id
   time: string; // e.g. "19:00 - 22:00"
   location: string;
   tickets: TicketCategory[];
   seatingLayout?: SeatSection[];
   promotionalCodes?: PromotionalCode[];
   status: 'draft' | 'active' | 'completed' | 'cancelled';
   createdAt: string;
   updatedAt: string;
}
// Export an empty EVENTS array so imports that expect EVENTS still work in production builds.
export const EVENTS: EventItem[] = [];
