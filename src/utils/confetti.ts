import confetti from 'canvas-confetti';
import { WinTier } from '../types/game';

export function firePowerUpBurst(colorHex: string) {
  confetti({
    particleCount: 14,
    spread: 55,
    origin: { y: 0.55 },
    colors: [colorHex, '#ffffff', '#fbbf24'],
    scalar: 0.85,
    ticks: 90,
    disableForReducedMotion: true,
  });
}

export function fireWinConfetti(tier: WinTier) {
  if (tier === 'small') {
    confetti({
      particleCount: 20,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#818cf8', '#fbbf24', '#ffffff'],
      ticks: 100,
      disableForReducedMotion: true,
    });
    return;
  }

  if (tier === 'medium') {
    confetti({
      particleCount: 30,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#10b981', '#fbbf24', '#f472b6', '#38bdf8'],
      ticks: 110,
      disableForReducedMotion: true,
    });
    return;
  }

  if (tier === 'big') {
    confetti({
      particleCount: 40,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#fbbf24', '#ec4899', '#a855f7', '#34d399'],
      ticks: 120,
      disableForReducedMotion: true,
    });
    return;
  }

  // JACKPOT — Lightweight 2-stage burst (mobile-friendly, no rAF particle flood)
  const colors = ['#fbbf24', '#fef08a', '#f59e0b', '#ec4899', '#a855f7', '#ffffff'];

  confetti({
    particleCount: 45,
    spread: 95,
    origin: { y: 0.55 },
    colors,
    scalar: 1.05,
    ticks: 130,
    disableForReducedMotion: true,
  });

  setTimeout(() => {
    confetti({
      particleCount: 20,
      angle: 60,
      spread: 50,
      origin: { x: 0.05, y: 0.65 },
      colors,
      ticks: 120,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 20,
      angle: 120,
      spread: 50,
      origin: { x: 0.95, y: 0.65 },
      colors,
      ticks: 120,
      disableForReducedMotion: true,
    });
  }, 280);
}

