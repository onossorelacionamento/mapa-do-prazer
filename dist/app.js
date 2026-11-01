
'use strict';
(async () => {
 const response = await fetch('./pages.json');
 if (!response.ok) throw new Error('N?o foi poss?vel carregar as etapas.');
 const data = await response.json();
 const app = document.getElementById('app');
 const nodes = new Map(data.nodes.map(n => [n.id,n]));
 let timer, frame;
 function go(id, push=true) {
  const node=nodes.get(id);
  if(!node) return;
  if(node.type==='function') { if(node.data.type==='link') { if(window.__stlLoaded&&/lastlink.com/.test(node.data.url)) sentinel('checkout',node.data.url); else location.assign(node.data.url); } return; }
  clearTimeout(timer); cancelAnimationFrame(frame);
  app.innerHTML=data.pages[id];
  if(push) history.pushState({page:id},'', '#'+node.data.slug);
  window.scrollTo({top:0,behavior:'instant'});
  for(const el of node.data.elements) {
   const container=document.getElementById(el.id);
   for(const option of el.content?.options||[]) {
    const button=document.getElementById(option.id);
    button?.addEventListener('click',()=> {
     try {const answers=JSON.parse(sessionStorage.getItem('mapa-respostas')||'{}');answers[el.id]=option.id;sessionStorage.setItem('mapa-respostas',JSON.stringify(answers));} catch {}
     go(option.targetNodeId);
    });
   }
   if(el.type==='button'&&el.targetNodeId) container?.addEventListener('click',()=>go(el.targetNodeId));
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
