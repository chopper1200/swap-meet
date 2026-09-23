
var WK="https://wild-sunset-677a.matb4.workers.dev";
var PAL=["#FF6600","#53d8fb","#C8963C","#a8ff78","#ee4540","#c792ea","#ff9f43","#26de81"];
var SCAT=["Carburante","Cibo","Albergo","Pedaggi","Parcheggio","Altro"];
var ss="loading",sm="...",tt=null;
function toast(msg,t){var e=document.getElementById("toast");if(!e)return;clearTimeout(tt);e.textContent=msg;e.className="toast show "+(t||"");tt=setTimeout(function(){e.className="toast";},3000);}
function defS(){return{vend:[{n:"Matteo",c:"#FF6600",p:false,perc:20},{n:"James",c:"#53d8fb",p:false,perc:20},{n:"Paride",c:"#C8963C",p:false,perc:20},{n:"Simone",c:"#a8ff78",p:false,perc:20},{n:"Nichil",c:"#ee4540",p:false,perc:20}],sale:{Matteo:[],James:[],Paride:[],Simone:[],Nichil:[]},spese:[],magazzino:[],tab:"Matteo",view:"input"};}
var S=defS();
var formDrafts = Object.create(null), renderedPage = null, sync;
function ll(){
  var saved=sync.restore();
  if(saved){S=saved;return;}
  try{var raw=localStorage.getItem("swphd2");if(raw){S=JSON.parse(raw);sync.base=SwapSync.fingerprint(S);}}catch(e){}
  sync.state=S;
}
function sl(){sync.state=S;sync.persist();}
function fx(){
  if(!S||!Array.isArray(S.vend)||!S.vend.length)S=defS();
  if(!S.sale)S.sale={};if(!S.spese)S.spese=[];if(!S.magazzino)S.magazzino=[];
  S.vend.forEach(function(v){if(!Number.isFinite(v.perc))v.perc=20;if(v.p===undefined)v.p=false;if(!S.sale[v.n])S.sale[v.n]=[];});
  if(!gv(S.tab))S.tab=S.vend[0].n;
}
function hasDraft(){
  return !!document.querySelector('#mw .modal-box') ||
    Array.from(document.querySelectorAll('[data-draft]')).some(function(e){return e.value!==e.dataset.initial;}) ||
    /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
}
function request(method,body){
  var controller=new AbortController();var timer=setTimeout(function(){controller.abort();},12000);
  return fetch(WK,{method:method,cache:'no-store',signal:controller.signal,
    headers:method==='PUT'?{'Content-Type':'application/json'}:{},body:body}).finally(function(){clearTimeout(timer);});
}
function loadR(){sync.refresh();}
function saveR(){sync.flush();}
function sv(){sync.mark(S);}
function syncText(){return ss==='ok'?'Salvato online':ss==='loading'?'Sincronizzazione…':ss==='pending'?'Da inviare':sync.conflict?'Versioni da verificare':sync.dirty?'Da sincronizzare':'Non connesso';}
function up(){
  var p=document.getElementById('sp');if(p){p.textContent=syncText();p.className='sync-pill '+ss;}
  var box=document.getElementById('sync-notice');if(!box)return;
  box.replaceChildren();box.hidden=ss!=='err';
  if(ss==='err'){
    box.appendChild(el('div','err-bar-title',sync.conflict?'REGISTRO AGGIORNATO DA UN ALTRO DISPOSITIVO':'SINCRONIZZAZIONE IN ATTESA'));
    box.appendChild(el('div','err-bar-msg',sm||'I dati già caricati restano disponibili su questo dispositivo.'));
    box.appendChild(bt('Riprova','retry-btn',function(){sync.conflict=false;loadR();}));
    box.appendChild(bt('Esporta backup','retry-btn',backup));
    if(sync.conflict)box.appendChild(bt('Carica versione online','retry-btn',async function(){
      if(!confirm('Le modifiche locali non inviate saranno sostituite. Hai esportato il backup?'))return;
      try{var remote=await sync.remote();sync.conflict=false;sync.dirty=false;sync.base=SwapSync.fingerprint(remote);acceptRemote(remote,true);sync.state=S;sync.persist();ss='ok';sm='';render();}catch(e){sm=e.message;up();}
    }));
  }
}
function acceptRemote(state,changed){if(!changed)return S;var view=S.view,tab=S.tab;S=state;S.view=view;S.tab=tab;fx();render();return S;}
function backup(){
  var blob=new Blob([JSON.stringify({format:'swap-meet-backup',version:1,exportedAt:new Date().toISOString(),state:S},null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='swap-meet-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
}
function uid(){return typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function rememberDrafts(){if(!renderedPage)return;formDrafts[renderedPage]=Array.from(document.querySelectorAll('#app [data-draft]')).map(function(e){return e.value;});}
function restoreDrafts(){
  renderedPage=S.view+':'+S.tab;
  var fields=Array.from(document.querySelectorAll('#app input:not(.perc-inp),#app select'));
  fields.forEach(function(e,i){e.dataset.draft=String(i);e.dataset.initial=e.value;e.setAttribute('aria-label',e.getAttribute('aria-label')||e.placeholder||'Articolo');if(formDrafts[renderedPage]&&formDrafts[renderedPage][i]!==undefined)e.value=formDrafts[renderedPage][i];});
}
function removeVendor(nome){
  if((S.sale[nome]||[]).length){toast('Questo venditore ha vendite: conservalo nel registro.','err');return;}
  if(S.vend.length<=1||!confirm('Rimuovere '+nome+'?'))return;
  S.vend=S.vend.filter(function(v){return v.n!==nome;});delete S.sale[nome];S.tab=S.vend[0].n;document.getElementById('mw').replaceChildren();sv();render();
}
function mo(n){return"\u20AC"+(+n).toFixed(2).replace(".",",");}
function fd(d){try{return new Date(d).toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});}catch(e){return"";}}
function gv(n){for(var i=0;i<S.vend.length;i++)if(S.vend[i].n===n)return S.vend[i];return null;}
function gm(id){for(var i=0;i<S.magazzino.length;i++)if(S.magazzino[i].id===id)return S.magazzino[i];return null;}
function tot(n){var a=S.sale[n]||[],s=0;for(var i=0;i<a.length;i++)s+=a[i].importo;return s;}
function totG(){var s=0;for(var i=0;i<S.vend.length;i++)s+=tot(S.vend[i].n);return s;}
function totSp(){var s=0;for(var i=0;i<S.spese.length;i++)s+=S.spese[i].importo;return s;}
function totM(){var s=0;for(var i=0;i<S.magazzino.length;i++)s+=S.magazzino[i].qty;return s;}
function pv(v){return tot(v.n)*(v.perc/100);}
function nv(v){return tot(v.n)-pv(v);}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e;}
function mk(t,s,x){var e=document.createElement(t);if(s)e.style.cssText=s;if(x!==undefined)e.textContent=x;return e;}
function bt(x,c,f){var e=el("button",c,x);e.onclick=f;return e;}

function bnav(){
  var nav=document.getElementById('bnav');nav.replaceChildren();
  var icons={input:'<path d="M3 7h18v14H3zM3 7l3-4h12l3 4M8 12h8m-8 4h5"/>',riepilogo:'<path d="M4 20V10m8 10V4m8 16v-7"/>',spese:'<path d="M4 5h16v14H4zM4 9h16m-6 5h3"/>',magazzino:'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5m-9 5v9M7 5l9 5"/>'};
  [{k:'input',l:'Vendite'},{k:'riepilogo',l:'Riepilogo'},{k:'spese',l:'Spese'},{k:'magazzino',l:'Magazzino'}].forEach(function(x){
    var b=bt('','nav-btn'+(S.view===x.k?' on':''),function(){S.view=x.k;render();});
    if(S.view===x.k)b.setAttribute('aria-current','page');
    var icon=el('span','nav-icon');icon.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[x.k]+'</svg>';
    b.appendChild(icon);b.appendChild(el('span','nav-label',x.l));nav.appendChild(b);
  });
}

function render(){
  rememberDrafts();
  var root=document.getElementById("app");root.innerHTML="";
  var vv=gv(S.tab)||S.vend[0];var col=vv?vv.c:"#FF6600";
  // HEADER
  var hdr=el("div","hdr");
  var lr=el("div","logo-row");
  var lw=el("div","logo-wrap");
  var shield=mk("div","brand-icon");
  var logo=document.createElement('img');logo.src='icons/icon.svg';logo.alt='';logo.width=48;logo.height=48;shield.appendChild(logo);
  lw.appendChild(shield);
  var lt=el("div");lt.appendChild(el("div","logo-sub","IL TUO BANCO, IN ORDINE"));
  var lm=el("div","logo-main");lm.innerHTML="SWAP <span>MEET</span>";lt.appendChild(lm);lw.appendChild(lt);lr.appendChild(lw);
  var rb=mk("div","display:flex;flex-direction:column;align-items:flex-end;gap:6px;");
  var pill=mk("span","");pill.id="sp";pill.textContent=syncText();pill.className='sync-pill '+ss;
  rb.appendChild(pill);rb.appendChild(bt("\u21BB Aggiorna","refresh-btn",function(){loadR(render);}));
  lr.appendChild(rb);hdr.appendChild(lr);
  // tabs
  var tabs=el("div","tabs-wrap");
  S.vend.forEach(function(vx){
    var on=S.tab===vx.n&&S.view==="input";
    var tb=bt(vx.n+(vx.p?" "+vx.perc+"%":""),"tab-btn"+(on?" on":""),function(n){return function(){S.tab=n;S.view="input";render();};}(vx.n));
    if(on)tb.style.background=vx.c;
    var lt2;
    tb.addEventListener("touchstart",function(n){return function(){lt2=setTimeout(function(){openEdit(n);},600);};}(vx.n),{passive:true});
    tb.addEventListener("touchend",function(){clearTimeout(lt2);},{passive:true});
    tb.addEventListener("contextmenu",function(n){return function(e){e.preventDefault();openEdit(n);};}(vx.n));
    tabs.appendChild(tb);
  });
  tabs.appendChild(bt("+ Nuovo","new-tab",openNew));
  hdr.appendChild(tabs);root.appendChild(hdr);
  var ct=el("div","ct");

  var notice=el('div','err-bar');notice.id='sync-notice';notice.hidden=true;ct.appendChild(notice);
  if(S.view==="input")rInput(ct,vv,col);
  else if(S.view==="riepilogo")rRiep(ct);
  else if(S.view==="spese")rSpese(ct);
  else rMag(ct);
  root.appendChild(ct);
  bnav();restoreDrafts();up();
}

function rInput(ct,vv,col){
  var nome=vv.n,ps=vv.p,perc=vv.perc,sales=S.sale[nome]||[],t=tot(nome);
  var hero=el("div","hero");
  hero.appendChild(el("div","hero-label","VENDITE DI "+nome.toUpperCase()));
  var hv=el("div","hero-val",mo(t));hv.style.color=col;hero.appendChild(hv);
  if(ps&&t>0)hero.appendChild(mk("div","font-size:12px;color:var(--tx2);margin-top:4px;","Netto "+mo(nv(vv))+" · Perc. "+mo(pv(vv))));
  var hs=el("div","hero-stats");
  var h1=el("div","hstat");h1.appendChild(el("div","hstat-label","VENDITE"));h1.appendChild(el("div","hstat-val",String(sales.length)));
  var h2=el("div","hstat");h2.appendChild(el("div","hstat-label","MEDIA"));h2.appendChild(el("div","hstat-val",sales.length?mo(t/sales.length):"—"));
  var h3=el("div","hstat");h3.appendChild(el("div","hstat-label","MAGAZZINO"));h3.appendChild(el("div","hstat-val",totM()+" pz"));
  hs.appendChild(h1);hs.appendChild(h2);hs.appendChild(h3);hero.appendChild(hs);ct.appendChild(hero);
  var card=el("div","card");
  var ch=el("div","card-hdr");
  var cl=el("div");var cn=el("div","card-name",nome);cn.style.color=col;cl.appendChild(cn);if(ps)cl.appendChild(el("div","card-badge","PERC. "+perc+"% ATTIVA"));
  var cr=el("div");var ctv=el("div","card-total",mo(t));ctv.style.color=col;cr.appendChild(ctv);if(ps&&t>0)cr.appendChild(el("div","card-netto","netto "+mo(nv(vv))));
  cl.appendChild(bt("Modifica venditore","edit-vendor",function(){openEdit(nome);}));ch.appendChild(cl);ch.appendChild(cr);card.appendChild(ch);
  var pr=el("div","perc-row");
  var tbg=bt("","toggle",null);tbg.setAttribute("role","switch");tbg.setAttribute("aria-checked",String(ps));tbg.setAttribute("aria-label","Applica percentuale");tbg.style.background=ps?col:"#2E2E2E";
  var tdt=el("div","toggle-dot");tdt.style.left=ps?"21px":"3px";tbg.appendChild(tdt);
  tbg.onclick=function(){vv.p=!vv.p;sv();render();};
  pr.appendChild(tbg);pr.appendChild(el("div","perc-label","Percentuale:"));
  var pi=document.createElement("input");pi.type="number";pi.value=perc;pi.min=0;pi.max=100;pi.className="perc-inp";pi.setAttribute("aria-label","Percentuale del venditore");
  pi.onchange=function(){var v=parseFloat(pi.value);if(!isNaN(v)&&v>=0&&v<=100){vv.perc=v;sv();render();}};
  pr.appendChild(pi);pr.appendChild(el("div","perc-label","%"));
  if(ps&&t>0){var pa=el("div","perc-arrow","\u2192 "+mo(pv(vv)));pr.appendChild(pa);}
  card.appendChild(pr);
  var ia=el("div","inp-area");var ir=el("div","inp-row");
  var ai=document.createElement("input");ai.type="text";ai.inputMode="decimal";ai.placeholder="0,00";ai.setAttribute("aria-label","Importo vendita in euro");ai.className="amt-inp";ai.style.borderColor=col+"44";
  var ni=document.createElement("input");ni.type="text";ni.placeholder="nota...";ni.className="note-inp";
  var mw2=el("div","mag-sel-wrap");mw2.appendChild(el("span","mag-sel-label","Articolo:"));
  var ms=document.createElement("select");ms.className="mag-sel";
  var o0=document.createElement("option");o0.value="";o0.textContent="— nessuno —";ms.appendChild(o0);
  S.magazzino.forEach(function(item){if(item.qty<=0)return;var o=document.createElement("option");o.value=item.id;o.textContent=item.nome+" ("+item.qty+")"+(item.prezzoV?" "+mo(item.prezzoV):"");ms.appendChild(o);});
  ms.onchange=function(){var item=gm(ms.value);if(item&&item.prezzoV)ai.value=item.prezzoV;};mw2.appendChild(ms);
  var ab=bt("Registra vendita","add-btn",function(){
    var val=Number((ai.value||"").trim().replace(",","."));if(!Number.isFinite(val)||val<=0){toast("Inserisci un importo valido maggiore di zero.","err");return;}val=Math.round(val*100)/100;
    var mid=ms.value||null;if(mid){var item=gm(mid);if(!item||item.qty<=0){toast("Articolo esaurito. Scegli un altro articolo.","err");return;}item.qty--;}
    if(!S.sale[nome])S.sale[nome]=[];
    S.sale[nome].push({importo:val,nota:ni.value||"",id:uid(),data:new Date().toISOString(),magId:mid});
    ai.value="";ni.value="";ms.value="";sv();render();toast("Vendita registrata","ok");
  });
  ai.onkeydown=function(e){if(e.key==="Enter")ab.onclick();};
  ir.appendChild(ai);ir.appendChild(ab);ia.appendChild(ir);ia.appendChild(ni);ia.appendChild(mw2);card.appendChild(ia);
  var sl=el("div","sale-list");
  if(!sales.length){sl.appendChild(el("div","no-sales","NESSUNA VENDITA REGISTRATA"));}
  else{sales.slice().reverse().forEach(function(s){
    var si=el("div","sale-item");var info=el("div");
    var sa=el("div","sale-amt",mo(s.importo));sa.style.color=col;info.appendChild(sa);
    info.appendChild(el("div","sale-date",fd(s.data)));
    if(s.nota)info.appendChild(el("div","sale-nota",s.nota));
    if(ps)info.appendChild(el("div","sale-perc","PERC. "+mo(s.importo*(perc/100))));
    if(s.magId){var mag=gm(s.magId);info.appendChild(el("span","sale-mag",mag?mag.nome:"art."));}
    var db=bt("\u2715","del-btn",function(sale){return function(){if(!confirm("Eliminare questa vendita e ripristinare il pezzo in magazzino?"))return;if(sale.magId){var item=gm(sale.magId);if(item)item.qty++;}S.sale[nome]=S.sale[nome].filter(function(x){return x.id!==sale.id;});sv();render();};}(s));
    si.appendChild(info);si.appendChild(db);sl.appendChild(si);
  });}
  card.appendChild(sl);
  if(S.vend.length>1)card.appendChild(bt("Rimuovi venditore","rm-btn",function(){removeVendor(nome);}));
  ct.appendChild(card);
}

function rRiep(ct){
  var tg=totG(),ts=totSp();
  var rh=el("div","riep-hero");
  var rb=el("div");rb.appendChild(el("div","riep-total","TOTALE GENERALE"));rb.appendChild(el("div","riep-val",mo(tg)));
  if(ts>0)rb.appendChild(mk("div","font-size:11px;color:var(--tx2);margin-top:4px;","Incassi meno spese: "+mo(tg-ts)));
  rh.appendChild(rb);rh.appendChild(bt("Stampa / PDF","pdf-btn",esporta));ct.appendChild(rh);ct.appendChild(bt("Esporta backup del registro","backup-btn",backup));
  S.vend.forEach(function(vx){
    var t=tot(vx.n),n=(S.sale[vx.n]||[]).length;
    var rc=el("div","riep-card");rc.style.borderLeft="3px solid "+vx.c;
    var row=el("div","riep-row");
    var rl=el("div");var rn=el("div","riep-name",vx.n);rn.style.color=vx.c;rl.appendChild(rn);rl.appendChild(el("div","riep-count",n+(n===1?" VENDITA":" VENDITE")));
    var rr=el("div");var ra=el("div","riep-amt",mo(t));ra.style.color=vx.c;rr.appendChild(ra);
    if(vx.p&&t>0){rr.appendChild(el("div","riep-netto","netto "+mo(nv(vx))));var bdg=el("div","riep-badge",vx.perc+"% = "+mo(pv(vx)));bdg.style.color=vx.c;bdg.style.background=vx.c+"20";rr.appendChild(bdg);}
    row.appendChild(rl);row.appendChild(rr);rc.appendChild(row);
    var pg=el("div","prog");var pf=el("div","prog-fill");pf.style.background=vx.c;pf.style.width=(tg>0?(t/tg*100):0)+"%";pg.appendChild(pf);rc.appendChild(pg);ct.appendChild(rc);
  });
  S.vend.forEach(function(vx){
    if(!vx.p||tot(vx.n)<=0)return;
    var pb=el("div","pbox");pb.style.background=vx.c+"08";pb.style.borderLeft="3px solid "+vx.c;
    var pt=el("div","pbox-title","PERCENTUALE "+vx.n.toUpperCase()+" ("+vx.perc+"%)");pb.appendChild(pt);
    [["Vendite lorde",mo(tot(vx.n))],["Percentuale ("+vx.perc+"%)","- "+mo(pv(vx))]].forEach(function(r){var rr=el("div","pbox-row");rr.appendChild(el("div","pbox-k",r[0]));rr.appendChild(el("div","pbox-v",r[1]));pb.appendChild(rr);});
    pb.appendChild(el("div","pbox-div"));
    var tr=el("div","pbox-tot");var tk=el("div","pbox-tk","Netto "+vx.n);var tv=el("div","pbox-tv",mo(nv(vx)));tv.style.color=vx.c;tr.appendChild(tk);tr.appendChild(tv);pb.appendChild(tr);ct.appendChild(pb);
  });
  if(ts>0){
    var sb=el("div","pbox");sb.style.background="rgba(255,107,0,0.05)";sb.style.borderLeft="3px solid #ff6b00";
    var st=el("div","pbox-title","TOTALE SPESE");st.style.color="#ff6b00";sb.appendChild(st);
    var cats={};S.spese.forEach(function(s){cats[s.cat]=(cats[s.cat]||0)+s.importo;});
    Object.keys(cats).forEach(function(cat){var r=el("div","pbox-row");r.appendChild(el("div","pbox-k",cat));r.appendChild(el("div","pbox-v",mo(cats[cat])));sb.appendChild(r);});
    sb.appendChild(el("div","pbox-div"));
    var tr2=el("div","pbox-tot");var tk2=el("div","pbox-tk","Totale");var tv2=el("div","pbox-tv",mo(ts));tv2.style.color="#ff6b00";tr2.appendChild(tk2);tr2.appendChild(tv2);sb.appendChild(tr2);ct.appendChild(sb);
  }
}

function rSpese(ct){
  var ts=totSp();
  var sh=el("div","sp-hero");sh.appendChild(el("div","sp-label","TOTALE SPESE"));sh.appendChild(el("div","sp-val",mo(ts)));ct.appendChild(sh);
  var sf=el("div","sp-form");sf.appendChild(el("div","sp-form-title","NUOVA SPESA"));
  var r1=mk("div","display:flex;gap:8px;margin-bottom:10px;");
  var si=document.createElement("input");si.type="number";si.inputMode="decimal";si.placeholder="\u20AC IMPORTO";si.className="sp-inp";
  var sel=document.createElement("select");sel.className="sp-sel";sel.setAttribute("aria-label","Categoria della spesa");
  SCAT.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o);});
  r1.appendChild(si);r1.appendChild(sel);sf.appendChild(r1);
  var sn=document.createElement("input");sn.type="text";sn.placeholder="nota...";sn.className="note-inp";sn.style.marginBottom="4px";sf.appendChild(sn);
  var sab=bt("+ AGGIUNGI SPESA","sp-add",function(){var val=Number((si.value||"").trim().replace(",","."));if(!Number.isFinite(val)||val<=0){toast("Inserisci un importo valido maggiore di zero.","err");return;}val=Math.round(val*100)/100;S.spese.push({importo:val,cat:sel.value,nota:sn.value||"",id:uid(),data:new Date().toISOString()});si.value="";sn.value="";sv();render();});
  si.onkeydown=function(e){if(e.key==="Enter")sab.onclick();};sf.appendChild(sab);ct.appendChild(sf);
  if(!S.spese.length){ct.appendChild(el("div","empty-card","NESSUNA SPESA REGISTRATA"));return;}
  var list=el("div","card");
  S.spese.slice().reverse().forEach(function(s){
    var si2=el("div","sp-item");var info=el("div");
    var fr=mk("div","display:flex;align-items:center;gap:8px;margin-bottom:3px;");fr.appendChild(el("span","sp-cat",s.cat));fr.appendChild(el("span","sp-amt",mo(s.importo)));
    info.appendChild(fr);info.appendChild(el("div","sp-date",fd(s.data)));if(s.nota)info.appendChild(mk("div","font-size:11px;color:var(--tx3);margin-top:1px;",s.nota));
    var db=bt("\u2715","del-btn",function(id){return function(){if(!confirm("Eliminare questa spesa?"))return;S.spese=S.spese.filter(function(x){return x.id!==id;});sv();render();};}(s.id));
    si2.appendChild(info);si2.appendChild(db);list.appendChild(si2);
  });ct.appendChild(list);
}

