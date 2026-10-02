"""synth.py — instruments, effects and SFX for Gullak. Pure numpy/scipy; everything is generated, nothing sampled."""
import numpy as np
from scipy import signal

SR = 44100
rng = np.random.default_rng(7)
NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def m(name):                       # 'C4' -> midi 60, 'F#3', 'Bb2'
    n = name[0]; rest = name[1:]; acc = 0
    if rest and rest[0] in '#b': acc = 1 if rest[0] == '#' else -1; rest = rest[1:]
    return 12 * (int(rest) + 1) + NOTE[n] + acc
hz = lambda midi: 440.0 * 2 ** ((midi - 69) / 12)

def T(n): return np.arange(int(n * SR)) / SR
def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * .45) / (SR / 2), 'low', output='sos'); return signal.sosfilt(sos, x)
def hp(x, fc, order=2):
    sos = signal.butter(order, fc / (SR / 2), 'high', output='sos'); return signal.sosfilt(sos, x)
def bp(x, f0, f1, order=2):
    sos = signal.butter(order, [f0 / (SR / 2), min(f1, SR * .45) / (SR / 2)], 'band', output='sos'); return signal.sosfilt(sos, x)
def noise(n): return rng.standard_normal(n)
def fade(x, a=.005, r=.02):
    n = len(x); a = int(a * SR); r = int(r * SR)
    if a: x[:min(a, n)] *= np.linspace(0, 1, min(a, n))
    if r: x[-min(r, n):] *= np.linspace(1, 0, min(r, n))
    return x

# ------------------------------------------------------------------ stems
class Stem:
    def __init__(self, dur):
        self.n = int((dur + 8) * SR); self.L = np.zeros(self.n, np.float32); self.R = np.zeros(self.n, np.float32)
    def add(self, t, x, pan=0.0, gain=1.0):
        i = int(t * SR)
        if i >= self.n or i + len(x) <= 0: return
        if i < 0: x = x[-i:]; i = 0
        j = min(self.n, i + len(x)); x = x[:j - i]
        a = (pan + 1) * np.pi / 4; self.L[i:j] += (np.cos(a) * gain * x).astype(np.float32); self.R[i:j] += (np.sin(a) * gain * x).astype(np.float32)
    def addst(self, t, xl, xr, gain=1.0):
        i = int(t * SR); j = min(self.n, i + len(xl))
        self.L[i:j] += (gain * xl[:j - i]).astype(np.float32); self.R[i:j] += (gain * xr[:j - i]).astype(np.float32)

def reverb_ir(rt60=2.5, pre=.02, damp=5000, early=True, width=1.0):
    n = int((rt60 + pre) * SR * 1.1); t = np.arange(n) / SR
    out = []
    for ch in range(2):
        x = noise(n) * np.exp(-6.9 * np.maximum(t - pre, 0) / rt60); x[t < pre] = 0
        x = lp(x, damp, 1); x[:int(pre * SR) + 1] = 0
        if early:
            for k in range(8): x[int((pre + .006 * (k + 1) + .002 * ch * (k + 1)) * SR)] += (.5 / (k + 1)) * (1 if (k + ch) % 2 == 0 else -1)
        out.append(x)
    # decorrelate channels for width
    out[1] = out[1] * width + out[0] * (1 - width) * .3
    return out
def reverb(L, R, rt60=2.5, wet=.3, pre=.02, damp=5000, width=1.0, dry=1.0):
    irL, irR = reverb_ir(rt60, pre, damp, True, width)
    wl = signal.fftconvolve(L, irL)[:len(L)] * .03; wr = signal.fftconvolve(R, irR)[:len(R)] * .03
    return (L * dry + wl * wet * 3.2).astype(np.float32), (R * dry + wr * wet * 3.2).astype(np.float32)

