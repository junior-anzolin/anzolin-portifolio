import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnalyticsService } from './analytics.service';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root',
})
export class EasterEggsService {
  private readonly analytics = inject(AnalyticsService);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);
  protected readonly t = this.languageService.translations;

  private readonly easterEggsTranslations = computed(() => this.t().easterEggs);

  private readonly konamiCode = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'e',
    'a',
  ];

  private konamiIndex = 0;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.logConsole();
    this.initializeKonamiCode();
  }

  // TODO: become a billionaire
  private logConsole(): void {
    console.log(this.easterEggsTranslations().console);
  }

  private initializeKonamiCode(): void {
    window.addEventListener('keydown', (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === this.konamiCode[this.konamiIndex]) {
        this.konamiIndex++;

        if (this.konamiIndex === this.konamiCode.length) {
          this.showKonamiMessage();
          this.konamiIndex = 0;
        }

        return;
      }

      this.konamiIndex = key === this.konamiCode[0] ? 1 : 0;
    });
  }

  private showKonamiMessage(): void {
    this.analytics.track('easter_egg', {
      type: 'konami_code',
    });
    this.snackBar.open(
      this.easterEggsTranslations().konami,
      this.easterEggsTranslations().konamiClose,
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        announcementMessage: this.easterEggsTranslations().konami,
        direction: 'ltr',
      },
    );
  }
}
