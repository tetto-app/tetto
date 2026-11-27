/* Tetto: lógica do app (sem bibliotecas). Os dados ficam só no aparelho (localStorage). */
(function(){
'use strict';
var KEY='tetto.v1';
var COLORS=['#7c9cff','#34d399','#f472b6','#fbbf24','#60a5fa','#a78bfa','#fb923c','#2dd4bf','#f87171'];
var CURRENCIES=['BRL','EUR','USD','GBP'];
var MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var MES3=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var WD=['dom','seg','ter','qua','qui','sex','sáb'];
var GN={n:'Necessidades',d:'Desejos',p:'Poupança'};
var GDESC={n:'fixas e essenciais',d:'variáveis e lazer',p:'investimentos e reserva'};
var TIPO_CONTA={conta:'Conta bancária',carteira:'Dinheiro',cartao:'Cartão de crédito',invest:'Investimento'};
var ICO_CONTA={conta:'🏦',carteira:'👛',cartao:'💳',invest:'📈'};
/* ícones disponíveis para categorias e contas */
var ICONS=['🏠','🏢','🛋️','💡','💧','🔥','📶','📺',
  '🛒','🍔','🍕','🍽️','☕','🍺','🥦','🍰',
  '🚗','⛽','🚇','🚕','✈️','🚲','🛵','🅿️',
  '💊','🏥','🦷','💪','💇','🧴','👶','🐶',
  '🎉','🎬','🎮','🎵','📚','🎓','🏖️','🎁',
  '🛍️','👕','👟','💻','📱','🧾','🔧','🧹',
  '💰','💵','💳','🏦','👛','📈','🐷','💎',
  '✨','🏷️','📌','❤️','🧳','⚡'];
var CHEV='<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

/* ---------- utilidades ---------- */
function $(s){return document.querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
/* fileiras de filtros que rolam para o lado: depois de redesenhar, centraliza o filtro escolhido para ele não ficar cortado */
function chipsAtivo(root){
  root.querySelectorAll('.chips.scroll').forEach(function(r){
    var on=r.querySelector('.chip.on');if(!on||r.scrollWidth<=r.clientWidth)return;
    var a=on.getBoundingClientRect(),b=r.getBoundingClientRect();
    r.scrollLeft+=(a.left-b.left)-(r.clientWidth-a.width)/2;
  });
}
function pad(n){return String(n).padStart(2,'0')}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function todayISO(){return iso(new Date())}
function parseISO(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])}
function dShort(s){var d=parseISO(s);return pad(d.getDate())+'/'+pad(d.getMonth()+1)}
function dLong(s){return WD[parseISO(s).getDay()]+', '+dShort(s)}
function ymNow(){return todayISO().slice(0,7)}
function ymAdd(ym,n){var y=+ym.slice(0,4),m=+ym.slice(5,7)-1+n;y+=Math.floor(m/12);m=((m%12)+12)%12;return y+'-'+pad(m+1)}
function ymLabel(ym){return MESES[+ym.slice(5,7)-1]+' '+ym.slice(0,4)}
function ymShort(ym){return MES3[+ym.slice(5,7)-1]+'/'+ym.slice(2,4)}
function daysIn(ym){return new Date(+ym.slice(0,4),+ym.slice(5,7),0).getDate()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function parseNum(v){var s=String(v==null?'':v).trim().replace(/[^\d.,-]/g,'');if(!s)return NaN;if(s.indexOf(',')>=0)s=s.replace(/\./g,'').replace(',','.');return Number(s)}
function showNum(n){return(n==null||isNaN(n))?'':String(Math.round(n*100)/100).replace('.',',')}
function isISO(s){return typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s)}
function isYM(s){return typeof s==='string'&&/^\d{4}-\d\d$/.test(s)}

/* ---------- dados padrão (sugestões editáveis) ---------- */
function mkSub(nome,modo,diario){return{id:uid(),nome:nome,modo:modo,hist:[{from:ymNow(),v:0}],mes:{},diario:!!diario}}
function mkCat(tipo,nome,icon,cor,grupo,subs){return{id:uid(),tipo:tipo,nome:nome,icon:icon,cor:cor,grupo:grupo,subs:subs}}
function defaults(){
  var C=COLORS;
  return{v:1,config:{currency:'BRL',rule:{n:50,d:30,p:20},m3:true,m4:true,m5:true,m6:true},
    contas:[{id:uid(),nome:'Conta principal',tipo:'conta',saldoIni:0},{id:uid(),nome:'Dinheiro',tipo:'carteira',saldoIni:0},{id:uid(),nome:'Cartão de crédito',tipo:'cartao',saldoIni:0}],
    cats:[
      mkCat('d','Moradia','🏠',C[0],'n',[mkSub('Aluguel','teto'),mkSub('Condomínio','teto'),mkSub('Energia','teto'),mkSub('Água','teto'),mkSub('Internet','teto')]),
      mkCat('d','Mercado','🛒',C[1],'n',[mkSub('Supermercado','teto'),mkSub('Feira e padaria','teto')]),
      mkCat('d','Transporte','🚗',C[4],'n',[mkSub('Combustível','teto'),mkSub('Aplicativo e ônibus','teto'),mkSub('Parcela do carro','teto')]),
      mkCat('d','Saúde','💊',C[7],'n',[mkSub('Plano de saúde','teto'),mkSub('Farmácia','teto')]),
      mkCat('d','Alimentação fora','🍔',C[6],'d',[mkSub('iFood','teto',true),mkSub('Restaurantes','teto')]),
      mkCat('d','Lazer','🎉',C[2],'d',[mkSub('Passeios','teto'),mkSub('Streaming','teto'),mkSub('Viagens','teto')]),
      mkCat('d','Compras','🛍️',C[3],'d',[mkSub('Roupas','teto'),mkSub('Casa','teto'),mkSub('Outros','teto')]),
      mkCat('d','Investimentos','📈',C[5],'p',[mkSub('Reserva de emergência','teto'),mkSub('Aportes','teto')]),
      mkCat('r','Salário','💰',C[1],null,[mkSub('Salário','teto')]),
      mkCat('r','Extras','✨',C[3],null,[mkSub('Freelance','teto'),mkSub('Outras receitas','teto')])
    ],
    lanc:[],recs:[],last:{}};
}

/* ---------- validação rígida (dados salvos e backups importados) ---------- */
function okId(x){return typeof x==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(x)}
function okNum(x){return typeof x==='number'&&isFinite(x)&&x>=0&&x<1e10}
function okSig(x){return typeof x==='number'&&isFinite(x)&&Math.abs(x)<1e10}
function str(x,n){return typeof x==='string'?x.slice(0,n):''}
function clean(d){
  if(!d||!d.config||!Array.isArray(d.cats)||!Array.isArray(d.contas)||!Array.isArray(d.lanc))return null;
  var c=d.config,R=c.rule||{};
  if(CURRENCIES.indexOf(c.currency)<0)return null;
  if(![R.n,R.d,R.p].every(function(x){return okNum(x)&&x<=100}))return null;
  var contas=[],cats=[],lanc=[],i,j;
  for(i=0;i<d.contas.length;i++){var k=d.contas[i];
    if(!k||!okId(k.id)||typeof k.nome!=='string'||!TIPO_CONTA[k.tipo]||!okSig(k.saldoIni))return null;
    var kc={id:k.id,nome:k.nome.slice(0,30),tipo:k.tipo,saldoIni:k.saldoIni};
    if(typeof k.icon==='string'&&k.icon&&k.icon.length<=8)kc.icon=k.icon;
    if(okNum(k.limite))kc.limite=k.limite;
    if(Number.isInteger(k.fecha)&&k.fecha>=1&&k.fecha<=31)kc.fecha=k.fecha;
    if(Number.isInteger(k.vence)&&k.vence>=1&&k.vence<=31)kc.vence=k.vence;
    contas.push(kc);}
  for(i=0;i<d.cats.length;i++){var ct=d.cats[i];
    if(!ct||!okId(ct.id)||(ct.tipo!=='d'&&ct.tipo!=='r')||typeof ct.nome!=='string'||typeof ct.icon!=='string'||ct.icon.length>8||
       !/^#[0-9A-Fa-f]{3,8}$/.test(ct.cor)||!Array.isArray(ct.subs)||!ct.subs.length)return null;
    if(ct.tipo==='d'&&!GN[ct.grupo])return null;
    var subs=[];
    for(j=0;j<ct.subs.length;j++){var s=ct.subs[j];
      if(!s||!okId(s.id)||typeof s.nome!=='string'||(['fixo','variavel','teto'].indexOf(s.modo)<0)||!Array.isArray(s.hist)||!s.hist.length)return null;
      var hist=[],mes={};
      for(var h=0;h<s.hist.length;h++){if(!s.hist[h]||!isYM(s.hist[h].from)||!okNum(s.hist[h].v))return null;hist.push({from:s.hist[h].from,v:s.hist[h].v})}
      hist.sort(function(a,b){return a.from<b.from?-1:1});
      if(s.mes&&typeof s.mes==='object')Object.keys(s.mes).forEach(function(m){if(isYM(m)&&okNum(s.mes[m]))mes[m]=s.mes[m]});
      var so={id:s.id,nome:s.nome.slice(0,30),modo:s.modo,hist:hist,mes:mes,diario:s.diario===true};
      if(Number.isInteger(s.dia)&&s.dia>=1&&s.dia<=31)so.dia=s.dia;if(okId(s.cta))so.cta=s.cta;
      subs.push(so);}
    cats.push({id:ct.id,tipo:ct.tipo,nome:ct.nome.slice(0,30),icon:ct.icon,cor:ct.cor,grupo:ct.tipo==='d'?ct.grupo:null,subs:subs});}
  if(!contas.length||!cats.some(function(x){return x.tipo==='d'})||!cats.some(function(x){return x.tipo==='r'}))return null;
  for(i=0;i<d.lanc.length;i++){var l=d.lanc[i];
    if(!l||!okId(l.id)||['d','r','t','a'].indexOf(l.tipo)<0||!(l.tipo==='a'||(l.tipo==='d'&&l.est===true&&l.valor<0)?okSig(l.valor):okNum(l.valor))||!isISO(l.data)||!okId(l.conta))return null;
    var o={id:l.id,ts:okNum(l.ts)?l.ts:0,tipo:l.tipo,valor:l.valor,data:l.data,conta:l.conta,desc:str(l.desc,60)};
    if(l.tipo==='a'){/* ajuste de rendimento de investimento: só conta e valor (pode ser negativo) */}
    else if(l.tipo==='t'){if(!okId(l.para))return null;o.para=l.para;if(typeof l.fat==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(l.fat))o.fat=l.fat}
    else{if(!okId(l.cat)||!okId(l.sub))return null;o.cat=l.cat;o.sub=l.sub;
      /* parcela de compra parcelada: grupo, número e total */
      if(l.tipo==='d'&&okId(l.grp)&&Number.isInteger(l.pn)&&Number.isInteger(l.pt)&&l.pt>=2&&l.pt<=60&&l.pn>=1&&l.pn<=l.pt){o.grp=l.grp;o.pn=l.pn;o.pt=l.pt}}
    if(l.tipo!=='a'&&okId(l.rec))o.rec=l.rec;
    if(l.man===true)o.man=true;
    if(l.pg===true&&!l.pend)o.pg=true;
    if(l.tipo==='d'&&l.est===true&&l.valor<0){o.est=true;if(okId(l.ref))o.ref=l.ref}
    if(l.tipo!=='a'&&l.pend===true)o.pend=true;
    lanc.push(o);}
  /* modelos de lançamentos que se repetem todo mês */
  var recs=[];
  if(Array.isArray(d.recs))for(i=0;i<d.recs.length;i++){var rc=d.recs[i];
    if(!rc||!okId(rc.id)||['d','r','t'].indexOf(rc.tipo)<0||!okNum(rc.valor)||!Number.isInteger(rc.dia)||rc.dia<1||rc.dia>31||!okId(rc.conta)||!isYM(rc.inicio)||!(rc.fim===null||isYM(rc.fim)))return null;
    var ro={id:rc.id,tipo:rc.tipo,valor:rc.valor,dia:rc.dia,conta:rc.conta,desc:str(rc.desc,60),inicio:rc.inicio,fim:rc.fim,skip:{}};
    if(rc.tipo==='t'){if(!okId(rc.para))return null;ro.para=rc.para}else{if(!okId(rc.cat)||!okId(rc.sub))return null;ro.cat=rc.cat;ro.sub=rc.sub}
    if(rc.skip&&typeof rc.skip==='object')Object.keys(rc.skip).forEach(function(m){if(isYM(m))ro.skip[m]=true});
    if(rc.pend===true)ro.pend=true;
    /* recorrência criada por uma subcategoria Fixa (valor = valor da subcategoria em cada mês) */
    if(rc.auto===true)ro.auto=true;
    recs.push(ro);}
  var last={};
  if(d.last&&typeof d.last==='object')['d','r','t','c','i','res'].forEach(function(t){var x=d.last[t];if(x&&typeof x==='object'){var y={};['cat','sub','conta','para'].forEach(function(f){if(okId(x[f]))y[f]=x[f]});last[t]=y}});
  var cfg={currency:c.currency,rule:{n:R.n,d:R.d,p:R.p}};if(isISO(c.lastBackup))cfg.lastBackup=c.lastBackup;if(c.m3===true)cfg.m3=true;if(c.m4===true)cfg.m4=true;if(c.m5===true)cfg.m5=true;if(c.m6===true)cfg.m6=true;
  return{v:1,config:cfg,contas:contas,cats:cats,lanc:lanc,recs:recs,last:last};
}
function load(){try{var s=clean(JSON.parse(localStorage.getItem(KEY)));if(s)return s}catch(e){}return defaults()}
var S=load();
/* gera os lançamentos das recorrências até 12 meses à frente (sem recriar meses excluídos) */
var REC_AHEAD=12;
function ensureRecs(){
  var lim=ymAdd(ymNow(),REC_AHEAD),add=0;
  S.recs.forEach(function(r){
    var have={};S.lanc.forEach(function(l){if(l.rec===r.id)have[l.data.slice(0,7)]=1});
    for(var ym=r.inicio;ym<=lim&&(!r.fim||ym<=r.fim);ym=ymAdd(ym,1)){
      if(have[ym]||r.skip[ym])continue;
      var ax=r.auto&&subIdx&&subIdx[r.sub],o={id:uid()+(add++),ts:Date.now()+add,tipo:r.tipo,valor:ax?capFor(ax.s,ym):r.valor,data:ym+'-'+pad(Math.min(r.dia,daysIn(ym))),conta:r.conta,desc:r.desc,rec:r.id};
      if(r.tipo==='t')o.para=r.para;else{o.cat=r.cat;o.sub=r.sub}
      /* meses gerados pela repetição ficam pendentes até você marcar como pagos (exceto no cartão) */
      if(r.pend)o.pend=true;
      S.lanc.push(o);
    }
  });
  return add;
}
reindex();var mgF=migrarFixos();if(ensureRecs()||mgF)save();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){info('Não foi possível salvar','O navegador recusou guardar os dados neste aparelho. Faça um backup agora em Mais.')}}

/* ---------- moeda ---------- */
var nfCache={};
function nf(){var c=S.config.currency;if(!nfCache[c]){try{nfCache[c]=new Intl.NumberFormat('pt-BR',{style:'currency',currency:c})}catch(e){nfCache[c]=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})}}return nfCache[c]}
function money(n){return nf().format(n||0)}
function curSym(){var p=nf().formatToParts(0).filter(function(x){return x.type==='currency'})[0];return p?p.value:''}

/* ---------- índices e cálculos ---------- */
var subIdx={};
function reindex(){subIdx={};S.cats.forEach(function(c){c.subs.forEach(function(s){subIdx[s.id]={c:c,s:s}})})}
reindex();
function catById(id){return S.cats.filter(function(c){return c.id===id})[0]}
function contaById(id){return S.contas.filter(function(c){return c.id===id})[0]}
function contaIcon(c){return c.icon||ICO_CONTA[c.tipo]}
/* teto-base vigente no mês: o último valor definido "a partir de" um mês igual ou anterior */
function baseFor(s,ym){var v=s.hist[0].v;for(var i=0;i<s.hist.length;i++){if(s.hist[i].from<=ym)v=s.hist[i].v;else break}return v}
/* teto do mês: variável pode ter um valor só daquele mês */
function capFor(s,ym){return(s.modo!=='fixo'&&typeof s.mes[ym]==='number')?s.mes[ym]:baseFor(s,ym)}
var MODO_TXT={fixo:'fixo',variavel:'variável',teto:'só teto'};
function setBase(s,ym,v){var h=s.hist.filter(function(x){return x.from!==ym});h.push({from:ym,v:v});h.sort(function(a,b){return a.from<b.from?-1:1});s.hist=h}
function catCap(c,ym){return c.subs.reduce(function(a,s){return a+capFor(s,ym)},0)}
function dailyCap(s,ym){return s.diario?capFor(s,ym)/daysIn(ym):null}
function isInv(id){var c=contaById(id);return!!c&&c.tipo==='invest'}
/* realizado = pago e com data até hoje; o resto (pendente ou com data futura) é previsto */
function isReal(l){return!l.pend&&(l.data<=todayISO()||l.pg===true)}
/* totais do mês separados em realizado e previsto.
   Aplicação líquida: transferências de contas para investimentos menos resgates */
/* mês em que o lançamento conta no orçamento (saldo do mês, tetos, regra e análise):
   compra no cartão entra no mês de vencimento da fatura, como o dinheiro sai de fato; o resto, na própria data */
function mesOrc(l){
  if(l.est&&l.ref){var o=S.lanc.filter(function(x){return x.id===l.ref&&!x.est})[0];if(o)return mesOrc(o)}
  if(l.tipo==='d'){var c=contaById(l.conta);if(c&&c.tipo==='cartao')return vencYM(c,cicloDe(c,l.data))}
  return l.data.slice(0,7);
}
/* previstos recorrentes ainda pendentes de uma subcategoria no mês do orçamento */
function prevRec(sub,ym,semId){return S.lanc.filter(function(l){return l.rec&&l.pend&&l.sub===sub&&l.id!==semId&&mesOrc(l)===ym})}
/* o valor do lançamento sai do previsto (que fica marcado como ajustado à mão); se o previsto zera, ele some e o mês não é recriado */
function absorver(o){
  if(!(o.tipo==='d'||o.tipo==='r')||o.rec||!o.sub||o.est||o.valor<=0)return 0;
  var P=prevRec(o.sub,mesOrc(o)),rest=o.valor,tot=0;
  P.forEach(function(l){if(rest<=0.005)return;var t=Math.min(rest,l.valor);l.valor=Math.round((l.valor-t)*100)/100;l.man=true;rest-=t;tot+=t;
    if(l.valor<=0.005){var r=S.recs.filter(function(x){return x.id===l.rec})[0];if(r)r.skip[l.data.slice(0,7)]=true;S.lanc=S.lanc.filter(function(x){return x!==l})}});
  return Math.round(tot*100)/100;
}
function agg(ym){
  var a={rec:0,desp:0,recP:0,despP:0,apo:0,apoP:0,g:{n:0,d:0,p:0},gP:{n:0,d:0,p:0},sub:{},cat:{},subP:{},catP:{}};
  S.lanc.forEach(function(l){
    if(mesOrc(l)!==ym)return;var R=isReal(l);
    if(l.tipo==='r'){if(R)a.rec+=l.valor;else a.recP+=l.valor}
    else if(l.tipo==='d'){var x=subIdx[l.sub],S1=R?a.sub:a.subP,C1=R?a.cat:a.catP;
      if(R)a.desp+=l.valor;else a.despP+=l.valor;S1[l.sub]=(S1[l.sub]||0)+l.valor;
      if(x){C1[x.c.id]=(C1[x.c.id]||0)+l.valor;if(x.c.grupo!=='p')(R?a.g:a.gP)[x.c.grupo]+=l.valor}}
    else if(l.tipo==='t'){var de=isInv(l.conta),pa=isInv(l.para),v=pa&&!de?l.valor:de&&!pa?-l.valor:0;if(R)a.apo+=v;else a.apoP+=v}
  });
  a.g.p+=a.apo;a.gP.p+=a.apoP;
  return a;
}
/* regra 50/30/20 como trava: quanto Necessidades ou Desejos podem usar no mês (receita recebida + prevista).
   semId: ignora um lançamento que está sendo editado. Poupança é meta mínima, não limite. */
function limiteRegra(g,ym,semId){
  if(g!=='n'&&g!=='d')return null;var a=agg(ym),base=a.rec+a.recP;if(!(base>0))return null;
  var usado=a.g[g]+a.gP[g];
  if(semId){var o=S.lanc.filter(function(l){return l.id===semId})[0];if(o&&o.tipo==='d'&&mesOrc(o)===ym){var xo=subIdx[o.sub];if(xo&&xo.c.grupo===g)usado-=o.valor}}
  return{lim:S.config.rule[g]/100*base,usado:usado,base:base};
}
/* tetos planejados de uma parte da regra no mês x limite da regra */
function planoRegra(g,ym){
  var a=agg(ym),base=a.rec+a.recP,plan=0;
  S.cats.forEach(function(c){if(c.tipo==='d'&&(c.grupo||'d')===g)plan+=catCap(c,ym)});
  return{plan:plan,lim:base>0?S.config.rule[g]/100*base:null};
}
/* gastos de um escopo (total, categoria ou subcategoria) no mês, opcionalmente só até um dia */
function spentScope(sc,ym,maxDay){
  return S.lanc.reduce(function(t,l){
    if(l.tipo!=='d'||mesOrc(l)!==ym||(maxDay&&(l.data.slice(0,7)===ym?+l.data.slice(8):1)>maxDay)||!isReal(l))return t;
    if(sc==='total')return t+l.valor;
    var x=subIdx[l.sub];if(!x)return t;
    if(sc.charAt(0)==='c'&&x.c.id===sc.slice(2))return t+l.valor;
    if(sc.charAt(0)==='s'&&l.sub===sc.slice(2))return t+l.valor;
    return t;
  },0);
}
function capScope(sc,ym){
  if(sc==='total')return S.cats.reduce(function(t,c){return c.tipo==='d'?t+catCap(c,ym):t},0);
  if(sc.charAt(0)==='c'){var c=catById(sc.slice(2));return c?catCap(c,ym):0}
  var x=subIdx[sc.slice(2)];return x?capFor(x.s,ym):0;
}
/* cartão de crédito: em qual fatura (mês de fechamento) cai uma compra */
/* sem dia de fechamento configurado, a fatura segue o mês do calendário */
function fechaDia(c,ym){return Math.min(c.fecha,daysIn(ym))}
function cicloDe(c,date){var ym=date.slice(0,7);if(!c.fecha)return ym;return +date.slice(8)<=fechaDia(c,ym)?ym:ymAdd(ym,1)}
function vencYM(c,closeYM){return(c.fecha&&c.vence&&c.vence<=c.fecha)?ymAdd(closeYM,1):closeYM}
function faturaTotal(c,closeYM){return S.lanc.reduce(function(t,l){return l.tipo==='d'&&l.conta===c.id&&cicloDe(c,l.data)===closeYM?t+l.valor:t},0)}
/* fatura separada em já gasto (até hoje) e programado (parcelas com data futura) */
function faturaPartes(c,closeYM){var h=todayISO(),g=0,p=0;S.lanc.forEach(function(l){if(l.tipo==='d'&&l.conta===c.id&&cicloDe(c,l.data)===closeYM){if(l.data<=h)g+=l.valor;else p+=l.valor}});return{g:g,p:p,t:g+p}}
function parcelasFuturas(c){var h=todayISO();return S.lanc.reduce(function(t,l){return l.tipo==='d'&&l.conta===c.id&&l.pt>1&&l.data>h?t+l.valor:t},0)}
/* mês de fechamento da fatura que vence no mês informado */
function fechaDoVenc(c,ym){return(c.fecha&&c.vence&&c.vence<=c.fecha)?ymAdd(ym,-1):ym}
/* situação da fatura hoje: aberta (antes do fechamento), fechada (até o vencimento) ou vencida */
/* pagamentos feitos ao cartão abatem as faturas da mais antiga para a mais nova
   (primeiro a dívida de quando começou a usar o app). Devolve {ym:valor pago} e a sobra (crédito) */
