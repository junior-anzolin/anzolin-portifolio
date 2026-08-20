import { Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Article } from '../../core/models/article.model';
import { ArticlesService } from '../../core/services/articles.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
})
export class ArticlesComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly articlesService = inject(ArticlesService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  protected readonly t = this.languageService.translations;
  protected readonly currentLang = this.languageService.currentLang;

  // Sinal reativo contendo a lista de artigos obtidos no build (SSG)
  protected readonly articles = signal<Article[]>([]);

  // Conjunto para rastrear URLs de artigos cujas imagens falharam ao carregar no browser
  protected readonly failedImageUrls = signal<Set<string>>(new Set());

  ngOnInit(): void {
    // SEO
    this.titleService.setTitle('Artigos | Eloi Anzolin Filho');
    this.metaService.updateTag({
      name: 'description',
      content:
        'Explore publicações, artigos e discussões técnicas sobre engenharia de software e liderança desenvolvidas por Eloi Anzolin Filho.',
    });

    // Busca os posts via Medium RSS no build e hidrata no navegador (TransferState automática)
    this.articlesService.getArticles().subscribe((data) => {
      this.articles.set(data);
    });
  }

  handleImageError(articleUrl: string): void {
    this.failedImageUrls.update((prev) => {
      const next = new Set(prev);
      next.add(articleUrl);
      return next;
    });
  }

  shouldShowFallback(article: Article): boolean {
    return !article.imageUrl || this.failedImageUrls().has(article.url);
  }

  // Auxiliar resiliente para formatação de data localizada
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString(this.currentLang(), {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }
}
