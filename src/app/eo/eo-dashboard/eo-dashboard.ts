import { Component, OnInit, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';
import { SvgIcon } from '../../components/svg-icon/svg-icon';

@Component({
  selector: 'app-eo-dashboard',
  standalone: true,
  imports: [CommonModule, SvgIcon],
  templateUrl: './eo-dashboard.html',
  styleUrls: ['./eo-dashboard.css'],
})
export class EODashboard implements OnInit {
  currentUser: User | null = null;
  eoEvents: EventItem[] = [];
  isLoading = false;

  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  // Event menu tracking
  expandedEventMenuId: number | null = null;

  // Stats for display
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
    this.eventService.getEventsByOrganizerAsync(this.currentUser!.id).subscribe({
      next: (events) => {
        this.eoEvents = events || [];
        this.calculateStats();
        this.isLoading = false;
        this.zone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.eoEvents = [];
        this.isLoading = false;
        this.zone.run(() => this.cdr.detectChanges());
      },
    });
  }

  calculateStats(): void {
    this.stats.totalEvents = this.eoEvents.length;
    this.stats.activeEvents = this.eoEvents.filter((e) => e.status === 'active').length;
    this.stats.totalRevenue = 0;
    this.stats.totalTicketsSold = 0;

    // Calculate stats from loaded events (tickets data is already populated)
    for (const event of this.eoEvents) {
      for (const ticket of event.tickets) {
        this.stats.totalRevenue += ticket.sold * ticket.price;
        this.stats.totalTicketsSold += ticket.sold;
      }
    }
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
      this.eventService.deleteEventAsync(event.id.toString()).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadEvents();
          }
        },
        error: (err) => console.error('Delete failed:', err),
      });
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
    return event.tickets.reduce((sum: number, t) => sum + t.sold * t.price, 0);
  }

  getEventTicketCategories(
    event: EventItem
  ): Array<{ name: string; sold: number; percentage: number }> {
    const total = this.getTotalTicketsSold(event);
    return event.tickets.map((t) => ({
      name: t.type || 'Standard',
      sold: t.sold,
      percentage: total > 0 ? (t.sold / total) * 100 : 0,
    }));
  }

  logout(): void {
    this.eventService.clearCache(); // Clear cached data
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
