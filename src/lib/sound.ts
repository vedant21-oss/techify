/**
 * The landing page's press sounds, synthesized on the fly.
 *
 * Every sound here is a few oscillators and bursts of filtered noise, so there are
 * no audio files to download and each one is a handful of numbers you can tune. The
 * intro's cues are scheduled ahead on the AudioContext's own clock, which is sample
 * accurate, so they stay locked to the CSS timeline instead of drifting the way a
 * chain of timeouts would.
 *
 * Nothing is created until sound is turned on: browsers keep an AudioContext
 * suspended until a real gesture unlocks it, and building one earlier just leaves a
 * suspended context lying around.
 */

/** The press sounds, in the order the intro uses them. */
export type Voice = "plate" | "roller" | "ratchet" | "sheet" | "hover" | "press";

/** One scheduled sound: `at` is seconds from the start of the intro. */
export interface Cue {
  voice: Voice;
  at: number;
  /** Multiplies the voice's own level, for the quieter second pass of a sound. */
  gain?: number;
}

/** Everything is mixed well below clipping; the loudest voice peaks around -8dB. */
const MASTER_GAIN = 0.55;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

/** Sources still playing, so skipping the intro can cut them off. */
const live = new Set<AudioScheduledSourceNode>();

type ContextCtor = typeof AudioContext;

function contextCtor(): ContextCtor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as { webkitAudioContext?: ContextCtor }).webkitAudioContext ?? null;
}

/** True where the browser can synthesize at all, so the toggle can hide itself. */
export function isSupported(): boolean {
  return contextCtor() !== null;
}

/**
 * Builds the context on first use and asks a suspended one to resume. Call it from a
 * click or keypress: that gesture is what lets the context actually start.
 */
export function unlock(): AudioContext | null {
  const Ctor = contextCtor();
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** True once the context exists and the browser is actually letting it play. */
export function isRunning(): boolean {
  return ctx?.state === "running";
}

/**
 * Unlocks on the first press or keypress anywhere, for the case the browser refused
 * to start the context on load. Returns a function that cancels the wait.
 *
 * Nothing on the page can make noise before this fires; that's the autoplay rule,
 * and it applies to every site. All this does is make sure the very first thing the
 * visitor touches is enough, rather than the first thing that happens to be wired
 * for sound.
 */
export function armUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const stop = () => {
    for (const name of events) window.removeEventListener(name, onGesture);
  };
  const onGesture = () => {
    unlock();
    stop();
  };
  for (const name of events) window.addEventListener(name, onGesture, { once: false, passive: true });
  return stop;
}

/** Stops every scheduled sound and drops the queue. */
export function stopAll(): void {
  for (const node of live) {
    try {
      node.stop();
    } catch {
      // Already finished; nothing to stop.
    }
  }
  live.clear();
}

/** Closes the context so a muted page holds no audio hardware. */
export function release(): void {
  stopAll();
  const closing = ctx;
  ctx = null;
  master = null;
  noise = null;
  if (closing && closing.state !== "closed") void closing.close();
}

