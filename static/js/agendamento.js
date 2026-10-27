
// ============================================================
// DADOS GLOBAIS
// ============================================================
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_NOME = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_LONGO = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

let SERVICOS = [], PROFISSIONAIS = [], AGENDA = [], HIST_CLIENTE = [], PERFIL = {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => Number(n).toFixed(2).replace('.', ',');
const TIPOS = ['corte','manicure','tratamento','coloracao'];
const ST = {
  pendente:{n:'Pendentes',i:'bi-hourglass-split'}, confirmado:{n:'Confirmados',i:'bi-calendar-check'},
  concluido:{n:'Feitos',i:'bi-check2-all'}, cancelado:{n:'Cancelados',i:'bi-x-circle'}
};
const SL = {pendente:'Pendente', confirmado:'Confirmado', concluido:'Feito', cancelado:'Cancelado'};
const FILT = {hist:new Set(Object.keys(ST)), ag:new Set(Object.keys(ST))};
function chips(ctx, dados) {
  return Object.entries(ST).map(([k,v]) => `<button class="chip st-${k}${FILT[ctx].has(k)?' on':''}" onclick="togFiltro('${ctx}','${k}')"><i class="bi ${v.i}"></i> ${v.n} <b>${dados.filter(x=>x.status===k).length}</b></button>`).join('');
}
function togFiltro(ctx, k) {
  FILT[ctx].has(k) ? FILT[ctx].delete(k) : FILT[ctx].add(k);
  ctx === 'hist' ? renderHist() : renderAgenda();
}
const tp = t => TIPOS.includes(t) ? t : 'corte';

// Comunicação com o Django (JSON + CSRF)
async function api(url, body) {
  const fd = body instanceof FormData;
  const opts = body === undefined ? {} : {
    method: 'POST',
    headers: {...(fd ? {} : {'Content-Type':'application/json'}), 'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value},
    body: fd ? body : JSON.stringify(body)
  };
  const r = await fetch(url, opts);
  if (r.status === 401) { window.location.href = '/index_agenda.html'; throw new Error('Sessão expirada.'); }
  let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok || d.ok === false) throw new Error(d.erro || 'Erro ao comunicar com o servidor.');
  return d;
}

async function carregar() {
  const d = await api('/api/dados/');
  SERVICOS = d.servicos; PROFISSIONAIS = d.profissionais; PERFIL = d.perfil;
  HIST_CLIENTE = d.historico || [];
  if (user.tipo === 'profissional') await carregarAgenda();
}

function inicioSemana() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate() - ((h.getDay() + 6) % 7) + semOfsset * 7);
}
const isoData = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

async function carregarAgenda() {
  AGENDA = (await api('/api/agenda/?inicio=' + isoData(inicioSemana()))).eventos;
}

// Atualiza com o banco a cada 30s (e ao voltar para a aba)
async function atualizar() {
  if (!user || document.hidden) return;
  try {
    await carregar();
    if (user.tipo === 'cliente') renderHist(); else { renderAgenda(); renderServicosGestao(); }
  } catch (e) {}
}
setInterval(atualizar, 10000);
document.addEventListener('visibilitychange', atualizar);

async function mudarStatus(id, st) {
  try { await api(`/api/agendamento/${id}/status/`, {status: st}); notif('Agendamento atualizado.'); }
  catch (e) { notif(e.message); return; }
  fecharModal(); atualizar();
}

