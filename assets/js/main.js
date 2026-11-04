/* ============================================================
   Panuwat Puakroongrueng — CV interactions
   No frameworks, no build step. Everything is optional: the
   page still reads fine if JavaScript is disabled.
   ============================================================ */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navLinks = document.getElementById('nav-links');
  const menuToggle = document.getElementById('menu-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const cmdk = document.getElementById('cmdk');
  const cmdkTrigger = document.getElementById('cmdk-trigger');
  const cmdkInput = document.getElementById('cmdk-input');
  const cmdkList = document.getElementById('cmdk-list');
  const cmdkEmpty = document.getElementById('cmdk-empty');
  const cmdkDialog = cmdk.querySelector('.cmdk-dialog');
  const toast = document.getElementById('toast');
  const progressBar = document.getElementById('scroll-progress-bar');
  const terminal = document.getElementById('terminal');
  const yearEl = document.getElementById('year');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMAIL = 'beam_panuwat@hotmail.com';

  /* ------------------------------------------------------------
     UI strings
     ------------------------------------------------------------ */
  const UI = {
    en: {
      title: 'Panuwat Puakroongrueng — Senior SAP Technical Support Engineer',
      description: 'Bilingual CV of Panuwat Puakroongrueng — Senior SAP Technical Support Engineer specialising in SAP PI/PO, middleware, Linux infrastructure and production support.',
      themeLight: 'Switch to light theme',
      themeDark: 'Switch to dark theme',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      print: 'Download CV',
      quickJump: 'Open quick jump (Ctrl + K)',
      placeholder: 'Jump to a section or run a command…',
      search: 'Search commands',
      copied: 'Email copied to clipboard',
      copyFailed: 'Could not copy automatically — please copy it manually',
      noResults: 'No commands found.',
      goTo: 'Go to',
      action: 'Action',
      switchLang: 'Switch to Thai',
      copyEmail: 'Copy email',
      printAction: 'Download CV (EN + TH)',
      downloading: 'Downloading the EN and TH PDF versions…',
      viewProfile: 'View full profile photo of Panuwat Puakroongrueng',
      closeProfile: 'Close profile photo',
      backTop: 'Back to top',
    },
    th: {
      title: 'ภานุวัฒน์ พวกรุ่งเรือง — วิศวกรสนับสนุนด้านเทคนิค SAP ระดับอาวุโส',
      description: 'เรซูเม่สองภาษาของ ภานุวัฒน์ พวกรุ่งเรือง วิศวกรสนับสนุนด้านเทคนิค SAP ระดับอาวุโส เชี่ยวชาญ SAP PI/PO, มิดเดิลแวร์, โครงสร้างพื้นฐาน Linux และงานสนับสนุนระบบ Production',
      themeLight: 'เปลี่ยนเป็นธีมสว่าง',
      themeDark: 'เปลี่ยนเป็นธีมมืด',
      menuOpen: 'เปิดเมนู',
      menuClose: 'ปิดเมนู',
      print: 'ดาวน์โหลด CV',
      quickJump: 'เปิดเมนูไปยังหัวข้อ (Ctrl + K)',
      placeholder: 'ไปยังหัวข้อ หรือเรียกคำสั่ง…',
      search: 'ค้นหาคำสั่ง',
      copied: 'คัดลอกอีเมลแล้ว',
      copyFailed: 'คัดลอกอัตโนมัติไม่ได้ — กรุณาคัดลอกด้วยตนเอง',
      noResults: 'ไม่พบคำสั่งที่ค้นหา',
      goTo: 'ไปที่',
      action: 'คำสั่ง',
      switchLang: 'สลับเป็นภาษาอังกฤษ',
      copyEmail: 'คัดลอกอีเมล',
      printAction: 'ดาวน์โหลด CV (EN + TH)',
      downloading: 'กำลังดาวน์โหลดไฟล์ PDF ทั้งฉบับ EN และ TH…',
      viewProfile: 'ดูรูปโปรไฟล์ขนาดเต็มของ ภานุวัฒน์ พวกรุ่งเรือง',
      closeProfile: 'ปิดรูปโปรไฟล์',
      backTop: 'กลับขึ้นด้านบน',
    },
  };

  const ui = () => UI[root.lang] || UI.en;

  /* ------------------------------------------------------------
     Language
     ------------------------------------------------------------ */
  function applyLanguage(lang, persist = true) {
    const next = lang === 'th' ? 'th' : 'en';
    root.lang = next;
    document.title = UI[next].title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', UI[next].description);

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === next));
    });

    if (persist) {
      try { localStorage.setItem('cv-lang', next); } catch (e) { /* ignore */ }
    }

    syncControlLabels();
    if (!cmdk.hidden) renderCmdk();
  }

  function syncControlLabels() {
    const labels = ui();
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', root.dataset.theme === 'dark' ? labels.themeLight : labels.themeDark);
    }
    if (menuToggle) {
      const open = header.classList.contains('menu-open');
      menuToggle.setAttribute('aria-label', open ? labels.menuClose : labels.menuOpen);
    }
    document.querySelectorAll('.print-btn').forEach((btn) => btn.setAttribute('aria-label', labels.printAction));
    const profileTrigger = document.querySelector('[data-lightbox-open]');
    if (profileTrigger) profileTrigger.setAttribute('aria-label', labels.viewProfile);
    const lightboxClose = document.querySelector('.lightbox-close');
    if (lightboxClose) lightboxClose.setAttribute('aria-label', labels.closeProfile);
    if (cmdkTrigger) cmdkTrigger.setAttribute('aria-label', labels.quickJump);
    if (cmdkInput) {
      cmdkInput.placeholder = labels.placeholder;
      cmdkInput.setAttribute('aria-label', labels.search);
    }
    const empty = document.getElementById('cmdk-empty');
    if (empty) {
      const en = empty.querySelector('.lang-en');
      const th = empty.querySelector('.lang-th');
      if (en) en.textContent = labels.noResults;
    }
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  /* ------------------------------------------------------------
     Theme
     ------------------------------------------------------------ */
  function syncTheme() {
    const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#05070d' : '#f4f7fc');
    syncControlLabels();
    if (!cmdk.hidden) renderCmdk();
  }

  function setTheme(theme, persist = true) {
    root.dataset.theme = theme === 'light' ? 'light' : 'dark';
    if (persist) {
      try { localStorage.setItem('cv-theme', root.dataset.theme); } catch (e) { /* ignore */ }
    }
    syncTheme();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  if (window.matchMedia) {
    const scheme = window.matchMedia('(prefers-color-scheme: light)');
    if (scheme.addEventListener) {
      scheme.addEventListener('change', (event) => {
        let hasPreference = false;
        try { hasPreference = Boolean(localStorage.getItem('cv-theme')); } catch (e) { /* ignore */ }
        if (!hasPreference) setTheme(event.matches ? 'light' : 'dark', false);
      });
    }
  }

  /* ------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------ */
  function closeMenu() {
    if (!header.classList.contains('menu-open')) return;
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', ui().menuOpen);
  }

  function openMenu() {
    header.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', ui().menuClose);
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      header.classList.contains('menu-open') ? closeMenu() : openMenu();
    });
  }

  navLinks.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (header.classList.contains('menu-open') && !header.contains(event.target)) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeMenu();
  }, { passive: true });

  /* ------------------------------------------------------------
     Scroll progress, header state and active nav link
     ------------------------------------------------------------ */
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const navAnchors = Array.from(document.querySelectorAll('.nav-link'));
  let sectionTops = [];
  let ticking = false;

  function measureSections() {
    const scrollY = window.scrollY || window.pageYOffset;
    sectionTops = sections.map((section) => ({
      id: section.id,
      top: section.getBoundingClientRect().top + scrollY,
    }));
  }

  function updateScrollUI() {
    const scrollY = window.scrollY || window.pageYOffset;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;

    if (progressBar) progressBar.style.width = (ratio * 100).toFixed(2) + '%';
    if (header) header.classList.toggle('is-scrolled', scrollY > 8);

    let current = '';
    const offset = (header ? header.offsetHeight : 74) + 130;
    for (const section of sectionTops) {
      if (scrollY + offset >= section.top) current = section.id;
    }
    if (max > 0 && scrollY >= max - 4) current = sections.length ? sections[sections.length - 1].id : current;

    navAnchors.forEach((anchor) => {
      anchor.classList.toggle('is-active', anchor.getAttribute('href') === '#' + current);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollUI();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    measureSections();
    onScroll();
  }, { passive: true });
  window.addEventListener('load', measureSections);
  document.fonts && document.fonts.ready.then(measureSections).catch(() => {});
  measureSections();
  updateScrollUI();

  /* ------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------ */
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((item, index) => {
      if (item.closest('.hero')) item.style.transitionDelay = Math.min(index * 55, 330) + 'ms';
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------
     Counter animation
     ------------------------------------------------------------ */
  const counterFrames = new WeakMap();
  function animateCounter(el) {
    window.cancelAnimationFrame(counterFrames.get(el));
    if (reduceMotion) {
      el.textContent = String(Number(el.dataset.count || 0));
      return;
    }
    const duration = 1500;
    el.textContent = '0';
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(eased * Number(el.dataset.count || 0)));
      if (t < 1) counterFrames.set(el, window.requestAnimationFrame(frame));
    }
    counterFrames.set(el, window.requestAnimationFrame(frame));
  }

  const counters = Array.from(document.querySelectorAll('.counter'));
  if ('IntersectionObserver' in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) animateCounter(entry.target);
        else window.cancelAnimationFrame(counterFrames.get(entry.target));
      });
    }, { threshold: 0.5 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  /* ------------------------------------------------------------
     Terminal typing effect
     ------------------------------------------------------------ */
  const COMMANDS = [
    { cmd: 'whoami', out: [{ text: 'panuwat — sap technical support engineer' }] },
    { cmd: 'cat core-stack.txt', out: [{ text: 'pi/po  ·  hana  ·  kong  ·  kafka  ·  linux' }] },
    { cmd: 'status --availability', out: [{ text: 'immediate start', ok: true }] },
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function makeTermLine(className) {
    const line = document.createElement('div');
    line.className = 'term-line' + (className ? ' ' + className : '');
    return line;
  }

  function renderTerminalStatic() {
    terminal.textContent = '';
    COMMANDS.forEach((command) => {
      const cmdLine = makeTermLine();
      const prompt = document.createElement('span');
      prompt.className = 'term-prompt';
      prompt.textContent = '$ ';
      const cmd = document.createElement('span');
      cmd.className = 'term-cmd-text';
      cmd.textContent = command.cmd;
      cmdLine.append(prompt, cmd);
      terminal.append(cmdLine);

      command.out.forEach((out) => {
        const line = makeTermLine('term-out');
        if (out.ok) {
          const ok = document.createElement('span');
          ok.className = 'term-ok';
          ok.textContent = '● ';
          line.append(ok);
        }
        line.append(document.createTextNode(out.text));
        terminal.append(line);
      });
    });
    appendCursor();
  }

  function appendCursor() {
    const line = makeTermLine();
    const prompt = document.createElement('span');
    prompt.className = 'term-prompt';
    prompt.textContent = '$ ';
    const cursor = document.createElement('span');
    cursor.className = 'term-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    line.append(prompt, cursor);
    terminal.append(line);
  }

  let terminalStarted = false;

  async function runTerminal() {
    if (terminalStarted || !terminal) return;
    terminalStarted = true;

    if (reduceMotion) {
      renderTerminalStatic();
      return;
    }

    terminal.textContent = '';
    for (const command of COMMANDS) {
      const cmdLine = makeTermLine();
      const prompt = document.createElement('span');
      prompt.className = 'term-prompt';
      prompt.textContent = '$ ';
      const cmd = document.createElement('span');
      cmd.className = 'term-cmd-text';
      cmdLine.append(prompt, cmd);
      terminal.append(cmdLine);

      for (const character of command.cmd) {
        cmd.textContent += character;
        await sleep(38);
      }
      await sleep(140);

      for (const out of command.out) {
        const line = makeTermLine('term-out');
        if (out.ok) {
          const ok = document.createElement('span');
          ok.className = 'term-ok';
          ok.textContent = '● ';
          line.append(ok);
        }
        line.append(document.createTextNode(out.text));
        terminal.append(line);
        await sleep(80);
      }

      await sleep(620);
    }
    appendCursor();
  }

  if (terminal) {
    if (reduceMotion) runTerminal();
    else setTimeout(runTerminal, 450);
  }

  /* ------------------------------------------------------------
     Pointer spotlight (hero)
     ------------------------------------------------------------ */
  const hero = document.querySelector('.hero');
  if (hero && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
      hero.style.setProperty('--my', (event.clientY - rect.top) + 'px');
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     Copy to clipboard + toast
     ------------------------------------------------------------ */
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function fallbackCopy(text) {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.top = '0';
    helper.style.left = '-9999px';
    body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    let success = false;
    try { success = document.execCommand('copy'); } catch (e) { success = false; }
    helper.remove();
    return success;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to the legacy method */ }
    return fallbackCopy(text);
  }

  document.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-copy]');
    if (!trigger) return;
    const text = trigger.dataset.copy || EMAIL;
    const success = await copyText(text);
    showToast(success ? ui().copied : ui().copyFailed);
  });

  /* ------------------------------------------------------------
     Skill tabs
     ------------------------------------------------------------ */
  const skillTabs = Array.from(document.querySelectorAll('.skill-tab'));
  const skillPanels = Array.from(document.querySelectorAll('.skill-panel'));

  function activateSkillTab(tab, focusTab = false) {
    if (!tab) return;
    skillTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    const panelId = tab.getAttribute('aria-controls');
    skillPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.id === panelId);
    });

    if (focusTab) tab.focus();
  }

  skillTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateSkillTab(tab));

    tab.addEventListener('keydown', (event) => {
      const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % skillTabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + skillTabs.length) % skillTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = skillTabs.length - 1;

      activateSkillTab(skillTabs[nextIndex], true);
    });
  });

  /* ------------------------------------------------------------
     Hero integration topology (simulated outages)
     ------------------------------------------------------------ */
  const topology = document.querySelector('[data-topology]');
  if (topology) {
    const nodes = Array.from(topology.querySelectorAll('.tp-node'));
    const off = new Set();
    const routes = [
      {nodes:['client','kong','wd','pi','ecc'],edges:['api-in','gateway','dispatch','ecc-in']},
      {nodes:['client','pi','ecc'],edges:['direct-in','ecc-in']},
      {nodes:['client','sftp','pi','ecc'],edges:['file-in','file-send','ecc-in']},
      {nodes:['ecc','pi','client'],edges:['ecc-out','direct-out']},
      {nodes:['ecc','pi','client'],edges:['ecc-out','direct-out']},
      {nodes:['ecc','pi','sftp','client'],edges:['ecc-out','file-receive','file-out']},
      {nodes:['ecc','pi','s4'],edges:['ecc-out','s4-in']},
      {nodes:['s4','pi','ecc'],edges:['s4-out','ecc-in']},
    ];
    // Inbound and outbound also support S/4HANA as the SAP endpoint.
    routes.slice(0,6).forEach(route=>routes.push({nodes:route.nodes.map(id=>id==='ecc'?'s4':id),edges:route.edges.map(id=>id.replace('ecc-','s4-'))}));
    const paths = Array.from(topology.querySelectorAll('.tp-path')).map(path=>({path,id:path.id.replace('tp-path-',''),length:path.getTotalLength()}));
    const packets=[];
    paths.forEach((segment,index)=>{
      const tone=segment.path.classList.contains('tp-path-file')?'file':segment.path.classList.contains('tp-path-core')?'core':'api';
      for(let i=0;i<2;i++){
        const el=document.createElementNS('http://www.w3.org/2000/svg','circle');
        el.setAttribute('r','2.6');el.setAttribute('class','tp-packet tp-packet-'+tone);
        topology.querySelector('.tp-packets').append(el);
        packets.push({el,segment,t:(i/2+index*.08)%1,speed:tone==='file'?34:38});
      }
    });
    function blocked(segment){return !routes.some(route=>route.edges.includes(segment.id)&&route.nodes.every(id=>!off.has(id)));}
    const reset=document.querySelector('[data-topology-reset]');
    function render(){
      nodes.forEach(node=>{const down=off.has(node.dataset.node);node.classList.toggle('is-off',down);node.setAttribute('aria-pressed',String(down));});
      paths.forEach(segment=>{segment.path.classList.toggle('is-down',blocked(segment));});
      packets.forEach(packet=>packet.el.classList.toggle('is-stalled',blocked(packet.segment)));
      const badge=document.querySelector('[data-topology-status]');badge.classList.toggle('is-degraded',off.size>0);badge.querySelector('.live-label').textContent=off.size?'DEGRADED':'LIVE';
      const log=document.querySelector('[data-topology-log]');log.textContent='';
      const item=document.createElement('li');item.className=off.size?'topology-incident':'topology-ok';
      item.textContent=off.size?(off.has('sftp')?'SFTP connection failed':'HTTP 503 Service Unavailable')+' · '+Array.from(off).map(id=>topology.querySelector('[data-node="'+id+'"] .tp-node-name').textContent).join(', '):'Inbound ↔ Outbound · ECC ↔ S/4HANA · All flows healthy';
      log.append(item);reset.disabled=!off.size;
      document.querySelector('[data-topology-foot-en]').textContent=(nodes.length-off.size)+' / '+nodes.length+' online · all flows in one landscape';
      document.querySelector('[data-topology-foot-th]').textContent='ออนไลน์ '+(nodes.length-off.size)+' / '+nodes.length+' · ทุก Flow ในภาพเดียว';
    }
    nodes.forEach(node=>{
      const toggle=()=>{const id=node.dataset.node;if(off.has(id))off.delete(id);else off.add(id);render();};
      node.addEventListener('click',toggle);node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
    });
    reset.addEventListener('click',()=>{off.clear();render();});
    let last=0;
    function animate(now){
      const delta=last?Math.min(72,now-last):16;last=now;
      packets.forEach(packet=>{
        if(!reduceMotion&&!blocked(packet.segment))packet.t=(packet.t+packet.speed*delta/1000/packet.segment.length)%1;
        const point=packet.segment.path.getPointAtLength(packet.t*packet.segment.length);
        packet.el.setAttribute('cx',point.x.toFixed(2));packet.el.setAttribute('cy',point.y.toFixed(2));
      });
      if(!reduceMotion)requestAnimationFrame(animate);
    }
    render();requestAnimationFrame(animate);
  }

  /* ------------------------------------------------------------
     Profile lightbox
     ------------------------------------------------------------ */
  const lightbox = document.getElementById('profile-lightbox');
  const lightboxTrigger = document.querySelector('[data-lightbox-open]');
  let lightboxLastFocused = null;

  function openLightbox() {
    if (!lightbox || !lightbox.hidden) return;
    if (cmdk && !cmdk.hidden) closeCmdk();
    lightboxLastFocused = document.activeElement;
    lightbox.hidden = false;
    body.classList.add('lightbox-open');
    const closeButton = lightbox.querySelector('.lightbox-close');
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    body.classList.remove('lightbox-open');
    const restoreTarget = lightboxLastFocused && lightboxLastFocused !== body ? lightboxLastFocused : lightboxTrigger;
    if (restoreTarget && typeof restoreTarget.focus === 'function') {
      restoreTarget.focus({ preventScroll: true });
    }
  }

  if (lightboxTrigger) {
    lightboxTrigger.addEventListener('click', openLightbox);
  }

  if (lightbox) {
    lightbox.querySelectorAll('[data-lightbox-close]').forEach((element) => {
      element.addEventListener('click', closeLightbox);
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      const closeButton = lightbox.querySelector('.lightbox-close');
      if (closeButton) closeButton.focus();
    });
  }

  /* ------------------------------------------------------------
     Print / download PDF
     ------------------------------------------------------------ */
  const PDF_FILES = [
    { href: 'assets/pdf/CV_Panuwat_Puakroongrueng_EN_Updated.pdf', filename: 'CV_Panuwat_Puakroongrueng_EN_Updated.pdf' },
    { href: 'assets/pdf/CV_Panuwat_Puakroongrueng_TH_Updated.pdf', filename: 'CV_Panuwat_Puakroongrueng_TH_Updated.pdf' },
  ];

  function downloadPdfs() {
    if (window.CVEditor) {
      closeMenu();
      if (cmdk && !cmdk.hidden) closeCmdk();
      return window.CVEditor.download();
    }
    closeMenu();
    if (!cmdk.hidden) closeCmdk();
    showToast(ui().downloading);

    PDF_FILES.forEach((file, index) => {
      window.setTimeout(() => {
        const link = document.createElement('a');
        link.href = file.href;
        link.download = file.filename;
        link.rel = 'noopener';
        body.appendChild(link);
        link.click();
        link.remove();
      }, index * 400);
    });
  }

  document.querySelectorAll('[data-print]').forEach((button) => {
    button.addEventListener('click', downloadPdfs);
  });

  window.addEventListener('beforeprint', () => {
    closeMenu();
    if (!cmdk.hidden) closeCmdk();
  });

  /* ------------------------------------------------------------
     Command palette (Ctrl / Cmd + K)
     ------------------------------------------------------------ */
  const SECTION_COMMANDS = [
    { id: 'about', en: 'Overview', th: 'ภาพรวม', icon: 'i-activity' },
    { id: 'experience', en: 'Experience', th: 'ประสบการณ์', icon: 'i-server' },
    { id: 'projects', en: 'Projects', th: 'ผลงานโครงการ', icon: 'i-briefcase' },
    { id: 'skills', en: 'Tech stack', th: 'ทักษะ', icon: 'i-layers' },
    { id: 'credentials', en: 'Credentials', th: 'ใบรับรอง', icon: 'i-award' },
    { id: 'contact', en: 'Contact', th: 'ติดต่อ', icon: 'i-mail' },
  ];

  let lastFocused = null;
  let activeIndex = 0;
  let visibleCommands = [];

  function buildCommands() {
    const labels = ui();
    const lang = root.lang;
    const commands = SECTION_COMMANDS.map((section) => ({
      en: section.en,
      th: section.th,
      label: lang === 'th' ? section.th : section.en,
      hint: labels.goTo,
      icon: section.icon,
      run: () => {
        closeCmdk();
        const target = document.getElementById(section.id);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      },
    }));

    commands.push(
      {
        en: 'Switch to Thai',
        th: 'สลับเป็นภาษาไทย',
        label: labels.switchLang,
        hint: labels.action,
        icon: 'i-code',
        run: () => applyLanguage(root.lang === 'en' ? 'th' : 'en'),
        keepOpen: true,
      },
      {
        en: 'Switch to light theme',
        th: 'เปลี่ยนธีมสว่าง/มืด',
        label: root.dataset.theme === 'dark' ? labels.themeLight : labels.themeDark,
        hint: labels.action,
        icon: root.dataset.theme === 'dark' ? 'i-sun' : 'i-moon',
        run: () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'),
        keepOpen: true,
      },
      {
        en: 'Download CV',
        th: 'ดาวน์โหลด CV',
        label: labels.printAction,
        hint: labels.action,
        icon: 'i-download',
        run: () => { closeCmdk(); downloadPdfs(); },
      },
      {
        en: 'Copy email',
        th: 'คัดลอกอีเมล',
        label: labels.copyEmail,
        hint: labels.action,
        icon: 'i-copy',
        run: async () => {
          const success = await copyText(window.CVEditor?.getEmail() || EMAIL);
          showToast(success ? ui().copied : ui().copyFailed);
        },
        keepOpen: true,
      },
      {
        en: 'Back to top',
        th: 'กลับขึ้นด้านบน',
        label: labels.backTop,
        hint: labels.action,
        icon: 'i-arrow-up',
        run: () => {
          closeCmdk();
          window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        },
      }
    );

    return commands;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[character]));
  }

  function renderCmdk() {
    if (!cmdkList || !cmdkInput) return;
    const query = cmdkInput.value.trim().toLowerCase();
    const all = buildCommands();
    visibleCommands = all.filter((command) => {
      if (!query) return true;
      const haystack = [command.en, command.th, command.label, command.hint].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    activeIndex = visibleCommands.length ? 0 : -1;

    cmdkList.innerHTML = visibleCommands.map((command, index) => {
      const selected = index === activeIndex;
      return '<li class="cmdk-item' + (selected ? ' is-active' : '') + '" role="option" aria-selected="' + selected + '" data-index="' + index + '">'
        + '<svg class="icon" aria-hidden="true"><use href="#' + command.icon + '"></use></svg>'
        + '<span class="cmdk-item-label">' + escapeHtml(command.label) + '</span>'
        + '<span class="cmdk-item-hint">' + escapeHtml(command.hint) + '</span>'
        + '</li>';
    }).join('');

    if (cmdkEmpty) cmdkEmpty.hidden = visibleCommands.length > 0;
    updateActiveItem();
  }

  function updateActiveItem() {
    if (!cmdkList) return;
    const items = Array.from(cmdkList.querySelectorAll('.cmdk-item'));
    items.forEach((item, index) => {
      const active = index === activeIndex;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      if (active) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function runActiveCommand() {
    const command = visibleCommands[activeIndex];
    if (!command) return;
    command.run();
  }

  function openCmdk() {
    if (!cmdk) return;
    if (lightbox && !lightbox.hidden) closeLightbox();
    lastFocused = document.activeElement;
    cmdk.hidden = false;
    body.style.overflow = 'hidden';
    if (cmdkInput) cmdkInput.value = '';
    renderCmdk();
    window.requestAnimationFrame(() => {
      if (cmdkInput) cmdkInput.focus();
    });
  }

  function closeCmdk() {
    if (!cmdk || cmdk.hidden) return;
    cmdk.hidden = true;
    body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
  }

  if (cmdkTrigger) cmdkTrigger.addEventListener('click', openCmdk);

  if (cmdk) {
    cmdk.querySelectorAll('[data-cmdk-close]').forEach((element) => {
      element.addEventListener('click', closeCmdk);
    });
  }

  if (cmdkInput) {
    cmdkInput.addEventListener('input', renderCmdk);

    cmdkInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!visibleCommands.length) return;
        activeIndex = (activeIndex + 1) % visibleCommands.length;
        updateActiveItem();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!visibleCommands.length) return;
        activeIndex = (activeIndex - 1 + visibleCommands.length) % visibleCommands.length;
        updateActiveItem();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        runActiveCommand();
      } else if (event.key === 'Home') {
        event.preventDefault();
        activeIndex = 0;
        updateActiveItem();
      } else if (event.key === 'End') {
        event.preventDefault();
        activeIndex = visibleCommands.length - 1;
        updateActiveItem();
      }
    });
  }

  if (cmdkList) {
    cmdkList.addEventListener('click', (event) => {
      const item = event.target.closest('[data-index]');
      if (!item) return;
      const command = visibleCommands[Number(item.dataset.index)];
      if (command) command.run();
    });

    cmdkList.addEventListener('mouseover', (event) => {
      const item = event.target.closest('[data-index]');
      if (!item) return;
      const index = Number(item.dataset.index);
      if (index !== activeIndex) {
        activeIndex = index;
        updateActiveItem();
      }
    });
  }

  if (cmdkDialog) {
    cmdkDialog.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        if (cmdkInput) cmdkInput.focus();
      }
    });
  }

  /* ------------------------------------------------------------
     Global keyboard shortcuts
     ------------------------------------------------------------ */
  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const commandKey = (event.ctrlKey || event.metaKey) && key === 'k';
    if (commandKey) {
      event.preventDefault();
      cmdk.hidden ? openCmdk() : closeCmdk();
      return;
    }
    if (event.key === 'Escape') {
      if (lightbox && !lightbox.hidden) {
        event.preventDefault();
        closeLightbox();
      } else if (!cmdk.hidden) {
        event.preventDefault();
        closeCmdk();
      } else if (header.classList.contains('menu-open')) {
        closeMenu();
      }
    }
  });

  /* ------------------------------------------------------------
     Initial state
     ------------------------------------------------------------ */
  applyLanguage(root.lang || 'en', false);
  syncTheme();
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
