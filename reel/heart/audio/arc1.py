# arc1.py — the sound of "Growing up" (Arc 1 of Gullak).
# A muffled upright-like piano (Salamander Grand Piano V3 by Alexander Holm, CC-BY 3.0, played soft and felted),
# its pedal and hammer noises close to the ear, room tone and tape hiss — then a gentle pulse as he grows, a crowd,
# and dusk. Every coin is a chime tuned to the key, with the small clay "tock" of the gullak.
import numpy as np, soundfile as sf, os, json
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

SR = 48000; DUR = 38.5; N = int(SR * (DUR + 3))
HERE = os.path.dirname(os.path.abspath(__file__)); SAMP = os.path.join(HERE, "samples/sal/Samples")
rng = np.random.default_rng(7)
mix = {k: np.zeros((N, 2)) for k in ["piano", "pad", "fx", "amb", "perc", "chime"]}

def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x, axis=0)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x, axis=0)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x, axis=0)
def add(bus, t, sig, gain=1.0, pan=0.0):
    i = int(t * SR);
    if i >= N: return
    s = sig if sig.ndim == 2 else np.stack([sig * np.sqrt((1 - pan) / 2) * 1.414, sig * np.sqrt((1 + pan) / 2) * 1.414], 1)
    n = min(len(s), N - i); mix[bus][i:i + n] += s[:n] * gain

# ------------------------------------------------------------------ piano (sampled)
NAMES = {"C": 0, "D#": 3, "F#": 6, "A": 9}
def midi(n):  # "D5" -> 74
    name, oc = (n[:-1], int(n[-1])); base = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}[name]; return 12 * (oc + 1) + base
_cache = {}
def sample(m, layer):
    best = None
    for nm, pc in NAMES.items():
        for oc in range(1, 8):
            mm = 12 * (oc + 1) + pc
            if best is None or abs(mm - m) < abs(best[1] - m): best = (f"{nm}{oc}", mm)
    key = (best[0], layer)
    if key not in _cache:
        x, sr = sf.read(os.path.join(SAMP, f"{best[0]}v{layer}.flac"), always_2d=True)
        if sr != SR: x = resample_poly(x, SR, sr, axis=0)
        _cache[key] = x
    return _cache[key], best[1]
def piano(t, note, vel=.5, dur=3.0, gain=1.0, felt=2600, pan=0.0):
    m = midi(note) if isinstance(note, str) else note
    layer = 4 if vel < .4 else 7 if vel < .75 else 10
    x, mm = sample(m, layer); r = 2 ** ((m - mm) / 12)
    if abs(r - 1) > 1e-4:
        idx = np.arange(0, len(x) - 1, r); i0 = idx.astype(int); f = (idx - i0)[:, None]; x = x[i0] * (1 - f) + x[np.minimum(i0 + 1, len(x) - 1)] * f
    L = int((dur + 1.2) * SR); x = x[:L].copy()
    env = np.ones(len(x)); rel = int(dur * SR)
    if rel < len(x): env[rel:] = np.exp(-np.arange(len(x) - rel) / (SR * .35))
    x = x * env[:, None]
    x = lp(x, felt, 2)                                     # the felt: soft, close, warm
    w = .5 + .5 * pan; x = x * np.array([1.4 - w * .6, .8 + w * .6])
    add("piano", t, x, gain * (.4 + vel * .6))
def noise_sample(t, name, gain=.4):
    p = os.path.join(SAMP, name)
    if os.path.exists(p):
        x, sr = sf.read(p, always_2d=True)
        if sr != SR: x = resample_poly(x, SR, sr, axis=0)
        add("fx", t, x, gain)
def pedal(t, down=True, g=.5): noise_sample(t, "pedalD1.flac" if down else "pedalU1.flac", g)

# ------------------------------------------------------------------ synth voices
def tt(d): return np.arange(int(d * SR)) / SR
def adsr(n, a, r, d=None):
    e = np.ones(n); A = max(1, int(a * SR)); R = max(1, int(r * SR)); e[:A] = np.linspace(0, 1, A); e[-R:] *= np.linspace(1, 0, R) ** 2; return e
