import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show) {
    <div class="spinner-overlay" [class.inline]="inline">
      <div class="spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      @if (message) {
      <p class="spinner-message">{{ message }}</p>
      }
    </div>
    }
  `,
  styles: [
    `
      .spinner-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9998;
      }

      .spinner-overlay.inline {
        position: relative;
        width: auto;
        height: auto;
        min-height: 100px;
        background: transparent;
        backdrop-filter: none;
      }

      .spinner {
        width: 60px;
        height: 60px;
        position: relative;
      }

      .spinner-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 4px solid transparent;
        border-radius: 50%;
        animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }

      .spinner-ring:nth-child(1) {
        border-top-color: #8b5cf6;
        animation-delay: -0.45s;
      }

      .spinner-ring:nth-child(2) {
        border-top-color: #a78bfa;
        animation-delay: -0.3s;
      }

      .spinner-ring:nth-child(3) {
        border-top-color: #c4b5fd;
        animation-delay: -0.15s;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .spinner-message {
        margin-top: 20px;
        color: white;
        font-size: 14px;
        text-align: center;
      }

      .inline .spinner-message {
        color: #6b7280;
      }
    `,
  ],
})
export class LoadingSpinner {
  @Input() show = false;
  @Input() message?: string;
  @Input() inline = false;
}
