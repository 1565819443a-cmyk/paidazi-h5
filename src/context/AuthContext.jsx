import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ensureProfile,
  getCurrentProfile,
  getGuestProfile,
  resetGuestProfile,
  updateCurrentProfile,
} from '../utils/supabase';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (activeUser) => {
    const nextProfile = activeUser
      ? await ensureProfile(activeUser)
      : getGuestProfile();
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!isSupabaseConfigured) {
        await loadProfile(null);
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const activeSession = data.session || null;
      if (!mounted) return;
      setSession(activeSession);
      setUser(activeSession?.user || null);
      await loadProfile(activeSession?.user || null);
      if (mounted) setLoading(false);
    }

    initialize().catch(async () => {
      await loadProfile(null);
      if (mounted) setLoading(false);
    });

    const subscription = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted) return;
          setSession(nextSession);
          setUser(nextSession?.user || null);
          loadProfile(nextSession?.user || null).catch(() => setProfile(getGuestProfile()));
        }).data.subscription
      : null;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return getGuestProfile();
    const next = await getCurrentProfile();
    setProfile(next);
    return next;
  }, [loadProfile, user]);

  const saveProfile = useCallback(async (updates) => {
    const data = await updateCurrentProfile(updates, user);
    setProfile(data);
    return data;
  }, [user]);

  const enterWithNickname = useCallback(async (nickname) => {
    if (!isSupabaseConfigured) throw new Error('线上账号服务尚未配置');
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { nickname: nickname.trim() } },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(resetGuestProfile());
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    isDemoMode: !user,
    refreshProfile,
    saveProfile,
    enterWithNickname,
    signOut,
  }), [session, user, profile, loading, refreshProfile, saveProfile, enterWithNickname, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
