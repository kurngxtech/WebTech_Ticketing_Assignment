import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-card" [class.horizontal]="horizontal">
      <!-- Image skeleton -->
      <div class="skeleton-image skeleton-pulse" [style.height.px]="imageHeight"></div>

      <!-- Content skeleton -->
      <div class="skeleton-content">
        <!-- Title -->
        <div class="skeleton-title skeleton-pulse"></div>

        <!-- Subtitle -->
        <div class="skeleton-subtitle skeleton-pulse" *ngIf="showSubtitle"></div>

        <!-- Lines -->
        <div class="skeleton-lines" *ngIf="lines > 0">
          <div
            class="skeleton-line skeleton-pulse"
            *ngFor="let line of lineArray"
            [style.width.%]="getLineWidth(line)"
          ></div>
        </div>

        <!-- Action button -->
        <div class="skeleton-button skeleton-pulse" *ngIf="showButton"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .skeleton-card {
        background: var(--content-bg, #1e1e1e);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-color, #333);
      }

      .skeleton-card.horizontal {
        display: flex;
        flex-direction: row;
      }

      .skeleton-card.horizontal .skeleton-image {
        width: 120px;
        min-width: 120px;
        height: 100%;
      }

      .skeleton-pulse {
        background: linear-gradient(
          90deg,
          var(--skeleton-base, #2d2d2d) 0%,
          var(--skeleton-highlight, #3d3d3d) 50%,
          var(--skeleton-base, #2d2d2d) 100%
        );
        background-size: 200% 100%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .skeleton-image {
        width: 100%;
        border-radius: 0;
      }

      .skeleton-content {
        padding: 16px;
        flex: 1;
      }

      .skeleton-title {
        height: 24px;
        width: 70%;
        border-radius: 4px;
        margin-bottom: 12px;
      }

      .skeleton-subtitle {
        height: 16px;
        width: 40%;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .skeleton-lines {
        margin: 16px 0;
      }

      .skeleton-line {
        height: 12px;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .skeleton-line:last-child {
        margin-bottom: 0;
      }

      .skeleton-button {
        height: 40px;
        width: 120px;
        border-radius: 8px;
        margin-top: 16px;
      }
    `,
  ],
})
export class SkeletonCardComponent {
  @Input() imageHeight = 180;
  @Input() showSubtitle = true;
  @Input() lines = 2;
  @Input() showButton = true;
  @Input() horizontal = false;

  get lineArray(): number[] {
    return Array.from({ length: this.lines }, (_, i) => i);
  }

  getLineWidth(index: number): number {
    // Vary line widths for natural look
    const widths = [100, 85, 70, 60, 90];
    return widths[index % widths.length];
  }
}
