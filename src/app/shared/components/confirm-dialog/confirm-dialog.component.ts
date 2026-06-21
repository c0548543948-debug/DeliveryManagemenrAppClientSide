import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="dialog-overlay" (click)="onCancel()">
        <div class="dialog-box" (click)="$event.stopPropagation()">
          <h3 class="dialog-title">{{ title }}</h3>
          <p class="dialog-message">{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn btn-ghost" (click)="onCancel()">{{ cancelText || 'Cancel' }}</button>
            <button class="btn btn-danger" (click)="onConfirm()">{{ confirmText || 'Confirm' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .dialog-box { background: white; border-radius: 8px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
    .dialog-title { margin: 0 0 12px; font-size: 18px; font-weight: 600; }
    .dialog-message { margin: 0 0 20px; color: #555; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }
  `]
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel(): void { this.cancelled.emit(); }
}
