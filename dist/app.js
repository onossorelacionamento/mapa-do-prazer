
'use strict';
(async () => {
 const response = await fetch('./pages.json');
 if (!response.ok) throw new Error('N?o foi poss?vel carregar as etapas.');
 const data = await response.json();
 const app = document.getElementById('app');
 const nodes = new Map(data.nodes.map(n => [n.id,n]));
 let timer, frame, progress;

 // Etapas do quiz para o painel (Eventos > Funil do quiz): numero e nome de cada pagina.
 const QUIZ='mapa-do-prazer';
 const STEPS={
  '488e44e2-e362-45dc-afff-32c91a9d03d6':[1,'Idade'],
  '54e6dee9-203c-4fcd-b7d2-c41aa1862aad':[2,'Estado civil'],
  'fe186562-19d8-46d1-a28e-c7d372779ede':[3,'Satisfação com a vida amorosa'],
  '01ddfa1a-cf30-4f47-ae62-aaa3c2fa84c0':[4,'Iniciar uma conversa'],
  '0b701992-1a48-4794-bb06-3349603b00af':[5,'Rejeição'],
  'e2247385-0e8b-4c59-8795-0a0a94940ce3':[6,'Preferem outros homens'],
  'f0758e08-daa0-4ac4-b0fb-e0ef9221e65d':[7,'42 gatilhos da sedução'],
  '4123b3ac-f9d3-41ac-87ef-00f02c1b04ad':[8,'Para que usaria os gatilhos'],
  '49172bbf-98aa-477d-b426-13e3fa1a20e2':[9,'Compromisso de sigilo'],
  'b8f1e98c-1eec-4e5b-b3c8-5ab71fdcd86a':[10,'Analisando respostas'],
  'b8f28533-e02d-48da-b50e-f536769ebe77':[11,'Oferta']
 };
 function track(name, id, extra) {
  const step=STEPS[id];
  if(!step) return;
  try { window.sentinel('track', name, Object.assign({quiz:QUIZ, n:step[0], etapa:step[1]}, extra)); } catch {}
 }
 function go(id, push=true) {
  const node=nodes.get(id);
  if(!node) return;
  if(node.type==='function') { if(node.data.type==='link') { if(window.__stlLoaded&&/lastlink.com/.test(node.data.url)) sentinel('checkout',node.data.url); else location.assign(node.data.url); } return; }
  clearTimeout(timer); cancelAnimationFrame(frame);
  app.innerHTML=data.pages[id];
  track('quiz_etapa', id);
  if(push) history.pushState({page:id},'', '#'+node.data.slug);
  window.scrollTo({top:0,behavior:'instant'});
  for(const el of node.data.elements) {
   const container=document.getElementById(el.id);
   for(const option of el.content?.options||[]) {
    const button=document.getElementById(option.id);
    button?.addEventListener('click',()=> {
     track('quiz_resposta', id, {resposta:(button.textContent||'').replace(/\s+/g,' ').trim().slice(0,80)});
     try {const answers=JSON.parse(sessionStorage.getItem('mapa-respostas')||'{}');answers[el.id]=option.id;sessionStorage.setItem('mapa-respostas',JSON.stringify(answers));} catch {}
     go(option.targetNodeId);
    });
   }
   if(el.type==='button'&&el.targetNodeId) container?.addEventListener('click',()=>go(el.targetNodeId));
   if(el.type==='progress'&&container) {
    const fill=container.querySelector('[style*="width"]'),end=el.content?.endValue??0;
    if(fill){fill.style.width=(progress??el.content?.startValue??0)+'%';fill.getBoundingClientRect();fill.style.transition='width .6s ease-out';fill.style.width=end+'%';}
    progress=end;
   }
   if(el.type==='redirect'&&el.targetNodeId) timer=setTimeout(()=>go(el.targetNodeId), (el.content.delay||0)*1000);
   if(el.type==='loading'&&container) {
    const bar=container.firstElementChild;
    const text=[...container.querySelectorAll('*')].find(e=>e.children.length===0&&/^0%$/.test(e.textContent.trim()));
    const started=performance.now(),duration=(el.content.duration||8)*1000;
    const tick=now=>{
     const percent=Math.min(100,Math.round((now-started)/duration*100));
     if(text)text.textContent=percent+'%';
     if(bar){bar.setAttribute('role','progressbar');bar.setAttribute('aria-label','Analisando respostas');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',percent);const fill=bar.firstElementChild;if(fill)fill.style.width=percent+'%';}
     if(percent<100)frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
   }
  }
 }
 const initial=data.nodes.find(n=>n.type==='page'&&n.data.slug===location.hash.slice(1))?.id||data.start;
 history.replaceState({page:initial},'',location.href);
 addEventListener('popstate',event=>go(event.state?.page||data.start,false));
 go(initial,false);
})().catch(error=>{console.error(error);const message=document.createElement('p');message.setAttribute('role','alert');message.textContent='N?o foi poss?vel carregar o quiz. Atualize a p?gina para tentar novamente.';document.getElementById('app').append(message);});