// ESTADO
let user = null;
let sel = {servico:null, prof:null, data:null, hora:null};
let calM = new Date().getMonth(), calA = new Date().getFullYear();
let semOff = 0;
let editServId = null;
let delServId = null;
let icoSel = 'bi-scissors';

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  const raw = sessionStorage.getItem('una_user');
  if(!raw) { window.location.href='/index_agenda.html'; return; }
  user = JSON.parse(raw);
  try { await carregar(); } catch (e) { notif(e.message); }
  montarLayout();
  if (user.tipo === 'cliente') {
    renderHist();
    document.getElementById('c-nome').value = PERFIL.nome || '';
    document.getElementById('c-tel').value = PERFIL.tel || '';
    document.getElementById('c-email').value = PERFIL.email || '';
    ['c-nome','c-tel','c-email'].forEach(i => document.getElementById(i).readOnly = true);
  }
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
      <li data-sec="sec-perfil"><a onclick="irSec('sec-perfil',this)"><i class="bi bi-person-circle"></i> Meu perfil</a></li>
      <li class="separador"></li>
      <li><a href="/"><i class="bi bi-house"></i> Home</a></li>
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
      <li data-sec="sec-perfil"><a onclick="irSec('sec-perfil',this)"><i class="bi bi-person-circle"></i> Meu perfil</a></li>
      <li class="separador"></li>
      <li><a href="/"><i class="bi bi-house"></i> Home</a></li>
    `;
    const profNome = user.nome.split(' ')[0];
    document.getElementById('ph-tag').textContent = 'Painel profissional';
    document.getElementById('ph-titulo').innerHTML = `Bem-vinda, <em>${profNome}</em>`;
    document.getElementById('ph-sub').textContent = `Gerencie sua agenda, serviços e métricas do salão`;
    document.getElementById('prof-saudacao').textContent = profNome;
    // Setar profissional no select se for a profissional logada
    const sel = document.getElementById('sel-prof-agenda');
    sel.innerHTML = `<option>${esc(user.nome)}</option>`; sel.disabled = true;
    irSec('sec-agenda');
    renderAgenda();
    renderServicosGestao();
  }
}

function irSec(id, el) {
  if(id==='sec-perfil') carregarPerfil();
  document.querySelectorAll('.secao').forEach(s=>s.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
  document.querySelectorAll('#nav-menu li[data-sec]').forEach(li=>li.classList.remove('ativo'));
  const li = document.querySelector(`#nav-menu li[data-sec="${id}"]`);
  if(li) li.classList.add('ativo');
}

