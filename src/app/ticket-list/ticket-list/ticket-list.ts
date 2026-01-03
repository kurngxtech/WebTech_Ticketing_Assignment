import {
  Component,
  ElementRef,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { Router } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.service';
import { EventItem } from '../../data-event-service/data-event';
import { SvgIcon } from '../../components/svg-icon/svg-icon';
// Pendaftaran Swiper di sini tidak diperlukan untuk tampilan list/grid sederhana ini,
// tetapi saya biarkan jika komponen ini juga akan digunakan untuk tampilan lain.
register();

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  // Saya hilangkan CUSTOM_ELEMENTS_SCHEMA karena kita tidak menggunakan Swiper di HTML ini
  // Jika Anda ingin menggunakannya, biarkan saja.
  // schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './ticket-list.html',
  styleUrls: ['./ticket-list.css'],
})
export class TicketList implements AfterViewInit, OnInit {
  // Tambahkan properti untuk mengontrol layout (true = list, false = grid)
  isListView: boolean = true;
  slides: EventItem[] = [];

  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  constructor(
    private host: ElementRef<HTMLElement>,
    private dataSrv: DataEventService,
    private router: Router
  ) {
    // Data loading moved to ngOnInit
  }

  ngOnInit(): void {
    this.dataSrv.getEventsAsync().subscribe({
      next: (events) => {
        this.slides = events;
        this.zone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        console.error('Failed to load events in TicketList:', err);
        this.slides = [];
        this.zone.run(() => this.cdr.detectChanges());
      },
    });
  }

  // Dipertahankan sesuai kode TS Anda, meski tidak digunakan langsung di HTML List/Grid ini
  get sortedSlides(): any[] {
    return [...this.slides].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
  }

  ngAfterViewInit(): void {
    // Tidak ada Swiper, jadi fungsi ini bisa dikosongkan/dihapus
    // Saya biarkan kosong agar sesuai dengan template Anda
  }

  // Fungsi navigasi yang sudah Anda sediakan
  goTo(index: number) {
    const slideData = this.slides[index];
    if (!slideData) return;
    // navigate to ticket page using id
    this.router.navigate(['/ticket', slideData.id]);
  }

  // Check if an event is sold out (all tickets sold)
  isSoldOut(event: EventItem): boolean {
    if (!event.tickets || event.tickets.length === 0) return false;
    return event.tickets.every((ticket) => ticket.sold >= ticket.total);
  }

  // Get remaining tickets count for an event
  getRemainingTickets(event: EventItem): number {
    if (!event.tickets || event.tickets.length === 0) return 0;
    return event.tickets.reduce((sum, t) => sum + (t.total - t.sold), 0);
  }

  // Fungsi untuk mendapatkan data event yang unik, diurutkan, dan dipetakan ke indeks.
  getGridSlides(): any[] {
    const seen = new Set<string>();
    const order: number[] = [];
    for (const s of this.sortedSlides) {
      const key = `${s.title}|${s.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const idx = this.slides.findIndex((x) => x.title === s.title && x.date === s.date);
      if (idx >= 0) order.push(idx);
    }
    return order.map((i) => ({ index: i, data: this.slides[i] }));
  }

  // Mengganti tampilan layout
  setLayout(isList: boolean) {
    this.isListView = isList;
  }

  // return display list: sama dengan getGridSlides()
  getDisplaySlides(): any[] {
    return this.getGridSlides();
  }
}
