import { Routes } from '@angular/router';
import { Dashboard } from './dashboard';
import { Transactions } from './transactions';

export const routes: Routes = [
  { path: '', component: Dashboard, title: 'PennyPilot | Dashboard' },
  { path: 'transactions', component: Transactions, title: 'PennyPilot | Entries' },
  { path: '**', redirectTo: '' },
];
