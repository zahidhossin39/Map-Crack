'use client';

// "Google API keys" card on the Team & keys page: the ordered key pool, per-key daily caps,
// wake / remove actions, and an inline add-key form.

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, KeyRound, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  InlineError,
  UsageBar,
  teamApi,
  timeOf,
  type PoolKey,
  type SectionProps,
} from './ui';

const KEY_PATTERN = /^[A-Za-z0-9_-]{30,}$/;

// ---------- one row in the pool ----------

function KeyRow({ k, position, reload }: { k: PoolKey; position: number; reload: () => Promise<void> }) {
  const capId = useId();
  const [cap, setCap] = useState(String(k.daily_cap));
  const [savingCap, setSavingCap] = useState(false);
  const [savedCap, setSavedCap] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<'wake' | 'remove' | null>(null);
  const [error, setError] = useState('');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when fresh data arrives (but not mid-save).
  useEffect(() => {
    if (!savingCap) setCap(String(k.daily_cap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k.daily_cap]);

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const resting = Boolean(k.cooling_until);
  const atCap = k.used_today >= k.daily_cap;

  async function saveCap() {
    const n = Math.floor(Number(cap));
    if (cap.trim() === '' || !Number.isFinite(n) || n < 0) {
      setCap(String(k.daily_cap));
      return;
    }
    if (n === k.daily_cap) {
      setCap(String(k.daily_cap));
      return;
    }
    setSavingCap(true);
    setError('');
    try {
      await teamApi({ action: 'update_key', id: k.id, daily_cap: n });
      await reload();
      setSavedCap(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedCap(false), 1500);
    } catch (e: any) {
      setCap(String(k.daily_cap));
      setError(e.message);
    } finally {
      setSavingCap(false);
    }
  }

  async function wake() {
    setBusy('wake');
    setError('');
    try {
      await teamApi({ action: 'update_key', id: k.id, wake: true });
      await reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy('remove');
    setError('');
    try {
      await teamApi({ action: 'remove_key', id: k.id });
      await reload();
    } catch (e: any) {
      setError(e.message);
      setBusy(null);
      setConfirming(false);
    }
  }

  return (
    <li className="py-3">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-[160px] text-sm font-medium text-slate-900">Remove {k.label}?</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy === 'remove'} autoFocus>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} loading={busy === 'remove'}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* position + name */}
          <div className="flex items-center gap-3 min-w-0 flex-1 basis-[180px]">
            <span
              className="w-7 h-7 shrink-0 grid place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700 tabular-nums"
              aria-label={`Position ${position}`}
            >
              {position}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">{k.label}</p>
              <p className="text-xs text-slate-500 truncate">
                {k.from_env ? 'From server settings' : `Owner: ${k.owner || 'not set'}`}
              </p>
              <p className="font-mono text-xs text-slate-600 mt-0.5 break-all">{k.key}</p>
            </div>
          </div>

          {/* usage + status */}
          <div className="flex flex-col gap-1.5 basis-[150px] grow sm:grow-0">
            <UsageBar used={k.used_today} cap={k.daily_cap} />
            <div>
              {resting ? (
                <Badge tone="amber">Resting until {timeOf(k.cooling_until as number)}</Badge>
              ) : atCap ? (
                <Badge tone="slate">At cap today</Badge>
              ) : (
                <Badge tone="green">Active</Badge>
              )}
            </div>
          </div>

          {/* daily cap */}
          <div className="flex items-center gap-2">
            <label htmlFor={capId} className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Daily cap
            </label>
            <input
              id={capId}
              type="number"
              inputMode="numeric"
              min={0}
              value={cap}
              disabled={savingCap}
              onChange={(e) => setCap(e.target.value)}
              onBlur={saveCap}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-24 min-h-[40px] px-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 disabled:bg-slate-50"
            />
            <span className="w-14 text-xs" aria-live="polite">
              {savingCap ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" aria-label="Saving" />
              ) : savedCap ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <Check className="w-3.5 h-3.5" aria-hidden /> Saved
                </span>
              ) : null}
            </span>
          </div>

          {/* actions */}
          <div className="flex items-center gap-1 ml-auto">
            {resting &&
              (busy === 'wake' ? (
                <span className="w-10 h-10 grid place-items-center" role="status" aria-label="Retrying key">
                  <Loader2 className="w-[18px] h-[18px] animate-spin text-slate-500" aria-hidden />
                </span>
              ) : (
                <IconButton icon={RotateCcw} label="Try this key again now" onClick={wake} disabled={busy !== null} />
              ))}
            {!k.from_env && (
              <IconButton
                icon={Trash2}
                tone="danger"
                label={`Remove ${k.label}`}
                onClick={() => { setError(''); setConfirming(true); }}
                disabled={busy !== null}
              />
            )}
          </div>
        </div>
      )}

      {resting && k.last_error && !confirming && (
        <p className="text-xs text-amber-800 mt-2 break-words">{k.last_error}</p>
      )}
      {error && <div className="mt-2"><InlineError>{error}</InlineError></div>}
    </li>
  );
}

