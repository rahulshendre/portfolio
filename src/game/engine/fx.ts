// Lighting pass over the pixel canvas: bright spots (lamps, TV, door light) glow, the corners fall off a little, the colours warm up.
// A second canvas, same pixel size as the game canvas, sits on top and is fed the game canvas as a texture every frame.
// If WebGL is missing or lost, nothing changes: the plain game canvas stays visible.
import type { Mode } from './screen';

/** The pass runs on the pixel-art scenes only (the ride is drawn at full resolution), and not on a slow machine or with ?nofx. */
export const fxWanted = (mode: Mode, lowFx: boolean, search: string) => (mode === 'world' || mode === 'wide') && !lowFx && !new URLSearchParams(search).has('nofx');

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
uniform sampler2D uTex; uniform vec2 uPx; varying vec2 vUv;
vec3 tap(vec2 o){ return texture2D(uTex, vUv + o * uPx).rgb; }
void main(){
  vec3 base = tap(vec2(0.));
  vec3 glow = vec3(0.); float tot = 0.;
  for (int y = -3; y <= 3; y++) for (int x = -3; x <= 3; x++) {
    vec2 o = vec2(float(x), float(y)); float w = exp(-dot(o, o) / 6.);
    vec3 c = tap(o * 1.5); float l = dot(c, vec3(.299, .587, .114));
    glow += c * smoothstep(.82, 1., l) * w; tot += w;
  }
  vec3 col = base + glow / tot * 1.3;
  vec2 d = vUv - .5; col *= 1. - dot(d, d) * .7;
  col *= mix(vec3(1.), vec3(1.04, 1., .94), .5);
  gl_FragColor = vec4(col, 1.);
}`;

export class Fx {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private tex: WebGLTexture | null = null;
  private px: WebGLUniformLocation | null = null;
  active = false;

  constructor(private readonly source: HTMLCanvasElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.className = 'fx';
    this.canvas.style.display = 'none'; // shown from the first processed frame
    try { this.init(); } catch { this.gl = null; }
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.gl = null; this.show(false); });
  }

  private init() {
    const gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader'); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    this.px = gl.getUniformLocation(prog, 'uPx');
    this.gl = gl;
  }

  get ok() { return this.gl !== null; }

  private show(on: boolean) {
    if (this.active === on) return;
    this.active = on;
    this.canvas.style.display = on ? '' : 'none';
    this.source.style.visibility = on ? 'hidden' : ''; // the game keeps drawing while hidden; only the processed copy shows
  }

  /** Call once per frame after the scene has drawn. `on` false hands the screen back to the plain canvas. */
  render(on: boolean) {
    const gl = this.gl;
    if (!gl || !on) { this.show(false); return; }
    const { width: w, height: h } = this.source;
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(this.px, 1 / w, 1 / h);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.source);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.show(true);
  }
}
