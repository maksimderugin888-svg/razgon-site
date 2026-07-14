/* ═══════════════════════════════════════════════
   RAZGON — интерактив. Ванильный JS, ноль библиотек.
   ═══════════════════════════════════════════════ */
'use strict';

/* бот студии для заявок (@razgonstudio_bot) */
const TG_USERNAME = 'razgonstudio_bot';
const TG_URL = 'https://t.me/' + TG_USERNAME;
const PHONE = '+79995855877';

document.documentElement.classList.replace('no-js', 'js');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* все ссылки на Telegram — из одной константы */
document.querySelectorAll('.js-tg-link').forEach(a => { a.href = TG_URL; });

/* ── скрэмбл-расшифровка hero-заголовка ───────── */
(() => {
  const el = document.getElementById('heroTitle');
  if (!el || reduced) return;
  const finalText = el.textContent;
  const glyphs = 'ЦФРАБВГДЕЖЗИКЛМНОПСТУХ#%&@01?*<>/';
  const chars = [...finalText];
  let frame = 0;
  const settleAt = i => 8 + i * 2.2; // кадр, на котором буква встаёт на место

  const timer = setInterval(() => {
    frame++;
    let out = '';
    let done = true;
    chars.forEach((ch, i) => {
      if (ch === ' ' || frame >= settleAt(i)) {
        out += ch;
      } else {
        out += glyphs[(Math.random() * glyphs.length) | 0];
        done = false;
      }
    });
    el.textContent = out;
    if (done) clearInterval(timer);
  }, 34);
})();

/* ── кастомный курсор-прицел ──────────────────── */
(() => {
  if (!finePointer || reduced) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  addEventListener('mousemove', e => {
    /* курсор появляется только после первого движения мыши */
    if (!document.body.classList.contains('custom-cursor')) {
      rx = e.clientX; ry = e.clientY;
      document.body.classList.add('custom-cursor');
    }
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    if (document.body.classList.contains('turbo')) spawnTrail(mx, my);
  }, { passive: true });

  (function loop() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

  /* магнит над кликабельным */
  const hotSel = 'a, button, summary, label.switch';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hotSel)) ring.classList.add('cursor-hot');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hotSel)) ring.classList.remove('cursor-hot');
  });

  let trailBudget = 0;
  function spawnTrail(x, y) {
    if (++trailBudget % 3) return; // каждый третий пиксель пути
    const t = document.createElement('div');
    t.className = 'turbo-trail';
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 650);
  }
})();