/** One buffer of white noise, reused by every click, roller and sheet. */
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noise) {
    const frames = Math.floor(c.sampleRate * 0.6);
    noise = c.createBuffer(1, frames, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function track(node: AudioScheduledSourceNode, at: number, until: number): void {
  node.start(at);
  node.stop(until);
  live.add(node);
  node.onended = () => live.delete(node);
}

/**
 * A percussive envelope: near-instant attack, exponential tail. Exponential ramps
 * can't reach or leave zero, hence the linear attack and the tiny floor.
 */
function envelope(c: AudioContext, at: number, peak: number, attack: number, decay: number): GainNode {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  return gain;
}

/** The body of a plate hitting paper: a pitch that drops as the impact settles. */
function thump(c: AudioContext, at: number, from: number, to: number, peak: number, decay: number): void {
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + decay * 0.7);
  osc.connect(envelope(c, at, peak, 0.004, decay)).connect(master!);
  track(osc, at, at + decay + 0.06);
}

/** The bright edge of contact: a very short burst of high noise. */
function click(c: AudioContext, at: number, hz: number, peak: number, decay: number): void {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  // A different slice of noise each time, so repeats never sound like a loop.
  src.playbackRate.value = 0.85 + Math.random() * 0.3;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hz;
  src.connect(filter).connect(envelope(c, at, peak, 0.001, decay)).connect(master!);
  track(src, at, at + decay + 0.05);
}

/** Noise swept through a moving filter: ink rolling, or paper pulling away. */
function sweep(
  c: AudioContext,
  at: number,
  opts: { from: number; to: number; dur: number; peak: number; type: BiquadFilterType; q: number },
): void {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = opts.type;
  filter.Q.value = opts.q;
  filter.frequency.setValueAtTime(opts.from, at);
  filter.frequency.exponentialRampToValueAtTime(opts.to, at + opts.dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(opts.peak, at + opts.dur * 0.22);
  gain.gain.linearRampToValueAtTime(opts.peak * 0.65, at + opts.dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + opts.dur);
  src.connect(filter).connect(gain).connect(master!);
  track(src, at, at + opts.dur + 0.03);
}

const VOICES: Record<Voice, (c: AudioContext, at: number, gain: number) => void> = {
  /** A printing plate landing in register: a heavy, dull knock. */
  plate: (c, at, g) => {
    thump(c, at, 104, 38, 0.85 * g, 0.34);
    click(c, at, 1600, 0.16 * g, 0.045);
  },
  /** The ink roller crossing the plate, matching the 0.9s wipe across the word. */
  roller: (c, at, g) => {
    sweep(c, at, { from: 420, to: 2600, dur: 0.62, peak: 0.1 * g, type: "bandpass", q: 0.9 });
  },
  /** One notch of the proof counter. Quiet enough to sit under the ink. */
  ratchet: (c, at, g) => {
    click(c, at, 3200, 0.07 * g, 0.018);
    thump(c, at, 760, 520, 0.05 * g, 0.022);
  },
  /** The sheet peeling up and away, a filter closing as it leaves. */
  sheet: (c, at, g) => {
    sweep(c, at, { from: 2400, to: 260, dur: 0.85, peak: 0.16 * g, type: "lowpass", q: 0.7 });
  },
  /** Barely there: the tick of a finger finding a button. */
  hover: (c, at, g) => {
    click(c, at, 5200, 0.035 * g, 0.012);
  },
  /** Pressing a button, tuned as a smaller, tighter cousin of `plate`. */
  press: (c, at, g) => {
    thump(c, at, 190, 72, 0.45 * g, 0.12);
    click(c, at, 2400, 0.13 * g, 0.03);
  },
};

/** Plays one voice now, or `delay` seconds from now. Silent if sound is locked. */
export function play(voice: Voice, delay = 0, gain = 1): void {
  const c = unlock();
  if (!c || !master || c.state !== "running") return;
  VOICES[voice](c, c.currentTime + Math.max(0, delay), gain);
}

/* ---- The intro's timeline ------------------------------------------------------- */

/**
 * One axis of a CSS cubic-bezier at the curve's own parameter `t`. The end points of
 * a timing function are fixed at (0,0) and (1,1), so only the two handles vary.
 */
function axis(a: number, b: number, t: number): number {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
}

/** The parameter at which `axis(a, b, t)` reaches `value`, by bisection. */
function solve(a: number, b: number, value: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (axis(a, b, mid) < value) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** y of a CSS `cubic-bezier(x1, y1, x2, y2)` at time fraction `x`, both 0–1. */
export function bezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return axis(y1, y2, solve(x1, x2, x));
}

/** The time fraction at which that same curve first reaches `progress` (0–1). */
export function bezierTimeFor(x1: number, y1: number, x2: number, y2: number, progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  return axis(x1, x2, solve(y1, y2, progress));
}

/**
 * The intro's animation, as read off `.intro-*` in globals.css. Keep these in step
 * with that file: the sounds are only convincing while they land on the frame the
 * movement does.
 */
const PLATE_AT = 0.1; // .intro-word::before — the pink plate registers
const INK_AT = 0.35; // .intro-word::after — the ink wipes across
const TAGLINE_AT = 1.3; // .intro-tagline rises
const PROOF_AT = 0.5; // .intro-progress-bar starts
const PROOF_FOR = 2.8; // ...and runs this long
const PROOF_EASE = [0.45, 0.05, 0.25, 1] as const; // ...on this curve
const LIFT_AT = 3.6; // .intro-sheet lifts
const TRAIL_AT = 3.75; // .intro-trail follows

/** One notch per 4% of the proof, so the ratchet speeds up and slows with the bar. */
const PROOF_NOTCHES = 25;

const cues: Cue[] = [
  { voice: "plate", at: PLATE_AT },
  { voice: "roller", at: INK_AT },
  ...Array.from({ length: PROOF_NOTCHES }, (_, i): Cue => {
    const progress = (i + 1) / PROOF_NOTCHES;
    const [x1, y1, x2, y2] = PROOF_EASE;
    return {
      voice: "ratchet",
      at: PROOF_AT + bezierTimeFor(x1, y1, x2, y2, progress) * PROOF_FOR,
      // The notches fade in as the proof builds, so the first ones stay out of the way.
      gain: 0.55 + progress * 0.45,
    };
  }),
  { voice: "plate", at: TAGLINE_AT, gain: 0.5 },
  { voice: "sheet", at: LIFT_AT },
  { voice: "sheet", at: TRAIL_AT, gain: 0.5 },
];

/**
 * Every cue in the opening print, in time order. The ratchet follows the progress
 * bar's own easing, so the ticks crowd together exactly where the bar runs fastest.
 */
export const INTRO_CUES: Cue[] = cues.sort((a, b) => a.at - b.at);

/**
 * Schedules the whole opening print in one go. Returns false when the context is
 * still locked — the intro then plays silently, which is the right outcome: a page
 * can't make noise before the visitor has touched it.
 */
export function playIntro(fromSeconds = 0): boolean {
  const c = unlock();
  if (!c || !master || c.state !== "running") return false;
  stopAll();
  const start = c.currentTime + 0.02;
  for (const cue of INTRO_CUES) {
    // Cues already passed are dropped rather than crammed in at the front.
    if (cue.at < fromSeconds) continue;
    VOICES[cue.voice](c, start + cue.at - fromSeconds, cue.gain ?? 1);
  }
  return true;
}
