import { Component, computed, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AnalyticsService } from '../../core/services/analytics.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  protected readonly t = this.languageService.translations;

  // Computed lists to dynamically reflect language transitions reactively
  protected readonly professionalCases = computed(() => {
    const items = this.t().projects.items;
    return [
      { id: 'urbis', ...items.urbis, icon: 'map', ctaText: undefined },
      { id: 'slingui', ...items.slingui, icon: 'language', ctaText: undefined },
      { id: 'atlas', ...items.atlas, icon: 'rocket_launch', ctaText: undefined },
      { id: 'mybenk', ...items.mybenk, icon: 'account_balance', ctaText: undefined },
      { id: 'aprova', ...items.aprova, icon: 'domain', ctaText: undefined },
      { id: 'savecash', ...items.savecash, icon: 'savings', ctaText: undefined },
      {
        id: 'aetherkit',
        ...items.aetherkit,
        icon: 'rocket_launch',
        ctaText: items.aetherkit.ctaText,
      },
    ];
  });

  protected readonly personalCases = computed(() => {
    const items = this.t().projects.items;
    return [
      { id: 'drinks', ...items.drinks, icon: 'local_bar' },
      { id: 'bankingApiRest', ...items.bankingApiRest, icon: 'payments' },
      { id: 'wsFrontEndChallenge', ...items.wsFrontEndChallenge, icon: 'code' },
      { id: 'permissionStructure', ...items.permissionStructure, icon: 'admin_panel_settings' },
    ];
  });

  ngOnInit(): void {
    this.titleService.setTitle('Projetos | Eloi Anzolin Filho');
    this.metaService.updateTag({
      name: 'description',
      content:
        'Explore os produtos e cases de sucesso desenvolvidos por Eloi Anzolin Filho ao longo de sua carreira.',
    });
  }

  onProjectClick(id: string): void {
    console.log(
      `[ProjectsComponent] onProjectClick: Clique detectado no card do projeto id="${id}"`,
    );
    this.analyticsService.trackProjectClick(id);
  }

  onCtaClick(id: string, type: 'demo' | 'github', event: MouseEvent): void {
    console.log(
      `[ProjectsComponent] onCtaClick: Clique detectado no link CTA do projeto id="${id}", tipo="${type}"`,
    );
    event.stopPropagation(); // Prevent duplicate project_click event
    if (type === 'demo') {
      this.analyticsService.trackProjectDemoClick(id);
    } else {
      this.analyticsService.trackProjectGithubClick(id);
    }
  }
}