/* ── прогресс скролла ─────────────────────────── */
(() => {
  const bar = document.getElementById('progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    bar.style.width = (p * 100).toFixed(2) + '%';
    bar.classList.toggle('progress-done', p > 0.98);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── шапка сжимается при скролле ──────────────── */
(() => {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── тикеры: бегут и меняют направление со скроллом ── */
(() => {
  if (reduced) return;
  const tracks = [...document.querySelectorAll('.ticker-track')];
  if (!tracks.length) return;
  let dir = 1, lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y;
  }, { passive: true });

  const state = tracks.map(el => ({ el, x: 0, base: parseFloat(el.dataset.speed || '1') }));
  (function loop() {
    const turbo = document.body.classList.contains('turbo') ? 2.6 : 1;
    for (const s of state) {
      const half = s.el.scrollWidth / 2;
      if (half > 0) {
        s.x -= s.base * dir * 0.9 * turbo;
        if (s.x <= -half) s.x += half;
        if (s.x > 0) s.x -= half;
        s.el.style.transform = `translate3d(${s.x}px, 0, 0)`;
      }
    }
    requestAnimationFrame(loop);
  })();
})();

/* ── появление блоков и заголовков ────────────── */
(() => {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .rl').forEach(el => io.observe(el));
})();

/* ── параллакс фоновых номеров секций ─────────── */
(() => {
  if (reduced) return;
  const nums = [...document.querySelectorAll('.sec-num')];
  if (!nums.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    for (const n of nums) {
      const r = n.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      n.style.transform = `translateY(${(r.top - innerHeight / 2) * -0.12}px)`;
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

/* ── числа набегают от нуля ───────────────────── */
(() => {
  const fmt = n => n.toLocaleString('ru-RU');
  const animate = el => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (reduced || target === 0) {
      el.textContent = prefix + fmt(target) + suffix;
      return;
    }
    const t0 = performance.now();
    const dur = 850;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
      el.textContent = prefix + fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
})();

/* ── процесс: подсветка активного шага ────────── */
(() => {
  const steps = [...document.querySelectorAll('.step')];
  const counter = document.getElementById('processCounter');
  if (!steps.length) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        steps.forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        if (counter) counter.textContent = e.target.dataset.step + ' / 04';
      }
    }
  }, { rootMargin: '-40% 0px -40% 0px' });
  steps.forEach(s => io.observe(s));
})();

/* ── 3D-наклон карточек кейсов ────────────────── */
(() => {
  if (!finePointer || reduced) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${px * 10}deg) rotateX(${py * -10}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ── смена «настроения» в прайсе ──────────────── */
(() => {
  const pricing = document.getElementById('pricing');
  if (!pricing) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) document.body.classList.toggle('money', e.isIntersecting);
  }, { threshold: 0.25 });
  io.observe(pricing);
})();

/* ── калькулятор сметы ────────────────────────── */
(() => {
  const boxes = [...document.querySelectorAll('.calc input[type="checkbox"]')];
  const sumEl = document.getElementById('calcSum');
  const cta = document.getElementById('calcCta');
  if (!boxes.length || !sumEl || !cta) return;

  const fmt = n => n.toLocaleString('ru-RU') + ' ₽';
  let shown = 0;
  let monthlySuffix = '';

  const rollTo = target => {
    if (reduced) {
      sumEl.textContent = 'от ' + fmt(target) + monthlySuffix;
      shown = target;
      return;
    }
    const from = shown;
    const t0 = performance.now();
    const dur = 500;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      shown = Math.round(from + (target - from) * eased);
      sumEl.textContent = 'от ' + fmt(shown) + monthlySuffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    sumEl.classList.remove('bump');
    void sumEl.offsetWidth; // перезапуск анимации
    sumEl.classList.add('bump');
  };

  /* боты не принимают t.me/…?text= — копируем заявку в буфер и открываем чат */
  let msg = '';
  const update = () => {
    const picked = boxes.filter(b => b.checked);
    if (!picked.length) {
      shown = 0;
      msg = '';
      monthlySuffix = '';
      sumEl.textContent = 'выберите, что нужно';
      return;
    }
    const total = picked.reduce((s, b) => s + parseInt(b.dataset.price, 10), 0);
    const monthly = picked.reduce((s, b) => s + parseInt(b.dataset.monthly || '0', 10), 0);
    monthlySuffix = monthly ? ' + ' + fmt(monthly) + '/мес' : '';
    rollTo(total);
    const names = picked.map(b => b.dataset.name).join(', ');
    msg = `Привет! Хочу: ${names}. Ориентир по смете: от ${fmt(total)}${monthlySuffix}. Когда созвон?`;
  };

  cta.addEventListener('click', () => {
    if (msg && navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
  });

  boxes.forEach(b => b.addEventListener('change', update));
})();

/* ── пульс студии: ближайший свободный слот ───── */
(() => {
  const el = document.getElementById('slotDate');
  if (!el) return;
  const d = new Date();
  d.setDate(d.getDate() + 6);
  el.textContent = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
})();

/* ── счётчик «бот ответил бы N клиентам» ──────── */
(() => {
  const el = document.getElementById('botCounter');
  if (!el) return;
  let n = 0;
  setInterval(() => {
    n += 1;
    el.textContent = n.toLocaleString('ru-RU');
  }, 2400);
})();

/* ── РЕЖИМ ТУРБО: 5 быстрых кликов по лого ────── */
(() => {
  const logo = document.getElementById('logo');
  if (!logo) return;
  let clicks = [];
  logo.addEventListener('click', () => {
    if (document.body.classList.contains('turbo')) {
      document.body.classList.remove('turbo');
      clicks = [];
      return;
    }
    const now = performance.now();
    clicks = clicks.filter(t => now - t < 2500);
    clicks.push(now);
    if (clicks.length >= 5) {
      document.body.classList.add('turbo');
      clicks = [];
      console.log('%c РЕЖИМ ТУРБО ВКЛЮЧЁН ', 'background:#D7FF00;color:#0A0A0A;font-weight:bold;font-size:16px');
    }
  });
})();

/* ── терминал-лог в футере ────────────────────── */
(() => {
  const el = document.getElementById('termLog');
  if (!el) return;
  const lines = [
    '> deploy razgon.site .......... ok',
    '> bots online ................. 17',
    '> demo pipeline ............... 48h',
    '> клиент доволен .............. true',
  ];
  if (reduced) {
    el.textContent = lines.join('\n');
    return;
  }
  let li = 0, ci = 0, out = '';
  (function type() {
    if (li >= lines.length) return;
    const line = lines[li];
    if (ci < line.length) {
      out += line[ci++];
      el.textContent = out;
      setTimeout(type, 26);
    } else {
      out += '\n';
      li++; ci = 0;
      setTimeout(type, 420);
    }
  })();
})();