def f0(m): return 440 * 2 ** ((m - 69) / 12)
def pad(t, notes, d, gain=.12, bright=900, a=1.5, r=2.5):
    T = tt(d); out = np.zeros((len(T), 2))
    for k, n in enumerate(notes):
        m = midi(n) if isinstance(n, str) else n
        for det, side in [(-.07, 0), (.06, 1), (0.0, 0), (.0, 1)]:
            ph = 2 * np.pi * f0(m + det / 1) * T + rng.random() * 6.28
            s = sum(np.sin(ph * h) / h ** 1.6 for h in range(1, 7))
            out[:, side] += s
    out = lp(out, bright, 2) * adsr(len(T), a, r)[:, None] / (len(notes) * 2)
    add("pad", t, out, gain)
def chime(t, note, gain=.35, pan=0.0, d=4.0):
    m = midi(note); T = tt(d); s = np.zeros(len(T))
    for h, a, dec in [(1, 1, 1.6), (2.76, .45, .9), (5.4, .25, .5), (8.9, .12, .3), (4.0, .18, 1.2)]:
        s += a * np.sin(2 * np.pi * f0(m) * h * T) * np.exp(-T / dec)
    s *= np.minimum(1, T / .002)
    add("chime", t, s, gain, pan)
def tock(t, gain=.5):  # the coin landing in clay: a soft knock with a hollow body
    T = tt(.5); s = np.sin(2 * np.pi * 210 * T) * np.exp(-T / .05) * .8 + np.sin(2 * np.pi * 420 * T) * np.exp(-T / .03) * .3
    nz = bp(rng.standard_normal(len(T)), 600, 3000) * np.exp(-T / .012) * .5
    add("fx", t, s + nz, gain)
def swell(t, d, gain=.2, f=(300, 3000)):  # an air swell (reverse-like rise)
    T = tt(d); s = bp(rng.standard_normal((len(T), 2)), *f) * (T / d)[:, None] ** 2.2
    add("fx", t, s * np.exp(-np.maximum(0, T - d + .02)[:, None] * 40), gain)
def kick(t, gain=.5):
    T = tt(.45); fr = 46 + 70 * np.exp(-T / .03); s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-T / .16); add("perc", t, s, gain)
def shaker(t, gain=.12, pan=.2):
    T = tt(.12); s = hp(rng.standard_normal(len(T)), 5000) * np.exp(-T / .03); add("perc", t, s, gain, pan)
def scratch(t, d, gain=.12):  # crayon on paper: grainy bursts
    T = tt(d); s = bp(rng.standard_normal(len(T)), 1500, 7000) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 5.3 * T / 2))) * (rng.random(len(T)) > .3)
    add("fx", t, lp(s, 6000) * adsr(len(T), .05, .1), gain, -.2)
def steps(times, gain=.25, bright=1800):
    for i, t in enumerate(times):
        T = tt(.18); s = lp(rng.standard_normal(len(T)), bright) * np.exp(-T / .03) + np.sin(2 * np.pi * 90 * T) * np.exp(-T / .04) * .5
        add("fx", t, s, gain * (.8 + .4 * rng.random()), (-.3 if i % 2 else .3))
def crowd(t, d, gain=.25):
    T = tt(d); s = np.zeros((len(T), 2))
    for k in range(14):
        f = 300 + rng.random() * 900; mod = 1 + .3 * np.sin(2 * np.pi * (3 + rng.random() * 4) * T + rng.random() * 6)
        v = bp(rng.standard_normal(len(T)), f * .8, f * 1.4) * mod; s[:, k % 2] += v
    s = s * adsr(len(T), .25, 1.6)[:, None] / 4; add("amb", t, s, gain)

# ------------------------------------------------------------------ the score
cues = json.load(open(os.path.join(HERE, "cues.json"))) if os.path.exists(os.path.join(HERE, "cues.json")) else {}
COINS = cues.get("coins", [13.0, 14.4, 21.5, 26.5, 26.85, 27.2, 27.6, 33.5])

# room tone + tape hiss through S1-S2; the fan's slow whoosh
T = tt(16.2); room = lp(rng.standard_normal((len(T), 2)), 500) * .5 + hp(rng.standard_normal((len(T), 2)), 6000) * .05
room *= (1 + .25 * np.sin(2 * np.pi * .38 * T))[:, None]; room *= np.minimum(1, T / 1.5)[:, None] * np.minimum(1, (16.2 - T) / .3)[:, None]
add("amb", 0, room, .05)

