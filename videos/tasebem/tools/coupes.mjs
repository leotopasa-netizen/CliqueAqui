// Mesure une vidéo image par image : une ligne par image (numéro, instant, écart avec l'image précédente, luminosité
// moyenne), à lire avec tools/controle.py.   node tools/bin/coupes video.mp4 out/ecarts.tsv   (ou « > out/ecarts.tsv »)
import { sonder } from './encode.mjs';
import fs from 'node:fs';
import { lireEnGris } from './images-video.mjs';
const fichier = process.argv[2], sortie = process.argv[3];
if (!fichier) { console.error('usage : node tools/bin/coupes video.mp4 ecarts.tsv'); process.exit(2); }
const fps = sonder(fichier).video.cadence || 60, L = 192, H = 108, lignes = []; let avant = null;
await lireEnGris(fichier, L, H, (im, n) => {
  let somme = 0, ecart = 0; for (let i = 0; i < im.length; i++) { somme += im[i]; if (avant) ecart += Math.abs(im[i] - avant[i]); }
  lignes.push(`${n}\t${(n / fps).toFixed(4)}\t${(avant ? ecart / im.length : 0).toFixed(4)}\t${(somme / im.length).toFixed(2)}`); avant = Buffer.from(im);
});
if (sortie) { fs.writeFileSync(sortie, lignes.join('\n') + '\n'); console.log(`${lignes.length} images mesurées → ${sortie}`); } else process.stdout.write(lignes.join('\n') + '\n');
