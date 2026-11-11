import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserAccount, QuizSessionSummary, StudentRosterRecord } from '../types';
import { CHARACTERS } from '../data/characters';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isTeacher: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  teacherLogin: (passcode: string) => Promise<{ success: boolean; message: string }>;
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
  refreshStudentRoster: () => Promise<void>;
  awardStudentCoins: (studentId: string, amount: number) => Promise<void>;
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
  stats: {
    totalSolved: 0, totalCorrect: 0, totalCoinsEarned: 450, bestStreak: 0,
    ...(row.stats && typeof row.stats === 'object' ? row.stats : {})
  },
  history: Array.isArray(row.history) ? row.history : []
});

const mapRosterRow = (row: any): StudentRosterRecord => {
  const stats = row.stats || {};
  const totalSolved = Number(row.total_solved ?? stats.totalSolved ?? 0);
  const totalCorrect = Number(row.total_correct ?? stats.totalCorrect ?? 0);
  return {
    id: String(row.id),
    name: row.nickname || 'Math Champion',
    email: row.email || '',
    grade: 'Active Player',
    coins: Number(row.coins ?? 0),
    totalSolved,
    totalCorrect,
    accuracy: Number(row.accuracy ?? (totalSolved ? Math.round(totalCorrect / totalSolved * 100) : 100)),
    bestStreak: Number(row.best_streak ?? stats.bestStreak ?? 0),
    equippedCharacterId: row.equipped_character_id || 'yamal-19',
    unlockedCount: Number(row.unlocked_count ?? (row.unlocked_characters || []).length ?? 1),
    lastActive: row.updated_at || 'Recently active'
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [teacherPasscode, setTeacherPasscode] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [studentRoster, setStudentRoster] = useState<StudentRosterRecord[]>([]);
  const pendingSave = useRef<Promise<void>>(Promise.resolve());

  const refreshStudentRoster = async () => {
    const { data, error } = await supabase.rpc('get_public_leaderboard');
    if (error) {
      console.error('Could not load Supabase leaderboard:', error.message);
      throw error;
    }
    setStudentRoster((data || []).map(mapRosterRow));
  };

  const loadTeacherRoster = async (passcode: string) => {
    const { data, error } = await supabase.rpc('teacher_get_roster', { p_passcode: passcode });
    if (error) throw error;
    setStudentRoster((data || []).map(mapRosterRow));
  };

  const persistProfile = async (authId: string, profile: UserAccount) => {
    const { error } = await supabase.from('profiles').upsert({
      id: authId,
      email: profile.email,
      nickname: profile.nickname,
      role: 'student',
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

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!alive) return;
      if (error) { console.error(error); return; }
      const session = data.session;
      if (session?.user.email) {
        try {
          await loadCloudProfile(session.user.id, session.user.email);
          await refreshStudentRoster();
        } catch (e) { console.error('Could not restore cloud player data:', e); }
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session?.user.email) {
        window.setTimeout(async () => {
          if (!alive) return;
          try {
            await loadCloudProfile(session.user.id, session.user.email!);
            await refreshStudentRoster();
          } catch (e) { console.error('Could not sync signed-in player:', e); }
        }, 0);
      } else if (!teacherPasscode) {
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
    } catch (e) { console.error('Local cache update failed:', e); }

    if (authUserId && updated.role === 'student') {
      const id = authUserId;
      // Serialize writes so a fast sequence of purchases/rewards cannot overwrite newer data with an older snapshot.
      pendingSave.current = pendingSave.current
        .catch(() => undefined)
        .then(() => persistProfile(id, updated))
        .then(() => refreshStudentRoster())
        .catch(e => console.error('Could not sync player progress to Supabase:', e));
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
      await refreshStudentRoster();
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
      return { success: false, message: 'Account created. Please sign in after confirming your email if confirmation is enabled.' };
    }
    try {
      let legacyProfile: UserAccount | null = null;
      try {
        const legacy = localStorage.getItem(`kids_center_user_${cleanEmail}`);
        if (legacy) legacyProfile = JSON.parse(legacy) as UserAccount;
      } catch { /* Ignore malformed legacy cache. */ }
      const newProfile: UserAccount = legacyProfile ? {
        ...legacyProfile, email: cleanEmail, nickname: cleanNickname || legacyProfile.nickname, role: 'student'
      } : {
        email: cleanEmail, nickname: cleanNickname, role: 'student', coins: 450,
        unlockedCharacters: ['yamal-19'], equippedCharacterId: 'yamal-19',
        stats: { totalSolved: 0, totalCorrect: 0, totalCoinsEarned: 450, bestStreak: 0 }, history: []
      };
      await persistProfile(data.user.id, newProfile);
      setAuthUserId(data.user.id);
      setUser(newProfile);
      await refreshStudentRoster();
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome, ${cleanNickname}!` };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Account created but profile could not be saved. Please sign in again.' };
    }
  };

  const teacherLogin = async (passcode: string) => {
    const cleanPasscode = passcode.trim();
    if (!cleanPasscode) return { success: false, message: 'Enter the teacher passcode.' };
    try {
      await loadTeacherRoster(cleanPasscode);
      setTeacherPasscode(cleanPasscode);
      const teacher: UserAccount = {
        email: 'teacher@kidscenter.com', nickname: 'Coach Ahmed (Teacher)', role: 'teacher',
        coins: 99999, unlockedCharacters: CHARACTERS.map(c => c.id), equippedCharacterId: 'messi-10',
        stats: { totalSolved: 999, totalCorrect: 999, totalCoinsEarned: 99999, bestStreak: 100 }, history: []
      };
      setUser(teacher);
      setAuthUserId(null);
      setIsAuthModalOpen(false);
      return { success: true, message: 'Teacher Portal Access Granted!' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Teacher access failed. Check the passcode and database setup.' };
    }
  };

  const loginGuest = () => {
    setAuthUserId(null); setTeacherPasscode(null); setUser(DEFAULT_USER); setIsAuthModalOpen(false);
  };

  const logout = () => {
    void (async () => {
      try { await pendingSave.current; } catch (e) { console.error(e); }
      await supabase.auth.signOut();
      setAuthUserId(null); setTeacherPasscode(null); setUser(null); setIsAuthModalOpen(false);
      localStorage.removeItem('kids_center_active_email');
      localStorage.removeItem('kids_center_passed_gate');
    })();
  };

  const addCoins = (amount: number) => {
    if (!user || user.role !== 'student') return;
    saveUser({ ...user, coins: Math.max(0, user.coins + amount), stats: {
      ...user.stats, totalCoinsEarned: amount > 0 ? user.stats.totalCoinsEarned + amount : user.stats.totalCoinsEarned
    }});
  };

  const unlockCharacter = (characterId: string, price: number) => {
    if (!user || user.role !== 'student' || user.unlockedCharacters.includes(characterId) || user.coins < price) {
      return !!user?.unlockedCharacters.includes(characterId);
    }
    saveUser({ ...user, coins: user.coins - price, unlockedCharacters: [...user.unlockedCharacters, characterId], equippedCharacterId: characterId });
    return true;
  };

  const equipCharacter = (characterId: string) => {
    if (user?.role === 'student' && user.unlockedCharacters.includes(characterId)) {
      saveUser({ ...user, equippedCharacterId: characterId });
    }
  };

  const saveSession = (session: QuizSessionSummary) => {
    if (!user || user.role !== 'student') return;
    let currentRun = 0;
    let sessionBestStreak = 0;
    for (const problem of session.problems || []) {
      if (problem.isCorrect) {
        currentRun += 1;
        sessionBestStreak = Math.max(sessionBestStreak, currentRun);
      } else {
        currentRun = 0;
      }
    }
    saveUser({ ...user, coins: user.coins + session.coinsEarned, stats: {
      ...user.stats,
      totalSolved: user.stats.totalSolved + session.totalQuestions,
      totalCorrect: user.stats.totalCorrect + session.correctAnswers,
      totalCoinsEarned: user.stats.totalCoinsEarned + session.coinsEarned,
      bestStreak: Math.max(user.stats.bestStreak, sessionBestStreak)
    }, history: [session, ...user.history].slice(0, 100) });
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
    } catch { return { success: false, message: 'Invalid code format.' };
  };

  const awardStudentCoins = async (studentId: string, amount: number) => {
    if (!teacherPasscode) throw new Error('Teacher session expired. Please sign in again.');
    const safeAmount = Math.max(1, Math.min(10000, Math.floor(amount)));
    const { error } = await supabase.rpc('teacher_award_coins', {
      p_passcode: teacherPasscode, p_student_id: studentId, p_amount: safeAmount
    });
    if (error) throw error;
    await loadTeacherRoster(teacherPasscode);
  };

  return <AuthContext.Provider value={{
    user, isAuthenticated: !!user && user.email !== DEFAULT_USER.email, isTeacher: user?.role === 'teacher',
    login, teacherLogin, register, loginGuest, logout, addCoins, unlockCharacter, equipCharacter, saveSession,
    exportSyncCode, importSyncCode, openAuthModal: () => setIsAuthModalOpen(true),
    closeAuthModal: () => setIsAuthModalOpen(false), isAuthModalOpen, studentRoster,
    refreshStudentRoster, awardStudentCoins
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