function pagosFatura(c,semId){
  var pago=0,hj=todayISO(),tot={},res={},esc0=[];
  S.lanc.forEach(function(l){if(l.tipo==='d'&&l.conta===c.id){var y=cicloDe(c,l.data);tot[y]=(tot[y]||0)+l.valor}});
  S.lanc.forEach(function(l){if(l.tipo!=='t'||l.para!==c.id||!isReal(l)||l.id===semId)return;
    if(l.fat)esc0.push(l);else pago+=l.valor});
  /* pagamento com fatura escolhida vai para ela; o que passar do total volta para a fila */
  esc0.forEach(function(l){var y=l.fat,falta=Math.max(0,(tot[y]||0)-(res[y]||0)),v=Math.min(l.valor,falta);res[y]=(res[y]||0)+v;pago+=l.valor-v});
  pago-=Math.max(0,-c.saldoIni);if(pago<0)pago=0;
  var at=cicloDe(c,hj);
  Object.keys(tot).sort().forEach(function(y){if(y>at)return;var v=Math.min(pago,tot[y]-(res[y]||0));res[y]=(res[y]||0)+v;pago-=v});
  res._sobra=Math.round(pago*100)/100;return res;
}
function pagoDe(c,closeYM){return Math.round((pagosFatura(c)[closeYM]||0)*100)/100}
/* quanto falta pagar de uma fatura (semId: ignora o pagamento que está sendo editado) */
function faltaFat(c,ym,semId){return Math.max(0,Math.round((faturaTotal(c,ym)-(pagosFatura(c,semId)[ym]||0))*100)/100)}
/* fatura sugerida para pagar: a mais antiga com saldo em aberto, senão a atual */
function fatPadrao(c,semId){var at=cicloDe(c,todayISO());for(var k=-6;k<=0;k++){var y=ymAdd(at,k);if(faltaFat(c,y,semId)>0)return y}return at}
function fatOpts(c,sel,semId){
  var at=cicloDe(c,todayISO()),L=[];
  for(var k=-3;k<=3;k++){var y=ymAdd(at,k);if(k===0||y===sel||faturaTotal(c,y)>0)L.push(y)}
  return L.map(function(y){var t=faturaTotal(c,y),f=faltaFat(c,y,semId);
    return'<option value="'+y+'"'+(y===sel?' selected':'')+'>'+cap1(faturaNome(c,y))+(y===at?' (aberta)':'')+' · '+(t<=0?'sem compras':f<=0?'paga':'falta '+money(f))+'</option>'}).join('');
}
function situacaoFatura(c,closeYM){
  var tt=faturaTotal(c,closeYM),pg=pagoDe(c,closeYM);
  if(tt>0&&pg>=tt-0.005)return{txt:'paga',cls:'ok'};
  var hj=todayISO(),fe=closeYM+'-'+pad(c.fecha?fechaDia(c,closeYM):daysIn(closeYM)),vy=vencYM(c,closeYM),ve=vy+'-'+pad(Math.min(c.vence||daysIn(vy),daysIn(vy)));
  var parc=pg>0?' · pago '+money(pg)+' de '+money(tt):'';
  if(hj<=fe)return{txt:'aberta'+parc,cls:'acc'};
  if(hj<=ve)return{txt:'fechada · vence '+dShort(ve)+parc,cls:'warn'};
  if(tt<=0)return{txt:'sem compras',cls:'s'};
  return{txt:'vencida em '+dShort(ve)+(pg>0?parc:' · não paga'),cls:'bad'};
}
function faturaNome(c,closeYM){return'fatura de '+MESES[+vencYM(c,closeYM).slice(5,7)-1].toLowerCase()+(vencYM(c,closeYM).slice(0,4)!==ymNow().slice(0,4)?' '+vencYM(c,closeYM).slice(0,4):'')}
function aggDay(date){var m={};S.lanc.forEach(function(l){if(l.tipo==='d'&&l.data===date&&!l.pend)m[l.sub]=(m[l.sub]||0)+l.valor});return m}
function pct(g,t){return t>0?g/t*100:null}
function st(p){return p==null?'':p===Infinity?'warn':p>100?'bad':p>=70?'warn':'ok'}
function pctTxt(p){return p==null?'—':p===Infinity?'sem teto':Math.round(p)+'%'}
/* % do teto; gasto em algo sem teto vira "sem teto" (barra cheia em amarelo) em vez de sumir */
function pctC(g,t){return t>0?g/t*100:(g>0?Infinity:null)}
function remCls(r){return r<0?'bad':'ok'}
/* saldo de hoje: lançamentos programados (data futura) não entram, exceto no cartão,
   onde compras parceladas já ocupam o limite, como nos bancos */
function saldoConta(id){
  var c=contaById(id),v=c?c.saldoIni:0,hj=todayISO(),card=c&&c.tipo==='cartao';
  S.lanc.forEach(function(l){
    if(!card&&!isReal(l))return;
    /* no cartão, compras futuras ocupam o limite, mas pagamento pendente ou futuro ainda não libera */
    if(card&&l.tipo==='t'&&!isReal(l))return;
    if(l.tipo==='r'&&l.conta===id)v+=l.valor;
    else if(l.tipo==='d'&&l.conta===id)v-=l.valor;
    else if(l.tipo==='t'){if(l.conta===id)v-=l.valor;if(l.para===id)v+=l.valor}
    else if(l.tipo==='a'&&l.conta===id)v+=l.valor;
  });
  return v;
}

/* saldo das contas (não cartão, não investimento) no fim de um mês, acumulando tudo desde o começo.
   comPrev=false: só o que já foi pago; comPrev=true: inclui também os pendentes e programados até o fim do mês */
function saldoContasFim(ym,comPrev){
  var ids={},fim=ym+'-31',v=0;
  S.contas.forEach(function(c){if(c.tipo==='conta'||c.tipo==='carteira'){ids[c.id]=1;v+=c.saldoIni}});
  S.lanc.forEach(function(l){
    if(l.data>fim||(!comPrev&&!isReal(l)))return;
    if((l.tipo==='r'||l.tipo==='a')&&ids[l.conta])v+=l.valor;
    else if(l.tipo==='d'&&ids[l.conta])v-=l.valor;
    else if(l.tipo==='t'){if(ids[l.conta])v-=l.valor;if(ids[l.para])v+=l.valor}
  });
  return v;
}

/* ---------- estado da interface ---------- */
var cur=ymNow(),mode='mes',tab='home',openCats={},xf='all',xConta='all',openK={},dSc='total',dN=6,dSel=null,bView='tetos',bEdit=false,bOne=null,kEdit=false,mEdit=false,hEdit=false,openRec={},preRep=false;
function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('on')},1700)}
function cap1(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- cabeçalho: mês e modo ---------- */
function renderHeader(){
  var T={home:'Tetto',list:'Lançamentos',cards:'Cartões',budget:'Orçamento',more:'Mais'},SUB={cards:'Faturas, limites e parcelas',more:'Regra, moeda e backup'};
  $('#hTitle').textContent=T[tab];
  var showM=tab==='home'||tab==='list'||tab==='budget'||(tab==='cards'&&!kEdit);
  $('#mnav').hidden=!showM;$('#hSub').hidden=showM;$('#hSub').textContent=SUB[tab]||'';
  var isCur=cur===ymNow();
  $('#mLabel').textContent=ymLabel(cur);
  $('#mSub').textContent=tab==='cards'?'Faturas que vencem neste mês':isCur?('Mês atual · dia '+(+todayISO().slice(8))+' de '+daysIn(cur)):(cur<ymNow()?'Mês encerrado':'Mês futuro');
  var segOn=false;$('#seg').hidden=!segOn;if(!segOn)mode='mes';
  $('#mMes').classList.toggle('on',mode==='mes');$('#mHoje').classList.toggle('on',mode==='hoje');
}
function goMonth(n){cur=n===0?ymNow():ymAdd(cur,n);dSel=null;render()}
$('#mPrev').addEventListener('click',function(){goMonth(-1)});
$('#mNext').addEventListener('click',function(){goMonth(1)});
$('#mCur').addEventListener('click',function(){goMonth(0)});
$('#mMes').addEventListener('click',function(){mode='mes';render()});
$('#mHoje').addEventListener('click',function(){mode='hoje';render()});
/* deslizar o dedo para os lados troca o mês */
['#view-home','#view-list','#view-budget'].forEach(function(sel){var x0=null,y0=0,el=$(sel);
  /* arrastar numa fileira que rola para o lado (filtros) não troca o mês */
  el.addEventListener('touchstart',function(e){if(e.touches.length>1||e.target.closest('.chips.scroll')){x0=null;return}x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  el.addEventListener('touchend',function(e){if(x0==null||bEdit)return;var dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)goMonth(dx<0?1:-1)},{passive:true});
});
/* botões "Ver ..." levam para outra aba */
document.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(g)setTab(g.dataset.go)});

/* ---------- peças visuais comuns ---------- */
function ring(p){
  var r=46,C=2*Math.PI*r,f=Math.min(p||0,100)/100,col=st(p)?'var(--'+st(p)+')':'var(--muted)';
  return'<div class="ring"><svg viewBox="0 0 112 112" width="112" height="112"><circle cx="56" cy="56" r="'+r+'" fill="none" stroke="var(--card2)" stroke-width="11"/>'+
    (f>0?'<circle cx="56" cy="56" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="11" stroke-linecap="round" stroke-dasharray="'+(C*f)+' '+C+'"/>':'')+
    '</svg><div class="c '+st(p)+'">'+pctTxt(p)+'</div></div>';
}
function bar(p,cls){return'<div class="bar"><i class="'+(cls||st(p))+'" style="width:'+Math.min(p||0,100)+'%"></i></div>'}
/* barra com duas partes: realizado (cor cheia) e previsto (mais clara) */
function bar2(pr,pp,cls){pr=Math.max(0,Math.min(pr||0,100));pp=Math.max(0,Math.min(pp||0,100-pr));cls=cls||st(pr+pp);
  return'<div class="bar"><i class="'+cls+'" style="width:'+pr+'%"></i><i class="'+cls+' prev" style="width:'+pp+'%"></i></div>'}
function ruleCard(a){
  var R=S.config.rule,base=a.rec+a.recP,h='<div class="card tetocard"><div class="ttl">Regra '+R.n+'/'+R.d+'/'+R.p+' · da receita do mês</div>';
  /* sem receita no mês: mostra o que já foi gasto em cada parte; os limites aparecem quando houver receita */
  if(!(base>0)){
    /* mesmo layout dos outros meses: nome, %, barra e "R$ X de R$ Y" (sem limite, a barra fica vazia) */
    ['n','d','p'].forEach(function(g){var v=a.g[g]+a.gP[g];
      h+='<button type="button" class="gr gbtn" data-act="vgrp" data-g="'+g+'" aria-label="Abrir '+GN[g]+' no Orçamento"><div class="row sp"><span class="n">'+GN[g]+' <span class="s">· '+R[g]+'%</span></span><b class="s">—</b></div>'+
        bar2(0,0)+'<div class="s">'+money(v)+' de —</div></button>'});
    return h+'<div class="note">Sem receita lançada em '+esc(ymLabel(cur).toLowerCase())+'. Os limites de cada parte aparecem quando houver receita no mês (dica: marque o salário como Recorrente no Orçamento).</div></div>';
  }
  ['n','d','p'].forEach(function(g){
    var v=a.g[g],vp=a.gP[g],tot=v+vp,p=v/base*100,pt=tot/base*100,lim=R[g],alvo=lim/100*base,cls,txt;
    if(g==='p'){cls=pt>=lim?'ok':'acc';txt=pt>=lim?'Meta de '+lim+'% coberta. Parabéns!':'Meta: '+lim+'% · faltam '+money(alvo-tot)}
    else{cls=pt>lim?'bad':pt>=lim*0.9?'warn':'ok';txt=pt>lim?'Passa do limite de '+lim+'% em '+money(tot-alvo):'Limite: '+lim+'% · ainda cabem '+money(alvo-tot)}
    h+='<button type="button" class="gr gbtn" data-act="vgrp" data-g="'+g+'" aria-label="Abrir '+GN[g]+' no Orçamento"><div class="row sp"><span class="n">'+GN[g]+' <span class="s">· '+lim+'%</span></span><b class="'+cls+'">'+Math.round(p)+'%</b></div>'+
      bar2(lim?v/alvo*100:0,lim?vp/alvo*100:0,cls)+'<div class="s">'+money(v)+' de '+money(alvo)+'</div></button>';
  });
  /* o botão para o Orçamento fica só no card de tetos, logo abaixo (um botão só para o mesmo lugar) */
  return h+'</div>';
}
function lItem(l){
  var ico,col,t1,t2,amt,co=contaById(l.conta);
  if(l.tipo==='a'&&co&&co.tipo!=='invest'){ico='⚖️';col='#9aa3b2';t1=l.desc||'Ajuste de saldo';t2=co.nome+' · fora das receitas e despesas';amt='<span class="a">'+(l.valor>=0?'+ ':'− ')+money(Math.abs(l.valor))+'</span>'}
  else if(l.tipo==='a'){ico='📈';col='#34d399';t1=l.desc||'Rendimento';t2='Atualização de valor · '+(co?co.nome:'?');amt='<span class="a'+(l.valor>=0?' pos':' neg')+'">'+(l.valor>=0?'+ ':'− ')+money(Math.abs(l.valor))+'</span>'}
  else if(l.tipo==='t'){var b=contaById(l.para),apl=isInv(l.para)&&!isInv(l.conta),res=isInv(l.conta)&&!isInv(l.para),pag=b&&b.tipo==='cartao';
    ico=apl?'📈':res?'↩️':pag?'💳':'⇄';col=(apl||res)?'#34d399':'#9aa3b2';
    t1=l.desc||(apl?'Aplicação':res?'Resgate':pag?'Pagamento de fatura':'Transferência');t2=(co?co.nome:'?')+' → '+(b?b.nome:'?')+(pag&&l.fat?' · '+faturaNome(b,l.fat):'');amt='<span class="a">'+money(l.valor)+'</span>'}
  else{var x=subIdx[l.sub]||{c:{nome:'?',icon:'•',cor:'#888888'},s:{nome:'?'}};ico=x.c.icon;col=x.c.cor;t1=l.desc||x.s.nome;t2=x.c.nome+' › '+x.s.nome;
    amt='<span class="a'+(l.tipo==='r'||l.est?' pos':'')+'">'+(l.tipo==='r'||l.est?'+ ':'− ')+money(Math.abs(l.valor))+'</span>';if(l.est&&!/estorno/i.test(t1))t1+=' · estorno'}
  if(l.pt>1)t1+=' ('+l.pn+'/'+l.pt+')';
  if(l.tipo==='d'){var mo=mesOrc(l);if(mo!==l.data.slice(0,7))t2+=' · conta em '+MESES[+mo.slice(5,7)-1].toLowerCase()}
  /* etiquetas: pendente (ainda não pago), atrasado (pendente com data já passada) ou programado (data futura) */
  var hj=todayISO(),pill='';
  /* como no Mobills: a situação fica em letra pequena embaixo do valor, sem etiqueta ao lado do nome */
  if(l.pend)pill=l.data<hj?'<span class="st late">atrasado</span>':'<span class="st pend">pendente</span>';
  else if(l.data>hj&&l.pg)pill='<span class="st">'+(l.tipo==='r'?'recebido':'pago')+' antes</span>';
  else if(l.data>hj)pill='<span class="st">programado</span>';
  /* linha enxuta: nome e valor em cima; embaixo, numa linha só, subcategoria/categoria, conta ou cartão e o mês em que conta */
  var naCartao=l.tipo==='d'&&co&&co.tipo==='cartao',sub2=esc(t2);
  if(l.tipo==='d'||l.tipo==='r'){var xs=subIdx[l.sub],mo2=l.tipo==='d'?mesOrc(l):l.data.slice(0,7);
    var dif=l.desc&&xs&&l.desc.trim().toLowerCase()!==xs.s.nome.toLowerCase();
    var rot=xs?(dif?xs.s.nome:xs.c.nome):'';if(rot&&rot.toLowerCase()===t1.replace(/ \(\d+\/\d+\)$/,'').toLowerCase())rot='';
    sub2=(rot?esc(rot)+' · ':'')+(naCartao?'<b class="vcard">'+esc(co.nome)+'</b>':esc(co?co.nome:'?'))+
      (mo2!==l.data.slice(0,7)?' · conta em '+MESES[+mo2.slice(5,7)-1].slice(0,3).toLowerCase():'');}
  return'<button class="ex'+(isReal(l)?'':' pnd')+(naCartao?' excard':'')+'" data-id="'+l.id+'"><span class="ico" style="--cc:'+col+'">'+esc(ico)+(naCartao?'<span class="icard" aria-hidden="true">💳</span>':'')+'</span><span class="t"><div class="n nf"><span class="nt">'+esc(t1)+'</span></div><div class="s">'+sub2+'</div></span>'+(pill?'<span class="aw">'+amt+pill+'</span>':amt)+'</button>';
}
function sortL(a,b){return a.data<b.data?1:a.data>b.data?-1:(b.ts||0)-(a.ts||0)}
/* attr (opcional): a linha vira um botão tocável, com seta */
function simpleRow(ico,cor,nome,sub,val,cls,attr){var tg=attr?'button type="button" '+attr:'div',fe=attr?'button':'div';
  return'<div class="krow"><'+tg+' class="khead"><span class="ico" style="--cc:'+cor+'">'+esc(ico)+'</span><span class="t"><div class="n">'+esc(nome)+'</div>'+(sub?'<div class="s">'+sub+'</div>':'')+'</span><span class="a '+(cls||'')+'">'+val+'</span>'+(attr?CHEV:'')+'</'+fe+'></div>'}

