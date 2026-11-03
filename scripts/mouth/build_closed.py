"""Boca fechada (linha em zigue-zague) a partir da captura de referência.

A linha é fina (~4 px), então o recorte é feito em 4× de resolução:
  1. recorta a região da boca e amplia 4× (lanczos);
  2. alfa = "brancura": canal mínimo alto E pouca saturação (o verde do
     painel tem canal mínimo alto, mas saturação alta — fica de fora);
  3. mantém só o maior componente conectado;
  4. gira para nivelar com a linha dos olhos (rosto inclinado na captura);
  5. reduz com filtro de área para a largura final — sem falhas no traço.
"""
import json, math, subprocess, sys
from collections import deque

SRC, OUT = sys.argv[1], sys.argv[2]
BOX = (860, 1130, 1500, 1480)          # região da boca na captura (2000×1511)
EYES = ((560, 985), (1452, 612))       # pupilas na captura
UP = 4
FINAL_W = 1200                          # nítido em telas retina grandes
COLOR = (244, 242, 247)

def run(args, data=None):
    return subprocess.run(args, input=data, capture_output=True, check=True).stdout

x0, y0, x1, y1 = BOX
w, h = (x1 - x0) * UP, (y1 - y0) * UP
raw = run(['ffmpeg', '-loglevel', 'error', '-i', SRC, '-vf',
           f'crop={x1-x0}:{y1-y0}:{x0}:{y0},scale={w}:{h}:flags=lanczos',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])

a = bytearray(w * h)
for i in range(w * h):
    r, g, b = raw[i*3], raw[i*3+1], raw[i*3+2]
    lo, hi = min(r, g, b), max(r, g, b)
    white = max(0.0, min(1.0, (lo - 35) / 150))
    gray = max(0.0, min(1.0, 1 - (hi - lo - 30) / 50))
    a[i] = round(255 * white * gray)

# maior componente conectado (8-vizinhança), limiar baixo para não quebrar o traço
seen = bytearray(w * h); best = []
for s in range(w * h):
    if a[s] > 12 and not seen[s]:
        comp = []; q = deque([s]); seen[s] = 1
        while q:
            p = q.popleft(); comp.append(p); px, py = p % w, p // w
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = px + dx, py + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        n = ny * w + nx
                        if not seen[n] and a[n] > 12:
                            seen[n] = 1; q.append(n)
        if len(comp) > len(best): best = comp
keep = bytearray(w * h)
for p in best: keep[p] = 1
# inclui a franja de antialiasing (vizinhos até 3 px do traço)
mask = bytearray(keep)
for p in best:
    px, py = p % w, p // w
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            nx, ny = px + dx, py + dy
            if 0 <= nx < w and 0 <= ny < h: mask[ny * w + nx] = 1

rgba = bytearray()
for i in range(w * h):
    rgba += bytes(COLOR) + bytes([a[i] if mask[i] else 0])

(lx, ly), (rx, ry) = EYES
ang = math.atan2(ry - ly, rx - lx)
rot = f'rotate={-ang}:ow=rotw({-ang}):oh=roth({-ang}):c=none:bilinear=1'
tmp = OUT + '.tmp.png'
run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{w}x{h}',
     '-i', '-', '-vf', f'{rot},format=rgba', tmp], bytes(rgba))

# bbox do alfa após girar
p = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', tmp]))['streams'][0]
W, H = p['width'], p['height']
img = run(['ffmpeg', '-loglevel', 'error', '-i', tmp, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'])
cols = [any(img[(y*W+x)*4+3] > 4 for y in range(0, H, 2)) for x in range(W)]
rows = [any(img[(y*W+x)*4+3] > 4 for x in range(0, W, 2)) for y in range(H)]
cx0 = cols.index(True); cx1 = W - cols[::-1].index(True)
cy0 = rows.index(True); cy1 = H - rows[::-1].index(True)
pad = 8 * UP
cx0, cy0, cx1, cy1 = max(0, cx0 - pad), max(0, cy0 - pad), min(W, cx1 + pad), min(H, cy1 + pad)
run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp, '-vf',
     f'crop={cx1-cx0}:{cy1-cy0}:{cx0}:{cy0},scale={FINAL_W}:-1:flags=area,format=rgba',
     '-compression_level', '9', OUT])
subprocess.run(['rm', tmp])

d = math.hypot(rx - lx, ry - ly)
print(json.dumps({'w_over_d': (cx1 - cx0) / UP / d, 'size_src_px': [(cx1 - cx0) / UP, (cy1 - cy0) / UP]}))
