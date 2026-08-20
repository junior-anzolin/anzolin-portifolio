import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LanguageCode, PT_BR, EN_US, TranslationType } from '../i18n/translations';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Default language is 'pt-BR'
  private readonly currentLangSignal = signal<LanguageCode>('pt-BR');

  constructor() {
    if (this.isBrowser) {
      const savedLang = localStorage.getItem('portfolio-lang') as LanguageCode;
      if (savedLang === 'pt-BR' || savedLang === 'en-US') {
        this.currentLangSignal.set(savedLang);
        this.updateHtmlLang(savedLang);
      }
    }
  }

  // Read-only signal for current language code
  readonly currentLang = this.currentLangSignal.asReadonly();

  // Read-only computed signal for the translation dictionary
  readonly translations = computed<TranslationType>(() => {
    return this.currentLangSignal() === 'en-US' ? EN_US : PT_BR;
  });

  // Method to set language
  setLanguage(lang: LanguageCode): void {
    this.currentLangSignal.set(lang);
    if (this.isBrowser) {
      localStorage.setItem('portfolio-lang', lang);
      this.updateHtmlLang(lang);
    }
  }

  private updateHtmlLang(lang: LanguageCode): void {
    if (this.isBrowser) {
      document.documentElement.lang = lang;
    }
  }
}