function rMag(ct){
  var totPz=totM(),totVal=0;S.magazzino.forEach(function(i){totVal+=i.qty*(i.prezzoV||0);});
  var mh=el("div","mag-hero");mh.appendChild(el("div","mag-label","MAGAZZINO"));mh.appendChild(el("div","mag-val",totPz+" PEZZI"));
  var mhr=el("div","hero-stats");
  var ms1=el("div","hstat");ms1.appendChild(el("div","hstat-label","ARTICOLI"));ms1.appendChild(el("div","hstat-val",String(S.magazzino.length)));
  var ms2=el("div","hstat");ms2.appendChild(el("div","hstat-label","VALORE"));ms2.appendChild(el("div","hstat-val",mo(totVal)));
  var esauriti=S.magazzino.filter(function(i){return i.qty===0;}).length;
  var ms3=el("div","hstat");ms3.appendChild(el("div","hstat-label","ESAURITI"));ms3.appendChild(el("div","hstat-val",String(esauriti)));
  mhr.appendChild(ms1);mhr.appendChild(ms2);mhr.appendChild(ms3);mh.appendChild(mhr);ct.appendChild(mh);
  var mf=el("div","mag-form");mf.appendChild(el("div","mag-form-title","NUOVO ARTICOLO"));
  var r1=mk("div","display:flex;gap:8px;margin-bottom:10px;");
  var mnome=document.createElement("input");mnome.type="text";mnome.placeholder="Nome articolo";mnome.className="mag-inp";r1.appendChild(mnome);mf.appendChild(r1);
  var r2=mk("div","display:flex;gap:6px;margin-bottom:4px;align-items:center;flex-wrap:wrap;");
  var mqty=document.createElement("input");mqty.type="number";mqty.placeholder="Qtà";mqty.className="mag-inp-sm";mqty.style.width="60px";mqty.value=1;
  var mpA=document.createElement("input");mpA.type="number";mpA.placeholder="\u20AC acq.";mpA.className="mag-inp-sm";mpA.style.width="80px";
  var mpV=document.createElement("input");mpV.type="number";mpV.placeholder="\u20AC vend.";mpV.className="mag-inp-sm";mpV.style.width="80px";
  r2.appendChild(mk("span","font-size:10px;color:var(--tx3);","Qtà:"));r2.appendChild(mqty);r2.appendChild(mk("span","font-size:10px;color:var(--tx3);","Acq:"));r2.appendChild(mpA);r2.appendChild(mk("span","font-size:10px;color:var(--tx3);","Vend:"));r2.appendChild(mpV);mf.appendChild(r2);
  var madd=bt("+ AGGIUNGI ARTICOLO","mag-add-btn",function(){var nome=mnome.value.trim(),qty=Number(mqty.value),pa=Number(mpA.value),pv=Number(mpV.value);if(!nome||!Number.isInteger(qty)||qty<0||!Number.isFinite(pa)||pa<0||!Number.isFinite(pv)||pv<0){toast("Controlla nome, quantità intera e prezzi non negativi.","err");return;}S.magazzino.push({id:uid(),nome:nome,qty:qty,prezzoA:pa,prezzoV:pv});mnome.value="";mqty.value=1;mpA.value="";mpV.value="";sv();render();});
  mnome.onkeydown=function(e){if(e.key==="Enter")madd.onclick();};mf.appendChild(madd);ct.appendChild(mf);
  if(!S.magazzino.length){ct.appendChild(el("div","empty-card","MAGAZZINO VUOTO"));return;}
  var list=el("div","card");
  S.magazzino.forEach(function(item){
    var si=el("div","mag-item");var info=el("div");
    var nr=mk("div","display:flex;align-items:center;");nr.appendChild(el("div","mag-item-name",item.nome));nr.appendChild(el("span","mag-badge"+(item.qty===0?" out":""),item.qty===0?"ESAURITO":item.qty+" pz"));info.appendChild(nr);
    var pi="";if(item.prezzoA)pi+="acq. "+mo(item.prezzoA);if(item.prezzoV)pi+=(pi?" · ":"")+"vend. "+mo(item.prezzoV);if(pi)info.appendChild(el("div","mag-item-price",pi));
    var qw=el("div","mag-qty-wrap");
    qw.appendChild(bt("-","mag-qty-btn minus",function(i){return function(){if(i.qty>0){i.qty--;sv();render();};};}(item)));
    qw.appendChild(el("div","mag-qty"+(item.qty===0?" zero":""),String(item.qty)));
    qw.appendChild(bt("+","mag-qty-btn",function(i){return function(){i.qty++;sv();render();};}(item)));
    qw.appendChild(bt("\u2715","mag-del-btn",function(id){return function(){if(!confirm("Rimuovere?"))return;S.magazzino=S.magazzino.filter(function(x){return x.id!==id;});sv();render();};}(item.id)));
    si.appendChild(info);si.appendChild(qw);list.appendChild(si);
  });ct.appendChild(list);
}

