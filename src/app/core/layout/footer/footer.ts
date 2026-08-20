import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly t = this.languageService.translations;
  protected readonly currentYear = new Date().getFullYear();
}
