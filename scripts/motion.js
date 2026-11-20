/* Once-only entrance motion. Content remains readable without JS and reduced motion. */
(function () {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  let observer;
  const motionTargets = '.hero > .eyebrow,.hero h1,.hero-description,.hero-composer,.hero > .suggestions,.hero-caption,.product-preview,.marketing-section .section-heading,.step-card,.role-card';
  function revealAll() {
    observer?.disconnect();
    document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));
  }
  function init() {
    if (document.body.dataset.page !== 'home' || preference.matches || !('IntersectionObserver' in window)) return;
    const initial = [...document.querySelectorAll('.hero > .eyebrow,.hero h1,.hero-description,.hero-composer,.hero > .suggestions,.hero-caption')];
    initial.forEach((el,i) => { el.classList.add('hero-enter'); el.style.setProperty('--enter-delay',Math.min(i*65,260)+'ms'); });
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); } });
    },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
    document.querySelectorAll(motionTargets).forEach(el => {
      if (initial.includes(el)) return;
      el.classList.add('scroll-reveal');
      if (el.getBoundingClientRect().top >= innerHeight) el.classList.add('reveal-pending');
      else if (el.classList.contains('product-preview')) el.classList.add('preview-enter');
      observer.observe(el);
    });
  }
  // Focus and hash navigation always reveal their destinations immediately.
  document.addEventListener('focusin',e=>e.target.closest('.reveal-pending')?.classList.remove('reveal-pending'));
  addEventListener('hashchange',revealAll);
  addEventListener('pageshow',e=>{if(e.persisted) revealAll();});
  preference.addEventListener('change',e=>{if(e.matches) revealAll();});
  init();
})();
