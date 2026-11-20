/* Framework-independent demo domain; reusable when migrating the views to Next.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NDDemo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const statuses = {
    draft: 'Черновик ТЗ', agreed: 'ТЗ согласовано', staffing: 'Ищем команду',
    awaiting_payment: 'Ждёт оплату', payment_review: 'Проверка оплаты',
    in_progress: 'В разработке', review: 'На приёмке', payout_pending: 'Выплата после приёмки', completed: 'Выполнен'
  };
  const taskStatuses = { todo: 'К работе', doing: 'В работе', done: 'Готово' };
  const empty = () => ({ version: 1, order: null });
  const clone = x => JSON.parse(JSON.stringify(x));
  // Prepared branches, as in the supplied prototype. This is not an AI estimate.
  function describe(text) {
    const product = String(text).split('\n\nПользователи:')[0];
    const kind = /сайт/i.test(product) ? 'site' : /приложени/i.test(product) ? 'app' : /сервис/i.test(product) ? 'service' : /(?:telegram|телеграм|(?:^|\s|-)бот)/i.test(product) ? 'bot' : 'site';
    const data = {
      bot: {
        title:'Telegram-бот для бизнеса', label:'Telegram-бот',
        summary:'Telegram-бот для записи на услуги и получения уведомлений.',
        features:['Выбор услуги и доступного времени в Telegram.','Создание и отмена записи пользователем.','Уведомление клиента и ответственного сотрудника.'],
        criteria:['Пользователь проходит путь от /start до подтверждения записи.','Недоступное время нельзя забронировать повторно.','Уведомления и отмена записи проверены на тестовых данных.'],
        tasks:['Сценарий диалога и структура бота','Команды бота, запись и уведомления','Проверка сценариев и подготовка к запуску']
      },
      app: {
        title:'Приложение для клиентов', label:'Приложение',
        summary:'Клиентское приложение с каталогом услуг и личным кабинетом.',
        features:['Вход и профиль клиента.','Каталог услуг и отправка заявки.','Просмотр своих заявок и их статусов.'],
        criteria:['Клиент входит в тестовый аккаунт и открывает профиль.','Заявка появляется в списке после отправки.','Основные экраны проверены на телефоне.'],
        tasks:['Прототип экранов приложения','Каталог, профиль и заявки','Проверка приложения и подготовка к запуску']
      },
      service: {
        title:'Веб-сервис для заявок', label:'Веб-сервис',
        summary:'Рабочий кабинет для обработки заявок и контроля их статусов.',
        features:['Создание и просмотр заявок.','Назначение ответственного и изменение статуса.','Поиск и фильтрация списка заявок.'],
        criteria:['Созданная заявка сохраняется и доступна в списке.','Изменение статуса отображается в карточке заявки.','Поиск и основные действия доступны на телефоне.'],
        tasks:['Структура кабинета и модель заявки','Список заявок, статусы и поиск','Проверка рабочего сценария и подготовка к запуску']
      },
      site: {
        title:/строитель/i.test(text) ? 'Сайт строительной компании' : 'Сайт компании', label:'Сайт',
        summary:'Сайт компании с услугами, проектами и формой заявки.',
        features:['Главная страница с предложением компании.','Услуги и примеры выполненных проектов.','Форма обращения и контактные данные.','Адаптивное отображение на телефоне и компьютере.'],
        criteria:['Все согласованные страницы доступны.','Форма показывает результат отправки.','На телефоне доступны все основные действия.'],
        tasks:['Макет и структура страниц','Страницы сайта и форма заявки','Проверка и подготовка к запуску']
      }
    };
    return { kind, ...data[kind] };
  }
  function record(order, status, actor, detail) {
    order.status = status;
    order.history.push({ status, actor, detail: detail || statuses[status], sequence: order.history.length + 1 });
  }
  function transition(state, action) {
    if (!state || !action) return state;
    if (action.type === 'RESET') return empty();
    if (action.type === 'LOAD_EXAMPLE') return example();
    if (action.type === 'CREATE') {
      const text = typeof action.text === 'string' ? action.text.trim().slice(0, 8000) : '';
      if (state.order || !text) return state;
      const brief = describe(text);
      const order = {
        id: 'ND-001', title:brief.title, request: text, status: 'draft', specVersion: 1,
        amountKzt: 1000000, accruedKzt: 0, paidKzt: 0, contractor: null,
        paymentSubmitted: false, tasks: brief.tasks.map((title,i) => ({id:'ND-0'+(i+1),title,status:'todo'})), history: []
      };
      record(order, 'draft', 'AI-помощник', 'Подготовлен демонстрационный черновик ТЗ');
      return { version: 1, order };
    }
    if (!state.order) return state;
    const next = clone(state), o = next.order;
    switch (action.type) {
      case 'APPROVE': if (o.status !== 'draft') return state; record(o, 'agreed', 'Заказчик'); break;
      case 'PUBLISH': if (o.status !== 'agreed') return state; record(o, 'staffing', 'Администратор', 'Заказ открыт для подбора команды'); break;
      case 'ASSIGN':
        if (o.status !== 'staffing') return state;
        o.contractor = 'Алексей Ким'; record(o, 'awaiting_payment', 'Администратор', 'Алексей Ким назначен исполнителем'); break;
      case 'SUBMIT_PAYMENT':
        if (o.status !== 'awaiting_payment' || !o.contractor) return state;
        o.paymentSubmitted = true; record(o, 'payment_review', 'Заказчик', 'Отправлена тестовая отметка об оплате'); break;
      case 'CONFIRM_PAYMENT':
        if (o.status !== 'payment_review' || !o.contractor || !o.paymentSubmitted) return state;
        record(o, 'in_progress', 'Администратор', 'Тестовая оплата подтверждена. Задачи открыты'); break;
      case 'TASK': {
        if (o.status !== 'in_progress' || !Object.hasOwn(taskStatuses, action.status)) return state;
        const task = o.tasks.find(t => t.id === action.id);
        if (!task || task.status === action.status) return state;
        task.status = action.status;
        if (o.tasks.length && o.tasks.every(t => t.status === 'done')) record(o, 'review', 'Исполнитель', 'Все задачи завершены. Результат передан на приёмку');
        break;
      }
      case 'ACCEPT':
        if (o.status !== 'review' || !o.tasks.length || !o.tasks.every(t => t.status === 'done')) return state;
        o.accruedKzt = o.amountKzt * 72 / 100;
        record(o, 'payout_pending', 'Заказчик', 'Работа принята. Начислено исполнителю 720 000 ₸'); break;
      case 'REWORK': {
        const text = typeof action.text === 'string' ? action.text.trim().slice(0, 1000) : '';
        if (o.status !== 'review' || !text) return state;
        o.tasks.push({ id: 'ND-R' + o.history.length, title: text, status: 'todo' });
        record(o, 'in_progress', 'Заказчик', 'Запрошена доработка: ' + text); break;
      }
      case 'PAYOUT':
        if (o.status !== 'payout_pending' || !o.accruedKzt || o.paidKzt) return state;
        o.paidKzt = o.accruedKzt; record(o, 'completed', 'Администратор', 'Тестовая выплата отмечена. Заказ закрыт'); break;
      default: return state;
    }
    return next;
  }
  function example() {
    let s = transition(empty(), { type: 'CREATE', text: 'Нужен сайт для строительной компании. Расскажем об услугах, покажем проекты и добавим форму заявки.' });
    for (const type of ['APPROVE', 'PUBLISH', 'ASSIGN', 'SUBMIT_PAYMENT', 'CONFIRM_PAYMENT']) s = transition(s, { type });
    s = transition(s, { type: 'TASK', id: 'ND-01', status: 'done' });
    return transition(s, { type: 'TASK', id: 'ND-02', status: 'doing' });
  }
  function restore(raw) {
    try {
      const s = JSON.parse(raw);
      if (s?.version !== 1 || !Object.hasOwn(s, 'order')) return null;
      if (s.order === null) return empty();
      const o = s.order;
      if (!o || o.id !== 'ND-001' || !Object.hasOwn(statuses, o.status)) return null;
      if (typeof o.title !== 'string' || typeof o.request !== 'string' || o.request.length > 8000 || o.specVersion !== 1) return null;
      if (o.amountKzt !== 1000000 || ![0, 720000].includes(o.accruedKzt) || ![0, 720000].includes(o.paidKzt)) return null;
      if (![null, 'Алексей Ким'].includes(o.contractor) || typeof o.paymentSubmitted !== 'boolean') return null;
      if (!Array.isArray(o.tasks) || !o.tasks.length || o.tasks.length > 100 || !o.tasks.every(t => typeof t.id === 'string' && typeof t.title === 'string' && Object.hasOwn(taskStatuses, t.status))) return null;
      if (!Array.isArray(o.history) || !o.history.length || o.history.length > 300 || !o.history.every(h => Object.hasOwn(statuses, h.status) && typeof h.actor === 'string' && typeof h.detail === 'string' && Number.isSafeInteger(h.sequence) && h.sequence > 0)) return null;
      if (o.status === 'completed' && (o.paidKzt !== 720000 || o.accruedKzt !== 720000)) return null;
      // Repair the original demo's site-only task titles without losing progress.
      const brief = describe(o.request);
      const oldTasks = ['Макет и структура страниц','Страницы сайта и форма заявки','Проверка и подготовка к запуску'];
      if (brief.kind !== 'site') o.tasks.forEach(t => {
        const i = oldTasks.indexOf(t.title);
        if (i !== -1 && t.id === 'ND-0'+(i+1)) t.title = brief.tasks[i];
      });
      return clone(s);
    } catch { return null; }
  }
  return { empty, transition, restore, example, describe, statuses, taskStatuses };
});
