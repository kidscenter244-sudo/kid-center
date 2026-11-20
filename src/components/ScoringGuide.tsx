import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CHARACTERS, getPlayerPhotoUrl } from '../data/characters';
import { sounds } from '../utils/audio';
import {
  Coins,
  Zap,
  Flame,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  Shield,
  Layers,
  Calculator,
  CheckCircle2
} from 'lucide-react';

interface ScoringGuideProps {
  onStartQuizFromGuide: (
    type: 'add-sub' | 'multiplication' | 'division' | 'mixed',
    settings: any,
    title: string
  ) => void;
}

export const ScoringGuide: React.FC<ScoringGuideProps> = ({ onStartQuizFromGuide }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const equippedId = user?.equippedCharacterId || user?.unlockedCharacters?.[0] || '';
  const equippedHero = equippedId ? CHARACTERS.find((c) => c.id === equippedId) : undefined;
  const heroPower = equippedHero?.ballonDorPower;

  // Simulator state
  const [simType, setSimType] = useState<'add-sub' | 'multiplication' | 'division'>('add-sub');
  const [simDigits, setSimDigits] = useState<number>(2);
  const [simDigits2, setSimDigits2] = useState<number>(1);
  const [simTerms, setSimTerms] = useState<number>(3);
  const [simFormulaMode, setSimFormulaMode] = useState<'simple' | 'friends-5' | 'friends-10'>('simple');
  const [simHasDecimals, setSimHasDecimals] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<'flash' | 'fast' | 'normal'>('fast');
  const [simStreak, setSimStreak] = useState<number>(3);

  // Check zero-coin practice tiers (matches mathGenerator.ts exactly)
  const isPracticeZeroCoins =
    !simHasDecimals &&
    ((simType === 'add-sub' &&
      simDigits === 1 &&
      (simFormulaMode === 'simple' || simFormulaMode === 'friends-5')) ||
      (simType === 'multiplication' && simDigits === 1 && simDigits2 === 1));

  // Calibrated coin computation matching mathGenerator.ts
  let baseCoins = 0;
  if (!isPracticeZeroCoins) {
    if (simType === 'add-sub') {
      baseCoins = 2 + Math.min(3, Math.max(0, simDigits - 1));
      if (simFormulaMode === 'friends-10') baseCoins += 1;
      if (simTerms >= 5) baseCoins += 1;
      if (simTerms >= 8) baseCoins += 1;
    } else if (simType === 'multiplication') {
      baseCoins = 3;
      if (simDigits >= 2 && simDigits2 >= 2) baseCoins += 2;
      else if (simDigits >= 2 || simDigits2 >= 2) baseCoins += 1;
      if (simDigits + simDigits2 >= 5) baseCoins += 1;
    } else if (simType === 'division') {
      baseCoins = 3;
      if (simDigits >= 3) baseCoins += 1;
      if (simDigits >= 4) baseCoins += 1;
    }
    if (simHasDecimals) {
      baseCoins += 1;
    }
  }

  const speedBonus = isPracticeZeroCoins ? 0 : simSpeed === 'flash' ? 2 : simSpeed === 'fast' ? 1 : 0;
  const streakBonus = isPracticeZeroCoins ? 0 : Math.min(3, Math.floor(simStreak / 3));
  const subTotal = baseCoins + speedBonus + streakBonus;

  // Hero multiplier (only applies when base reward > 0)
  let heroMultiplier = 1;
  let heroMultiplierName = '';
  if (!isPracticeZeroCoins) {
    if (heroPower?.type === 'double-coins') {
      heroMultiplier = 2;
      heroMultiplierName = 'Lionel Messi 2X Golden Touch';
    } else if (heroPower?.type === 'samba-fever') {
      heroMultiplier = heroPower.multiplier || 1.5;
      heroMultiplierName = `Samba Fever (${heroPower.name})`;
    }
  }

  const totalCalculated = Math.round(subTotal * heroMultiplier);

  const handleLaunchSimulatedQuiz = () => {
    sounds.playKeyClick();
    if (simType === 'add-sub') {
      onStartQuizFromGuide(
        'add-sub',
        {
          numbersCount: simTerms,
          digitsCount: simDigits,
          formulaMode: simFormulaMode,
          hasDecimals: simHasDecimals,
          decimalPlaces: simHasDecimals ? 1 : 0,
          questionCount: 10,
          timeLimitSeconds: 60
        },
        `Addition & Subtraction (${simDigits} Digits • ${
          simFormulaMode === 'friends-5'
            ? 'Formulas of 5'
            : simFormulaMode === 'friends-10'
            ? 'Formulas of 10'
            : 'Simple'
        }${simHasDecimals ? ' • Dec' : ''})`
      );
    } else if (simType === 'multiplication') {
      onStartQuizFromGuide(
        'multiplication',
        {
          digits1: simDigits,
          digits2: simDigits2,
          hasDecimals: simHasDecimals,
          decimalPlaces: simHasDecimals ? 1 : 0,
          questionCount: 10,
          timeLimitSeconds: 60
        },
        `Multiplication (${simDigits}×${simDigits2} Digits${simHasDecimals ? ' • Dec' : ''})`
      );
    } else {
      onStartQuizFromGuide(
        'division',
        {
          dividendDigits: Math.max(2, simDigits),
          divisorDigits: 1,
          hasDecimals: simHasDecimals,
          decimalPlaces: simHasDecimals ? 1 : 0,
          questionCount: 10,
          timeLimitSeconds: 60
        },
        `Division (${simDigits} Digits${simHasDecimals ? ' • Dec' : ''})`
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-2 sm:border-3 border-neutral-900 rounded-3xl p-5 sm:p-7 shadow-[0_6px_0_0_#171717] text-neutral-900 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-neutral-900 text-amber-300 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
              <Coins className="w-3.5 h-3.5" />
              <span>{t('Smart Rewards & Fair Calibration Guide', 'دليل النقاط والمكافآت الذكي')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
              {t('How Are Points & Coins Awarded?', 'كيف يتم احتساب النقاط والعملات؟')}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-800 mt-1 max-w-xl">
              {t(
                "Coins are strictly calibrated so every problem counts! Consistent daily practice, speed, and clean streaks unlock Ballon d'Or legends in your locker.",
                'يتم احتساب العملات بدقة لتكافئ كل مسألة! الالتزام بالفتح اليومي والسرعة والستريك المتواصل يفتح لك أساطير الكرة الذهبية في المتجر.'
              )}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-xs border-2 border-neutral-900 rounded-2xl p-3 shadow-[0_3px_0_0_#171717] flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl border border-neutral-900 overflow-hidden bg-neutral-900 shrink-0 flex items-center justify-center">
              {equippedHero ? (
                <img
                  src={getPlayerPhotoUrl(equippedHero)}
                  alt={equippedHero.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/players/kane-9.jpg';
                  }}
                />
              ) : (
                <span className="text-2xl">⚽</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-neutral-500 block">
                {t('Equipped Champion', 'اللاعب المُجهز')}
              </span>
              <span className="text-xs font-black text-neutral-900 block">
                {equippedHero ? equippedHero.name : t('No Player Equipped Yet', 'لا يوجد لاعب مُجهز بعد')}
              </span>
              {heroPower ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 inline-block mt-0.5">
                  {heroPower.name}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-600">
                  {equippedHero ? t('Standard Tier', 'المستوى القياسي') : t('Earn coins to unlock stars', 'اجمع العملات لشراء نجوم')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Calculator / Rewards Simulator */}
      <div className="bg-white border-2 sm:border-3 border-neutral-900 rounded-3xl p-5 sm:p-7 shadow-[0_6px_0_0_#171717]">
        <div className="flex items-center gap-2 border-b-2 border-neutral-100 pb-4 mb-5">
          <Calculator className="w-6 h-6 text-amber-500" />
          <div>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900">
              {t('Instant Question Reward Calculator', 'حاسبة مكافآت الأسئلة الفورية')}
            </h2>
            <span className="text-xs font-bold text-neutral-500">
              {t(
                'Test any setup to preview exact coins earned per correct answer before starting a quiz.',
                'جرّب أي إعداد لمعرفة عدد العملات الدقيقة لكل إجابة صحيحة قبل بدء التدريب.'
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form (Left / 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Operation Type Selector */}
            <div>
              <label className="text-xs font-black uppercase text-neutral-600 block mb-1.5">
                {t('Operation Type', 'نوع العملية')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'add-sub', label: t('Addition & Subtraction', 'الجمع والطرح') },
                  { id: 'multiplication', label: t('Multiplication', 'الضرب') },
                  { id: 'division', label: t('Division', 'القسمة') }
                ].map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => {
                      sounds.playKeyClick();
                      setSimType(op.id as any);
                    }}
                    className={`py-2 px-3 rounded-xl border-2 border-neutral-900 text-xs font-black transition-all cursor-pointer ${
                      simType === op.id
                        ? 'bg-neutral-900 text-amber-300 shadow-[0_3px_0_0_#171717]'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Digits & Count Controls */}
            <div className="grid grid-cols-2 gap-3">
              {simType === 'add-sub' && (
                <>
                  <div>
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      {t('Digits Per Number', 'عدد الأرقام (الخانات)')}
                    </label>
                    <select
                      value={simDigits}
                      onChange={(e) => setSimDigits(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={1}>{t('1 Digit (Units 1-9)', 'رقم واحد (1-9)')}</option>
                      <option value={2}>{t('2 Digits (Tens 10-99)', 'رقمان (10-99)')}</option>
                      <option value={3}>{t('3 Digits (Hundreds 100-999)', '3 أرقام (100-999)')}</option>
                      <option value={4}>{t('4 Digits (Thousands 1000+)', '4 أرقام (1000+)')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      {t('Rows / Terms Count', 'عدد الأرقام في المسألة')}
                    </label>
                    <select
                      value={simTerms}
                      onChange={(e) => setSimTerms(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={2}>{t('2 Numbers', 'رقمان')}</option>
                      <option value={3}>{t('3 Sequential Numbers', '3 أرقام متتالية')}</option>
                      <option value={4}>{t('4 Sequential Numbers', '4 أرقام متتالية')}</option>
                      <option value={5}>{t('5 Numbers (Mental Stream)', '5 أرقام (سريع)')}</option>
                      <option value={8}>{t('8 Numbers (Pro Marathon)', '8 أرقام (ماراثون)')}</option>
                    </select>
                  </div>

                  {/* Formula Mode */}
                  <div className="col-span-2 pt-1">
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      {t('Formula Rule (Complements)', 'نظام القواعد (المكملات)')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'simple', label: t('Simple / Direct', 'بسيط / مباشر'), sub: t('No Complements', 'بدون مكملات') },
                        { id: 'friends-5', label: t('Formulas of 5', 'أصدقاء 5'), sub: t('Small Friends', 'المكمل الصغير') },
                        { id: 'friends-10', label: t('Formulas of 10', 'أصدقاء 10'), sub: t('Big Friends', 'المكمل الكبير') }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            sounds.playKeyClick();
                            setSimFormulaMode(m.id as any);
                          }}
                          className={`py-1.5 px-2 rounded-xl border-2 border-neutral-900 text-center transition-all cursor-pointer ${
                            simFormulaMode === m.id
                              ? 'bg-neutral-900 text-amber-300 shadow-[0_2px_0_0_#171717]'
                              : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="text-[11px] font-black">{m.label}</div>
                          <div className="text-[9px] text-neutral-500 font-semibold">{m.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {simType === 'multiplication' && (
                <>
                  <div>
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      {t('1st Number Digits', 'خانات الرقم الأول')}
                    </label>
                    <select
                      value={simDigits}
                      onChange={(e) => setSimDigits(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={1}>{t('1 Digit', 'رقم 1')}</option>
                      <option value={2}>{t('2 Digits', 'رقمان')}</option>
                      <option value={3}>{t('3 Digits', '3 أرقام')}</option>
                      <option value={4}>{t('4 Digits', '4 أرقام')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      {t('2nd Number Digits', 'خانات الرقم الثاني')}
                    </label>
                    <select
                      value={simDigits2}
                      onChange={(e) => setSimDigits2(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={1}>{t('× 1 Digit', '× رقم 1')}</option>
                      <option value={2}>{t('× 2 Digits', '× رقمان')}</option>
                      <option value={3}>{t('× 3 Digits', '× 3 أرقام')}</option>
                    </select>
                  </div>
                </>
              )}

              {simType === 'division' && (
                <>
                  <div className="col-span-2">
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      {t('Dividend Digits (Whole Result)', 'خانات المقسوم')}
                    </label>
                    <select
                      value={simDigits}
                      onChange={(e) => setSimDigits(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={2}>{t('2 Digits (e.g. 84 ÷ 4)', 'رقمان (مثل 84 ÷ 4)')}</option>
                      <option value={3}>{t('3 Digits (e.g. 576 ÷ 6)', '3 أرقام (مثل 576 ÷ 6)')}</option>
                      <option value={4}>{t('4 Digits (e.g. 3450 ÷ 5)', '4 أرقام (مثل 3450 ÷ 5)')}</option>
                      <option value={5}>{t('5 Digits (Advanced Division)', '5 أرقام (قسمة متقدمة)')}</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Speed & Streak Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-black text-neutral-700 block mb-1">
                  {t('Answer Speed', 'سرعة الإجابة')}
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'flash', label: t('⚡ < 2s (+2)', '⚡ < 2ث (+2)') },
                    { id: 'fast', label: t('⏱️ 2-4s (+1)', '⏱️ 2-4ث (+1)') },
                    { id: 'normal', label: t('Normal (+0)', 'عادي (+0)') }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSimSpeed(s.id as any)}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                        simSpeed === s.id
                          ? 'bg-amber-400 text-neutral-900 border-neutral-900 font-black'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-neutral-700 block mb-1">
                  {t('Consecutive Streak', 'ستريك الإجابات المتتالية')}
                </label>
                <select
                  value={simStreak}
                  onChange={(e) => setSimStreak(Number(e.target.value))}
                  className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                >
                  <option value={0}>{t('No Streak (0)', 'بدون ستريك (0)')}</option>
                  <option value={3}>{t('🔥 3 In-a-row (+1 coin)', '🔥 3 متتالية (+1 عملة)')}</option>
                  <option value={6}>{t('🔥 6 In-a-row (+2 coins)', '🔥 6 متتالية (+2 عملة)')}</option>
                  <option value={9}>{t('🔥 9+ In-a-row (+3 max coins)', '🔥 9+ متتالية (+3 كحد أقصى)')}</option>
                </select>
              </div>
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900">
                  <input
                    type="checkbox"
                    checked={simHasDecimals}
                    onChange={(e) => {
                      sounds.playKeyClick();
                      setSimHasDecimals(e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-2 border-neutral-900 text-amber-500 cursor-pointer"
                  />
                  <span>{t('Include Decimal Point (.) (+1 🪙)', 'تفعيل العلامة العشرية (.) (+1 🪙)')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Summary Box (Right / 5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900 text-white rounded-2xl p-5 border-2 border-neutral-900 shadow-[0_4px_0_0_#000000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <span className="text-xs font-bold text-neutral-400">{t('Reward Breakdown:', 'تفاصيل المكافأة:')}</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    isPracticeZeroCoins
                      ? 'text-sky-300 bg-sky-950/60 border-sky-700'
                      : 'text-amber-400 bg-amber-950/60 border-amber-800/80'
                  }`}
                >
                  {isPracticeZeroCoins ? t('Practice (No Coins)', 'تدريب (بدون عملات)') : t('Calibrated Rate', 'معدل متوازن')}
                </span>
              </div>

              {isPracticeZeroCoins ? (
                <div className="p-3 bg-neutral-800/80 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-200 leading-relaxed">
                  {simType === 'add-sub'
                    ? t(
                        '1-Digit Simple & Formulas of 5 (without decimals) are free practice levels and award 0 coins. Choose Formulas of 10, 2+ Digits, or Decimals to earn coins!',
                        'الجمع والطرح خانة واحدة (البسيط وأصدقاء 5 بدون علامة عشرية) للتدريب فقط وتعطي 0 عملات. اختر أصدقاء 10 أو خانتين+ أو الكسور العشرية لربح العملات!'
                      )
                    : t(
                        '1×1 Digit Multiplication (without decimals) is a free practice level and awards 0 coins. Enable Decimals (.) or increase digits (2×1+) to earn coins!',
                        'الضرب 1×1 (بدون علامة عشرية) للتدريب فقط ويعطي 0 عملات. فعّل العلامة العشرية أو ارفع عدد الخانات (مثل 2×1) لربح العملات!'
                      )}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>{t('Base Operation Coins:', 'عملات العملية الأساسية:')}</span>
                    <span className="font-mono font-bold text-white">+{baseCoins} 🪙</span>
                  </div>
                  {speedBonus > 0 && (
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>{t('Speed Lightning Bonus:', 'مكافأة السرعة الخاطفة:')}</span>
                      <span className="font-mono font-bold text-amber-400">+{speedBonus} 🪙</span>
                    </div>
                  )}
                  {streakBonus > 0 && (
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>{t('Streak Fire Bonus:', 'مكافأة التتابع (ستريك):')}</span>
                      <span className="font-mono font-bold text-rose-400">+{streakBonus} 🪙</span>
                    </div>
                  )}
                  {heroMultiplier > 1 && (
                    <div className="flex justify-between items-center text-amber-300 font-bold border-t border-neutral-800 pt-2">
                      <span className="text-[11px]">{heroMultiplierName}:</span>
                      <span className="font-mono">×{heroMultiplier}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-800">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs font-bold text-neutral-400">{t('Total Per Question:', 'الإجمالي لكل سؤال:')}</span>
                <div className="flex items-center gap-1.5" dir="ltr">
                  <span className="text-3xl font-black font-mono text-amber-400">
                    +{totalCalculated}
                  </span>
                  <span className="text-xl">🪙</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchSimulatedQuiz}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-neutral-950 font-black text-xs rounded-xl cursor-pointer shadow-[0_3px_0_0_#b45309] transition-all flex items-center justify-center gap-2"
              >
                <span>{t('Launch This Quiz Level Now!', 'ابدأ هذا المستوى الآن!')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Operation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Add & Sub */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[0_4px_0_0_#171717] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-neutral-900 flex items-center justify-center text-amber-800 font-black text-xl mb-3 shadow-xs">
              ±
            </div>
            <h3 className="text-base font-black text-neutral-900">{t('Addition & Subtraction', 'الجمع والطرح')}</h3>
            <p className="text-xs font-medium text-neutral-600 mt-1">
              {t('Soroban-style flash mental math with 3 distinct formula complement modes.', 'حساب ذهني سريع بأسلوب السوروبان مع 3 أنماط للمكملات والكسور العشرية.')}
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-neutral-100 rounded-xl border border-neutral-300 flex justify-between gap-2">
                <span className="font-bold text-neutral-700">{t('1 Digit (Simple & Friends-5):', 'رقم واحد (بسيط وأصدقاء 5):')}</span>
                <span className="font-mono font-black text-neutral-600">{t('0 🪙 (Practice)', '0 🪙 (تدريب)')}</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-300 flex justify-between gap-2">
                <span className="font-bold text-amber-900">{t('1 Digit (Formulas of 10):', 'رقم واحد (أصدقاء 10):')}</span>
                <span className="font-mono font-black text-amber-700">3 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between gap-2">
                <span className="font-bold text-neutral-700">{t('2-4 Digits & Decimals (.):', '2-4 أرقام والكسور العشرية:')}</span>
                <span className="font-mono font-black text-neutral-900">3 - 6 🪙</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Multiplication */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[0_4px_0_0_#171717] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 border-2 border-neutral-900 flex items-center justify-center text-sky-800 font-black text-xl mb-3 shadow-xs">
              ×
            </div>
            <h3 className="text-base font-black text-neutral-900">{t('Multiplication Sprint', 'سباق الضرب')}</h3>
            <p className="text-xs font-medium text-neutral-600 mt-1">
              {t('Rapid multiplication from single tables to multi-digit & decimal products.', 'ضرب سريع من جداول الضرب إلى الأرقام المتعددة والكسور العشرية في الرقمين.')}
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-neutral-100 rounded-xl border border-neutral-300 flex justify-between gap-2">
                <span className="font-bold text-neutral-700">{t('1×1 Digit (No Decimals):', '1×1 رقم (بدون علامة عشرية):')}</span>
                <span className="font-mono font-black text-neutral-600">{t('0 🪙 (Practice)', '0 🪙 (تدريب)')}</span>
              </div>
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-300 flex justify-between gap-2">
                <span className="font-bold text-sky-900">{t('1×1 With Decimals (Both):', '1×1 بالكسور العشرية (في الرقمين):')}</span>
                <span className="font-mono font-black text-sky-800">4 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between gap-2">
                <span className="font-bold text-neutral-700">{t('2×1 / 2×2 / 3×2 Digits:', '2×1 / 2×2 / 3×2 أرقام:')}</span>
                <span className="font-mono font-black text-neutral-900">4 - 6 🪙</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Division */}
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-5 shadow-[0_4px_0_0_#171717] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-neutral-900 flex items-center justify-center text-emerald-800 font-black text-xl mb-3 shadow-xs">
              ÷
            </div>
            <h3 className="text-base font-black text-neutral-900">{t('Clean Division Split', 'القسمة الدقيقة')}</h3>
            <p className="text-xs font-medium text-neutral-600 mt-1">
              {t('Exact divisions without infinite remainders, including both-decimal mode.', 'قسمة دقيقة بدون بواقي غير منتهية، تشمل وضع الكسور العشرية للرقمين.')}
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">{t('2 Digits ÷ 1 Digit:', 'رقمان ÷ رقم:')}</span>
                <span className="font-mono font-black text-neutral-900">3 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">{t('3-4+ Digits ÷ 1-2 Digits:', '3-4+ أرقام ÷ 1-2 رقم:')}</span>
                <span className="font-mono font-black text-neutral-900">4 - 5 🪙</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-300 flex justify-between">
                <span className="font-bold text-emerald-900">{t('Decimals (Both Numbers):', 'الكسور العشرية (في الرقمين):')}</span>
                <span className="font-mono font-black text-emerald-800">{t('+1 🪙 Bonus', '+1 🪙 إضافية')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Superpowers & Hero Multipliers Table */}
      <div className="bg-white border-2 sm:border-3 border-neutral-900 rounded-3xl p-5 sm:p-7 shadow-[0_6px_0_0_#171717]">
        <div className="flex items-center gap-2 border-b-2 border-neutral-100 pb-4 mb-4">
          <Trophy className="w-6 h-6 text-amber-500" />
          <div>
            <h3 className="text-base sm:text-lg font-black text-neutral-900">
              {t("Ballon d'Or Legends & Special Perks", 'أساطير الكرة الذهبية والقدرات الخاصة')}
            </h3>
            <span className="text-xs font-bold text-neutral-500">
              {t(
                "Equipping prestigious Ballon d'Or winners in your locker activates passive training perks.",
                'تجهيز الفائزين بالكرة الذهبية من المتجر يفعّل قدرات تدريبية مميزة.'
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">{t('Lionel Messi (2X Golden Touch)', 'ليونيل ميسي (مضاعفة العملات 2X)')}</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {t('Permanently doubles all coins earned from problems and speed bonuses!', 'يضاعف جميع العملات المكتسبة من المسائل ومكافآت السرعة!')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-pink-50 border-2 border-pink-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">{t('Ronaldinho, Ronaldo R9 & Kaká', 'رونالدينيو ورونالدو R9 وكاكا')}</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {t('Samba Fever grants a 1.5X multiplier on every correct calculation!', 'حمى السامبا تمنحك مضاعفة 1.5X على كل إجابة صحيحة!')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">{t('Cristiano Ronaldo & Cannavaro', 'كريستيانو رونالدو وكانافارو')}</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {t('Iron Will shield protects you from wrong answers and awards the coins anyway!', 'درع الإرادة الحديدية يحميك من الإجابات الخاطئة ويمنحك العملات!')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">{t('Rodri Hernández (2024 Winner)', 'رودري هيرنانديز (بطل 2024)')}</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {t('Tactical Radar gives smart step hints on challenging mental operations.', 'الرادار التكتيكي يمنحك تلميحات ذكية في المسائل الصعبة.')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border-2 border-indigo-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">⏸️</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">{t('Modrić, Benzema & Zidane', 'مودريتش وبنزيما وزيدان')}</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {t('Chrono Freeze pauses the countdown timer so you can calculate with total focus.', 'تجميد الوقت يوقف المؤقت مؤقتاً لتحسب بتركيز كامل.')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">{t('Streak & Daily Streaks', 'ستريك الإجابات والأيام')}</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                {t('Answer streaks boost coins (+3 max), and Daily Login Streaks track your consecutive days on the Leaderboard!', 'ستريك الإجابات يزيد العملات، وستريك الأيام يتتبع حضورك اليومي في لوحة الشرف!')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
