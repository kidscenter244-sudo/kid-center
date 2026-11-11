import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, QuizSessionSummary, StudentRosterRecord } from '../types';
import { CHARACTERS } from '../data/characters';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isTeacher: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  teacherLogin: (passcode: string) => { success: boolean; message: string };
  register: (email: string, pass: string, nickname: string) => Promise<{ success: boolean; message: string }>;
  loginGuest: () => void;
  logout: () => void;
  addCoins: (amount: number) => void;
  unlockCharacter: (characterId: string, price: number) => boolean;
  equipCharacter: (characterId: string) => void;
  saveSession: (session: QuizSessionSummary) => void;
  exportSyncCode: () => string;
  importSyncCode: (code: string) => { success: boolean; message: string };
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  studentRoster: StudentRosterRecord[];
  awardStudentCoins: (studentId: string, amount: number) => void;
}

const DEFAULT_USER: UserAccount = {
  email: 'champion@kidscenter.com', nickname: 'Math Champion', role: 'student',
  coins: 450, unlockedCharacters: ['yamal-19'], equippedCharacterId: 'yamal-19',
  stats: { totalSolved: 0, totalCorrect: 0, totalCoinsEarned: 450, bestStreak: 0 }, history: []
};

const mapProfile = (row: any, email: string): UserAccount => ({
  email: row.email || email,
  nickname: row.nickname || email.split('@')[0],
  role: row.role === 'teacher' ? 'teacher' : 'student',
  coins: Number(row.coins ?? 450),
  unlockedCharacters: Array.isArray(row.unlocked_characters) && row.unlocked_characters.length ? row.unlocked_characters : ['yamal-19'],
  equippedCharacterId: row.equipped_character_id || 'yamal-19',
  stats: row.stats || { totalSolved: 0, totalCorrect: 0, totalCoinsEarned: 450, bestStreak: 0 },
  history: Array.isArray(row.history) ? row.history : []
});

