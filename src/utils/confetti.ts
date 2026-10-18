import confetti from 'canvas-confetti';
import { WinTier } from '../types/game';

export function firePowerUpBurst(colorHex: string) {
  confetti({
    particleCount: 32,
    spread: 65,
    origin: { y: 0.55 },
    colors: [colorHex, '#ffffff', '#fbbf24'],
    scalar: 0.85,
    ticks: 130,
  });
}

export function fireWinConfetti(tier: WinTier) {
  if (tier === 'small') {
    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#818cf8', '#fbbf24', '#ffffff'],
    });
    return;
  }

  if (tier === 'medium') {
    confetti({
      particleCount: 95,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#10b981', '#fbbf24', '#f472b6', '#38bdf8'],
      scalar: 1.1,
    });
    return;
  }

  if (tier === 'big') {
    // Dual side cannons + center explosion
    confetti({
      particleCount: 110,
      spread: 100,
      origin: { y: 0.55 },
      colors: ['#fbbf24', '#ec4899', '#a855f7', '#34d399'],
      scalar: 1.2,
    });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#fbbf24', '#f43f5e', '#a855f7'],
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#fbbf24', '#f43f5e', '#a855f7'],
      });
    }, 220);
    return;
  }

  // JACKPOT — Continuous 2.6 second Golden & Neon Shower!
  const end = Date.now() + 2600;
  const colors = ['#fbbf24', '#fef08a', '#f59e0b', '#ec4899', '#a855f7', '#ffffff'];

  // Immediate massive center burst
  confetti({
    particleCount: 150,
    spread: 120,
    origin: { y: 0.5 },
    colors,
    scalar: 1.35,
  });

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      scalar: 1.15,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      scalar: 1.15,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}
