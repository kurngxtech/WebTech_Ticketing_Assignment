import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem, TicketCategory } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-event.html',
  styleUrls: ['./create-event.css'],
})
export class CreateEvent implements OnInit {
  currentUser: User | null = null;
  currentStep: 'basic' | 'tickets' | 'seating' | 'promo' | 'review' = 'basic';
  isEditMode = false;
  eventId: string | null = null;
  isLoading = false;
  event: EventItem | null = null;

  private cdr = inject(ChangeDetectorRef);

  basicForm!: FormGroup;
  ticketForm!: FormGroup;
  promoForm!: FormGroup;

  ticketCategories: TicketCategory[] = [];

  // Auditorium seating sections with max capacity
  sectionConfig = [
    { id: 'LF-A', name: 'LF-A (General)', category: 'Lower Foyer', maxSeats: 90, order: 1 },
    { id: 'VIP', name: 'VIP', category: 'Lower Foyer', maxSeats: 60, order: 2 },
    { id: 'LF-B', name: 'LF-B (General)', category: 'Lower Foyer', maxSeats: 90, order: 3 },
    { id: 'LF-C', name: 'LF-C (Premium)', category: 'Lower Foyer', maxSeats: 120, order: 4 },
    { id: 'B-A', name: 'B-A (General)', category: 'Balcony', maxSeats: 69, order: 5 },
    { id: 'B-B', name: 'B-B (General)', category: 'Balcony', maxSeats: 69, order: 6 },
    { id: 'B-C', name: 'B-C (General)', category: 'Balcony', maxSeats: 69, order: 7 },
  ];

