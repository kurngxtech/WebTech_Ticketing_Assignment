import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

@Component({
  selector: 'app-eo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './eo-dashboard.html',
  styleUrls: ['./eo-dashboard.css']
})
export class EODashboard implements OnInit {
  currentUser: User | null = null;
  eoEvents: EventItem[] = [];
  isLoading = false;

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

  editEvent(event: EventItem): void {
    this.router.navigate(['/eo/event', event.id, 'edit']);
  }

  deleteEvent(event: EventItem): void {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      this.eventService.deleteEvent(event.id);
      this.loadEvents();
    }
  }

  viewAnalytics(event: EventItem): void {
    this.router.navigate(['/analytics'], { queryParams: { eventId: event.id } });
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'draft':
        return 'badge-warning';
      case 'completed':
        return 'badge-info';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getTotalTicketsSold(event: EventItem): number {
    return event.tickets.reduce((sum: number, t) => sum + t.sold, 0);
  }

  getTotalRevenue(event: EventItem): number {
    return event.tickets.reduce((sum: number, t) => sum + (t.sold * t.price), 0);
  }
}