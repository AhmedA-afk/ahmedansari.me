"""score.py — the whole soundtrack of 'Gullak', composed in code from the picture's own event timeline.

Motif: every coin that enters a gullak is a note of one pentatonic world (C major pentatonic: the 'love' scale);
a coin leaving is a dull, falling tink. The melody that closes the film is the same phrase the coins have been
spelling all along. Arcs:  growing up (warm, felt piano) -> the grind (dry, flat jazz) -> the game (cool, uplifting, then cut)
-> the cold (heavy keys, silence) -> the thaw (the theme returns, a note at a time) -> the ending.
"""
import json, sys
import numpy as np
from synth import *

C = json.load(open('../cues.json'))
EV = {k: v for k, v in C['events'].items()}
TB_H, TB_Q, T_STONE, T_THAW0, T_THAW1, T_SEAMS0 = C['T_BREAK_H'], C['T_BREAK_Q'], C['T_STONE'], C['T_THAW0'], C['T_THAW1'], C['T_SEAMS0']
S = C['scenes']; DUR = C['dur']

hall = Stem(DUR); dry = Stem(DUR); big = Stem(DUR); fx = Stem(DUR); fxw = Stem(DUR); amb = Stem(DUR)
_cache = {}
def P(stem, t, midi, dur, vel=.6, felt=True, pan=0.0, bright=.5, g=1.0):
    k = (midi, round(dur * 4) / 4, round(vel * 8) / 8, felt, round(bright * 4) / 4)
    if k not in _cache: _cache[k] = piano(hz(midi), max(.3, k[1]), vel, bright, felt)
    stem.add(t, _cache[k], pan + (midi - 60) * .006, g)