# S1 — the drawing (0-8): a pedal goes down, a few notes in the sun, crayon
pedal(.3, True, .55)
for t, n, v in [(1.0, "D5", .3), (1.9, "A4", .25), (2.7, "F#5", .3), (3.6, "E5", .25), (4.5, "D5", .3), (4.5, "D3", .25)]: piano(t, n, v, 3.2, felt=2200)
for t0 in [.7, 1.6, 2.4, 3.2]: scratch(t0, .6, .14)
# he lifts it to the light: a rising phrase; the world turns: a swell that resolves at 8.0
for t, n, v in [(5.2, "A4", .35), (5.5, "D5", .35), (5.8, "F#5", .4), (6.15, "A5", .42)]: piano(t, n, v, 2.6, felt=2600)
pad(5.6, ["D4", "A4", "E5"], 3.2, .10, 1400, a=1.8, r=1.0); swell(6.2, 1.8, .10, (800, 6000))
chime(6.4, "A6", .06, .3); chime(7.1, "E6", .05, -.3)

# S2 — the first coin (8-16)
pedal(7.95, False, .35); pedal(8.02, True, .5)
motif = [(8.0, "F#5"), (8.55, "A5"), (9.1, "E5"), (9.65, "D5"), (11.3, "F#5"), (11.85, "B5"), (12.4, "A5")]
for t, n in motif: piano(t, n, .45, 1.8)
for t, ns in [(8.0, ["D3", "A3", "F#4"]), (9.65, ["C#3", "A3", "E4"]), (11.3, ["B2", "F#3", "D4"]), (13.0, ["G2", "D3", "B3"]), (14.4, ["D3", "A3", "F#4"])]:
    for k, n in enumerate(ns): piano(t + k * .09, n, .35, 2.4, felt=1800)
pad(8.0, ["D3", "A3", "F#4"], 3.4, .08, 700); pad(11.3, ["B2", "F#3", "D4"], 3.0, .08, 700); pad(13.0, ["G2", "D3", "B3", "F#4"], 3.6, .1, 900)
steps([8.0 + i * .19 for i in range(9)], .18, 2400)                 # small feet running in
# the coins: hers (slow, warm), his father's (bright, playful)
swell(12.1, .9, .07, (1500, 7000)); chime(13.0, "A5", .2); chime(13.0, "D6", .1, .2); tock(13.0, .45); piano(13.15, "D6", .35, 3.0, felt=3200)
chime(14.4, "F#6", .17, .3); tock(14.4, .4); piano(14.5, "A5", .3, 2.0, felt=3200)
for t, n in [(14.9, "D5"), (15.2, "E5"), (15.5, "F#5")]: piano(t, n, .4, 1.0)

# S3 — the run (16-28.5): 96 bpm; he grows bar by bar
B = .625; prog = [["D2", "D3", "A3", "F#4"], ["C#2", "C#3", "A3", "E4"], ["B1", "B2", "F#3", "D4"], ["G1", "G2", "D3", "B3"], ["D2", "D3", "A3", "F#4"]]
osti = lambda ch: [ch[1], ch[2], ch[3], ch[2], midi(ch[3]) + 12, ch[2], ch[3], ch[2]]
for bar in range(5):
    t0 = 16.0 + bar * 4 * B; ch = prog[bar]
    piano(t0, ch[0], .55, 2.4, .9, felt=1500)
    for k, n in enumerate(osti(ch)): piano(t0 + k * B / 2, n, .32 + .08 * bar / 4, B * .9, .95, felt=2000 + bar * 350, pan=(.2 if k % 2 else -.2))
    pad(t0, ch[1:], 4 * B + .4, .07 + .03 * bar, 700 + bar * 300, a=.6, r=.8)
    if bar >= 1:
        for k in range(4): kick(t0 + k * B, .22 + .05 * bar)
    if bar >= 2:
        for k in range(8): shaker(t0 + k * B / 2 + B / 4, .05 + .02 * bar, .3 if k % 2 else -.3)
# the melody over the run, growing with him
mel = [(17.25, "F#5"), (17.875, "A5"), (18.5, "E5"), (19.75, "D5"), (20.375, "E5"), (21.0, "F#5"), (21.5, "A5"), (22.5, "B5"), (23.125, "A5"), (23.75, "F#5"),
       (24.375, "D6"), (25.0, "E6"), (25.625, "F#6")]
