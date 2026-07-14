/* ═══════════════════════════════════════════════
   RAZGON — живой фон hero: частицы + нейросеть
   в фирменной кислотной палитре. Ванильный JS.
   Пауза, когда hero вне экрана. Уважает reduced-motion.
   ═══════════════════════════════════════════════ */
'use strict';

(() => {
  const canvas = document.getElementById('heroFx');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.remove(); return; }

  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const TAU = Math.PI * 2;

  /* спрайт мягкого свечения */
  const glow = rgb => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${rgb}, 0.9)`);
    grad.addColorStop(0.3, `rgba(${rgb}, 0.3)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  };
  const sprAcid = glow('215, 255, 0');
  const sprWhite = glow('245, 245, 240');
  const sprDark = glow('10, 10, 10');       // для режима турбо (фон — кислотный)

  let W = 0, H = 0, DPR = 1;
  let parts = [], nodes = [], edges = [];

  const rnd = () => Math.random();

  function build() {
    const count = Math.min(70, Math.round((W * H) / (DPR * DPR) / 16000));
    parts = Array.from({ length: count }, () => ({
      x: rnd(), y: rnd(),
      ax: 10 + rnd() * 34, ay: 8 + rnd() * 26,
      sx: 0.05 + rnd() * 0.12, sy: 0.04 + rnd() * 0.1,   // частоты, Гц
      px: rnd() * TAU, py: rnd() * TAU,
      z: 0.25 + rnd() * 0.75,
      spr: rnd() < 0.8 ? sprAcid : sprWhite,
    }));
    const nCount = W / DPR < 720 ? 11 : 17;
    nodes = Array.from({ length: nCount }, () => ({
      x: 0.05 + rnd() * 0.9, y: 0.08 + rnd() * 0.84,
      a: rnd() * TAU, s: 0.05 + rnd() * 0.09, amp: 6 + rnd() * 12,
    }));
    edges = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = (nodes[i].y - nodes[j].y) * (H / Math.max(W, 1));
        if (Math.hypot(dx, dy) < 0.24) edges.push({ a: i, b: j, slot: rnd() });
      }
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = Math.max(1, Math.round(hero.clientWidth * DPR));
    H = canvas.height = Math.max(1, Math.round(hero.clientHeight * DPR));
    build();
  }
  resize();
  addEventListener('resize', resize);

  /* рисуем, только когда hero виден */
  let running = false, rafId = 0;
  const io = new IntersectionObserver(([e]) => {
    const vis = e.isIntersecting;
    if (vis && !running) { running = true; rafId = requestAnimationFrame(frame); }
    if (!vis) { running = false; cancelAnimationFrame(rafId); }
  }, { threshold: 0.02 });
  io.observe(hero);

  const CYCLE = 16;                       // с — цикл вспышек «API-связей»

  function frame(now) {
    if (!running) return;
    const t = now / 1000;
    const u = Math.min(W, H) / 1000;
    const turbo = document.body.classList.contains('turbo');
    const dotSpr = turbo ? sprDark : sprAcid;
    const lineC = turbo ? '10, 10, 10' : '245, 245, 240';
    const hotC = turbo ? '255, 77, 0' : '215, 255, 0';

    ctx.clearRect(0, 0, W, H);

    /* нейросеть */
    const np = nodes.map(n => ({
      x: (n.x + Math.sin(t * TAU * n.s + n.a) * 0.008) * W,
      y: (n.y + Math.cos(t * TAU * n.s * 0.8 + n.a) * 0.008) * H,
    }));
    for (const e of edges) {
      const A = np[e.a], B = np[e.b];
      const cyc = ((t / CYCLE + e.slot) % 1 + 1) % 1;
      const flash = Math.exp(-Math.pow((cyc > 0.5 ? 1 - cyc : cyc) / 0.012, 2));
      ctx.strokeStyle = `rgba(${lineC}, ${0.05 + flash * 0.3})`;
      ctx.lineWidth = (1 + flash) * u;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      if (cyc < 0.045) {                  // сигнал пробегает по связи
        const f = cyc / 0.045;
        const s = 34 * u;
        ctx.globalAlpha = Math.sin(f * Math.PI) * 0.9;
        ctx.fillStyle = `rgba(${hotC}, 1)`;
        ctx.drawImage(dotSpr, A.x + (B.x - A.x) * f - s / 2, A.y + (B.y - A.y) * f - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }
    for (const n of np) {
      const s = 20 * u;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(dotSpr, n.x - s / 2, n.y - s / 2, s, s);
    }

    /* частицы */
    for (const p of parts) {
      const x = p.x * W + Math.sin(t * TAU * p.sx + p.px) * p.ax * u * 2;
      const y = p.y * H + Math.cos(t * TAU * p.sy + p.py) * p.ay * u * 2;
      const s = (7 + 20 * p.z) * u;
      ctx.globalAlpha = 0.18 + p.z * 0.32;
      ctx.drawImage(turbo ? sprDark : p.spr, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(frame);
  }
})();