function openNew(){
  var mw=document.getElementById("mw");mw.innerHTML="";var np=false,npc=20;
  var ov=mk("div","position:fixed;inset:0;background:rgba(0,0,0,0.93);z-index:50;display:flex;align-items:flex-end;justify-content:center;");
  var mb=el("div","modal-box");mb.appendChild(el("div","modal-title","Nuovo Venditore"));
  var mi=document.createElement("input");mi.type="text";mi.placeholder="Nome...";mi.className="modal-inp";mi.setAttribute("aria-label","Nome venditore");mb.appendChild(mi);
  var tr=el("div","modal-trow");var tbg=el("div","toggle");tbg.style.background="#2E2E2E";var tdt=el("div","toggle-dot");tdt.style.left="3px";tbg.appendChild(tdt);tr.appendChild(tbg);tr.appendChild(el("div","modal-tlabel","Percentuale attiva"));
  tr.onclick=function(){np=!np;tbg.style.background=np?"#FF6600":"#2E2E2E";tdt.style.left=np?"21px":"3px";};mb.appendChild(tr);
  var pr=el("div","modal-prow");pr.appendChild(el("div","modal-plabel","Percentuale:"));var pi=document.createElement("input");pi.type="number";pi.value=20;pi.className="modal-pinp";pi.onchange=function(){npc=Number(pi.value);};pr.appendChild(pi);pr.appendChild(el("div","modal-plabel","%"));mb.appendChild(pr);
  var btns=el("div","modal-btns");btns.appendChild(bt("Annulla","modal-cancel",function(){mw.innerHTML="";}));
  var ok=bt("Aggiungi","modal-ok",function(){var nome=mi.value.trim();if(!nome||gv(nome)||["__proto__","constructor","prototype"].includes(nome)){toast("Scegli un nome diverso.","err");return;}if(!Number.isFinite(npc)||npc<0||npc>100){toast("La percentuale deve essere tra 0 e 100.","err");return;}var c=PAL[S.vend.length%PAL.length];S.vend.push({n:nome,c:c,p:np,perc:npc});S.sale[nome]=[];S.tab=nome;S.view="input";mw.innerHTML="";sv();render();});
  mi.onkeydown=function(e){if(e.key==="Enter")ok.onclick();};btns.appendChild(ok);mb.appendChild(btns);ov.appendChild(mb);ov.onclick=function(e){if(e.target===ov)mw.innerHTML="";};mw.appendChild(ov);setTimeout(function(){mi.focus();},100);
}

