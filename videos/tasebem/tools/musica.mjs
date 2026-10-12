// Músicas ORIGINAIS dos vídeos Tá-se Bem: uma por conceito (A, B, C, D1, D2), 60 s, 120 batidas por minuto,
// compostas e sintetizadas aqui (melodia, baixo e ritmo escritos neste ficheiro; só os instrumentos vêm do kit).
//   node tools/musica.mjs          → audio/musica-A.wav … audio/musica-D2.wav
// A forma segue o esqueleto de gerar.mjs (tempos em segundos, todos na grelha de 0,5 s):
//   0–10,5 o problema (abafado, a subir) · 10,5–11 paragem seca · 11 a queda (logo "Tá-se Bem")
//   11–36,5 groove cheio · 30 impacto do visto · 36,5–42 painel: tudo ao dobro · 42–48,5 groove
//   48,5–54,5 respiração e subida · 54,5 último golpe no logótipo · cauda e silêncio na última imagem.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeWav } from "./wav.mjs";
import { SR, midi, dB, fromDb, secs, Biquad, Track, reverb, limiter, lufs } from "./dsp.mjs";
import { kick, clap, caisseClaire, charleston, basse, cloche, nappe, souffle, laser, impact, choc, verre } from "./instrumentos.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BEAT = 0.5, S16 = BEAT / 4, BAR = 4 * BEAT;
/* forma de cada vídeo (s): os vídeos de nicho usam a padrão; o guia tem a sua */
const FORMA_NICHO = { D: 60, QUEDA: 11.0, PARA: [10.5, 11.0], IMPACTOS: [30.0], DOBRO: [36.5, 42.0], RESPIRA: 48.5, FIM: 54.5 };
const FORMA_GUIA = { D: 90, QUEDA: 5.0, PARA: [4.5, 5.0], IMPACTOS: [13, 15, 23, 30, 38, 45, 53, 60, 66, 70.5], DOBRO: [74.5, 82.5], RESPIRA: 82.5, FIM: 85.0 };

/* cada conceito: tom, baixo (4 compassos), motivo de sino (2 compassos, [semicolcheia, nota MIDI]) */
const TEMAS = {
  A: { raiz: [45, 45, 41, 43], motivo: [[[0, 76], [2, 79], [3, 81], [6, 79], [8, 84], [10, 81], [12, 79], [14, 76]], [[0, 76], [2, 79], [3, 81], [6, 83], [8, 81], [10, 79], [11, 76], [14, 74]]], acorde: [69, 76, 81] },          // lá menor
  B: { raiz: [40, 40, 36, 38], motivo: [[[0, 71], [3, 74], [4, 76], [6, 74], [8, 79], [11, 76], [12, 74], [14, 71]], [[0, 71], [3, 74], [4, 76], [6, 78], [8, 76], [10, 74], [12, 71], [15, 69]]], acorde: [64, 71, 76] },          // mi menor
  C: { raiz: [38, 38, 34, 36], motivo: [[[0, 74], [2, 77], [4, 81], [6, 79], [8, 77], [10, 74], [12, 76], [14, 77]], [[0, 74], [2, 77], [4, 81], [6, 84], [8, 81], [10, 79], [12, 77], [14, 72]]], acorde: [62, 69, 74] },          // ré menor
  D1: { raiz: [43, 43, 39, 41], motivo: [[[0, 79], [1, 82], [3, 79], [6, 86], [8, 84], [9, 82], [11, 79], [14, 77]], [[0, 79], [1, 82], [3, 79], [6, 86], [8, 87], [10, 86], [12, 84], [14, 82]]], acorde: [67, 74, 79] },       // sol menor
  D2: { raiz: [41, 41, 37, 39], motivo: [[[0, 77], [2, 80], [4, 84], [7, 82], [8, 80], [10, 77], [12, 75], [14, 77]], [[0, 77], [2, 80], [4, 84], [7, 87], [8, 84], [10, 82], [12, 80], [14, 75]]], acorde: [65, 72, 77] },        // fá menor
};

