'use client';

import { useState } from 'react';
import { X, Check, Loader2, Lock } from 'lucide-react';

interface Field {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'email';
}

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  fields: Field[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
  submitLabel?: string;
  icon?: React.ReactNode;
}

export default function TextInputModal({ isOpen, onClose, title, description, fields, onSubmit, submitLabel = 'Save', icon }: TextInputModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(values);
      setDone(true);
      setTimeout(() => { onClose(); setDone(false); setValues({}); }, 1200);
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-white/10 rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="text-xs text-white/30 mt-0.5">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check size={28} className="text-green-400" />
              </div>
              <p className="text-green-400 font-semibold">Saved! We got it.</p>
              <p className="text-white/30 text-xs mt-1">NexaVision will take it from here.</p>
            </div>
          ) : (
            <>
              {fields.map(field => (
                <div key={field.id}>
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.type || 'text'}
                      value={values[field.id] || ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none transition-colors"
                    />
                    {field.type === 'password' && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15" />}
                  </div>
                </div>
              ))}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving || fields.some(f => !values[f.id]?.trim())}
                  className="flex-1 py-3 bg-[#C9A84C] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b55a] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : submitLabel}
                </button>
                <button onClick={onClose} className="px-4 py-3 text-sm text-white/40 hover:text-white border border-white/5 rounded-lg transition-all">Cancel</button>
              </div>
              <p className="text-[10px] text-white/15 text-center flex items-center justify-center gap-1">
                <Lock size={9} /> Your information is secure and only visible to NexaVision
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
