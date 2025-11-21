import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataEvent {}
// src/app/data-event-service/data-event.ts
export interface TicketCategory {
  id: string;
  type: string;
  price: number; // in IDR
  total: number; // total seats
  sold: number; // sold seats
}

export interface EventItem {
  id: number;
  img: string;
  title: string;
  description: string;
  date: string; // ISO-ish string
  priceLabel?: string;
  link?: string;
  organizer: string;
  time: string; // e.g. "19:00 - 22:00"
  location: string;
  tickets: TicketCategory[];
}

// Mock dataset (migrated from body.ts)
export const EVENTS: EventItem[] = [
  {
    id: 0,
    img: 'https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg',
    title: 'Sounderful',
    description: 'Festival Show',
    date: '2025-12-10',
    priceLabel: 'Rp 350.000',
    link: 'https://www.youtube.com/watch?v=VNpxBcYZZjQ',
    organizer: 'Sounderful Org',
    time: '16:00 - 23:00',
    location: 'Gelora Bung Karno',
    tickets: [
      { id: 'vip', type: 'VIP', price: 500000, total: 50, sold: 5 },
      { id: 'reg', type: 'Regular', price: 350000, total: 500, sold: 120 },
    ],
  },
  {
    id: 1,
    img: 'https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg',
    title: 'Clean Bandit',
    description: 'Live in Jakarta - International Velodrome',
    date: '2025-11-26',
    priceLabel: 'Rp 450.000',
    link: 'https://www.youtube.com/watch?v=MecD9f8Dj6s',
    organizer: 'CB Organizer',
    time: '19:00 - 22:30',
    location: 'International Velodrome',
    tickets: [
      { id: 'premium', type: 'Premium', price: 600000, total: 200, sold: 20 },
      { id: 'regular', type: 'Regular', price: 450000, total: 800, sold: 400 },
    ],
  },
  {
    id: 2,
    img: 'https://i.ytimg.com/vi/0pqyYN9LIgA/hqdefault.jpg',
    title: 'Lampungphoria',
    description: 'Regional Concert',
    date: '2025-10-05',
    priceLabel: 'Rp 150.000',
    link: 'https://www.youtube.com/watch?v=0pqyYN9LIgA',
    organizer: 'Lampung Events',
    time: '18:00 - 21:00',
    location: 'Lampung Open Field',
    tickets: [{ id: 'reg', type: 'Regular', price: 150000, total: 200, sold: 50 }],
  },
  {
    id: 3,
    img: 'https://i.ytimg.com/vi/PyqcJnFQTdA/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAb3HECfl3crWYY2GTqt5Ai6B-5Xw',
    title: 'alamak gordon marah euy',
    description: 'jirlah',
    date: '2025-12-12',
    priceLabel: 'Rp 152.000',
    link: 'https://www.youtube.com/watch?v=bTrreEsmHJo',
    organizer: 'Gordon Events',
    time: '19:00 - 22:00',
    location: 'Jakarta Convention Center',
    tickets: [
      { id: 'vip', type: 'VIP', price: 250000, total: 100, sold: 10 },
      { id: 'reg', type: 'Regular', price: 150000, total: 300, sold: 250 },
      { id: 'early', type: 'Early Bird', price: 120000, total: 50, sold: 50 }, // sold out
    ],
  },
  {
    id: 4,
    img: 'https://i.ytimg.com/vi/bTrreEsmHJo/hq720.jpg',
    title: 'gordon??',
    description: 'te sate',
    date: '2025-05-15',
    priceLabel: 'Rp 150.000',
    link: 'https://www.youtube.com/watch?v=bTrreEsmHJo',
    organizer: 'Gordon Events',
    time: '19:00 - 22:00',
    location: 'Jakarta Convention Center',
    tickets: [
      { id: 'vip', type: 'VIP', price: 250000, total: 100, sold: 10 },
      { id: 'reg', type: 'Regular', price: 150000, total: 300, sold: 250 },
      { id: 'early', type: 'Early Bird', price: 120000, total: 50, sold: 50 }, // sold out
    ],
  },
  // ... tambahkan event lain bila perlu
];
