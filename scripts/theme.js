/* Apply the saved theme before CSS/first paint, independently of demo order storage. */
(function () {
  'use strict';
  const key = 'nd-theme:v1';
  const root = document.documentElement;
  let theme = 'dark';
  try { const saved = localStorage.getItem(key); if (saved === 'light' || saved === 'dark') theme = saved; } catch { /* Keep original dark theme when storage is unavailable. */ }
  root.dataset.theme = theme;
  const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>';
  const moon = '<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/>';
  function sync() {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(theme === 'light'));
      button.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (theme === 'dark' ? sun : moon) + '</svg>';
    });
    document.querySelectorAll('[data-theme-color]').forEach(code => {
      const colour = getComputedStyle(root).getPropertyValue(code.dataset.themeColor).trim();
      code.textContent = colour;
    });
  }
  function apply(next, persist) {
    theme = next; root.dataset.theme = next;
    if (persist) { try { localStorage.setItem(key, next); } catch { /* Still usable for this page. */ } }
    sync();
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-theme-toggle]')) apply(theme === 'dark' ? 'light' : 'dark', true); });
  addEventListener('storage', e => { if (e.key === key) apply(e.newValue === 'light' ? 'light' : 'dark', false); });
  document.addEventListener('DOMContentLoaded', sync);
  // Same image/fallback composition as AvatarImage + AvatarFallback in the reference.
  function avatarState(img) {
    const avatar = img.closest('[data-demo-avatar]');
    if (avatar) avatar.classList.toggle('avatar-loaded', img.complete && img.naturalWidth > 0);
  }
  document.addEventListener('load', e => { if (e.target.matches?.('.avatar-image')) avatarState(e.target); }, true);
  document.addEventListener('error', e => { if (e.target.matches?.('.avatar-image')) avatarState(e.target); }, true);
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.avatar-image').forEach(avatarState));
})();
