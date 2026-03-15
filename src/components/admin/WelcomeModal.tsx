'use client';

import { useState } from 'react';
import { FileText, Mail, Users, Briefcase } from 'lucide-react';

interface WelcomeModalProps {
  userId: string;
  onComplete: (startTour: boolean) => void;
}

const features = [
  {
    icon: FileText,
    title: 'Estimates',
    description: 'Create professional estimates in minutes',
    color: '#C9A84C',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'Built-in email for your team',
    color: '#3b8dd4',
  },
  {
    icon: Users,
    title: 'Team',
    description: 'Manage your crew and onboarding',
    color: '#D4772C',
  },
  {
    icon: Briefcase,
    title: 'Projects',
    description: 'Track every project from start to finish',
    color: '#C9A84C',
  },
];

export default function WelcomeModal({ userId, onComplete }: WelcomeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (startTour: boolean) => {
    setLoading(true);
    try {
      await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          welcome_completed: true,
          ...(startTour ? {} : { onboarding_dismissed: true }),
        }),
      });
      onComplete(startTour);
    } catch (err) {
      console.error('Failed to update onboarding:', err);
      onComplete(startTour);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 welcome-modal-backdrop">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <div className="relative w-full max-w-lg welcome-modal-card">
        {/* Gold accent border at top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C9A84C] via-[#D4772C] to-[#C9A84C] rounded-t-xl" />

        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 pt-8 pb-6 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-5">
              <img
                src="/ro-unlimited-logo-transparent.png"
                alt="RO Unlimited"
                className="h-16 w-auto"
              />
            </div>

            {/* Heading */}
            <h1
              className="text-2xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome to RO Unlimited
            </h1>
            <p className="text-white/50 text-[15px] mb-6">
              Your construction business, fully managed from one place.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-left hover:bg-white/[0.05] transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon size={18} style={{ color: feature.color }} />
                  </div>
                  <p className="text-[14px] font-semibold text-white mb-0.5">
                    {feature.title}
                  </p>
                  <p className="text-[13px] text-white/40 leading-snug">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleAction(true)}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-[15px] text-black transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
                }}
              >
                {loading ? 'Loading...' : 'Take a Quick Tour'}
              </button>
              <button
                onClick={() => handleAction(false)}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-[14px] text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all disabled:opacity-50"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .welcome-modal-backdrop {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .welcome-modal-card {
          animation: scaleIn 0.35s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
