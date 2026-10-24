/* ==========================================================================
   Scene engine. Reads everything from MAP; you should not need to edit this.
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const { esc, display } = CMAP;
const appEl = $('#app'), posterEl = $('#poster'), startBtn = $('#start');
const params = new URLSearchParams(location.search);
const deep = params.has('focus') || params.has('view');
const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = RMQ.matches;
let loading = null, api = null;

function showError() {
  const e = $('#poster-err');
  e.hidden = false;
  e.textContent = "The interactive map couldn't load in this browser. The full list of what we cover is on this page.";
  $('#start-label').textContent = 'Unavailable';
  startBtn.disabled = true;
}

function load() {
  if (!loading) loading = Promise.all([
    import('three'),
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/renderers/CSS2DRenderer.js'),
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js')
  ]).then(([T, oc, c2, ec, rp, ub, op]) => (api = createApp({
    T, OrbitControls: oc.OrbitControls, CSS2DRenderer: c2.CSS2DRenderer, CSS2DObject: c2.CSS2DObject,
    EffectComposer: ec.EffectComposer, RenderPass: rp.RenderPass, UnrealBloomPass: ub.UnrealBloomPass, OutputPass: op.OutputPass
  }))).then(a => (window.CMAP_API = a)).catch(err => { console.error(err); showError(); throw err; });
  return loading;
}

async function start(engaged, viaKeyboard) {
  $('#start-label').textContent = 'Loading…';
  startBtn.setAttribute('aria-busy', 'true');
  try {
    const a = await load();
    a.start(engaged);
    posterEl.classList.add('gone');
    setTimeout(() => { posterEl.style.display = 'none'; }, 650);
    if (viaKeyboard) a.focusMenu();
  } catch (_) { /* error already shown on the poster */ }
}

startBtn.addEventListener('click', e => start(true, e.detail === 0));
if (!params.has('inventory')) {
  /* Lazy load: fetch Three.js only once the embed scrolls into view (or on click). */
  new IntersectionObserver((es, io) => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    if (deep) start(false); else load().catch(() => {});
  }, { threshold: 0.2 }).observe(appEl);
}
addEventListener('keydown', e => {
  if (api) return api.key(e);
  if (posterEl.style.display === 'none' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^[0-8dDcC]$/.test(e.key) && !(e.target.closest && e.target.closest('textarea,input'))) start(true).then(() => api && api.key(e));
});

