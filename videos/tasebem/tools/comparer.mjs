// Compare deux vidéos image par image (la version web contre le maître, ou un rendu contre l'aperçu validé) : une image
// incomplète ou décalée ressort tout de suite.   node tools/bin/comparer a.mp4 b.mp4 [décalage maximal, en images] [seuil]
import { lireEnGris } from './images-video.mjs';
const [a, b, decMax = '0', seuilTxt = '12'] = process.argv.slice(2);
if (!a || !b) { console.error('usage : node tools/bin/comparer reference.mp4 autre.mp4 [décalage max] [seuil]'); process.exit(2); }
const L = 160, H = 90, BL = 16, lire = async (f) => { const t = []; await lireEnGris(f, L, H, (im) => t.push(Buffer.from(im))); return t; };
const [A, B] = [await lire(a), await lire(b)];
// l'écart d'une paire d'images : le plus fort écart moyen parmi ses blocs de 16 × 16 (un défaut local ne se noie pas dans la moyenne)
const ecart = (x, y) => { let pire = 0; for (let by = 0; by + BL <= H; by += BL) for (let bx = 0; bx + BL <= L; bx += BL) { let s = 0; for (let j = 0; j < BL; j++) for (let i = 0; i < BL; i++) { const k = (by + j) * L + bx + i; s += Math.abs(x[k] - y[k]); } pire = Math.max(pire, s / (BL * BL)); } return pire; };
let meilleur = { dec: 0, moyenne: Infinity, pire: Infinity, image: 0 };
for (let dec = -Math.abs(+decMax); dec <= Math.abs(+decMax); dec++) {
  let somme = 0, pire = 0, image = 0, n = 0;
  for (let i = 0; i < A.length; i++) { const j = i + dec; if (j < 0 || j >= B.length) continue; const e = ecart(A[i], B[j]); somme += e; n++; if (e > pire) { pire = e; image = i; } }
  if (n && somme / n < meilleur.moyenne) meilleur = { dec, moyenne: somme / n, pire, image };
}
console.log(`images : ${A.length} et ${B.length} · décalage retenu : ${meilleur.dec} image(s)`);
console.log(`écart max tous blocs : ${meilleur.pire.toFixed(1)} (image ${meilleur.image}) · écart moyen : ${meilleur.moyenne.toFixed(2)}`);
const memeNombre = Math.abs(A.length - B.length) <= Math.abs(+decMax);
console.log(memeNombre && meilleur.pire <= +seuilTxt ? 'identique à la référence (aucune image incomplète)' : `DIFFÉRENT de la référence${memeNombre ? '' : ' (nombre d’images)'} : regarde l’image ${meilleur.image}`);
process.exit(memeNombre && meilleur.pire <= +seuilTxt ? 0 : 1);
