# Motion design with Opus 5.5 — notes (Movez course + Hamza post)

Source: @0xMovez course, pasted by user. Text cut off mid step 07 (engine); steps 08-12 not seen.

## Core idea
Prompt = 10%, harness = 90%. Harness = reference + render engine + self-critique loop.
Defaults to avoid: centered text on gradient, everything fading in, corner labels/frame borders, glow on UI chrome, generic particle bursts, logo at end.

## Route A (zero-dependency, what Opus picks by default)
- One index.html exposing `window.seek(t)` that paints the exact frame for time t (pure function of time).
- Playwright/headless Chromium calls seek per frame (15s @60fps = 900 frames), screenshots, ffmpeg encodes (H.264 yuv420p, CRF 16).
- No CSS transitions, setTimeout, requestAnimationFrame, carried state, or Math.random (use seeded mulberry32).
- Closed-form damped spring: 1 - e^(-z*w0*t)(cos(wd t) + (z*w0/wd) sin(wd t)), w0=sqrt(k), z=d/(2*w0); k=170, d=26 default. Many targets = sum of one spring per change.
- Motion blur: 4 subframes per frame, blended.
- Route B = frameworks (Remotion, Hyperframes); must be asked for explicitly.

## CLAUDE.md house rules (verbatim idea)
Render contract + banned defaults + one display face, one UI face, one accent + something new every 2-4s +
synthesized sound on measured beat grid (beats.json), -14 LUFS +
LOOP: contact sheet one frame per beat -> LOOK at it -> score 1-10 (hook in 2s, phone readability, motion quality, variety, brand accuracy, sound sync) -> fix 3 worst -> repeat until 8+ -> only then full render.

## Prompting patterns
- Showreel one-liner: "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a resume. go all out." Tests the engine, not an idea; causes "brief contagion".
- Anti-slop: "Avoid frames and text in the corners."
- Story variant: history of [TOPIC], 45s, vertical 9:16.
- Brand: give URL; "use actual product screenshot, logo, assets"; "must have music". Save assets to ./assets, never redraw UI from imagination. Beats: hook (5 words huge kinetic type) -> UI assembles -> 3 features with cursor actions -> one proof number -> logo + CTA. 1080x1920 first, then 1:1 and 16:9 from same timeline. Show contact sheet before full render.
- Reference: extract a frame every 0.5s from a reference video, write docs/style_guide.md + docs/shotlist.md, wait for OK before code. Take grammar, never content. Specify look + constraints, not the library.
- Spec (XML): <inputs>, <direction>, <structure> (state list on 120 BPM beat grid), <build>, <gotchas>, <start>. One container morphs through states, cursor drives changes, last frame == first (loop). Never will-change on camera-scaled elements.
- Keep API keys in .env, reference by name.
- Effort: medium small fixes, xhigh new films, max for flagship.
- Keep one session per brand (renderer/audio synth reused).

## Setup list
node 22 + ffmpeg + python (numpy librosa soundfile), playwright + chromium, remotion/hyperframes/claude-animation skills.
