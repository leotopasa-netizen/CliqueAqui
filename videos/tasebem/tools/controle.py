#!/usr/bin/env python3
"""Lecture du fichier d'écarts (tools/bin/coupes video.mp4 > ecarts.tsv) : images figées, pics isolés, sauts de luminosité.

  python3 tools/controle.py out/ecarts.tsv
"""
import sys
for _flux in (sys.stdout, sys.stderr):   # Windows : une sortie redirigée n'est pas en UTF-8 par défaut
    try: _flux.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass
def lignes(chemin):
    # le fichier peut avoir été écrit par « > » sous PowerShell, donc en UTF-16
    b = open(chemin, 'rb').read()
    return b.decode('utf-16' if b[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig').splitlines()
L = [l.split('\t') for l in lignes(sys.argv[1]) if l.strip()]
n = len(L); t = [float(x[1]) for x in L]; d = [float(x[2]) for x in L]; lum = [float(x[3]) for x in L]
print(f"{n} images, durée {t[-1] + (t[1] - t[0]):.3f} s, luminosité {min(lum):.1f} à {max(lum):.1f}")
fig = [i for i in range(1, n) if d[i] < 0.004]
print(f"images figées (écart < 0,004) : {len(fig)}", [f"{t[i]:.2f}" for i in fig[:40]])
pics = [i for i in range(2, n - 2) if d[i] > 3 * max(d[i - 1], d[i + 1], 0.15) ]
print(f"pics isolés : {len(pics)}", [(f"{t[i]:.2f}", d[i]) for i in pics[:40]])
doubles = [i for i in range(2, n - 2) if min(d[i], d[i + 1]) > 3 * max(d[i - 1], d[i + 2], 0.15)]
print(f"images isolées (deux pics de suite) : {len(doubles)}", [(f"{t[i]:.2f}", d[i], d[i + 1]) for i in doubles[:40]])
sauts = [i for i in range(1, n - 1) if abs(lum[i] - lum[i - 1]) > 1.2 and abs(lum[i + 1] - lum[i]) > 1.2 and (lum[i] - lum[i - 1]) * (lum[i + 1] - lum[i]) < 0]
print(f"sauts de luminosité isolés : {len(sauts)}", [(f"{t[i]:.2f}", lum[i - 1], lum[i], lum[i + 1]) for i in sauts[:40]])
forts = sorted(range(n), key=lambda i: -d[i])[:12]
print("plus forts écarts :", [(f"{t[i]:.2f}", d[i]) for i in sorted(forts)])
sombres = [i for i in range(n) if lum[i] < 3]
print(f"images très sombres (luminosité < 3) : {len(sombres)}", (f"{t[sombres[0]]:.2f} à {t[sombres[-1]]:.2f}" if sombres else ""))
