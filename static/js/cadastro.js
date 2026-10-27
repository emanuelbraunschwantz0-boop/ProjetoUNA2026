
// ============================================================
// ESTADO
// ============================================================
const estado = {
  tipo: 'cliente',
  etapa: 2,
  nome: '', email: '', tel: '', cpf: '',
  nasc: '', genero: '', cep: '',
  especialidades: [],
  bio: '',
  senha: ''
};

const TOTAL_ETAPAS = 3;
const PROGRESSO_LABELS = ['', '', 'Etapa 1 — Dados pessoais', 'Etapa 2 — Segurança', 'Etapa 3 — Confirmação'];

// ============================================================
// SELEÇÃO DE TIPO
// ============================================================
function toggleFunc(chk) {
  estado.tipo = chk.checked ? 'profissional' : 'cliente';
  document.getElementById('bloco-prof').style.display = chk.checked ? 'block' : 'none';
}

// ============================================================
// PROGRESSO
// ============================================================
function atualizarProgresso(n) {
  const pct = Math.round(((n - 1) / TOTAL_ETAPAS) * 100);
  document.getElementById('prog-barra').style.width = pct + '%';
  document.getElementById('prog-label').textContent = PROGRESSO_LABELS[n];
  document.getElementById('prog-total').textContent = (n - 1) + ' de ' + TOTAL_ETAPAS;

  // Steps laterais
  document.querySelectorAll('.cv-step-item').forEach(el => {
    const s = parseInt(el.dataset.s);
    el.className = 'cv-step-item' + (s < n ? ' concluido' : s === n ? ' ativo' : '');
    const num = el.querySelector('.cv-step-num');
    num.innerHTML = s < n ? '<i class="bi bi-check-lg" style="font-size:10px"></i>' : (s - 1);
  });
}

// ============================================================
// NAVEGAÇÃO ENTRE ETAPAS
// ============================================================
function irParaEtapa(n) {
  document.querySelectorAll('.cad-etapa').forEach(e => e.classList.remove('ativa'));
  document.getElementById('etapa' + n).classList.add('ativa');
  estado.etapa = n;
  atualizarProgresso(n);
  esconderAlertaGlobal();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (n === 4) preencherRevisao();
}

function avancar(etapaAtual) {
  esconderAlertaGlobal();
  if (!validarEtapa(etapaAtual)) return;
  irParaEtapa(etapaAtual + 1);
}

function voltar(etapaAtual) {
  irParaEtapa(etapaAtual - 1);
}

// ============================================================
// VALIDAÇÃO POR ETAPA
// ============================================================
function validarEtapa(n) {
  limparErros();
  let ok = true;

  if (n === 2) {
    const nome = document.getElementById('inp-nome').value.trim();
    const email = document.getElementById('inp-email').value.trim();
    const tel = document.getElementById('inp-tel').value.trim();
    const cpf = document.getElementById('inp-cpf').value.trim();
    const nasc = document.getElementById('inp-nasc').value;

    if (nome.split(' ').length < 2) { erro('err-nome', 'inp-nome'); ok = false; }
    if (!email.includes('@') || !email.includes('.')) { erro('err-email', 'inp-email'); ok = false; }
    if (tel.replace(/\D/g,'').length < 10) { erro('err-tel', 'inp-tel'); ok = false; }
    if (cpf.replace(/\D/g,'').length < 11) { erro('err-cpf', 'inp-cpf'); ok = false; }
    if (!nasc) { erro('err-nasc', 'inp-nasc'); ok = false; }

    if (estado.tipo === 'profissional') {
      const adm = document.getElementById('inp-admin').value;
      if (!adm) { erro('err-admin', 'inp-admin'); ok = false; }
      const esps = document.querySelectorAll('.esp-chip.sel');
      if (esps.length === 0) { document.getElementById('err-esp').classList.add('vis'); ok = false; }
      estado.especialidades = Array.from(esps).map(e => e.dataset.esp);
    }

    if (ok) {
      estado.nome = nome;
      estado.email = email;
      estado.tel = tel;
      estado.cpf = cpf;
      estado.nasc = nasc;
      estado.genero = document.getElementById('inp-genero').value;
      estado.bio = document.getElementById('inp-bio')?.value.trim() || '';
    }
  }

  if (n === 3) {
    const senha = document.getElementById('inp-senha').value;
    const senha2 = document.getElementById('inp-senha2').value;

    if (!senhaValida(senha)) { erro('err-senha', 'inp-senha'); ok = false; }
    if (senha !== senha2) { erro('err-senha2', 'inp-senha2'); ok = false; }

    if (ok) estado.senha = senha;
  }

  if (!ok) mostrarAlertaGlobal('Corrija os campos destacados antes de continuar.');
  return ok;
}