/* ---------- backup ---------- */
function fazerBackup(){S.config.lastBackup=todayISO();save();download('tetto-backup-'+todayISO()+'.json',JSON.stringify(S,null,2),'application/json');toast('Backup salvo em Downloads')}
function diasEntre(a,b){return Math.round((parseISO(b)-parseISO(a))/864e5)}
function backupBanner(){
  var hj=todayISO(),reais=S.lanc.filter(function(l){return l.data<=hj});
  if(reais.length<5)return'';
  var lb=S.config.lastBackup,desde=lb||reais.reduce(function(m,l){return l.data<m?l.data:m},hj),d=diasEntre(desde,hj);
  if(d<30)return'';
  return'<div class="hl row sp" style="margin-top:12px"><span>💾 '+(lb?'Seu último backup foi há '+d+' dias.':'Você ainda não fez nenhum backup.')+'</span><button type="button" class="chip" data-act="bk" style="flex:0 0 auto">Fazer backup</button></div>';
}
function download(name,text,type){
  var blob=new Blob([text],{type:type}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)},5000);
}
/* planilha: separador ";" e vírgula decimal (padrão do Excel em português), com acentos (BOM UTF-8) */
function toCSV(){
  /* protege contra fórmulas no Excel, mas deixa número negativo (ex.: -50,00) como número */
  function cell(x){x=String(x==null?'':x);if(/^(?:[=+@\t\r]|-(?![0-9][0-9.,]*$))/.test(x))x="'"+x;return/[;"\n\r]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}
  var TL={d:'Despesa',r:'Receita',t:'Transferência',a:'Rendimento'},rows=[['Data','Tipo','Categoria','Subcategoria','Grupo','Conta','Conta destino','Valor','Parcela','Descrição']];
  S.lanc.slice().sort(function(a,b){return a.data<b.data?-1:a.data>b.data?1:(a.ts||0)-(b.ts||0)}).forEach(function(l){
    var x=subIdx[l.sub],co=contaById(l.conta),pa=contaById(l.para),d=l.data.split('-');
    rows.push([d[2]+'/'+d[1]+'/'+d[0],TL[l.tipo],x?x.c.nome:'',x?x.s.nome:'',x&&x.c.grupo?GN[x.c.grupo]:'',co?co.nome:'',pa?pa.nome:'',l.valor.toFixed(2).replace('.',','),l.pt>1?l.pn+'/'+l.pt:'',l.desc||'']);
  });
  return'﻿'+rows.map(function(r){return r.map(cell).join(';')}).join('\r\n');
}

/* ---------- Início: tudo o que importa do mês num só lugar ---------- */
/* tetos do mês no Início: a ênfase é o que foi gasto de fato (% do teto);
   o previsto (pendentes) aparece à parte, e cada teto mostra quanto ele representa da receita */
/* barra com a porcentagem gasta, discreta, ao lado */
function barP(barHtml,p){return'<div class="barp">'+barHtml+'<span class="bp">'+(p==null?'':p===Infinity?'—':Math.round(p)+'%')+'</span></div>'}
function alertsCard(a){
  var L=[],capT=0,rec=a.rec+a.recP;
  S.cats.forEach(function(c){if(c.tipo!=='d')return;var t=catCap(c,cur),r=a.cat[c.id]||0,pv=a.catP[c.id]||0;capT+=t;
    if(t>0||r+pv>0)L.push({c:c,t:t,r:r,pv:pv,p:pctC(r,t)})});
  /* mesmo layout sempre: sem tetos, mostra o gasto de cada categoria com "sem teto" e um aviso curto */
  /* maior gasto (o valor mostrado na linha) primeiro; empate: maior previsto, depois maior teto */
  L.sort(function(x,y){return y.r-x.r||y.pv-x.pv||y.t-x.t});
  var pr=pct(a.desp,capT);
  var h='<div class="card tetocard"><div class="ttl">Tetos do mês</div><div class="row sp"><span class="l">Gasto</span><b>'+money(a.desp)+' <span class="s">'+(capT>0?'de '+money(capT):'· sem tetos')+'</span></b></div>'+barP(bar2(pct(a.desp,capT),pct(a.despP,capT),st(pr)),pr);
  if(!L.length)h+='<div class="empty">Nenhum gasto neste mês.</div>';
  L.forEach(function(x){
    h+='<button type="button" class="gr gbtn" data-act="ecat" data-id="'+x.c.id+'" aria-label="Abrir '+esc(x.c.nome)+' no Orçamento"><div class="row sp"><span class="n">'+esc(x.c.icon)+' '+esc(x.c.nome)+'</span><b class="'+st(x.p)+'" style="font-size:14px">'+money(x.r)+' <span class="s">'+(x.t>0?'de '+money(x.t):'· sem teto')+'</span></b></div>'+
      barP(x.t>0?bar2(pctC(x.r,x.t),pctC(x.pv,x.t),st(x.p)):bar2(0,0),x.p)+'</button>';
  });
  if(capT===0)h+='<div class="note">Você ainda não definiu tetos. Defina no Orçamento para ver quanto ainda pode gastar.</div>';
  return h+'<button type="button" class="btn ghost" data-go="budget">'+(capT>0?'Ver orçamento':'Definir tetos no Orçamento')+'</button></div>';
}
function renderHome(){
  var a=agg(cur),h=backupBanner(),hj=todayISO();
  var capT=S.cats.reduce(function(x,c){return c.tipo==='d'?x+catCap(c,cur):x},0);
  if(!S.lanc.length&&capT===0)h+='<div class="card"><div class="ttl">Comece por aqui</div><ol class="steps"><li>Defina os tetos em <b>Orçamento</b></li><li>Confira suas contas e investimentos aqui no Início e seus cartões em <b>Cartões</b></li><li>Toque no <b>+</b> e lance a receita do mês</li></ol></div>';
  var pr=pct(a.desp,a.rec),now=ymNow(),bm=a.rec-a.desp,bmP=a.rec+a.recP-a.desp-a.despP;
  /* como no Mobills: em destaque o SALDO EM CONTAS (dinheiro real, acumulado dos meses anteriores);
     o balanço do mês (receitas − despesas do mês) fica numa linha abaixo */
  var sRot,sV,sPrev=null;
  if(cur===now){sRot='Saldo em contas';sV=saldoContasFim(cur,false);sPrev=saldoContasFim(cur,true);if(Math.abs(sPrev-sV)<0.005)sPrev=null}
  else if(cur<now){sRot='Saldo em contas no fim do mês';sV=saldoContasFim(cur,false)}
  else{sRot='Saldo previsto em contas no fim do mês';sV=saldoContasFim(cur,true)}
  h+='<div class="card bal tetocard"><div class="bal-l">'+sRot+'</div><div class="bal-v '+(sV<0?'neg':'')+'">'+money(sV)+'</div>'+
    (sPrev!==null?'<div class="bal-pv">Previsto no fim do mês: <b class="'+(sPrev<0?'neg':'')+'">'+money(sPrev)+'</b></div>':'')+
    '<div class="bal-row"><button type="button" class="bal-it" data-filtro="r" aria-label="Ver receitas do mês no extrato"><span class="bal-ic up">↑</span><div><div class="l">Receitas</div><div class="bal-n pos">'+money(a.rec)+'</div>'+(a.recP?'<div class="bal-p"><span>+ '+money(a.recP)+'</span> previsto</div>':'')+'</div></button>'+
    '<button type="button" class="bal-it" data-filtro="d" aria-label="Ver despesas do mês no extrato"><span class="bal-ic dn">↓</span><div><div class="l">Despesas</div><div class="bal-n neg">'+money(a.desp)+'</div>'+(a.despP?'<div class="bal-p"><span>+ '+money(a.despP)+'</span> previsto</div>':'')+'</div></button></div>'+
    '<div class="row sp s" style="margin-top:10px"><span>Balanço do mês</span><b class="'+(bm<0?'neg':'pos')+'">'+money(bm)+'</b></div>'+
    (a.recP||a.despP?'<div class="row sp s"><span>Balanço previsto do mês</span><b class="'+(bmP<0?'neg':'')+'">'+money(bmP)+'</b></div>':'')+
    (a.rec>0?bar(pr)+'<div class="row sp s"><span>Despesas usaram '+pctTxt(pr)+' da receita</span><b class="'+st(pr)+'">'+pctTxt(pr)+'</b></div>':'')+
    (a.apo?'<div class="row sp s" style="margin-top:8px"><span>📈 '+(a.apo>0?'Aplicado em investimentos':'Resgatado de investimentos')+'</span><b class="'+(a.apo>0?'pos':'')+'">'+money(Math.abs(a.apo))+'</b></div>':'')+'</div>';
  /* ordem do Início: balanço → vencimentos → contas e investimentos → cartões → regra 50/30/20 → tetos do mês */
  h+=vencCard();
  var tc=0,ti=0,rows='',irows='';
  S.contas.forEach(function(c){var v=saldoConta(c.id);
    if(c.tipo==='conta'||c.tipo==='carteira'){tc+=v;rows+=simpleRow(contaIcon(c),'var(--accent)',c.nome,'',money(v),v<0?'neg':'','data-act="vconta" data-id="'+c.id+'" aria-label="Ver lançamentos de '+esc(c.nome)+'"')}
    else if(c.tipo==='invest'){ti+=v;var open=!!openK[c.id];
      irows+='<div class="krow'+(open?' open':'')+'"><button type="button" class="khead" data-act="tgk" data-id="'+c.id+'" aria-expanded="'+open+'"><span class="ico" style="--cc:#34d399">'+esc(contaIcon(c))+'</span><span class="t"><div class="n">'+esc(c.nome)+'</div><div class="s">'+(open?'Toque para fechar':'Toque para aplicar, resgatar ou atualizar')+'</div></span><span class="a">'+money(v)+'</span>'+CHEV+'</button>'+(open?invDetail(c):'')+'</div>'}});
  if(hEdit){
    /* cadastro de contas e investimentos no mesmo lugar onde eles aparecem */
    var ed=[];S.contas.forEach(function(c,i){if(c.tipo!=='cartao')ed.push(moreEditRow(c,i))});
    h+='<div class="card" id="hEditor"><div class="ttl">Gerenciar contas e investimentos</div>'+ed.join('')+
      '<div class="note">"Saldo ao começar" é quanto havia no dia em que você começou a usar o Tetto. Toque no ícone para trocá-lo. Cartões são gerenciados na aba Cartões.</div>'+
      '<div class="grid2"><button type="button" class="btn newg" data-act="addconta">+ Conta</button><button type="button" class="btn newg" data-act="addinv">+ Investimento</button></div>'+
      '<button type="button" class="btn primary" data-act="hdone">Concluir</button></div>';
  }else{
    h+='<div class="card"><div class="ttl">Contas e investimentos · saldo hoje</div>'+rows+'<div class="row sp s" style="margin-top:8px"><span>Total em contas</span><b>'+money(tc)+'</b></div>';
    /* investimentos completos no Início: aplicar, resgatar e atualizar sem sair da tela */
    h+='<div class="lbl" style="margin-top:16px">Investimentos</div>'+(irows||'<div class="empty">Nenhum investimento ainda.</div>')+
      '<div class="row sp s" style="margin-top:8px"><span>Total investido</span><b>'+money(ti)+'</b></div>'+
      '<div class="row sp" style="margin-top:6px"><span class="l">Patrimônio (contas + investimentos)</span><b class="v sm">'+money(tc+ti)+'</b></div>'+
      '<button type="button" class="btn ghost" data-act="gerir">Gerenciar contas e investimentos</button></div>';
  }
  var cards=S.contas.filter(function(c){return c.tipo==='cartao'});
  if(cards.length){
    /* acompanha o mês escolhido no topo: mostra a fatura que vence nesse mês */
    /* quanto cada fatura consome da receita do mês (recebida + prevista) */
    var recM=a.rec+a.recP,pRecT=function(v){return recM>0?Math.round(v/recM*100)+'% da receita':''};
    var totF=0,cr=cards.map(function(c){
      var fy=fechaDoVenc(c,cur),fa=faturaPartes(c,fy);totF+=fa.t;var sit=situacaoFatura(c,fy),us=Math.max(0,-saldoConta(c.id)),p=c.limite?pct(us,c.limite):null;
      return'<div class="krow"><button type="button" class="khead" data-act="vcard" data-id="'+c.id+'" aria-label="Ver fatura de '+esc(c.nome)+'"><span class="ico" style="--cc:var(--accent)">'+esc(contaIcon(c))+'</span><span class="t"><div class="n">'+esc(c.nome)+'</div><div class="s">'+cap1(faturaNome(c,fy))+' · <span class="'+sit.cls+'">'+sit.txt+'</span>'+(fa.p?' · '+money(fa.p)+' programado':'')+'</div></span><span class="r" style="text-align:right"><div class="a">'+money(fa.t)+'</div>'+(recM>0&&fa.t>0?'<div class="s">'+pRecT(fa.t)+'</div>':'')+'</span>'+CHEV+'</button>'+
        '</div>'}).join('');
    h+='<div class="card"><div class="ttl">Cartões · faturas que vencem em '+esc(ymLabel(cur).toLowerCase())+'</div>'+cr+
      '<div class="row sp s" style="margin-top:8px"><span>Total das faturas</span><b>'+money(totF)+(recM>0?' <span class="s">· '+pRecT(totF)+'</span>':'')+'</b></div>'+
      '<button type="button" class="btn ghost" data-go="cards">Ver cartões</button></div>';
  }
  h+=ruleCard(a)+alertsCard(a);
  $('#view-home').innerHTML=h;
}
$('#view-home').addEventListener('click',function(e){
  if(e.target.closest('[data-act=bk]')){fazerBackup();renderHome();return}
  /* tocar em Receitas ou Despesas abre o extrato do mês já filtrado */
  var f=e.target.closest('[data-filtro]');if(f){xf=f.dataset.filtro;xConta='all';setTab('list');return}
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act;
  if(a==='tgk'){openK[b.dataset.id]=!openK[b.dataset.id];renderHome()}
  else if(a==='iapl')openSheet(null,'i',{para:b.dataset.id});
  else if(a==='ires')openSheet(null,'res',{conta:b.dataset.id});
  else if(a==='gerir')abrirGerir();
  /* atalhos: alerta abre a categoria, conta abre o extrato dela, cartão abre a fatura */
  else if(a==='ecat'){bEdit=false;bOne=null;bView='tetos';openCats[b.dataset.id]=true;setTab('budget');var cb=vb.querySelector('[data-act="tgc"][data-id="'+b.dataset.id+'"]');if(cb)cb.scrollIntoView({block:'center'})}
  else if(a==='vconta'){xf='all';xConta=b.dataset.id;setTab('list')}
  else if(a==='vcard'){openK[b.dataset.id]=true;setTab('cards');var kc=vk.querySelector('[data-act="tgk"][data-id="'+b.dataset.id+'"]');if(kc)kc.closest('.card').scrollIntoView()}
  else if(a==='hdone'){hEdit=false;renderHome()}
  else if(a==='pickc')openPicker('conta',Number(b.closest('[data-k]').dataset.k));
  else if(a==='addconta'||a==='addinv'){S.contas.push({id:uid(),nome:a==='addinv'?'Novo investimento':'Nova conta',tipo:a==='addinv'?'invest':'conta',saldoIni:0});save();renderHome();focusLast($('#hEditor'),'[data-f=knome]')}
  else if(a==='rmconta')rmConta(Number(b.closest('[data-k]').dataset.k),renderHome);
  else if(a==='ver-regra'){bView='tetos';setTab('budget')}
  else if(a==='vgrp'){bView='tetos';bGrp=b.dataset.g;bEdit=false;bOne=null;setTab('budget')}
  else if(a==='apnew'){apmOpen[b.dataset.id]=true;renderHome()}
  /* vencimentos: marcar como pago (se a data ainda não chegou, fica com a data de hoje) ou abrir o pagamento da fatura */
  else if(a==='vpago'){var vl=S.lanc.filter(function(x){return x.id===b.dataset.id})[0];if(vl){delete vl.pend;if(vl.data>todayISO())vl.pg=true;save();renderHome();toast(vl.tipo==='r'?'Marcado como recebido':'Marcado como pago')}}
  else if(a==='vfat'){openSheet(null,'t',{para:b.dataset.id,desc:'Pagamento da fatura',fat:b.dataset.fat})}
  /* tocar no item abre para editar; na fatura, abre o cartão no mês do vencimento com as compras */
  else if(a==='vedit'){var ve=S.lanc.filter(function(x){return x.id===b.dataset.id})[0];if(ve)openSheet(ve)}
  else if(a==='vverfat'){cur=b.dataset.ym;openK[b.dataset.id]=true;setTab('cards')}
  else if(a==='apcancel'){apmOpen[b.dataset.id]=false;renderHome()}
  else if(a==='apsave'){var ic=contaById(b.dataset.id);if(ic&&salvarAporte(ic,b.closest('[data-apm]')))renderHome()}
  else if(a==='apstop'){var ic2=contaById(b.dataset.id);dialog('Parar o aporte mensal?','Os meses pendentes ou futuros serão excluídos. Os que já foram feitos continuam.',[{t:'Parar',cls:'danger',v:true},{t:'Cancelar',cls:'ghost',v:false}],function(ok){if(ok){pararAporte(ic2);save();toast('Aporte mensal encerrado')}renderHome()})}
});
/* gerenciar contas e investimentos numa janela por cima do Início (opts.novoInv: já cria um investimento para nomear) */
function renderGerir(){
  var ed=[];S.contas.forEach(function(c,i){if(c.tipo!=='cartao')ed.push(moreEditRow(c,i))});
  $('#mBody').innerHTML=ed.join('')+
    '<div class="note">"Saldo ao começar" é quanto havia no dia em que você começou a usar o Tetto. Toque no ícone para trocá-lo. Cartões são gerenciados na aba Cartões.</div>'+
    '<div class="grid2"><button type="button" class="btn newg" data-act="addconta">+ Conta</button><button type="button" class="btn newg" data-act="addinv">+ Investimento</button></div>'+
    '<button type="button" class="btn primary" data-act="hdone">Concluir</button>';
}
function abrirGerir(opts){
  opts=opts||{};
  if(opts.novoInv){S.contas.push({id:uid(),nome:'Novo investimento',tipo:'invest',saldoIni:0});save()}
  renderGerir();$('#msheet').scrollTop=0;$('#msheet').classList.add('on');$('#backdrop').classList.add('on');
  if(opts.replace)history.replaceState({sheet:1},'');else history.pushState({sheet:1},'');
  if(opts.novoInv)focusLast($('#mBody'),'[data-f=knome]');
}
var mb=$('#mBody');
mb.addEventListener('input',contaInput);
mb.addEventListener('change',function(e){if(e.target.dataset.f==='ktipo')mudarTipo(e.target,renderGerir)});
mb.addEventListener('submit',function(e){e.preventDefault();var f=e.target.closest('form.upd');if(f)updSubmit(f)});
mb.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act;
  if(a==='hdone'){closeSheet();return}
  if(a==='pickc'){openPicker('conta',Number(b.closest('[data-k]').dataset.k));return}
  if(a==='addconta'||a==='addinv'){S.contas.push({id:uid(),nome:a==='addinv'?'Novo investimento':'Nova conta',tipo:a==='addinv'?'invest':'conta',saldoIni:0});save();renderGerir();focusLast(mb,'[data-f=knome]');return}
  if(a==='rmconta'){rmConta(Number(b.closest('[data-k]').dataset.k),function(){renderGerir();renderHome()});return}
});
$('#view-home').addEventListener('input',contaInput);
$('#view-home').addEventListener('change',function(e){if(e.target.dataset.f==='ktipo')mudarTipo(e.target,renderHome)});
/* trocar o tipo (conta, dinheiro, investimento) com as checagens necessárias */
function mudarTipo(t,depois){
  var c=S.contas[Number(t.closest('[data-k]').dataset.k)],comum=c.tipo==='conta'||c.tipo==='carteira';
  if(t.value==='invest'&&comum&&contasComuns()<=1){info('Não dá para mudar','É preciso ter pelo menos uma conta bancária ou de dinheiro.');t.value=c.tipo;return}
  if(t.value==='invest'&&S.lanc.some(function(l){return(l.tipo==='d'||l.tipo==='r')&&l.conta===c.id})){info('Não dá para mudar','Essa conta tem receitas ou despesas lançadas. Investimentos só recebem aplicações, resgates e rendimentos.');t.value=c.tipo;return}
  c.tipo=t.value;save();depois();
}
/* atualizar o valor de um investimento: a diferença vira rendimento */
$('#view-home').addEventListener('submit',function(e){
  e.preventDefault();var f=e.target.closest('form.upd');if(f)updSubmit(f);
});
function updSubmit(f){
  var id=f.dataset.id,v=parseNum(f.querySelector('input').value),aj=f.dataset.kind==='ajuste';
  /* reajuste de saldo: a diferença vira um lançamento "Ajuste de saldo" hoje (não conta como receita nem despesa) */
  if(isNaN(v)||(!aj&&v<0)){toast(aj?'Informe o saldo real da conta hoje':'Informe quanto o investimento vale hoje');return}
  var d=Math.round((v-saldoConta(id))*100)/100;
  if(Math.abs(d)<0.005){toast(aj?'O saldo já está certo':'O valor já está atualizado');return}
  S.lanc.push({id:uid(),ts:Date.now(),tipo:'a',valor:d,data:todayISO(),conta:id,desc:aj?'Ajuste de saldo':d>=0?'Rendimento':'Desvalorização'});
  save();renderHome();if($('#msheet').classList.contains('on'))renderGerir();toast(aj?'Saldo ajustado em '+(d>0?'+ ':'− ')+money(Math.abs(d)):(d>=0?'Rendimento de ':'Variação de ')+money(d)+' registrado');
}

/* ---------- Lançamentos (extrato) ---------- */
/* calendário de vencimentos: só o que tem data para pagar ou receber (recorrentes e faturas dos cartões);
   gasto avulso fica só no extrato. Tocar num dia mostra o que vence nele. */
