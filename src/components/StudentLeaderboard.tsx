import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CHARACTERS, getPlayerPhotoUrl } from '../data/characters';
import { sounds } from '../utils/audio';
import { Crown, Search, Sparkles } from 'lucide-react';

export const StudentLeaderboard: React.FC = () => {
  const { studentRoster, user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'coins' | 'dailyStreak' | 'accuracy' | 'solved'>('coins');

  const getDailyStreakForRow = (stdEmail: string, rowDaily: number) => {
    if (user?.email && user.email.toLowerCase() === stdEmail.toLowerCase()) {
      return user.stats?.dailyStreak ?? rowDaily ?? 0;
    }
    return rowDaily ?? 0;
  };

  // Sort students with #1 on top
  const sortedStudents = [...studentRoster].sort((a, b) => {
    if (sortBy === 'coins') return b.coins - a.coins;
    if (sortBy === 'dailyStreak') {
      return (
        getDailyStreakForRow(b.email, b.dailyStreak) - getDailyStreakForRow(a.email, a.dailyStreak) ||
        b.coins - a.coins
      );
    }
    if (sortBy === 'accuracy') return b.accuracy - a.accuracy;
    return b.totalSolved - a.totalSolved;
  });

  const filteredStudents = sortedStudents.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const top3 = sortedStudents.slice(0, 3);

  const renderAvatar = (equippedId: string, name: string) => {
    const char = CHARACTERS.find((c) => c.id === equippedId);
    if (!char) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-xl">
          ⚽
        </div>
      );
    }
    return (
      <img
        src={getPlayerPhotoUrl(char)}
        alt={name}
        className="w-full h-full object-cover object-top"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/images/players/kane-9.jpg';
        }}
      />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 border-3 border-neutral-900 rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_#171717] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border-2 border-neutral-900 shadow-[0_3px_0_0_#171717] flex items-center justify-center text-3xl text-amber-400">
            🥇
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-900 text-amber-300 rounded-md text-[10px] font-black uppercase">
              <Sparkles className="w-3 h-3 fill-amber-300" />
              <span>{t('All Registered Champions', 'جميع الأبطال المسجلين')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900">
              {t('Student Hall of Fame', 'لوحة شرف الطلاب')}
            </h2>
            <p className="text-xs font-bold text-neutral-800">
              {t(
                'Live standings of all students solving math challenges & daily visit streaks!',
                'الترتيب المباشر لجميع الطلاب وسلاسل الدخول اليومي والتفوق في الحساب!'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-neutral-900 px-4 py-2.5 rounded-2xl shadow-[0_3px_0_0_#171717] text-center">
            <span className="text-[10px] font-black uppercase text-neutral-500 block">
              {t('Competitors', 'المتنافسون')}
            </span>
            <span className="font-mono text-xl font-black text-neutral-900">
              {studentRoster.length} {t('Students', 'طالب')}
            </span>
          </div>
          <div className="bg-amber-100 border-2 border-neutral-900 px-4 py-2.5 rounded-2xl shadow-[0_3px_0_0_#171717] text-center">
            <span className="text-[10px] font-black uppercase text-amber-900 block">
              {t('Locker Vault', 'خزنة النجوم')}
            </span>
            <span className="font-mono text-xl font-black text-neutral-900">
              {CHARACTERS.length} {t('Stars', 'نجم')}
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {studentRoster.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* Rank #2 Silver */}
          {top3[1] && (
            <div className="order-2 md:order-1 bg-white border-3 border-neutral-900 rounded-3xl p-5 shadow-[0_8px_0_0_#171717] text-center relative overflow-hidden">
              <div className="absolute top-3 left-3 bg-slate-200 border border-neutral-900 px-2 py-0.5 rounded-lg text-xs font-black text-neutral-800">
                🥈 {t('Rank #2', 'المركز #2')}
              </div>
              <div className="w-16 h-16 mx-auto mb-2 rounded-2xl border-2 border-neutral-900 overflow-hidden shadow-xs relative bg-neutral-900">
                {renderAvatar(top3[1].equippedCharacterId, top3[1].name)}
              </div>
              <h3 className="font-black text-base text-neutral-900 truncate">{top3[1].name}</h3>
              <span className="text-[11px] font-bold text-neutral-500 block mb-2">
                {t('Active Player', 'لاعب نشط')}
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded-xl font-mono font-black text-xs text-neutral-800" dir="ltr">
                  🪙 {top3[1].coins.toLocaleString()} • 🔥 {getDailyStreakForRow(top3[1].email, top3[1].dailyStreak)}d
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded-lg text-[11px] font-mono font-black text-neutral-700" dir="ltr">
                  <span>🛡️</span>
                  <span>
                    {(user?.email.toLowerCase() === top3[1].email.toLowerCase()
                      ? user.unlockedCharacters?.length
                      : top3[1].unlockedCount) ?? 0}{' '}
                    / {CHARACTERS.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank #1 Champion Gold */}
          {top3[0] && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-100 to-amber-50 border-4 border-neutral-900 rounded-3xl p-6 shadow-[0_12px_0_0_#171717] text-center relative overflow-hidden -translate-y-2">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-400 border-2 border-neutral-900 px-3 py-1 rounded-xl text-xs font-black text-neutral-900 flex items-center gap-1 shadow-xs whitespace-nowrap">
                <Crown className="w-3.5 h-3.5 fill-amber-500" />
                <span>{t('CHAMPION #1', 'البطل #1')}</span>
              </div>
              <div className="w-20 h-20 mx-auto mt-6 mb-2 rounded-2xl border-3 border-neutral-900 overflow-hidden shadow-md ring-4 ring-amber-300 relative bg-neutral-900">
                {renderAvatar(top3[0].equippedCharacterId, top3[0].name)}
              </div>
              <h3 className="font-black text-lg text-neutral-900 truncate">{top3[0].name}</h3>
              <span className="text-xs font-black text-amber-700 block mb-2">
                {t('Active Player', 'لاعب نشط')}
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <div className="inline-block bg-amber-300 border-2 border-neutral-900 px-4 py-1.5 rounded-xl font-mono font-black text-sm text-neutral-900 shadow-xs" dir="ltr">
                  🪙 {top3[0].coins.toLocaleString()} • 🔥 {getDailyStreakForRow(top3[0].email, top3[0].dailyStreak)}d
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200 border-2 border-neutral-900 rounded-xl text-xs font-mono font-black text-neutral-900 shadow-xs" dir="ltr">
                  <span>🛡️</span>
                  <span>
                    {(user?.email.toLowerCase() === top3[0].email.toLowerCase()
                      ? user.unlockedCharacters?.length
                      : top3[0].unlockedCount) ?? 0}{' '}
                    / {CHARACTERS.length} {t('Stars', 'نجم')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank #3 Bronze */}
          {top3[2] && (
            <div className="order-3 md:order-3 bg-white border-3 border-neutral-900 rounded-3xl p-5 shadow-[0_8px_0_0_#171717] text-center relative overflow-hidden">
              <div className="absolute top-3 left-3 bg-amber-200 border border-neutral-900 px-2 py-0.5 rounded-lg text-xs font-black text-amber-900">
                🥉 {t('Rank #3', 'المركز #3')}
              </div>
              <div className="w-16 h-16 mx-auto mb-2 rounded-2xl border-2 border-neutral-900 overflow-hidden shadow-xs relative bg-neutral-900">
                {renderAvatar(top3[2].equippedCharacterId, top3[2].name)}
              </div>
              <h3 className="font-black text-base text-neutral-900 truncate">{top3[2].name}</h3>
              <span className="text-[11px] font-bold text-neutral-500 block mb-2">
                {t('Active Player', 'لاعب نشط')}
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <div className="inline-block bg-amber-50 border border-amber-300 px-3 py-1 rounded-xl font-mono font-black text-xs text-amber-800" dir="ltr">
                  🪙 {top3[2].coins.toLocaleString()} • 🔥 {getDailyStreakForRow(top3[2].email, top3[2].dailyStreak)}d
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded-lg text-[11px] font-mono font-black text-neutral-700" dir="ltr">
                  <span>🛡️</span>
                  <span>
                    {(user?.email.toLowerCase() === top3[2].email.toLowerCase()
                      ? user.unlockedCharacters?.length
                      : top3[2].unlockedCount) ?? 0}{' '}
                    / {CHARACTERS.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls: Search & Sort Filter */}
      <div className="bg-white border-3 border-neutral-900 rounded-3xl p-6 shadow-[0_8px_0_0_#171717] space-y-4">
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

          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-300 w-full sm:w-auto flex-wrap justify-center sm:justify-end">
            <button
              onClick={() => {
                sounds.playKeyClick();
                setSortBy('coins');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sortBy === 'coins' ? 'bg-neutral-900 text-amber-400' : 'text-neutral-700'
              }`}
            >
              🪙 {t('Most Coins', 'الأكثر عملات')}
            </button>
            <button
              onClick={() => {
                sounds.playKeyClick();
                setSortBy('dailyStreak');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sortBy === 'dailyStreak' ? 'bg-neutral-900 text-orange-400' : 'text-neutral-700'
              }`}
            >
              🔥 {t('Daily Streak', 'الاستريك اليومي')}
            </button>
            <button
              onClick={() => {
                sounds.playKeyClick();
                setSortBy('accuracy');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sortBy === 'accuracy' ? 'bg-neutral-900 text-emerald-400' : 'text-neutral-700'
              }`}
            >
              🎯 {t('Accuracy', 'الدقة')}
            </button>
            <button
              onClick={() => {
                sounds.playKeyClick();
                setSortBy('solved');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sortBy === 'solved' ? 'bg-neutral-900 text-sky-400' : 'text-neutral-700'
              }`}
            >
              ⚡ {t('Solved', 'المسائل')}
            </button>
          </div>
        </div>

        {studentRoster.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-neutral-900 mx-auto flex items-center justify-center text-3xl">
              🏆
            </div>
            <h3 className="text-lg font-black text-neutral-900">
              {t('No Students Registered Yet', 'لا يوجد طلاب مسجلون بعد')}
            </h3>
            <p className="text-xs font-bold text-neutral-500 max-w-sm mx-auto">
              {t(
                'Create an account or login from the login screen to be the first champion to rank #1 on the leaderboard!',
                'أنشئ حساباً لتكون أول بطل يتصدر لوحة الشرف!'
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 bg-neutral-100 text-[11px] font-black uppercase text-neutral-600">
                  <th className="py-3 px-3">{t('Rank', 'المركز')}</th>
                  <th className="py-3 px-3">{t('Student', 'الطالب')}</th>
                  <th className="py-3 px-3">{t('Equipped Star', 'اللاعب المجهز')}</th>
                  <th className="py-3 px-3">{t('Unlocked', 'المفتوح')}</th>
                  <th className="py-3 px-3">{t('Daily Streak', 'الاستريك اليومي')}</th>
                  <th className="py-3 px-3">{t('Accuracy', 'الدقة')}</th>
                  <th className="py-3 px-3">{t('Solved', 'المسائل')}</th>
                  <th className="py-3 px-3">{t('Best Streak', 'أفضل سلسلة')}</th>
                  <th className="py-3 px-3 text-right">{t('Coins', 'العملات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredStudents.map((std, index) => {
                  const char = CHARACTERS.find((c) => c.id === std.equippedCharacterId);
                  const isCurrent = user?.email.toLowerCase() === std.email.toLowerCase();
                  const ownedCount = (isCurrent ? user?.unlockedCharacters?.length : std.unlockedCount) ?? 0;
                  const dailyStreak = getDailyStreakForRow(std.email, std.dailyStreak);

                  return (
                    <tr
                      key={std.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        isCurrent ? 'bg-amber-100/60 font-black' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border ${
                            index === 0
                              ? 'bg-amber-400 text-neutral-900 border-neutral-900 shadow-xs'
                              : index === 1
                              ? 'bg-slate-200 text-neutral-800 border-slate-400'
                              : index === 2
                              ? 'bg-amber-700 text-white border-amber-800'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-neutral-900 text-sm">{std.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 bg-amber-400 text-neutral-900 rounded text-[9px] font-black uppercase">
                                {t('You', 'أنت')}
                              </span>
                            )}
                          </div>
                          {std.email && (
                            <span className="text-[10px] text-neutral-500 font-medium">{std.email}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
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
                            {char?.name || t('No player yet', 'بدون لاعب')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-xl font-mono text-xs font-black text-amber-950 shadow-xs"
                          dir="ltr"
                        >
                          <span className="text-amber-600">🛡️</span>
                          <span>
                            {ownedCount} / {CHARACTERS.length}
                          </span>
                        </span>
                      </td>

                      {/* Daily Login Streak */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono text-xs font-black ${
                            dailyStreak > 0
                              ? 'bg-orange-100 text-orange-900 border-orange-400'
                              : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                          }`}
                          dir="ltr"
                        >
                          <span>🔥</span>
                          <span>
                            {dailyStreak} {t(dailyStreak === 1 ? 'day' : 'days', 'يوم')}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg border font-mono font-black ${
                            std.accuracy >= 95
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                              : std.accuracy >= 85
                              ? 'bg-sky-100 text-sky-800 border-sky-400'
                              : 'bg-rose-100 text-rose-800 border-rose-400'
                          }`}
                        >
                          {std.accuracy}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono" dir="ltr">
                        <span className="text-neutral-900">{std.totalCorrect}</span>
                        <span className="text-neutral-400"> / {std.totalSolved}</span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-rose-600 font-black" dir="ltr">
                        {std.bestStreak}x ⚡
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-black text-amber-700 text-sm" dir="ltr">
                        🪙 {std.coins.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