const loadRealStudentsRoster = (): StudentRosterRecord[] => {
  try {
    const stored = localStorage.getItem('kids_center_roster');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [studentRoster, setStudentRoster] = useState<StudentRosterRecord[]>(() => loadRealStudentsRoster());

  const loadCloudProfile = async (authId: string, email: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authId).maybeSingle();
    if (error) throw error;
    if (data) {
      const profile = mapProfile(data, email);
      setAuthUserId(authId);
      setUser(profile);
      localStorage.setItem(`kids_center_user_${profile.email}`, JSON.stringify(profile));
      localStorage.setItem('kids_center_active_email', profile.email);
    } else {
      const profile = { ...DEFAULT_USER, email, nickname: email.split('@')[0] };
      await persistProfile(authId, profile);
      setAuthUserId(authId);
      setUser(profile);
    }
  };

  const persistProfile = async (authId: string, profile: UserAccount) => {
    const { error } = await supabase.from('profiles').upsert({
      id: authId,
      email: profile.email,
      nickname: profile.nickname,
      role: profile.role,
      coins: profile.coins,
      unlocked_characters: profile.unlockedCharacters,
      equipped_character_id: profile.equippedCharacterId,
      stats: profile.stats,
      history: profile.history,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) {
      console.error('Supabase profile save failed:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!alive) return;
      if (error) { console.error(error); return; }
      const session = data.session;
      if (session?.user.email) {
        try { await loadCloudProfile(session.user.id, session.user.email); }
        catch (e) { console.error('Could not load player profile:', e); }
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session?.user.email) {
        window.setTimeout(() => {
          if (alive) loadCloudProfile(session.user.id, session.user.email!).catch(e => console.error(e));
        }, 0);
      } else {
        setAuthUserId(null);
        setUser(null);
      }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const saveUser = (updated: UserAccount) => {
    setUser(updated);
    try {
      localStorage.setItem(`kids_center_user_${updated.email}`, JSON.stringify(updated));
      if (updated.role !== 'teacher') localStorage.setItem('kids_center_active_email', updated.email);
      if (updated.role === 'student') {
        setStudentRoster(prev => {
          const record: StudentRosterRecord = {
            id: updated.email, name: updated.nickname, email: updated.email, grade: 'Active Player',
            coins: updated.coins, totalSolved: updated.stats.totalSolved, totalCorrect: updated.stats.totalCorrect,
            accuracy: updated.stats.totalSolved ? Math.round(updated.stats.totalCorrect / updated.stats.totalSolved * 100) : 100,
            bestStreak: updated.stats.bestStreak, equippedCharacterId: updated.equippedCharacterId,
            unlockedCount: updated.unlockedCharacters.length, lastActive: 'Just now'
          };
          const next = [record, ...prev.filter(s => s.email.toLowerCase() !== updated.email.toLowerCase())];
          localStorage.setItem('kids_center_roster', JSON.stringify(next));
          return next;
        });
      }
    } catch (e) { console.error(e); }
    if (authUserId && updated.role === 'student') {
      void persistProfile(authUserId, updated).catch(e => console.error('Could not sync player progress:', e));
    }
  };

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) return { success: false, message: 'Please enter both email and password.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
    if (error) return { success: false, message: error.message };
    if (!data.user?.email) return { success: false, message: 'Could not verify your account.' };
    try {
      await loadCloudProfile(data.user.id, data.user.email);
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome back, ${cleanEmail}!` };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Could not load your player profile.' };
    }
  };

  const register = async (email: string, pass: string, nickname: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, message: 'Please enter a valid email address.' };
    if (!pass || pass.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
    const cleanNickname = nickname.trim() || cleanEmail.split('@')[0];
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail, password: pass, options: { data: { nickname: cleanNickname, role: 'student' } }
    });
    if (error) return { success: false, message: error.message };
    if (!data.session || !data.user) {
      return { success: false, message: 'Account created. Please confirm your email, then sign in. To enable instant access, turn off email confirmations in Supabase Authentication settings.' };
    }
    try {
      // Preserve progress from this browser's legacy local account when the player re-registers.
      let legacyProfile: UserAccount | null = null;
      try {
        const legacy = localStorage.getItem(`kids_center_user_${cleanEmail}`);
        if (legacy) legacyProfile = JSON.parse(legacy) as UserAccount;
      } catch { /* Ignore malformed legacy cache and start a clean profile. */ }
      const newProfile: UserAccount = legacyProfile ? {
        ...legacyProfile,
        email: cleanEmail,
        nickname: cleanNickname || legacyProfile.nickname,
        role: 'student'
      } : {
        email: cleanEmail, nickname: cleanNickname, role: 'student', coins: 450,
        unlockedCharacters: ['yamal-19'], equippedCharacterId: 'yamal-19',
        stats: { totalSolved: 0, totalCorrect: 0, totalCoinsEarned: 450, bestStreak: 0 }, history: []
      };
      await persistProfile(data.user.id, newProfile);
      setAuthUserId(data.user.id);
      setUser(newProfile);
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome, ${cleanNickname}!` };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Account created but profile could not be saved. Please sign in again.' };
    }
  };

  const teacherLogin = (passcode: string) => {
    if (['01068545095', '1234'].includes(passcode.trim())) {
      const teacher: UserAccount = {
        email: 'teacher@kidscenter.com', nickname: 'Coach Ahmed (Teacher)', role: 'teacher',
        coins: 99999, unlockedCharacters: CHARACTERS.map(c => c.id), equippedCharacterId: 'messi-10',
        stats: { totalSolved: 999, totalCorrect: 999, totalCoinsEarned: 99999, bestStreak: 100 }, history: []
      };
      setUser(teacher); setAuthUserId(null); setIsAuthModalOpen(false);
      return { success: true, message: 'Teacher Portal Access Granted!' };
    }
    return { success: false, message: 'Incorrect teacher passcode!' };
  };

  const loginGuest = () => { setAuthUserId(null); setUser(DEFAULT_USER); setIsAuthModalOpen(false); };
  const logout = () => {
    void supabase.auth.signOut();
    setAuthUserId(null); setUser(null); setIsAuthModalOpen(false);
    localStorage.removeItem('kids_center_active_email');
    localStorage.removeItem('kids_center_passed_gate');
  };
  const addCoins = (amount: number) => {
    if (!user) return;
    saveUser({ ...user, coins: Math.max(0, user.coins + amount), stats: {
      ...user.stats, totalCoinsEarned: amount > 0 ? user.stats.totalCoinsEarned + amount : user.stats.totalCoinsEarned
    }});
  };
  const unlockCharacter = (characterId: string, price: number) => {
    if (!user || user.unlockedCharacters.includes(characterId) || user.coins < price) return !!user?.unlockedCharacters.includes(characterId);
    saveUser({ ...user, coins: user.coins - price, unlockedCharacters: [...user.unlockedCharacters, characterId], equippedCharacterId: characterId });
    return true;
  };
  const equipCharacter = (characterId: string) => {
    if (user?.unlockedCharacters.includes(characterId)) saveUser({ ...user, equippedCharacterId: characterId });
  };
  const saveSession = (session: QuizSessionSummary) => {
    if (!user) return;
    saveUser({ ...user, coins: user.coins + session.coinsEarned, stats: {
      totalSolved: user.stats.totalSolved + session.totalQuestions,
      totalCorrect: user.stats.totalCorrect + session.correctAnswers,
      totalCoinsEarned: user.stats.totalCoinsEarned + session.coinsEarned,
      bestStreak: Math.max(user.stats.bestStreak, session.correctAnswers)
    }, history: [session, ...user.history.slice(0, 19)] });
  };
  const exportSyncCode = () => {
    if (!user) return '';
    try { return btoa(encodeURIComponent(JSON.stringify(user))); } catch { return ''; }
  };
  const importSyncCode = (code: string) => {
    try {
      const parsed: UserAccount = JSON.parse(decodeURIComponent(atob(code.trim())));
      if (!parsed.email) return { success: false, message: 'Invalid code.' };
      saveUser(parsed); return { success: true, message: `Loaded profile: ${parsed.nickname}` };
    } catch { return { success: false, message: 'Invalid code format.' }; }
  };
  const awardStudentCoins = (studentId: string, amount: number) => {
    setStudentRoster(prev => {
      const next = prev.map(s => s.id === studentId ? { ...s, coins: s.coins + amount } : s);
      localStorage.setItem('kids_center_roster', JSON.stringify(next)); return next;
    });
  };

  return <AuthContext.Provider value={{
    user, isAuthenticated: !!user && user.email !== DEFAULT_USER.email, isTeacher: user?.role === 'teacher',
    login, teacherLogin, register, loginGuest, logout, addCoins, unlockCharacter, equipCharacter, saveSession,
    exportSyncCode, importSyncCode, openAuthModal: () => setIsAuthModalOpen(true),
    closeAuthModal: () => setIsAuthModalOpen(false), isAuthModalOpen, studentRoster, awardStudentCoins
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
