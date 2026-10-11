// Instrumentos de síntese (retirados de musique.mjs do kit), partilhados pelas músicas Tá-se Bem.
import { SR, midi, secs, rng, Biquad, SVF, saw } from "./dsp.mjs";
const TAU = 2 * Math.PI, N = rng(20261011), white = () => N() * 2 - 1, alea = white;
function kick() {                                          // grosse caisse dure, écrêtée
  const n = secs(0.26), o = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (48 + 190 * Math.exp(-t / 0.018)) / SR; o[i] = Math.max(-0.9, Math.min(0.9, 3.5 * Math.sin(TAU * ph) * Math.exp(-t / 0.07))) * Math.min(1, t / 0.0008) + white() * 0.35 * Math.exp(-t / 0.001); }
  return o;
}
function clap() {
  const n = secs(0.22), o = new Float32Array(n), bp = new Biquad("bp", 1500, 0.9);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = bp.tick(white()) * Math.max(Math.exp(-t / 0.004), t > 0.009 ? Math.exp(-(t - 0.009) / 0.004) : 0, t > 0.018 ? Math.exp(-(t - 0.018) / 0.06) : 0); }
  return o;
}
function caisseClaire() {
  const n = secs(0.12), o = new Float32Array(n), bp = new Biquad("bp", 2300, 0.9);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = bp.tick(white()) * Math.exp(-t / 0.028) + 0.5 * Math.sin(TAU * 200 * t) * Math.exp(-t / 0.02); }
  return o;
}
function charleston(ouvert = 1) {
  const n = secs(0.08 * ouvert), o = new Float32Array(n), hp = new Biquad("hp", 8500, 0.8);
  for (let i = 0; i < n; i++) o[i] = hp.tick(white()) * Math.exp(-(i / SR) / (0.011 * ouvert));
  return o;
}
// Basse saturée : une sinusoïde poussée très fort dans une saturation, avec une glissade de hauteur à l'attaque.
function basse(f, len, { attaque = 0.35, chute = 0 } = {}) {
  const n = secs(len), o = new Float32Array(n), lp = new Biquad("lp", 2400, 0.7);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, fr = f * (1 + attaque * Math.exp(-t / 0.025)) * Math.pow(2, (-chute * Math.max(0, t - len * 0.4)) / (len * 0.6));
    ph += fr / SR;
    o[i] = lp.tick(Math.tanh(7 * Math.sin(TAU * ph) + 1.5 * Math.sin(TAU * ph * 2))) * Math.min(1, t / 0.002) * Math.exp(-t / (len * 0.9)) * Math.min(1, (len - t) / 0.012);
  }
  return o;
}
// Cloche : deux ondes carrées désaccordées passées dans un filtre étroit, attaque sèche. C'est la mélodie.
function cloche(f, len = 0.24, sourde = 0) {
  const n = secs(len), o = new Float32Array(n), bp = new Biquad("bp", f * 1.9, 2.2), lp = new Biquad("lp", sourde ? 1400 : 9000, 0.7);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    p1 += f / SR; if (p1 >= 1) p1 -= 1; p2 += (f * 1.483) / SR; if (p2 >= 1) p2 -= 1;
    const s = (p1 < 0.5 ? 1 : -1) + 0.7 * (p2 < 0.5 ? 1 : -1);
    o[i] = lp.tick(Math.tanh(2.2 * bp.tick(s))) * Math.min(1, t / 0.001) * (0.75 * Math.exp(-t / 0.05) + 0.25 * Math.exp(-t / (len * 0.6))) * Math.min(1, (len - t) / 0.01);
  }
  return o;
}
function nappe(L, R, f, t0, t1, gain) {                    // nappe sombre : deux dents de scie désaccordées, très filtrées
  const a = secs(t0), b = Math.min(L.length, secs(t1)), d1 = (f * 0.996) / SR, d2 = (f * 1.004) / SR, fl = new SVF(), fr = new SVF();
  let p1 = 0, p2 = 0;
  for (let i = a; i < b; i++) {
    const t = i / SR, env = Math.min(1, (t - t0) / 0.25) * Math.min(1, (t1 - t) / 0.08);
    p1 += d1; if (p1 >= 1) p1 -= 1; p2 += d2; if (p2 >= 1) p2 -= 1;
    L[i] += fl.tick(saw(p1, d1), 500, 0.6).lp * env * gain; R[i] += fr.tick(saw(p2, d2), 500, 0.6).lp * env * gain;
  }
}
function souffle(len, f0, f1, forme = 2, retombe = 0) {    // bruit filtré qui monte (retombe = 1 : monte puis redescend, un passage)
  const n = secs(len), o = new Float32Array(n), f = new SVF();
  for (let i = 0; i < n; i++) { const p = i / n, e = retombe ? Math.sin(Math.PI * p) ** 2 : Math.pow(p, forme); o[i] = f.tick(white(), f0 * Math.pow(f1 / f0, retombe ? 1 - Math.abs(2 * p - 1) : p), 1.3).bp * e * Math.min(1, (n - i) / secs(0.008)); }
  return o;
}
function laser(f0, f1, len = 0.16) {                       // sifflement qui descend : la ponctuation du genre
  const n = secs(len), o = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const p = i / n; ph += (f0 * Math.pow(f1 / f0, p)) / SR; o[i] = Math.sin(TAU * ph) * Math.min(1, i / secs(0.002)) * Math.pow(1 - p, 1.2); }
  return o;
}
function impact() {                                        // coup grave et cymbale : la première image, les chutes, la fin
  const n = secs(1.5), o = new Float32Array(n), hp = new Biquad("hp", 4500, 0.7);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += (38 + 80 * Math.exp(-t / 0.05)) / SR; o[i] = Math.tanh(3 * Math.sin(TAU * ph) * Math.exp(-t / 0.3)) + 0.4 * hp.tick(white()) * Math.exp(-t / 0.45); }
  return o;
}