var xDia=null;
function vencDoMes(){
  var it={},add=function(d,o){(it[d]=it[d]||[]).push(o)},hj=todayISO();
  S.lanc.forEach(function(l){if(!l.rec||l.data.slice(0,7)!==cur)return;add(l.data,{l:l,pago:isReal(l)})});
  S.contas.forEach(function(c){if(c.tipo!=='cartao')return;var fy=fechaDoVenc(c,cur),tt=faturaTotal(c,fy);if(!(tt>0))return;
    var d=datasFatura(c,fy),falta=tt-pagoDe(c,fy);add(d.ve,{c:c,fy:fy,v:tt,pago:falta<=0.005,falta:falta})});
  return it;
}
function calHTML(){
  var y=+cur.slice(0,4),m=+cur.slice(5,7),n=daysIn(cur),first=new Date(y,m-1,1).getDay(),hj=todayISO(),it=vencDoMes();
  var h='<div class="card cal"><div class="ttl">Vencimentos de '+esc(ymLabel(cur).toLowerCase())+'</div><div class="calh">'+['D','S','T','Q','Q','S','S'].map(function(x){return'<span>'+x+'</span>'}).join('')+'</div><div class="calg">';
  for(var i=0;i<first;i++)h+='<span></span>';
  for(var d=1;d<=n;d++){var k=cur+'-'+pad(d),L=it[k]||[],dots='';
    var temF=L.some(function(x){return x.c}),temA=L.some(function(x){return!x.c&&!x.pago&&x.l.data<hj}),temP=L.some(function(x){return!x.c&&!x.pago&&x.l.data>=hj}),temOk=L.some(function(x){return!x.c&&x.pago});
    dots=(temA?'<b class="dd"></b>':'')+(temP?'<b class="dp"></b>':'')+(temF?'<b class="dc"></b>':'')+(temOk?'<b class="dr"></b>':'');
    h+='<button type="button" class="cd'+(k===hj?' hoje':'')+(k===xDia?' sel':'')+'" data-dia="'+k+'" aria-label="Dia '+d+'"><span>'+d+'</span><i>'+dots+'</i></button>';
  }
  h+='</div><div class="calleg"><span><b class="dp"></b>a vencer</span><span><b class="dd"></b>atrasado</span><span><b class="dc"></b>fatura</span><span><b class="dr"></b>pago</span></div>';
  /* o que vence no dia escolhido */
  if(xDia){var D=it[xDia]||[];
    h+='<div class="lbl">Vence em '+dShort(xDia)+'</div>';
    if(!D.length)h+='<div class="empty">Nada vence neste dia.</div>';
    D.forEach(function(x){
      if(x.c)h+='<div class="vrow"><button type="button" class="t vt" data-act="vverfat" data-id="'+x.c.id+'" data-ym="'+vencYM(x.c,x.fy)+'"><div class="n">💳 '+esc(x.c.nome)+' · '+faturaNome(x.c,x.fy)+'</div><div class="s">'+money(x.v)+(x.pago?' · paga':' · falta '+money(x.falta))+'</div></button></div>';
      else{var l=x.l,sb=subIdx[l.sub],nome=l.desc||(sb?sb.s.nome:l.tipo==='t'?'Transferência':'?');
        h+='<div class="vrow"><button type="button" class="t vt" data-act="vedit" data-id="'+l.id+'"><div class="n">'+esc(nome)+'</div><div class="s">'+(l.tipo==='r'?'+ ':'')+money(l.valor)+' · '+(x.pago?(l.tipo==='r'?'recebido':'pago'):l.data<hj?'atrasado':'a '+(l.tipo==='r'?'receber':'pagar'))+'</div></button></div>'}
    });
  }
  return h+'</div>';
}
function renderList(){
  if(xDia&&xDia.slice(0,7)!==cur)xDia=null;
  var F=[['all','Tudo'],['d','Despesas'],['r','Receitas'],['t','Transferências']];
  if(xConta!=='all'&&!contaById(xConta))xConta='all';
  var h='<div class="chips scroll" style="margin-top:8px">'+F.map(function(f){return'<button class="chip'+(xf===f[0]?' on':'')+'" data-xf="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>'+
    '<label style="margin-top:8px">Conta ou cartão<select id="xConta"><option value="all">Todas as contas e cartões</option>'+S.contas.map(function(c){return'<option value="'+c.id+'"'+(xConta===c.id?' selected':'')+'>'+esc(contaIcon(c))+' '+esc(c.nome)+'</option>'}).join('')+'</select></label>';
  /* tocar num dia do calendário mostra no extrato tudo o que aconteceu naquele dia (inclusive gastos avulsos) */
  var L=S.lanc.filter(function(l){return l.data.slice(0,7)===cur&&(!xDia||l.data===xDia)&&(xf==='all'||l.tipo===xf||(xf==='t'&&l.tipo==='a'))&&(xConta==='all'||l.conta===xConta||l.para===xConta)}).sort(sortL);
  var rec=0,desp=0,recP=0,despP=0;
  S.lanc.forEach(function(l){if(mesOrc(l)!==cur||!(xf==='all'||l.tipo===xf)||!(xConta==='all'||l.conta===xConta||l.para===xConta))return;var R=isReal(l);
    if(l.tipo==='r'){if(R)rec+=l.valor;else recP+=l.valor}else if(l.tipo==='d'){if(R)desp+=l.valor;else despP+=l.valor}});
  var filtrado=xf!=='all'||xConta!=='all'||!!xDia,fdesc=[];
  if(xDia)fdesc.push('dia '+dShort(xDia));
  if(xf!=='all')fdesc.push(F.filter(function(f){return f[0]===xf})[0][1]);
  if(xConta!=='all')fdesc.push(contaById(xConta).nome);
  if(filtrado)h+='<div class="hl row sp"><span>Filtro ativo: <b>'+esc(fdesc.join(' · '))+'</b></span><button type="button" class="chip" data-act="xclear">Limpar filtros</button></div>';
  /* resumo do mês com cada número nomeado (como no Mobills): o que já aconteceu, o que falta e o total */
  var linha=function(rot,v,cls,forte){return'<div class="rl'+(forte?' tot':'')+'"><span>'+rot+'</span><b class="'+(cls||'')+'">'+money(v)+'</b></div>'};
  var colR='<div class="rcol"><div class="l">Receitas</div>'+linha('Recebido',rec,'pos')+linha('A receber',recP,'acc')+linha('Total',rec+recP,'',true)+'</div>';
  var colD='<div class="rcol"><div class="l">Despesas</div>'+linha('Pago',desp,'neg')+linha('A pagar',despP,'warn')+linha('Total',desp+despP,'',true)+'</div>';
  var sh=rec-desp,sf=rec+recP-desp-despP;
  h+='<div class="card">'+(xf==='r'?colR:xf==='d'?colD:'<div class="grid2">'+colR+colD+'</div>')+
    (xf==='all'?'<div class="saldos"><div class="rl"><span>Balanço até agora</span><b class="'+(sh<0?'neg':'')+'">'+(sh<0?'− ':'')+money(Math.abs(sh))+'</b></div>'+
      '<div class="rl tot"><span>Balanço previsto do mês</span><b class="'+(sf<0?'neg':'pos')+'">'+(sf<0?'− ':'')+money(Math.abs(sf))+'</b></div></div>':'')+
    '<div class="note">'+L.length+(L.length===1?' lançamento':' lançamentos')+' em '+esc(ymLabel(cur))+(filtrado?' com o filtro':'')+'. "A receber" e "A pagar" são os pendentes e programados do mês. O balanço é só a diferença entre o que entrou e saiu no mês; o saldo acumulado das contas fica no Início.</div></div>';
  h+=calHTML();
  if(!L.length)h+='<div class="card"><div class="empty">'+(filtrado?'Nenhum lançamento com esse filtro neste mês.':'Nenhum lançamento neste mês. Toque no + para lançar.')+'</div></div>';
  var groups={},order=[];
  L.forEach(function(l){if(!groups[l.data]){groups[l.data]=[];order.push(l.data)}groups[l.data].push(l)});
  order.forEach(function(d){
    var net=groups[d].reduce(function(x,l){return x+(l.tipo==='r'?l.valor:l.tipo==='d'?-l.valor:0)},0);
    h+='<div class="card"><div class="grp"><span>'+dLong(d)+'</span><b class="'+(net<0?'':'pos')+'">'+(net<0?'− ':net>0?'+ ':'')+money(Math.abs(net))+'</b></div>'+groups[d].map(lItem).join('')+'</div>';
  });
  $('#view-list').innerHTML=h;chipsAtivo($('#view-list'));
}
$('#view-list').addEventListener('click',function(e){
  var b=e.target.closest('[data-xf]');if(b){xf=b.dataset.xf;renderList();return}
  var dd=e.target.closest('[data-dia]');if(dd){xDia=xDia===dd.dataset.dia?null:dd.dataset.dia;renderList();return}
  if(e.target.closest('[data-act=xclear]')){xf='all';xConta='all';xDia=null;renderList()}
  var va=e.target.closest('[data-act=vedit],[data-act=vverfat]');
  if(va){if(va.dataset.act==='vedit'){var vl=S.lanc.filter(function(x){return x.id===va.dataset.id})[0];if(vl)openSheet(vl)}else{cur=va.dataset.ym;openK[va.dataset.id]=true;setTab('cards')}return}
});
$('#view-list').addEventListener('change',function(e){if(e.target.id==='xConta'){xConta=e.target.value;renderList()}});

/* ---------- edição de contas e cartões (usada em Cartões e em Mais) ---------- */
function contasComuns(){return S.contas.filter(function(c){return c.tipo==='conta'||c.tipo==='carteira'}).length}
function rmConta(i,depois){
  var c=S.contas[i];
  if((c.tipo==='conta'||c.tipo==='carteira')&&contasComuns()<=1){info('Não dá para excluir','É preciso ter pelo menos uma conta bancária ou de dinheiro.');return}
  var n=S.lanc.filter(function(l){return l.conta===c.id||l.para===c.id}).length;
  if(n){info('Não dá para excluir','"'+c.nome+'" tem '+n+' lançamentos. Mude a conta desses lançamentos ou exclua-os antes.');return}
  ask('Excluir "'+c.nome+'"?','Essa ação não pode ser desfeita.','Excluir',function(){S.contas.splice(S.contas.indexOf(c),1);save();depois();toast('Excluído')});
}
/* janela de confirmação do próprio app: navegadores embutidos podem bloquear confirm() e alert() */
var dlgCb=null;
function dialog(title,msg,btns,cb){
  $('#dlgT').textContent=title;$('#dlgM').textContent=msg||'';$('#dlgM').hidden=!msg;
  $('#dlgB').innerHTML=btns.map(function(b,i){return'<button type="button" class="btn '+(b.cls||'ghost')+'" data-i="'+i+'">'+esc(b.t)+'</button>'}).join('');
  dlgCb=function(i){dlgCb=null;$('#dlg').classList.remove('on');var b=btns[i];if(cb&&b&&b.v!==undefined)cb(b.v)};
  $('#dlg').classList.add('on');syncVoltar();
}
$('#dlgB').addEventListener('click',function(e){var b=e.target.closest('[data-i]');if(b&&dlgCb)dlgCb(Number(b.dataset.i))});
$('#dlg').addEventListener('click',function(e){if(e.target.id==='dlg'&&dlgCb)dlgCb(-1)});
function ask(title,msg,okTxt,cb){dialog(title,msg,[{t:okTxt||'Confirmar',cls:'danger',v:true},{t:'Cancelar',cls:'ghost'}],function(){cb()})}
function info(title,msg){dialog(title,msg,[{t:'Entendi',cls:'primary'}])}
function contaInput(e){
  var t=e.target,box=t.closest('[data-k]');if(!box)return;var c=S.contas[Number(box.dataset.k)],v,f=t.dataset.f;
  if(f==='knome')c.nome=t.value.trim()||'Conta';
  else if(f==='kini'){v=parseNum(t.value);c.saldoIni=isNaN(v)?0:v}
  else if(f==='kdev'){v=parseNum(t.value);c.saldoIni=isNaN(v)?0:-Math.abs(v)}
  else if(f==='klim'){v=parseNum(t.value);if(isNaN(v)||v<=0)delete c.limite;else c.limite=v}
  else if(f==='kfec'||f==='kven'){v=parseInt(t.value,10);var k=f==='kfec'?'fecha':'vence';if(v>=1&&v<=31)c[k]=v;else delete c[k]}
  else return;
  save();
}
function iconBtn(c){return'<button type="button" class="ico" data-act="pickc" style="--cc:var(--accent)" aria-label="Escolher ícone">'+esc(contaIcon(c))+'</button>'}
/* campo de nome cresce para mostrar o nome inteiro (até 2 linhas ou mais) */
function autoAlt(el){el.style.height='auto';el.style.height=el.scrollHeight+'px'}
function focusLast(root,sel){var ins=root.querySelectorAll(sel);ins=ins[ins.length-1];if(ins){ins.focus();ins.select()}}

/* ---------- Cartões: tudo de cartão num só lugar ---------- */
/* a aba Cartões mostra só a fatura que vence no mês escolhido no topo (como no Mobills) */
function isoAdd(d,n){var x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())}
/* o que está atrasado, vence hoje ou nos próximos 3 dias: pendentes e faturas de cartão ainda não pagas */
function vencCard(){
  var hj=todayISO(),lim=isoAdd(hj,3),it=[];
  S.lanc.forEach(function(l){if(l.pend&&l.data<=lim)it.push({d:l.data,l:l})});
  S.contas.forEach(function(c){if(c.tipo!=='cartao')return;
    [-1,0,1].forEach(function(k){var fy=fechaDoVenc(c,ymAdd(ymNow(),k)),dt=datasFatura(c,fy),falta=faturaTotal(c,fy)-pagoDe(c,fy);
      if(falta>0.005&&dt.ve<=lim&&!it.some(function(x){return x.c===c&&x.fy===fy}))it.push({d:dt.ve,c:c,fy:fy,v:falta})});
  });
  if(!it.length)return'';
  it.sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:0});
  var h='<div class="card"><div class="ttl">Vencimentos</div>';
  it.forEach(function(x){
    var tag=x.d<hj?'<span class="st late">atrasado</span> · ':x.d===hj?'<span class="st pend">vence hoje</span> · ':'<span class="st">dia '+dShort(x.d)+'</span> · ';
    if(x.l){var l=x.l,sb=subIdx[l.sub],rec=l.tipo==='r',nome=l.desc||(sb?sb.s.nome:l.tipo==='t'?'Transferência':'?');
      h+='<div class="vrow"><button type="button" class="t vt" data-act="vedit" data-id="'+l.id+'" aria-label="Editar '+esc(nome)+'"><div class="n nf"><span class="nt">'+esc(nome)+'</span></div><div class="s">'+tag+(rec?'+ ':'')+money(l.valor)+(sb?' · '+esc(sb.c.nome):'')+'</div></button><button type="button" class="chip" data-act="vpago" data-id="'+l.id+'">'+(rec?'Receber':'Pagar')+'</button></div>'}
    else h+='<div class="vrow"><button type="button" class="t vt" data-act="vverfat" data-id="'+x.c.id+'" data-ym="'+vencYM(x.c,x.fy)+'" aria-label="Ver '+faturaNome(x.c,x.fy)+'"><div class="n nf"><span class="nt">💳 '+esc(x.c.nome)+' · '+faturaNome(x.c,x.fy)+'</span></div><div class="s">'+tag+money(x.v)+' a pagar</div></button><button type="button" class="chip" data-act="vfat" data-id="'+x.c.id+'" data-fat="'+x.fy+'">Pagar</button></div>';
  });
  return h+'</div>';
}
function datasFatura(c,fy){
  var vy=vencYM(c,fy),fe=fy+'-'+pad(c.fecha?fechaDia(c,fy):daysIn(fy)),ve=vy+'-'+pad(Math.min(c.vence||daysIn(vy),daysIn(vy)));
  return{fe:fe,ve:ve,ok:!!(c.fecha&&c.vence)};
}
function cardTop(c){
  var fy=fechaDoVenc(c,cur),fa=faturaPartes(c,fy),sit=situacaoFatura(c,fy),d=datasFatura(c,fy),ps=pagosFatura(c),h='';
  h+='<div class="hl"><div class="row sp"><span>'+cap1(faturaNome(c,fy))+'</span><b class="'+sit.cls+'" style="font-size:14px">'+cap1(sit.txt.split(' · ')[0])+'</b></div>'+
    '<div class="v" style="margin-top:6px">'+money(fa.t)+'</div>'+
    (fa.p>0?'<div class="s">inclui '+money(fa.p)+' programado (parcelas e compras futuras)</div>':'')+
    (sit.txt.indexOf('pago ')>=0?'<div class="s">'+sit.txt.slice(sit.txt.indexOf('pago ')).replace(/^p/,'P')+'</div>':'')+
    '<div class="grid2" style="margin-top:10px"><div><div class="l">Fechamento</div><div class="v sm">'+dShort(d.fe)+'</div></div><div><div class="l">Vencimento</div><div class="v sm">'+dShort(d.ve)+'</div></div></div>'+
    (d.ok?'':'<div class="s" style="margin-top:6px">Datas aproximadas. Toque no nome do cartão para informar os dias certos.</div>')+'</div>';
  if(ps._sobra>0)h+='<div class="note">Você pagou '+money(ps._sobra)+' a mais do que as faturas somam. Esse valor fica como crédito no cartão. Se foi um pagamento lançado duas vezes, exclua um em Lançamentos.</div>';
  if(c.limite&&cur===ymNow()){var usado=Math.max(0,-saldoConta(c.id));h+='<div class="row sp s" style="margin-top:10px"><span>Limite disponível hoje</span><b class="'+remCls(c.limite-usado)+'">'+money(c.limite-usado)+' de '+money(c.limite)+'</b></div>'}
  return h;
}
/* lançamentos da fatura do mês: compras e pagamentos */
function cardMore(c){
  var fy=fechaDoVenc(c,cur),vm=vencYM(c,fy);
  var compras=S.lanc.filter(function(l){return l.tipo==='d'&&l.conta===c.id&&cicloDe(c,l.data)===fy}).sort(sortL);
  var pags=S.lanc.filter(function(l){return l.tipo==='t'&&l.para===c.id&&(l.fat?l.fat===fy:l.data.slice(0,7)===vm)}).sort(sortL);
  return(compras.length?compras.map(lItem).join(''):'<div class="empty">Nenhuma compra nesta fatura.</div>')+
    (pags.length?'<div class="lbl">Pagamentos</div>'+pags.map(lItem).join(''):'');
}
/* pagamentos que quitam a fatura: os feitos para ela; se ela foi quitada por crédito de outro pagamento,
   os pagamentos mais recentes até cobrir o valor pago */
function pagsDaFatura(c,fy){
  var hj=todayISO(),vm=vencYM(c,fy),real=function(l){return l.tipo==='t'&&l.para===c.id&&isReal(l)};
  var d=S.lanc.filter(function(l){return real(l)&&(l.fat?l.fat===fy:l.data.slice(0,7)===vm)});
  if(d.length)return d;
  /* crédito: só pagamentos sem fatura escolhida ou que passaram do total da fatura deles */
  var falta=pagoDe(c,fy),L=S.lanc.filter(function(l){return real(l)&&(!l.fat||faturaTotal(c,l.fat)<l.valor-0.005)}).sort(function(a,b){return b.data<a.data?-1:b.data>a.data?1:(b.ts||0)-(a.ts||0)}),r=[];
  for(var i=0;i<L.length&&falta>0.005;i++){r.push(L[i]);falta-=L[i].valor}
  return r;
}
function nLancFat(c){var fy=fechaDoVenc(c,cur);return S.lanc.filter(function(l){return l.tipo==='d'&&l.conta===c.id&&cicloDe(c,l.data)===fy}).length}
function cardsSummary(cards){
  var T=0;cards.forEach(function(c){T+=faturaPartes(c,fechaDoVenc(c,cur)).t});
  return'<div class="card"><div class="row sp"><span class="l">Total das faturas de '+esc(ymLabel(cur).toLowerCase())+'</span><b class="v sm">'+money(T)+'</b></div></div>';
}
/* dívida do cartão até hoje (sem parcelas futuras): sugestão de valor para pagar a fatura */
function devidoHoje(c){var hj=todayISO(),v=-c.saldoIni;S.lanc.forEach(function(l){if(!isReal(l))return;if(l.tipo==='d'&&l.conta===c.id)v+=l.valor;else if(l.tipo==='t'){if(l.para===c.id)v-=l.valor;if(l.conta===c.id)v+=l.valor}});return Math.round(Math.max(0,v)*100)/100}
function cardEditRow(c,i){
  return'<div class="ssub" data-k="'+i+'"><div class="row">'+iconBtn(c)+'<input data-f="knome" value="'+esc(c.nome)+'" maxlength="30" aria-label="Nome do cartão"><button type="button" class="x" data-act="rmconta" aria-label="Excluir cartão">✕</button></div>'+
    '<div class="grid2"><label>Limite<input data-f="klim" inputmode="decimal" value="'+showNum(c.limite)+'" placeholder="0"></label><label>Já devia ao começar<input data-f="kdev" inputmode="decimal" value="'+showNum(-c.saldoIni||null)+'" placeholder="0"></label></div>'+
    '<div class="grid2"><label>Fecha no dia<input data-f="kfec" inputmode="numeric" value="'+(c.fecha||'')+'" placeholder="ex.: 5"></label><label>Vence no dia<input data-f="kven" inputmode="numeric" value="'+(c.vence||'')+'" placeholder="ex.: 12"></label></div></div>';
}
function renderCards(){
  var cards=[],h='';S.contas.forEach(function(c,i){if(c.tipo==='cartao')cards.push([c,i])});
  if(kEdit){
    h+='<div class="card"><div class="ttl">Gerenciar cartões</div>'+(cards.length?cards.map(function(x){return cardEditRow(x[0],x[1])}).join(''):'<div class="empty">Nenhum cartão.</div>')+
      '<div class="note">Toque no ícone para trocá-lo. "Já devia ao começar" é a fatura em aberto no dia em que você começou a usar o Tetto.</div>'+
      '<button type="button" class="btn newg" data-act="kadd">+ Novo cartão</button><button type="button" class="btn primary" data-act="kedit">Concluir</button></div>';
  }else if(!cards.length){
    h+='<div class="card"><div class="empty">Nenhum cartão cadastrado ainda.</div><button type="button" class="btn primary" data-act="kadd">+ Cadastrar cartão</button></div>';
  }else{
    if(cards.length>1)h+=cardsSummary(cards.map(function(x){return x[0]}));
    cards.forEach(function(x){var c=x[0],open=!!openK[c.id];
      h+='<div class="card"><button type="button" class="row khead" data-act="kedit" aria-label="Editar '+esc(c.nome)+'" style="padding:0;min-height:0"><span class="ico" style="--cc:var(--accent)">'+esc(contaIcon(c))+'</span><span class="t"><div class="n" style="font-size:17px">'+esc(c.nome)+'</div></span><span class="s">✎ editar</span></button>'+
        cardTop(c)+
        '<div class="grid2" style="margin-top:12px"><button type="button" class="btn primary sm" data-act="kbuy" data-id="'+c.id+'">Nova compra</button>'+(function(){var fy=fechaDoVenc(c,cur),pg=pagoDe(c,fy),tt=faturaTotal(c,fy),quit=tt>0&&pg>=tt-0.005;return(quit?'<button type="button" class="btn ghost sm" data-act="kreopen" data-id="'+c.id+'">Reabrir fatura</button></div>':'<button type="button" class="btn ghost sm" data-act="kpay" data-id="'+c.id+'">Pagar fatura</button></div>'+(pg>0?'<button type="button" class="btn ghost sm" data-act="kreopen" data-id="'+c.id+'" style="margin-top:8px">Reabrir fatura (desfazer pagamento)</button>':''))})()+''+
        '<div class="krow'+(open?' open':'')+'" style="margin-top:8px"><button type="button" class="khead" data-act="tgk" data-id="'+c.id+'" style="min-height:40px"><span class="t s">'+(open?'Ocultar compras':'Ver compras desta fatura ('+nLancFat(c)+')')+'</span>'+CHEV+'</button>'+(open?cardMore(c):'')+'</div></div>';
    });
    h+='<button type="button" class="btn ghost" data-act="kedit">Gerenciar cartões</button>';
  }
  $('#view-cards').innerHTML=h;
}
var vk=$('#view-cards');
vk.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act;
  if(a==='pickc'){openPicker('conta',Number(b.closest('[data-k]').dataset.k));return}
  if(a==='kbuy'){openSheet(null,'c',{conta:b.dataset.id});return}
  if(a==='kest'){openSheet(null,'est',{conta:b.dataset.id,desc:'Estorno'});return}
  if(a==='kreopen'){var rc=contaById(b.dataset.id),fy=fechaDoVenc(rc,cur),ps=pagsDaFatura(rc,fy);if(!ps.length){toast('Nenhum pagamento para desfazer');return}
    dialog('Reabrir '+faturaNome(rc,fy)+'?',ps.map(function(l){return money(l.valor)+' em '+dShort(l.data)}).join(', ')+(ps.length>1?' voltam':' volta')+' a ficar pendente. O valor volta para o saldo da conta, e você pode marcar como pago de novo em Lançamentos.',[{t:'Reabrir',cls:'danger',v:true},{t:'Cancelar',cls:'ghost',v:false}],function(ok){
      if(!ok)return;ps.forEach(function(l){l.pend=true});save();renderCards();toast('Fatura reaberta')});return}
  if(a==='kpay'){var c=contaById(b.dataset.id);openSheet(null,'t',{para:c.id,desc:'Pagamento da fatura',fat:fechaDoVenc(c,cur)});return}
  if(a==='tgk')openK[b.dataset.id]=!openK[b.dataset.id];
  else if(a==='kedit'){kEdit=!kEdit;renderHeader()}
  else if(a==='kadd'){S.contas.push({id:uid(),nome:'Novo cartão',tipo:'cartao',saldoIni:0});save();kEdit=true;renderCards();focusLast(vk,'[data-f=knome]');return}
  else if(a==='rmconta'){rmConta(Number(b.closest('[data-k]').dataset.k),renderCards);return}
  else return;
  renderCards();
});
vk.addEventListener('input',contaInput);

