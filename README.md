# Box Breathing

A calm, minimal box breathing app (the 4-4-4-4 technique) that you can install on your phone and use offline.

Breathe in, hold, breathe out, hold, for 4 seconds each, while a dot travels around a square and a circle grows and
shrinks with your breath.

Built with React, TypeScript and Vite. No backend: settings are saved in your browser's `localStorage`.

## Features

- **Breathing visual**: a dot travels along the box (top = breathe in, right = hold, bottom = breathe out, left = hold)
  and a circle inside expands on the in-breath and shrinks on the out-breath.
- Large phase text ("Breathe in", "Hold", ...) with a countdown, cycle counter and elapsed time.
- **Start, Pause/Resume, Reset**. Press <kbd>Space</kbd> to start or pause.
- **Session length** in minutes (1, 3, 5, 10), cycles (3, 5, 10, 20) or no limit, with a calm "Session complete"
  screen.
- **Settings**: seconds per phase (2–10), each phase separately (e.g. 4-7-8), sound cues, vibration, light/dark theme,
  visual style and motion level.
- **How it works** screen explaining the technique in plain language.
- Installable **PWA** that works **offline**.
- Keeps the screen on during a session (where supported) and pauses automatically if you switch away.
- Accessible: keyboard controls, screen reader announcements of each phase, good contrast, and a minimal-motion mode
  that follows your device's "reduce motion" setting.

## Getting started

You need [Node.js](https://nodejs.org/) version 20 or newer (it includes `npm`).

```bash
npm install      # download the dependencies (only needed once)
npm run dev      # start the development server
```

Then open <http://localhost:5173> in your browser. The page reloads automatically when you change the code.

### All commands

| Command                  | What it does                                                         |
| ------------------------ | -------------------------------------------------------------------- |
| `npm run dev`            | Start the development server with live reload                        |
| `npm test`               | Run the unit tests once                                              |
| `npm run test:watch`     | Re-run the tests every time you save a file                          |
| `npm run typecheck`      | Check the TypeScript types                                           |
| `npm run lint`           | Check the code for common mistakes (oxlint)                          |
| `npm run build`          | Type-check and build the production version into `dist/`            |
| `npm run preview`        | Serve the built `dist/` folder locally to try the production version |
| `npm run generate-icons` | Re-create the app icons in `public/` from `public/favicon.svg`       |

## Install it on your phone

Installing a web app (a "PWA") needs two things: the app must be served over **HTTPS**, and the browser must see its
manifest and service worker. `localhost` counts as secure, but your computer's local network address
(e.g. `http://192.168.1.20:5173`) does not. So to install it on a phone, put the built app online first.

### 1. Host it (free)

**GitHub Pages (set up already).** The workflow in `.github/workflows/deploy.yml` builds, tests and publishes the app
every time code is pushed to the repository's default branch. It needs a one-time setting: in the repository go to
**Settings → Pages** and set **Source** to **GitHub Actions**. The app is then available at
`https://<your-github-name>.github.io/<repository-name>/`. You can follow each run in the **Actions** tab.

> GitHub Pages is free for public repositories. For a private repository it needs a paid or student GitHub plan
> (GitHub Pro is free for students through [GitHub Education](https://education.github.com/)). The published app is
> visible to anyone with the link either way.

**Anywhere else.** Run `npm run build`, which creates a `dist/` folder. It is a plain static website, so any static
hosting service with HTTPS works (e.g. Netlify, Vercel or Cloudflare Pages): upload the contents of `dist/`, or
connect the repository and use `npm run build` as the build command and `dist` as the output folder. The app uses
relative paths, so it works in a sub-folder too.

### 2. Add it to your home screen

- **Android (Chrome):** open the site, tap the **⋮** menu and choose **Install app** (or **Add to Home screen**).
- **iPhone / iPad (Safari):** open the site, tap the **Share** button, then **Add to Home Screen**.
- **Computer (Chrome / Edge):** click the install icon at the right end of the address bar.

Open the app once while online. After that it works without internet. When you publish a new version, it updates
itself the next time you open the app while online.

> **Just want to try it on your phone without installing?** Run `npm run dev -- --host` and open the "Network" address
> it prints on your phone (both devices must be on the same Wi-Fi). Everything works except installing and offline mode.

## Project structure

```
src/
├── core/        Pure logic: no React, no browser APIs. Fully unit tested.
│   ├── clock.ts       Pausable stopwatch based on timestamps
│   ├── breathing.ts   Phases, countdown, cycles and session length
│   ├── visual.ts      Maths for the dot position and circle size
│   ├── settings.ts    Settings types, defaults, presets and validation
│   ├── format.ts      Time formatting (m:ss)
│   └── *.test.ts      Vitest unit tests
├── hooks/       React hooks that connect the logic to the browser
│   ├── useBreathingSession.ts  Animation loop, start/pause/resume/reset
│   ├── useSettings.ts          Load/save settings in localStorage
│   ├── useWakeLock.ts          Keep the screen on during a session
│   ├── useMediaQuery.ts        Dark mode / reduced motion preferences
│   └── useAutoFocus.ts         Focus a screen's heading after navigating
├── services/    Sound (Web Audio API) and vibration
├── components/  Reusable UI pieces (visual, controls, form fields, nav bar)
├── screens/     Breathe, Session complete, Settings, How it works
├── styles/      Global styles and the light/dark colour tokens
├── App.tsx      Ties everything together (screens, keyboard, theme, cues)
└── main.tsx     Entry point
public/          App icons (favicon.svg is the source for the PNGs)
```

## How the timing works

The timing must stay accurate for a whole session, so the app **never counts timer ticks**. Timers like
`setInterval(fn, 1000)` often fire late, especially on phones, and those small delays add up.

Instead:

1. When you press Start, the app notes the time from `performance.now()`.
2. About 60 times per second (`requestAnimationFrame`), it computes **elapsed time = now − start**.
3. A pure function, `getBreathingState(elapsedMs, pattern)`, turns that number into the current phase, the seconds
   left and the cycle number. The dot position and circle size are calculated from the same number.

**Pausing** saves the elapsed time so far, and **resuming** continues from that exact millisecond. Because the core
functions take the time as an argument rather than reading the clock, the tests can check things like "after exactly
one hour we are at the start of cycle 226" instantly.

A few deliberate choices:

- **Minute-based sessions finish the current cycle**, so they never stop in the middle of a breath. For example,
  1 minute of 16-second cycles becomes 4 cycles (64 seconds).
- **Holds can be set to 0** when customising phases. The phase is then skipped, which is needed for 4-7-8.
- **Changing the timing during a session** takes effect from the next session, so the animation never jumps.
- **The session pauses automatically** when you switch to another app or screen.

## Browser support notes

- **Vibration** works in most Android browsers but not on iPhone/iPad, where the setting is greyed out.
- **Keeping the screen on** uses the Screen Wake Lock API, which most modern browsers support. Where it isn't
  available, the screen dims as usual.
- **Sound** starts after you press Start, because browsers block sound until you interact with the page. On an iPhone,
  the silent switch also mutes web audio.

## Accessibility

- Press <kbd>Space</kbd> to start, pause and resume. All controls are real buttons and work with <kbd>Tab</kbd>.
- Screen readers announce each phase change once (not every second).
- Text colours meet WCAG AA contrast in both themes.
- **Motion** setting: "Follow system" respects your device's reduce-motion preference. "Minimal" shows no moving parts:
  the box edges and circle fade gently instead.

## Disclaimer

This app is a relaxation aid, not a medical device. If you feel dizzy or light-headed, stop and breathe normally. If
you have a heart or lung condition, check with a doctor before practising breath holds.
