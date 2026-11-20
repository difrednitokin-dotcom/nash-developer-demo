/* Shared presentation: status pills and a progressively enhanced single-select.
   The backing select keeps its value/change contract; no native picker opens with JS. */
(function () {
  'use strict';
  const escape = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const glyph = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons/tabler-sprite.svg#${name}"/></svg>`;
  function statusIcon(status) {
    if (['done','completed','agreed'].includes(status)) return '<svg class="status-icon is-done" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="m5 8 2 2 4-4"/></svg>';
    if (['doing','in_progress','review','payment_review','payout_pending','staffing'].includes(status)) return '<svg class="status-icon is-active" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke-dasharray="1.8 2.5"/></svg>';
    return '<svg class="status-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/></svg>';
  }
  const statusMarkup = (status, label) => `<span class="status-pill">${statusIcon(status)}<span>${escape(label)}</span></span>`;
  const instances = new WeakMap();
  let openMenu = null, sequence = 0, typeText = '', typeTimer;
  function close(restoreFocus = false) {
    if (!openMenu) return;
    const {trigger,popup} = openMenu;
    trigger.setAttribute('aria-expanded','false'); trigger.removeAttribute('aria-activedescendant');
    popup.remove(); openMenu = null; clearTimeout(typeTimer); typeText = '';
    if (restoreFocus && trigger.isConnected) trigger.focus({preventScroll:true});
  }
  function update(instance) {
    const {native,trigger} = instance;
    trigger.disabled = native.disabled;
    const label = native.selectedOptions[0]?.textContent || 'Выберите вариант';
    trigger.innerHTML = (native.dataset.task ? statusMarkup(native.value,label) : `<span class="select-value">${escape(label)}</span>`) + '<svg class="select-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  }
  function enabled(instance) { return [...instance.native.options].map((o,i) => o.disabled ? -1 : i).filter(i => i >= 0); }
  function activate(index) {
    if (!openMenu) return;
    const {native,trigger,popup} = openMenu;
    if (!native.options[index] || native.options[index].disabled) return;
    openMenu.active = index;
    popup.querySelectorAll('[role="option"]').forEach(el => el.classList.toggle('is-highlighted',Number(el.dataset.index) === index));
    const option = popup.querySelector(`[data-index="${index}"]`);
    trigger.setAttribute('aria-activedescendant', option.id);
    // Scroll only the popup. scrollIntoView on a fixed portal can scroll the
    // document and immediately trigger the outside-scroll close handler.
    if (option.offsetTop < popup.scrollTop) popup.scrollTop = option.offsetTop - 5;
    else if (option.offsetTop + option.offsetHeight > popup.scrollTop + popup.clientHeight) popup.scrollTop = option.offsetTop + option.offsetHeight - popup.clientHeight + 5;
  }
  function choose(index) {
    if (!openMenu) return;
    const {native} = openMenu;
    if (native.disabled || !native.options[index] || native.options[index].disabled) return;
    const changed = native.selectedIndex !== index;
    native.selectedIndex = index;
    update(openMenu); close(true);
    if (changed) native.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function open(instance, edge) {
    if (instance.native.disabled) return;
    close();
    const {native,trigger,id} = instance;
    const popup = document.createElement('div');
    popup.className = 'select-popover'; popup.id = id+'-list';
    popup.setAttribute('role','listbox'); popup.setAttribute('aria-label', trigger.getAttribute('aria-label'));
    popup.innerHTML = [...native.options].map((o,i) => {
      const optionIcon = native.dataset.task ? statusIcon(o.value) : native.id === 'role-picker' ? glyph({customer:'briefcase',contractor:'check',admin:'grid'}[o.value]) : glyph('folder');
      return `<div class="select-option" id="${id}-option-${i}" role="option" aria-selected="${o.selected}" ${o.disabled ? 'aria-disabled="true"' : ''} data-index="${i}">${optionIcon}<span class="grow">${escape(o.textContent)}</span><span class="option-check" aria-hidden="true">${o.selected ? glyph('check') : ''}</span></div>`;
    }).join('');
    document.body.append(popup);
    const rect = trigger.getBoundingClientRect(), inset = 12;
    const width = Math.min(Math.max(rect.width, native.dataset.task ? 188 : 224), innerWidth - 2*inset);
    popup.style.width = width+'px';
    popup.style.maxHeight = Math.min(320,innerHeight-2*inset)+'px';
    const height = popup.getBoundingClientRect().height;
    const below = innerHeight - rect.bottom - inset - 6, above = rect.top - inset - 6;
    const flip = height > below && above > below;
    const available = Math.max(44,flip ? above : below);
    popup.style.maxHeight = Math.min(320,available)+'px';
    popup.style.left = Math.max(inset,Math.min(rect.left,innerWidth-width-inset))+'px';
    const finalHeight = popup.getBoundingClientRect().height;
    popup.style.top = Math.max(inset, Math.min(flip ? rect.top-finalHeight-6 : rect.bottom+6,innerHeight-finalHeight-inset))+'px';
    openMenu = {...instance,popup,active:native.selectedIndex,anchor:{top:rect.top,left:rect.left}};
    trigger.setAttribute('aria-expanded','true');
    const all = enabled(instance);
    activate(edge === 'first' ? all[0] : edge === 'last' ? all.at(-1) : native.options[native.selectedIndex]?.disabled ? all[0] : native.selectedIndex);
    popup.addEventListener('pointerdown', e => { if(e.pointerType === 'mouse') e.preventDefault(); }); // Keep mouse focus; allow touch scrolling.
    popup.addEventListener('click', e => { const row=e.target.closest('[data-index]'); if(row) choose(Number(row.dataset.index)); });
    popup.addEventListener('pointermove', e => { const row=e.target.closest('[data-index]'); if(e.pointerType === 'mouse' && row) activate(Number(row.dataset.index)); });
  }
  function enhanceSelects(root = document) {
    root.querySelectorAll('select').forEach(native => {
      if (instances.has(native)) { update(instances.get(native)); return; }
      const id = 'nd-select-'+(++sequence), wrapper = document.createElement('span'), trigger = document.createElement('button');
      wrapper.className = 'custom-select' + (native.dataset.task ? ' task-status-select' : '');
      trigger.type = 'button'; trigger.className = 'select select-trigger' + (native.dataset.task ? ' status-select-trigger' : '');
      trigger.id = id; trigger.setAttribute('role','combobox');
      trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false'); trigger.setAttribute('aria-controls',id+'-list');
      const label = native.getAttribute('aria-label') || native.closest('label')?.querySelector('span')?.textContent || 'Выберите вариант';
      trigger.setAttribute('aria-label',label);
      const owningLabel = native.closest('label') || (native.id && [...document.querySelectorAll('label[for]')].find(el=>el.htmlFor === native.id));
      if (owningLabel) owningLabel.htmlFor = id;
      native.before(wrapper); wrapper.append(native,trigger);
      const instance = {native,trigger,id}; instances.set(native,instance); update(instance);
      // Only hide the fallback after the replacement is assembled.
      native.hidden = true; native.tabIndex = -1;
      native.addEventListener('change', () => update(instance));
      trigger.addEventListener('click', () => openMenu?.trigger === trigger ? close() : open(instance));
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Tab') { close(); return; }
        if (e.key === 'Escape') { if(openMenu) {e.preventDefault();e.stopPropagation();close(true);} return; }
        if (['Enter',' '].includes(e.key)) {
          e.preventDefault(); if (openMenu?.trigger === trigger) choose(openMenu.active); else open(instance); return;
        }
        if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
          e.preventDefault();
          if (openMenu?.trigger !== trigger) { open(instance,e.key === 'Home' ? 'first' : e.key === 'End' ? 'last' : undefined); return; }
          const all = enabled(instance), current = all.indexOf(openMenu.active);
          activate(e.key === 'Home' ? all[0] : e.key === 'End' ? all.at(-1) : all[(current+(e.key === 'ArrowDown' ? 1 : -1)+all.length)%all.length]); return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault(); if(openMenu?.trigger !== trigger) open(instance);
          clearTimeout(typeTimer); typeText += e.key.toLocaleLowerCase('ru');
          const match = enabled(instance).find(i => native.options[i].textContent.trim().toLocaleLowerCase('ru').startsWith(typeText));
          if (match !== undefined) activate(match);
          typeTimer = setTimeout(()=>{typeText='';},700);
        }
      });
    });
  }
  document.addEventListener('pointerdown', e => { if(openMenu && !openMenu.trigger.contains(e.target) && !openMenu.popup.contains(e.target)) close(); },true);
  document.addEventListener('scroll', e => {
    if (!openMenu || openMenu.popup.contains(e.target)) return;
    const rect = openMenu.trigger.getBoundingClientRect();
    // A focus scroll may have finished before open(), with its event delivered
    // afterwards. Close only when the anchor actually moved, not for that event.
    if (Math.abs(rect.top-openMenu.anchor.top)>1 || Math.abs(rect.left-openMenu.anchor.left)>1) close();
  },true);
  addEventListener('resize',()=>close());
  window.NDUI = {statusMarkup,statusIcon,enhanceSelects,close,focusSelect(native) {
    const trigger = instances.get(native)?.trigger;
    if (!trigger || trigger.disabled) return false;
    trigger.focus({preventScroll:true}); return true;
  }};
})();