/* ========================================================================== */
function createApp(L) {
  const T = L.T, V3 = T.Vector3;
  const css = getComputedStyle(document.documentElement);
  const tok = n => new T.Color(css.getPropertyValue('--cmit-' + n).trim());
  const C = {};
  for (const n of ['blue', 'navy', 'red', 'orange', 'green', 'slate', 'mist', 'paper', 'bright-blue', 'purple']) C[n] = tok(n);
  const BB = C['bright-blue'];
  const hdr = (c, k) => c.clone().multiplyScalar(k);
  const deg = d => d * Math.PI / 180;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isPhone = () => innerWidth < 640;
  const LINE_K = 2.4;
  const ARROW = '<svg class="arrow" viewBox="0 0 20 45" aria-hidden="true"><polygon points="0,0 20,22.5 0,45" style="fill:var(--cmit-red)"/></svg>';
  const CHEV = '<svg class="chev" viewBox="0 0 20 45" aria-hidden="true"><polygon points="0,0 20,22.5 0,45" fill="currentColor"/></svg>';
  const SV = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
    office: `<svg ${SV}><path d="M4 21V5l8-3 8 3v16"/><path d="M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2"/></svg>`,
    cloud: `<svg ${SV}><path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.3 1.5A3.3 3.3 0 0 0 7 18z"/></svg>`,
    team: `<svg ${SV}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.4 5 2.8 5 5.8"/></svg>`,
    pause: `<svg ${SV}><path d="M9 5v14M15 5v14"/></svg>`,
    play: `<svg ${SV}><path d="M7 4l13 8-13 8z"/></svg>`,
    shield: `<svg ${SV}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`
  };

  /* ---------- renderer / scene ---------- */
  const stage = $('#stage');
  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { showError(); throw e; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NoToneMapping;
  stage.appendChild(renderer.domElement);
  const labelR = new L.CSS2DRenderer();
  labelR.domElement.className = 'labels';
  stage.appendChild(labelR.domElement);

  const scene = new T.Scene();
  scene.background = C.navy.clone();
  scene.fog = new T.Fog(C.navy.clone(), 70, 160);
  const camera = new T.PerspectiveCamera(35, 1, 0.3, 500);
  const controls = new L.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = deg(84); controls.minDistance = 2.5; controls.maxDistance = 140;
  controls.zoomSpeed = 0.8;
  controls.autoRotateSpeed = MAP.render.autoRotateSpeed;

  const LIGHT = { hemi: 1.5, sun: 1.6 };
  const hemi = new T.HemisphereLight(C.paper, C.navy, LIGHT.hemi);
  const sun = new T.DirectionalLight(C.paper, LIGHT.sun);
  sun.position.set(14, 30, 20);
  scene.add(hemi, sun);

  const composer = new L.EffectComposer(renderer);
  composer.addPass(new L.RenderPass(scene, camera));
  const BL = MAP.render.bloom;
  const bloom = new L.UnrealBloomPass(new T.Vector2(256, 256), BL.strength, BL.radius, BL.threshold);
  composer.addPass(bloom);
  composer.addPass(new L.OutputPass());

  /* ---------- geometry helpers ---------- */
  const gcache = new Map(), ecache = new Map();
  function geo(g, a) {
    const k = g + ':' + a.join(',');
    let G = gcache.get(k);
    if (G) return G;
    switch (g) {
      case 'box': G = new T.BoxGeometry(a[0], a[1], a[2]); break;
      case 'cyl': G = new T.CylinderGeometry(a[0], a[1], a[2], a[3] || 16); break;
      case 'cap': G = new T.CapsuleGeometry(a[0], a[1], 4, 10); break;
      case 'sph': G = new T.SphereGeometry(a[0], a[1] || 14, a[2] || 10); break;
      case 'torus': G = new T.TorusGeometry(a[0], a[1], 8, 28, a[2] || Math.PI * 2); break;
      case 'plane': G = new T.PlaneGeometry(a[0], a[1]); break;
    }
    G.computeBoundingBox();
    gcache.set(k, G);
    return G;
  }
  function edgesOf(G) {
    let E = ecache.get(G);
    if (!E) { E = new T.EdgesGeometry(G, 28).attributes.position.array; ecache.set(G, E); }
    return E;
  }
  const _e = new T.Euler(), _v = new V3(), _m = new T.Matrix4(), _m2 = new T.Matrix4(), _c = new T.Color();
  const ONE = new V3(1, 1, 1);
  const partMatrix = p => { const r = p.r || [0, 0, 0]; _e.set(deg(r[0]), deg(r[1]), deg(r[2])); return new T.Matrix4().compose(new V3(...(p.p || [0, 0, 0])), new T.Quaternion().setFromEuler(_e), ONE); };
  const instMatrix = a => { _e.set(0, deg(a[3] || 0), 0); return new T.Matrix4().compose(new V3(a[0], a[1], a[2]), new T.Quaternion().setFromEuler(_e), ONE); };
  function pushEdges(arr, G, M) {
    const E = edgesOf(G);
    for (let k = 0; k < E.length; k += 3) { _v.set(E[k], E[k + 1], E[k + 2]).applyMatrix4(M); arr.push(_v.x, _v.y, _v.z); }
  }
  const lineGeo = arr => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); return g; };

  /* ---------- model library (low-poly primitives; origin = floor/mount point, front = +z) ---------- */
  const box = (a, p, m = 'body', x = {}) => ({ g: 'box', a, p, m, ...x });
  const cyl = (a, p, m = 'body', x = {}) => ({ g: 'cyl', a, p, m, ...x });
  const MODELS = {
    wall: s => [box(s.size, [0, s.size[1] / 2, 0])],
    block: s => [box(s.size, [0, s.size[1] / 2, 0])],
    desk: () => [box([1.6, .05, .8], [0, .725, 0]), box([.05, .7, .72], [-.76, .35, 0]), box([.05, .7, .72], [.76, .35, 0])],
    chair: () => [box([.5, .07, .5], [0, .46, 0]), box([.5, .55, .06], [0, .78, .24]), cyl([.035, .035, .42, 6], [0, .21, 0])],
    couch: () => [box([2.2, .42, .9], [0, .21, 0]), box([2.2, .5, .2], [0, .67, -.35]), box([.18, .3, .9], [-1.01, .57, 0]), box([.18, .3, .9], [1.01, .57, 0])],
    doorframe: () => [box([.16, 2.5, .22], [-1.05, 1.25, 0]), box([.16, 2.5, .22], [1.05, 1.25, 0]), box([2.26, .2, .22], [0, 2.6, 0])],
    device: s => {
      const [w, h, d] = s.size;
      return [box([w, h, d], [0, h / 2, 0]), box([w * .84, h * .56, .02], [0, h / 2, d / 2 + .01], 'face', { e: 0 }),
        box([Math.min(.06, w * .1), Math.min(.04, h * .22), .025], [w * .36, h * .5, d / 2 + .022], 'led', { e: 0 })];
    },
    rack: s => {
      const [w, h, d] = s.size;
      return [box([w, h, d], [0, h / 2, 0]), box([w * .07, h * .96, .04], [-w * .43, h / 2, d / 2 + .02], 'face', { e: 0 }),
        box([w * .07, h * .96, .04], [w * .43, h / 2, d / 2 + .02], 'face', { e: 0 }), box([w * 1.02, .06, d * 1.02], [0, h + .03, 0], 'face')];
    },
    workstation: () => [
      box([.95, .56, .05], [0, 1.13, -.22]), box([.87, .48, .012], [0, 1.13, -.19], 'screen', { e: 0 }),
      box([.07, .26, .06], [0, .89, -.26]), box([.32, .03, .2], [0, .765, -.24]),
      box([.2, .42, .42], [.62, .96, -.12]), box([.03, .03, .01], [.62, 1.1, .095], 'led', { e: 0 }),
      box([.46, .02, .15], [-.05, .76, .12], 'face', { e: 0 })],
    laptop: () => [box([.42, .025, .3], [0, .7625, 0]), box([.42, .28, .015], [0, .91, -.185], 'body', { r: [-15, 0, 0] }),
      box([.38, .24, .004], [0, .912, -.176], 'screen', { r: [-15, 0, 0], e: 0 }), box([.36, .004, .13], [0, .777, .04], 'face', { e: 0 })],
    phone: () => [box([.12, .03, .1], [0, .765, 0]), box([.09, .18, .012], [0, .86, -.01], 'body', { r: [-12, 0, 0] }),
      box([.078, .16, .004], [0, .86, -.002], 'screen', { r: [-12, 0, 0], e: 0 })],
    tablet: () => [box([.24, .03, .12], [0, .765, 0]), box([.28, .2, .012], [0, .87, -.02], 'body', { r: [-18, 0, 0] }),
      box([.26, .18, .004], [0, .87, -.012], 'screen', { r: [-18, 0, 0], e: 0 })],
    deskphone: () => [box([.24, .07, .2], [0, .785, 0], 'body', { r: [-8, 0, 0] }), box([.11, .006, .07], [.04, .823, -.02], 'screen', { e: 0 }),
      box([.06, .05, .21], [-.085, .83, 0], 'face')],
    person: () => [{ g: 'cap', a: [.17, .34], p: [0, .9, 0], m: 'body', e: 0 }, { g: 'sph', a: [.13], p: [0, 1.36, 0], m: 'face', e: 0 }],
    mfp: () => [box([.9, .95, .7], [0, .475, 0]), box([.86, .07, .66], [0, .985, 0], 'face'), box([.55, .04, .32], [0, .66, .36], 'face', { e: 0 }),
      box([.32, .03, .14], [.22, 1.04, .27], 'screen', { r: [-25, 0, 0], e: 0 }), box([.8, .02, .02], [0, .3, .355], 'face', { e: 0 }),
      box([.8, .02, .02], [0, .15, .355], 'face', { e: 0 })],
    avwall: () => [box([2.3, 1.35, .07], [0, 1.65, .04]), box([2.18, 1.23, .01], [0, 1.65, .08], 'screen', { e: 0 }),
      box([.6, .09, .09], [0, 2.43, .07], 'face'), cyl([.03, .03, .02, 12], [0, 2.43, .12], 'led', { r: [90, 0, 0], e: 0 }),
      box([1.6, .5, .4], [0, .25, .25])],
    puck: () => [cyl([.13, .15, .05, 18], [0, .025, 0]), cyl([.1, .1, .012, 18], [0, .056, 0], 'face', { e: 0 })],
    tv: () => [box([1.4, .82, .06], [0, 1.55, .04]), box([1.32, .74, .01], [0, 1.55, .075], 'screen', { e: 0 })],
    ap: () => [cyl([.22, .22, .05, 18], [0, 0, 0]), cyl([.05, .05, .056, 12], [0, 0, 0], 'led', { e: 0 }), cyl([.012, .012, .32, 4], [0, .18, 0], 'body', { e: 0 })],
    apGuest: () => [...MODELS.ap(), { g: 'torus', a: [.42, .014], p: [0, -.06, 0], r: [90, 0, 0], m: 'led', e: 0 },
      { g: 'torus', a: [.62, .01], p: [0, -.06, 0], r: [90, 0, 0], m: 'led', e: 0 }],
    cam: () => [box([.08, .16, .08], [0, .04, -.02]), cyl([.07, .07, .32, 12], [0, -.04, .14], 'body', { r: [110, 0, 0] }),
      cyl([.05, .05, .02, 12], [0, -.1, .3], 'led', { r: [110, 0, 0], e: 0 })],
    badge: () => [box([.12, .18, .035], [0, 0, .0175]), box([.08, .08, .006], [0, .025, .038], 'screen', { e: 0 }), box([.02, .02, .006], [0, -.055, .038], 'led', { e: 0 })],
    intercom: () => [box([.15, .27, .04], [0, 0, .02]), cyl([.026, .026, .01, 12], [0, .075, .045], 'led', { r: [90, 0, 0], e: 0 }), box([.1, .08, .006], [0, -.05, .043], 'face', { e: 0 })],
    alarm: () => [box([.32, .42, .07], [0, 0, .035]), box([.22, .16, .006], [0, -.07, .072], 'face', { e: 0 }), box([.22, .07, .006], [0, .1, .072], 'screen', { e: 0 })],
    thermostat: () => [cyl([.09, .09, .035, 22], [0, 0, .018], 'body', { r: [90, 0, 0] }), cyl([.062, .062, .01, 22], [0, 0, .04], 'screen', { r: [90, 0, 0], e: 0 })],
    speaker: () => [cyl([.07, .08, .2, 16], [0, .1, 0]), cyl([.055, .055, .01, 16], [0, .205, 0], 'led', { e: 0 })],
    pos: () => [box([.22, .05, .22], [0, .025, 0]), box([.05, .18, .05], [0, .14, -.03]), box([.3, .2, .03], [0, .3, 0], 'body', { r: [-25, 0, 0] }),
      box([.27, .17, .006], [0, .3, .018], 'screen', { r: [-25, 0, 0], e: 0 }), box([.09, .045, .17], [.24, .022, .03]),
      box([.06, .004, .06], [.24, .047, .05], 'face', { e: 0 })],
    tile: () => [{ g: 'plane', a: [3.6, 2.6], p: [0, 0, 0], r: [-90, 0, 0], m: 'holo' }],
    soc: () => {
      const P = [box([4.6, 2.6, 3.4], [0, 1.3, 0]), box([4.9, .16, 3.7], [0, 2.68, 0], 'face'),
        box([4.64, .14, 3.44], [0, 2.42, 0], 'accent', { e: 0 }), box([3.95, 1.62, .03], [0, 1.38, 1.715], 'face', { e: 0 }),
        box([.04, 1.7, .9], [2.31, .85, .7], 'face'), cyl([.2, .2, .06, 12], [1.7, 2.79, 1.25]),
        cyl([.15, .15, .26, 12], [1.7, 2.95, 1.25], 'beacon', { e: 0 }), cyl([.03, .03, 1.0, 6], [-1.7, 3.26, -1.2], 'face'),
        { g: 'sph', a: [.16, 12, 8], p: [-1.7, 3.8, -1.2], m: 'face' }, box([.9, .4, .7], [-.4, 2.96, -.8])];
      for (const y of [1.0, 1.76]) for (const x of [-1.27, 0, 1.27]) P.push(box([1.15, .64, .04], [x, y, 1.74], 'screen'));
      return P;
    },
    helpdesk: () => {
      const P = [cyl([2.7, 2.7, .12, 6], [0, .06, 0], 'body')];
      const ap = 2.7 * Math.cos(Math.PI / 6);
      const at = (th, r, y, lat = 0) => { const t = deg(th); return [Math.sin(t) * r + Math.cos(t) * lat, y, Math.cos(t) * r - Math.sin(t) * lat]; };
      for (const th of [150, 210, 270]) P.push(box([2.6, 1.5, .1], at(th, ap - .08, .87), 'body', { r: [0, th, 0] }));
      for (const th of [150, 210]) {
        P.push(box([2.2, .06, .62], at(th, ap - .55, .76), 'face', { r: [0, th, 0] }));
        for (const lat of [-.5, .5]) {
          P.push(box([.6, .38, .04], at(th, ap - .72, 1.06, lat), 'body', { r: [0, th + 180, 0] }));
          P.push(box([.54, .32, .01], at(th, ap - .75, 1.06, lat), 'screen', { r: [0, th + 180, 0], e: 0 }));
        }
      }
      for (const [th, lat] of [[150, -.5], [150, .5], [210, 0]]) {
        const b = at(th, ap - 1.35, 0, lat);
        P.push({ g: 'cap', a: [.17, .34], p: [b[0], .9, b[2]], m: 'body' });
        P.push({ g: 'sph', a: [.13], p: [b[0], 1.36, b[2]], m: 'face' });
        P.push({ g: 'torus', a: [.15, .024, Math.PI], p: [b[0], 1.37, b[2]], r: [0, th, 0], m: 'led', e: 0 });
      }
      P.push(cyl([.05, .05, 2.6, 8], [1.9, 1.3, 1.2]));
      P.push(box([1.2, .44, .06], [1.9, 2.5, 1.2], 'accent', { r: [0, 30, 0] }));
      return P;
    },
    truck: () => [
      box([3.0, 1.9, 1.8], [-.6, 1.4, 0]), box([1.3, 1.35, 1.7], [1.55, 1.12, 0]),
      box([.03, .58, 1.46], [2.215, 1.42, 0], 'screen', { e: 0 }),
      box([.7, .5, .03], [1.6, 1.4, .86], 'screen', { e: 0 }), box([.7, .5, .03], [1.6, 1.4, -.86], 'screen', { e: 0 }),
      box([4.5, .3, 1.6], [.15, .45, 0]), box([3.02, .2, 1.82], [-.6, .95, 0], 'accent', { e: 0 }),
      box([.26, .1, 1.25], [1.6, 1.85, 0], 'lightbar', { e: 0 }), box([.06, .2, 1.4], [2.24, .7, 0], 'face', { e: 0 }),
      ...[[-1.4, .82], [-1.4, -.82], [1.5, .82], [1.5, -.82]].map(([x, z]) => cyl([.38, .38, .26, 16], [x, .38, z], 'body', { r: [90, 0, 0] }))]
  };

  /* ---------- materials ---------- */
  const shellMat = new T.MeshBasicMaterial({ color: C.paper, transparent: true, opacity: .05, depthWrite: false, side: T.DoubleSide });
  const shellLine = new T.LineBasicMaterial({ color: C.slate, transparent: true, opacity: .38 });
  shellMat.userData.base = .05; shellLine.userData.base = .38;
  const stdMats = () => ({
    body: new T.MeshStandardMaterial({ color: C.blue, roughness: .92, metalness: 0, flatShading: true }),
    face: new T.MeshStandardMaterial({ color: C.mist, roughness: .9, metalness: 0, flatShading: true }),
    screen: new T.MeshBasicMaterial({ color: hdr(BB, .5), toneMapped: false }),
    led: new T.MeshBasicMaterial({ color: hdr(BB, 2.6), toneMapped: false }),
    accent: new T.MeshBasicMaterial({ color: C.red, toneMapped: false }),
    beacon: new T.MeshBasicMaterial({ color: hdr(C.red, 1.2), toneMapped: false }),
    lightbar: new T.MeshBasicMaterial({ color: hdr(BB, 1.4), toneMapped: false }),
    line: new T.LineBasicMaterial({ color: hdr(BB, LINE_K), toneMapped: false, transparent: true, opacity: .95 })
  });

  const holoVS = `varying vec2 vUv; void main(){ vUv = uv; vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p; }`;
  const holoFS = `uniform vec3 cA; uniform vec3 cB; uniform vec3 cP; uniform float uTime; uniform float uOpacity; uniform float uHover; uniform sampler2D uIcon; varying vec2 vUv;
    void main(){
      vec3 c = mix(cA, cB, vUv.x);
      float scan = 0.72 + 0.28 * step(0.5, fract(vUv.y * 26.0 - uTime * 0.7));
      vec2 e2 = min(vUv, 1.0 - vUv);
      float edge = 1.0 - smoothstep(0.0, 0.04, min(e2.x * 0.72, e2.y));
      float ic = texture2D(uIcon, vUv).a;
      vec3 col = c * (0.75 * scan + 0.45 * uHover) + c * edge * 0.9 + cP * ic * 0.95;
      float a = clamp(0.34 * scan + edge * 0.55 + ic * 0.85 + uHover * 0.15, 0.0, 1.0) * uOpacity;
      gl_FragColor = vec4(col, a);
      #include <colorspace_fragment>
    }`;
  const ICONS = {
    mail: g => { g.rect(-62, -42, 124, 84); g.moveTo(-62, -42); g.lineTo(0, 8); g.lineTo(62, -42); },
    lock: g => { g.rect(-48, -8, 96, 66); g.moveTo(-30, -8); g.lineTo(-30, -30); g.arc(0, -30, 30, Math.PI, 0); g.lineTo(30, -8); g.moveTo(0, 18); g.lineTo(0, 34); },
    folder: g => { g.moveTo(-64, 46); g.lineTo(-64, -44); g.lineTo(-20, -44); g.lineTo(-8, -30); g.lineTo(64, -30); g.lineTo(64, 46); g.closePath(); },
    chat: g => { g.moveTo(-64, -46); g.lineTo(30, -46); g.lineTo(30, 14); g.lineTo(-30, 14); g.lineTo(-48, 32); g.lineTo(-48, 14); g.lineTo(-64, 14); g.closePath();
      g.moveTo(42, -14); g.lineTo(64, -14); g.lineTo(64, 40); g.lineTo(52, 40); g.lineTo(52, 56); g.lineTo(36, 40); g.lineTo(-6, 40); g.lineTo(-6, 26); },
    globe: g => { g.arc(0, 0, 56, 0, Math.PI * 2); g.moveTo(-56, 0); g.lineTo(56, 0); g.moveTo(0, -56); g.ellipse(0, 0, 24, 56, 0, -Math.PI / 2, Math.PI * 1.5);
      g.moveTo(-46, -30); g.lineTo(46, -30); g.moveTo(-46, 30); g.lineTo(46, 30); },
    apps: g => { for (const x of [-46, 0, 46]) for (const y of [-46, 0, 46]) g.rect(x - 15, y - 15, 30, 30); },
    upload: g => { g.moveTo(-36, 40); g.lineTo(-52, 40); g.bezierCurveTo(-84, 40, -84, -6, -54, -8); g.bezierCurveTo(-50, -50, 20, -58, 30, -20);
      g.bezierCurveTo(72, -24, 82, 40, 40, 40); g.lineTo(36, 40); g.moveTo(0, 56); g.lineTo(0, -6); g.moveTo(-20, 14); g.lineTo(0, -6); g.lineTo(20, 14); },
    phone: g => { g.moveTo(-40, -56); g.lineTo(-16, -56); g.lineTo(-6, -26); g.lineTo(-22, -14); g.bezierCurveTo(-12, 8, 4, 24, 20, 30); g.lineTo(32, 14);
      g.lineTo(60, 26); g.lineTo(60, 48); g.bezierCurveTo(10, 60, -60, 0, -40, -56); },
    spark: g => { const s = (x, y, r) => { g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); };
      s(-12, 6, 52); s(48, -40, 20); s(52, 40, 14); }
  };
  function iconTex(name) {
    const c = document.createElement('canvas'); c.width = 360; c.height = 260;
    const g = c.getContext('2d');
    g.strokeStyle = 'white'; g.lineWidth = 9; g.lineJoin = 'round'; g.lineCap = 'round';
    g.translate(180, 130); g.beginPath(); (ICONS[name] || ICONS.apps)(g); g.stroke();
    const t = new T.CanvasTexture(c); t.anisotropy = 4;
    return t;
  }
  const holoMat = icon => new T.ShaderMaterial({
    uniforms: { cA: { value: BB.clone() }, cB: { value: C.purple.clone() }, cP: { value: C.paper.clone() }, uTime: { value: 0 }, uOpacity: { value: 1 }, uHover: { value: 0 }, uIcon: { value: iconTex(icon) } },
    vertexShader: holoVS, fragmentShader: holoFS, transparent: true, depthWrite: false, side: T.DoubleSide
  });

  const tubeVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const tubeFS = `uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uSpeed; uniform float uBands; varying vec2 vUv;
    void main(){ float band = 0.55 + 0.45 * sin(vUv.x * uBands - uTime * uSpeed);
      gl_FragColor = vec4(uColor * band, uOpacity * (0.35 + 0.65 * band));
      #include <colorspace_fragment>
    }`;
  const timed = [];
  const tubeMat = (color, op, speed, bands = 60) => {
    const m = new T.ShaderMaterial({ uniforms: { uColor: { value: color }, uTime: { value: 0 }, uOpacity: { value: op }, uSpeed: { value: speed }, uBands: { value: bands } },
      vertexShader: tubeVS, fragmentShader: tubeFS, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    m.userData.speed = speed; timed.push(m);
    return m;
  };

  /* ---------- build scene ---------- */
  const world = new T.Group(); scene.add(world);
  const objects = new Map(), zones = new Map(), pickables = [];
  const allDefs = MAP.zones.flatMap(z => z.objects);

  function buildShell() {
    const lines = [];
    for (const it of MAP.layout.shell) {
      const parts = MODELS[it.model](it), inst = it.at.map(instMatrix);
      for (const p of parts) {
        const G = geo(p.g, p.a), lm = partMatrix(p);
        const mesh = new T.InstancedMesh(G, shellMat, inst.length);
        inst.forEach((im, i) => { _m.multiplyMatrices(im, lm); mesh.setMatrixAt(i, _m); pushEdges(lines, G, _m); });
        mesh.computeBoundingSphere();
        world.add(mesh);
      }
    }
    const floor = geo('box', [24.2, .08, 16.2]);
    const fm = new T.Mesh(floor, shellMat); fm.position.y = -.04; world.add(fm);
    _m.makeTranslation(0, -.04, 0); pushEdges(lines, floor, _m);
    world.add(new T.LineSegments(lineGeo(lines), shellLine));

    /* team pads, paths, road */
    const padMat = new T.MeshStandardMaterial({ color: C.blue, roughness: .95, flatShading: true });
    const padLine = new T.LineBasicMaterial({ color: C.slate, transparent: true, opacity: .5 });
    const flat = new T.MeshBasicMaterial({ color: C.paper, transparent: true, opacity: .05, depthWrite: false });
    const pl = [], fl = [];
    for (const p of MAP.layout.pads) {
      const G = geo('box', [p.size[0], .12, p.size[1]]); const m = new T.Mesh(G, padMat);
      m.position.set(p.center[0], .06, p.center[1]); world.add(m); m.updateMatrix(); pushEdges(pl, G, m.matrix);
    }
    for (const p of MAP.layout.paths) {
      const dx = p.to[0] - p.from[0], dz = p.to[1] - p.from[1], len = Math.hypot(dx, dz);
      const G = geo('box', [len, .02, .9]); const m = new T.Mesh(G, flat);
      m.position.set((p.from[0] + p.to[0]) / 2, .01, (p.from[1] + p.to[1]) / 2); m.rotation.y = -Math.atan2(dz, dx);
      world.add(m); m.updateMatrix(); pushEdges(fl, G, m.matrix);
    }
    const r = MAP.layout.road;
    const RG = geo('box', [r.size[0], .02, r.size[1]]); const rm = new T.Mesh(RG, flat);
    rm.position.set(r.center[0], .01, r.center[1]); world.add(rm); rm.updateMatrix(); pushEdges(fl, RG, rm.matrix);
    const dash = geo('box', [1.2, .025, .08]); const nd = Math.floor(r.size[0] / 3);
    const dm = new T.InstancedMesh(dash, new T.MeshBasicMaterial({ color: C.slate, transparent: true, opacity: .35 }), nd);
    for (let i = 0; i < nd; i++) { _m.makeTranslation(r.center[0] - r.size[0] / 2 + 1.5 + i * 3, .02, r.center[1] + r.size[1] * .22); dm.setMatrixAt(i, _m); }
    dm.computeBoundingSphere(); world.add(dm);
    world.add(new T.LineSegments(lineGeo(pl), padLine), new T.LineSegments(lineGeo(fl), shellLine));

    /* ground grid with linear edge fade */
    const ground = new T.Mesh(new T.PlaneGeometry(320, 320), new T.ShaderMaterial({
      uniforms: { cL: { value: C.slate.clone() }, uC: { value: new T.Vector2(5, 2) }, uH: { value: new T.Vector2(18, 14) }, uF: { value: 26 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 cL; uniform vec2 uC; uniform vec2 uH; uniform float uF; varying vec3 vW;
        void main(){ vec2 co = vW.xz / 2.0; vec2 g = abs(fract(co - 0.5) - 0.5) / fwidth(co); float l = 1.0 - min(min(g.x, g.y), 1.0);
          float fx = 1.0 - clamp((abs(vW.x - uC.x) - uH.x) / uF, 0.0, 1.0); float fz = 1.0 - clamp((abs(vW.z - uC.y) - uH.y) / uF, 0.0, 1.0);
          gl_FragColor = vec4(cL, l * 0.11 * fx * fz);
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false
    }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.1;
    scene.add(ground);
  }

  function buildObject(def, zone) {
    const tier = zone.group === 'cloud' ? 'cloud' : zone.group === 'team' ? 'team' : 'managed';
    const items = def.items || [{ model: def.model, at: def.at, size: def.size }];
    const single = items.length === 1 && items[0].at.length === 1;
    const mats = stdMats();
    if (tier === 'cloud') mats.holo = holoMat(def.icon);
    const group = new T.Group(), rig = new T.Group();
    group.add(rig); world.add(group);
    if (single) { const a = items[0].at[0]; rig.position.set(a[0], a[1], a[2]); rig.rotation.y = deg(a[3] || 0); }
    const lines = [], meshes = [];
    for (const it of items) {
      const parts = MODELS[it.model](it);
      const inst = (single ? [[0, 0, 0, 0]] : it.at).map(instMatrix);
      for (const p of parts) {
        const G = geo(p.g, p.a), lm = partMatrix(p);
        const mesh = new T.InstancedMesh(G, mats[p.m], inst.length);
        inst.forEach((im, i) => { _m.multiplyMatrices(im, lm); mesh.setMatrixAt(i, _m); if (p.e !== 0) pushEdges(lines, G, _m); });
        mesh.computeBoundingSphere();
        mesh.userData.obj = def.id; mesh.userData.item = it; mesh.userData.lm = lm;
        rig.add(mesh); pickables.push(mesh); meshes.push(mesh);
      }
    }
    rig.add(new T.LineSegments(lineGeo(lines), mats.line));
    const o = { id: def.id, def, zone, tier, group, rig, mats, meshes, single, lift: 0, pulse: 0, unitGlow: 0,
      alpha: 1, alphaCur: 1, alphaTarget: 1, matList: Object.values(mats), phase: Math.random() * 6 };
    for (const m of o.matList) m.userData.base = m.uniforms ? 1 : m.opacity;
    objects.set(def.id, o);
    return o;
  }

  function measure(o) {
    o.group.updateMatrixWorld(true);
    o.box = new T.Box3(); o.anchors = [];
    const byItem = new Map();
    for (const mesh of o.meshes) {
      let arr = byItem.get(mesh.userData.item);
      if (!arr) byItem.set(mesh.userData.item, arr = []);
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, _m); _m.premultiply(mesh.matrixWorld);
        const b = mesh.geometry.boundingBox.clone().applyMatrix4(_m);
        (arr[i] ||= new T.Box3()).union(b);
        o.box.union(b);
      }
    }
    o.iboxes = [];
    for (const arr of byItem.values()) for (const b of arr) { const c = b.getCenter(new V3()); c.y = b.max.y; o.anchors.push(c); o.iboxes.push(b); }
    o.h = o.box.max.y - o.box.min.y;
    o.base = o.rig.position.clone();
  }

  function addLabel(o) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = `<div class="top"><button class="pill" type="button" tabindex="-1" aria-hidden="true">${o.def.regulated ? `<span class="reg ibox" aria-hidden="true">${ICON.shield}</span>` : ''}<span>${esc(display(o.def.name))}</span><span class="tag">${esc(o.def.tag || '')}</span></button><i class="leader"${o.def.lead ? ` style="height:${+o.def.lead}px"` : ''}></i></div>`;
    const pill = el.querySelector('.pill');
    pill.addEventListener('click', e => { e.stopPropagation(); poke(); select(o.id); });
    pill.addEventListener('pointerenter', () => setHover(o.id));
    pill.addEventListener('pointerleave', () => setHover(null));
    const lo = new L.CSS2DObject(el);
    let parent;
    if (o.single && !o.def.labelAt) { lo.position.set(0, o.box.max.y - o.rig.position.y + .08, 0); parent = o.rig; }
    else if (o.def.labelAt) { lo.position.set(...o.def.labelAt); parent = o.group; }
    else if (o.def.labelIndex != null && o.anchors[o.def.labelIndex]) { lo.position.copy(o.anchors[o.def.labelIndex]).y += .08; parent = o.group; }
    else {
      const c = new V3(); o.anchors.forEach(a => c.add(a)); c.divideScalar(o.anchors.length); c.y = o.box.max.y + .08;
      lo.position.copy(c); parent = o.group;
    }
    parent.add(lo); lo.visible = false;
    o.label = lo; o.labelEl = el; o.labelOp = -1;
    if (o.def.regulated) {
      const b = document.createElement('div'); b.className = 'badge';
      b.innerHTML = `<div class="top"><span class="ibox" title="Regulated data">${ICON.shield}</span></div>`;
      const bo = new L.CSS2DObject(b); bo.position.copy(lo.position); parent.add(bo); bo.visible = false; o.badge = bo;
    }
  }

  buildShell();
  for (const z of MAP.zones) for (const d of z.objects) buildObject(d, z);
  for (const o of objects.values()) { measure(o); addLabel(o); }

  /* zones: plates, boxes, labels */
  for (const z of MAP.zones) {
    const Z = { def: z, box: new T.Box3() };
    if (z.bounds) {
      const [x0, z0, x1, z1] = z.bounds;
      Z.box.set(new V3(x0, 0, z0), new V3(x1, 3.2, z1));
      const G = new T.BoxGeometry(x1 - x0 - .12, .02, z1 - z0 - .12);
      Z.plate = new T.Mesh(G, new T.MeshBasicMaterial({ color: BB, transparent: true, opacity: .03, depthWrite: false }));
      Z.plate.position.set((x0 + x1) / 2, .02, (z0 + z1) / 2);
      Z.plateLine = new T.LineSegments(new T.EdgesGeometry(G), new T.LineBasicMaterial({ color: hdr(BB, 1.2), toneMapped: false, transparent: true, opacity: .22 }));
      Z.plateLine.position.copy(Z.plate.position);
      world.add(Z.plate, Z.plateLine);
    } else {
      for (const d of z.objects) Z.box.union(objects.get(d.id).box);
    }
    const el = document.createElement('div');
    el.className = 'lbl zone';
    el.innerHTML = `<div class="top"><button class="pill" type="button" tabindex="-1" aria-hidden="true">${esc(z.name)}${z.hotkey ? `<kbd>${z.hotkey}</kbd>` : ''}</button><i class="leader"></i></div>`;
    el.querySelector('.pill').addEventListener('click', e => { e.stopPropagation(); poke(); focusZone(z.id); });
    const lo = new L.CSS2DObject(el);
    const c = Z.box.getCenter(new V3());
    if (z.labelAt) lo.position.set(...z.labelAt); else lo.position.set(c.x, z.bounds ? 3.5 : Z.box.max.y + (z.group === 'cloud' ? 1.2 : .6), c.z);
    scene.add(lo); Z.label = lo;
    zones.set(z.id, Z);
  }

  /* cloud platform + tethers to the firewall */
  const cp = MAP.layout.cloudPlatform;
  {
    const G = new T.BoxGeometry(...cp.size);
    const pm = new T.Mesh(G, new T.MeshBasicMaterial({ color: BB, transparent: true, opacity: .06, depthWrite: false }));
    pm.position.set(...cp.center); world.add(pm);
    const pe = new T.LineSegments(new T.EdgesGeometry(G), new T.LineBasicMaterial({ color: hdr(BB, 1.3), toneMapped: false, transparent: true, opacity: .55 }));
    pe.position.copy(pm.position); world.add(pe);
    zones.get('cloud')?.box.union(new T.Box3().setFromObject(pm));
    const fw = objects.get('firewall');
    if (fw) {
      const top = fw.anchors[0], yb = cp.center[1] - cp.size[1] / 2, h = yb - top.y;
      const beamMat = new T.ShaderMaterial({
        uniforms: { cA: { value: BB.clone() }, cB: { value: C.purple.clone() }, uTime: { value: 0 }, uSpeed: { value: 3 } },
        vertexShader: tubeVS,
        fragmentShader: `uniform vec3 cA; uniform vec3 cB; uniform float uTime; uniform float uSpeed; varying vec2 vUv;
          void main(){ float b = 0.5 + 0.5 * sin(vUv.y * 36.0 - uTime * uSpeed); vec3 c = mix(cA, cB, vUv.y) * (0.8 + 0.9 * b);
            gl_FragColor = vec4(c, 0.3 + 0.45 * b);
            #include <colorspace_fragment>
          }`,
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide
      });
      beamMat.userData.speed = 3; timed.push(beamMat);
      for (const [dx, dz] of [[-.28, 0], [.28, 0], [0, .2]]) {
        const m = new T.Mesh(new T.CylinderGeometry(.035, .035, h, 8, 1, true), beamMat);
        m.position.set(top.x + dx, top.y + h / 2, top.z + dz); world.add(m);
      }
      const hub = new T.Mesh(new T.TorusGeometry(.55, .03, 8, 32), new T.MeshBasicMaterial({ color: hdr(BB, 2.2), toneMapped: false }));
      hub.rotation.x = Math.PI / 2; hub.position.set(top.x, yb - .02, top.z); world.add(hub);
    }
  }

  /* ---------- state ---------- */
  const state = { zone: null, sel: null, hover: null, data: false, comp: false, started: false, engaged: false, beams: new Set() };
  let lastInput = performance.now();
  const poke = () => { lastInput = performance.now(); controls.autoRotate = false; };

  /* ---------- camera ---------- */
  const VIEW_DIR = new V3(1, .92, 1.18).normalize();
  function viewForBox(b, minD = 5, k = 1) {
    const c = b.getCenter(new V3()), s = b.getSize(new V3());
    const r = Math.max(s.x, s.y * 1.3, s.z, 1);
    let d = Math.max(minD, r * 1.75 * k);
    if (camera.aspect < 1.2) d *= 1.2 / Math.max(camera.aspect, .45);
    return { pos: c.clone().addScaledVector(VIEW_DIR, d), target: c };
  }
  function overviewView() {
    const v = isPhone() ? MAP.views.overviewPhone : MAP.views.overview;
    const pos = new V3(...v.pos), target = new V3(...v.target);
    if (!isPhone() && camera.aspect < 1.3) pos.sub(target).multiplyScalar(1.3 / Math.max(camera.aspect, .6)).add(target);
    return { pos, target };
  }
  let fly = null;
  function flyTo(v, dur = 1.25) {
    controls.autoRotate = false;
    if (reduced || dur === 0) { fly = null; camera.position.copy(v.pos); controls.target.copy(v.target); controls.update(); return; }
    fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, s: 0, d: dur };
  }
  controls.addEventListener('start', () => { fly = null; poke(); });
  const ease = s => s < .5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2;

  /* ---------- view offset (keeps the subject clear of the panel) ---------- */
  let W = 1, H = 1, shiftX = 0, shiftY = 0, tShiftX = 0, tShiftY = 0;
  const panel = $('#panel'), pbody = $('#pbody');
  function setShift(open) {
    if (!open) { tShiftX = tShiftY = 0; return; }
    if (isPhone()) { tShiftX = 0; tShiftY = H * .2; } else { tShiftX = (panel.offsetWidth + 24) / 2; tShiftY = 0; }
  }

  /* ---------- dimming ---------- */
  function setAlpha(o, k) {
    o.alpha = k;
    const lk = state.data ? .55 : 1;
    for (const m of o.matList) {
      const b = m.userData.base;
      if (m.uniforms) { m.uniforms.uOpacity.value = b * k; continue; }
      const kk = m.isLineBasicMaterial ? k * lk : k;
      m.opacity = b * kk;
      m.transparent = kk < .999 || m.isLineBasicMaterial;
    }
  }
  function applyDims() {
    for (const o of objects.values()) {
      let k = 1;
      if (state.sel && state.sel !== o.id && !o.unitGlow) k = .3;
      else if (!state.sel && state.comp && !o.def.regulated && o.tier !== 'team') k = .4;
      if (state.hover === o.id) k = 1;
      o.alphaTarget = k;
    }
    const sk = (state.sel ? .5 : 1) * (state.data ? .6 : 1);
    shellMat.opacity = shellMat.userData.base * sk;
    shellLine.opacity = shellLine.userData.base * sk;
    for (const Z of zones.values()) if (Z.plate) {
      const f = state.zone === Z.def.id;
      Z.plate.material.opacity = f ? .07 : .03;
      Z.plateLine.material.opacity = f ? .75 : .22;
    }
    const lk = state.data ? .55 : 1;
    hemi.intensity = LIGHT.hemi * lk; sun.intensity = LIGHT.sun * lk;
    if (flowsBuilt) refreshFlowDims();
  }

  function setHover(id) {
    if (state.hover === id) return;
    const prev = state.hover ? objects.get(state.hover) : null;
    state.hover = id;
    if (prev) prev.labelEl.classList.remove('hov');
    if (id) objects.get(id).labelEl.classList.add('hov');
    renderer.domElement.style.cursor = id ? 'pointer' : '';
    applyDims();
  }

  /* ---------- menu ---------- */
  const tree = $('#tree'), menu = $('#menu'), menuOpenBtn = $('#menu-open');
  function buildMenu() {
    let h = '';
    const office = MAP.zones.filter(z => z.group === 'office');
    h += `<div class="mgroup"><div class="mgroup-h"><span class="ibox" aria-hidden="true">${ICON.office}</span><p class="pre">Office</p></div><ul class="tree">`;
    for (const z of office) h += zoneItem(z, false);
    h += `</ul></div>`;
    for (const z of MAP.zones.filter(z => z.group !== 'office')) {
      h += `<div class="mgroup"><ul class="tree">${zoneItem(z, true)}</ul></div>`;
    }
    tree.innerHTML = h;
    tree.addEventListener('click', e => {
      const zb = e.target.closest('.zbtn'), ib = e.target.closest('.ibtn');
      poke();
      if (zb) {
        const id = zb.dataset.zone, open = zb.getAttribute('aria-expanded') === 'true';
        if (open && state.zone === id && !state.sel) { setExpanded(id, false); return; }
        setExpanded(id, true); focusZone(id);
      } else if (ib) {
        select(ib.dataset.obj, { focus: e.detail === 0, from: ib });
        if (isPhone()) setMenuSheet(false);
      }
    });
  }
  function zoneItem(z, grp) {
    const icon = grp ? `<span class="ibox" aria-hidden="true">${z.group === 'cloud' ? ICON.cloud : ICON.team}</span>` : '';
    let h = `<li><button class="zbtn${grp ? ' gbtn' : ''}" type="button" data-zone="${z.id}" aria-expanded="false" aria-controls="mz-${z.id}">${grp ? icon : CHEV}<span class="nm">${esc(z.name)}</span>${z.hotkey ? `<kbd>${z.hotkey}</kbd>` : ''}${grp ? CHEV : ''}</button><ul id="mz-${z.id}" hidden>`;
    for (const o of z.objects) h += `<li><button class="ibtn" type="button" data-obj="${o.id}"><span>${esc(display(o.name))}</span>${o.hotkey ? `<kbd>${o.hotkey}</kbd>` : ''}</button></li>`;
    return h + `</ul></li>`;
  }
  function setExpanded(id, on) {
    const b = tree.querySelector(`.zbtn[data-zone="${id}"]`);
    if (!b) return;
    b.setAttribute('aria-expanded', on);
    $('#mz-' + id).hidden = !on;
  }
  function syncMenu() {
    tree.querySelectorAll('.ibtn').forEach(b => b.setAttribute('aria-current', b.dataset.obj === state.sel ? 'true' : 'false'));
    tree.querySelectorAll('.zbtn').forEach(b => b.setAttribute('aria-current', b.dataset.zone === state.zone ? 'true' : 'false'));
    if (state.zone) setExpanded(state.zone, true);
  }
  function setMenuSheet(on) {
    menu.classList.toggle('open', on);
    menuOpenBtn.setAttribute('aria-expanded', on);
    if (on) tree.querySelector('button')?.focus(); else if (isPhone()) menuOpenBtn.focus({ preventScroll: true });
  }
  menuOpenBtn.addEventListener('click', () => setMenuSheet(true));
  $('#menu-close').addEventListener('click', () => setMenuSheet(false));
  $('#menu-collapse').addEventListener('click', e => {
    const c = menu.classList.toggle('collapsed');
    e.currentTarget.setAttribute('aria-expanded', !c);
    e.currentTarget.setAttribute('aria-label', c ? 'Expand menu' : 'Collapse menu');
  });
  $('#reset').addEventListener('click', () => { poke(); overview(); });
  buildMenu();

  /* ---------- panel ---------- */
  let panelReturn = null;
  function openPanel(o, moveFocus, from) {
    const d = o.def, short = CMAP.isShort(d.name);
    const chips = d.handlers.map(h => `<button class="chip" type="button" aria-pressed="${state.beams.has(h)}" data-h="${h}"><span class="dot" aria-hidden="true"></span>${esc(MAP.handlers[h].label)}</button>`).join('');
    const comp = state.comp && d.compliance
      ? `<div class="comp"><div class="head"><span class="ibox" aria-hidden="true">${ICON.shield}</span><p class="pre">${esc(MAP.compliance.title)}</p></div><p class="body">${esc(d.compliance)}</p><div class="links">${MAP.compliance.links.map(k => `<a class="btn btn-sec btn-sm" href="${esc(CMAP.linkOf(k))}" target="_blank" rel="noopener">${esc(MAP.links[k].label)}</a>`).join('')}</div></div>` : '';
    pbody.innerHTML = `<p class="pre">${esc(o.zone.name)}</p>
      <h2 class="${short ? 'h-short' : 'h-long'}" tabindex="-1">${esc(display(d.name))}</h2>
      <p class="body">${esc(d.summary)}</p>
      <h3 class="sub">What We Cover</h3>
      <ul class="cover">${d.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <h3 class="sub">Who Handles It</h3>
      <div class="chips" role="group" aria-label="Who handles it">${chips}</div>
      <p class="hint">Select a team to see it in the scene.</p>
      ${comp}`;
    $('#pfoot').innerHTML = `<a class="btn btn-sec learn" href="${esc(CMAP.linkOf(d.link))}" target="_blank" rel="noopener">Learn more<span class="sr-only">: ${esc(MAP.links[d.link].label)}</span> ${ARROW}</a>`;
    pbody.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => { poke(); toggleBeam(b.dataset.h, b); }));
    panel.classList.add('open');
    if (!isPhone() && W < 1100 && !menu.classList.contains('collapsed')) $('#menu-collapse').click();
    panel.setAttribute('aria-hidden', 'false');
    pbody.scrollTop = 0;
    if (from) panelReturn = from;
    if (moveFocus) pbody.querySelector('h2').focus({ preventScroll: true });
    setShift(true);
  }
  function hidePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    setShift(false);
  }
  $('#panel-close').addEventListener('click', () => { poke(); closePanel(); });

  /* ---------- actions ---------- */
  function overview() {
    state.zone = null;
    if (state.sel) closePanel(true);
    flyTo(overviewView());
    syncMenu(); applyDims();
  }
  function focusZone(id) {
    const Z = zones.get(id);
    if (!Z) return;
    if (state.sel) closePanel(true);
    state.zone = id;
    flyTo(viewForBox(Z.box, 8, Z.def.group === 'office' ? .95 : .85));
    syncMenu(); applyDims();
  }
  function select(id, opts = {}) {
    const o = objects.get(id);
    if (!o) return;
    state.sel = id; state.zone = o.zone.id; o.pulse = 1;
    state.beams.clear(); rebuildBeams();
    flyTo(viewForBox(o.box, o.tier === 'team' ? 17 : o.tier === 'cloud' ? 9 : 6.5));
    openPanel(o, opts.focus, opts.from);
    syncMenu(); applyDims();
  }
  function closePanel(silent) {
    hidePanel();
    if (!state.sel) return;
    state.sel = null;
    state.beams.clear(); rebuildBeams();
    syncMenu(); applyDims();
    if (!silent && panelReturn && document.contains(panelReturn)) panelReturn.focus({ preventScroll: true });
    panelReturn = null;
  }

  /* ---------- who-handles-it beams ---------- */
  const beamGroup = new T.Group(); scene.add(beamGroup);
  const beamMat = tubeMat(hdr(C.paper, 1.1), .8, 4, 40);
  function rebuildBeams() {
    for (const c of [...beamGroup.children]) { c.geometry.dispose(); beamGroup.remove(c); }
    for (const o of objects.values()) o.unitGlow = 0;
    if (state.sel) {
      const tgt = objects.get(state.sel);
      for (const h of state.beams) {
        const unit = objects.get(MAP.handlers[h].unit);
        if (!unit) continue;
        unit.unitGlow = 1;
        if (unit === tgt) continue;
        beamGroup.add(new T.Mesh(new T.TubeGeometry(arc(unit.anchors[0], tgt.anchors[0]), 64, .035, 6), beamMat));
      }
    }
    applyDims();
  }
  function frameBeams() {
    if (!state.sel || !state.beams.size) return;
    const b = objects.get(state.sel).box.clone();
    for (const h of state.beams) { const u = objects.get(MAP.handlers[h].unit); if (u) b.union(u.box); }
    flyTo(viewForBox(b, 8, .8));
  }
  function toggleBeam(h, btn) {
    const on = !state.beams.has(h);
    on ? state.beams.add(h) : state.beams.delete(h);
    btn.setAttribute('aria-pressed', on);
    rebuildBeams();
    if (on) frameBeams();
  }
  function arc(A, B, lift = 1) {
    const d = A.distanceTo(B);
    const M = A.clone().lerp(B, .5); M.y = Math.max(A.y, B.y) + (1 + d * .2) * lift;
    const P1 = A.clone().lerp(M, .4); P1.y = A.y + (M.y - A.y) * .8;
    const P3 = B.clone().lerp(M, .4); P3.y = B.y + (M.y - B.y) * .8;
    return new T.CatmullRomCurve3([A.clone(), P1, M, P3, B.clone()], false, 'centripetal');
  }

  /* ---------- Data View ---------- */
  const flowGroup = new T.Group(); flowGroup.visible = false; scene.add(flowGroup);
  const links = [], packets = [];
  let flowsBuilt = false;
  const PMAX = 900;
  const pMesh = new T.InstancedMesh(new T.IcosahedronGeometry(.085, 0), new T.MeshBasicMaterial({ toneMapped: false }), PMAX);
  pMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  pMesh.setColorAt(0, C.paper); pMesh.instanceColor.setUsage(T.DynamicDrawUsage);
  pMesh.frustumCulled = false; pMesh.count = 0;
  flowGroup.add(pMesh);
  const FLOWK = { 'bright-blue': 2.4, paper: 1.15, slate: 1.1, orange: 1.7, green: 1.6 };
  function buildFlows() {
    flowsBuilt = true;
    const monitored = [...objects.values()].filter(o => o.zone.group === 'office' && o.def.monitored !== false);
    for (const f of MAP.flows) {
      const pairs = f.auto === 'monitored' ? monitored.map(o => [o.id, f.to]) : f.links;
      for (const [a, b] of pairs) {
        const A = objects.get(a), B = objects.get(b);
        if (!A || !B) { console.warn('Flow link skipped:', a, b); continue; }
        const curve = arc(A.anchors[0], B.anchors[0]);
        const base = f.width ? .3 : .5;
        const mat = tubeMat(hdr(C[f.color], .9), base, reduced ? 0 : 3);
        flowGroup.add(new T.Mesh(new T.TubeGeometry(curve, 48, f.width || .03, 5, false), mat));
        links.push({ f, a, b, curve, len: curve.getLength(), mat, base, acc: Math.random(), pcol: hdr(C[f.color], FLOWK[f.color] || 1.5), phase: Math.random() * 6, dim: false });
      }
    }
    refreshFlowDims();
  }
  function refreshFlowDims() {
    for (const l of links) {
      const rel = !state.sel || l.a === state.sel || l.b === state.sel;
      l.dim = !rel;
      l.mat.uniforms.uOpacity.value = l.base * (rel ? (state.sel ? 1.7 : 1) : .1);
    }
  }
  function updatePackets(dt) {
    for (const l of links) {
      let rate = l.f.rate;
      if (l.f.burst) rate = Math.sin(time * 1.3 + l.phase) > .35 ? rate : 0;
      l.acc += rate * dt;
      while (l.acc >= 1) {
        l.acc -= 1;
        if (packets.length < PMAX) packets.push({ l, t: 0, dir: l.f.both && Math.random() < .5 ? -1 : 1, sp: l.f.speed || 5, s: l.f.size || 1 });
      }
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += dt * p.sp / p.l.len;
      if (p.t >= 1) { packets[i] = packets[packets.length - 1]; packets.pop(); }
    }
    let n = 0;
    for (const p of packets) {
      p.l.curve.getPointAt(p.dir > 0 ? p.t : 1 - p.t, _v);
      _m.makeScale(p.s, p.s, p.s).setPosition(_v);
      pMesh.setMatrixAt(n, _m);
      _c.copy(p.l.pcol); if (p.l.dim) _c.multiplyScalar(.08);
      pMesh.setColorAt(n, _c);
      n++;
    }
    pMesh.count = n;
    pMesh.instanceMatrix.needsUpdate = true;
    pMesh.instanceColor.needsUpdate = true;
  }

  /* threats */
  const threatMat = new T.MeshBasicMaterial({ color: hdr(C.red, 3), toneMapped: false, transparent: true });
  const threatGroup = new T.Group(); threatGroup.visible = false; flowGroup.add(threatGroup);
  const tparts = [.2, .14, .11, .08, .06].map(r => { const m = new T.Mesh(new T.IcosahedronGeometry(r, 0), threatMat); threatGroup.add(m); return m; });
  const shieldMat = new T.MeshBasicMaterial({ color: hdr(BB, 1.6), toneMapped: false, transparent: true, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
  const shield = new T.Mesh(new T.CircleGeometry(1.1, 6), shieldMat);
  const shieldEdgeMat = new T.LineBasicMaterial({ color: hdr(BB, 3), toneMapped: false, transparent: true });
  shield.add(new T.LineSegments(new T.EdgesGeometry(shield.geometry), shieldEdgeMat));
  shield.visible = false; scene.add(shield);
  const shardMat = new T.MeshBasicMaterial({ color: hdr(C.red, 2.4), toneMapped: false, transparent: true });
  const shards = Array.from({ length: 16 }, () => { const m = new T.Mesh(new T.TetrahedronGeometry(.09), shardMat); m.visible = false; scene.add(m); m.userData.v = new V3(); return m; });
  let threat = null, threatT = 1.5, threatI = 0, shieldT = -1, shardT = -1, socPulse = 0;
  /* Threats are always stopped OUTSIDE what they target: at the office's outer
     envelope, or just short of a cloud tile. Nothing red ever reaches the business. */
  const PERIM = new T.Box3(new V3(-13, -1, -9), new V3(13, 4.6, 9));
  function stopT(curve, box) {
    const N = 240;
    for (let i = 0; i <= N; i++) if (box.containsPoint(curve.getPointAt(i / N, _v))) return Math.max(0, (i - 3) / N);
    return .97;
  }
  const blockedEl = document.createElement('div');
  blockedEl.className = 'lbl blocked';
  blockedEl.innerHTML = '<div class="top"><span class="pill">Blocked</span><i class="leader"></i></div>';
  const blockedTag = new L.CSS2DObject(blockedEl); blockedTag.visible = false; scene.add(blockedTag);
  const zapMat = tubeMat(hdr(BB, 2), 1, 0, 1);
  let zap = null, zapT = -1;
  function launchThreat(v0, opts = {}) {
    const v = v0 || MAP.threats[threatI % MAP.threats.length];
    const O = MAP.dataView.origins, A = new V3(...O[(v.origin ?? threatI) % O.length]);
    threatI++;
    const tgt = objects.get(v.target);
    if (!tgt) return;
    const B = tgt.anchors[0].clone().add(new V3(0, .2, 0));
    const M = A.clone().lerp(B, .5); M.y = Math.max(A.y, B.y) + 7;
    const curve = new T.CatmullRomCurve3([A, M, B]);
    const box = tgt.zone.group === 'office' ? PERIM : tgt.box.clone().expandByScalar(1.1);
    const blocked = opts.blocked !== false;
    const stop = blocked ? stopT(curve, box) : 1;
    const P = curve.getPointAt(stop), from = curve.getPointAt(Math.max(0, stop - .05));
    if (reduced) { (blocked ? impact : breach)(P, from, v, tgt); if (opts.onDone) opts.onDone(); return; }
    threat = { curve, t: 0, stop, P, from, v, tgt, blocked, onDone: opts.onDone, len: curve.getLength() };
    threatGroup.visible = true;
  }
  function impact(P, from, v, tgt) {
    shield.position.copy(P);
    shield.lookAt(from);
    shield.scale.setScalar(1.6); shieldT = 0; shield.visible = true;
    if (!reduced) {
      shardT = 0;
      const back = from.clone().sub(P).normalize();
      for (const s of shards) { s.position.copy(P); s.userData.v.randomDirection().multiplyScalar(2 + Math.random() * 3).addScaledVector(back, 3); s.visible = true; }
    }
    blockedTag.position.copy(P).y += .4; blockedTag.visible = true; blockedEl.style.opacity = 1;
    if (socObj) {
      if (zap) { zap.geometry.dispose(); scene.remove(zap); }
      zap = new T.Mesh(new T.TubeGeometry(arc(socObj.anchors[0], P, .6), 48, .06, 6), zapMat);
      scene.add(zap); zapT = 0; zapMat.uniforms.uOpacity.value = 1;
    }
    if (tgt) tgt.pulse = 1;
    socPulse = 1;
    toast(v.text);
  }
  /* An unblocked hit. Only ever used in the optional "without CMIT" replay. */
  function breach(P, from, v, tgt) {
    if (!reduced) {
      shardT = 0;
      for (const s of shards) { s.position.copy(P); s.userData.v.randomDirection().multiplyScalar(1.5 + Math.random() * 2.5); s.visible = true; }
    }
    ring(P, 0, 'red'); ring(P, .25, 'red');
    if (tgt) { tgt.pulse = 1; setAlert(tgt, 1); }
    toast(v.text);
  }
  function updateThreats(dt) {
    threatT -= dt;
    if (threatT <= 0) { threatT = MAP.dataView.threatEvery; if (!live.running && recap.hidden && !threat) launchThreat(); }
    if (threat) {
      threat.t += dt * 10 / threat.len;
      if (threat.t >= threat.stop) {
        const th = threat; threat = null; threatGroup.visible = false;
        (th.blocked ? impact : breach)(th.P, th.from, th.v, th.tgt);
        if (th.onDone) th.onDone();
      }
      else tparts.forEach((m, i) => threat.curve.getPointAt(Math.max(0, threat.t - i * .012), m.position));
    }
  }
  function updateFx(dt) {
    if (zapT >= 0) {
      zapT += dt;
      const s = zapT / .8;
      if (s >= 1) { zapT = -1; if (zap) { zap.geometry.dispose(); scene.remove(zap); zap = null; } }
      else zapMat.uniforms.uOpacity.value = 1 - s;
    }
    if (blockedTag.visible) {
      const s = shieldT < 0 ? 1 : shieldT / (reduced ? 1.6 : 1.4);
      if (shieldT < 0) blockedTag.visible = false; else blockedEl.style.opacity = Math.min(1, 2 * (1 - s));
    }
    if (shieldT >= 0) {
      shieldT += dt;
      const dur = reduced ? 1.6 : 1.4, s = shieldT / dur;
      if (s >= 1) { shield.visible = false; shieldT = -1; }
      else { if (!reduced) shield.scale.setScalar(.9 + Math.min(1, s * 3) * 1.1); shieldMat.opacity = (1 - s) * .5; shieldEdgeMat.opacity = 1 - s * s; }
    }
    if (shardT >= 0) {
      shardT += dt;
      for (const s of shards) { s.userData.v.y -= 7 * dt; s.position.addScaledVector(s.userData.v, dt); s.rotation.x += dt * 6; s.rotation.y += dt * 4; }
      shardMat.opacity = Math.max(0, 1 - shardT / .9);
      if (shardT > .9) { shardT = -1; shards.forEach(s => { s.visible = false; }); }
    }
  }

  /* ---------- Live View: "A day at your office" ---------- */
  const LV = MAP.liveView;
  const hm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const DAY0 = hm(LV.dayStart);
  const EVENTS = LV.events.map(e => ({ ...e, m: (hm(e.at) - DAY0 + 1440) % 1440 })).sort((a, b) => a.m - b.m);
  const OBJ = id => objects.get(id);
  const PATCH_N = [...objects.values()].filter(o => o.zone.group === 'office' && !['staff', 'rack'].includes(o.id)).reduce((n, o) => n + o.anchors.length, 0);
  const live = { running: false, paused: false, mode: 'protected', t: 0, i: 0, busy: 0, active: null, stats: {},
    cages: [], tags: [], extras: [], timers: [], pend: [], camHold: 0, downAt: null, bob: null, walk: null, menuWasOpen: true };
  const exposed = () => live.mode === 'exposed';
  const anchorOf = (id, i = 0) => { const o = OBJ(id); return o ? o.anchors[Math.min(i, o.anchors.length - 1)].clone() : new V3(); };
  const boxOf = list => {
    const b = new T.Box3();
    for (const s of list) {
      const [id, i] = String(s).split('#'); const o = OBJ(id);
      if (o) b.union(i != null && o.iboxes[+i] ? o.iboxes[+i] : o.box);
    }
    return b;
  };
  const after = (sec, fn) => live.timers.push({ d: sec, fn });
  const bump = (k, v = 1) => { live.stats[k] = Math.round(((live.stats[k] || 0) + v) * 10) / 10; renderStats(); };
  const lines = e => (exposed() ? e.exposed : e.text).replace('{n}', PATCH_N);

  /* scene helpers */
  function setAlert(o, v) {
    if (!o) return;
    o.alert = v;
    o.mats.screen.color.copy(v ? C.red : BB).multiplyScalar(v ? .6 : .5);
  }
  function cage(id, i, bad) {
    const o = OBJ(id); if (!o) return;
    const b = (o.iboxes[i] || o.box).clone().expandByScalar(.12);
    const s = b.getSize(new V3());
    const m = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(s.x, s.y, s.z)),
      new T.LineBasicMaterial({ color: hdr(bad ? C.red : BB, 2.6), toneMapped: false, transparent: true }));
    b.getCenter(m.position); scene.add(m); live.cages.push(m);
  }
  function tag(pos, text, dur = 2.8, bad = false) {
    const el = document.createElement('div');
    el.className = 'lbl blocked' + (bad ? ' bad' : '');
    el.innerHTML = `<div class="top"><span class="pill">${esc(text)}</span><i class="leader"></i></div>`;
    const o = new L.CSS2DObject(el); o.position.copy(pos); o.position.y += .3; scene.add(o);
    live.tags.push({ o, el, life: dur, max: dur });
  }
  function burst(A, B, color, n = 10, speed = 7, gap = .1) {
    if (reduced) return;
    const curve = arc(A, B);
    const l = { curve, len: curve.getLength(), pcol: hdr(C[color], color === 'red' ? 3 : FLOWK[color] || 2), dim: false };
    for (let k = 0; k < n; k++) live.pend.push({ l, d: k * gap, sp: speed, s: 1.15 });
  }
  const ringGeo = new T.TorusGeometry(.55, .03, 6, 36);
  const rings = [];
  function ring(pos, delay = 0, color = 'bright-blue') {
    if (reduced) return;
    let r = rings.find(r => !r.on);
    if (!r) {
      if (rings.length > 90) return;
      const m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ toneMapped: false, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      m.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); r = { m }; rings.push(r);
    }
    r.on = true; r.t = -delay; r.m.position.copy(pos); r.m.material.color.copy(C[color]).multiplyScalar(2.2);
  }
  function beamLine(A, B, color, op = .8) {
    const mat = tubeMat(hdr(C[color], 1.2), op, reduced ? 0 : 4, 30);
    const m = new T.Mesh(new T.TubeGeometry(arc(A, B), 48, .04, 6), mat);
    scene.add(m); live.extras.push(m); return m;
  }
  const staff = OBJ('staff');
  const homeOf = i => { const a = staff.def.at[i]; return new V3(a[0], a[1], a[2]); };
  function setInst(o, i, pos, sc = 1) {
    _m2.makeScale(sc, sc, sc).setPosition(pos);
    for (const mesh of o.meshes) { _m.multiplyMatrices(_m2, mesh.userData.lm); mesh.setMatrixAt(i, _m); mesh.instanceMatrix.needsUpdate = true; }
  }
  const staffShow = on => { if (staff) staff.group.visible = on; };
  function direct(list, k = .9) {
    if (!live.running || state.sel || performance.now() < live.camHold) return;
    flyTo(viewForBox(boxOf(list), 10, k), 1.1);
  }

  /* event handlers: each plays both versions of the story */
  const HANDLERS = {
    open() { staffShow(true); },
    close(e) {
      staffShow(false);
      if (live.bob) live.bob = null;
      if (exposed() && live.downAt != null) bump('offline', Math.round((e.m - live.downAt) / 6) / 10);
    },
    helpdesk(e) {
      const who = `staff#${e.staff}`, pc = `workstations#${e.device}`;
      direct([who, pc, 'remote'], .8);
      live.bob = { i: e.staff, home: homeOf(e.staff) };
      tag(anchorOf('staff', e.staff), e.ask, 3);
      if (!exposed()) {
        after(1.4, () => burst(anchorOf('remote'), anchorOf('workstations', e.device), 'orange', 14, 8, .08));
        after(3.4, () => { tag(anchorOf('workstations', e.device), 'Fixed remotely', 2.6); live.bob = null; setInst(staff, e.staff, homeOf(e.staff)); bump('fixed'); OBJ('remote').pulse = 1; });
      } else {
        after(3.2, () => tag(anchorOf('staff', e.staff), 'Still waiting on IT', 4, true));
      }
    },
    threat(e) {
      direct([e.target], .55);
      launchThreat({ target: e.target, origin: e.origin, text: lines(e) }, {
        blocked: !exposed(),
        onDone: () => {
          if (!exposed()) { bump('blocked'); return; }
          bump('breaches');
          const B = anchorOf(e.target);
          if (e.victim != null) { burst(B, anchorOf('workstations', e.victim), 'red', 8); after(.9, () => cage('workstations', e.victim, true)); }
          if (e.spread) { burst(B, anchorOf(e.spread), 'red', 8); after(.9, () => setAlert(OBJ(e.spread), 1)); }
          after(1, () => tag(B, e.hit || 'Breached', 99, true));
        }
      });
    },
    ransomware(e) {
      direct(['firewall', 'workstations', 'server'], .75);
      launchThreat({ target: e.target, origin: e.origin, text: lines(e) }, {
        blocked: !exposed(),
        onDone: () => {
          if (!exposed()) { bump('blocked'); return; }
          bump('breaches');
          live.downAt = live.t;
          const ws = OBJ('workstations');
          burst(anchorOf('firewall'), anchorOf('workstations', e.victim), 'red', 10);
          after(.8, () => { cage('workstations', e.victim, true); setAlert(ws, 1); });
          const order = ws.anchors.map((_, i) => i).filter(i => i !== e.victim);
          order.forEach((i, k) => after(1.2 + k * .3, () => { burst(anchorOf('workstations', e.victim), anchorOf('workstations', i), 'red', 4, 9); cage('workstations', i, true); }));
          ['server', 'nas', 'backup'].forEach((id, k) => after(3.2 + k * .45, () => { burst(anchorOf('switch'), anchorOf(id), 'red', 6, 9); setAlert(OBJ(id), 1); cage(id, 0, true); }));
          after(4.8, () => tag(new V3(0, 3.6, -3), 'Office offline', 99, true));
        }
      });
    },
    restore() {
      direct(['nas', 'cloudbackup'], .7);
      tag(anchorOf('nas'), 'Folder deleted', 2.2, true);
      if (!exposed()) {
        after(1.2, () => burst(anchorOf('cloudbackup'), anchorOf('nas'), 'bright-blue', 16, 9, .06));
        after(3, () => { tag(anchorOf('nas'), 'Restored', 2.6); OBJ('nas').pulse = 1; bump('fixed'); });
      } else {
        after(2.4, () => tag(anchorOf('nas'), 'No backup to restore', 4, true));
      }
    },
    offboard(e) {
      const i = e.staff, start = homeOf(i);
      direct([`staff#${i}`, 'badge', 'identity', 'email'], .7);
      const P = start.clone().add(new V3(0, 1.4, 0));
      const ends = ['identity', 'email', 'badge'].map(id => anchorOf(id));
      const bm = ends.map(B => beamLine(P, B, exposed() ? 'red' : 'paper', .7));
      tag(P, 'Last day', 2.2);
      const path = new T.CatmullRomCurve3([start, new V3(start.x, 0, -.6), new V3(6.2, 0, -.6), new V3(6.2, 0, 8.3), new V3(6.2, 0, 11.5)]);
      after(1.2, () => { live.walk = reduced ? null : { i, path, s: 0, d: 3.4 }; if (reduced) setInst(staff, i, start, 0); });
      if (!exposed()) {
        after(2.2, () => {
          bm.forEach(m => { m.userData.fade = 1; });
          ends.forEach((B, k) => after(k * .25, () => ring(B, 0)));
          tag(anchorOf('badge'), 'Access removed', 3);
          bump('fixed');
        });
      } else {
        after(2.4, () => { tag(anchorOf('identity'), 'Account still active', 99, true); bump('open'); });
      }
    },
    backup() {
      direct(['server', 'backup', 'cloudbackup'], .7);
      if (!exposed()) {
        burst(anchorOf('server'), anchorOf('backup'), 'paper', 8);
        burst(anchorOf('nas'), anchorOf('backup'), 'paper', 6);
        after(1.2, () => burst(anchorOf('backup'), anchorOf('cloudbackup'), 'paper', 12, 8, .07));
        after(3, () => { tag(anchorOf('cloudbackup'), 'Backup verified', 2.6); bump('backups'); });
      } else {
        after(1, () => tag(anchorOf('backup'), "Backup didn't run", 3.4, true));
      }
    },
    patch() {
      if (!state.sel && performance.now() >= live.camHold) flyTo(overviewView(), 1.1);
      if (!exposed()) {
        const src = anchorOf('remote');
        burst(src, anchorOf('firewall'), 'bright-blue', 10, 9, .06);
        for (const o of objects.values()) {
          if (o.zone.group !== 'office' || o.id === 'staff' || o.id === 'rack') continue;
          o.anchors.forEach(a => ring(a, .6 + a.distanceTo(src) / 14));
          after(1 + o.anchors[0].distanceTo(src) / 14, () => { o.pulse = 1; });
        }
        after(3.2, () => { tag(new V3(0, 4, 0), `${PATCH_N} devices updated`, 2.8); bump('updates', PATCH_N); });
      } else {
        after(1, () => { tag(new V3(0, 4, 0), `${PATCH_N} devices need updates`, 3.4, true); bump('unpatched', PATCH_N); });
      }
    }
  };

  /* HUD + recap */
  const hud = $('#hud'), recap = $('#recap');
  const fmt = m => { const t = (DAY0 + m) % 1440, h = Math.floor(t / 60), mm = Math.floor(t % 60); return `${(h % 12) || 12}:${String(mm).padStart(2, '0')}<small>${h < 12 ? 'AM' : 'PM'}</small>`; };
  let lastClock = '';
  function renderStats() {
    const set = LV.recap[live.mode].stats;
    $('#hud-stats').innerHTML = set.map(([k, label]) => `<div><b>${live.stats[k] || 0}</b><span>${esc(label)}</span></div>`).join('');
  }
  function renderHud() {
    const c = fmt(live.t);
    if (c !== lastClock) { $('#hud-clock').innerHTML = c; lastClock = c; }
    $('#hud-bar').style.width = (100 * live.t / 1440).toFixed(2) + '%';
  }
  function showRecap() {
    const R = LV.recap[live.mode];
    $('#recap-pre').textContent = R.preheader;
    $('#recap-h').textContent = R.title;
    $('#recap-body').textContent = R.body;
    $('#recap-stats').innerHTML = R.stats.map(([k, label]) => `<div><b>${live.stats[k] || 0}</b><span>${esc(label)}</span></div>`).join('');
    $('#recap-alt').textContent = R.alt;
    $('#recap-note').textContent = LV.note;
    recap.hidden = false; appEl.classList.add('recap-on');
    $('#recap-cta').focus({ preventScroll: true });
  }

  function clearWorld() {
    live.timers.length = 0; live.pend.length = 0;
    for (const m of live.cages) { m.geometry.dispose(); scene.remove(m); }
    for (const m of live.extras) { m.geometry.dispose(); scene.remove(m); }
    for (const t of live.tags) scene.remove(t.o);
    live.cages.length = live.extras.length = live.tags.length = 0;
    for (const r of rings) { r.on = false; r.m.visible = false; }
    for (const o of objects.values()) setAlert(o, 0);
    if (staff) { staff.def.at.forEach((_, i) => setInst(staff, i, homeOf(i))); staffShow(true); }
    live.bob = live.walk = null; live.downAt = null;
    threat = null; threatGroup.visible = false; packets.length = 0;
  }
  function liveStart(mode = 'protected') {
    clearWorld();
    Object.assign(live, { running: true, paused: false, mode, t: 0, i: 0, busy: 0, active: null, stats: {} });
    staffShow(false);
    recap.hidden = true; hud.hidden = false; appEl.classList.add('live-on'); appEl.classList.remove('recap-on');
    $('#hud-mode').textContent = mode === 'exposed' ? 'Without CMIT' : 'With CMIT';
    hud.classList.toggle('exposed', mode === 'exposed');
    $('#hud-pause').setAttribute('aria-label', 'Pause');
    $('#hud-pause').innerHTML = ICON.pause;
    renderStats(); renderHud();
    if (!isPhone() && !menu.classList.contains('collapsed')) { live.menuWasOpen = true; $('#menu-collapse').click(); }
    if (state.sel) closePanel(true);
    state.zone = null; syncMenu(); applyDims();
    flyTo(overviewView());
  }
  function liveEnd() {
    live.running = false;
    showRecap();
  }
  function liveStop() {
    live.running = false;
    clearWorld();
    hud.hidden = true; recap.hidden = true; appEl.classList.remove('live-on', 'recap-on');
    if (live.menuWasOpen && menu.classList.contains('collapsed') && !isPhone()) $('#menu-collapse').click();
    live.menuWasOpen = false;
  }
  function liveNext() {
    if (!live.running || live.busy > 0) return;
    const e = EVENTS[live.i];
    live.t = e ? e.m : 1440;
  }
  function livePause(force) {
    if (!live.running) return;
    live.paused = typeof force === 'boolean' ? force : !live.paused;
    $('#hud-pause').setAttribute('aria-label', live.paused ? 'Resume' : 'Pause');
    $('#hud-pause').innerHTML = live.paused ? ICON.play : ICON.pause;
  }

  function dayLight(m) {
    const h = ((DAY0 + m) % 1440) / 60;
    if (h >= 7 && h < 18) return 1;
    if (h >= 18 && h < 19.5) return 1 - (h - 18) / 1.5 * .55;
    if (h >= 5.5 && h < 7) return .45 + (h - 5.5) / 1.5 * .55;
    return .45;
  }

  function liveUpdate(dt) {
    /* timers and staged packets keep playing even between events */
    for (let i = live.timers.length - 1; i >= 0; i--) {
      const tm = live.timers[i]; tm.d -= dt;
      if (tm.d <= 0) { live.timers.splice(i, 1); tm.fn(); }
    }
    for (let i = live.pend.length - 1; i >= 0; i--) {
      const q = live.pend[i]; q.d -= dt;
      if (q.d <= 0) { live.pend.splice(i, 1); if (packets.length < PMAX) packets.push({ l: q.l, t: 0, dir: 1, sp: q.sp, s: q.s }); }
    }
    for (let i = live.tags.length - 1; i >= 0; i--) {
      const t = live.tags[i]; t.life -= dt;
      if (t.life <= 0) { scene.remove(t.o); live.tags.splice(i, 1); }
      else if (t.life < .4) t.el.style.opacity = t.life / .4;
    }
    for (const r of rings) {
      if (!r.on) continue;
      r.t += dt; if (r.t < 0) continue;
      const s = r.t / .9;
      if (s >= 1) { r.on = false; r.m.visible = false; continue; }
      r.m.visible = true; r.m.scale.setScalar(.3 + s * 1.8); r.m.material.opacity = 1 - s;
    }
    for (const m of live.extras) if (m.userData.fade) {
      m.userData.fade = Math.max(0, m.userData.fade - dt * .8);
      m.material.uniforms.uOpacity.value = .7 * m.userData.fade;
      if (!m.userData.fade) m.visible = false;
    }
    if (live.bob && staff && !reduced) {
      const p = live.bob.home.clone(); p.y += Math.abs(Math.sin(time * 6)) * .14; setInst(staff, live.bob.i, p);
    }
    if (live.walk && staff) {
      const w = live.walk; w.s += dt / w.d;
      if (w.s >= 1) { setInst(staff, w.i, w.path.getPointAt(1), 0); live.walk = null; }
      else setInst(staff, w.i, w.path.getPointAt(w.s));
    }

    if (!live.running || live.paused) return;
    /* an event isn't over until its attack has landed or been stopped */
    const rate = live.busy > 0 || threat ? LV.eventMinutesPerSecond : LV.minutesPerSecond;
    if (live.busy > 0) {
      live.busy -= dt;
      if (live.busy <= 0 && threat) live.busy = .05;
      if (live.busy <= 0 && live.active && !['open', 'close'].includes(live.active.type) && !state.sel && performance.now() >= live.camHold) flyTo(overviewView(), 1.3);
    }
    live.t = Math.min(1440, live.t + rate * dt);
    while (live.busy <= 0 && live.i < EVENTS.length && live.t >= EVENTS[live.i].m) {
      const e = EVENTS[live.i++];
      live.active = e; live.busy = e.dur || 4.5;
      toast(lines(e));
      if (HANDLERS[e.type]) HANDLERS[e.type](e);
    }
    renderHud();
    if (live.t >= 1440 && live.busy <= 0 && !live.timers.length && !threat && !live.pend.length) liveEnd();
  }

  $('#hud-pause').addEventListener('click', () => { poke(); livePause(); });
  $('#hud-next').addEventListener('click', () => { poke(); liveNext(); });
  $('#hud-restart').addEventListener('click', () => { poke(); liveStart(live.mode); });
  $('#recap-replay').addEventListener('click', () => liveStart(live.mode));
  $('#recap-alt').addEventListener('click', () => liveStart(exposed() ? 'protected' : 'exposed'));
  $('#recap-close').addEventListener('click', () => { recap.hidden = true; hud.hidden = true; appEl.classList.remove('live-on', 'recap-on'); clearWorld(); flyTo(overviewView()); });
  controls.addEventListener('start', () => { live.camHold = performance.now() + 12000; });

  function toggleData(force, ambient) {
    state.data = typeof force === 'boolean' ? force : !state.data;
    $('#tg-data').setAttribute('aria-checked', state.data);
    if (state.data && !flowsBuilt) buildFlows();
    flowGroup.visible = state.data;
    const lg = $('#legend'); lg.classList.toggle('on', state.data); lg.setAttribute('aria-hidden', !state.data);
    if (!state.data) { packets.length = 0; pMesh.count = 0; threat = null; threatGroup.visible = false; blockedTag.visible = false; liveStop(); }
    else { threatT = 1.2; if (!ambient) liveStart('protected'); }
    for (const o of objects.values()) o.alpha = -1;
    applyDims();
  }
  function toggleComp(force) {
    state.comp = typeof force === 'boolean' ? force : !state.comp;
    $('#tg-comp').setAttribute('aria-checked', state.comp);
    if (state.sel) openPanel(objects.get(state.sel), false);
    applyDims();
  }
  $('#tg-data').addEventListener('click', () => { poke(); toggleData(); });
  $('#tg-comp').addEventListener('click', () => { poke(); toggleComp(); });
  $('#legend-list').innerHTML = MAP.flows.map(f => `<li><i style="background:var(--cmit-${f.color})"></i>${esc(f.label)}</li>`).join('') +
    `<li><i style="background:var(--cmit-red)"></i>Threat blocked</li>`;

  let toastTimer = 0;
  function toast(t) {
    $('#toast-text').textContent = t;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3600);
  }

  /* ---------- truck ---------- */
  const truck = objects.get('truck');
  const drive = truck && truck.def.drive ? new T.CatmullRomCurve3(truck.def.drive.map(([x, z]) => truck.base.clone().add(new V3(x, 0, z))), true, 'centripetal') : null;
  const driveLen = drive ? drive.getLength() : 1;
  const truckRot = truck ? truck.rig.rotation.y : 0;
  let driveU = 0;
  function updateTruck(dt) {
    if (!truck) return;
    const want = state.data && !reduced && drive;
    if (want || driveU > 0) {
      driveU += dt * 2.8 / driveLen;
      if (driveU >= 1) driveU = want ? driveU - 1 : 0;
    }
    if (driveU > 0 && drive) {
      drive.getPointAt(driveU, _v); truck.rig.position.set(_v.x, truck.base.y, _v.z);
      const tg = drive.getTangentAt(driveU); truck.rig.rotation.y = Math.atan2(-tg.z, tg.x);
    } else { truck.rig.position.copy(truck.base); truck.rig.rotation.y = truckRot; }
    if (!reduced) truck.rig.position.y = truck.base.y + Math.sin(time * 2.2) * .025;
    truck.mats.lightbar.color.copy(BB).multiplyScalar(1.2 + (reduced ? 0 : 1.6 * (.5 + .5 * Math.sin(time * 4))));
  }
  const socObj = objects.get('soc');

  /* ---------- labels per frame ---------- */
  function updateLabels() {
    for (const o of objects.values()) {
      const isSel = state.sel === o.id, isHov = state.hover === o.id;
      let show = (state.zone === o.zone.id && !state.sel) || isHov || isSel;
      let op = 1;
      if (show && !isSel && !isHov) {
        o.label.getWorldPosition(_v);
        op = clamp(1 - (_v.distanceTo(camera.position) - 18) / 28, 0, 1);
        if (op < .05) show = false;
      }
      if (o.label.visible !== show) o.label.visible = show;
      if (show && Math.abs(op - o.labelOp) > .02) { o.labelEl.style.opacity = op; o.labelOp = op; }
      const s = isSel ? 1 : 0;
      if (o.labelSel !== s) { o.labelEl.classList.toggle('sel', !!s); o.labelSel = s; }
      if (o.badge) { const bv = state.comp && !show; if (o.badge.visible !== bv) o.badge.visible = bv; }
    }
    const zs = !state.zone && !state.sel;
    for (const Z of zones.values()) if (Z.label.visible !== zs) Z.label.visible = zs;
    labelR.domElement.classList.toggle('comp', state.comp);
  }

  /* ---------- input ---------- */
  const cv = renderer.domElement;
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(x, y) {
    const r = cv.getBoundingClientRect();
    ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    return hits.length ? hits[0].object.userData.obj : null;
  }
  let down = null, moveQ = null;
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; poke(); if (state.engaged) controls.enableZoom = true; });
  cv.addEventListener('pointerup', e => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) { const id = pick(e.clientX, e.clientY); if (id) select(id); }
    down = null;
  });
  cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') moveQ = [e.clientX, e.clientY]; });
  cv.addEventListener('pointerleave', () => { moveQ = null; setHover(null); });
  cv.addEventListener('wheel', poke, { passive: true });
  /* Don't trap page scroll: wheel-zoom only after the visitor clicks into the scene. */
  document.documentElement.addEventListener('mouseleave', () => { controls.enableZoom = false; });

  const veil = $('#veil');
  function setEngaged(on) {
    state.engaged = on;
    veil.classList.toggle('on', !on && state.started);
    controls.enabled = on;
    controls.enableZoom = on;
  }
  veil.addEventListener('click', () => { poke(); setEngaged(true); });

  const fsBtn = $('#fs');
  if (!document.fullscreenEnabled) fsBtn.style.display = 'none';
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else appEl.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => fsBtn.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Full screen'));

  function key(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('textarea,input,select')) return;
    const k = e.key;
    let ok = true;
    if (k === '0') overview();
    else if (k === 'Escape') { if (!recap.hidden) $('#recap-close').click(); else if (state.sel) closePanel(); else if (menu.classList.contains('open')) setMenuSheet(false); else ok = false; }
    else if (/^[dDlL]$/.test(k)) toggleData();
    else if ((k === 'n' || k === 'N') && live.running) liveNext();
    else if ((k === 'p' || k === 'P') && live.running) livePause();
    else if (k === 'c' || k === 'C') toggleComp();
    else {
      const z = MAP.zones.find(z => z.hotkey === k);
      const d = allDefs.find(d => d.hotkey === k);
      if (z) focusZone(z.id); else if (d) select(d.id); else ok = false;
    }
    if (ok) { poke(); if (!state.engaged && state.started) setEngaged(true); }
  }

  /* ---------- sizing / visibility ---------- */
  function resize() {
    W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight);
    renderer.setSize(W, H); labelR.setSize(W, H); composer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    bloom.enabled = !isPhone();
    setShift(panel.classList.contains('open'));
    shiftX = tShiftX; shiftY = tShiftY; applyShift();
  }
  function applyShift() {
    if (Math.abs(shiftX) < .5 && Math.abs(shiftY) < .5) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); }
    else camera.setViewOffset(W, H, shiftX, shiftY, W, H);
  }
  new ResizeObserver(resize).observe(stage);
  let visible = true;
  new IntersectionObserver(es => {
    visible = es[es.length - 1].isIntersecting;
    if (!visible && state.started) setEngaged(false);
    wake();
  }, { threshold: 0 }).observe(appEl);
  document.addEventListener('visibilitychange', wake);
  RMQ.addEventListener('change', e => {
    reduced = e.matches;
    for (const m of timed) m.uniforms.uSpeed.value = reduced ? 0 : m.userData.speed;
    if (reduced) { packets.length = 0; pMesh.count = 0; controls.autoRotate = false; }
  });
  if (reduced) for (const m of timed) m.uniforms.uSpeed.value = 0;

  /* ---------- loop ---------- */
  let raf = 0, last = performance.now(), time = 0;
  function wake() {
    if (!raf && state.started && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function frame(now) {
    raf = 0;
    if (!state.started || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;

    if (moveQ && !down) { setHover(pick(moveQ[0], moveQ[1])); moveQ = null; }

    if (fly) {
      fly.s += dt / fly.d;
      const e = ease(Math.min(1, fly.s));
      camera.position.lerpVectors(fly.p0, fly.p1, e);
      controls.target.lerpVectors(fly.t0, fly.t1, e);
      if (fly.s >= 1) fly = null;
    }
    const idle = (now - lastInput) / 1000 > MAP.render.idleSeconds;
    controls.autoRotate = idle && !reduced && !state.sel && !state.zone && !fly;
    controls.update();

    const k = Math.min(1, dt * 7);
    shiftX += (tShiftX - shiftX) * k; shiftY += (tShiftY - shiftY) * k;
    applyShift();

    if (!reduced) for (const m of timed) m.uniforms.uTime.value = time;
    for (const o of objects.values()) {
      const hov = state.hover === o.id, sel = state.sel === o.id;
      o.lift += (((hov || sel) ? Math.max(.06, o.h * .05) : 0) - o.lift) * Math.min(1, dt * 10);
      o.group.position.y = o.lift;
      o.pulse = Math.max(0, o.pulse - dt * 1.3);
      o.mats.line.color.copy(BB).multiplyScalar(LINE_K * (1 + (hov ? .6 : 0) + (sel ? .3 : 0) + o.pulse * 1.4 + (o.unitGlow ? .8 : 0)));
      if (o.alert) o.mats.line.color.lerp(_c.copy(C.red).multiplyScalar(2.6 * (1 + o.pulse)), o.alert);
      o.alphaCur += (o.alphaTarget - o.alphaCur) * Math.min(1, dt * 8);
      if (Math.abs(o.alphaCur - o.alpha) > .004) setAlpha(o, o.alphaCur);
      if (o.tier === 'cloud') {
        const u = o.mats.holo.uniforms;
        if (!reduced) { u.uTime.value = time; o.rig.position.y = o.base.y + Math.sin(time * .8 + o.phase) * .12; }
        u.uHover.value += ((hov || sel ? 1 : 0) - u.uHover.value) * Math.min(1, dt * 8);
      }
    }
    updateTruck(dt);
    if (state.data) {
      liveUpdate(dt);
      if (!reduced) updatePackets(dt);
      updateThreats(dt);
    }
    updateFx(dt);
    const lk = (state.data ? .55 : 1) * (live.running ? dayLight(live.t) : 1);
    hemi.intensity = LIGHT.hemi * lk; sun.intensity = LIGHT.sun * lk;
    socPulse = Math.max(0, socPulse - dt * 1.1);
    if (socObj) socObj.mats.beacon.color.copy(C.red).multiplyScalar(1.2 + 4 * socPulse);

    updateLabels();
    if (bloom.enabled) composer.render(dt); else renderer.render(scene, camera);
    labelR.render(scene, camera);
  }

  function applyParams() {
    const f = params.get('focus'), views = (params.get('view') || '').split(',');
    if (views.includes('live')) toggleData(true);
    else if (views.includes('data')) toggleData(true, true);
    if (views.includes('compliance')) toggleComp(true);
    if (f) { if (objects.has(f)) select(f); else if (zones.has(f)) focusZone(f); }
  }

  resize();
  return {
    start(engaged) {
      if (state.started) { if (engaged) setEngaged(true); return; }
      state.started = true;
      resize();
      const v = overviewView();
      camera.position.copy(v.pos); controls.target.copy(v.target); controls.update();
      setEngaged(!!engaged);
      applyParams();
      wake();
    },
    focusMenu() { tree.querySelector('button')?.focus({ preventScroll: true }); },
    key,
    /* handy in the console: CMAP_API.select('firewall') */
    select, focusZone, overview, toggleData, toggleComp,
    live: { start: liveStart, next: liveNext, pause: livePause, stop: liveStop, state: live }
  };
}
window.CMAP_LOAD = load;
