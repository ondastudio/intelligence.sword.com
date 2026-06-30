/**
 * Animated swirl background — a Three.js post-processing effect ported from
 * https://github.com/davelange/swirl and recolored to the brand purple palette
 * so it reads as an animated version of the static hero mesh gradient.
 *
 * A fullscreen fragment shader warps radial UVs with layered cosines over time
 * (the drifting swirl), plus grain. Stripped of the original's dev tooling
 * (lil-gui, Stats, OrbitControls) and mouse-driven ripple interaction, and
 * scoped to a container element rather than the whole window.
 */
import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  ShaderPass,
} from "three/examples/jsm/Addons.js";

const SwirlPass = {
  name: "Swirl",

  uniforms: {
    scale: { value: 0.9 },
    smoothStepStart: { value: 0.44 },
    smoothStepEnd: { value: 1.0 },
    time: { value: 0.0 },
    delay: { value: 0.0 },
    firstStageProgress: { value: 0.0 },
    secondStageProgress: { value: 0.0 },
    grainTexture: { value: null as THREE.Texture | null },
    showWaves: { value: false },
    showGrain: { value: false },
    // Aspect of the render area (width / height). When set, the radial field is
    // corrected so the swirl reads as circular in screen space rather than
    // stretched across a wide canvas. Defaults to 1 (no correction → original
    // hero look).
    aspect: { value: 1.0 },
    // Distortion intensity of the cosine warp. 1 = original hero swirl; lower
    // values keep a more cohesive, rounder blob with a filled centre.
    warp: { value: 1.0 },
    // Animation speed multiplier (1 = original hero drift).
    timeScale: { value: 1.0 },
    // Palette (defaults = brand purple, see notes below). Overridable per
    // instance via initSwirl's `colors` option so other sections can recolor
    // the same animation (e.g. the operations lavender + lime bloom).
    bgColor: { value: new THREE.Vector4(0.965, 0.957, 1.0, 1.0) },
    soft: { value: new THREE.Vector4(0.882, 0.839, 1.0, 1.0) },
    body: { value: new THREE.Vector4(0.467, 0.0, 0.933, 1.0) },
    lavender: { value: new THREE.Vector4(0.882, 0.839, 1.0, 1.0) },
    crest: { value: new THREE.Vector4(0.95, 0.95, 0.95, 1.0) },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,

  fragmentShader: /* glsl */ `
    uniform float scale;
    uniform float delay;
    uniform float time;
    uniform float smoothStepStart;
    uniform float smoothStepEnd;
    uniform float firstStageProgress;
    uniform float secondStageProgress;
    uniform bool showGrain;
    uniform bool showWaves;

    uniform sampler2D grainTexture;

    varying vec2 vUv;

    // Palette (set from JS uniforms; defaults are the brand purple wash):
    //   bgColor  ~ near-white wash (outer field)
    //   soft     ~ inner highlight
    //   body     ~ dominant swirl body (the accent)
    //   lavender ~ secondary highlight
    //   crest    ~ gradient crest (near white)
    uniform vec4 bgColor;
    uniform vec4 soft;
    uniform vec4 body;
    uniform vec4 lavender;
    uniform vec4 crest;
    uniform float aspect;
    uniform float warp;
    uniform float timeScale;

    void main() {
      vec2 p = 2. * vUv - vec2(1.);
      // Stretch the longer screen axis in field space so equal screen distances
      // map to equal radial distances — keeps the swirl circular on a wide canvas.
      if (aspect >= 1.0) p.x *= aspect; else p.y /= aspect;
      float timeSlow = time * 0.05 * timeScale;

      // Waves — layered cosine warp gives the slow swirling drift. The warp
      // uniform scales the distortion: lower keeps a cohesive, rounder blob.
      float modScale = mix(scale, scale - 0.5, firstStageProgress);
      modScale = mix(modScale, modScale - 0.5, secondStageProgress);

      p += warp * 0.17 * cos(modScale * 3.7 * p.yx + 1.23 * timeSlow + delay * vec2(2.2,3.4));
      p += warp * 0.31 * cos(modScale * 2.3 * p.yx + 5.5 * timeSlow + delay * vec2(3.2,1.3));
      p += warp * 0.31 * cos(modScale * 4.3 * p.yx + 7.5 * timeSlow + delay * vec2(1.2,1.3));

      // Grain — kept subtle so it doesn't dither the swirl's soft edges
      vec2 grainUv = vUv * vec2(25., 25.);
      float grain = texture( grainTexture, grainUv ).r;
      grain *= smoothstep(0.3, 0.9, grain) * 0.03;

      // Interpolate colors by radial distance
      vec4 inner = mix(soft, crest, firstStageProgress);
      vec4 intermediate = mix(body, crest, firstStageProgress);
      vec4 outer = mix(bgColor, lavender, firstStageProgress);
      outer = mix(outer, lavender, secondStageProgress);

      float innerDist = smoothstep(-0.4, 0.81, length(p) - grain);
      vec4 color = mix(inner, intermediate, innerDist);

      float dist = smoothstep(smoothStepStart, smoothStepEnd, length(p) + grain);
      color = mix(color, outer, dist);

      if (showWaves) {
        gl_FragColor = vec4(length(p), 0.1, 0., 1.);
      } else if (showGrain) {
        gl_FragColor = texture( grainTexture, grainUv );
      } else {
        gl_FragColor = color;
      }
    }`,
};

function loadTexture(loader: THREE.TextureLoader, path: string) {
  const texture = loader.load(path);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export interface SwirlHandle {
  destroy: () => void;
}

/**
 * Mount the swirl effect onto `canvas`, sizing it to `container`.
 * Returns a handle whose `destroy()` tears everything down.
 */
/** A palette colour as [r, g, b] floats in 0..1 (alpha is assumed 1). */
export type SwirlColor = [number, number, number];

export interface SwirlColors {
  bgColor?: SwirlColor; // outer field (near-white wash)
  soft?: SwirlColor; // inner highlight
  body?: SwirlColor; // dominant swirl body (the accent)
  lavender?: SwirlColor; // secondary highlight
  crest?: SwirlColor; // gradient crest (near white)
}

export function initSwirl(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  options: {
    grainUrl: string;
    colors?: SwirlColors;
    circular?: boolean;
    warp?: number; // cosine-warp intensity (default 1 = hero); lower = rounder blob
    falloffStart?: number; // radial distance where the body starts fading to the outer wash
    falloffEnd?: number; // radial distance where it's fully the outer wash
    speed?: number; // animation speed multiplier (default 1 = hero drift)
  },
): SwirlHandle {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();

  const makeCamera = () => {
    const aspect = width / height;
    const cam = new THREE.OrthographicCamera(
      (height * aspect) / -2,
      (height * aspect) / 2,
      height / 2,
      height / -2,
      -1000,
      1000,
    );
    cam.position.set(0, 0, 2);
    return cam;
  };
  let camera = makeCamera();

  const loader = new THREE.TextureLoader();

  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));

  const shaderPass = new ShaderPass(SwirlPass);
  shaderPass.uniforms.grainTexture.value = loadTexture(loader, options.grainUrl);
  shaderPass.uniforms.delay.value = 2 + Math.floor(Math.random() * 3);
  if (options.colors) {
    for (const [key, rgb] of Object.entries(options.colors)) {
      const uniform = shaderPass.uniforms[key as keyof typeof shaderPass.uniforms];
      if (uniform && rgb) (uniform.value as THREE.Vector4).set(rgb[0], rgb[1], rgb[2], 1);
    }
  }
  if (options.warp !== undefined) shaderPass.uniforms.warp.value = options.warp;
  if (options.speed !== undefined) shaderPass.uniforms.timeScale.value = options.speed;
  if (options.falloffStart !== undefined)
    shaderPass.uniforms.smoothStepStart.value = options.falloffStart;
  if (options.falloffEnd !== undefined)
    shaderPass.uniforms.smoothStepEnd.value = options.falloffEnd;
  const updateAspect = () => {
    if (options.circular) shaderPass.uniforms.aspect.value = width / height;
  };
  updateAspect();
  composer.addPass(shaderPass);

  const clock = new THREE.Clock();

  const renderFrame = () => {
    shaderPass.uniforms.time.value = clock.getElapsedTime();
    composer.render();
  };

  let rafId = 0;
  let running = false;
  const loop = () => {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    clock.start();
    loop();
  };
  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    clock.stop();
  };

  const onResize = () => {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(width, height);

    const next = makeCamera();
    camera.copy(next);
    camera.updateProjectionMatrix();
    updateAspect();
  };

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  // Pause rendering while the hero is offscreen
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    },
    { threshold: 0 },
  );
  visibilityObserver.observe(container);

  if (reduceMotion) {
    // Render a single static frame instead of animating
    renderFrame();
  } else {
    start();
  }

  return {
    destroy() {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      composer.dispose();
      renderer.dispose();
    },
  };
}
