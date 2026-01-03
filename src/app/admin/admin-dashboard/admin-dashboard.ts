import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  NgZone,
  HostListener,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';
import { SvgIcon } from '../../components/svg-icon/svg-icon';

type ChartType = 'revenue' | 'tickets' | 'events';
type TimePeriod = 'daily' | 'weekly' | 'monthly';

interface ChartDataPoint {
  label: string;
  value: number;
  ticketsSold: number;
  revenue: number;
  bookings: number;
  date: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SvgIcon],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit, AfterViewInit {
  currentUser: User | null = null;
  registeredEOs: User[] = [];
  allEOEvents: EventItem[] = [];
  showRegistrationForm = false;
  registrationForm!: FormGroup;
  isSubmitting = false;
  registrationMessage = '';
  registrationSuccess = false;
  isLoading = false;

  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

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

  // Tooltip
  hoveredPoint: ChartDataPoint | null = null;
  tooltipX = 0;
  tooltipY = 0;
  isLoadingChart = false;

  constructor(
    private authService: AuthService,
    private eventService: DataEventService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.initializeForm();
    this.loadRegisteredEOs();
    this.loadAllEOEvents();
    this.generateChartData();
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
      const timePeriodSection = target.closest('.time-period-section');
      if (!timePeriodSection) {
        this.showTimePeriodMenu = false;
        this.zone.run(() => this.cdr.detectChanges());
      }
    }
  }

  loadRegisteredEOs(): void {
    // Get all registered EO users from API
    this.authService.getEventOrganizersAsync().subscribe({
      next: (eos) => {
        this.registeredEOs = eos || [];
        this.loadAllEOEvents();
        this.zone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        console.error('Failed to load EOs:', err);
        this.registeredEOs = [];
        this.zone.run(() => this.cdr.detectChanges());
      },
    });
  }

  loadAllEOEvents(): void {
    this.isLoading = true;
    this.allEOEvents = [];

    // Get all events from API
    this.eventService.getEventsAsync().subscribe({
      next: (events) => {
        this.allEOEvents = events || [];
        this.calculateStats();
        this.isLoading = false;
        this.zone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.isLoading = false;
        this.zone.run(() => this.cdr.detectChanges());
      },
    });
  }

  calculateStats(): void {
    this.stats.totalEvents = this.allEOEvents.length;
    this.stats.activeEvents = this.allEOEvents.filter((e) => e.status === 'active').length;
    this.stats.totalRevenue = 0;
    this.stats.totalTicketsSold = 0;

    // Calculate stats from loaded events (tickets data is already populated)
    for (const event of this.allEOEvents) {
      for (const ticket of event.tickets) {
        this.stats.totalRevenue += ticket.sold * ticket.price;
        this.stats.totalTicketsSold += ticket.sold;
      }
    }
  }

  generateChartData(): void {
    this.loadChartData();
  }

  loadChartData(): void {
    this.isLoadingChart = true;
    this.eventService.getAuditoriumAnalyticsAsync(this.selectedTimePeriod).subscribe({
      next: (analytics) => {
        if (analytics && analytics.revenueByPeriod) {
          this.chartData = analytics.revenueByPeriod.map((item: any) => {
            // Format label based on period
            let label = item.period;
            if (this.selectedTimePeriod === 'daily') {
              // Format: YYYY-MM-DD -> Dec 25
              const date = new Date(item.period);
              label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (this.selectedTimePeriod === 'weekly') {
              // Format: YYYY-WXX -> Week XX
              const weekNum = item.period.split('-W')[1];
              label = `Week ${weekNum}`;
            } else {
              // Format: YYYY-MM -> Jan 2025
              const [year, month] = item.period.split('-');
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

            // Get value based on chart type
            let value = 0;
            if (this.selectedChartType === 'revenue') {
              value = item.revenue;
            } else if (this.selectedChartType === 'tickets') {
              value = item.ticketsSold;
            } else {
              value = item.bookings;
            }

            return {
              label,
              value,
              ticketsSold: item.ticketsSold,
              revenue: item.revenue,
              bookings: item.bookings,
              date: item.period,
            };
          });

          // Limit to last 5 data points for cleaner visualization
          if (this.chartData.length > 5) {
            this.chartData = this.chartData.slice(-5);
          }

          // Update summary stats from analytics
          if (analytics.summary) {
            this.stats.totalRevenue = analytics.summary.totalRevenue || 0;
            this.stats.totalTicketsSold = analytics.summary.totalTicketsSold || 0;
          }
        } else {
          // Fallback to empty data
          this.chartData = [];
        }
        this.generateLineChartPoints();
        this.isLoadingChart = false;
        this.zone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        console.error('Failed to load chart data:', err);
        this.chartData = [];
        this.isLoadingChart = false;
        this.zone.run(() => this.cdr.detectChanges());
      },
    });
  }

  onChartPointHover(point: ChartDataPoint, event: MouseEvent, index: number): void {
    this.hoveredPoint = point;
    const chartWidth = 1000;
    const tooltipWidth = 200;
    const padding = 50; // Chart padding
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
    if (pointY < 80) {
      this.tooltipY = pointY + 20; // Show below point
    } else {
      this.tooltipY = pointY - 60; // Show above point
    }
  }

  onChartPointLeave(): void {
    this.hoveredPoint = null;
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
      y: chartHeight - (data.value / maxValue) * (chartHeight - padding),
    }));
  }

  getChartLinePoints(): string {
    return this.chartDataPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }

  getPeriods(period: TimePeriod): string[] {
    if (period === 'daily') {
      return Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`);
    } else if (period === 'weekly') {
      return Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
    } else {
      return Array.from({ length: 12 }, (_, i) => {
        const months = [
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

    return `Auditorium made ${value} in ${type} this ${period}`;
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
    this.zone.run(() => this.cdr.detectChanges());
  }

  selectChartType(type: ChartType): void {
    this.selectedChartType = type;
    this.showChartOptions = false;
    this.generateChartData();
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

  viewAnalytics(event: EventItem): void {
    this.closeEventMenu();
    this.router.navigate(['/analytics'], { queryParams: { eventId: event.id } });
  }

  getMaxChartValue(): number {
    return Math.max(...this.chartData.map((d) => d.value), 1);
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  getTotalTicketsSold(event: EventItem): number {
    return event.tickets.reduce((sum: number, t) => sum + t.sold, 0);
  }

  getTotalRevenue(event: EventItem): number {
    return event.tickets.reduce((sum: number, t) => sum + t.sold * t.price, 0);
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

  logout(): void {
    this.eventService.clearCache(); // Clear cached data
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Registration Methods
  initializeForm(): void {
    this.registrationForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\(\)\s]+$/)]],
        organizationName: [''],
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator.bind(this) }
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  toggleRegistrationForm(): void {
    this.showRegistrationForm = !this.showRegistrationForm;
    if (!this.showRegistrationForm) {
      this.registrationForm.reset();
      this.registrationMessage = '';
      this.registrationSuccess = false;
    }
  }

  registerEventOrganizer(): void {
    if (!this.registrationForm.valid) {
      this.registrationMessage = 'Please fill in all required fields correctly.';
      this.registrationSuccess = false;
      return;
    }

    this.isSubmitting = true;
    const formData = this.registrationForm.value;

    // Check for duplicate username or email
    const isDuplicateUsername = this.registeredEOs.some(
      (eo) => eo.username.toLowerCase() === formData.username.toLowerCase()
    );
    const isDuplicateEmail = this.registeredEOs.some(
      (eo) => eo.email.toLowerCase() === formData.email.toLowerCase()
    );

    if (isDuplicateUsername || isDuplicateEmail) {
      this.registrationMessage = isDuplicateUsername
        ? `Username "${formData.username}" is already registered by another user.`
        : `Email "${formData.email}" is already registered by another user.`;
      this.registrationSuccess = false;
      this.isSubmitting = false;
      return;
    }

    // Use API to register EO
    this.authService
      .registerEventOrganizerAsync({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        organizationName: formData.organizationName || 'N/A',
        username: formData.username,
        password: formData.password,
      })
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.registrationMessage = `Event Organizer "${formData.fullName}" registered successfully! A welcome email has been sent to ${formData.email} with login credentials.`;
            this.registrationSuccess = true;
            this.registrationForm.reset();
            this.loadRegisteredEOs(); // Reload EOs

            // Hide success message after 4 seconds
            setTimeout(() => {
              this.registrationMessage = '';
              this.registrationSuccess = false;
              this.showRegistrationForm = false;
            }, 4000);
          } else {
            this.registrationMessage = result.message || 'Registration failed';
            this.registrationSuccess = false;
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          this.registrationMessage = 'Registration failed. Please try again.';
          this.registrationSuccess = false;
          this.isSubmitting = false;
        },
      });
  }

  removeEventOrganizer(eoId: string): void {
    if (confirm('Are you sure you want to remove this Event Organizer?')) {
      this.registeredEOs = this.registeredEOs.filter((eo) => eo.id !== eoId);
    }
  }

  showValidationError(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getInvalidFields(): string[] {
    const fields: string[] = [];
    Object.keys(this.registrationForm.controls).forEach((key) => {
      const control = this.registrationForm.get(key);
      if (control && control.invalid && (control.dirty || control.touched)) {
        fields.push(this.getFieldLabel(key));
      }
    });
    return fields;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      organizationName: 'Organization Name',
      username: 'Username',
      password: 'Password',
      confirmPassword: 'Confirm Password',
    };
    return labels[fieldName] || fieldName;
  }
}
