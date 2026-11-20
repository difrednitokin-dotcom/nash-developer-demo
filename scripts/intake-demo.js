/* Prepared illustrative scene. Never reads or writes the project's demo state. */
(() => {
  'use strict';
  const root = document.querySelector('[data-intake-demo]');
  if (!root) return;
  const find = name => root.querySelector(`[data-intake-${name}]`);
  const scene = root.querySelector('.intake-scene');
  const chat = root.querySelector('.intake-chat');
  const messages = [...root.querySelectorAll('[data-intake-message]')];
  const log = find('log'), typing = find('typing'), slot = find('slot');
  const inner = find('inner'), card = find('new'), transfer = find('transfer');
  const draft = find('draft'), send = find('send'), pause = find('pause');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const starts = [350, 2200, 5000, 7000, 9600, 11900];
  const cycle = 20000;
  let elapsed = 0, lastTime = null, frame = 0, visible = false, userPaused = false;
  let pinned = true, layoutKey = '', slotHeight = 130, travel = null;
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => 1 - Math.pow(1 - clamp(n), 3);
  const content = (el, value) => { if (el.textContent !== value) el.textContent = value; };

  function measure() {
    slotHeight = inner.offsetHeight;
    const s = scene.getBoundingClientRect(), c = chat.getBoundingClientRect(), t = slot.getBoundingClientRect();
    travel = { x1:c.right - s.left - 44, y1:c.bottom - s.top - 60, x2:t.left - s.left + 20, y2:t.top - s.top + 20 };
    render();
    if (pinned) log.scrollTop = log.scrollHeight;
  }

  function render() {
    const t = reduced.matches ? 14000 : elapsed;
    let key = '';
    messages.forEach((el, i) => {
      const shown = t >= starts[i];
      el.hidden = !shown;
      const p = ease((t - starts[i]) / 300);
      el.style.opacity = p;
      el.style.transform = `translateY(${(1 - p) * 6}px)`;
      key += shown ? '1' : '0';
    });
    const waiting = [[1100,2200],[5850,7000],[10000,11800]].some(([a,b]) => t >= a && t < b);
    typing.hidden = !waiting;
    key += waiting;
    if (key !== layoutKey) {
      layoutKey = key;
      if (pinned) log.scrollTop = log.scrollHeight;
    }
    let text = '';
    for (const [a,b,end,phrase] of [
      [3700,4900,5000,'Показывать услуги и проекты. Нужна форма заявки.'],
      [8500,9400,9600,'Да, добавьте в план.']
    ]) if (t >= a && t < end) text = phrase.slice(0, Math.ceil(clamp((t-a)/(b-a))*phrase.length));
    content(draft, text || 'Расскажите о задаче…');
    draft.classList.toggle('is-writing', !!text);
    send.classList.toggle('is-ready', !!text);
    const inserted = ease((t - 10900) / 850);
    slot.style.height = `${slotHeight * inserted}px`;
    card.style.opacity = inserted;
    card.style.transform = `translateY(${(1-inserted)*-10}px)`;
    content(find('total'), inserted > 0 ? '5' : '4');
    content(find('todo'), inserted > 0 ? '4' : '3');
    content(find('phase'), t < 8500 ? 'Уточнение задачи' : t < 10100 ? 'Согласование' : t < 11900 ? 'Добавляем в план' : 'Задача в плане');
    const moving = !reduced.matches && t >= 10100 && t < 10900 && travel;
    transfer.hidden = !moving;
    if (moving) {
      const p = clamp((t-10100)/800), q = ease(p);
      transfer.style.transform = `translate3d(${travel.x1+(travel.x2-travel.x1)*q+Math.sin(p*Math.PI)*24}px,${travel.y1+(travel.y2-travel.y1)*q}px,0) scale(${.85+.15*p})`;
      transfer.style.opacity = Math.min(1,p*8,(1-p)*8);
    }
    scene.style.opacity = reduced.matches || userPaused ? 1 : t > 19400 ? clamp((20000-t)/600) : t < 400 ? .2 + .8*clamp(t/400) : 1;
  }

  function eligible() { return visible && !document.hidden && !userPaused && !reduced.matches; }
  function tick(now) {
    frame = 0;
    if (!eligible()) { lastTime = null; return; }
    if (lastTime !== null) elapsed += Math.max(0, now-lastTime);
    lastTime = now;
    if (elapsed >= cycle) {
      elapsed %= cycle;
      pinned = true;
      log.scrollTop = 0;
    }
    render();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const playing = eligible();
    root.dataset.intakePlaying = String(playing);
    if (playing && !frame) frame = requestAnimationFrame(tick);
    if (!playing) { cancelAnimationFrame(frame); frame = 0; lastTime = null; }
  }
  function pauseLabel() {
    pause.setAttribute('aria-pressed', String(userPaused));
    pause.setAttribute('aria-label', userPaused ? 'Продолжить демонстрацию' : 'Приостановить демонстрацию');
    content(find('pause-label'), userPaused ? 'Продолжить' : 'Пауза');
    find('control-icon').innerHTML = userPaused
      ? '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
  }
  pause.addEventListener('click', () => { userPaused = !userPaused; pauseLabel(); render(); sync(); });
  find('replay').addEventListener('click', () => {
    elapsed = 0; lastTime = null; userPaused = false; pinned = true; log.scrollTop = 0;
    pauseLabel(); render(); sync();
  });
  log.addEventListener('scroll', () => { pinned = log.scrollHeight-log.clientHeight-log.scrollTop < 16; }, {passive:true});
  document.addEventListener('visibilitychange', sync);
  function preference() {
    find('controls').hidden = reduced.matches;
    pinned = true; render(); sync();
  }
  reduced.addEventListener('change', preference);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0.12});
    observer.observe(scene);
  } else {
    const check = () => { const r = scene.getBoundingClientRect(); visible = r.top < innerHeight && r.bottom > 0; sync(); };
    addEventListener('scroll', check, {passive:true}); check();
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(scene); observer.observe(inner);
  } else addEventListener('resize', measure, {passive:true});
  measure(); preference();
})();
