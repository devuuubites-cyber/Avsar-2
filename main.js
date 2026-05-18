/* ===== nav scroll state ===== */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40));

/* ===== day / night theme ===== */
const themeBtn = document.getElementById('themeToggle');
const dropCaption = document.getElementById('dropCaption');
let isDay = localStorage.getItem('theme') === 'day';
function applyTheme() {
  document.body.classList.toggle('day', isDay);
  dropCaption.textContent = isDay ? 'want to switch to night mode?' : 'want to switch to day mode?';
  if (window.recolorScenes) window.recolorScenes(isDay);
}
applyTheme();
themeBtn.addEventListener('click', () => {
  isDay = !isDay;
  localStorage.setItem('theme', isDay ? 'day' : 'night');
  applyTheme();
});

/* ===== scroll reveal ===== */
const revealEls = document.querySelectorAll(
  '.step,.feature-card,.uc-card,.sc-card,.min-card,.band-head,.quote-inner,.showcase-head'
);
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .15 });
revealEls.forEach(el => io.observe(el));

/* ===== WebGL scenes ===== */
if (window.THREE) {
  const scenes = [];

  function makeScene(canvas, build) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 9;
    const ctx = { renderer, scene, camera, t: 0 };
    build(ctx);
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize(); addEventListener('resize', resize);
    scenes.push(ctx);
    return ctx;
  }

  function particleField(scene, count, spread, colorA, colorB) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const a = new THREE.Color(colorA), b = new THREE.Color(colorB), c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      c.copy(a).lerp(b, Math.random());
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }

  /* --- hero: glowing core + orbiting particles --- */
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) makeScene(heroCanvas, ctx => {
    ctx.scene.fog = new THREE.FogExp2(0x080611, 0.06);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.4, 1),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.5 })
    );
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshBasicMaterial({ color: 0xff5fa6, wireframe: true, transparent: true, opacity: 0.7 })
    );
    ctx.scene.add(core, inner);
    const field = particleField(ctx.scene, 1400, 22, 0xff5fa6, 0x7c5cff);
    let mx = 0, my = 0;
    addEventListener('mousemove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); });
    ctx.update = () => {
      core.rotation.y += 0.0025; core.rotation.x += 0.0012;
      inner.rotation.y -= 0.004; inner.rotation.z += 0.002;
      field.rotation.y += 0.0006;
      ctx.camera.position.x += (mx * 2 - ctx.camera.position.x) * 0.04;
      ctx.camera.position.y += (-my * 1.4 - ctx.camera.position.y) * 0.04;
      ctx.camera.lookAt(0, 0, 0);
    };
  });

  /* --- quote: faint drifting particles --- */
  const quoteCanvas = document.getElementById('quote-canvas');
  if (quoteCanvas) makeScene(quoteCanvas, ctx => {
    const field = particleField(ctx.scene, 700, 26, 0xa855f7, 0xff5fa6);
    ctx.update = () => { field.rotation.y += 0.0009; field.rotation.x += 0.0003; };
  });

  /* --- footer: underwater upward drift --- */
  const footCanvas = document.getElementById('footer-canvas');
  if (footCanvas) makeScene(footCanvas, ctx => {
    ctx.scene.fog = new THREE.FogExp2(0x06121f, 0.05);
    const field = particleField(ctx.scene, 1600, 24, 0x33d6ff, 0x7c5cff);
    const pos = field.geometry.attributes.position;
    ctx.update = () => {
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + 0.012;
        if (y > 12) y = -12;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      field.rotation.y += 0.0005;
    };
  });

  window.recolorScenes = day => {
    scenes.forEach(c => {
      if (c.scene.fog) c.scene.fog.color.set(day ? 0xeef1fb : (c.scene === scenes[2]?.scene ? 0x06121f : 0x080611));
      c.scene.traverse(o => {
        if (o.isPoints) o.material.opacity = day ? 0.45 : 0.85;
        if (o.isMesh && o.material.wireframe) o.material.opacity = day ? 0.28 : (o.material.color.getHex() === 0xff5fa6 ? 0.7 : 0.5);
      });
    });
  };
  window.recolorScenes(document.body.classList.contains('day'));

  (function loop() {
    requestAnimationFrame(loop);
    scenes.forEach(c => { c.t += 0.016; if (c.update) c.update(); c.renderer.render(c.scene, c.camera); });
  })();
}
