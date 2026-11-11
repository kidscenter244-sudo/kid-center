export interface CharacterStats {
  speed: number;
  power: number;
  focus: number;
}

export interface BallonDorPower {
  type: string;
  name: string;
  badge?: string;
  description: string;
  durationSeconds?: number;
  chargesPerQuiz?: number;
  streakBonus?: number;
  multiplier?: number;
}

export interface CharacterItem {
  id: string;
  name: string;
  title: string;
  category: 'football' | 'superhero' | 'anime' | 'legend' | string;
  tier: 'Starter' | 'Pro' | 'Elite' | 'Epic' | 'Legendary' | 'Mythic' | 'GOAT' | string;
  price: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  skinColor: string;
  hairColor: string;
  jerseyNumber?: string;
  hasBallonDor?: boolean;
  ballonDorPower?: BallonDorPower;
  hasSoccerBall?: boolean;
  hasAura?: boolean;
  auraColor?: string;
  description: string;
  unlockedByDefault?: boolean;
  stats: CharacterStats;
  photoUrl?: string;
  robloxConfig?: {
    faceType?: string;
    hairType?: string;
    skinTone?: string;
    hasBeard?: boolean;
    club?: string;
    headwear?: string;
    cape?: boolean;
    accessory?: string;
    [key: string]: any;
  };
}

export interface StageEnvironment {
  id: string;
  name: string;
  description: string;
  groundColor: string;
  ambientColor: string;
  lightColor: string;
  fogColor: string;
  price: number;
}

export interface MathProblem {
  id: string;
  type: 'add-sub' | 'multiplication' | 'division' | 'mixed';
  terms?: number[];
  numA?: number;
  numB?: number;
  symbol?: string;
  correctAnswer: number;
  userAnswer?: number;
  isCorrect?: boolean;
  timeTakenSeconds?: number;
  hasDecimals?: boolean;
  decimalPlaces?: number;
}

export interface QuizSessionSummary {
  id: string;
  date: string;
  categoryTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  coinsEarned: number;
  timeSpentSeconds: number;
  averageTimePerQuestion: number;
  problems: MathProblem[];
}

export interface UserStats {
  totalSolved: number;
  totalCorrect: number;
  totalCoinsEarned: number;
  bestStreak: number;
}

export interface UserAccount {
  email: string;
  nickname: string;
  role: 'student' | 'teacher';
  coins: number;
  unlockedCharacters: string[];
  equippedCharacterId: string;
  stats: UserStats;
  history: QuizSessionSummary[];
}

export interface StudentRosterRecord {
  id: string;
  name: string;
  email: string;
  grade: string;
  coins: number;
  totalSolved: number;
  totalCorrect: number;
  accuracy: number;
  bestStreak: number;
  equippedCharacterId: string;
  unlockedCount?: number;
  lastActive: string;
}

export interface AddSubSettings {
  numbersCount: number;
  digitsCount: number;
  questionCount: number;
  timeLimitSeconds: number;
  formulaMode?: 'simple' | 'friends-5' | 'friends-10';
  hasDecimals?: boolean;
  decimalPlaces?: number;
}

export interface MultiplicationSettings {
  digits1: number;
  digits2: number;
  questionCount: number;
  timeLimitSeconds: number;
  hasDecimals?: boolean;
  decimalPlaces?: number;
}

export interface DivisionSettings {
  dividendDigits: number;
  divisorDigits: number;
  questionCount: number;
  timeLimitSeconds: number;
  hasDecimals?: boolean;
  decimalPlaces?: number;
}

export interface MixedSettings {
  includeAddSub: boolean;
  addSubCount: number;
  addSubNumbers: number;
  addSubDigits: number;
  addSubFormulaMode?: 'simple' | 'friends-5' | 'friends-10';
  addSubHasDecimals?: boolean;
  addSubDecimalPlaces?: number;

  includeMultiplication: boolean;
  multCount: number;
  multDigits1: number;
  multDigits2: number;
  multHasDecimals?: boolean;
  multDecimalPlaces?: number;

  includeDivision: boolean;
  divCount: number;
  divDividendDigits: number;
  divDivisorDigits: number;
  divHasDecimals?: boolean;
  divDecimalPlaces?: number;

  timeLimitSeconds: number;
}
