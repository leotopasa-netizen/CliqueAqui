// La musique de la vidéo « Lancement de produit » : un morceau ORIGINAL, composé et synthétisé ici, dans le style
// des montages rapides (« edits ») qui tournent sur TikTok.
//   node tools/musique.mjs
// Ce n'est la copie d'aucun titre : la mélodie, la basse et le rythme sont écrits dans ce fichier (et ne sont pas ceux
// des autres vidéos, dont seuls les instruments sont repris). Les codes du genre : une montée étouffée, un arrêt net,
// puis une chute où une grosse caisse dure marque chaque temps, une basse saturée qui galope entre les coups, une
// mélodie de cloche qui tourne en boucle, des claquements secs.
// 120 battements par minute : un temps dure 30 images à 60 i/s, une mesure 120 images, et 20 s font dix mesures.
// La forme suit le script : mesures 1-2 le problème (la montée, puis l'arrêt), 3 à 6 la chute, qui ne lâche plus
// (le basculement, réserver, rappeler, encaisser), 7-8 la semaine pleine (tout passe au double), 9-10 la signature.
// Sorties : audio/musique.wav et .m4a (la musique seule), audio/mix.wav et .m4a (musique et bruitages),
// audio/grille.json (les instants sur lesquels l'image est calée).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeWav, toM4a } from "./wav.mjs";
import { SR, midi, dB, fromDb, secs, rng, Biquad, SVF, saw, Track, reverb, limiter, lufs } from "./dsp.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BPM = 120, BEAT = 60 / BPM, S16 = BEAT / 4, BAR = BEAT * 4, D = 10 * BAR, TIERS = BEAT / 3;   // 20 s
const TAU = 2 * Math.PI, N = rng(20261006), white = () => N() * 2 - 1;
const CHUTE = 2 * BAR, DOUBLE = 6 * BAR, SORTIE = 8 * BAR, DERNIER = 9 * BAR;
// L'arrêt net : le dernier temps de la mesure 2 (« tout se fige »), juste avant que la musique tombe.
const ARRETS = [[CHUTE - BEAT, CHUTE]];

// ------------------------------------------------------------------ ce qui est écrit ici : basse et mélodie
// Fa dièse mineur. La basse tient deux mesures sur fa dièse, puis une sur ré, une sur mi.
const FONDAMENTALES = [42, 42, 38, 40];
// La mélodie de cloche : un motif de deux mesures (pas dans la mesure en doubles croches, note MIDI).
const MOTIF = [
  [[0, 78], [2, 81], [3, 80], [6, 78], [8, 85], [10, 83], [11, 81], [14, 80]],
  [[0, 78], [2, 81], [3, 80], [6, 76], [8, 73], [10, 76], [12, 78], [15, 73]],
];
// Les paiements de la semaine pleine (les mêmes instants que dans scene/film.js) : un jour par temps, quatre cases
// en quadruples croches ; les trois cases du samedi une par demi-temps, la dernière sur le troisième temps de la mesure 8.
const PRISES = [[0, 1, 3, 4], [1, 2, 4, 5], [0, 2, 3, 5], [1, 3, 4, 5], [0, 2, 4, 6], [0, 1, 2]], PAIEMENTS = [];
PRISES.forEach((rs, j) => { let k = 0; rs.forEach((r) => { if (j === 3 && r === 5) return; PAIEMENTS.push(j === 5 ? (29 + 0.5 * k++) * BEAT : (24 + j) * BEAT + (k++ * BEAT) / 8); }); });

// ------------------------------------------------------------------ les instruments
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

