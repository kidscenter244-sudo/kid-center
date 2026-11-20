import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../utils/audio';
import { X, Lock, Mail, Copy, Check, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    user,
    logout,
    exportSyncCode,
    importSyncCode
  } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'sync'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [syncInput, setSyncInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playKeyClick();
    const res = await login(email, password);
    setMsg({ text: res.message, error: !res.success });
    if (res.success) {
      setTimeout(() => {
        setMsg(null);
        closeAuthModal();
      }, 900);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playKeyClick();
    const res = await register(email, password, nickname);
    setMsg({ text: res.message, error: !res.success });
    if (res.success) {
      setTimeout(() => {
        setMsg(null);
        closeAuthModal();
      }, 900);
    }
  };

  const handleCopySyncCode = () => {
    sounds.playKeyClick();
    const code = exportSyncCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImportSyncCode = () => {
    sounds.playKeyClick();
    if (!syncInput.trim()) return;
    const res = importSyncCode(syncInput);
    setMsg({ text: res.message, error: !res.success });
    if (res.success) {
      setTimeout(() => {
        setMsg(null);
        closeAuthModal();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60">
      <div className="w-full max-w-md bg-white border-3 border-neutral-900 rounded-3xl shadow-[0_12px_0_0_#171717] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-300 border-b-2 border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-neutral-900" />
            <h3 className="font-black text-lg text-neutral-900">
              {t('Account & Phone Sync', 'الحساب ومزامنة الهاتف')}
            </h3>
          </div>
          <button
            onClick={() => {
              sounds.playKeyClick();
              closeAuthModal();
            }}
            className="w-8 h-8 rounded-lg bg-white border-2 border-neutral-900 flex items-center justify-center font-black hover:bg-neutral-100 cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4 text-neutral-900" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b-2 border-neutral-900 bg-neutral-100 text-xs font-black">
          <button
            onClick={() => {
              sounds.playKeyClick();
              setMode('login');
              setMsg(null);
            }}
            className={`flex-1 py-3 text-center border-r-2 border-neutral-900 transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {t('Sign In', 'تسجيل الدخول')}
          </button>
          <button
            onClick={() => {
              sounds.playKeyClick();
              setMode('register');
              setMsg(null);
            }}
            className={`flex-1 py-3 text-center border-r-2 border-neutral-900 transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {t('Create Account', 'حساب جديد')}
          </button>
          <button
            onClick={() => {
              sounds.playKeyClick();
              setMode('sync');
              setMsg(null);
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === 'sync' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            📱 {t('Phone Sync', 'مزامنة')}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {msg && (
            <div
              className={`mb-4 p-3 rounded-xl border-2 border-neutral-900 text-xs font-bold ${
                msg.error ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Current user status */}
          {user && (
            <div className="mb-4 p-3 bg-neutral-50 border border-neutral-300 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">
                  {t('Current Player', 'اللاعب الحالي')}
                </span>
                <span className="font-black text-neutral-900">{user.nickname}</span> ({user.email})
              </div>
              <div className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md border border-neutral-900">
                🪙 {user.coins}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  {t('Email Address', 'البريد الإلكتروني')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-neutral-900 rounded-xl font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  {t('Password', 'كلمة المرور')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-neutral-900 rounded-xl font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 border-2 border-neutral-900 rounded-xl font-black text-neutral-900 shadow-[0_4px_0_0_#171717] active:translate-y-0.5 cursor-pointer text-sm uppercase tracking-wider transition-all"
              >
                {t('Sign In to My Account', 'تسجيل الدخول إلى حسابي')}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  {t('Hero Nickname', 'اسم البطل')}
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('e.g. Leo The Prodigy', 'مثال: أحمد البطل')}
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-900 rounded-xl font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  {t('Email Address', 'البريد الإلكتروني')}
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-900 rounded-xl font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  {t('Create Password (min 4 chars)', 'إنشاء كلمة مرور (4 أحرف على الأقل)')}
                </label>
                <input
                  type="password"
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border-2 border-neutral-900 rounded-xl font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <p className="text-[11px] text-neutral-600 font-medium">
                {t(
                  'Your coins, character purchases, and progress will be linked directly to your account.',
                  'سيتم ربط عملاتك ومشترياتك من اللاعبين وتقدمك مباشرة بحسابك.'
                )}
              </p>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-500 border-2 border-neutral-900 rounded-xl font-black text-neutral-900 shadow-[0_4px_0_0_#171717] active:translate-y-0.5 cursor-pointer text-sm uppercase tracking-wider transition-all"
              >
                {t('Register & Save Progress', 'إنشاء الحساب وحفظ التقدم')}
              </button>
            </form>
          )}

          {mode === 'sync' && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl text-xs font-semibold text-neutral-700">
                {t(
                  'Open this app on your phone, tablet, or another browser and enter your sync code below to carry over all your coins & unlocked heroes!',
                  'افتح هذا الموقع على هاتفك أو جهاز آخر وأدخل كود المزامنة لنقل عملاتك واللاعبين الذين اشتريتهم!'
                )}
              </div>

              {/* Export passkey */}
              <div>
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                  {t('Your Account Sync Passkey:', 'كود مزامنة حسابك:')}
                </label>
                <button
                  type="button"
                  onClick={handleCopySyncCode}
                  className="w-full py-2.5 px-3 bg-white border-2 border-neutral-900 rounded-xl font-bold text-xs flex items-center justify-between hover:bg-neutral-100 shadow-[0_2px_0_0_#171717] cursor-pointer"
                >
                  <span className="truncate max-w-[240px] font-mono text-neutral-600" dir="ltr">
                    {exportSyncCode().slice(0, 32)}...
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 font-black">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? t('Copied!', 'تم النسخ!') : t('Copy Code', 'نسخ الكود')}
                  </span>
                </button>
              </div>

              {/* Import passkey */}
              <div className="pt-2 border-t border-neutral-200">
                <label className="block text-xs font-black uppercase text-neutral-800 mb-1">
                  {t('Restore from Phone / Another Device:', 'استعادة من هاتف أو جهاز آخر:')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={syncInput}
                    onChange={(e) => setSyncInput(e.target.value)}
                    placeholder={t('Paste sync code here...', 'الصق كود المزامنة هنا...')}
                    className="flex-1 px-3 py-2 bg-white border-2 border-neutral-900 rounded-xl font-mono text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleImportSyncCode}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs rounded-xl border-2 border-neutral-900 cursor-pointer shadow-sm active:translate-y-0.5"
                  >
                    {t('Load', 'استيراد')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {user && (
            <div className="mt-5 pt-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-semibold">
                {t('Active Session', 'جلسة نشطة')}
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.playKeyClick();
                  logout();
                  setMsg({ text: t('Logged out successfully.', 'تم تسجيل الخروج بنجاح.'), error: false });
                }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                {t('Log Out', 'تسجيل الخروج')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