# ------------------------------------------------------------------ instruments (mono arrays)
def piano(f, dur, vel=.7, bright=.55, felt=False):
    """felt/upright-ish piano by additive synthesis: stretched partials, bi-exponential decay, hammer thump."""
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    B = 0.00035 * (1 + 3 * (f < 130))
    nh = 14 if not felt else 9
    for k in range(1, nh + 1):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 11000: break
        a = (1.0 / k ** (1.15 + (1 - bright) * 1.3)) * (1 + .9 * vel * (k > 1) * (k < 6)) * (1 if k % 7 else .35)
        d1 = (0.55 + .22 * k) * (1.5 if f > 500 else 1.0) * (261 / f) ** .25; d2 = d1 * .22
        env = .62 * np.exp(-t * d1) + .38 * np.exp(-t * d2)
        det = 1 + (rng.random() - .5) * .0006
        out += a * np.sin(2 * np.pi * fk * det * t + rng.random() * 6.28) * env
    out *= (1 - np.exp(-t / (0.0035 if not felt else .009)))
    th = noise(int(.05 * SR)); th = lp(th, 900 if felt else 1800, 2) * np.exp(-np.arange(len(th)) / SR / .012) * (.05 + .1 * vel)
    out[:len(th)] += th * (1.6 if felt else 1.0)
    out = lp(out, 1800 + 6500 * bright * (.4 + vel) * (0.35 if felt else 1.0), 2)
    return fade(out * vel * .55, .002, min(.35, dur * .3))
def ep(f, dur, vel=.7):
    """Rhodes-ish electric piano: FM with decaying index + a bell-ish tine."""
    n = int(dur * SR); t = np.arange(n) / SR
    idx = (1.0 + 2.6 * vel) * np.exp(-t * 4.5); mod = np.sin(2 * np.pi * f * t)
    car = np.sin(2 * np.pi * f * t + idx * mod); tine = np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t * 14) * .08 * vel
    out = (car * np.exp(-t * 1.6) + tine) * (1 - np.exp(-t / .004)); return fade(lp(out, 5200, 1) * vel * .55, .002, .08)
def bass_up(f, dur, vel=.8):
    n = int(dur * SR); t = np.arange(n) / SR
    out = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + 2.2 * k)) for k, a in [(1, 1.0), (2, .45), (3, .22), (4, .1)])
    pl = lp(noise(int(.03 * SR)), 700, 2) * np.exp(-np.arange(int(.03 * SR)) / SR / .008); out[:len(pl)] += pl * .6
    return fade(out * vel * .8, .004, .05)
def sub(f, dur, vel=.8):
    t = T(dur); return fade(np.sin(2 * np.pi * f * t) * vel * .9, .02, .3)
def saw_bl(f, t, k=14):
    return sum(np.sin(2 * np.pi * f * h * t) / h for h in range(1, k + 1) if np.max(f) * h < 12000) * (2 / np.pi)
def pad(f, dur, vel=.5, bright=.35, att=1.2, rel=1.6, det=.004, voices=3):
    t = T(dur); out = np.zeros(len(t))
    for v in range(voices):
        d = 1 + (v - (voices - 1) / 2) * det; out += saw_bl(f * d, t, 10)
    out = lp(out / voices, 400 + 3500 * bright, 2); env = np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel)
    return out * env * vel * .45
def strings(f, dur, vel=.5, att=1.0, rel=1.4):
    t = T(dur); vib = 1 + .0035 * np.sin(2 * np.pi * 5.1 * t) * np.minimum(1, t / 1.5)
    out = sum(saw_bl(f * d * vib, t, 12) for d in (1.0, 1.003, .997, 2.001 * .5 * 2)) / 4
    out = lp(out, 2600, 2) * np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel); return out * vel * .5
def bell(f, dur, vel=.6, shimmer=True):
    t = T(dur); out = np.zeros(len(t))
    for r, a, d in [(1, 1, 2.2), (2.0, .38, 3.2), (2.76, .26, 4.0), (4.07, .16, 5.5), (5.4, .1, 7.0), (8.93, .05, 11)]:
        out += a * np.sin(2 * np.pi * f * r * t + rng.random() * 6) * np.exp(-t * d)
    out *= (1 - np.exp(-t / .0015)); return fade(out * vel * .5, .0005, .05)
