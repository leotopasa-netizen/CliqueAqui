// Pose le son sur une vidéo muette, sans réencoder l'image.   node tools/bin/mux video.mp4 son.wav sortie.mp4 [débit du son en kbit/s]
import path from 'node:path';
import { ffmpeg, lancer } from './outils-systeme.mjs';
const [video, son, sortie, kbps = '256'] = process.argv.slice(2);
if (!video || !son || !sortie) { console.error('usage : node tools/bin/mux video.mp4 son.wav sortie.mp4'); process.exit(2); }
lancer(ffmpeg(), ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', son, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', kbps + 'k', '-ar', '48000', '-movflags', '+faststart', sortie]);
console.log('ok :', path.resolve(sortie));
