/* ═══════════════════════════════════════════════
   RAZGON — квиз-подбор решения за 4 вопроса.
   Использует TG_URL из main.js (подключается после него).
   ═══════════════════════════════════════════════ */
'use strict';

(() => {
  const box = document.getElementById('quizBox');
  if (!box) return;
  const stepEl = document.getElementById('quizStep');
  const backBtn = document.getElementById('quizBack');
  const qEl = document.getElementById('quizQ');
  const optsEl = document.getElementById('quizOpts');
  const resEl = document.getElementById('quizResult');
  const titleEl = document.getElementById('quizTitle');
  const descEl = document.getElementById('quizDesc');
  const priceEl = document.getElementById('quizPrice');
  const cta = document.getElementById('quizCta');
  const restart = document.getElementById('quizRestart');

  const QUESTIONS = [
    {
      q: 'Что вам нужно?',
      opts: [
        ['bot', 'Telegram-бот'],
        ['site', 'Сайт / лендинг'],
        ['app', 'Магазин / веб-приложение'],
        ['content', 'ИИ-контент: видео, песни'],
        ['game', 'Игра / Mini App'],
        ['staff', 'ИИ-сотрудник 24/7'],
        ['idk', 'Не знаю — подскажите'],
      ],
    },
    {
      q: 'Какой у вас бизнес?',
      opts: [
        ['retail', 'Торговля / доставка'],
        ['service', 'Услуги / запись клиентов'],
        ['edu', 'Обучение / курсы'],
        ['creator', 'Контент / блог'],
        ['other', 'Другое'],
      ],
    },
    {
      q: 'Когда нужен запуск?',
      opts: [
        ['asap', 'Вчера 🔥'],
        ['month', 'В этом месяце'],
        ['quarter', 'В ближайшие месяцы'],
        ['explore', 'Пока изучаю'],
      ],
    },
    {
      q: 'Какой бюджет закладываете?',
      opts: [
        ['b1', 'До 60 000 ₽'],
        ['b2', '60–150 тыс ₽'],
        ['b3', '150–400 тыс ₽'],
        ['b4', '400 тыс ₽ и больше'],
        ['b0', 'Пока не знаю'],
      ],
    },
  ];

  /* базовые решения по первому ответу */
  const SOLUTIONS = {
    bot: { name: 'Telegram-бот под ключ', price: 'от 60 000 ₽', term: '7–10 дней',
      desc: 'Бот принимает заказы, отвечает клиентам и собирает заявки, пока вы спите.' },
    site: { name: 'Продающий сайт', price: 'от 70 000 ₽', term: 'от 7 дней',
      desc: 'Быстрый сайт с аналитикой и заявками с первого дня — как этот, только под ваш бизнес.' },
    app: { name: 'Магазин / веб-приложение', price: 'от 180 000 ₽', term: 'от 3 недель',
      desc: 'Полноценный продукт: каталог, оплата, личный кабинет, админка.' },
    content: { name: 'ИИ-контент-завод', price: 'от 40 000 ₽', term: 'от 3 дней',
      desc: 'Ролики, треки и нейро-аватары под ваш бренд — десятками в месяц.' },
    game: { name: 'Игра / Telegram Mini App', price: 'от 120 000 ₽', term: 'от 2 недель',
      desc: 'Аудитория играет — бренд запоминается. Механики удержания, призы, рейтинги.' },
    staff: { name: 'ИИ-сотрудник 24/7', price: 'от 60 000 ₽ + от 15 000 ₽/мес', term: 'от 7 дней',
      desc: 'Нейро-продавец отвечает за 5 секунд в любое время, квалифицирует и дожимает. Окупаемость 4–6 месяцев.' },
    idk: { name: 'Связка под вашу задачу', price: 'посчитаем на созвоне', term: 'первое демо — 48 часов',
      desc: 'За 30 минут созвона разберём, что даст максимум эффекта, и зафиксируем цену письменно.' },
  };

  const BUSINESS_HINT = {
    retail: 'Для торговли и доставки чаще всего заходит связка «бот приёма заказов + ИИ-сотрудник»: ноль пропущенных заявок.',
    service: 'Для сферы услуг сильнее всего работает автозапись: клиент записывается сам, бот напоминает и возвращает.',
    edu: 'Для школ и курсов: бот-воронка продаёт, ИИ-контент наполняет соцсети, сайт собирает оплату.',
    creator: 'Для креаторов: ИИ-конвейер контента — 90 роликов в месяц силами одного человека (наш кейс).',
    other: 'На созвоне подскажем, что сработает именно в вашей нише — бесплатно и без обязательств.',
  };

  let step = 0;
  const answers = [];

  const render = () => {
    const done = step >= QUESTIONS.length;
    resEl.hidden = !done;
    qEl.hidden = done;
    optsEl.hidden = done;
    backBtn.hidden = step === 0 || done;
    if (done) { showResult(); return; }
    stepEl.textContent = `вопрос ${step + 1} / ${QUESTIONS.length}`;
    qEl.textContent = QUESTIONS[step].q;
    optsEl.innerHTML = '';
    for (const [key, label] of QUESTIONS[step].opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = label;
      b.addEventListener('click', () => {
        answers[step] = { key, label };
        answers.length = step + 1;
        step++;
        render();
      });
      optsEl.appendChild(b);
    }
  };

  const showResult = () => {
    stepEl.textContent = 'готово';
    const [need, biz, when, budget] = answers;
    let sol = SOLUTIONS[need.key];

    /* апгрейд по бюджету: связки и турбо */
    if (budget.key === 'b3' && ['bot', 'site', 'content', 'idk'].includes(need.key)) {
      sol = { name: 'Пакет «РАЗГОН»: сайт + бот + ИИ-контент', price: 'от 170 000 ₽', term: 'от 2 недель',
        desc: 'Система целиком: сайт приводит, бот дожимает, контент прогревает. Дешевле, чем по частям.' };
    } else if (budget.key === 'b4') {
      sol = { name: 'Пакет «ТУРБО»: продукт под ключ', price: 'от 400 000 ₽', term: 'демо каждые 48 часов',
        desc: 'Выделенная команда только под вас: магазин, SaaS, игра — любой сложности.' };
    }

    const urgency = when.key === 'asap'
      ? 'Стартуем на этой неделе: созвон сегодня-завтра, первое демо — через 48 часов.'
      : when.key === 'explore'
        ? 'Спешки нет — посчитаем смету, зафиксируем цену, а стартовать можно когда угодно: цена не «протухнет».'
        : 'Первое живое демо покажем через 48 часов после старта.';

    titleEl.textContent = sol.name;
    descEl.textContent = `${sol.desc} ${BUSINESS_HINT[biz.key]} ${urgency}`;
    priceEl.textContent = `ориентир: ${sol.price} · срок: ${sol.term}`;

    const msg = `Привет! Прошёл подбор на сайте. Нужно: ${need.label}. Бизнес: ${biz.label}. `
      + `Запуск: ${when.label.replace(' 🔥', '')}. Бюджет: ${budget.label}. `
      + `Предложили: ${sol.name} (${sol.price}). Жду расчёт и мини-аудит!`;
    cta.onclick = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(() => {});
    };
  };

  backBtn.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  restart.addEventListener('click', () => { step = 0; answers.length = 0; render(); });
  render();
})();
