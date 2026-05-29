import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { LayoutComponent } from './shared/layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'records',
        loadComponent: () => import('./pages/records/records.component').then(m => m.RecordsComponent),
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
        canActivate: [adminGuard],
      },
      {
        path: 'credscan',
        loadComponent: () => import('./pages/credscan/credscan.component').then(m => m.CredScanComponent),
      },
      {
        path: 'forensidoc',
        loadComponent: () => import('./pages/forensidoc/forensidoc.component').then(m => m.ForensiDocComponent),
      },
      {
        path: 'nexus',
        loadComponent: () => import('./pages/nexus/nexus.component').then(m => m.NexusComponent),
      },
      {
        path: 'deepguard',
        loadComponent: () => import('./pages/deepguard/deepguard.component').then(m => m.DeepGuardComponent),
      },
      {
        path: 'chatverify',
        loadComponent: () => import('./pages/chatverify/chatverify.component').then(m => m.ChatVerifyComponent),
      },
      {
        path: 'liveid',
        loadComponent: () => import('./pages/liveid/liveid.component').then(m => m.LiveIdComponent),
      },
      {
        path: 'chainseal',
        loadComponent: () => import('./pages/chainseal/chainseal.component').then(m => m.ChainSealComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
