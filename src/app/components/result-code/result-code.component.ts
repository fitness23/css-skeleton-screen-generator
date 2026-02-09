import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-result-code',
  standalone: true,
  templateUrl: './result-code.component.html'
})
export class ResultCodeComponent {
  @Input({ required: true }) generatedCss!: string;
  @Input({ required: true }) randomSkeletonName!: string;

  copyStatus = signal<'css' | 'html' | null>(null);

  copyCss(): void {
    this.copyToClipboard(this.generatedCss, 'css');
  }

  copyHtml(): void {
    const html = `<div class="skeleton-${this.randomSkeletonName}"></div>`;
    this.copyToClipboard(html, 'html');
  }

  private copyToClipboard(text: string, status: 'css' | 'html'): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => this.setCopyStatus(status));
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.setCopyStatus(status);
  }

  private setCopyStatus(status: 'css' | 'html'): void {
    this.copyStatus.set(status);
    window.setTimeout(() => {
      this.copyStatus.set(null);
    }, 1500);
  }
}
