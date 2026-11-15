'use client';

// Shared building blocks for the Team & keys page. Light theme to match /sheet; emerald is the
// action color, purple marks saved leads elsewhere, rose is destructive, amber is "resting".

import React, { useId, useState } from 'react';
import { Check, Copy, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';

// ---------- data shapes from GET /api/team ----------

export interface PoolKey {
  id: string;
  label: string;
  owner: string;
  key: string; // masked
  daily_cap: number;
  used_today: number;
  cooling_until: number | null;
  last_error: string | null;
  from_env: boolean;
}
export interface TeamData {
  pool: { day: string; keys: PoolKey[]; calls_left_today: number; used_today: number; cap_today: number; month: string; used_month: number; free_month: number };
  members: { name: string; created_at: number }[];
  sheet_url: string;
  mcp_url: string;
  default_cap: number;
  max_keys: number;
}

/** POST /api/team. Throws Error(message) on failure. */
export async function teamApi(body: Record<string, unknown>): Promise<any> {
  const res = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Something went wrong (${res.status}).`);
  return data;
}

/** Props every section gets from the page. */
export interface SectionProps {
  data: TeamData;
  reload: () => Promise<void>;
}

export const timeOf = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ---------- layout ----------

export function Card({ icon: Icon, title, description, action, children, id }: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <header className="flex flex-wrap items-start gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center shrink-0" aria-hidden>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold text-slate-900 leading-6">{title}</h2>
          {description && <p className="text-sm text-slate-600 mt-0.5 leading-5">{description}</p>}
        </div>
        {action}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

// ---------- buttons ----------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:text-slate-400',
  ghost: 'text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
  danger: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 disabled:text-rose-300',
};

export function Button({ variant = 'primary', loading, icon: Icon, children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${VARIANT[variant]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : Icon ? <Icon className="w-4 h-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Icon-only button. `label` is required: it is the accessible name and the tooltip. */
export function IconButton({ icon: Icon, label, tone = 'default', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`w-10 h-10 grid place-items-center rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed ${
        tone === 'danger' ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-[18px] h-[18px]" aria-hidden />
    </button>
  );
}

// ---------- form fields ----------

const INPUT =
  'w-full min-h-[40px] px-3 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600';

/**
 * Labeled input with optional help and error text (both linked via aria-describedby).
 * `secret` masks the value with CSS instead of type=password, so browsers never autofill a
 * saved login into it, and adds a show/hide toggle.
 */
export function Field({ label, help, error, secret, className = '', ...input }: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: React.ReactNode;
  error?: string | null;
  secret?: boolean;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const describedBy = [help ? `${id}-help` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...(secret ? { autoComplete: 'off', spellCheck: false, 'data-1p-ignore': true, 'data-lpignore': 'true' } : {})}
          {...input}
          type={secret ? 'text' : input.type || 'text'}
          style={secret && !show ? ({ WebkitTextSecurity: 'disc' } as React.CSSProperties) : undefined}
          className={`${INPUT} ${error ? 'border-rose-400' : 'border-slate-300'} ${secret ? 'pr-11 font-mono' : ''}`}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide key' : 'Show key'}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {show ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
          </button>
        )}
      </div>
      {help && !error && <p id={`${id}-help`} className="text-xs text-slate-500 mt-1.5 leading-4">{help}</p>}
      {error && <p id={`${id}-err`} className="text-xs font-medium text-rose-700 mt-1.5 leading-4">{error}</p>}
    </div>
  );
}

/** Error shown right under the thing that failed. */
export function InlineError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

// ---------- status ----------

export function Badge({ tone, children }: { tone: 'green' | 'amber' | 'slate' | 'rose'; children: React.ReactNode }) {
  const t = {
    green: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/25',
    slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    rose: 'bg-rose-50 text-rose-800 ring-rose-600/20',
  }[tone];
  const dot = { green: 'bg-emerald-500', amber: 'bg-amber-500', slate: 'bg-slate-400', rose: 'bg-rose-500' }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap ${t}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
      {children}
    </span>
  );
}

/** used / cap bar. Turns amber past 80 %, slate when full. */
export function UsageBar({ used, cap, period = 'today' }: { used: number; cap: number; period?: string }) {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 100;
  const color = pct >= 100 ? 'bg-slate-400' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span><span className="font-semibold text-slate-900 tabular-nums">{used}</span> / <span className="tabular-nums">{cap.toLocaleString()}</span> {period}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={cap} aria-label={`Calls used ${period}`}>
        <div className={`h-full rounded-full transition-[width] duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------- copy ----------

export function CopyBlock({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-200 bg-white">
        <span className="text-xs font-medium text-slate-500">Text to paste</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); })}
          className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-md text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${done ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
        >
          {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
          <span aria-live="polite">{done ? 'Copied' : label}</span>
        </button>
      </div>
      <pre className="text-[13px] leading-6 text-slate-800 font-mono p-3 whitespace-pre-wrap break-words">{text}</pre>
    </div>
  );
}
