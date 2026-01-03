import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// SVG Icon component with Lucide-style icons
// Replaces all emoji usage across the application
@Component({
  selector: 'app-svg-icon',
  standalone: true,
  imports: [CommonModule],
  template: ` <span class="svg-icon-wrapper" [innerHTML]="getSafeIcon()"></span> `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
      }
      .svg-icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      :host ::ng-deep svg {
        flex-shrink: 0;
      }
    `,
  ],
})
export class SvgIcon {
  @Input() name: string = '';
  @Input() size: number = 20;
  @Input() color: string = 'currentColor';

  private sanitizer = inject(DomSanitizer);

  private icons: { [key: string]: string } = {
    // Ticket icon (🎫)
    ticket: `
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M13 5v2"/>
      <path d="M13 17v2"/>
      <path d="M13 11v2"/>
    `,
    // Location/Map Pin icon (📍)
    location: `
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    `,
    // Calendar icon (📅)
    calendar: `
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    `,
    // Money/Currency icon (💰)
    money: `
      <line x1="12" x2="12" y1="2" y2="22"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    `,
    // Email/Mail icon (📧)
    email: `
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    `,
    // Phone icon (📱)
    phone: `
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
      <path d="M12 18h.01"/>
    `,
    // Building/Organization icon (🏢)
    building: `
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    `,
    // Clipboard/Bookings icon (📋)
    clipboard: `
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M12 11h4"/>
      <path d="M12 16h4"/>
      <path d="M8 11h.01"/>
      <path d="M8 16h.01"/>
    `,
    // Trash/Delete icon (🗑)
    trash: `
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    `,
    // Edit/Pencil icon (✎)
    edit: `
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    `,
    // Chart/Analytics icon (📊)
    chart: `
      <line x1="18" x2="18" y1="20" y2="10"/>
      <line x1="12" x2="12" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="14"/>
    `,
    // Door/Logout icon (🚪)
    logout: `
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" x2="9" y1="12" y2="12"/>
    `,
    // Camera/Image placeholder icon (📸)
    camera: `
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    `,
    // Close/X icon (✕)
    close: `
      <line x1="18" x2="6" y1="6" y2="18"/>
      <line x1="6" x2="18" y1="6" y2="18"/>
    `,
    // Menu horizontal icon (⋯)
    'menu-horizontal': `
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
    `,
    // Menu vertical icon (⋮)
    'menu-vertical': `
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    `,
    // Lock icon (🔐)
    lock: `
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    `,
    // Check/Success icon (✓)
    check: `
      <polyline points="20 6 9 17 4 12"/>
    `,
    // Check circle icon
    'check-circle': `
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    `,
    // Warning icon (⚠)
    warning: `
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" x2="12" y1="9" y2="13"/>
      <line x1="12" x2="12.01" y1="17" y2="17"/>
    `,
    // Info icon (ℹ)
    info: `
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="16" y2="12"/>
      <line x1="12" x2="12.01" y1="8" y2="8"/>
    `,
    // User icon
    user: `
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    `,
    // Plus icon
    plus: `
      <line x1="12" x2="12" y1="5" y2="19"/>
      <line x1="5" x2="19" y1="12" y2="12"/>
    `,
    // Refresh icon
    refresh: `
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
    `,
    // Download icon
    download: `
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" x2="12" y1="15" y2="3"/>
    `,
    // Filter icon
    filter: `
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    `,
    // Search icon
    search: `
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" x2="16.65" y1="21" y2="16.65"/>
    `,
    // Eye icon (for password visibility)
    eye: `
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    `,
    // Eye off icon
    'eye-off': `
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    `,
    // Clock icon
    clock: `
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    `,
    // Star icon
    star: `
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    `,
    // Arrow left (back)
    'arrow-left': `
      <line x1="19" x2="5" y1="12" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    `,
    // Arrow right
    'arrow-right': `
      <line x1="5" x2="19" y1="12" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    `,
    // Chevron down
    'chevron-down': `
      <polyline points="6 9 12 15 18 9"/>
    `,
    // Chevron up
    'chevron-up': `
      <polyline points="18 15 12 9 6 15"/>
    `,
    // QR Code
    'qr-code': `
      <rect width="5" height="5" x="3" y="3" rx="1"/>
      <rect width="5" height="5" x="16" y="3" rx="1"/>
      <rect width="5" height="5" x="3" y="16" rx="1"/>
      <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
      <path d="M21 21v.01"/>
      <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
      <path d="M3 12h.01"/>
      <path d="M12 3h.01"/>
      <path d="M12 16v.01"/>
      <path d="M16 12h1"/>
      <path d="M21 12v.01"/>
      <path d="M12 21v-1"/>
    `,
    // Seat/Chair
    seat: `
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
      <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/>
      <path d="M5 18v2"/>
      <path d="M19 18v2"/>
    `,
    // Credit card
    'credit-card': `
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    `,
  };

  getSafeIcon(): SafeHtml {
    const iconPath = this.icons[this.name] || this.icons['info'];
    const svgHtml = `
      <svg
        width="${this.size}"
        height="${this.size}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="${this.color}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="svg-icon icon-${this.name}"
      >${iconPath}</svg>
    `;
    return this.sanitizer.bypassSecurityTrustHtml(svgHtml);
  }
}
