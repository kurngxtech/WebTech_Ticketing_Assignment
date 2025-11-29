import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { EventItem, EventAnalytics } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

interface ChartDataPoint {
  x: number;
  y: number;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-analytics-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-reports.html',
  styleUrls: ['./analytics-reports.css']
})
export class AnalyticsReports implements OnInit {
  currentUser: User | null = null;
  selectedEventId: number | null = null;
  selectedTimePeriod: TimePeriod = 'daily';
  
  currentEvent: EventItem | null = null;
  analytics: EventAnalytics | null = null;
  chartDataPoints: ChartDataPoint[] = [];
  showTimePeriodMenu = false;

  constructor(
    private eventService: DataEventService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
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
        this.generateLineChartPoints();
      }
    }
  }

  generateLineChartPoints(): void {
    if (!this.analytics) return;
    
    const bookings = Object.entries(this.analytics.bookingsByDate).map(([date, data]: any) => ({
      date,
      count: data.count,
      revenue: data.revenue
    }));

    if (bookings.length === 0) {
      this.chartDataPoints = [];
      return;
    }

    const maxValue = Math.max(...bookings.map(b => b.revenue));

    const chartHeight = 300;
    const chartWidth = 1000;
    const padding = 40;

    this.chartDataPoints = bookings.map((booking, index) => ({
      x: padding + (index / (bookings.length - 1 || 1)) * (chartWidth - 2 * padding),
      y: chartHeight - ((booking.revenue / maxValue) * (chartHeight - 2 * padding)) - padding
    }));
  }

  getLinePoints(): string {
    return this.chartDataPoints.map(p => `${p.x},${p.y}`).join(' ');
  }

  toggleTimePeriodMenu(): void {
    this.showTimePeriodMenu = !this.showTimePeriodMenu;
  }

  selectTimePeriod(period: TimePeriod): void {
    this.selectedTimePeriod = period;
    this.showTimePeriodMenu = false;
  }

  closeTimePeriodMenu(): void {
    this.showTimePeriodMenu = false;
  }

  goBack(): void {
    const previousUrl = this.currentUser?.role === 'eo' ? '/eo' : '/admin';
    this.router.navigate([previousUrl]);
  }

  printPDF(): void {
    window.print();
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

  getStatementText(): string {
    return `Total Revenue (${this.selectedTimePeriod.charAt(0).toUpperCase() + this.selectedTimePeriod.slice(1)})`;
  }

  getStatementValue(): string {
    if (!this.analytics) return 'Rp 0';
    return this.formatPrice(this.analytics.totalRevenue);
  }
}
