// src/app/home/body/body.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { Router } from '@angular/router';
import { DataEventService } from '../../data-event-service/data-event.spec';
import { EventItem } from '../../data-event-service/data-event';

register();

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './body.html',
  styleUrls: ['./body.css'],
})
export class Body implements AfterViewInit {
  activeIndex = 0;
  slides: EventItem[] = [];
  

  constructor(
    private host: ElementRef<HTMLElement>,
    private dataSrv: DataEventService,
    private router: Router
  ) {
    this.slides = this.dataSrv.getEvents();
  }

  get sortedSlides(): any[] {
    return [...this.slides].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
  }

  ngAfterViewInit(): void {
    const swiperEl = this.host.nativeElement.querySelector('swiper-container') as any;
    if (!swiperEl) return;

    const updateActive = () => {
      try {
        const idx = swiperEl.swiper?.activeIndex ?? 0;
        this.activeIndex = idx % this.swiperSlides.length;
      } catch {
        this.activeIndex = 0;
      }
    };

    swiperEl.addEventListener('slidechange', updateActive);
    swiperEl.addEventListener('swiperinitialized', updateActive);
    setTimeout(updateActive, 50);
  }

  goTo(index: number) {
    const slideData = this.slides[index];
    if (!slideData) return;
    // navigate to ticket page using id
    this.router.navigate(['/ticket', slideData.id]);
  }

  get swiperSlides(): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const s of this.sortedSlides) {
      const key = `${s.title}|${s.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(s);
      if (unique.length >= 4) break;
    }
    return unique;
  }

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

  // return display list: if search active show searchResults mapped to indices
  getDisplaySlides(): any[] {
    return this.getGridSlides();
  }
}
