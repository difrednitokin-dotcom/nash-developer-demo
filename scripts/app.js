(function () {
  'use strict';
  const D = window.NDDemo;
  const UI = window.NDUI;
  const page = document.body.dataset.page;
  const key = 'nd-template:v1';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = x => new Intl.NumberFormat('ru-RU').format(x) + ' ₸';
  const icon = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons/tabler-sprite.svg#${n}"/></svg>`;
  const avatar = role => {
    const [image, initials, label] = { customer:['maxleiter','ДС','Демо-аватар заказчика'], contractor:['shadcn','АК','Демо-аватар исполнителя'], admin:['evilrabbit','ND','Демо-аватар администратора'] }[role];
    return `<span class="avatar avatar-photo" data-demo-avatar role="img" aria-label="${label}"><span class="avatar-fallback" aria-hidden="true">${initials}</span><img class="avatar-image" src="assets/avatars/${image}.png" alt="" width="36" height="36" decoding="async"></span>`;
  };
  let storageAvailable = true, generated = false, toastTimer;
  let syncRequestState = () => {};
  let state;
  try {
    const raw = localStorage.getItem(key);
    state = raw === null ? D.example() : (D.restore(raw) || D.empty());
    if (new URLSearchParams(location.search).get('example') === '1') state = D.example();
  } catch { storageAvailable = false; state = D.example(); }

  function toast(text) {
    const el = $('#toast'); if (!el) return;
    clearTimeout(toastTimer); el.textContent = text; el.hidden = false;
    toastTimer = setTimeout(() => { el.hidden = true; }, 4500);
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { if (storageAvailable) toast('Сохранение недоступно: изменения останутся до обновления страницы.'); storageAvailable = false; }
  }
  function dispatch(action, message) {
    const next = D.transition(state, action);
    if (next === state) { toast('Это действие пока недоступно на текущем этапе.'); return false; }
    state = next; save(); render(); if (message) toast(message); return true;
  }
  function confirmAction(title, text, buttonText = 'Продолжить') {
    const dialog = $('#confirm-dialog');
    if (dialog.open) return Promise.resolve(false);
    $('#confirm-title').textContent = title; $('#confirm-copy').textContent = text;
    $('[data-dialog="confirm"]').textContent = buttonText;
    dialog.returnValue = ''; dialog.showModal();
    return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once:true }));
  }
  $$('[data-dialog]').forEach(b => b.addEventListener('click', () => $('#confirm-dialog').close(b.dataset.dialog)));

  const sidebar = $('#app-sidebar'), sidebarButton = $('[data-menu="sidebar"]'), backdrop = $('[data-close-sidebar].menu-backdrop');
  function setSidebar(open, returnFocus = true) {
    if (!sidebar) return;
    const mobile = matchMedia('(max-width:1023px)').matches;
    sidebar.classList.toggle('is-open', open && mobile);
    sidebar.inert = mobile && !open;
    sidebarButton?.setAttribute('aria-expanded', String(open && mobile));
    if (backdrop) backdrop.hidden = !(open && mobile);
    document.body.classList.toggle('menu-open', open && mobile);
    if (open && mobile) { sidebar.setAttribute('role','dialog'); sidebar.setAttribute('aria-modal','true'); $('.sidebar-close')?.focus(); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); if (returnFocus && mobile) sidebarButton?.focus(); }
  }
  sidebarButton?.addEventListener('click', () => setSidebar(!sidebar.classList.contains('is-open')));
  $$('[data-close-sidebar]').forEach(b => b.addEventListener('click', () => setSidebar(false)));
  sidebar?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setSidebar(false, false)));
  matchMedia('(max-width:1023px)').addEventListener('change', () => setSidebar(false, false));
  setSidebar(false, false);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { setSidebar(false); setMarketingMenu(false); }
    if (e.key === 'Tab' && sidebar?.classList.contains('is-open')) {
      const focusable = [...sidebar.querySelectorAll('a[href],button:not(:disabled),select')].filter(x => x.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function setMarketingMenu(open) {
    const nav = $('#marketing-mobile'); if (!nav) return;
    nav.hidden = !open; $('[data-menu="marketing"]')?.setAttribute('aria-expanded', String(open));
  }
  $('[data-menu="marketing"]')?.addEventListener('click', () => setMarketingMenu($('#marketing-mobile').hidden));
  $('#marketing-mobile')?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMarketingMenu(false)));
  matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches) setMarketingMenu(false); });

  // Keep the next action near the page heading on a phone, in actual DOM order.
  const nextActionPanel = $('#action-panel');
  const actionHome = nextActionPanel?.parentElement;
  if (nextActionPanel && $('#project-content')) {
    const mobileSlot = document.createElement('div');
    mobileSlot.className = 'mobile-action-slot';
    $('#project-content').prepend(mobileSlot);
    const positionAction = () => {
      if (matchMedia('(max-width:767px)').matches) mobileSlot.append(nextActionPanel);
      else actionHome.prepend(nextActionPanel);
    };
    matchMedia('(max-width:767px)').addEventListener('change', positionAction);
    positionAction();
  }

  $('#role-picker')?.addEventListener('change', e => { location.href = e.target.value + '.html'; });
  function selectTab(name, focus = false) {
    const target = $(`[role="tab"][data-tab="${name}"]`); if (!target) return;
    $$('[role="tab"]').forEach(t => { const selected = t === target; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; });
    $$('[role="tabpanel"]').forEach(p => { p.hidden = p.id !== target.getAttribute('aria-controls'); });
    if (focus) target.focus();
  }
  $$('[role="tab"]').forEach(t => {
    t.addEventListener('click', () => selectTab(t.dataset.tab));
    t.addEventListener('keydown', e => {
      const tabs = $$('[role="tab"]'), i = tabs.indexOf(t);
      const target = e.key === 'ArrowRight' ? tabs[(i+1)%tabs.length] : e.key === 'ArrowLeft' ? tabs[(i-1+tabs.length)%tabs.length] : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs.at(-1) : null;
      if (target) { e.preventDefault(); selectTab(target.dataset.tab, true); }
    });
  });
  $$('[data-open-tab]').forEach(t => t.addEventListener('click', () => selectTab(t.dataset.openTab, true)));
  const hashTab = () => {
    const hash = location.hash.slice(1);
    const name = hash === 'documents' ? 'documents' : hash === 'queue' ? 'queue' : hash === 'team' ? 'team' : hash === 'payments' ? 'payments' : hash;
    selectTab(name);
  };
  addEventListener('hashchange', hashTab); hashTab();
  function requestTab(name) {
    $('#request-chat')?.classList.toggle('mobile-inactive', name !== 'chat');
    $('#request-spec')?.classList.toggle('mobile-inactive', name !== 'spec');
    $$('[data-request-tab]').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.requestTab === name)));
  }
  $$('[data-request-tab]').forEach(t => t.addEventListener('click', () => { requestTab(t.dataset.requestTab); if (t.dataset.requestTab === 'chat') $('#request-text')?.focus(); }));

  const taskSymbol = s => `<span class="task-symbol ${s}">${s === 'done' ? icon('check') : ''}</span>`;
  const taskSelect = t => `<select class="select" data-task="${esc(t.id)}" aria-label="Статус задачи: ${esc(t.title)}" ${state.order?.status !== 'in_progress' ? 'disabled' : ''}>${Object.entries(D.taskStatuses).map(([k,v]) => `<option value="${k}" ${k === t.status ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  const button = (label, action, primary = true) => `<button class="btn ${primary ? 'btn-primary' : 'btn-outline'}" data-action="${action}">${label}</button>`;
  const go = (label, href) => `<a class="btn btn-outline" href="${href}">${label}</a>`;
  function nextAction(o) {
    const c = {
      draft: ['Проверьте техническое задание','Уточните состав работ и согласуйте первую версию.',button('Согласовать ТЗ','approve')],
      agreed: ['Собираем команду','Следующий шаг — подбор исполнителя администратором.',go('Посмотреть роль администратора','admin.html')],
      staffing: ['Подбираем исполнителя','Администратор назначит специалиста из пула.',go('Посмотреть роль администратора','admin.html')],
      awaiting_payment: ['Заказ готов к старту','Отметьте тестовую оплату. Администратор подтвердит её вручную.',button('Я оплатил · демо','submit-payment')],
      payment_review: ['Оплата на проверке','Ожидается подтверждение администратора.',go('Посмотреть роль администратора','admin.html')],
      in_progress: ['Команда работает над проектом','Здесь появится приёмка, когда все задачи будут готовы.',go('Посмотреть задачи исполнителя','contractor.html')],
      review: ['Результат готов к проверке','Примите работу или отправьте конкретные замечания.',button('Принять работу','accept') + ' ' + button('На доработку','rework',false)],
      payout_pending: ['Работа принята','Начисление готово. Администратор отмечает тестовую выплату.',go('Посмотреть роль администратора','admin.html')],
      completed: ['Проект завершён','Результат принят, тестовая выплата отмечена.',go('Обсудить новый проект','request.html')]
    };
    const a = {
      draft: ['Ожидаем согласования ТЗ','Клиент проверяет черновик.',go('Открыть кабинет клиента','customer.html')],
      agreed: ['Начать подбор команды','Откройте заказ для назначения исполнителя. Telegram здесь имитируется.',button('Начать подбор','publish')],
      staffing: ['Назначить исполнителя','В демонстрационном пуле доступен Алексей Ким.',button('Назначить Алексея','assign')],
      awaiting_payment: ['Ожидаем отметку клиента','Клиент отправляет тестовую отметку об оплате.',go('Открыть кабинет клиента','customer.html')],
      payment_review: ['Проверить оплату','Подтвердите тестовое поступление. После этого откроются задачи.',button('Подтвердить оплату · демо','confirm-payment')],
      in_progress: ['Проект в работе','Сейчас задачи выполняет исполнитель.',go('Открыть кабинет исполнителя','contractor.html')],
      review: ['Ожидаем приёмку','Заказчик проверяет результат.',go('Открыть кабинет клиента','customer.html')],
      payout_pending: ['Отметить выплату','Начислено исполнителю 720 000 ₸. Это тестовое действие.',button('Отметить выплату · демо','payout')],
      completed: ['Заказ закрыт','Тестовые начисление и выплата совпадают.',go('Создать новый заказ','request.html')]
    };
    const executor = o.status === 'in_progress' ? ['Ваш следующий шаг','Обновляйте статусы задач по мере работы. После завершения всех задач заказ перейдёт на приёмку.',''] : o.status === 'review' ? ['Результат на приёмке','Дождитесь решения заказчика.',go('Посмотреть роль клиента','customer.html')] : ['Статус проекта',D.statuses[o.status],go('Открыть кабинет клиента','customer.html')];
    const content = page === 'admin' ? a[o.status] : page === 'contractor' ? executor : c[o.status];
    const panel = $('#action-panel');
    if (panel) panel.innerHTML = `<span class="eyebrow">${page === 'admin' ? 'Очередь решений' : 'Следующий шаг'}</span><h3>${content[0]}</h3><p>${content[1]}</p><div class="row wrap">${content[2]}</div>`;
    $$('[data-bind="customer-guidance"]').forEach(x => x.textContent = c[o.status][1]);
    $$('[data-bind="admin-guidance"]').forEach(x => x.textContent = a[o.status][1]);
  }
  function render() {
    UI.close();
    const o = state.order;
    const empty = $('#empty-state'), project = $('#project-content');
    if (empty) empty.hidden = !!o;
    if (project) project.hidden = !o;
    if (!o) { UI.enhanceSelects(); return; }
    const done = o.tasks.filter(t => t.status === 'done').length;
    const progress = Math.round(done / o.tasks.length * 100);
    const brief = D.describe(o.request);
    const values = { title:o.title, request:o.request, 'task-count':o.tasks.length, 'progress-label':`${done} из ${o.tasks.length} задач`, 'progress-percent':progress+'%', 'open-tasks':o.tasks.length-done, 'assigned-count':o.contractor ? 1 : 0, accrued:money(o.accruedKzt), paid:money(o.paidKzt), 'active-orders':o.status === 'completed' ? 0 : 1, 'decision-count':['agreed','staffing','payment_review','payout_pending'].includes(o.status) ? 1 : 0, 'payment-label':['in_progress','review','payout_pending','completed'].includes(o.status) ? 'Подтверждена · демо' : o.paymentSubmitted ? 'На проверке' : 'Ожидается' };
    $$('[data-bind]').forEach(el => { if (el.dataset.bind === 'status') { el.innerHTML = UI.statusMarkup(o.status,D.statuses[o.status]); el.className = 'order-status'; } else if (Object.hasOwn(values,el.dataset.bind)) el.textContent = values[el.dataset.bind]; });
    $$('[data-bind="summary"]').forEach(el => el.textContent = brief.summary);
    $$('[data-bind="product-label"]').forEach(el => el.textContent = brief.label);
    $$('[data-render="spec-features"]').forEach(el => el.innerHTML = brief.features.map(x => `<li>${esc(x)}</li>`).join(''));
    $$('[data-render="spec-criteria"]').forEach(el => el.innerHTML = brief.criteria.map(x => `<li>${esc(x)}</li>`).join(''));
    $$('[data-progress]').forEach(el => el.style.setProperty('--progress', progress+'%'));
    $$('[data-render="history"]').forEach(el => el.innerHTML = o.history.slice(-6).reverse().map(h => `<li>${esc(h.detail)}<p>${esc(h.actor)} · событие ${esc(h.sequence)}</p></li>`).join(''));
    $$('[data-render="team"]').forEach(el => el.innerHTML = o.contractor ? `<div class="team-person">${avatar('contractor')}<div><strong>Алексей Ким</strong><p>Full-stack разработчик</p></div></div><div class="team-skills"><span class="badge">Next.js</span><span class="badge">TypeScript</span></div>` : '<p class="small muted">Исполнитель будет назначен после согласования ТЗ.</p>');
    $$('[data-render="tasks-readonly"]').forEach(el => el.innerHTML = o.tasks.map(t => `<div class="task-row">${taskSymbol(t.status)}<span class="task-title">${esc(t.title)}</span>${UI.statusMarkup(t.status,D.taskStatuses[t.status])}</div>`).join(''));
    if ($('#contractor-assigned')) $('#contractor-assigned').hidden = !o.contractor;
    if ($('#contractor-unassigned')) $('#contractor-unassigned').hidden = !!o.contractor;
    if ($('#task-board')) $('#task-board').innerHTML = Object.entries(D.taskStatuses).map(([status,label]) => `<section class="board-column"><div class="board-heading"><span>${label}</span><span class="badge">${o.tasks.filter(t => t.status === status).length}</span></div>${o.tasks.filter(t => t.status === status).map(t => `<article class="board-task"><span class="mono">${esc(t.id)}</span><p>${esc(t.title)}</p>${taskSelect(t)}<div class="row between">${avatar('contractor')}<span class="meta">СтройПлюс</span></div></article>`).join('')}</section>`).join('');
    if ($('#task-list-mobile')) $('#task-list-mobile').innerHTML = o.tasks.map(t => `<div class="task-row">${taskSymbol(t.status)}<span class="task-title">${esc(t.title)}</span>${taskSelect(t)}</div>`).join('');
    $$('[data-team-assign]').forEach(b => { b.disabled = o.status !== 'staffing'; b.textContent = o.contractor ? 'Назначен на проект' : 'Назначить на проект'; });
    if ($('#order-stages')) $('#order-stages').innerHTML = Object.entries(D.statuses).map(([s,label]) => `<div class="task-row"><span class="task-symbol ${s === o.status ? 'doing' : o.history.some(h => h.status === s) ? 'done' : ''}">${o.history.some(h => h.status === s) && s !== o.status ? icon('check') : ''}</span><span class="task-title ${s === o.status ? '' : 'muted'}">${label}</span></div>`).join('');
    nextAction(o); filterOrders(); UI.enhanceSelects();
  }
  function filterOrders() {
    const input = $('#order-search'), row = $('#order-row'); if (!input || !row || !state.order) return;
    const match = `${state.order.title} ND-001 СтройПлюс`.toLocaleLowerCase('ru').includes(input.value.trim().toLocaleLowerCase('ru'));
    row.hidden = !match; $('#search-empty').hidden = match;
  }
  $('#order-search')?.addEventListener('input', filterOrders);
  document.addEventListener('change', e => {
    if (e.target.matches('[data-task]')) {
      const id = e.target.dataset.task;
      dispatch({ type:'TASK', id, status:e.target.value }, 'Статус задачи обновлён');
      const control = $$('[data-task]').find(x => x.dataset.task === id && x.parentElement.getClientRects().length);
      if (control && !UI.focusSelect(control)) {
        const heading = $('#action-panel h3');
        if (heading) { heading.tabIndex = -1; heading.focus(); }
      }
    }
  });
  function download(filename, content, mime = 'text/plain;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([content], { type:mime }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function specText() { const o = state.order, brief = D.describe(o.request); return `NASH DEVELOPER — ДЕМОНСТРАЦИОННОЕ ТЗ\n${o.title}\nВерсия: ${o.specVersion}\n\nЗадача клиента\n${o.request}\n\nФункции первой версии\n${brief.features.map(x => '• '+x).join('\n')}\n\nСостав работ\n${o.tasks.map(t => '• '+t.title).join('\n')}\n\nКритерии приёмки\n${brief.criteria.map(x => '• '+x).join('\n')}\n\nДемонстрационная стоимость: ${money(o.amountKzt)}. Реальные цена и срок требуют оценки специалистом.\n`; }
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const action = el.dataset.action;
    if (action === 'reset') { if (await confirmAction('Начать демонстрацию заново?', 'Текущий тестовый заказ будет очищен. Исходные файлы и материалы останутся на месте.', 'Сбросить демо')) { generated = false; dispatch({ type:'RESET' },'Демонстрация сброшена'); if (page === 'request') location.reload(); } return; }
    if (action === 'example') { dispatch({ type:'LOAD_EXAMPLE' }, 'Открыт демонстрационный заказ'); return; }
    if (action === 'download-spec' && state.order) { download('ND-001-Техническое-задание.txt',specText()); return; }
    if (action === 'export' && state.order) { const o = state.order; download('ND-orders.csv','\uFEFFЗаказ;Название;Статус;Сумма;Начислено;Выплачено\r\n'+[o.id,o.title,D.statuses[o.status],o.amountKzt,o.accruedKzt,o.paidKzt].map(x => '"'+String(x).replaceAll('"','""')+'"').join(';'),'text/csv;charset=utf-8'); toast('CSV с тестовым заказом подготовлен'); return; }
    if (action === 'rework') { $('#rework-dialog').showModal(); $('#rework-text').focus(); return; }
    const map = { approve:'APPROVE', publish:'PUBLISH', assign:'ASSIGN', 'submit-payment':'SUBMIT_PAYMENT', 'confirm-payment':'CONFIRM_PAYMENT', accept:'ACCEPT', payout:'PAYOUT' };
    if (map[action]) dispatch({ type:map[action] }, { approve:'ТЗ согласовано', publish:'Подбор команды открыт', assign:'Исполнитель назначен', 'submit-payment':'Тестовая отметка об оплате отправлена', 'confirm-payment':'Тестовая оплата подтверждена', accept:'Работа принята. Начислено 720 000 ₸', payout:'Тестовая выплата отмечена' }[action]);
  });
  $('[data-close-rework]')?.addEventListener('click', () => $('#rework-dialog').close());
  $('#rework-form')?.addEventListener('submit', e => { e.preventDefault(); const text = $('#rework-text').value.trim(); if (!text) { $('#rework-text').setCustomValidity('Опишите необходимые изменения.'); $('#rework-text').reportValidity(); return; } $('#rework-text').setCustomValidity(''); if (dispatch({ type:'REWORK', text },'Замечания отправлены исполнителю')) { $('#rework-dialog').close(); $('#rework-form').reset(); } });
  $('#rework-text')?.addEventListener('input', e => e.target.setCustomValidity(''));

  $$('[data-prompt]').forEach(b => b.addEventListener('click', () => {
    const input = $('#hero-request') || $('#request-text'); if (input) { input.value = b.dataset.prompt; input.focus(); }
    $$('[data-prompt]').forEach(x => x.setAttribute('aria-pressed',String(x === b)));
  }));
  $('#hero-form')?.addEventListener('submit', e => { e.preventDefault(); try { sessionStorage.setItem('nd-request-prefill', $('#hero-request').value.trim()); } catch { /* Request remains usable without storage. */ } location.href = 'request.html'; });
  if (page === 'request') {
    const questions = [
      { copy:'Что нужно разработать? Можно выбрать пример или описать задачу своими словами.', placeholder:'Опишите вашу задачу…', choices:['Сайт компании','Веб-сервис для заявок','Приложение для клиентов','Telegram-бот для записи'] },
      { copy:'Кто будет пользоваться продуктом и что должен сделать?', placeholder:'Например, клиенты выбирают услугу и записываются…', choices:['Клиенты — записаться на услугу','Клиенты — оставить заявку','Сотрудники — обрабатывать заявки'] },
      { copy:'Есть ориентиры по сроку и бюджету? Если пока нет, это можно обсудить позже.', placeholder:'Срок, бюджет или «пока не определились»…', choices:['Сначала нужен MVP','Срок и бюджет обсудим','Пока без оценки'] }
    ];
    let step = 0, answers = [], messages = [], busy = false;
    const input = $('#request-text'), submit = $('#request-submit');
    const botAvatar = '<span class="avatar assistant-mark" aria-hidden="true">ND</span>';
    function drawConversation(typing = false) {
      const holder = $('#messages');
      holder.innerHTML = messages.map(m => `<div class="message ${m.user ? 'message-user' : ''}">${m.user ? avatar('customer') : botAvatar}<div class="message-body"><p class="message-name">${m.user ? 'Вы' : 'Помощник ND'}</p><p class="message-copy">${esc(m.text)}</p></div></div>`).join('')
        + (typing ? `<div class="message">${botAvatar}<div class="typing-indicator" role="status" aria-label="Подготавливаем следующий ответ"><i></i><i></i><i></i></div></div>` : '')
        + `<div class="request-choices" id="request-choices" aria-label="Варианты ответа">${!typing && !generated ? questions[step].choices.map(x => `<button type="button" class="suggestion" data-brief-choice="${esc(x)}">${esc(x)}</button>`).join('') : ''}</div>`;
      holder.scrollTop = holder.scrollHeight;
      $('#request-step').textContent = generated ? 'ТЗ готово' : `${step + 1} / 3`;
      input.placeholder = questions[Math.min(step,2)].placeholder;
      input.maxLength = step === 0 ? 6000 : 800;
      input.setAttribute('aria-label', questions[Math.min(step,2)].copy);
      submit.textContent = generated ? 'Посмотреть ТЗ' : step === 2 ? 'Подготовить ТЗ' : 'Продолжить';
      input.disabled = busy || generated;
      input.required = !generated;
      submit.disabled = busy;
    }
    function startBrief(prefill = '') {
      generated = false; step = 0; answers = []; busy = false;
      messages = [{text:questions[0].copy}]; input.value = prefill;
      $('#request-tips').hidden = false; $('#request-output').hidden = true;
      drawConversation();
    }
    function showOutput() {
      $('#request-tips').hidden = true; $('#request-output').hidden = false;
      generated = true; drawConversation(); render();
    }
    syncRequestState = () => {
      if (!generated) return; // Preserve answers that the user is still entering.
      if (state.order) {
        messages = [{text:state.order.request,user:true},{text:'Техническое задание обновлено из сохранённого проекта.'}];
        showOutput();
      } else {
        startBrief(); requestTab('chat');
      }
    };
    let prefill = '';
    try { prefill = sessionStorage.getItem('nd-request-prefill') || ''; sessionStorage.removeItem('nd-request-prefill'); } catch { /* optional */ }
    startBrief(prefill);
    if (!prefill && state.order?.status === 'draft') {
      messages = [{text:state.order.request,user:true},{text:'Черновик сохранён. Проверьте предложенные функции и критерии приёмки. Их можно уточнить перед согласованием.'}];
      showOutput();
    }
    $('#messages').addEventListener('click', e => {
      const choice = e.target.closest('[data-brief-choice]');
      if (!choice || busy || generated) return;
      input.value = choice.dataset.briefChoice;
      $('#request-form').requestSubmit();
    });
    $('[data-restart-brief]')?.addEventListener('click', () => {
      const original = state.order?.request.split('\n\nПользователи:')[0] || '';
      startBrief(original); requestTab('chat'); input.focus();
    });
    $('#request-form').addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return;
      if (generated) { requestTab('spec'); $('#request-output h2').focus(); return; }
      const text = input.value.trim();
      if (!text) { $('#request-error').textContent = 'Введите ответ или выберите вариант.'; input.focus(); return; }
      $('#request-error').textContent = '';
      const usedChoice = !!document.activeElement?.matches('[data-brief-choice]');
      if (step === 2 && state.order && !(await confirmAction('Подготовить новое ТЗ?', 'В этой демонстрации хранится один заказ. Новый черновик заменит текущий тестовый пример.', 'Подготовить новое'))) return;
      busy = true; answers.push(text); messages.push({text,user:true}); input.value = ''; drawConversation(true);
      await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 450));
      if (step < 2) {
        step++; messages.push({text:questions[step].copy}); busy = false; drawConversation();
        // Keep keyboard position; selecting a chip should not open the phone keyboard.
        if (usedChoice) $('#request-choices button')?.focus({preventScroll:true});
        else input.focus({preventScroll:true});
      } else {
        const request = `${answers[0]}\n\nПользователи: ${answers[1]}\n\nСрок и бюджет: ${answers[2]}`;
        state = D.transition(D.empty(), { type:'CREATE', text:request }); save(); busy = false;
        messages.push({text:'Черновик готов. Это предложенный состав первой версии: проверьте функции и критерии перед согласованием. Цена и срок требуют отдельной оценки.'});
        showOutput(); requestTab('spec'); $('#request-output h2').focus(); toast('Черновик ТЗ подготовлен');
      }
    });
  }
  addEventListener('storage', e => { if (e.key === key) { state = D.restore(e.newValue) || D.empty(); render(); syncRequestState(); } });
  save(); render();
  if (!storageAvailable) toast('Хранилище браузера недоступно. Изменения сохраняются до обновления страницы.');
})();
