import { PowerUpId, WinTier } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Crisp mechanical wheel peg click
  public playPegTick(speedRatio: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch slightly varies with speed for realism
    const baseFreq = 580 + Math.min(speedRatio * 380, 450);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.032);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Dramatic wind-back coil + forward launch sound when SPIN button is pressed
  public playSpinLaunch() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Wind-back spring coil (0..0.34s)
    const coilOsc = ctx.createOscillator();
    const coilGain = ctx.createGain();
    coilOsc.type = 'triangle';
    coilOsc.frequency.setValueAtTime(320, now);
    coilOsc.frequency.exponentialRampToValueAtTime(135, now + 0.32);
    coilGain.gain.setValueAtTime(0.14, now);
    coilGain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);
    coilOsc.connect(coilGain);
    coilGain.connect(ctx.destination);
    coilOsc.start(now);
    coilOsc.stop(now + 0.35);

    // 2. Forward acceleration launch sweep (0.34..0.68s)
    const launchOsc = ctx.createOscillator();
    const launchGain = ctx.createGain();
    launchOsc.type = 'sawtooth';
    launchOsc.frequency.setValueAtTime(140, now + 0.34);
    launchOsc.frequency.exponentialRampToValueAtTime(680, now + 0.65);
    launchGain.gain.setValueAtTime(0.18, now + 0.34);
    launchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.68);
    launchOsc.connect(launchGain);
    launchGain.connect(ctx.destination);
    launchOsc.start(now + 0.34);
    launchOsc.stop(now + 0.7);
  }

  // Lock-in / Tactical Window Entered sound
  public playWheelStop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25]; // C5, E5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  }

  // Distinct sound effects for each power-up!
  public playPowerUp(id: PowerUpId) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (id === 'nudge_forward' || id === 'nudge_backward') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startFreq = id === 'nudge_forward' ? 380 : 620;
      const endFreq = id === 'nudge_forward' ? 680 : 360;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (id === 'invert') {
      // Sci-fi warp flip
      const freqs = [300, 600, 900, 450, 750];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.045);
        gain.gain.setValueAtTime(0.2, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.13);
      });
    } else if (id === 'double') {
      // Power overdrive chord ascending
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.14, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.27);
      });
    } else if (id === 'shuffle') {
      // Phase 1 (0..320ms): Quick staggered mechanical unlatch pops as slices lift up
      for (let i = 0; i < 12; i++) {
        const t = now + i * 0.022;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240 + i * 35, t);
        osc.frequency.exponentialRampToValueAtTime(520 + i * 40, t + 0.035);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.045);
      }

      // Phase 2 (340..780ms): Mid-air orbit whoosh
      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.setValueAtTime(130, now + 0.34);
      whooshOsc.frequency.exponentialRampToValueAtTime(340, now + 0.56);
      whooshOsc.frequency.exponentialRampToValueAtTime(100, now + 0.78);
      whooshGain.gain.setValueAtTime(0.01, now + 0.34);
      whooshGain.gain.linearRampToValueAtTime(0.2, now + 0.54);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      whooshOsc.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whooshOsc.start(now + 0.34);
      whooshOsc.stop(now + 0.82);

      // Phase 3 (800ms + i*55ms): 12 heavy staggered mechanical thuds as each slice slams into the board!
      for (let i = 0; i < 12; i++) {
        const impactTime = now + 0.8 + i * 0.055 + 0.14; // +140ms aligns with 55% slam keyframe!

        // Heavy low-end thud body
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        const startPitch = 135 + i * 8;
        sub.frequency.setValueAtTime(startPitch, impactTime);
        sub.frequency.exponentialRampToValueAtTime(36, impactTime + 0.085);
        subGain.gain.setValueAtTime(0.3, impactTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.09);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(impactTime);
        sub.stop(impactTime + 0.095);

        // Crisp mechanical latch click on impact
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = 'triangle';
        click.frequency.setValueAtTime(420 + i * 32, impactTime);
        click.frequency.exponentialRampToValueAtTime(120, impactTime + 0.03);
        clickGain.gain.setValueAtTime(0.16, impactTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.032);
        click.connect(clickGain);
        clickGain.connect(ctx.destination);
        click.start(impactTime);
        click.stop(impactTime + 0.036);
      }
    } else if (id === 'respin') {
      // Revving up engine chime
      const notes = [330, 440, 587.33, 783.99];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.2);
      });
    }
  }

  // Shop purchase Ka-Ching!
  public playPurchase() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [987.77, 1318.51]; // B5 -> E6 coin sound
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.075);
      gain.gain.setValueAtTime(0.22, now + i * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.075);
      osc.stop(now + i * 0.075 + 0.3);
    });
  }

  // Rolling cash counter tick
  public playCoinTick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1250 + Math.random() * 180, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Celebration Win Fanfare based on prize tier!
  public playWinFanfare(tier: WinTier) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (tier === 'small') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        this.scheduleNote(ctx, f, now + i * 0.08, 0.25, 'triangle', 0.2);
      });
    } else if (tier === 'medium') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((f, i) => {
        this.scheduleNote(ctx, f, now + i * 0.075, 0.35, 'sawtooth', 0.14);
        this.scheduleNote(ctx, f * 0.5, now + i * 0.075, 0.35, 'triangle', 0.15);
      });
    } else if (tier === 'big') {
      // Grand fanfare chord progression
      const sequence = [
        { f: 523.25, t: 0, d: 0.14 },
        { f: 659.25, t: 0.1, d: 0.14 },
        { f: 783.99, t: 0.2, d: 0.14 },
        { f: 1046.5, t: 0.3, d: 0.45 },
        { f: 987.77, t: 0.52, d: 0.15 },
        { f: 1046.5, t: 0.66, d: 0.6 },
      ];
      sequence.forEach((n) => {
        this.scheduleNote(ctx, n.f, now + n.t, n.d, 'sawtooth', 0.16);
        this.scheduleNote(ctx, n.f * 0.5, now + n.t, n.d, 'triangle', 0.18);
      });
    } else if (tier === 'jackpot') {
      // FULL CASINO JACKPOT SYMPHONY!
      const fanfare = [
        { f: 523.25, t: 0, d: 0.12 },
        { f: 523.25, t: 0.13, d: 0.12 },
        { f: 523.25, t: 0.26, d: 0.12 },
        { f: 659.25, t: 0.4, d: 0.3 },
        { f: 587.33, t: 0.65, d: 0.15 },
        { f: 659.25, t: 0.8, d: 0.15 },
        { f: 783.99, t: 0.96, d: 0.35 },
        { f: 1046.5, t: 1.2, d: 0.85 },
        { f: 1318.51, t: 1.2, d: 0.85 },
        { f: 1567.98, t: 1.2, d: 0.85 },
      ];
      fanfare.forEach((n) => {
        this.scheduleNote(ctx, n.f, now + n.t, n.d, 'sawtooth', 0.15);
        this.scheduleNote(ctx, n.f * 0.5, now + n.t, n.d, 'triangle', 0.18);
      });
      // Shimmering coin cascade
      for (let i = 0; i < 14; i++) {
        this.scheduleNote(
          ctx,
          1200 + (i % 5) * 240,
          now + 0.3 + i * 0.09,
          0.12,
          'sine',
          0.1
        );
      }
    }
  }

  private scheduleNote(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const soundEngine = new SoundEngine();
