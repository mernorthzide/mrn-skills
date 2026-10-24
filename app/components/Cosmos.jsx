"use client";
// The MRN star system: the plugin is the star, each skill a planet, the next skill a planet still forming in the dust.
// Everything here is decoration (aria-hidden); every word and control lives in the DOM.
import { useEffect, useRef } from "react";
import { t } from "../../lib/i18n.mjs";

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<4;i++){f+=a*snoise(p);p*=2.03;a*=.5;}return f;}
`;

// Curated planet palettes (surface A, surface B, atmosphere): earthy and icy, never a rainbow.
const PALETTES = [
  ["#d39a62", "#5a2c18", "#ffcf9a"],
  ["#8fb4c4", "#22394a", "#bfe3ff"],
  ["#d9c9a3", "#7a5c3a", "#ffe9c4"],
  ["#7d9a74", "#26331f", "#cfe8c0"],
  ["#b7b2aa", "#3f3c38", "#e8e4dc"],
  ["#c97a5b", "#3b1a14", "#ffb89a"],
];

function rng(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const smooth = (t) => t * t * (3 - 2 * t);
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function Cosmos({ names, variant = "home", focus = null, lang }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const labels = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let gone = false;
    const off = () => root.current?.setAttribute("data-gl", "off");
    if (new URLSearchParams(location.search).has("nogl")) return off();
    Promise.all([
      import("three"),
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/ShaderPass.js"),
      import("three/addons/objects/Lensflare.js"),
    ])
      .then(([THREE, ...addons]) => {
        if (gone) return;
        try {
          const X = Object.assign({}, ...addons);
          cleanup = build(THREE, X, { root: root.current, canvas: canvas.current, labels: labels.current, names, variant, focus, lang });
        } catch (e) {
          console.warn("WebGL unavailable, showing the still sky instead.", e);
          off();
        }
      })
      .catch(off);
    return () => {
      gone = true;
      cleanup();
    };
  }, [names, variant, focus, lang]);

  return (
    <div ref={root} className={`cosmos cosmos--${variant}`} data-gl="pending" aria-hidden="true">
      <canvas ref={canvas} />
      <div ref={labels} className="cosmos-labels" />
    </div>
  );
}

function build(THREE, X, { root, canvas, labels, names, variant, focus, lang }) {
  const mobile = matchMedia("(max-width: 720px)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(0x05060a, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);
  const uTime = { value: 0 };
  const uIgnite = { value: reduce ? 1 : 0 };
  const disposables = [];
  const track = (...xs) => (disposables.push(...xs), xs[0]);
  const band = new THREE.Euler(0.45, 0, 0.62);

  // Sky: a galactic band of stars plus faint dust, so the far field has structure instead of uniform noise.
  {
    const N = mobile ? 3200 : 8000;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), phase = new Float32Array(N);
    const r = rng("sky");
    const temps = [[0.62, 0.71, 1], [0.8, 0.85, 1], [1, 1, 1], [1, 0.96, 0.9], [1, 0.84, 0.64], [1, 0.75, 0.45]];
    const v = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const inBand = r() < 0.5;
      const th = r() * Math.PI * 2;
      const y = inBand ? (r() + r() + r() - 1.5) * 0.16 : r() * 2 - 1;
      const s = Math.sqrt(1 - Math.min(y * y, 1));
      v.set(Math.cos(th) * s, y, Math.sin(th) * s).applyEuler(band).multiplyScalar(900 + r() * 900);
      pos.set([v.x, v.y, v.z], i * 3);
      const t = temps[Math.min(5, Math.floor(Math.pow(r(), 0.7) * 6))];
      col.set(t, i * 3);
      size[i] = 0.7 + Math.pow(r(), 9) * 4.2;
      phase[i] = r() * 6.28;
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    const m = track(
      new THREE.ShaderMaterial({
        uniforms: { uTime, uIgnite, uDpr: { value: renderer.getPixelRatio() } },
        vertexShader: `attribute float aSize; attribute float aPhase; uniform float uTime, uDpr; varying vec3 vC; varying float vTw;
          void main(){ vC = color; vTw = .72 + .28*sin(uTime*(.6+fract(aPhase)*1.8) + aPhase);
            gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize = aSize*uDpr*1.6; }`,
        fragmentShader: `uniform float uIgnite; varying vec3 vC; varying float vTw;
          void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5, .0, d); a *= a;
            gl_FragColor = vec4(vC*a*vTw*(.25+.75*uIgnite), 1.); }`,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(new THREE.Points(g, m));

    const D = mobile ? 260 : 620;
    const dpos = new Float32Array(D * 3), dcol = new Float32Array(D * 3), dsize = new Float32Array(D);
    const dust = [[0.55, 0.32, 0.2], [0.25, 0.36, 0.42], [0.62, 0.52, 0.4]];
    for (let i = 0; i < D; i++) {
      const th = r() * Math.PI * 2;
      const y = (r() + r() - 1) * 0.09;
      v.set(Math.cos(th), y, Math.sin(th)).normalize().applyEuler(band).multiplyScalar(1500);
      dpos.set([v.x, v.y, v.z], i * 3);
      dcol.set(dust[Math.floor(r() * 3)], i * 3);
      dsize[i] = 60 + r() * 160;
    }
    const dg = track(new THREE.BufferGeometry());
    dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    dg.setAttribute("color", new THREE.BufferAttribute(dcol, 3));
    dg.setAttribute("aSize", new THREE.BufferAttribute(dsize, 1));
    const dm = track(
      new THREE.ShaderMaterial({
        uniforms: { uIgnite, uDpr: { value: renderer.getPixelRatio() } },
        vertexShader: `attribute float aSize; uniform float uDpr; varying vec3 vC;
          void main(){ vC = color; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize = aSize*uDpr; }`,
        fragmentShader: `uniform float uIgnite; varying vec3 vC;
          void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d); gl_FragColor = vec4(vC*a*a*.05*uIgnite,1.); }`,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(new THREE.Points(dg, dm));
  }

  // Nebula: a domain-warped fbm sky concentrated on the galactic band, with dark dust lanes cutting through it.
  const sky = new THREE.Mesh(
    track(new THREE.SphereGeometry(2400, 64, 32)),
    track(
      new THREE.ShaderMaterial({
        uniforms: { uIgnite, uBand: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(band).invert()) } },
        vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
        fragmentShader: `${NOISE} uniform float uIgnite; uniform mat3 uBand; varying vec3 vD;
          void main(){ vec3 d = normalize(vD); vec3 b = uBand*d;
            float q = fbm(d*1.8);
            float w = fbm(d*2.6 + vec3(q*1.7, q*1.1, -q));
            float lat = b.y + q*.12;
            float dens = smoothstep(-.25, .85, w) * exp(-lat*lat*7.);
            float lanes = smoothstep(.05, .6, fbm(d*6.5 + w*1.4));
            vec3 teal = vec3(.05,.2,.26), rust = vec3(.42,.15,.07), rose = vec3(.36,.09,.2), core = vec3(1.,.82,.6);
            vec3 c = mix(teal, rust, smoothstep(-.35, .55, q));
            c = mix(c, rose, smoothstep(.3, .85, w)*.55);
            c *= dens*(1. - lanes*.75)*.62;
            c += core*pow(max(dens, 0.), 5.)*.12*(1. - lanes);
            gl_FragColor = vec4(c*uIgnite, 1.); }`,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    ),
  );
  sky.renderOrder = -2;
  scene.add(sky);

  // A spiral galaxy far beyond the system (the classic three.js galaxy generator, tuned for depth).
  const galaxy = new THREE.Group();
  {
    const N = mobile ? 14000 : 42000, arms = 4, Rg = 1;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const inner = new THREE.Color("#ffd29a"), outer = new THREE.Color("#5a86ff"), c = new THREE.Color();
    const r = rng("galaxy");
    for (let i = 0; i < N; i++) {
      const rad = Math.pow(r(), 1.6) * Rg;
      const ang = ((i % arms) / arms) * Math.PI * 2 + rad * 5.2;
      const jit = () => Math.pow(r(), 3) * (r() < 0.5 ? 1 : -1) * 0.22 * (0.25 + rad);
      pos.set([Math.cos(ang) * rad + jit(), jit() * 0.35, Math.sin(ang) * rad + jit()], i * 3);
      c.copy(inner).lerp(outer, Math.min(1, rad * 1.25));
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    galaxy.add(new THREE.Points(g, track(new THREE.PointsMaterial({ size: mobile ? 2.2 : 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }))));
    galaxy.scale.setScalar(260);
    galaxy.position.set(-620, 240, -1380);
    galaxy.rotation.set(1.05, 0.2, 0.35);
    scene.add(galaxy);
  }

  // The star: boiling surface with limb darkening, plus a corona that comes from the star itself.
  const R = 3;
  const star = new THREE.Mesh(
    track(new THREE.SphereGeometry(R, 96, 64)),
    track(
      new THREE.ShaderMaterial({
        uniforms: { uTime, uIgnite },
        vertexShader: `varying vec3 vN, vP, vV; void main(){ vN = normalize(normalMatrix*normal); vP = position;
          vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `${NOISE} uniform float uTime, uIgnite; varying vec3 vN, vP, vV;
          void main(){ float n = fbm(vP*.55 + vec3(0., uTime*.03, 0.)); float g = snoise(vP*2.6 - uTime*.06);
            float heat = .55 + .4*n + .12*g; float limb = pow(clamp(dot(vN, vV), 0., 1.), .5);
            vec3 c = mix(vec3(.8,.28,.05), vec3(1.,.66,.26), smoothstep(.25,.65,heat));
            c = mix(c, vec3(1.,.96,.86), smoothstep(.62,.95,heat));
            gl_FragColor = vec4(c*(.4+.62*limb)*(.15+.85*uIgnite), 1.); }`,
      }),
    ),
  );
  scene.add(star);
  const uPulse = { value: 0 };
  const corona = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1, 1)),
    track(
      new THREE.ShaderMaterial({
        uniforms: { uTime, uIgnite, uPulse },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `${NOISE} uniform float uTime, uIgnite, uPulse; varying vec2 vUv;
          void main(){ vec2 p = vUv*2.-1.; float d = length(p); float a = atan(p.y, p.x); float f = max(d-.1, 0.);
            float halo = exp(-f*16.)*1.05 + exp(-f*5.)*.2 + exp(-f*1.8)*.025;
            float ray = snoise(vec3(cos(a)*2.4, sin(a)*2.4, uTime*.05 + f*1.2))*.5+.5;
            float rays = pow(ray, 3.)*exp(-f*6.)*.7;
            float i = (halo + rays)*smoothstep(1., .55, d)*uIgnite*(.62 + uPulse*.6);
            vec3 c = mix(vec3(1.,.5,.16), vec3(1.,.94,.82), exp(-f*9.));
            gl_FragColor = vec4(c*i, 1.); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  corona.scale.setScalar(R * 2 * 10);
  scene.add(corona);
  {
    const tex = (stops) => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const g = c.getContext("2d"), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      stops.forEach(([o, col]) => gr.addColorStop(o, col));
      g.fillStyle = gr;
      g.fillRect(0, 0, 256, 256);
      return track(new THREE.CanvasTexture(c));
    };
    const glow = tex([[0, "rgba(255,240,215,1)"], [0.08, "rgba(255,200,130,.6)"], [0.3, "rgba(255,140,60,.12)"], [1, "rgba(0,0,0,0)"]]);
    const halo = tex([[0, "rgba(0,0,0,0)"], [0.62, "rgba(0,0,0,0)"], [0.7, "rgba(255,190,120,.22)"], [0.78, "rgba(120,200,255,.12)"], [1, "rgba(0,0,0,0)"]]);
    const dot = tex([[0, "rgba(255,220,170,.5)"], [1, "rgba(0,0,0,0)"]]);
    const flare = new X.Lensflare();
    flare.addElement(new X.LensflareElement(glow, mobile ? 380 : 620, 0, new THREE.Color(1, 0.92, 0.82)));
    flare.addElement(new X.LensflareElement(dot, 50, 0.45));
    flare.addElement(new X.LensflareElement(halo, 240, 0.62));
    flare.addElement(new X.LensflareElement(dot, 90, 0.85));
    flare.addElement(new X.LensflareElement(halo, 140, 1.05));
    star.add(flare);
    track(flare);
  }

  const K = mobile
    ? [
        [[4, 10, 58], [0, -11, 0]],
        [[-30, 12, 34], [0, -4, 0]],
        [[0, 46, 30], [0, -6, 0]],
        [[0, 6, 84], [0, 0, 0]],
      ]
    : [
        [[16, 9, 52], [-17, 2, 0]],
        [[-30, 12, 30], [-13, -15, -13]],
        [[0, 36, 28], [-17, 0, 0]],
        [[0, 5, 80], [-11, 1, 0]],
      ];
  // Planets: one per skill, ordered by when the skill was added; orbit lines draw themselves on ignition.
  const planetMat = (pal, r) =>
    track(
      new THREE.ShaderMaterial({
        uniforms: {
          uA: { value: new THREE.Color(pal[0]) },
          uB: { value: new THREE.Color(pal[1]) },
          uAtm: { value: new THREE.Color(pal[2]) },
          uSeed: { value: r() * 10 },
          uBands: { value: 2 + r() * 6 },
          uBandMix: { value: r() },
          uHi: { value: 0 },
          uTime,
        },
        vertexShader: `varying vec3 vN, vW, vO; void main(){ vO = position; vN = normalize(mat3(modelMatrix)*normal);
          vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: `${NOISE} uniform vec3 uA, uB, uAtm; uniform float uSeed, uBands, uBandMix, uHi, uTime; varying vec3 vN, vW, vO;
          void main(){ vec3 o = normalize(vO); float n = fbm(o*2.2 + uSeed);
            float bands = sin((o.y*uBands + n*1.6)*3.14159)*.5+.5;
            vec3 base = mix(uB, uA, mix(n*.5+.5, bands, uBandMix));
            vec3 L = normalize(-vW); vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN);
            float ndl = dot(N, L); vec3 c = base*(.015 + 1.15*max(ndl, 0.));
            float fr = pow(1. - max(dot(N, V), 0.), 2.6);
            c += uAtm*fr*smoothstep(-.35, .5, ndl)*(.9 + uHi*1.4);
            gl_FragColor = vec4(c, 1.); }`,
      }),
    );

  const orbitMat = () => track(new THREE.LineBasicMaterial({ color: 0xece9e0, transparent: true, opacity: 0.16, depthWrite: false }));
  const SEG = 256;
  const ring = (radius) => {
    const pts = [];
    for (let i = 0; i <= SEG; i++) pts.push(new THREE.Vector3(Math.cos((i / SEG) * Math.PI * 2) * radius, 0, Math.sin((i / SEG) * Math.PI * 2) * radius));
    return track(new THREE.BufferGeometry().setFromPoints(pts));
  };
  const labelEl = (html, cls = "") => {
    const el = document.createElement("div");
    el.className = `planet-label ${cls}`;
    el.innerHTML = html;
    labels.appendChild(el);
    return el;
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const [k0p, k0l] = K[0];
  const fwd = [k0l[0] - k0p[0], k0l[2] - k0p[2]];
  const openAngle = Math.atan2(fwd[0], -fwd[1]) * 0.55 + Math.atan2(-k0p[2], -k0p[0]) * 0.45;
  const planets = names.map((name, i) => {
    const r = rng(name);
    const radius = 10 + i * 4.6 + r() * 1.2;
    const pivot = new THREE.Object3D();
    pivot.rotation.set((r() - 0.5) * 0.22, r() * Math.PI, (r() - 0.5) * 0.12);
    scene.add(pivot);
    const size = 0.75 + r() * 0.55;
    const mesh = new THREE.Mesh(track(new THREE.SphereGeometry(size, 64, 48)), planetMat(PALETTES[i % PALETTES.length], r));
    pivot.add(mesh);
    const pal = PALETTES[i % PALETTES.length];
    const atmo = new THREE.Mesh(
      track(new THREE.SphereGeometry(size * 1.16, 48, 32)),
      track(
        new THREE.ShaderMaterial({
          uniforms: { uAtm: { value: new THREE.Color(pal[2]) } },
          vertexShader: `varying vec3 vN, vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
          fragmentShader: `uniform vec3 uAtm; varying vec3 vN, vW;
            void main(){ vec3 V = normalize(cameraPosition - vW); vec3 L = normalize(-vW);
              float rim = pow(clamp(1. - abs(dot(normalize(vN), V)), 0., 1.), 4.);
              float lit = smoothstep(-.4, .6, dot(normalize(vN), L));
              gl_FragColor = vec4(uAtm*rim*lit*1.6, 1.); }`,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    mesh.add(atmo);
    if (i % 2 === 1) {
      const ringMesh = new THREE.Mesh(
        track(new THREE.RingGeometry(size * 1.45, size * 2.5, 160, 1)),
        track(
          new THREE.ShaderMaterial({
            uniforms: { uIn: { value: size * 1.45 }, uOut: { value: size * 2.5 }, uC: { value: new THREE.Color(pal[0]) } },
            vertexShader: `varying vec3 vL, vW; void main(){ vL = position; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
            fragmentShader: `uniform float uIn, uOut; uniform vec3 uC; varying vec3 vL, vW;
              void main(){ float t = (length(vL.xy) - uIn)/(uOut - uIn);
                float bands = .55 + .45*sin(t*62.)*sin(t*17. + 1.3); float gap = smoothstep(.55, .6, t)*(1. - smoothstep(.62, .67, t));
                float a = bands*(1. - gap*.9)*smoothstep(0., .08, t)*(1. - smoothstep(.9, 1., t));
                gl_FragColor = vec4(uC*a*.8, a*.85); }`,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
          }),
        ),
      );
      ringMesh.rotation.x = -Math.PI / 2 + 0.42;
      mesh.add(ringMesh);
    }
    const orbit = new THREE.Line(ring(radius), orbitMat());
    orbit.geometry.setDrawRange(0, 0);
    pivot.add(orbit);
    return {
      name, radius, size, mesh, orbit, pivot,
      // Open beside the star on the side away from the copy, turned partly toward the far side so the lit face shows.
      phase: openAngle + 0.4 - i * 0.68 + pivot.rotation.y,
      speed: 0.3 / Math.pow(radius, 1.5),
      label: labelEl(`<span class="pl-name">${esc(name)}</span><span class="pl-cmd">/mrn:${esc(name)}</span>`),
    };
  });

  // The next skill, still forming: a dust disk with a clump, honest about "more is coming".
  const nextR = 10 + names.length * 4.6 + 3.5;
  const disk = new THREE.Object3D();
  disk.rotation.set(0.08, 0.4, -0.05);
  scene.add(disk);
  {
    const N = mobile ? 900 : 2400;
    const p = new Float32Array(N * 3);
    const r = rng("next");
    for (let i = 0; i < N; i++) {
      const clump = r() < 0.32;
      const a = clump ? (r() - 0.5) * 0.5 : r() * Math.PI * 2;
      const rr = nextR + (clump ? (r() - 0.5) * 0.9 : (r() + r() - 1) * 1.6);
      p.set([Math.cos(a) * rr, (r() - 0.5) * (clump ? 0.5 : 0.18), Math.sin(a) * rr], i * 3);
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    disk.add(new THREE.Points(g, track(new THREE.PointsMaterial({ color: 0xc9a27a, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }))));
    const o = new THREE.Line(ring(nextR), orbitMat());
    o.material.opacity = 0.07;
    disk.add(o);
  }
  const nextAnchor = new THREE.Object3D();
  nextAnchor.position.set(nextR, 0.8, 0);
  disk.add(nextAnchor);
  const nextLabel = variant === "home" ? labelEl(`<span class="pl-name">${t[lang].nextName}</span><span class="pl-cmd">${t[lang].nextState}</span>`, "is-next") : null;

  // Arrival: the page opens mid-warp, star streaks collapse to points as the camera drops into the system.
  const uWarp = { value: reduce || variant !== "home" ? 0 : 1 };
  {
    const N = mobile ? 500 : 1400;
    const start = new THREE.Vector3(...K[0][0]).multiplyScalar(5);
    const end = new THREE.Vector3(...K[0][0]);
    const dir = start.clone().sub(end).normalize();
    const pos = new Float32Array(N * 6), tip = new Float32Array(N * 2);
    const r = rng("warp");
    const base = new THREE.Vector3(), off = new THREE.Vector3();
    const u = new THREE.Vector3(0, 1, 0).cross(dir).normalize(), w2 = dir.clone().cross(u);
    for (let i = 0; i < N; i++) {
      base.copy(end).lerp(start, r() * 1.3 - 0.15);
      const a = r() * Math.PI * 2, rr = 14 + Math.pow(r(), 0.6) * 160;
      off.copy(u).multiplyScalar(Math.cos(a) * rr).addScaledVector(w2, Math.sin(a) * rr);
      base.add(off);
      pos.set([base.x, base.y, base.z, base.x, base.y, base.z], i * 6);
      tip.set([0, 1], i * 2);
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aTip", new THREE.BufferAttribute(tip, 1));
    const streaks = new THREE.LineSegments(
      g,
      track(
        new THREE.ShaderMaterial({
          uniforms: { uWarp, uDir: { value: dir } },
          vertexShader: `attribute float aTip; uniform float uWarp; uniform vec3 uDir; varying float vA;
            void main(){ vA = aTip; vec3 p = position + uDir*aTip*uWarp*uWarp*90.; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
          fragmentShader: `uniform float uWarp; varying float vA; void main(){ gl_FragColor = vec4(vec3(.75,.85,1.)*(1. - vA*.8)*uWarp*1.4, 1.); }`,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    streaks.frustumCulled = false;
    scene.add(streaks);
  }

  // Copy pulse: a ring of light leaves the star when the install prompt is copied.
  const shock = new THREE.Mesh(
    track(new THREE.RingGeometry(1, 1.035, 160)),
    track(new THREE.MeshBasicMaterial({ color: 0xf2b544, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })),
  );
  shock.rotation.x = -Math.PI / 2;
  scene.add(shock);
  let shockAt = -1;

  // Camera stages follow the page sections ([data-stage]); scroll stays native, the camera only listens.
  const stages = [...document.querySelectorAll("[data-stage]")];
  let tops = [];
  const measure = () => (tops = stages.map((el) => el.getBoundingClientRect().top + scrollY - innerHeight * 0.55));
  const stageAt = () => {
    if (tops.length < 2) return 0;
    for (let i = tops.length - 2; i >= 0; i--) if (scrollY >= tops[i]) return i + Math.min(1, (scrollY - tops[i]) / (tops[i + 1] - tops[i]));
    return 0;
  };
  const keyframe = (s) => {
    const i = Math.min(K.length - 2, Math.floor(s));
    const t = smooth(Math.min(1, s - i));
    const lerp = (a, b) => a.map((x, k) => x + (b[k] - x) * t);
    return [lerp(K[i][0], K[i + 1][0]), lerp(K[i][1], K[i + 1][1])];
  };
  const camPos = new THREE.Vector3(...K[0][0]).multiplyScalar(reduce ? 1 : 5);
  const camLook = new THREE.Vector3(...K[0][1]);
  const want = new THREE.Vector3(), wantLook = new THREE.Vector3(), tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const pointer = { x: 0, y: 0 };

  const setFocus = (name) => {
    for (const p of planets) {
      const on = p.name === name;
      p.orbit.material.color.set(on ? 0xf2b544 : 0xece9e0);
      p.orbit.material.opacity = on ? 0.75 : 0.16;
      p.mesh.material.uniforms.uHi.value = on ? 1 : 0;
      p.label.classList.toggle("is-on", on);
    }
  };
  setFocus(focus);

  // Post: bloom only where the scene emits light, then a little grain and vignette.
  const composer = new X.EffectComposer(renderer);
  composer.addPass(new X.RenderPass(scene, camera));
  const bloom = new X.UnrealBloomPass(new THREE.Vector2(256, 256), mobile ? 0.55 : 0.7, 0.6, 0.86);
  composer.addPass(bloom);
  const grain = new X.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        float n = fract(sin(dot(vUv*vec2(12.9898, 78.233) + fract(uTime)*7., vec2(1.)))*43758.5453);
        c.rgb += (n - .5)*.03;
        c.rgb *= mix(.7, 1., smoothstep(1.05, .3, length((vUv - .5)*vec2(1.15, 1.))));
        gl_FragColor = vec4(c.rgb, 1.); }`,
  });
  composer.addPass(grain);
  track(composer, bloom, grain);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    bloom.setSize(w / 2, h / 2);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measure();
    if (reduce) frame(performance.now());
  };

  const t0 = performance.now();
  let last = t0, raf = 0, visible = true;
  const planetPos = (p, out) => p.mesh.getWorldPosition(out);
  const place = (el, worldPos, dx = 0) => {
    tmp.copy(worldPos).project(camera);
    const show = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
    el.style.opacity = show ? "" : "0";
    if (show) el.style.transform = `translate(${((tmp.x + 1) / 2) * canvas.clientWidth + dx}px, ${((1 - tmp.y) / 2) * canvas.clientHeight}px)`;
  };

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    if (!reduce) {
      uTime.value = t;
      uIgnite.value = easeOutExpo(Math.min(1, t / 2.6));
      if (variant === "home") uWarp.value = 1 - easeOutExpo(Math.min(1, t / 2.4));
      galaxy.rotation.y = 0.2 + t * 0.004;
    }
    for (const p of planets) {
      p.mesh.position.set(Math.cos(p.phase + uTime.value * p.speed) * p.radius, 0, Math.sin(p.phase + uTime.value * p.speed) * p.radius);
      p.mesh.rotation.y = uTime.value * 0.15;
      p.orbit.geometry.setDrawRange(0, Math.ceil((SEG + 1) * uIgnite.value));
    }
    disk.rotation.y = 0.4 + uTime.value * 0.012;

    if (variant === "planet" && planets.length) {
      const p = planets.find((x) => x.name === focus) ?? planets[0];
      // Stand on the star's side of the planet, a little off-axis, so the face we see is lit.
      planetPos(p, wantLook);
      const out = wantLook.clone().normalize();
      const side = out.clone().cross(up).normalize();
      const d = p.size * (mobile ? 7.5 : 6.2);
      want.copy(wantLook).addScaledVector(out, -d * 0.55).addScaledVector(side, d * 0.8).addScaledVector(up, d * 0.22);
      const right = wantLook.clone().sub(want).normalize().cross(up).normalize();
      if (mobile) wantLook.addScaledVector(up, -p.size * 1.4);
      else wantLook.addScaledVector(right, -p.size * 2.1);
      camPos.copy(want);
      camLook.copy(wantLook);
    } else {
      const [kp, kl] = reduce ? K[0] : keyframe(stageAt());
      want.set(...kp);
      wantLook.set(kl[0] + pointer.x * 1.6, kl[1] - pointer.y * 1.1, kl[2]);
      const k = reduce ? 1 : 1 - Math.exp(-dt * (uWarp.value > 0.02 ? 3.2 : 2.4));
      camPos.lerp(want, k);
      camLook.lerp(wantLook, k);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    corona.quaternion.copy(camera.quaternion);
    sky.position.copy(camera.position);

    if (shockAt >= 0) {
      const s = (t - shockAt) / 2.2;
      if (s >= 1) {
        shockAt = -1;
        shock.material.opacity = 0;
        uPulse.value = 0;
      } else {
        const e = easeOutExpo(s);
        shock.scale.setScalar(R + e * 70);
        shock.material.opacity = (1 - s) * 0.9;
        uPulse.value = 1 - s;
      }
    }

    // Hide a planet's label while the star is in front of it.
    const starNdc = new THREE.Vector3().project(camera);
    const starR = R / (camera.position.length() * Math.tan((camera.fov * Math.PI) / 360));
    for (const p of planets) {
      const wp = planetPos(p, tmp.clone());
      place(p.label, wp, p.size * 14 + 8);
      const ndc = wp.clone().project(camera);
      const behind = wp.distanceTo(camera.position) > camera.position.length() && Math.hypot((ndc.x - starNdc.x) * camera.aspect, ndc.y - starNdc.y) < starR * 1.3;
      if (behind) p.label.style.opacity = "0";
    }
    if (nextLabel) place(nextLabel, nextAnchor.getWorldPosition(tmp.clone()), 12);
    composer.render();
  }

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (visible && !document.hidden) frame(now);
  };

  const onFocus = (e) => {
    setFocus(e.detail ?? focus);
    if (reduce) frame(performance.now()); // no loop runs under reduced motion
  };
  const onCopy = () => {
    if (!reduce) shockAt = (performance.now() - t0) / 1000;
  };
  const onPointer = (e) => {
    pointer.x = e.clientX / innerWidth - 0.5;
    pointer.y = e.clientY / innerHeight - 0.5;
  };
  const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
  io.observe(canvas);
  // Stage tops move when the page grows or shrinks without a window resize (search filter, <details>).
  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  addEventListener("resize", resize);
  addEventListener("mrn:focus", onFocus);
  addEventListener("mrn:copy", onCopy);
  if (!mobile && !reduce) addEventListener("pointermove", onPointer, { passive: true });

  resize();
  frame(performance.now());
  root.setAttribute("data-gl", "on");
  if (!reduce) raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    removeEventListener("resize", resize);
    removeEventListener("mrn:focus", onFocus);
    removeEventListener("mrn:copy", onCopy);
    removeEventListener("pointermove", onPointer);
    labels.replaceChildren();
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}
