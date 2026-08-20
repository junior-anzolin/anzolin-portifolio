import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="layout-wrapper">
      <app-header />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {}
