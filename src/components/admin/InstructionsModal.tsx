'use client';

import { useState } from 'react';
import { X, Check, Copy, ChevronRight, ExternalLink } from 'lucide-react';

interface Step {
  text: string;
  link?: string;
  copyText?: string;
}

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  steps: Step[];
  onComplete?: () => void;
}

export default function InstructionsModal({ isOpen, onClose, title, description, steps, onComplete }: InstructionsModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="text-xs text-white/30 mt-0.5">{description}</p>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-[#C9A84C]/15 rounded-full flex items-center justify-center">
                  <span className="text-[#C9A84C] text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-white/70 leading-relaxed">{step.text}</p>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener" className="inline-flex items-center gap-1 mt-1.5 text-xs text-[#C9A84C] hover:text-[#d4b55a] transition-colors">
                      Open this page <ExternalLink size={10} />
                    </a>
                  )}
                  {step.copyText && (
                    <button
                      onClick={() => copyText(step.copyText!, i)}
                      className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 transition-all"
                    >
                      {copiedIndex === i ? <><Check size={10} className="text-green-400" /> Copied!</> : <><Copy size={10} /> Copy to clipboard</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex-shrink-0">
          <button
            onClick={() => { onComplete?.(); onClose(); }}
            className="w-full py-3 bg-[#C9A84C] text-black font-semibold text-sm rounded-lg hover:bg-[#d4b55a] transition-all"
          >
            Done — I completed these steps
          </button>
        </div>
      </div>
    </div>
  );
}
