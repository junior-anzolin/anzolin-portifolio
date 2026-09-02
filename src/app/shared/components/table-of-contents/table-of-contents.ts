import { Component, Input, OnInit, OnDestroy, AfterViewInit, inject, signal, effect, NgZone, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

export interface TocItem {
  id: string;
  title: string;
  parentId?: string | null;
  children?: TocItem[];
}

@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-of-contents.html',
  styleUrl: './table-of-contents.scss'
})
export class TableOfContentsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @Input({ required: true }) contentContainerSelector!: string;
  @Input() headerHeight = 70;
  @Input() scrollOffset = 24;
  @Input() title?: string;

  protected get displayTitle(): string {
    if (this.title) return this.title;
    const t = this.languageService.translations();
    return (t as any)?.about?.onThisPage || 'Nesta página';
  }

  protected readonly tocItems = signal<TocItem[]>([]);
  protected readonly activeId = signal<string | null>(null);
  protected readonly activeParentId = signal<string | null>(null);

  private observer?: IntersectionObserver;
  private isScrolling = false;
  private scrollTimeout?: any;

  constructor() {
    effect(() => {
      this.languageService.currentLang();
      if (this.isBrowser) {
        this.ngZone.runOutsideAngular(() => {
          setTimeout(() => this.buildTocItems(), 150);
        });
      }
    });
  }

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.buildTocItems();
      this.setupIntersectionObserver();
    }
  }
  ngOnDestroy(): void { this.cleanup(); }

  private buildTocItems(): void {
    if (!this.isBrowser) return;
    const container = document.querySelector(this.contentContainerSelector);
    if (!container) return;

    const elements = Array.from(container.querySelectorAll('[data-toc-item]')) as HTMLElement[];
    const itemsList: TocItem[] = [];
    const itemMap = new Map<string, TocItem>();

    elements.forEach((el) => {
      const id = el.id;
      if (!id) return;

      const titleAttr = el.getAttribute('data-toc-title');
      const title = titleAttr ? titleAttr.trim() : el.innerText.trim();
      const parentAttr = el.getAttribute('data-toc-item');
      const parentId = parentAttr && parentAttr !== 'true' && parentAttr !== '' ? parentAttr : null;

      const item: TocItem = { id, title, parentId, children: [] };
      itemMap.set(id, item);

      if (!parentId) {
        itemsList.push(item);
      } else {
        const parent = itemMap.get(parentId) || itemsList.find(p => p.id === parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        }
      }
    });

    this.ngZone.run(() => this.tocItems.set(itemsList));
  }

  private setupIntersectionObserver(): void {
    if (!this.isBrowser) return;
    this.cleanup();
    const container = document.querySelector(this.contentContainerSelector);
    if (!container) return;

    const targets = Array.from(container.querySelectorAll('[id]')).filter(el => 
      el.hasAttribute('data-toc-item') || el.hasAttribute('data-toc-associate')
    ) as HTMLElement[];

    if (targets.length === 0) return;

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver((entries) => {
        if (this.isScrolling) return;
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length === 0) return;

        const best = visible.reduce((prev, curr) => 
          curr.boundingClientRect.top < prev.boundingClientRect.top && curr.boundingClientRect.top >= this.headerHeight ? curr : prev
        , visible[0]);

        if (best?.target) {
          const targetEl = best.target as HTMLElement;
          let actId = targetEl.id;
          const assoc = targetEl.getAttribute('data-toc-associate');
          if (assoc) actId = assoc;

          const parentAttr = targetEl.getAttribute('data-toc-item');
          let parentIdValue = (parentAttr && parentAttr !== 'true' && parentAttr !== '') ? parentAttr : null;
          
          if (!parentIdValue) {
            const findParent = (list: TocItem[]): string | null => {
              for (const item of list) {
                if (item.children?.some(c => c.id === actId)) return item.id;
              }
              return null;
            };
            parentIdValue = findParent(this.tocItems());
          }

          this.ngZone.run(() => {
            this.activeId.set(actId);
            this.activeParentId.set(parentIdValue || (this.tocItems().some(i => i.id === actId) ? actId : null));
          });
        }
      }, {
        root: null,
        rootMargin: `-${this.headerHeight + 20}px 0px -60% 0px`,
        threshold: [0, 0.2, 0.5, 0.8, 1.0]
      });

      targets.forEach(el => this.observer?.observe(el));
    });
  }

  protected navigateToSection(event: Event, id: string): void {
    if (!this.isBrowser) return;
    event.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    this.isScrolling = true;
    clearTimeout(this.scrollTimeout);

    this.activeId.set(id);
    const parentAttr = element.getAttribute('data-toc-item');
    const parentId = (parentAttr && parentAttr !== 'true' && parentAttr !== '') ? parentAttr : null;
    this.activeParentId.set(parentId || (this.tocItems().some(i => i.id === id) ? id : null));

    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - this.headerHeight - this.scrollOffset;

    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    this.scrollTimeout = setTimeout(() => { this.isScrolling = false; }, 800);
  }

  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    clearTimeout(this.scrollTimeout);
  }
}
