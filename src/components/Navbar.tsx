import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../utils/audio';
import { Calculator, Sparkles, GraduationCap, Crown, Flame, LogOut, Coins, Languages } from 'lucide-react';
import { CHARACTERS, getPlayerPhotoUrl } from '../data/characters';
import { MathRobloxLogo } from './MathRobloxLogo';

export type AppNavTab = 'training' | 'rewards-guide' | 'leaderboard' | 'locker' | 'history' | 'teacher';

interface NavbarProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, openAuthModal, isTeacher, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();

  const equippedChar = CHARACTERS.find((c) => c.id === user?.equippedCharacterId);
  const dailyStreak = user?.stats?.dailyStreak ?? 1;

  return (
    <>
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 sm:top-2 z-40 w-full px-2 sm:px-4 py-1.5">
        <div className="w-full lg:w-[86%] max-w-6xl mx-auto bg-white/95 backdrop-blur-md border-2 sm:border-3 border-neutral-900 shadow-[0_4px_0_0_#171717] sm:shadow-[0_6px_0_0_#171717] rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2 flex items-center justify-between gap-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 animate-pulse" />

          {/* Brand Logo */}
          <div
            onClick={() => {
              sounds.playKeyClick();
              setActiveTab('training');
            }}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <MathRobloxLogo size="md" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-black tracking-tight text-neutral-900 leading-none">
                  {t('Kids Center', 'كيدز سنتر')}
                </h1>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                {t('Pro Games • 50+ Players', 'ألعاب المحترفين • +50 لاعب')}
              </span>
            </div>
          </div>

          {/* Right side Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Daily Login Streak Badge */}
            <div
              onClick={() => {
                sounds.playKeyClick();
                setActiveTab('leaderboard');
              }}
              className="flex items-center gap-1 bg-orange-100 hover:bg-orange-200 border-2 border-neutral-900 px-2 sm:px-2.5 py-1 rounded-xl shadow-[0_2px_0_0_#171717] cursor-pointer transition-all active:translate-y-0.5"
              title={t('Daily Login Streak — open every day to grow it!', 'سلسلة الدخول اليومي — افتح الموقع كل يوم لزيادتها!')}
              dir="ltr"
            >
              <span className="text-xs sm:text-sm">🔥</span>
              <span className="font-black text-xs text-orange-950 font-mono">
                {dailyStreak}d
              </span>
            </div>

            {/* Coins Badge */}
            <div
              onClick={() => {
                sounds.playCoin();
                setActiveTab('rewards-guide');
              }}
              className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 border-2 border-neutral-900 px-2 sm:px-3 py-1 rounded-xl shadow-[0_2px_0_0_#171717] cursor-pointer transition-all active:translate-y-0.5"
              title={t('Click to view Points & Rewards Guide!', 'اضغط لعرض دليل النقاط والمكافآت')}
              dir="ltr"
            >
              <span className="text-sm">🪙</span>
              <span className="font-black text-xs sm:text-sm text-neutral-900 font-mono">
                {user?.coins.toLocaleString() ?? 0}
              </span>
            </div>

            {/* Language Toggle (EN <-> عربي) */}
            <button
              onClick={() => {
                sounds.playKeyClick();
                toggleLang();
              }}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-2 border-neutral-900 rounded-xl cursor-pointer shadow-[0_2px_0_0_#171717] active:translate-y-0.5 flex items-center gap-1 text-[11px] font-black transition-all"
              title={t('Switch to Arabic', 'التبديل إلى الإنجليزية')}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                sounds.setEnabled(!sounds.isEnabled());
                sounds.playKeyClick();
              }}
              className="p-1 sm:p-1.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-900 rounded-xl cursor-pointer text-neutral-800 shadow-[0_2px_0_0_#171717] active:translate-y-0.5 text-xs"
              title={t('Toggle Sound Effects', 'تشغيل / إيقاف الصوت')}
            >
              {sounds.isEnabled() ? '🔊' : '🔇'}
            </button>

            {/* Account / Character Avatar Button */}
            <button
              onClick={() => {
                sounds.playKeyClick();
                openAuthModal();
              }}
              className="flex items-center gap-1.5 bg-white hover:bg-neutral-100 border-2 border-neutral-900 px-2 py-1 rounded-xl shadow-[0_2px_0_0_#171717] text-xs font-bold cursor-pointer transition-all active:translate-y-0.5"
              title={t('Account & Profile Settings', 'الحساب والمزامنة')}
            >
              <div className="w-5 h-5 rounded-full border border-neutral-900 overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center">
                {equippedChar ? (
                  <img src={getPlayerPhotoUrl(equippedChar)} alt={equippedChar.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <span className="text-[11px]">⚽</span>
                )}
              </div>
              <span className="max-w-[60px] truncate text-neutral-900 hidden md:inline font-black text-[11px]">
                {user?.nickname || t('Player', 'اللاعب')}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                sounds.playKeyClick();
                logout();
              }}
              className="p-1 sm:px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-neutral-900 rounded-xl cursor-pointer shadow-[0_2px_0_0_#171717] active:translate-y-0.5 flex items-center gap-1 text-xs font-black transition-all"
              title={t('Log Out and Return to Login Gate', 'تسجيل الخروج')}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-700" />
              <span className="hidden lg:inline text-[11px]">{t('Log Out', 'خروج')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. FLOATING BOTTOM NAVIGATION DOCK */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-2xl bg-white/95 backdrop-blur-xl border-2 sm:border-3 border-neutral-900 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-[0_6px_0_0_#171717] sm:shadow-[0_8px_0_0_#171717] flex items-center justify-around gap-1 sm:gap-2 select-none"
      >
        <div className="flex items-center justify-around gap-1 w-full">
          <button
            onClick={() => {
              sounds.playKeyClick();
              setActiveTab('training');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex-1 ${
              activeTab === 'training'
                ? 'bg-neutral-900 text-white shadow-xs scale-105'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-xs font-black leading-none">{t('Arena', 'الساحة')}</span>
          </button>

          <button
            onClick={() => {
              sounds.playCoin();
              setActiveTab('rewards-guide');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex-1 relative ${
              activeTab === 'rewards-guide'
                ? 'bg-amber-400 text-neutral-900 font-black shadow-xs scale-105 border-2 border-neutral-900'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60'
            }`}
          >
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-amber-600" />
            <span className="text-[10px] sm:text-xs font-black leading-none">{t('Scoring Guide', 'النقاط')}</span>
          </button>

          <button
            onClick={() => {
              sounds.playKeyClick();
              setActiveTab('leaderboard');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex-1 ${
              activeTab === 'leaderboard'
                ? 'bg-neutral-900 text-white shadow-xs scale-105'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-amber-500" />
            <span className="text-[10px] sm:text-xs font-black leading-none">{t('Ranks', 'الترتيب')}</span>
          </button>

          <button
            onClick={() => {
              sounds.playKeyClick();
              setActiveTab('locker');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex-1 ${
              activeTab === 'locker'
                ? 'bg-neutral-900 text-white shadow-xs scale-105'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-pink-500" />
            <span className="text-[10px] sm:text-xs font-black leading-none">{t('50 Stars', 'اللاعبون')}</span>
          </button>

          <button
            onClick={() => {
              sounds.playKeyClick();
              setActiveTab('history');
            }}
            className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex-1 ${
              activeTab === 'history'
                ? 'bg-neutral-900 text-white shadow-xs scale-105'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-rose-500" />
            <span className="text-[10px] sm:text-xs font-black leading-none">{t('Stats', 'إحصائياتي')}</span>
          </button>

          {isTeacher && (
            <button
              onClick={() => {
                sounds.playKeyClick();
                setActiveTab('teacher');
              }}
              className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex-1 ${
                activeTab === 'teacher'
                  ? 'bg-amber-400 text-neutral-900 font-black shadow-xs scale-105 border-2 border-neutral-900'
                  : 'text-neutral-700 bg-amber-100 hover:bg-amber-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
              <span className="text-[10px] sm:text-xs font-black leading-none">{t('Teacher', 'المعلم')}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