def chord(root, kind):
    iv = {'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'dom7': [0, 4, 7, 10], '6': [0, 4, 7, 9], 'm9': [0, 3, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14], 'sus': [0, 5, 7, 10], 'm': [0, 3, 7], 'maj': [0, 4, 7], 'dim7': [0, 3, 6, 9], 'add9': [0, 4, 7, 14], 'sus2': [0, 2, 7], '13': [0, 4, 10, 14, 21], 'm6': [0, 3, 7, 9]}[kind]
    return [root + i for i in iv]
def up(ns, lo=55, hi=76):                 # fold chord tones into a middle register
    out = []
    for n in ns:
        while n < lo: n += 12
        while n > hi: n -= 12
        out.append(n)
    return sorted(out)
def padchord(stem, t, root, kind, dur, vel=.4, bright=.3, att=1.4, rel=1.8, octave=0):
    for n in up(chord(root, kind), 48 + octave, 70 + octave): stem.add(t, pad(hz(n), dur, vel, bright, att, rel), (n - 60) * .01)
def stringchord(stem, t, root, kind, dur, vel=.4, att=1.2, rel=1.6, octave=0):
    for n in up(chord(root, kind), 52 + octave, 76 + octave): stem.add(t, strings(hz(n), dur, vel, att, rel), (n - 60) * .012)
C3, D3, E3, F3, G3, A3, B3 = m('C3'), m('D3'), m('E3'), m('F3'), m('G3'), m('A3'), m('B3')
PENT = [m('E5'), m('G5'), m('A5'), m('C6'), m('D6'), m('E6'), m('G6')]
def beatgrid(t0, t1, bpm): b = 60 / bpm; return np.arange(t0, t1, b), b

# ================================================================== the theme (used by coins' world and by the last minute)
THEME = [  # (beat offset in a 4-bar phrase at 4/4, note, beats)
    (0, 'E5', 1.5), (1.5, 'D5', .5), (2, 'C5', 2), (4, 'B4', 1.5), (5.5, 'C5', .5), (6, 'E5', 2),
    (8, 'A4', 1), (9, 'C5', 1), (10, 'F5', 2), (12, 'D5', 1.5), (13.5, 'E5', .5), (14, 'G5', 2)]
def theme(stem, t0, bpm, vel=.6, felt=True, shift=0, bells=False, gain=1.0, ornament=False):
    b = 60 / bpm
    for off, n, d in THEME:
        t = t0 + off * b; mm = m(n) + shift
        P(stem, t, mm, d * b * 1.6 + .6, vel * (1 if off % 4 == 0 else .88), felt, bright=.45, g=gain)
        if bells: hall.add(t, musicbox(hz(mm + 12), 2.0, vel * .5), .25, gain * .55)

# ================================================================== A1  growing up  (0 - 46)
def arc1():
    bpm = 72; b = 60 / bpm; bar = 4 * b
    prog = [(C3, 'maj7'), (E3, 'm7'), (F3, 'maj7'), (G3, '6')]
    nbars = int(46 / bar) + 1
    for i in range(nbars):
        t = i * bar; r, k = prog[i % 4]
        if t >= 44.6: break
        vel = np.interp(t, [0, 8, 14], [.22, .4, .55])
        # warm pad underneath
        if t < 44: padchord(hall, t, r, k, bar + 1.2, .22 * np.interp(t, [0, 6, 20], [.3, .8, 1]), .25, 1.4, 1.8)
        # arpeggio, eighths: root-5-9-3-... comes in after the first bar; gets busier with each beat of his life
        ch = up(chord(r, k), 55, 79); low = r + 12 if r + 12 < 60 else r
        pat = [low, ch[1], ch[2], ch[3] if len(ch) > 3 else ch[0] + 12, ch[2], ch[1], ch[0] + 12, ch[1]]
        if t >= bar * .9:
            for j, nn in enumerate(pat):
                if t < 6 and j % 2: continue
                P(hall, t + j * b / 2 + (.012 if j % 2 else 0), nn, 2.2, vel * (.9 if j % 4 else 1.0) * (.8 + .2 * ((j * 7) % 3 == 0)), True, bright=.35)
        # bass from the exam onwards
        if t >= 24: dry.add(t, bass_up(hz(r - 12), 1.6, .5 * np.interp(t, [24, 31], [.4, 1])), -.1); dry.add(t + 2 * b, bass_up(hz(r - 12 + 7), 1.2, .38), -.1)
    # the melody takes the lead when he rolls to landscape (the world widens)
    for ph in range(0, 4):
        t0 = 10.0 + ph * 4 * bar
        if t0 < 41: theme(hall, t0, bpm, vel=.62 if ph < 2 else .7, bells=ph >= 1, gain=1.0)
    # light percussion for sports: kick, hat, a woody tick on the backbeat
    t = 31.0
    while t < 37.6:
        i = int(round((t - 31.0) / b * 2));
        if i % 4 == 0: dry.add(t, kick(.55), 0, .8)
        dry.add(t, hat(.35 if i % 2 else .5), .2 if i % 2 else -.2, .6)
        if i % 4 == 2: dry.add(t, clap(.35), 0, .7)
        t += b / 2
    # the leaving: strings swell, everything leans back
    for tt, (r, k) in zip([38, 41.3], [(m('A2'), 'm7'), (m('F2'), 'maj7')]): stringchord(hall, tt, r + 12, k, 4.5, .5, 1.6, 2.0)
    hall.add(44.4, pad(hz(m('C3')), 3.4, .5, .3, .6, 2.2), 0, .9)
    P(hall, 45.0, m('C5'), 3.5, .5, True, g=.9); P(hall, 45.1, m('G4'), 3.5, .45, True, g=.8); P(hall, 45.2, m('E5'), 3.5, .4, True, g=.8)
arc1()

# ================================================================== A2  the grind  (46 - 94)
def arc2():
    # --- the grind (46-64): dry, flat, exactly the same two bars again and again; it thins as the cobwebs grow
    bpm = 88; b = 60 / bpm; bar = 4 * b; t = 46.0; i = 0
    walkD = [m('D2'), m('F2'), m('A2'), m('C3')]; walkG = [m('G2'), m('B2'), m('D3'), m('F3')]
    while t < 63.6:
        w = walkD if i % 2 == 0 else walkG
        rh = (i % 2 == 0)
        if t < 62.3:
            for j, nn in enumerate(w): dry.add(t + j * b, bass_up(hz(nn), .5, .55 * np.interp(t, [46, 60, 62.3], [1, .9, .3])), -.15)
        if t < 60:   # brushes, swung eighths
            for j in range(4):
                dry.add(t + j * b, brush(.2, .35), .25, .8); dry.add(t + j * b + b * .66, brush(.15, .22), .25, .7)
                dry.add(t + j * b, hat(.18), .3, .5) if j % 2 else None
        if t < 56:   # Rhodes charleston comp
            ch = up(chord(m('D3') if rh else m('G3'), 'm9' if rh else '13'), 52, 72)
            for off, v in [(b * 1.0 + b * .66, .5), (b * 3.0, .42)]:
                for nn in ch: dry.add(t + off, ep(hz(nn), 1.0, v), (nn - 60) * .01, .5)
        t += bar; i += 1
    for k in range(int((63.8 - 46) * 2)): fx.add(46 + k * .5, tick(.14), .4, .9)            # the clock
    rng2 = np.random.default_rng(3)
    for k in range(60): fx.add(46.5 + rng2.random() * 15, keyclick(rng2.uniform(.2, .4)), rng2.uniform(-.4, .4), .8)   # keys
    amb.add(46, rumble(18, .06, 90), 0, 1.0)                                              # office hum
    P(big, 62.6, m('D2'), 3.5, .5, True, g=.8)                                             # one low, unanswered note
    # --- the mistake (64-72): the same music loses its footing
    t0 = 64.0
    for nn in [m('E3'), m('G#3'), m('B3'), m('D4'), m('F4')]: dry.add(t0, ep(hz(nn), 1.5, .8), 0, .9)
    dry.add(t0, bass_up(hz(m('E2')), 1.2, .9)); fx.add(64.1, kick(.9, True), 0, .9)
    for k in range(6): fx.add(64.4 + k * .35, tick(.5), 0, 1.0); fx.add(64.4 + k * .35, np.sin(2 * np.pi * 880 * T(.12)) * np.hanning(int(.12 * SR)) * .12, .2, 1.0)  # monitor alarm
    bpm2 = 104; b2 = 60 / bpm2
    for k in range(int(4 / b2)):
        tt = 64.8 + k * b2; nn = [m('E2'), m('F2'), m('F#2'), m('G2'), m('G#2'), m('A2')][k % 6]; dry.add(tt, bass_up(hz(nn), .45, .7), -.1); dry.add(tt, brush(.18, .5), .3, 1.0)
    for tt, ns in [(65.0, [m('Bb3'), m('D4'), m('F#4')]), (66.0, [m('B3'), m('D#4'), m('F4')]), (67.0, [m('C4'), m('E4'), m('G#4')])]:
        for nn in ns: dry.add(tt, ep(hz(nn), .9, .75), (nn - 60) * .01, .7)
    for k in range(30): fx.add(65.2 + k * .06 * (1 + k * .02), step(.5 - .01 * k), .0, .5) if k < 8 else None
    rr = np.random.default_rng(5)
    for k in range(40): fx.add(66.5 + k * .045, keyclick(.5) * 1.5, rr.uniform(-.3, .3), 1.0)         # the shaking: a rattle of everything
    fx.add(66.5, rumble(2.0, .5, 70), 0, 1.0)
    fx.add(EV['boss1']['t'] - .02, tink_dull(.9), -.2, 1.0); fx.add(EV['boss1']['t'], thud(60, .5, .5), 0, .6)
    for k in range(5): fx.add(EV['boss1']['t'] + .35 + k * .22 * (1 + k * .5), coin_clink(.5 - .08 * k), -.4, .9)
    for tt, nn in zip([69.0, 69.9, 70.8], [m('F3'), m('D3'), m('A2')]): P(hall, tt, nn, 2.5, .45, True, g=.8)       # it sags, bar by bar
    # --- the friends leave (72-80): solo piano, A minor, the theme with a note missing
    bpm3 = 66; b3 = 60 / bpm3; bar3 = 4 * b3
    prog = [(m('A2'), 'm7'), (m('F2'), 'maj7'), (m('D3'), 'm7'), (m('E3'), 'dom7')]
    for i in range(2):
        for j in range(4):
            t = 72.0 + (i * 4 + j) * b3 * 1; r, k = prog[(i * 2 + j // 2) % 4]
    for i in range(3):
        t = 72 + i * bar3; r, k = prog[i % 4]; ch = up(chord(r, k), 57, 78)
        for j, nn in enumerate([r + 12, ch[1], ch[2], ch[3], ch[2], ch[1]]): P(hall, t + j * b3 * .66, nn, 3.0, .38 + .04 * (j == 0), True, bright=.3)
        stringchord(hall, t, r + 12, k, bar3 + 1.0, .28, 1.2, 1.6)
    amb.add(72, rumble(8.5, .06, 50) * np.linspace(.4, 1, int(8.5 * SR)) * np.concatenate([np.ones(int(5.0 * SR)), np.linspace(1, .1, int(3.5 * SR))]), 0, 1.0)
    fx.add(75.0, horn(1.4, .28), 0, .9); fx.add(75.1, swoosh(2.5, 200, 800, .12), .3, 1.0)
    fx.add(EV['leave1']['t'] - .02, tink_dull(.8), -.3, 1.0)
    for tt, nn in zip([73.2, 74.6, 77.4, 78.8], ['A4', 'B4', 'C5', 'A4']): P(big, tt, m(nn), 3.0, .42, True, g=.9)
    amb.add(77.0, wind(5, .06), 0, 1.0)
    # --- the bench (80-94): tender; the theme returns in the Rhodes, then blooms when the coin lands in her gullak
    bpm4 = 62; b4 = 60 / bpm4; bar4 = 4 * b4
    prog4 = [(m('C3'), 'maj7'), (m('A2'), 'm7'), (m('F2'), 'maj7'), (m('G2'), '6')]
    for i in range(4):
        t = 80 + i * bar4; r, k = prog4[i % 4]; ch = up(chord(r, k), 55, 76)
        for j, nn in enumerate([r + 12, ch[1], ch[2], ch[3], ch[2], ch[1], ch[0] + 12, ch[1]]): dry.add(t + j * b4 * .5, ep(hz(nn), 1.8, .34 + .05 * (j % 4 == 0)), (nn - 60) * .01, .55)
        padchord(hall, t, r, k, bar4 + 1.5, .2, .25, 1.6, 2.0)
    for tt, nn, d in [(86.2, 'E5', 1.2), (87.3, 'D5', .8), (88.4, 'C5', 3.0), (91.2, 'B4', 1.5), (92.6, 'C5', 3.0)]: P(hall, tt, m(nn), d + 1.5, .5, True, g=1.0)
    for tt, (r, k) in zip([88.4, 91.0], [(m('F2'), 'maj7'), (m('C3'), 'maj9')]):
        stringchord(hall, tt, r + 12, k, 4.2, .55, .6, 2.0); padchord(hall, tt, r, k, 4.2, .35, .35, .6, 2.2)
    fx.add(87.2 - .02, tink_dull(.35), -.2, .8); fx.add(87.3, swoosh(.9, 600, 2400, .15), .1, 1.0)
arc2()

# ================================================================== A3  the game  (94 - 152)
def arc3():
    # bedroom (94-98.2): a lo-fi pulse; the headphones world
    bpm = 100; b = 60 / bpm; t = 94.0
    am = [m('A2'), m('A2'), m('C3'), m('G2')]
    while t < 98.1:
        i = int(round((t - 94) / b * 2)); step_i = i % 8
        if step_i in (0, 3, 6): dry.add(t, kick(.7), 0, .8)
        if step_i in (2, 6): dry.add(t, snare(.45), 0, .7)
        dry.add(t, hat(.3 + .1 * (i % 2)), .2, .6)
        if step_i % 2 == 0: dry.add(t, bass_up(hz(am[(step_i // 2) % 4]), .35, .6), 0, .9)
        t += b / 2
    for k in range(40): fx.add(94.2 + k * .1, keyclick(.3 + .2 * ((k * 7) % 3 == 0)), np.sin(k) * .3, .8)
    fx.add(96.4, riser(1.8, .5), 0, .9)
    # the arena (98.2-108): "cool and uplifting" -- 124 bpm, Am F C G; riser into the blow, silence, then the lift
    bpm = 124; b = 60 / bpm; bar = 4 * b; prog = [(m('A2'), 'm'), (m('F2'), 'maj'), (m('C3'), 'maj'), (m('G2'), 'maj')]
    t0 = 98.2; i = 0
    while t0 < 100.45:
        r, k = prog[i % 4]
        for j in range(8):
            tt = t0 + j * b / 2
            if tt > 100.45: break
            nn = up(chord(r + 12, k), 57, 81)[[0, 1, 2, 1, 2, 1, 0, 1][j]]; dry.add(tt, lead_saw(hz(nn + 12), .3, .4, 2800), 0, .55)
            dry.add(tt, bass_up(hz(r), .22, .65), 0, .9)
            if j % 2 == 0 and tt < 99.0: dry.add(tt, kick(.8), 0, .9)
        padchord(hall, t0, r + 12, k, bar + .5, .35, .5, .3, .8)
        t0 += bar; i += 1
    fx.add(98.9, growl(1.2, .55), 0, 1.0); fx.add(99.0, swoosh(.7, 200, 900, .35), .3, 1.0)
    for tt in [99.55, 99.85, 100.5]: fx.add(tt, whoosh_sword(.8), .1, 1.0)
    fx.add(99.0, riser(1.55, .7), 0, 1.0)
    for tt in [99.62, 99.92]: fx.add(tt, slap(.5), -.1, .7)
    # --- the kill at 100.6 -> a breath, then everything arrives
    tk = 100.6
    fx.add(tk, thud(55, 1.0, 1.0), 0, 1.0); fx.add(tk, crash_ceramic(1.6, .5), 0, .7); fx.add(tk, swoosh(1.5, 200, 6000, .6, False), 0, .8)
    prog2 = [(m('F2'), 'maj'), (m('G2'), 'maj'), (m('C3'), 'maj'), (m('A2'), 'm')]
    t0 = 100.8; i = 0; bpm = 124
    while t0 < 108.0:
        r, k = prog2[i % 4]; ch = up(chord(r + 12, k), 57, 84)
        for j in range(8):
            tt = t0 + j * b / 2
            if tt >= 108.2: break
            dry.add(tt, bass_up(hz(r), .22, .72), 0, .9)
            if j % 4 == 0: dry.add(tt, kick(.8), 0, .9)
            if j % 4 == 2: dry.add(tt, clap(.55), 0, .8)
            dry.add(tt, hat(.35 + .12 * (j % 2)), .25, .6)
            dry.add(tt, lead_saw(hz(ch[[0, 1, 2, 3 % len(ch), 2, 1, 2, 1][j]] + 12), .3, .45, 3400), -.1 + .02 * j, .55)
        padchord(hall, t0, r + 12, k, bar + .6, .4, .55, .3, .9); stringchord(hall, t0, r + 24, k, bar + .6, .26, .4, .8)
        t0 += bar; i += 1
    # the victory phrase on top: the theme, but cool and lifted
    for tt, nn, d in [(101.0, 'C6', .5), (101.5, 'E6', .5), (102.0, 'G6', 1.0), (103.1, 'E6', .5), (103.6, 'D6', .5), (104.1, 'C6', 1.5)]: dry.add(tt, lead_saw(hz(m(nn)), d + .3, .5, 4500), .15, .6)
    # queen (108-120): romance inside the game
    prog3 = [(m('D3'), 'm'), (m('A2'), 'm'), (m('F2'), 'maj'), (m('G2'), 'maj')]
    t0 = 108.0; i = 0
    while t0 < 120.0:
        r, k = prog3[i % 4]; ch = up(chord(r + 12, k), 57, 84); tense = t0 >= 116.2
        for j in range(8):
            tt = t0 + j * b / 2
            if tt >= 120: break
            dry.add(tt, bass_up(hz(r), .22, .68 if not tense else .5), 0, .9)
            if not tense:
                if j % 4 == 0: dry.add(tt, kick(.7), 0, .9)
                if j % 4 == 2: dry.add(tt, clap(.45), 0, .8)
                dry.add(tt, hat(.3 + .1 * (j % 2)), .25, .6)
            dry.add(tt, lead_saw(hz(ch[[0, 1, 2, 1, 2, 3 % len(ch), 2, 1][j]] + 12), .25, .3, 3600), -.2 + .05 * j % .4, .45)
        padchord(hall, t0, r + 12, 'sus' if tense else k, bar + .6, .4, .55, .3, .9)
        t0 += bar; i += 1
    # her dash, the cuts, the first look
    fx.add(108.05, swoosh(.6, 300, 4000, .7), -.5, 1.0)
    for k in range(9): fx.add(109.2 + k * .55, swoosh(.25, 600, 3000, .4), (k % 3 - 1) * .4, .8); fx.add(109.45 + k * .55, bell(hz(m('G5')) * (1 + .12 * (k % 3)), .6, .25), .3, .6)
    theme(hall, 109.2, 124, vel=.6, felt=True, bells=True, gain=.95)                      # the theme in the middle of the neon: he's struck
    # fight (120-130): the music comes apart
    t = 120.0
    for nn in ['A2', 'E3', 'Bb3', 'C4', 'F#4']: big.add(120.0, strings(hz(m(nn)), 10, .32 + .02 * (nn == 'Bb3'), 3.0, 1.0), 0, 1.0)
    k = 0; t = 120.0
    while t < 128.5:
        fx.add(t, kick(.5 + .3 * (t - 120) / 8, True), 0, 1.0 if k % 2 == 0 else .6); t += np.interp(t, [120, 128.5], [1.0, .42]); k += 1
    for tt in [122.0, 123.4, 125.2, 126.6]:     # the coin-slips: dull falls
        fx.add(tt + .2 - .22, tink_dull(.8), -.3 if tt < 124 else .3, 1.0); fx.add(tt + .32, coin_clink(.4), 0, .8)
    for tt, f in [(122.4, 'A3'), (124.1, 'Bb3'), (125.9, 'E4')]: fx.add(tt, (saw_bl(hz(m(f)), T(.8), 12) * np.hanning(int(.8 * SR)) * .12), 0, .8)      # shouted stabs
    fx.add(127.4, rumble(1.4, .4, 60), 0, 1.0); fx.add(127.4, swoosh(1.3, 100, 700, .25), 0, 1.0); fx.add(127.5, crackle(1.2, .3, 50), 0, 1.0)  # hammers grind up out of the floor
    fx.add(128.6, riser(4.5, .8), 0, 1.0)
    # hammer (130-140)
    for tt in [132.2, 132.55]: fx.add(tt, swoosh(.5, 200, 1200, .4), .3, 1.0)
    fx.add(132.75, swoosh(.45, 300, 2500, .8, True), .3, 1.0)
    fx.add(TB_H - .005, thud(48, 1.3, 1.0), 0, 1.0); fx.add(TB_H, crash_ceramic(2.4, 1.0), 0, 1.0); fx.add(TB_H + .1, jingle(30, 2.8, .7), 0, 1.0)
    fx.add(TB_H + .05, ring(3150, 4.0, .4), .2, 1.0)
    fx.add(133.5, swoosh(.7, 150, 900, .35, False), -.3, 1.0)
    fx.add(TB_Q - .01, slap(1.0), .3, 1.0); fx.add(TB_Q - .01, thud(70, .6, .8), .3, 1.0); fx.add(TB_Q + .25, crash_ceramic(1.6, .7), .3, 1.0); fx.add(TB_Q + .3, jingle(14, 2.0, .5), .3, 1.0)
    t = 135.4
    for k in range(7): fx.add(t, step(.45 - .05 * k, True), .1 + .1 * k, 1.0); t += .8 + .12 * k
    # (the music is deliberately absent here: the master envelope removes it)
    # kneel (140-152): muted, rain, heavy low keys
    amb.add(142.0, rain_bed(36, .05) * np.minimum(1, np.arange(int(36 * SR)) / (SR * 6)), 0, 1.0)
    for tt, nn in zip([141.0, 145.4, 149.2], ['A1', 'E2', 'C2']): P(big, tt, m(nn), 6.0, .55, True, bright=.2, g=1.0)
    for tt in [142.2, 144.8, 147.4, 150.0]: fx.add(tt, reverse_bell(hz(m('G5')), .9, .45), 0, .9); fx.add(tt + .55, thud(48, .5, .3), 0, .7)
    big.add(143, sub(hz(m('A1')), 9, .1), 0, .8)
arc3()

# ================================================================== A4  the cold  (152 - 178)
def arc4():
    amb.add(152, wind(26, .06), 0, 1.0)
    big.add(152, sub(hz(m('A1')), 25, .13), 0, 1.0)
    notes = [('A2', 153.0), ('E3', 157.5), ('C3', 161.0), ('A1', 164.8), ('D3', 169.0), ('E2', 173.0)]
    for nn, tt in notes: P(big, tt, m(nn), 6.5, .5, True, bright=.18, g=1.0)
    for tt in [153.95, 155.95, 161.15, 164.55]: fx.add(tt, reverse_bell(hz(m('E5')), 1.0, .4), 0, 1.0)       # a coin offered into the dark: swallowed
    fx.add(154.9, rumble(3.6, .18, 40) * np.hanning(int(3.6 * SR)), 0, 1.0); fx.add(155.0, bp(noise(int(3 * SR)), 200, 1200) * np.hanning(int(3 * SR)) * .05, 0, 1.0)
    fx.add(T_STONE - .01, thud(40, 2.0, .55), 0, 1.0); fx.add(T_STONE + .6, crackle(3.5, .07, 8), .3, 1.0)
    fx.add(165.0, tink_dull(.6), .2, 1.0); fx.add(165.12, coin_clink(.4), .2, 1.0)
    # the turn (168-178): time passing, nobody stops
    for k in range(40): fx.add(168 + k * (.25 + .0 * k), tick(.2 * (1 - k / 60)), .3, 1.0)
    for k in range(9): fx.add(168.5 + k * 1.05, swoosh(.8, 200, 1800, .12), (k % 2) * 1.6 - .8, 1.0)
    P(hall, 177.0, m('E5'), 6.0, .22, True, g=.5)             # a far-away note: the theme remembers itself
arc4()

# ================================================================== A5  the thaw  (178 - 252)
def arc5():
    # newgirl (178-188): a note at a time
    for tt in np.arange(178.8, 181.6, .46): fx.add(tt, step(.14, True), .2, 1.0)
    P(hall, 179.4, m('E5'), 5.0, .4, True, g=1.0); P(hall, 182.0, m('G5'), 5.0, .42, True, g=1.0); P(hall, 184.4, m('A5'), 5.0, .44, True, g=1.0); P(hall, 186.6, m('E5'), 5.0, .46, True, g=1.0)
    padchord(hall, 181.5, m('C3'), 'add9', 8.0, .22, .2, 3.0, 2.5); stringchord(hall, 184.5, m('C3') + 12, 'maj7', 6.0, .2, 2.5, 2.2)
    hall.add(185.0, bell(hz(m('C6')), 2.5, .35), .3, .6)
    # river (188-200): the world opens; the theme in full, warm; lanterns twinkle
    bpm = 66; b = 60 / bpm; bar = 4 * b; prog = [(m('C3'), 'maj9'), (m('A2'), 'm9'), (m('F2'), 'maj7'), (m('G2'), '6')]
    for i in range(3):
        t = 188 + i * bar; r, k = prog[i % 4]; ch = up(chord(r, k), 55, 79)
        stringchord(hall, t, r + 12, k, bar + 1.5, .38, 1.5, 2.2); padchord(hall, t, r, k, bar + 1.5, .28, .3, 1.2, 2.2)
        for j, nn in enumerate([r + 12, ch[1], ch[2], ch[3], ch[2], ch[1]]): P(hall, t + j * b * .66 + .4, nn, 3.0, .4, True, bright=.3)
    theme(hall, 190.4, 66, vel=.6, bells=True, gain=1.0)
    rr = np.random.default_rng(11)
    for k in range(22): hall.add(188.5 + k * .52 + rr.random() * .3, bell(hz(PENT[rr.integers(0, 5)] - 0), 2.0, .12 + .08 * rr.random()), rr.uniform(-.7, .7), .55)
    amb.add(188, wind(12, .05), 0, 1.0);
    # touch (200-208): a held breath. the reach, the flinch, the hands, the palm
    stringchord(big, 200, m('C3') + 12, 'sus', 9.0, .28, 1.0, 2.0)
    fx.add(201.78, slap(.9), 0, 1.0); fx.add(201.8, thud(55, 1.0, .9), 0, 1.0)
    for nn in ['E2', 'F2', 'Bb2']: big.add(201.8, strings(hz(m(nn)), 3.0, .4, .05, 1.2), 0, 1.0)
    for k in range(10): fx.add(202.8 + k * 1.0, thud(52, .4, .22), 0, 1.0)            # the heartbeat
    P(hall, 205.6, m('G4'), 5.0, .34, True, g=.9); P(hall, 206.4, m('E5'), 5.0, .36, True, g=.9)
    padchord(big, 205.0, m('C3'), 'maj9', 4.0, .32, .3, 1.5, 2.0)
    fx.add(207.0, sub(hz(m('C2')), 4.0, .5) * 1.0, 0, 1.0); hall.add(207.6, bell(hz(m('C6')), 3.0, .4), .2, .8)
    # heal (208-220): the days turn; the stone cracks, warms, softens
    fx.add(T_THAW0 - .05, bell(hz(m('E6')), 2.5, .5), .3, .9); fx.add(T_THAW0, crackle(8.0, .22, 22), 0, 1.0)
    bpm = 60; b = 60 / bpm
    prog = [(m('A2'), 'm9'), (m('F2'), 'maj7'), (m('C3'), 'maj9'), (m('G2'), '6'), (m('F2'), 'maj7'), (m('G2'), '6'), (m('C3'), 'maj9'), (m('C3'), 'maj9')]
    for i in range(7):
        t = 208 + i * 4 * b * 1.0 * 1.0; r, k = prog[i % 8]; ch = up(chord(r, k), 55, 79)
        for j, nn in enumerate([r + 12, ch[1], ch[2], ch[3], ch[2], ch[1], ch[3], ch[2]]): P(hall, t + j * b * .5, nn, 3.2, .38 + .025 * i, True, bright=.3 + .03 * i)
        stringchord(hall, t, r + 12, k, 4 * b + 1.5, .22 + .045 * i, 1.4, 2.0); padchord(hall, t, r, k, 4 * b + 1.5, .22, .3 + .04 * i, 1.0, 2.0)
    stringchord(hall, T_THAW1 - .3, m('F3'), 'maj9', 6.0, .6, .9, 2.8); fx.add(T_THAW1, sub(hz(m('F1')), 5.0, .5), 0, 1.0); hall.add(T_THAW1 + .1, bell(hz(m('A5')), 3.5, .45), .0, .8)
    # mould (220-228): gold seams sparkle; the smile at 226
    for tt, (r, k) in zip([220.0, 223.0], [(m('A2'), 'm9'), (m('F2'), 'maj7')]): stringchord(hall, tt, r + 12, k, 4.5, .36, 1.2, 2.0)
    theme(hall, 220.2, 60, vel=.52, bells=True, gain=1.0)
    hall.add(T_SEAMS0, sparkle_run(m('C6'), 22, 3.6, .55), .1, 1.0)
    stringchord(hall, 226.0, m('C3') + 12, 'maj9', 4.5, .6, .6, 2.4); padchord(hall, 226.0, m('C3'), 'maj9', 4.5, .35, .4, .5, 2.4); hall.add(226.0, bell(hz(m('E6')), 4.0, .5), .2, .9)
    # show (228-238): joy, quietly; the coins she and he pour into each other are the notes of the theme's last bars
    bpm = 72; b = 60 / bpm; bar = 4 * b; prog = [(m('C3'), 'maj7'), (m('A2'), 'm7'), (m('F2'), 'maj7'), (m('G2'), '6')]
    for i in range(3):
        t = 228 + i * bar; r, k = prog[i % 4]; ch = up(chord(r, k), 55, 79)
        for j, nn in enumerate([r + 12, ch[1], ch[2], ch[3], ch[2], ch[1], ch[0] + 12, ch[1]]): P(hall, t + j * b * .5, nn, 2.4, .5, True, bright=.4)
        dry.add(t, bass_up(hz(r - 12), 1.6, .5), -.1); dry.add(t + 2 * b, bass_up(hz(r - 12 + 7), 1.2, .4), -.1)
        stringchord(hall, t, r + 12, k, bar + 1.4, .4, 1.0, 1.8)
    # end (238-252): "side by side" -- the same four chords, slowly, then only what is needed
    bpm = 60; b = 60 / bpm; bar = 4 * b; prog = [(m('C3'), 'maj7'), (m('A2'), 'm7'), (m('F2'), 'maj7'), (m('G2'), '6')]
    for i in range(2):
        t = 238 + i * bar; r, k = prog[i % 4]; ch = up(chord(r, k), 55, 81)
        for j, nn in enumerate([r + 12, ch[1], ch[2], ch[3], ch[2], ch[1], ch[0] + 12, ch[1]]): P(hall, t + j * b * .5, nn, 2.8, .46 + .04 * i, True, bright=.4)
        stringchord(hall, t, r + 12, k, bar + 1.6, .46, 1.0, 2.0)
    theme(hall, 241.0, 60, vel=.68, bells=True, gain=1.0, shift=0)
    stringchord(hall, 244.8, m('C3') + 12, 'maj9', 7.5, .52, 1.0, 3.0); padchord(hall, 244.8, m('C3'), 'maj9', 7.5, .3, .35, 1.0, 3.0)
    for tt, nn in [(245.6, 'E5'), (246.6, 'G5'), (247.6, 'C6'), (249.0, 'E6')]: P(hall, tt, m(nn), 6.0, .5, True, g=1.0)
    hall.add(247.5, bell(hz(m('C6')), 4.5, .55), .0, 1.0)
    P(hall, 248.0, m('C4'), 6.0, .5, True, g=.9); P(hall, 248.0, m('G3'), 6.0, .45, True, g=.8)
    hall.add(250.8, musicbox(hz(m('E6')), 2.5, .5), .0, .9)
arc5()

# ================================================================== coins: love going in, love going out
# (placed from the picture's own events, ~30ms ahead so it lands with the pulse)
def coin_in(t, who, i):
    note = PENT[i % len(PENT)]
    if who == 'g': hall.add(t - .03, musicbox(hz(note), 2.2, .6), .1, 1.0)
    elif who == 'q': fxw.add(t - .03, bell(hz(note - 12), 2.6, .5), -.3, 1.0)
    else: fxw.add(t - .03, bell(hz(note), 2.8, .62), .15, 1.0)
    fxw.add(t - .8, swoosh(.8, 500, 2400, .08), 0, 1.0)
arc_bounds = [(0, 46), (46, 94), (94, 152), (152, 178), (178, 252)]
cnt = {}
for name, e in sorted(EV.items(), key=lambda kv: kv[1]['t']):
    if e.get('out'): continue
    ai = next(i for i, (a, b) in enumerate(arc_bounds) if a <= e['t'] < b); cnt[ai] = cnt.get(ai, 0) + 1
    seq = cnt[ai] - 1
    if name.startswith('pour'): note_i = [0, 1, 2, 4, 3, 5][int(name[-1]) - 1] + 3 * 0; coin_in(e['t'], e['who'], [3, 5, 6, 5, 2, 3][int(name[-1]) - 1])
    else: coin_in(e['t'], e['who'], seq)

# ================================================================== master: space, silence, balance
def room(stem, rt, wet, damp=5000, dry_=1.0, pre=.02): stem.L, stem.R = reverb(stem.L, stem.R, rt, wet, pre, damp, 1.0, dry_)
room(hall, 3.4, .42, 6500); room(dry, .7, .12, 7000); room(big, 6.5, .6, 4200, .8); room(fxw, 2.0, .35, 7000); room(fx, 1.0, .14, 8000, 1.0, .01)
n = hall.n; t = np.arange(n) / SR
def env(points): return np.interp(t, [p[0] for p in points], [p[1] for p in points]).astype(np.float32)
# the music vanishes at the blow; the world returns very slowly
# fx may continue through the silence (the ringing, the shards, the footsteps); ambience is its own thing
L = np.zeros(n, np.float32); R_ = np.zeros(n, np.float32)
# the hall stem plays the A1/A2/queen music and the A5 thaw: we mute it only inside the silence, then allow the thaw
hallg = env([(0, .95), (TB_H - .03, .95), (TB_H, 0), (176.8, 0), (177.2, .6), (178.6, .95), (252, .95)])
bigg = env([(0, 1), (TB_H - .03, 1), (TB_H, 0), (140.4, 0), (141.4, 1), (252, 1)])
dryg = env([(0, 1), (TB_H - .03, 1), (TB_H, 0), (252, 0)])
L += hall.L * hallg + dry.L * dryg * .95 + big.L * bigg * .9 + fx.L * 1.0 + fxw.L * .9 + amb.L * 1.0
R_ += hall.R * hallg + dry.R * dryg * .95 + big.R * bigg * .9 + fx.R * 1.0 + fxw.R * .9 + amb.R * 1.0
# ---------------------------------------------------------------- loudness automation: the film's dynamics are designed, not accidental
n_out = int(DUR * SR); L = L[:n_out]; R_ = R_[:n_out]
TARGET = [(0, -40), (3, -29), (8, -24), (24, -22), (36, -20), (44, -22), (46, -27), (56, -31), (62, -36), (63.8, -30), (64.6, -21), (68, -21), (72, -26), (80, -25), (86, -23), (90, -22), (93.5, -24),
          (94.5, -20), (98, -17.5), (108, -17), (118, -18), (122, -19.5), (128, -17), (132.6, -15), (133.1, -12), (133.6, -14), (135, -30), (137, -42), (139, -38), (141, -34), (150, -33), (153, -33), (165, -33), (177, -35), (180, -31),
          (184, -28), (190, -24), (199, -26), (207, -28), (212, -24), (220, -21), (226, -20), (232, -18), (240, -19), (248, -20), (251, -30), (252, -40)]
hop = int(.25 * SR); win = int(3.0 * SR); mono = (L + R_) * .5; pw = np.hanning(win)
cur = []; ts = []
for i in range(0, n_out - hop, hop):
    seg = mono[max(0, i + hop // 2 - win // 2): i + hop // 2 + win // 2]
    if len(seg) < win: seg = np.pad(seg, (0, win - len(seg)))
    cur.append(10 * np.log10((seg ** 2 * pw).sum() / pw.sum() + 1e-12)); ts.append((i + hop / 2) / SR)
cur = np.array(cur); ts = np.array(ts)
want = np.interp(ts, [p[0] for p in TARGET], [p[1] for p in TARGET])
gdb = np.clip(want - cur, -16, 12)
# let the blow and its silence be as composed: no gain riding there
protect = np.clip(1 - np.interp(ts, [132.3, 132.9, 133.0, 135.0, 135.5], [0, 0, 1, 1, 0]), 0, 1)
gdb = gdb * protect
from scipy.ndimage import gaussian_filter1d
gdb = gaussian_filter1d(gdb, 5)                   # ~1.25 s: slow enough to be inaudible as gain riding
gain = np.interp(np.arange(n_out) / SR, ts, 10 ** (gdb / 20))
L = L * gain; R_ = R_ * gain
# a gentle limiter that keeps transients: normalise to a sane peak then soft clip
ref = np.percentile(np.abs(np.concatenate([L, R_])), 99.95)
L = np.tanh(L / ref * .8) / .8; R_ = np.tanh(R_ / ref * .8) / .8
L = hp(L, 28, 2); R_ = hp(R_, 28, 2)
fi = np.minimum(1, np.arange(n_out) / (SR * 1.5)); fo = np.minimum(1, (n_out - np.arange(n_out)) / (SR * 2.4)); L *= fi * fo; R_ *= fi * fo
pk = max(np.abs(L).max(), np.abs(R_).max()); print('peak', pk)
st = np.stack([L, R_], 1) / max(pk, 1e-6) * .93
import wave
w = wave.open('score.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
print('wrote score.wav', st.shape[0] / SR, 's')