// ------------------------------------------------------------------ le morceau
const mus = new Track(D), echo = new Track(D), tb = new Track(D);   // echo : ce qui part dans la réverbération ; tb : la basse
const K1 = kick(), C1 = clap(), S1 = caisseClaire(), H1 = charleston(), H2 = charleston(2.6), IMP = impact();
const coups = [];
const coup = (t, g = 1) => { mus.add(K1, t, g); coups.push(t); };
const K1S = (() => { const a = new Biquad("lp", 190, 0.7), b = new Biquad("lp", 190, 0.7); return K1.map((x) => 1.5 * b.tick(a.tick(x))); })();   // la même, étouffée
const coupSourd = (t, g = 1) => { mus.add(K1S, t, g); coups.push(t); };
const cloches = (bar, t0, { sourde = 0, octave = 0, gain = 0.5, jusque = 16, echoGain = 0.12 } = {}) => {
  for (const [step, m] of MOTIF[bar % 2]) { if (step >= jusque) continue; const t = t0 + step * S16, s = cloche(midi(m + octave), sourde ? 0.3 : 0.26, sourde); mus.add(s, t, gain, step % 2 ? 0.3 : -0.3); echo.add(s, t, echoGain); }
};
const accord = (t, notes, len, gain) => { for (const m of notes) { const s = cloche(midi(m), len); mus.add(s, t, gain); echo.add(s, t, 0.4); } };
const nL = new Float32Array(mus.n), nR = new Float32Array(mus.n);

// --- mesures 1 et 2 : le problème. La mélodie étouffée, loin dans l'écho ; un coup par action (trois messages, deux
//     ratures), puis la rafale : un demi-temps, un triolet ; un roulement qui monte ; l'arrêt net sur le dernier temps.
for (const m of [42, 49, 54]) nappe(nL, nR, midi(m), 0, ARRETS[0][0], 0.14);
for (let bar = 0; bar < 2; bar++) cloches(bar, bar * BAR, { sourde: 1, octave: -12, gain: 0.26, echoGain: 0.4, jusque: bar ? 12 : 16 });
mus.add(IMP, 0, 0.4); echo.add(IMP, 0, 0.2); coups.push(0);
[[1, 0.6], [2, 0.6], [3, 0.7], [4, 0.8], [5, 0.85]].forEach(([b, g]) => coupSourd(b * BEAT, g));
[5.5 * BEAT, 6 * BEAT, 6 * BEAT + TIERS, 6 * BEAT + 2 * TIERS].forEach((t, k) => { coupSourd(t, 0.8 + 0.08 * k); mus.add(S1, t, 0.2 + 0.08 * k, k % 2 ? 0.15 : -0.15); if (k) mus.add(C1, t, 0.16 + 0.08 * k); });
for (let step = 0; step < 12; step++) mus.add(S1, 4 * BEAT + step * S16, 0.03 + 0.1 * (step / 12) ** 2, 0.1);
mus.add(souffle(2.8, 250, 8000, 2.4), ARRETS[0][0] - 2.8, 0.34);