  sections = this.sectionConfig.map((s) => s.name);
  promotionalCodes: any[] = [];
  showSeatMapPreview = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private eventService: DataEventService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'eo') {
      this.router.navigate(['/login']);
      return;
    }

    this.initializeForms();
    this.checkEditMode();
  }

  initializeForms(): void {
    this.basicForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', Validators.required],
      img: ['', Validators.required],
    });

    this.ticketForm = this.fb.group({
      ticketType: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      section: ['LF-A (General)', Validators.required],
    });

    this.promoForm = this.fb.group({
      code: ['', Validators.required],
      discount: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      expiryDate: ['', Validators.required],
    });
  }

  checkEditMode(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.eventId = params['id'];
        this.isLoading = true;

        // Load event from API
        this.eventService.getEventByIdAsync(this.eventId!).subscribe({
          next: (existingEvent) => {
            if (existingEvent) {
              this.event = { ...existingEvent };
              this.loadEventData();
            }
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to load event:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
            this.router.navigate(['/eo']);
          },
        });
      }
    });
  }

  loadEventData(): void {
    if (!this.event) return;

    this.basicForm.patchValue({
      title: this.event.title,
      description: this.event.description,
      date: this.event.date,
      time: this.event.time,
      location: this.event.location,
      img: this.event.img,
    });

    this.ticketCategories = [...this.event.tickets];
    if (this.event.promotionalCodes) {
      this.promotionalCodes = [...this.event.promotionalCodes];
    }
  }

  goToStep(step: 'basic' | 'tickets' | 'seating' | 'promo' | 'review'): void {
    // Validate current step before moving to next
    switch (step) {
      case 'basic':
        this.currentStep = step;
        break;
      case 'tickets':
        if (this.basicForm.valid) {
          this.currentStep = step;
        }
        break;
      case 'seating':
      case 'promo':
      case 'review':
        if (this.ticketCategories.length > 0) {
          this.currentStep = step;
        }
        break;
    }
  }

  addTicketCategory(): void {
    if (!this.ticketForm.valid) {
      this.showValidationError('ticket', this.ticketForm);
      return;
    }

    const sectionName = this.ticketForm.value.section;
    const requestedSeats = this.ticketForm.value.quantity;

    // Validate seat capacity
    const sectionInfo = this.sectionConfig.find((s) => s.name === sectionName);
    if (sectionInfo) {
      const usedSeats = this.getUsedSeatsInSection(sectionName);
      const availableSeats = sectionInfo.maxSeats - usedSeats;

      if (requestedSeats > availableSeats) {
        this.toast.warning(
          `Section "${sectionName}" only has ${availableSeats} seats available (max: ${sectionInfo.maxSeats}, used: ${usedSeats})`
        );
        return;
      }
    }

    const newTicket: TicketCategory = {
      id: `ticket_${Date.now()}`,
      type: this.ticketForm.value.ticketType,
      price: this.ticketForm.value.price,
      total: this.ticketForm.value.quantity,
      sold: 0,
      section: this.ticketForm.value.section,
    };

    if (this.ticketCategories.find((t) => t.type === newTicket.type)) {
      this.toast.warning('Ticket type already exists');
      return;
    }

    this.ticketCategories.push(newTicket);
    this.ticketForm.reset({ section: 'LF-A (General)' });
  }

  // Get seats already used in a section
  getUsedSeatsInSection(sectionName: string): number {
    return this.ticketCategories
      .filter((t) => t.section === sectionName)
      .reduce((sum, t) => sum + t.total, 0);
  }

  // Get max seats for a section
  getMaxSeatsForSection(sectionName: string): number {
    return this.sectionConfig.find((s) => s.name === sectionName)?.maxSeats || 0;
  }

  // Get available seats for selected section
  getAvailableSeatsForSelectedSection(): number {
    const section = this.ticketForm.value.section;
    if (!section) return 0;
    return this.getMaxSeatsForSection(section) - this.getUsedSeatsInSection(section);
  }

  // Toggle seat map preview
  toggleSeatMapPreview(): void {
    this.showSeatMapPreview = !this.showSeatMapPreview;
  }

  // Get sections grouped by category
  getSectionsByCategory(): {
    category: string;
    sections: { id: string; name: string; category: string; maxSeats: number; order: number }[];
  }[] {
    const groups: {
      [key: string]: {
        id: string;
        name: string;
        category: string;
        maxSeats: number;
        order: number;
      }[];
    } = {};
    for (const section of this.sectionConfig) {
      if (!groups[section.category]) {
        groups[section.category] = [];
      }
      groups[section.category].push(section);
    }
    return Object.keys(groups).map((cat) => ({ category: cat, sections: groups[cat] }));
  }

  removeTicketCategory(index: number): void {
    this.ticketCategories.splice(index, 1);
  }

  addPromotionalCode(): void {
    if (!this.promoForm.valid) {
      this.showValidationError('promotional code', this.promoForm);
      return;
    }

    const newPromo = {
      code: this.promoForm.value.code.toUpperCase(),
      discountPercentage: this.promoForm.value.discount,
      expiryDate: this.promoForm.value.expiryDate,
      applicableTicketTypes: [],
      maxUsage: 1000,
      usedCount: 0,
    };

    this.promotionalCodes.push(newPromo);
    this.promoForm.reset();
  }

  removePromo(index: number): void {
    this.promotionalCodes.splice(index, 1);
  }

  saveEvent(): void {
    if (!this.basicForm.valid || this.ticketCategories.length === 0) {
      this.toast.error('Please complete all required fields');
      return;
    }

    const eventData: Partial<EventItem> = {
      img: this.basicForm.value.img,
      title: this.basicForm.value.title,
      description: this.basicForm.value.description,
      date: this.basicForm.value.date,
      price: Math.min(...this.ticketCategories.map((t) => t.price)),
      organizer: this.currentUser!.fullName,
      organizerId: this.currentUser!.id,
      time: this.basicForm.value.time,
      location: this.basicForm.value.location,
      tickets: this.ticketCategories,
      promotionalCodes: this.promotionalCodes.length > 0 ? this.promotionalCodes : undefined,
      status: 'active',
    };

    this.isLoading = true;

    if (this.isEditMode && this.eventId !== null) {
      this.eventService.updateEventAsync(this.eventId, eventData).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.success) {
            this.toast.success('Event updated successfully!');
            this.router.navigate(['/eo']);
          } else {
            this.toast.error(result.message || 'Failed to update event');
          }
        },
        error: () => {
          this.isLoading = false;
          this.toast.error('Failed to update event');
        },
      });
    } else {
      this.eventService.createEventAsync(eventData).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.success) {
            this.toast.success('Event created successfully!');
            this.router.navigate(['/eo']);
          } else {
            this.toast.error(result.message || 'Failed to create event');
          }
        },
        error: () => {
          this.isLoading = false;
          this.toast.error('Failed to create event');
        },
      });
    }
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  private getInvalidFields(form: FormGroup): string[] {
    const invalidFields: string[] = [];

    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control && control.invalid) {
        invalidFields.push(this.getFieldLabel(key));
      }
    });

    return invalidFields;
  }

  private getFieldLabel(fieldName: string): string {
    const fieldLabels: { [key: string]: string } = {
      title: 'Event Title',
      description: 'Description',
      date: 'Date',
      time: 'Time',
      location: 'Location',
      img: 'Event Image URL',
      ticketType: 'Ticket Type',
      price: 'Price',
      quantity: 'Total Seats',
      section: 'Seating Section',
      code: 'Promo Code',
      discount: 'Discount (%)',
      expiryDate: 'Expiry Date',
    };

    return fieldLabels[fieldName] || fieldName;
  }

  private showValidationError(formName: string, form: FormGroup): void {
    const invalidFields = this.getInvalidFields(form);

    if (invalidFields.length > 0) {
      const fieldsText = invalidFields.join(', ');
      alert(`Please fill all ${formName} fields:\n\n${fieldsText}`);
    }
  }
}
