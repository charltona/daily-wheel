import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Disc3, ShoppingBag, Trophy } from 'lucide-react';
import {
  GamePhase,
  PlayerState,
  PowerUpId,
  SpinHistoryEntry,
  WheelSlice,
} from './types/game';
import {
  getPowerUpCost,
  INITIAL_PLAYER_STATE,
  POWER_UPS,
} from './constants/gameData';
import {
  createSuspenseSpinPlan,
  formatCash,
  formatCost,
  getEffectiveDateString,
  getSliceIndexAtPointer,
  getYesterdayDateString,
  pickWeightedSliceIndex,
  SLICE_ANGLE,
  SLICE_COUNT,
} from './utils/wheelMath';
import { generateDailyWheel } from './utils/dailyWheelGenerator';
import { soundEngine } from './utils/sound';
import { firePowerUpBurst, fireWinConfetti } from './utils/confetti';
import { HeaderHUD } from './components/HeaderHUD';
import { ShuffleStage, WheelStage } from './components/WheelStage';
import { TacticalDock } from './components/TacticalDock';
import { PowerUpShop } from './components/PowerUpShop';
import { WinCelebrationModal } from './components/WinCelebrationModal';

const STORAGE_KEY = 'spin_and_win_royale_v1';

interface DopamineToast {
  id: number;
  text: string;
  subtext?: string;
  color: string;
}

type MobileSection = 'wheel' | 'shop' | 'history';

