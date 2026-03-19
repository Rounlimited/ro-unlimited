'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserPreferences {
  id?: string;
  user_id: string;
  theme: 'dark' | 'light';
  font_size: 'small' | 'normal' | 'large';
  animations_enabled: boolean;
  compact_mode: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  feature_flags: Record<string, boolean>;
  custom_settings: Record<string, unknown>;
}

interface PreferencesContextType {
  preferences: UserPreferences | null;
  updatePreference: (fields: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: null,
  updatePreference: async () => {},
  loading: true,
});

export function usePreferences() {
  return useContext(PreferencesContext);
}

// Apply theme class to document root
function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  } else {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  }
}

function applyFontSize(size: string) {
  const root = document.documentElement;
  root.classList.remove('font-small', 'font-normal', 'font-large');
  root.classList.add(`font-${size}`);
}

export default function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage first for instant theme (no flash)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('ro_user_prefs');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyTheme(parsed.theme || 'dark');
        applyFontSize(parsed.font_size || 'normal');
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch from server
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || cancelled) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const res = await fetch(`/api/admin/preferences?user_id=${user.id}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (cancelled) return;

        const prefs = json.preferences || json;
        setPreferences(prefs);

        // Apply and cache
        applyTheme(prefs.theme || 'dark');
        applyFontSize(prefs.font_size || 'normal');
        localStorage.setItem('ro_user_prefs', JSON.stringify(prefs));
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const updatePreference = useCallback(async (fields: Partial<UserPreferences>) => {
    if (!userId) return;

    // Optimistic update
    setPreferences(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      // Apply theme/font immediately
      if (fields.theme) applyTheme(fields.theme);
      if (fields.font_size) applyFontSize(fields.font_size);
      localStorage.setItem('ro_user_prefs', JSON.stringify(updated));
      return updated;
    });

    // Persist to server
    try {
      const res = await fetch('/api/admin/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...fields }),
      });

      if (res.ok) {
        const json = await res.json();
        const serverPrefs = json.preferences || json;
        setPreferences(serverPrefs);
        localStorage.setItem('ro_user_prefs', JSON.stringify(serverPrefs));
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  }, [userId]);

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
}
