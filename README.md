# Spin & Win — Daily Wheel Game

**Live App:** [https://dailywheel.link](https://dailywheel.link)

A client-side daily "Spin & Win" casino-arcade wheel game built with **React 19**, **TypeScript**, **Vite 6**, and **Tailwind CSS v4**.

## Features

- **Daily Seeded Wheel Generator**: Every calendar day generates a deterministic 12-wedge board with a randomized `$400–$750` Daily Jackpot, tiered cash prizes, and Power-Up wedges.
- **Weighted Rarity & Suspense Physics**:
  - Skewed probability weights keep the Jackpot (`~0.8%`) and high-tier cash slices rare and exciting.
  - Multi-stage spin animation with counter-clockwise wind-back anticipation, rotating 24-bulb marquee light chase, and 4 randomized endgame suspense curves (`slow_tease`, `peg_bounce`, `last_gasp`, `edge_hanger`).
- **Tactical Power-Ups & Black Market Shop**:
  - **Nudge +1 (`↻`) & Nudge -1 (`↺`)**: Rotate the wheel 1 space clockwise or counter-clockwise after spinning to snipe an adjacent prize.
  - **Invert 180°**: Flip the wheel $180^\circ$ across the diameter to claim the opposite slice.
  - **Double 2x**: Doubles all cash prizes on the wheel for the current spin (max 1 per spin; shop price scales by `1.25x` per purchase).
  - **Chaos Shuffle**: Unlatches all 12 wedges from the board, orbits them in mid-air, and slams them into new slots with a staggered cascade.
  - **High-Roller Respin**: Immediately launch an extra spin (shop price scales by `1.1x` per purchase).
- **Persistent Local Vault**: Cash balance, daily streak bonus, power-up inventory, and spin history are automatically persisted in `localStorage`.
- **Synthesized Web Audio & Confetti**: Custom zero-asset Web Audio API sound engine for peg ticks, spring wind-back, weighted shuffle slams, and tiered win fanfares.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (with Dev Tools toolbar enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
