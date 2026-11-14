'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Sheet } from 'lucide-react';
import { Badge, Button, Card, Field, InlineError, teamApi, type SectionProps } from './ui';

const SHEET_PREFIX = 'https://docs.google.com/spreadsheets/';

/** docs.google.com/spreadsheets/…/abc123 — enough to recognise the sheet without the long id. */
function shortSheet(url: string): string {
  const id = url.match(/\/d\/([^/?#]+)/)?.[1];
  return id ? `docs.google.com/spreadsheets/…/${id.slice(-6)}` : url.replace(/^https:\/\//, '');
}

export default function SheetSection({ data, reload }: SectionProps) {
  const saved = data.sheet_url || '';
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Clear the "Saved" status after a moment.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [justSaved]);

  const showForm = !saved || editing;

  function startEdit() {
    setUrl(saved);
    setFieldError(null);
    setServerError('');
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setFieldError(null);
    setServerError('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = url.trim();
    setServerError('');
    if (!value.startsWith(SHEET_PREFIX)) {
      setFieldError('Paste a Google Sheets link that starts with https://docs.google.com/spreadsheets/');
      return;
    }
    setFieldError(null);
    setBusy(true);
    try {
      await teamApi({ action: 'set_sheet', url: value });
      await reload();
      setEditing(false);
      setUrl('');
      setJustSaved(true);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      id="sheet"
      icon={Sheet}
      title="Team Google Sheet"
      description="Every agent writes leads here. Share it as Editor with each teammate's Google account."
    >
      {showForm ? (
        <form onSubmit={onSubmit} autoComplete="off" noValidate className="space-y-3">
          <Field
            label="Sheet link"
            type="url"
            autoComplete="off"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            help="Paste the link from your browser's address bar."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (fieldError) setFieldError(null);
            }}
            error={fieldError}
          />
          <InlineError>{serverError}</InlineError>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={busy}>Save link</Button>
            {editing && saved && (
              <Button type="button" variant="secondary" onClick={cancel} disabled={busy}>Cancel</Button>
            )}
          </div>
          {!saved && (
            <p className="text-xs text-slate-500 leading-4">
              No link yet: agents will look for a spreadsheet named “Map Crack Leads”.
            </p>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="green">Connected</Badge>
          <span className="flex-1 min-w-0 truncate text-sm text-slate-700 font-mono" title={saved}>
            {shortSheet(saved)}
          </span>
          {justSaved && (
            <span role="status" className="text-sm font-medium text-emerald-700">Saved</span>
          )}
          <div className="flex flex-wrap gap-2">
            <a
              href={saved}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-lg text-sm font-semibold transition-colors duration-150 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <ExternalLink className="w-4 h-4" aria-hidden />
              Open sheet
            </a>
            <Button type="button" variant="ghost" onClick={startEdit}>Change</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
