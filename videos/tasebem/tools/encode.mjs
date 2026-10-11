// Renseignements sur un fichier, ou extraction d'images.
//   node tools/encode/encode probe fichier.mp4            définition, cadence, durée, piste son, taille
//   node tools/encode/encode frames fichier.mp4 dossier 1.5,3.2,7      une image PNG par instant (v_01.50.png…)
import fs from 'node:fs';
import path from 'node:path';
import { ffmpeg, ffprobe, lancer } from './outils-systeme.mjs';
const [mode, fichier, ...reste] = process.argv.slice(2);
export function sonder(f) {
  const j = JSON.parse(lancer(ffprobe(), ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', f]).stdout);
  const v = j.streams.find((s) => s.codec_type === 'video'), a = j.streams.find((s) => s.codec_type === 'audio'), frac = (s) => { const [n, d] = String(s || '0/1').split('/').map(Number); return d ? n / d : 0; };
  return { duree: +j.format.duration, taille: +j.format.size, video: v && { codec: v.codec_name, l: v.width, h: v.height, cadence: (+v.nb_frames && +v.duration) ? +v.nb_frames / +v.duration : frac(v.r_frame_rate && v.r_frame_rate !== '0/0' ? v.r_frame_rate : v.avg_frame_rate), debit: +(v.bit_rate || 0), duree: +(v.duration || j.format.duration), images: +(v.nb_frames || 0) },
    son: a && { codec: a.codec_name, hz: +a.sample_rate, canaux: a.channels, debit: +(a.bit_rate || 0), duree: +(a.duration || 0) } };
}
if (mode === 'probe' && fichier) {
  const s = sonder(fichier);
  console.log(`durée : ${s.duree.toFixed(3)} s`);
  if (s.video) console.log(`vidéo : ${s.video.codec} ${s.video.l}x${s.video.h}, ${s.video.cadence.toFixed(3)} i/s, ${(s.video.debit / 1e6).toFixed(2)} Mbit/s, ${s.video.duree.toFixed(3)} s`);
  console.log(s.son ? `son : ${s.son.hz} Hz, ${s.son.canaux} canaux, ${Math.round(s.son.debit / 1000)} kbit/s, ${s.son.duree.toFixed(3)} s` : 'son : aucune piste');
  console.log(`taille : ${(s.taille / 1e6).toFixed(2)} Mo`);
} else if (mode === 'frames' && fichier && reste.length >= 2) {
  const [dossier, liste] = reste; fs.mkdirSync(dossier, { recursive: true });
  for (const t of liste.split(',').map(Number)) { const f = path.join(dossier, `v_${t.toFixed(2).padStart(5, '0')}.png`); lancer(ffmpeg(), ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', fichier, '-frames:v', '1', f]); }
  console.log('images :', path.resolve(dossier));
} else if (import.meta.url.endsWith('/encode.mjs') && process.argv[1] && /encode(\.mjs)?$/.test(process.argv[1])) { console.error('usage : node tools/encode/encode probe fichier.mp4 | frames fichier.mp4 dossier t1,t2,…'); process.exit(2); }