// --- la chute. force : 1 (le basculement, réserver), 2 (rappeler, encaisser), 3 (la semaine pleine : tout passe au double).
function mesurePleine(bar, force, { jusque = 16 } = {}) {
  const t0 = bar * BAR, f = midi(FONDAMENTALES[(bar - 2) % 4]);
  for (let step = 0; step < jusque; step++) {
    const t = t0 + step * S16, dans = step % 4;
    if (force === 3 ? step % 2 === 0 : dans === 0) coup(t, force === 3 && dans ? 0.8 : 1);
    // la basse galope : deux doubles croches avant chaque coup, la seconde à l'octave ; au double, sur chaque contretemps
    if (force < 3 && dans === 2) tb.add(basse(f, 0.115, { attaque: 0.3 }), t, 0.95);
    if (force < 3 && dans === 3) tb.add(basse(f * 2, 0.11, { attaque: 0.2 }), t, 0.62);
    if (force === 3 && step % 2 === 1) tb.add(basse(f * (step % 8 === 7 ? 1.5 : 1), 0.11, { attaque: 0.3 }), t, 0.95);
    if (step === 4 || step === 12) { mus.add(C1, t, 0.7); echo.add(C1, t, 0.22); }
    if (step === 15 && bar % 2) mus.add(S1, t, 0.4, -0.2);            // une caisse claire fantôme avant la mesure suivante
    if (force >= 2 && step === 7) mus.add(S1, t, 0.3, 0.2);
    mus.add(H1, t, (dans === 2 ? 0.16 : 0.08) * (0.8 + 0.2 * force), step % 2 ? 0.35 : -0.35);
    if (force >= 2 && dans === 2) mus.add(H2, t, 0.1 + 0.035 * force, 0.2);
  }
  cloches(bar, t0, { jusque });
  if (force >= 2) cloches(bar, t0, { octave: 12, gain: force === 3 ? 0.26 : 0.2, echoGain: 0.05, jusque });
}
// mesures 3 à 6 : elle tombe et ne lâche plus. Trois repères : la première couleur, le tampon, le compteur bloqué.
mesurePleine(2, 1); mesurePleine(3, 1); mesurePleine(4, 2); mesurePleine(5, 2);
mus.add(IMP, CHUTE, 0.9); echo.add(IMP, CHUTE, 0.15);
accord(10 * BEAT, [78, 85], 0.5, 0.28);
mus.add(IMP, 21 * BEAT, 0.7); { const s = cloche(midi(90), 0.4); mus.add(s, 23 * BEAT, 0.34); echo.add(s, 23 * BEAT, 0.4); }
mus.add(laser(2600, 500), 2 * BAR + 14 * S16 + 2 * BAR, 0.15, -0.5); mus.add(laser(3000, 600), DOUBLE - 2 * S16, 0.16, 0.5);
// mesures 7 et 8 : la semaine pleine. Un coup par demi-temps ; un roulement ; le grand coup du compteur (troisième
// temps de la mesure 8) ; un dernier coup pour la semaine entière, tenue : le seul répit.
mesurePleine(6, 3); mesurePleine(7, 3, { jusque: 8 });
mus.add(IMP, DOUBLE, 0.9); echo.add(IMP, DOUBLE, 0.15);
for (let k = 0; k < 8; k++) mus.add(S1, 29 * BEAT + k * (S16 / 2), 0.12 + 0.4 * (k / 8) ** 2, -0.1);
{ const t = 30 * BEAT; coup(t, 1); mus.add(IMP, t, 0.8); mus.add(C1, t, 0.75); echo.add(C1, t, 0.3); accord(t, [78, 85, 90], 0.5, 0.3); tb.add(basse(midi(FONDAMENTALES[1]), 0.44, { attaque: 0.5 }), t, 0.8); }
{ const t = 31 * BEAT; coup(t, 1); mus.add(C1, t, 0.7); echo.add(C1, t, 0.3); tb.add(basse(midi(FONDAMENTALES[1]), 0.46, { attaque: 0.4, chute: 0.3 }), t, 0.7); mus.add(souffle(BEAT, 300, 8000, 2.2), t, 0.45); }