export function App() {
  // Persistent Player State in localStorage
  const [player, setPlayer] = useState<PlayerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PLAYER_STATE,
          ...parsed,
          respinPurchases: parsed.respinPurchases ?? 0,
          inventory: {
            ...INITIAL_PLAYER_STATE.inventory,
            ...(parsed.inventory || {}),
          },
        };
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_PLAYER_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    } catch {
      // ignore storage errors
    }
    soundEngine.setEnabled(player.soundEnabled);
  }, [player]);

  const effectiveToday = getEffectiveDateString(player.simulatedDayOffset);
  const dailyBoard = useMemo(() => generateDailyWheel(effectiveToday), [effectiveToday]);

  // Wheel & Turn State
  const [slices, setSlices] = useState<WheelSlice[]>(() => dailyBoard.slices);
  const [rotation, setRotation] = useState<number>(0);
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [activeMultiplier, setActiveMultiplier] = useState<number>(1);
  const [powerUpsUsedThisTurn, setPowerUpsUsedThisTurn] = useState<PowerUpId[]>([]);
  const [pegKick, setPegKick] = useState<boolean>(false);
  const [shuffleStage, setShuffleStage] = useState<ShuffleStage>('idle');
  const [isInverting, setIsInverting] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [toasts, setToasts] = useState<DopamineToast[]>([]);
  const [lastClaimedBonus, setLastClaimedBonus] = useState<number>(0);
  const [mobileSection, setMobileSection] = useState<MobileSection>('wheel');

  // Whenever the calendar day changes (or simulated day advances), load that day's fresh randomized wheel!
  useEffect(() => {
    setSlices(dailyBoard.slices);
  }, [dailyBoard]);

  const rotationRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastSliceIdxRef = useRef<number>(0);
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isActionPending, setIsActionPending] = useState<boolean>(false);

  const canSpinToday = player.lastSpinDate !== effectiveToday;
  const activeSliceIndex = getSliceIndexAtPointer(rotation);

  const pushToast = useCallback((text: string, subtext?: string, color: string = '#fbbf24') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, text, subtext, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  /**
   * Smoothly scrolls the user back up to the wheel if they are scrolled down,
   * waits for the wheel to be in full view, and then runs the action so the user
   * sees the entire animation happen!
   */
  const scrollToWheelAndRun = useCallback((action: () => void) => {
    setMobileSection('wheel');
    const needsScroll = typeof window !== 'undefined' && window.scrollY > 45;
    if (needsScroll) {
      setIsActionPending(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setIsActionPending(false);
        action();
      }, 420);
    } else {
      action();
    }
  }, []);

  // Smooth RAF-driven rotation animator (for full spins, nudges, and 180° inversions)
  const animateWheelTo = useCallback(
    (
      targetRotation: number,
      durationMs: number,
      easingFn: (t: number) => number,
      onComplete?: () => void
    ) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const startRotation = rotationRef.current;
      const delta = targetRotation - startRotation;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easingFn(progress);
        const currentRot = startRotation + delta * eased;

        rotationRef.current = currentRot;
        setRotation(currentRot);

        const currentSliceIdx = getSliceIndexAtPointer(currentRot);
        if (currentSliceIdx !== lastSliceIdxRef.current) {
          lastSliceIdxRef.current = currentSliceIdx;
          const remainingRatio = 1 - progress;
          soundEngine.playPegTick(remainingRatio);
          setPegKick(true);
          setTimeout(() => setPegKick(false), 65);
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          rotationRef.current = targetRotation;
          setRotation(targetRotation);
          animFrameRef.current = null;
          if (onComplete) onComplete();
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Trigger a full wheel spin with randomized suspense easing
  const startSpin = useCallback(
    (isRespin: boolean = false) => {
      if (phase === 'SPINNING' || isActionPending || shuffleStage !== 'idle') return;
      if (!isRespin && !canSpinToday) return;

      scrollToWheelAndRun(() => {
        setPhase('SPINNING');
        soundEngine.playSpinLaunch();

        const chosenSlice = pickWeightedSliceIndex(slices);
        const plan = createSuspenseSpinPlan(rotationRef.current, chosenSlice);

        // Mark daily spin used if this was the free daily spin
        if (!isRespin) {
          const yesterday = getYesterdayDateString(player.simulatedDayOffset);
          setPlayer((prev) => {
            const isConsecutive =
              prev.lastStreakDate === yesterday || prev.lastStreakDate === effectiveToday;
            const nextStreak =
              prev.lastStreakDate === effectiveToday
                ? prev.streak
                : isConsecutive
                ? prev.streak + 1
                : 1;
            return {
              ...prev,
              lastSpinDate: effectiveToday,
              lastStreakDate: effectiveToday,
              streak: nextStreak,
            };
          });
        }

        animateWheelTo(plan.targetRotation, plan.durationMs, plan.easingFn, () => {
          soundEngine.playWheelStop();
          setPhase('TACTICAL');
          const landedIdx = getSliceIndexAtPointer(rotationRef.current);
          const landed = slices[landedIdx];
          pushToast(
            `LANDED ON ${landed.label}!`,
            'Claim your prize or deploy a Tactical Power-Up!',
            landed.accentColor
          );
        });
      });
    },
    [
      phase,
      isActionPending,
      shuffleStage,
      canSpinToday,
      scrollToWheelAndRun,
      player.simulatedDayOffset,
      effectiveToday,
      animateWheelTo,
      slices,
      pushToast,
    ]
  );

  // Execute a Power-Up from inventory (scrolls up to the wheel first so the user watches the action!)
  const handleUsePowerUp = useCallback(
    (id: PowerUpId) => {
      const count = player.inventory[id] || 0;
      if (count <= 0) return;
      if (phase === 'SPINNING' || phase === 'CELEBRATING') return;
      if (isActionPending || shuffleStage !== 'idle' || isInverting) return;
      // Strict cap: Double 2x can only be used ONCE per spin!
      if (id === 'double' && activeMultiplier >= 2) return;
      // Strict guard: If today's spin is already claimed, ONLY Respin can be used!
      if (phase === 'IDLE' && !canSpinToday && id !== 'respin') return;
      // Strict guard: Pre-spin only allows Double and Shuffle!
      if (phase === 'IDLE' && canSpinToday && id !== 'double' && id !== 'shuffle') return;

      const def = POWER_UPS[id];

      // Deduct inventory immediately so button state updates right away
      setPlayer((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [id]: Math.max(0, (prev.inventory[id] || 0) - 1),
        },
      }));
      setPowerUpsUsedThisTurn((prev) => [...prev, id]);

      if (id === 'respin') {
        scrollToWheelAndRun(() => {
          soundEngine.playPowerUp('respin');
          firePowerUpBurst(def.color);
          pushToast(
            '🔥 HIGH-ROLLER RESPIN!',
            activeMultiplier > 1
              ? `Spinning again with ${activeMultiplier}x Multiplier locked!`
              : 'Launching fresh spin!',
            '#ec4899'
          );
          startSpin(true);
        });
        return;
      }

      scrollToWheelAndRun(() => {
        soundEngine.playPowerUp(id);
        firePowerUpBurst(def.color);

        if (id === 'double') {
          setActiveMultiplier(2);
          pushToast(
            '⚡ 2X CASH OVERDRIVE!',
            'All monetary values on the wheel are doubled for this spin!',
            '#a855f7'
          );
          return;
        }

        if (id === 'shuffle') {
          // Stage 1 (0..340ms): All 12 wedges unlatch and pop high up out of the board sockets
          setShuffleStage('lifting');

          // Stage 2 (340..800ms): While hovering above the board, wedges orbit to their new slots
          setTimeout(() => {
            setShuffleStage('swapping');
            setSlices((prev) => {
              // Pick which slice lands under the pointer using our weighted rarity table
              // (excluding the current active slice so it's guaranteed to change!)
              const pickedSourceIdx = pickWeightedSliceIndex(prev, activeSliceIndex);
              const pickedSlice = prev[pickedSourceIdx];
              const remaining = prev.filter((_, idx) => idx !== pickedSourceIdx);

              // Shuffle the remaining 11 slices into the other 11 board positions
              for (let i = remaining.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
              }

              const nextSlices: WheelSlice[] = [];
              let remCursor = 0;
              for (let slot = 0; slot < prev.length; slot++) {
                if (slot === activeSliceIndex) {
                  nextSlices.push(pickedSlice);
                } else {
                  nextSlices.push(remaining[remCursor++]);
                }
              }
              return nextSlices;
            });
          }, 340);

          // Stage 3 (800..1720ms): Wedges slam down one by one in a heavy staggered cascade!
          setTimeout(() => {
            setShuffleStage('slamming');
          }, 800);

          setTimeout(() => {
            setShuffleStage('idle');
            pushToast('🔀 CHAOS SHUFFLE!', 'All 12 wedges slammed into new slots!', '#10b981');
          }, 1720);
          return;
        }

        // Helper to align target slice dead-center under the pointer
        const getCenteredTargetRotation = (targetSliceIdx: number, direction: 1 | -1 | 180) => {
          const desiredMod = (360 - targetSliceIdx * SLICE_ANGLE) % 360;
          const currentMod = ((rotationRef.current % 360) + 360) % 360;
          if (direction === 1) {
            let diff = desiredMod - currentMod;
            if (diff <= 5) diff += 360;
            return rotationRef.current + diff;
          }
          if (direction === -1) {
            let diff = currentMod - desiredMod;
            if (diff <= 5) diff += 360;
            return rotationRef.current - diff;
          }
          // 180° flip
          let diff = desiredMod - currentMod;
          if (diff <= 90) diff += 360;
          return rotationRef.current + diff;
        };

        if (id === 'nudge_forward') {
          const nextSliceIdx = (activeSliceIndex - 1 + SLICE_COUNT) % SLICE_COUNT;
          const target = getCenteredTargetRotation(nextSliceIdx, 1);
          const easeOutBack = (t: number) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
          };
          animateWheelTo(target, 480, easeOutBack, () => {
            const landed = slices[getSliceIndexAtPointer(rotationRef.current)];
            pushToast(`🎯 NUDGED +1 SPACE!`, `New target: ${landed.label}`, '#f59e0b');
          });
          return;
        }

        if (id === 'nudge_backward') {
          const prevSliceIdx = (activeSliceIndex + 1) % SLICE_COUNT;
          const target = getCenteredTargetRotation(prevSliceIdx, -1);
          const easeOutBack = (t: number) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
          };
          animateWheelTo(target, 480, easeOutBack, () => {
            const landed = slices[getSliceIndexAtPointer(rotationRef.current)];
            pushToast(`🎯 NUDGED -1 SPACE!`, `New target: ${landed.label}`, '#fb7185');
          });
          return;
        }

        if (id === 'invert') {
          setIsInverting(true);
          const oppositeSliceIdx = (activeSliceIndex + 6) % SLICE_COUNT;
          const target = getCenteredTargetRotation(oppositeSliceIdx, 180);
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          animateWheelTo(target, 740, easeInOutCubic, () => {
            setIsInverting(false);
            const landed = slices[getSliceIndexAtPointer(rotationRef.current)];
            pushToast(`🔄 WHEEL INVERTED 180°!`, `Flipped across to ${landed.label}!`, '#06b6d4');
          });
          return;
        }
      });
    },
    [
      player.inventory,
      phase,
      isActionPending,
      shuffleStage,
      isInverting,
      activeMultiplier,
      canSpinToday,
      scrollToWheelAndRun,
      activeSliceIndex,
      animateWheelTo,
      slices,
      pushToast,
      startSpin,
    ]
  );

  // Claim the prize currently under the pointer!
  const handleClaimPrize = useCallback(() => {
    if (phase !== 'TACTICAL') return;

    const winningSlice = slices[activeSliceIndex];
    if (!winningSlice) return;

    const baseCash =
      winningSlice.type === 'cash'
        ? (winningSlice.cashValue || 0) * activeMultiplier
        : 0;

    // Daily streak bonus only applies ONCE per day (on your first claimed spin of the day, not extra respins!)
    const alreadyClaimedDailyBonusToday =
      player.lastStreakBonusClaimDate === effectiveToday;
    const streakBonus =
      !alreadyClaimedDailyBonusToday && player.streak > 1
        ? Math.min(player.streak * 15, 150)
        : 0;

    const totalCash = baseCash + streakBonus;
    const powerUpsWon = winningSlice.powerUpReward || [];

    const effectiveTier =
      winningSlice.tier === 'jackpot' || totalCash >= 400
        ? 'jackpot'
        : totalCash >= 175
        ? 'big'
        : winningSlice.tier;

    setLastClaimedBonus(streakBonus);
    setPhase('CELEBRATING');

    soundEngine.playWinFanfare(effectiveTier);
    fireWinConfetti(effectiveTier);

    if (effectiveTier === 'jackpot' || effectiveTier === 'big') {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 650);
    }

    const historyEntry: SpinHistoryEntry = {
      id: `spin-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: effectiveToday,
      label: winningSlice.label,
      cashWon: totalCash,
      powerUpsWon,
      multiplierUsed: activeMultiplier,
      powerUpsUsed: [...powerUpsUsedThisTurn],
      tier: effectiveTier,
    };

    setPlayer((prev) => {
      const updatedInventory = { ...prev.inventory };
      powerUpsWon.forEach((puId) => {
        updatedInventory[puId] = (updatedInventory[puId] || 0) + 1;
      });

      return {
        ...prev,
        balance: prev.balance + totalCash,
        inventory: updatedInventory,
        lastStreakBonusClaimDate: effectiveToday,
        totalSpins: prev.totalSpins + 1,
        biggestWin: Math.max(prev.biggestWin, totalCash),
        lifetimeEarnings: prev.lifetimeEarnings + totalCash,
        history: [historyEntry, ...prev.history].slice(0, 50),
      };
    });
  }, [
    phase,
    slices,
    activeSliceIndex,
    activeMultiplier,
    player.lastStreakBonusClaimDate,
    player.streak,
    effectiveToday,
    powerUpsUsedThisTurn,
  ]);

  const handleCloseCelebration = () => {
    setPhase('IDLE');
    setActiveMultiplier(1);
    setPowerUpsUsedThisTurn([]);
  };

  // Buy a Power-Up from the shop or quick-buy slot (scales Respin and Double cost by 1.25x each buy)
  const handleBuyPowerUp = (id: PowerUpId) => {
    const def = POWER_UPS[id];
    const currentCost = getPowerUpCost(
      id,
      player.respinPurchases || 0,
      player.doublePurchases || 0
    );
    if (player.balance < currentCost) return;

    soundEngine.playPurchase();
    setPlayer((prev) => {
      const nextRespinPurchases =
        id === 'respin' ? (prev.respinPurchases || 0) + 1 : prev.respinPurchases || 0;
      const nextDoublePurchases =
        id === 'double' ? (prev.doublePurchases || 0) + 1 : prev.doublePurchases || 0;
      return {
        ...prev,
        balance: prev.balance - currentCost,
        respinPurchases: nextRespinPurchases,
        doublePurchases: nextDoublePurchases,
        inventory: {
          ...prev.inventory,
          [id]: (prev.inventory[id] || 0) + 1,
        },
      };
    });

    const nextCostText =
      id === 'respin'
        ? ` • Next Respin: ${formatCost(getPowerUpCost('respin', (player.respinPurchases || 0) + 1, player.doublePurchases || 0))}`
        : id === 'double'
        ? ` • Next Double: ${formatCost(getPowerUpCost('double', player.respinPurchases || 0, (player.doublePurchases || 0) + 1))}`
        : '';

    pushToast(
      `+1 ${def.shortName.toUpperCase()} (${formatCost(currentCost)})`,
      `Deducted ${formatCost(currentCost)} from Vault${nextCostText}`,
      '#f43f5e'
    );
  };

  // Debug Reset Today's Spin (unlocks today's spin without changing the day or wheel!)
  const handleResetDailySpin = () => {
    if (phase === 'SPINNING') return;
    soundEngine.playPurchase();
    setPlayer((prev) => ({
      ...prev,
      lastSpinDate: null,
      lastStreakBonusClaimDate: null,
    }));
    if (phase === 'CELEBRATING' || phase === 'TACTICAL') {
      setPhase('IDLE');
      setActiveMultiplier(1);
      setPowerUpsUsedThisTurn([]);
    }
    pushToast(
      '🔓 TODAY’S SPIN RESET!',
      'Daily cooldown cleared on the current wheel!',
      '#34d399'
    );
  };

  // Advance simulated day by +1 -> generates a brand-new daily wheel & unlocks today's spin!
  const handleAdvanceDay = () => {
    if (phase === 'SPINNING' || shuffleStage !== 'idle') return;
    soundEngine.playPowerUp('shuffle');
    const nextOffset = player.simulatedDayOffset + 1;
    const nextDateStr = getEffectiveDateString(nextOffset);
    const nextBoard = generateDailyWheel(nextDateStr);

    setShuffleStage('lifting');
    setTimeout(() => {
      setShuffleStage('swapping');
      setPlayer((prev) => ({
        ...prev,
        simulatedDayOffset: nextOffset,
      }));
    }, 240);
    setTimeout(() => {
      setShuffleStage('slamming');
    }, 580);
    setTimeout(() => {
      setShuffleStage('idle');
    }, 1240);

    if (phase === 'CELEBRATING' || phase === 'TACTICAL') {
      setPhase('IDLE');
      setActiveMultiplier(1);
      setPowerUpsUsedThisTurn([]);
    }

    pushToast(
      `🎲 NEW DAY: ${nextBoard.boardName.toUpperCase()}!`,
      `Wheel randomized! Top Jackpot: ${formatCash(nextBoard.topJackpot)}`,
      '#fbbf24'
    );
  };

  // Debug Add +$500 Test Cash
  const handleAddDebugCash = () => {
    soundEngine.playPurchase();
    setPlayer((prev) => ({
      ...prev,
      balance: prev.balance + 500,
    }));
    pushToast('💰 +$500 TEST CASH', 'Added to your Cash Vault!', '#a855f7');
  };

  // Debug Reset Money, Vault Log & Shop Scaling back to starter values ($220)
  const handleResetMoney = () => {
    soundEngine.playPurchase();
    setPlayer((prev) => ({
      ...prev,
      balance: INITIAL_PLAYER_STATE.balance,
      respinPurchases: 0,
      doublePurchases: 0,
      totalSpins: 0,
      biggestWin: 0,
      lifetimeEarnings: 0,
      history: [],
    }));
    setActiveMultiplier(1);
    pushToast(
      '💸 CASH & VAULT LOG RESET!',
      'Balance reset to $220 and spin history cleared!',
      '#fb7185'
    );
  };

  const handleToggleSound = () => {
    setPlayer((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const handleResetSave = () => {
    if (window.confirm('Reset your cash balance, power-up inventory, and spin history back to default?')) {
      localStorage.removeItem(STORAGE_KEY);
      setPlayer(INITIAL_PLAYER_STATE);
      setPhase('IDLE');
      setActiveMultiplier(1);
      setPowerUpsUsedThisTurn([]);
      pushToast('VAULT RESET', 'Fresh starter bankroll loaded!', '#38bdf8');
    }
  };

  const totalInventoryCount = Object.values(player.inventory).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#090614] text-white selection:bg-fuchsia-500 pb-20 lg:pb-6 ${
        screenShake ? 'animate-[shake_0.45s_ease-in-out]' : ''
      }`}
    >
      {/* Decorative Background Grid & Radial Spotlights */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-fuchsia-600/15 blur-[130px]" />
        <div className="absolute top-1/3 -right-24 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* Floating Dopamine Toasts */}
      <div className="pointer-events-none fixed top-28 sm:top-24 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-sm px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex flex-col items-center rounded-2xl border border-white/20 bg-slate-950/92 px-4 py-2 text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md animate-bounce"
            style={{ borderColor: t.color }}
          >
            <span
              className="text-xs sm:text-sm font-black uppercase tracking-wider"
              style={{ color: t.color }}
            >
              {t.text}
            </span>
            {t.subtext && (
              <span className="text-[11px] font-medium text-slate-300">{t.subtext}</span>
            )}
          </div>
        ))}
      </div>

      {/* Top Sticky Header HUD */}
      <HeaderHUD
        balance={player.balance}
        streak={player.streak}
        canSpinToday={canSpinToday}
        simulatedDayOffset={player.simulatedDayOffset}
        soundEnabled={player.soundEnabled}
        onResetDailySpin={handleResetDailySpin}
        onAdvanceDay={handleAdvanceDay}
        onAddDebugCash={handleAddDebugCash}
        onResetMoney={handleResetMoney}
        onToggleSound={handleToggleSound}
        onResetSave={handleResetSave}
      />

      {/* Main Content Stage */}
      <main className="relative z-10 mx-auto flex-1 w-full max-w-7xl px-1.5 py-2.5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Left / Center Column (7 cols): The Wheel + Tactical Power-Up Dock */}
          <div
            className={`lg:col-span-7 flex-col items-center gap-4 sm:gap-6 ${
              mobileSection === 'wheel' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="w-full rounded-3xl border border-white/10 bg-slate-900/45 px-1 pt-6 pb-2 sm:p-5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col items-center">
              <WheelStage
                slices={slices}
                rotation={rotation}
                isSpinning={phase === 'SPINNING'}
                transitionDurationMs={0}
                transitionEasing="linear"
                activeSliceIndex={activeSliceIndex}
                activeMultiplier={activeMultiplier}
                phase={phase}
                canSpinToday={canSpinToday}
                pegKick={pegKick}
                shuffleStage={shuffleStage}
                isInverting={isInverting}
                dailyBoardName={dailyBoard.boardName}
                effectiveDateStr={effectiveToday}
                onSpinClick={() => startSpin(false)}
                onClaimClick={handleClaimPrize}
              />
            </div>

            {/* Tactical Power-Up Arsenal & Post-Spin Decision Window */}
            <TacticalDock
              phase={phase}
              balance={player.balance}
              inventory={player.inventory}
              respinPurchases={player.respinPurchases || 0}
              doublePurchases={player.doublePurchases || 0}
              slices={slices}
              activeSliceIndex={activeSliceIndex}
              activeMultiplier={activeMultiplier}
              canSpinToday={canSpinToday}
              onUsePowerUp={handleUsePowerUp}
              onBuyPowerUp={handleBuyPowerUp}
              onClaimPrize={handleClaimPrize}
              onSpin={() => startSpin(false)}
              onOpenMobileShop={() => setMobileSection('shop')}
            />
          </div>

          {/* Right Column (5 cols): Power-Up Black Market Shop & Vault History */}
          <div
            className={`lg:col-span-5 h-full ${
              mobileSection !== 'wheel' ? 'block' : 'hidden lg:block'
            }`}
          >
            <PowerUpShop
              balance={player.balance}
              inventory={player.inventory}
              respinPurchases={player.respinPurchases || 0}
              doublePurchases={player.doublePurchases || 0}
              history={player.history}
              totalSpins={player.totalSpins}
              biggestWin={player.biggestWin}
              lifetimeEarnings={player.lifetimeEarnings}
              externalTab={mobileSection === 'history' ? 'history' : 'shop'}
              onTabChange={(t) => setMobileSection(t === 'history' ? 'history' : 'shop')}
              onBuyPowerUp={handleBuyPowerUp}
            />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom App Navigation Bar (Hidden on lg+) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-white/15 bg-slate-950/95 backdrop-blur-xl px-3 py-1.5">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <button
            onClick={() => setMobileSection('wheel')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-black transition-all cursor-pointer touch-manipulation ${
              mobileSection === 'wheel'
                ? 'bg-gradient-to-r from-amber-400/20 to-fuchsia-500/20 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc3 className="h-4 w-4 mb-0.5" />
            <span>Wheel ({totalInventoryCount})</span>
            {phase === 'TACTICAL' && (
              <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setMobileSection('shop')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-black transition-all cursor-pointer touch-manipulation ${
              mobileSection === 'shop'
                ? 'bg-gradient-to-r from-fuchsia-500/25 to-indigo-500/25 text-fuchsia-300 border border-fuchsia-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4 mb-0.5" />
            <span>Power Shop</span>
          </button>

          <button
            onClick={() => setMobileSection('history')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-[11px] font-black transition-all cursor-pointer touch-manipulation ${
              mobileSection === 'history'
                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="h-4 w-4 mb-0.5" />
            <span>Vault ({player.history.length})</span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Win Celebration Modal */}
      {phase === 'CELEBRATING' && slices[activeSliceIndex] && (
        <WinCelebrationModal
          slice={slices[activeSliceIndex]}
          multiplier={activeMultiplier}
          streak={player.streak}
          streakBonusCash={lastClaimedBonus}
          powerUpsUsed={powerUpsUsedThisTurn}
          onClose={handleCloseCelebration}
        />
      )}
    </div>
  );
}

export default App;