/* ---------- Orçamento: tetos, análise e edição de categorias ---------- */
function budgetTetos(){
  var a=agg(cur),isCur=cur===ymNow(),h='',dc=S.cats.filter(function(c){return c.tipo==='d'});
  var capT=dc.reduce(function(x,c){return x+catCap(c,cur)},0),hoje=mode==='hoje',t=todayISO(),dAgg=hoje?aggDay(t):{};
  if(hoje){
    var capD=0,spD=0,spNo=0;
    dc.forEach(function(c){c.subs.forEach(function(s){var g=dAgg[s.id]||0,dcap=dailyCap(s,cur);if(dcap==null)spNo+=g;else{capD+=dcap;spD+=g}})});
    var pD=pct(spD,capD);
    h+='<div class="card"><div class="ttl">Hoje · '+dLong(t)+'</div><div class="hero">'+ring(pD)+'<div class="kv"><div class="l">Gasto hoje</div><div class="v">'+money(spD)+'</div><div class="s">de '+money(capD)+' (tetos diários)</div>'+
      '<div class="l" style="margin-top:10px">Ainda posso gastar hoje</div><div class="v '+remCls(capD-spD)+'">'+money(capD-spD)+'</div></div></div>'+
      (spNo>0?'<div class="note">+ '+money(spNo)+' hoje em subcategorias sem teto diário</div>':'')+
      (capD===0?'<div class="note">Ative o teto diário nas subcategorias (Editar categorias e tetos) para acompanhar o dia.</div>':'')+'</div>';
  }
  /* "ainda posso gastar" desconta o gasto e o previsto (já comprometido) */
  var pT=pct(a.desp+a.despP,capT),remT=capT-a.desp-a.despP,left=isCur?daysIn(cur)-(+t.slice(8))+1:0;
  h+='<div class="card"><div class="ttl">Tetos do mês</div><div class="hero">'+ring(pT)+'<div class="kv"><div class="l">Gasto</div><div class="v">'+money(a.desp)+'</div>'+(a.despP?'<div class="s">+ '+money(a.despP)+' previsto</div>':'')+'<div class="s">de '+money(capT)+'</div>'+
    '<div class="l" style="margin-top:10px">Ainda posso gastar</div><div class="v '+remCls(remT)+'">'+money(remT)+'</div></div></div>'+

    (capT===0?'<div class="note">Toque em <b>Editar categorias e tetos</b> para definir quanto quer gastar em cada categoria.</div>':'')+'</div>';
  h+='<div class="card"><div class="ttl">Categorias · toque para abrir</div>';
  dc.forEach(function(c){
    var g,gp=0,tt,sub;
    if(hoje){var dg=0,dt=0;c.subs.forEach(function(s){if(s.diario){dg+=dAgg[s.id]||0;dt+=dailyCap(s,cur)}});
      if(dt>0){g=dg;tt=dt;sub='No mês: '+money(a.cat[c.id]||0)+' de '+money(catCap(c,cur))}
      else{g=a.cat[c.id]||0;gp=a.catP[c.id]||0;tt=catCap(c,cur);sub='Sem teto diário · valores do mês'}}
    else{g=a.cat[c.id]||0;gp=a.catP[c.id]||0;tt=catCap(c,cur);sub=GN[c.grupo]+' · '+c.subs.length+(c.subs.length===1?' subcategoria':' subcategorias')}
    var p=pctC(g+gp,tt),open=!!openCats[c.id],rest=tt-g-gp;
    h+='<div class="catrow'+(open?' open':'')+'"><button type="button" class="cathead" data-act="tgc" data-id="'+c.id+'" aria-expanded="'+open+'"><span class="ico" style="--cc:'+c.cor+'">'+esc(c.icon)+'</span><span class="t"><div class="n">'+esc(c.nome)+'</div><div class="s">'+money(g)+(gp?' + '+money(gp)+' prev.':'')+' de '+money(tt)+'</div></span>'+
      '<span class="r"><div class="v sm '+remCls(rest)+'">'+money(rest)+'</div><div class="s">restante</div></span>'+CHEV+'</button>'+bar2(pctC(g,tt),pctC(gp,tt),st(p))+
      '';
    if(open)c.subs.forEach(function(s){
      var sg,sgp=0,stt,tag;
      if(hoje&&s.diario){sg=dAgg[s.id]||0;stt=dailyCap(s,cur);tag='hoje'}
      else{sg=a.sub[s.id]||0;sgp=a.subP[s.id]||0;stt=capFor(s,cur);tag=MODO_TXT[s.modo]||s.modo}
      var sp=pctC(sg+sgp,stt);
      h+='<div class="subrow"><div class="row sp"><span class="n2">'+esc(s.nome)+(s.modo!=='teto'?'<span class="pill">recorrente</span>':'')+'</span><b class="'+remCls(stt-sg-sgp)+'">'+(stt>0?(stt-sg-sgp>=0?'restam ':'passa ')+money(Math.abs(stt-sg-sgp)):'sem teto')+'</b></div>'+bar2(pctC(sg,stt),pctC(sgp,stt),st(sp))+
        '<div class="s">'+money(sg+sgp)+' de '+money(stt)+'</div></div>';
    });
    if(open)h+='<button type="button" class="btn ghost sm" data-act="e1" data-id="'+c.id+'" style="margin-top:8px">✎ Editar '+esc(c.nome)+'</button>';
    h+='</div>';
  });
  return h+'</div>';
}
function shortMoney(n){var a=Math.abs(n),s=a>=1e6?(a/1e6).toFixed(1).replace('.',',')+' mi':a>=1000?(a/1000).toFixed(a>=1e4?0:1).replace('.',',')+' mil':String(Math.round(a));return(n<0?'-':'')+s}
function scName(sc){
  if(sc==='total')return'despesas';
  if(sc.charAt(0)==='c'){var c=catById(sc.slice(2));return c?c.nome:'despesas'}
  var x=subIdx[sc.slice(2)];return x?x.c.nome+' › '+x.s.nome:'despesas';
}
/* gráfico de barras em SVG, sem bibliotecas. items: [{lab, vals:[{v,col}], cap, hi}] */
function barChart(items,act){
  var W=340,H=200,T=24,B=26,n=items.length,ns=items[0].vals.length,max=1;
  items.forEach(function(it){it.vals.forEach(function(x){max=Math.max(max,x.v)});if(it.cap)max=Math.max(max,it.cap)});
  max*=1.12;
  var slot=W/n,gw=slot*(ns>1?0.72:0.56),bw=(gw-(ns-1)*3)/ns,ph=H-T-B,y=function(v){return T+ph*(1-v/max)};
  var s='<svg viewBox="0 0 '+W+' '+H+'" class="chart" role="img" aria-label="Gráfico de barras por mês"><line x1="0" y1="'+(H-B)+'" x2="'+W+'" y2="'+(H-B)+'" stroke="#2c313c"/>';
  items.forEach(function(it,i){
    var x0=slot*i+(slot-gw)/2;
    s+='<g'+(act?' data-act="'+act+'" data-i="'+i+'" style="cursor:pointer"':'')+'><rect x="'+(slot*i)+'" y="0" width="'+slot+'" height="'+H+'" fill="transparent"/>';
    it.vals.forEach(function(x,j){var yy=y(Math.max(0,x.v));s+='<rect x="'+(x0+j*(bw+3))+'" y="'+yy+'" width="'+bw+'" height="'+Math.max(0,H-B-yy)+'" rx="4" style="fill:'+x.col+(it.hi?'':';opacity:.55')+'"/>'});
    if(it.cap)s+='<line x1="'+(x0-3)+'" x2="'+(x0+gw+3)+'" y1="'+y(it.cap)+'" y2="'+y(it.cap)+'" stroke="#eef1f6" stroke-width="2" stroke-dasharray="4 3"/>';
    if(ns===1&&(n<=6||it.hi)&&it.vals[0].v>0)s+='<text x="'+(x0+gw/2)+'" y="'+(Math.min(y(it.vals[0].v),it.cap?y(it.cap):H)-7)+'" text-anchor="middle" font-size="11" fill="#eef1f6">'+shortMoney(it.vals[0].v)+'</text>';
    s+='<text x="'+(slot*i+slot/2)+'" y="'+(H-8)+'" text-anchor="middle" font-size="11" fill="'+(it.hi?'#eef1f6':'#9aa3b2')+'">'+esc(it.lab)+'</text></g>';
  });
  return s+'</svg>';
}
/* mensagem de tendência: compara com o mesmo período do mês anterior */
function trendMsg(name,a,b,prevYM,isCur,day){
  var per=isCur?' até o dia '+Math.min(day,daysIn(prevYM)):'',pm=ymLabel(prevYM).toLowerCase();
  if(b<=0&&a<=0)return{cls:'',txt:'Sem gastos com '+name+' neste mês nem em '+pm+'.'};
  if(b<=0)return{cls:'warn',icon:'⚠️',txt:'Em '+pm+per+' não houve gastos com '+name+'. Neste mês já são '+money(a)+'.'};
  var d=(a-b)/b*100,r=Math.round(Math.abs(d));
  if(d<=-5)return{cls:'ok',icon:'🎉',txt:'Parabéns! Você gastou '+r+'% menos com '+name+' do que em '+pm+per+' ('+money(b-a)+' a menos).'};
  if(d>=10)return{cls:d>=25?'bad':'warn',icon:'⚠️',txt:'Atenção: os gastos com '+name+' subiram '+r+'% em relação a '+pm+per+' ('+money(a-b)+' a mais).'};
  return{cls:'acc',icon:'👍',txt:'Gastos com '+name+' estáveis em relação a '+pm+per+' ('+(d>0?'+':'')+Math.round(d)+'%).'};
}
function dashHTML(){
  var isCur=cur===ymNow(),day=isCur?+todayISO().slice(8):null,prev=ymAdd(cur,-1),pday=day?Math.min(day,daysIn(prev)):null,h='';
  if(dSc!=='total'&&(dSc.charAt(0)==='c'?!catById(dSc.slice(2)):!subIdx[dSc.slice(2)]))dSc='total';
  var opts='<option value="total">Total de despesas</option>';
  S.cats.forEach(function(c){if(c.tipo!=='d')return;
    opts+='<optgroup label="'+esc(c.icon+' '+c.nome)+'"><option value="c:'+c.id+'">'+esc(c.nome)+' (categoria inteira)</option>'+c.subs.map(function(s){return'<option value="s:'+s.id+'">'+esc(s.nome)+'</option>'}).join('')+'</optgroup>'});
  h+='<label style="margin-top:8px">Ver gastos de<select id="dScope">'+opts.replace('value="'+dSc+'"','value="'+dSc+'" selected')+'</select></label>';
  h+='<div class="chips" style="margin-top:10px"><button class="chip'+(dN===6?' on':'')+'" data-dn="6">6 meses</button><button class="chip'+(dN===12?' on':'')+'" data-dn="12">12 meses</button></div>';
  var name=scName(dSc),a=spentScope(dSc,cur,day),b=spentScope(dSc,prev,pday),m=trendMsg(name,a,b,prev,isCur,day);
  h+='<div class="card"><div class="ttl">Tendência · '+esc(ymLabel(cur))+'</div><div class="trend '+m.cls+'">'+(m.icon?'<span class="tic">'+m.icon+'</span>':'')+'<span>'+esc(m.txt)+'</span></div>'+
    '<div class="grid2" style="margin-top:12px"><div><div class="l">'+esc(ymShort(cur))+(isCur?' (até hoje)':'')+'</div><div class="v sm">'+money(a)+'</div></div><div><div class="l">'+esc(ymShort(prev))+(isCur?' (até dia '+pday+')':'')+'</div><div class="v sm">'+money(b)+'</div></div></div></div>';
  /* não desenha teto em meses anteriores ao primeiro lançamento (antes de começar a usar o app) */
  var first=S.lanc.reduce(function(m,l){var y=l.data.slice(0,7);return!m||y<m?y:m},null)||ymNow(),items=[];
  for(var i=dN-1;i>=0;i--){var ym=ymAdd(cur,-i),v=spentScope(dSc,ym),cp=ym<first?0:capScope(dSc,ym);items.push({ym:ym,lab:MES3[+ym.slice(5,7)-1],cap:cp,hi:i===0,vals:[{v:v,col:cp>0&&v>cp?'var(--bad)':'var(--accent)'}]})}
  var sel=(dSel!=null&&items[dSel])?items[dSel]:items[items.length-1];
  h+='<div class="card"><div class="ttl">Gastos por mês · '+esc(name)+'</div>'+barChart(items,'dbar')+
    '<div class="row sp s"><span>- - - teto do mês</span><span>toque numa barra</span></div>'+
    '<div class="hl"><b>'+esc(ymLabel(sel.ym))+'</b>: '+money(sel.vals[0].v)+(sel.cap>0?' de '+money(sel.cap)+' ('+pctTxt(pct(sel.vals[0].v,sel.cap))+' do teto)':' · sem teto definido')+'</div></div>';
  if(dSc==='total'){
    var vs=[];
    S.cats.forEach(function(c){if(c.tipo!=='d')return;var sc='c:'+c.id,x=spentScope(sc,cur,day),y=spentScope(sc,prev,pday);if(x||y)vs.push({c:c,a:x,b:y,d:x-y})});
    var up=vs.filter(function(x){return x.d>0}).sort(function(p,q){return q.d-p.d}).slice(0,3),dn=vs.filter(function(x){return x.d<0}).sort(function(p,q){return p.d-q.d}).slice(0,3);
    var row=function(x){var pp=x.b>0?Math.round(Math.abs(x.d)/x.b*100)+'%':money(Math.abs(x.d));return simpleRow(x.c.icon,x.c.cor,x.c.nome,money(x.b)+' → '+money(x.a),(x.d>0?'▲ ':'▼ ')+pp,x.d>0?'bad':'ok')};
    h+='<div class="card"><div class="ttl">O que mais mudou'+(isCur?' · mesmo período':'')+'</div>'+
      (dn.length?'<div class="lbl" style="margin-top:0">Economizou 🎉</div>'+dn.map(row).join(''):'')+
      (up.length?'<div class="lbl">Gastou mais ⚠️</div>'+up.map(row).join(''):'')+
      (!up.length&&!dn.length?'<div class="empty">Ainda não há gastos para comparar com '+esc(ymLabel(prev).toLowerCase())+'.</div>':'')+'</div>';
  }
  var ri=[];
  for(var j=dN-1;j>=0;j--){var ymm=ymAdd(cur,-j),ag=agg(ymm);ri.push({ym:ymm,lab:MES3[+ymm.slice(5,7)-1],hi:j===0,vals:[{v:ag.rec,col:'var(--ok)'},{v:ag.desp,col:'var(--accent)'}]})}
  h+='<div class="card"><div class="ttl">Receitas x despesas</div>'+barChart(ri,'')+'<div class="row s" style="gap:16px"><span><i class="dot" style="background:var(--ok)"></i>Receitas</span><span><i class="dot" style="background:var(--accent)"></i>Despesas</span></div></div>';
  var R=S.config.rule,rows='';
  for(var k=0;k<Math.min(dN,6);k++){
    var y2=ymAdd(cur,-k),g=agg(y2);
    if(!(g.rec>0)){rows+='<div class="rrow"><span class="rm">'+esc(ymShort(y2))+'</span><span class="s">sem receitas lançadas</span></div>';continue}
    var pill=function(key){var p=Math.round(g.g[key]/g.rec*100),lim=R[key],c=key==='p'?(p>=lim?'ok':'acc'):(p>lim?'bad':p>=lim*0.9?'warn':'ok');return'<span class="rp '+c+'">'+GN[key].charAt(0)+' '+p+'%</span>'};
    rows+='<div class="rrow"><span class="rm">'+esc(ymShort(y2))+'</span>'+pill('n')+pill('d')+pill('p')+'</div>';
  }
  h+='<div class="card"><div class="ttl">Regra '+R.n+'/'+R.d+'/'+R.p+' por mês</div>'+rows+'<div class="note">N = Necessidades (limite '+R.n+'%) · D = Desejos (limite '+R.d+'%) · P = Poupança (meta '+R.p+'%)</div></div>';
  return h;
}
function catEditor(c,ci){
  var ag=c.tipo==='d'?agg(cur):null;
  var ys=ymShort(cur),h='<div class="card scat" data-c="'+ci+'" style="--cc:'+c.cor+'"><div class="row"><button type="button" class="ico" data-act="pick" style="--cc:'+c.cor+'" aria-label="Escolher ícone e cor">'+esc(c.icon)+'</button><textarea data-f="cnome" rows="1" maxlength="30" enterkeyhint="done" aria-label="Nome da categoria">'+esc(c.nome)+'</textarea><button type="button" class="x" data-act="rmcat" aria-label="Excluir categoria">✕</button></div>';
  /* a parte da regra vem do agrupamento; trocar de parte fica na visão 50/30/20 ("Mover esta categoria para") */
  h+='<div class="subttl">Subcategorias de '+esc(c.nome)+'</div>';
  c.subs.forEach(function(s,si){
    /* linha principal: nome e teto lado a lado */
    /* cada subcategoria: teto (receita: valor) e Recorrente sim/não; recorrente lança todo mês como pendente */
    var isD=c.tipo==='d',rc=s.modo!=='teto',base=baseFor(s,cur),fr=rc?fixoRec(s):null;
    h+='<div class="ssub" data-s="'+si+'"><div class="row"><textarea data-f="snome" rows="1" maxlength="30" enterkeyhint="done" aria-label="Nome da subcategoria">'+esc(s.nome)+'</textarea>'+
      (isD||rc?'<span class="capw"><span class="cur">'+(isD?'Teto':'Valor')+' '+esc(curSym())+'</span><input data-f="base" class="capin" inputmode="decimal" value="'+showNum(base||null)+'" placeholder="0,00" aria-label="'+(isD?'Teto':'Valor')+' de '+esc(s.nome)+'"></span>':'')+
      '<button type="button" class="x" data-act="rmsub" aria-label="Excluir subcategoria">✕</button></div>';
    h+='<label class="sw" style="margin-top:10px"><input type="checkbox" data-f="rec"'+(rc?' checked':'')+'> Recorrente <span class="s">('+(isD?'lança todo mês':'entra todo mês')+')</span></label>';
    if(rc){
      var dDia=fr?fr.dia:(s.dia||10),dCta=fr?fr.conta:(s.cta||null);
      h+='<div class="grid2 recg"><label>'+(isD?'Vence no dia':'Cai no dia')+'<input data-f="adia" inputmode="numeric" value="'+dDia+'"></label><label>'+(isD?'Pago com':'Recebido em')+'<select data-f="aconta">'+contaOptsT(fixoContas(c.tipo),dCta)+'</select></label></div>';
      if(!fr)h+='<div class="s" style="margin:4px 2px 0">Informe o '+(isD?'teto':'valor')+' abaixo do nome para começar a lançar todo mês.</div>';
    }
    if(isD){var sg=(ag.sub[s.id]||0)+(ag.subP[s.id]||0);if(sg)h+='<div class="s" style="margin:8px 2px 0">Em '+ys+': '+money(sg)+(base>0?' de '+money(base):'')+'</div>'}
    h+='</div>';
  });
  h+='<button type="button" class="btn ghost" data-act="addsub">+ Subcategoria</button>';
  if(c.tipo==='d')h+='<div class="sum" data-total>Teto da categoria em '+ys+': <b>'+money(catCap(c,cur))+'</b></div>';
  return h+'</div>';
}
/* ---------- 50/30/20: planejado x realizado e o que compõe cada parte ---------- */
var openRg={},GCOR={n:'#60a5fa',d:'#f472b6',p:'#34d399'},GICO={n:'🏠',d:'🎉',p:'📈'};
/* separa o realizado (até hoje) do programado (data futura) no mês */
function realProg(ym){
  var r={cat:{},sub:{},apoR:0,apoP:0};
  S.lanc.forEach(function(l){
    if(mesOrc(l)!==ym)return;var fut=!isReal(l),k=fut?'p':'r';
    if(l.tipo==='d'){var x=subIdx[l.sub];if(!x)return;(r.cat[x.c.id]=r.cat[x.c.id]||{r:0,p:0})[k]+=l.valor;(r.sub[l.sub]=r.sub[l.sub]||{r:0,p:0})[k]+=l.valor}
    else if(l.tipo==='t'){var de=isInv(l.conta),pa=isInv(l.para),v=pa&&!de?l.valor:de&&!pa?-l.valor:0;if(v){if(fut)r.apoP+=v;else r.apoR+=v}}
  });
  return r;
}
function regraHTML(){
  var a=agg(cur),R=S.config.rule,rec=a.rec+a.recP,rp=realProg(cur),h='',pr=function(v){return rec>0?Math.round(v/rec*100)+'%':'—'};
  var plan={n:0,d:0,p:0},real={n:0,d:0,p:0},prog={n:0,d:0,p:0};
  S.cats.forEach(function(c){if(c.tipo!=='d')return;var x=rp.cat[c.id]||{r:0,p:0};plan[c.grupo]+=catCap(c,cur);real[c.grupo]+=x.r;prog[c.grupo]+=x.p});
  real.p+=rp.apoR;prog.p+=rp.apoP;
  var P=plan.n+plan.d+plan.p,livre=rec-P;
  h+='<div class="card"><div class="ttl">Planejamento de '+esc(ymLabel(cur).toLowerCase())+'</div>'+
    '<div class="grid2"><div><div class="l">Receita do mês</div><div class="v sm pos">'+money(rec)+'</div></div><div><div class="l">Planejado (tetos)</div><div class="v sm">'+money(P)+'</div><div class="s">'+pr(P)+' da receita</div></div></div>'+
    (rec>0?bar(pct(P,rec))+'<div class="row sp s"><span>'+(livre>=0?'Sem destino (ainda dá para planejar)':'Planejado acima da receita')+'</span><b class="'+(livre>=0?'ok':'bad')+'">'+money(Math.abs(livre))+'</b></div>'
      :'<div class="note">Lance a receita do mês (pode ser programada) para comparar o planejado com a regra.</div>')+'</div>';
  ['n','d','p'].forEach(function(g){
    var alvo=R[g]/100*rec,cats=S.cats.filter(function(c){return c.tipo==='d'&&c.grupo===g}),msg='';
    if(rec>0){
      /* poupança: vale o maior entre o planejado e o já aplicado/programado (sem somar os dois) */
      if(g==='p'){var cob=Math.max(plan.p,real.p+prog.p);msg=cob<alvo?'<div class="trend acc"><span class="tic">🎯</span><span>Para a meta de '+R.p+'%, faltam '+money(alvo-cob)+' em poupança ou investimentos.</span></div>':'<div class="trend ok"><span class="tic">🎉</span><span>Meta de poupança coberta.</span></div>'}
      else if(plan[g]>alvo)msg='<div class="trend warn"><span class="tic">⚠️</span><span>O planejado passa da regra em '+money(plan[g]-alvo)+'. Ajuste os tetos ou mova categorias.</span></div>';
      else if(real[g]+prog[g]>alvo)msg='<div class="trend bad"><span class="tic">⚠️</span><span>Os gastos já passam do limite de '+R[g]+'% em '+money(real[g]+prog[g]-alvo)+'.</span></div>';
    }
    h+='<div class="card gcard" style="--gc:'+GCOR[g]+'"><div class="row sp"><span class="gt">'+GICO[g]+' '+GN[g]+'</span><span class="pill" style="margin:0">regra '+R[g]+'%</span></div>'+
      '<div class="grid3 gm"><div><div class="l">Limite</div><div class="v sm">'+money(alvo)+'</div></div>'+
      '<div><div class="l">Planejado</div><div class="v sm">'+money(plan[g])+'</div></div>'+
      '<div><div class="l">Gasto</div><div class="v sm">'+money(real[g]+prog[g])+'</div></div></div>'+
      bar(alvo>0?(real[g]+prog[g])/alvo*100:0,g==='p'?'acc':null)+msg;
    /* gasto em subcategorias sem teto: avisa, para não parecer que sumiu */
    var semT=0;cats.forEach(function(c){c.subs.forEach(function(s){if(!(capFor(s,cur)>0)){var y=rp.sub[s.id];if(y)semT+=y.r+y.p}})});
    if(semT>0&&g!=='p')h+='<div class="note">'+money(semT)+' gastos em subcategorias sem teto. Defina os tetos em <b>Editar categorias e tetos</b> para planejar esta parte.</div>';
    cats.forEach(function(c){
      var x=rp.cat[c.id]||{r:0,p:0},t=catCap(c,cur),open=!!openRg[c.id],p=pctC(x.r+x.p,t);
      h+='<div class="catrow'+(open?' open':'')+'"><button type="button" class="cathead" data-act="rg" data-id="'+c.id+'"><span class="ico" style="--cc:'+c.cor+'">'+esc(c.icon)+'</span><span class="t"><div class="n">'+esc(c.nome)+'</div><div class="s">'+money(x.r+x.p)+' de '+money(t)+'</div></span>'+CHEV+'</button>'+bar(p);
      if(open){
        c.subs.forEach(function(s){var y=rp.sub[s.id]||{r:0,p:0},ts=capFor(s,cur),ps=pctC(y.r+y.p,ts);
          h+='<div class="subrow"><div class="row sp"><span class="n2">'+esc(s.nome)+'</span><span class="s">'+money(y.r+y.p)+' de '+money(ts)+'</span></div>'+bar(ps)+'</div>'});
        h+='<div class="lbl">Mover esta categoria para</div><div class="chips">'+['n','d','p'].map(function(k){return'<button type="button" class="chip'+(k===g?' on':'')+'" data-act="mvg" data-id="'+c.id+'" data-g="'+k+'" style="--cc:'+GCOR[k]+'">'+GICO[k]+' '+GN[k]+'</button>'}).join('')+'</div>';
        h+='<button type="button" class="btn ghost sm" data-act="e1" data-id="'+c.id+'" style="margin-top:8px">✎ Editar '+esc(c.nome)+'</button>';
      }
      h+='</div>';
    });
    if(g==='p'&&(rp.apoR||rp.apoP))h+='<div class="catrow"><div class="cathead"><span class="ico" style="--cc:#34d399">📈</span><span class="t"><div class="n">Aplicações em investimentos</div><div class="s">'+money(rp.apoR)+(rp.apoP?' + '+money(rp.apoP)+' prog.':'')+'</div></span></div></div>';
    if(!cats.length&&!(g==='p'&&(rp.apoR||rp.apoP)))h+='<div class="empty">Nenhuma categoria nesta parte. Abra uma categoria em outra parte e mova para cá.</div>';
    h+='</div>';
  });
  return h+'<div class="note" style="margin:10px 4px 0">Limite = parte da receita do mês pela regra. Planejado = soma dos tetos. Gasto inclui os pendentes do mês. Na Poupança, aplicações em investimentos também contam.</div>';
}
/* Orçamento numa aba só, organizado pela regra: cada parte (limite, planejado, gasto) com as suas categorias;
   tocar numa categoria abre as subcategorias, mover de parte e editar */
var bGrp='all';
/* categorias de receita à vista no Orçamento (antes só apareciam dentro de "Editar categorias e tetos"):
   quanto entrou em cada uma no mês, tocar abre a categoria para editar, e o botão cria uma nova */
