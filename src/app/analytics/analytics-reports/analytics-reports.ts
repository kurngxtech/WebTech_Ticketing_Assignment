import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { EventItem, EventAnalytics } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

@Component({
  selector: 'app-analytics-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-reports.html',
  styleUrls: ['./analytics-reports.css']
})
export class AnalyticsReports implements OnInit {
  currentUser: User | null = null;
  selectedEventId: number | null = null;
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  
  events: EventItem[] = [];
  currentEvent: EventItem | null = null;
  analytics: EventAnalytics | null = null;
  auditoriumStats: any = null;

  isAdmin = false;
  isEO = false;

  constructor(
    private eventService: DataEventService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      return;
    }

    this.isAdmin = this.currentUser.role === 'admin';
    this.isEO = this.currentUser.role === 'eo';

    if (this.isAdmin) {
      this.events = this.eventService.getEvents();
      this.auditoriumStats = this.eventService.getAuditoriumAnalytics();
    } else if (this.isEO) {
      this.events = this.eventService.getEventsByOrganizer(this.currentUser.id);
    }

    // Check for eventId in query params
    this.route.queryParams.subscribe(params => {
      if (params['eventId']) {
        this.selectedEventId = parseInt(params['eventId']);
        this.loadEventAnalytics();
      }
    });
  }

  loadEventAnalytics(): void {
    if (this.selectedEventId !== null) {
      this.currentEvent = this.eventService.getEventById(this.selectedEventId) || null;
      if (this.currentEvent) {
        this.analytics = this.eventService.generateEventAnalytics(this.selectedEventId);
      }
    }
  }

  onEventSelect(): void {
    this.loadEventAnalytics();
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  getTopTicketType(): { type: string; sold: number; revenue: number } | null {
    if (!this.analytics) return null;
    
    let topTicket = { type: '', sold: 0, revenue: 0 };
    for (const [ticketId, data] of Object.entries(this.analytics.byTicketType)) {
      if ((data as any).sold > topTicket.sold) {
        const ticket = this.currentEvent?.tickets.find(t => t.id === ticketId);
        if (ticket) {
          topTicket = { type: ticket.type, sold: (data as any).sold, revenue: (data as any).revenue };
        }
      }
    }
    return topTicket.type ? topTicket : null;
  }

  getOccupancyPercentage(): number {
    if (!this.analytics) return 0;
    return Math.round(this.analytics.occupancyRate);
  }

  getBookingsByPeriod(): any[] {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.bookingsByDate).map(([date, data]: any) => ({
      date,
      count: data.count,
      revenue: data.revenue
    }));
  }

  downloadReport(): void {
    if (!this.currentEvent || !this.analytics) return;

    const reportContent = `
EVENT ANALYTICS REPORT
=====================
Event: ${this.currentEvent.title}
Date: ${new Date().toLocaleDateString()}

EVENT DETAILS:
- Event Name: ${this.currentEvent.title}
- Date: ${this.currentEvent.date}
- Time: ${this.currentEvent.time}
- Location: ${this.currentEvent.location}
- Organizer: ${this.currentEvent.organizer}

SALES SUMMARY:
- Total Revenue: ${this.formatPrice(this.analytics.totalRevenue)}
- Total Tickets Sold: ${this.analytics.totalTicketsSold}
- Total Seats Occupied: ${this.analytics.totalSeatsOccupied}
- Occupancy Rate: ${this.getOccupancyPercentage()}%

TICKET BREAKDOWN:
${Object.entries(this.analytics.byTicketType).map(([ticketId, data]: any) => {
  const ticket = this.currentEvent?.tickets.find(t => t.id === ticketId);
  return `- ${ticket?.type}: ${data.sold} sold, ${this.formatPrice(data.revenue)} revenue`;
}).join('\n')}

BOOKING TIMELINE:
${this.getBookingsByPeriod().map(b => 
  `- ${b.date}: ${b.count} bookings, ${this.formatPrice(b.revenue)} revenue`
).join('\n')}
    `;

    // Create download link
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `${this.currentEvent.title}_report.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  print(): void {
    window.print();
  }
}