// --- mesures 9 et 10 : la sortie. Un grand coup, la mélodie loin dans l'écho pendant le recul, un passage d'air
//     quand la caméra part « d'un trait », puis le dernier coup pour le logo : l'accord tenu, et le silence.
for (const m of [42, 49, 57]) nappe(nL, nR, midi(m), SORTIE, D - 0.3, 0.22);
mus.add(IMP, SORTIE, 1.0); echo.add(IMP, SORTIE, 0.3); coup(SORTIE, 1); tb.add(basse(midi(42), BAR * 0.8, { attaque: 0.5, chute: 0.4 }), SORTIE, 0.7);
cloches(0, SORTIE, { sourde: 1, octave: -12, gain: 0.3, echoGain: 0.5 });
mus.add(souffle(BEAT, 300, 5000, 2, 1), SORTIE + 2 * BEAT - 0.1, 0.5);
mus.add(souffle(2 * BEAT, 300, 9000, 2.2), DERNIER - 2 * BEAT, 0.5);
{ mus.add(IMP, DERNIER, 1.0); echo.add(IMP, DERNIER, 0.3); coup(DERNIER, 1); tb.add(basse(midi(42), BAR * 0.9, { attaque: 0.5, chute: 0.5 }), DERNIER, 0.75); for (const [m, g] of [[78, 0.4], [81, 0.25], [85, 0.25]]) { const s = cloche(midi(m), 0.9); mus.add(s, DERNIER, g); echo.add(s, DERNIER, 0.4); } }
// la basse s'efface une fraction de seconde sous chaque coup de grosse caisse : c'est ce qui la fait « pomper »
{ const g = new Float32Array(mus.n).fill(1); for (const tc of coups) for (let i = secs(tc); i < Math.min(mus.n, secs(tc + 0.09)); i++) g[i] = Math.min(g[i], 0.35 + 0.65 * Math.max(0, i / SR - tc) / 0.09); for (let i = 0; i < mus.n; i++) { mus.L[i] += tb.L[i] * g[i]; mus.R[i] += tb.R[i] * g[i]; } }
mus.addStereo(nL, nR, 0, 1); echo.addStereo(nL, nR, 0, 0.6);

