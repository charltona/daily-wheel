export type PowerUpId =
  | 'nudge_forward'
  | 'nudge_backward'
  | 'invert'
  | 'respin'
  | 'shuffle'
  | 'double';

export interface PowerUpDefinition {
  id: PowerUpId;
  name: string;
  shortName: string;
  description: string;
   tacticalHint: string;
  cost: number;
  icon: string;
  color: string;
  glowColor: string;
  canUsePreSpin: boolean;
  canUsePostSpin: boolean;
}

export type SliceRewardType = 'cash' | 'powerup';

export type WinTier = 'small' | 'medium' | 'big' | 'jackpot';

export interface WheelSlice {
  id: string;
  label: string;
  sublabel?: string;
  type: SliceRewardType;
  cashValue?: number;
  powerUpReward?: PowerUpId[];
  tier: WinTier;
  bgStart: string;
  bgEnd: string;
  textColor: string;
  accentColor: string;
}

export type GamePhase = 'IDLE' | 'SPINNING' | 'TACTICAL' | 'CELEBRATING';

export interface SpinHistoryEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  label: string;
  cashWon: number;
  powerUpsWon: PowerUpId[];
  multiplierUsed: number;
  powerUpsUsed: PowerUpId[];
  tier: WinTier;
}

export interface PlayerState {
  balance: number;
  inventory: Record<PowerUpId, number>;
  dailyPurchases: Record<PowerUpId, number>;
  dailyPurchaseDate: string | null; // YYYY-MM-DD when dailyPurchases were made (resets each new day!)
  lastSpinDate: string | null; // YYYY-MM-DD in local time (or simulated date)
  simulatedDayOffset: number; // Allows players to test/advance days freely
  streak: number;
  lastStreakDate: string | null;
  lastStreakBonusClaimDate?: string | null; // Ensures daily streak bonus is only paid once per day
  totalSpins: number;
  biggestWin: number;
  lifetimeEarnings: number;
  history: SpinHistoryEntry[];
  soundEnabled: boolean;
}
