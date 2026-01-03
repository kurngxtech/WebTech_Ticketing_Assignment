import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
  standalone: true,
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input('appLazyLoad') src: string = '';
  @Input() placeholderSrc: string =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect fill="%232d2d2d" width="300" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ELoading...%3C/text%3E%3C/svg%3E';

  private intersectionObserver?: IntersectionObserver;
  private hasLoaded = false;

  constructor(private el: ElementRef<HTMLImageElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Check if browser supports IntersectionObserver
    if ('IntersectionObserver' in window) {
      this.setupLazyLoading();
    } else {
      // Fallback: load immediately
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupLazyLoading(): void {
    const img = this.el.nativeElement;

    // Set placeholder
    this.renderer.setAttribute(img, 'src', this.placeholderSrc);
    this.renderer.addClass(img, 'lazy-loading');

    // Native lazy loading attribute
    this.renderer.setAttribute(img, 'loading', 'lazy');

    // IntersectionObserver for more control
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasLoaded) {
            this.loadImage();
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before visible
        threshold: 0.1,
      }
    );

    this.intersectionObserver.observe(img);
  }

  private loadImage(): void {
    if (this.hasLoaded) return;
    this.hasLoaded = true;

    const img = this.el.nativeElement;

    // Create a temporary image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      this.renderer.setAttribute(img, 'src', this.src);
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-loaded');
    };

    tempImg.onerror = () => {
      // Keep placeholder on error
      this.renderer.addClass(img, 'lazy-error');
    };

    tempImg.src = this.src;

    // Cleanup observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