// ============================================================
// REVISÃO FINAL
// ============================================================
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function preencherRevisao() {
  const d = Object.fromEntries(Object.entries(estado).map(([k, v]) => [k, typeof v === 'string' ? esc(v) : v]));
  const dt = d.nasc ? new Date(d.nasc + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
  const esps = d.especialidades.length ? esc(d.especialidades.join(', ')) : '—';
  const tipoLabel = d.tipo === 'profissional' ? 'Profissional' : 'Cliente';

  document.getElementById('card-revisao').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--creme-escuro)">
      <div id="rev-avatar" style="width:52px;height:52px;border-radius:50%;background:var(--marrom);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--dourado-claro);flex-shrink:0;">${esc(estado.nome.split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase())}</div>
      <div>
        <p style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;color:var(--marrom)">${d.nome}</p>
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:500;background:${d.tipo==='profissional'?'rgba(201,169,110,0.12)':'rgba(41,128,185,0.1)'};color:${d.tipo==='profissional'?'#6B4226':'#1A5276'}">${tipoLabel}</span>
      </div>
    </div>
    ${linha('bi-envelope','E-mail', d.email)}
    ${linha('bi-telephone','WhatsApp', d.tel)}
    ${linha('bi-card-text','CPF', d.cpf)}
    ${linha('bi-calendar3','Nascimento', dt)}
    ${d.tipo==='profissional' ? linha('bi-scissors','Especialidades', esps) : ''}
    ${d.genero ? linha('bi-person','Gênero', d.genero) : ''}
  `;
}
function linha(ico, label, val) {
  return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--creme-escuro)">
    <div style="width:32px;height:32px;border-radius:7px;background:var(--creme-escuro);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--dourado);flex-shrink:0"><i class="bi ${ico}"></i></div>
    <div><label style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(61,43,26,0.35)">${label}</label><p style="font-size:13px;color:var(--marrom);margin-top:2px">${val}</p></div>
  </div>`;
}

// ============================================================
// FINALIZAR CADASTRO
// ============================================================
async function finalizar() {
  if (!document.getElementById('chk-termos').checked || !document.getElementById('chk-termo-compromisso').checked) {
    document.getElementById('err-termos').style.display = 'block';
    return;
  }
  document.getElementById('err-termos').style.display = 'none';

  const btn = document.getElementById('btn-finalizar');
  btn.classList.add('carregando');

  const fd = new FormData();
  const campos = {
    nome: estado.nome, email: estado.email, tel: estado.tel,
    cpf: estado.cpf, nasc: estado.nasc, bio: estado.bio, senha: estado.senha,
    genero: document.getElementById('inp-genero').value,
    cep: document.getElementById('inp-cep').value
  };
  Object.entries(campos).forEach(([k, v]) => fd.append(k, v || ''));
  estado.especialidades.forEach(e => fd.append('especialidades', e));
  if (estado.tipo === 'profissional') {
    fd.append('funcionario', 'on');
    fd.append('senha_adm', document.getElementById('inp-admin').value);
    fd.append('horario', montarHorario());
  }
  fd.append('aceite_termos', 'on');
  fd.append('aceite_compromisso', 'on');
  const foto = document.getElementById('inp-foto').files[0];
  if (foto) fd.append('foto', foto);

  try {
    const r = await fetch(window.location.pathname, {
      method: 'POST', body: fd,
      headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value }
    });
    const d = await r.json();
    btn.classList.remove('carregando');
    if (!d.ok) {
      mostrarAlertaGlobal(Object.entries(d.erros || {}).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'Erro ao cadastrar.');
      return;
    }
    document.getElementById('etapa4').classList.remove('ativa');
    document.getElementById('cad-sucesso').classList.add('vis');
    document.getElementById('prog-barra').style.width = '100%';
    document.getElementById('prog-label').textContent = 'Cadastro concluído!';
    document.querySelector('.link-login').style.display = 'none';
    document.getElementById('suc-nome-email').textContent = `${estado.nome} · ${estado.email}`;
    document.getElementById('btn-pos-cadastro').href = d.redirect;
    if (estado.tipo === 'profissional') {
      document.getElementById('suc-desc').textContent = 'Conta de funcionário criada e liberada. Você já pode entrar.';
      document.getElementById('suc-aviso-prof').style.display = 'none';
    } else {
      document.getElementById('suc-desc').textContent = 'Conta criada! Agora preencha o Termo de Responsabilidade e a Ficha de Saúde.';
    }
  } catch (e) {
    btn.classList.remove('carregando');
    mostrarAlertaGlobal('Falha de conexão. Tente novamente.');
  }
}

// ============================================================
// HELPERS DE VALIDAÇÃO
// ============================================================
function erro(errId, inpId) {
  document.getElementById(errId).classList.add('vis');
  if (inpId) document.getElementById(inpId).classList.add('erro');
}
function limparErros() {
  document.querySelectorAll('.campo-erro-txt').forEach(e => e.classList.remove('vis'));
  document.querySelectorAll('.erro').forEach(e => e.classList.remove('erro'));
}
function mostrarAlertaGlobal(msg) {
  const a = document.getElementById('alerta-global');
  document.getElementById('alerta-msg').textContent = msg;
  a.classList.add('vis');
}
function esconderAlertaGlobal() {
  document.getElementById('alerta-global').classList.remove('vis');
}