function compor(nome, tema, F = FORMA_NICHO) {
  const { D, QUEDA, PARA, IMPACTOS, DOBRO, RESPIRA, FIM } = F;
  const nIntro = Math.round(PARA[0] / BEAT), barsIntro = Math.floor(PARA[0] / BAR);
  const mus = new Track(D), echo = new Track(D), tb = new Track(D), bru = new Track(D);
  const K1 = kick(), C1 = clap(), S1 = caisseClaire(), H1 = charleston(), H2 = charleston(2.6), IMP = impact(), SOURD = choc(90);
  const K1S = (() => { const a = new Biquad("lp", 190, 0.7), b = new Biquad("lp", 190, 0.7); return K1.map((x) => 1.5 * b.tick(a.tick(x))); })();
  const coups = [];
  const coup = (t, g = 1) => { mus.add(K1, t, g); coups.push(t); };
  const coupSourd = (t, g = 1) => { mus.add(K1S, t, g); coups.push(t); };
  const sinos = (bar, t0, { sourde = 0, oit = 0, gain = 0.45, ecoG = 0.12, ate = 16 } = {}) => {
    for (const [st, m] of tema.motivo[bar % 2]) { if (st >= ate) continue; const t = t0 + st * S16, s = cloche(midi(m + oit), sourde ? 0.3 : 0.26, sourde); mus.add(s, t, gain, st % 2 ? 0.3 : -0.3); echo.add(s, t, ecoG); }
  };
  const acorde = (t, notas, len, g) => { for (const m of notas) { const s = cloche(midi(m), len); mus.add(s, t, g); echo.add(s, t, 0.4); } };
  const nL = new Float32Array(mus.n), nR = new Float32Array(mus.n);

  // ── o problema: 0 → 10,5 (21 tempos). Sinos abafados ao longe, bombo surdo a crescer, rufo e sopro até à paragem.
  for (const m of [tema.raiz[0] - 12 + 12, tema.raiz[0] + 7, tema.raiz[0] + 12]) nappe(nL, nR, midi(m), 0, PARA[0], 0.13);
  for (let bar = 0; bar < barsIntro; bar++) sinos(bar, bar * BAR, { sourde: 1, oit: -12, gain: 0.16 + bar * 0.02, ecoG: 0.3 });
  sinos(barsIntro, barsIntro * BAR, { sourde: 1, oit: -12, gain: 0.32, ecoG: 0.4, ate: 2 });
  mus.add(IMP, 0, 0.4); echo.add(IMP, 0, 0.2); coups.push(0);
  for (let b = 2; b < nIntro; b++) coupSourd(b * BEAT, 0.28 + 0.3 * (b / nIntro));
  for (let st = 0; st < 16; st++) mus.add(S1, PARA[0] - 2 + st * S16, 0.03 + 0.14 * (st / 16) ** 2, 0.1);
  mus.add(souffle(Math.min(3.0, PARA[0]), 250, 8000, 2.4), PARA[0] - Math.min(3.0, PARA[0]), 0.34);

  // ── a queda e o groove
  function compasso(t0, forca, raiz) {
    const f = midi(raiz);
    for (let st = 0; st < 16; st++) {
      const t = t0 + st * S16, d4 = st % 4;
      if (t >= RESPIRA - 1e-6) break;
      if (forca === 3 ? st % 2 === 0 : d4 === 0) coup(t, forca === 3 && d4 ? 0.8 : 1);
      if (forca < 3 && d4 === 2) tb.add(basse(f, 0.115, { attaque: 0.3 }), t, 0.95);
      if (forca < 3 && d4 === 3) tb.add(basse(f * 2, 0.11, { attaque: 0.2 }), t, 0.62);
      if (forca === 3 && st % 2 === 1) tb.add(basse(f * (st % 8 === 7 ? 1.5 : 1), 0.11, { attaque: 0.3 }), t, 0.95);
      if (st === 4 || st === 12) { mus.add(C1, t, 0.7); echo.add(C1, t, 0.22); }
      if (st === 15) mus.add(S1, t, 0.35, -0.2);
      if (forca >= 2 && st === 7) mus.add(S1, t, 0.3, 0.2);
      mus.add(H1, t, (d4 === 2 ? 0.16 : 0.08) * (0.8 + 0.2 * forca), st % 2 ? 0.35 : -0.35);
      if (forca >= 2 && d4 === 2) mus.add(H2, t, 0.1 + 0.035 * forca, 0.2);
    }
  }
  // compassos de 2 s a partir da queda (11 → 48,5 ≈ 18,75 compassos: o último é cortado na respiração)
  let k = 0;
  for (let t0 = QUEDA; t0 < RESPIRA - 1e-6; t0 += BAR, k++) {
    const forca = t0 >= DOBRO[0] - 1e-6 && t0 < DOBRO[1] - 1e-6 ? 3 : t0 >= QUEDA + 8 - 1e-6 ? 2 : 1;
    const raiz = tema.raiz[k % 4];
    compasso(t0, forca, raiz);
    const ate = Math.min(16, Math.round((RESPIRA - t0) / S16));
    sinos(k, t0, { ate });
    if (forca >= 2) sinos(k, t0, { oit: 12, gain: forca === 3 ? 0.24 : 0.18, ecoG: 0.05, ate });
  }
  // o compasso que começa em 47 só vai até 48,5: o groove pára aí (coups a mais depois da respiração são apagados abaixo)
  mus.add(IMP, QUEDA, 0.95); echo.add(IMP, QUEDA, 0.15);
  acorde(QUEDA + BEAT, tema.acorde.map((m) => m + 12), 0.5, 0.26);
  for (const v of IMPACTOS) { mus.add(IMP, v, 0.7); acorde(v, tema.acorde.map((m) => m + 12), 0.5, 0.26); }
  mus.add(laser(2600, 500), QUEDA + 7.5, 0.15, -0.5); mus.add(laser(3000, 600), DOBRO[0] - 2 * S16, 0.16, 0.5);
  mus.add(IMP, DOBRO[0], 0.8); mus.add(IMP, DOBRO[1], 0.7);
  for (let i = 0; i < 8; i++) mus.add(S1, DOBRO[0] - BEAT + i * (S16 / 2), 0.12 + 0.4 * (i / 8) ** 2, -0.1);

  // ── respiração 48,5 → 54,5: o groove sai, ficam os sinos abafados e uma subida longa até ao último golpe
  for (const m of [tema.raiz[0] + 12, tema.raiz[0] + 19, tema.raiz[0] + 24]) nappe(nL, nR, midi(m), RESPIRA, FIM, 0.18);
  mus.add(IMP, RESPIRA, 0.7); echo.add(IMP, RESPIRA, 0.25);
  const nResp = Math.round((FIM - RESPIRA) / BEAT);
  for (let bar = 0; bar < Math.ceil(nResp / 4); bar++) sinos(bar, RESPIRA + bar * BAR, { sourde: 1, gain: 0.3, ecoG: 0.45, ate: Math.min(16, (nResp - bar * 4) * 4) });
  for (let b = 0; b < nResp; b++) coupSourd(RESPIRA + b * BEAT, 0.5 + 0.4 * (b / nResp));
  for (let st = 0; st < 16; st++) mus.add(S1, FIM - Math.min(2, FIM - RESPIRA) + st * S16 * Math.min(1, (FIM - RESPIRA) / 2), 0.05 + 0.4 * (st / 16) ** 2, 0.1);
  mus.add(souffle(Math.min(4, FIM - RESPIRA), 250, 9000, 2.4), FIM - Math.min(4, FIM - RESPIRA), 0.45);

  // ── assinatura: último golpe, acorde tido, cauda
  mus.add(IMP, FIM, 1.0); echo.add(IMP, FIM, 0.35); coup(FIM, 1);
  tb.add(basse(midi(tema.raiz[0]), BAR * 1.2, { attaque: 0.5, chute: 0.4 }), FIM, 0.75);
  for (const [m, g] of tema.acorde.map((m, i) => [m + 12, [0.4, 0.25, 0.25][i]])) { const s = cloche(midi(m), 1.2); mus.add(s, FIM, g); echo.add(s, FIM, 0.45); }
  for (const m of [tema.raiz[0] + 12, tema.raiz[0] + 19]) nappe(nL, nR, midi(m), FIM, D - 0.4, 0.16);
  // bruitages discretos nos momentos-chave
  bru.add(SOURD, QUEDA, 1.0); bru.add(verre(1480, 0.7), QUEDA + 0.25, 0.4); for (const v of IMPACTOS) bru.add(verre(2400, 0.6), v, 0.35); bru.add(SOURD, FIM, 1.0); bru.add(verre(1760, 1.2), FIM, 0.45);

  // o baixo "bombeia" sob cada bombo
  { const g = new Float32Array(mus.n).fill(1); for (const tc of coups) for (let i = secs(tc); i < Math.min(mus.n, secs(tc + 0.09)); i++) g[i] = Math.min(g[i], 0.35 + 0.65 * Math.max(0, i / SR - tc) / 0.09); for (let i = 0; i < mus.n; i++) { mus.L[i] += tb.L[i] * g[i]; mus.R[i] += tb.R[i] * g[i]; } }
  mus.addStereo(nL, nR, 0, 1); echo.addStereo(nL, nR, 0, 0.6);
  { const [rL, rR] = reverb(echo.L, echo.R, { room: 0.88, damp: 0.35 }); mus.addStereo(rL, rR, 0, 0.75); }
  mus.addStereo(bru.L, bru.R, 0, 0.4);
  // paragem seca antes da queda, e fim com silêncio total na última imagem
  for (let i = secs(PARA[0] + 0.02); i < secs(PARA[1]); i++) { const g = Math.max(0, 1 - (i / SR - PARA[0] - 0.02) / 0.012); mus.L[i] *= g; mus.R[i] *= g; }
  for (let i = secs(D - 2.5); i < mus.n; i++) { const g = Math.pow(Math.cos(((i / SR - (D - 2.5)) / 2.4) * (Math.PI / 2)), 2) * (i / SR > D - 0.1 ? 0 : 1); mus.L[i] *= g; mus.R[i] *= g; }
  const gc = fromDb(-14 - lufs(mus.L, mus.R)); mus.scale(gc);
  for (let i = 0; i < mus.n; i++) { mus.L[i] = Math.tanh(mus.L[i] * 1.3) / 1.3; mus.R[i] = Math.tanh(mus.R[i] * 1.3) / 1.3; }
  limiter(mus.L, mus.R, -1);
  mkdirSync(join(root, "audio"), { recursive: true });
  writeWav(join(root, "audio", `musica-${nome}.wav`), [mus.L, mus.R], SR, 24);
  const nivel = (a, b) => dB(mus.rms(a, b)).toFixed(0);
  console.log(`musica-${nome}: ${lufs(mus.L, mus.R).toFixed(1)} LUFS, crista ${dB(mus.peak()).toFixed(2)} dBFS · problema ${nivel(0, PARA[0])} dB · paragem ${nivel(PARA[0] + 0.05, PARA[1] - 0.02)} dB · groove ${nivel(QUEDA, DOBRO[0])} dB · dobro ${nivel(DOBRO[0], DOBRO[1])} dB · respiração ${nivel(RESPIRA, FIM)} dB · últimos 50 ms ${nivel(D - 0.05, D)} dB`);
}

TEMAS.guia = { raiz: [44, 44, 40, 42], motivo: [[[0, 80], [2, 83], [3, 85], [6, 83], [8, 87], [10, 85], [12, 83], [14, 80]], [[0, 80], [2, 83], [3, 85], [6, 88], [8, 87], [10, 85], [11, 83], [14, 78]]], acorde: [68, 75, 80] };   // sol sustenido menor
const quais = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TEMAS);
for (const n of quais) compor(n, TEMAS[n], n === 'guia' ? FORMA_GUIA : FORMA_NICHO);