function openEdit(nome){
  var vx=gv(nome);if(!vx)return;
  var mw=document.getElementById("mw");mw.innerHTML="";
  var ov=mk("div","position:fixed;inset:0;background:rgba(0,0,0,0.93);z-index:50;display:flex;align-items:flex-end;justify-content:center;");
  var mb=el("div","modal-box");mb.appendChild(el("div","modal-title","Modifica "+nome));
  var ni=document.createElement("input");ni.type="text";ni.value=nome;ni.className="modal-inp";ni.setAttribute("aria-label","Nome venditore");mb.appendChild(ni);
  var btns=el("div","modal-btns");btns.appendChild(bt("Annulla","modal-cancel",function(){mw.innerHTML="";}));
  if(S.vend.length>1)btns.appendChild(bt("Elimina","modal-del",function(){removeVendor(nome);}));
  btns.appendChild(bt("Salva","modal-ok",function(){var nn=ni.value.trim();if(!nn)return;if(nn!==nome&&(gv(nn)||["__proto__","constructor","prototype"].includes(nn))){toast("Nome già presente o non valido.","err");return;}if(nn!==nome){vx.n=nn;S.sale[nn]=S.sale[nome]||[];delete S.sale[nome];if(S.tab===nome)S.tab=nn;}mw.innerHTML="";sv();render();}));
  mb.appendChild(btns);ov.appendChild(mb);ov.onclick=function(e){if(e.target===ov)mw.innerHTML="";};mw.appendChild(ov);setTimeout(function(){ni.focus();ni.select();},100);
}

