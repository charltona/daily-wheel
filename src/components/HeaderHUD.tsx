import React, { useEffect, useState } from 'react';
import {
  Coins,
  Flame,
  Clock,
  FastForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Unlock,
  Wrench,
} from 'lucide-react';
import { formatCash, getCountdownToMidnight } from '../utils/wheelMath';

interface HeaderHUDProps {
  balance: number;
  streak: number;
  canSpinToday: boolean;
  simulatedDayOffset: number;
  soundEnabled: boolean;
  onResetDailySpin: () => void;
  onAdvanceDay: () => void;
  onAddDebugCash: () => void;
  onResetMoney: () => void;
  onToggleSound: () => void;
  onResetSave: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  balance,
  streak,
  canSpinToday,
  simulatedDayOffset,
  soundEnabled,
  onResetDailySpin,
  onAdvanceDay,
  onAddDebugCash,
  onResetMoney,
  onToggleSound,
  onResetSave,
}) => {
  const [countdown, setCountdown] = useState(getCountdownToMidnight());
  const [balanceBounce, setBalanceBounce] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownToMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setBalanceBounce(true);
    const t = setTimeout(() => setBalanceBounce(false), 380);
    return () => clearTimeout(t);
  }, [balance]);

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 sm:py-2.5">
        {/* Main Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Game Logo & Streak */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-fuchsia-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Sparkles className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-sm sm:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-fuchsia-300">
                  SPIN &amp; WIN
                </h1>
                {simulatedDayOffset > 0 && (
                  <span className="shrink-0 rounded bg-indigo-500/25 border border-indigo-400/40 px-1.5 py-0.5 text-[9px] font-black text-indigo-200">
                    Day +{simulatedDayOffset}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-0.5 font-bold text-orange-300">
                  <Flame className="h-3 w-3 text-orange-400 fill-orange-400" />
                  {streak}d Streak
                </span>
                <span>•</span>
                {canSpinToday ? (
                  <span className="text-emerald-400 font-extrabold uppercase text-[10px]">
                    Spin Ready!
                  </span>
                ) : (
                  <span className="text-amber-300/90 font-mono text-[10px]">
                    <Clock className="inline h-2.5 w-2.5 mr-0.5 -mt-0.5" />
                    {countdown}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cash Balance Vault + Audio & Full Reset */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Cash Balance Pill */}
            <div
              className={`flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-emerald-950/80 px-2.5 py-1 sm:px-3.5 sm:py-1.5 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-transform duration-200 ${
                balanceBounce ? 'scale-105 border-emerald-300' : 'scale-100'
              }`}
            >
              <Coins className="hidden xs:block h-4 w-4 text-emerald-300 shrink-0" />
              <div>
                <div className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/80 leading-none">
                  Cash Vault
                </div>
                <div className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  {formatCash(balance)}
                </div>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 hover:border-white/25 hover:text-white active:scale-95 transition cursor-pointer touch-manipulation"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-amber-300" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {/* Full Reset Save Data */}
            <button
              onClick={onResetSave}
              title="Wipe All Save Data"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-slate-400 hover:border-rose-500/40 hover:text-rose-300 active:scale-95 transition cursor-pointer touch-manipulation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Debug & Testing Toolbar (Only active in development mode) */}
        {import.meta.env.DEV && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-950/35 px-2.5 py-1.5">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-300">
              <Wrench className="h-3 w-3 text-indigo-400 shrink-0" />
              <span>Dev Tools:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 1. Reset Today's Spin (Same Wheel) */}
              <button
                onClick={onResetDailySpin}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black transition-all cursor-pointer touch-manipulation ${
                  !canSpinToday
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.6)] hover:brightness-110 active:scale-95'
                    : 'bg-white/10 text-emerald-300 hover:bg-white/20 active:scale-95 border border-emerald-400/30'
                }`}
              >
                <Unlock className="h-3 w-3" />
                <span>Reset Spin</span>
              </button>

              {/* 2. Next Day (Randomizes New Daily Wheel + Unlocks Spin) */}
              <button
                onClick={onAdvanceDay}
                className="flex items-center gap-1 rounded-lg bg-amber-400/20 border border-amber-400/40 px-2.5 py-1 text-[11px] font-black text-amber-200 hover:bg-amber-400/30 active:scale-95 transition cursor-pointer touch-manipulation"
              >
                <FastForward className="h-3 w-3 text-amber-300" />
                <span>Next Day</span>
              </button>

              {/* 3. +$500 Test Cash */}
              <button
                onClick={onAddDebugCash}
                className="flex items-center gap-1 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 px-2 py-1 text-[11px] font-black text-fuchsia-200 hover:bg-fuchsia-500/30 active:scale-95 transition cursor-pointer touch-manipulation"
              >
                <span>+$500</span>
              </button>

              {/* 4. Reset Money to $220 */}
              <button
                onClick={onResetMoney}
                className="flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-400/40 px-2 py-1 text-[11px] font-black text-rose-200 hover:bg-rose-500/30 active:scale-95 transition cursor-pointer touch-manipulation"
              >
                <span>Reset $</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
