import { Component, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseStore, CATEGORIES, Kind } from './store';

@Component({
  selector: 'app-transactions',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <h1 class="page-h">Entries</h1>

    <section class="card">
      <h2>Add an entry</h2>
      <div class="form" (keydown.enter)="add()">
        <div class="seg" role="group" aria-label="Type">
          <button type="button" [class.on]="kind === 'expense'" (click)="kind = 'expense'">Expense</button>
          <button type="button" [class.on]="kind === 'income'" (click)="kind = 'income'">Income</button>
        </div>
        <label>Title <input [(ngModel)]="title" placeholder="e.g. Coffee" /></label>
        <label>Amount (₹) <input type="number" min="1" [(ngModel)]="amount" /></label>
        <label>Category
          <select [(ngModel)]="category">
            @for (c of catNames; track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </label>
        <label>Date <input type="date" [(ngModel)]="date" /></label>
        <button class="btn" type="button" [disabled]="!valid()" (click)="add()">Add entry</button>
      </div>
    </section>

    <section class="card">
      <div class="filters">
        <div class="seg" role="group" aria-label="Filter">
          @for (f of kinds; track f) {
            <button type="button" [class.on]="filter() === f" (click)="filter.set(f)">{{ f }}</button>
          }
        </div>
        <input class="search" type="search" placeholder="Search..." aria-label="Search entries"
          [ngModel]="query()" (ngModelChange)="query.set($event)" />
      </div>

      <ul class="list">
        @for (t of shown(); track t.id) {
          <li>
            <div><b>{{ t.title }}</b><small>{{ t.category }} · {{ t.date | date:'d MMM y' }}</small></div>
            <div class="end">
              <span class="num" [class.in]="t.kind === 'income'">{{ t.kind === 'income' ? '+' : '-' }}{{ t.amount | currency:'INR':'symbol':'1.0-0' }}</span>
              <button class="x" type="button" (click)="s.remove(t.id)" [attr.aria-label]="'Delete ' + t.title">×</button>
            </div>
          </li>
        } @empty { <li class="muted">No entries match.</li> }
      </ul>

      <div class="row foot">
        <small class="muted">{{ shown().length }} shown</small>
        <span>
          <button class="link" type="button" (click)="s.resetSample()">Load sample data</button>
          <button class="link" type="button" (click)="s.clearAll()">Clear all</button>
        </span>
      </div>
    </section>
  `,
})
export class Transactions {
  s = inject(ExpenseStore);
  catNames = Object.keys(CATEGORIES);
  kinds: ('All' | 'Income' | 'Expense')[] = ['All', 'Income', 'Expense'];

  kind: Kind = 'expense';
  title = '';
  amount: number | null = null;
  category = 'Food';
  date = new Date().toLocaleDateString('en-CA');

  filter = signal<'All' | 'Income' | 'Expense'>('All');
  query = signal('');
  shown = computed(() => {
    const f = this.filter().toLowerCase(), q = this.query().trim().toLowerCase();
    return this.s.txns()
      .filter(t => (f === 'all' || t.kind === f) && (!q || (t.title + t.category).toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  });

  valid() { return this.title.trim().length > 0 && !!this.amount && this.amount > 0; }
  add() {
    if (!this.valid()) return;
    this.s.add({ title: this.title.trim(), amount: Number(this.amount), kind: this.kind, category: this.category, date: this.date });
    this.title = ''; this.amount = null;
  }
}
