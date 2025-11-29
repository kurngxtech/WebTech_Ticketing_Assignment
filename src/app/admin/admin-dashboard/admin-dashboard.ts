import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
   selector: 'app-admin-dashboard',
   standalone: true,
   imports: [CommonModule, FormsModule, ReactiveFormsModule],
   templateUrl: './admin-dashboard.html',
   styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
   currentUser: User | null = null;
   registeredEOs: User[] = [];
   allEOEvents: EventItem[] = [];
   showRegistrationForm = false;
   registrationForm!: FormGroup;
   isSubmitting = false;
   registrationMessage = '';
   registrationSuccess = false;
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
      private fb: FormBuilder,
      private router: Router
   ) { }

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

   loadRegisteredEOs(): void {
      // Get all registered EO users
      const allUsers = this.authService.getAllUsers();
      this.registeredEOs = allUsers.filter((u: User) => u.role === 'eo') || [];
   }

   loadAllEOEvents(): void {
      this.isLoading = true;
      this.allEOEvents = [];

      // Get all events from all EOs
      for (const eo of this.registeredEOs) {
         const eoEvents = this.eventService.getEventsByOrganizer(eo.id);
         this.allEOEvents.push(...eoEvents);
      }

      this.calculateStats();
      this.isLoading = false;
   }

   calculateStats(): void {
      this.stats.totalEvents = this.allEOEvents.length;
      this.stats.activeEvents = this.allEOEvents.filter(e => e.status === 'active').length;
      this.stats.totalRevenue = 0;
      this.stats.totalTicketsSold = 0;

      for (const event of this.allEOEvents) {
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

   viewAnalytics(event: EventItem): void {
      this.closeEventMenu();
      this.router.navigate(['/analytics'], { queryParams: { eventId: event.id } });
   }

   getMaxChartValue(): number {
      return Math.max(...this.chartData.map(d => d.value), 1);
   }

   formatPrice(price: number): string {
      return this.eventService.formatPrice(price);
   }

   getTotalTicketsSold(event: EventItem): number {
      return event.tickets.reduce((sum: number, t) => sum + t.sold, 0);
   }

   getTotalRevenue(event: EventItem): number {
      return event.tickets.reduce((sum: number, t) => sum + (t.sold * t.price), 0);
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

      // Simulate sending email with welcome message, username, and default password
      setTimeout(() => {
         const formData = this.registrationForm.getRawValue();
         const newEO: User = {
            id: `eo-${Date.now()}`,
            fullName: formData.fullName as string,
            username: formData.username as string,
            email: formData.email as string,
            password: formData.password as string,
            phone: formData.phone as string,
            organizationName: (formData.organizationName as string) || 'N/A',
            role: 'eo',
            createdAt: new Date().toLocaleDateString(),
         };

         this.registeredEOs.push(newEO);
         this.registrationMessage = `Event Organizer "${formData.fullName}" registered successfully! A welcome email has been sent to ${formData.email} with login credentials.`;
         this.registrationSuccess = true;
         this.registrationForm.reset();

         // Hide success message after 4 seconds
         setTimeout(() => {
            this.registrationMessage = '';
            this.registrationSuccess = false;
            this.showRegistrationForm = false;
         }, 4000);

         this.isSubmitting = false;
      }, 800);
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