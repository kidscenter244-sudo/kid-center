import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../utils/audio';
import { CHARACTERS, getPlayerPhotoUrl } from '../data/characters';
import { StudentRosterRecord } from '../types';
import { Search } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TeacherPortal: React.FC = () => {
  const { isTeacher, teacherLogin, studentRoster, awardStudentCoins, refreshStudentRoster } = useAuth();
  const { t } = useLanguage();

  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrack, setFilterTrack] = useState<'all' | 'high' | 'needs-practice'>('all');
  const [bonusAmount] = useState(100);
  const [rewardMsg, setRewardMsg] = useState('');

  useEffect(() => {
    if (!isTeacher) return;
    const timer = window.setInterval(() => {
      refreshStudentRoster().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [isTeacher, refreshStudentRoster]);

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playKeyClick();
    const res = await teacherLogin(passcode);
    if (!res.success) {
      setLoginError(res.message);
    } else {
      setLoginError('');
      sounds.playUnlock();
    }
  };

  const handleAwardCoins = async (studentId: string) => {
    sounds.playKeyClick();
    try {
      await awardStudentCoins(studentId, bonusAmount);
      sounds.playCoin();
      setRewardMsg(
        t(
          `Awarded +${bonusAmount} 🪙 coins to student!`,
          `تم منح +${bonusAmount} 🪙 عملة للطالب!`
        )
      );
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch {}
    } catch (error: any) {
      setRewardMsg(error?.message || t('Could not save the reward. Please try again.', 'تعذر حفظ المكافأة.'));
    }
    setTimeout(() => setRewardMsg(''), 3500);
  };

  if (!isTeacher) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-3 border-neutral-900 rounded-3xl p-8 shadow-[0_10px_0_0_#171717] animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 border-2 border-neutral-900 shadow-[0_4px_0_0_#171717] flex items-center justify-center mx-auto text-3xl">
            👨‍🏫
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {t('Teacher Portal Login', 'دخول بوابة المعلم')}
          </h2>
          <p className="text-xs font-semibold text-neutral-600">
            {t(
              "Dedicated portal for math coaches and teachers to monitor all students' arithmetic accuracy, speed, and stats.",
              'بوابة مخصصة للمعلمين لمتابعة دقة الطلاب وسلاسل الدخول والإحصائيات.'
            )}
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 bg-rose-100 border-2 border-neutral-900 text-rose-900 rounded-xl text-xs font-black">
            {loginError}
          </div>
        )}

        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
              {t('Teacher Access Passcode:', 'رمز دخول المعلم:')}
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white border-2 border-neutral-900 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-[0_4px_0_0_#171717] active:translate-y-0.5 transition-all"
          >
            {t('Access Teacher Dashboard →', 'دخول لوحة المعلم ←')}
          </button>
        </form>
      </div>
    );
  }

  const filteredStudents = studentRoster.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTrack === 'high') return s.accuracy >= 90;
    if (filterTrack === 'needs-practice') return s.accuracy < 90;
    return true;
  });

  const totalClassSolved = studentRoster.reduce((acc, curr) => acc + curr.totalSolved, 0);
  const avgAccuracy =
    studentRoster.length > 0
      ? Math.round(studentRoster.reduce((acc, curr) => acc + curr.accuracy, 0) / studentRoster.length)
      : 100;
  const totalCoinsDistributed = studentRoster.reduce((acc, curr) => acc + curr.coins, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white border-2 border-neutral-900 rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_#171717] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-neutral-900 shadow-[0_3px_0_0_#171717] flex items-center justify-center text-3xl">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-neutral-900 text-white rounded-md text-[10px] font-black uppercase">
                {t('Coach / Teacher Mode', 'وضع المعلم / المدرب')}
              </span>
              <span className="text-xs font-bold text-neutral-500">
                {t('Classroom Live Portal', 'بوابة الفصل المباشرة')}
              </span>
            </div>
            <h2 className="text-2xl font-black text-neutral-900">
              {t('Student Performance & Roster Monitor', 'متابعة أداء وسجلات الطلاب')}
            </h2>
          </div>
        </div>

        {rewardMsg && (
          <div className="px-4 py-2 bg-emerald-100 border-2 border-neutral-900 rounded-xl font-black text-xs text-emerald-950 animate-bounce">
            {rewardMsg}
          </div>
        )}
      </div>

      {/* Class Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl shadow-[0_3px_0_0_#171717] text-center">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            {t('Enrolled Students', 'الطلاب المسجلون')}
          </span>
          <span className="font-mono text-2xl font-black text-neutral-900">
            {studentRoster.length} {t('Active', 'نشط')}
          </span>
        </div>

        <div className="p-4 bg-emerald-50 border-2 border-neutral-900 rounded-2xl shadow-[0_3px_0_0_#171717] text-center">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            {t('Class Avg Accuracy', 'متوسط دقة الفصل')}
          </span>
          <span className="font-mono text-2xl font-black text-emerald-700">{avgAccuracy}%</span>
        </div>

        <div className="p-4 bg-sky-50 border-2 border-neutral-900 rounded-2xl shadow-[0_3px_0_0_#171717] text-center">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            {t('Problems Solved', 'المسائل المحلولة')}
          </span>
          <span className="font-mono text-2xl font-black text-sky-700">
            {totalClassSolved.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-amber-50 border-2 border-neutral-900 rounded-2xl shadow-[0_3px_0_0_#171717] text-center">
          <span className="text-[10px] font-black uppercase text-neutral-500 block">
            {t('Class Coins Earned', 'إجمالي عملات الفصل')}
          </span>
          <span className="font-mono text-2xl font-black text-amber-700" dir="ltr">
            🪙 {totalCoinsDistributed.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Roster Controls: Search & Filter */}
      <div className="bg-white border-2 border-neutral-900 rounded-3xl p-6 shadow-[0_8px_0_0_#171717] space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Search student by name or email...', 'ابحث عن طالب بالاسم أو البريد...')}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border-2 border-neutral-900 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-300 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => {
                sounds.playKeyClick();
                setFilterTrack('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                filterTrack === 'all' ? 'bg-neutral-900 text-white' : 'text-neutral-700'
              }`}
            >
              {t(`All (${studentRoster.length})`, `الكل (${studentRoster.length})`)}
            </button>
            <button
              onClick={() => {
                sounds.playKeyClick();
                setFilterTrack('high');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                filterTrack === 'high' ? 'bg-emerald-600 text-white' : 'text-neutral-700'
              }`}
            >
              {t('Top (90%+)', 'متفوق (90%+)')}
            </button>
            <button
              onClick={() => {
                sounds.playKeyClick();
                setFilterTrack('needs-practice');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                filterTrack === 'needs-practice' ? 'bg-rose-600 text-white' : 'text-neutral-700'
              }`}
            >
              {t('Needs Practice', 'يحتاج تدريب')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-900 bg-neutral-100 text-[11px] font-black uppercase text-neutral-600">
                <th className="py-3 px-3">{t('Student', 'الطالب')}</th>
                <th className="py-3 px-3">{t('Active Star', 'اللاعب النشط')}</th>
                <th className="py-3 px-3">{t('Daily Streak', 'الاستريك اليومي')}</th>
                <th className="py-3 px-3">{t('Accuracy', 'الدقة')}</th>
                <th className="py-3 px-3">{t('Solved / Correct', 'المحلول / الصحيح')}</th>
                <th className="py-3 px-3">{t('Answer Streak', 'سلسلة الإجابات')}</th>
                <th className="py-3 px-3">{t('Coins', 'العملات')}</th>
                <th className="py-3 px-3 text-right">{t('Teacher Action', 'مكافأة المعلم')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500 font-bold">
                    {t(
                      'No registered students found yet. Once students register and practice math questions, their stats will appear here automatically!',
                      'لا يوجد طلاب مسجلون بعد. بمجرد تسجيل الطلاب وحل المسائل ستظهر إحصائياتهم هنا!'
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const char = CHARACTERS.find((c) => c.id === std.equippedCharacterId);
                  return (
                    <tr key={std.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-black text-neutral-900 block text-sm">{std.name}</span>
                          <span className="text-[10px] text-neutral-500 font-medium">
                            {std.email} • {t('Active Player', 'لاعب نشط')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg border border-neutral-900 overflow-hidden shrink-0 bg-neutral-900 flex items-center justify-center">
                            {char ? (
                              <img
                                src={getPlayerPhotoUrl(char)}
                                alt={char.name}
                                className="w-full h-full object-cover object-top"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/players/kane-9.jpg';
                                }}
                              />
                            ) : (
                              <span className="text-xs">⚽</span>
                            )}
                          </div>
                          <span className="font-black text-neutral-800">
                            {char?.name || t('No player equipped', 'بدون لاعب')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-black text-orange-700" dir="ltr">
                        🔥 {std.dailyStreak ?? 0} {t('d', 'ي')}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg border font-mono font-black ${
                            std.accuracy >= 95
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                              : std.accuracy >= 88
                              ? 'bg-sky-100 text-sky-800 border-sky-400'
                              : 'bg-rose-100 text-rose-800 border-rose-400'
                          }`}
                        >
                          {std.accuracy}%
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono" dir="ltr">
                        <span className="text-neutral-900">{std.totalCorrect}</span>
                        <span className="text-neutral-400"> / {std.totalSolved}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-rose-600 font-black" dir="ltr">
                        {std.bestStreak}x ⚡
                      </td>

                      <td className="py-3 px-3 font-mono font-black text-amber-700" dir="ltr">
                        🪙 {std.coins.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleAwardCoins(std.id)}
                          className="px-3 py-1.5 bg-amber-300 hover:bg-amber-400 border border-neutral-900 rounded-xl text-[11px] font-black cursor-pointer shadow-xs active:translate-y-0.5 inline-flex items-center gap-1"
                          title={t('Award 100 homework bonus coins', 'منح 100 عملة مكافأة')}
                        >
                          <span>+100 🪙 {t('Bonus', 'مكافأة')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
