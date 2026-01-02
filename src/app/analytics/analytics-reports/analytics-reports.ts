import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  NgZone,
  HostListener,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { AuthService } from '../../auth/auth.service';
import { EventItem, EventAnalytics } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
  ticketsSold: number;
  revenue: number;
  bookings: number;
  date: string;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-analytics-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-reports.html',
  styleUrls: ['./analytics-reports.css'],
})
export class AnalyticsReports implements OnInit, AfterViewInit {
  currentUser: User | null = null;
  selectedEventId: string | null = null;
  selectedTimePeriod: TimePeriod = 'daily';
  isLoading = false;
  isLoadingChart = false;
  isGeneratingPDF = false;

  currentEvent: EventItem | null = null;
  analytics: EventAnalytics | null = null;
  chartDataPoints: ChartDataPoint[] = [];
  showTimePeriodMenu = false;

  // Tooltip
  hoveredPoint: ChartDataPoint | null = null;
  tooltipX = 0;
  tooltipY = 0;

  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

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
    this.route.queryParams.subscribe((params) => {
      if (params['eventId']) {
        this.selectedEventId = params['eventId'];
        this.loadEventAnalytics();
      }
    });
  }

  ngAfterViewInit(): void {
    // Trigger change detection after view is initialized to ensure menus are responsive
    this.zone.run(() => this.cdr.detectChanges());
  }

  // Close menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Check if click is outside the time period menu
    if (this.showTimePeriodMenu) {
      const timePeriodBtn = target.closest('.time-toggle-btn');
      const timePeriodOverlay = target.closest('.time-period-overlay');
      if (!timePeriodBtn && !timePeriodOverlay) {
        this.showTimePeriodMenu = false;
        this.zone.run(() => this.cdr.detectChanges());
      }
    }
  }

  loadEventAnalytics(): void {
    if (this.selectedEventId !== null) {
      this.isLoading = true;
      this.isLoadingChart = true;

      // Load event from API
      this.eventService.getEventByIdAsync(this.selectedEventId).subscribe({
        next: (event) => {
          this.currentEvent = event;
          if (this.currentEvent) {
            // Load analytics from API
            this.eventService.getEventAnalyticsAsync(this.selectedEventId!).subscribe({
              next: (analytics) => {
                this.analytics = analytics;
                this.generateLineChartPoints();
                this.isLoading = false;
                this.isLoadingChart = false;
                this.zone.run(() => this.cdr.detectChanges());
              },
              error: (err) => {
                console.error('Failed to load analytics:', err);
                this.analytics = null;
                this.isLoading = false;
                this.isLoadingChart = false;
                this.zone.run(() => this.cdr.detectChanges());
              },
            });
          } else {
            this.isLoading = false;
            this.isLoadingChart = false;
            this.zone.run(() => this.cdr.detectChanges());
          }
        },
        error: (err) => {
          console.error('Failed to load event:', err);
          this.isLoading = false;
          this.isLoadingChart = false;
          this.zone.run(() => this.cdr.detectChanges());
        },
      });
    }
  }

  generateLineChartPoints(): void {
    if (!this.analytics) {
      this.chartDataPoints = [];
      return;
    }

    const bookings = Object.entries(this.analytics.bookingsByDate).map(([date, data]: any) => ({
      date,
      count: data.count,
      revenue: data.revenue,
      ticketsSold: data.ticketsSold || data.count, // Use ticketsSold if available, fallback to count
    }));

    if (bookings.length === 0) {
      this.chartDataPoints = [];
      return;
    }

    // Sort bookings by date
    bookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group data based on selected time period
    const groupedData = this.groupDataByPeriod(bookings);

    if (groupedData.length === 0) {
      this.chartDataPoints = [];
      return;
    }

    // Limit to last 7 data points for cleaner visualization
    const limitedData = groupedData.slice(-7);

    const maxValue = Math.max(...limitedData.map((b) => b.revenue), 1);

    const chartHeight = 300;
    const chartWidth = 1000;
    const padding = 50;

    this.chartDataPoints = limitedData.map((item, index) => ({
      x: padding + (index / (limitedData.length - 1 || 1)) * (chartWidth - 2 * padding),
      y: chartHeight - (item.revenue / maxValue) * (chartHeight - 2 * padding) - padding,
      label: item.label,
      value: item.revenue,
      ticketsSold: item.ticketsSold,
      revenue: item.revenue,
      bookings: item.bookings,
      date: item.date,
    }));
  }

  groupDataByPeriod(
    bookings: Array<{ date: string; count: number; revenue: number; ticketsSold: number }>
  ): Array<{
    label: string;
    date: string;
    ticketsSold: number;
    revenue: number;
    bookings: number;
  }> {
    if (this.selectedTimePeriod === 'daily') {
      // Return as-is for daily
      return bookings.map((b) => ({
        label: this.formatDateLabel(b.date, 'daily'),
        date: b.date,
        ticketsSold: b.ticketsSold,
        revenue: b.revenue,
        bookings: b.count,
      }));
    }

    // Group by week or month
    const grouped = new Map<
      string,
      { ticketsSold: number; revenue: number; bookings: number; date: string }
    >();

    for (const booking of bookings) {
      const date = new Date(booking.date);
      let key: string;
      let label: string;

      if (this.selectedTimePeriod === 'weekly') {
        // Get week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
        label = `Week ${weekNum}`;
      } else {
        // Monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      }

      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.ticketsSold += booking.ticketsSold;
        existing.revenue += booking.revenue;
        existing.bookings += booking.count;
      } else {
        grouped.set(key, {
          ticketsSold: booking.ticketsSold,
          revenue: booking.revenue,
          bookings: booking.count,
          date: booking.date,
        });
      }
    }

    // Convert to array
    const result: Array<{
      label: string;
      date: string;
      ticketsSold: number;
      revenue: number;
      bookings: number;
    }> = [];

    const entries = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [key, data] of entries) {
      let label: string;
      if (this.selectedTimePeriod === 'weekly') {
        const weekNum = key.split('-W')[1];
        label = `Week ${weekNum}`;
      } else {
        const [year, month] = key.split('-');
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        label = `${monthNames[parseInt(month) - 1]} ${year}`;
      }

      result.push({
        label,
        date: data.date,
        ticketsSold: data.ticketsSold,
        revenue: data.revenue,
        bookings: data.bookings,
      });
    }

    return result;
  }

  formatDateLabel(dateStr: string, period: TimePeriod): string {
    const date = new Date(dateStr);
    if (period === 'daily') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `Week ${weekNum}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }

  getLinePoints(): string {
    return this.chartDataPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }

  onChartPointHover(point: ChartDataPoint, event: MouseEvent, index: number): void {
    this.hoveredPoint = point;
    const chartWidth = 1000;
    const tooltipWidth = 200;
    const pointX = this.chartDataPoints[index].x;
    const pointY = this.chartDataPoints[index].y;

    // Calculate tooltip position - clamp within chart bounds
    // The tooltip uses transform: translateX(-50%), so we calculate center position
    let tooltipCenterX = pointX;

    // Clamp to prevent tooltip from going off the right edge
    const maxX = chartWidth - tooltipWidth / 2 - 10; // 10px buffer from edge
    if (tooltipCenterX > maxX) {
      tooltipCenterX = maxX;
    }

    // Clamp to prevent tooltip from going off the left edge
    const minX = tooltipWidth / 2 + 10; // 10px buffer from edge
    if (tooltipCenterX < minX) {
      tooltipCenterX = minX;
    }

    this.tooltipX = tooltipCenterX;

    // Adjust Y position if near top edge
    if (pointY < 100) {
      this.tooltipY = pointY + 20; // Show below point
    } else {
      this.tooltipY = pointY - 80; // Show above point
    }
  }

  onChartPointLeave(): void {
    this.hoveredPoint = null;
  }

  toggleTimePeriodMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showTimePeriodMenu = !this.showTimePeriodMenu;
    this.zone.run(() => this.cdr.detectChanges());
  }

  selectTimePeriod(period: TimePeriod): void {
    this.selectedTimePeriod = period;
    this.showTimePeriodMenu = false;
    // Regenerate chart with new period grouping
    this.generateLineChartPoints();
    this.zone.run(() => this.cdr.detectChanges());
  }

  closeTimePeriodMenu(): void {
    this.showTimePeriodMenu = false;
    this.zone.run(() => this.cdr.detectChanges());
  }

  goBack(): void {
    const previousUrl = this.currentUser?.role === 'eo' ? '/eo' : '/admin';
    this.router.navigate([previousUrl]);
  }

  printPDF(): void {
    if (!this.isBrowser || !this.currentEvent || !this.analytics) {
      return;
    }

    this.isGeneratingPDF = true;
    this.zone.run(() => this.cdr.detectChanges());

    // Dynamic import jspdf to avoid SSR issues
    import('jspdf')
      .then(({ jsPDF }) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(18, 18, 18);
        doc.rect(0, 0, pageWidth, 50, 'F');

        doc.setFontSize(24);
        doc.setTextColor(255, 215, 0);
        doc.text('Analytics Report', pageWidth / 2, 25, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(200, 200, 200);
        doc.text(`Event: ${this.currentEvent!.title}`, pageWidth / 2, 38, { align: 'center' });

        // Date generated
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 45, {
          align: 'center',
        });

        // Summary Section
        let yPos = 65;
        doc.setFontSize(16);
        doc.setTextColor(255, 215, 0);
        doc.text('Summary', 15, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        const summary = [
          ['Total Revenue', this.formatPrice(this.analytics!.totalRevenue)],
          ['Total Tickets Sold', this.analytics!.totalTicketsSold.toString()],
          ['Seat Occupancy', `${this.getOccupancyPercentage()}%`],
        ];

        for (const [label, value] of summary) {
          doc.setTextColor(100, 100, 100);
          doc.text(label + ':', 15, yPos);
          doc.setTextColor(30, 30, 30);
          doc.text(value, 80, yPos);
          yPos += 8;
        }

        // Ticket Breakdown Section
        yPos += 10;
        doc.setFontSize(16);
        doc.setTextColor(255, 215, 0);
        doc.text('Ticket Breakdown', 15, yPos);

        yPos += 10;
        doc.setFontSize(10);

        // Table header
        doc.setFillColor(45, 45, 45);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setTextColor(255, 215, 0);
        doc.text('Ticket Type', 20, yPos);
        doc.text('Sold', 100, yPos);
        doc.text('Available', 130, yPos);
        doc.text('Revenue', 165, yPos);

        yPos += 10;
        doc.setTextColor(50, 50, 50);

        for (const ticket of this.currentEvent!.tickets) {
          const ticketData = this.analytics!.byTicketType[ticket.id] as
            | { sold: number; revenue: number }
            | undefined;
          const sold = ticketData?.sold || 0;
          const revenue = ticketData?.revenue || 0;

          doc.text(ticket.type, 20, yPos);
          doc.text(sold.toString(), 100, yPos);
          doc.text((ticket.total - sold).toString(), 130, yPos);
          doc.text(this.formatPrice(revenue), 165, yPos);
          yPos += 8;
        }

        // Event Details Section
        yPos += 15;
        doc.setFontSize(16);
        doc.setTextColor(255, 215, 0);
        doc.text('Event Details', 15, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        const eventDetails = [
          ['Date', this.currentEvent!.date],
          ['Time', this.currentEvent!.time],
          ['Location', this.currentEvent!.location],
          [
            'Status',
            this.currentEvent!.status.charAt(0).toUpperCase() + this.currentEvent!.status.slice(1),
          ],
        ];

        for (const [label, value] of eventDetails) {
          doc.setTextColor(100, 100, 100);
          doc.text(label + ':', 15, yPos);
          doc.setTextColor(30, 30, 30);
          doc.text(value, 50, yPos);
          yPos += 8;
        }

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('EMS - Event Management System', pageWidth / 2, footerY, { align: 'center' });

        // Save PDF
        const filename = `analytics_${this.currentEvent!.title.replace(/\s+/g, '_')}_${
          new Date().toISOString().split('T')[0]
        }.pdf`;
        doc.save(filename);

        this.isGeneratingPDF = false;
        this.zone.run(() => this.cdr.detectChanges());
      })
      .catch((err) => {
        console.error('Failed to generate PDF:', err);
        this.isGeneratingPDF = false;
        this.zone.run(() => this.cdr.detectChanges());
      });
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  getTopTicketType(): { type: string; sold: number; revenue: number } | null {
    if (!this.analytics) return null;

    let topTicket = { type: '', sold: 0, revenue: 0 };
    for (const [ticketId, data] of Object.entries(this.analytics.byTicketType)) {
      const ticketData = data as { sold: number; revenue: number };
      if (ticketData.sold > topTicket.sold) {
        const ticket = this.currentEvent?.tickets.find((t) => t.id === ticketId);
        if (ticket) {
          topTicket = { type: ticket.type, sold: ticketData.sold, revenue: ticketData.revenue };
        }
      }
    }
    return topTicket.type ? topTicket : null;
  }

  getOccupancyPercentage(): number {
    // Calculate occupancy from actual event ticket data for accuracy
    if (!this.currentEvent) return 0;

    const totalSeats = this.currentEvent.tickets.reduce((sum, t) => sum + t.total, 0);
    const totalSold = this.currentEvent.tickets.reduce((sum, t) => sum + t.sold, 0);

    if (totalSeats === 0) return 0;
    return Math.round((totalSold / totalSeats) * 100);
  }

  getBookingsByPeriod(): any[] {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.bookingsByDate).map(([date, data]: any) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));
  }

  getStatementText(): string {
    return `Total Revenue (${
      this.selectedTimePeriod.charAt(0).toUpperCase() + this.selectedTimePeriod.slice(1)
    })`;
  }

  getStatementValue(): string {
    if (!this.analytics) return '$0';
    return this.formatPrice(this.analytics.totalRevenue);
  }
}
