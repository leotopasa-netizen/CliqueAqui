// Briques de synthèse et de traitement du son (48 kHz). Tout est reproductible : pas de hasard non semé.
export const SR = 48000;
export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
export const dB = (x) => 20 * Math.log10(Math.max(x, 1e-9));
export const fromDb = (d) => Math.pow(10, d / 20);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const secs = (s) => Math.round(s * SR);

// Générateur pseudo-aléatoire semé (bruit reproductible)
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Filtre biquad (formules RBJ)
export class Biquad {
  constructor(type, f, q = 0.7071, gainDb = 0) {
    this.z1 = 0;
    this.z2 = 0;
    this.set(type, f, q, gainDb);
  }
  set(type, f, q = 0.7071, gainDb = 0) {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    const A = Math.pow(10, gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === "lp") [b0, b1, b2, a0, a1, a2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2, 1 + al, -2 * cs, 1 - al];
    else if (type === "hp") [b0, b1, b2, a0, a1, a2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2, 1 + al, -2 * cs, 1 - al];
    else if (type === "bp") [b0, b1, b2, a0, a1, a2] = [al, 0, -al, 1 + al, -2 * cs, 1 - al];
    else if (type === "peak") [b0, b1, b2, a0, a1, a2] = [1 + al * A, -2 * cs, 1 - al * A, 1 + al / A, -2 * cs, 1 - al / A];
    else if (type === "hs") {
      const s = 2 * Math.sqrt(A) * al;
      [b0, b1, b2, a0, a1, a2] = [A * (A + 1 + (A - 1) * cs + s), -2 * A * (A - 1 + (A + 1) * cs), A * (A + 1 + (A - 1) * cs - s), A + 1 - (A - 1) * cs + s, 2 * (A - 1 - (A + 1) * cs), A + 1 - (A - 1) * cs - s];
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }
  tick(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
  run(buf) {
    for (let i = 0; i < buf.length; i++) buf[i] = this.tick(buf[i]);
    return buf;
  }
}

// Filtre à variable d'état (fréquence modifiable à chaque échantillon) : balayages
export class SVF {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
  }
  tick(x, fc, q = 0.8) {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2;
    this.bp = v1;
    this.hp = x - k * v1 - v2;
    return this;
  }
}

// Dent de scie sans repliement (polyBLEP)
const blep = (t, dt) => {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
};
export const saw = (phase, dt) => 2 * phase - 1 - blep(phase, dt);

// Piste stéréo
export class Track {
  constructor(seconds) {
    this.n = secs(seconds);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  // ajoute un son mono à l'instant `at` (s), avec gain et position gauche/droite (-1..1, puissance constante)
  add(sig, at, gain = 1, pan = 0) {
    const a = ((pan + 1) * Math.PI) / 4;
    const gl = Math.cos(a) * gain * Math.SQRT2;
    const gr = Math.sin(a) * gain * Math.SQRT2;
    const o = secs(at);
    for (let i = 0; i < sig.length; i++) {
      const j = o + i;
      if (j < 0) continue;
      if (j >= this.n) break;
      this.L[j] += sig[i] * gl * 0.7071;
      this.R[j] += sig[i] * gr * 0.7071;
    }
  }
  addStereo(l, r, at, gain = 1) {
    const o = secs(at);
    for (let i = 0; i < l.length; i++) {
      const j = o + i;
      if (j < 0) continue;
      if (j >= this.n) break;
      this.L[j] += l[i] * gain;
      this.R[j] += r[i] * gain;
    }
  }
  mix(other, gain = 1) {
    for (let i = 0; i < this.n; i++) {
      this.L[i] += other.L[i] * gain;
      this.R[i] += other.R[i] * gain;
    }
  }
  scale(g) {
    for (let i = 0; i < this.n; i++) {
      this.L[i] *= g;
      this.R[i] *= g;
    }
  }
  peak() {
    let m = 0;
    for (let i = 0; i < this.n; i++) m = Math.max(m, Math.abs(this.L[i]), Math.abs(this.R[i]));
    return m;
  }
  rms(a = 0, b = this.n / SR) {
    let s = 0;
    const i0 = secs(a);
    const i1 = Math.min(this.n, secs(b));
    for (let i = i0; i < i1; i++) s += (this.L[i] * this.L[i] + this.R[i] * this.R[i]) / 2;
    return Math.sqrt(s / Math.max(1, i1 - i0));
  }
}

// Réverbération (structure Freeverb : 8 peignes amortis + 4 passe-tout par canal). Renvoie le son réverbéré seul.
export function reverb(inL, inR, { room = 0.84, damp = 0.25, spread = 23, pre = 0.012 } = {}) {
  const k = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const alls = [556, 441, 341, 225];
  const n = inL.length;
  const out = [new Float32Array(n), new Float32Array(n)];
  const preN = secs(pre);
  for (let ch = 0; ch < 2; ch++) {
    const src = ch === 0 ? inL : inR;
    const mono = new Float32Array(n);
    for (let i = preN; i < n; i++) mono[i] = (inL[i - preN] + inR[i - preN]) * 0.5 * 0.6 + src[i - preN] * 0.4;
    const acc = new Float32Array(n);
    for (const c of combs) {
      const len = Math.round((c + (ch ? spread : 0)) * k);
      const buf = new Float32Array(len);
      let idx = 0;
      let store = 0;
      for (let i = 0; i < n; i++) {
        const y = buf[idx];
        store = y * (1 - damp) + store * damp;
        buf[idx] = mono[i] * 0.03 + store * room;
        idx = idx + 1 === len ? 0 : idx + 1;
        acc[i] += y;
      }
    }
    let cur = acc;
    for (const a of alls) {
      const len = Math.round((a + (ch ? spread : 0)) * k);
      const buf = new Float32Array(len);
      let idx = 0;
      const nxt = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const b = buf[idx];
        nxt[i] = -cur[i] + b;
        buf[idx] = cur[i] + b * 0.5;
        idx = idx + 1 === len ? 0 : idx + 1;
      }
      cur = nxt;
    }
    out[ch] = cur;
  }
  return out;
}

// Écho alterné gauche/droite
export function pingPong(inL, inR, time, feedback = 0.32) {
  const n = inL.length;
  const d = secs(time);
  const oL = new Float32Array(n);
  const oR = new Float32Array(n);
  for (let i = d; i < n; i++) {
    oL[i] = (inL[i - d] + inR[i - d]) * 0.5 + oR[i - d] * feedback;
    oR[i] = i >= 2 * d ? oL[i - d] * 1.0 : 0;
  }
  return [oL, oR];
}

// Suiveur d'enveloppe (niveau efficace lissé), pour faire passer la musique sous la voix
export function envelope(x, attack = 0.01, release = 0.25) {
  const out = new Float32Array(x.length);
  const ka = Math.exp(-1 / (attack * SR));
  const kr = Math.exp(-1 / (release * SR));
  let e = 0;
  for (let i = 0; i < x.length; i++) {
    const v = Math.abs(x[i]);
    e = v > e ? ka * e + (1 - ka) * v : kr * e + (1 - kr) * v;
    out[i] = e;
  }
  return out;
}

// Compresseur simple (voix)
export function compress(x, { threshold = -20, ratio = 2.5, attack = 0.006, release = 0.12, makeup = 0 } = {}) {
  const env = envelope(x, attack, release);
  const mk = fromDb(makeup);
  for (let i = 0; i < x.length; i++) {
    const over = dB(env[i]) - threshold;
    const g = over > 0 ? fromDb(-over * (1 - 1 / ratio)) : 1;
    x[i] *= g * mk;
  }
  return x;
}

// Limiteur à anticipation : aucune crête ne dépasse le plafond (dBFS).
export function limiter(L, R, ceilingDb = -1, lookahead = 0.005, release = 0.09) {
  const n = L.length;
  const ceil = fromDb(ceilingDb);
  const la = secs(lookahead);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = p > ceil ? ceil / p : 1;
  }
  // minimum glissant sur la fenêtre [i, i + la]
  const mn = new Float32Array(n);
  const dq = new Int32Array(n);
  let h = 0;
  let t = 0;
  let j = 0;
  for (let i = 0; i < n; i++) {
    while (j < n && j <= i + la) {
      while (t > h && need[dq[t - 1]] >= need[j]) t--;
      dq[t++] = j++;
    }
    while (dq[h] < i) h++;
    mn[i] = need[dq[h]];
  }
  // moyenne glissante (attaque douce), puis relâchement progressif
  const kr = Math.exp(-1 / (release * SR));
  let sum = 0;
  let g = 1;
  let reduced = 0;
  for (let i = 0; i < n; i++) {
    sum += mn[i];
    if (i >= la) sum -= mn[i - la];
    const avg = sum / Math.min(i + 1, la);
    g = avg < g ? avg : Math.min(avg, kr * g + (1 - kr) * 1);
    if (g < 0.999) reduced++;
    L[i] *= g;
    R[i] *= g;
  }
  return reduced / n;
}

