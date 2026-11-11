import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const equippedHero = CHARACTERS.find((c) => c.id === user?.equippedCharacterId) || CHARACTERS[0];
  const heroPower = equippedHero?.ballonDorPower;

  // Simulator state
  const [simType, setSimType] = useState<'add-sub' | 'multiplication' | 'division'>('add-sub');
  const [simDigits, setSimDigits] = useState<number>(2);
  const [simDigits2, setSimDigits2] = useState<number>(1);
  const [simTerms, setSimTerms] = useState<number>(3);
  const [simFormulaMode, setSimFormulaMode] = useState<'simple' | 'friends-5' | 'friends-10'>('simple');
  const [simSpeed, setSimSpeed] = useState<'flash' | 'fast' | 'normal'>('fast');
  const [simStreak, setSimStreak] = useState<number>(3);

  // Calibrated coin computation matching mathGenerator.ts
  let baseCoins = 2;
  if (simType === 'add-sub') {
    baseCoins = 2 + Math.min(2, simDigits - 1);
    if (simFormulaMode === 'friends-10') baseCoins += 1;
    else if (simFormulaMode === 'friends-5') baseCoins += 1;
  } else if (simType === 'multiplication') {
    baseCoins = 3 + Math.min(2, simDigits + simDigits2 - 2);
  } else if (simType === 'division') {
    baseCoins = 3 + Math.min(2, simDigits - 2);
  }

  const speedBonus = simSpeed === 'flash' ? 2 : simSpeed === 'fast' ? 1 : 0;
  const streakBonus = Math.min(3, Math.floor(simStreak / 3));
  const subTotal = baseCoins + speedBonus + streakBonus;

  // Hero multiplier
  let heroMultiplier = 1;
  let heroMultiplierName = '';
  if (heroPower?.type === 'double-coins') {
    heroMultiplier = 2;
    heroMultiplierName = 'Lionel Messi 2X Golden Touch';
  } else if (heroPower?.type === 'samba-fever') {
    heroMultiplier = 1.5;
    heroMultiplierName = `Samba Fever (${heroPower.name})`;
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
          questionCount: 10,
          timeLimitSeconds: 30
        },
        `Addition & Subtraction (${simDigits} Digits • ${
          simFormulaMode === 'friends-5'
            ? 'Formulas of 5'
            : simFormulaMode === 'friends-10'
            ? 'Formulas of 10'
            : 'Simple'
        })`
      );
    } else if (simType === 'multiplication') {
      onStartQuizFromGuide(
        'multiplication',
        {
          digits1: simDigits,
          digits2: simDigits2,
          questionCount: 10,
          timeLimitSeconds: 30
        },
        `Multiplication (${simDigits}×${simDigits2} Digits)`
      );
    } else {
      onStartQuizFromGuide(
        'division',
        {
          dividendDigits: Math.max(2, simDigits),
          divisorDigits: 1,
          questionCount: 10,
          timeLimitSeconds: 30
        },
        `Division (${simDigits} Digits)`
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
              <span>Smart Rewards & Fair Calibration Guide</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
              How Are Points & Coins Awarded?
            </h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-800 mt-1 max-w-xl">
              Coins are strictly calibrated so every problem counts! Consistent daily practice, speed, and clean streaks unlock Ballon d'Or legends in your locker.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-xs border-2 border-neutral-900 rounded-2xl p-3 shadow-[0_3px_0_0_#171717] flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl border border-neutral-900 overflow-hidden bg-neutral-900 shrink-0">
              <img
                src={getPlayerPhotoUrl(equippedHero)}
                alt={equippedHero.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-neutral-500 block">Equipped Champion</span>
              <span className="text-xs font-black text-neutral-900 block">{equippedHero.name}</span>
              {heroPower ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 inline-block mt-0.5">
                  {heroPower.name}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-600">Standard Tier</span>
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
              Instant Question Reward Calculator
            </h2>
            <span className="text-xs font-bold text-neutral-500">
              Test any setup to preview exact coins earned per correct answer before starting a quiz.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form (Left / 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Operation Type Selector */}
            <div>
              <label className="text-xs font-black uppercase text-neutral-600 block mb-1.5">
                Operation Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'add-sub', label: 'Addition & Subtraction' },
                  { id: 'multiplication', label: 'Multiplication' },
                  { id: 'division', label: 'Division' }
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
                      Digits Per Number
                    </label>
                    <select
                      value={simDigits}
                      onChange={(e) => setSimDigits(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={1}>1 Digit (Units 1-9)</option>
                      <option value={2}>2 Digits (Tens 10-99)</option>
                      <option value={3}>3 Digits (Hundreds 100-999)</option>
                      <option value={4}>4 Digits (Thousands 1000+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      Rows / Terms Count
                    </label>
                    <select
                      value={simTerms}
                      onChange={(e) => setSimTerms(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={2}>2 Numbers</option>
                      <option value={3}>3 Sequential Numbers</option>
                      <option value={4}>4 Sequential Numbers</option>
                      <option value={5}>5 Numbers (Mental Stream)</option>
                      <option value={8}>8 Numbers (Pro Marathon)</option>
                    </select>
                  </div>

                  {/* Formula Mode */}
                  <div className="col-span-2 pt-1">
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      Formula Rule (Complements)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'simple', label: 'Simple / Direct', sub: 'No Complements' },
                        { id: 'friends-5', label: 'Formulas of 5', sub: 'Small Friends' },
                        { id: 'friends-10', label: 'Formulas of 10', sub: 'Big Friends' }
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
                      1st Number Digits
                    </label>
                    <select
                      value={simDigits}
                      onChange={(e) => setSimDigits(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={1}>1 Digit</option>
                      <option value={2}>2 Digits</option>
                      <option value={3}>3 Digits</option>
                      <option value={4}>4 Digits</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      2nd Number Digits
                    </label>
                    <select
                      value={simDigits2}
                      onChange={(e) => setSimDigits2(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={1}>× 1 Digit</option>
                      <option value={2}>× 2 Digits</option>
                      <option value={3}>× 3 Digits</option>
                    </select>
                  </div>
                </>
              )}

              {simType === 'division' && (
                <>
                  <div className="col-span-2">
                    <label className="text-xs font-black text-neutral-700 block mb-1">
                      Dividend Digits (Whole Result)
                    </label>
                    <select
                      value={simDigits}
                      onChange={(e) => setSimDigits(Number(e.target.value))}
                      className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                    >
                      <option value={2}>2 Digits (e.g. 84 ÷ 4)</option>
                      <option value={3}>3 Digits (e.g. 576 ÷ 6)</option>
                      <option value={4}>4 Digits (e.g. 3450 ÷ 5)</option>
                      <option value={5}>5 Digits (Advanced Division)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Speed & Streak Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-black text-neutral-700 block mb-1">
                  Answer Speed
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'flash', label: '⚡ < 2s (+2)' },
                    { id: 'fast', label: '⏱️ 2-4s (+1)' },
                    { id: 'normal', label: 'Normal (+0)' }
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
                  Consecutive Streak
                </label>
                <select
                  value={simStreak}
                  onChange={(e) => setSimStreak(Number(e.target.value))}
                  className="w-full bg-neutral-50 border-2 border-neutral-900 rounded-xl px-3 py-2 text-xs font-black text-neutral-900 cursor-pointer"
                >
                  <option value={0}>No Streak (0)</option>
                  <option value={3}>🔥 3 In-a-row (+1 coin)</option>
                  <option value={6}>🔥 6 In-a-row (+2 coins)</option>
                  <option value={9}>🔥 9+ In-a-row (+3 max coins)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary Box (Right / 5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900 text-white rounded-2xl p-5 border-2 border-neutral-900 shadow-[0_4px_0_0_#000000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <span className="text-xs font-bold text-neutral-400">Reward Breakdown:</span>
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                  Calibrated Rate
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Base Operation Coins:</span>
                  <span className="font-mono font-bold text-white">+{baseCoins} 🪙</span>
                </div>
                {speedBonus > 0 && (
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Speed Lightning Bonus:</span>
                    <span className="font-mono font-bold text-amber-400">+{speedBonus} 🪙</span>
                  </div>
                )}
                {streakBonus > 0 && (
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Streak Fire Bonus:</span>
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
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-800">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs font-bold text-neutral-400">Total Per Question:</span>
                <div className="flex items-center gap-1.5">
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
                <span>Launch This Quiz Level Now!</span>
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
            <h3 className="text-base font-black text-neutral-900">Addition & Subtraction</h3>
            <p className="text-xs font-medium text-neutral-600 mt-1">
              Soroban-style flash mental math with 3 distinct formula complement modes.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">1 Digit (Simple):</span>
                <span className="font-mono font-black text-neutral-900">2 - 3 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">2-3 Digits (Tens/Hundreds):</span>
                <span className="font-mono font-black text-neutral-900">3 - 5 🪙</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-300 flex justify-between">
                <span className="font-bold text-amber-900">Formulas of 5 & 10:</span>
                <span className="font-mono font-black text-amber-700">+1 🪙 Bonus</span>
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
            <h3 className="text-base font-black text-neutral-900">Multiplication Sprint</h3>
            <p className="text-xs font-medium text-neutral-600 mt-1">
              Rapid whole-number multiplication from single tables to multi-digit products.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">1×1 Digit (Times Tables):</span>
                <span className="font-mono font-black text-neutral-900">3 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">2×1 Digits (e.g. 47 × 6):</span>
                <span className="font-mono font-black text-neutral-900">4 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">2×2 / 3×2 Digits:</span>
                <span className="font-mono font-black text-neutral-900">5 - 6 🪙</span>
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
            <h3 className="text-base font-black text-neutral-900">Clean Division Split</h3>
            <p className="text-xs font-medium text-neutral-600 mt-1">
              Exact integer divisions without remainders for mental factorizing.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">2 Digits ÷ 1 Digit:</span>
                <span className="font-mono font-black text-neutral-900">3 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">3 Digits ÷ 1 Digit:</span>
                <span className="font-mono font-black text-neutral-900">4 🪙</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between">
                <span className="font-bold text-neutral-700">4+ Digits ÷ 1-2 Digits:</span>
                <span className="font-mono font-black text-neutral-900">5 - 6 🪙</span>
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
              Ballon d'Or Legends & Special Perks
            </h3>
            <span className="text-xs font-bold text-neutral-500">
              Equipping prestigious Ballon d'Or winners in your locker activates passive training perks.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">Lionel Messi (2X Golden Touch)</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Permanently doubles all coins earned from problems and speed bonuses!
              </p>
            </div>
          </div>

          <div className="p-3 bg-pink-50 border-2 border-pink-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">Ronaldinho, Ronaldo R9 & Kaká</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Samba Fever grants a 1.5X multiplier on every correct calculation!
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">Cristiano Ronaldo & Cannavaro</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Iron Will shield protects you from wrong answers and awards the coins anyway!
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">Rodri Hernández (2024 Winner)</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Tactical Radar gives smart step hints on challenging mental operations.
              </p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border-2 border-indigo-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">⏸️</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">Modrić, Benzema & Zidane</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Chrono Freeze pauses the countdown timer so you can calculate with total focus.
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h4 className="font-black text-xs text-neutral-900">Streak Multiplier Bonus</h4>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Every 3 consecutive correct answers gives +1 bonus coin per problem (up to +3).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
