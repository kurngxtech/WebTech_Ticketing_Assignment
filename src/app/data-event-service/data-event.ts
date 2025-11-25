import { Injectable } from '@angular/core';

@Injectable({
   providedIn: 'root',
})
export class DataEvent { }

export interface TicketCategory {
   id: string;
   type: string;
   price: number; // in IDR
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

// Mock dataset (migrated from body.ts)
export const EVENTS: EventItem[] = [
   {
      id: 0,
      img: 'https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg',
      title: 'Sounderful',
      description: 'Festival Show',
      date: '2025-12-10',
      price: 350000,
      organizer: 'Sounderful Org',
      organizerId: 'eo1',
      time: '16:00 - 23:00',
      location: 'Gelora Bung Karno',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tickets: [
         { id: 'vip', type: 'VIP', price: 500000, total: 50, sold: 5, section: 'VIP' },
         { id: 'reg', type: 'Regular', price: 350000, total: 500, sold: 120, section: 'GENERAL' },
      ],
   },
   {
      id: 1,
      img: 'https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg',
      title: 'Clean Bandit',
      description: 'Live in Jakarta - International Velodrome',
      date: '2025-11-26',
      price: 450000,
      organizer: 'CB Organizer',
      organizerId: 'eo1',
      time: '19:00 - 22:30',
      location: 'International Velodrome',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tickets: [
         { id: 'premium', type: 'Premium', price: 600000, total: 200, sold: 20, section: 'PREMIUM' },
         { id: 'regular', type: 'Regular', price: 450000, total: 800, sold: 400, section: 'GENERAL' },
      ],
   },
   {
      id: 2,
      img: 'https://i.ytimg.com/vi/0pqyYN9LIgA/hqdefault.jpg',
      title: 'Lampungphoria',
      description: 'Regional Concert',
      date: '2025-10-05',
      price: 150000,
      organizer: 'Lampung Events',
      organizerId: 'eo2',
      time: '18:00 - 21:00',
      location: 'Lampung Open Field',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tickets: [{ id: 'reg', type: 'Regular', price: 150000, total: 200, sold: 50, section: 'GENERAL' }],
   },
   {
      id: 3,
      img: 'https://i.ytimg.com/vi/PyqcJnFQTdA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAb3HECfl3crWYY2GTqt5Ai6B-5Xw',
      title: 'Special Concert',
      description: 'Amazing live performance',
      date: '2025-12-12',
      price: 150000,
      organizer: 'Gordon Events',
      organizerId: 'eo2',
      time: '19:00 - 22:00',
      location: 'Jakarta Convention Center',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tickets: [
         { id: 'vip', type: 'VIP', price: 250000, total: 100, sold: 10, section: 'VIP' },
         { id: 'reg', type: 'Regular', price: 150000, total: 300, sold: 250, section: 'GENERAL' },
         { id: 'early', type: 'Early Bird', price: 120000, total: 50, sold: 50, section: 'PROMO' },
      ],
   },
   {
      id: 4,
      img: 'https://i.ytimg.com/vi/bTrreEsmHJo/hq720.jpg',
      title: 'Tech Conference 2025',
      description: 'Annual tech conference',
      date: '2025-05-15',
      price: 150000,
      organizer: 'Gordon Events',
      organizerId: 'eo2',
      time: '19:00 - 22:00',
      location: 'Jakarta Convention Center',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tickets: [
         { id: 'vip', type: 'VIP', price: 250000, total: 100, sold: 10, section: 'VIP' },
         { id: 'reg', type: 'Regular', price: 150000, total: 300, sold: 250, section: 'GENERAL' },
         { id: 'early', type: 'Early Bird', price: 120000, total: 50, sold: 50, section: 'PROMO' },
      ],
   },
];
