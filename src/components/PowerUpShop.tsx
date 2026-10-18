import React, { useEffect, useState } from 'react';
import { ShoppingBag, History, Coins, Sparkles, Check, TrendingUp, Award } from 'lucide-react';
import { PowerUpId, SpinHistoryEntry } from '../types/game';
import { getPowerUpCost, POWER_UP_LIST, POWER_UPS } from '../constants/gameData';
import { PowerUpIcon } from './PowerUpIcon';
import { formatCash, formatCost } from '../utils/wheelMath';

interface PowerUpShopProps {
  balance: number;
  inventory: Record<PowerUpId, number>;
  respinPurchases: number;
  doublePurchases: number;
  history: SpinHistoryEntry[];
  totalSpins: number;
  biggestWin: number;
  lifetimeEarnings: number;
  externalTab?: 'shop' | 'history';
  onTabChange?: (tab: 'shop' | 'history') => void;
  onBuyPowerUp: (id: PowerUpId) => void;
}

export const PowerUpShop: React.FC<PowerUpShopProps> = ({
  balance,
  inventory,
  respinPurchases,
  doublePurchases,
  history,
  totalSpins,
  biggestWin,
  lifetimeEarnings,
  externalTab,
  onTabChange,
  onBuyPowerUp,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'history'>(externalTab || 'shop');
  const [justBoughtId, setJustBoughtId] = useState<PowerUpId | null>(null);

  useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  const handleSwitchTab = (tab: 'shop' | 'history') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const handleBuy = (id: PowerUpId) => {
    onBuyPowerUp(id);
    setJustBoughtId(id);
    setTimeout(() => {
      setJustBoughtId((prev) => (prev === id ? null : prev));
    }, 650);
  };

  return (
    <div className="flex flex-col rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.55)] overflow-hidden h-full">
      {/* Header Tabs */}
      <div className="flex border-b border-white/10 bg-slate-950/60 p-2 gap-2">
        <button
          onClick={() => handleSwitchTab('shop')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation ${
            activeTab === 'shop'
              ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Power-Up Market
        </button>
        <button
          onClick={() => handleSwitchTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="h-4 w-4" />
          Vault Log ({history.length})
        </button>
      </div>

      {activeTab === 'shop' ? (
        <div className="flex flex-col flex-1 p-3.5 sm:p-5 justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Rig The Wheel In Your Favor
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Stockpile tactical gadgets in local storage and deploy them on any spin.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {POWER_UP_LIST.map((pu) => {
                const currentCost = getPowerUpCost(pu.id, respinPurchases, doublePurchases);
                const canAfford = balance >= currentCost;
                const owned = inventory[pu.id] || 0;
                const isBoughtAnim = justBoughtId === pu.id;

                return (
                  <div
                    key={pu.id}
                    className={`group relative flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border p-2.5 sm:p-3 transition-all duration-200 ${
                      isBoughtAnim
                        ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]'
                        : canAfford
                        ? 'border-white/10 bg-slate-800/65 hover:border-white/25 hover:bg-slate-800/90'
                        : 'border-white/5 bg-slate-950/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 mt-0.5"
                        style={{
                          backgroundColor: `${pu.color}20`,
                          color: pu.color,
                          boxShadow: `0 0 15px ${pu.glowColor}`,
                        }}
                      >
                        <PowerUpIcon id={pu.id} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white">
                            {pu.name}
                          </span>
                          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-300">
                            Owned: {owned}
                          </span>
                          {(pu.id === 'respin' || pu.id === 'double') && (
                            <span className="rounded-md bg-pink-500/20 border border-pink-400/30 px-1.5 py-0.5 text-[9px] font-black text-pink-300">
                              {pu.id === 'respin' ? '1.1×' : '1.25×'} Scale (Bought:{' '}
                              {pu.id === 'respin' ? respinPurchases : doublePurchases})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-snug mt-0.5">
                          {pu.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => canAfford && handleBuy(pu.id)}
                      disabled={!canAfford}
                      className={`shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[76px] sm:min-w-[82px] font-black transition-all touch-manipulation ${
                        isBoughtAnim
                          ? 'bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.7)]'
                          : canAfford
                          ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 shadow-[0_4px_15px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {isBoughtAnim ? (
                        <span className="flex items-center gap-1 text-xs uppercase">
                          <Check className="h-4 w-4 stroke-[3]" /> +1
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-xs font-black tracking-tight ${
                              canAfford ? 'text-red-700' : 'text-rose-400/70'
                            }`}
                          >
                            {formatCost(currentCost)}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider opacity-80">
                            {canAfford ? 'BUY' : 'NEED $'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Strategy Callout */}
          <div className="rounded-2xl border border-fuchsia-500/25 bg-gradient-to-r from-fuchsia-950/40 via-indigo-950/40 to-slate-900/40 p-3 text-xs text-slate-300">
            <div className="font-black text-fuchsia-300 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Daily Random Board Strategy
            </div>
            Every day generates a brand-new wheel with a randomized{' '}
            <strong className="text-amber-300">$400–$750 Jackpot</strong>. Because{' '}
            <strong className="text-pink-300">Respin</strong> increases in price by{' '}
            <strong className="text-pink-300">1.1×</strong> each time you buy one, use{' '}
            <strong className="text-amber-300">Nudge ±1</strong> and{' '}
            <strong className="text-cyan-300">Invert 180°</strong> wisely!
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 p-3.5 sm:p-5 gap-4">
          {/* Lifetime Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-2.5 sm:p-3 text-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Spins
              </div>
              <div className="mt-1 text-base sm:text-lg font-black text-white">{totalSpins}</div>
            </div>
            <div className="rounded-2xl border border-amber-400/25 bg-amber-950/20 p-2.5 sm:p-3 text-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-300/80 flex items-center justify-center gap-1">
                <Award className="h-3 w-3" /> Best Win
              </div>
              <div className="mt-1 text-base sm:text-lg font-black text-amber-300">
                {formatCash(biggestWin)}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-2.5 sm:p-3 text-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" /> Lifetime
              </div>
              <div className="mt-1 text-base sm:text-lg font-black text-emerald-300">
                {formatCash(lifetimeEarnings)}
              </div>
            </div>
          </div>

          {/* Spin Log List */}
          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <History className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm font-bold text-slate-400">No Spins Recorded Yet</p>
                <p className="text-xs mt-1">
                  Spin the wheel and claim your first prize to start your vault log!
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/50 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {item.cashWon > 0 ? formatCash(item.cashWon) : item.label}
                      </span>
                      {item.multiplierUsed > 1 && (
                        <span className="rounded bg-purple-500/30 border border-purple-400/40 px-1.5 py-0.5 text-[10px] font-black text-purple-200">
                          {item.multiplierUsed}X
                        </span>
                      )}
                      {item.tier === 'jackpot' && (
                        <span className="rounded bg-amber-400/25 border border-amber-300/50 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                          JACKPOT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>Day: {item.dateStr}</span>
                      {item.powerUpsUsed.length > 0 && (
                        <span className="text-fuchsia-300">
                          • Used: {item.powerUpsUsed.map((p) => POWER_UPS[p].shortName).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.powerUpsWon.length > 0 ? (
                    <span className="rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/30 px-2.5 py-1 text-xs font-extrabold text-fuchsia-200">
                      +{item.powerUpsWon.length} Power-Up
                    </span>
                  ) : (
                    <span className="text-sm font-black text-emerald-400">
                      +{formatCash(item.cashWon)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
