"""Gera os sprites da boca a partir dos frames originais + metadados em unidades
de distância entre os olhos (d), relativos ao ponto médio entre os olhos."""
import subprocess, sys, json, math
from collections import deque
sys.path.insert(0, sys.argv[1])
from key import load

S, OUT = sys.argv[1], sys.argv[2]
COLOR = (244, 242, 247)

def alpha_crop(path, box, lo, hi):
    W, H, raw = load(path)
    x0, y0, x1, y1 = box
    w, h = x1-x0, y1-y0
    a = [0]*(w*h)
    for y in range(h):
        for x in range(w):
            i = ((y0+y)*W + x0+x)*3
            m = min(raw[i], raw[i+1], raw[i+2])
            a[y*w+x] = max(0, min(255, round((m-lo)*255/(hi-lo))))
    # mantém só o maior componente conectado (remove respingos e estrelas)
    seen = [False]*(w*h); best = []
    for s in range(w*h):
        if a[s] > 30 and not seen[s]:
            comp = []; q = deque([s]); seen[s] = True
            while q:
                p = q.popleft(); comp.append(p); px, py = p % w, p // w
                for dx in (-1,0,1):
                    for dy in (-1,0,1):
                        nx, ny = px+dx, py+dy
                        if 0 <= nx < w and 0 <= ny < h:
                            np_ = ny*w+nx
                            if not seen[np_] and a[np_] > 30:
                                seen[np_] = True; q.append(np_)
            if len(comp) > len(best): best = comp
    keep = set(best)
    # inclui a borda antialiasing (alfa baixo) vizinha ao componente
    xs = [p % w for p in best]; ys = [p // w for p in best]
    pad = 3
    bx0, bx1 = max(0, min(xs)-pad), min(w, max(xs)+pad+1)
    by0, by1 = max(0, min(ys)-pad), min(h, max(ys)+pad+1)
    def near(p):
        px, py = p % w, p // w
        return any((ny*w+nx) in keep for nx in range(px-2, px+3) for ny in range(py-2, py+3))
    rgba = bytearray()
    for y in range(by0, by1):
        for x in range(bx0, bx1):
            p = y*w+x
            v = a[p] if (p in keep or (a[p] > 0 and near(p))) else 0
            rgba += bytes(COLOR) + bytes([v])
    ow, oh = bx1-bx0, by1-by0
    return rgba, ow, oh, (x0+bx0+ow/2, y0+by0+oh/2)

def save(rgba, w, h, out, rotate_deg=0):
    vf = ['-vf', f'rotate={math.radians(rotate_deg)}:ow=rotw({math.radians(rotate_deg)}):oh=roth({math.radians(rotate_deg)}):c=none,format=rgba'] if rotate_deg else []
    tmp = out + '.tmp.png'
    subprocess.run(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',f'{w}x{h}','-i','-',*vf,tmp], input=bytes(rgba), check=True)
    # re-corta pela bbox do alfa depois da rotação
    probe = subprocess.run(['ffprobe','-v','error','-show_entries','stream=width,height','-of','json',tmp],capture_output=True,text=True)
    s = json.loads(probe.stdout)['streams'][0]; W, H = s['width'], s['height']
    raw = subprocess.run(['ffmpeg','-loglevel','error','-i',tmp,'-f','rawvideo','-pix_fmt','rgba','-'],capture_output=True).stdout
    xs = [x for x in range(W) if any(raw[(y*W+x)*4+3] > 8 for y in range(H))]
    ys = [y for y in range(H) if any(raw[(y*W+x)*4+3] > 8 for x in range(W))]
    cx0, cx1, cy0, cy1 = max(0,xs[0]-2), min(W,xs[-1]+3), max(0,ys[0]-2), min(H,ys[-1]+3)
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',tmp,'-vf',f'crop={cx1-cx0}:{cy1-cy0}:{cx0}:{cy0}',out],check=True)
    subprocess.run(['rm', tmp])
    # deslocamento do centro após o recorte, em px do sprite rotacionado
    return cx1-cx0, cy1-cy0, ((cx0+cx1)/2 - W/2, (cy0+cy1)/2 - H/2)

meta = []
# Eyes medidos por frame (pupilas) — evil-capri.mp4, 1920x1080.
EYES = {60: ((702,559),(1259,554)), 66: ((695,542),(1261,539)), 72: ((692,536),(1263,534)), 84: ((687,529),(1265,529))}
for n, name in [(60, 'small'), (66, 'mid'), (72, 'open'), (84, 'wide')]:
    rgba, w, h, c = alpha_crop(f'{S}/f{n}.png', (780,760,1300,1060), 70, 200)
    out = f'{OUT}/{name}.png'
    ow, oh, off = save(rgba, w, h, out)
    (lx, ly), (rx, ry) = EYES[n]
    d = math.hypot(rx-lx, ry-ly); mx, my = (lx+rx)/2, (ly+ry)/2
    cx, cy = c[0]+off[0], c[1]+off[1]
    meta.append({'name': name, 'src': f'evil-capri.mp4 #{n}', 'cx': (cx-mx)/d, 'cy': (cy-my)/d, 'w': ow/d, 'h': oh/d, 'px': [ow, oh]})

# Boca fechada — captura enviada pelo usuário (2000x1511); rosto inclinado: nivela pela linha dos olhos.
(lx, ly), (rx, ry) = (560, 985), (1452, 612)
ang = math.degrees(math.atan2(ry-ly, rx-lx))
rgba, w, h, c = alpha_crop(sys.argv[3], (860,1130,1500,1480), 140, 225)
ow, oh, off = save(rgba, w, h, f'{OUT}/closed.png', rotate_deg=-ang)
d = math.hypot(rx-lx, ry-ly); mx, my = (lx+rx)/2, (ly+ry)/2
# centro do sprite rotacionado em torno do próprio centro; leva o centro original para o referencial nivelado
vx, vy = c[0]-mx, c[1]-my
t = math.radians(-ang)
rx_, ry_ = vx*math.cos(t) - vy*math.sin(t), vx*math.sin(t) + vy*math.cos(t)
meta.insert(0, {'name': 'closed', 'src': 'captura (boca fechada)', 'cx': (rx_+off[0])/d, 'cy': (ry_+off[1])/d, 'w': ow/d, 'h': oh/d, 'px': [ow, oh], 'tilt': ang})
print(json.dumps(meta, indent=1))
