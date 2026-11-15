'use client';

import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Card, CopyBlock } from './ui';

// The agent skill lives in public/skills/, so every teammate's agent can fetch the same,
// always-current instructions from the live site (no login needed: it holds no secrets).
export default function SkillSection() {
  const url = typeof window === 'undefined' ? '/skills/no-website-leads/SKILL.md' : `${window.location.origin}/skills/no-website-leads/SKILL.md`;
  const prompt = `Install this agent skill: download ${url} and save it as skills/no-website-leads/SKILL.md in your skills folder (Antigravity: ~/.gemini/config/skills/no-website-leads/SKILL.md). Then confirm the skill "no-website-leads" is available.`;
  return (
    <Card
      id="skill"
      icon={BookOpen}
      title="Agent skill"
      description="The step-by-step workflow every agent follows. Give this to your agent once; re-run it after updates."
      action={
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
          View skill <ExternalLink className="w-4 h-4" aria-hidden />
        </a>
      }
    >
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
