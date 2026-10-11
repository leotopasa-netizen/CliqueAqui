// Ce que les outils demandent au système, de la même façon sur Windows, macOS et Linux : où sont ffmpeg, ffprobe,
// Google Chrome (ou Chromium, ou Edge) et Python. Rien n'est installé ici : `node tools/verifier.mjs` dit ce qui manque.
//   FFMPEG_PATH, FFPROBE_PATH, CHROME_PATH, PYTHON_PATH : pour forcer un chemin.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const SYSTEME = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
const marche = (cmd, args) => { try { const r = spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true }); return r.status === 0 ? (r.stdout || r.stderr || '').trim() : null; } catch (e) { return null; } };

function programme(nom, variable) {
  const force = process.env[variable];
  if (force) { if (marche(force, ['-version']) !== null) return force; throw new Error(`${variable} = « ${force} » ne répond pas. Corrige ou retire cette variable.`); }
  if (marche(nom, ['-version']) !== null) return nom;
  return null;
}
export const trouverFfmpeg = () => programme('ffmpeg', 'FFMPEG_PATH');
export const trouverFfprobe = () => programme('ffprobe', 'FFPROBE_PATH');
const exiger = (chemin, quoi) => { if (!chemin) throw new Error(`${quoi} est introuvable. Lance « node tools/verifier.mjs » : il dit quoi installer sur ton système.`); return chemin; };
export const ffmpeg = () => exiger(trouverFfmpeg(), 'ffmpeg');
export const ffprobe = () => exiger(trouverFfprobe(), 'ffprobe');

// Google Chrome, sinon Chromium, sinon Edge (même moteur) : on essaie les emplacements habituels de chaque système.
export function trouverChrome() {
  const force = process.env.CHROME_PATH;
  if (force) { if (fs.existsSync(force)) return force; throw new Error(`CHROME_PATH = « ${force} » n'existe pas. Corrige ou retire cette variable.`); }
  const e = process.env, candidats = [];
  const bases = SYSTEME === 'macos' ? ['/Applications', path.join(os.homedir(), 'Applications')] : [e.PROGRAMFILES, e['PROGRAMFILES(X86)'], e.LOCALAPPDATA].filter(Boolean);
  const navigateurs = SYSTEME === 'macos'
    ? [['Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'], ['Chromium.app', 'Contents', 'MacOS', 'Chromium'], ['Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge']]
    : [['Google', 'Chrome', 'Application', 'chrome.exe'], ['Chromium', 'Application', 'chrome.exe'], ['Microsoft', 'Edge', 'Application', 'msedge.exe']];
  if (SYSTEME !== 'linux') for (const n of navigateurs) for (const base of bases) candidats.push(path.join(base, ...n));
  else {
    for (const nom of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) for (const dossier of (e.PATH || '').split(path.delimiter).filter(Boolean)) candidats.push(path.join(dossier, nom));
    candidats.push('/snap/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium');
  }
  return candidats.find((c) => { try { return fs.statSync(c).isFile(); } catch (err) { return false; } }) || null;
}
export const chrome = () => exiger(trouverChrome(), 'Google Chrome (ou Chromium, ou Edge)');
// Options ajoutées à chaque Chrome sans fenêtre : sans carte graphique (serveur, machine virtuelle), WebGL passe par le
// rendu logiciel au lieu d'être refusé ; sous Linux en root, Chrome ne démarre pas sans --no-sandbox.
export const drapeauxChrome = () => ['--enable-unsafe-swiftshader', ...(SYSTEME === 'linux' && process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])];

