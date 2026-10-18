import { PowerUpDefinition, PowerUpId, WheelSlice } from '../types/game';

export const POWER_UPS: Record<PowerUpId, PowerUpDefinition> = {
  nudge_forward: {
    id: 'nudge_forward',
    name: 'Nudge Clockwise (+1)',
    shortName: 'Nudge +1',
    description: 'Rotate the wheel 1 space clockwise to pull the left wedge under the pointer.',
    tacticalHint: 'Rotates 1 wedge clockwise ↻',
    cost: 160,
    icon: 'RotateCw',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    canUsePreSpin: false,
    canUsePostSpin: true,
  },
  nudge_backward: {
    id: 'nudge_backward',
    name: 'Nudge Counter-CW (-1)',
    shortName: 'Nudge -1',
    description: 'Rotate the wheel 1 space counter-clockwise to pull the right wedge under the pointer.',
    tacticalHint: 'Rotates 1 wedge counter-CW ↺',
    cost: 160,
    icon: 'RotateCcw',
    color: '#fb7185',
    glowColor: 'rgba(251, 113, 133, 0.5)',
    canUsePreSpin: false,
    canUsePostSpin: true,
  },
  invert: {
    id: 'invert',
    name: 'Invert Wheel (180°)',
    shortName: 'Invert 180°',
    description: 'Flip the entire wheel 180° to claim the prize directly across the diameter!',
    tacticalHint: 'Flips to opposite wedge',
    cost: 200,
    icon: 'FlipVertical2',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    canUsePreSpin: false,
    canUsePostSpin: true,
  },
  double: {
    id: 'double',
    name: 'Double Value (2x)',
    shortName: 'Double 2x',
    description: 'Doubles ALL cash values on the wheel for this spin (Max 2x per spin).',
    tacticalHint: '2x cash (Max 1/spin)',
    cost: 250,
    icon: 'Zap',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    canUsePreSpin: true,
    canUsePostSpin: true,
  },
  shuffle: {
    id: 'shuffle',
    name: 'Chaos Shuffle',
    shortName: 'Shuffle',
    description: 'Randomly scrambles all prize locations on the wheel! Use before or after spinning.',
    tacticalHint: 'Scrambles all wedges',
    cost: 110,
    icon: 'Shuffle',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    canUsePreSpin: true,
    canUsePostSpin: true,
  },
  respin: {
    id: 'respin',
    name: 'High-Roller Respin',
    shortName: 'Respin',
    description: 'Spin the wheel again immediately! Keeps any active 2x multiplier.',
    tacticalHint: 'Full fresh spin',
    cost: 240,
    icon: 'RefreshCw',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    canUsePreSpin: true,
    canUsePostSpin: true,
  },
};

export const POWER_UP_LIST: PowerUpDefinition[] = [
  POWER_UPS.nudge_forward,
  POWER_UPS.nudge_backward,
  POWER_UPS.invert,
  POWER_UPS.double,
  POWER_UPS.shuffle,
  POWER_UPS.respin,
];

export const DAILY_PRICE_MULTIPLIER = 1.2;

export const INITIAL_DAILY_PURCHASES: Record<PowerUpId, number> = {
  nudge_forward: 0,
  nudge_backward: 0,
  invert: 0,
  respin: 0,
  shuffle: 0,
  double: 0,
};

/**
 * Calculates the current shop price for any power-up.
 * Every power-up increases in price by 1.2x for each time it was purchased today,
 * and resets back to its base cost each new day!
 */
export function getPowerUpCost(
  id: PowerUpId,
  dailyPurchases?: Partial<Record<PowerUpId, number>>
): number {
  const base = POWER_UPS[id].cost;
  const purchasesToday = dailyPurchases?.[id] || 0;
  return Math.round(base * Math.pow(DAILY_PRICE_MULTIPLIER, purchasesToday));
}

export const INITIAL_WHEEL_SLICES: WheelSlice[] = [];

export const INITIAL_PLAYER_STATE = {
  balance: 220,
  inventory: {
    nudge_forward: 1,
    nudge_backward: 1,
    invert: 1,
    respin: 0,
    shuffle: 1,
    double: 0,
  },
  dailyPurchases: { ...INITIAL_DAILY_PURCHASES },
  dailyPurchaseDate: null,
  lastSpinDate: null,
  simulatedDayOffset: 0,
  streak: 0,
  lastStreakDate: null,
  lastStreakBonusClaimDate: null,
  totalSpins: 0,
  biggestWin: 0,
  lifetimeEarnings: 0,
  history: [],
  soundEnabled: true,
};
