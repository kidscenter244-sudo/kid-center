import React, { useState } from 'react';
import {
  AddSubSettings,
  MultiplicationSettings,
  DivisionSettings,
  MixedSettings
} from '../types';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CHARACTERS, getPlayerPhotoUrl } from '../data/characters';
import { Plus, Minus, X, Divide, Play, Clock, Hash, Layers, Flame } from 'lucide-react';

interface MathTrainingArenaProps {
  onStartQuiz: (
    type: 'add-sub' | 'multiplication' | 'division' | 'mixed',
    settings: AddSubSettings | MultiplicationSettings | DivisionSettings | MixedSettings,
    categoryName: string
  ) => void;
}

export const MathTrainingArena: React.FC<MathTrainingArenaProps> = ({ onStartQuiz }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const equippedId = user?.equippedCharacterId || user?.unlockedCharacters?.[0] || '';
  const equippedHero = CHARACTERS.find((c) => c.id === equippedId);

  const [arenaMode, setArenaMode] = useState<'single' | 'mixed'>('single');

  // Box 1: Addition & Subtraction
  const [addSubNumbers, setAddSubNumbers] = useState<number>(3);
  const [addSubDigits, setAddSubDigits] = useState<number>(2);
  const [addSubFormulaMode, setAddSubFormulaMode] = useState<'simple' | 'friends-5' | 'friends-10'>('simple');
  const [addSubQuestions, setAddSubQuestions] = useState<number>(10);
  const [addSubMinutes, setAddSubMinutes] = useState<number>(1);
  const [addSubDecimals, setAddSubDecimals] = useState<boolean>(false);
  const [addSubDecimalPlaces, setAddSubDecimalPlaces] = useState<number>(1);

  // Box 2: Multiplication
  const [multDigits1, setMultDigits1] = useState<number>(2);
  const [multDigits2, setMultDigits2] = useState<number>(1);
  const [multQuestions, setMultQuestions] = useState<number>(10);
  const [multMinutes, setMultMinutes] = useState<number>(1);
  const [multDecimals, setMultDecimals] = useState<boolean>(false);
  const [multDecimalPlaces, setMultDecimalPlaces] = useState<number>(1);

  // Box 3: Division
  const [divDividendDigits, setDivDividendDigits] = useState<number>(3);
  const [divDivisorDigits, setDivDivisorDigits] = useState<number>(1);
  const [divQuestions, setDivQuestions] = useState<number>(10);
  const [divMinutes, setDivMinutes] = useState<number>(1);
  const [divDecimals, setDivDecimals] = useState<boolean>(false);
  const [divDecimalPlaces, setDivDecimalPlaces] = useState<number>(1);

  // Mixed Mode Settings
  const [mixedAddSubActive, setMixedAddSubActive] = useState<boolean>(true);
  const [mixedAddSubCount, setMixedAddSubCount] = useState<number>(10);
  const [mixedAddSubNumbers, setMixedAddSubNumbers] = useState<number>(3);
  const [mixedAddSubDigits, setMixedAddSubDigits] = useState<number>(2);
  const [mixedAddSubFormulaMode, setMixedAddSubFormulaMode] = useState<'simple' | 'friends-5' | 'friends-10'>('simple');
  const [mixedAddSubDecimals, setMixedAddSubDecimals] = useState<boolean>(false);
  const [mixedAddSubDecimalPlaces, setMixedAddSubDecimalPlaces] = useState<number>(1);

  const [mixedMultActive, setMixedMultActive] = useState<boolean>(true);
  const [mixedMultCount, setMixedMultCount] = useState<number>(10);
  const [mixedMultDigits1, setMixedMultDigits1] = useState<number>(2);
  const [mixedMultDigits2, setMixedMultDigits2] = useState<number>(1);
  const [mixedMultDecimals, setMixedMultDecimals] = useState<boolean>(false);
  const [mixedMultDecimalPlaces, setMixedMultDecimalPlaces] = useState<number>(1);

  const [mixedDivActive, setMixedDivActive] = useState<boolean>(false);
  const [mixedDivCount, setMixedDivCount] = useState<number>(5);
  const [mixedDivDividendDigits, setMixedDivDividendDigits] = useState<number>(3);
  const [mixedDivDivisorDigits, setMixedDivDivisorDigits] = useState<number>(1);
  const [mixedDivDecimals, setMixedDivDecimals] = useState<boolean>(false);
  const [mixedDivDecimalPlaces, setMixedDivDecimalPlaces] = useState<number>(1);

  const [mixedMinutes, setMixedMinutes] = useState<number>(2);

  const startAddSub = () => {
    sounds.playKeyClick();
    onStartQuiz(
      'add-sub',
      {
        numbersCount: Math.max(2, addSubNumbers || 3),
        digitsCount: Math.max(1, addSubDigits || 1),
        formulaMode: addSubFormulaMode,
        hasDecimals: addSubDecimals,
        decimalPlaces: addSubDecimals ? addSubDecimalPlaces : 0,
        questionCount: Math.max(1, addSubQuestions || 10),
        timeLimitSeconds: Math.round(Math.max(0, addSubMinutes || 0) * 60)
      },
      t(
        `Mental Addition & Subtraction (${
          addSubFormulaMode === 'friends-5'
            ? 'Formulas of 5'
            : addSubFormulaMode === 'friends-10'
            ? 'Formulas of 10'
            : 'Simple / Direct'
        }${addSubDecimals ? ` • ${addSubDecimalPlaces} Dec` : ''})`,
        `الجمع والطرح الذهني (${
          addSubFormulaMode === 'friends-5'
            ? 'أصدقاء 5'
            : addSubFormulaMode === 'friends-10'
            ? 'أصدقاء 10'
            : 'مباشر'
        }${addSubDecimals ? ` • ${addSubDecimalPlaces} أرقام عشرية` : ''})`
      )
    );
  };

  const startMult = () => {
    sounds.playKeyClick();
    onStartQuiz(
      'multiplication',
      {
        digits1: Math.max(1, multDigits1 || 2),
        digits2: Math.max(1, multDigits2 || 1),
        hasDecimals: multDecimals,
        decimalPlaces: multDecimals ? multDecimalPlaces : 0,
        questionCount: Math.max(1, multQuestions || 10),
        timeLimitSeconds: Math.round(Math.max(0, multMinutes || 0) * 60)
      },
      t(
        `Multiplication Sprint${multDecimals ? ` (${multDecimalPlaces} Dec)` : ''}`,
        `سباق الضرب${multDecimals ? ` (${multDecimalPlaces} أرقام عشرية)` : ''}`
      )
    );
  };

  const startDiv = () => {
    sounds.playKeyClick();
    const dividend = Math.max(2, divDividendDigits || 2);
    const divisor = Math.max(1, Math.min(dividend - 1, divDivisorDigits || 1));
    onStartQuiz(
      'division',
      {
        dividendDigits: dividend,
        divisorDigits: divisor,
        hasDecimals: divDecimals,
        decimalPlaces: divDecimals ? divDecimalPlaces : 0,
        questionCount: Math.max(1, divQuestions || 10),
        timeLimitSeconds: Math.round(Math.max(0, divMinutes || 0) * 60)
      },
      t(
        `Division Lightning${divDecimals ? ` (${divDecimalPlaces} Dec)` : ''}`,
        `برق القسمة${divDecimals ? ` (${divDecimalPlaces} أرقام عشرية)` : ''}`
      )
    );
  };

  const startMixed = () => {
    sounds.playKeyClick();
    const settings: MixedSettings = {
      includeAddSub: mixedAddSubActive,
      addSubCount: mixedAddSubActive ? Math.max(1, mixedAddSubCount) : 0,
      addSubNumbers: Math.max(2, mixedAddSubNumbers),
      addSubDigits: Math.max(1, mixedAddSubDigits),
      addSubFormulaMode: mixedAddSubFormulaMode,
      addSubHasDecimals: mixedAddSubDecimals,
      addSubDecimalPlaces: mixedAddSubDecimals ? mixedAddSubDecimalPlaces : 0,

      includeMultiplication: mixedMultActive,
      multCount: mixedMultActive ? Math.max(1, mixedMultCount) : 0,
      multDigits1: Math.max(1, mixedMultDigits1),
      multDigits2: Math.max(1, mixedMultDigits2),
      multHasDecimals: mixedMultDecimals,
      multDecimalPlaces: mixedMultDecimals ? mixedMultDecimalPlaces : 0,

      includeDivision: mixedDivActive,
      divCount: mixedDivActive ? Math.max(1, mixedDivCount) : 0,
      divDividendDigits: Math.max(2, mixedDivDividendDigits),
      divDivisorDigits: Math.max(1, mixedDivDivisorDigits),
      divHasDecimals: mixedDivDecimals,
      divDecimalPlaces: mixedDivDecimals ? mixedDivDecimalPlaces : 0,

      timeLimitSeconds: Math.round(Math.max(0, mixedMinutes || 0) * 60)
    };

    onStartQuiz(
      'mixed',
      settings,
      t('Custom Mixed Multi-Operation Challenge', 'تحدي العمليات المختلطة المخصص')
    );
  };

  const totalMixedQuestions =
    (mixedAddSubActive ? mixedAddSubCount : 0) +
    (mixedMultActive ? mixedMultCount : 0) +
    (mixedDivActive ? mixedDivCount : 0);

  const DecimalControls = ({
    enabled,
    onToggle,
    places,
    onChangePlaces,
    hint
  }: {
    enabled: boolean;
    onToggle: (v: boolean) => void;
    places: number;
    onChangePlaces: (n: number) => void;
    hint?: string;
  }) => (
    <div className="p-2.5 bg-neutral-50 border-2 border-neutral-900 rounded-2xl space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-neutral-900">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              sounds.playKeyClick();
              onToggle(e.target.checked);
            }}
            className="w-4 h-4 rounded border-2 border-neutral-900 text-amber-500 cursor-pointer"
          />
          <span>{t('Decimals (.)', 'أرقام عشرية (.)')}</span>
        </label>
        {enabled && (
          <span className="text-[10px] font-mono font-black bg-amber-200 text-neutral-900 px-2 py-0.5 rounded border border-neutral-900">
            {t(`After ${places} digit${places > 1 ? 's' : ''}`, `بعد ${places} ${places === 1 ? 'رقم' : 'أرقام'}`)}
          </span>
        )}
      </div>

      {enabled && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((dp) => (
              <button
                key={dp}
                type="button"
                onClick={() => {
                  sounds.playKeyClick();
                  onChangePlaces(dp);
                }}
                className={`py-1.5 px-2 rounded-xl border-2 border-neutral-900 font-mono text-[11px] font-black cursor-pointer transition-all ${
                  places === dp
                    ? 'bg-neutral-900 text-amber-300 shadow-[0_2px_0_0_#171717]'
                    : 'bg-white text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                {dp === 1 ? '0.1 (1)' : dp === 2 ? '0.01 (2)' : '0.001 (3)'}
              </button>
            ))}
          </div>
          {hint && <p className="text-[10px] font-bold text-neutral-600 leading-tight">{hint}</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Active Equipped Player Card */}
      <div className="bg-white border-2 border-neutral-900 rounded-3xl p-4 sm:p-5 shadow-[0_6px_0_0_#171717] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {equippedHero ? (
            <>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-neutral-900 overflow-hidden bg-neutral-900 shadow-sm shrink-0">
                <img src={getPlayerPhotoUrl(equippedHero)} alt={equippedHero.name} className="w-full h-full object-cover object-top" />
                {equippedHero.hasBallonDor && (
                  <span className="absolute bottom-0 right-0 bg-amber-400 text-neutral-950 text-[10px] font-black px-1 rounded-tl border-t border-l border-neutral-900">
                    🏆
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                    {t('Your Equipped Champion', 'بطلك المجهّز')}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-neutral-500">{equippedHero.tier}</span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-neutral-900 mt-0.5 leading-tight">{equippedHero.name}</h2>
                {equippedHero.ballonDorPower ? (
                  <p className="text-xs font-bold text-neutral-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-neutral-500 font-semibold">{t('Special Perk:', 'الميزة الخاصة:')}</span>
                    <span className="text-amber-800 font-black">{equippedHero.ballonDorPower.name}</span>
                    <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-mono">
                      {equippedHero.ballonDorPower.badge}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                    {t('Standard Champion • Ready for Math Challenges', 'بطل جاهز لتحديات الحساب الذهني')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed border-neutral-400 bg-neutral-100 flex items-center justify-center text-2xl">
                ⚽
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-neutral-500 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-md">
                  {t('No Player Equipped', 'لا يوجد لاعب مجهّز')}
                </span>
                <h2 className="text-base sm:text-lg font-black text-neutral-900 mt-1">
                  {t('Choose Your First Player', 'اختر أول لاعب لك')}
                </h2>
                <p className="text-xs font-semibold text-neutral-500 mt-0.5">
                  {t(
                    'Visit the Players Locker and unlock a player to represent you in the arena.',
                    'اجمع العملات وافتح لاعبك الأول من خزنة اللاعبين ليمثلك في الساحة.'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="bg-amber-50 border-2 border-neutral-900 px-3.5 py-1.5 rounded-2xl font-mono text-center shadow-xs">
            <span className="text-[9px] font-black uppercase text-amber-800 block">
              {t('Bank Balance', 'رصيد العملات')}
            </span>
            <span className="text-sm font-black text-amber-950" dir="ltr">
              🪙 {user?.coins ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher Pill */}
      <div className="flex justify-center">
        <div className="bg-white border-2 border-neutral-900 rounded-2xl p-1.5 shadow-[0_4px_0_0_#171717] flex items-center gap-1.5">
          <button
            onClick={() => {
              sounds.playKeyClick();
              setArenaMode('single');
            }}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              arenaMode === 'single' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>⚡ {t('Single Operation Arena', 'ساحة العملية الواحدة')}</span>
          </button>

          <button
            onClick={() => {
              sounds.playKeyClick();
              setArenaMode('mixed');
            }}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              arenaMode === 'mixed' ? 'bg-amber-400 text-neutral-900 shadow-sm' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <Flame className="w-4 h-4 fill-amber-500 text-neutral-900" />
            <span>🔥 {t('Custom Multi-Mix Mode', 'الوضع المختلط المخصص')}</span>
          </button>
        </div>
      </div>

      {/* 1. SINGLE OPERATION MODE: The 3 Boxes */}
      {arenaMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BOX 1: ADDITION & SUBTRACTION */}
          <div className="bg-white border-2 border-neutral-900 rounded-3xl shadow-[0_8px_0_0_#171717] p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[0_12px_0_0_#171717]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2 border-neutral-900 shadow-[0_2px_0_0_#171717] flex items-center justify-center font-black text-xl text-neutral-900">
                    <span className="flex items-center font-bold">
                      <Plus className="w-4 h-4 -mr-1" />
                      <Minus className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                      {t('BOX 1 • Soroban', 'الصندوق 1 • سوروبان')}
                    </span>
                    <h3 className="text-base font-black text-neutral-900">
                      {t('Addition & Subtraction', 'الجمع والطرح')}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="my-3 p-2 bg-amber-50 border border-amber-300 rounded-xl text-[11px] font-semibold text-neutral-800">
                <span className="font-bold text-amber-900">{t('Rule:', 'القاعدة:')}</span>{' '}
                {t(
                  "Soroban column math with direct & complement formulas.",
                  'مسائل حساب ذهني عمودية بقواعد السوروبان والأصدقاء.'
                )}
              </div>

              <div className="space-y-3 my-3">
                <div>
                  <label className="flex items-center justify-between text-xs font-black uppercase text-neutral-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-neutral-500" />
                      {t('Rows / Numbers:', 'عدد الصفوف / الأرقام:')}
                    </span>
                    <span className="text-neutral-400 text-[11px]">{t('Type freely', 'اكتب بحرية')}</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={addSubNumbers}
                    onChange={(e) => setAddSubNumbers(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-black uppercase text-neutral-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-neutral-500" />
                      {t('Digits Count:', 'عدد الخانات:')}
                    </span>
                    <span className="text-neutral-400 text-[11px]">1, 2, 3...</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={addSubDigits}
                    onChange={(e) => setAddSubDigits(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('Questions:', 'الأسئلة:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={addSubQuestions}
                      onChange={(e) => setAddSubQuestions(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-black uppercase text-neutral-700 mb-1">
                      <Clock className="w-3 h-3" /> {t('Time (Min):', 'الوقت (دقائق):')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      value={addSubMinutes}
                      onChange={(e) => setAddSubMinutes(parseFloat(e.target.value) || 0)}
                      placeholder={t('0 = Untimed', '0 = بدون وقت')}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900"
                    />
                  </div>
                </div>

                <DecimalControls
                  enabled={addSubDecimals}
                  onToggle={setAddSubDecimals}
                  places={addSubDecimalPlaces}
                  onChangePlaces={setAddSubDecimalPlaces}
                />

                {/* Formula Mode Rules Selector */}
                <div className="p-3 bg-neutral-50 border-2 border-neutral-900 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                      {t('Formula Rules', 'قواعد الصيغ')}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                      {t('Soroban Math', 'حساب سوروبان')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'simple', label: t('Simple / Direct', 'بسيط / مباشر'), sub: t('Basic Rules', 'بدون مكملات') },
                      { id: 'friends-5', label: t('Formulas of 5', 'أصدقاء 5'), sub: t('Small Friends', 'صغار') },
                      { id: 'friends-10', label: t('Formulas of 10', 'أصدقاء 10'), sub: t('Big Friends', 'كبار') }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          sounds.playKeyClick();
                          setAddSubFormulaMode(m.id as any);
                        }}
                        className={`py-2 px-1 rounded-xl border-2 border-neutral-900 text-center transition-all cursor-pointer ${
                          addSubFormulaMode === m.id
                            ? 'bg-neutral-900 text-amber-300 shadow-[0_2px_0_0_#171717] -translate-y-0.5'
                            : 'bg-white text-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="text-[11px] font-black leading-tight">{m.label}</div>
                        <div className="text-[9px] font-bold text-neutral-400 mt-0.5">{m.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>{t('Earn up to:', 'اربح حتى:')}</span>
                {!addSubDecimals && addSubDigits === 1 && (addSubFormulaMode === 'simple' || addSubFormulaMode === 'friends-5') ? (
                  <span className="font-mono text-neutral-600 font-black">
                    🪙 {t('0 Coins (Practice)', '0 عملة (تدريب)')}
                  </span>
                ) : (
                  <span className="font-mono text-amber-600 font-black" dir="ltr">
                    🪙 ~{addSubQuestions * (3 + Math.min(3, addSubDigits - 1) + (addSubFormulaMode === 'friends-10' ? 1 : 0) + (addSubDecimals ? 1 : 0))}{' '}
                    {t('Coins', 'عملة')}
                  </span>
                )}
              </div>

              <button
                onClick={startAddSub}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 border-2 border-neutral-900 rounded-2xl font-black text-neutral-900 shadow-[0_3px_0_0_#171717] active:translate-y-0.5 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-900" />
                <span>{t('Start Addition & Subtraction', 'ابدأ الجمع والطرح')}</span>
              </button>
            </div>
          </div>

          {/* BOX 2: MULTIPLICATION */}
          <div className="bg-white border-2 border-neutral-900 rounded-3xl shadow-[0_8px_0_0_#171717] p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[0_12px_0_0_#171717]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-300 border-2 border-neutral-900 shadow-[0_2px_0_0_#171717] flex items-center justify-center font-black text-xl text-neutral-900">
                    <X className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
                      {t('BOX 2 • Times Tables', 'الصندوق 2 • جدول الضرب')}
                    </span>
                    <h3 className="text-base font-black text-neutral-900">{t('Multiplication', 'الضرب')}</h3>
                  </div>
                </div>
              </div>

              <div className="my-3 p-2 bg-sky-50 border border-sky-300 rounded-xl text-[11px] font-semibold text-neutral-800">
                <span className="font-bold text-sky-900">{t('Format:', 'الصيغة:')}</span>{' '}
                {t(
                  'Digits of 1st number × Digits of 2nd number (e.g. 2D × 1D, 2D × 2D).',
                  'عدد خانات الرقم الأول × عدد خانات الرقم الثاني.'
                )}
              </div>

              <div className="space-y-3 my-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('1st Num Digits:', 'خانات الأول:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={multDigits1}
                      onChange={(e) => setMultDigits1(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-base text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('2nd Num Digits:', 'خانات الثاني:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={multDigits2}
                      onChange={(e) => setMultDigits2(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-base text-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('Questions:', 'الأسئلة:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={multQuestions}
                      onChange={(e) => setMultQuestions(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-black uppercase text-neutral-700 mb-1">
                      <Clock className="w-3 h-3" /> {t('Time (Min):', 'الوقت (دقائق):')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      value={multMinutes}
                      onChange={(e) => setMultMinutes(parseFloat(e.target.value) || 0)}
                      placeholder={t('0 = Untimed', '0 = بدون وقت')}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900"
                    />
                  </div>
                </div>

                <DecimalControls
                  enabled={multDecimals}
                  onToggle={setMultDecimals}
                  places={multDecimalPlaces}
                  onChangePlaces={setMultDecimalPlaces}
                  hint={t(
                    'Decimal point will appear in BOTH numbers!',
                    'ستظهر العلامة العشرية في الرقمين معاً!'
                  )}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>{t('Earn up to:', 'اربح حتى:')}</span>
                {!multDecimals && multDigits1 === 1 && multDigits2 === 1 ? (
                  <span className="font-mono text-neutral-600 font-black">
                    🪙 {t('0 Coins (Practice)', '0 عملة (تدريب)')}
                  </span>
                ) : (
                  <span className="font-mono text-amber-600 font-black" dir="ltr">
                    🪙 ~{multQuestions * (3 + Math.min(3, multDigits1 + multDigits2 - 2) + (multDecimals ? 1 : 0))}{' '}
                    {t('Coins', 'عملة')}
                  </span>
                )}
              </div>

              <button
                onClick={startMult}
                className="w-full py-3 bg-sky-300 hover:bg-sky-400 border-2 border-neutral-900 rounded-2xl font-black text-neutral-900 shadow-[0_3px_0_0_#171717] active:translate-y-0.5 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-900" />
                <span>{t('Start Multiplication', 'ابدأ الضرب')}</span>
              </button>
            </div>
          </div>

          {/* BOX 3: DIVISION */}
          <div className="bg-white border-2 border-neutral-900 rounded-3xl shadow-[0_8px_0_0_#171717] p-6 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-[0_12px_0_0_#171717]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-300 border-2 border-neutral-900 shadow-[0_2px_0_0_#171717] flex items-center justify-center font-black text-xl text-neutral-900">
                    <Divide className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      {t('BOX 3 • Clean Split', 'الصندوق 3 • قسمة دقيقة')}
                    </span>
                    <h3 className="text-base font-black text-neutral-900">{t('Division', 'القسمة')}</h3>
                  </div>
                </div>
              </div>

              <div className="my-3 p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-[11px] font-semibold text-neutral-800">
                <span className="font-bold text-emerald-900">{t('Clean Division:', 'قسمة نظيفة:')}</span>{' '}
                {t(
                  'Exact quotients without repeating decimals for rapid mental calculation.',
                  'نواتج قسمة دقيقة بدون باقي متكرر لتدريب الذهن بسرعة.'
                )}
              </div>

              <div className="space-y-3 my-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('Dividend Digits:', 'خانات المقسوم:')}
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="6"
                      value={divDividendDigits}
                      onChange={(e) => setDivDividendDigits(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-base text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('Divisor Digits:', 'خانات المقسوم عليه:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={divDivisorDigits}
                      onChange={(e) => setDivDivisorDigits(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-base text-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                      {t('Questions:', 'الأسئلة:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={divQuestions}
                      onChange={(e) => setDivQuestions(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-black uppercase text-neutral-700 mb-1">
                      <Clock className="w-3 h-3" /> {t('Time (Min):', 'الوقت (دقائق):')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      value={divMinutes}
                      onChange={(e) => setDivMinutes(parseFloat(e.target.value) || 0)}
                      placeholder={t('0 = Untimed', '0 = بدون وقت')}
                      className="w-full px-3 py-2 bg-neutral-50 focus:bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-neutral-900"
                    />
                  </div>
                </div>

                <DecimalControls
                  enabled={divDecimals}
                  onToggle={setDivDecimals}
                  places={divDecimalPlaces}
                  onChangePlaces={setDivDecimalPlaces}
                  hint={t(
                    'Decimal point will appear in BOTH numbers!',
                    'ستظهر العلامة العشرية في المقسوم والمقسوم عليه معاً!'
                  )}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 mt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>{t('Earn up to:', 'اربح حتى:')}</span>
                <span className="font-mono text-amber-600 font-black" dir="ltr">
                  🪙 ~{divQuestions * (3 + Math.min(3, divDividendDigits - 1) + (divDecimals ? 1 : 0))}{' '}
                  {t('Coins', 'عملة')}
                </span>
              </div>

              <button
                onClick={startDiv}
                className="w-full py-3 bg-emerald-300 hover:bg-emerald-400 border-2 border-neutral-900 rounded-2xl font-black text-neutral-900 shadow-[0_3px_0_0_#171717] active:translate-y-0.5 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-900" />
                <span>{t('Start Division', 'ابدأ القسمة')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOM MULTI-MIX WORKOUT */}
      {arenaMode === 'mixed' && (
        <div className="bg-white border-2 border-neutral-900 rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_#171717] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-neutral-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h3 className="font-black text-xl text-neutral-900">
                  {t('Custom Multi-Operation Mix Builder', 'منشئ التحدي المختلط المخصص')}
                </h3>
              </div>
              <p className="text-xs font-semibold text-neutral-600">
                {t(
                  'Combine operations into one exam! Choose how many from each operation you want.',
                  'ادمج العمليات الحسابية في اختبار واحد وحدد عدد أسئلة كل عملية.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-amber-100 border border-neutral-900 px-3.5 py-1.5 rounded-xl font-mono font-black text-xs text-neutral-900">
              <span>
                {t(`Total: ${totalMixedQuestions} Questions`, `الإجمالي: ${totalMixedQuestions} سؤال`)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Addition & Subtraction Segment */}
            <div
              className={`p-4 rounded-2xl border-2 border-neutral-900 transition-all ${
                mixedAddSubActive ? 'bg-amber-50 shadow-[0_3px_0_0_#171717]' : 'bg-neutral-50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer font-black text-sm text-neutral-900">
                  <input
                    type="checkbox"
                    checked={mixedAddSubActive}
                    onChange={(e) => setMixedAddSubActive(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-neutral-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{t('1. Addition & Subtraction', '1. الجمع والطرح')}</span>
                </label>
                {mixedAddSubActive && (
                  <span className="text-xs font-black text-amber-700 bg-amber-200 px-2.5 py-0.5 rounded-lg border border-neutral-900">
                    {t('Active', 'مفعّل')}
                  </span>
                )}
              </div>

              {mixedAddSubActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Questions Count:', 'عدد الأسئلة:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={mixedAddSubCount}
                      onChange={(e) => setMixedAddSubCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Rows / Numbers:', 'عدد الصفوف:')}
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={mixedAddSubNumbers}
                      onChange={(e) => setMixedAddSubNumbers(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Digits Count:', 'عدد الخانات:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={mixedAddSubDigits}
                      onChange={(e) => setMixedAddSubDigits(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3 pt-2 border-t border-amber-200 space-y-2">
                    <label className="block text-[11px] font-black uppercase text-neutral-700">
                      {t('Formula Rule:', 'قاعدة الصيغة:')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'simple', label: t('Simple / Direct', 'بسيط / مباشر'), sub: t('No Complements', 'بدون مكملات') },
                        { id: 'friends-5', label: t('Formulas of 5', 'أصدقاء 5'), sub: t('Small Friends', 'صغار') },
                        { id: 'friends-10', label: t('Formulas of 10', 'أصدقاء 10'), sub: t('Big Friends', 'كبار') }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            sounds.playKeyClick();
                            setMixedAddSubFormulaMode(m.id as any);
                          }}
                          className={`py-2 px-1 rounded-xl border-2 border-neutral-900 text-center transition-all cursor-pointer ${
                            mixedAddSubFormulaMode === m.id
                              ? 'bg-neutral-900 text-amber-300 shadow-[0_2px_0_0_#171717] -translate-y-0.5'
                              : 'bg-white text-neutral-800 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="text-[11px] font-black leading-tight">{m.label}</div>
                          <div className="text-[9px] font-bold text-neutral-500 mt-0.5">{m.sub}</div>
                        </button>
                      ))}
                    </div>

                    <DecimalControls
                      enabled={mixedAddSubDecimals}
                      onToggle={setMixedAddSubDecimals}
                      places={mixedAddSubDecimalPlaces}
                      onChangePlaces={setMixedAddSubDecimalPlaces}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Multiplication Segment */}
            <div
              className={`p-4 rounded-2xl border-2 border-neutral-900 transition-all ${
                mixedMultActive ? 'bg-sky-50 shadow-[0_3px_0_0_#171717]' : 'bg-neutral-50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer font-black text-sm text-neutral-900">
                  <input
                    type="checkbox"
                    checked={mixedMultActive}
                    onChange={(e) => setMixedMultActive(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-neutral-900 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{t('2. Multiplication', '2. الضرب')}</span>
                </label>
                {mixedMultActive && (
                  <span className="text-xs font-black text-sky-700 bg-sky-200 px-2.5 py-0.5 rounded-lg border border-neutral-900">
                    {t('Active', 'مفعّل')}
                  </span>
                )}
              </div>

              {mixedMultActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-sky-200">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Questions Count:', 'عدد الأسئلة:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={mixedMultCount}
                      onChange={(e) => setMixedMultCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('1st Num Digits:', 'خانات الأول:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={mixedMultDigits1}
                      onChange={(e) => setMixedMultDigits1(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('2nd Num Digits:', 'خانات الثاني:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={mixedMultDigits2}
                      onChange={(e) => setMixedMultDigits2(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <DecimalControls
                      enabled={mixedMultDecimals}
                      onToggle={setMixedMultDecimals}
                      places={mixedMultDecimalPlaces}
                      onChangePlaces={setMixedMultDecimalPlaces}
                      hint={t('Decimal point will appear in BOTH numbers!', 'ستظهر العلامة العشرية في الرقمين معاً!')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Division Segment */}
            <div
              className={`p-4 rounded-2xl border-2 border-neutral-900 transition-all ${
                mixedDivActive ? 'bg-emerald-50 shadow-[0_3px_0_0_#171717]' : 'bg-neutral-50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer font-black text-sm text-neutral-900">
                  <input
                    type="checkbox"
                    checked={mixedDivActive}
                    onChange={(e) => setMixedDivActive(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-neutral-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{t('3. Division', '3. القسمة')}</span>
                </label>
                {mixedDivActive && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-200 px-2.5 py-0.5 rounded-lg border border-neutral-900">
                    {t('Active', 'مفعّل')}
                  </span>
                )}
              </div>

              {mixedDivActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Questions Count:', 'عدد الأسئلة:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={mixedDivCount}
                      onChange={(e) => setMixedDivCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Dividend Digits:', 'خانات المقسوم:')}
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="6"
                      value={mixedDivDividendDigits}
                      onChange={(e) => setMixedDivDividendDigits(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
                      {t('Divisor Digits:', 'خانات المقسوم عليه:')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={mixedDivDivisorDigits}
                      onChange={(e) => setMixedDivDivisorDigits(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <DecimalControls
                      enabled={mixedDivDecimals}
                      onToggle={setMixedDivDecimals}
                      places={mixedDivDecimalPlaces}
                      onChangePlaces={setMixedDivDecimalPlaces}
                      hint={t(
                        'Decimal point will appear in BOTH numbers!',
                        'ستظهر العلامة العشرية في المقسوم والمقسوم عليه معاً!'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mixed Footer: Total Time Limit in Minutes & Launch */}
          <div className="pt-4 border-t-2 border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-black uppercase text-neutral-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-600" />
                {t('Combined Time Limit (Min):', 'الوقت الإجمالي (بالدقائق):')}
              </label>
              <input
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={mixedMinutes}
                onChange={(e) => setMixedMinutes(parseFloat(e.target.value) || 0)}
                placeholder={t('0 = Untimed', '0 = بدون وقت')}
                className="w-28 px-3 py-2 bg-neutral-50 border-2 border-neutral-900 rounded-xl font-mono font-bold text-sm text-center"
              />
            </div>

            <button
              onClick={startMixed}
              disabled={totalMixedQuestions === 0}
              className={`w-full sm:w-auto px-8 py-3.5 border-2 border-neutral-900 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_0_#171717] active:translate-y-0.5 transition-all ${
                totalMixedQuestions > 0
                  ? 'bg-amber-400 hover:bg-amber-500 text-neutral-900'
                  : 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
              }`}
            >
              <Play className="w-4 h-4 fill-neutral-900" />
              <span>
                {t(
                  `Launch Mixed Challenge (${totalMixedQuestions} Questions)`,
                  `ابدأ التحدي المختلط (${totalMixedQuestions} سؤال)`
                )}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