function receitasCard(){
  var v={},vp={},sv={},svp={},tot=0,totP=0;
  S.lanc.forEach(function(l){if(l.tipo!=='r'||mesOrc(l)!==cur)return;if(isReal(l)){v[l.cat]=(v[l.cat]||0)+l.valor;sv[l.sub]=(sv[l.sub]||0)+l.valor;tot+=l.valor}else{vp[l.cat]=(vp[l.cat]||0)+l.valor;svp[l.sub]=(svp[l.sub]||0)+l.valor;totP+=l.valor}});
  var h='<div class="card"><div class="ttl">Receitas · categorias</div>';
  /* igual às partes da regra: tocar na categoria abre as subcategorias, com o botão de editar dentro */
  S.cats.forEach(function(c){if(c.tipo!=='r')return;var open=!!openCats[c.id],r=v[c.id]||0,p=vp[c.id]||0;
    h+='<div class="catrow'+(open?' open':'')+'"><button type="button" class="cathead" data-act="tgc" data-id="'+c.id+'" aria-expanded="'+open+'"><span class="ico" style="--cc:'+c.cor+'">'+esc(c.icon)+'</span><span class="t"><div class="n">'+esc(c.nome)+'</div><div class="s">'+(p?'+ '+money(p)+' a receber':c.subs.length+(c.subs.length===1?' subcategoria':' subcategorias'))+'</div></span>'+
      '<span class="r"><div class="v sm'+(r?' pos':'')+'">'+money(r)+'</div><div class="s">recebido</div></span>'+CHEV+'</button>';
    if(open){
      c.subs.forEach(function(sb){var a1=sv[sb.id]||0,p1=svp[sb.id]||0;
        h+='<div class="subrow"><div class="row sp"><span class="n2">'+esc(sb.nome)+(sb.modo!=='teto'?'<span class="pill">recorrente</span>':'')+'</span><b class="'+(a1?'pos':'')+'">'+money(a1)+'</b></div>'+
          (p1?'<div class="s">+ '+money(p1)+' a receber</div>':'')+'</div>'});
      h+='<button type="button" class="btn ghost sm" data-act="e1" data-id="'+c.id+'" style="margin-top:8px">✎ Editar '+esc(c.nome)+'</button>';
    }
    h+='</div>'});
  h+='<div class="row sp s" style="margin-top:8px"><span>Recebido em '+esc(ymShort(cur))+'</span><b>'+money(tot)+'</b></div>'+(totP?'<div class="row sp s"><span>A receber</span><b>'+money(totP)+'</b></div>':'')+
    '<div class="note">A receita do mês é a base da regra 50/30/20. Toque numa categoria para ver as subcategorias e editar (marcar como recorrente o salário, por exemplo).</div>'+
    '<button type="button" class="btn newg" data-act="addcatr">+ Nova categoria de receita</button></div>';
  return h;
}
function orcHTML(){
  var a=agg(cur),R=S.config.rule,rec=a.rec+a.recP,h='',dc=S.cats.filter(function(c){return c.tipo==='d'});
  h+='<div class="chips scroll" style="margin-top:4px">'+[['all','Tudo'],['r','Receitas'],['n','Necessidades'],['d','Desejos'],['p','Poupança']].map(function(f){return'<button type="button" class="chip'+(bGrp===f[0]?' on':'')+'" data-bg="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>';
  var capT=dc.reduce(function(x,c){return x+catCap(c,cur)},0),gastoT=a.desp+a.despP,remT=capT-gastoT,pT=pct(gastoT,capT);
  if(bGrp==='all')h+='<div class="card"><div class="ttl">Tetos de '+esc(ymLabel(cur).toLowerCase())+'</div>'+
    '<div class="row sp"><span class="l">Gasto</span><b>'+money(gastoT)+' <span class="s">de '+money(capT)+'</span></b></div>'+barP(bar2(pct(a.desp,capT),pct(a.despP,capT),st(pT)),pT)+
    '<div class="row sp"><span class="l">Ainda posso gastar</span><b class="'+remCls(remT)+'">'+money(remT)+'</b></div>'+
    (capT===0?'<div class="note">Toque em <b>Editar categorias e tetos</b> para definir quanto quer gastar em cada categoria.</div>':'')+
    (rec>0?'':'<div class="note">Lance a receita do mês para ver o limite de cada parte da regra.</div>')+'</div>';
  if(bGrp==='all'||bGrp==='r')h+=receitasCard();
  ['n','d','p'].forEach(function(g){
    if(bGrp!=='all'&&bGrp!==g)return;
    var cats=dc.filter(function(c){return(c.grupo||'d')===g}),alvo=R[g]/100*rec,plan=0;
    cats.forEach(function(c){plan+=catCap(c,cur)});
    var gasto=a.g[g]+a.gP[g],msg='';
    if(rec>0){
      if(g==='p'){var cob=Math.max(plan,gasto);msg=cob<alvo?'<div class="s" style="margin-top:6px">🎯 Faltam '+money(alvo-cob)+' para a meta de '+R.p+'%.</div>':'<div class="s ok" style="margin-top:6px">🎉 Meta de poupança coberta.</div>'}
      else if(gasto>alvo)msg='<div class="s bad" style="margin-top:6px">⚠️ Gastos passam '+money(gasto-alvo)+' do limite.</div>';
      else if(plan>alvo)msg='<div class="s warn" style="margin-top:6px">⚠️ Tetos passam '+money(plan-alvo)+' do limite. Reduza algum teto ou mova uma categoria.</div>';
    }
    var pg=rec>0&&alvo>0?gasto/alvo*100:null,cls=g==='p'?'acc':st(pg);
    h+='<div class="card gcard" style="--gc:'+GCOR[g]+'"><div class="row sp"><span class="gt">'+GICO[g]+' '+GN[g]+'</span><span class="pill" style="margin:0">regra '+R[g]+'%</span></div>'+
      '<div class="grid3 gm"><div><div class="l">'+(g==='p'?'Meta':'Limite')+'</div><div class="v sm">'+(rec>0?money(alvo):'—')+'</div></div>'+
      '<div><div class="l">Planejado</div><div class="v sm">'+money(plan)+'</div></div>'+
      '<div><div class="l">'+(g==='p'?'Guardado':'Gasto')+'</div><div class="v sm">'+money(gasto)+'</div></div></div>'+
      (rec>0?barP(bar2(alvo>0?a.g[g]/alvo*100:0,alvo>0?a.gP[g]/alvo*100:0,cls),pg):'')+msg;
    cats.forEach(function(c){
      var gc=a.cat[c.id]||0,gp=a.catP[c.id]||0,tt=catCap(c,cur),p=pctC(gc+gp,tt),open=!!openCats[c.id],rest=tt-gc-gp;
      h+='<div class="catrow'+(open?' open':'')+'"><button type="button" class="cathead" data-act="tgc" data-id="'+c.id+'" aria-expanded="'+open+'"><span class="ico" style="--cc:'+c.cor+'">'+esc(c.icon)+'</span><span class="t"><div class="n">'+esc(c.nome)+'</div><div class="s">'+money(gc+gp)+' de '+money(tt)+'</div></span>'+
        '<span class="r"><div class="v sm '+remCls(rest)+'">'+(tt>0?money(Math.abs(rest)):'—')+'</div><div class="s">'+(tt>0?(rest>=0?'restam':'passou'):'sem teto')+'</div></span>'+CHEV+'</button>'+barP(bar2(pctC(gc,tt),pctC(gp,tt),st(p)),p);
      if(open){
        c.subs.forEach(function(sb){
          var sg=a.sub[sb.id]||0,sgp=a.subP[sb.id]||0,stt=capFor(sb,cur),sp=pctC(sg+sgp,stt);
          h+='<div class="subrow"><div class="row sp"><span class="n2">'+esc(sb.nome)+(sb.modo!=='teto'?'<span class="pill">recorrente</span>':'')+'</span><b class="'+remCls(stt-sg-sgp)+'">'+(stt>0?(stt-sg-sgp>=0?'restam ':'passa ')+money(Math.abs(stt-sg-sgp)):'sem teto')+'</b></div>'+bar2(pctC(sg,stt),pctC(sgp,stt),st(sp))+
            '<div class="s">'+money(sg+sgp)+' de '+money(stt)+'</div></div>';
        });
        h+='<div class="lbl">Mover para</div><div class="chips">'+['n','d','p'].map(function(k){return'<button type="button" class="chip'+(k===g?' on':'')+'" data-act="mvg" data-id="'+c.id+'" data-g="'+k+'" style="--cc:'+GCOR[k]+'">'+GICO[k]+' '+GN[k]+'</button>'}).join('')+'</div>'+
          '<button type="button" class="btn ghost sm" data-act="e1" data-id="'+c.id+'" style="margin-top:8px">✎ Editar '+esc(c.nome)+'</button>';
      }
      h+='</div>';
    });
    if(g==='p'&&(a.apo||a.apoP))h+='<div class="catrow"><div class="cathead"><span class="ico" style="--cc:#34d399">📈</span><span class="t"><div class="n">Aplicações em investimentos</div><div class="s">'+money(a.apo+a.apoP)+'</div></span></div></div>';
    if(!cats.length&&!(g==='p'&&(a.apo||a.apoP)))h+='<div class="empty">Nenhuma categoria nesta parte.</div>';
    h+='</div>';
  });
  if(bGrp==='r')return h;
  return h+'<div class="note" style="margin:10px 4px 0">Limite = parte da receita do mês pela regra. Planejado = soma dos tetos. Gasto inclui os pendentes do mês (parte clara da barra). Na Poupança, aplicações em investimentos também contam.</div>';
}
function renderBudget(){
  if(bView==='regra')bView='tetos';
  var h='';
  var one=bOne?catById(bOne):null;if(bOne&&!one)bOne=null;
  if(bEdit&&one){
    var oi=S.cats.indexOf(one);
    h+='<button type="button" class="btn primary" data-act="bedit" style="margin-top:8px">Concluir</button>';
    if(one.tipo==='r')h+='<div class="note" style="margin:14px 4px 0"><b>Categoria de receita.</b> Dê um nome e crie as subcategorias (ex.: Salário, 13º, Freelance). <b>Recorrente</b>: lançada sozinha todo mês como pendente, no dia e na conta escolhidos.</div>';
    else h+='<div class="note" style="margin:14px 4px 0">Tetos a partir de <b>'+esc(ymLabel(cur))+'</b>. <b>Teto</b>: quanto pode gastar no mês. <b>Recorrente</b>: lançado sozinho todo mês como pendente; para mudar o valor de um mês, edite o lançamento daquele mês.</div>';
    if(one.tipo==='d')h+='<div class="sec">'+GICO[one.grupo||'d']+' '+GN[one.grupo||'d']+'</div>';
    h+=catEditor(one,oi);
    h+='<button type="button" class="btn ghost" data-act="ball">Editar todas as categorias</button>';
    h+='<button type="button" class="btn primary" data-act="bedit">Concluir</button>';
  }else if(bEdit){
    h+='<button type="button" class="btn primary" data-act="bedit" style="margin-top:8px">Concluir edição</button>';
    h+='<div class="note" style="margin:14px 4px 0">Tetos a partir de <b>'+esc(ymLabel(cur))+'</b>. <b>Teto</b>: quanto pode gastar no mês. <b>Recorrente</b>: lançado sozinho todo mês como pendente; para mudar o valor de um mês, edite o lançamento daquele mês.</div>';
    /* hierarquia: parte da regra → categorias → subcategorias */
    var Rg=S.config.rule,rec=agg(cur).rec;
    ['n','d','p'].forEach(function(g){
      var plan=0;S.cats.forEach(function(c){if(c.tipo==='d'&&(c.grupo||'d')===g)plan+=catCap(c,cur)});
      h+='<div class="card gcard" style="--gc:'+GCOR[g]+';margin-top:18px"><div class="row sp"><span class="gt">'+GICO[g]+' '+GN[g]+'</span><span class="pill" style="margin:0">regra '+Rg[g]+'%</span></div>'+
        '<div class="s">'+cap1(GDESC[g])+' · planejado <b>'+money(plan)+'</b>'+(rec>0?' de '+money(Rg[g]/100*rec)+' ('+Rg[g]+'% da receita de '+ymShort(cur)+')':'')+'</div>'+
        (rec>0&&g!=='p'&&plan>Rg[g]/100*rec+0.005?'<div class="s bad" style="margin-top:4px">⚠️ Passa '+money(plan-Rg[g]/100*rec)+' do limite da regra. Reduza algum teto desta parte.</div>':'')+'</div>';
      S.cats.forEach(function(c,ci){if(c.tipo==='d'&&(c.grupo||'d')===g)h+=catEditor(c,ci)});
      h+='<button type="button" class="btn newg" data-act="addcat" data-t="d" data-g="'+g+'">+ Categoria em '+GN[g]+'</button>';
    });
    h+='<div class="sec" id="recSec">💰 Receitas</div><div class="note" style="margin:0 4px 8px">Categorias usadas ao lançar uma receita pelo +.</div>';
    S.cats.forEach(function(c,ci){if(c.tipo==='r')h+=catEditor(c,ci)});
    h+='<button type="button" class="btn newg" data-act="addcat" data-t="r">+ Nova categoria de receita</button>';
    h+='<button type="button" class="btn primary" data-act="bedit">Concluir edição</button>';
  }else{
    h+='<div class="seg">'+[['tetos','Tetos e regra'],['analise','Análise']].map(function(v){return'<button type="button" data-bv="'+v[0]+'" class="'+(bView===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>';
    h+=bView==='tetos'?orcHTML()+'<button type="button" class="btn ghost" data-act="bedit">Editar categorias e tetos</button>':dashHTML();
  }
  $('#view-budget').innerHTML=h;chipsAtivo($('#view-budget'));$('#view-budget').querySelectorAll('textarea').forEach(autoAlt);
}
/* trava da regra no planejamento: se os tetos de Necessidades ou Desejos passam do limite, oferece ajustar este teto */
function checarTetoRegra(c,s,campo){
  var g=c.grupo||'d';if(g!=='n'&&g!=='d')return;var P=planoRegra(g,cur);if(P.lim==null||P.plan<=P.lim+0.005)return;
  var exc=P.plan-P.lim,atual=capFor(s,cur),novo=Math.max(0,Math.round((atual-exc)*100)/100);
  dialog('Os tetos de '+GN[g]+' passam do limite','Planejado em '+ymShort(cur)+': '+money(P.plan)+'. O limite da regra é '+money(P.lim)+' ('+S.config.rule[g]+'% da receita do mês), '+money(exc)+' a menos.'+(novo<atual?' Dá para ajustar '+s.nome+' para '+money(novo)+'.':''),
    (novo<atual?[{t:'Ajustar para '+money(novo),cls:'primary',v:true}]:[]).concat([{t:'Manter assim',cls:'ghost',v:false}]),function(ok){
      if(!ok)return;
      if(campo==='ov'&&s.modo!=='fixo')s.mes[cur]=novo;else setBase(s,cur,novo);
      if(fixoRec(s))syncFixo(s);save();renderBudget();toast(s.nome+' ajustado para '+money(novo));
    });
}
function updCatBox(box,c){
  var tt=box.querySelector('[data-total]');if(tt)tt.innerHTML='Teto da categoria em '+ymShort(cur)+': <b>'+money(catCap(c,cur))+'</b>';
  box.querySelectorAll('.ssub').forEach(function(sb){var s=c.subs[Number(sb.dataset.s)],hi=sb.querySelector('[data-hint]');if(s&&hi)hi.textContent=s.diario?money(dailyCap(s,cur)):''});
}
var vb=$('#view-budget');
vb.addEventListener('input',function(e){
  var t=e.target,v,box=t.closest('.scat');if(!box)return;
  var c=S.cats[Number(box.dataset.c)],sb=t.closest('.ssub'),s=sb?c.subs[Number(sb.dataset.s)]:null,f=t.dataset.f;
  if(t.tagName==='TEXTAREA'){if(/\n/.test(t.value))t.value=t.value.replace(/\s*\n\s*/g,' ');autoAlt(t)}
  if(f==='cnome'){c.nome=t.value.trim()||'Categoria'}
  else if(f==='snome'&&s){s.nome=t.value.trim()||'Subcategoria'}
  else if(f==='base'&&s){v=parseNum(t.value);setBase(s,cur,isNaN(v)||v<0?0:v)}
  else if(f==='ov'&&s){v=parseNum(t.value);if(t.value.trim()===''||isNaN(v))delete s.mes[cur];else s.mes[cur]=Math.max(0,v)}
  else return;
  save();updCatBox(box,c);
});
/* nomes em campo de várias linhas: Enter só confirma (não quebra linha) */
vb.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='TEXTAREA'){e.preventDefault();e.target.blur()}});
vb.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='dScope'){dSc=t.value;dSel=null;renderBudget();return}
  var box=t.closest('.scat');if(!box)return;var c=S.cats[Number(box.dataset.c)],sb=t.closest('.ssub'),s=sb?c.subs[Number(sb.dataset.s)]:null;
  if(t.dataset.f==='grupo'){c.grupo=t.value;save()}
  else if(t.dataset.f==='diario'&&s){s.diario=t.checked;save();updCatBox(box,c)}
  else if(t.dataset.f==='rec'&&s){
    if(t.checked){s.modo='fixo';if(ligarFixo(c,s))toast(s.nome+': lançado todo mês como pendente');save();renderBudget()}
    else if(fixoRec(s)){t.checked=true;dialog('Parar de lançar "'+s.nome+'" todo mês?','Os meses pendentes ou futuros serão excluídos. O que já foi pago continua. O teto continua valendo.',[{t:'Parar',cls:'danger',v:true},{t:'Cancelar',cls:'ghost',v:false}],function(ok){if(ok){desligarFixo(s);s.modo='teto';save();toast('Não é mais recorrente')}renderBudget()})}
    else{s.modo='teto';save();renderBudget()}
    return;
  }
  /* Fixa: ao confirmar o valor, começa a lançar (ou atualiza os meses pendentes) */
  else if(t.dataset.f==='ov'&&s&&s.modo==='variavel'){if(fixoRec(s)){syncFixo(s);save();toast('Valor de '+ymShort(cur)+' atualizado')}}
  else if(t.dataset.f==='base'&&s&&s.modo!=='teto'){
    if(fixoRec(s)){var n=syncFixo(s);save();if(n)toast('Valor atualizado nos meses pendentes')}
    else if(ligarFixo(c,s)){save();renderBudget();toast(s.nome+': lançado todo mês como pendente')}
  }
  else if((t.dataset.f==='adia'||t.dataset.f==='aconta')&&s){
    var r=fixoRec(s);
    if(t.dataset.f==='adia'){var d=parseInt(t.value,10);if(!(d>=1&&d<=31)){t.value=r?r.dia:(s.dia||10);toast('O dia deve ser de 1 a 31');return}s.dia=d;if(r)r.dia=d}
    else{s.cta=t.value;if(r)r.conta=t.value}
    if(r){syncFixo(s);save();toast('Meses pendentes atualizados')}else{save();toast('Salvo. Informe o valor para começar a lançar')}
  }
  /* trava da regra no planejamento */
  if(t.dataset.f==='base'&&s&&c.tipo==='d'){var gC=c.grupo||'d',PC=planoRegra(gC,cur);if(gC!=='p'&&PC.lim!=null&&PC.plan>PC.lim+0.005)renderBudget()}
});
vb.addEventListener('click',function(e){
  var v=e.target.closest('[data-bv]');if(v){bView=v.dataset.bv;render();return}
  var bg=e.target.closest('[data-bg]');if(bg){bGrp=bg.dataset.bg;renderBudget();return}
  var dn=e.target.closest('[data-dn]');if(dn){dN=Number(dn.dataset.dn);dSel=null;renderBudget();return}
  var g=e.target.closest('[data-act=dbar]');if(g){dSel=Number(g.dataset.i);renderBudget();return}
  var b=e.target.closest('[data-act]');if(!b)return;
  var a=b.dataset.act,box=b.closest('.scat'),ci=box?Number(box.dataset.c):-1,c=box?S.cats[ci]:null,sb=b.closest('.ssub'),si=sb?Number(sb.dataset.s):-1,n;
  if(a==='bedit'){bEdit=!bEdit;bOne=null;$('#fab').hidden=bEdit;render();window.scrollTo(0,0);return}
  /* tocar numa categoria abre e fecha as subcategorias; o botão de dentro abre a edição só dela */
  if(a==='tgc'){openCats[b.dataset.id]=!openCats[b.dataset.id];renderBudget();return}
  if(a==='rg'){openRg[b.dataset.id]=!openRg[b.dataset.id];renderBudget();return}
  if(a==='addcatr'){var nr=mkCat('r','Nova categoria','🏷️',COLORS[S.cats.length%COLORS.length],null,[mkSub('Geral','teto')]);nr.subs[0].hist=[{from:cur,v:0}];
    S.cats.push(nr);reindex();save();bOne=nr.id;bEdit=true;$('#fab').hidden=true;render();window.scrollTo(0,0);focusLast(vb.querySelector('.scat'),'[data-f=cnome]');return}
  if(a==='e1'){bOne=b.dataset.id;bEdit=true;$('#fab').hidden=true;render();window.scrollTo(0,0);return}
  if(a==='ball'){bOne=null;renderBudget();window.scrollTo(0,0);return}
  if(a==='mvg'){var mc=catById(b.dataset.id);if(mc&&mc.grupo!==b.dataset.g){mc.grupo=b.dataset.g;save();renderBudget();toast(mc.nome+' agora está em '+GN[mc.grupo])}return}
  if(a==='pick'){openPicker('cat',ci);return}
  if(a==='modo'){var ms=c.subs[si],nm=b.dataset.m;if(ms.modo===nm)return;
    /* Só teto/Avulsa: para de lançar (pede confirmação se havia lançamentos) */
    if(nm==='teto'){
      if(fixoRec(ms)){dialog('Deixar "'+ms.nome+'" '+(c.tipo==='d'?'só como teto':'avulsa')+'?','Ele para de ser lançado todo mês: os meses pendentes ou futuros serão excluídos. O que já foi pago continua.',[{t:'Mudar',cls:'danger',v:true},{t:'Cancelar',cls:'ghost',v:false}],function(ok){if(ok){desligarFixo(ms);ms.modo='teto';save();toast('Não é mais lançado todo mês')}renderBudget()});return}
      ms.modo='teto';save();renderBudget();return}
    /* Fixo e Variável lançam todo mês; trocar entre eles mantém os lançamentos */
    ms.modo=nm;ms.diario=false;
    if(nm==='fixo'){var hj0=ymNow();Object.keys(ms.mes).forEach(function(k){if(k>=hj0)delete ms.mes[k]})}
    if(fixoRec(ms)){syncFixo(ms);toast(nm==='fixo'?'Agora é Fixo: mesmo valor todo mês':'Agora é Variável: dá para mudar o valor de um mês')}
    else if(ligarFixo(c,ms))toast(ms.nome+': lançado todo mês como pendente');
    save();renderBudget();return}
  if(a==='rmsub'){
    if(c.subs.length<=1){info('Não dá para excluir','A categoria precisa de pelo menos uma subcategoria. Se quiser, exclua a categoria inteira.');return}
    var s=c.subs[si];n=S.lanc.filter(function(l){return l.sub===s.id}).length;
    ask('Excluir "'+s.nome+'"?',n?'Os '+n+' lançamentos desta subcategoria também serão apagados.':'Essa ação não pode ser desfeita.','Excluir',function(){
      c.subs.splice(c.subs.indexOf(s),1);S.lanc=S.lanc.filter(function(l){return l.sub!==s.id});S.recs=S.recs.filter(function(r){return r.sub!==s.id});reindex();save();renderBudget();toast('Subcategoria excluída')});return;
  }
  if(a==='rmcat'){
    if(S.cats.filter(function(x){return x.tipo===c.tipo}).length<=1){info('Não dá para excluir','É preciso ter pelo menos uma categoria de '+(c.tipo==='d'?'despesa':'receita')+'.');return}
    n=S.lanc.filter(function(l){return l.cat===c.id}).length;
    ask('Excluir "'+c.nome+'"?','A categoria e suas subcategorias serão apagadas.'+(n?' Os '+n+' lançamentos dela também.':''),'Excluir',function(){
      S.cats.splice(S.cats.indexOf(c),1);S.lanc=S.lanc.filter(function(l){return l.cat!==c.id});S.recs=S.recs.filter(function(r){return r.cat!==c.id});reindex();save();renderBudget();toast('Categoria excluída')});return;
  }
  if(a==='addsub'){c.subs.push(mkSub('Nova subcategoria','teto'));c.subs[c.subs.length-1].hist=[{from:cur,v:0}];reindex();save();renderBudget();
    focusLast(vb.querySelector('.scat[data-c="'+ci+'"]'),'[data-f=snome]');return}
  if(a==='addcat'){var t=b.dataset.t,nc=mkCat(t,'Nova categoria','🏷️',COLORS[S.cats.length%COLORS.length],t==='d'?(b.dataset.g||'d'):null,[mkSub('Geral','teto')]);nc.subs[0].hist=[{from:cur,v:0}];
    S.cats.push(nc);reindex();save();renderBudget();focusLast(vb.querySelector('.scat[data-c="'+(S.cats.length-1)+'"]'),'[data-f=cnome]');return}
});

/* ---------- Fixos: subcategoria Fixa = mesmo valor todo mês, lançado sozinho como pendente ---------- */
function fixoRec(s){return S.recs.filter(function(r){return r.sub===s.id&&!r.fim})[0]}
function fixoContas(tipo){return tipo==='r'?['conta','carteira']:['conta','carteira','cartao']}
/* começa a lançar todo mês (a partir do mês na tela, sem repetir um mês que já tem lançamento dessa subcategoria) */
function ligarFixo(c,s){
  if(fixoRec(s))return true;var v=capFor(s,cur);if(!(v>0))return false;
  var ok=fixoContas(c.tipo),cs=contaById(s.cta),conta=(cs&&ok.indexOf(cs.tipo)>=0)?cs.id:(S.contas.filter(function(x){return x.tipo==='conta'||x.tipo==='carteira'})[0]||{}).id,ini=cur;
  S.lanc.forEach(function(l){if(l.sub===s.id&&l.rec){var y=ymAdd(l.data.slice(0,7),1);if(y>ini)ini=y}});
  if(S.lanc.some(function(l){return l.sub===s.id&&l.data.slice(0,7)===ini}))ini=ymAdd(ini,1);
  S.recs.push({id:uid(),tipo:c.tipo,valor:v,dia:s.dia||10,conta:conta,desc:s.nome,inicio:ini,fim:null,skip:{},cat:c.id,sub:s.id,auto:true,pend:true});
  ensureRecs();return true;
}
/* para de lançar: tira os meses pendentes ou futuros; o que já foi pago fica */
function desligarFixo(s){
  var r=fixoRec(s);if(!r)return;var hj=todayISO();
  S.lanc=S.lanc.filter(function(l){return!(l.rec===r.id&&(l.pend||(l.data>hj&&!l.pg)))});
  var rest=S.lanc.filter(function(l){return l.rec===r.id}).map(function(l){return l.data.slice(0,7)}).sort();
  r.fim=rest.length?rest[rest.length-1]:ymAdd(r.inicio,-1);
}
/* valor (de cada mês), dia, conta e nome acompanham a subcategoria nos meses pendentes ou futuros */
function syncFixo(s){
  var r=fixoRec(s);if(!r)return 0;var hj=todayISO(),card=(contaById(r.conta)||{}).tipo==='cartao',n=0;
  r.valor=capFor(s,ymNow());r.desc=s.nome;if(card)delete r.pend;else r.pend=true;
  S.lanc.forEach(function(l){
    if(l.rec!==r.id||!(l.pend||(l.data>hj&&!l.pg)))return;var ym=l.data.slice(0,7);
    if(!l.man)l.valor=capFor(s,ym);l.conta=r.conta;l.desc=s.nome;l.data=ym+'-'+pad(Math.min(r.dia,daysIn(ym)));
    if(card)delete l.pend;n++;
  });
  return n;
}
/* recorrências antigas ligadas a subcategoria viram subcategorias Fixas;
   Fixo antigo que era só teto (sem lançar) vira Variável com o mesmo teto */
