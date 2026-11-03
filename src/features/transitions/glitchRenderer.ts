/**
 * Renderizador WebGL do overlay de transição: desenha o vídeo em tela cheia
 * (object-fit: cover) com glitch digital controlado por dois parâmetros:
 *
 * - cover  (0–1): quanto do vídeo já tomou a tela. Blocos de tamanhos variados
 *   entram/saem em ordem pseudoaleatória — o app aparece pelos buracos.
 * - glitch (0–1): intensidade dos rasgos horizontais, separação RGB e
 *   cintilação de blocos. Alto nas bordas da transição, quase zero no meio.
 *
 * Sem dependências: um único quad e um fragment shader.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_texRes;
uniform float u_step;
uniform float u_cover;
uniform float u_glitch;
varying vec2 v_uv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 cover(vec2 uv) {
  float rs = u_res.x / u_res.y;
  float rt = u_texRes.x / u_texRes.y;
  vec2 s = rs > rt ? vec2(1.0, rt / rs) : vec2(rs / rt, 1.0);
  return (uv - 0.5) * s + 0.5;
}

vec3 sampleSplit(vec2 uv, float split) {
  float r = texture2D(u_tex, cover(uv + vec2(split, 0.0))).r;
  float g = texture2D(u_tex, cover(uv)).g;
  float b = texture2D(u_tex, cover(uv - vec2(split, 0.0))).b;
  return vec3(r, g, b);
}

void main() {
  vec2 uv = v_uv;

  // Rasgos: faixas horizontais deslocadas, sorteadas a cada passo.
  float band = floor(uv.y * 54.0);
  float tearOn = step(1.0 - 0.38 * u_glitch, hash(vec2(band, u_step)));
  uv.x += tearOn * (hash(vec2(band, u_step + 7.0)) - 0.5) * 0.22 * u_glitch;

  // Blocos de cobertura: grade grossa + fina, ordem estável (não pisca à toa).
  vec2 coarse = floor(v_uv * vec2(9.0, 6.0));
  vec2 fine = floor(v_uv * vec2(28.0, 18.0));
  float order = mix(hash(coarse), hash(fine + 3.1), 0.35);
  float flicker = step(1.0 - 0.12 * u_glitch, hash(fine + u_step));
  float visible = clamp(step(order, u_cover) + flicker * step(0.02, u_cover), 0.0, 1.0);

  // Separação RGB proporcional ao glitch, com direção sorteada.
  float split = (hash(vec2(u_step, 1.7)) - 0.5) * 0.03 * u_glitch;
  vec3 col = sampleSplit(uv, split);

  // Linhas de varredura discretas.
  col *= 1.0 - 0.06 * u_glitch * step(0.5, fract(v_uv.y * u_res.y * 0.5));

  gl_FragColor = vec4(col * visible, visible);
}`

export interface GlitchParams {
  cover: number
  glitch: number
  /** Passo discreto (ex.: 24 por segundo) — o glitch muda em "quadros", não continuamente. */
  step: number
}

export class GlitchRenderer {
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private texture: WebGLTexture
  private loc: Record<string, WebGLUniformLocation | null>

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true })
    if (!gl) throw new Error('WebGL indisponível')
    this.gl = gl

    this.program = link(gl, compile(gl, gl.VERTEX_SHADER, VERT), compile(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.useProgram(this.program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(this.program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    this.texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    this.loc = Object.fromEntries(
      ['u_tex', 'u_res', 'u_texRes', 'u_step', 'u_cover', 'u_glitch'].map((n) => [
        n,
        gl.getUniformLocation(this.program, n),
      ]),
    )
    gl.uniform1i(this.loc.u_tex, 0)
  }

  render(video: HTMLVideoElement, { cover, glitch, step }: GlitchParams): void {
    const { gl, canvas } = this
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (video.readyState < 2 || !video.videoWidth) return

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
    gl.uniform2f(this.loc.u_res, w, h)
    gl.uniform2f(this.loc.u_texRes, video.videoWidth, video.videoHeight)
    gl.uniform1f(this.loc.u_step, step)
    gl.uniform1f(this.loc.u_cover, cover)
    gl.uniform1f(this.loc.u_glitch, glitch)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  clear(): void {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  dispose(): void {
    this.gl.deleteTexture(this.texture)
    this.gl.deleteProgram(this.program)
  }
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
  return shader
}

function link(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link')
  return program
}
