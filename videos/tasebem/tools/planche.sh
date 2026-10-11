#!/bin/sh
# planche de controlo: tools/planche.sh <id> [tempos]
ID=$1; TIMES=${2:-0.9,2.8,5.5,8,10.3,11.6,13,15,17,18.8,21.5,23,24.5,28,32.8,40,45,47.8,50.8,53.5}
D=out/cles-$ID; rm -rf $D
CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node tools/rendu.mjs stills --scene scene/$ID.html --dpr 0.25 --workers 4 --dir $D --times $TIMES </dev/null 2>&1 | grep -i "erreur" 
python3 - "$D" "out/planche-$ID.jpg" <<'PY'
import sys,glob,os
from PIL import Image,ImageDraw
fs=sorted(glob.glob(sys.argv[1]+'/t*.jpg')); ims=[Image.open(f) for f in fs]; w,h=ims[0].size
cols=10; rows=(len(ims)+cols-1)//cols
C=Image.new('RGB',(cols*(w+4),rows*(h+16)),(40,40,40)); d=ImageDraw.Draw(C)
for i,(f,im) in enumerate(zip(fs,ims)):
  x=(i%cols)*(w+4); y=(i//cols)*(h+16); C.paste(im,(x,y+14)); d.text((x+2,y+1),os.path.basename(f)[1:-4],fill=(255,255,255))
C.save(sys.argv[2],quality=85)
PY
