import { Component, inject, computed, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class ProjectsComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  protected readonly t = this.languageService.translations;

  // Computed lists to dynamically reflect language transitions reactively
  protected readonly professionalCases = computed(() => {
    const items = this.t().projects.items;
    return [
      { ...items.urbis, icon: 'map', ctaText: undefined },
      { ...items.slingui, icon: 'language', ctaText: undefined },
      { ...items.atlas, icon: 'rocket_launch', ctaText: undefined },
      { ...items.mybenk, icon: 'account_balance', ctaText: undefined },
      { ...items.aprova, icon: 'domain', ctaText: undefined },
      { ...items.savecash, icon: 'savings', ctaText: undefined },
      { ...items.aetherkit, icon: 'rocket_launch', ctaText: items.aetherkit.ctaText }
    ];
  });

  protected readonly personalCases = computed(() => {
    const items = this.t().projects.items;
    return [
      { ...items.drinks, icon: 'local_bar' }
    ];
  });

  ngOnInit(): void {
    this.titleService.setTitle('Projetos | Eloi Anzolin Filho');
    this.metaService.updateTag({ name: 'description', content: 'Explore os produtos e cases de sucesso desenvolvidos por Eloi Anzolin Filho ao longo de sua carreira.' });
  }
}
