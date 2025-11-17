import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-body',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './body.html',
  styleUrl: './body.css',
})
export class Body implements AfterViewInit {
  // active index of the swiper
  activeIndex = 0;

  constructor(private host: ElementRef<HTMLElement>) {}

  slides: Array<any> = [
    {
      img: 'https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCu4eIkz_yqzeI-6dlXHrRCbf2i1w',
      title: 'Clean Bandit',
      description: 'Live in Jakarta - International Velodrome',
      date: '2025-11-26',
      price: 'Rp 450.000',
      link: 'https://www.youtube.com/watch?v=MecD9f8Dj6s',
    },
    {
      img: 'https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBxucgI_5xsBsbYqL3fPm7ewnMB2w',
      title: 'Sounderful',
      description: 'Festival Show',
      date: '2025-12-10',
      price: 'Rp 350.000',
      link: 'https://www.youtube.com/watch?v=VNpxBcYZZjQ',
    },
    {
      img: 'https://i.ytimg.com/vi/0pqyYN9LIgA/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLB8LQef5khhkVpP-UrMTsTlMdH-QA',
      title: 'Lampungphoria',
      description: 'Regional Concert',
      date: '2025-10-05',
      price: 'Rp 150.000',
      link: 'https://www.youtube.com/watch?v=0pqyYN9LIgA',
    },
    {
      img: 'https://i.ytimg.com/vi/nls2tWrKCLA/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLB6AOySOl8S0UU3oTOYsZFfLpI0UQ',
      title: 'Fortuna Fest',
      description: 'Annual Music Festival',
      date: '2025-09-20',
      price: 'Rp 250.000',
      link: 'https://www.youtube.com/watch?v=nls2tWrKCLA',
    },
    {
      img: 'https://i.ytimg.com/vi/Uc5l6eWgnVg/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAZ5ozgotD5O5qwzOsMGfhgyiQa2A',
      title: 'baru jir',
      description: 'Annual Music Festival',
      date: '2025-09-20',
      price: 'Rp 250.000',
      link: 'https://www.youtube.com/watch?v=Uc5l6eWgnVg',
    },
    {
      img: 'https://i.ytimg.com/vi/Uc5l6eWgnVg/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAZ5ozgotD5O5qwzOsMGfhgyiQa2A',
      title: 'baru jir',
      description: 'Annual Music Festival',
      date: '2025-09-20',
      price: 'Rp 250.000',
      link: 'https://www.youtube.com/watch?v=Uc5l6eWgnVg',
    },
    {
      img: 'https://i.ytimg.com/vi/Uc5l6eWgnVg/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAZ5ozgotD5O5qwzOsMGfhgyiQa2A',
      title: 'baru jir',
      description: 'Annual Music Festival',
      date: '2025-09-20',
      price: 'Rp 250.000',
      link: 'https://www.youtube.com/watch?v=Uc5l6eWgnVg',
    },
    {
      img: 'https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCu4eIkz_yqzeI-6dlXHrRCbf2i1w',
      title: 'Clean Bandit',
      description: 'Live in Jakarta - International Velodrome',
      date: '2025-11-26',
      price: 'Rp 450.000',
      link: 'https://www.youtube.com/watch?v=MecD9f8Dj6s',
    },
    {
      img: 'https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBxucgI_5xsBsbYqL3fPm7ewnMB2w',
      title: 'Sounderful',
      description: 'Festival Show',
      date: '2025-12-10',
      price: 'Rp 350.000',
      link: 'https://www.youtube.com/watch?v=VNpxBcYZZjQ',
    },
    {
      img: 'https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCu4eIkz_yqzeI-6dlXHrRCbf2i1w',
      title: 'Clean Bandit',
      description: 'Live in Jakarta - International Velodrome',
      date: '2025-11-26',
      price: 'Rp 450.000',
      link: 'https://www.youtube.com/watch?v=MecD9f8Dj6s',
    },
    {
      img: 'https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBxucgI_5xsBsbYqL3fPm7ewnMB2w',
      title: 'Sounderful',
      description: 'Festival Show',
      date: '2025-12-10',
      price: 'Rp 350.000',
      link: 'https://www.youtube.com/watch?v=VNpxBcYZZjQ',
    },
    {
      img: 'https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCu4eIkz_yqzeI-6dlXHrRCbf2i1w',
      title: 'Clean Bandit',
      description: 'Live in Jakarta - International Velodrome',
      date: '2025-11-26',
      price: 'Rp 450.000',
      link: 'https://www.youtube.com/watch?v=MecD9f8Dj6s',
    },
    {
      img: 'https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBxucgI_5xsBsbYqL3fPm7ewnMB2w',
      title: 'Sounderful',
      description: 'Festival Show',
      date: '2025-12-10',
      price: 'Rp 350.000',
      link: 'https://www.youtube.com/watch?v=VNpxBcYZZjQ',
    },
  ];

  // return slides sorted by date descending (newest first)
  get sortedSlides(): any[] {
    return [...this.slides].sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
  }

  // Index (in `slides`) of the newest slide
  get newestIndex(): number {
    const newest = this.sortedSlides[0];
    if (!newest) return 0;
    return this.slides.findIndex((s) => s.title === newest.title && s.date === newest.date);
  }

  ngAfterViewInit(): void {
    // attach listeners to swiper element to synchronize activeIndex
    const swiperEl = this.host.nativeElement.querySelector('swiper-container') as any;
    if (!swiperEl) return;

    const updateActive = () => {
      try {
        const idx = swiperEl.swiper?.activeIndex ?? 0;
        this.activeIndex = idx % this.slides.length;
      } catch {
        this.activeIndex = 0;
      }
    };

    swiperEl.addEventListener('slidechange', updateActive);
    swiperEl.addEventListener('swiperinitialized', updateActive);

    // initial sync
    setTimeout(updateActive, 50);
  }

  // Navigate swiper to the given slide index
  goTo(index: number) {
    const swiperEl = this.host.nativeElement.querySelector('swiper-container') as any;
    try {
      swiperEl.swiper?.slideTo(index);
    } catch {}
  }

  // Return unique array of slides for the grid sorted by newest first (no duplicates)
  getGridSlides(): any[] {
    const n = this.slides.length;
    if (n === 0) return [];
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

  onCardButtonClick(event: Event, index: number) {
    event.stopPropagation();
    this.goTo(index);
  }
}
