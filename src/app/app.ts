import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsService } from './core/services/analytics.service';
import { EasterEggsService } from './core/services/easter-egges.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly analytics = inject(AnalyticsService);
  protected readonly title = signal('Eloi Anzolin Filho');

  private readonly easterEggsService = inject(EasterEggsService);

  constructor() {
    this.easterEggsService.initialize();
  }
}
