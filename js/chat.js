/* ═══════════════════════════════════════════════
   RAZGON — чат-помощник на сайте (демо ИИ-сотрудника).
   Мгновенные ответы на типовые вопросы из базы знаний,
   нестандартное — передаём в Telegram-бота (TG_URL из main.js).
   ═══════════════════════════════════════════════ */
'use strict';

(() => {
  /* ── разметка ─────────────────────────────── */
  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Открыть чат с помощником');
  fab.innerHTML = '<span class="chat-fab-icon">⚡</span>';

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="chat-head">
      <div>
        <p class="chat-title">RAZGON · помощник</p>
        <p class="chat-status mono"><span class="chat-dot"></span>онлайн · отвечает мгновенно</p>
      </div>
      <button class="chat-close" type="button" aria-label="Закрыть чат">✕</button>
    </div>
    <div class="chat-msgs" role="log" aria-live="polite"></div>
    <div class="chat-chips"></div>
    <form class="chat-form">
      <input type="text" placeholder="Спросите о ценах, сроках…" maxlength="300" aria-label="Ваш вопрос">
      <button type="submit" aria-label="Отправить">→</button>
    </form>`;
  document.body.append(fab, panel);

  const msgs = panel.querySelector('.chat-msgs');
  const chipsEl = panel.querySelector('.chat-chips');
  const form = panel.querySelector('.chat-form');
  const input = form.querySelector('input');

  /* ── база знаний ──────────────────────────── */
  const tg = typeof TG_URL !== 'undefined' ? TG_URL : 'https://t.me/razgonstudio_bot';
  const KB = [
    { re: /(сколько|цен|стоит|стоимост|прайс|дорого|бюджет)/i, a: 'Боты и сайты — от 60 000 ₽, ИИ-контент — от 40 000 ₽, игры и голосовой ИИ — от 120 000 ₽, ИИ-сотрудник — от 15 000 ₽/мес. Точную цену фиксируем после 30-минутного созвона — и она не «плывёт». Быстрый расчёт — в калькуляторе в разделе «Прайс».', cta: true },
    { re: /(срок|когда|быстро|долго|скольк.*дн|скольк.*недел)/i, a: 'Первое живое демо — через 48 часов после старта. Бот или лендинг под ключ — 7–10 дней, магазин или игра — от 2–3 недель.' },
    { re: /(гарант|возврат|кинете|обман|риск|договор)/i, a: 'Три железные гарантии по договору: не зашло первое демо — вернём предоплату; просрочили — минус 10% от чека за каждую неделю; код и доступы ваши с первого дня.' },
    { re: /(бот|телеграм|telegram|автоматизац)/i, a: 'Делаем Telegram-ботов под ключ: магазины в боте, запись клиентов, рассылки, связки с CRM и оплатой. От 60 000 ₽, запуск за 7–10 дней. Робот продаёт, пока вы спите.' },
    { re: /(сайт|лендинг|магазин|приложени|saas)/i, a: 'Сайты — от лендинга за неделю (от 70 000 ₽) до магазина и SaaS (от 180 000 ₽). Быстрые, продающие, с аналитикой с первого дня. Этот сайт — наша работа, вы смотрите на демо качества.' },
    { re: /(контент|видео|ролик|песн|музык|аватар|нейро)/i, a: 'ИИ-контент-завод: ролики, треки и нейро-аватары под ваш бренд — десятками в месяц, от 40 000 ₽. Наш кейс: 90 роликов в месяц силами одного человека.' },
    { re: /(игр|mini app|мини-приложени)/i, a: 'Игры и Telegram Mini Apps — от 120 000 ₽, от двух недель. Наш кейс: мини-игра для сети кофеен — 4 200 игроков за неделю без бюджета на рекламу.' },
    { re: /(сотрудник|подписк|24|нейро-продавец|ии-менеджер)/i, a: 'ИИ-сотрудник — нейро-продавец, который отвечает клиентам за 5 секунд в любое время суток, квалифицирует и дожимает. Внедрение от 60 000 ₽ + от 15 000 ₽/мес. Окупается за 4–6 месяцев. Кстати, я — его мини-демо.' },
    { re: /(звон|голос|колл|телефон)/i, a: 'Голосовой ИИ принимает звонки, записывает клиентов и отвечает голосом — минус 40% нагрузки на операторов. От 120 000 ₽. А позвонить нам можно по +7 999 585-58-77.' },
    { re: /(привет|здравств|добрый|хай|ку)/i, a: 'Привет! Я помощник RAZGON — мини-демо нашего ИИ-сотрудника. Спрашивайте про цены, сроки и гарантии — отвечаю мгновенно. Нестандартный вопрос передам команде.' },
    { re: /(кто вы|о вас|команда|опыт|давно)/i, a: 'RAZGON — студия цифровых технологий полного цикла: боты, сайты, ИИ-контент, игры, ИИ-сотрудники. Работаем без «менеджеров-прокладок»: вы видите команду в общем чате с первого дня.' },
    { re: /(связ|контакт|созвон|написать|менеджер|человек)/i, a: 'Живая команда отвечает за 15 минут в рабочее время: жмите кнопку ниже — откроется наш Telegram. Или звоните: +7 999 585-58-77.', cta: true },
  ];
  const FALLBACK = { a: 'Хороший вопрос — такое лучше обсудить с командой напрямую. Жмите кнопку — отвечаем за 15 минут в рабочее время. Или звоните: +7 999 585-58-77.', cta: true };
  const CHIPS = ['Сколько стоит?', 'Какие сроки?', 'Какие гарантии?', 'Что такое ИИ-сотрудник?', 'Связаться с командой'];

  /* ── логика чата ──────────────────────────── */
  const addMsg = (who, text, withCta) => {
    const m = document.createElement('div');
    m.className = 'chat-msg chat-msg-' + who;
    m.textContent = text;
    if (withCta) {
      const a = document.createElement('a');
      a.href = tg;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'chat-cta';
      a.textContent = 'Открыть Telegram →';
      m.appendChild(a);
    }
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  };

  const answer = q => {
    const hit = KB.find(k => k.re.test(q)) || FALLBACK;
    const typing = addMsg('bot', '…');
    typing.classList.add('chat-typing');
    setTimeout(() => {
      typing.classList.remove('chat-typing');
      typing.textContent = hit.a;
      if (hit.cta) {
        const a = document.createElement('a');
        a.href = tg;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'chat-cta';
        a.textContent = 'Открыть Telegram →';
        typing.appendChild(a);
      }
      msgs.scrollTop = msgs.scrollHeight;
    }, 550);
  };

  const ask = q => {
    addMsg('user', q);
    answer(q);
  };

  CHIPS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-chip mono';
    b.textContent = c;
    b.addEventListener('click', () => ask(c));
    chipsEl.appendChild(b);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });

  let greeted = false;
  const toggle = open => {
    panel.hidden = !open;
    fab.classList.toggle('chat-fab-open', open);
    if (open && !greeted) {
      greeted = true;
      addMsg('bot', 'Привет! Я помощник RAZGON — мини-демо нашего ИИ-сотрудника прямо на сайте. Отвечаю на типовые вопросы мгновенно, нестандартные — передаю живой команде. С чего начнём?');
    }
    if (open) input.focus({ preventScroll: true });
  };
  fab.addEventListener('click', () => toggle(panel.hidden));
  panel.querySelector('.chat-close').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) toggle(false);
  });
})();