// ---------- add-key form ----------

function AddKeyForm({ defaultCap, onDone, onCancel }: {
  defaultCap: number;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState('');
  const [owner, setOwner] = useState('');
  const [key, setKey] = useState('');
  const [cap, setCap] = useState('');
  const [errors, setErrors] = useState<{ label?: string; key?: string }>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setLabel('');
    setOwner('');
    setKey('');
    setCap('');
    setErrors({});
    setServerError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: { label?: string; key?: string } = {};
    if (!label.trim()) next.label = 'Give the key a name.';
    if (!KEY_PATTERN.test(key.trim())) next.key = 'Google API keys start with AIza and are about 39 characters.';
    setErrors(next);
    setServerError('');
    if (next.label || next.key) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: 'add_key', label: label.trim(), owner: owner.trim(), key: key.trim() };
      if (cap.trim() !== '') body.daily_cap = Number(cap);
      await teamApi(body);
      reset();
      await onDone();
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} autoComplete="off" noValidate className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Name"
          name="key-label"
          placeholder="e.g. Sam's key"
          autoComplete="off"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={errors.label}
          disabled={submitting}
        />
        <Field
          label="Owner"
          name="key-owner"
          placeholder="Who pays for it"
          autoComplete="off"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          disabled={submitting}
        />
        <Field
          label="API key"
          secret
          name="key-value"
          placeholder="AIza…"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          error={errors.key}
          disabled={submitting}
          className="sm:col-span-2"
          help="Needs Places API (New) enabled and no website restriction. Tested with a free Google call before saving. Only the first and last 4 characters are shown again."
        />
        <Field
          label="Daily cap"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder={String(defaultCap)}
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          disabled={submitting}
          help={`Calls per day the team may use. Default ${defaultCap}.`}
        />
      </div>

      <InlineError>{serverError}</InlineError>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={submitting}>
          {submitting ? 'Testing key…' : 'Test & add key'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          onClick={() => { reset(); onCancel(); }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------- the card ----------

export default function KeysSection({ data, reload }: SectionProps) {
  const keys = data.pool.keys;
  const full = keys.length >= data.max_keys;
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  const formOpen = !full && (adding || keys.length === 0);

  async function handleAdded() {
    await reload();
    setAdding(false);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 3000);
  }

  return (
    <Card
      id="keys"
      icon={KeyRound}
      title="Google API keys"
      description="Used top to bottom. If a key hits its daily cap or Google refuses it, the next key takes over."
    >
      {keys.length === 0 ? (
        <p className="text-sm text-slate-600 mb-4">No keys yet. Add the first one below to start finding leads.</p>
      ) : (
        <ol className="divide-y divide-slate-100 -mt-1">
          {keys.map((k, i) => (
            <KeyRow key={k.id} k={k} position={i + 1} reload={reload} />
          ))}
        </ol>
      )}

      <div className={keys.length ? 'mt-3 pt-4 border-t border-slate-100 space-y-3' : 'space-y-3'}>
        {added && (
          <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="w-4 h-4" aria-hidden /> Key added
          </p>
        )}

        {full ? (
          <p className="text-sm text-slate-600">The pool is full ({data.max_keys} keys).</p>
        ) : formOpen ? (
          <AddKeyForm
            defaultCap={data.default_cap}
            onDone={handleAdded}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button variant="secondary" icon={Plus} onClick={() => { setAdded(false); setAdding(true); }}>
            Add a key
          </Button>
        )}
      </div>

      <details className="mt-4 group">
        <summary className="inline-flex items-center min-h-[40px] text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          How fallback works
        </summary>
        <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-slate-600">
          <li>Per-minute limit hit: the key rests 2 minutes.</li>
          <li>Daily quota used up: the key rests until midnight Pacific.</li>
          <li>Key error (bad key, API turned off, billing): the key rests 6 hours and its owner must fix it.</li>
          <li>Each key bills its owner&apos;s Google account. The daily cap limits how much the team uses per day.</li>
        </ul>
      </details>
    </Card>
  );
}
