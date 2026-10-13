import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION_PAUSE_EVENT, isMotionPaused } from "@/lib/motion-pause";
import { DESCENT } from "@/lib/motion-tokens";

/*
 * The descent, live: one scroll progress value p (0 to 1) drives a camera along a
 * CatmullRom curve through a galaxy (ESA/Hubble M51 over ESO's Milky Way), past the Sun
 * and down into the Earth's atmosphere, then dissolves into three photographs.
 *
 * Built only on the client, only after the first interaction (see DescentMotion).
 * Units are cinematic, not to scale. Assets live in /public/descent.
 */

const ASSETS = "/descent/";

/* ───────── Small helpers ───────── */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
const smooth = (x: number, a: number, b: number) => {
  const t = ramp(x, a, b);
  return t * t * (3 - 2 * t);
};
const bell = (x: number, a: number, peak: number, b: number) => (x < peak ? smooth(x, a, peak) : 1 - smooth(x, peak, b));
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* Shader chunks for the logarithmic depth buffer (the scene spans 0.01 to 20,000 units). */
const LOGV = "#include <common>\n#include <logdepthbuf_pars_vertex>\n";
const LOGF = "#include <logdepthbuf_pars_fragment>\n";
const QUAD_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const SURFACE_VS = `${LOGV} varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
    #include <logdepthbuf_vertex>
  }`;
const PLANE_VS = `${LOGV} varying vec2 vUv; varying vec3 vW;
  void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
    #include <logdepthbuf_vertex>
  }`;

/* ───────── The flight ───────── */
// Scroll progress at which the camera reaches each control point of the curve.
const CAM_KEYS = [0.0, 0.09, 0.19, 0.29, 0.37, 0.45, 0.515, 0.565, 0.615];
// Captions and rail: [start, end] of each scene in scroll progress.
const SCENES: [number, number][] = [
  [0.0, 0.17],
  [0.17, 0.355],
  [0.355, 0.6],
  [0.6, 0.78],
  [0.78, 0.885],
  [0.885, 1.001],
];
const SPACE_END = 0.64; // past this the photos cover the canvas and 3D rendering rests

const GALAXY = V(0, 0, 0);
const SUN = V(420, 0, 350);
const SUN_R = 30;
const EARTH = V(560, 0, 200);
const EARTH_R = 6;
const SUN_DIR = SUN.clone().sub(EARTH).normalize();
// We enter just on the day side of the terminator, so we arrive at dawn.
const TANGENT = V(SUN_DIR.z, 0, -SUN_DIR.x).multiplyScalar(-1).normalize();
const ENTRY_N = SUN_DIR.clone()
  .multiplyScalar(Math.cos(THREE.MathUtils.degToRad(78)))
  .add(TANGENT.clone().multiplyScalar(Math.sin(THREE.MathUtils.degToRad(78))))
  .add(V(0, 0.12, 0))
  .normalize();
const HORIZON = SUN_DIR.clone().sub(ENTRY_N.clone().multiplyScalar(SUN_DIR.dot(ENTRY_N))).normalize();
const onEarth = (r: number, ahead = 0) => EARTH.clone().add(ENTRY_N.clone().multiplyScalar(r)).add(HORIZON.clone().multiplyScalar(ahead));

function flightCurves() {
  const approach = V(28.6, 9.8, 57.5).normalize().lerp(ENTRY_N, 0.55).normalize();
  const cam = new THREE.CatmullRomCurve3(
    [
      V(0, 1100, 4800),
      V(120, 520, 2600),
      V(330, 150, 1150),
      V(395, 45, 600),
      V(500, 30, 430),
      V(588.6, 9.8, 257.5),
      EARTH.clone().add(approach.multiplyScalar(17)),
      onEarth(EARTH_R * 1.16, -0.4),
      onEarth(EARTH_R * 1.004, 0.9),
    ],
    false,
    "centripetal",
  );
  const look = new THREE.CatmullRomCurve3(
    [
      GALAXY.clone(),
      V(200, 0, 220),
      SUN.clone(),
      SUN.clone(),
      SUN.clone().lerp(EARTH, 0.65),
      EARTH.clone(),
      EARTH.clone().add(ENTRY_N.clone().multiplyScalar(2)),
      onEarth(EARTH_R, 2.2),
      onEarth(EARTH_R * 0.96, 4.5),
    ],
    false,
    "centripetal",
  );
  return { cam, look };
}

function curveT(p: number): number {
  if (p <= CAM_KEYS[0]) return 0;
  const n = CAM_KEYS.length - 1;
  for (let i = 0; i < n; i++) {
    if (p <= CAM_KEYS[i + 1]) return (i + (p - CAM_KEYS[i]) / (CAM_KEYS[i + 1] - CAM_KEYS[i])) / n;
  }
  return 1;
}

