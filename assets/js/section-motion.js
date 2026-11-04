/* Lightweight section motion: viewport-driven, touch-friendly, no layout polling. */
(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const graphics = {
    about: '<path d="M12 14H42L60 5H102M42 14L60 23H102"/><circle cx="12" cy="14" r="4"/><circle cx="60" cy="5" r="3"/><circle cx="60" cy="23" r="3"/><circle cx="102" cy="5" r="3"/><circle cx="102" cy="23" r="3"/>',
    experience: '<path d="M10 14H110"/><circle cx="18" cy="14" r="5"/><circle cx="60" cy="14" r="5"/><circle cx="102" cy="14" r="5"/>',
    projects: '<path d="M10 8H45Q60 8 60 14T75 20H110M10 20H45Q60 20 60 14T75 8H110"/><circle cx="10" cy="8" r="3"/><circle cx="110" cy="20" r="3"/>',
    skills: '<path d="M12 8L35 2L58 8L35 14ZM12 14L35 20L58 14M12 20L35 26L58 20M72 7H108M72 14H98M72 21H104"/>',
    credentials: '<path d="M19 4L29 7V14Q29 21 19 25Q9 21 9 14V7ZM14 14L18 18L25 10M45 7H106M45 14H88M45 21H98"/>',
    contact: '<path d="M14 5H48V24H14ZM14 6L31 17L48 6M62 14H106M99 8L106 14L99 20"/><circle cx="62" cy="14" r="3"/>'
  };
  Object.entries(graphics).forEach(([id,markup]) => {
    const section=document.getElementById(id);
    const heading=section?.querySelector('.eyebrow');
    if(!heading)return;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 120 28');svg.setAttribute('aria-hidden','true');
    svg.classList.add('section-signal');svg.innerHTML=markup;heading.append(svg);
  });

  const selector='.competency,.job,.project,.skill-detail,.skill-details > li,.cert,.edu,.fact-card,.contact-panel';
  let observer, queued=false;
  const active=new Set();
  function register() {
    queued=false;
    if(!observer)return;
    document.querySelectorAll('main .section-signal, main '+selector.split(',').join(', main ')).forEach(el=>{
      if(el.dataset.motionBound)return;
      el.dataset.motionBound='true';el.classList.add('section-motion');
      const siblings=el.parentElement?Array.from(el.parentElement.children).filter(s=>s.matches(selector)):[];
      el.style.setProperty('--motion-delay',Math.min(Math.max(0,siblings.indexOf(el))*65,260)+'ms');
      observer.observe(el);
    });
  }
  function configure() {
    observer?.disconnect();
    document.querySelectorAll('.section-motion').forEach(el=>{delete el.dataset.motionBound;el.classList.remove('motion-enter','motion-active');});
    active.clear();observer=null;
    if(preference.matches||!('IntersectionObserver' in window))return;
    observer=new IntersectionObserver(entries=>{
      entries.forEach(({target,isIntersecting})=>{
        target.classList.toggle('motion-active',isIntersecting);
        if(isIntersecting) {target.classList.add('motion-enter');active.add(target);}
        else active.delete(target);
      });
    },{threshold:0,rootMargin:'0px 0px -24px 0px'});
    register();
  }
  const changes=new MutationObserver(records=>{
    // Owner editing replaces cards; only newly added elements need registration.
    records.forEach(r=>r.removedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      [node,...node.querySelectorAll('.section-motion')].forEach(el=>{observer?.unobserve(el);active.delete(el);});
    }));
    if(!observer||queued||!records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1)))return;
    queued=true;requestAnimationFrame(register);
  });
  changes.observe(document.querySelector('main'),{childList:true,subtree:true});
  // Stop decorative loops when the page is in the background.
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('motion-paused',document.hidden));
  preference.addEventListener('change',configure);
  configure();
})();