async function sair() {
  sessionStorage.removeItem('una_user');
  try { await fetch('/sair/', {method:'POST', headers:{'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value}}); } catch (e) {}
  window.location.href='/';
}

// ============================================================
// CLIENTE — AGENDAMENTO
// ============================================================
function renderServicosAg() {
  document.getElementById('grade-servs').innerHTML = SERVICOS.map(s=>`
    <div class="serv-card" id="sc-${s.id}" onclick="selServ(${s.id})">
      <div class="serv-ico"><i class="bi ${esc(s.ico)}"></i></div>
      <h4>${esc(s.nome)}</h4>
      <span class="dur"><i class="bi bi-clock" style="font-size:10px"></i> ${s.dur}min</span>
      <p class="preco">R$ ${brl(s.preco)}</p>
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
      <div class="prof-av">${esc(p.ini)}</div>
      <div><h4>${esc(p.nome)}</h4><span>${esc(p.esp)}</span></div>
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
  sel.data=dt; sel.hora=null; ultimaAssinatura=null;
  document.getElementById('btn-n3').disabled=true;
  const [a,m,di]=dt.split('-');
  const obj=new Date(a,m-1,di);
  document.getElementById('data-txt-sel').textContent=`${DIAS_LONGO[obj.getDay()]}, ${di}/${m}/${a}`.toUpperCase();
  renderCalendario();
  renderHorarios(dt);
}

let ultimaAssinatura = null;

function statusHorarios(ok) {
  const el = document.getElementById('hor-status');
  if (!el) return;
  el.textContent = ok
    ? `Duração: ${sel.servico.dur} min · atualizado às ${new Date().toLocaleTimeString('pt-BR')} · atualiza sozinho`
    : 'Sem conexão com o servidor. Tentando novamente...';
  el.style.color = ok ? '' : '#C0392B';
}

async function renderHorarios(dt, silencioso) {
  if (!sel.prof || !sel.servico) return;
  let d;
  try { d = await api(`/api/horarios/?prof=${sel.prof.id}&servico=${sel.servico.id}&data=${dt}`); }
  catch (e) { if (!silencioso) notif(e.message); statusHorarios(false); return; }
  if (sel.data !== dt) return;  // a pessoa trocou de dia durante a consulta
  const livres = d.horarios.filter(x => x.livre).map(x => x.h);
  if (sel.hora && !livres.includes(sel.hora)) {
    if (silencioso) notif('O horário escolhido acabou de ser ocupado. Escolha outro.');
    sel.hora = null;
    document.getElementById('btn-n3').disabled = true;
  }
  const assinatura = JSON.stringify(d.horarios) + '|' + sel.hora;
  if (silencioso && assinatura === ultimaAssinatura) { statusHorarios(true); return; }  // nada mudou
  ultimaAssinatura = assinatura;
  const dur = sel.servico.dur;
  const fim = h => { const [a,b] = h.split(':').map(Number), t = a*60+b+dur; return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0'); };
  const botao = x => x.livre
    ? `<button class="hbtn${sel.hora===x.h?' sel':''}" title="Termina às ${fim(x.h)}" onclick="selH('${x.h}',this)">${x.h}</button>`
    : `<button class="hbtn ocup" disabled title="Indisponível">${x.h}</button>`;
  const bloco = (titulo, lista) => lista.length ? `<div>
      <p class="turno-label">${titulo}</p>
      <div class="grade-h">${lista.map(botao).join('')}</div>
    </div>` : '';
  document.getElementById('turnos-box').innerHTML =
    '<p id="hor-status" style="font-size:12px;opacity:.65;margin-bottom:10px"></p>' +
    (livres.length ? '' : '<p style="padding:6px 0 14px;font-weight:500">Não há horários livres neste dia para este serviço. Tente outra data ou profissional.</p>') +
    bloco('Manhã', d.horarios.filter(x => x.h < '12:00')) + bloco('Tarde', d.horarios.filter(x => x.h >= '12:00'));
  statusHorarios(true);
}

// mantém os horários sempre atualizados com o banco (a cada 5s enquanto a tela estiver aberta)
setInterval(() => {
  if (!document.hidden && user && user.tipo === 'cliente' && sel.data &&
      document.getElementById('et3').style.display === 'block') renderHorarios(sel.data, true);
}, 5000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && sel.data && document.getElementById('et3').style.display === 'block') renderHorarios(sel.data, true);
});

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
  document.getElementById('r-preco').textContent=s?brl(s.preco):'—';
}


async function confirmar(){
  try {
    await api('/api/agendar/', {servico: sel.servico.id, prof: sel.prof.id, data: sel.data, hora: sel.hora,
                                obs: document.getElementById('c-obs').value});
  } catch (e) {
    notif(e.message);
    if (sel.data) { sel.hora = null; document.getElementById('btn-n3').disabled = true; renderHorarios(sel.data, true); goEt(3); }
    return;
  }
  const [a,m,d]=sel.data.split('-');
  document.getElementById('suc-info').innerHTML=`<strong>${esc(sel.servico.nome)}</strong> com ${esc(sel.prof.nome)}<br>${d}/${m} às ${sel.hora}<br><small>Aguardando confirmação da profissional.</small>`;
  ['et1','et2','et3','et4'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('et-suc').style.display='block';
  notif('Agendamento solicitado com sucesso!');
  atualizar();
}

function novoAg(){
  sel={servico:null,prof:null,data:null,hora:null};
  document.getElementById('et-suc').style.display='none';
  document.getElementById('et1').style.display='block';
  for(let i=1;i<=4;i++) document.getElementById('st'+i).className='step'+(i===1?' ativo':'');
  renderServicosAg();
  document.querySelectorAll('.hbtn').forEach(b=>{b.classList.remove('sel');});
}

// HISTÓRICO CLIENTE
function renderHist(){
  const el=document.getElementById('hist-lista');
  document.getElementById('chips-hist').innerHTML=chips('hist',HIST_CLIENTE);
  const lista=HIST_CLIENTE.filter(h=>FILT.hist.has(h.status));
  if(!lista.length){el.innerHTML='<p style="opacity:.6;padding:12px">Nenhum agendamento neste filtro.</p>';return;}
  el.innerHTML=lista.map(h=>{
    const [d,m]=h.data.split('/');
    const mNom=MESES[parseInt(m)-1].substring(0,3);
    return `<div class="hist-item st st-${esc(h.status)}">
      <div class="hist-data"><div class="hd">${d}</div><div class="hm">${mNom}</div></div>
      <div class="hist-div"></div>
      <div class="hist-info">
        <h4>${esc(h.serv)}</h4>
        <p>${esc(h.prof)} &bull; ${h.hora}</p>
      </div>
      <div class="hist-status"><i class="bi ${ST[h.status].i}"></i> ${SL[h.status]}</div>
      <div class="hist-preco">${esc(h.preco)}</div>
      ${h.pode_cancelar?`<button class="btn-danger" title="Cancelar" onclick="if(confirm('Cancelar este agendamento?'))mudarStatus(${h.id},'cancelado')"><i class="bi bi-x-lg"></i></button>`:''}
    </div>`;
  }).join('');
}

// ============================================================
// PROFISSIONAL — AGENDA
// ============================================================
let semOfsset=0;
async function movSemana(d){if(d===0)semOfsset=0;else semOfsset+=d;try{await carregarAgenda();}catch(e){notif(e.message);}renderAgenda();}

function renderAgenda(){
  const profNome=document.getElementById('sel-prof-agenda')?.value||'Carla Mendes';
  document.getElementById('prof-saudacao').textContent=profNome.split(' ')[0];
  const ativos=AGENDA.filter(e=>e.status!=='cancelado');
  const evs=AGENDA.filter(e=>FILT.ag.has(e.status));
  document.getElementById('chips-ag').innerHTML=chips('ag',AGENDA);
  const hoje=new Date();
  const ini=inicioSemana();
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
      const evCol=evs.filter(e=>e.dia===col&&e.h.slice(0,2)===h.slice(0,2));
      corpo+=`<div class="ag-slot">${evCol.map(e=>`
        <div class="ev ${tp(e.tipo)} st st-${e.status}" onclick="abrirEvento(${e.id})">
          <div class="eh"><i class="bi ${ST[e.status].i}"></i> ${e.h}</div>
          <div class="en">${esc(e.cli)}</div>
          <div class="es">${esc(e.serv)}</div>
        </div>`).join('')}</div>`;
    }
  });
  document.getElementById('ag-corpo').innerHTML=corpo;

  // Stats
  const fat=brl(ativos.reduce((a,e)=>a+e.preco,0));
  const horas_t=Math.round(ativos.reduce((a,e)=>a+e.dur,0)/60);
  const tipos={};ativos.forEach(e=>{const t=tp(e.tipo);tipos[t]=(tipos[t]||0)+1;});
  const top=Object.entries(tipos).sort((a,b)=>b[1]-a[1])[0];
  const tNom={corte:'Cortes',manicure:'Manicure',tratamento:'Tratamentos',coloracao:'Colorações'};
  document.getElementById('stats-agenda').innerHTML=`
    <div class="stat-box"><div class="sn">${ativos.length}</div><div class="sd">Agendamentos</div><div class="sd2">Na semana</div></div>
    <div class="stat-box"><div class="sn">R$ ${fat}</div><div class="sd">Faturamento estimado</div><div class="sd2">Semana atual</div></div>
    <div class="stat-box"><div class="sn">${horas_t}h</div><div class="sd">Horas agendadas</div><div class="sd2">${ativos.length} atendimentos</div></div>
    <div class="stat-box"><div class="sn">${top?tipos[top[0]]:0}</div><div class="sd">Serviço mais popular</div><div class="sd2">${top?tNom[top[0]]:'—'}</div></div>`;
}

function abrirEvento(id){
  const e=AGENDA.find(x=>x.id===id); if(!e) return;
  const t=tp(e.tipo);
  const dNomes={corte:'Corte de Cabelo',manicure:'Manicure / Pedicure',tratamento:'Tratamento Capilar',coloracao:'Coloração'};
  const corBg={corte:'rgba(201,169,110,0.12)',manicure:'rgba(192,57,43,0.08)',tratamento:'rgba(76,175,125,0.08)',coloracao:'rgba(142,68,173,0.07)'};
  const corTx={corte:'#6B4226',manicure:'#8B1A10',tratamento:'#1A5E35',coloracao:'#5B2C6F'};
  document.getElementById('modal-tipo-badge').innerHTML=`<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:500;background:${corBg[t]};color:${corTx[t]}">${dNomes[t]}</span>`;
  document.getElementById('modal-titulo').textContent=e.cli;
  const [a,m,d]=e.data.split('-');
  const f=e.ficha;
  const fichaHtml=!f?'':`<hr style="margin:10px 0;opacity:.2"><strong style="color:var(--marrom)">Ficha de saúde (sigilosa):</strong><br>
    ${f.sim.length?'Atenção: '+f.sim.map(esc).join(', ')+'<br>':'Nenhuma condição informada.<br>'}
    ${f.nao_informado.length?'Não informado: '+f.nao_informado.map(esc).join(', ')+'<br>':''}
    ${f.alergias?'Alergias: '+esc(f.alergias)+'<br>':''}${f.medicamentos?'Medicamentos: '+esc(f.medicamentos)+'<br>':''}${f.outras?'Outras: '+esc(f.outras):''}`;
  document.getElementById('modal-body').innerHTML=`
    <strong style="color:var(--marrom)">Serviço:</strong> ${esc(e.serv)}<br>
    <strong style="color:var(--marrom)">Quando:</strong> ${d}/${m}/${a} às ${e.h}<br>
    <strong style="color:var(--marrom)">Duração:</strong> ${e.dur} minutos &bull; R$ ${brl(e.preco)}<br>
    <strong style="color:var(--marrom)">Status:</strong> <span style="color:${{pendente:'#E6A23C',confirmado:'#2980B9',concluido:'#4CAF7D',cancelado:'#C0392B'}[e.status]}"><i class="bi ${ST[e.status].i}"></i> ${SL[e.status]}</span><br>
    ${e.obs?`<strong style="color:var(--marrom)">Obs.:</strong> ${esc(e.obs)}<br>`:''}${fichaHtml}`;
  const bt=[];
  if(e.status==='pendente') bt.push(`<button class="btn-pri" onclick="mudarStatus(${e.id},'confirmado')">Confirmar</button>`);
  if(e.status==='confirmado') bt.push(`<button class="btn-pri" onclick="mudarStatus(${e.id},'concluido')">Concluir</button>`);
  if(['pendente','confirmado'].includes(e.status)) bt.push(`<button class="btn-danger" onclick="mudarStatus(${e.id},'cancelado')">Cancelar</button>`);
  const wpp=(e.tel||'').replace(/\D/g,'');
  if(wpp) bt.push(`<button class="btn-sec" onclick="window.open('https://wa.me/55${wpp}','_blank')"><i class="bi bi-whatsapp"></i> WhatsApp</button>`);
  bt.push('<button class="btn-sec" onclick="fecharModal()">Fechar</button>');
  document.getElementById('modal-acoes').innerHTML=bt.join('');
  document.getElementById('modal-overlay').classList.add('open');
}

// ============================================================
// PROFISSIONAL — GESTÃO DE SERVIÇOS
// ============================================================
function renderServicosGestao(){
  const lista=document.getElementById('servicos-lista-gestao');
  const catNom={corte:'Corte / Cabelo',manicure:'Manicure / Pedicure',tratamento:'Tratamento Capilar',coloracao:'Coloração',sobrancelha:'Sobrancelha / Cílios',estetica:'Estética Facial'};
  lista.innerHTML=SERVICOS.map(s=>`
    <div class="serv-row" id="sr-${s.id}">
      <div class="serv-row-ico"><i class="bi ${esc(s.ico)}"></i></div>
      <div class="serv-row-info">
        <h4>${esc(s.nome)}</h4>
        <div class="meta">
          <span class="cat-badge cat-${s.cat}">${catNom[s.cat]||esc(s.cat)}</span>
          &nbsp; <i class="bi bi-clock" style="font-size:10px"></i> ${s.dur}min
        </div>
      </div>
      <div class="serv-row-preco">R$ ${brl(s.preco)}</div>
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

async function salvarServico(){
  const nome=document.getElementById('fs-nome').value.trim();
  const preco=parseFloat(document.getElementById('fs-preco').value);
  const dur=parseInt(document.getElementById('fs-dur').value);
  const cat=document.getElementById('fs-cat').value;
  const desc=document.getElementById('fs-desc').value.trim();
  if(!nome||!preco||!dur){notif('Preencha todos os campos obrigatórios.');return;}
  try {
    await api('/api/servicos/salvar/',{id:editServId,nome,preco,duracao:dur,categoria:cat,icone:icoSel,descricao:desc});
    await carregar();
  } catch(e) { notif(e.message); return; }
  notif(editServId?`Serviço "${nome}" atualizado com sucesso!`:`Serviço "${nome}" adicionado com sucesso!`);
  if(editServId){
    editServId=null;
    document.getElementById('form-serv-titulo').innerHTML='Novo <em>serviço</em>';
    document.getElementById('fs-btn-salvar').innerHTML='<i class="bi bi-plus-circle"></i> Adicionar serviço';
    document.getElementById('fs-btn-cancelar').style.display='none';
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

async function confirmarDel(){
  document.getElementById('del-overlay').classList.remove('open');
  try { await api(`/api/servicos/${delServId}/excluir/`,{}); await carregar(); }
  catch(e) { notif(e.message); return; }
  notif('Serviço removido.');
  renderServicosGestao();
  renderServicosAg();
}
// ============================================================
// MEU PERFIL
// ============================================================
async function carregarPerfil(){
  let d; try { d = await api('/api/perfil/'); } catch(e) { notif(e.message); return; }
  const set=(i,v)=>document.getElementById(i).value=v||'';
  set('pf-nome',d.nome); set('pf-email',d.email); set('pf-tel',d.tel); set('pf-cep',d.cep);
  set('pf-genero',d.genero); set('pf-nasc',d.nasc); set('pf-cpf',d.cpf);
  document.getElementById('pf-foto-prev').innerHTML = d.foto ? `<img src="${esc(d.foto)}" alt="">` : '<i class="bi bi-person-fill"></i>';
  const prof = d.tipo === 'profissional';
  document.getElementById('pf-prof').style.display = prof ? 'block' : 'none';
  document.getElementById('pf-ficha').style.display = prof ? 'none' : 'block';
  if (prof) {
    set('pf-horario',d.horario); set('pf-bio',d.bio);
    document.getElementById('pf-esps').innerHTML = d.todas.map(n => `<button type="button" class="chip${d.esps.includes(n)?' on':''}" data-esp="${esc(n)}" onclick="this.classList.toggle('on')">${esc(n)}</button>`).join('');
  } else {
    document.getElementById('pf-ficha-txt').textContent = d.ficha.em ? `Última atualização e assinatura em ${d.ficha.em}. Se algo mudou na sua saúde, atualize antes do próximo atendimento.` : 'Você ainda não preencheu a ficha de saúde.';
    const t = document.getElementById('pf-termo');
    t.style.display = d.ficha.termo ? 'inline-flex' : 'none';
    if (d.ficha.termo) t.href = '/termo/' + d.ficha.termo + '/';
  }
}

function prevFotoPerfil(inp){
  const f = inp.files[0]; if (!f) return;
  if (f.size > 2*1024*1024) { notif('A imagem deve ter no máximo 2MB.'); inp.value=''; return; }
  const r = new FileReader();
  r.onload = e => document.getElementById('pf-foto-prev').innerHTML = `<img src="${e.target.result}" alt="">`;
  r.readAsDataURL(f);
}

async function salvarPerfil(){
  const g = i => document.getElementById(i).value;
  const fd = new FormData();
  fd.append('nome',g('pf-nome')); fd.append('email',g('pf-email')); fd.append('tel',g('pf-tel'));
  fd.append('cep',g('pf-cep')); fd.append('genero',g('pf-genero')); fd.append('nasc',g('pf-nasc'));
  if (user.tipo === 'profissional') {
    fd.append('bio',g('pf-bio')); fd.append('horario',g('pf-horario'));
    document.querySelectorAll('#pf-esps .chip.on').forEach(c => fd.append('especialidades', c.dataset.esp));
  }
  const foto = document.getElementById('pf-foto').files[0]; if (foto) fd.append('foto', foto);
  try {
    const d = await api('/api/perfil/', fd);
    user.nome = d.nome; sessionStorage.setItem('una_user', JSON.stringify(user));
    document.getElementById('user-nome-sidebar').textContent = d.nome;
    notif('Perfil atualizado com sucesso!');
  } catch(e) { notif(e.message); }
}

async function trocarSenha(){
  const atual=document.getElementById('pw-atual').value, nova=document.getElementById('pw-nova').value;
  if (nova !== document.getElementById('pw-nova2').value) { notif('As senhas novas não coincidem.'); return; }
  try {
    await api('/api/senha/', {atual, nova});
    ['pw-atual','pw-nova','pw-nova2'].forEach(i => document.getElementById(i).value='');
    notif('Senha atualizada com sucesso!');
  } catch(e) { notif(e.message); }
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