import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type UmamiEventName =
  | 'cv_download'
  | 'github_click'
  | 'linkedin_click'
  | 'email_click'
  | 'project_click'
  | 'project_view'
  | 'project_github_click'
  | 'project_demo_click'
  | 'project_details_click'
  | 'navigation_click'
  | 'contact_click'
  | 'scroll_depth'
  | 'section_view'
  | 'page_engagement'
  | 'element_click';

export interface UmamiPayload {
  [key: string]: string | number | boolean | undefined;
}

interface Umami {
  track(eventName: UmamiEventName, data?: UmamiPayload): void;
  track(props: (defaultProps: UmamiPayload) => UmamiPayload): void;
  track(): void;
}

declare global {
  interface Window {
    umami?: Umami;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // UTM parameters and referrer cache
  private originalReferrer = '';
  private landingPage = '';
  private utmParams: Record<string, string> = {};

  // Trackers state to prevent duplication
  private trackedScrollDepths = new Set<number>();
  private trackedSections = new Set<string>();
  private activeTimeSeconds = 0;
  private trackedEngagementBuckets = new Set<string>();
  private activeTimerInterval: any = null;

  // Interaction observer for section tracking
  private sectionObserver: IntersectionObserver | null = null;

  constructor() {
    if (this.isBrowser) {
      this.initUtms();
      this.initRouteTracking();
      this.initClickTracking();
      this.initScrollTracking();
      this.initEngagementTracking();
      // Wait for DOM load or next tick to observe sections
      setTimeout(() => {
        this.initSectionTracking();
      }, 1000);
    }
  }

  /**
   * Safe track method interfacing with window.umami
   */
  track(eventName: UmamiEventName, data?: UmamiPayload): void {
    if (!this.isBrowser) return;

    const payload: UmamiPayload = {
      ...this.utmParams,
      original_referrer: this.originalReferrer,
      landing_page: this.landingPage,
      ...data
    };

    const umami = window.umami;
    console.log(`[Analytics] Enviando evento ao Umami: "${eventName}"`, {
      payload,
      umamiExists: !!umami
    });

    if (umami) {
      umami.track(eventName, payload);
    } else {
      console.warn(`[Analytics] window.umami não encontrado para o evento "${eventName}". Tentando agendar envio...`);
      // Fallback: wait and try again once
      setTimeout(() => {
        const delayedUmami = window.umami;
        console.log(`[Analytics] Tentativa tardia de envio para "${eventName}"`, {
          umamiExists: !!delayedUmami
        });
        if (delayedUmami) {
          delayedUmami.track(eventName, payload);
        } else {
          console.error(`[Analytics] Falha crítica: window.umami não disponível após 1s para "${eventName}"`);
        }
      }, 1000);
    }
  }

  /**
   * Tracks standard page view with page info and UTM preservation
   */
  trackPageView(): void {
    if (!this.isBrowser) return;

    const umami = window.umami;
    if (umami) {
      umami.track((props) => ({
        ...props,
        url: this.router.url,
        referrer: this.originalReferrer || props['referrer'],
        ...this.utmParams,
        landing_page: this.landingPage
      }));
    } else {
      setTimeout(() => {
        if (window.umami) {
          window.umami.track((props) => ({
            ...props,
            url: this.router.url,
            referrer: this.originalReferrer || props['referrer'],
            ...this.utmParams,
            landing_page: this.landingPage
          }));
        }
      }, 1000);
    }
  }

  /**
   * Specific explicit tracking for project card cliques
   */
  trackProjectClick(project: string): void {
    this.track('project_click', { project });
  }

  trackProjectDemoClick(project: string): void {
    this.track('project_demo_click', { project });
  }

  trackProjectGithubClick(project: string): void {
    this.track('project_github_click', { project });
  }

  /**
   * Capture UTMs from URL or sessionStorage to preserve session attribution
   */
  private initUtms(): void {
    this.originalReferrer = document.referrer || 'direct';
    this.landingPage = window.location.href;

    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const urlParams = new URLSearchParams(window.location.search);

    // Try to load preserved UTMs from sessionStorage first
    try {
      const stored = sessionStorage.getItem('portfolio_preserved_utms');
      if (stored) {
        this.utmParams = JSON.parse(stored);
      }
      const storedReferrer = sessionStorage.getItem('portfolio_original_referrer');
      if (storedReferrer) {
        this.originalReferrer = storedReferrer;
      }
      const storedLanding = sessionStorage.getItem('portfolio_landing_page');
      if (storedLanding) {
        this.landingPage = storedLanding;
      }
    } catch (e) {
      // Ignore storage errors
    }

    // Capture from URL if present (overwriting or setting for the first time)
    let hasNewUrlParams = false;
    utmKeys.forEach((key) => {
      const value = urlParams.get(key);
      if (value) {
        this.utmParams[key] = value;
        hasNewUrlParams = true;
      }
    });

    if (hasNewUrlParams) {
      try {
        sessionStorage.setItem('portfolio_preserved_utms', JSON.stringify(this.utmParams));
        sessionStorage.setItem('portfolio_original_referrer', this.originalReferrer);
        sessionStorage.setItem('portfolio_landing_page', this.landingPage);
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  /**
   * Listen for Angular router events to trigger manual page tracking
   */
  private initRouteTracking(): void {
    // Track initial page view
    this.trackPageView();

    // Track page views on route change
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        // Reset page-level metrics
        this.trackedScrollDepths.clear();
        this.activeTimeSeconds = 0;
        this.trackedEngagementBuckets.clear();

        this.trackPageView();

        // Re-evaluate sections since DOM changed
        setTimeout(() => {
          this.initSectionTracking();
        }, 800);
      });
  }

  /**
   * Universal high-performance click tracker using delegation
   */
  private initClickTracking(): void {
    document.addEventListener(
      'click',
      (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target) return;

        // Traverse up to find the closest anchor (link) or button
        const interactiveElement = target.closest('a, button') as HTMLElement | null;
        if (!interactiveElement) return;

        // CRITICAL: If click occurs inside a project-card, ignore global click tracking
        // to prevent double tracking since project clicks are now tracked explicitly on the template.
        if (interactiveElement.closest('.project-card')) {
          return;
        }

        const tag = interactiveElement.tagName.toLowerCase();
        const textLabel = (interactiveElement.textContent || interactiveElement.getAttribute('aria-label') || '').trim();
        const elementId = interactiveElement.id || undefined;

        // Find current section name if available
        const sectionContainer = interactiveElement.closest('section, footer, header, .about-section') as HTMLElement | null;
        let sectionName = 'body';
        if (sectionContainer) {
          sectionName = sectionContainer.className || sectionContainer.tagName.toLowerCase();
          if (interactiveElement.closest('header')) sectionName = 'header';
          else if (interactiveElement.closest('footer')) sectionName = 'footer';
          else if (interactiveElement.closest('.home-hero')) sectionName = 'hero';
          else if (interactiveElement.closest('.timeline-section')) sectionName = 'experience';
          else if (interactiveElement.closest('.skills-section')) sectionName = 'skills';
          else if (interactiveElement.closest('.about-page')) sectionName = 'about';
        }

        // 1. Semantic Check: Download of CV
        const href = interactiveElement.getAttribute('href') || '';
        const isCvDownload = href.toLowerCase().includes('cv') || href.toLowerCase().includes('resume') || href.endsWith('.pdf') || interactiveElement.hasAttribute('download');

        if (isCvDownload) {
          console.log(`[Analytics Click] Identificado download de CV: href="${href}"`);
          this.track('cv_download', {
            label: textLabel || 'Curriculum Vitae',
            destination: href,
            source_section: sectionName
          });
          return;
        }

        // 2. Semantic Check: GitHub Click
        const isGitHub = href.includes('github.com');
        if (isGitHub) {
          console.log(`[Analytics Click] Identificado clique no GitHub: href="${href}"`);
          this.track('github_click', {
            destination: href,
            label: textLabel || 'GitHub Profile',
            source_section: sectionName
          });
          return;
        }

        // 3. Semantic Check: LinkedIn Click
        const isLinkedIn = href.includes('linkedin.com');
        if (isLinkedIn) {
          console.log(`[Analytics Click] Identificado clique no LinkedIn: href="${href}"`);
          this.track('linkedin_click', {
            destination: href,
            label: textLabel || 'LinkedIn Profile',
            source_section: sectionName
          });
          return;
        }

        // 4. Semantic Check: Email Click
        const isEmail = href.startsWith('mailto:');
        if (isEmail) {
          console.log(`[Analytics Click] Identificado clique em Email mailto: href="${href}"`);
          this.track('email_click', {
            destination: href,
            label: textLabel || 'Contact Email',
            source_section: sectionName
          });
          return;
        }

        // 5. Semantic Check: Navigation / Route click
        const hasRouterLink = interactiveElement.hasAttribute('routerLink') || interactiveElement.hasAttribute('ng-reflect-router-link');
        if (hasRouterLink || href.startsWith('/')) {
          this.track('navigation_click', {
            destination: href || interactiveElement.getAttribute('routerLink') || '',
            label: textLabel,
            source_section: sectionName
          });
          return;
        }

        // 6. Generic interaction element_click tracking (only for buttons and real anchors)
        if (tag === 'button' || tag === 'a') {
          // Send viewport and interaction coordinates
          this.track('element_click', {
            element: tag,
            element_id: elementId,
            label: textLabel,
            section: sectionName,
            destination: href || undefined,
            x: event.clientX,
            y: event.clientY,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
          });
        }
      },
      { passive: true }
    );
  }

  /**
   * Monitor scroll depths (25%, 50%, 75%, 90%, 100%) with throttling via requestAnimationFrame
   */
  private initScrollTracking(): void {
    let isScrolling = false;

    window.addEventListener(
      'scroll',
      () => {
        if (!isScrolling) {
          window.requestAnimationFrame(() => {
            this.checkScrollDepth();
            isScrolling = false;
          });
          isScrolling = true;
        }
      },
      { passive: true }
    );
  }

  private checkScrollDepth(): void {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

    const thresholds = [25, 50, 75, 90, 100];
    thresholds.forEach((threshold) => {
      if (scrollPercent >= threshold && !this.trackedScrollDepths.has(threshold)) {
        this.trackedScrollDepths.add(threshold);
        this.track('scroll_depth', {
          depth: `${threshold}%`,
          url: this.router.url
        });
      }
    });
  }

  /**
   * Active engagement timer (considers page visibility)
   */
  private initEngagementTracking(): void {
    if (this.activeTimerInterval) {
      clearInterval(this.activeTimerInterval);
    }

    this.activeTimerInterval = setInterval(() => {
      // Check if page is currently visible/focused
      if (document.visibilityState === 'visible') {
        this.activeTimeSeconds++;
        this.checkEngagementBuckets();
      }
    }, 1000);

    // Visibility change listener to pause or instantly evaluate
    document.addEventListener('visibilitychange', () => {
      this.checkEngagementBuckets();
    });
  }

  private checkEngagementBuckets(): void {
    const buckets: { label: string; seconds: number }[] = [
      { label: '0-10s', seconds: 10 },
      { label: '10-30s', seconds: 30 },
      { label: '30-60s', seconds: 60 },
      { label: '1-3m', seconds: 180 },
      { label: '3-5m', seconds: 300 },
      { label: '5m+', seconds: 600 }
    ];

    buckets.forEach((bucket) => {
      if (this.activeTimeSeconds >= bucket.seconds && !this.trackedEngagementBuckets.has(bucket.label)) {
        this.trackedEngagementBuckets.add(bucket.label);
        this.track('page_engagement', {
          duration_bucket: bucket.label,
          url: this.router.url
        });
      }
    });
  }

  /**
   * Section observer tracking using IntersectionObserver API
   */
  private initSectionTracking(): void {
    // Disconnect previous observer if any
    if (this.sectionObserver) {
      this.sectionObserver.disconnect();
    }

    // Tracked in current route page load
    this.trackedSections.clear();

    // Map section IDs or CSS classes of interest
    const elementsToObserve: { name: string; element: HTMLElement }[] = [];

    // Find main components
    const hero = document.querySelector('.home-hero') as HTMLElement;
    if (hero) elementsToObserve.push({ name: 'hero', element: hero });

    const about = document.querySelector('.about-page') as HTMLElement;
    if (about) elementsToObserve.push({ name: 'about', element: about });

    const experience = document.querySelector('.timeline-section') as HTMLElement;
    if (experience) elementsToObserve.push({ name: 'experience', element: experience });

    const skills = document.querySelector('.skills-section') as HTMLElement;
    if (skills) elementsToObserve.push({ name: 'skills', element: skills });

    const projects = document.querySelector('.projects-section') as HTMLElement;
    if (projects) elementsToObserve.push({ name: 'projects', element: projects });

    const contact = document.querySelector('.footer-contact') as HTMLElement;
    if (contact) elementsToObserve.push({ name: 'contact', element: contact });

    if (elementsToObserve.length === 0) return;

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const name = entry.target.getAttribute('data-analytics-section');
            if (name && !this.trackedSections.has(name)) {
              this.trackedSections.add(name);
              this.track('section_view', {
                section: name,
                url: this.router.url
              });
            }
          }
        });
      },
      {
        threshold: 0.25, // Element is 25% visible
        rootMargin: '0px'
      }
    );

    elementsToObserve.forEach(({ name, element }) => {
      // Set attribute so observer knows which section was viewed
      element.setAttribute('data-analytics-section', name);
      this.sectionObserver?.observe(element);
    });
  }
}
