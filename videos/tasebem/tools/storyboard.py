#!/usr/bin/env python3
"""Storyboard : rend une image par plan (lots de trois) puis assemble une planche par parties.
   python3 tools/storyboard.py [--sans-rendu]"""
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
for _flux in (sys.stdout, sys.stderr):   # Windows : une sortie redirigée n'est pas en UTF-8 par défaut
    try: _flux.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass
ICI = os.path.dirname(os.path.abspath(__file__)); PROJET = os.path.dirname(ICI); DOSSIER = os.path.join(PROJET, "out", "storyboard")
PARTIES = [
  ("1 · Le problème (mesures 1 et 2, de 0 à 4 s)", [
    (0.25, "L'agenda de Léa, son téléphone vibre"), (0.8, "Un message jaillit de l'écran"), (1.25, "Un créneau se rature"),
    (1.8, "Deuxième message"), (2.3, "Troisième message, plus près"), (2.63, "Encore une rature"), (2.88, "La rafale (1)"),
    (3.08, "La rafale (2)"), (3.25, "La rafale (3)"), (3.42, "La rafale (4)"), (3.8, "Tout se fige : le téléphone, couvert")]),
  ("2 · Le basculement (mesure 3, de 4 à 6 s)", [
    (4.25, "Messages et agenda sont aspirés"), (4.75, "Le planning de Créneau se dresse"), (5.3, "Une case s'allume : première couleur"), (5.8, "Le résultat, tenu")]),
  ("3 · Réserver (mesure 4, de 6 à 8 s)", [
    (6.3, "La page de réservation"), (6.75, "Le point de contact"), (7.3, "La case se remplit"), (7.85, "« Réservé », tenu")]),
  ("4 · Rappeler (mesure 5, de 8 à 10 s)", [
    (8.25, "De l'autre côté : le rappel part"), (8.8, "Il se pose chez le client"), (9.25, "La coche repart"), (9.85, "« Confirmé », tenu")]),
  ("5 · Encaisser (mesure 6, de 10 à 12 s)", [
    (10.25, "Le tampon arrive par le côté"), (10.8, "Il s'abat : « Payé · 19 € »"), (11.25, "Le total tourne dans le coin"), (11.85, "Il se bloque : 1 séance, 19 €")]),
  ("6 · La semaine pleine (mesures 7 et 8, de 12 à 16 s)", [
    (12.12, "Lundi"), (12.4, "« Payé »"), (12.65, "Mardi"), (12.9, "Le compteur monte"), (13.15, "Mercredi"), (13.4, "L'orange gagne le planning"),
    (13.65, "Jeudi"), (13.9, "Le compteur"), (14.15, "Vendredi"), (14.4, "Le téléphone du début, éteint"), (14.65, "Samedi"),
    (14.9, "L'avant-dernière case"), (15.3, "23 séances, 437 € : bloqué"), (15.9, "La semaine entière, tenue")]),
  ("7 · La signature (mesures 9 et 10, de 16 à 20 s)", [
    (16.7, "La caméra recule, lentement"), (17.3, "Puis d'un trait : une case se détache"), (17.8, "Elle vient au centre"),
    (18.2, "Dernier coup : elle devient le logo"), (19.3, "Le nom, le bouton")]),
]
def lancer(cmd, limite):
    """Lance une commande ; si elle dépasse la limite, l'arrête avec tout ce qu'elle a lancé (les Chrome)."""
    win = os.name == "nt"
    p = subprocess.Popen(cmd, cwd=PROJET, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", **({"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if win else {"start_new_session": True}))
    try:
        out, err = p.communicate(timeout=limite)
    except subprocess.TimeoutExpired:
        if win: subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
        else:
            import signal
            try: os.killpg(p.pid, signal.SIGKILL)
            except ProcessLookupError: pass
        p.communicate(); raise
    return subprocess.CompletedProcess(cmd, p.returncode, out, err)
nom = lambda t: os.path.join(DOSSIER, "t%05.2f.jpg" % t)
if "--sans-rendu" not in sys.argv:
    # --tout refait toutes les images ; sinon seules celles qui manquent sont rendues. Un lot bloqué est relancé.
    temps = [t for _, ps in PARTIES for t, _ in ps if "--tout" in sys.argv or not os.path.exists(nom(t))]
    for i in range(0, len(temps), 3):
        lot = ",".join(str(t) for t in temps[i:i + 3])
        for essai in range(4):
            try:
                r = lancer(["node", "tools/rendu.mjs", "stills", "--scene", "scene/index.html", "--times", lot, "--dpr", "0.5", "--dir", "out/storyboard"], 100)
            except subprocess.TimeoutExpired:
                print("lot", lot, "bloqué, relancé", flush=True); continue
            if r.returncode or "erreurs de page" in r.stdout + r.stderr: print("échec du lot", lot, (r.stdout + r.stderr)[:1500]); sys.exit(1)
            print("lot", lot, "rendu", flush=True); break
        else: print("abandon du lot", lot); sys.exit(1)
L, Hh, COLS, M, LEG, TIT = 480, 270, 8, 16, 62, 70
POLICES = {False: ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf", "C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "/usr/share/fonts/TTF/DejaVuSans.ttf", "DejaVuSans.ttf", "arial.ttf"],
           True: ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc", "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", "DejaVuSans-Bold.ttf", "arialbd.ttf"]}   # macOS, Windows, Linux
def police(taille, gras=False):
    for p in POLICES[bool(gras)]:
        try: return ImageFont.truetype(p, taille)
        except OSError: pass
    try: return ImageFont.load_default(taille)
    except TypeError: return ImageFont.load_default()
rangs = sum((len(ps) + COLS - 1) // COLS for _, ps in PARTIES)
W, H = M + COLS * (L + M), 110 + len(PARTIES) * TIT + rangs * (Hh + LEG + M) + M
img = Image.new("RGB", (W, H), (17, 17, 21)); d = ImageDraw.Draw(img)
d.text((M, 26), "Lancement de produit · le lancement de Créneau · storyboard (images rendues, 120 battements par minute)", font=police(40, True), fill=(242, 242, 239))
y = 110
for titre, plans in PARTIES:
    d.text((M, y + 14), titre, font=police(34, True), fill=(255, 90, 31)); y += TIT
    for k, (t, legende) in enumerate(plans):
        x = M + (k % COLS) * (L + M)
        if k and k % COLS == 0: y += Hh + LEG + M
        img.paste(Image.open(nom(t)).convert("RGB").resize((L, Hh), Image.LANCZOS), (x, y))
        d.text((x, y + Hh + 6), ("%.2f s" % t).replace(".", ","), font=police(22, True), fill=(255, 90, 31))
        d.text((x + 92, y + Hh + 7), legende, font=police(21), fill=(200, 200, 205))
    y += Hh + LEG + M
img.save(os.path.join(PROJET, "storyboard.png")); print("storyboard.png", img.size)
