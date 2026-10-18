import { WheelSlice } from '../types/game';

export const SLICE_COUNT = 12;
export const SLICE_ANGLE = 360 / SLICE_COUNT; // 30 degrees

/**
 * Calculates the relative probability weight for landing on slice `idx`.
 * - Jackpot: weight 1 (~0.8% chance — hardest to hit!)
 * - Cash > $200: weight 2.5 (~2% chance)
 * - Cash $101–$200: weight 4.5 (~3.6% chance)
 * - Power-ups: weight 5–9 (~4%–7% chance)
 * - Cash $50–$100: weight 18 (~14.5% chance)
 * - Cash < $50: weight 26 (~21% chance)
 * - Slices immediately adjacent to the Jackpot have 0.5x weight so landing
 *   1 Nudge away from the Jackpot is also a rarer event.
 */
export function getSliceWeight(slices: WheelSlice[], idx: number): number {
  const slice = slices[idx];
  if (!slice) return 1;

  let weight = 10;

  if (slice.tier === 'jackpot') {
    return 1; // Hardest to get!
  } else if (slice.type === 'cash') {
    const val = slice.cashValue || 0;
    if (val > 200) {
      weight = 2.5;
    } else if (val > 100) {
      weight = 4.5;
    } else if (val >= 50) {
      weight = 18;
    } else {
      weight = 26;
    }
  } else if (slice.type === 'powerup') {
    const rewards = slice.powerUpReward || [];
    if (rewards.includes('double') || rewards.includes('respin')) {
      weight = 5;
    } else {
      weight = 9;
    }
  }

  // Find Jackpot index to slightly dampen immediate ±1 neighbors (anti-easy-nudge)
  const jackpotIdx = slices.findIndex((s) => s.tier === 'jackpot');
  if (jackpotIdx !== -1) {
    const prevOfJackpot = (jackpotIdx - 1 + slices.length) % slices.length;
    const nextOfJackpot = (jackpotIdx + 1) % slices.length;
    if (idx === prevOfJackpot || idx === nextOfJackpot) {
      weight *= 0.5;
    }
  }

  return weight;
}

/**
 * Picks a winning slice index (0..11) using the skewed probability weights.
 */
export function pickWeightedSliceIndex(
  slices: WheelSlice[],
  excludeIdx?: number
): number {
  const weights = slices.map((_, idx) =>
    idx === excludeIdx ? 0 : getSliceWeight(slices, idx)
  );
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    return Math.floor(Math.random() * slices.length);
  }

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      return i;
    }
  }
  return weights.length - 1;
}

/**
 * Given a clockwise wheel rotation in degrees, returns the index (0..11)
 * of the slice currently positioned under the 12 o'clock pointer.
 * Slice 0 is centered at 12 o'clock (0 deg) when rotation = 0.
 */
export function getSliceIndexAtPointer(rotationDeg: number): number {
  const normalized = (((-rotationDeg) % 360) + 360) % 360;
  const shifted = (normalized + SLICE_ANGLE / 2) % 360;
  return Math.floor(shifted / SLICE_ANGLE) % SLICE_COUNT;
}

/**
 * Returns the adjacent and opposite slice indices relative to the current active slice index:
 * - nudgeForwardIdx (rotating wheel +30 deg clockwise brings the 11 o'clock slice [index - 1] to the pointer)
 * - nudgeBackwardIdx (rotating wheel -30 deg counter-clockwise brings the 1 o'clock slice [index + 1] to the pointer)
 * - invertIdx (rotating wheel 180 deg brings the 6 o'clock slice [index + 6] to the pointer)
 */
export function getTacticalTargets(currentIndex: number) {
  const nudgeForwardIdx = (currentIndex - 1 + SLICE_COUNT) % SLICE_COUNT;
  const nudgeBackwardIdx = (currentIndex + 1) % SLICE_COUNT;
  const invertIdx = (currentIndex + 6) % SLICE_COUNT;

  return {
    nudgeForwardIdx,
    nudgeBackwardIdx,
    invertIdx,
  };
}