// ------------------------------------------------------------------ les bruitages, sous la musique, sur les mêmes instants que les actions
const bru = new Track(D), R2 = rng(79), alea = () => R2() * 2 - 1;
function bruit(len, f, q, decroissance, type = "bp") { const n = secs(len), o = new Float32Array(n), b = new Biquad(type, f, q); for (let i = 0; i < n; i++) o[i] = b.tick(alea()) * Math.exp(-(i / SR) / decroissance) * Math.min(1, i / 24); return o; }
function choc(f = 90, len = 0.18) { const n = secs(len), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += (f * (1 + 1.2 * Math.exp(-t / 0.012))) / SR; o[i] = Math.sin(TAU * ph) * Math.exp(-t / 0.05) + 0.3 * alea() * Math.exp(-t / 0.004); } return o; }
function verre(f = 2400, len = 0.5) { const n = secs(len), o = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; o[i] = (Math.sin(TAU * f * t) * Math.exp(-t / 0.12) + 0.6 * Math.sin(TAU * f * 1.59 * t) * Math.exp(-t / 0.07) + 0.4 * Math.sin(TAU * f * 2.37 * t) * Math.exp(-t / 0.04)) * Math.min(1, i / 12) * 0.5; } return o; }
// le vibreur d'un téléphone posé sur une surface dure
function vibreur(len) { const n = secs(len), o = new Float32Array(n), lp = new Biquad("lp", 1100, 0.7); for (let i = 0; i < n; i++) { const t = i / SR; o[i] = lp.tick(Math.tanh(3 * Math.sin(TAU * 172 * t)) * (0.55 + 0.45 * Math.sin(TAU * 31 * t)) + 0.25 * alea() * (0.5 + 0.5 * Math.sin(TAU * 172 * t))) * Math.min(1, t / 0.008) * Math.min(1, (len - t) / 0.02) * 0.6; } return o; }
function bulle(f = 620) { const n = secs(0.09), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const p = i / n; ph += (f * (1 + 1.1 * p)) / SR; o[i] = Math.sin(TAU * ph) * Math.min(1, i / 40) * (1 - p) ** 1.5; } return o; }
function papier() { const n = secs(0.16), o = new Float32Array(n), f = new SVF(); for (let i = 0; i < n; i++) { const p = i / n, e = Math.abs(Math.sin(Math.PI * 1.5 * p)); o[i] = f.tick(alea(), 2600 + 2600 * e, 1.2).bp * e ** 0.6 * (1 - 0.4 * p); } return o; }
const CLAC = bruit(0.06, 3200, 0.8, 0.012), SOURD = choc(90), TOC = choc(160, 0.1);
// le problème : le vibreur dès la première image, une bulle par message, le papier des ratures
bru.add(vibreur(0.42), 0, 0.55, 0.2);
[[1, 0], [3, 1], [4, 2]].forEach(([b, k]) => { bru.add(bulle(560 + 70 * k), b * BEAT, 0.7, 0.2); bru.add(vibreur(0.16), b * BEAT + 0.04, 0.45, 0.2); });
[2, 5].forEach((b) => bru.add(papier(), b * BEAT - 0.05, 0.9, -0.3));
[5.5 * BEAT, 6 * BEAT, 6 * BEAT + TIERS, 6 * BEAT + 2 * TIERS].forEach((t, k) => { bru.add(bulle(700 + 80 * k), t, 0.7, 0.4 * alea()); bru.add(vibreur(0.1), t + 0.03, 0.45); });
// le basculement : l'aspiration, le planning claque en place, la case s'allume
bru.add(souffle(0.5, 300, 7000, 1.6), CHUTE - 0.02, 0.9); bru.add(SOURD, 9 * BEAT, 0.9); bru.add(CLAC, 9 * BEAT, 0.6); bru.add(verre(1480, 0.7), 10 * BEAT, 0.45);
// réserver : le téléphone du client se pose, le clic, la case se remplit, « Réservé »
bru.add(SOURD, 12 * BEAT, 0.7); bru.add(CLAC, 13 * BEAT, 0.8); bru.add(TOC, 13 * BEAT, 0.5);
bru.add(souffle(0.14, 500, 4000, 1), 14 * BEAT - 0.05, 0.6); bru.add(TOC, 14 * BEAT, 0.6); bru.add(CLAC, 15 * BEAT, 0.7); bru.add(verre(1760, 0.4), 15 * BEAT, 0.3);
// rappeler : le départ de la notification, elle se pose ; la coche repart, et revient sur la case
bru.add(laser(700, 2400, 0.2), 16 * BEAT, 0.3, -0.3); bru.add(souffle(0.45, 500, 5000, 1.2, 1), 16 * BEAT, 0.7, -0.2); bru.add(TOC, 17 * BEAT, 0.8, -0.4); bru.add(verre(1980, 0.5), 17 * BEAT, 0.4, -0.4);
bru.add(laser(900, 2800, 0.16), 18 * BEAT, 0.25, -0.2); bru.add(verre(2100, 0.35), 19 * BEAT, 0.4); bru.add(verre(2800, 0.5), 19 * BEAT + 0.07, 0.4);
// encaisser : le tampon arrive, s'abat ; le total cliquette et se bloque
bru.add(souffle(0.2, 400, 3500, 1.5), 20 * BEAT - 0.16, 0.8, 0.4); bru.add(TOC, 20 * BEAT, 0.6, 0.2);
bru.add(SOURD, 21 * BEAT, 1.0); bru.add(CLAC, 21 * BEAT, 0.8);
for (let k = 0; k < 14; k++) bru.add(CLAC, 22 * BEAT + k / 28, 0.22 + 0.2 * (k / 14), 0.3);
bru.add(SOURD, 23 * BEAT, 0.8); bru.add(verre(2400, 0.6), 23 * BEAT, 0.4, 0.3);
// la semaine pleine : la cascade (un coup sec par case payée), puis le compteur se bloque
PAIEMENTS.forEach((t, k) => bru.add(TOC, t, 0.5, -0.6 + (1.2 * k) / PAIEMENTS.length));
bru.add(SOURD, 30 * BEAT, 1.0); bru.add(verre(2400, 0.7), 30 * BEAT, 0.45, 0.3);
// la signature : le souffle du trait, l'accord final sur le logo, le nom, le bouton
bru.add(souffle(0.7, 250, 3500, 1.4, 1), SORTIE + 2 * BEAT - 0.05, 0.9);
bru.add(verre(1480, 1.2), DERNIER, 0.5); bru.add(souffle(0.25, 600, 3000, 1.2, 1), DERNIER + 0.5 * BEAT, 0.35); bru.add(TOC, DERNIER + BEAT, 0.4);
{ const [rL, rR] = reverb(bru.L, bru.R, { room: 0.6, damp: 0.5 }); bru.addStereo(rL, rR, 0, 0.18); }

