'use client';

import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Plus, Trash2, Users } from 'lucide-react';
import { Button, Card, CopyBlock, Field, IconButton, InlineError, teamApi, type SectionProps } from './ui';

const NAME_RE = /^[A-Za-z0-9 .'-]{2,40}$/;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] || '' : '';
  return (first + last).toUpperCase();
}

const dateOf = (t: number) => new Date(t).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

type Confirm = { name: string; kind: 'token' | 'remove' } | null;

export default function TeamSection({ data, reload }: SectionProps) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [confirm, setConfirm] = useState<Confirm>(null);
  const [rowBusy, setRowBusy] = useState(false);
  const [rowError, setRowError] = useState<{ name: string; message: string } | null>(null);

  const [reveal, setReveal] = useState<{ name: string; token: string } | null>(null);
  const revealHeading = useRef<HTMLHeadingElement>(null);

  // Move focus to the token panel when it appears so keyboard/screen-reader users land on it.
  useEffect(() => {
    if (reveal) revealHeading.current?.focus();
  }, [reveal]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    setAddError('');
    if (!NAME_RE.test(value)) {
      setNameError("Use 2-40 characters: letters, numbers, spaces, . ' or -");
      return;
    }
    setNameError(null);
    setAdding(true);
    try {
      const res = await teamApi({ action: 'add_member', name: value });
      await reload();
      setName('');
      setReveal({ name: res.name, token: res.token });
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    const { name: who, kind } = confirm;
    setRowBusy(true);
    setRowError(null);
    try {
      if (kind === 'token') {
        const res = await teamApi({ action: 'add_member', name: who });
        await reload();
        setReveal({ name: res.name, token: res.token });
      } else {
        await teamApi({ action: 'remove_member', name: who });
        await reload();
        if (reveal?.name === who) setReveal(null);
      }
      setConfirm(null);
    } catch (err: any) {
      setRowError({ name: who, message: err.message });
    } finally {
      setRowBusy(false);
    }
  }

  function openConfirm(next: Confirm) {
    setRowError(null);
    setConfirm(next);
  }

  const config = reveal
    ? JSON.stringify(
        { mcpServers: { 'map-crack': { serverUrl: data.mcp_url, headers: { Authorization: `Bearer ${reveal.token}` } } } },
        null,
        2,
      )
    : '';

  return (
    <Card
      id="team"
      icon={Users}
      title="Teammates' agents"
      description="Each person gets their own token for the online Map Crack server. Everyone shares one lead memory, so nobody gets a business a teammate already has."
    >
      <div className="space-y-5">
        {data.members.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No teammates yet. Add yourself first, then your teammate.</p>
        ) : (
          <ul className="divide-y divide-slate-100 -my-1">
            {data.members.map((m) => {
              const isConfirming = confirm?.name === m.name;
              return (
                <li key={m.name} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center text-sm font-semibold shrink-0"
                      aria-hidden
                    >
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-sm font-medium text-slate-900 leading-5 break-words">{m.name}</p>
                      <p className="text-xs text-slate-500 leading-4">Added {dateOf(m.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3"
                        onClick={() => openConfirm({ name: m.name, kind: 'token' })}
                        disabled={rowBusy}
                      >
                        New token
                      </Button>
                      <IconButton
                        type="button"
                        icon={Trash2}
                        tone="danger"
                        label={`Remove ${m.name}`}
                        onClick={() => openConfirm({ name: m.name, kind: 'remove' })}
                        disabled={rowBusy}
                      />
                    </div>
                  </div>

                  {isConfirming && confirm && (
                    <div
                      className={`mt-3 rounded-lg border px-3 py-3 space-y-3 ${
                        confirm.kind === 'remove' ? 'border-rose-200 bg-rose-50/60' : 'border-amber-200 bg-amber-50/60'
                      }`}
                    >
                      <p className="text-sm text-slate-800">
                        {confirm.kind === 'remove'
                          ? `Remove ${m.name}? Their agent stops working right away.`
                          : `This replaces ${m.name}'s current token. Their agent stops working until they update it.`}
                      </p>
                      {rowError?.name === m.name && <InlineError>{rowError.message}</InlineError>}
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => setConfirm(null)} disabled={rowBusy}>
                          Cancel
                        </Button>
                        {confirm.kind === 'remove' ? (
                          <Button type="button" variant="danger" icon={Trash2} loading={rowBusy} onClick={runConfirm}>
                            Remove
                          </Button>
                        ) : (
                          <Button type="button" variant="primary" icon={KeyRound} loading={rowBusy} onClick={runConfirm}>
                            Create new token
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {reveal && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
            <h3
              ref={revealHeading}
              tabIndex={-1}
              className="flex items-center gap-2 text-base font-semibold text-slate-900 focus:outline-none"
            >
              <KeyRound className="w-[18px] h-[18px] text-amber-700" aria-hidden />
              Connect {reveal.name}&apos;s agent
            </h3>
            <p className="text-sm font-medium text-amber-900">
              This token is shown only once. Send it privately (not in a group chat).
            </p>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-800">
              <li className="space-y-2">
                <p>Copy this config:</p>
                <CopyBlock text={config} label="Copy config" />
              </li>
              <li>
                In Antigravity, open{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 text-xs font-mono break-all">
                  ~/.gemini/config/mcp_config.json
                </code>{' '}
                and add the map-crack entry inside mcpServers.
              </li>
              <li>Restart Antigravity. The agent can now use the Map Crack tools.</li>
            </ol>
            <Button type="button" onClick={() => setReveal(null)}>
              Done, I&apos;ve saved it
            </Button>
          </div>
        )}

        <form onSubmit={onAdd} autoComplete="off" noValidate className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <Field
              label="Name"
              placeholder="e.g. Zaid"
              autoComplete="off"
              maxLength={40}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              error={nameError}
              className="flex-1"
            />
            {/* Spacer matches the label height so the button lines up with the input. */}
            <div className="sm:pt-[26px]">
              <Button type="submit" icon={Plus} loading={adding} className="w-full sm:w-auto">
                Add teammate
              </Button>
            </div>
          </div>
          <InlineError>{addError}</InlineError>
        </form>
      </div>
    </Card>
  );
}
