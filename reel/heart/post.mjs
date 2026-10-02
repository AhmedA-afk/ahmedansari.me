// post.mjs — the lens: bloom from the bright things (rims, hearts, coins, the sun), a soft diffusion that makes the
// light feel like air, a filmic tone curve with a colour grade, vignette and grain.
const box = (a, w, h, r) => { // separable box blur of a 3-channel float buffer, radius r
  const t = new Float32Array(a.length), n = 2 * r + 1;
  for (let y = 0; y < h; y++) { for (let c = 0; c < 3; c++) { let s = 0; for (let x = -r; x <= r; x++) s += a[(y * w + Math.min(w - 1, Math.max(0, x))) * 3 + c];
    for (let x = 0; x < w; x++) { t[(y * w + x) * 3 + c] = s / n; const xo = Math.max(0, x - r), xi = Math.min(w - 1, x + r + 1); s += a[(y * w + xi) * 3 + c] - a[(y * w + xo) * 3 + c]; } } }
  for (let x = 0; x < w; x++) { for (let c = 0; c < 3; c++) { let s = 0; for (let y = -r; y <= r; y++) s += t[(Math.min(h - 1, Math.max(0, y)) * w + x) * 3 + c];
    for (let y = 0; y < h; y++) { a[(y * w + x) * 3 + c] = s / n; const yo = Math.max(0, y - r), yi = Math.min(h - 1, y + r + 1); s += t[(yi * w + x) * 3 + c] - t[(yo * w + x) * 3 + c]; } } }
};
// o: { thr, bloom, diffusion, lift, gamma, sat, tint:[r,g,b] mult, shadowTint:[r,g,b] add, vignette, fade (0..1 to black), grain:{tiles,i,amt} }
export function post(ctx, W, H, o = {}) {
  const { thr = .62, bloom = .9, diffusion = .14, lift = .012, sat = 1.04, tint = [1, 1, 1], shadowTint = [0, 0, 0], vignette = .22, fade = 0, contrast = 1.05 } = o;
  const img = ctx.getImageData(0, 0, W, H), d = img.data, sc = 6, w = Math.ceil(W / sc), h = Math.ceil(H / sc);
  const B = new Float32Array(w * h * 3), D = new Float32Array(w * h * 3), cnt = new Float32Array(w * h);
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4, j = ((y / sc | 0) * w + (x / sc | 0));
    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, l = .2126 * r + .7152 * g + .0722 * b, k = l > thr ? (l - thr) / (1 - thr) : 0;
    B[j * 3] += r * k; B[j * 3 + 1] += g * k; B[j * 3 + 2] += b * k; D[j * 3] += r; D[j * 3 + 1] += g; D[j * 3 + 2] += b; cnt[j]++; }
  for (let j = 0; j < w * h; j++) { const c = cnt[j] || 1; for (let k = 0; k < 3; k++) { B[j * 3 + k] /= c; D[j * 3 + k] /= c; } }
  const B2 = Float32Array.from(B); box(B, w, h, 2); box(B, w, h, 2); box(B2, w, h, 9); box(B2, w, h, 9); box(D, w, h, 6); box(D, w, h, 6);
  const cx = W / 2, cy = H / 2, rr = Math.hypot(cx, cy);
  for (let y = 0; y < H; y++) { const fy = y / sc - .5, y0 = Math.max(0, Math.min(h - 1, fy | 0)), y1 = Math.min(h - 1, y0 + 1), ty = Math.max(0, Math.min(1, fy - y0));
    for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, fx = x / sc - .5, x0 = Math.max(0, Math.min(w - 1, fx | 0)), x1 = Math.min(w - 1, x0 + 1), tx = Math.max(0, Math.min(1, fx - x0));
      const j00 = (y0 * w + x0) * 3, j10 = (y0 * w + x1) * 3, j01 = (y1 * w + x0) * 3, j11 = (y1 * w + x1) * 3;
      const vg = 1 - vignette * Math.pow(Math.hypot(x - cx, y - cy) / rr, 2.2);
      let v = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const bl = (B[j00 + c] * (1 - tx) + B[j10 + c] * tx) * (1 - ty) + (B[j01 + c] * (1 - tx) + B[j11 + c] * tx) * ty;
        const bw = (B2[j00 + c] * (1 - tx) + B2[j10 + c] * tx) * (1 - ty) + (B2[j01 + c] * (1 - tx) + B2[j11 + c] * tx) * ty;
        const df = (D[j00 + c] * (1 - tx) + D[j10 + c] * tx) * (1 - ty) + (D[j01 + c] * (1 - tx) + D[j11 + c] * tx) * ty;
        let p = d[i + c] / 255;
        p = 1 - (1 - p) * (1 - Math.min(1, (bl * 1.2 + bw * .9) * bloom * (c === 2 ? .82 : 1)));
        p = 1 - (1 - p) * (1 - df * diffusion);
        v[c] = p;
      }
      const l = .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
      for (let c = 0; c < 3; c++) { let p = l + (v[c] - l) * sat; p = p * tint[c] + shadowTint[c] * (1 - l) * (1 - l);
        p = (p - .5) * contrast + .5; p = p < 0 ? 0 : p; p = p / (1 + p * .06) * 1.06; p = lift + p * (1 - lift); d[i + c] = Math.max(0, Math.min(255, p * vg * (1 - fade) * 255)); }
    } }
  ctx.putImageData(img, 0, 0);
  if (o.grain) { const { tiles, i: gi, amt = .09 } = o.grain, T = tiles[gi % tiles.length]; ctx.save(); ctx.globalAlpha = amt; ctx.globalCompositeOperation = "overlay";
    const ox = (gi * 97) % 256, oy = (gi * 61) % 256; for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(T, x, y); ctx.restore(); }
}
