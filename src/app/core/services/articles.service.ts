import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Article } from '../models/article.model';
import mediumArticles from '../i18n/medium-articles.json';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
  getArticles(): Observable<Article[]> {
    // Retorna os artigos estáticos sincronizados e gerados localmente durante o build (SSG)
    // Isso garante ZERO chamadas HTTP ao Medium ou a APIs em tempo de execução no browser!
    return of(mediumArticles as Article[]);
  }
}
