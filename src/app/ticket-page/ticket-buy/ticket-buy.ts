// src/app/ticket-page/ticket-buy/ticket-buy.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.spec';
import { EventItem, TicketCategory } from '../../data-event-service/data-event';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-buy.html',
  styleUrls: ['./ticket-buy.css']
})
export class TicketBuy implements OnInit {
  event?: EventItem;
  eventId!: number;
  couponCode = '';
  appliedDiscount = 0;
  message = '';
  quantities: { [ticketId: string]: number } = {};

  constructor(private route: ActivatedRoute, private dataSrv: DataEventService, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (!idStr) {
        this.router.navigate(['/']);
        return;
      }
      this.eventId = Number(idStr);
      this.event = this.dataSrv.getEventById(this.eventId);
      if (!this.event) this.router.navigate(['/']);
      else {
        // initialize quantities for each ticket category
        for (const t of this.event.tickets) {
          this.quantities[t.id] = 1;
        }
      }
    });
  }

  applyCoupon(): void {
    this.appliedDiscount = this.dataSrv.applyCoupon(this.couponCode);
    this.message = this.appliedDiscount > 0 ? `Kupon diterapkan: ${this.appliedDiscount}%` : 'Kode kupon tidak valid';
  }

  getRemaining(t: TicketCategory) {
    return t.total - t.sold;
  }

  ticketPriceAfterDiscount(t: TicketCategory) {
    if (!t) return 0;
    const discount = Math.max(0, Math.min(100, this.appliedDiscount || 0));
    return Math.round(t.price * (1 - discount / 100));
  }

  purchase(ticket: TicketCategory, qty = 1) {
    if (this.getRemaining(ticket) < qty) {
      this.message = 'Tiket tidak cukup';
      return;
    }
    const result = this.dataSrv.buyTicket(this.eventId, ticket.id, qty);
    this.message = result.message;
    // refresh local ref
    this.event = this.dataSrv.getEventById(this.eventId);
    if (result.success) {
      const priceEach = this.ticketPriceAfterDiscount(ticket);
      const totalPaid = priceEach * qty;
      this.message = `Pembelian berhasil — ${qty} x ${ticket.type} — ${this.formattedPrice(totalPaid)}`;
    }
  }

  formattedPrice(priceNum: number) {
    return priceNum.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  }
}
