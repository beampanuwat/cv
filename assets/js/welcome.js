/* A new entrance on every page load; never gated by cookies or local storage. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro=document.createElement('div');
  intro.className='welcome-scene';
  intro.setAttribute('role','region');intro.setAttribute('aria-label','Welcome / ยินดีต้อนรับ');
  intro.innerHTML='<div class="welcome-grid" aria-hidden="true"></div><div class="welcome-orbit orbit-one" aria-hidden="true"></div><div class="welcome-orbit orbit-two" aria-hidden="true"></div><div class="welcome-core"><div class="welcome-emblem" aria-hidden="true"><span>PP</span><i></i><i></i><i></i></div><p class="welcome-kicker">SAP · INTEGRATION · OPERATIONS</p><h2><span class="lang-en">Welcome to my world.</span><span class="lang-th">ยินดีต้อนรับสู่โลกของผม</span></h2><p class="welcome-name">PANUWAT PUAKROONGRUENG</p><div class="welcome-trace" aria-hidden="true"><span></span></div></div><button type="button" class="welcome-skip"><span class="lang-en">Skip intro</span><span class="lang-th">ข้าม Intro</span><span aria-hidden="true"> ↗</span></button>';
  document.documentElement.classList.add('welcome-playing');document.body.append(intro);
  let finished=false,timer;
  function finish(){
    if(finished)return;finished=true;clearTimeout(timer);
    document.documentElement.classList.remove('welcome-playing');intro.classList.add('welcome-leaving');
    window.removeEventListener('wheel',finish);window.removeEventListener('touchstart',finish);window.removeEventListener('keydown',key);
    if(intro.contains(document.activeElement))document.querySelector('.brand')?.focus({preventScroll:true});
    setTimeout(()=>intro.remove(),reduced?0:550);
  }
  function key(event){if(event.key==='Escape')finish();}
  intro.querySelector('button').addEventListener('click',finish);
  window.addEventListener('wheel',finish,{passive:true});window.addEventListener('touchstart',finish,{passive:true});window.addEventListener('keydown',key);
  timer=setTimeout(finish,reduced?450:2400);
  window.addEventListener('pageshow',event=>{if(event.persisted)finish();});
})();
