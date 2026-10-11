// Lit une vidéo image par image, en niveaux de gris et en petit (ffmpeg), pour la mesurer : coupes, images figées, comparaison.
import { spawn } from 'node:child_process';
import { ffmpeg } from './outils-systeme.mjs';
export function lireEnGris(fichier, l, h, surImage) {
  return new Promise((ok, ko) => {
    const p = spawn(ffmpeg(), ['-hide_banner', '-loglevel', 'error', '-i', fichier, '-vf', `scale=${l}:${h}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const taille = l * h; let reste = Buffer.alloc(0), n = 0, err = '';
    p.stdout.on('data', (d) => { reste = reste.length ? Buffer.concat([reste, d]) : d; while (reste.length >= taille) { surImage(reste.subarray(0, taille), n++); reste = reste.subarray(taille); } });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', ko); p.on('close', (code) => (code === 0 ? ok(n) : ko(new Error('ffmpeg : ' + err.split('\n').slice(-6).join('\n')))));
  });
}
