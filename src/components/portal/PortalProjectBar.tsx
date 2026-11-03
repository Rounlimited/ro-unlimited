'use client';

import { ChevronLeft } from 'lucide-react';

/** Thin bar above a project inside the portal: back to the list, and jump links into the page. */
export default function PortalProjectBar({ name }: { name: string }) {
  const jump = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const chips: [string, string][] = [['needs-you', 'Needs you'], ['requests', 'Requests'], ['questions', 'Questions']];
  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between gap-3 flex-wrap">
      <a href="/my" className="inline-flex items-center gap-1 min-h-[44px] text-[16px] font-bold" style={{ color: '#8a6d20' }}><ChevronLeft size={20} /> My Projects</a>
      <div className="flex items-center gap-2 overflow-x-auto">
        {chips.map(([id, label]) => (
          <button key={id} type="button" onClick={jump(id)} className="min-h-[40px] px-3 rounded-full text-[14px] font-bold whitespace-nowrap" style={{ background: '#fff', color: '#4b5563', border: '1px solid #e5e0d2' }}>{label}</button>
        ))}
      </div>
      <span className="sr-only">{name}</span>
    </div>
  );
}
