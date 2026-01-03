import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <!-- Home link -->
        <li class="breadcrumb-item">
          <a routerLink="/" class="breadcrumb-link home">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L8.354 1.146z"
              />
            </svg>
            <span class="sr-only">Home</span>
          </a>
        </li>

        <!-- Dynamic items -->
        <li class="breadcrumb-item" *ngFor="let item of items; let last = last">
          <span class="breadcrumb-separator">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </span>

          <a *ngIf="item.path && !last" [routerLink]="item.path" class="breadcrumb-link">
            {{ item.label }}
          </a>

          <span
            *ngIf="!item.path || last"
            class="breadcrumb-current"
            [attr.aria-current]="last ? 'page' : null"
          >
            {{ item.label }}
          </span>
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      .breadcrumb-nav {
        padding: 12px 0;
        margin-bottom: 16px;
      }

      .breadcrumb-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 4px;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .breadcrumb-separator {
        color: var(--text-muted, #666);
        display: flex;
        align-items: center;
      }

      .breadcrumb-link {
        color: var(--primary-color, #ffd700);
        text-decoration: none;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s, color 0.2s;
      }

      .breadcrumb-link:hover {
        background-color: rgba(255, 215, 0, 0.1);
        text-decoration: none;
      }

      .breadcrumb-link.home {
        padding: 6px;
      }

      .breadcrumb-current {
        color: var(--text-color, #fff);
        font-size: 14px;
        padding: 4px 8px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @media (max-width: 576px) {
        .breadcrumb-link,
        .breadcrumb-current {
          font-size: 12px;
          padding: 2px 4px;
        }
      }
    `,
  ],
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
