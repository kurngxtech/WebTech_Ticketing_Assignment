import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonCardComponent } from './skeleton-card';

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonCardComponent],
  template: `
    <div class="skeleton-list" [class.grid]="grid" [class.horizontal]="horizontal">
      <app-skeleton-card
        *ngFor="let item of items"
        [imageHeight]="imageHeight"
        [showSubtitle]="showSubtitle"
        [lines]="lines"
        [showButton]="showButton"
        [horizontal]="horizontal"
      ></app-skeleton-card>
    </div>
  `,
  styles: [
    `
      .skeleton-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .skeleton-list.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
      }

      .skeleton-list.horizontal {
        flex-direction: column;
      }
    `,
  ],
})
export class SkeletonListComponent {
  @Input() count = 3;
  @Input() grid = false;
  @Input() horizontal = false;
  @Input() imageHeight = 180;
  @Input() showSubtitle = true;
  @Input() lines = 2;
  @Input() showButton = true;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
