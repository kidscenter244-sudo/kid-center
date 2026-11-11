import {
  MathProblem,
  AddSubSettings,
  MultiplicationSettings,
  DivisionSettings,
  MixedSettings
} from '../types';

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomIntWithDigits(digits: number): number {
  if (digits <= 1) {
    return Math.floor(Math.random() * 9) + 1; // 1-9
  }
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isDirectAdd(currentDigit: number, addDigit: number): boolean {
  if (addDigit < 0 || addDigit > 9) return false;
  const lowerBeads = currentDigit % 5;
  const upperBead = currentDigit >= 5 ? 1 : 0;
  if (addDigit < 5) {
    return lowerBeads + addDigit <= 4;
  }
  return upperBead === 0 && (lowerBeads + (addDigit - 5)) <= 4;
}

function isDirectSub(currentDigit: number, subDigit: number): boolean {
  if (subDigit < 0 || subDigit > 9) return false;
  const lowerBeads = currentDigit % 5;
  const upperBead = currentDigit >= 5 ? 1 : 0;
  if (subDigit < 5) {
    return lowerBeads >= subDigit;
  }
  return upperBead === 1 && lowerBeads >= (subDigit - 5);
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
  const digits = Math.max(1, settings.digitsCount || 1);
  const formulaMode = settings.formulaMode || 'simple';

  const terms: number[] = [];
  let currentSum = 0;

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      let firstNum = 0;
      for (let p = 0; p < digits; p++) {
        let d = 0;
        if (formulaMode === 'friends-5') {
          // In formulas of 5, start with 1, 2, 3, or 4 so 5-friend addition can be used
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
      // Direct bead operations only (no 5-friends, no 10-friends)
      const dirs = preferSubtract ? ['sub', 'add'] : ['add', 'sub'];
      for (const dir of dirs) {
        if (dir === 'sub' && !allowSubtract) continue;
        const candidateDigits: number[] = [];
        let possible = true;
        for (let p = 0; p < digits; p++) {
          const cd = curDigits[p];
          const valid: number[] = [];
          for (let d = (p === 0 ? 1 : 0); d <= 9; d++) {
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
      // Small Friends 5-complements (+4=+5-1, +3=+5-2, +2=+5-3, +1=+5-4, -4=-5+1, etc.)
      // Stays strictly within 0..9 per column (NO crossing 10)
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
          for (let d = (p === 0 ? 1 : 0); d <= 9; d++) {
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
      // Big Friends (10-complements): numbers that cross 10 (+9=+10-1, +8=+10-2, etc.)
      const bigFriends = [9, 8, 7, 6, 5];
      let val = 0;
      for (let p = 0; p < digits; p++) {
        const d = bigFriends[Math.floor(Math.random() * bigFriends.length)];
        val = val * 10 + d;
      }
      const canSub = currentSum >= val;
      foundTerm = (canSub && Math.random() < 0.4) ? -val : val;
    }

    if (foundTerm !== null) {
      terms.push(foundTerm);
      currentSum += foundTerm;
    } else {
      // If boundary reached, perform a safe single-digit bead adjustment
      const step = Math.pow(10, digits - 1);
      if (currentSum >= 5 * step) {
        terms.push(-step);
        currentSum -= step;
      } else {
        terms.push(step);
        currentSum += step;
      }
    }
  }

  return {
    id: `addsub-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'add-sub',
    terms,
    correctAnswer: currentSum,
    hasDecimals: false
  };
}

export function generateMultiplicationProblem(settings: MultiplicationSettings, index: number): MathProblem {
  const digits1 = Math.max(1, settings.digits1 || 2);
  const digits2 = Math.max(1, settings.digits2 || 1);

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
    hasDecimals: false
  };
}

export function generateDivisionProblem(settings: DivisionSettings, index: number): MathProblem {
  const dividendDigits = Math.max(2, settings.dividendDigits || 3);
  const divisorDigits = Math.max(1, Math.min(dividendDigits - 1, settings.divisorDigits || 1));

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
    hasDecimals: false
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

/**
 * Calibrated coin rewards:
 * Increased difficulty to earn coins so players practice longer!
 * Base: 2 to 5 coins
 * Speed: +1 or +2 coins
 * Streak: +1 to +3 coins
 */
export function calculateProblemReward(
  problem: MathProblem,
  timeTakenSeconds: number,
  streak: number
): { coins: number; bonus: number; breakdown?: { base: number; difficulty: number; speed: number; streak: number } } {
  if (!problem.isCorrect) {
    return { coins: 0, bonus: 0 };
  }

  let baseCoins = 2;
  let difficultyCoins = 0;

  if (problem.type === 'add-sub') {
    const termsCount = problem.terms?.length || 2;
    const maxVal = Math.max(...(problem.terms?.map((t) => Math.abs(t)) || [10]));
    const digits = Math.max(1, Math.floor(Math.log10(maxVal || 1)) + 1);

    // 1-digit: 0, 2-digit: +1, 3-digit: +2, 4+ digit: +3
    difficultyCoins += Math.min(3, Math.max(0, digits - 1));
    if (termsCount >= 5) difficultyCoins += 1;
    if (termsCount >= 8) difficultyCoins += 1;
  } else if (problem.type === 'multiplication') {
    const digits1 = problem.numA ? Math.floor(Math.log10(Math.abs(problem.numA) || 1)) + 1 : 2;
    const digits2 = problem.numB ? Math.floor(Math.log10(Math.abs(problem.numB) || 1)) + 1 : 1;
    baseCoins = 3;
    if (digits1 >= 2 && digits2 >= 2) difficultyCoins += 2;
    else if (digits1 >= 2 || digits2 >= 2) difficultyCoins += 1;
    if (digits1 + digits2 >= 5) difficultyCoins += 1;
  } else if (problem.type === 'division') {
    const divDigits = problem.numA ? Math.floor(Math.log10(Math.abs(problem.numA) || 1)) + 1 : 3;
    baseCoins = 3;
    if (divDigits >= 3) difficultyCoins += 1;
    if (divDigits >= 4) difficultyCoins += 1;
  }

  // Speed Bonus (earned through fast reflexes)
  let speedBonus = 0;
  if (timeTakenSeconds <= 2) {
    speedBonus = 2;
  } else if (timeTakenSeconds <= 4) {
    speedBonus = 1;
  }

  // Streak Bonus (1 coin every 4 correct streak, max 3)
  const streakBonus = Math.min(3, Math.floor(streak / 4));
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
