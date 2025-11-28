import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem, TicketCategory } from '../../data-event-service/data-event';
import { User } from '../../auth/auth.types';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-event.html',
  styleUrls: ['./create-event.css']
})
export class CreateEvent implements OnInit {
  currentUser: User | null = null;
  currentStep: 'basic' | 'tickets' | 'seating' | 'promo' | 'review' = 'basic';
  isEditMode = false;
  eventId: number | null = null;
  event: EventItem | null = null;

  basicForm!: FormGroup;
  ticketForm!: FormGroup;
  promoForm!: FormGroup;

  ticketCategories: TicketCategory[] = [];
  sections = ['VIP', 'PREMIUM', 'GENERAL', 'PROMO'];
  promotionalCodes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private eventService: DataEventService,
    private router: Router,
    private route: ActivatedRoute
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
      price: ['', [Validators.required, Validators.min(1000)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      section: ['GENERAL', Validators.required],
    });

    this.promoForm = this.fb.group({
      code: ['', Validators.required],
      discount: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      expiryDate: ['', Validators.required],
    });
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.eventId = parseInt(params['id']);
        const existingEvent = this.eventService.getEventById(this.eventId);
        if (existingEvent) {
          this.event = { ...existingEvent };
          this.loadEventData();
        }
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
    switch(step) {
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

    const newTicket: TicketCategory = {
      id: `ticket_${Date.now()}`,
      type: this.ticketForm.value.ticketType,
      price: this.ticketForm.value.price,
      total: this.ticketForm.value.quantity,
      sold: 0,
      section: this.ticketForm.value.section,
    };

    if (this.ticketCategories.find(t => t.type === newTicket.type)) {
      alert('Ticket type already exists');
      return;
    }

    this.ticketCategories.push(newTicket);
    this.ticketForm.reset({ section: 'GENERAL' });
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
      alert('Please complete all required fields');
      return;
    }

    const eventData: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'> = {
      img: this.basicForm.value.img,
      title: this.basicForm.value.title,
      description: this.basicForm.value.description,
      date: this.basicForm.value.date,
      price: Math.min(...this.ticketCategories.map(t => t.price)),
      organizer: this.currentUser!.fullName,
      organizerId: this.currentUser!.id,
      time: this.basicForm.value.time,
      location: this.basicForm.value.location,
      tickets: this.ticketCategories,
      promotionalCodes: this.promotionalCodes.length > 0 ? this.promotionalCodes : undefined,
      status: 'active',
    };

    if (this.isEditMode && this.eventId !== null) {
      const updated = this.eventService.updateEvent(this.eventId, eventData);
      if (updated) {
        alert('Event updated successfully!');
        this.router.navigate(['/eo']);
      }
    } else {
      const created = this.eventService.createEvent(eventData);
      if (created) {
        alert('Event created successfully!');
        this.router.navigate(['/eo']);
      }
    }
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }

  private getInvalidFields(form: FormGroup): string[] {
    const invalidFields: string[] = [];
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.invalid) {
        invalidFields.push(this.getFieldLabel(key));
      }
    });

    return invalidFields;
  }

  private getFieldLabel(fieldName: string): string {
    const fieldLabels: { [key: string]: string } = {
      'title': 'Event Title',
      'description': 'Description',
      'date': 'Date',
      'time': 'Time',
      'location': 'Location',
      'img': 'Event Image URL',
      'ticketType': 'Ticket Type',
      'price': 'Price',
      'quantity': 'Total Seats',
      'section': 'Seating Section',
      'code': 'Promo Code',
      'discount': 'Discount (%)',
      'expiryDate': 'Expiry Date'
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
