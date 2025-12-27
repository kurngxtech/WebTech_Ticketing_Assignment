/**
 * API Service - HTTP Client wrapper for backend communication
 * Provides type-safe methods for all API endpoints
 */

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, tap, catchError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { User } from '../auth/auth.types';
import {
  EventItem,
  Booking,
  WaitlistEntry,
  EventAnalytics,
} from '../data-event-service/data-event';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking?: any;
  remaining?: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment?: {
    orderId: string;
    snapToken: string;
    snapRedirectUrl: string;
    grossAmount: number;
    clientKey: string;
  };
}

export interface AnalyticsResponse {
  success: boolean;
  analytics: EventAnalytics;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // ============ AUTH ENDPOINTS ============

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password });
  }

  register(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, data);
  }

  registerEO(data: {
    fullName: string;
    email: string;
    phone: string;
    organizationName: string;
    username: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register-eo`, data);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, { oldPassword, newPassword });
  }

  getMe(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/auth/me`);
  }

  // ============ USER ENDPOINTS ============

  getAllUsers(role?: string): Observable<{ success: boolean; users: User[] }> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<{ success: boolean; users: User[] }>(`${this.apiUrl}/users`, { params });
  }

  getEventOrganizers(): Observable<{ success: boolean; eventOrganizers: User[] }> {
    return this.http.get<{ success: boolean; eventOrganizers: User[] }>(`${this.apiUrl}/users/eos`);
  }

  // ============ EVENT ENDPOINTS ============

  getEvents(status?: string): Observable<{ success: boolean; events: EventItem[] }> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<{ success: boolean; events: EventItem[] }>(`${this.apiUrl}/events`, {
      params,
    });
  }

  getEventById(id: string): Observable<{ success: boolean; event: EventItem }> {
    return this.http.get<{ success: boolean; event: EventItem }>(`${this.apiUrl}/events/${id}`);
  }

  getEventsByOrganizer(organizerId: string): Observable<{ success: boolean; events: EventItem[] }> {
    return this.http.get<{ success: boolean; events: EventItem[] }>(
      `${this.apiUrl}/events/organizer/${organizerId}`
    );
  }

  createEvent(eventData: Partial<EventItem>): Observable<{ success: boolean; event: EventItem }> {
    return this.http.post<{ success: boolean; event: EventItem }>(
      `${this.apiUrl}/events`,
      eventData
    );
  }

  updateEvent(
    id: string,
    eventData: Partial<EventItem>
  ): Observable<{ success: boolean; event: EventItem }> {
    return this.http.put<{ success: boolean; event: EventItem }>(
      `${this.apiUrl}/events/${id}`,
      eventData
    );
  }

  deleteEvent(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/events/${id}`);
  }

  validatePromoCode(
    eventId: string,
    code: string
  ): Observable<{
    success: boolean;
    valid: boolean;
    discountPercentage?: number;
    message: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/events/validate-promo`, { eventId, code });
  }

  addPromoCode(eventId: string, promoData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/promo`, promoData);
  }

  // ============ BOOKING ENDPOINTS ============

  createBooking(data: {
    eventId: string;
    ticketCategoryId: string;
    quantity: number;
    promoCode?: string;
    selectedSeats?: string[];
  }): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/bookings`, data);
  }

  getBookingsByUser(userId: string): Observable<{ success: boolean; bookings: Booking[] }> {
    return this.http.get<{ success: boolean; bookings: Booking[] }>(
      `${this.apiUrl}/bookings/user/${userId}`
    );
  }

  getBookingsByEvent(eventId: string): Observable<{ success: boolean; bookings: Booking[] }> {
    return this.http.get<{ success: boolean; bookings: Booking[] }>(
      `${this.apiUrl}/bookings/event/${eventId}`
    );
  }

  getBookingById(id: string): Observable<{ success: boolean; booking: Booking }> {
    return this.http.get<{ success: boolean; booking: Booking }>(`${this.apiUrl}/bookings/${id}`);
  }

  cancelBooking(id: string, reason?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/bookings/${id}/cancel`,
      { reason }
    );
  }

  checkInBooking(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/bookings/${id}/checkin`,
      {}
    );
  }

  validateQRCode(qrCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/validate-qr`, { qrCode });
  }

  // ============ PAYMENT ENDPOINTS ============

  createPayment(bookingId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payments/create`, { bookingId });
  }

  getPaymentStatus(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/${orderId}/status`);
  }

  mockCompletePayment(bookingId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/mock-complete`, { bookingId });
  }

  getClientKey(): Observable<{ success: boolean; clientKey: string }> {
    return this.http.get<{ success: boolean; clientKey: string }>(
      `${this.apiUrl}/payments/client-key`
    );
  }

  // ============ WAITLIST ENDPOINTS ============

  joinWaitlist(
    eventId: string,
    ticketCategoryId: string,
    quantity: number
  ): Observable<{ success: boolean; message: string; entry?: WaitlistEntry }> {
    return this.http.post<{ success: boolean; message: string; entry?: WaitlistEntry }>(
      `${this.apiUrl}/waitlist`,
      { eventId, ticketCategoryId, quantity }
    );
  }

  leaveWaitlist(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/waitlist/${id}`);
  }

  getWaitlistByUser(userId: string): Observable<{ success: boolean; waitlist: WaitlistEntry[] }> {
    return this.http.get<{ success: boolean; waitlist: WaitlistEntry[] }>(
      `${this.apiUrl}/waitlist/user/${userId}`
    );
  }

  getWaitlistByEvent(eventId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/waitlist/event/${eventId}`);
  }

  // ============ ANALYTICS ENDPOINTS ============

  getEventAnalytics(eventId: string): Observable<AnalyticsResponse> {
    return this.http.get<AnalyticsResponse>(`${this.apiUrl}/analytics/event/${eventId}`);
  }

  getAuditoriumAnalytics(period?: string, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get(`${this.apiUrl}/analytics/auditorium`, { params });
  }

  getRevenueReport(options?: {
    eventId?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (options?.eventId) params = params.set('eventId', options.eventId);
    if (options?.period) params = params.set('period', options.period);
    if (options?.startDate) params = params.set('startDate', options.startDate);
    if (options?.endDate) params = params.set('endDate', options.endDate);
    return this.http.get(`${this.apiUrl}/analytics/revenue`, { params });
  }

  getOccupancyReport(eventId?: string): Observable<any> {
    let params = new HttpParams();
    if (eventId) params = params.set('eventId', eventId);
    return this.http.get(`${this.apiUrl}/analytics/occupancy`, { params });
  }

  getSalesReport(eventId?: string): Observable<any> {
    let params = new HttpParams();
    if (eventId) params = params.set('eventId', eventId);
    return this.http.get(`${this.apiUrl}/analytics/sales`, { params });
  }

  // ============ HEALTH CHECK ============

  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
