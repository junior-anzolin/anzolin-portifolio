import { Component, computed, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { TableOfContentsComponent } from '../../shared/components/table-of-contents/table-of-contents';

interface TimelineJob {
  company: string;
  role: string;
  period: string;
  desc: string;
  bullets: string[];
  subSections?: { title: string; bullets: string[] }[];
  techs?: string[];
  key: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, TableOfContentsComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  protected readonly t = this.languageService.translations;

  // Lista estruturada das experiências profissionais (Timeline) fortemente tipada
  protected readonly timelineJobs = computed<TimelineJob[]>(() => {
    const j = this.t().about.jobs;
    return [
      { ...j.atlas, key: 'atlas' } as TimelineJob,
      { ...j.adiante, key: 'adiante' } as TimelineJob,
      { ...j.savecashLead, key: 'savecashLead' } as TimelineJob,
      { ...j.savecashSenior, key: 'savecashSenior' } as TimelineJob,
      { ...j.totvs, key: 'totvs' } as TimelineJob,
      { ...j.marketEasy, key: 'marketEasy' } as TimelineJob,
      { ...j.aprova, key: 'aprova' } as TimelineJob,
    ];
  });

  // Lista estruturada de competências técnicas (Skills)
  protected readonly skillGroups = computed(() => {
    // TODO: add coffee support
    const sc = this.t().about.skillsCategories;

    return [
      {
        title: sc.leadership,
        skills: [
          'Hands-on leadership',
          'Mentoring',
          'Planning',
          'Estimation',
          'Code review',
          'Engineering standards',
          'Architectural decisions',
          'Technical direction',
          'Legacy refactoring',
          'Engineering / Product / Business alignment',
        ],
      },
      {
        title: sc.backend,
        skills: [
          'Node.js',
          'TypeScript',
          'NestJS',
          'Express',
          'TypeORM',
          'REST APIs',
          'Distributed systems',
          'Event-driven architecture',
          'Microservices',
          'Asynchronous processing',
          'Messaging & Queues',
          'Clean Architecture',
          'Domain-Driven Design',
          'Domain modeling',
          'Separation of concerns',
          'Performance',
          'Scalability',
          'Cost optimization',
        ],
      },
      {
        title: sc.cloud,
        skills: [
          'AWS Lambda',
          'AWS S3',
          'AWS SQS',
          'AWS RDS',
          'AWS API Gateway',
          'AWS CloudFront',
          'AWS Route 53',
          'AWS CDK',
          'Docker',
          'Kubernetes',
          'Serverless architecture',
        ],
      },
      {
        title: sc.frontend,
        skills: ['Angular', 'React', 'Next.js', 'React Native', 'Flutter', 'Ionic'],
      },
      {
        title: sc.security,
        skills: ['OpenID Connect (OIDC)', 'JWT', 'RBAC', 'Authentication & Authorization'],
      },
      {
        title: sc.data,
        skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
      },
    ];
  });

  ngOnInit(): void {
    // SEO
    this.titleService.setTitle('Sobre | Eloi Anzolin Filho');
    this.metaService.updateTag({
      name: 'description',
      content:
        'Conheça a trajetória profissional de Eloi Anzolin Filho, Tech Lead e Engenheiro de Software Full Stack com mais de 9 anos de experiência.',
    });
  }
}
