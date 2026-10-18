import { PowerUpId, WheelSlice, WinTier } from '../types/game';
import { formatCash } from './wheelMath';

/**
 * Deterministic string hash -> 32-bit seed so the same YYYY-MM-DD
 * generates the same daily wheel across page reloads, while every new day
 * generates a completely fresh set of values and power-ups!
 */
function hashDateToSeed(dateStr: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Mulberry32 seeded PRNG returning [0, 1)
 */
function createSeededRng(seed: number): () => number {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PowerUpSliceTemplate {
  label: string;
  sublabel: string;
  powerUpReward: PowerUpId[];
  tier: WinTier;
  bgStart: string;
  bgEnd: string;
  textColor: string;
  accentColor: string;
}

const POWERUP_SLICE_POOL: PowerUpSliceTemplate[] = [
  {
    label: '2X BOOST',
    sublabel: 'FREE DOUBLE',
    powerUpReward: ['double'],
    tier: 'big',
    bgStart: '#7e22ce',
    bgEnd: '#4c1d95',
    textColor: '#f3e8ff',
    accentColor: '#d8b4fe',
  },
  {
    label: 'NUDGE +1',
    sublabel: 'ROTATE CW ↻',
    powerUpReward: ['nudge_forward'],
    tier: 'medium',
    bgStart: '#d97706',
    bgEnd: '#78350f',
    textColor: '#fffbeb',
    accentColor: '#fde68a',
  },
  {
    label: 'NUDGE -1',
    sublabel: 'ROTATE CCW ↺',
    powerUpReward: ['nudge_backward'],
    tier: 'medium',
    bgStart: '#e11d48',
    bgEnd: '#881337',
    textColor: '#fff1f2',
    accentColor: '#fda4af',
  },
  {
    label: 'INVERT 180°',
    sublabel: 'FREE FLIP',
    powerUpReward: ['invert'],
    tier: 'medium',
    bgStart: '#0891b2',
    bgEnd: '#164e63',
    textColor: '#ecfeff',
    accentColor: '#67e8f9',
  },
  {
    label: 'FREE RESPIN',
    sublabel: 'EXTRA SPIN',
    powerUpReward: ['respin'],
    tier: 'big',
    bgStart: '#db2777',
    bgEnd: '#831843',
    textColor: '#fdf2f8',
    accentColor: '#f9a8d4',
  },
  {
    label: 'SHUFFLE',
    sublabel: 'SCRAMBLE',
    powerUpReward: ['shuffle'],
    tier: 'medium',
    bgStart: '#0d9488',
    bgEnd: '#134e4a',
    textColor: '#f0fdfa',
    accentColor: '#5eead4',
  },
];

// Balanced economy prize pools
const JACKPOT_OPTIONS = [400, 450, 500, 600, 750];
const BIG_CASH_OPTIONS = [175, 200, 225, 250, 275, 300];
const MEDIUM_CASH_OPTIONS = [85, 100, 115, 125, 140, 150];
const SMALL_CASH_OPTIONS = [15, 20, 25, 35, 45, 50, 65];

const DAILY_BOARD_NAMES = [
  'High-Roller Fiesta',
  'Neon Heist Board',
  'Fortune Surge',
  'Diamond Vault Drop',
  'Cyber Jackpot Run',
  'Golden Mirage',
  'Vegas Overdrive',
];

export interface DailyBoardInfo {
  dateStr: string;
  boardName: string;
  topJackpot: number;
  slices: WheelSlice[];
}

export function generateDailyWheel(dateStr: string): DailyBoardInfo {
  const seed = hashDateToSeed(dateStr);
  const rng = createSeededRng(seed);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const pickUniqueCount = <T,>(arr: T[], count: number): T[] => {
    const pool = [...arr];
    const result: T[] = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(rng() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  };

  // 1. Pick 1 Daily Jackpot ($400 - $750)
  const topJackpot = pick(JACKPOT_OPTIONS);

  // 2. Pick 2 Big Cash values ($175 - $300)
  const bigValues = pickUniqueCount(BIG_CASH_OPTIONS, 2);

  // 3. Pick 2 Medium Cash values ($85 - $150)
  const medValues = pickUniqueCount(MEDIUM_CASH_OPTIONS, 2);

  // 4. Pick 4 Small Cash values ($15 - $65)
  const smallValues = pickUniqueCount(SMALL_CASH_OPTIONS, 4);

  // 5. Pick 3 Power-up slices from the pool
  const powerUpSlices = pickUniqueCount(POWERUP_SLICE_POOL, 3);

  const rawSlices: WheelSlice[] = [
    // Jackpot Slice
    {
      id: `daily-${dateStr}-jackpot`,
      label: formatCash(topJackpot),
      sublabel: 'DAILY JACKPOT',
      type: 'cash',
      cashValue: topJackpot,
      tier: 'jackpot',
      bgStart: '#fbbf24',
      bgEnd: '#b45309',
      textColor: '#1e1b4b',
      accentColor: '#fef08a',
    },
    // Big Cash Slices
    {
      id: `daily-${dateStr}-big-0`,
      label: formatCash(bigValues[0]),
      sublabel: 'GRAND STASH',
      type: 'cash',
      cashValue: bigValues[0],
      tier: 'big',
      bgStart: '#e11d48',
      bgEnd: '#881337',
      textColor: '#fff1f2',
      accentColor: '#fda4af',
    },
    {
      id: `daily-${dateStr}-big-1`,
      label: formatCash(bigValues[1]),
      sublabel: 'HIGH ROLLER',
      type: 'cash',
      cashValue: bigValues[1],
      tier: 'big',
      bgStart: '#16a34a',
      bgEnd: '#14532d',
      textColor: '#f0fdf4',
      accentColor: '#86efac',
    },
    // Medium Cash Slices
    {
      id: `daily-${dateStr}-med-0`,
      label: formatCash(medValues[0]),
      sublabel: 'SOLID STACK',
      type: 'cash',
      cashValue: medValues[0],
      tier: 'medium',
      bgStart: '#059669',
      bgEnd: '#064e3b',
      textColor: '#ecfdf5',
      accentColor: '#6ee7b7',
    },
    {
      id: `daily-${dateStr}-med-1`,
      label: formatCash(medValues[1]),
      sublabel: 'CASH PRIZE',
      type: 'cash',
      cashValue: medValues[1],
      tier: 'medium',
      bgStart: '#4f46e5',
      bgEnd: '#312e81',
      textColor: '#eef2ff',
      accentColor: '#a5b4fc',
    },
    // Small Cash Slices (4 wedges so nudging requires real strategy!)
    {
      id: `daily-${dateStr}-sm-0`,
      label: formatCash(smallValues[0]),
      sublabel: 'QUICK CASH',
      type: 'cash',
      cashValue: smallValues[0],
      tier: 'small',
      bgStart: '#1e293b',
      bgEnd: '#0f172a',
      textColor: '#e2e8f0',
      accentColor: '#38bdf8',
    },
    {
      id: `daily-${dateStr}-sm-1`,
      label: formatCash(smallValues[1]),
      sublabel: 'POCKET CASH',
      type: 'cash',
      cashValue: smallValues[1],
      tier: 'small',
      bgStart: '#2563eb',
      bgEnd: '#1e3a8a',
      textColor: '#eff6ff',
      accentColor: '#93c5fd',
    },
    {
      id: `daily-${dateStr}-sm-2`,
      label: formatCash(smallValues[2]),
      sublabel: 'BONUS BILLS',
      type: 'cash',
      cashValue: smallValues[2],
      tier: 'small',
      bgStart: '#312e81',
      bgEnd: '#1e1b4b',
      textColor: '#c7d2fe',
      accentColor: '#818cf8',
    },
    {
      id: `daily-${dateStr}-sm-3`,
      label: formatCash(smallValues[3]),
      sublabel: 'SPARE CHANGE',
      type: 'cash',
      cashValue: smallValues[3],
      tier: 'small',
      bgStart: '#334155',
      bgEnd: '#0f172a',
      textColor: '#f1f5f9',
      accentColor: '#94a3b8',
    },
    // 3 Power-Up Slices
    ...powerUpSlices.map((p, idx) => ({
      id: `daily-${dateStr}-pu-${idx}`,
      label: p.label,
      sublabel: p.sublabel,
      type: 'powerup' as const,
      powerUpReward: p.powerUpReward,
      tier: p.tier,
      bgStart: p.bgStart,
      bgEnd: p.bgEnd,
      textColor: p.textColor,
      accentColor: p.accentColor,
    })),
  ];

  // Deterministically shuffle all 12 slices for today's board
  for (let i = rawSlices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rawSlices[i], rawSlices[j]] = [rawSlices[j], rawSlices[i]];
  }

  const boardName = pick(DAILY_BOARD_NAMES);

  return {
    dateStr,
    boardName,
    topJackpot,
    slices: rawSlices,
  };
}
