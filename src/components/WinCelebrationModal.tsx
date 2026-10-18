import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Flame, ArrowRight, Gift, Zap } from 'lucide-react';
import { PowerUpId, WheelSlice } from '../types/game';
import { POWER_UPS } from '../constants/gameData';
import { PowerUpIcon } from './PowerUpIcon';
import { formatCash } from '../utils/wheelMath';
import { soundEngine } from '../utils/sound';

interface WinCelebrationModalProps {
  slice: WheelSlice;
  multiplier: number;
  streak: number;
  streakBonusCash: number;
  powerUpsUsed: PowerUpId[];
  onClose: () => void;
}

export const WinCelebrationModal: React.FC<WinCelebrationModalProps> = ({
  slice,
  multiplier,
  streak,
  streakBonusCash,
  powerUpsUsed,
  onClose,
}) => {
  const baseCash = slice.type === 'cash' ? (slice.cashValue || 0) * multiplier : 0;
  const totalCashWon = baseCash + streakBonusCash;

  const [displayedCash, setDisplayedCash] = useState(0);

  useEffect(() => {
    if (totalCashWon <= 0) return;

    const duration = slice.tier === 'jackpot' ? 1500 : 950;
    const steps = 28;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(totalCashWon * eased);
      setDisplayedCash(nextVal);
      if (currentStep % 2 === 0) {
        soundEngine.playCoinTick();
      }
      if (currentStep >= steps) {
        setDisplayedCash(totalCashWon);
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [totalCashWon, slice.tier]);

  const isJackpot = slice.tier === 'jackpot' || baseCash >= 400;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Rotating Sunburst Rays behind the card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className={`h-[750px] w-[750px] rounded-full opacity-35 blur-2xl animate-spin ${
            isJackpot
              ? 'bg-[conic-gradient(from_0deg,#fbbf24,transparent,#ec4899,transparent,#fbbf24,transparent,#a855f7,transparent)]'
              : 'bg-[conic-gradient(from_0deg,#38bdf8,transparent,#a855f7,transparent,#10b981,transparent)]'
          }`}
          style={{ animationDuration: '10s' }}
        />
      </div>

      {/* Celebration Card */}
      <div
        className={`relative z-10 w-full max-w-md rounded-3xl border-2 p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(251,191,36,0.45)] transition-all transform scale-100 ${
          isJackpot
            ? 'border-amber-300 bg-gradient-to-b from-amber-950/95 via-slate-900/95 to-fuchsia-950/95'
            : 'border-fuchsia-400/60 bg-gradient-to-b from-indigo-950/95 via-slate-900/95 to-slate-950/95'
        }`}
      >
        {/* Top Trophy / Crown Badge */}
        <div className="mx-auto -mt-14 mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-[0_0_40px_rgba(251,191,36,0.8)] animate-bounce">
          {slice.type === 'powerup' ? (
            <Gift className="h-10 w-10 text-slate-950 stroke-[2.5]" />
          ) : (
            <Trophy className="h-10 w-10 text-slate-950 stroke-[2.5]" />
          )}
        </div>

        {/* Tier Headline */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-amber-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          {isJackpot
            ? 'MEGA JACKPOT PAYDAY!!'
            : slice.tier === 'big'
            ? 'HIGH-ROLLER SCORE!'
            : slice.type === 'powerup'
            ? 'TACTICAL SUPPLY DROP!'
            : 'DAILY WINNER!'}
          <Sparkles className="h-3.5 w-3.5" />
        </div>

        {/* Main Prize Readout */}
        {slice.type === 'cash' ? (
          <div className="my-3">
            <div className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 drop-shadow-[0_4px_20px_rgba(251,191,36,0.6)]">
              +{formatCash(displayedCash)}
            </div>
            {multiplier > 1 && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-purple-500/30 border border-purple-400/50 px-3 py-1 text-xs font-black uppercase text-purple-200">
                <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                Includes {multiplier}X Overdrive Multiplier!
              </div>
            )}
          </div>
        ) : (
          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              {slice.label}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300 mt-1">
              Added to your Power-Up Inventory!
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(slice.powerUpReward || []).map((puId, idx) => {
                const pu = POWER_UPS[puId];
                return (
                  <div
                    key={`${puId}-${idx}`}
                    className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5"
                  >
                    <span style={{ color: pu.color }}>
                      <PowerUpIcon id={puId} className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-black text-white">
                      +1 {pu.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Streak Bonus Breakdown */}
        {streakBonusCash > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-orange-400/30 bg-orange-500/15 px-4 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 font-extrabold text-orange-200">
              <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />
              {streak}-Day Streak Bonus
            </span>
            <span className="font-black text-emerald-300">
              +{formatCash(streakBonusCash)}
            </span>
          </div>
        )}

        {/* Tactical Heist Summary if player used Power-ups on this spin */}
        {powerUpsUsed.length > 0 && (
          <div className="mt-3 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-950/40 px-4 py-2.5 text-xs text-fuchsia-200">
            <span className="font-black uppercase tracking-wider text-fuchsia-300 block mb-1">
              Tactical Rigging Executed:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {powerUpsUsed.map((id, index) => (
                <span
                  key={`${id}-${index}`}
                  className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white"
                >
                  <PowerUpIcon id={id} className="h-3 w-3" />
                  {POWER_UPS[id].shortName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collect Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 py-4 px-6 text-base font-black uppercase tracking-wider text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.7)] transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95 cursor-pointer"
        >
          Stash In Vault
          <ArrowRight className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
