import { Component, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-tools',
  standalone: true,
  template: `
    <section class="page-container container">
      <h1 class="page-title">{{ t().tools.title }}</h1>
      <p class="page-subtitle">{{ t().tools.subtitle }}</p>
      <div class="content-placeholder">
        <span class="material-symbols-outlined icon">construction</span>
        <p>{{ t().tools.placeholder }}</p>
      </div>
    </section>
  `,
  styleUrl: './tools.scss'
})
export class ToolsComponent {
  private readonly languageService = inject(LanguageService);
  protected readonly t = this.languageService.translations;
}
