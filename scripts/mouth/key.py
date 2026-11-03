"""Recorta a boca (preenchimento branco) de um frame original em PNG com alfa.
Alfa = menor canal (branco alto; azul-marinho, verde, vermelho e roxo baixos)."""
import subprocess, sys, json, math

def load(path):
    probe = subprocess.run(['ffprobe','-v','error','-show_entries','stream=width,height','-of','json',path],capture_output=True,text=True)
    s = json.loads(probe.stdout)['streams'][0]
    raw = subprocess.run(['ffmpeg','-loglevel','error','-i',path,'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    return s['width'], s['height'], raw

def key(path, box, out, lo=70, hi=200, color=(244,242,247)):
    W, H, raw = load(path)
    x0, y0, x1, y1 = box
    w, h = x1-x0, y1-y0
    a = bytearray(w*h)
    for y in range(h):
        for x in range(w):
            i = ((y0+y)*W + x0+x)*3
            m = min(raw[i], raw[i+1], raw[i+2])
            a[y*w+x] = max(0, min(255, round((m-lo)*255/(hi-lo))))
    # bbox do alfa
    ys = [y for y in range(h) if any(a[y*w:(y+1)*w])]
    xs = [x for x in range(w) if any(a[y*w+x] for y in range(h))]
    bx0, bx1, by0, by1 = xs[0], xs[-1]+1, ys[0], ys[-1]+1
    pad = 4
    bx0, by0 = max(0,bx0-pad), max(0,by0-pad); bx1, by1 = min(w,bx1+pad), min(h,by1+pad)
    ow, oh = bx1-bx0, by1-by0
    rgba = bytearray()
    for y in range(by0, by1):
        for x in range(bx0, bx1):
            rgba += bytes(color) + bytes([a[y*w+x]])
    subprocess.run(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',f'{ow}x{oh}','-i','-',out],input=bytes(rgba),check=True)
    # centro da bbox no frame original
    return {'out': out.split('/')[-1], 'w': ow, 'h': oh, 'cx': x0+bx0+ow/2, 'cy': y0+by0+oh/2}

if __name__ == '__main__':
    path, out = sys.argv[1], sys.argv[2]
    box = tuple(int(v) for v in sys.argv[3].split(','))
    print(json.dumps(key(path, box, out)))
