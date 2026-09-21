
// ============================================================
// DADOS GLOBAIS
// ============================================================
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_NOME = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_LONGO = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

let SERVICOS = [
  {id:1,nome:'Corte de Cabelo',ico:'bi-scissors',dur:45,preco:60,cat:'corte',desc:'Cortes personalizados por profissionais experientes.'},
  {id:2,nome:'Manicure',ico:'bi-hand-index',dur:40,preco:35,cat:'manicure',desc:'Cuidado completo para suas unhas.'},
  {id:3,nome:'Pedicure',ico:'bi-hand-index-thumb',dur:50,preco:40,cat:'manicure',desc:'Tratamento completo para os pés.'},
  {id:4,nome:'Manicure + Pedicure',ico:'bi-stars',dur:90,preco:65,cat:'manicure',desc:'Combo completo mãos e pés.'},
  {id:5,nome:'Tratamento Capilar',ico:'bi-droplet',dur:60,preco:80,cat:'tratamento',desc:'Revitalização profunda dos fios.'},
  {id:6,nome:'Coloração',ico:'bi-palette',dur:120,preco:150,cat:'coloracao',desc:'Coloração e luzes profissionais.'},
  {id:7,nome:'Escova Progressiva',ico:'bi-wind',dur:180,preco:200,cat:'tratamento',desc:'Alisamento e progressiva.'},
  {id:8,nome:'Design de Sobrancelha',ico:'bi-eye',dur:20,preco:25,cat:'manicure',desc:'Modelagem e design preciso.'},
];

const PROFISSIONAIS = [
  {id:1,nome:'Carla Mendes',esp:'Cabelos & Coloração',ini:'CM'},
  {id:2,nome:'Juliana Ramos',esp:'Manicure & Pedicure',ini:'JR'},
  {id:3,nome:'Beatriz Costa',esp:'Tratamentos Capilares',ini:'BC'},
];

const OCUPADOS = {
  '1':{'2026-04-14':['09:00','10:00','14:30'],'2026-04-15':['08:00','11:00','15:00'],'2026-04-16':['09:30','13:00']},
  '2':{'2026-04-14':['08:30','10:30','14:00'],'2026-04-15':['09:00','11:30'],'2026-04-16':['10:00','15:30']},
  '3':{'2026-04-14':['09:00','11:00'],'2026-04-15':['08:30','14:00'],'2026-04-16':['13:00','14:00']},
};

const AGENDA_PROF = {
  'Carla Mendes':[
    {dia:1,h:'08:00',cli:'Ana Paula',serv:'Coloração',dur:120,tipo:'coloracao'},
    {dia:1,h:'11:00',cli:'Fernanda Lima',serv:'Corte de Cabelo',dur:45,tipo:'corte'},
    {dia:2,h:'09:00',cli:'Roberta Silva',serv:'Corte de Cabelo',dur:45,tipo:'corte'},
    {dia:2,h:'14:00',cli:'Letícia Matos',serv:'Escova Progressiva',dur:180,tipo:'tratamento'},
    {dia:3,h:'10:00',cli:'Camila Rocha',serv:'Coloração',dur:120,tipo:'coloracao'},
    {dia:4,h:'08:30',cli:'Priscila Dias',serv:'Corte de Cabelo',dur:45,tipo:'corte'},
    {dia:4,h:'13:00',cli:'Daniela Souza',serv:'Tratamento Capilar',dur:60,tipo:'tratamento'},
    {dia:5,h:'09:00',cli:'Viviane Nunes',serv:'Coloração',dur:120,tipo:'coloracao'},
    {dia:6,h:'10:00',cli:'Patrícia Alves',serv:'Corte de Cabelo',dur:45,tipo:'corte'},
  ],
  'Juliana Ramos':[
    {dia:1,h:'08:00',cli:'Marcia Freitas',serv:'Manicure + Pedicure',dur:90,tipo:'manicure'},
    {dia:1,h:'10:00',cli:'Sandra Lima',serv:'Manicure',dur:40,tipo:'manicure'},
    {dia:2,h:'08:30',cli:'Cláudia Melo',serv:'Pedicure',dur:50,tipo:'manicure'},
    {dia:3,h:'09:00',cli:'Jéssica Porto',serv:'Manicure + Pedicure',dur:90,tipo:'manicure'},
    {dia:4,h:'10:30',cli:'Natália Cruz',serv:'Manicure',dur:40,tipo:'manicure'},
    {dia:5,h:'08:00',cli:'Luana Barros',serv:'Pedicure',dur:50,tipo:'manicure'},
    {dia:6,h:'09:30',cli:'Tatiane Moura',serv:'Manicure + Pedicure',dur:90,tipo:'manicure'},
  ],
  'Beatriz Costa':[
    {dia:1,h:'09:00',cli:'Eliane Gomes',serv:'Tratamento Capilar',dur:60,tipo:'tratamento'},
    {dia:2,h:'09:30',cli:'Mônica Leal',serv:'Tratamento Capilar',dur:60,tipo:'tratamento'},
    {dia:3,h:'08:00',cli:'Adriana Faria',serv:'Escova Progressiva',dur:180,tipo:'tratamento'},
    {dia:4,h:'09:00',cli:'Simone Campos',serv:'Tratamento Capilar',dur:60,tipo:'tratamento'},
    {dia:5,h:'10:00',cli:'Juliana Felix',serv:'Tratamento Capilar',dur:60,tipo:'tratamento'},
    {dia:6,h:'08:30',cli:'Bruna Andrade',serv:'Escova Progressiva',dur:180,tipo:'tratamento'},
  ],
};

