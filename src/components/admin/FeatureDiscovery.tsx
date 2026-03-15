'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FeatureDiscoveryProps {
  featureId: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  userId: string;
  toursCompleted: Record<string, boolean>;
  onDismiss: () => void;
}

const SECTION_COLORS: Record<string, string> = {
  estimates: '#C9A84C',
  customers: '#D4772C',
  cost_library: '#3b8dd4',
  email: '#3b8dd4',
  employees: '#D4772C',
  projects: '#C9A84C',
  vendors: '#3b8dd4',
  schedule: '#D4772C',
};

export default function FeatureDiscovery({
  featureId,
  title,
  description,
  icon,
  userId,
  toursCompleted,
  onDismiss,
}: FeatureDiscoveryProps) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const accentColor = SECTION_COLORS[featureId] || '#C9A84C';

  useEffect(() => {
    // Don't show if already seen
    if (toursCompleted[featureId]) return;

    // Small delay for entrance
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, [featureId, toursCompleted]);

  if (toursCompleted[featureId] || (!visible && !dismissing)) return null;

  const handleDismiss = async () => {
    setDismissing(true);

    try {
      await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tours_completed: { [featureId]: true },
        }),
      });
    } catch (err) {
      console.error('Failed to dismiss feature discovery:', err);
    }

    // Animate out then call onDismiss
    setTimeout(() => {
      onDismiss();
    }, 250);
  };

  return (
    <div
      className={`fixed top-20 left-1/2 z-[150] w-full max-w-sm -translate-x-1/2 transition-all duration-300 ${
        dismissing
          ? 'opacity-0 -translate-y-2'
          : visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/40">
        {/* Colored left border */}
        <div className="flex">
          <div
            className="w-1 flex-shrink-0 rounded-l-xl"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex-1 p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <div style={{ color: accentColor }}>{icon}</div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-white mb-0.5">
                  {title}
                </h3>
                <p className="text-[13px] text-white/45 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Close */}
              <button
                onClick={handleDismiss}
                className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Got it button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all hover:brightness-110"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
