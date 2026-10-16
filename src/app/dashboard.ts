import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExpenseStore, CATEGORIES } from './store';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <h1 class="page-h">Last 30 days</h1>

    <section class="stats">
      <div class="card"><span class="lbl">Income</span><strong class="num in">{{ s.income() | currency:'INR':'symbol':'1.0-0' }}</strong></div>
      <div class="card"><span class="lbl">Spent</span><strong class="num out">{{ s.spent() | currency:'INR':'symbol':'1.0-0' }}</strong></div>
      <div class="card"><span class="lbl">Net</span>
        <strong class="num" [class.in]="s.net() >= 0" [class.out]="s.net() < 0">{{ s.net() | currency:'INR':'symbol':'1.0-0' }}</strong></div>
    </section>

    <section class="card">
      <div class="row">
        <h2>Spending limit</h2>
        <label class="inline">Limit
          <input type="number" min="1" [ngModel]="s.budget()" (ngModelChange)="setBudget($event)" />
        </label>
      </div>
      <div class="bar" role="progressbar" [attr.aria-valuenow]="s.budgetPct()" aria-valuemin="0" aria-valuemax="100" aria-label="Budget used">
        <span [style.width.%]="s.budgetPct()" [class.warn]="s.budgetPct() >= 80" [class.over]="s.over()"></span>
      </div>
      <p class="muted">
        @if (s.over()) { You are {{ s.spent() - s.budget() | currency:'INR':'symbol':'1.0-0' }} over your limit. }
        @else { {{ s.budget() - s.spent() | currency:'INR':'symbol':'1.0-0' }} left of {{ s.budget() | currency:'INR':'symbol':'1.0-0' }}. }
      </p>
    </section>

    <div class="two">
      <section class="card">
        <h2>Where it went</h2>
        @for (c of s.byCategory(); track c.name) {
          <div class="cat">
            <div class="row"><span><i class="dot" [style.background]="c.color"></i>{{ c.name }}</span>
              <span class="num">{{ c.amount | currency:'INR':'symbol':'1.0-0' }}</span></div>
            <div class="bar thin"><span [style.width.%]="c.pct" [style.background]="c.color"></span></div>
          </div>
        } @empty { <p class="muted">No spending yet.</p> }
      </section>

      <section class="card">
        <h2>Last 7 days</h2>
        <div class="cols7">
          @for (d of s.week(); track $index) {
            <div class="col" [attr.title]="d.total">
              <div class="colbar"><span [style.height.%]="d.h"></span></div>
              <small>{{ d.label }}</small>
            </div>
          }
        </div>
      </section>
    </div>

    <section class="card">
      <div class="row"><h2>Recent</h2><a routerLink="/transactions">View all</a></div>
      <ul class="list">
        @for (t of s.txns().slice(0, 5); track t.id) {
          <li>
            <div><b>{{ t.title }}</b><small>{{ t.category }} · {{ t.date | date:'d MMM' }}</small></div>
            <span class="num" [class.in]="t.kind === 'income'">{{ t.kind === 'income' ? '+' : '-' }}{{ t.amount | currency:'INR':'symbol':'1.0-0' }}</span>
          </li>
        } @empty { <li class="muted">Nothing here yet. Add your first entry.</li> }
      </ul>
    </section>
  `,
})
export class Dashboard {
  s = inject(ExpenseStore);
  cats = CATEGORIES;
  setBudget(v: number) { this.s.budget.set(Math.max(1, Number(v) || 1)); }
}