// ------------------------------------------------------------------ réverbération, arrêts, niveau, fichiers
{ const [rL, rR] = reverb(echo.L, echo.R, { room: 0.88, damp: 0.35 }); mus.addStereo(rL, rR, 0, 0.75); }
const mix = new Track(D); mix.addStereo(mus.L, mus.R, 0, 1); mix.addStereo(bru.L, bru.R, 0, 0.42);
for (const tr of [mus, mix]) {
  for (const [a, b] of ARRETS) for (let i = secs(a); i < secs(b); i++) { const g = Math.max(0, 1 - (i / SR - a) / 0.01); tr.L[i] *= g; tr.R[i] *= g; }
  for (let i = secs(D - 0.5); i < tr.n; i++) { const g = Math.pow(Math.cos(((i / SR - (D - 0.5)) / 0.5) * (Math.PI / 2)), 2); tr.L[i] *= g; tr.R[i] *= g; }
}
const CIBLE = -13.4, gainCommun = fromDb(CIBLE - lufs(mix.L, mix.R));
const finir = (tr) => { tr.scale(gainCommun); for (let i = 0; i < tr.n; i++) { tr.L[i] = Math.tanh(tr.L[i] * 1.3) / 1.3; tr.R[i] = Math.tanh(tr.R[i] * 1.3) / 1.3; } const avant = tr.peak(), actif = limiter(tr.L, tr.R, -1); return { avant, actif }; };
finir(mus); const { avant, actif } = finir(mix);
mkdirSync(join(root, "audio"), { recursive: true });
writeWav(join(root, "audio", "musique.wav"), [mus.L, mus.R], SR, 24);
writeWav(join(root, "audio", "mix.wav"), [mix.L, mix.R], SR, 24);
toM4a(join(root, "audio", "mix.wav"), join(root, "audio", "mix.m4a"), 256);
toM4a(join(root, "audio", "musique.wav"), join(root, "audio", "musique.m4a"), 256);
const grille = { bpm: BPM, temps: BEAT, mesure: BAR, imagesParTemps: 30, duree: D, chute: CHUTE, double: DOUBLE, arrets: ARRETS, sortie: SORTIE, dernierCoup: DERNIER, grosseCaisse: [...coups].sort((a, b) => a - b).map((t) => +t.toFixed(4)) };
writeFileSync(join(root, "audio", "grille.json"), JSON.stringify(grille, null, 1));
let sat = 0;
for (let i = 0; i < mix.n; i++) if (Math.abs(mix.L[i]) >= 0.999 || Math.abs(mix.R[i]) >= 0.999) sat++;
console.log(`durée ${D.toFixed(3)} s, ${BPM} battements par minute (un temps = 30 images), 10 mesures, ${coups.length} coups de grosse caisse`);
console.log(`sonie du mix ${lufs(mix.L, mix.R).toFixed(1)} LUFS (cible ${CIBLE}), crête ${dB(mix.peak()).toFixed(2)} dBFS (avant limiteur ${dB(avant).toFixed(1)}, actif ${(actif * 100).toFixed(1)} % du temps), échantillons saturés ${sat}`);
console.log("niveau par mesure (dB) : " + Array.from({ length: 10 }, (_, b) => dB(mix.rms(b * BAR, (b + 1) * BAR)).toFixed(0)).join(" "));
console.log("arrêts (dB) : " + ARRETS.map(([a, b]) => dB(mix.rms(a + 0.03, b - 0.01)).toFixed(0)).join(" ") + `  |  fin (50 dernières ms) : ${dB(mix.rms(D - 0.05, D)).toFixed(1)} dB`);
console.log(`bruitages seuls : ${dB(bru.rms(0, D)).toFixed(1)} dB efficaces avant mixage (mixés à −7,5 dB)`);
