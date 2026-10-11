// Lecture et écriture de fichiers WAV, et quelques mesures de niveau.
import { ffmpeg, lancer } from "./outils-systeme.mjs";
import { readFileSync, writeFileSync } from "node:fs";

export const SR = 48000;
export const dB = (x) => 20 * Math.log10(Math.max(x, 1e-9));
export const fromDb = (d) => Math.pow(10, d / 20);

// Renvoie { sr, channels: [Float32Array, ...] }
export function readWav(path) {
  const b = readFileSync(path);
  let p = 12;
  let fmt = null;
  let data = null;
  while (p < b.length - 8) {
    const id = b.toString("ascii", p, p + 4);
    const size = b.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { format: b.readUInt16LE(p + 8), ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === "data") data = b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size & 1);
  }
  const bytes = fmt.bits / 8;
  const n = Math.floor(data.length / (bytes * fmt.ch));
  const channels = Array.from({ length: fmt.ch }, () => new Float32Array(n));
  for (let i = 0; i < n; i++)
    for (let c = 0; c < fmt.ch; c++) {
      const o = (i * fmt.ch + c) * bytes;
      channels[c][i] = fmt.format === 3 ? data.readFloatLE(o) : fmt.bits === 16 ? data.readInt16LE(o) / 32768 : fmt.bits === 24 ? data.readIntLE(o, 3) / 8388608 : data.readInt32LE(o) / 2147483648;
    }
  return { sr: fmt.sr, channels };
}

export function writeWav(path, channels, sr = SR, bits = 24) {
  const ch = channels.length;
  const n = channels[0].length;
  const bytes = bits / 8;
  const b = Buffer.alloc(44 + n * ch * bytes);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * ch * bytes, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(ch, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * ch * bytes, 28);
  b.writeUInt16LE(ch * bytes, 32);
  b.writeUInt16LE(bits, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * ch * bytes, 40);
  const max = bits === 16 ? 32767 : 8388607;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.round(Math.max(-1, Math.min(1, channels[c][i])) * max);
      const o = 44 + (i * ch + c) * bytes;
      if (bits === 16) b.writeInt16LE(v, o);
      else b.writeIntLE(v, o, 3);
    }
  writeFileSync(path, b);
}

// Décode un fichier audio (mp3...) en WAV mono 48 kHz avec l'outil intégré à macOS.
export function decodeToMono(src, wavPath) {
  lancer(ffmpeg(), ["-y", "-hide_banner", "-loglevel", "error", "-i", src, "-vn", "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", wavPath]);
  return readWav(wavPath).channels[0];
}
export function toM4a(wavPath, m4aPath, kbps = 192) {
  lancer(ffmpeg(), ["-y", "-hide_banner", "-loglevel", "error", "-i", wavPath, "-vn", "-c:a", "aac", "-b:a", kbps + "k", "-movflags", "+faststart", m4aPath]);
}

export const peak = (x) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
export const rms = (x, a = 0, b = x.length) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
};
// Premier et dernier échantillon au-dessus du seuil (début et fin de la parole).
export function speechBounds(x, thresholdDb = -42) {
  const th = fromDb(thresholdDb);
  let a = 0;
  let b = x.length - 1;
  while (a < x.length && Math.abs(x[a]) < th) a++;
  while (b > a && Math.abs(x[b]) < th) b--;
  return [a, b + 1];
}
