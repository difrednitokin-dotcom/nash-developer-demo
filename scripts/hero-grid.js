/* Decorative SVG tiles. Pointer/touch feedback never intercepts the real UI. */
(function () {
  'use strict';
  const hero = document.querySelector('.hero');
  const layer = hero?.querySelector('[data-hero-grid]');
  const svg = layer?.querySelector('svg');
  const caption = hero?.querySelector('.hero-caption');
  if (!hero || !layer || !svg || !caption) return;
  const ns = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  let cells = [], point = null, paintFrame = 0, resizeFrame = 0, releaseTimer = 0;
  let visible = true, previousSize = '';

  function element(tag, attributes) {
    const el = document.createElementNS(ns,tag);
    for (const [key,value] of Object.entries(attributes)) el.setAttribute(key,String(value));
    return el;
  }
  function clear() {
    point = null;
    clearTimeout(releaseTimer);
    if (paintFrame) cancelAnimationFrame(paintFrame);
    paintFrame = 0;
    cells.forEach(cell => {
      if (cell.heat === 0) return;
      cell.heat = 0; cell.el.style.setProperty('--heat','0'); cell.el.removeAttribute('data-illuminated');
    });
  }
  function build() {
    resizeFrame = 0;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
    const height = Math.ceil(caption.offsetTop + caption.offsetHeight + header + 24);
    layer.style.setProperty('--hero-grid-height',height+'px');
    const width = Math.ceil(layer.getBoundingClientRect().width);
    const step = width >= 2400 ? 128 : width >= 1600 ? 112 : width >= 1100 ? 104 : width >= 600 ? 80 : 64;
    const size = `${width}:${height}:${step}`;
    if (!width || size === previousSize) return;
    previousSize = size; clear(); cells = [];
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const fragment = document.createDocumentFragment();
    const cut = step < 90 ? 4 : 5;
    const tile = `M${cut} 0H${step-cut}L${step} ${cut}V${step-cut}L${step-cut} ${step}H${cut}L0 ${step-cut}V${cut}Z`;
    const junction = 'M0-5 1.5-1.5 5 0 1.5 1.5 0 5-1.5 1.5-5 0-1.5-1.5Z';
    for (let row=-1;row<=Math.ceil(height/step);row++) {
      for (let col=-1;col<=Math.ceil(width/step);col++) {
        const x=col*step, y=row*step;
        const group = element('g',{class:'hero-grid-cell',transform:`translate(${x} ${y})`,'data-cell':`${col}:${row}`});
        group.append(element('path',{class:'hero-grid-tile',d:tile,'vector-effect':'non-scaling-stroke'}));
        group.append(element('path',{class:'hero-grid-junction',d:junction}));
        fragment.append(group);
        cells.push({el:group,x,y,step,heat:0});
      }
    }
    svg.replaceChildren(fragment);
  }
  function paint() {
    paintFrame = 0;
    if (!point || !visible || document.hidden) { clear(); return; }
    const rect = layer.getBoundingClientRect();
    const x=point.x-rect.left, y=point.y-rect.top;
    if (x<0 || y<0 || x>rect.width || y>rect.height) { clear(); return; }
    cells.forEach(cell => {
      const inside = x>=cell.x && x<cell.x+cell.step && y>=cell.y && y<cell.y+cell.step;
      const distance = Math.hypot(x-cell.x-cell.step/2,y-cell.y-cell.step/2);
      // One bright tile and a small halo on its neighbours, instead of a moving blob.
      const heat = inside ? 1 : reduced.matches ? 0 : Math.max(0,1-distance/(cell.step*1.25))*.18;
      if (Math.abs(heat-cell.heat)<.015) return;
      cell.heat=heat; cell.el.style.setProperty('--heat',heat.toFixed(3));
      if (inside) cell.el.setAttribute('data-illuminated','true'); else cell.el.removeAttribute('data-illuminated');
    });
  }
  function schedulePaint() {
    if (!paintFrame && visible && !document.hidden) paintFrame=requestAnimationFrame(paint);
  }
  function track(event) {
    clearTimeout(releaseTimer);
    point={x:event.clientX,y:event.clientY}; schedulePaint();
  }
  // The art spans the viewport, including the gutters outside .hero.container.
  // Listen on the document, then bound-check against the art inside paint().
  document.addEventListener('pointermove',track,{passive:true});
  document.addEventListener('pointerdown',track,{passive:true});
  document.addEventListener('pointerup',event=>{
    if (event.pointerType !== 'mouse') releaseTimer=setTimeout(clear,reduced.matches ? 0 : 450);
  },{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget) clear();},{passive:true});
  document.addEventListener('pointercancel',clear,{passive:true});
  addEventListener('scroll',()=>{if(point) schedulePaint();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden) clear();});
  reduced.addEventListener('change',clear);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if (!visible) clear();
    }).observe(layer);
  }
  const resize=()=>{if(!resizeFrame) resizeFrame=requestAnimationFrame(build);};
  if ('ResizeObserver' in window) {
    const observer=new ResizeObserver(resize);
    observer.observe(hero); observer.observe(caption);
  }
  addEventListener('resize',resize,{passive:true});
  build();
})();