/* ───────── Live DOM (photos and vignette), built here so the server HTML stays light ───────── */
type PhotoKey = "nature" | "body" | "self";
type PhotoLayer = { el: HTMLDivElement; frame: HTMLDivElement; bloom: HTMLImageElement; soft: HTMLImageElement; imgs: HTMLImageElement[] };
const PHOTO_FRAMING: Record<PhotoKey, { position: string; origin: string }> = {
  nature: { position: "50% 70%", origin: "48% 72%" },
  body: { position: "56% 55%", origin: "56% 62%" },
  self: { position: "52% 50%", origin: "52% 46%" },
};

function buildLive(stage: HTMLElement) {
  const live = document.createElement("div");
  live.className = "descent-live";
  live.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  live.appendChild(canvas);

  const photos = {} as Record<PhotoKey, PhotoLayer>;
  for (const key of Object.keys(PHOTO_FRAMING) as PhotoKey[]) {
    const { position, origin } = PHOTO_FRAMING[key];
    const el = document.createElement("div");
    el.className = "descent-photo";
    const frame = document.createElement("div");
    frame.className = "descent-photo-frame";
    frame.style.transformOrigin = origin;
    const img = (src: string, cls = "", srcset = "") => {
      const i = document.createElement("img");
      i.alt = "";
      i.decoding = "async";
      i.src = src;
      if (srcset) {
        i.srcset = srcset;
        i.sizes = "100vw";
      }
      if (cls) i.className = cls;
      i.style.objectPosition = position;
      frame.appendChild(i);
      return i;
    };
    const main = img(`${ASSETS}${key}_2400.webp`, "", `${ASSETS}${key}_1280.webp 1280w, ${ASSETS}${key}_2400.webp 2400w`);
    const bloom = img(`${ASSETS}${key}_glow.webp`, "bloom");
    const soft = img(`${ASSETS}${key}_soft.webp`, "soft");
    el.appendChild(frame);
    live.appendChild(el);
    photos[key] = { el, frame, bloom, soft, imgs: [main, bloom, soft] };
  }

  const vignette = document.createElement("div");
  vignette.className = "descent-vignette";
  live.appendChild(vignette);
  stage.prepend(live);
  return { live, canvas, photos };
}

/* ════════════════════════════════════════════════════════════════════════ */

