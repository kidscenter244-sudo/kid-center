import {
  MathProblem,
  AddSubSettings,
  MultiplicationSettings,
  DivisionSettings,
  MixedSettings
} from '../types';

function roundTo(val: number, places: number): number {
  return Number(val.toFixed(places));
}

function getRandomIntWithDigits(digits: number): number {
  if (digits <= 1) {
    return Math.floor(Math.random() * 9) + 1; // 1-9
  }
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomNonZeroEndingInt(digits: number): number {
  const n = getRandomIntWithDigits(digits);
  if (n % 10 === 0) {
    return n + (Math.floor(Math.random() * 9) + 1);
  }
  return n;
}

function isDirectAdd(currentDigit: number, addDigit: number): boolean {
  if (addDigit < 0 || addDigit > 9) return false;
  const lowerBeads = currentDigit % 5;
  const upperBead = currentDigit >= 5 ? 1 : 0;
  if (addDigit < 5) {
    return lowerBeads + addDigit <= 4;
  }
  return upperBead === 0 && lowerBeads + (addDigit - 5) <= 4;
}

function isDirectSub(currentDigit: number, subDigit: number): boolean {
  if (subDigit < 0 || subDigit > 9) return false;
  const lowerBeads = currentDigit % 5;
  const upperBead = currentDigit >= 5 ? 1 : 0;
  if (subDigit < 5) {
    return lowerBeads >= subDigit;
  }
  return upperBead === 1 && lowerBeads >= subDigit - 5;
}

function isFriend5Add(currentDigit: number, addDigit: number): boolean {
  if (currentDigit >= 5) return false; // upper bead already active
  const lowerBeads = currentDigit % 5;
  if (addDigit === 4 && lowerBeads >= 1 && currentDigit + 4 <= 9) return true; // +4 = +5 - 1
  if (addDigit === 3 && lowerBeads >= 2 && currentDigit + 3 <= 9) return true; // +3 = +5 - 2
  if (addDigit === 2 && lowerBeads >= 3 && currentDigit + 2 <= 9) return true; // +2 = +5 - 3
  if (addDigit === 1 && lowerBeads === 4 && currentDigit + 1 <= 9) return true; // +1 = +5 - 4
  return false;
}

function isFriend5Sub(currentDigit: number, subDigit: number): boolean {
  if (currentDigit < 5) return false; // upper bead not active
  const lowerBeads = currentDigit % 5;
  if (subDigit === 4 && lowerBeads < 4 && currentDigit - 4 >= 0) return true; // -4 = -5 + 1
  if (subDigit === 3 && lowerBeads < 3 && currentDigit - 3 >= 0) return true; // -3 = -5 + 2
  if (subDigit === 2 && lowerBeads < 2 && currentDigit - 2 >= 0) return true; // -2 = -5 + 3
  if (subDigit === 1 && lowerBeads === 0 && currentDigit - 1 >= 0) return true; // -1 = -5 + 4
  return false;
}

function getDigitArray(num: number, len: number): number[] {
  const str = Math.abs(num).toString().padStart(len, '0');
  return str.split('').map(Number);
}

export function generateAddSubProblem(settings: AddSubSettings, index: number): MathProblem {
  const count = Math.max(2, settings.numbersCount || 3);
  const hasDecimals = Boolean(settings.hasDecimals);
  const dp = hasDecimals ? Math.max(1, Math.min(3, settings.decimalPlaces || 1)) : 0;
  const scale = Math.pow(10, dp);

  const wholeDigits = Math.max(1, settings.digitsCount || 1);
  const digits = wholeDigits + dp;
  const formulaMode = settings.formulaMode || 'simple';

  const terms: number[] = [];
  let currentSum = 0;

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      let firstNum = 0;
      for (let p = 0; p < digits; p++) {
        let d = 0;
        if (formulaMode === 'friends-5') {
          d = Math.floor(Math.random() * 4) + 1;
        } else {
          d = Math.floor(Math.random() * 9) + 1;
        }
        firstNum = firstNum * 10 + d;
      }
      terms.push(firstNum);
      currentSum = firstNum;
      continue;
    }

    const curDigits = getDigitArray(currentSum, digits);
    const allowSubtract = currentSum >= Math.pow(10, digits - 1);
    const preferSubtract = allowSubtract && Math.random() < 0.45;

    let foundTerm: number | null = null;

    if (formulaMode === 'simple') {
      const dirs = preferSubtract ? ['sub', 'add'] : ['add', 'sub'];
      for (const dir of dirs) {
        if (dir === 'sub' && !allowSubtract) continue;
        const candidateDigits: number[] = [];
        let possible = true;
        for (let p = 0; p < digits; p++) {
          const cd = curDigits[p];
          const valid: number[] = [];
          const minDigit = p === 0 || (hasDecimals && p === digits - 1) ? 1 : 0;
          for (let d = minDigit; d <= 9; d++) {
            if (dir === 'add' && isDirectAdd(cd, d)) valid.push(d);
            if (dir === 'sub' && isDirectSub(cd, d)) valid.push(d);
          }
          if (valid.length === 0) {
            possible = false;
            break;
          }
          candidateDigits.push(valid[Math.floor(Math.random() * valid.length)]);
        }
        if (possible) {
          const val = candidateDigits.reduce((acc, d) => acc * 10 + d, 0);
          if (val > 0) {
            foundTerm = dir === 'sub' ? -val : val;
            break;
          }
        }
      }
    } else if (formulaMode === 'friends-5') {
      const dirs = preferSubtract ? ['sub', 'add'] : ['add', 'sub'];
      for (const dir of dirs) {
        if (dir === 'sub' && !allowSubtract) continue;
        const candidateDigits: number[] = [];
        let hasFriend = false;
        let possible = true;
        for (let p = 0; p < digits; p++) {
          const cd = curDigits[p];
          const friendValids: number[] = [];
          const directValids: number[] = [];
          const minDigit = p === 0 || (hasDecimals && p === digits - 1) ? 1 : 0;
          for (let d = minDigit; d <= 9; d++) {
            if (dir === 'add') {
              if (isFriend5Add(cd, d)) friendValids.push(d);
              else if (isDirectAdd(cd, d)) directValids.push(d);
            } else {
              if (isFriend5Sub(cd, d)) friendValids.push(d);
              else if (isDirectSub(cd, d)) directValids.push(d);
            }
          }
          if (friendValids.length > 0) {
            candidateDigits.push(friendValids[Math.floor(Math.random() * friendValids.length)]);
            hasFriend = true;
          } else if (directValids.length > 0) {
            candidateDigits.push(directValids[Math.floor(Math.random() * directValids.length)]);
          } else {
            possible = false;
            break;
          }
        }
        if (possible && hasFriend) {
          const val = candidateDigits.reduce((acc, d) => acc * 10 + d, 0);
          if (val > 0) {
            foundTerm = dir === 'sub' ? -val : val;
            break;
          }
        }
      }
    } else {
      const bigFriends = [9, 8, 7, 6, 5];
      let val = 0;
      for (let p = 0; p < digits; p++) {
        const d = bigFriends[Math.floor(Math.random() * bigFriends.length)];
        val = val * 10 + d;
      }
      const canSub = currentSum >= val;
      foundTerm = canSub && Math.random() < 0.4 ? -val : val;
    }

    if (foundTerm !== null) {
      terms.push(foundTerm);
      currentSum += foundTerm;
    } else {
      const step = Math.pow(10, digits - 1) + (hasDecimals ? 1 : 0);
      if (currentSum >= 5 * step) {
        terms.push(-step);
        currentSum -= step;
      } else {
        terms.push(step);
        currentSum += step;
      }
    }
  }

  const finalTerms = hasDecimals ? terms.map((t) => roundTo(t / scale, dp)) : terms;
  const finalAnswer = hasDecimals ? roundTo(currentSum / scale, dp) : currentSum;

  return {
    id: `addsub-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'add-sub',
    terms: finalTerms,
    correctAnswer: finalAnswer,
    hasDecimals,
    decimalPlaces: dp,
    formulaMode,
    digitsCount: wholeDigits
  };
}

export function generateMultiplicationProblem(settings: MultiplicationSettings, index: number): MathProblem {
  const digits1 = Math.max(1, settings.digits1 || 2);
  const digits2 = Math.max(1, settings.digits2 || 1);
  const hasDecimals = Boolean(settings.hasDecimals);
  const dp = hasDecimals ? Math.max(1, Math.min(3, settings.decimalPlaces || 1)) : 0;

  if (hasDecimals) {
    const scale = Math.pow(10, dp);
    // Ensure BOTH numbers have a decimal point with `dp` decimal digits
    const totalDigits1 = Math.max(digits1 + dp, dp + 1);
    const totalDigits2 = Math.max(digits2 + dp, dp + 1);
    const intA = getRandomNonZeroEndingInt(totalDigits1);
    const intB = getRandomNonZeroEndingInt(totalDigits2);
    const numA = roundTo(intA / scale, dp);
    const numB = roundTo(intB / scale, dp);
    const answer = roundTo(numA * numB, dp * 2);

    return {
      id: `mult-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'multiplication',
      numA,
      numB,
      symbol: '×',
      correctAnswer: answer,
      hasDecimals: true,
      decimalPlaces: dp,
      digits1,
      digits2
    };
  }

  const numA = getRandomIntWithDigits(digits1);
  const numB = getRandomIntWithDigits(digits2);
  const answer = numA * numB;

  return {
    id: `mult-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'multiplication',
    numA,
    numB,
    symbol: '×',
    correctAnswer: answer,
    hasDecimals: false,
    decimalPlaces: 0,
    digits1,
    digits2
  };
}

export function generateDivisionProblem(settings: DivisionSettings, index: number): MathProblem {
  const dividendDigits = Math.max(2, settings.dividendDigits || 3);
  const divisorDigits = Math.max(1, Math.min(dividendDigits - 1, settings.divisorDigits || 1));
  const hasDecimals = Boolean(settings.hasDecimals);
  const dp = hasDecimals ? Math.max(1, Math.min(3, settings.decimalPlaces || 1)) : 0;

  if (hasDecimals) {
    const scale = Math.pow(10, dp);
    const quotientDigits = Math.max(1, dividendDigits - divisorDigits);

    // Guarantee BOTH dividend (numA) AND divisor (numB) have a decimal point,
    // and quotient is clean & exact (no infinite repeating decimals).
    let divisor = 1.2;
    let quotient = 2.5;
    let dividend = 3.0;

    for (let attempt = 0; attempt < 30; attempt++) {
      const divTotalDigits = Math.max(divisorDigits + dp, dp + 1);
      const divisorInt = getRandomNonZeroEndingInt(divTotalDigits);
      const candDivisor = roundTo(divisorInt / scale, dp);

      // Alternate between clean decimal quotients and integer quotients
      const useDecimalQuotient = attempt % 2 === 0;
      const candQuotient = useDecimalQuotient
        ? roundTo(getRandomNonZeroEndingInt(Math.max(quotientDigits + dp, dp + 1)) / scale, dp)
        : getRandomIntWithDigits(quotientDigits);

      const candDividend = roundTo(candDivisor * candQuotient, dp * 2);

      if (!Number.isInteger(candDivisor) && !Number.isInteger(candDividend)) {
        divisor = candDivisor;
        quotient = candQuotient;
        dividend = candDividend;
        break;
      }
    }

    // Final safety guarantee so both numbers always have a decimal point
    if (Number.isInteger(dividend) || Number.isInteger(divisor)) {
      const fallbackDivisor = roundTo((Math.pow(10, dp) + 3) / scale, dp); // e.g. 1.3 or 1.03
      const fallbackQuotient = roundTo((Math.pow(10, dp) * 2 + 7) / scale, dp); // e.g. 2.7 or 2.07
      divisor = fallbackDivisor;
      quotient = fallbackQuotient;
      dividend = roundTo(divisor * quotient, dp * 2);
    }

    return {
      id: `div-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'division',
      numA: dividend,
      numB: divisor,
      symbol: '÷',
      correctAnswer: quotient,
      hasDecimals: true,
      decimalPlaces: dp,
      dividendDigits,
      divisorDigits
    };
  }

  // Clean exact integer division: dividend = divisor * quotient
  const divisor = getRandomIntWithDigits(divisorDigits);
  const quotientDigits = Math.max(1, dividendDigits - divisorDigits);
  const quotient = getRandomIntWithDigits(quotientDigits);
  const dividend = divisor * quotient;

  return {
    id: `div-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'division',
    numA: dividend,
    numB: divisor,
    symbol: '÷',
    correctAnswer: quotient,
    hasDecimals: false,
    decimalPlaces: 0,
    dividendDigits,
    divisorDigits
  };
}

export function generateQuizProblems(
  type: 'add-sub' | 'multiplication' | 'division' | 'mixed',
  settings: AddSubSettings | MultiplicationSettings | DivisionSettings | MixedSettings
): MathProblem[] {
  const problems: MathProblem[] = [];

  if (type === 'add-sub') {
    const s = settings as AddSubSettings;
    const count = Math.max(1, s.questionCount || 10);
    for (let i = 0; i < count; i++) {
      problems.push(generateAddSubProblem(s, i));
    }
  } else if (type === 'multiplication') {
    const s = settings as MultiplicationSettings;
    const count = Math.max(1, s.questionCount || 10);
    for (let i = 0; i < count; i++) {
      problems.push(generateMultiplicationProblem(s, i));
    }
  } else if (type === 'division') {
    const s = settings as DivisionSettings;
    const count = Math.max(1, s.questionCount || 10);
    for (let i = 0; i < count; i++) {
      problems.push(generateDivisionProblem(s, i));
    }
  } else if (type === 'mixed') {
    const s = settings as MixedSettings;

    if (s.includeAddSub && s.addSubCount > 0) {
      for (let i = 0; i < s.addSubCount; i++) {
        problems.push(
          generateAddSubProblem(
            {
              numbersCount: s.addSubNumbers,
              digitsCount: s.addSubDigits,
              formulaMode: s.addSubFormulaMode || 'simple',
              hasDecimals: s.addSubHasDecimals,
              decimalPlaces: s.addSubDecimalPlaces,
              questionCount: s.addSubCount,
              timeLimitSeconds: s.timeLimitSeconds
            },
            problems.length
          )
        );
      }
    }

    if (s.includeMultiplication && s.multCount > 0) {
      for (let i = 0; i < s.multCount; i++) {
        problems.push(
          generateMultiplicationProblem(
            {
              digits1: s.multDigits1,
              digits2: s.multDigits2,
              hasDecimals: s.multHasDecimals,
              decimalPlaces: s.multDecimalPlaces,
              questionCount: s.multCount,
              timeLimitSeconds: s.timeLimitSeconds
            },
            problems.length
          )
        );
      }
    }

    if (s.includeDivision && s.divCount > 0) {
      for (let i = 0; i < s.divCount; i++) {
        problems.push(
          generateDivisionProblem(
            {
              dividendDigits: s.divDividendDigits,
              divisorDigits: s.divDivisorDigits,
              hasDecimals: s.divHasDecimals,
              decimalPlaces: s.divDecimalPlaces,
              questionCount: s.divCount,
              timeLimitSeconds: s.timeLimitSeconds
            },
            problems.length
          )
        );
      }
    }

    // Shuffle mixed questions
    for (let i = problems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [problems[i], problems[j]] = [problems[j], problems[i]];
    }
  }

  return problems;
}

export function isZeroCoinPracticeProblem(problem: Pick<MathProblem, 'type' | 'hasDecimals' | 'formulaMode' | 'digitsCount' | 'digits1' | 'digits2' | 'terms' | 'numA' | 'numB'>): boolean {
  if (problem.hasDecimals) return false;

  if (problem.type === 'add-sub') {
    const maxVal = Math.max(1, ...(problem.terms?.map((t) => Math.abs(t)) || [1]));
    const inferredDigits = Math.max(1, Math.floor(Math.log10(Math.max(1, maxVal))) + 1);
    const digits = problem.digitsCount ?? inferredDigits;
    const mode = problem.formulaMode || 'simple';
    return digits === 1 && (mode === 'simple' || mode === 'friends-5');
  }

  if (problem.type === 'multiplication') {
    const d1 = problem.digits1 ?? (problem.numA ? Math.floor(Math.log10(Math.max(1, Math.abs(problem.numA)))) + 1 : 2);
    const d2 = problem.digits2 ?? (problem.numB ? Math.floor(Math.log10(Math.max(1, Math.abs(problem.numB)))) + 1 : 1);
    return d1 === 1 && d2 === 1;
  }

  return false;
}

/**
 * Calibrated coin rewards:
 * - Add/Sub 1-digit Simple & Friends-5 (no decimals) -> 0 coins (Practice Mode)
 * - Multiplication 1x1 (no decimals) -> 0 coins (Practice Mode)
 * - All other modes -> Base (2-3) + Difficulty + Speed (+1/+2) + Streak (+1..+3)
 */
export function calculateProblemReward(
  problem: MathProblem,
  timeTakenSeconds: number,
  streak: number
): { coins: number; bonus: number; breakdown?: { base: number; difficulty: number; speed: number; streak: number } } {
  if (!problem.isCorrect) {
    return { coins: 0, bonus: 0 };
  }

  if (isZeroCoinPracticeProblem(problem)) {
    return {
      coins: 0,
      bonus: 0,
      breakdown: { base: 0, difficulty: 0, speed: 0, streak: 0 }
    };
  }

  let baseCoins = 2;
  let difficultyCoins = 0;

  if (problem.type === 'add-sub') {
    const termsCount = problem.terms?.length || 2;
    const maxVal = Math.max(1, ...(problem.terms?.map((t) => Math.abs(t)) || [10]));
    const digits = problem.digitsCount ?? Math.max(1, Math.floor(Math.log10(Math.max(1, maxVal))) + 1);

    difficultyCoins += Math.min(3, Math.max(0, digits - 1));
    if (problem.formulaMode === 'friends-10') difficultyCoins += 1;
    if (termsCount >= 5) difficultyCoins += 1;
    if (termsCount >= 8) difficultyCoins += 1;
  } else if (problem.type === 'multiplication') {
    const digits1 = problem.digits1 ?? (problem.numA ? Math.floor(Math.log10(Math.max(1, Math.abs(problem.numA)))) + 1 : 2);
    const digits2 = problem.digits2 ?? (problem.numB ? Math.floor(Math.log10(Math.max(1, Math.abs(problem.numB)))) + 1 : 1);
    baseCoins = 3;
    if (digits1 >= 2 && digits2 >= 2) difficultyCoins += 2;
    else if (digits1 >= 2 || digits2 >= 2) difficultyCoins += 1;
    if (digits1 + digits2 >= 5) difficultyCoins += 1;
  } else if (problem.type === 'division') {
    const divDigits = problem.dividendDigits ?? (problem.numA ? Math.floor(Math.log10(Math.max(1, Math.abs(problem.numA)))) + 1 : 3);
    baseCoins = 3;
    if (divDigits >= 3) difficultyCoins += 1;
    if (divDigits >= 4) difficultyCoins += 1;
  }

  if (problem.hasDecimals) {
    difficultyCoins += 1;
  }

  let speedBonus = 0;
  if (timeTakenSeconds <= 2) {
    speedBonus = 2;
  } else if (timeTakenSeconds <= 4) {
    speedBonus = 1;
  }

  const streakBonus = Math.min(3, Math.floor(streak / 3));
  const total = baseCoins + difficultyCoins + speedBonus + streakBonus;

  return {
    coins: total,
    bonus: speedBonus + streakBonus,
    breakdown: {
      base: baseCoins,
      difficulty: difficultyCoins,
      speed: speedBonus,
      streak: streakBonus
    }
  };
}