// Sonie intégrée (ITU-R BS.1770, pondération K, fenêtres de 400 ms avec portes)
export function lufs(L, R) {
  const kw = (x) => {
    const y = new Float32Array(x.length);
    let z1 = 0, z2 = 0, w1 = 0, w2 = 0;
    for (let i = 0; i < x.length; i++) {
      const a = 1.53512485958697 * x[i] + z1;
      z1 = -2.69169618940638 * x[i] + 1.69065929318241 * a + z2;
      z2 = 1.19839281085285 * x[i] - 0.73248077421585 * a;
      const b = a + w1;
      w1 = -2 * a + 1.99004745483398 * b + w2;
      w2 = a - 0.99007225036621 * b;
      y[i] = b;
    }
    return y;
  };
  const l = kw(L);
  const r = kw(R);
  const win = secs(0.4);
  const hop = secs(0.1);
  const blocks = [];
  for (let s = 0; s + win <= l.length; s += hop) {
    let e = 0;
    for (let i = s; i < s + win; i++) e += l[i] * l[i] + r[i] * r[i];
    blocks.push(e / win);
  }
  const loud = (e) => -0.691 + 10 * Math.log10(Math.max(e, 1e-12));
  let kept = blocks.filter((e) => loud(e) > -70);
  if (!kept.length) return -Infinity;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const gate = loud(mean(kept)) - 10;
  kept = kept.filter((e) => loud(e) > gate);
  return loud(mean(kept));
}

// Anti-sifflantes : atténue les aigus (au-dessus de `split` Hz) seulement quand ils dépassent le seuil.
// Renvoie la réduction maximale appliquée (dB).
export function deEss(x, { split = 4500, threshold = -30, ratio = 3, maxCut = 8 } = {}) {
  const lp1 = new Biquad("lp", split, 0.7071);
  const lp2 = new Biquad("lp", split, 0.7071);
  const low = new Float32Array(x.length);
  const high = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    low[i] = lp2.tick(lp1.tick(x[i]));
    high[i] = x[i] - low[i];
  }
  const env = envelope(high, 0.001, 0.04);
  let worst = 0;
  for (let i = 0; i < x.length; i++) {
    const over = dB(env[i]) - threshold;
    const cut = over > 0 ? Math.min(maxCut, over * (1 - 1 / ratio)) : 0;
    worst = Math.max(worst, cut);
    x[i] = low[i] + high[i] * fromDb(-cut);
  }
  return worst;
}
