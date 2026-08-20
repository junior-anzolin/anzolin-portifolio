import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found-container container">
      <span class="material-symbols-outlined icon">error</span>
      <h1 class="title">{{ t().notFound.title }}</h1>
      <p class="message">{{ t().notFound.message }}</p>
      <a routerLink="/" class="back-button">
        <span class="material-symbols-outlined">arrow_back</span>
        {{ t().notFound.backToHome }}
      </a>
    </section>
  `,
  styleUrl: './not-found.scss'
})
export class NotFoundComponent {
  private readonly languageService = inject(LanguageService);
  protected readonly t = this.languageService.translations;
}