def musicbox(f, dur, vel=.6):
    t = T(dur); out = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 3.0), (3.0, .22, 7.0), (5.0, .08, 11.0)])
    return fade(out * (1 - np.exp(-t / .001)) * vel * .55, .0005, .04)
def lead_saw(f, dur, vel=.6, cut=3200, vibr=True):
    t = T(dur); vib = 1 + (.004 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .4) if vibr else 0)
    out = (saw_bl(f * vib, t, 18) + .6 * saw_bl(f * 1.004 * vib, t, 18)); out = lp(out, cut, 2) * (1 - np.exp(-t / .008)) * np.exp(-t * .9)
    return fade(out * vel * .4, .002, .08)
def kick(vel=.9, long=False):
    t = T(.35 if not long else .6); ph = np.cumsum(2 * np.pi * (45 + 110 * np.exp(-t * 35)) / SR)
    return np.sin(ph) * np.exp(-t * (11 if not long else 7)) * vel + lp(noise(len(t)), 1800, 1) * np.exp(-t * 90) * .15 * vel
def snare(vel=.7):
    t = T(.22); return (bp(noise(len(t)), 1500, 9000) * np.exp(-t * 26) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * .4) * vel * .7
def hat(vel=.5, open_=False):
    t = T(.25 if open_ else .06); return hp(noise(len(t)), 7000, 2) * np.exp(-t * (14 if open_ else 80)) * vel * .35
def clap(vel=.6):
    t = T(.2); e = np.exp(-t * 30) * (1 + .8 * (np.sin(2 * np.pi * 90 * t) > 0)); return bp(noise(len(t)), 900, 6000) * e * vel * .6
def brush(dur=.25, vel=.4):
    t = T(dur); return bp(noise(len(t)), 3000, 9500) * np.sin(np.pi * np.minimum(1, t / dur)) ** 1.5 * vel * .3

# ------------------------------------------------------------------ SFX
def swoosh(dur=.5, f0=400, f1=3000, vel=.5, up=True):
    t = T(dur); x = noise(len(t)); fc = np.linspace(f0, f1, len(t)) if up else np.linspace(f1, f0, len(t))
    y = bp(x, 300, 5000) * np.sin(np.pi * t / dur) ** 1.4; return y * vel * .6
def whoosh_sword(vel=.6):
    t = T(.28); return (hp(noise(len(t)), 1500, 2) * np.sin(np.pi * np.minimum(1, t / .28)) ** 2 * np.exp(-t * 4)) * vel * .55
def thud(f=70, dur=.5, vel=.8):
    t = T(dur); ph = np.cumsum(2 * np.pi * (f + 90 * np.exp(-t * 30)) / SR); return np.sin(ph) * np.exp(-t * 9) * vel
def tink_dull(vel=.5):   # a coin leaving love: dull, dropping, a little empty
    t = T(.9); out = sum(a * np.sin(2 * np.pi * f * np.exp(-t * .3) * t) * np.exp(-t * d) for f, a, d in [(1180, 1, 7), (2310, .4, 11), (3350, .25, 16)])
    return lp(out, 3500, 2) * vel * .5
def coin_clink(vel=.5):  # on the ground
    t = T(.5); out = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(2400, 1, 18), (3600, .5, 22), (5100, .3, 30)]); return out * vel * .4
