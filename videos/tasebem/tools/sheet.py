"""Compose une planche d'images à partir d'images rendues.

  python3 tools/sheet.py sortie.png --cols 4 --thumb 640 image1.png "légende 1" image2.png "légende 2" ...
"""
import sys
from PIL import Image, ImageDraw, ImageFont
for _flux in (sys.stdout, sys.stderr):   # Windows : une sortie redirigée n'est pas en UTF-8 par défaut
    try: _flux.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

args = sys.argv[1:]
out = args.pop(0)
cols, thumb, title = 4, 640, ""
while args and args[0].startswith("--"):
    k = args.pop(0)
    v = args.pop(0)
    if k == "--cols": cols = int(v)
    if k == "--thumb": thumb = int(v)
    if k == "--title": title = v
items = list(zip(args[0::2], args[1::2]))

POLICES = {False: ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf", "C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "/usr/share/fonts/TTF/DejaVuSans.ttf", "DejaVuSans.ttf", "arial.ttf"],
           True: ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc", "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", "DejaVuSans-Bold.ttf", "arialbd.ttf"]}   # macOS, Windows, Linux
def font(size, bold=False):
    for path in POLICES[bool(bold)]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    try:
        return ImageFont.load_default(size)
    except Exception:
        return ImageFont.load_default()

first = Image.open(items[0][0])
th = round(thumb * first.height / first.width)
pad, cap = 24, round(thumb * 0.17)
head = 110 if title else pad
rows = (len(items) + cols - 1) // cols
W = pad + cols * (thumb + pad)
H = head + rows * (th + cap + pad)
sheet = Image.new("RGB", (W, H), (22, 22, 26))
d = ImageDraw.Draw(sheet)
if title:
    d.text((pad, 34), title, font=font(40, True), fill=(242, 242, 239))
f1, f2 = font(round(thumb * 0.047), True), font(round(thumb * 0.038))
for i, (path, caption) in enumerate(items):
    x = pad + (i % cols) * (thumb + pad)
    y = head + (i // cols) * (th + cap + pad)
    im = Image.open(path).convert("RGB").resize((thumb, th), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.rectangle([x, y, x + thumb - 1, y + th - 1], outline=(58, 58, 66))
    line1, _, line2 = caption.partition("|")
    d.text((x, y + th + round(thumb * 0.02)), line1, font=f1, fill=(255, 90, 31))
    d.text((x, y + th + round(thumb * 0.08)), line2, font=f2, fill=(190, 190, 196))
sheet.save(out)
print(out, sheet.size)
