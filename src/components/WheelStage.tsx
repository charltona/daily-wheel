import React, { useMemo } from 'react';
import { Sparkles, Lock, CheckCircle2, Flame } from 'lucide-react';
import { GamePhase, WheelSlice } from '../types/game';
import { formatCash, getTacticalTargets, SLICE_ANGLE, SLICE_COUNT } from '../utils/wheelMath';

export type ShuffleStage = 'idle' | 'lifting' | 'swapping' | 'slamming';

interface WheelStageProps {
  slices: WheelSlice[];
  rotation: number;
  isSpinning: boolean;
  transitionDurationMs: number;
  transitionEasing: string;
  activeSliceIndex: number;
  activeMultiplier: number;
  phase: GamePhase;
  canSpinToday: boolean;
  pegKick: boolean;
  shuffleStage: ShuffleStage;
  isInverting: boolean;
  dailyBoardName?: string;
  effectiveDateStr?: string;
  onSpinClick: () => void;
  onClaimClick: () => void;
}

export const WheelStage: React.FC<WheelStageProps> = ({
  slices,
  rotation,
  isSpinning,
  transitionDurationMs,
  transitionEasing,
  activeSliceIndex,
  activeMultiplier,
  phase,
  canSpinToday,
  pegKick,
  shuffleStage,
  isInverting,
  onSpinClick,
  onClaimClick,
}) => {
  const tacticalTargets = useMemo(
    () => getTacticalTargets(activeSliceIndex),
    [activeSliceIndex]
  );

  const isShufflingActive = shuffleStage !== 'idle';

  // Generate SVG path for a 30-degree wedge centered at 12 o'clock
  const radius = 212;
  const halfAngleRad = ((SLICE_ANGLE / 2) * Math.PI) / 180;
  const x1 = -radius * Math.sin(halfAngleRad);
  const y1 = -radius * Math.cos(halfAngleRad);
  const x2 = radius * Math.sin(halfAngleRad);
  const y2 = -radius * Math.cos(halfAngleRad);
  const wedgePath = `M 0 0 L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;

  const isLanded = phase === 'TACTICAL' || phase === 'CELEBRATING';

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full">
      {/* Ambient Backlight Glow behind the wheel — supercharged when spinning or landed */}
      <div
        className={`pointer-events-none absolute -inset-2 sm:-inset-6 rounded-full blur-3xl transition-all duration-500 ${
          isSpinning
            ? 'bg-gradient-to-tr from-amber-400/55 via-fuchsia-500/55 to-cyan-400/55 scale-110 animate-pulse'
            : activeMultiplier > 1
            ? 'bg-gradient-to-tr from-purple-600/45 via-amber-400/35 to-pink-500/45 scale-105'
            : isLanded
            ? 'bg-gradient-to-tr from-amber-400/50 via-emerald-400/35 to-fuchsia-500/45 scale-105'
            : 'bg-gradient-to-tr from-indigo-600/25 via-fuchsia-600/20 to-amber-500/20'
        }`}
      />

      {/* Live Multiplier Floating Banner (only shown when 2x boost is active) */}
      {activeMultiplier > 1 && (
        <div className="mb-3 z-30 flex items-center gap-1.5 rounded-full border border-purple-400/70 bg-gradient-to-r from-purple-950 via-fuchsia-900 to-amber-900 px-3.5 py-1 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-bounce">
          <Flame className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
          <span className="text-[11px] font-black tracking-widest uppercase text-amber-200">
            {activeMultiplier}X CASH OVERDRIVE!
          </span>
          <Flame className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
        </div>
      )}

      {/* Main Wheel Container — fills nearly full mobile width leaving just a few pixels on each side */}
      <div
        className="relative w-[calc(100vw-20px)] h-[calc(100vw-20px)] max-w-[400px] max-h-[400px] sm:max-w-none sm:max-h-none sm:h-[440px] sm:w-[440px] lg:h-[470px] lg:w-[470px]"
        style={{
          animation:
            shuffleStage === 'slamming'
              ? 'boardSlamTremor 480ms ease-in-out'
              : 'none',
        }}
      >
        {/* Top Mechanical Pointer / Flapper positioned on the outer bezel so it never blocks text */}
        <div
          className="pointer-events-none absolute -top-6 sm:-top-7 left-1/2 z-30 -translate-x-1/2 origin-top transition-transform duration-75"
          style={{
            transform: `translateX(-50%) rotate(${pegKick ? '-26deg' : '0deg'})`,
          }}
        >
          <svg
            width="44"
            height="52"
            viewBox="0 0 56 64"
            className={`sm:w-[52px] sm:h-[60px] ${
              isSpinning
                ? 'drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]'
                : 'drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)]'
            }`}
          >
            <defs>
              <linearGradient id="pointerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <path
              d="M28 60 L8 18 C5 10 11 2 20 2 L36 2 C45 2 51 10 48 18 Z"
              fill="url(#pointerGold)"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <polygon points="28,48 16,18 28,12 40,18" fill="#e11d48" />
            <circle cx="28" cy="16" r="5" fill="#fef08a" />
          </svg>

          {/* Peg-strike Spark Burst when spinning pegs kick the pointer */}
          {pegKick && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-amber-200/90 blur-[4px] shadow-[0_0_20px_#fef08a]" />
          )}
        </div>

        {/* Invert 180° Laser Axis Overlay when Inverting */}
        {isInverting && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="h-full w-2 bg-cyan-300 shadow-[0_0_35px_#06b6d4,0_0_70px_#ffffff] animate-pulse rounded-full" />
            <div className="absolute rounded-full border-4 border-cyan-400 inset-4 animate-ping" />
          </div>
        )}

        {/* The SVG Wheel — overflow-visible so lifted slices can pop out past the rim */}
        <svg
          viewBox="-255 -255 510 510"
          className="h-full w-full overflow-visible drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
        >
          <defs>
            {slices.map((slice) => (
              <linearGradient
                key={`grad-${slice.id}`}
                id={`slice-grad-${slice.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={slice.bgStart} />
                <stop offset="100%" stopColor={slice.bgEnd} />
              </linearGradient>
            ))}

            <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="30%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {/* Extra Spinning Bling: Rotating Golden Energy Halo around the outer rim ONLY while spinning */}
          {isSpinning && (
            <circle
              cx="0"
              cy="0"
              r="247"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="45 35"
              style={{
                transformOrigin: '0px 0px',
                animation: 'spinRimSweep 1.1s linear infinite',
                filter: 'drop-shadow(0px 0px 10px rgba(254, 240, 138, 0.9))',
              }}
            />
          )}

          {/* Outer Static Casino Chassis Ring */}
          <circle
            cx="0"
            cy="0"
            r="242"
            fill="#070410"
            stroke="url(#rimGrad)"
            strokeWidth="8"
          />
          <circle
            cx="0"
            cy="0"
            r="228"
            fill="none"
            stroke={isSpinning ? '#581c87' : '#3b0764'}
            strokeWidth="18"
          />

          {/* 24 Outer Marquee LED Bulbs:
              - Spinning: fast rotating clockwise chase wave around the wheel!
              - Landed: 1 single unison flash when the wheel stops, then calm!
              - Idle: steady warm casino glow */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angleRad = ((i * 15 - 90) * Math.PI) / 180;
            const bx = 228 * Math.cos(angleRad);
            const by = 228 * Math.sin(angleRad);
            const isEven = i % 2 === 0;
            // 3 chasing light heads racing clockwise around the 24 bulbs (24 / 3 = 8 bulbs per wave)
            const chaseDelayMs = -(((24 - i) % 8) * 55);

            return (
              <g key={`bulb-${i}`} transform={`translate(${bx.toFixed(2)}, ${by.toFixed(2)})`}>
                {/* Recessed Bulb Socket */}
                <circle
                  cx="0"
                  cy="0"
                  r="5.2"
                  fill="#170d2b"
                  stroke="#78350f"
                  strokeWidth="1"
                />

                {/* Outer Flare Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r="6.2"
                  fill={isEven ? '#fef08a' : '#f472b6'}
                  style={
                    isSpinning
                      ? {
                          animation: 'marqueeChaseHalo 440ms linear infinite',
                          animationDelay: `${chaseDelayMs}ms`,
                          filter: 'blur(2px)',
                        }
                      : isLanded
                      ? {
                          animation: 'marqueeLandedAllHalo 450ms ease-out 1 forwards',
                          animationDelay: '0ms',
                          filter: 'blur(2px)',
                        }
                      : {
                          opacity: 0.25,
                          filter: 'blur(1.5px)',
                        }
                  }
                />

                {/* Bright LED Core */}
                <circle
                  cx="0"
                  cy="0"
                  r="4"
                  fill={isEven ? '#ffffff' : '#fdf2f8'}
                  stroke={isEven ? '#facc15' : '#ec4899'}
                  strokeWidth="1.4"
                  style={
                    isSpinning
                      ? {
                          animation: 'marqueeChaseBulb 440ms linear infinite',
                          animationDelay: `${chaseDelayMs}ms`,
                        }
                      : isLanded
                      ? {
                          animation: 'marqueeLandedAllFlash 450ms ease-out 1 forwards',
                          animationDelay: '0ms',
                        }
                      : {
                          opacity: 0.85,
                        }
                  }
                />
              </g>
            );
          })}

          {/* Static Top Target Reticle Glow on the Rim */}
          <path
            d="M -26 -238 A 240 240 0 0 1 26 -238"
            fill="none"
            stroke="#fef08a"
            strokeWidth={isSpinning || isLanded ? '5.5' : '4'}
            strokeLinecap="round"
            opacity="0.95"
            style={{
              filter:
                isSpinning || isLanded
                  ? 'drop-shadow(0px 0px 8px rgba(254, 240, 138, 0.95))'
                  : 'none',
            }}
          />

          {/* ROTATING WHEEL GROUP */}
          <g
            style={{
              transformOrigin: '0px 0px',
              transform: `rotate(${rotation}deg)`,
              transitionProperty: 'transform',
              transitionDuration: `${transitionDurationMs}ms`,
              transitionTimingFunction: transitionEasing,
            }}
          >
            {/* Recessed Mechanical Board Slots (Visible underneath when slices lift up to shuffle!) */}
            {Array.from({ length: SLICE_COUNT }).map((_, slotIdx) => (
              <g key={`socket-${slotIdx}`} transform={`rotate(${slotIdx * SLICE_ANGLE})`}>
                <path
                  d={wedgePath}
                  fill="#06030e"
                  stroke="rgba(168, 85, 247, 0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
                {/* Recessed mechanical socket latch in the empty slot */}
                <circle
                  cx="0"
                  cy="-135"
                  r="14"
                  fill="#0d081d"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="2"
                />
                <circle cx="0" cy="-135" r="4" fill="rgba(168, 85, 247, 0.3)" />
              </g>
            ))}

            {/* 12 Animated Physical Wedge Slices (Keyed by slice.id so they physically orbit when shuffled!) */}
            {slices.map((slice, idx) => {
              const sliceAngle = idx * SLICE_ANGLE;
              const isCurrentWinner =
                !isSpinning && !isShufflingActive && idx === activeSliceIndex;
              const isNudgeForwardTarget =
                phase === 'TACTICAL' &&
                !isShufflingActive &&
                idx === tacticalTargets.nudgeForwardIdx;
              const isNudgeBackwardTarget =
                phase === 'TACTICAL' &&
                !isShufflingActive &&
                idx === tacticalTargets.nudgeBackwardIdx;
              const isInvertTarget =
                phase === 'TACTICAL' &&
                !isShufflingActive &&
                idx === tacticalTargets.invertIdx;

              const displayPrimaryText =
                slice.type === 'cash' && slice.cashValue
                  ? formatCash(slice.cashValue * activeMultiplier)
                  : slice.label;

              const worldAngle = (((sliceAngle + rotation) % 360) + 360) % 360;
              const isLeftHalf = worldAngle > 180 && worldAngle < 360;
              const textRotation = isLeftHalf ? 90 : -90;

              // Physical Lift / Hover / Staggered Heavy Slam animation per wedge
              let radialMotionStyle: React.CSSProperties = {
                transformOrigin: '0px -132px',
              };

              if (shuffleStage === 'lifting') {
                radialMotionStyle = {
                  transformOrigin: '0px -132px',
                  animation: `sliceLiftUp 280ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 22}ms forwards`,
                  filter: 'drop-shadow(0px 18px 16px rgba(0,0,0,0.88))',
                };
              } else if (shuffleStage === 'swapping') {
                radialMotionStyle = {
                  transformOrigin: '0px -132px',
                  transform: 'translateY(-28px) scale(1.08)',
                  filter: 'drop-shadow(0px 22px 20px rgba(0,0,0,0.92))',
                };
              } else if (shuffleStage === 'slamming') {
                radialMotionStyle = {
                  transformOrigin: '0px -132px',
                  animation: `sliceSlamDown 280ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 55}ms both`,
                  filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.6))',
                };
              }

              return (
                <g
                  key={slice.id}
                  style={{
                    transformOrigin: '0px 0px',
                    transform: `rotate(${sliceAngle}deg)`,
                    transition:
                      shuffleStage === 'swapping'
                        ? 'transform 450ms cubic-bezier(0.34, 1.32, 0.64, 1)'
                        : 'none',
                  }}
                >
                  <g style={radialMotionStyle}>
                    {/* Wedge Fill */}
                    <path
                      d={wedgePath}
                      fill={`url(#slice-grad-${slice.id})`}
                      stroke={
                        isCurrentWinner
                          ? '#fef08a'
                          : isShufflingActive
                          ? 'rgba(255,255,255,0.55)'
                          : 'rgba(255,255,255,0.25)'
                      }
                      strokeWidth={isCurrentWinner ? '3.5' : isShufflingActive ? '2.2' : '1.5'}
                    />

                    {/* Highlight overlay for active wedge under pointer */}
                    {isCurrentWinner && (
                      <path d={wedgePath} fill="rgba(254, 240, 138, 0.14)" />
                    )}

                    {/* Outer Rim Accent Dot inside the wedge */}
                    <circle
                      cx="0"
                      cy="-197"
                      r="3"
                      fill={slice.accentColor}
                      opacity="0.7"
                    />

                    {/* Tactical Target Badges on neighboring/opposite wedges during TACTICAL phase */}
                    {(isNudgeForwardTarget || isNudgeBackwardTarget || isInvertTarget) && (
                      <g transform="translate(0, -195)">
                        <rect
                          x="-26"
                          y="-8"
                          width="52"
                          height="14"
                          rx="7"
                          fill="#090614"
                          stroke={
                            isInvertTarget
                              ? '#06b6d4'
                              : isNudgeForwardTarget
                              ? '#f59e0b'
                              : '#fb7185'
                          }
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="1.5"
                          textAnchor="middle"
                          fill={
                            isInvertTarget
                              ? '#67e8f9'
                              : isNudgeForwardTarget
                              ? '#fde68a'
                              : '#fda4af'
                          }
                          fontSize="7"
                          fontWeight="900"
                          letterSpacing="0.4"
                        >
                          {isInvertTarget
                            ? '180° FLIP'
                            : isNudgeForwardTarget
                            ? 'NUDGE +1'
                            : 'NUDGE -1'}
                        </text>
                      </g>
                    )}

                    {/* RADIAL SPOKE TEXT — bold, centered, no subtitle clutter */}
                    <g transform={`translate(0, -132) rotate(${textRotation})`}>
                      <text
                        x="0"
                        y="0"
                        dominantBaseline="central"
                        textAnchor="middle"
                        fill={slice.textColor}
                        fontSize={
                          displayPrimaryText.length > 9
                            ? '15'
                            : displayPrimaryText.length > 6
                            ? '17.5'
                            : '22'
                        }
                        fontWeight="900"
                        fontFamily="Outfit, sans-serif"
                        letterSpacing="0.5"
                        style={{
                          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))',
                        }}
                      >
                        {displayPrimaryText}
                      </text>
                    </g>
                  </g>
                </g>
              );
            })}

            {/* 12 Metallic Brass Pegs between slices */}
            {Array.from({ length: SLICE_COUNT }).map((_, idx) => {
              const pegAngle = idx * SLICE_ANGLE - SLICE_ANGLE / 2;
              return (
                <g key={`peg-${idx}`} transform={`rotate(${pegAngle})`}>
                  <circle
                    cx="0"
                    cy={-radius + 2}
                    r="5.5"
                    fill="#fef08a"
                    stroke="#78350f"
                    strokeWidth="2"
                  />
                  <circle cx="-1.2" cy={-radius + 0.8} r="1.8" fill="#ffffff" />
                </g>
              );
            })}

            <circle
              cx="0"
              cy="0"
              r="54"
              fill="#090614"
              stroke="url(#rimGrad)"
              strokeWidth="4"
            />
          </g>
        </svg>

        {/* Center Interactive Spin / Claim Hub Button */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {phase === 'TACTICAL' ? (
            <button
              onClick={onClaimClick}
              disabled={isShufflingActive}
              className="pointer-events-auto group relative flex h-20 w-20 sm:h-26 sm:w-26 flex-col items-center justify-center rounded-full border-4 border-emerald-300 bg-gradient-to-b from-emerald-400 via-emerald-600 to-teal-900 shadow-[0_0_35px_rgba(16,185,129,0.85)] transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer animate-pulse touch-manipulation"
            >
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white mb-0.5 drop-shadow" />
              <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase drop-shadow">
                CLAIM
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-emerald-100">
                LOCK IN!
              </span>
            </button>
          ) : (
            <button
              onClick={onSpinClick}
              disabled={isSpinning || !canSpinToday || isShufflingActive}
              className={`pointer-events-auto group relative flex h-20 w-20 sm:h-26 sm:w-26 flex-col items-center justify-center rounded-full border-4 transition-all duration-200 touch-manipulation ${
                isSpinning
                  ? 'border-amber-400/50 bg-slate-900 text-amber-200 cursor-wait scale-95'
                  : canSpinToday
                  ? 'border-amber-200 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-slate-950 shadow-[0_0_40px_rgba(251,191,36,0.75)] hover:scale-110 hover:shadow-[0_0_55px_rgba(251,191,36,1)] active:scale-95 cursor-pointer'
                  : 'border-slate-700 bg-slate-900/95 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSpinning ? (
                <>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300 animate-spin mb-0.5" />
                  <span className="text-[9px] sm:text-[11px] font-black tracking-widest uppercase text-amber-200">
                    SPINNING
                  </span>
                </>
              ) : canSpinToday ? (
                <>
                  <span className="text-base sm:text-xl font-black tracking-wider uppercase drop-shadow-sm">
                    SPIN!
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-extrabold tracking-widest uppercase text-amber-950/80">
                    TAP TO SPIN
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400/80 mb-0.5" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-slate-300 leading-tight">
                    DONE TODAY
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
