/* Local owner editing. Password verification and write authorization live on the server. */
(() => {
  'use strict';
  // GitHub Pages serves the public CV only; it has no owner API.
  if (location.hostname.endsWith('.github.io')) return;
  let data, session = {authenticated:false}, ready = false, lastFocus;
  const q = (s, root=document) => root.querySelector(s);
  const qa = (s, root=document) => Array.from(root.querySelectorAll(s));
  const templates = Object.fromEntries([
    ['experience','.timeline .job'],['projects','.project-list .project'],
    ['credentials','.cert-list .cert'],['education','.edu-list .edu']
  ].map(([key,selector])=>[key,q(selector).cloneNode(true)]));
  const groups = {experience:'.timeline',projects:'.project-list',credentials:'.cert-list',education:'.edu-list'};
  const labels = {experience:'Experience',projects:'Projects',credentials:'Credentials',education:'Education'};
  const lang = () => document.documentElement.lang === 'th' ? 'th' : 'en';
  const tr = (en,th) => lang()==='th'?th:en;
  const node = (tag,text,cls) => { const el=document.createElement(tag); if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el; };
  function bi(el,value) {
    el.replaceChildren();
    ['en','th'].forEach(l=>el.append(node('span',value[l],'lang-'+l)));
  }
  function setBi(selector,value,root=document) { const el=q(selector,root); if(el)bi(el,value); }
  function list(el,values,bilingual=false) {
    el.replaceChildren();
    if(bilingual) {
      const en=values.en.split('\n'),th=values.th.split('\n');
      for(let i=0;i<Math.max(en.length,th.length);i++) {
        if(!en[i]?.trim()&&!th[i]?.trim())continue;
        const li=node('li');bi(li,{en:en[i]||'',th:th[i]||''});el.append(li);
      }
    } else values.split(',').map(x=>x.trim()).filter(Boolean).forEach(x=>el.append(node('li',x)));
  }
  async function api(path,method='GET',body) {
    const res=await fetch('/api/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json',...(session.csrf?{'X-CSRF-Token':session.csrf}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    const value=await res.json();
    if(!res.ok) {
      if(res.status===401&&path!=='login') {session={authenticated:false};ownerUI();}
      throw Error(value.error||'Request failed');
    }
    return value;
  }
  const dialog=document.createElement('dialog');dialog.className='cv-dialog';document.body.append(dialog);
  function close() {dialog.close();lastFocus?.focus();}
  function modal(title) {
    lastFocus=document.activeElement;dialog.replaceChildren();
    const head=node('div',undefined,'cv-dialog-head');head.append(node('h2',title));
    const x=node('button','×','cv-close');x.type='button';x.setAttribute('aria-label','Close / ปิด');x.addEventListener('click',close);head.append(x);dialog.append(head);
    const form=document.createElement('form');form.className='cv-form';dialog.append(form);
    const error=node('p','', 'cv-error');error.setAttribute('role','alert');form.append(error);
    if(!dialog.open)dialog.showModal();
    return {form,error};
  }
  dialog.addEventListener('cancel',()=>lastFocus?.focus());
  function field(form,label,value='',options={}) {
    const wrap=node('label',label,'cv-field');
    const input=document.createElement(options.multiline?'textarea':'input');
    if(!options.multiline)input.type=options.type||'text';
    input.value=value;input.required=!!options.required;
    input.maxLength=options.max||12000;
    if(options.type==='password') {input.autocomplete='current-password';input.maxLength=256;}
    if(options.multiline)input.rows=5;
    wrap.append(input);form.append(wrap);return input;
  }
  function biFields(form,label,value,options={}) {
    const en=field(form,label+' (EN)',value.en,options),th=field(form,label+' (TH)',value.th,options);
    return ()=>({en:en.value.trim(),th:th.value.trim()});
  }
  function button(parent,text,fn,cls='cv-button') {
    const b=node('button',text,cls);b.type='button';b.addEventListener('click',fn);parent.append(b);return b;
  }
  function submit(form,text='บันทึก / Save') {
    const b=node('button',text,'cv-button cv-primary');b.type='submit';form.append(b);return b;
  }
  async function save(next) { data=await api('content','PUT',next);render(); }
  async function commit(form,error,fn) {
    const b=q('[type="submit"]',form);b.disabled=true;error.textContent='';
    try {await fn();close();}catch(e){error.textContent=e.message;}finally{b.disabled=false;}
  }
  async function imageInput(form,current,label,required=false) {
    let value=current;
    const wrap=node('label',label+' · JPG / PNG / WebP (max 8 MB)','cv-field');
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';
    const preview=node('img');preview.className='cv-image-preview';preview.alt='Image preview';preview.hidden=!current;if(current)preview.src=current;
    const status=node('span','');status.setAttribute('role','status');
    let pending=Promise.resolve();
    input.addEventListener('change',()=>{
      const file=input.files[0];if(!file)return;
      pending=(async()=>{
        if(file.size>8*1024*1024)throw Error('รูปต้องไม่เกิน 8 MB');
        if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('กรุณาใช้ JPG / PNG / WebP');
        const bitmap=await createImageBitmap(file);
        const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
        value=canvas.toDataURL('image/jpeg',.88);preview.src=value;preview.hidden=false;status.textContent='พร้อมบันทึกรูปใหม่ · Ready to save';
      })().catch(e=>{status.textContent=e.message;input.value='';throw e;});
      pending.catch(()=>{});
    });
    wrap.append(input,preview,status);form.append(wrap);
    if(current&&!required)button(form,'ลบรูป / Remove image',()=>{value='';preview.hidden=true;input.value='';});
    return async()=>{await pending;if(required&&!value)throw Error('กรุณาเลือกรูป');return value;};
  }
  async function editOverview() {
    const {form,error}=modal('Overview · รูปภาพและประสบการณ์');
    const years=field(form,'ปีประสบการณ์ / Years',data.overview.years,{type:'number',required:true});years.min='0';years.max='99';
    const companies=field(form,'จำนวนองค์กร / Companies',data.overview.companies,{type:'number',required:true});companies.min='0';companies.max='99';
    const experience=biFields(form,'ข้อความประสบการณ์',data.overview.experience,{required:true});
    form.append(node('p','รูปใหม่จะใช้ทั้ง Header, Overview และรูปขยาย โดยแทนที่รูปเดิมหลังบันทึก','cv-note'));
    const profile=await imageInput(form,data.profile,'รูปโปรไฟล์ / Profile',true);
    submit(form);form.addEventListener('submit',event=>{event.preventDefault();commit(form,error,async()=>{
      const next=structuredClone(data);next.overview={years:years.value,companies:companies.value,experience:experience()};next.profile=await profile();await save(next);
    });});
  }
  function editAvailability() {
    const {form,error}=modal('สถานะรับงาน / Job availability');
    const label=node('label','สถานะ / Status','cv-field'),select=document.createElement('select');
    [['true','เปิดรับงาน · Open to work'],['false','ปิดรับงาน · Not accepting opportunities']].forEach(([value,text])=>{const opt=node('option',text);opt.value=value;select.append(opt);});
    select.value=String(data.availability.open);label.append(select);form.append(label,node('p','วันที่ยืนยันสถานะจะเปลี่ยนเมื่อคุณกดบันทึก แม้เลือกสถานะเดิม','cv-note'));
    submit(form);form.addEventListener('submit',event=>{event.preventDefault();commit(form,error,async()=>{
      const next=structuredClone(data);next.availability={open:select.value==='true',updated:new Date().toISOString()};await save(next);
    });});
  }
  async function editEntry(group,id) {
    const existing=data[group].find(x=>x.id===id);
    const value=existing?structuredClone(existing):{id:crypto.randomUUID()};
    const {form,error}=modal((existing?'แก้ไข / Edit ':'เพิ่ม / Add ')+labels[group]);
    const getters={};const blank={en:'',th:''};
    const plain=(key,label,required=false)=>{const input=field(form,label,value[key]||'',{required});getters[key]=()=>input.value.trim();};
    const both=(key,label,multiline=false,required=false)=>getters[key]=biFields(form,label,value[key]||blank,{multiline,required});
    if(group==='experience') {plain('company','ชื่อบริษัท / Company',true);both('period','ช่วงเวลาทำงาน / Work dates',false,true);both('role','ตำแหน่ง / Role',false,true);plain('tags','เทคโนโลยี (คั่นด้วย comma) / Tags');both('points','รายละเอียด (หนึ่งข้อ/บรรทัด) / Responsibilities',true,true);}
    if(group==='projects') {both('kind','ประเภทโครงการ / Category',false,true);both('title','ชื่อโครงการ / Title',false,true);both('role','บทบาท / Role');plain('tags','เทคโนโลยี (คั่นด้วย comma) / Tags');both('summary','สรุป / Summary',true,true);both('points','รายละเอียด (หนึ่งข้อ/บรรทัด) / Details',true,true);}
    if(group==='credentials') {plain('year','ปี / Year',true);both('title','ชื่อใบรับรอง / Title',false,true);both('issuer','หน่วยงาน / Issuer',false,true);}
    if(group==='education') {plain('period','ช่วงปี / Period',true);both('title','วุฒิ / Qualification',false,true);both('school','สถาบัน / School',false,true);}
    const logo=['experience','projects'].includes(group)?await imageInput(form,value.logo||'','โลโก้ / Logo',group==='experience'):null;
    submit(form);form.addEventListener('submit',event=>{event.preventDefault();commit(form,error,async()=>{
      for(const [key,get] of Object.entries(getters))value[key]=get();if(logo)value.logo=await logo();
      const next=structuredClone(data),index=next[group].findIndex(x=>x.id===id);
      if(index<0)next[group].push(value);else next[group][index]=value;
      await save(next);
    });});
  }
  function removeEntry(group,id) {
    const item=data[group].find(x=>x.id===id);
    const {form,error}=modal('ลบรายการ / Delete entry');
    form.append(node('p','ลบ '+(item.company||item.title?.[lang()]||labels[group])+'? รายการนี้จะถูกนำออกจาก CV เมื่อยืนยัน'));
    submit(form,'ยืนยันลบ / Delete');form.addEventListener('submit',e=>{e.preventDefault();commit(form,error,async()=>{const next=structuredClone(data);next[group]=next[group].filter(x=>x.id!==id);await save(next);});});
  }
  function editContact() {
    const {form,error}=modal('Contact · ข้อมูลติดต่อ');
    const email=field(form,'อีเมล / Email',data.contact.email,{type:'email',required:true});
    const phone=field(form,'โทรศัพท์ / Phone',data.contact.phone,{type:'tel',required:true});
    const location=biFields(form,'ที่อยู่ / Location',data.contact.location,{required:true});
    const description=biFields(form,'ข้อความติดต่อ / Contact message',data.contact.description,{multiline:true});
    form.append(node('p','PDF ที่แนบเป็นไฟล์เดิม การแก้หน้าเว็บไม่เปลี่ยนเนื้อหา PDF กรุณาอัปเดตไฟล์ PDF ให้ตรงกันก่อนเผยแพร่','cv-note'));
    submit(form);form.addEventListener('submit',e=>{e.preventDefault();commit(form,error,async()=>{const next=structuredClone(data);next.contact={email:email.value.trim(),phone:phone.value.trim(),location:location(),description:description()};await save(next);});});
  }
  function renderEntries() {
    for(const group of Object.keys(groups)) {
      const parent=q(groups[group]);parent.replaceChildren();
      data[group].forEach((item,index)=>{
        const card=templates[group].cloneNode(true);card.classList.remove('reveal');card.classList.add('is-visible');card.dataset.entryId=item.id;
        if(group==='experience') {
          q('.job-company',card).textContent=item.company;setBi('.job-period',item.period,card);setBi('.job-role',item.role,card);
          list(q('.job-tags',card),item.tags);list(q('.job-points',card),item.points,true);
          const img=q('.job-logo img',card);img.src=item.logo;img.alt=item.company;
        }
        if(group==='projects') {
          q('.project-index',card).textContent=String(index+1).padStart(2,'0');
          setBi('.project-kind',item.kind,card);setBi('.project-title h3',item.title,card);setBi('.project-role',item.role,card);setBi('.project-summary',item.summary,card);
          list(q('.project-tags',card),item.tags);list(q('.project-points',card),item.points,true);
          if(item.logo) {const wrap=node('span',undefined,'job-logo project-logo');const img=node('img');img.src=item.logo;img.alt=item.title[lang()];wrap.append(img);q('.project-head',card).append(wrap);}
        }
        if(group==='credentials') {q('.cert-year',card).textContent=item.year;setBi('.cert-title',item.title,card);setBi('.cert-meta',item.issuer,card);}
        if(group==='education') {q('.edu-years',card).textContent=item.period;setBi('h4',item.title,card);setBi('.edu-school',item.school,card);}
        if(session.authenticated) {
          const bar=node('div',undefined,'cv-owner-actions');button(bar,'แก้ไข / Edit',()=>editEntry(group,item.id));button(bar,'ลบ / Delete',()=>removeEntry(group,item.id));card.append(bar);
        }
        parent.append(card);
      });
      if(session.authenticated) {const bar=node('div',undefined,'cv-owner-actions');button(bar,'+ เพิ่ม / Add '+labels[group],()=>editEntry(group));parent.append(bar);}
    }
  }
  function render() {
    if(!data)return;
    const availability=data.availability.open?{en:'Open to work · Available for immediate start',th:'เปิดรับงาน · พร้อมเริ่มงานได้ทันที'}:{en:'Not accepting new opportunities',th:'ปิดรับงานในขณะนี้'};
    const pill=q('.status-pill');pill.classList.toggle('is-closed',!data.availability.open);
    ['en','th'].forEach(l=>q('.lang-'+l,pill).textContent=availability[l]);
    const time=q('.availability-updated time');time.dateTime=data.availability.updated;
    const date=new Date(data.availability.updated);
    ['en','th'].forEach(l=>q('.lang-'+l,time).textContent=new Intl.DateTimeFormat(l==='th'?'th-TH':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'}).format(date));
    const facts=qa('.fact-list > div');bi(q('dd',facts[0]),data.contact.location);bi(q('dd',facts[1]),data.overview.experience);bi(q('dd',facts[3]),availability);
    qa('.brand-mark img,.avatar-photo img,#profile-lightbox img').forEach(img=>img.src=data.profile);
    const counters=qa('.counter');[data.overview.years,data.overview.companies,'9',String(data.credentials.length)].forEach((value,i)=>{counters[i].dataset.count=value;counters[i].textContent=value;});
    qa('a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+data.contact.email;const span=q('span',a);if(span)span.textContent=data.contact.email;else a.textContent=data.contact.email;});
    qa('[data-copy]').forEach(b=>b.dataset.copy=data.contact.email);
    qa('a[href^="tel:"]').forEach(a=>{a.href='tel:'+data.contact.phone.replace(/[ ()-]/g,'');const span=q('span',a);if(span)span.textContent=data.contact.phone;else a.textContent=data.contact.phone;});
    const heroLoc=q('.hero-meta li');if(heroLoc) {const svg=q('svg',heroLoc)?.cloneNode(true);bi(heroLoc,data.contact.location);if(svg)heroLoc.prepend(svg);}
    setBi('.contact-lede',data.availability.open?data.contact.description:{en:'I am currently not accepting new opportunities. You can still view my experience and contact details below.',th:'ขณะนี้ปิดรับโอกาสงานใหม่ สามารถดูประสบการณ์และข้อมูลติดต่อของผมได้ด้านล่าง'});setBi('.availability',availability);
    const location=q('.contact-links > span');if(location) {const svg=q('svg',location)?.cloneNode(true);bi(location,data.contact.location);if(svg)location.prepend(svg);}
    renderEntries();ownerUI();window.dispatchEvent(new Event('resize'));
  }
  let loginButton,notifyButton;
  function ownerUI() {
    qa('.cv-inline-owner').forEach(el=>el.remove());
    if(loginButton) {loginButton.textContent=session.authenticated?'⏻':'🔒';loginButton.title=session.authenticated?'ออกจากระบบเจ้าของเว็บ / Sign out':'เจ้าของเว็บ / Owner sign in';loginButton.setAttribute('aria-label',loginButton.title);}
    if(notifyButton)notifyButton.hidden=!session.authenticated;
    if(!session.authenticated||!data)return;
    const fact=node('div',undefined,'cv-owner-actions cv-inline-owner');button(fact,'แก้ไขรูปและประสบการณ์ / Edit overview',editOverview);q('.fact-card').append(fact);
    const status=node('div',undefined,'cv-owner-actions cv-inline-owner');button(status,'แก้ไขสถานะ / Update availability',editAvailability);q('.hero-intro').append(status);
    const contact=node('div',undefined,'cv-owner-actions cv-inline-owner');button(contact,'แก้ไข Contact',editContact);q('.contact-panel').append(contact);
  }
  function login() {
    const {form,error}=modal('เจ้าของเว็บ / Owner sign in');
    const password=field(form,'รหัสผ่าน / Password','',{type:'password',required:true});
    form.append(node('p','เฉพาะเจ้าของเว็บเท่านั้นที่แก้ไขและดูแจ้งเตือนได้','cv-note'));submit(form,'เข้าสู่ระบบ / Sign in');
    form.addEventListener('submit',e=>{e.preventDefault();commit(form,error,async()=>{session=await api('login','POST',{password:password.value});password.value='';render();await poll();});});
    password.focus();
  }
  function dateTime(value) {
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
    const get=type=>parts.find(x=>x.type===type).value;
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
  }
  async function poll() {
    if(!session.authenticated)return;
    try {const value=await api('notifications');const count=value.events.filter(e=>!e.read).length;notifyButton.textContent='🔔'+(count?' '+count:'');notifyButton.setAttribute('aria-label','แจ้งเตือนดาวน์โหลด / Download notifications: '+count);return value;}catch(e){return {events:[]};}
  }
  async function notifications() {
    const {form,error}=modal('แจ้งเตือนดาวน์โหลด / Download notifications');
    form.append(node('p','ชื่อบริษัทเป็นข้อมูลที่ผู้ดาวน์โหลดกรอกเอง · เวลาไทย (UTC+7) · Log เก็บในหน่วยความจำและหายเมื่อรีสตาร์ตเซิร์ฟเวอร์','cv-note'));
    try {
      const result=await api('notifications');
      if(!result.events.length)form.append(node('p','ยังไม่มีการดาวน์โหลด / No downloads yet'));
      for(const event of result.events)form.append(node('p',`บริษัท ${event.company} ทำการดาวน์โหลด CV ของคุณ เมื่อ ${dateTime(event.time)} · ${event.languages.join(' + ')}${event.read?'':' · ใหม่'}`,'cv-notification'));
      await api('notifications/read','POST',{});await poll();
    }catch(e){error.textContent=e.message;}
  }
  async function download() {
    if(!ready) {alert(tr('The editor server is not available. Please open the local editor URL.','ระบบยังไม่พร้อม กรุณาเปิดผ่านเซิร์ฟเวอร์สำหรับแก้ไข'));return;}
    const {form,error}=modal(tr('Thank you for your interest','ขอบคุณที่สนใจโปรไฟล์ของผม'));
    form.append(node('p',tr('May I ask which company you represent? I’d love to know where my next opportunity might come from.','ขอทราบได้ไหมครับว่าคุณมาจากบริษัทใด? ผมยินดีที่ได้รู้จักบริษัทที่อาจเป็นโอกาสถัดไปของผม')));
    const company=field(form,tr('Company name','ชื่อบริษัท'),'',{required:true,max:120});company.minLength=2;
    const label=node('label',tr('Resume language','ภาษาเรซูเม่'),'cv-field'),select=document.createElement('select');
    [['en','English'],['th','ภาษาไทย'],['both','EN + TH']].forEach(([value,text])=>{const option=node('option',text);option.value=value;select.append(option);});select.value='both';label.append(select);form.append(label);
    form.append(node('p',tr('Your company name and request time will be shown privately to the CV owner. No email address is required.','ชื่อบริษัทและเวลาที่ขอรับไฟล์จะแสดงให้เจ้าของ CV เห็นเท่านั้น ไม่ต้องระบุอีเมล'),'cv-note'));
    submit(form,tr('Download resume','ดาวน์โหลดเรซูเม่'));
    form.addEventListener('submit',e=>{e.preventDefault();commit(form,error,async()=>{
      const {ticket}=await api('download','POST',{company:company.value.trim()});
      for(const l of select.value==='both'?['en','th']:[select.value]) {
        const res=await fetch('/api/download?ticket='+encodeURIComponent(ticket)+'&lang='+l);
        if(!res.ok)throw Error('Unable to download PDF. Please try again.');
        const url=URL.createObjectURL(await res.blob());const a=node('a');a.href=url;a.download='CV_Panuwat_Puakroongrueng_'+l.toUpperCase()+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      }
      await poll();
    });});company.focus();
  }
  async function init() {
    try {
      [data,session]=await Promise.all([api('content'),api('session')]);ready=true;
      window.CVEditor={download,getEmail:()=>data?.contact.email};
      loginButton=button(q('.nav-actions'),'⚿',async()=>{if(session.authenticated){await api('logout','POST',{});session={authenticated:false};render();}else login();},'icon-btn cv-owner-login');
      loginButton.setAttribute('aria-label','เจ้าของเว็บ / Owner sign in');
      notifyButton=button(q('.nav-actions'),'♧',notifications,'icon-btn cv-notify');notifyButton.hidden=true;
      render();await poll();setInterval(poll,5000);
    }catch(e){console.info('Local editing is unavailable; showing the static CV.');}
  }
  init();
})();