function senhaValida(s) {
  return s.length >= 8 && /[A-Z]/.test(s) && /[0-9]/.test(s);
}

// ============================================================
// FORÇA DA SENHA
// ============================================================
function avaliarSenha(inp) {
  const s = inp.value;
  let pts = 0;
  if (s.length >= 8)  pts++;
  if (s.length >= 12) pts++;
  if (/[A-Z]/.test(s) && /[0-9]/.test(s)) pts++;
  if (/[^A-Za-z0-9]/.test(s)) pts++;

  const segs = ['ss1','ss2','ss3','ss4'];
  const classes = ['fraca','fraca','media','forte'];
  segs.forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'senha-seg' + (i < pts ? ' ' + classes[pts - 1] : '');
  });

  const txt = ['','Senha muito fraca','Senha fraca','Senha boa','Senha forte'];
  const cores = ['','#C0392B','#E67E22','#2980B9','#4CAF7D'];
  const t = document.getElementById('senha-forca-txt');
  t.textContent = pts > 0 ? txt[pts] : 'Mínimo 8 caracteres, 1 número e 1 letra maiúscula';
  t.style.color = pts > 0 ? cores[pts] : '';
}

function verificarSenhas() {
  const s1 = document.getElementById('inp-senha').value;
  const s2 = document.getElementById('inp-senha2').value;
  const ico = document.getElementById('match-ico');
  if (!s2) { ico.className = 'match-ico'; return; }
  ico.className = 'match-ico ' + (s1 === s2 ? 'ok' : 'nok');
  ico.innerHTML = s1 === s2 ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-x-circle-fill"></i>';
}

// ============================================================
// TOGGLE SENHA
// ============================================================
function toggleSenha(inpId, icoId) {
  const inp = document.getElementById(inpId);
  const ico = document.getElementById(icoId);
  if (inp.type === 'password') { inp.type = 'text'; ico.className = 'bi bi-eye-slash'; }
  else { inp.type = 'password'; ico.className = 'bi bi-eye'; }
}

// ============================================================
// ESPECIALIDADES
// ============================================================
function toggleEsp(el) {
  el.classList.toggle('sel');
}

// ============================================================
// FOTO PREVIEW
// ============================================================
function previewFoto(inp) {
  const file = inp.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('A imagem deve ter no máximo 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('foto-preview');
    prev.innerHTML = `<img src="${e.target.result}" alt="Foto de perfil">`;
    prev.style.borderColor = 'var(--dourado)';
  };
  reader.readAsDataURL(file);
}

// ============================================================
// MASKS
// ============================================================
function maskTel(inp) {
  let v = inp.value.replace(/\D/g, '').substring(0, 11);
  if (v.length > 10) v = v.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2 $3-$4');
  else v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  inp.value = v;
}
function maskCPF(inp) {
  let v = inp.value.replace(/\D/g,'').substring(0,11);
  v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/,'$1.$2.$3-$4');
  inp.value = v;
}
function maskCEP(inp) {
  let v = inp.value.replace(/\D/g,'').substring(0,8);
  v = v.replace(/^(\d{5})(\d{0,3})/,'$1-$2');
  inp.value = v;
}

// ============================================================
// HORÁRIOS PROFISSIONAL
// ============================================================
(function gerarHorarios() {
  const dias = [
    { nome: 'Segunda', val: '1' },
    { nome: 'Terça',   val: '2' },
    { nome: 'Quarta',  val: '3' },
    { nome: 'Quinta',  val: '4' },
    { nome: 'Sexta',   val: '5' },
    { nome: 'Sábado',  val: '6' },
  ];
  const wrap = document.getElementById('horarios-semana');
  if (!wrap) return;
  wrap.innerHTML = dias.map(d => `
    <div class="dia-row" id="dr-${d.val}">
      <span class="dia-nome">${d.nome}</span>
      <input type="time" value="08:00" id="hs-${d.val}">
      <input type="time" value="18:00" id="he-${d.val}">
      <button class="dia-toggle on" id="dt-${d.val}" onclick="toggleDia('${d.val}',this)"></button>
    </div>
  `).join('');
})();

function toggleDia(val, btn) {
  const on = btn.classList.toggle('on');
  document.getElementById('dr-' + val).classList.toggle('desativado', !on);
  document.getElementById('hs-' + val).disabled = !on;
  document.getElementById('he-' + val).disabled = !on;
}

function montarHorario() {
  const nomes = {1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sáb'};
  const at = [];
  for (let d = 1; d <= 6; d++) {
    if (document.getElementById('dt-' + d).classList.contains('on'))
      at.push({n: nomes[d], i: document.getElementById('hs-' + d).value, f: document.getElementById('he-' + d).value});
  }
  if (!at.length) return '';
  if (at.every(x => x.i === at[0].i && x.f === at[0].f))
    return at.map(x => x.n).join(', ') + ' · ' + at[0].i + ' às ' + at[0].f;
  return at.map(x => `${x.n} ${x.i}-${x.f}`).join('; ');
}

window.addEventListener('DOMContentLoaded', () => atualizarProgresso(2));