def crash_ceramic(dur=2.0, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    base = bp(noise(n), 400, 9000) * np.exp(-t * 6) * .9; out += base
    for k in range(70):   # shards
        tt = .02 + (k / 70) ** 1.6 * 1.6 + rng.random() * .05; f = rng.uniform(1800, 7000); i = int(tt * SR); L = int(.04 * SR)
        if i + L < n: out[i:i + L] += np.sin(2 * np.pi * f * np.arange(L) / SR) * np.exp(-np.arange(L) / SR * rng.uniform(60, 160)) * rng.uniform(.1, .6)
    out[:int(.01 * SR)] += hp(noise(int(.01 * SR)), 2000, 2) * 1.2
    return out * vel * .55
def jingle(n_coins=20, dur=2.4, vel=.6):
    out = np.zeros(int(dur * SR))
    for k in range(n_coins):
        tt = (k / n_coins) ** 1.3 * (dur - .5) + rng.random() * .05; f = rng.uniform(2200, 5200); c = coin_clink(rng.uniform(.4, 1.0)) * rng.uniform(.4, 1)
        i = int(tt * SR); out[i:i + len(c)] += c[:len(out) - i]
    return out * vel
def ring(f=3100, dur=3.0, vel=.25):   # the ringing silence after a blow
    t = T(dur); return np.sin(2 * np.pi * f * t) * np.exp(-t * .9) * (1 - np.exp(-t / .3)) * vel * .6
def rain_bed(dur, vel=.3, dens=1.0):
    n = int(dur * SR); x = noise(n); y = bp(x, 900, 4500) * .22 + lp(x, 600, 1) * .06; return y * vel
def wind(dur, vel=.3):
    n = int(dur * SR); t = np.arange(n) / SR; x = lp(noise(n), 700, 2) * (.6 + .4 * np.sin(2 * np.pi * .13 * t) * np.sin(2 * np.pi * .071 * t + 1)) * vel * 1.2; return x
def rumble(dur, vel=.3, f=60):
    n = int(dur * SR); t = np.arange(n) / SR; return lp(noise(n), 120, 2) * vel * 2.0 * (.7 + .3 * np.sin(2 * np.pi * 11 * t))
def horn(dur=1.5, vel=.4):
    t = T(dur); y = (saw_bl(233, t, 8) + saw_bl(294, t, 8)) * .5; y = lp(y, 1200, 2) * np.minimum(1, t / .08) * np.minimum(1, (dur - t) / .4); return y * vel
def keyclick(vel=.4):
    t = T(.03); return (bp(noise(len(t)), 1800, 6500) * np.exp(-t * 260) + np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 300) * .3) * vel * .6
def tick(vel=.4):
    t = T(.04); return bp(noise(len(t)), 2200, 5200) * np.exp(-t * 180) * vel * .6
def step(vel=.4, soft=True):
    t = T(.12); return (lp(noise(len(t)), 600 if soft else 1200, 2) * np.exp(-t * 40) + np.sin(2 * np.pi * 85 * t) * np.exp(-t * 36) * .6) * vel * .6
def growl(dur=1.4, vel=.6):
    t = T(dur); y = saw_bl(55 * (1 + .1 * np.sin(2 * np.pi * 5 * t)), t, 20) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 38 * t))); y = lp(y, 900, 2) * np.minimum(1, t / .1) * np.exp(-t * 1.4); return y * vel * .8
def slap(vel=.8):
    t = T(.12); return (hp(noise(len(t)), 900, 2) * np.exp(-t * 55) * .8 + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 40) * .3) * vel * .7
def crackle(dur=4.0, vel=.25, rate=14):
    n = int(dur * SR); out = np.zeros(n)
    for k in range(int(dur * rate)):
        i = int(rng.random() * (n - 800)); L = int(rng.uniform(.002, .01) * SR); out[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / L * 5) * rng.uniform(.2, 1)
    return hp(out, 1500, 2) * vel
def riser(dur=3.0, vel=.5):
    t = T(dur); x = noise(len(t)); y = bp(x, 400, 9000) * (t / dur) ** 2.2; return y * vel * .7
def reverse_bell(f, dur=1.2, vel=.5):
    b = bell(f, dur, vel)[::-1].copy(); return fade(b, .02, .05)
def sparkle_run(f0=m('C6'), n=12, spread=1.4, vel=.4, scale=(0, 2, 4, 7, 9)):
    out = np.zeros(int((spread + 2.5) * SR))
    for k in range(n):
        i = int(k / n * spread * SR); fr = hz(f0 + 12 * (k // 5) + scale[k % 5]); b = bell(fr, 1.8, vel * (.7 + .3 * k / n)); out[i:i + len(b)] += b[:len(out) - i]
    return out
