"use client";

import { useEffect, useState } from "react";
import { useMessages } from "@/components/lang-provider";
import { useSound } from "@/components/sound-provider";
import { playIntro, stopAll } from "@/lib/sound";

/** When the intro is fully gone; the sheet starts lifting at 3.6s. Mirrored in globals.css. */
const INTRO_TOTAL_MS = 4700;

/** Fired by Home links so the intro replays even when you're already on the home page. */
export const REPLAY_INTRO_EVENT = "techify:replay-intro";

function Mark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className={`intro-mark ${className}`}>
      <circle cx="22" cy="22" r="12" fill="none" stroke="var(--paper)" strokeWidth="2.5" />
      <path d="M22 0v44M0 22h44" stroke="var(--paper)" strokeWidth="2.5" />
      <circle cx="22" cy="22" r="4.5" fill="var(--pink)" />
    </svg>
  );
}

/**
 * The opening "print": TECHIFY is inked in two plates that land in register, the
 * proof counts up, then the sheet lifts away with a pink sheet trailing behind.
 * Plays whenever the home page opens, can be skipped with a click or any key, and
 * is skipped entirely with reduced motion. The animation itself is pure CSS, so the
 * page still reveals itself if JavaScript never runs.
 *
 * With sound on, the press is scored to match: the plate knocks, the roller sweeps,
 * the proof counter ratchets and the sheet pulls away. A browser won't let a page
 * make noise before it has been touched, so on a cold load the print may well run
 * silent; replaying it from the logo is a click, and that one always plays.
 */
export function IntroCurtain() {
  const t = useMessages().landing.intro;
  const { enabled } = useSound();
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = setTimeout(() => setDone(true), reduce ? 0 : INTRO_TOTAL_MS);
    const skip = () => setDone(true);
    const root = document.documentElement;
    if (!reduce) root.classList.add("intro-playing");
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(finish);
      window.removeEventListener("keydown", skip);
      root.classList.remove("intro-playing");
    };
  }, [done, run]);

  // Kept apart from the timing above so turning sound on can't restart the intro.
  // The cues go in one go on the audio clock, where they can't drift off the frames
  // the CSS animates; skipping cuts the queue instead of letting it play out.
  useEffect(() => {
    if (done || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    playIntro();
    return stopAll;
  }, [done, enabled, run]);

  useEffect(() => {
    const replay = () => {
      window.scrollTo({ top: 0 });
      setDone(false);
      setRun((r) => r + 1);
    };
    window.addEventListener(REPLAY_INTRO_EVENT, replay);
    return () => window.removeEventListener(REPLAY_INTRO_EVENT, replay);
  }, []);

  if (done) return null;

  return (
    <div key={run} className="intro" onClick={() => setDone(true)} role="presentation">
      <div className="intro-trail" aria-hidden="true" />
      <div className="intro-sheet" aria-hidden="true">
        <Mark className="top-6 left-6" />
        <Mark className="top-6 right-6" />
        <Mark className="bottom-6 left-6" />
        <Mark className="right-6 bottom-6" />

        <div className="flex flex-col items-center gap-6 px-4 text-center">
          <span className="intro-word" data-text="Techify">
            Techify
          </span>
          <span className="intro-tagline font-heading text-[clamp(1.5rem,4vw,2.75rem)] font-bold uppercase leading-none text-paper">
            {t.before}
            <span className="text-pink">{t.you}</span>
            {t.after}
          </span>
          <span className="intro-progress label-mono text-paper/80">
            <span className="intro-progress-bar" />
            <span className="intro-progress-label">{t.printing}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setDone(true);
        }}
        className="intro-skip label-mono"
      >
        {t.skip}
      </button>
    </div>
  );
}
