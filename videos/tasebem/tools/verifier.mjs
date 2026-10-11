// Vérifie que tout ce qu'il faut pour fabriquer la vidéo est là. Il n'installe rien : il dit ce qui manque et la
// commande à lancer, pour Windows, macOS et Linux.   node tools/verifier.mjs
import { spawnSync } from 'node:child_process';
import { SYSTEME, trouverFfmpeg, trouverFfprobe, trouverChrome, trouverPython, pillowPresent, trouverWhisper, essaiWebgl } from './outils-systeme.mjs';
const version = (cmd, args = ['-version']) => { try { return (spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true }).stdout || '').split('\n')[0].trim(); } catch (e) { return ''; } };
const INSTALLER = {
  ffmpeg: { windows: 'winget install --id Gyan.FFmpeg -e', macos: 'brew install ffmpeg', linux: 'sudo apt install ffmpeg        (Debian, Ubuntu) · sudo dnf install ffmpeg (Fedora) · sudo pacman -S ffmpeg (Arch)' },
  chrome: { windows: 'winget install --id Google.Chrome -e        (Edge, déjà présent sur Windows, convient aussi)', macos: 'brew install --cask google-chrome        (ou depuis google.com/chrome)', linux: 'sudo apt install chromium        (ou chromium-browser ; ou Google Chrome depuis google.com/chrome)' },
  python: { windows: 'winget install --id Python.Python.3.12 -e', macos: 'brew install python', linux: 'sudo apt install python3 python3-pip' },
  pillow: { windows: 'py -m pip install pillow', macos: 'python3 -m pip install pillow', linux: 'python3 -m pip install pillow        (ou : sudo apt install python3-pil)' },
  whisper: { windows: 'py -m pip install openai-whisper', macos: 'python3 -m pip install openai-whisper', linux: 'python3 -m pip install openai-whisper' },
};
const NOMS = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };
let manque = 0;
function ligne(nom, trouve, detail, cle, facultatif) {
  console.log(`${trouve ? '  ok      ' : facultatif ? '  absent  ' : '  MANQUE  '}${nom}${detail ? ' : ' + detail : ''}${facultatif && !trouve ? ' (facultatif)' : ''}`);
  if (!trouve) { if (!facultatif) manque++; console.log(`            pour l'installer sur ${NOMS[SYSTEME]} : ${INSTALLER[cle][SYSTEME]}`); }
}
console.log(`Système : ${NOMS[SYSTEME]} · Node ${process.version}`);
const majeur = +process.version.slice(1).split('.')[0];
if (majeur < 18) { manque++; console.log('  MANQUE  Node 18 ou plus récent (nodejs.org)'); } else console.log('  ok      Node');
let ff = null, fp = null, ch = null, py = null;
try { ff = trouverFfmpeg(); } catch (e) { console.log('  ' + e.message); }
try { fp = trouverFfprobe(); } catch (e) { console.log('  ' + e.message); }
try { ch = trouverChrome(); } catch (e) { console.log('  ' + e.message); }
py = trouverPython();
ligne('ffmpeg', !!ff, ff && version(ff).replace(/ Copyright.*/, ''), 'ffmpeg');
ligne('ffprobe', !!fp, fp && version(fp).replace(/ Copyright.*/, ''), 'ffmpeg');
if (ff) { const enc = spawnSync(ff, ['-hide_banner', '-encoders'], { encoding: 'utf8', windowsHide: true }).stdout || ''; if (!/libx264/.test(enc)) { manque++; console.log('  MANQUE  l’encodeur libx264 dans ce ffmpeg : installe une version complète de ffmpeg (commande ci-dessus)'); } }
ligne('Google Chrome, Chromium ou Edge', !!ch, ch, 'chrome');
if (ch) {
  const w = essaiWebgl(ch);
  if (!w) console.log('  ?       WebGL2 dans ce navigateur : essai impossible (un rendu d’essai le dira : node tools/essai.mjs essai 1)');
  else if (!w.ok) { manque++; console.log('  MANQUE  WebGL2 dans ce navigateur (les scènes en ont besoin) : mets à jour le navigateur, ou les pilotes de la carte graphique'); }
  else console.log(`  ok      WebGL2 : ${w.moteur || 'disponible'}${/swiftshader|llvmpipe|software/i.test(w.moteur) ? '\n            (rendu logiciel, sans carte graphique : les rendus marcheront, mais lentement)' : ''}`);
}
ligne('Python 3', !!py, py && `${version(py[0], [...py.slice(1), '--version'])} (commande : ${py.join(' ')})`, 'python');
ligne('Pillow (planches d’images)', py ? pillowPresent() : false, '', 'pillow');
ligne('Whisper (relecture de la voix off par reconnaissance vocale)', !!trouverWhisper(), '', 'whisper', true);
console.log(manque ? `\n${manque} élément(s) à installer avant de lancer un rendu. Ce script n'installe rien : demande l'accord avant de lancer une commande d'installation.\nAprès une installation, rouvre le terminal (il ne voit les nouveaux programmes qu'à l'ouverture) et relance cette vérification.` : '\nTout est prêt : tu peux lancer les rendus.');
console.log('Pour forcer un chemin : variables CHROME_PATH, FFMPEG_PATH, FFPROBE_PATH, PYTHON_PATH.');
process.exit(manque ? 1 : 0);
