import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

type ChartType = 'revenue' | 'tickets' | 'events';
type TimePeriod = 'daily' | 'weekly' | 'monthly';

interface ChartDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-eo-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eo-dashboard.html',
  styleUrls: ['./eo-dashboard.css']
})
export class EODashboard implements OnInit {
  currentUser: User | null = null;
  eoEvents: EventItem[] = [];
  isLoading = false;

  // Chart related properties
  selectedChartType: ChartType = 'revenue';
  selectedTimePeriod: TimePeriod = 'monthly';
  showChartOptions = false;
  showTimePeriodMenu = false;
  chartData: ChartDataPoint[] = [];
  chartDataPoints: Array<{ x: number; y: number }> = [];

  // Event menu tracking
  expandedEventMenuId: number | null = null;

  // Stats
  stats = {
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
  };

  constructor(
    private authService: AuthService,
    private eventService: DataEventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser || this.currentUser.role !== 'eo') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadEvents();
    this.generateChartData();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.eoEvents = this.eventService.getEventsByOrganizer(this.currentUser!.id);
    this.calculateStats();
    this.isLoading = false;
  }

  calculateStats(): void {
    this.stats.totalEvents = this.eoEvents.length;
    this.stats.activeEvents = this.eoEvents.filter(e => e.status === 'active').length;
    this.stats.totalRevenue = 0;
    this.stats.totalTicketsSold = 0;

    for (const event of this.eoEvents) {
      const analytics = this.eventService.generateEventAnalytics(event.id);
      if (analytics) {
        this.stats.totalRevenue += analytics.totalRevenue;
        this.stats.totalTicketsSold += analytics.totalTicketsSold;
      }
    }
  }

  generateChartData(): void {
    const periods = this.getPeriods(this.selectedTimePeriod);
    this.chartData = periods.map(period => ({
      label: period,
      value: this.getRandomChartValue()
    }));
    this.generateLineChartPoints();
  }

  generateLineChartPoints(): void {
    if (this.chartData.length === 0) return;
    
    const maxValue = this.getMaxChartValue();
    const chartWidth = 1000;
    const chartHeight = 300;
    const padding = 50;
    
    const pointSpacing = (chartWidth - 2 * padding) / (this.chartData.length - 1 || 1);
    
    this.chartDataPoints = this.chartData.map((data, index) => ({
      x: padding + index * pointSpacing,
      y: chartHeight - (data.value / maxValue) * (chartHeight - padding)
    }));
  }

  getChartLinePoints(): string {
    return this.chartDataPoints.map(p => `${p.x},${p.y}`).join(' ');
  }

  getPeriods(period: TimePeriod): string[] {
    if (period === 'daily') {
      return Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`);
    } else if (period === 'weekly') {
      return Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
    } else {
      return Array.from({ length: 12 }, (_, i) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[i];
      });
    }
  }

  getRandomChartValue(): number {
    return Math.floor(Math.random() * 1000) + 100;
  }

  getChartTitle(): string {
    switch (this.selectedChartType) {
      case 'events':
        return 'Total Events';
      case 'tickets':
        return 'Tickets Sold';
      case 'revenue':
      default:
        return 'Total Revenue';
    }
  }

  getStatementText(): string {
    const value = this.getStatementValue();
    const period = this.selectedTimePeriod;
    const type = this.getChartTitle().toLowerCase();
    
    return `You made ${value} in ${type} this ${period}`;
  }

  getStatementValue(): string {
    switch (this.selectedChartType) {
      case 'events':
        return this.stats.totalEvents.toString();
      case 'tickets':
        return this.stats.totalTicketsSold.toString();
      case 'revenue':
      default:
        return this.formatPrice(this.stats.totalRevenue);
    }
  }

  toggleChartOptions(): void {
    this.showChartOptions = !this.showChartOptions;
  }

  selectChartType(type: ChartType): void {
    this.selectedChartType = type;
    this.showChartOptions = false;
    this.generateChartData();
  }

  toggleTimePeriodMenu(): void {
    this.showTimePeriodMenu = !this.showTimePeriodMenu;
  }

  selectTimePeriod(period: TimePeriod): void {
    this.selectedTimePeriod = period;
    this.showTimePeriodMenu = false;
    this.generateChartData();
  }

  toggleEventMenu(eventId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.expandedEventMenuId = this.expandedEventMenuId === eventId ? null : eventId;
  }

  closeEventMenu(): void {
    this.expandedEventMenuId = null;
  }

  editEvent(event: EventItem): void {
    this.closeEventMenu();
    this.router.navigate(['/eo/event', event.id, 'edit']);
  }

  deleteEvent(event: EventItem): void {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      this.eventService.deleteEvent(event.id);
      this.loadEvents();
      this.closeEventMenu();
    }
  }

  viewAnalytics(event: EventItem): void {
    this.closeEventMenu();
    this.router.navigate(['/analytics'], { queryParams: { eventId: event.id } });
  }

  createNewEvent(): void {
    this.router.navigate(['/eo/create-event']);
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-active';
      case 'draft':
        return 'badge-draft';
      case 'completed':
        return 'badge-completed';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'draft':
        return 'Draft';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getTotalTicketsSold(event: EventItem): number {
    return event.tickets.reduce((sum: number, t) => sum + t.sold, 0);
  }

  getTotalRevenue(event: EventItem): number {
    return event.tickets.reduce((sum: number, t) => sum + (t.sold * t.price), 0);
  }

  getEventTicketCategories(event: EventItem): Array<{ name: string; sold: number; percentage: number }> {
    const total = this.getTotalTicketsSold(event);
    return event.tickets.map(t => ({
      name: t.type || 'Standard',
      sold: t.sold,
      percentage: total > 0 ? (t.sold / total) * 100 : 0
    }));
  }

  getMaxChartValue(): number {
    return Math.max(...this.chartData.map(d => d.value), 1);
  }
}