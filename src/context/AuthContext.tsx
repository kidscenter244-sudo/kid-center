import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserAccount, QuizSessionSummary, StudentRosterRecord } from '../types';
import { CHARACTERS } from '../data/characters';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

const getTodayDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDayDiff = (fromDateStr: string, toDateStr: string): number => {
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const [ty, tm, td] = toDateStr.split('-').map(Number);
  if (!fy || !fm || !fd || !ty || !tm || !td) return 999;
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
};

const computeDailyStreakUpdate = (
  prevStreak?: number,
  prevDate?: string | null
): { dailyStreak: number; lastActiveDate: string; changed: boolean } => {
  const today = getTodayDateKey();
  if (!prevDate) {
    return { dailyStreak: 1, lastActiveDate: today, changed: true };
  }
  const cleanPrev = prevDate.slice(0, 10);
  if (cleanPrev === today) {
    const safe = Math.max(1, Number(prevStreak || 1));
    return { dailyStreak: safe, lastActiveDate: today, changed: safe !== prevStreak };
  }
  const diff = getDayDiff(cleanPrev, today);
  if (diff === 1) {
    return { dailyStreak: Math.max(1, Number(prevStreak || 0) + 1), lastActiveDate: today, changed: true };
  }
  if (diff > 1) {
    return { dailyStreak: 1, lastActiveDate: today, changed: true };
  }
  return { dailyStreak: Math.max(1, Number(prevStreak || 1)), lastActiveDate: cleanPrev, changed: false };
};

const getActiveDisplayDailyStreak = (streak?: number, lastActiveDate?: string | null): number => {
  if (!lastActiveDate) return 0;
  const diff = getDayDiff(lastActiveDate.slice(0, 10), getTodayDateKey());
  if (diff <= 1) return Math.max(1, Number(streak || 1));
  return 0;
};

const sanitizeUnearnedYamal = (profile: UserAccount): UserAccount => {
  // Lamine Yamal costs 15,000 coins; strip legacy free-starter Yamal if the account never earned enough coins to buy him.
  const maxEarned = Math.max(profile.stats?.totalCoinsEarned || 0, profile.coins || 0);
  if (
    profile.role === 'student' &&
    maxEarned < 15000 &&
    (profile.unlockedCharacters.includes('yamal-19') || profile.equippedCharacterId === 'yamal-19')
  ) {
    const cleanedUnlocked = profile.unlockedCharacters.filter((id) => id !== 'yamal-19');
    const cleanedEquipped =
      profile.equippedCharacterId === 'yamal-19' ? cleanedUnlocked[0] || '' : profile.equippedCharacterId;
    return {
      ...profile,
      unlockedCharacters: cleanedUnlocked,
      equippedCharacterId: cleanedEquipped
    };
  }
  return profile;
};

const DEFAULT_USER: UserAccount = {
  email: 'champion@kidscenter.com',
  nickname: 'Math Champion',
  role: 'student',
  coins: 450,
  unlockedCharacters: [],
  equippedCharacterId: '',
  stats: {
    totalSolved: 0,
    totalCorrect: 0,
    totalCoinsEarned: 450,
    bestStreak: 0,
    dailyStreak: 1,
    lastActiveDate: getTodayDateKey()
  },
  history: []
};

const LOCAL_ACCOUNTS_KEY = 'kids_center_local_accounts';
const TEACHER_PASSCODES = new Set(['01068545095', '1234']);

interface LocalAccountEntry {
  password: string;
  profile: UserAccount;
  updatedAt: string;
}

const readLocalAccounts = (): Record<string, LocalAccountEntry> => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeLocalAccounts = (accounts: Record<string, LocalAccountEntry>) => {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Local accounts write failed:', e);
  }
};

