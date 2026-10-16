import { Injectable, signal, computed, effect } from '@angular/core';

export type Kind = 'income' | 'expense';
export interface Txn { id: number; title: string; amount: number; kind: Kind; category: string; date: string; }

export const CATEGORIES: Record<string, string> = {
  Food: '#ffb347', Transport: '#5ec8ff', Home: '#b79cff',
  Fun: '#ff7eb6', Health: '#7cf0b0', Other: '#8b96a8',
};

const KEY = 'penny-pilot-v1';
const iso = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

const seed = (): Txn[] => [
  { id: 1, title: 'Freelance payment', amount: 28000, kind: 'income', category: 'Other', date: daysAgo(12) },
  { id: 2, title: 'Rent share', amount: 9000, kind: 'expense', category: 'Home', date: daysAgo(11) },
  { id: 3, title: 'Groceries', amount: 1850, kind: 'expense', category: 'Food', date: daysAgo(6) },
  { id: 4, title: 'Metro card top-up', amount: 600, kind: 'expense', category: 'Transport', date: daysAgo(5) },
  { id: 5, title: 'Movie night', amount: 750, kind: 'expense', category: 'Fun', date: daysAgo(3) },
  { id: 6, title: 'Pharmacy', amount: 420, kind: 'expense', category: 'Health', date: daysAgo(2) },
  { id: 7, title: 'Lunch with team', amount: 540, kind: 'expense', category: 'Food', date: daysAgo(1) },
  { id: 8, title: 'Cab to airport', amount: 980, kind: 'expense', category: 'Transport', date: daysAgo(0) },
];

@Injectable({ providedIn: 'root' })
export class ExpenseStore {
  readonly txns = signal<Txn[]>(this.read<Txn[]>(KEY, seed()));
  readonly budget = signal<number>(this.read<number>(KEY + '-budget', 20000));

  private readonly from = daysAgo(29);
  readonly recent = computed(() => this.txns().filter(t => t.date >= this.from));
  readonly income = computed(() => this.sum('income'));
  readonly spent = computed(() => this.sum('expense'));
  readonly net = computed(() => this.income() - this.spent());
  readonly budgetPct = computed(() => Math.min(100, Math.round((this.spent() / Math.max(this.budget(), 1)) * 100)));
  readonly over = computed(() => this.spent() > this.budget());

  readonly byCategory = computed(() => {
    const m = new Map<string, number>();
    for (const t of this.recent()) if (t.kind === 'expense') m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    const total = this.spent() || 1;
    return [...m]
      .map(([name, amount]) => ({ name, amount, pct: Math.round((amount / total) * 100), color: CATEGORIES[name] ?? '#8b96a8' }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly week = computed(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = iso(d);
      const total = this.txns().filter(t => t.kind === 'expense' && t.date === key).reduce((a, t) => a + t.amount, 0);
      days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), total });
    }
    const max = Math.max(...days.map(d => d.total), 1);
    return days.map(d => ({ ...d, h: Math.round((d.total / max) * 100) }));
  });

  constructor() {
    effect(() => this.write(KEY, this.txns()));
    effect(() => this.write(KEY + '-budget', this.budget()));
  }

  add(t: Omit<Txn, 'id'>) { this.txns.update(l => [{ ...t, id: Date.now() }, ...l]); }
  remove(id: number) { this.txns.update(l => l.filter(t => t.id !== id)); }
  resetSample() { this.txns.set(seed()); }
  clearAll() { this.txns.set([]); }

  private sum(kind: Kind) { return this.recent().filter(t => t.kind === kind).reduce((a, t) => a + t.amount, 0); }
  private read<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
  }
  private write(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } }
}
