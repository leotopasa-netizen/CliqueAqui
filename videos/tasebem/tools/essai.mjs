// Rend quelques images d'essai (par lots de trois, relancés s'ils se bloquent) et en fait une planche.
//   node tools/essai.mjs nom 0.4,0.95,1.6,2.02 [définition : 0.5 par défaut]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { python, lancerAvecLimite } from './outils-systeme.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url)), PROJET = path.dirname(ICI);
const [nom, liste, dpr = '0.5'] = process.argv.slice(2);
if (!nom || !liste) { console.error('usage : node tools/essai.mjs nom 0.4,0.95,1.6 [0.5]'); process.exit(2); }
const temps = liste.split(',').map(Number), dossier = path.join(PROJET, 'out', nom), image = (t) => path.join(dossier, `t${t.toFixed(2).padStart(5, '0')}.jpg`);
const LIMITE = +(process.env.ESSAI_LIMITE_MS || 100000);   // un lot qui dépasse cette durée est arrêté et relancé
fs.mkdirSync(dossier, { recursive: true });
for (let i = 0; i < temps.length; i += 3) {
  const lot = temps.slice(i, i + 3).join(','); let fait = false;
  for (let essai = 0; essai < 4 && !fait; essai++) {
    const r = await lancerAvecLimite(process.execPath, [path.join(ICI, 'rendu.mjs'), 'stills', '--scene', 'scene/index.html', '--times', lot, '--dpr', dpr, '--dir', path.join('out', nom)], { cwd: PROJET, limite: LIMITE });
    if (r.bloque) { console.log('lot', lot, 'bloqué, relancé'); continue; }
    if (r.code !== 0 || /erreurs de page/.test(r.sortie)) { console.error('échec du lot', lot, r.sortie.slice(0, 1500)); process.exit(1); }
    fait = true;
  }
  if (!fait) { console.error('abandon du lot', lot); process.exit(1); }
}
const py = python(), args = temps.flatMap((t) => [image(t), `${t} s`]);
const r = spawnSync(py[0], [...py.slice(1), path.join(ICI, 'sheet.py'), path.join(dossier, 'planche.png'), '--cols', '3', '--thumb', '960', ...args], { encoding: 'utf8', windowsHide: true });
console.log((r.stdout || r.stderr || '').trim().split('\n').pop());