const buildLocalRoster = (): StudentRosterRecord[] => {
  const accounts = readLocalAccounts();
  return Object.entries(accounts)
    .filter(([, entry]) => entry?.profile?.role === 'student')
    .map(([emailKey, entry]) => {
      const p = sanitizeUnearnedYamal(entry.profile);
      const totalSolved = Number(p.stats?.totalSolved ?? 0);
      const totalCorrect = Number(p.stats?.totalCorrect ?? 0);
      const activeDaily = getActiveDisplayDailyStreak(p.stats?.dailyStreak, p.stats?.lastActiveDate);
      return {
        id: emailKey,
        name: p.nickname || emailKey.split('@')[0],
        email: p.email || emailKey,
        grade: 'Active Player',
        coins: Number(p.coins ?? 0),
        totalSolved,
        totalCorrect,
        accuracy: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 100,
        bestStreak: Number(p.stats?.bestStreak ?? 0),
        dailyStreak: activeDaily,
        lastActiveDate: p.stats?.lastActiveDate,
        equippedCharacterId: p.equippedCharacterId || '',
        unlockedCount: Array.isArray(p.unlockedCharacters) ? p.unlockedCharacters.length : 0,
        lastActive: entry.updatedAt || 'Recently active'
      };
    })
    .sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name));
};

const mapProfile = (row: any, email: string): UserAccount => {
  const rawUnlocked = Array.isArray(row.unlocked_characters) ? row.unlocked_characters : [];
  const rowStats = row.stats && typeof row.stats === 'object' ? row.stats : {};
  const mapped: UserAccount = {
    email: row.email || email,
    nickname: row.nickname || email.split('@')[0],
    role: row.role === 'teacher' ? 'teacher' : 'student',
    coins: Number(row.coins ?? 450),
    unlockedCharacters: rawUnlocked,
    equippedCharacterId:
      row.equipped_character_id && rawUnlocked.includes(row.equipped_character_id)
        ? row.equipped_character_id
        : rawUnlocked[0] || '',
    stats: {
      totalSolved: 0,
      totalCorrect: 0,
      totalCoinsEarned: 450,
      bestStreak: 0,
      ...rowStats,
      dailyStreak: Number(row.daily_streak ?? rowStats.dailyStreak ?? 0),
      lastActiveDate: row.last_active_date
        ? String(row.last_active_date).slice(0, 10)
        : rowStats.lastActiveDate
    },
    history: Array.isArray(row.history) ? row.history : []
  };
  return sanitizeUnearnedYamal(mapped);
};

