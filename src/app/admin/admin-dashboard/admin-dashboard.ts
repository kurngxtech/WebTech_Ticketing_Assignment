import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DataEventService } from '../../data-event-service/data-event.service';
import { User } from '../../auth/auth.types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {
  currentUser: User | null = null;
  auditoriumStats: any = null;

  constructor(
    private authService: AuthService,
    private eventService: DataEventService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.authService.logout();
      return;
    }

    this.loadStats();
  }

  loadStats(): void {
    this.auditoriumStats = this.eventService.getAuditoriumAnalytics();
  }

  formatPrice(price: number): string {
    return this.eventService.formatPrice(price);
  }
}