function migrarFixos(){
  var ch=0,hj=ymNow();
  S.recs.forEach(function(r){if(r.fim||!r.sub||r.tipo==='t'||r.auto)return;var x=subIdx[r.sub];if(!x)return;
    r.auto=true;x.s.modo='fixo';if(Math.abs(capFor(x.s,hj)-r.valor)>0.005)setBase(x.s,r.inicio<hj?r.inicio:hj,r.valor);ch++});
  if(!S.config.m3){S.cats.forEach(function(c){c.subs.forEach(function(s){if(s.modo==='variavel'&&!fixoRec(s)){s.modo='teto';ch++}})});S.config.m3=true;ch++}
  S.cats.forEach(function(c){c.subs.forEach(function(s){if(s.modo==='fixo'&&capFor(s,hj)>0&&!fixoRec(s)){s.modo='teto';ch++}})});
  /* simplificação: Variável vira recorrente (se lançava) ou só teto; o valor de um mês agora se muda no próprio lançamento */
  if(!S.config.m4){S.cats.forEach(function(c){c.subs.forEach(function(s){if(s.modo==='variavel')s.modo=fixoRec(s)?'fixo':'teto';s.diario=false})});S.config.m4=true;ch++}
  /* recorrente sem valor e sem lançamentos (padrões de fábrica) começa desmarcado */
  if(!S.config.m6){S.cats.forEach(function(c){c.subs.forEach(function(s){s.modo=fixoRec(s)?'fixo':'teto'})});S.config.m6=true;ch++}
  if(!S.config.m5){S.cats.forEach(function(c){c.subs.forEach(function(s){if(s.modo==='fixo'&&!fixoRec(s)&&!(capFor(s,hj)>0))s.modo='teto'})});S.config.m5=true;ch++}
  return ch;
}
/* aporte mensal: transferência que se repete, cadastrada no próprio investimento */
function aporteRec(c){return S.recs.filter(function(r){return r.tipo==='t'&&r.para===c.id&&!r.fim})[0]}
var apmOpen={};
function aporteHTML(c){
  var ar=aporteRec(c),h='<div class="lbl">Aporte mensal</div>';
  if(!ar&&!apmOpen[c.id])return h+'<button type="button" class="btn newg sm" data-act="apnew" data-id="'+c.id+'">+ Aporte mensal</button>';
  return h+'<div data-apm="'+c.id+'"><div class="grid2"><label>Valor<input data-f="apv" inputmode="decimal" value="'+(ar?showNum(ar.valor):'')+'" placeholder="0"></label><label>Todo dia<input data-f="apd" inputmode="numeric" value="'+(ar?ar.dia:10)+'"></label></div>'+
    '<label>Sai da conta<select data-f="apc">'+contaOptsT(['conta','carteira'],ar?ar.conta:null)+'</select></label>'+
    '<div class="grid2" style="margin-top:8px"><button type="button" class="btn primary sm" data-act="apsave" data-id="'+c.id+'">Salvar</button>'+(ar?'<button type="button" class="btn danger sm" data-act="apstop" data-id="'+c.id+'">Parar</button>':'<button type="button" class="btn ghost sm" data-act="apcancel" data-id="'+c.id+'">Cancelar</button>')+'</div>'+
    '<div class="note">Cada mês aparece como pendente em Lançamentos até você marcar como feito.</div></div>';
}
function salvarAporte(c,box){
  var v=parseNum(box.querySelector('[data-f=apv]').value),d=parseInt(box.querySelector('[data-f=apd]').value,10),co=box.querySelector('[data-f=apc]').value;
  if(!(v>0)){toast('Informe o valor do aporte');return false}
  if(!(d>=1&&d<=31)){toast('O dia deve ser de 1 a 31');return false}
  v=Math.round(v*100)/100;var r=aporteRec(c),hj=todayISO();
  if(!r){S.recs.push({id:uid(),tipo:'t',valor:v,dia:d,conta:co,para:c.id,desc:'Aporte em '+c.nome,inicio:ymNow(),fim:null,skip:{},pend:true});ensureRecs();toast('Aporte mensal programado')}
  else{r.valor=v;r.dia=d;r.conta=co;S.lanc.forEach(function(l){if(l.rec!==r.id||!(l.pend||(l.data>hj&&!l.pg)))return;var ym=l.data.slice(0,7);l.valor=v;l.conta=co;l.data=ym+'-'+pad(Math.min(d,daysIn(ym)))});toast('Aporte mensal atualizado')}
  apmOpen[c.id]=false;save();return true;
}
function pararAporte(c){
  var r=aporteRec(c),hj=todayISO();if(!r)return;
  S.lanc=S.lanc.filter(function(l){return!(l.rec===r.id&&(l.pend||(l.data>hj&&!l.pg)))});
  var rest=S.lanc.filter(function(l){return l.rec===r.id}).map(function(l){return l.data.slice(0,7)}).sort();
  r.fim=rest.length?rest[rest.length-1]:ymAdd(r.inicio,-1);
}

/* ---------- Mais: contas, investimentos, recorrentes e ajustes ---------- */
function invDetail(c){
  var apl=c.saldoIni,rend=0;
  S.lanc.forEach(function(l){if(l.tipo==='t'){if(l.para===c.id)apl+=l.valor;if(l.conta===c.id)apl-=l.valor}else if(l.tipo==='a'&&l.conta===c.id)rend+=l.valor});
  var pr=apl>0?rend/apl*100:null;
  return'<div class="grid2" style="margin-top:10px"><div><div class="l">Aplicado</div><div class="v sm">'+money(apl)+'</div></div><div><div class="l">Rendimento</div><div class="v sm '+(rend<0?'neg':'pos')+'">'+(rend>0?'+ ':'')+money(rend)+'</div>'+(pr!=null?'<div class="s">'+(pr>0?'+':'')+pr.toFixed(1).replace('.',',')+'% sobre o aplicado</div>':'')+'</div></div>'+
    '<div class="grid2" style="margin-top:12px"><button type="button" class="btn primary sm" data-act="iapl" data-id="'+c.id+'">Aplicar</button><button type="button" class="btn ghost sm" data-act="ires" data-id="'+c.id+'">Resgatar</button></div>'+
    '<form class="upd row" data-id="'+c.id+'" style="margin-top:12px" autocomplete="off"><input inputmode="decimal" placeholder="Quanto vale hoje?" aria-label="Valor atual do investimento" style="margin:0"><button type="submit" class="chip" style="flex:0 0 auto">Atualizar valor</button></form>'+
    '<div class="note">Atualizar valor: informe quanto o investimento vale hoje; a diferença vira rendimento.</div>'+aporteHTML(c);
}
function moreEditRow(c,i){
  var tipos=['conta','carteira','invest'];
  return'<div class="ssub" data-k="'+i+'"><div class="row">'+iconBtn(c)+'<input data-f="knome" value="'+esc(c.nome)+'" maxlength="30" aria-label="Nome"><button type="button" class="x" data-act="rmconta" aria-label="Excluir">✕</button></div>'+
    '<div class="grid2"><label>Tipo<select data-f="ktipo">'+tipos.map(function(t){return'<option value="'+t+'"'+(c.tipo===t?' selected':'')+'>'+TIPO_CONTA[t]+'</option>'}).join('')+'</select></label>'+
    '<label>'+(c.tipo==='invest'?'Valor ao começar':'Saldo ao começar')+'<input data-f="kini" inputmode="decimal" value="'+showNum(c.saldoIni)+'" placeholder="0"></label></div>'+
    (c.tipo!=='invest'?'<form class="upd row" data-id="'+c.id+'" data-kind="ajuste" style="margin-top:8px" autocomplete="off"><input inputmode="decimal" placeholder="Saldo real hoje ('+money(saldoConta(c.id))+' no app)" aria-label="Saldo real de '+esc(c.nome)+' hoje" style="margin:0"><button type="submit" class="chip" style="flex:0 0 auto">Ajustar saldo</button></form>':'')+'</div>';
}
function updRule(){var R=S.config.rule,t=R.n+R.d+R.p,el=$('#ruleSum'),tt=$('#ruleTtl');if(tt)tt.textContent='Regra '+R.n+'/'+R.d+'/'+R.p;if(el)el.innerHTML='Total: <b class="'+(t===100?'ok':'warn')+'">'+t+'%</b>'+(t===100?'':' · o ideal é somar 100%')}
function renderMore(){
  var h='',contas=[],invs=[],tc=0,ti=0;
  S.contas.forEach(function(c,i){if(c.tipo==='conta'||c.tipo==='carteira')contas.push([c,i]);else if(c.tipo==='invest')invs.push([c,i])});
  /* contas e investimentos são gerenciados no Início; cartões em Cartões; categorias no Orçamento */
  var ativas=S.recs.filter(function(r){return!r.fim||r.fim>ymNow()});
  /* cada recorrência abre para editar tudo: valor, dia, conta, categoria e descrição */
  var recRow=function(r){
    var x=subIdx[r.sub],co=contaById(r.conta),pa=contaById(r.para),ico=r.tipo==='t'?'⇄':x?x.c.icon:'•',cor=r.tipo==='t'?'#9aa3b2':x?x.c.cor:'#888888',
      nome=r.desc||(r.tipo==='t'?'Transferência':x?x.s.nome:'?'),open=!!openRec[r.id],
      info=money(r.valor)+' · todo dia '+r.dia+' · '+(co?co.nome:'?')+(r.tipo==='t'&&pa?' → '+pa.nome:'')+(r.fim?' · até '+ymShort(r.fim):'');
    var h='<div class="krow'+(open?' open':'')+'" data-rec="'+r.id+'"><button type="button" class="khead" data-act="rtg"><span class="ico" style="--cc:'+cor+'">'+esc(ico)+'</span><span class="t"><div class="n">'+esc(nome)+'</div><div class="s">'+esc(info)+'</div></span>'+CHEV+'</button>';
    if(open){
      var tipos=r.tipo==='r'?['conta','carteira']:r.tipo==='d'?['conta','carteira','cartao']:['conta','carteira'];
      h+='<div class="grid2"><label>Valor<input data-f="rv" inputmode="decimal" value="'+showNum(r.valor)+'"></label><label>Dia do mês<input data-f="rd" inputmode="numeric" value="'+r.dia+'"></label></div>'+
        '<label>'+(r.tipo==='r'?'Recebido em':r.tipo==='t'?'Da conta':'Pago com')+'<select data-f="rc">'+contaOptsT(tipos,r.conta)+'</select></label>';
      if(r.tipo==='t')h+='<label>Para<select data-f="rp">'+contaOptsT(['conta','carteira','cartao','invest'],r.para)+'</select></label>';
      else h+='<label>Categoria<select data-f="rs">'+S.cats.filter(function(c){return c.tipo===r.tipo}).map(function(c){return'<optgroup label="'+esc(c.icon+' '+c.nome)+'">'+c.subs.map(function(s){return'<option value="'+s.id+'"'+(s.id===r.sub?' selected':'')+'>'+esc(s.nome)+'</option>'}).join('')+'</optgroup>'}).join('')+'</select></label>';
      h+='<label>Descrição<input data-f="rde" maxlength="60" value="'+esc(r.desc||'')+'" placeholder="ex.: aluguel, Netflix"></label>'+
        '<div class="note">As mudanças valem para os meses pendentes ou que ainda não chegaram. O que já foi pago não muda.</div>'+
        '<div class="grid2" style="margin-top:10px"><button type="button" class="btn primary sm" data-act="rsave">Salvar</button><button type="button" class="btn danger sm" data-act="rend">Encerrar</button></div>';
    }
    return h+'</div>';
  };
  /* só consulta: cada fixo é editado onde nasce (subcategoria Fixa no Orçamento; aporte no investimento) */
  var fxRow=function(r){
    var x=subIdx[r.sub],co=contaById(r.conta),pa=contaById(r.para),ico=r.tipo==='t'?'📈':x?x.c.icon:'•',cor=r.tipo==='t'?'#34d399':x?x.c.cor:'#888888',
      nome=r.tipo==='t'?(r.desc||'Aporte'):x?x.s.nome:(r.desc||'?'),onde=r.tipo==='t'?'investimento no Início':x?x.c.nome+' no Orçamento':'',
      info=(r.tipo==='r'?'+ ':'')+money(x&&r.tipo!=='t'?capFor(x.s,ymNow()):r.valor)+(x&&x.s.modo==='variavel'?' previsto':'')+' · todo dia '+r.dia+' · '+(co?co.nome:'?')+(r.tipo==='t'&&pa?' → '+pa.nome:'');
    return simpleRow(ico,cor,nome,esc(info)+'<br>Editar em: '+esc(onde),'','',r.tipo==='t'?'data-act="fxinv" data-id="'+r.para+'"':x?'data-act="fxcat" data-id="'+x.c.id+'"':'');
  };
  var lst=ativas.slice().sort(function(a,b){var o={r:0,d:1,t:2};return o[a.tipo]-o[b.tipo]||a.dia-b.dia});
  /* a lista de recorrentes saiu daqui: eles são cadastrados no Orçamento (e o aporte, no investimento), e os pendentes aparecem em Lançamentos */
  var R=S.config.rule;
  h+='<div class="sec">Ajustes</div><div class="card"><div class="ttl" id="ruleTtl">Regra '+R.n+'/'+R.d+'/'+R.p+'</div><div class="note" style="margin:0 0 4px">Quanto da receita do mês cada grupo pode usar. A regra clássica é 50/30/20; ajuste como preferir.</div><div class="grid3">'+
    ['n','d','p'].map(function(g){return'<label>'+GN[g]+' %<input data-r="'+g+'" inputmode="numeric" value="'+R[g]+'"></label>'}).join('')+'</div><div class="sum" id="ruleSum"></div></div>';
  h+='<div class="card"><div class="ttl">Moeda</div><select id="sCur">'+CURRENCIES.map(function(x){return'<option'+(x===S.config.currency?' selected':'')+'>'+x+'</option>'}).join('')+'</select></div>';
  h+='<div class="card"><div class="ttl">Backup e exportação</div><div class="note" style="margin-top:0">Tudo fica salvo só neste aparelho, sem login e sem internet. Faça um backup de vez em quando.'+(S.config.lastBackup?' Último backup: '+dShort(S.config.lastBackup)+'.':'')+'</div>'+
    '<button type="button" class="btn ghost" data-act="exp">Exportar backup (.json)</button><button type="button" class="btn ghost" data-act="imp">Importar backup</button>'+
    '<button type="button" class="btn ghost" data-act="csv">Exportar planilha (.csv)</button><button type="button" class="btn danger" data-act="rst">Apagar todos os dados</button></div>';
  $('#view-more').innerHTML=h;updRule();
}
/* aplica a edição de uma recorrência no modelo e nos meses pendentes ou futuros */
function salvarRec(row){
  var r=S.recs.filter(function(x){return x.id===row.dataset.rec})[0];if(!r)return;
  var g=function(f){var el=row.querySelector('[data-f='+f+']');return el?el.value:null};
  var v=parseNum(g('rv')),d=parseInt(g('rd'),10);
  if(!(v>0)){toast('Informe um valor maior que zero');return}
  if(!(d>=1&&d<=31)){toast('O dia deve ser de 1 a 31');return}
  if(r.tipo==='t'&&g('rp')===g('rc')){toast('Escolha contas diferentes');return}
  r.valor=Math.round(v*100)/100;r.dia=d;r.conta=g('rc');r.desc=(g('rde')||'').trim().slice(0,60);
  if(r.tipo==='t')r.para=g('rp');else{var x=subIdx[g('rs')];if(x){r.sub=x.s.id;r.cat=x.c.id}}
  var card=(contaById(r.conta)||{}).tipo==='cartao';if(card)delete r.pend;else r.pend=true;
  var hj=todayISO(),n=0;
  S.lanc.forEach(function(l){
    if(l.rec!==r.id||!(l.pend||(l.data>hj&&!l.pg)))return;
    var ym=l.data.slice(0,7);l.valor=r.valor;l.conta=r.conta;l.desc=r.desc;l.data=ym+'-'+pad(Math.min(r.dia,daysIn(ym)));
    if(r.tipo==='t')l.para=r.para;else{l.cat=r.cat;l.sub=r.sub}
    if(card)delete l.pend;n++;
  });
  save();openRec[r.id]=false;renderMore();toast('Recorrência atualizada em '+n+(n===1?' mês':' meses'));
}
var vm=$('#view-more');
vm.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act;
  if(a==='pickc'){openPicker('conta',Number(b.closest('[data-k]').dataset.k));return}
  if(a==='iapl'){openSheet(null,'i',{para:b.dataset.id});return}
  if(a==='ires'){openSheet(null,'res',{conta:b.dataset.id});return}
  if(a==='exp'){fazerBackup();renderMore();return}
  if(a==='csv'){download('tetto-lancamentos-'+todayISO()+'.csv',toCSV(),'text/csv;charset=utf-8');toast('Planilha salva em Downloads');return}
  if(a==='imp'){$('#fileIn').click();return}
  if(a==='rst'){ask('Apagar todos os dados?','Todos os lançamentos, contas, cartões e categorias deste aparelho serão apagados. Isso não pode ser desfeito. Se quiser guardar, exporte um backup antes.','Apagar tudo',function(){
    S=defaults();reindex();save();cur=ymNow();render();toast('Dados apagados')});return}
  if(a==='rtg'){var id=b.closest('[data-rec]').dataset.rec;openRec[id]=!openRec[id];renderMore();return}
  if(a==='rnew'){preRep=true;$('#actsTitle').textContent='Nova recorrência: o que se repete?';$('#acts').classList.add('on');$('#backdrop').classList.add('on');history.pushState({sheet:1},'');return}
  if(a==='rsave'){salvarRec(b.closest('[data-rec]'));return}
  if(a==='fxcat'){bOne=b.dataset.id;bEdit=true;setTab('budget');return}
  if(a==='fxinv'){openK[b.dataset.id]=true;setTab('home');var ib=$('#view-home').querySelector('[data-act="tgk"][data-id="'+b.dataset.id+'"]');if(ib)ib.scrollIntoView({block:'start'});return}
  if(a==='rend'){
    var rid=b.closest('[data-rec]').dataset.rec,rr=S.recs.filter(function(x){return x.id===rid})[0],hj=todayISO();if(!rr)return;
    ask('Encerrar esta repetição?','Os lançamentos programados (de amanhã em diante) serão excluídos. Os que já aconteceram continuam.','Encerrar',function(){
      S.lanc=S.lanc.filter(function(l){return!(l.rec===rr.id&&l.data>hj)});
      rr.fim=S.lanc.some(function(l){return l.rec===rr.id&&l.data.slice(0,7)===ymNow()})?ymNow():ymAdd(ymNow(),-1);
      save();renderMore();toast('Repetição encerrada')});return;
  }
  if(a==='tgk')openK[b.dataset.id]=!openK[b.dataset.id];
  else if(a==='medit')mEdit=!mEdit;
  else if(a==='addconta'||a==='addinv'){S.contas.push({id:uid(),nome:a==='addinv'?'Novo investimento':'Nova conta',tipo:a==='addinv'?'invest':'conta',saldoIni:0});save();renderMore();focusLast(vm,'[data-f=knome]');return}
  else if(a==='rmconta'){rmConta(Number(b.closest('[data-k]').dataset.k),renderMore);return}
  else return;
  renderMore();
});
vm.addEventListener('input',function(e){
  var t=e.target;
  if(t.dataset.r){var v=parseInt(t.value,10);S.config.rule[t.dataset.r]=isNaN(v)?0:Math.max(0,Math.min(100,v));save();updRule();return}
  contaInput(e);
});
vm.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='sCur'){S.config.currency=t.value;save();renderMore();return}
});
vm.addEventListener('submit',function(e){
  e.preventDefault();var f=e.target.closest('form.upd');if(!f)return;
  var id=f.dataset.id,v=parseNum(f.querySelector('input').value);
  if(isNaN(v)||v<0){toast('Informe quanto o investimento vale hoje');return}
  var d=Math.round((v-saldoConta(id))*100)/100;
  if(Math.abs(d)<0.005){toast('O valor já está atualizado');return}
  S.lanc.push({id:uid(),ts:Date.now(),tipo:'a',valor:d,data:todayISO(),conta:id,desc:d>=0?'Rendimento':'Desvalorização'});
  save();renderMore();toast((d>=0?'Rendimento de ':'Variação de ')+money(d)+' registrado');
});
$('#fileIn').addEventListener('change',function(e){
  var f=e.target.files[0];e.target.value='';if(!f)return;
  var rd=new FileReader();rd.onload=function(){
    var d=null;try{d=clean(JSON.parse(rd.result))}catch(_){}
    if(!d){info('Arquivo inválido','Use um backup exportado pelo Tetto.');return}
    ask('Importar backup?','Os dados atuais deste aparelho serão substituídos pelos do arquivo.','Importar',function(){
      S=d;reindex();ensureRecs();save();render();toast('Backup importado')});
  };rd.readAsText(f);
});

/* ---------- Seletor de ícone e cor (categorias e contas) ---------- */
var pk=null;
function pkTarget(){return pk.kind==='cat'?S.cats[pk.i]:S.contas[pk.i]}
function renderPicker(){
  var t=pkTarget(),isCat=pk.kind==='cat',icon=isCat?t.icon:contaIcon(t),cor=isCat?t.cor:'var(--accent)';
  $('#pkIco').textContent=icon;$('#pkIco').style.setProperty('--cc',cor);$('#pkName').textContent=t.nome;
  $('#pkColorBox').hidden=!isCat;
  if(isCat)$('#pkColors').innerHTML=COLORS.map(function(c){return'<button type="button" class="colorb'+(c===t.cor?' on':'')+'" data-cor="'+c+'" style="background:'+c+'" aria-label="Cor '+c+'"></button>'}).join('');
  $('#pkGrid').innerHTML=ICONS.map(function(x){return'<button type="button" class="'+(x===icon?'on':'')+'" data-ic="'+x+'">'+x+'</button>'}).join('');
}
function openPicker(kind,i){
  pk={kind:kind,i:i};renderPicker();
  $('#picker').scrollTop=0;$('#picker').classList.add('on');$('#backdrop').classList.add('on');
  history.pushState({sheet:1},'');
}
function pickerChanged(){save();reindex();render()}
$('#pkGrid').addEventListener('click',function(e){var b=e.target.closest('[data-ic]');if(!b||!pk)return;pkTarget().icon=b.dataset.ic;pickerChanged();closeSheet()});
$('#pkColors').addEventListener('click',function(e){var b=e.target.closest('[data-cor]');if(!b||!pk)return;pkTarget().cor=b.dataset.cor;pickerChanged();renderPicker()});
$('#pkDone').addEventListener('click',function(){closeSheet()});