export function startDescent3D(section: HTMLElement): () => void {
  const stage = section.querySelector<HTMLElement>(".descent-stage");
  const track = section.querySelector<HTMLElement>(".descent-track");
  if (!stage || !track) return () => {};

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  section.classList.add("is-live");

  const isMobile = matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const lowPower = isMobile || (navigator.hardwareConcurrency || 8) <= 4;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  const TEX = lowPower ? "2k" : "4k";
  const STAR_COUNT = lowPower ? 5000 : 14000;

  const { live, canvas, photos } = buildLive(stage);
  const captions = [...section.querySelectorAll<HTMLElement>(".descent-caption")];
  const steps = [...section.querySelectorAll<HTMLElement>("[data-rail-step]")];

  /* ───────── Renderer and post targets ───────── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, logarithmicDepthBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.001, 30000);

  const halfFloat = !!renderer.extensions.get("EXT_color_buffer_float") || !!renderer.extensions.get("EXT_color_buffer_half_float");
  const type = halfFloat ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const rtScene = new THREE.WebGLRenderTarget(1, 1, { type, samples: lowPower ? 0 : 4, depthBuffer: true });
  const makeRT = () => new THREE.WebGLRenderTarget(1, 1, { type, depthBuffer: false });
  const rtBright = makeRT();
  const rtHalfA = makeRT();
  const rtHalfB = makeRT();
  const rtQuarterA = makeRT();
  const rtQuarterB = makeRT();
  const targets = [rtScene, rtBright, rtHalfA, rtHalfB, rtQuarterA, rtQuarterB];

  /* ───────── Textures ───────── */
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const textures: THREE.Texture[] = [];
  const tex = (name: string, srgb = true) =>
    new Promise<THREE.Texture | null>((resolve) => {
      loader.load(
        ASSETS + name,
        (t) => {
          t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          t.anisotropy = Math.min(8, maxAniso);
          textures.push(t);
          resolve(t);
        },
        undefined,
        () => resolve(null),
      );
    });

  /* ───────── Sky: the Milky Way panorama, travelling with the camera ───────── */
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, color: new THREE.Color(0.55, 0.55, 0.6), visible: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 64, 32), skyMat);
  sky.rotation.set(0.35, 0, 0.62);
  sky.renderOrder = -10;
  scene.add(sky);

  /* ───────── Starfield: thousands of points along the flight, at every depth ───────── */
  const { cam: camCurve, look: lookCurve } = flightCurves();
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixel: { value: DPR }, uFade: { value: 1 } },
    vertexShader: `${LOGV}
      attribute vec3 aColor; attribute float aSize; attribute float aPhase;
      uniform float uTime; uniform float uPixel; varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = aSize * uPixel * 220.0 / max(-mv.z, 0.001);
        vColor = aColor * (0.82 + 0.18 * sin(uTime * 1.7 + aPhase)) * clamp(s, 0.15, 1.0);
        gl_PointSize = clamp(s, 1.0, 7.0 * uPixel);
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `${LOGF}
      uniform float uFade; varying vec3 vColor;
      void main() {
        #include <logdepthbuf_fragment>
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vColor * a * a * uFade, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const size = new Float32Array(STAR_COUNT);
    const phase = new Float32Array(STAR_COUNT);
    const palette = [
      [0.62, 0.72, 1.0],
      [0.8, 0.86, 1.0],
      [1.0, 0.98, 0.95],
      [1.0, 0.9, 0.72],
      [1.0, 0.76, 0.52],
    ];
    const tmp = new THREE.Vector3();
    let i = 0;
    while (i < STAR_COUNT) {
      if (i < STAR_COUNT * 0.75) {
        const t = Math.pow(Math.random(), 0.8) * 0.72;
        const spread = THREE.MathUtils.lerp(2600, 260, Math.min(1, t / 0.55));
        tmp.randomDirection().multiplyScalar(spread * Math.cbrt(Math.random())).add(camCurve.getPoint(t));
      } else {
        tmp.randomDirection().multiplyScalar(5000 + Math.random() * 7000);
      }
      if (tmp.distanceTo(SUN) < SUN_R * 2.5 || tmp.distanceTo(EARTH) < 40) continue;
      pos.set([tmp.x, tmp.y, tmp.z], i * 3);
      const c = palette[Math.floor(Math.pow(Math.random(), 1.4) * palette.length)];
      const b = 0.6 + Math.pow(Math.random(), 6) * 2.4;
      col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
      size[i] = 0.6 + Math.pow(Math.random(), 3) * 2.2;
      phase[i] = Math.random() * 6.283;
      i++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    const stars = new THREE.Points(geo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);
  }

  /* ───────── Galaxy: ESA/Hubble M51, a vast plane we fall toward ───────── */
  const galaxyMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uOpacity: { value: 0 } },
    vertexShader: `${LOGV} varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      #include <logdepthbuf_vertex>
    }`,
    fragmentShader: `${LOGF} uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv;
      void main(){
        #include <logdepthbuf_fragment>
        vec2 e = min(vUv, 1.0 - vUv);
        float edge = smoothstep(0.0, 0.12, e.x) * smoothstep(0.0, 0.12, e.y);
        gl_FragColor = vec4(texture2D(uMap, vUv).rgb * 1.25 * edge * uOpacity, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    visible: false,
  });
  const galaxy = new THREE.Mesh(new THREE.PlaneGeometry(3600, 2500), galaxyMat);
  galaxy.position.set((0.5 - 0.39) * 3600, (0.5 - 0.46) * 2500, -60); // the core at the origin
  galaxy.rotation.set(-0.42, 0.05, 0.2);
  galaxy.renderOrder = -5;
  scene.add(galaxy);

  /* ───────── The Sun: churning surface, limb darkening, corona ───────── */
  const sunMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uIntensity: { value: 1 } },
    vertexShader: SURFACE_VS,
    fragmentShader: `${LOGF} uniform sampler2D uMap; uniform float uTime; uniform vec3 uCam; uniform float uIntensity;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        #include <logdepthbuf_fragment>
        vec3 a = texture2D(uMap, vUv + vec2(uTime * 0.002, 0.0)).rgb;
        vec3 b = texture2D(uMap, vec2(vUv.x * 2.0 - uTime * 0.0013, vUv.y)).rgb;
        float mu = max(dot(normalize(vN), normalize(uCam - vW)), 0.0);
        vec3 col = mix(a, b, 0.35) * vec3(2.6, 1.7, 0.95) * (0.55 + 0.45 * pow(mu, 0.5)) * 1.5 * uIntensity;
        gl_FragColor = vec4(col, 1.0);
      }`,
    visible: false,
  });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 96, 48), sunMat);
  sun.position.copy(SUN);
  scene.add(sun);

  const coronaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: `${LOGV} varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      #include <logdepthbuf_vertex>
    }`,
    fragmentShader: `${LOGF} uniform float uTime; uniform float uIntensity; varying vec2 vUv;
      void main(){
        #include <logdepthbuf_fragment>
        vec2 p = (vUv - 0.5) * 2.0;
        float d = length(p) * 5.0;
        float ang = atan(p.y, p.x);
        float streak = 0.75 + 0.25 * sin(ang * 11.0 + uTime * 0.05) * sin(ang * 5.0 - uTime * 0.035 + 1.3);
        float glow = 1.0 / pow(max(d, 1.0), 3.0);
        glow *= mix(1.0, streak, smoothstep(1.0, 1.6, d));
        glow *= 1.0 - smoothstep(0.6, 1.0, length(p));
        vec3 c = mix(vec3(1.0, 0.62, 0.36), vec3(1.0, 0.86, 0.7), 1.0 / max(d, 1.0)) * glow * 0.8 * uIntensity;
        gl_FragColor = vec4(c, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    visible: false,
  });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(SUN_R * 10, SUN_R * 10), coronaMat);
  corona.position.copy(SUN);
  scene.add(corona);

  /* ───────── Earth: day, night lights, ocean glint, clouds, atmosphere ───────── */
  const earthGroup = new THREE.Group();
  earthGroup.position.copy(EARTH);
  earthGroup.rotation.z = THREE.MathUtils.degToRad(23.4);
  scene.add(earthGroup);

  const earthMat = new THREE.ShaderMaterial({
    uniforms: { uDay: { value: null }, uNight: { value: null }, uSun: { value: SUN_DIR }, uCam: { value: new THREE.Vector3() } },
    vertexShader: SURFACE_VS,
    fragmentShader: `${LOGF} uniform sampler2D uDay; uniform sampler2D uNight; uniform vec3 uSun; uniform vec3 uCam;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        #include <logdepthbuf_fragment>
        vec3 N = normalize(vN); vec3 Vd = normalize(uCam - vW);
        float ndl = dot(N, uSun);
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        float dayMix = smoothstep(-0.10, 0.22, ndl);
        vec3 lit = day * (max(ndl, 0.0) * 1.9 + 0.015);
        float ocean = smoothstep(0.01, 0.08, day.b - max(day.r, day.g));
        float spec = pow(max(dot(N, normalize(uSun + Vd)), 0.0), 220.0) * ocean * step(0.0, ndl) * 0.5;
        vec3 lights = night * vec3(1.0, 0.72, 0.42) * 2.6 * (1.0 - smoothstep(-0.05, 0.12, ndl));
        vec3 col = lit * dayMix + lights + spec * vec3(1.0, 0.92, 0.78);
        float fres = pow(1.0 - max(dot(N, Vd), 0.0), 3.0);
        col += vec3(0.28, 0.52, 1.0) * fres * smoothstep(-0.25, 0.5, ndl) * 0.85;
        col += vec3(1.0, 0.42, 0.18) * fres * smoothstep(-0.25, 0.0, ndl) * smoothstep(0.3, 0.0, ndl) * 0.7;
        gl_FragColor = vec4(col, 1.0);
      }`,
    visible: false,
  });
  const seg = lowPower ? [96, 64] : [160, 100];
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, seg[0], seg[1]), earthMat);
  earthGroup.add(earth);

  const cloudsMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uSun: { value: SUN_DIR }, uCam: { value: new THREE.Vector3() } },
    vertexShader: SURFACE_VS,
    fragmentShader: `${LOGF} uniform sampler2D uMap; uniform vec3 uSun; uniform vec3 uCam; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        #include <logdepthbuf_fragment>
        float ndl = dot(normalize(vN), uSun);
        float light = smoothstep(-0.12, 0.35, ndl);
        vec3 warm = vec3(1.0, 0.62, 0.42) * smoothstep(-0.12, 0.05, ndl) * smoothstep(0.3, 0.05, ndl);
        gl_FragColor = vec4(vec3(0.02 + light * 1.25) + warm * 0.6, texture2D(uMap, vUv).r * 0.92);
      }`,
    transparent: true,
    depthWrite: false,
    visible: false,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, seg[0], seg[1]), cloudsMat);
  earthGroup.add(clouds);

  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN_DIR }, uCam: { value: new THREE.Vector3() }, uStrength: { value: 1 } },
    vertexShader: SURFACE_VS,
    fragmentShader: `${LOGF} uniform vec3 uSun; uniform vec3 uCam; uniform float uStrength; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        #include <logdepthbuf_fragment>
        vec3 N = normalize(vN); vec3 Vd = normalize(uCam - vW);
        float rim = smoothstep(0.0, 0.42, abs(dot(N, Vd)));
        rim *= rim;
        float ndl = dot(N, uSun);
        vec3 blue = vec3(0.3, 0.58, 1.0) * smoothstep(-0.35, 0.4, ndl);
        vec3 dusk = vec3(1.0, 0.45, 0.2) * smoothstep(-0.35, -0.05, ndl) * smoothstep(0.35, -0.05, ndl);
        gl_FragColor = vec4((blue + dusk) * rim * 1.6 * uStrength, 1.0);
      }`,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    visible: false,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.06, 96, 64), atmoMat);
  atmo.position.copy(EARTH);
  scene.add(atmo);

  /* ───────── Cloud deck: real cloud patches we fall through on entry ───────── */
  const deck = new THREE.Group();
  deck.visible = false;
  scene.add(deck);
  const deckMats: THREE.ShaderMaterial[] = [];
  {
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const side = new THREE.Vector3().crossVectors(ENTRY_N, HORIZON).normalize();
    for (let i = 0; i < (lowPower ? 14 : 24); i++) {
      const p = EARTH.clone()
        .add(ENTRY_N.clone().multiplyScalar(EARTH_R * rnd(1.012, 1.11)))
        .add(HORIZON.clone().multiplyScalar(rnd(-0.6, 1.4)))
        .add(side.clone().multiplyScalar(rnd(-0.9, 0.9)));
      const m = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: null }, uOff: { value: new THREE.Vector2(Math.random(), Math.random() * 0.5) }, uFade: { value: 0 }, uCam: { value: new THREE.Vector3() } },
        vertexShader: PLANE_VS,
        fragmentShader: `${LOGF} uniform sampler2D uMap; uniform vec2 uOff; uniform float uFade; uniform vec3 uCam; varying vec2 vUv; varying vec3 vW;
          void main(){
            #include <logdepthbuf_fragment>
            vec4 t = texture2D(uMap, uOff + vUv * vec2(0.45, 0.5));
            vec2 e = min(vUv, 1.0 - vUv);
            float edge = smoothstep(0.0, 0.3, e.x) * smoothstep(0.0, 0.3, e.y);
            float near = smoothstep(0.015, 0.22, distance(uCam, vW));
            gl_FragColor = vec4(mix(vec3(0.95, 0.72, 0.62), vec3(1.25, 1.12, 1.0), t.r), t.a * edge * near * uFade);
          }`,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      deckMats.push(m);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(rnd(0.9, 2.2), rnd(0.6, 1.4)), m);
      plane.position.copy(p);
      plane.lookAt(p.clone().add(ENTRY_N));
      plane.rotateZ(rnd(0, Math.PI));
      deck.add(plane);
    }
  }

  /* ───────── Post: bright pass, blur, bloom, lens flare, entry glow, tone map ───────── */
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  quadScene.add(quad);

  const brightMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uThreshold: { value: 1.35 } },
    vertexShader: QUAD_VS,
    fragmentShader: `uniform sampler2D tSrc; uniform float uThreshold; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tSrc, vUv).rgb;
        float l = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c * smoothstep(uThreshold, uThreshold * 1.8, l), 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: QUAD_VS,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
        c += texture2D(tSrc, vUv + uDir * 1.3846).rgb * 0.316216;
        c += texture2D(tSrc, vUv - uDir * 1.3846).rgb * 0.316216;
        c += texture2D(tSrc, vUv + uDir * 3.2308).rgb * 0.070270;
        c += texture2D(tSrc, vUv - uDir * 3.2308).rgb * 0.070270;
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const compositeMat = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: null },
      tBloomA: { value: null },
      tBloomB: { value: null },
      uBloom: { value: 0.55 },
      uFlare: { value: 0 },
      uSunPos: { value: new THREE.Vector2(0.5, 0.5) },
      uHeat: { value: 0 },
      uWhite: { value: 0 },
      uExposure: { value: 1 },
      uAspect: { value: 1 },
    },
    vertexShader: QUAD_VS,
    fragmentShader: `uniform sampler2D tScene; uniform sampler2D tBloomA; uniform sampler2D tBloomB;
      uniform float uBloom; uniform float uFlare; uniform vec2 uSunPos; uniform float uHeat; uniform float uWhite; uniform float uExposure; uniform float uAspect;
      varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      void main(){
        vec3 col = texture2D(tScene, vUv).rgb;
        col += (texture2D(tBloomA, vUv).rgb * 0.6 + texture2D(tBloomB, vUv).rgb * 0.9) * uBloom;

        // Lens flare: soft tinted ghosts on the line from the Sun through the lens centre, and a faint streak.
        vec2 asp = vec2(uAspect, 1.0);
        vec2 toC = vec2(0.5) - uSunPos;
        vec3 flare = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          float size = 0.018 + 0.03 * fract(fi * 0.618 + 0.2);
          float d = length((vUv - (uSunPos + toC * (0.45 + fi * 0.33))) * asp);
          flare += mix(vec3(0.35, 0.6, 1.0), vec3(1.0, 0.6, 0.3), fract(fi * 0.37)) * smoothstep(size, size * 0.35, d) * 0.16;
        }
        float apart = smoothstep(0.04, 0.22, length(toC * asp));
        flare *= apart;
        flare += vec3(0.5, 0.8, 1.0) * smoothstep(0.012, 0.0, abs(length((vUv - (uSunPos + toC * 1.9)) * asp) - 0.11)) * 0.12 * apart;
        vec2 sd = (vUv - uSunPos) * asp;
        flare += vec3(0.55, 0.7, 1.0) * exp(-abs(sd.y) * 220.0) * exp(-abs(sd.x) * 2.2) * 0.35;
        col += flare * uFlare;

        // Atmosphere entry: heat on the edges, then a soft white out we dissolve through.
        float edge = smoothstep(0.25, 0.9, length((vUv - 0.5) * asp));
        col += vec3(1.0, 0.45, 0.16) * edge * uHeat * 2.2 + vec3(1.0, 0.7, 0.45) * uHeat * 0.25;
        col = mix(col, vec3(1.6, 1.45, 1.3), uWhite);

        gl_FragColor = vec4(pow(aces(col * uExposure), vec3(1.0 / 2.2)), 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });

  const pass = (mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCam);
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pw = Math.round(w * DPR);
    const ph = Math.round(h * DPR);
    rtScene.setSize(pw, ph);
    const hw = Math.max(1, pw >> 1);
    const hh = Math.max(1, ph >> 1);
    rtBright.setSize(hw, hh);
    rtHalfA.setSize(hw, hh);
    rtHalfB.setSize(hw, hh);
    rtQuarterA.setSize(Math.max(1, hw >> 1), Math.max(1, hh >> 1));
    rtQuarterB.setSize(Math.max(1, hw >> 1), Math.max(1, hh >> 1));
    compositeMat.uniforms.uAspect.value = w / h;
  };
  window.addEventListener("resize", resize);
  resize();

  const renderFrame = () => {
    renderer.setRenderTarget(rtScene);
    renderer.render(scene, camera);
    brightMat.uniforms.tSrc.value = rtScene.texture;
    pass(brightMat, rtBright);
    blurMat.uniforms.tSrc.value = rtBright.texture;
    blurMat.uniforms.uDir.value.set(1 / rtHalfA.width, 0);
    pass(blurMat, rtHalfA);
    blurMat.uniforms.tSrc.value = rtHalfA.texture;
    blurMat.uniforms.uDir.value.set(0, 1 / rtHalfA.height);
    pass(blurMat, rtHalfB);
    blurMat.uniforms.tSrc.value = rtHalfB.texture;
    blurMat.uniforms.uDir.value.set(2 / rtQuarterA.width, 0);
    pass(blurMat, rtQuarterA);
    blurMat.uniforms.tSrc.value = rtQuarterA.texture;
    blurMat.uniforms.uDir.value.set(0, 2 / rtQuarterA.height);
    pass(blurMat, rtQuarterB);
    compositeMat.uniforms.tScene.value = rtScene.texture;
    compositeMat.uniforms.tBloomA.value = rtHalfB.texture;
    compositeMat.uniforms.tBloomB.value = rtQuarterB.texture;
    pass(compositeMat, null);
  };

  /* ───────── Per frame: the world ───────── */
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const sunNdc = new THREE.Vector3();
  const updateWorld = (p: number, time: number) => {
    const t = curveT(Math.min(p, CAM_KEYS[CAM_KEYS.length - 1]));
    camCurve.getPoint(t, camPos);
    lookCurve.getPoint(t, look);
    camPos.y += Math.sin(time * 0.25) * 0.0015 * camPos.distanceTo(look);
    camera.position.copy(camPos);
    // Roll gently so that, by the atmosphere, the ground is below and the horizon level.
    camera.up.set(0, 1, 0).lerp(ENTRY_N, smooth(p, 0.46, 0.55)).normalize();
    camera.lookAt(look);
    camera.fov = THREE.MathUtils.lerp(55, 68, smooth(p, 0.53, 0.615));
    camera.updateProjectionMatrix();

    sky.position.copy(camPos);
    starMat.uniforms.uTime.value = time;
    starMat.uniforms.uFade.value = 1 - smooth(p, 0.56, 0.6);

    galaxyMat.uniforms.uOpacity.value = 1 - smooth(p, 0.1, 0.2);
    galaxy.visible = galaxyMat.uniforms.uOpacity.value > 0.001;

    // From far away the Sun is one more star; it swells to full glare as we arrive.
    const sunGlow = THREE.MathUtils.lerp(0.18, 1, smooth(p, 0.1, 0.26));
    sunMat.uniforms.uTime.value = time;
    sunMat.uniforms.uCam.value.copy(camPos);
    sunMat.uniforms.uIntensity.value = sunGlow;
    coronaMat.uniforms.uTime.value = time;
    coronaMat.uniforms.uIntensity.value = sunGlow * sunGlow;
    corona.lookAt(camPos);
    sun.visible = corona.visible = p < 0.56;

    earthGroup.rotation.y = time * 0.006;
    clouds.rotation.y = time * 0.0035;
    earthMat.uniforms.uCam.value.copy(camPos);
    cloudsMat.uniforms.uCam.value.copy(camPos);
    atmoMat.uniforms.uCam.value.copy(camPos);
    atmoMat.uniforms.uStrength.value = 1 - smooth(p, 0.575, 0.61) * 0.6;

    const deckFade = bell(p, 0.555, 0.59, 0.625);
    deck.visible = deckFade > 0.001;
    for (const m of deckMats) {
      m.uniforms.uFade.value = deckFade;
      m.uniforms.uCam.value.copy(camPos);
    }

    sunNdc.copy(SUN).project(camera);
    const inFront = sunNdc.z < 1 && Math.abs(sunNdc.x) < 1.2 && Math.abs(sunNdc.y) < 1.2;
    compositeMat.uniforms.uSunPos.value.set(sunNdc.x * 0.5 + 0.5, sunNdc.y * 0.5 + 0.5);
    compositeMat.uniforms.uFlare.value = inFront ? (1 - Math.min(1, Math.hypot(sunNdc.x, sunNdc.y) * 0.6)) * smooth(p, 0.17, 0.26) * (1 - smooth(p, 0.38, 0.45)) : 0;
    compositeMat.uniforms.uHeat.value = bell(p, 0.55, 0.585, 0.615);
    compositeMat.uniforms.uWhite.value = bell(p, 0.585, 0.612, 0.64) * 0.6;
    compositeMat.uniforms.uExposure.value = 1 + smooth(p, 0.45, 0.52) * 0.15;
  };

  /* ───────── Per frame: photos (push in, blur peak by crossfade, then sharp) ───────── */
  const BASE = 1.08; // overscan so edges never show while scaling
  const setPhoto = (ph: PhotoLayer, opacity: number, scale: number, blur: number, glow = 0.55) => {
    ph.el.style.opacity = opacity.toFixed(3);
    ph.frame.style.transform = `scale(${(BASE * scale).toFixed(4)})`;
    ph.soft.style.opacity = Math.min(1, blur / 7).toFixed(3);
    ph.bloom.style.opacity = glow.toFixed(3);
  };
  const lerp = THREE.MathUtils.lerp;
  const updatePhotos = (p: number) => {
    const nIn = smooth(p, 0.595, 0.64);
    const nOut = smooth(p, 0.765, 0.8);
    const bIn = smooth(p, 0.765, 0.8);
    const bOut = smooth(p, 0.87, 0.905);
    const sIn = smooth(p, 0.87, 0.905);
    const peak1 = bell(p, 0.755, 0.782, 0.81) * 9;
    const peak2 = bell(p, 0.86, 0.887, 0.915) * 9;
    setPhoto(photos.nature, nIn * (1 - nOut), lerp(1, 1.1, ramp(p, 0.6, 0.765)) * (1 + smooth(p, 0.765, 0.81) * 0.35), peak1 + (1 - smooth(p, 0.6, 0.65)) * 3);
    setPhoto(
      photos.body,
      bIn * (1 - bOut),
      lerp(0.94, 1, smooth(p, 0.765, 0.81)) * lerp(1, 1.08, ramp(p, 0.81, 0.87)) * (1 + smooth(p, 0.87, 0.915) * 0.35),
      peak1 * (1 - smooth(p, 0.79, 0.81)) + peak2,
    );
    // The light at the chest grows as we arrive.
    setPhoto(photos.self, sIn, lerp(0.94, 1, smooth(p, 0.87, 0.915)) * lerp(1, 1.1, ramp(p, 0.915, 1)), peak2 * (1 - smooth(p, 0.895, 0.915)), 0.45 + smooth(p, 0.92, 1) * 0.45);
  };

  /* ───────── Per frame: captions and rail ───────── */
  let activeStep = 0;
  const updateText = (p: number) => {
    SCENES.forEach(([a, b], i) => {
      const caption = captions[i];
      if (!caption) return;
      const fin = i === 0 ? 1 : smooth(p, a + 0.008, a + 0.035);
      const fout = i === SCENES.length - 1 ? 0 : smooth(p, b - 0.03, b - 0.005);
      caption.style.opacity = (fin * (1 - fout)).toFixed(3);
      caption.style.transform = `translateY(${((1 - fin) * 30 - fout * 36).toFixed(1)}px)`;
    });
    const idx = SCENES.findIndex(([a, b]) => p >= a && p < b);
    if (idx !== -1 && idx !== activeStep) {
      activeStep = idx;
      steps.forEach((s, i) => {
        if (i === idx) s.dataset.active = "true";
        else delete s.dataset.active;
      });
    }
  };

  /* ───────── Scroll and the render loop ───────── */
  const state = { p: 0 };
  const tween = gsap.to(state, {
    p: 1,
    ease: "none",
    scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: DESCENT.scrub, invalidateOnRefresh: true },
  });
  ScrollTrigger.refresh();

  // "Pause motion" freezes the ambient drift (twinkle, the Sun's surface, the turning Earth).
  // The dive itself still follows the scroll, because that is the visitor moving.
  let paused = isMotionPaused();
  const onPause = () => {
    paused = isMotionPaused();
  };
  window.addEventListener(MOTION_PAUSE_EVENT, onPause);

  let visible = false;
  let running = false;
  let raf = 0;
  let ambient = 0;
  let last = performance.now();
  let disposed = false;

  const frame = (now: number) => {
    if (disposed || !visible || document.hidden) {
      running = false;
      return;
    }
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) ambient += dt;
    const p = state.p;
    updatePhotos(p);
    updateText(p);
    const space = p < SPACE_END;
    canvas.style.visibility = space ? "visible" : "hidden";
    if (space) {
      updateWorld(p, ambient);
      renderFrame();
    }
    raf = requestAnimationFrame(frame);
  };
  const loop = () => {
    if (running || disposed) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    },
    { rootMargin: "200px 0px" },
  );
  io.observe(section);
  const onVisibility = () => {
    if (!document.hidden) loop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  /* ───────── Load: space first, then Earth; then warm everything up off screen ───────── */
  void (async () => {
    const [skyT, galT, sunT] = await Promise.all([tex(`sky_milkyway_${TEX}.webp`), tex(`galaxy_m51_${lowPower ? "1k" : "2k"}.webp`), tex(`sun_${lowPower ? "1k" : "2k"}.webp`)]);
    if (disposed) return;
    if (skyT) {
      skyMat.map = skyT;
      skyMat.visible = true;
      skyMat.needsUpdate = true;
    }
    if (galT) {
      galaxyMat.uniforms.uMap.value = galT;
      galaxyMat.visible = true;
    }
    if (sunT) {
      sunT.wrapS = sunT.wrapT = THREE.RepeatWrapping;
      sunMat.uniforms.uMap.value = sunT;
      sunMat.visible = coronaMat.visible = true;
    }
    section.classList.add("is-ready");

    const [dayT, nightT, cloudT, deckT] = await Promise.all([
      tex(`earth_day_${TEX}.webp`),
      tex(`earth_night_${TEX}.webp`),
      tex(`earth_clouds_${TEX}.webp`, false),
      tex("cloud_deck.webp", false),
    ]);
    if (disposed) return;
    if (dayT && nightT) {
      earthMat.uniforms.uDay.value = dayT;
      earthMat.uniforms.uNight.value = nightT;
      earthMat.visible = atmoMat.visible = true;
    }
    if (cloudT) {
      cloudsMat.uniforms.uMap.value = cloudT;
      cloudsMat.visible = true;
    }
    if (deckT) {
      deckT.wrapS = deckT.wrapT = THREE.MirroredRepeatWrapping;
      for (const m of deckMats) m.uniforms.uMap.value = deckT;
    }

    // Upload textures and compile shaders now, so nothing stalls when a body first appears.
    for (const t of textures) renderer.initTexture(t);
    const objects = [galaxy, sun, corona, earth, clouds, atmo, deck];
    const keep = objects.map((o) => o.visible);
    for (const o of objects) o.visible = true;
    await renderer.compileAsync(scene, camera);
    if (disposed) return;
    for (const m of [brightMat, blurMat, compositeMat]) {
      quad.material = m;
      renderer.compile(quadScene, quadCam);
    }
    objects.forEach((o, i) => (o.visible = keep[i]));

    // Decode the photos and rasterise each layer once (at an invisible 0.2%), then one
    // style pass: measured to remove the one frame hitch at the first dissolve.
    const imgs = Object.values(photos).flatMap((ph) => ph.imgs);
    await Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
    if (disposed) return;
    const layers = Object.values(photos).map((ph) => ph.el);
    layers.forEach((el) => (el.style.opacity = "0.002"));
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    if (disposed) return;
    if (!running) layers.forEach((el) => (el.style.opacity = "0"));
    void getComputedStyle(section).opacity;
    if (!running) {
      updateWorld(state.p, ambient);
      renderFrame();
    }
    section.dataset.descentLoaded = "all";
  })();

  /* ───────── Cleanup: restore the static version and free the GPU ───────── */
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", resize);
    window.removeEventListener(MOTION_PAUSE_EVENT, onPause);
    tween.scrollTrigger?.kill();
    tween.kill();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        o.geometry.dispose();
        const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
    quad.geometry.dispose();
    [brightMat, blurMat, compositeMat].forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    targets.forEach((t) => t.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    live.remove();
    captions.forEach((c) => {
      c.style.opacity = "";
      c.style.transform = "";
    });
    steps.forEach((s, i) => {
      if (i === 0) s.dataset.active = "true";
      else delete s.dataset.active;
    });
    section.classList.remove("is-live", "is-ready");
    delete section.dataset.descentLoaded;
    ScrollTrigger.refresh();
  };
}
