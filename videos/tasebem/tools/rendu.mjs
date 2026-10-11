#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────
   Foulée, vidéo d'exemple du pack « Démo d'application » : rendu image par image.

     node tools/rendu.mjs video  [--scene scene/index.html] [--fps 60] [--dpr 1] [--sub 1] [--from 0] [--to 20]
                                 [--out out/foulee-muet.mp4] [--workers 6] [--bitrate 16000000] [--cuts 3.78,6]
     node tools/rendu.mjs stills --times 0.5,2,4.25 [--dpr 1] [--dir out/cles]
     node tools/rendu.mjs sheet  [--every 0.5] [--dpr 0.25] [--dir out/cles]   (planche contact)

   Plusieurs Chrome sans fenêtre capturent les images en parallèle ; elles sont remises dans l'ordre et envoyées
   en flux à ffmpeg (H.264), sans rien écrire sur le disque. --sub N moyenne N captures
   par image (flou de mouvement, obturateur 180°). La page doit exposer window.__ready (vrai quand polices et
   scène sont prêtes), window.__seek(t) et, dans son HTML, « DUREE = 20 ». Le son est ajouté ensuite par tools/bin/mux.
─────────────────────────────────────────────────────────────── */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chrome, ffmpeg, python, drapeauxChrome } from './outils-systeme.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PROJET = path.dirname(ICI);                 // videos/exemple-hero/
const RACINE = PROJET;                            // racine servie au navigateur
const CHROME = chrome();                          // Chrome, Chromium ou Edge, trouvé selon le système (ou CHROME_PATH)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const argv = process.argv.slice(2);
const MODE = argv[0] || 'video';
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const FPS = +opt('fps', 60), DPR = +opt('dpr', MODE === 'video' ? 1 : 0.5), SUB = +opt('sub', 1);
const SCENE_DUREE = (() => { try { const m = fs.readFileSync(path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), opt('scene', 'scene/index.html')), 'utf8').match(/DUREE\s*=\s*([\d.]+)/); return m ? +m[1] : 20; } catch (e) { return 20; } })();
const SCENE_HTML = (() => { try { return fs.readFileSync(path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), opt('scene', 'scene/index.html')), 'utf8'); } catch (e) { return ''; } })();
/* taille du plateau (px CSS) : SCENE_W / SCENE_H dans la page, 1920x1080 par défaut */
const SW = +((SCENE_HTML.match(/SCENE_W\s*=\s*(\d+)/) || [])[1] || 1920), SH = +((SCENE_HTML.match(/SCENE_H\s*=\s*(\d+)/) || [])[1] || 1080);
const FROM = +opt('from', 0), TO = +opt('to', SCENE_DUREE);
const WORKERS = +opt('workers', Math.max(2, Math.min(6, os.cpus().length - 3)));
const QUALITE = +opt('quality', 94);
const SHUTTER = +opt('shutter', 0.5);
const SCENE = opt('scene', 'scene/index.html');