function esporta(){
  var today=new Date().toLocaleDateString("it-IT"),tg=totG(),ts=totSp(),out="";
  S.vend.forEach(function(vx,i){
    var t=tot(vx.n),arr=S.sale[vx.n]||[];out+=vx.n.toUpperCase()+"\n";
    if(!arr.length)out+="  nessuna vendita\n";
    else arr.forEach(function(s){var mag=s.magId?gm(s.magId):null;out+="  - "+fd(s.data)+" "+mo(s.importo)+(s.nota?" ("+s.nota+")":"")+(mag?" ["+mag.nome+"]":"")+(vx.p?" ["+vx.perc+"% = "+mo(s.importo*(vx.perc/100))+"]":"")+"\n";});
    out+="  TOTALE: "+mo(t)+"\n";if(vx.p&&t>0)out+="  Perc. "+vx.perc+"%: "+mo(pv(vx))+"\n  Netto: "+mo(nv(vx))+"\n";
    if(i<S.vend.length-1)out+="\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n";
  });
  if(S.spese.length){out+="\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nSPESE\n";S.spese.forEach(function(s){out+="  - "+s.cat+": "+mo(s.importo)+(s.nota?" ("+s.nota+")":"")+"\n";});out+="  TOTALE: "+mo(ts)+"\n";}
  if(S.magazzino.length){out+="\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nMAGAZZINO\n";S.magazzino.forEach(function(i){out+="  - "+i.nome+": "+i.qty+" pz"+(i.prezzoV?" vend. "+mo(i.prezzoV):"")+"\n";});}
  var html="<!DOCTYPE html><html><head><meta charset='utf-8'><title>Swap Meet</title><style>body{font-family:-apple-system,sans-serif;padding:32px;color:#111;max-width:600px;margin:0 auto}h1{font-size:28px;font-weight:900;border-bottom:3px solid #FF6600;padding-bottom:10px}pre{font-size:13px;line-height:1.9;white-space:pre-wrap;margin-top:18px;font-family:'Courier New',monospace}.tot{margin-top:12px;border-top:3px solid #111;padding-top:10px;font-size:17px;font-weight:800}@media print{button{display:none}}</style></head><body><h1>Swap Meet — Registro Vendite</h1><p style='color:#888;font-size:13px;margin-top:6px'>Esportato il "+today+"</p><pre>"+escapeHtml(out)+"</pre><div class='tot'>TOTALE VENDITE: "+mo(tg)+"</div>"+(ts>0?"<div class='tot' style='color:#888'>TOTALE SPESE: - "+mo(ts)+"</div><div class='tot'>INCASSI MENO SPESE: "+mo(tg-ts)+"</div>":"")+"<br><button onclick='window.print()' style='margin-top:14px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;border-radius:10px;background:#FF6600;color:#000;border:none;'>Stampa / Salva PDF</button></body></html>";
  var w=window.open("","_blank");if(!w){alert("Abilita popup");return;}w.document.write(html);w.document.close();w.focus();
}

sync=new SwapSync.SyncQueue({
  storage:{getItem:function(k){return localStorage.getItem(k);},setItem:function(k,v){localStorage.setItem(k,v);}},request:request,canRefresh:function(){return !hasDraft();},accept:acceptRemote,
  status:function(kind,message){ss=kind;sm=message;up();}
});
ll();fx();render();loadR();
setInterval(function(){if(document.visibilityState==='visible')loadR();},30000);
window.addEventListener('online',function(){sync.conflict=false;loadR();});
window.addEventListener('beforeunload',function(e){if(sync.dirty||hasDraft()){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')loadR();});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(function(){});