const HIST_CLIENTE = [
  {data:'08/04/2026',serv:'Coloração',prof:'Carla Mendes',hora:'09:00',preco:'R$ 150',status:'confirmado'},
  {data:'25/03/2026',serv:'Corte de Cabelo',prof:'Carla Mendes',hora:'14:30',preco:'R$ 60',status:'confirmado'},
  {data:'10/03/2026',serv:'Manicure + Pedicure',prof:'Juliana Ramos',hora:'10:00',preco:'R$ 65',status:'confirmado'},
  {data:'20/02/2026',serv:'Tratamento Capilar',prof:'Beatriz Costa',hora:'11:00',preco:'R$ 80',status:'cancelado'},
];

// ESTADO
let user = null;
let sel = {servico:null, prof:null, data:null, hora:null};
let calM = new Date().getMonth(), calA = new Date().getFullYear();
let semOff = 0;
let pagSel = null;
let editServId = null;
let delServId = null;
let icoSel = 'bi-scissors';
let nextServId = 9;

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  const raw = sessionStorage.getItem('una_user');
  if(!raw) { window.location.href='index.html'; return; }
  user = JSON.parse(raw);
  montarLayout();
});

function montarLayout() {
  // Sidebar
  const ini = user.nome.split(' ').map(p=>p[0]).join('').substring(0,2);
  document.getElementById('av-inicial').textContent = ini;
  document.getElementById('user-nome-sidebar').textContent = user.nome;
  document.getElementById('user-tipo-sidebar').textContent = user.tipo === 'cliente' ? 'Cliente' : 'Profissional';

  // Menu baseado em tipo
  const nav = document.getElementById('nav-menu');
  if(user.tipo === 'cliente') {
    nav.innerHTML = `
      <li class="ativo" data-sec="sec-agendar"><a onclick="irSec('sec-agendar',this)"><i class="bi bi-calendar-plus"></i> Agendar</a></li>
      <li data-sec="sec-meus"><a onclick="irSec('sec-meus',this)"><i class="bi bi-calendar-check"></i> Meus agendamentos</a></li>
      <li class="separador"></li>
      <li><a href="index.html"><i class="bi bi-house"></i> Home</a></li>
    `;
    irSec('sec-agendar');
    document.getElementById('ph-tag').textContent = 'Agendamento online';
    document.getElementById('ph-titulo').innerHTML = `Agende seu momento de <em>cuidado</em>`;
    document.getElementById('ph-sub').textContent = `Escolha o serviço, a profissional e o horário — tudo em poucos cliques`;
    renderServicosAg();
    renderCalendario();
  } else {
    nav.innerHTML = `
      <li class="ativo" data-sec="sec-agenda"><a onclick="irSec('sec-agenda',this)"><i class="bi bi-calendar3"></i> Minha agenda</a></li>
      <li data-sec="sec-servicos-gestao"><a onclick="irSec('sec-servicos-gestao',this)"><i class="bi bi-scissors"></i> Serviços</a></li>
      <li data-sec="sec-relatorios"><a onclick="irSec('sec-relatorios',this)"><i class="bi bi-bar-chart"></i> Relatórios</a></li>
      <li data-sec="sec-clientes-gestao"><a onclick="irSec('sec-clientes-gestao',this)"><i class="bi bi-people"></i> Clientes</a></li>
      <li class="separador"></li>
      <li><a href="index.html"><i class="bi bi-house"></i> Home</a></li>
    `;
    const profNome = user.nome.split(' ')[0];
    document.getElementById('ph-tag').textContent = 'Painel profissional';
    document.getElementById('ph-titulo').innerHTML = `Bem-vinda, <em>${profNome}</em>`;
    document.getElementById('ph-sub').textContent = `Gerencie sua agenda, serviços e métricas do salão`;
    document.getElementById('prof-saudacao').textContent = profNome;
    // Setar profissional no select se for a profissional logada
    const sel = document.getElementById('sel-prof-agenda');
    const match = Array.from(sel.options).findIndex(o=>o.text===user.nome);
    if(match>=0) sel.selectedIndex=match;
    irSec('sec-agenda');
    renderAgenda();
    renderServicosGestao();
    renderRelatorios();
    renderClientesGestao();
  }
}