const mapRosterRow = (row: any): StudentRosterRecord => {
  const stats = row.stats || {};
  const totalSolved = Number(row.total_solved ?? stats.totalSolved ?? 0);
  const totalCorrect = Number(row.total_correct ?? stats.totalCorrect ?? 0);
  const lastActiveDate = row.last_active_date
    ? String(row.last_active_date).slice(0, 10)
    : stats.lastActiveDate;
  const rawDaily = Number(row.daily_streak ?? stats.dailyStreak ?? 0);
  return {
    id: String(row.id),
    name: row.nickname || 'Math Champion',
    email: row.email || '',
    grade: 'Active Player',
    coins: Number(row.coins ?? 0),
    totalSolved,
    totalCorrect,
    accuracy: Number(row.accuracy ?? (totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 100)),
    bestStreak: Number(row.best_streak ?? stats.bestStreak ?? 0),
    dailyStreak:
      row.daily_streak !== undefined
        ? Number(row.daily_streak)
        : getActiveDisplayDailyStreak(rawDaily, lastActiveDate),
    lastActiveDate,
    equippedCharacterId: row.equipped_character_id || '',
    unlockedCount: Number(row.unlocked_count ?? (row.unlocked_characters || []).length ?? 0),
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
  const isRegisteringRef = useRef(false);

  const refreshStudentRoster = async () => {
    if (!isSupabaseConfigured) {
      setStudentRoster(buildLocalRoster());
      return;
    }
    const { data, error } = await supabase.rpc('get_public_leaderboard');
    if (error) {
      console.error('Could not load Supabase leaderboard:', error.message);
      throw error;
    }
    setStudentRoster((data || []).map(mapRosterRow));
  };

  const loadTeacherRoster = async (passcode: string) => {
    if (!isSupabaseConfigured) {
      if (!TEACHER_PASSCODES.has(passcode)) {
        throw new Error('Invalid teacher passcode');
      }
      setStudentRoster(buildLocalRoster());
      return;
    }
    const { data, error } = await supabase.rpc('teacher_get_roster', { p_passcode: passcode });
    if (error) throw error;
    setStudentRoster((data || []).map(mapRosterRow));
  };

  const persistProfile = async (authId: string, profile: UserAccount) => {
    if (!isSupabaseConfigured) return;
    const basePayload = {
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
    };

    const fullPayload = {
      ...basePayload,
      daily_streak: profile.stats.dailyStreak ?? 1,
      last_active_date: profile.stats.lastActiveDate || getTodayDateKey()
    };

    const { error } = await supabase.from('profiles').upsert(fullPayload, { onConflict: 'id' });
    if (error) {
      // Fallback if daily_streak / last_active_date columns haven't been added via SQL migration yet
      if (error.message?.includes('daily_streak') || error.message?.includes('last_active_date')) {
        const { error: fallbackErr } = await supabase.from('profiles').upsert(basePayload, { onConflict: 'id' });
        if (fallbackErr) {
          console.error('Supabase profile save failed:', fallbackErr.message);
          throw fallbackErr;
        }
        return;
      }
      console.error('Supabase profile save failed:', error.message);
      throw error;
    }
  };

  const loadCloudProfile = async (authId: string, email: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authId).maybeSingle();
    if (error) throw error;

    let cachedProfile: UserAccount | null = null;
    try {
      const cached = localStorage.getItem(`kids_center_user_${email.toLowerCase()}`);
      if (cached) {
        const parsed = JSON.parse(cached) as UserAccount;
        if (parsed?.email?.toLowerCase() === email.toLowerCase()) {
          cachedProfile = sanitizeUnearnedYamal(parsed);
        }
      }
    } catch { /* Ignore invalid local cache. */ }

    const cloudProfile = data
      ? mapProfile(data, email)
      : { ...DEFAULT_USER, email, nickname: email.split('@')[0] };

    let profile = cloudProfile;
    if (cachedProfile) {
      const cloudCharacters = cloudProfile.unlockedCharacters || [];
      const localCharacters = cachedProfile.unlockedCharacters || [];
      const restoreLocalWallet = localCharacters.length > cloudCharacters.length;
      const mergedStats = {
        totalSolved: Math.max(cloudProfile.stats.totalSolved || 0, cachedProfile.stats?.totalSolved || 0),
        totalCorrect: Math.max(cloudProfile.stats.totalCorrect || 0, cachedProfile.stats?.totalCorrect || 0),
        totalCoinsEarned: Math.max(cloudProfile.stats.totalCoinsEarned || 0, cachedProfile.stats?.totalCoinsEarned || 0),
        bestStreak: Math.max(cloudProfile.stats.bestStreak || 0, cachedProfile.stats?.bestStreak || 0),
        dailyStreak: Math.max(cloudProfile.stats.dailyStreak || 0, cachedProfile.stats?.dailyStreak || 0),
        lastActiveDate: cloudProfile.stats.lastActiveDate || cachedProfile.stats?.lastActiveDate
      };
      const mergedHistory = [...(cachedProfile.history || []), ...(cloudProfile.history || [])]
        .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index)
        .slice(0, 100);
      const mergedUnlocked = Array.from(new Set([...cloudCharacters, ...localCharacters]));
      profile = sanitizeUnearnedYamal({
        ...cloudProfile,
        coins: restoreLocalWallet ? Number(cachedProfile.coins ?? cloudProfile.coins) : cloudProfile.coins,
        unlockedCharacters: mergedUnlocked,
        equippedCharacterId: localCharacters.includes(cachedProfile.equippedCharacterId)
          ? cachedProfile.equippedCharacterId
          : (cloudCharacters.includes(cloudProfile.equippedCharacterId)
              ? cloudProfile.equippedCharacterId
              : mergedUnlocked[0] || ''),
        stats: mergedStats,
        history: mergedHistory
      });
    }

    // Touch daily login streak (via RPC if available, plus local calculation)
    let streakUpdated = false;
    try {
      const { data: streakData, error: streakErr } = await supabase.rpc('touch_daily_streak');
      if (!streakErr && Array.isArray(streakData) && streakData[0]) {
        profile = {
          ...profile,
          stats: {
            ...profile.stats,
            dailyStreak: Number(streakData[0].daily_streak || 1),
            lastActiveDate: String(streakData[0].last_active_date || getTodayDateKey()).slice(0, 10)
          }
        };
      } else {
        const nextStreak = computeDailyStreakUpdate(profile.stats.dailyStreak, profile.stats.lastActiveDate);
        if (nextStreak.changed) streakUpdated = true;
        profile = {
          ...profile,
          stats: {
            ...profile.stats,
            dailyStreak: nextStreak.dailyStreak,
            lastActiveDate: nextStreak.lastActiveDate
          }
        };
      }
    } catch {
      const nextStreak = computeDailyStreakUpdate(profile.stats.dailyStreak, profile.stats.lastActiveDate);
      if (nextStreak.changed) streakUpdated = true;
      profile = {
        ...profile,
        stats: {
          ...profile.stats,
          dailyStreak: nextStreak.dailyStreak,
          lastActiveDate: nextStreak.lastActiveDate
        }
      };
    }

    if (!data || streakUpdated || JSON.stringify(profile) !== JSON.stringify(cloudProfile)) {
      await persistProfile(authId, profile);
    }
    setAuthUserId(authId);
    setUser(profile);
    localStorage.setItem(`kids_center_user_${profile.email.toLowerCase()}`, JSON.stringify(profile));
    localStorage.setItem('kids_center_active_email', profile.email.toLowerCase());
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const activeEmail = localStorage.getItem('kids_center_active_email');
      if (activeEmail) {
        const lower = activeEmail.toLowerCase();
        const accounts = readLocalAccounts();
        if (accounts[lower]?.profile) {
          let p = sanitizeUnearnedYamal(accounts[lower].profile);
          const streakUpdate = computeDailyStreakUpdate(p.stats?.dailyStreak, p.stats?.lastActiveDate);
          if (streakUpdate.changed || p !== accounts[lower].profile) {
            p = {
              ...p,
              stats: {
                ...p.stats,
                dailyStreak: streakUpdate.dailyStreak,
                lastActiveDate: streakUpdate.lastActiveDate
              }
            };
            accounts[lower] = {
              ...accounts[lower],
              profile: p,
              updatedAt: new Date().toISOString()
            };
            writeLocalAccounts(accounts);
            localStorage.setItem(`kids_center_user_${lower}`, JSON.stringify(p));
          }
          setUser(p);
        } else {
          try {
            const cached =
              localStorage.getItem(`kids_center_user_${lower}`) ||
              localStorage.getItem(`kids_center_user_${activeEmail}`);
            if (cached) {
              let p = sanitizeUnearnedYamal(JSON.parse(cached) as UserAccount);
              const streakUpdate = computeDailyStreakUpdate(p.stats?.dailyStreak, p.stats?.lastActiveDate);
              if (streakUpdate.changed) {
                p = {
                  ...p,
                  stats: {
                    ...p.stats,
                    dailyStreak: streakUpdate.dailyStreak,
                    lastActiveDate: streakUpdate.lastActiveDate
                  }
                };
                localStorage.setItem(`kids_center_user_${lower}`, JSON.stringify(p));
              }
              setUser(p);
            } else if (lower === DEFAULT_USER.email) {
              setUser(DEFAULT_USER);
            }
          } catch {
            if (lower === DEFAULT_USER.email) setUser(DEFAULT_USER);
          }
        }
      }
      setStudentRoster(buildLocalRoster());
      return;
    }

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
      if (!alive || isRegisteringRef.current) return;
      if (session?.user.email) {
        window.setTimeout(async () => {
          if (!alive || isRegisteringRef.current) return;
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
    const cleanEmail = updated.email.toLowerCase();
    try {
      localStorage.setItem(`kids_center_user_${cleanEmail}`, JSON.stringify(updated));
      if (updated.role !== 'teacher') localStorage.setItem('kids_center_active_email', cleanEmail);
    } catch (e) { console.error('Local cache update failed:', e); }

    if (!isSupabaseConfigured) {
      if (updated.role === 'student' && cleanEmail !== DEFAULT_USER.email) {
        const accounts = readLocalAccounts();
        accounts[cleanEmail] = {
          password: accounts[cleanEmail]?.password || '',
          profile: updated,
          updatedAt: new Date().toISOString()
        };
        writeLocalAccounts(accounts);
      }
      setStudentRoster(buildLocalRoster());
      return;
    }

    if (authUserId && updated.role === 'student') {
      const id = authUserId;
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

    if (!isSupabaseConfigured) {
      const accounts = readLocalAccounts();
      const existing = accounts[cleanEmail];
      if (!existing || existing.password !== pass) {
        return { success: false, message: 'Invalid email or password.' };
      }
      let p = sanitizeUnearnedYamal(existing.profile);
      const streakUpdate = computeDailyStreakUpdate(p.stats?.dailyStreak, p.stats?.lastActiveDate);
      p = {
        ...p,
        stats: {
          ...p.stats,
          dailyStreak: streakUpdate.dailyStreak,
          lastActiveDate: streakUpdate.lastActiveDate
        }
      };
      accounts[cleanEmail] = {
        ...existing,
        profile: p,
        updatedAt: new Date().toISOString()
      };
      writeLocalAccounts(accounts);
      setAuthUserId(null);
      setTeacherPasscode(null);
      setUser(p);
      localStorage.setItem(`kids_center_user_${cleanEmail}`, JSON.stringify(p));
      localStorage.setItem('kids_center_active_email', cleanEmail);
      setStudentRoster(buildLocalRoster());
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome back, ${p.nickname}!` };
    }

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
    const today = getTodayDateKey();

    if (!isSupabaseConfigured) {
      const accounts = readLocalAccounts();
      if (accounts[cleanEmail]) {
        return { success: false, message: 'An account with this email already exists. Please sign in.' };
      }
      const newProfile: UserAccount = {
        email: cleanEmail,
        nickname: cleanNickname,
        role: 'student',
        coins: 450,
        unlockedCharacters: [],
        equippedCharacterId: '',
        stats: {
          totalSolved: 0,
          totalCorrect: 0,
          totalCoinsEarned: 450,
          bestStreak: 0,
          dailyStreak: 1,
          lastActiveDate: today
        },
        history: []
      };
      accounts[cleanEmail] = {
        password: pass,
        profile: newProfile,
        updatedAt: new Date().toISOString()
      };
      writeLocalAccounts(accounts);
      localStorage.setItem(`kids_center_user_${cleanEmail}`, JSON.stringify(newProfile));
      localStorage.setItem('kids_center_active_email', cleanEmail);
      setAuthUserId(null);
      setTeacherPasscode(null);
      setUser(newProfile);
      setStudentRoster(buildLocalRoster());
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome, ${cleanNickname}!` };
    }

    isRegisteringRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { nickname: cleanNickname, role: 'student' } }
      });
      if (error) return { success: false, message: error.message };
      if (!data.session || !data.user) {
        return { success: false, message: 'Account created. Please sign in after confirming your email if confirmation is enabled.' };
      }
      const newProfile: UserAccount = {
        email: cleanEmail,
        nickname: cleanNickname,
        role: 'student',
        coins: 450,
        unlockedCharacters: [],
        equippedCharacterId: '',
        stats: {
          totalSolved: 0,
          totalCorrect: 0,
          totalCoinsEarned: 450,
          bestStreak: 0,
          dailyStreak: 1,
          lastActiveDate: today
        },
        history: []
      };
      await persistProfile(data.user.id, newProfile);
      localStorage.setItem(`kids_center_user_${cleanEmail}`, JSON.stringify(newProfile));
      localStorage.setItem('kids_center_active_email', cleanEmail);
      setAuthUserId(data.user.id);
      setUser(newProfile);
      await refreshStudentRoster();
      setIsAuthModalOpen(false);
      return { success: true, message: `Welcome, ${cleanNickname}!` };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Account created but profile could not be saved. Please sign in again.' };
    } finally {
      isRegisteringRef.current = false;
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
        stats: { totalSolved: 999, totalCorrect: 999, totalCoinsEarned: 99999, bestStreak: 100, dailyStreak: 1 }, history: []
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
    setAuthUserId(null);
    setTeacherPasscode(null);
    let guestProfile = DEFAULT_USER;
    try {
      const cached = localStorage.getItem(`kids_center_user_${DEFAULT_USER.email}`);
      if (cached) guestProfile = sanitizeUnearnedYamal(JSON.parse(cached) as UserAccount);
    } catch { /* ignore */ }
    const streakUpdate = computeDailyStreakUpdate(guestProfile.stats?.dailyStreak, guestProfile.stats?.lastActiveDate);
    guestProfile = {
      ...guestProfile,
      stats: {
        ...guestProfile.stats,
        dailyStreak: streakUpdate.dailyStreak,
        lastActiveDate: streakUpdate.lastActiveDate
      }
    };
    setUser(guestProfile);
    localStorage.setItem(`kids_center_user_${DEFAULT_USER.email}`, JSON.stringify(guestProfile));
    localStorage.setItem('kids_center_active_email', DEFAULT_USER.email);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    void (async () => {
      try { await pendingSave.current; } catch (e) { console.error(e); }
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
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
    const streakUpdate = computeDailyStreakUpdate(user.stats.dailyStreak, user.stats.lastActiveDate);
    saveUser({ ...user, coins: user.coins + session.coinsEarned, stats: {
      ...user.stats,
      totalSolved: user.stats.totalSolved + session.totalQuestions,
      totalCorrect: user.stats.totalCorrect + session.correctAnswers,
      totalCoinsEarned: user.stats.totalCoinsEarned + session.coinsEarned,
      bestStreak: Math.max(user.stats.bestStreak, sessionBestStreak),
      dailyStreak: streakUpdate.dailyStreak,
      lastActiveDate: streakUpdate.lastActiveDate
    }, history: [session, ...user.history].slice(0, 100) });
  };

  const exportSyncCode = () => {
    if (!user) return '';
    try { return btoa(encodeURIComponent(JSON.stringify(user))); } catch { return ''; }
  };

  const importSyncCode = (code: string) => {
    try {
      const parsed: UserAccount = sanitizeUnearnedYamal(JSON.parse(decodeURIComponent(atob(code.trim()))));
      if (!parsed.email) return { success: false, message: 'Invalid code.' };
      saveUser(parsed); return { success: true, message: `Loaded profile: ${parsed.nickname}` };
    } catch { return { success: false, message: 'Invalid code format.' }; }
  };

  const awardStudentCoins = async (studentId: string, amount: number) => {
    if (!teacherPasscode) throw new Error('Teacher session expired. Please sign in again.');
    const safeAmount = Math.max(1, Math.min(10000, Math.floor(amount)));

    if (!isSupabaseConfigured) {
      const accounts = readLocalAccounts();
      const entry = accounts[studentId];
      if (!entry) throw new Error('Student profile not found');
      const updatedProfile: UserAccount = {
        ...entry.profile,
        coins: entry.profile.coins + safeAmount,
        stats: {
          ...entry.profile.stats,
          totalCoinsEarned: (entry.profile.stats?.totalCoinsEarned || 0) + safeAmount
        }
      };
      accounts[studentId] = {
        ...entry,
        profile: updatedProfile,
        updatedAt: new Date().toISOString()
      };
      writeLocalAccounts(accounts);
      localStorage.setItem(`kids_center_user_${studentId}`, JSON.stringify(updatedProfile));
      setStudentRoster(buildLocalRoster());
      return;
    }

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