export type SpinSuspenseStyle =
  | 'slow_tease'
  | 'peg_bounce'
  | 'last_gasp'
  | 'edge_hanger';

export interface SuspenseSpinPlan {
  targetRotation: number;
  durationMs: number;
  style: SpinSuspenseStyle;
  easingFn: (t: number) => number;
}

/**
 * Generates a randomized, high-suspense spin trajectory so every spin has
 * genuine anticipation in the final seconds (slow peg crawls, peg bounce-backs,
 * fake-out stalls, or edge hangers).
 */
export function createSuspenseSpinPlan(
  currentRotation: number,
  chosenSlice: number
): SuspenseSpinPlan {
  const styles: SpinSuspenseStyle[] = [
    'slow_tease',
    'peg_bounce',
    'last_gasp',
    'edge_hanger',
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];

  // 9 to 13 full rotations (scaled up for 30% longer spin time)
  const fullSpins = (9 + Math.floor(Math.random() * 5)) * 360;

  // Base angle where chosenSlice is dead-center at 12 o'clock
  const desiredMod = (360 - chosenSlice * SLICE_ANGLE) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let diffToDesired = desiredMod - currentMod;
  if (diffToDesired <= 0) diffToDesired += 360;

  // Vary where inside the 30-degree wedge (-15°..+15°) the pointer stops:
  // Negative offset = just barely cleared the entry peg!
  // Positive offset = crept right up to the exit peg!
  let withinSliceOffset = (Math.random() - 0.5) * 16;
  if (style === 'edge_hanger') {
    // Land DRAMATICALLY close to a peg (±10° to ±12.5° from slice center, where peg is at ±15°)
    withinSliceOffset = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 2.5);
  } else if (style === 'last_gasp') {
    // Barely clear the entry peg (-11° to -7° from center) after a fakeout stall!
    withinSliceOffset = -(7 + Math.random() * 4);
  } else if (style === 'peg_bounce') {
    // Stop near the exit side (+4° to +9°), after briefly overshooting into the next slice!
    withinSliceOffset = 4 + Math.random() * 5;
  }

  const totalDelta = fullSpins + diffToDesired + withinSliceOffset;
  const targetRotation = currentRotation + totalDelta;

  // Anticipation wind-back: pull the wheel backward (-24° to -32° counter-clockwise)
  // during the first ~5% (~380ms) of the animation, then accelerate smoothly forward!
  const windBackDeg = 24 + Math.random() * 8; // 24° to 32° wind-back
  const windBackRatio = windBackDeg / totalDelta;
  const windPeakT = 0.05; // ~380ms wind-back coil
  const accelSpanU = 0.055; // ~400ms forward acceleration ramp from rest to top speed

  const wrapWithAnticipation = (forwardCurve: (u: number) => number) => {
    return (t: number): number => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;

      // Phase 1: Wind backward counter-clockwise to -windBackRatio with smooth ease-in-out
      if (t < windPeakT) {
        const w = t / windPeakT; // 0..1
        const easeCoil = 0.5 * (1 - Math.cos(Math.PI * w));
        return -windBackRatio * easeCoil;
      }

      // Phase 2: Release from -windBackRatio and accelerate forward to +1.0
      const u = (t - windPeakT) / (1 - windPeakT); // 0..1
      const rawForward = forwardCurve(u);

      // Smoothly ramp acceleration from 0 velocity at u=0 up to full forward curve by u=accelSpanU
      let accelFactor = 1;
      if (u < accelSpanU) {
        const a = u / accelSpanU; // 0..1
        accelFactor = a * a * (3 - 2 * a); // smoothstep 0..1
      }

      const blendedForward = rawForward * accelFactor;
      return -windBackRatio + (1 + windBackRatio) * blendedForward;
    };
  };

  if (style === 'peg_bounce') {
    // Overshoots by ~14 degrees (crossing or kissing the next peg!) around u=0.87,
    // then physically settles backward onto the winning slice!
    const durationMs = Math.round((5400 + Math.floor(Math.random() * 900)) * 1.3);
    const exp = 3.15 + Math.random() * 0.25;
    const overshootDeg = 13 + Math.random() * 5; // 13° to 18° overshoot
    const overshootRatio = overshootDeg / totalDelta;

    const forwardFn = (u: number): number => {
      const base = 1 - Math.pow(1 - u, exp);
      // Smooth bump localized in u in [0.68, 1.0] peaking around u = 0.87
      if (u > 0.68) {
        const k = (u - 0.68) / 0.32; // 0..1
        const bump = Math.sin(k * Math.PI) * Math.pow(k, 0.8) * overshootRatio;
        return base + bump;
      }
      return base;
    };

    return {
      targetRotation,
      durationMs,
      style,
      easingFn: wrapWithAnticipation(forwardFn),
    };
  }

  if (style === 'last_gasp') {
    // Slows down around u=0.72 as if stopping 1 slice early, then a second wind
    // creeps across the final peg!
    const durationMs = Math.round((5700 + Math.floor(Math.random() * 900)) * 1.3);
    const exp = 3.0;
    const stallDipDeg = 22 + Math.random() * 6;
    const dipRatio = stallDipDeg / totalDelta;

    const forwardFn = (u: number): number => {
      const base = 1 - Math.pow(1 - u, exp);
      if (u > 0.55) {
        const k = (u - 0.55) / 0.45; // 0..1
        // Holds back slightly in the middle of the endgame, then catches up to 1.0 at k=1
        const holdback = Math.sin(k * Math.PI) * (1 - k * 0.35) * dipRatio;
        return Math.max(0, base - holdback);
      }
      return base;
    };

    return {
      targetRotation,
      durationMs,
      style,
      easingFn: wrapWithAnticipation(forwardFn),
    };
  }

  if (style === 'edge_hanger') {
    // Long, nail-biting low-exponent crawl that stops millimetres from a peg
    const durationMs = Math.round((5600 + Math.floor(Math.random() * 1000)) * 1.3);
    const exp = 2.75 + Math.random() * 0.25;
    const forwardFn = (u: number): number => 1 - Math.pow(1 - u, exp);
    return {
      targetRotation,
      durationMs,
      style,
      easingFn: wrapWithAnticipation(forwardFn),
    };
  }

  // 'slow_tease': Extended multi-second crawl over the final several pegs
  const durationMs = Math.round((5300 + Math.floor(Math.random() * 1100)) * 1.3);
  const exp = 2.6 + Math.random() * 0.35;
  const forwardFn = (u: number): number => 1 - Math.pow(1 - u, exp);
  return {
    targetRotation,
    durationMs,
    style,
    easingFn: wrapWithAnticipation(forwardFn),
  };
}

/**
 * Formats a number as currency (e.g. $2,500)
 */
export function formatCash(amount: number): string {
  return '$' + amount.toLocaleString('en-US');
}

/**
 * Formats a cost/deduction with a negative sign before the dollar sign (e.g. -$100)
 */
export function formatCost(amount: number): string {
  return '-$' + amount.toLocaleString('en-US');
}

/**
 * Returns YYYY-MM-DD string for current date + simulatedDayOffset
 */
export function getEffectiveDateString(simulatedDayOffset: number = 0): string {
  const now = new Date();
  now.setDate(now.getDate() + simulatedDayOffset);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's YYYY-MM-DD string relative to simulatedDayOffset
 */
export function getYesterdayDateString(simulatedDayOffset: number = 0): string {
  return getEffectiveDateString(simulatedDayOffset - 1);
}

/**
 * Returns time remaining until local midnight as HH:MM:SS
 */
export function getCountdownToMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}