// Python 3 : python3, puis python, puis py (le lanceur de Windows). Renvoie [commande, ...arguments de tête].
export function trouverPython() {
  const essais = process.env.PYTHON_PATH ? [[process.env.PYTHON_PATH]] : [['python3'], ['python'], ['py', '-3']];
  for (const c of essais) { const v = marche(c[0], [...c.slice(1), '--version']); if (v && /Python 3\./.test(v)) return c; }
  return null;
}
export const python = () => exiger(trouverPython(), 'Python 3');
export const pillowPresent = () => { const p = trouverPython(); return !!p && marche(p[0], [...p.slice(1), '-c', 'import PIL; print(PIL.__version__)']) !== null; };
// La reconnaissance vocale est facultative : Whisper s'il est installé (commande « whisper »), sinon rien.
export const trouverWhisper = () => (process.env.WHISPER_PATH && marche(process.env.WHISPER_PATH, ['--help']) !== null ? process.env.WHISPER_PATH : marche('whisper', ['--help']) !== null ? 'whisper' : null);

// Lance un programme et attend sa fin ; l'erreur dit ce qui a échoué.
export function lancer(cmd, args, o = {}) {
  const r = spawnSync(cmd, args, { encoding: o.binaire ? 'buffer' : 'utf8', maxBuffer: 1 << 30, windowsHide: true, stdio: o.stdio || ['ignore', 'pipe', 'pipe'] });
  if (r.error) throw new Error(`${cmd} n'a pas pu être lancé : ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} a échoué (code ${r.status}) :\n${String(r.stderr || '').split('\n').slice(-12).join('\n')}`);
  return r;
}
export const dossierTemporaire = (prefixe = 'mavena-') => fs.mkdtempSync(path.join(os.tmpdir(), prefixe));

// Lance un programme avec une limite de temps. S'il la dépasse, il est arrêté avec tout ce qu'il a lancé (les Chrome
// d'un rendu) : « taskkill /T » sur Windows, le groupe de processus ailleurs. Renvoie { code, sortie, bloque }.
export function lancerAvecLimite(cmd, args, { cwd, limite = 100000 } = {}) {
  return new Promise((fini) => {
    const win = SYSTEME === 'windows';
    const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, detached: !win });
    let sortie = '', bloque = false;
    p.stdout.on('data', (d) => { sortie += d; }); p.stderr.on('data', (d) => { sortie += d; });
    const minuterie = setTimeout(() => {
      bloque = true;
      try { if (win) spawnSync('taskkill', ['/F', '/T', '/PID', String(p.pid)], { windowsHide: true }); else process.kill(-p.pid, 'SIGKILL'); } catch (err) { try { p.kill('SIGKILL'); } catch (e2) {} }
    }, limite);
    p.on('error', (err) => { clearTimeout(minuterie); fini({ code: -1, sortie: String(err.message), bloque }); });
    p.on('close', (code) => { clearTimeout(minuterie); fini({ code, sortie, bloque }); });
  });
}

// Chrome sait-il dessiner en WebGL2 sans fenêtre (les scènes en ont besoin) ? Renvoie { ok, moteur } ou null si l'essai
// n'a pas pu se faire. Un moteur « SwiftShader » ou « llvmpipe » veut dire : pas de carte graphique, rendus lents.
export function essaiWebgl(chemin, drapeaux = drapeauxChrome()) {
  const profil = dossierTemporaire('mavena-webgl-');
  const page = "data:text/html,<script>var c=document.createElement('canvas').getContext('webgl2'),x=c&&c.getExtension('WEBGL_debug_renderer_info');document.title='WEBGL2='+(c?'oui':'non')+'|'+(x?c.getParameter(x.UNMASKED_RENDERER_WEBGL):'')+'|FIN'</script>";
  try {
    const r = spawnSync(chemin, ['--headless=new', `--user-data-dir=${profil}`, '--no-first-run', '--mute-audio', ...drapeaux, '--dump-dom', page], { encoding: 'utf8', timeout: 40000, windowsHide: true });
    const m = /WEBGL2=(oui|non)\|([^|]*)\|FIN/.exec(r.stdout || '');
    return m ? { ok: m[1] === 'oui', moteur: m[2] } : null;
  } catch (err) { return null; } finally { try { fs.rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e2) {} }
}