/* ── serveur statique local (racine : videos/exemple-hero) ── */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.json': 'application/json' };
const serveur = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = path.join(RACINE, p);
  if (!f.startsWith(RACINE)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end(); }
    const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {   // les vidéos ont besoin des requêtes partielles pour se positionner
      const [a, b] = range.replace('bytes=', '').split('-');
      const debut = +a, fin = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${debut}-${fin}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': fin - debut + 1 });
      return fs.createReadStream(f, { start: debut, end: fin }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const PORT = serveur.address().port;
const URL_SCENE = `http://127.0.0.1:${PORT}/${SCENE}?render`;

/* ── un Chrome sans fenêtre piloté par le protocole DevTools ── */
const TOUS_LES_CHROME = [];
const tmpRacine = fs.mkdtempSync(path.join(os.tmpdir(), 'foulee-'));
async function ouvrirChrome(n) {
  const profil = path.join(tmpRacine, 'p' + n);
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profil}`,
    `--window-size=${SW},${SH}`, '--hide-scrollbars', '--no-first-run', '--mute-audio', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--autoplay-policy=no-user-gesture-required',
    '--force-color-profile=srgb',
    /* réserve de mémoire graphique : sans elle, plusieurs Chrome en parallèle peuvent livrer des images incomplètes */
    `--force-gpu-mem-available-mb=${+opt('gpumem', 4096)}`,
    ...drapeauxChrome(), ...String(opt('flags', '')).split(' ').filter(Boolean), 'about:blank'], { stdio: 'ignore', windowsHide: true });
  TOUS_LES_CHROME.push(proc);   // tués à la fin, y compris ceux abandonnés au démarrage
  let port = null;
  for (let i = 0; i < 150 && !port; i++) { try { port = fs.readFileSync(path.join(profil, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch (e) { await sleep(100); } }
  if (!port) throw new Error('Chrome ne répond pas');
  let cibles = [];
  for (let i = 0; i < 80 && !cibles.length; i++) { try { cibles = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter((t) => t.type === 'page'); } catch (e) { await sleep(100); } }
  if (!cibles.length) { proc.kill('SIGKILL'); throw new Error('Chrome : aucune page'); }
  const ws = new WebSocket(cibles[0].webSocketDebuggerUrl);
  await Promise.race([new Promise((ok) => ws.addEventListener('open', ok, { once: true })), sleep(20000).then(() => { throw new Error('Chrome : connexion DevTools impossible'); })]);
  let id = 0; const attente = new Map(); const ecoute = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && attente.has(m.id)) { attente.get(m.id)(m); attente.delete(m.id); } else if (m.method) ecoute.forEach((f) => f(m));
  });
  /* délai (ms) : un Chrome qui ne répond plus fait échouer la commande au lieu de bloquer tout le rendu */
  const cmd = (method, params = {}, delai = 0) => new Promise((ok, ko) => {
    const i = ++id; let minuterie = null;
    attente.set(i, (m) => { clearTimeout(minuterie); m.error ? ko(new Error(method + ' : ' + m.error.message)) : ok(m.result); });
    if (delai) minuterie = setTimeout(() => { attente.delete(i); ko(new Error(`${method} : pas de réponse en ${delai / 1000} s`)); }, delai);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluer = async (expr, delai = 0) => { const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, delai); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 600)); return r.result.value; };
  const erreurs = [];
  ecoute.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') erreurs.push(m.params.exceptionDetails?.exception?.description || JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erreurs.push(m.params.args.map((x) => x.value ?? x.description).join(' '));
  });
  await cmd('Page.enable', {}, 20000); await cmd('Runtime.enable', {}, 20000);
  await cmd('Emulation.setDeviceMetricsOverride', { width: SW, height: SH, deviceScaleFactor: DPR, mobile: false }, 20000);
  const charge = new Promise((ok) => ecoute.push((m) => { if (m.method === 'Page.loadEventFired') ok(); }));
  await cmd('Page.navigate', { url: URL_SCENE }, 30000);
  /* la page doit se charger en 60 s (sinon ce Chrome est abandonné et relancé, voir ouvrirChromeSur) */
  { let minuterie; await Promise.race([charge, new Promise((_, ko) => { minuterie = setTimeout(() => ko(new Error('chargement de la page : pas de réponse en 60 s')), 60000); })]); clearTimeout(minuterie); }   // minuterie annulée : sinon le programme attend 60 s avant de rendre la main
  for (let i = 0; i < 600; i++) { if (await evaluer('!!window.__ready')) break; await sleep(50); }
  if (erreurs.length) console.error(`[chrome ${n}] erreurs de page :\n  ` + erreurs.join('\n  '));
  const capturer = async (t) => {
    await evaluer(`window.__seek(${t})`, 30000);
    const r = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: QUALITE, fromSurface: true, captureBeyondViewport: false }, 30000);
    return Buffer.from(r.data, 'base64');
  };
  return { capturer, fermer: () => { try { ws.close(); } catch (e) {} proc.kill('SIGKILL'); }, erreurs };
}

/* coupes franches : le flou de mouvement ne doit pas mélanger les deux côtés d'une coupe */
const COUPES = String(opt('cuts', '')).split(',').filter(Boolean).map(Number);
function tempsDe(f, s) {
  const base = f / FPS;
  if (SUB <= 1) return base;
  const off = ((s + 0.5) / SUB - 0.5) * SHUTTER / FPS;
  let t = Math.min(SCENE_DUREE - 1e-4, Math.max(0, base + off));
  for (const c of COUPES) {
    if (t < c && c <= base) t = c;               // l'image est après la coupe : aucune sous-image avant
    else if (base < c && c <= t) t = c - 1e-4;   // l'image est avant la coupe : aucune sous-image après
  }
  return t;
}

/* démarrage d'un Chrome avec 3 essais (un démarrage peut rester bloqué, par exemple juste après une sortie de veille) */
async function ouvrirChromeSur(n) {
  for (let essai = 0; ; essai++) {
    try { return await ouvrirChrome(essai ? `${n}-d${essai}` : n); } catch (e) {
      if (essai >= 2) throw e;
      console.error(`[chrome ${n}] démarrage : ${e.message} → nouvel essai`);
    }
  }
}

async function toutCapturer(taches, surImage) {
  const chromes = await Promise.all(Array.from({ length: Math.min(WORKERS, taches.length) }, (_, i) => ouvrirChromeSur(i)));
  let prochain = 0, faits = 0;
  const t0 = Date.now();
  const anciennesErreurs = [];
  await Promise.all(chromes.map(async (c, n) => {
    for (;;) {
      const i = prochain++;
      if (i >= taches.length) return;
      let buf;
      for (let essai = 1; ; essai++) {
        try { buf = await c.capturer(taches[i].t); break; } catch (e) {
          if (essai >= 4) throw e;
          /* Chrome bloqué : on le remplace par un neuf et on refait la même image */
          process.stdout.write(`\n  [chrome ${n}] ${e.message} → Chrome relancé, image ${i} refaite (essai ${essai + 1})\n`);
          anciennesErreurs.push(...c.erreurs); c.fermer();
          c = chromes[n] = await ouvrirChromeSur(`${n}-${essai}`);   // avec ses propres essais : un redémarrage peut échouer lui aussi
        }
      }
      await surImage(i, buf);
      faits++;
      if (faits % 30 === 0 || faits === taches.length) {
        const dt = (Date.now() - t0) / 1000;
        process.stdout.write(`\r  ${faits}/${taches.length} captures · ${(faits / dt).toFixed(1)}/s · reste ~${Math.round((taches.length - faits) / (faits / dt))} s   `);
      }
    }
  }));
  process.stdout.write('\n');
  const errs = [...anciennesErreurs, ...chromes.flatMap((c) => c.erreurs)];
  chromes.forEach((c) => c.fermer());
  return errs;
}

/* l'encodage : ffmpeg lit les images JPEG en flux et écrit le fichier H.264 (et, si demandé, une seconde sortie) */
function argsFfmpeg(sorties) {
  const filtre = (l, h) => `${SUB > 1 ? `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=PTS-STARTPTS,` : ''}scale=${l}:${h}:flags=lanczos:in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p`;
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS * SUB), '-i', '-'];
  for (const [fichier, l, h, debit] of sorties) args.push('-map', '0:v:0', '-vf', filtre(l, h), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high',
    '-b:v', String(debit), '-maxrate', String(Math.round(debit * 1.5)), '-bufsize', String(debit * 2), '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an', fichier);
  return args;
}

try {
  if (MODE === 'video') {
    const out = path.resolve(PROJET, opt('out', 'out/foulee-muet.mp4'));
    const out2 = opt('out2', null);
    const L = Math.round(SW * DPR), Hh = Math.round(SH * DPR);
    const debit = +opt('bitrate', DPR >= 2 ? 48_000_000 : 16_000_000);
    const sorties = [[out, L, Hh, debit]];
    if (out2) sorties.push([path.resolve(PROJET, out2), SW, SH, +opt('bitrate2', 16_000_000)]);   // 2e sortie à la taille du plateau (1920x1080 ou 1080x1080)
    for (const [f] of sorties) fs.mkdirSync(path.dirname(f), { recursive: true });
    const enc = spawn(ffmpeg(), argsFfmpeg(sorties), { stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
    let codeEnc = null; enc.on('close', (c) => { codeEnc = c; });
    const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS);
    const taches = [];
    for (let f = f0; f < f1; f++) for (let s = 0; s < SUB; s++) taches.push({ t: tempsDe(f, s) });
    console.log(`rendu ${L}x${Hh} ${FPS} i/s, ${f1 - f0} images × ${SUB} sous-image(s), ${WORKERS} Chrome → ${path.relative(RACINE, out)}`);
    /* remise en ordre et contre-pression vers l'encodeur */
    const tampon = new Map(); let suivant = 0;
    const ecrire = (buf) => new Promise((ok, ko) => {
      if (codeEnc !== null) return ko(new Error('ffmpeg s’est arrêté pendant le rendu (code ' + codeEnc + ')'));
      if (enc.stdin.write(buf)) ok(); else enc.stdin.once('drain', ok);
    });
    let vidage = Promise.resolve();
    const errs = await toutCapturer(taches, async (i, buf) => {
      tampon.set(i, buf);
      while (tampon.size > 240) await sleep(20);   // limite la mémoire si un Chrome prend du retard
      vidage = vidage.then(async () => { while (tampon.has(suivant)) { const b = tampon.get(suivant); tampon.delete(suivant); suivant++; await ecrire(b); } });
    });
    await vidage;
    enc.stdin.end();
    if (codeEnc === null) await new Promise((r) => enc.on('close', r));
    if (codeEnc !== 0) throw new Error('ffmpeg a échoué (code ' + codeEnc + ') : le fichier de sortie est à refaire');
    console.log('images encodées :', f1 - f0);
    if (errs.length) console.error('erreurs de page :', [...new Set(errs)].slice(0, 10));
    console.log('fini :', path.relative(RACINE, out));
  } else if (MODE === 'stills' || MODE === 'sheet') {
    const dir = path.resolve(opt('dir', path.join(PROJET, 'out/cles')));
    fs.mkdirSync(dir, { recursive: true });
    let times;
    if (MODE === 'stills') times = opt('times', '0').split(',').map(Number);
    else { const ev = +opt('every', 0.5); times = []; for (let t = FROM; t < TO - 1e-6; t += ev) times.push(+t.toFixed(3)); }
    const taches = times.map((t) => ({ t }));
    const fichiers = [];
    const errs = await toutCapturer(taches, async (i, buf) => {
      const f = path.join(dir, `t${taches[i].t.toFixed(2).padStart(5, '0')}.jpg`);
      fs.writeFileSync(f, buf); fichiers[i] = f;
    });
    if (errs.length) console.error('erreurs de page :', [...new Set(errs)].slice(0, 10));
    if (MODE === 'sheet') {
      const cols = +opt('cols', 5);
      const planche = path.join(dir, opt('name', 'planche') + '.jpg');
      const py = python();
      execFileSync(py[0], [...py.slice(1), '-c', `
import sys, os
from PIL import Image, ImageDraw
fs=sys.argv[3:]; cols=int(sys.argv[2]); ims=[Image.open(f) for f in fs]
w,h=ims[0].size; rows=(len(ims)+cols-1)//cols
C=Image.new('RGB',(cols*w+(cols+1)*6, rows*(h+22)+6),(30,30,30)); d=ImageDraw.Draw(C)
for i,(f,im) in enumerate(zip(fs,ims)):
  x=6+(i%cols)*(w+6); y=6+(i//cols)*(h+22); C.paste(im,(x,y+16)); d.text((x,y+2),os.path.basename(f)[1:-4]+' s',fill=(230,230,230))
C.save(sys.argv[1],quality=86)
`, planche, String(cols), ...fichiers]);
      for (const f of fichiers) fs.unlinkSync(f);
      console.log('planche :', planche);
    } else console.log('images :', fichiers.join('\n  '));
  }
} finally {
  for (const p of TOUS_LES_CHROME) { try { p.kill('SIGKILL'); } catch (e) {} }
  serveur.close();
  await sleep(400);   // laisse les Chrome fermés relâcher leurs profils
  try { fs.rmSync(tmpRacine, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) {}
}