function irSec(id, el) {
  document.querySelectorAll('.secao').forEach(s=>s.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
  document.querySelectorAll('#nav-menu li[data-sec]').forEach(li=>li.classList.remove('ativo'));
  const li = document.querySelector(`#nav-menu li[data-sec="${id}"]`);
  if(li) li.classList.add('ativo');
}

function sair() {
  sessionStorage.removeItem('una_user');
  window.location.href='index.html';
}

// ============================================================
// CLIENTE — AGENDAMENTO
// ============================================================
function renderServicosAg() {
  document.getElementById('grade-servs').innerHTML = SERVICOS.map(s=>`
    <div class="serv-card" id="sc-${s.id}" onclick="selServ(${s.id})">
      <div class="serv-ico"><i class="bi ${s.ico}"></i></div>
      <h4>${s.nome}</h4>
      <span class="dur"><i class="bi bi-clock" style="font-size:10px"></i> ${s.dur}min</span>
      <p class="preco">R$ ${s.preco}</p>
    </div>`).join('');
}

function selServ(id) {
  sel.servico = SERVICOS.find(s=>s.id===id);
  document.querySelectorAll('.serv-card').forEach(c=>c.classList.remove('sel'));
  document.getElementById('sc-'+id).classList.add('sel');
  document.getElementById('btn-n1').disabled=false;
}

function renderProfsAg() {
  document.getElementById('grade-profs-ag').innerHTML = PROFISSIONAIS.map(p=>`
    <div class="prof-card" id="pc-${p.id}" onclick="selProf(${p.id})">
      <div class="prof-av">${p.ini}</div>
      <div><h4>${p.nome}</h4><span>${p.esp}</span></div>
      <div class="online-dot"></div>
    </div>`).join('');
}

function selProf(id) {
  sel.prof = PROFISSIONAIS.find(p=>p.id===id);
  document.querySelectorAll('.prof-card').forEach(c=>c.classList.remove('sel'));
  document.getElementById('pc-'+id).classList.add('sel');
  document.getElementById('btn-n2').disabled=false;
}

// ETAPAS
function goEt(n) {
  ['et1','et2','et3','et4','et-suc'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('et'+n).style.display='block';
  for(let i=1;i<=4;i++){
    const s=document.getElementById('st'+i);
    s.className='step'+(i<n?' done':i===n?' ativo':'');
  }
  if(n===2) renderProfsAg();
  if(n===4) preencherResumo();
}

// CALENDÁRIO
function renderCalendario() {
  const box = document.getElementById('cal-box');
  const hoje = new Date();
  const primeiro = new Date(calA,calM,1).getDay();
  const total = new Date(calA,calM+1,0).getDate();
  let dias='';
  for(let i=0;i<primeiro;i++) dias+=`<div class="cdia vazio"></div>`;
  for(let d=1;d<=total;d++){
    const dt=`${calA}-${String(calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const obj=new Date(calA,calM,d);
    const pass=obj<new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate());
    const isHoje=d===hoje.getDate()&&calM===hoje.getMonth()&&calA===hoje.getFullYear();
    const isSel=sel.data===dt;
    const dom=obj.getDay()===0;
    let cls='cdia';
    if(pass||dom) cls+=' pass';
    else if(isSel) cls+=' sel';
    else cls+=' tem-vaga';
    if(isHoje&&!isSel) cls+=' hoje';
    dias+=`<div class="${cls}"${!pass&&!dom?` onclick="selData('${dt}',${d})"`:''} >${d}</div>`;
  }
  box.innerHTML=`
    <div class="cal-head">
      <button class="cal-nav-btn" onclick="mvM(-1)"><i class="bi bi-chevron-left"></i></button>
      <h3>${MESES[calM]} ${calA}</h3>
      <button class="cal-nav-btn" onclick="mvM(1)"><i class="bi bi-chevron-right"></i></button>
    </div>
    <div class="dsem"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
    <div class="cal-grade">${dias}</div>`;
}

function mvM(d){calM+=d;if(calM>11){calM=0;calA++;}if(calM<0){calM=11;calA--;}renderCalendario();}

function selData(dt, d) {
  sel.data=dt; sel.hora=null;
  document.getElementById('btn-n3').disabled=true;
  const [a,m,di]=dt.split('-');
  const obj=new Date(a,m-1,di);
  document.getElementById('data-txt-sel').textContent=`${DIAS_LONGO[obj.getDay()]}, ${di}/${m}/${a}`.toUpperCase();
  renderCalendario();
  renderHorarios(dt);
}

function renderHorarios(dt) {
  const profId = sel.prof ? String(sel.prof.id) : '1';
  const ocup = (OCUPADOS[profId]||{})[dt]||[];
  const todos=['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const manha=todos.filter(h=>h<'12:00'), tarde=todos.filter(h=>h>='12:00');
  function bloco(titulo,horas){
    return `<div>
      <p class="turno-label">${titulo}</p>
      <div class="grade-h">
        ${horas.map(h=>{
          const o=ocup.includes(h);
          return `<button class="hbtn${o?' ocup':''}" ${o?'disabled':''} ${!o?`onclick="selH('${h}',this)"`:''}>
            ${h}${o?'<i class="bi bi-x" style="font-size:9px;margin-left:3px"></i>':''}
          </button>`;
        }).join('')}
      </div>
    </div>`;
  }
  document.getElementById('turnos-box').innerHTML=bloco('☀ Manhã',manha)+bloco('🌤 Tarde',tarde);
}

function selH(h,btn){
  sel.hora=h;
  document.querySelectorAll('.hbtn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
  document.getElementById('btn-n3').disabled=false;
}

function preencherResumo(){
  const s=sel.servico,p=sel.prof;
  const [a,m,d]=sel.data.split('-');
  const obj=new Date(a,m-1,d);
  document.getElementById('r-serv').textContent=s?.nome||'—';
  document.getElementById('r-prof').textContent=p?.nome||'—';
  document.getElementById('r-data').textContent=`${DIAS_LONGO[obj.getDay()]}, ${d}/${m}/${a}`;
  document.getElementById('r-hora').textContent=sel.hora||'—';
  document.getElementById('r-dur').textContent=s?.dur+'min'||'—';
  document.getElementById('r-preco').textContent=s?.preco||'—';
  // Parcelas cartão
  const parc=document.getElementById('parcelas-sel');
  parc.innerHTML='';
  for(let i=1;i<=3;i++){
    const v=(s?.preco/i).toFixed(2).replace('.',',');
    parc.innerHTML+=`<option value="${i}">${i}x de R$ ${v}${i===1?' (sem juros)':''}</option>`;
  }
}

function selPag(tipo,el){
  pagSel=tipo;
  document.querySelectorAll('.metodo').forEach(m=>m.classList.remove('sel'));
  el.classList.add('sel');
  document.getElementById('pix-box').classList.toggle('visivel',tipo==='pix');
  const cartaoBox=document.getElementById('cartao-box');
  cartaoBox.classList.toggle('visivel',tipo==='credito'||tipo==='debito');
  document.getElementById('parcelas-wrap').style.display=tipo==='credito'?'block':'none';
}

function maskCard(inp){
  let v=inp.value.replace(/\D/g,'').substring(0,16);
  inp.value=v.replace(/(.{4})/g,'$1 ').trim();
}

function confirmar(){
  const nome=document.getElementById('c-nome').value.trim();
  if(!nome){notif('Por favor, informe seu nome.');return;}
  const [a,m,d]=sel.data.split('-');
  document.getElementById('suc-info').innerHTML=`<strong>${sel.servico.nome}</strong> com ${sel.prof.nome}<br>${d}/${m} às ${sel.hora}`;
  ['et1','et2','et3','et4'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('et-suc').style.display='block';
  notif('Agendamento confirmado com sucesso! ✓');
}

function novoAg(){
  sel={servico:null,prof:null,data:null,hora:null};
  pagSel=null;
  document.getElementById('et-suc').style.display='none';
  document.getElementById('et1').style.display='block';
  for(let i=1;i<=4;i++) document.getElementById('st'+i).className='step'+(i===1?' ativo':'');
  renderServicosAg();
  document.querySelectorAll('.hbtn').forEach(b=>{b.classList.remove('sel');});
}

// HISTÓRICO CLIENTE
function renderHist(){
  document.getElementById('hist-lista').innerHTML=HIST_CLIENTE.map(h=>{
    const [d,m]=h.data.split('/');
    const mNom=MESES[parseInt(m)-1].substring(0,3);
    return `<div class="hist-item">
      <div class="hist-data"><div class="hd">${d}</div><div class="hm">${mNom}</div></div>
      <div class="hist-div"></div>
      <div class="hist-info">
        <h4>${h.serv}</h4>
        <p>${h.prof} &bull; ${h.hora}</p>
      </div>
      <div class="hist-status hs-${h.status}">${h.status}</div>
      <div class="hist-preco">${h.preco}</div>
    </div>`;
  }).join('');
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(renderHist,100));

// ============================================================
// PROFISSIONAL — AGENDA
// ============================================================
let semOfsset=0;
function movSemana(d){if(d===0)semOfsset=0;else semOfsset+=d;renderAgenda();}

function renderAgenda(){
  const profNome=document.getElementById('sel-prof-agenda')?.value||'Carla Mendes';
  document.getElementById('prof-saudacao').textContent=profNome.split(' ')[0];
  const evs=AGENDA_PROF[profNome]||[];
  const hoje=new Date();
  const ini=new Date(hoje);
  ini.setDate(hoje.getDate()-hoje.getDay()+1+semOfsset*7);
  const dias=[];
  for(let i=0;i<6;i++){const d=new Date(ini);d.setDate(ini.getDate()+i);dias.push(d);}
  const nDias=['Seg','Ter','Qua','Qui','Sex','Sáb'];
  const hojei=dias.findIndex(d=>d.toDateString()===hoje.toDateString());

  // Header
  let hh='<div class="ag-col"></div>';
  dias.forEach((d,i)=>{
    hh+=`<div class="ag-col${i===hojei?' hoje-c':''}">
      <div class="dc">${d.getDate()}</div>
      <div class="dn">${nDias[i]}</div>
    </div>`;
  });
  document.getElementById('ag-header').innerHTML=hh;

  // Título semana
  const f=d=>`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('semana-titulo').textContent=`${f(dias[0])} — ${f(dias[5])} / ${dias[0].getFullYear()}`;

  // Corpo
  const horas=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
  let corpo='';
  horas.forEach(h=>{
    corpo+=`<div class="ag-h">${h}</div>`;
    for(let col=1;col<=6;col++){
      const evCol=evs.filter(e=>e.dia===col&&e.h===h);
      corpo+=`<div class="ag-slot">${evCol.map(e=>`
        <div class="ev ${e.tipo}" onclick='abrirEvento(${JSON.stringify(JSON.stringify(e))})'>
          <div class="eh">${e.h}</div>
          <div class="en">${e.cli}</div>
          <div class="es">${e.serv}</div>
        </div>`).join('')}</div>`;
    }
  });
  document.getElementById('ag-corpo').innerHTML=corpo;

  // Stats
  const PREC={corte:60,manicure:50,tratamento:80,coloracao:150};
  const fat=evs.reduce((a,e)=>a+(PREC[e.tipo]||60),0);
  const horas_t=Math.round(evs.reduce((a,e)=>a+e.dur,0)/60);
  const tipos={};evs.forEach(e=>tipos[e.tipo]=(tipos[e.tipo]||0)+1);
  const top=Object.entries(tipos).sort((a,b)=>b[1]-a[1])[0];
  const tNom={corte:'Cortes',manicure:'Manicure',tratamento:'Tratamentos',coloracao:'Colorações'};
  document.getElementById('stats-agenda').innerHTML=`
    <div class="stat-box"><div class="sn">${evs.length}</div><div class="sd">Agendamentos</div><div class="sd2">Na semana</div></div>
    <div class="stat-box"><div class="sn">R$ ${fat}</div><div class="sd">Faturamento estimado</div><div class="sd2">Semana atual</div></div>
    <div class="stat-box"><div class="sn">${horas_t}h</div><div class="sd">Horas agendadas</div><div class="sd2">${evs.length} atendimentos</div></div>
    <div class="stat-box"><div class="sn">${top?tipos[top[0]]:0}</div><div class="sd">Serviço mais popular</div><div class="sd2">${top?tNom[top[0]]:'—'}</div></div>`;
}

function abrirEvento(jsonStr){
  const e=JSON.parse(jsonStr);
  const dNomes={corte:'Corte de Cabelo',manicure:'Manicure / Pedicure',tratamento:'Tratamento Capilar',coloracao:'Coloração'};
  const corBg={corte:'rgba(201,169,110,0.12)',manicure:'rgba(192,57,43,0.08)',tratamento:'rgba(76,175,125,0.08)',coloracao:'rgba(142,68,173,0.07)'};
  const corTx={corte:'#6B4226',manicure:'#8B1A10',tratamento:'#1A5E35',coloracao:'#5B2C6F'};
  document.getElementById('modal-tipo-badge').innerHTML=`<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:500;background:${corBg[e.tipo]};color:${corTx[e.tipo]}">${dNomes[e.tipo]}</span>`;
  document.getElementById('modal-titulo').innerHTML=e.cli;
  const dNomes2=['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  document.getElementById('modal-body').innerHTML=`
    <strong style="color:var(--marrom)">Serviço:</strong> ${e.serv}<br>
    <strong style="color:var(--marrom)">Horário:</strong> ${e.h} &bull; ${dNomes2[e.dia]}-feira<br>
    <strong style="color:var(--marrom)">Duração:</strong> ${e.dur} minutos<br>
    <strong style="color:var(--marrom)">Profissional:</strong> ${document.getElementById('sel-prof-agenda').value}`;
  document.getElementById('modal-acoes').innerHTML=`
    <button class="btn-pri" onclick="window.open('https://wa.me/556984696874','_blank')"><i class="bi bi-whatsapp"></i> WhatsApp</button>
    <button class="btn-sec" onclick="fecharModal()">Fechar</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}

// ============================================================
// PROFISSIONAL — GESTÃO DE SERVIÇOS
// ============================================================
function renderServicosGestao(){
  const lista=document.getElementById('servicos-lista-gestao');
  const catNom={corte:'Corte / Cabelo',manicure:'Manicure / Pedicure',tratamento:'Tratamento Capilar',coloracao:'Coloração'};
  lista.innerHTML=SERVICOS.map(s=>`
    <div class="serv-row" id="sr-${s.id}">
      <div class="serv-row-ico"><i class="bi ${s.ico}"></i></div>
      <div class="serv-row-info">
        <h4>${s.nome}</h4>
        <div class="meta">
          <span class="cat-badge cat-${s.cat}">${catNom[s.cat]}</span>
          &nbsp; <i class="bi bi-clock" style="font-size:10px"></i> ${s.dur}min
        </div>
      </div>
      <div class="serv-row-preco">R$ ${s.preco}</div>
      <div class="serv-row-acoes">
        <button class="btn-ghost" onclick="editarServ(${s.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn-danger" onclick="pedirDel(${s.id})"><i class="bi bi-trash"></i></button>
      </div>
    </div>`).join('');
}

function selIco(el){
  document.querySelectorAll('.ico-opt').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');
  icoSel=el.dataset.ico;
}

function salvarServico(){
  const nome=document.getElementById('fs-nome').value.trim();
  const preco=parseFloat(document.getElementById('fs-preco').value);
  const dur=parseInt(document.getElementById('fs-dur').value);
  const cat=document.getElementById('fs-cat').value;
  const desc=document.getElementById('fs-desc').value.trim();
  if(!nome||!preco||!dur){notif('Preencha todos os campos obrigatórios.');return;}
  if(editServId){
    const idx=SERVICOS.findIndex(s=>s.id===editServId);
    SERVICOS[idx]={...SERVICOS[idx],nome,preco,dur,cat,ico:icoSel,desc};
    notif(`Serviço "${nome}" atualizado com sucesso!`);
    editServId=null;
    document.getElementById('form-serv-titulo').innerHTML='Novo <em>serviço</em>';
    document.getElementById('fs-btn-salvar').innerHTML='<i class="bi bi-plus-circle"></i> Adicionar serviço';
    document.getElementById('fs-btn-cancelar').style.display='none';
  } else {
    SERVICOS.push({id:nextServId++,nome,preco,dur,cat,ico:icoSel,desc});
    notif(`Serviço "${nome}" adicionado com sucesso!`);
  }
  limparFormServ();
  renderServicosGestao();
  renderServicosAg();
}

function editarServ(id){
  const s=SERVICOS.find(x=>x.id===id);
  if(!s) return;
  editServId=id;
  document.getElementById('fs-nome').value=s.nome;
  document.getElementById('fs-preco').value=s.preco;
  document.getElementById('fs-dur').value=s.dur;
  document.getElementById('fs-cat').value=s.cat;
  document.getElementById('fs-desc').value=s.desc||'';
  icoSel=s.ico;
  document.querySelectorAll('.ico-opt').forEach(e=>{e.classList.toggle('sel',e.dataset.ico===s.ico);});
  document.getElementById('form-serv-titulo').innerHTML=`Editar <em>serviço</em>`;
  document.getElementById('fs-btn-salvar').innerHTML='<i class="bi bi-check2"></i> Salvar alterações';
  document.getElementById('fs-btn-cancelar').style.display='inline-flex';
  document.querySelector('.form-servico').scrollIntoView({behavior:'smooth'});
}

function cancelarEdicaoServ(){
  editServId=null;
  limparFormServ();
  document.getElementById('form-serv-titulo').innerHTML='Novo <em>serviço</em>';
  document.getElementById('fs-btn-salvar').innerHTML='<i class="bi bi-plus-circle"></i> Adicionar serviço';
  document.getElementById('fs-btn-cancelar').style.display='none';
}

function limparFormServ(){
  document.getElementById('fs-nome').value='';
  document.getElementById('fs-preco').value='';
  document.getElementById('fs-dur').value='';
  document.getElementById('fs-desc').value='';
}

function pedirDel(id){
  delServId=id;
  const s=SERVICOS.find(x=>x.id===id);
  document.getElementById('del-nome').textContent=s?.nome||'este serviço';
  document.getElementById('del-overlay').classList.add('open');
}

function confirmarDel(){
  SERVICOS=SERVICOS.filter(s=>s.id!==delServId);
  document.getElementById('del-overlay').classList.remove('open');
  notif('Serviço removido.');
  renderServicosGestao();
  renderServicosAg();
}

// ============================================================
// RELATÓRIOS
// ============================================================
function renderRelatorios(){
  const total=Object.values(AGENDA_PROF).flat().length;
  const fat=Object.values(AGENDA_PROF).flat().reduce((a,e)=>{
    const p={corte:60,manicure:50,tratamento:80,coloracao:150};return a+(p[e.tipo]||60);},0);
  const porProf=Object.entries(AGENDA_PROF).map(([n,evs])=>{
    const f=evs.reduce((a,e)=>{const p={corte:60,manicure:50,tratamento:80,coloracao:150};return a+(p[e.tipo]||60);},0);
    return {nome:n,qtd:evs.length,fat:f};
  });
  document.getElementById('relatorios-conteudo').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;">
      <div class="stat-box"><div class="sn">${total}</div><div class="sd">Atendimentos totais</div><div class="sd2">Semana atual</div></div>
      <div class="stat-box"><div class="sn">R$ ${fat}</div><div class="sd">Faturamento bruto</div><div class="sd2">Estimativa da semana</div></div>
      <div class="stat-box"><div class="sn">${SERVICOS.length}</div><div class="sd">Serviços ativos</div><div class="sd2">Disponíveis no sistema</div></div>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;color:var(--marrom);margin-bottom:20px;">Desempenho por <em style="font-style:italic;color:var(--marrom-medio)">profissional</em></h3>
      ${porProf.map(p=>`
        <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--creme-escuro);">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--marrom);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--dourado-claro);flex-shrink:0;">${p.nome.split(' ').map(x=>x[0]).join('').substring(0,2)}</div>
          <div style="flex:1;"><div style="font-size:14px;font-weight:500;color:var(--marrom);">${p.nome}</div><div style="font-size:12px;color:rgba(61,43,26,0.4);margin-top:2px;">${p.qtd} atendimentos</div></div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--dourado);">R$ ${p.fat}</div>
          <div style="width:80px;">
            <div style="height:4px;background:var(--creme-escuro);border-radius:2px;">
              <div style="height:4px;background:var(--dourado);border-radius:2px;width:${Math.round(p.qtd/total*100)}%"></div>
            </div>
            <div style="font-size:10px;color:rgba(61,43,26,0.35);margin-top:3px;text-align:right;">${Math.round(p.qtd/total*100)}%</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="card">
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;color:var(--marrom);margin-bottom:20px;">Serviços mais <em style="font-style:italic;color:var(--marrom-medio)">solicitados</em></h3>
      ${(() => {
        const tc={};
        Object.values(AGENDA_PROF).flat().forEach(e=>tc[e.tipo]=(tc[e.tipo]||0)+1);
        const tn={corte:'Corte de Cabelo',manicure:'Manicure/Pedicure',tratamento:'Tratamento Capilar',coloracao:'Coloração'};
        const tc2={corte:'#C9A96E',manicure:'#C0392B',tratamento:'#4CAF7D',coloracao:'#8E44AD'};
        return Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--creme-escuro);">
            <div style="width:10px;height:10px;border-radius:2px;background:${tc2[t]};flex-shrink:0;"></div>
            <div style="flex:1;font-size:14px;color:var(--marrom);">${tn[t]}</div>
            <div style="font-size:13px;color:rgba(61,43,26,0.4);">${n} atendimentos</div>
            <div style="width:100px;"><div style="height:4px;background:var(--creme-escuro);border-radius:2px;"><div style="height:4px;background:${tc2[t]};border-radius:2px;width:${Math.round(n/total*100)}%"></div></div></div>
          </div>`).join('');
      })()}
    </div>`;
}

// ============================================================
// CLIENTES GESTÃO
// ============================================================
function renderClientesGestao(){
  const clientes=[
    {nome:'Ana Paula Ferreira',tel:'(69) 9 8401-2345',ultimo:'08/04/2026',serv:'Coloração',total:'R$ 450'},
    {nome:'Fernanda Lima',tel:'(69) 9 8523-4567',ultimo:'07/04/2026',serv:'Corte de Cabelo',total:'R$ 240'},
    {nome:'Roberta Silva',tel:'(69) 9 9112-3456',ultimo:'08/04/2026',serv:'Corte de Cabelo',total:'R$ 180'},
    {nome:'Letícia Matos',tel:'(69) 9 9234-5678',ultimo:'08/04/2026',serv:'Escova Progressiva',total:'R$ 200'},
    {nome:'Marcia Freitas',tel:'(69) 9 9345-6789',ultimo:'07/04/2026',serv:'Manicure + Pedicure',total:'R$ 195'},
    {nome:'Eliane Gomes',tel:'(69) 9 9456-7890',ultimo:'07/04/2026',serv:'Tratamento Capilar',total:'R$ 320'},
  ];
  document.getElementById('clientes-lista-gestao').innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <span style="font-size:13px;color:rgba(61,43,26,0.4);">${clientes.length} clientes cadastrados</span>
      <button class="btn-ghost"><i class="bi bi-search"></i> Buscar cliente</button>
    </div>
    ${clientes.map(c=>`
    <div class="serv-row" style="margin-bottom:10px;">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--marrom);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--dourado-claro);flex-shrink:0;">${c.nome.split(' ').map(x=>x[0]).join('').substring(0,2)}</div>
      <div class="serv-row-info">
        <h4>${c.nome}</h4>
        <div class="meta"><i class="bi bi-telephone" style="font-size:10px"></i> ${c.tel} &bull; Último: ${c.ultimo} &bull; ${c.serv}</div>
      </div>
      <div class="serv-row-preco">${c.total}</div>
      <div class="serv-row-acoes">
        <button class="btn-ghost" onclick="notif('Em breve: histórico completo do cliente')"><i class="bi bi-eye"></i></button>
        <button class="btn-ghost" onclick="window.open('https://wa.me/5569','_blank')"><i class="bi bi-whatsapp"></i></button>
      </div>
    </div>`).join('')}`;
}

// ============================================================
// MODAL / OVERLAY
// ============================================================
function fecharOverlay(ev){if(ev.target===document.getElementById('modal-overlay'))fecharModal();}
function fecharOverlay2(ev){if(ev.target===document.getElementById('del-overlay'))document.getElementById('del-overlay').classList.remove('open');}
function fecharModal(){document.getElementById('modal-overlay').classList.remove('open');}

// ============================================================
// NOTIFICAÇÃO
// ============================================================
let notifTimer;
function notif(msg){
  const n=document.getElementById('notif');
  document.getElementById('notif-txt').textContent=msg;
  n.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer=setTimeout(()=>n.classList.remove('show'),3500);
}