/* ---------- Lançamentos: menu de ações e formulários curtos ---------- */
/* cada ação mostra só os campos dela */
var MODES={
  d:{t:'d',title:'Nova despesa',from:['conta','carteira'],fromLbl:'Pago com',cat:true,rep:true,pg:true,ok:'Despesa salva'},
  r:{t:'r',title:'Nova receita',from:['conta','carteira'],fromLbl:'Recebido em',cat:true,rep:true,pg:true,ok:'Receita salva'},
  c:{t:'d',title:'Compra no cartão',from:['cartao'],fromLbl:'Cartão',cat:true,rep:true,parc:true,ok:'Compra lançada'},
  est:{t:'d',title:'Estorno no cartão',from:['cartao'],fromLbl:'Cartão',cat:true,ok:'Estorno lançado: volta como crédito na fatura'},
  i:{t:'t',title:'Investir',from:['conta','carteira'],fromLbl:'Sai da conta',to:['invest'],toLbl:'Investimento',rep:true,pg:true,ok:'Aplicação registrada'},
  res:{t:'t',title:'Resgatar investimento',from:['invest'],fromLbl:'Investimento',to:['conta','carteira'],toLbl:'Vai para a conta',ok:'Resgate registrado'},
  t:{t:'t',title:'Transferir ou pagar fatura',from:['conta','carteira'],fromLbl:'Da conta',to:['conta','carteira','cartao'],toLbl:'Para',rep:true,pg:true,ok:'Transferência salva'}
};
var fRef=null,fForce=false,fRec=false,fM='d',fT='d',fCat=null,fSub=null,editId=null,fPago=true,fPagoMan=false,fFat=null;
function modeOf(l){
  var co=contaById(l.conta),pa=contaById(l.para);
  if(l.tipo==='r')return'r';
  if(l.tipo==='d')return l.est?'est':co&&co.tipo==='cartao'?'c':'d';
  if(pa&&pa.tipo==='invest'&&!(co&&co.tipo==='invest'))return'i';
  if(co&&co.tipo==='invest')return'res';
  return't';
}
function contaOptsT(types,sel){
  var L=S.contas.filter(function(c){return types.indexOf(c.tipo)>=0}),keep=contaById(sel);
  if(keep&&L.indexOf(keep)<0)L.push(keep);
  if(!L.some(function(c){return c.id===sel}))sel=L.length?L[0].id:null;
  return L.map(function(c){return'<option value="'+c.id+'"'+(c.id===sel?' selected':'')+'>'+esc(contaIcon(c))+' '+esc(c.nome)+'</option>'}).join('');
}
function renderSheet(){
  var M=MODES[fM];fT=M.t;
  $('#sheetTitle').textContent=editId?'Editar · '+M.title.replace(/^Nova |^Novo /,'').toLowerCase():M.title;
  $('#fCatBox').hidden=!M.cat;$('#fParaL').hidden=!M.to;
  $('#fContaLbl').textContent=M.fromLbl;if(M.to)$('#fParaLbl').textContent=M.toLbl;
  $('#fConta').innerHTML=contaOptsT(M.from,$('#fConta').value);
  if(M.to)$('#fPara').innerHTML=contaOptsT(M.to,$('#fPara').value);
  var ed=editId?S.lanc.filter(function(x){return x.id===editId})[0]:null;
  $('#fParcL').hidden=!(M.parc&&!editId);
  $('#fParcInfo').hidden=!(ed&&(ed.pt>1||ed.rec));
  if(ed&&ed.pt>1)$('#fParcInfo').textContent='Parcela '+ed.pn+' de '+ed.pt+'. A alteração vale só para esta parcela. Para mudar o parcelamento, exclua a compra e lance de novo.';
  else if(ed&&ed.rec)$('#fParcInfo').textContent='Este lançamento se repete todo mês. Mudar o valor aqui vale só para este mês. Para mudar todos os meses, altere o teto da subcategoria no Orçamento.';
  /* recorrência só é criada a partir de Mais → Lançamentos recorrentes (um lugar só) */
  $('#fRepL').hidden=!fRec;$('#fRep').hidden=true;if(fRec){$('#fRep').value='1';$('#fParcL').hidden=true;$('#sheetTitle').textContent='Nova recorrência · '+M.title.replace(/^Nova |^Novo /,'').toLowerCase()}
  $('#fPagoBox').hidden=!M.pg;
  $('#fPago').querySelectorAll('button').forEach(function(b){b.classList.toggle('on',(b.dataset.pg==='1')===fPago)});
  $('#fPagar').hidden=!(ed&&ed.pend);
  $('#fEstornar').hidden=!(ed&&fM==='c');
  /* pagamento de cartão: escolher qual fatura está sendo paga */
  var pc=fT==='t'&&M.to?contaById($('#fPara').value):null,isFat=!!(pc&&pc.tipo==='cartao');
  $('#fFatL').hidden=!isFat;
  if(isFat){if(!fFat)fFat=fatPadrao(pc,editId);$('#fFat').innerHTML=fatOpts(pc,fFat,editId);updFatHint(pc)}
  updParcHint();updRepHint();updTeto();
  if(!M.cat)return;
  var cats=S.cats.filter(function(c){return c.tipo===fT&&!(fT==='d'&&c.grupo==='p')}),c=catById(fCat);
  if(!c||c.tipo!==fT){c=cats[0];fCat=c.id}
  if(!c.subs.some(function(s){return s.id===fSub}))fSub=c.subs[0].id;
  $('#fCats').innerHTML=cats.map(function(x){return'<button type="button" class="chip'+(x.id===fCat?' on':'')+'" data-c="'+x.id+'" style="--cc:'+x.cor+'">'+esc(x.icon)+' '+esc(x.nome)+'</button>'}).join('');
  $('#fSubs').innerHTML=c.subs.map(function(s){return'<button type="button" class="chip'+(s.id===fSub?' on':'')+'" data-s="'+s.id+'" style="--cc:'+c.cor+'">'+esc(s.nome)+'</button>'}).join('');
}
/* parcelamento: valor informado é o total da compra; mostra quanto fica cada parcela */
$('#fParc').innerHTML='<option value="1">À vista (1x)</option>'+Array.from({length:23},function(_,i){return'<option value="'+(i+2)+'">'+(i+2)+'x</option>'}).join('');
/* teto da subcategoria no mês do lançamento: quanto fica com este gasto e quanto ainda resta */
function updTeto(){
  var el=$('#fTeto'),x=fSub&&subIdx[fSub],d=$('#fData').value;
  if(fT!=='d'||fM==='est'||!x||!isISO(d)){el.hidden=true;return}
  var ym=mesOrc({tipo:'d',conta:$('#fConta').value,data:d}),cap=capFor(x.s,ym),a=agg(ym),ja=(a.sub[x.s.id]||0)+(a.subP[x.s.id]||0),v=parseNum($('#fAmount').value),n=(!$('#fParcL').hidden?Number($('#fParc').value)||1:1);
  if(editId){var o=S.lanc.filter(function(l){return l.id===editId})[0];if(o&&o.sub===x.s.id&&mesOrc(o)===ym)ja-=o.valor}
  v=v>0?v/n:0;
  var pvS=editId?0:prevRec(x.s.id,ym).reduce(function(t,l){return t+l.valor},0),abs=Math.min(v,pvS),com=ja+v-abs,rest=cap-com;el.hidden=false;
  if(!(cap>0)){el.innerHTML=esc(x.s.nome)+': sem teto definido'+(ja?' · '+money(ja)+' já em '+ymShort(ym):'');el.className='tetoln';return}
  el.className='tetoln';
  var noMes=ym!==d.slice(0,7)?' (fatura de '+MESES[+ym.slice(5,7)-1].toLowerCase()+')':'';
  el.innerHTML=esc(x.s.nome)+noMes+' · teto '+money(cap)+' · '+(v?'com este gasto':'já usado')+': '+money(com)+' · '+
    (rest>=0?'<b class="'+(com>=cap*0.8?'warn':'ok')+'">restam '+money(rest)+'</b>':'<b class="bad">passa '+money(-rest)+' do teto</b>')+
    (abs>0?'<div class="s" style="margin-top:4px">'+money(abs)+' sai do previsto recorrente de '+esc(x.s.nome)+', sem somar de novo.</div>':'');
}
function updParcHint(){
  var n=Number($('#fParc').value)||1,v=parseNum($('#fAmount').value),el=$('#fParcHint');
  el.textContent=(n>1&&v>0)?n+'x de '+money(v/n)+' · uma parcela em cada fatura, a partir desta':'';
}
$('#fParc').addEventListener('change',function(){if(Number($('#fParc').value)>1)$('#fRep').value='0';renderSheet()});
function updRepHint(){
  var d=$('#fData').value,el=$('#fRepHint');
  el.textContent=($('#fRep').value==='1'&&isISO(d))?'Lançado todo dia '+(+d.slice(8))+' (ou no último dia do mês), programado para os próximos 12 meses'+(MODES[fM].pg?'. Os próximos meses ficam pendentes até você marcar como pagos':'')+'. Para mudar ou encerrar: Mais → Lançamentos recorrentes.':'';
}
$('#fRep').addEventListener('change',updRepHint);
$('#fData').addEventListener('change',function(){if(!fPagoMan&&!editId){fPago=$('#fData').value<=todayISO();renderSheet()}else updRepHint()});
$('#fPago').addEventListener('click',function(e){var b=e.target.closest('[data-pg]');if(!b)return;fPago=b.dataset.pg==='1';fPagoMan=true;renderSheet()});
/* marcar como pago: se a data ainda não chegou, o pagamento fica com a data de hoje */
$('#fEstornar').addEventListener('click',function(){
  var l=S.lanc.filter(function(x){return x.id===editId})[0];if(!l)return;var x=subIdx[l.sub];
  editId=null;fM='est';fCat=l.cat;fSub=l.sub;fRef=l.id;
  $('#fConta').innerHTML=contaOptsT(['cartao'],l.conta);
  $('#fAmount').value=showNum(l.valor);
  $('#fDesc').value=('Estorno: '+(l.desc||(x?x.s.nome:'compra'))+(l.pt>1?' ('+l.pn+'/'+l.pt+')':'')).slice(0,60);
  $('#fData').value=todayISO();
  $('#fDel').hidden=true;renderSheet();$('#fAmount').focus();
  toast('Confira o valor devolvido e salve');
});
$('#fPagar').addEventListener('click',function(){var l=S.lanc.filter(function(x){return x.id===editId})[0];if(!l)return;delete l.pend;if(l.data>todayISO())l.pg=true;save();closeSheet();render();toast('Marcado como pago')});
$('#fAmount').addEventListener('input',function(){if(!$('#fParcL').hidden)updParcHint();updTeto()});
$('#fConta').addEventListener('change',function(){renderSheet()});
function updFatHint(c){var t=faturaTotal(c,fFat),f=faltaFat(c,fFat,editId);
  $('#fFatHint').textContent=t<=0?'Esta fatura não tem compras.':f<=0?'Esta fatura já está paga. O valor fica como crédito no cartão.':'Total '+money(t)+' · falta pagar '+money(f)}
/* ao trocar de fatura ou de cartão, sugere o valor que falta pagar */
function sugerirFat(){var c=contaById($('#fPara').value);if(!c||c.tipo!=='cartao'||editId)return;var f=faltaFat(c,fFat);$('#fAmount').value=f>0?showNum(f):''}
$('#fFat').addEventListener('change',function(){fFat=$('#fFat').value;renderSheet();sugerirFat()});
$('#fPara').addEventListener('change',function(){fFat=null;renderSheet();sugerirFat()});
/* mesma data N meses depois (dia 31 vira o último dia do mês, quando preciso) */
function addMonthsKeep(date,k){var ym=ymAdd(date.slice(0,7),k);return ym+'-'+pad(Math.min(+date.slice(8),daysIn(ym)))}
$('#fCats').addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(b){fCat=b.dataset.c;fSub=null;renderSheet()}});
$('#fSubs').addEventListener('click',function(e){var b=e.target.closest('[data-s]');if(b){fSub=b.dataset.s;renderSheet()}});
function openSheet(l,m,pre){
  pre=pre||{};editId=l?l.id:null;fM=l?modeOf(l):m;
  var M=MODES[fM],L=l?{}:(S.last[fM]||{});
  $('#curSym').textContent=curSym();
  $('#fAmount').value=l?showNum(Math.abs(l.valor)):(pre.valor>0?showNum(pre.valor):'');
  $('#fDesc').value=l?(l.desc||''):(pre.desc||'');
  $('#fData').value=l?l.data:todayISO();
  fCat=l?(l.cat||null):(L.cat||null);fSub=l?(l.sub||null):(L.sub||null);
  $('#fConta').innerHTML=contaOptsT(M.from,l?l.conta:(pre.conta||L.conta));
  $('#fPara').innerHTML=M.to?contaOptsT(M.to,l?l.para:(pre.para||L.para)):'';
  $('#fParc').value='1';$('#fRep').value='0';
  fPago=l?!l.pend:($('#fData').value<=todayISO());fPagoMan=false;
  fRec=!!(preRep&&M.rep&&!l);$('#fRep').value=fRec?'1':'0';preRep=false;
  fFat=l?(l.fat||null):(pre.fat||null);fRef=null;
  renderSheet();
  if(!l&&!(pre.valor>0))sugerirFat();
  $('#fDel').hidden=!l;
  var fromActs=$('#acts').classList.contains('on');$('#acts').classList.remove('on');
  $('#sheet').scrollTop=0;$('#sheet').classList.add('on');$('#backdrop').classList.add('on');
  if(fromActs)history.replaceState({sheet:1},'');else history.pushState({sheet:1},'');
  if(!l&&!(pre.valor>0))$('#fAmount').focus();
}
function hideSheet(){
  if($('#picker').classList.contains('on')&&$('#msheet').classList.contains('on')){$('#picker').classList.remove('on');pk=null;renderGerir();return}
  var eraM=$('#msheet').classList.contains('on');
  ['#sheet','#picker','#acts','#msheet','#backdrop'].forEach(function(s){$(s).classList.remove('on')});pk=null;if(document.activeElement)document.activeElement.blur();
  if(eraM)render();
}
function closeSheet(){if(history.state&&history.state.sheet)history.back();else hideSheet()}
/* botão Voltar do celular (como no Mobills): fecha o que estiver aberto, um nível por vez,
   e só sai do app quando já está no Início sem nada aberto.
   Ordem: aviso → janela de baixo (lançamento, menu +, contas, ícones) → modo de edição → aba → Início */
function sheetAberta(){return['#sheet','#picker','#acts','#msheet'].some(function(x){return $(x).classList.contains('on')})}
function emEdicao(){return bEdit||hEdit||kEdit||mEdit}
function precisaVoltar(){return tab!=='home'||emEdicao()||$('#dlg').classList.contains('on')}
/* deixa uma "página" no histórico enquanto houver para onde voltar dentro do app */
function syncVoltar(){var st=history.state||{};if(precisaVoltar()&&!st.g&&!st.sheet)history.pushState({g:1},'')}
/* depois de cada toque (abrir edição, trocar de aba...), confere se precisa da página de voltar */
document.addEventListener('click',function(){setTimeout(syncVoltar,0)});
window.addEventListener('popstate',function(){
  if($('#dlg').classList.contains('on')){if(dlgCb)dlgCb(-1);else $('#dlg').classList.remove('on');if(sheetAberta())history.pushState({sheet:1},'');else syncVoltar();return}
  if(sheetAberta()){hideSheet();return}
  if(emEdicao()){bEdit=false;bOne=null;hEdit=false;kEdit=false;mEdit=false;$('#fab').hidden=false;render();window.scrollTo(0,0);return}
  if(tab!=='home'){setTab('home');window.scrollTo(0,0);return}
});
$('#fab').addEventListener('click',function(){preRep=false;$('#actsTitle').textContent='O que você quer lançar?';$('#acts').classList.add('on');$('#backdrop').classList.add('on');history.pushState({sheet:1},'')});
$('#acts').addEventListener('click',function(e){
  var b=e.target.closest('[data-m]');if(!b)return;var m=b.dataset.m;
  var tem=function(tp){return S.contas.some(function(c){return c.tipo===tp})};
  if(m==='c'&&!tem('cartao')){closeSheet();setTab('cards');toast('Cadastre um cartão primeiro');return}
  if(m==='i'&&!tem('invest')){$('#acts').classList.remove('on');setTab('home');abrirGerir({replace:true,novoInv:true});toast('Dê um nome ao investimento e toque em Concluir');return}
  openSheet(null,m);
});
$('#backdrop').addEventListener('click',closeSheet);
$('#sheet').addEventListener('submit',function(e){
  e.preventDefault();
  var M=MODES[fM],amt=parseNum($('#fAmount').value);
  if(!(amt>0)){var a=$('.amt');a.classList.remove('shake');void a.offsetWidth;a.classList.add('shake');$('#fAmount').focus();toast('Informe o valor');return}
  var data=$('#fData').value;if(!isISO(data)){toast('Informe a data');return}
  if(!$('#fConta').value||(M.to&&!$('#fPara').value)){toast('Cadastre a conta antes');return}
  var o={tipo:fT,valor:Math.round(amt*100)/100,data:data,conta:$('#fConta').value,desc:$('#fDesc').value.trim().slice(0,60)};
  if(fM==='est'){o.valor=-o.valor;o.est=true;
    var oldE=editId?S.lanc.filter(function(x){return x.id===editId})[0]:null,refE=fRef||(oldE&&oldE.ref);if(refE)o.ref=refE}
  if(fT==='t'){o.para=$('#fPara').value;if(o.para===o.conta){toast('Escolha contas diferentes');return}
    if(!$('#fFatL').hidden&&/^\d{4}-\d{2}$/.test($('#fFat').value))o.fat=$('#fFat').value}
  else{o.cat=fCat;o.sub=fSub}
  if(M.pg&&!fPago)o.pend=true;else if(M.pg&&data>todayISO())o.pg=true;
  var was0=editId,np=(!editId&&!$('#fParcL').hidden)?(Number($('#fParc').value)||1):1;
  var rep=!editId&&fRec;
  /* trava da regra: gasto que faz Necessidades ou Desejos passar do limite do mês só entra se você confirmar */
  if(fT==='d'&&!fForce&&fM!=='est'){
    var xg=subIdx[o.sub],gg=xg&&xg.c.grupo,ym0=mesOrc(o),v0=np>1?Math.round(amt/np*100)/100:o.valor,pv0=editId?0:prevRec(o.sub,ym0).reduce(function(t,l){return t+l.valor},0),L0=gg?limiteRegra(gg,ym0,editId):null;
    v0=Math.max(0,v0-Math.min(v0,pv0));
    if(L0&&L0.usado+v0>L0.lim+0.005){
      dialog('Passa do limite de '+GN[gg],'Com este gasto, '+GN[gg]+' chega a '+money(L0.usado+v0)+' em '+ymShort(ym0)+' (já contando os previstos). O limite da regra é '+money(L0.lim)+', '+S.config.rule[gg]+'% da receita do mês: fica '+money(L0.usado+v0-L0.lim)+' acima.',
        [{t:'Cancelar',cls:'primary',v:false},{t:'Lançar mesmo assim',cls:'danger',v:true}],function(ok){if(ok){fForce=true;$('#sheet').requestSubmit()}});
      return;
    }
  }
  fForce=false;
  if(editId){var i=S.lanc.findIndex(function(x){return x.id===editId});if(i>=0){var old=S.lanc[i];o.id=editId;o.ts=old.ts;if(old.pt>1&&fT==='d'){o.grp=old.grp;o.pn=old.pn;o.pt=old.pt}if(old.rec){o.rec=old.rec;if(old.man||Math.abs(old.valor-o.valor)>0.005)o.man=true}S.lanc[i]=o}}
  else if(rep){
    /* recorrência: guarda o modelo e gera os meses (o primeiro é a data escolhida) */
    var r={id:uid(),tipo:fT,valor:o.valor,dia:+data.slice(8),conta:o.conta,desc:o.desc,inicio:data.slice(0,7),fim:null,skip:{}};
    if(fT==='t')r.para=o.para;else{r.cat=o.cat;r.sub=o.sub}
    if(M.pg)r.pend=true;
    S.recs.push(r);ensureRecs();
    /* o primeiro mês segue a situação escolhida no formulário */
    S.lanc.forEach(function(x){if(x.rec===r.id&&x.data.slice(0,7)===r.inicio){if(M.pg&&!fPago)x.pend=true;else delete x.pend}});
  }
  else if(np>1){
    /* compra parcelada: uma parcela por mês, a partir da data da compra; a última ajusta os centavos */
    var tot=Math.round(amt*100),base=Math.floor(tot/np),g=uid(),t0=Date.now();
    var abT=0;for(var k=0;k<np;k++){var pk={id:uid()+k,ts:t0+k,tipo:'d',valor:(k===np-1?tot-base*(np-1):base)/100,data:addMonthsKeep(data,k),conta:o.conta,desc:o.desc,cat:o.cat,sub:o.sub,grp:g,pn:k+1,pt:np};S.lanc.push(pk);abT+=absorver(pk)}
  }
  else{o.id=uid();o.ts=Date.now();S.lanc.push(o);var abT=absorver(o)}
  if(o.est&&!was0){var cE=contaById(o.conta),fyE=cicloDe(cE,o.data),xE=subIdx[o.sub];
    var msgE='Estorno: crédito na '+faturaNome(cE,fyE)+(xE?' · volta ao teto de '+xE.s.nome+' em '+ymShort(mesOrc(o)):'');}
  S.last[fM]={cat:o.cat,sub:o.sub,conta:o.conta,para:o.para};
  save();var was=editId;closeSheet();render();
  if(typeof msgE!=='undefined'&&msgE){toast(msgE);return}
  toast(was?'Lançamento atualizado':rep?'Programado todo mês a partir de '+ymShort(data.slice(0,7)):np>1?'Compra em '+np+'x de '+money(amt/np)+' lançada':M.ok+(data.slice(0,7)!==cur?' em '+ymShort(data.slice(0,7)):'')+(abT>0?' · '+money(abT)+' saiu do previsto':''));
});
$('#fDel').addEventListener('click',function(){
  var l=S.lanc.filter(function(x){return x.id===editId})[0];if(!l)return;
  var feito=function(msg){save();closeSheet();render();toast(msg)};
  if(l.pt>1&&l.grp){
    var gr=S.lanc.filter(function(x){return x.grp===l.grp}),fut=gr.filter(function(x){return x.pn>=l.pn}),op=[{t:'Só esta parcela ('+l.pn+'/'+l.pt+')',cls:'ghost',v:'one'}];
    if(fut.length>1)op.push({t:'Esta e as seguintes ('+fut.length+' parcelas)',cls:'ghost',v:'fut'});
    op.push({t:'A compra inteira ('+gr.length+' parcelas)',cls:'danger',v:'all'},{t:'Cancelar',cls:'ghost'});
    dialog('Excluir parcela','Esta é a parcela '+l.pn+' de '+l.pt+'. "Esta e as seguintes" serve para quando você quita a compra antes.',op,function(v){
      if(v==='all'){S.lanc=S.lanc.filter(function(x){return x.grp!==l.grp});feito('Compra parcelada excluída')}
      else if(v==='fut'){S.lanc=S.lanc.filter(function(x){return!(x.grp===l.grp&&x.pn>=l.pn)});feito(fut.length+' parcelas excluídas')}
      else{S.lanc=S.lanc.filter(function(x){return x.id!==l.id});feito('Parcela excluída')}
    });return;
  }
  if(l.rec){
    var r=S.recs.filter(function(x){return x.id===l.rec})[0],m=l.data.slice(0,7);
    dialog('Excluir lançamento recorrente','Este lançamento se repete todo mês.',[{t:'Só o de '+ymShort(m),cls:'ghost',v:'one'},{t:'Este e os meses seguintes',cls:'danger',v:'fut'},{t:'Cancelar',cls:'ghost'}],function(v){
      if(v==='fut'){if(r)r.fim=ymAdd(m,-1);S.lanc=S.lanc.filter(function(x){return!(x.rec===l.rec&&x.data.slice(0,7)>=m)});feito('Repetição encerrada a partir de '+ymShort(m))}
      else{if(r)r.skip[m]=true;S.lanc=S.lanc.filter(function(x){return x.id!==l.id});feito('Lançamento excluído')}
    });return;
  }
  ask('Excluir lançamento?','Essa ação não pode ser desfeita.','Excluir',function(){S.lanc=S.lanc.filter(function(x){return x.id!==l.id});feito('Lançamento excluído')});
});
document.addEventListener('click',function(e){
  var b=e.target.closest('button.ex');if(!b)return;
  var l=S.lanc.filter(function(x){return x.id===b.dataset.id})[0];if(!l)return;
  if(l.tipo==='a'){ask('Excluir esta atualização de valor?','Rendimento de '+money(l.valor)+' em '+dShort(l.data)+'.','Excluir',function(){S.lanc=S.lanc.filter(function(x){return x.id!==l.id});save();render();toast('Atualização excluída')});return}
  openSheet(l);
});

/* ---------- abas ---------- */
var TABS=['home','list','cards','budget','more'];
function setTab(t){
  if(t!=='cards')kEdit=false;if(t!=='home')hEdit=false;if(t!=='budget'){bEdit=false;bOne=null}
  tab=t;
  document.querySelectorAll('nav button').forEach(function(b){b.classList.toggle('on',b.dataset.tab===t)});
  TABS.forEach(function(x){$('#view-'+x).hidden=x!==t});
  $('#fab').hidden=t==='more'||(t==='budget'&&bEdit);
  render();window.scrollTo(0,0);
}
document.querySelectorAll('nav button').forEach(function(b){b.addEventListener('click',function(){setTab(b.dataset.tab)})});
function render(){
  renderHeader();
  if(tab==='home')renderHome();else if(tab==='list')renderList();else if(tab==='cards')renderCards();else if(tab==='budget')renderBudget();else renderMore();
  syncVoltar();
}

/* ao voltar para o app em outro dia/mês, atualiza o "hoje" e o mês atual */
var lastDay=todayISO();
document.addEventListener('visibilitychange',function(){if(!document.hidden&&todayISO()!==lastDay){if(cur===lastDay.slice(0,7))cur=ymNow();lastDay=todayISO();if(ensureRecs())save();render()}});

render();

if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  /* quando chega uma versão nova do app, recarrega uma vez para já mostrá-la */
  var hadCtrl=!!navigator.serviceWorker.controller,reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(hadCtrl&&!reloaded){reloaded=true;location.reload()}});
  navigator.serviceWorker.register('sw.js').catch(function(){});
}
})();
