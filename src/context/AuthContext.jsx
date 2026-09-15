import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getGuestProfile, resetGuestProfile, updateCurrentProfile } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (activeUser) => {
    const guestProfile = getGuestProfile();
    setProfile(guestProfile);
    return guestProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    loadProfile(null).finally(() => {
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    return loadProfile(user);
  }, [loadProfile, user]);

  const saveProfile = useCallback(async (updates) => {
    const data = await updateCurrentProfile(updates);
    setProfile(data);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setUser(null);
    setProfile(resetGuestProfile());
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    refreshProfile,
    saveProfile,
    signOut,
  }), [session, user, profile, loading, refreshProfile, saveProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