function bruit(len, f, q, decroissance, type = "bp") { const n = secs(len), o = new Float32Array(n), b = new Biquad(type, f, q); for (let i = 0; i < n; i++) o[i] = b.tick(alea()) * Math.exp(-(i / SR) / decroissance) * Math.min(1, i / 24); return o; }
function choc(f = 90, len = 0.18) { const n = secs(len), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += (f * (1 + 1.2 * Math.exp(-t / 0.012))) / SR; o[i] = Math.sin(TAU * ph) * Math.exp(-t / 0.05) + 0.3 * alea() * Math.exp(-t / 0.004); } return o; }
function verre(f = 2400, len = 0.5) { const n = secs(len), o = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; o[i] = (Math.sin(TAU * f * t) * Math.exp(-t / 0.12) + 0.6 * Math.sin(TAU * f * 1.59 * t) * Math.exp(-t / 0.07) + 0.4 * Math.sin(TAU * f * 2.37 * t) * Math.exp(-t / 0.04)) * Math.min(1, i / 12) * 0.5; } return o; }
// le vibreur d'un téléphone posé sur une surface dure
function vibreur(len) { const n = secs(len), o = new Float32Array(n), lp = new Biquad("lp", 1100, 0.7); for (let i = 0; i < n; i++) { const t = i / SR; o[i] = lp.tick(Math.tanh(3 * Math.sin(TAU * 172 * t)) * (0.55 + 0.45 * Math.sin(TAU * 31 * t)) + 0.25 * alea() * (0.5 + 0.5 * Math.sin(TAU * 172 * t))) * Math.min(1, t / 0.008) * Math.min(1, (len - t) / 0.02) * 0.6; } return o; }
function bulle(f = 620) { const n = secs(0.09), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const p = i / n; ph += (f * (1 + 1.1 * p)) / SR; o[i] = Math.sin(TAU * ph) * Math.min(1, i / 40) * (1 - p) ** 1.5; } return o; }
function papier() { const n = secs(0.16), o = new Float32Array(n), f = new SVF(); for (let i = 0; i < n; i++) { const p = i / n, e = Math.abs(Math.sin(Math.PI * 1.5 * p)); o[i] = f.tick(alea(), 2600 + 2600 * e, 1.2).bp * e ** 0.6 * (1 - 0.4 * p); } return o; }
export { kick, clap, caisseClaire, charleston, basse, cloche, nappe, souffle, laser, impact, bruit, choc, verre, bulle };
