'use client';

/** One tight row of jump links above a project inside the portal. The header above carries "My Projects". */
export default function PortalProjectBar({ name }: { name: string }) {
  const jump = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const chips: [string, string][] = [['needs-you', 'Needs you'], ['schedule', 'Schedule'], ['requests', 'Requests'], ['questions', 'Questions'], ['binder', 'Binder']];
  return (
    <div className="max-w-4xl mx-auto px-4 pt-3">
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {chips.map(([id, label]) => (
          <button key={id} type="button" onClick={jump(id)} className="shrink-0 min-h-[40px] px-3.5 rounded-full text-[14px] font-bold whitespace-nowrap" style={{ background: '#fff', color: '#4b5563', border: '1px solid #e5e0d2' }}>{label}</button>
        ))}
      </div>
      <span className="sr-only">{name}</span>
    </div>
  );
}
