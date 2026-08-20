import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly t = this.languageService.translations;
  protected readonly currentLang = this.languageService.currentLang;
  protected readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'pt-BR' ? 'en-US' : 'pt-BR';
    this.languageService.setLanguage(nextLang);
  }

  // Acessibilidade: fechar menu mobile com a tecla Escape
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }
}
