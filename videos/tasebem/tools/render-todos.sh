#!/bin/sh
# Render final de todos os nichos: 1080x1920, 30 i/s, com a música do conceito. Saída: out/final/<id>.mp4
cd "$(dirname "$0")/.."
mkdir -p out/final out/mudo
export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
for id in $(node -e "console.log(require('./scene/lista.json').join(' '))"); do
  [ -f out/final/$id.mp4 ] && continue
  c=${id%%-*}
  echo "== $id ($(date +%H:%M:%S))"
  node tools/rendu.mjs video --scene scene/$id.html --fps 30 --dpr 1 --workers 4 --bitrate 12000000 --out out/mudo/$id.mp4 </dev/null 2>&1 | grep -v captures
  ffmpeg -v error -y -i out/mudo/$id.mp4 -i audio/musica-$c.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart out/final/$id.mp4 && rm out/mudo/$id.mp4
done
echo "FIM $(date +%H:%M:%S)"
