import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  protected readonly t = this.languageService.translations;

  // Dynamic Hero alternation
  protected readonly currentTermIndex = signal(0);
  protected readonly isAnimating = signal(false);
  private animationIntervalId: any;

  ngOnInit(): void {
    // SEO
    this.titleService.setTitle('Eloi Anzolin Filho | Software Engineer');
    this.metaService.updateTag({
      name: 'description',
      content:
        'Portfólio pessoal de Eloi Anzolin Filho, Engenheiro de Software com mais de 9 anos de experiência.',
    });

    // Alternância de termos dinâmicos - somente no Navegador para compatibilidade total com SSG/SSR
    if (isPlatformBrowser(this.platformId)) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mediaQuery.matches) {
        this.startAlternator();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.animationIntervalId) {
      clearInterval(this.animationIntervalId);
    }
  }

  private startAlternator(): void {
    this.animationIntervalId = setInterval(() => {
      // Trigger a fade transition state
      this.isAnimating.set(true);

      setTimeout(() => {
        const terms = this.t().home.dynamicHeroTerms;
        this.currentTermIndex.update((idx) => (idx + 1) % terms.length);
        this.isAnimating.set(false);
      }, 300); // Tempo correspondente à metade do ciclo da animação CSS
    }, 2500); // 2.5 segundos para leitura extremamente confortável e elegante
  }
}
