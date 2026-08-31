'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import WelcomeModal from './WelcomeModal';

interface UserOnboarding {
  id?: string;
  user_id: string;
  welcome_completed: boolean;
  onboarding_dismissed: boolean;
  tours_completed: Record<string, boolean>;
  dashboard_tour_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

interface OnboardingContextType {
  onboarding: UserOnboarding | null;
  updateOnboarding: (fields: Partial<UserOnboarding>) => Promise<void>;
  isFeatureSeen: (featureId: string) => boolean;
  markFeatureSeen: (featureId: string) => void;
  loading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType>({
  onboarding: null,
  updateOnboarding: async () => {},
  isFeatureSeen: () => true,
  markFeatureSeen: () => {},
  loading: true,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Get current user and fetch onboarding state
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const res = await fetch(`/api/admin/onboarding?user_id=${user.id}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        // API returns { onboarding: {...} } wrapper
        const data = json.onboarding || json;
        setOnboarding(data);

        if (!data.welcome_completed) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateOnboarding = useCallback(
    async (fields: Partial<UserOnboarding>) => {
      if (!userId) return;

      try {
        const res = await fetch('/api/admin/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, ...fields }),
        });

        if (res.ok) {
          const json = await res.json();
          setOnboarding(json.onboarding || json);
        }
      } catch (err) {
        console.error('Failed to update onboarding:', err);
      }
    },
    [userId]
  );

  const isFeatureSeen = useCallback(
    (featureId: string): boolean => {
      if (!onboarding) return true; // Default to seen if no data
      return !!onboarding.tours_completed?.[featureId];
    },
    [onboarding]
  );

  const markFeatureSeen = useCallback(
    (featureId: string) => {
      if (!userId || !onboarding) return;

      // Optimistically update local state
      const updatedTours = {
        ...onboarding.tours_completed,
        [featureId]: true,
      };

      setOnboarding((prev) =>
        prev ? { ...prev, tours_completed: updatedTours } : prev
      );

      // Persist to server
      fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tours_completed: { [featureId]: true },
        }),
      }).catch((err) =>
        console.error('Failed to mark feature seen:', err)
      );
    },
    [userId, onboarding]
  );

  const handleWelcomeComplete = useCallback(
    (startTour: boolean) => {
      setShowWelcome(false);
      setOnboarding((prev) =>
        prev
          ? {
              ...prev,
              welcome_completed: true,
              onboarding_dismissed: !startTour,
            }
          : prev
      );

      if (startTour) {
        // Small delay so the welcome modal fully unmounts before tour starts
        setTimeout(() => {
          // 'dashboard' had no tour behind it — point at the real one.
          window.dispatchEvent(new CustomEvent('start-tour', { detail: 'tour-whats-new' }));
        }, 400);
      }
    },
    []
  );

  return (
    <OnboardingContext.Provider
      value={{
        onboarding,
        updateOnboarding,
        isFeatureSeen,
        markFeatureSeen,
        loading,
      }}
    >
      {showWelcome && userId && (
        <WelcomeModal userId={userId} onComplete={handleWelcomeComplete} />
      )}
      {children}
    </OnboardingContext.Provider>
  );
}
