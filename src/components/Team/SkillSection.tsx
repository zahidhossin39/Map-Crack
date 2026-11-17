'use client';

import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Card, CopyBlock } from './ui';

// The agent skills live in public/skills/, so every teammate's agent can fetch the same,
// always-current instructions from the live site (no login needed: they hold no secrets).
const SKILLS = [
  { name: 'no-website-leads', what: 'The daily lead run: no-website leads plus website leads.' },
  { name: 'website-audit', what: 'How each website lead is audited (used by the lead run).' },
];

export default function SkillSection() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = (n: string) => `${origin}/skills/${n}/SKILL.md`;
  const prompt =
    `Install these agent skills. For each one, download the URL and save it in your skills folder ` +
    `(Antigravity: ~/.gemini/config/skills/<name>/SKILL.md):\n` +
    SKILLS.map((s) => `- ${s.name}: ${url(s.name)}`).join('\n') +
    `\nThen confirm the skills "no-website-leads" and "website-audit" are available.`;
  return (
    <Card
      id="skill"
      icon={BookOpen}
      title="Agent skills"
      description="The step-by-step workflow every agent follows. Give this to your agent once; re-run it after updates."
    >
      <ul className="space-y-1 mb-3 text-sm">
        {SKILLS.map((s) => (
          <li key={s.name} className="flex flex-wrap items-center gap-2">
            <a href={url(s.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
              {s.name} <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            </a>
            <span className="text-slate-600">{s.what}</span>
          </li>
        ))}
      </ul>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
        <li>Connect the Map Crack server first (Teammates&apos; agents, above).</li>
        <li>
          Paste this into your agent (Antigravity, Claude Code, Cursor):
          <div className="mt-2"><CopyBlock text={prompt} label="Copy" /></div>
        </li>
        <li>Restart the agent, then run the daily prompt.</li>
      </ol>
    </Card>
  );
}
