import React, { useState, useEffect, useRef } from 'react';
import { MathProblem, QuizSessionSummary } from '../types';
import { calculateProblemReward } from '../utils/mathGenerator';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CHARACTERS, getPlayerPhotoUrl } from '../data/characters';
import { Clock, Flame, Check, X, CornerDownLeft, PauseCircle, Shield, Sparkles, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveQuizPlayerProps {
  problems: MathProblem[];
  categoryTitle: string;
  timeLimitTotalSeconds: number; // 0 = untimed
  onFinishQuiz: (session: QuizSessionSummary) => void;
  onExit: () => void;
}

const normalizeNumericInput = (raw: string): string => {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  let normalized = '';
  for (const ch of raw) {
    const idx = arabicDigits.indexOf(ch);
    if (idx !== -1) {
      normalized += String(idx);
    } else if (ch === ',' || ch === '،' || ch === '٫') {
      normalized += '.';
    } else {
      normalized += ch;
    }
  }
  return normalized.replace(/[^0-9.-]/g, '');
};

export const ActiveQuizPlayer: React.FC<ActiveQuizPlayerProps> = ({
  problems: initialProblems,
  categoryTitle,
  timeLimitTotalSeconds,
  onFinishQuiz,
  onExit
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const equippedHero = CHARACTERS.find((c) => c.id === user?.equippedCharacterId);
  const heroPower = equippedHero?.ballonDorPower;

  const [problems, setProblems] = useState<MathProblem[]>(initialProblems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [streak, setStreak] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; coinsWon: number; shielded?: boolean } | null>(null);

  // Timers & Time Freeze Power
  const [timeLeft, setTimeLeft] = useState(timeLimitTotalSeconds);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);
  const [freezeChargesLeft, setFreezeChargesLeft] = useState(heroPower?.chargesPerQuiz || 1);

  // Shield of Mercy Power (Converts errors into correct answers)
  const [shieldChargesLeft, setShieldChargesLeft] = useState(
    heroPower?.type === 'shield-mercy' ? heroPower.chargesPerQuiz || 1 : 0
  );

  // Radar Hint Power (Rodri)
  const [hintsLeft, setHintsLeft] = useState(heroPower?.type === 'hint-vision' ? 3 : 0);
  const [activeHintText, setActiveHintText] = useState('');

  const [powerAlertMsg, setPowerAlertMsg] = useState('');

  const questionStartTimeRef = useRef(Date.now());
  const sessionStartTimeRef = useRef(Date.now());
  const sessionCoinsRef = useRef(0);
  const problemsRef = useRef<MathProblem[]>(initialProblems);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const inputValRef = useRef('');
  inputValRef.current = inputVal;

  const currentProblem = problems[currentIndex];

  useEffect(() => {
    problemsRef.current = problems;
  }, [problems]);

  useEffect(() => {
    if (timeLimitTotalSeconds <= 0) return;

    const timer = setInterval(() => {
      if (isTimeFrozen) {
        setFreezeSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimeFrozen(false);
            sounds.playKeyClick();
            setPowerAlertMsg(t('Time freeze expired! Keep solving.', 'انتهى تجميد الوقت! واصل الحل.'));
            setTimeout(() => setPowerAlertMsg(''), 2500);
            return 0;
          }
          return prev - 1;
        });
        return;
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finalizeSession(problemsRef.current, sessionCoinsRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimitTotalSeconds, isTimeFrozen]);

  useEffect(() => {
    setInputVal('');
    inputValRef.current = '';
    setFeedback(null);
    setActiveHintText('');
    questionStartTimeRef.current = Date.now();
    isSubmittingRef.current = false;
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(focusTimer);
  }, [currentIndex]);

  const handleTriggerTimeFreeze = () => {
    if (freezeChargesLeft <= 0 || isTimeFrozen) return;
    sounds.playStreak();
    setFreezeChargesLeft((prev) => prev - 1);
    const duration = heroPower?.durationSeconds || 15;
    setIsTimeFrozen(true);
    setFreezeSecondsLeft(duration);
    setPowerAlertMsg(
      t(
        `❄️ Time Freeze Active! Exam timer paused for ${duration}s by ${equippedHero?.name}!`,
        `❄️ تجميد الوقت مفعّل! توقف المؤقت لمدة ${duration} ثانية بواسطة ${equippedHero?.name}!`
      )
    );
    setTimeout(() => setPowerAlertMsg(''), 3000);
  };

  const handleTriggerRadarHint = () => {
    if (hintsLeft <= 0) return;
    sounds.playUnlock();
    setHintsLeft((prev) => prev - 1);
    const ans = currentProblem.correctAnswer;
    const firstDigit = String(Math.abs(ans))[0];
    const hint = t(
      `📡 Tactical Radar: Answer starts with (${firstDigit}) and is between ${Math.floor(ans - 5)} and ${Math.ceil(ans + 5)}`,
      `📡 الرادار التكتيكي: الإجابة تبدأ بالرقم (${firstDigit}) وتقع بين ${Math.floor(ans - 5)} و ${Math.ceil(ans + 5)}`
    );
    setActiveHintText(hint);
  };

  // Physical keyboard fallback support (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (feedback !== null || isSubmittingRef.current) return;

      if ((e.key >= '0' && e.key <= '9') || e.key === '.' || e.key === ',' || e.key === '-') {
        sounds.playKeyClick();
        const char = e.key === ',' ? '.' : e.key;
        setInputVal((prev) => {
          if (char === '.' && prev.includes('.')) return prev;
          if (char === '.' && prev === '') return '0.';
          if (char === '-' && prev !== '') return prev;
          return prev.length < 14 ? prev + char : prev;
        });
        inputRef.current?.focus();
      } else if (e.key === 'Backspace') {
        sounds.playKeyClick();
        setInputVal((prev) => prev.slice(0, -1));
        inputRef.current?.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, currentIndex, shieldChargesLeft]);

  const handleSubmit = (overrideVal?: string) => {
    const activeVal = (overrideVal !== undefined ? overrideVal : inputValRef.current).trim();
    if (!activeVal || feedback !== null || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    const parsedAnswer = parseFloat(activeVal);
    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    let isCorrect = !isNaN(parsedAnswer) && Math.abs(parsedAnswer - currentProblem.correctAnswer) < 1e-6;
    let shieldUsed = false;

    if (!isCorrect && heroPower?.type === 'shield-mercy' && shieldChargesLeft > 0) {
      isCorrect = true;
      shieldUsed = true;
      setShieldChargesLeft((prev) => prev - 1);
      sounds.playStreak();
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#ffffff']
        });
      } catch {}
      setPowerAlertMsg(
        t(
          `🛡️ Shield of Mercy! Wrong answer converted to 100% correct by ${equippedHero?.name}! (${shieldChargesLeft - 1} remaining)`,
          `🛡️ درع الرحمة! تم تحويل الإجابة إلى صحيحة بواسطة ${equippedHero?.name}! (المتبقي ${shieldChargesLeft - 1})`
        )
      );
      setTimeout(() => setPowerAlertMsg(''), 3500);
    }

    let nextStreak = streak;
    if (isCorrect) {
      if (heroPower?.type === 'streak-surge') {
        const bonus = heroPower.streakBonus || 3;
        nextStreak = streak + bonus;
      } else {
        nextStreak = streak + 1;
      }
    } else {
      nextStreak = 0;
    }
    setStreak(nextStreak);

    const updatedProblem: MathProblem = {
      ...currentProblem,
      userAnswer: shieldUsed ? currentProblem.correctAnswer : parsedAnswer,
      isCorrect,
      timeTakenSeconds: timeTaken
    };

    const newProblems = [...problemsRef.current];
    newProblems[currentIndex] = updatedProblem;
    problemsRef.current = newProblems;
    setProblems(newProblems);

    const reward = calculateProblemReward(updatedProblem, timeTaken, streak);
    let coinsWon = reward.coins;

    if (coinsWon > 0) {
      if (heroPower?.type === 'double-coins') {
        coinsWon = Math.round(coinsWon * 2);
      } else if (heroPower?.type === 'samba-fever') {
        const mult = heroPower.multiplier || 1.5;
        coinsWon = Math.round(coinsWon * mult);
      }
    }

    if (isCorrect) {
      sounds.playCorrect();
      sounds.playCoin();
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        sounds.playStreak();
      }
      sessionCoinsRef.current += coinsWon;
      setSessionCoins(sessionCoinsRef.current);
    } else {
      sounds.playWrong();
    }

    setFeedback({ isCorrect, coinsWon, shielded: shieldUsed });

    setTimeout(() => {
      isSubmittingRef.current = false;
      if (currentIndex + 1 < problemsRef.current.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finalizeSession(problemsRef.current, sessionCoinsRef.current);
      }
    }, 700);
  };

  const finalizeSession = (finalProblems = problemsRef.current, finalCoins = sessionCoinsRef.current) => {
    const timeSpent = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const correctCount = finalProblems.filter((p) => p.isCorrect).length;
    const accuracy = Math.round((correctCount / finalProblems.length) * 100);

    const summary: QuizSessionSummary = {
      id: `session-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      categoryTitle,
      totalQuestions: finalProblems.length,
      correctAnswers: correctCount,
      accuracy,
      coinsEarned: finalCoins,
      timeSpentSeconds: timeSpent,
      averageTimePerQuestion: parseFloat((timeSpent / finalProblems.length).toFixed(1)),
      problems: finalProblems
    };

    onFinishQuiz(summary);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Ballon d'Or Super Power Banner (If Equipped) */}
      {heroPower && (
        <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border-2 border-neutral-900 rounded-2xl p-2.5 shadow-[0_3px_0_0_#171717] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl border border-neutral-900 overflow-hidden shrink-0 bg-neutral-900 shadow-xs">
              <img
                src={getPlayerPhotoUrl(equippedHero)}
                alt={equippedHero?.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/players/kane-9.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-neutral-900 bg-white/80 px-1.5 py-0.2 rounded">
                  {equippedHero?.name}
                </span>
                <span className="text-xs font-black text-neutral-950">{heroPower.name}</span>
              </div>
              <span className="text-[10px] font-bold text-neutral-800 hidden sm:inline">
                {heroPower.badge}
              </span>
            </div>
          </div>

          {heroPower.type === 'time-freeze' && (
            <button
              onClick={handleTriggerTimeFreeze}
              disabled={freezeChargesLeft <= 0 || isTimeFrozen}
              className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-neutral-900 cursor-pointer shadow-xs transition-all flex items-center gap-1 ${
                isTimeFrozen
                  ? 'bg-sky-400 text-neutral-900 animate-pulse'
                  : freezeChargesLeft > 0
                  ? 'bg-neutral-900 text-amber-300 hover:bg-neutral-800'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>
                {isTimeFrozen
                  ? t(`Freeze (${freezeSecondsLeft}s)`, `تجميد (${freezeSecondsLeft}ث)`)
                  : t(`Freeze Time (${freezeChargesLeft})`, `تجميد الوقت (${freezeChargesLeft})`)}
              </span>
            </button>
          )}

          {heroPower.type === 'shield-mercy' && (
            <div className="flex items-center gap-1 bg-neutral-900 text-emerald-400 border border-neutral-900 px-2.5 py-1 rounded-xl text-xs font-black">
              <Shield className="w-3.5 h-3.5 fill-emerald-400" />
              <span>
                {t(`Mercy Shield: ${shieldChargesLeft} left`, `درع الرحمة: متبقي ${shieldChargesLeft}`)}
              </span>
            </div>
          )}

          {heroPower.type === 'double-coins' && (
            <div className="flex items-center gap-1 bg-neutral-900 text-amber-300 border border-neutral-900 px-2.5 py-1 rounded-xl text-xs font-black animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
              <span>{t('2X Coins Boost Active!', 'مضاعفة العملات 2X مفعّلة!')}</span>
            </div>
          )}

          {heroPower.type === 'hint-vision' && (
            <button
              onClick={handleTriggerRadarHint}
              disabled={hintsLeft <= 0}
              className="px-2.5 py-1 bg-neutral-900 text-indigo-300 hover:bg-neutral-800 border-2 border-neutral-900 rounded-xl text-xs font-black cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t(`Solution Radar (${hintsLeft})`, `رادار الحل (${hintsLeft})`)}</span>
            </button>
          )}
        </div>
      )}

      {powerAlertMsg && (
        <div className="p-2.5 bg-neutral-900 text-amber-300 border-2 border-amber-400 rounded-xl text-center text-xs font-black animate-bounce shadow-md">
          {powerAlertMsg}
        </div>
      )}

      {/* Top Status Bar: Progress, Timer, Streak, Coins */}
      <div className="bg-white border-2 border-neutral-900 rounded-2xl p-3 sm:p-4 shadow-[0_5px_0_0_#171717] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playKeyClick();
              if (window.confirm(t('Do you want to exit the current math match?', 'هل تريد الخروج من التحدي الحالي؟'))) {
                onExit();
              }
            }}
            className="px-2.5 py-1 text-xs font-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-900 rounded-xl cursor-pointer"
          >
            ✕ {t('Exit', 'خروج')}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="font-mono text-xs sm:text-sm font-black text-neutral-800" dir="ltr">
              {t('Q', 'س')} {currentIndex + 1} / {problems.length}
            </div>
            {(() => {
              const estBase = calculateProblemReward({ ...currentProblem, isCorrect: true }, 2, streak).coins;
              const estTotal =
                estBase === 0
                  ? 0
                  : Math.round(
                      estBase * (heroPower?.type === 'double-coins' ? 2 : heroPower?.type === 'samba-fever' ? heroPower.multiplier || 1.5 : 1)
                    );
              return (
                <span
                  className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-lg flex items-center gap-1 border ${
                    estTotal === 0
                      ? 'text-neutral-700 bg-neutral-100 border-neutral-300'
                      : 'text-amber-800 bg-amber-100 border-amber-300'
                  }`}
                  title={t('Estimated coin reward for this question', 'المكافأة المتوقعة لهذا السؤال')}
                >
                  <span>{estTotal === 0 ? t('Practice:', 'تدريب:') : t('Reward:', 'المكافأة:')}</span>
                  <span className="text-neutral-950 font-black" dir="ltr">
                    {estTotal === 0 ? '0 🪙' : `+${estTotal} 🪙`}
                  </span>
                </span>
              );
            })()}
          </div>
        </div>

        {timeLimitTotalSeconds > 0 && (
          <div
            className={`flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl border-2 ${
              isTimeFrozen
                ? 'bg-sky-200 text-sky-950 border-sky-600 animate-pulse'
                : timeLeft <= 10
                ? 'bg-rose-100 text-rose-700 border-rose-500 animate-pulse'
                : 'bg-neutral-100 text-neutral-900 border-neutral-900'
            }`}
            dir="ltr"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isTimeFrozen
                ? `❄️ ${freezeSecondsLeft}s`
                : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2" dir="ltr">
          {streak > 1 && (
            <div className="flex items-center gap-1 bg-rose-100 border border-rose-400 text-rose-700 px-2 py-0.5 rounded-xl text-xs font-black animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-rose-500" />
              <span>{streak}x</span>
            </div>
          )}
          <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm bg-amber-100 border border-neutral-900 px-2.5 py-1 rounded-xl">
            <span>🪙</span>
            <span>+{sessionCoins}</span>
          </div>
        </div>
      </div>

      {activeHintText && (
        <div className="p-2 bg-indigo-50 border-2 border-indigo-300 rounded-xl text-center text-xs font-black text-indigo-950 animate-in fade-in duration-150">
          {activeHintText}
        </div>
      )}

      {/* Math Card Display Area (Direct Phone/Desktop Keyboard Input Only — No On-Screen Keypad) */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative bg-white border-3 border-neutral-900 rounded-3xl p-5 sm:p-8 shadow-[0_10px_0_0_#171717] min-h-[280px] sm:min-h-[320px] flex flex-col justify-center items-center cursor-text"
      >
        {feedback && (
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-xl border-2 border-neutral-900 font-black text-xs flex items-center gap-1 shadow-md animate-in zoom-in duration-150 ${
              feedback.isCorrect ? 'bg-emerald-300 text-emerald-950' : 'bg-rose-300 text-rose-950'
            }`}
          >
            {feedback.isCorrect ? (
              <>
                <Check className="w-4 h-4 text-emerald-900 stroke-[3]" />
                <span>
                  {feedback.shielded
                    ? t('🛡️ SHIELDED! CORRECT!', '🛡️ محمي! إجابة صحيحة!')
                    : t('CORRECT!', 'إجابة صحيحة!')}{' '}
                  +{feedback.coinsWon} 🪙
                </span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-rose-900 stroke-[3]" />
                <span>
                  {t('INCORRECT (Answer:', 'خطأ (الإجابة:')} {currentProblem.correctAnswer})
                </span>
              </>
            )}
          </div>
        )}

        {/* 1. Addition & Subtraction Soroban Mental Math Vertical Style */}
        {currentProblem.type === 'add-sub' && currentProblem.terms && (
          <div className="flex flex-col items-end my-2" dir="ltr">
            <div className="space-y-1.5 pr-2">
              {currentProblem.terms.map((term, tIdx) => {
                const isSubtracted = term < 0;
                return (
                  <div
                    key={tIdx}
                    className="flex items-center justify-end gap-3 font-mono text-3xl sm:text-4xl font-black text-neutral-900 tracking-wider"
                  >
                    <span className="w-6 text-center text-rose-600 font-black text-3xl">
                      {isSubtracted ? '−' : ''}
                    </span>
                    <span className={isSubtracted ? 'text-rose-600' : 'text-neutral-900'}>
                      {Math.abs(term)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="w-52 sm:w-64 h-1 bg-neutral-900 my-3 rounded-full" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="w-52 sm:w-64 space-y-3"
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                value={inputVal}
                onChange={(e) => {
                  if (feedback !== null || isSubmittingRef.current) return;
                  const filtered = normalizeNumericInput(e.target.value);
                  setInputVal(filtered);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={t('Type answer & Enter', 'اكتب الإجابة واضغط Enter')}
                disabled={feedback !== null}
                className="w-full h-14 sm:h-16 bg-neutral-50 border-3 border-neutral-900 rounded-2xl text-right px-4 font-mono text-3xl font-black text-neutral-900 shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-400 focus:bg-amber-50/50 transition-all placeholder:text-neutral-400 placeholder:text-xs sm:placeholder:text-sm"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || feedback !== null}
                className={`w-full py-3 border-2 border-neutral-900 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_3px_0_0_#171717] active:translate-y-0.5 transition-all ${
                  !inputVal.trim()
                    ? 'bg-neutral-200 text-neutral-400 border-neutral-400 shadow-none cursor-not-allowed'
                    : 'bg-emerald-400 hover:bg-emerald-500 text-neutral-900'
                }`}
              >
                <span>{t('Submit Answer', 'إرسال الإجابة')}</span>
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* 2. Multiplication & Division Horizontal Style */}
        {(currentProblem.type === 'multiplication' || currentProblem.type === 'division') && (
          <div className="flex flex-col items-center my-4 space-y-5 w-full" dir="ltr">
            <div className="flex items-center justify-center gap-3 font-mono text-3xl sm:text-4xl font-black text-neutral-900 flex-wrap">
              <span>{currentProblem.numA}</span>
              <span className="text-amber-500 text-4xl">{currentProblem.symbol}</span>
              <span>{currentProblem.numB}</span>
              <span className="text-neutral-400">=</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="w-56 sm:w-64 space-y-3"
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                value={inputVal}
                onChange={(e) => {
                  if (feedback !== null || isSubmittingRef.current) return;
                  const filtered = normalizeNumericInput(e.target.value);
                  setInputVal(filtered);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={t('Type answer & Enter', 'اكتب الإجابة واضغط Enter')}
                disabled={feedback !== null}
                className="w-full h-14 sm:h-16 bg-neutral-50 border-3 border-neutral-900 rounded-2xl text-center px-4 font-mono text-3xl font-black text-neutral-900 shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-400 focus:bg-amber-50/50 transition-all placeholder:text-neutral-400 placeholder:text-xs sm:placeholder:text-sm"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || feedback !== null}
                className={`w-full py-3 border-2 border-neutral-900 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_3px_0_0_#171717] active:translate-y-0.5 transition-all ${
                  !inputVal.trim()
                    ? 'bg-neutral-200 text-neutral-400 border-neutral-400 shadow-none cursor-not-allowed'
                    : 'bg-emerald-400 hover:bg-emerald-500 text-neutral-900'
                }`}
              >
                <span>{t('Submit Answer', 'إرسال الإجابة')}</span>
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
