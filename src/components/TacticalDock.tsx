import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Lock,
  Clock,
  Play,
} from 'lucide-react';
import { GamePhase, PowerUpId, WheelSlice } from '../types/game';
import { getPowerUpCost, POWER_UP_LIST } from '../constants/gameData';
import { PowerUpIcon } from './PowerUpIcon';
import { formatCash, formatCost, getTacticalTargets } from '../utils/wheelMath';

interface TacticalDockProps {
  phase: GamePhase;
  balance: number;
  inventory: Record<PowerUpId, number>;
  dailyPurchases: Record<PowerUpId, number>;
  slices: WheelSlice[];
  activeSliceIndex: number;
  activeMultiplier: number;
  canSpinToday: boolean;
  onUsePowerUp: (id: PowerUpId) => void;
  onBuyPowerUp: (id: PowerUpId) => void;
  onClaimPrize: () => void;
  onSpin: () => void;
  onOpenMobileShop?: () => void;
}

export const TacticalDock: React.FC<TacticalDockProps> = ({
  phase,
  balance,
  inventory,
  dailyPurchases,
  slices,
  activeSliceIndex,
  activeMultiplier,
  canSpinToday,
  onUsePowerUp,
  onBuyPowerUp,
  onClaimPrize,
  onSpin,
  onOpenMobileShop,
}) => {
  const currentSlice = slices[activeSliceIndex];
  const targets = getTacticalTargets(activeSliceIndex);

  const formatSlicePreview = (slice: WheelSlice | undefined, mult = activeMultiplier) => {
    if (!slice) return '';
    if (slice.type === 'cash' && slice.cashValue) {
      return formatCash(slice.cashValue * mult);
    }
    return slice.label;
  };

  /**
   * Determines whether a power-up is allowed to be used in the current game state.
   * - When today's spin is already claimed (phase === 'IDLE' && !canSpinToday),
   *   ONLY 'respin' can be used (so you never waste Shuffle or Double after locking in your prize!).
   * - Before spinning (phase === 'IDLE' && canSpinToday), only 'double' and 'shuffle' can be pre-activated.
   * - After wheel stops (phase === 'TACTICAL'), ALL power-ups are unlocked (except Double if already at 2x).
   */
  const isPhaseCompatible = (id: PowerUpId): boolean => {
    if (phase === 'SPINNING' || phase === 'CELEBRATING') return false;
    if (id === 'double' && activeMultiplier >= 2) return false;

    if (phase === 'IDLE') {
      if (!canSpinToday) {
        // Today's prize was already claimed! Only Respin can start a new spin.
        return id === 'respin';
      }
      // Pre-spin: only Double and Shuffle can be used before spinning
      return id === 'double' || id === 'shuffle';
    }

    if (phase === 'TACTICAL') {
      return true;
    }

    return false;
  };

  /**
   * Returns a crystal-clear status & outcome label for each card so the player
   * immediately knows WHY a card can or cannot be used right now.
   */
  const getCardStatusInfo = (
    id: PowerUpId
  ): {
    whenBadge: string;
    actionText: string;
    isUpgrade: boolean;
    lockReason: string | null;
  } => {
    if (id === 'double' && activeMultiplier >= 2) {
      return {
        whenBadge: 'MAX 1 / SPIN',
        actionText: '⚡ 2X ACTIVE ON WHEEL',
        isUpgrade: false,
        lockReason: 'LOCKED (2X MAX)',
      };
    }

    const currentCash =
      currentSlice?.type === 'cash' ? (currentSlice.cashValue || 0) * activeMultiplier : 100;

    // 1. POST-SPIN TACTICAL WINDOW (All power-ups unlocked!)
    if (phase === 'TACTICAL') {
      switch (id) {
        case 'nudge_forward': {
          const target = slices[targets.nudgeForwardIdx];
          const targetCash =
            target?.type === 'cash' ? (target.cashValue || 0) * activeMultiplier : 160;
          return {
            whenBadge: 'POST-SPIN',
            actionText: `→ Land on ${formatSlicePreview(target)}`,
            isUpgrade: targetCash > currentCash,
            lockReason: null,
          };
        }
        case 'nudge_backward': {
          const target = slices[targets.nudgeBackwardIdx];
          const targetCash =
            target?.type === 'cash' ? (target.cashValue || 0) * activeMultiplier : 160;
          return {
            whenBadge: 'POST-SPIN',
            actionText: `→ Land on ${formatSlicePreview(target)}`,
            isUpgrade: targetCash > currentCash,
            lockReason: null,
          };
        }
        case 'invert': {
          const target = slices[targets.invertIdx];
          const targetCash =
            target?.type === 'cash' ? (target.cashValue || 0) * activeMultiplier : 160;
          return {
            whenBadge: 'POST-SPIN',
            actionText: `→ Flip to ${formatSlicePreview(target)}`,
            isUpgrade: targetCash > currentCash,
            lockReason: null,
          };
        }
        case 'double': {
          const doubledText =
            currentSlice?.type === 'cash' && currentSlice.cashValue
              ? `→ Double to ${formatCash(currentSlice.cashValue * 2)}!`
              : '→ Double cash slices to 2x';
          return {
            whenBadge: 'PRE / POST SPIN',
            actionText: doubledText,
            isUpgrade: true,
            lockReason: null,
          };
        }
        case 'shuffle':
          return {
            whenBadge: 'PRE / POST SPIN',
            actionText: '→ Scramble slices under pointer',
            isUpgrade: false,
            lockReason: null,
          };
        case 'respin':
          return {
            whenBadge: 'ANYTIME',
            actionText: `→ Spin Again (${activeMultiplier}x kept)`,
            isUpgrade: currentCash <= 65,
            lockReason: null,
          };
      }
    }

    // 2. SPINNING PHASE
    if (phase === 'SPINNING') {
      return {
        whenBadge: 'WAIT...',
        actionText: 'Wait for wheel to stop...',
        isUpgrade: false,
        lockReason: 'SPINNING',
      };
    }

    // 3. IDLE AFTER TODAY'S PRIZE WAS ALREADY CLAIMED (!canSpinToday)
    if (!canSpinToday) {
      if (id === 'respin') {
        return {
          whenBadge: 'EXTRA SPIN',
          actionText: '🔥 Launch Bonus Spin Now!',
          isUpgrade: true,
          lockReason: null,
        };
      }
      return {
        whenBadge: id === 'double' || id === 'shuffle' ? 'NEEDS ACTIVE SPIN' : 'POST-SPIN ONLY',
        actionText: 'Daily prize already claimed',
        isUpgrade: false,
        lockReason: 'DONE TODAY',
      };
    }

    // 4. PRE-SPIN IDLE (canSpinToday === true)
    switch (id) {
      case 'double':
        return {
          whenBadge: 'PRE / POST SPIN',
          actionText: '⚡ Boost all cash to 2x now',
          isUpgrade: true,
          lockReason: null,
        };
      case 'shuffle':
        return {
          whenBadge: 'PRE / POST SPIN',
          actionText: '🔀 Scramble 12 slices now',
          isUpgrade: false,
          lockReason: null,
        };
      case 'nudge_forward':
      case 'nudge_backward':
      case 'invert':
      case 'respin':
        return {
          whenBadge: 'POST-SPIN ONLY',
          actionText: 'Unlocks when wheel stops',
          isUpgrade: false,
          lockReason: 'SPIN FIRST',
        };
    }
  };

  // Current stage index for the 3-step visual indicator
  const currentStep =
    phase === 'TACTICAL'
      ? 2
      : !canSpinToday && phase === 'IDLE'
      ? 3
      : 1;

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-slate-900/80 p-3.5 sm:p-5 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.55)]">
      {/* 3-Step Visual Turn Phase Bar so the user always sees what stage they are in */}
      <div className="mb-3.5 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-950/80 p-1.5 border border-white/10">
        <div
          className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
            currentStep === 1
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.6)]'
              : 'text-slate-500'
          }`}
        >
          <span>① Pre-Spin</span>
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
            currentStep === 2
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.7)] animate-pulse'
              : 'text-slate-500'
          }`}
        >
          <span>② Rig / Claim</span>
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
            currentStep === 3
              ? 'bg-emerald-600/80 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'text-slate-500'
          }`}
        >
          <span>③ Claimed</span>
        </div>
      </div>

      {/* Top Action Banner based on Phase */}
      {phase === 'TACTICAL' ? (
        <div className="mb-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-fuchsia-500/15 to-emerald-500/20 p-3 sm:p-3.5 shadow-[0_0_25px_rgba(251,191,36,0.2)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300">
              <Sparkles className="h-5 w-5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-300">
                  All Power-Ups Unlocked!
                </span>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-200 border border-amber-300/30">
                  Step ②: Rig or Claim
                </span>
              </div>
              <p className="text-xs sm:text-base font-extrabold text-white mt-0.5">
                Landing on:{' '}
                <span className="text-amber-300 underline decoration-amber-400/60 underline-offset-4">
                  {formatSlicePreview(currentSlice)}
                </span>{' '}
                <span className="text-[11px] font-normal text-slate-300">
                  ({currentSlice?.sublabel})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClaimPrize}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.65)] transition-all hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
          >
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            Claim {formatSlicePreview(currentSlice)}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-fuchsia-400" />
              {canSpinToday
                ? 'Step ①: Pre-Spin Prep (Or Spin Now)'
                : 'Step ③: Daily Spin Claimed'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {phase === 'SPINNING'
                ? 'Wheel spinning! Nudge, Invert & Respin will unlock as soon as it stops...'
                : canSpinToday
                ? 'Nudge & Invert unlock AFTER you spin. Double & Shuffle can be used now or after spinning!'
                : 'Your daily spin is complete! Use a RESPIN card below to spin again.'}
            </p>
          </div>
          {phase === 'IDLE' && canSpinToday && (
            <button
              onClick={onSpin}
              className="shrink-0 flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition cursor-pointer touch-manipulation"
            >
              Spin
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 6 Power-Up Slot Cards — Mobile 2x3 Grid, Desktop 3x2 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {POWER_UP_LIST.map((pu) => {
          const count = inventory[pu.id] || 0;
          const currentCost = getPowerUpCost(pu.id, dailyPurchases);
          const phaseReady = isPhaseCompatible(pu.id);
          const isDoubleMaxed = pu.id === 'double' && activeMultiplier >= 2;
          const usable = count > 0 && phaseReady;
          const canQuickBuy =
            count === 0 && !isDoubleMaxed && balance >= currentCost && phase !== 'SPINNING';
          const status = getCardStatusInfo(pu.id);

          return (
            <div
              key={pu.id}
              onClick={() => {
                if (usable) {
                  onUsePowerUp(pu.id);
                } else if (canQuickBuy) {
                  onBuyPowerUp(pu.id);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (usable) onUsePowerUp(pu.id);
                  else if (canQuickBuy) onBuyPowerUp(pu.id);
                }
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 sm:p-3 text-left transition-all duration-200 touch-manipulation select-none ${
                isDoubleMaxed
                  ? 'border-purple-400/60 bg-purple-950/40 cursor-default'
                  : usable
                  ? status.isUpgrade
                    ? 'border-amber-300 border-2 bg-gradient-to-br from-slate-800 via-indigo-950/95 to-amber-950/70 shadow-[0_0_24px_rgba(251,191,36,0.35)] hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                    : 'border-emerald-400/70 border-2 bg-slate-800/95 shadow-[0_0_18px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                  : canQuickBuy
                  ? 'border-dashed border-amber-400/50 bg-slate-900/80 hover:border-amber-400/80 active:scale-95 cursor-pointer'
                  : 'border-white/10 bg-slate-950/75 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Top Timing Tag + Inventory Count */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                    usable
                      ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {usable ? '● UNLOCKED NOW' : status.whenBadge}
                </span>

                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    count > 0
                      ? 'bg-white/15 text-white border border-white/25'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  Owned: {count}
                </span>
              </div>

              {/* Middle Row: Icon + Name */}
              <div className="flex items-center gap-2 min-w-0 my-0.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15"
                  style={{
                    backgroundColor: `${pu.color}25`,
                    color: pu.color,
                    boxShadow: usable ? `0 0 14px ${pu.glowColor}` : 'none',
                  }}
                >
                  <PowerUpIcon id={pu.id} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                    {pu.shortName}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                    {pu.tacticalHint}
                  </div>
                </div>
              </div>

              {/* Bottom Action / Lock Reason Bar */}
              <div
                className={`mt-2 flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[10px] sm:text-[11px] font-extrabold ${
                  isDoubleMaxed
                    ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40'
                    : usable && status.isUpgrade
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm'
                    : usable
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : canQuickBuy
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/35'
                    : count === 0
                    ? 'bg-slate-900 text-slate-500'
                    : 'bg-slate-900/90 text-slate-400 border border-white/5'
                }`}
              >
                <span className="truncate">
                  {count === 0 && !canQuickBuy ? (
                    <>
                      Cost: <span className="text-rose-400 font-black">{formatCost(currentCost)}</span>
                    </>
                  ) : canQuickBuy ? (
                    <>
                      Buy <span className="text-rose-400 font-black">{formatCost(currentCost)}</span>
                    </>
                  ) : (
                    status.actionText
                  )}
                </span>

                {usable ? (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider shrink-0">
                    <Play className="h-2.5 w-2.5 fill-current" />
                    USE
                  </span>
                ) : canQuickBuy ? (
                  <span className="ml-1 text-[9px] font-black uppercase tracking-wider text-amber-300 shrink-0">
                    +BUY
                  </span>
                ) : status.lockReason === 'SPIN FIRST' ? (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300/80 shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    SPIN 1ST
                  </span>
                ) : (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500 shrink-0">
                    <Lock className="h-2.5 w-2.5" />
                    {status.lockReason || 'LOCKED'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Quick Link to Shop */}
      {onOpenMobileShop && (
        <div className="mt-3 flex lg:hidden items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          <span className="text-[11px]">
            Tap any <strong className="text-amber-300">+BUY</strong> card to restock, or open the Shop!
          </span>
          <button
            onClick={onOpenMobileShop}
            className="shrink-0 ml-2 flex items-center gap-1 rounded-lg bg-fuchsia-600/30 border border-fuchsia-400/40 px-2.5 py-1 text-[11px] font-black text-fuchsia-200 active:scale-95 cursor-pointer touch-manipulation"
          >
            <ShoppingBag className="h-3 w-3" />
            Shop
          </button>
        </div>
      )}
    </div>
  );
};