for t, n in mel: piano(t, n, .5, B * 1.6, felt=3000)
chime(21.5, "D6", .28); tock(21.5, .35)                               # the teacher's coin
crowd(23.0, 5.5, .10); crowd(25.9, 3.0, .22)                        # the stands, then the roar
swell(24.9, 1.4, .14, (400, 8000)); kick(26.3, .6)
T = tt(4.0); crash = hp(rng.standard_normal((len(T), 2)), 3000) * np.exp(-T / 1.2)[:, None]; add("perc", 26.3, crash, .1)
for t, n in [(26.3, "D6"), (26.3, "A5"), (26.3, "F#5")]: piano(t, n, .7, 2.2, felt=3600)
for t, n in zip([26.5, 26.85, 27.2, 27.6], ["D6", "F#6", "A6", "D7"]): chime(t, n, .2, (-.4 + .27 * (t - 26.5) * 3)); tock(t, .25)
pad(26.3, ["D3", "A3", "F#4", "A4", "E5"], 2.6, .14, 1600, a=.2, r=1.8)

# S4 — dusk (28.5-38.5): crickets, the city far away, one more coin, and the road
T = tt(10.2); cr = np.zeros((len(T), 2))
for k in range(5):
    f = 4200 + k * 370; gate = (np.sin(2 * np.pi * (2.2 + k * .3) * T + k) > .6).astype(float); cr[:, k % 2] += np.sin(2 * np.pi * f * T) * lp(gate, 60, 1) * .3
hum = lp(rng.standard_normal((len(T), 2)), 180) * .6
amb4 = (cr * .5 + hum) * np.minimum(1, T / 1.0)[:, None] * np.minimum(1, (10.2 - T) / 1.5)[:, None]; add("amb", 28.5, amb4, .06)
pedal(28.45, True, .5)
for t, n, v in [(28.6, "D3", .3), (28.6, "A3", .25), (29.4, "F#5", .3), (30.6, "E5", .28), (31.8, "D5", .28), (31.8, "B2", .25), (33.5, "A5", .32), (35.0, "G2", .28), (35.0, "D4", .25), (35.6, "B4", .25)]:
    piano(t, n, v, 3.5, 1.4, felt=2000)
pad(28.6, ["D3", "A3", "E4"], 4.0, .08, 600); pad(31.8, ["B2", "F#3", "D4"], 3.4, .08, 600)
swell(32.7, .9, .05, (1500, 7000)); chime(33.5, "D6", .2); tock(33.5, .3)
steps([35.7 + i * .52 for i in range(5)], .1, 1600)
# the title: the chord that has been waiting all arc, Dadd9 with the low D, held into the dark
for k, n in enumerate(["D2", "A2", "F#3", "E4", "A4", "D5"]): piano(36.0 + k * .07, n, .4, 3.0, felt=2400)
pad(36.0, ["D2", "A2", "F#3", "E4", "A4"], 3.0, .12, 900, a=.8, r=2.2); chime(36.2, "E6", .07)
pedal(38.3, False, .3)

# ------------------------------------------------------------------ mix: reverb, levels, master
def verb(x, t60=2.2, wet=.25, pre=.012):
    L = int(t60 * SR); T = np.arange(L) / SR; ir = rng.standard_normal((L, 2)) * np.exp(-6.9 * T / t60)[:, None]; ir = lp(ir, 5000); ir[:int(pre * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(0)); y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1); return x * (1 - wet) + y * wet * 1.6
out = verb(mix["piano"], 2.4, .28) * 1.0 + verb(mix["pad"], 3.0, .45) * 1.0 + verb(mix["chime"], 3.5, .5) * 1.0 + verb(mix["fx"], 1.2, .15) * .9 + mix["amb"] + verb(mix["perc"], 1.0, .12) * .9
out = out[:int(DUR * SR)]
fade = np.ones(len(out)); fade[:int(.2 * SR)] = np.linspace(0, 1, int(.2 * SR)); out *= fade[:, None]
pk = np.abs(out).max(); out = out / pk * .89
sf.write(os.path.join(HERE, "arc1.wav"), out, SR, subtype="PCM_24"); print("peak", pk, "len", len(out) / SR)
