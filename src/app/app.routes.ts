import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsComponent)
      },
      {
        path: 'articles',
        loadComponent: () => import('./features/articles/articles').then(m => m.ArticlesComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about').then(m => m.AboutComponent)
      },
      {
        path: 'tools',
        loadComponent: () => import('./features/tools/tools').then(m => m.ToolsComponent)
      },
      {
        path: '404',
        loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
