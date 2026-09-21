
// ============================================================
// CONFIGURAÇÃO DA API DE ASSINATURA
// ============================================================
/*
  INTEGRAÇÃO COM API DE ASSINATURA ELETRÔNICA
  ─────────────────────────────────────────────────────────────
  Este sistema está preparado para integrar com APIs reais
  como: Clicksign, ZapSign, D4Sign, DocuSign, etc.

  Estrutura esperada da requisição:
  ─────────────────────────────────
  POST /api/assinatura/registrar
  Headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer {API_KEY}"
  }
  Body: {
    "documento_tipo": "compromisso" | "responsabilidade" | "uso" | "privacidade",
    "signatario": {
      "nome": "Maria Silva",
      "email": "maria@email.com",
      "cpf": "000.000.000-00"
    },
    "assinatura_base64": "data:image/png;base64,...",
    "ip_signatario": "189.xxx.xxx.xxx",
    "timestamp": "2026-04-14T10:30:00-04:00",
    "aceite_termos": true,
    "user_agent": "Mozilla/5.0..."
  }

  Resposta esperada:
  ─────────────────
  {
    "success": true,
    "hash": "sha256:abc123...",
    "id_assinatura": "UUID",
    "pdf_url": "https://...",
    "timestamp_servidor": "2026-04-14T10:30:05Z"
  }
*/

const API_CONFIG = {
  endpoint: '/api/assinatura/registrar',   // <-- substitua pela URL real
  apiKey: 'SUA_API_KEY_AQUI',             // <-- substitua pela chave real
  modoDemo: true,                          // false em produção
};

// ============================================================
// DADOS DO USUÁRIO (da sessão)
// ============================================================
const userSession = JSON.parse(sessionStorage.getItem('una_user') || '{}');
const USER = {
  nome:  userSession.nome  || 'Usuário Demo',
  email: userSession.email || 'demo@una.com',
  cpf:   userSession.cpf   || '—',
};

// ============================================================
// ESTADO
// ============================================================
const ESTADO = {
  docAtivo: 'uso',
  leituraPct: 0,
  assinaturaFeita: false,
  hashAssinatura: null,
  canvasDirty: false,
  ipUsuario: '...',
};

// ============================================================
// MAPAS DE DOCUMENTOS
// ============================================================
const DOCS = {
  uso: {
    tag: 'Termos de Uso',
    titulo: 'Termos de <em>Uso e Condições</em>',
    secao: 'sec-uso',
    tab: 'tab-uso',
    sumario: [
      { id:'art-1', num:'01', txt:'Aceitação dos Termos' },
      { id:'art-2', num:'02', txt:'Definições e Partes' },
      { id:'art-3', num:'03', txt:'Cadastro e Conta' },
      { id:'art-4', num:'04', txt:'Regras de Agendamento' },
      { id:'art-5', num:'05', txt:'Política de Pagamentos' },
      { id:'art-6', num:'06', txt:'Condutas Vedadas' },
    ]
  },
  privacidade: {
    tag: 'Privacidade & LGPD',
    titulo: 'Privacidade e <em>Proteção de Dados</em>',
    secao: 'sec-privacidade',
    tab: 'tab-privacidade',
    sumario: [
      { id:'priv-1', num:'01', txt:'Controlador dos Dados' },
      { id:'priv-2', num:'02', txt:'Dados Coletados' },
      { id:'priv-3', num:'03', txt:'Direitos do Titular' },
      { id:'priv-4', num:'04', txt:'Retenção e Exclusão' },
    ]
  },
  compromisso: {
    tag: 'Termo de Compromisso',
    titulo: 'Termo de <em>Compromisso</em>',
    secao: 'sec-compromisso',
    tab: 'tab-compromisso',
    sumario: [
      { id:'comp-1', num:'01', txt:'Objeto do Compromisso' },
      { id:'comp-2', num:'02', txt:'Compromissos do Cliente' },
      { id:'comp-3', num:'03', txt:'Compromissos do Profissional' },
      { id:'comp-4', num:'04', txt:'Validade e Vigência' },
    ]
  },
  responsabilidade: {
    tag: 'Responsabilidade',
    titulo: 'Termo de <em>Responsabilidade</em>',
    secao: 'sec-responsabilidade',
    tab: 'tab-responsabilidade',
    sumario: [
      { id:'resp-1', num:'01', txt:'O que a Una garante' },
      { id:'resp-2', num:'02', txt:'Limitações' },
      { id:'resp-3', num:'03', txt:'Resolução de Disputas' },
      { id:'resp-4', num:'04', txt:'Legislação Aplicável' },
    ]
  },
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  preencherSignatario();
  obterIP();
  atualizarDateTime();
  setInterval(atualizarDateTime, 1000);
  iniciarCanvas();
  monitorarScroll();

  // Verificar query param ?tipo=
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get('tipo');
  if (tipo && DOCS[tipo]) mudarDoc(tipo);
  else mudarDoc('uso');

  // Checkboxes habilitam botão
  ['chk-li','chk-aceito'].forEach(id => {
    document.getElementById(id).addEventListener('change', verificarProntoParaAssinar);
  });
});

// ============================================================
// MUDAR DOCUMENTO
// ============================================================
function mudarDoc(tipo) {
  ESTADO.docAtivo = tipo;
  const doc = DOCS[tipo];

  // Atualizar hero
  document.getElementById('doc-hero-tag').textContent = doc.tag;
  document.getElementById('doc-hero-titulo').innerHTML = doc.titulo;

  // Tabs
  document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('ativo'));
  document.getElementById(doc.tab).classList.add('ativo');

  // Seções
  document.querySelectorAll('.doc-section').forEach(s => s.classList.remove('ativa'));
  document.getElementById(doc.secao).classList.add('ativa');

  // Sumário
  const lista = document.getElementById('sumario-list');
  lista.innerHTML = doc.sumario.map(s => `
    <li>
      <a href="#${s.id}" onclick="scrollArtigo('${s.id}')">
        <span class="sum-num">${s.num}</span>
        ${s.txt}
      </a>
    </li>
  `).join('');

  // Resetar leitura
  ESTADO.leituraPct = 0;
  atualizarLeituraUI();
  verificarProntoParaAssinar();
}

function scrollArtigo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// SIGNATÁRIO
// ============================================================
function preencherSignatario() {
  document.getElementById('assin-nome').textContent = USER.nome;
  document.getElementById('assin-email-txt').textContent = USER.email;
}

function atualizarDateTime() {
  const agora = new Date();
  const fmt = agora.toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit',
    timeZone: 'America/Manaus'
  });
  const el = document.getElementById('assin-datetime');
  if (el) el.textContent = fmt + ' (AMT)';
}

async function obterIP() {
  try {
    // Em produção, use seu próprio endpoint ou um serviço confiável
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    ESTADO.ipUsuario = d.ip;
    document.getElementById('assin-ip').textContent = 'IP: ' + d.ip;
  } catch {
    ESTADO.ipUsuario = '127.0.0.1';
    document.getElementById('assin-ip').textContent = 'IP: não disponível';
  }
}

// ============================================================
// PROGRESSO DE LEITURA (scroll)
// ============================================================
function monitorarScroll() {
  const conteudo = document.querySelector('.doc-conteudo');
  if (!conteudo) return;
  conteudo.addEventListener('scroll', calcularLeitura, { passive: true });
  document.addEventListener('scroll', calcularLeitura, { passive: true });
}

function calcularLeitura() {
  const docEl = document.documentElement;
  const scrolled = docEl.scrollTop || document.body.scrollTop;
  const total = docEl.scrollHeight - docEl.clientHeight;
  if (total <= 0) return;
  const pct = Math.min(100, Math.round((scrolled / total) * 100));
  if (pct > ESTADO.leituraPct) {
    ESTADO.leituraPct = pct;
    atualizarLeituraUI();
    verificarProntoParaAssinar();
  }
}

function atualizarLeituraUI() {
  document.getElementById('leitura-pct').textContent = ESTADO.leituraPct + '%';
  document.getElementById('leitura-barra').style.width = ESTADO.leituraPct + '%';
}

// ============================================================
// CANVAS DE ASSINATURA
// ============================================================
function iniciarCanvas() {
  const canvas = document.getElementById('assin-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Escala para retina
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr || 200 * dpr;
  canvas.height = 100 * dpr;
  ctx.scale(dpr, dpr);

  let desenhando = false;
  let ultimoX = 0, ultimoY = 0;

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const cl = e.touches ? e.touches[0] : e;
    return { x: (cl.clientX - r.left), y: (cl.clientY - r.top) };
  }

  function iniciar(e) {
    e.preventDefault();
    desenhando = true;
    const p = getPos(e);
    ultimoX = p.x; ultimoY = p.y;
    ctx.beginPath();
    ctx.moveTo(ultimoX, ultimoY);
    document.getElementById('canvas-placeholder').classList.add('oculto');
  }

  function desenhar(e) {
    if (!desenhando) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3D2B1A';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ultimoX = p.x; ultimoY = p.y;
    ESTADO.canvasDirty = true;
    verificarProntoParaAssinar();
  }

  function parar() { desenhando = false; }

  canvas.addEventListener('mousedown', iniciar);
  canvas.addEventListener('mousemove', desenhar);
  canvas.addEventListener('mouseup', parar);
  canvas.addEventListener('mouseleave', parar);
  canvas.addEventListener('touchstart', iniciar, { passive: false });
  canvas.addEventListener('touchmove', desenhar, { passive: false });
  canvas.addEventListener('touchend', parar);
}

function limparCanvas() {
  const canvas = document.getElementById('assin-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ESTADO.canvasDirty = false;
  document.getElementById('canvas-placeholder').classList.remove('oculto');
  verificarProntoParaAssinar();
}

// ============================================================
// VERIFICAR SE PODE ASSINAR
// ============================================================
function verificarProntoParaAssinar() {
  const chkLi     = document.getElementById('chk-li')?.checked;
  const chkAceito = document.getElementById('chk-aceito')?.checked;
  const pronto = chkLi && chkAceito && ESTADO.canvasDirty && ESTADO.leituraPct >= 30;
  const btn = document.getElementById('btn-assinar');
  if (btn) btn.disabled = !pronto || ESTADO.assinaturaFeita;

  // Dica visual
  const status = document.getElementById('assin-status-pendente');
  if (status) {
    if (!ESTADO.canvasDirty) status.querySelector('span') && (status.innerHTML = '<i class="bi bi-pen"></i> Adicione sua assinatura');
    else if (!chkLi || !chkAceito) status.innerHTML = '<i class="bi bi-check2-square"></i> Marque as confirmações';
    else if (ESTADO.leituraPct < 30) status.innerHTML = `<i class="bi bi-book"></i> Continue lendo (${ESTADO.leituraPct}% lido)`;
    else status.innerHTML = '<i class="bi bi-check-circle"></i> Pronto para assinar';
  }
}

// ============================================================
// MODAL DE CONFIRMAÇÃO
// ============================================================
function abrirModalAssinatura() {
  const doc = DOCS[ESTADO.docAtivo];
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
  document.getElementById('modal-resumo').innerHTML = `
    <div class="linha"><span class="key">Documento</span><span class="val">${doc.tag}</span></div>
    <div class="linha"><span class="key">Signatário</span><span class="val">${USER.nome}</span></div>
    <div class="linha"><span class="key">E-mail</span><span class="val">${USER.email}</span></div>
    <div class="linha"><span class="key">Data/Hora</span><span class="val">${agora}</span></div>
    <div class="linha"><span class="key">IP</span><span class="val">${ESTADO.ipUsuario}</span></div>
  `;
  document.getElementById('overlay-assin').classList.add('open');
}

function fecharModalAssin() {
  document.getElementById('overlay-assin').classList.remove('open');
}
function fecharModalAssinOutside(e) {
  if (e.target === document.getElementById('overlay-assin')) fecharModalAssin();
}

// ============================================================
// EXECUTAR ASSINATURA (chama API)
// ============================================================
async function executarAssinatura() {
  fecharModalAssin();
  const btn = document.getElementById('btn-assinar');
  btn.classList.add('carregando');

  // Capturar imagem do canvas
  const canvas = document.getElementById('assin-canvas');
  const assinaturaBase64 = canvas.toDataURL('image/png');

  // Montar payload
  const payload = {
    documento_tipo: ESTADO.docAtivo,
    signatario: {
      nome:  USER.nome,
      email: USER.email,
      cpf:   USER.cpf,
    },
    assinatura_base64: assinaturaBase64,
    ip_signatario:     ESTADO.ipUsuario,
    timestamp:         new Date().toISOString(),
    aceite_termos:     true,
    user_agent:        navigator.userAgent,
  };

  try {
    let resultado;

    if (API_CONFIG.modoDemo) {
      // ── MODO DEMO: simula chamada à API ──────────────────
      await new Promise(r => setTimeout(r, 1800));
      resultado = {
        success:           true,
        hash:              gerarHashDemo(payload),
        id_assinatura:     'UNA-' + Date.now(),
        pdf_url:           '#',
        timestamp_servidor: new Date().toISOString(),
      };
    } else {
      // ── PRODUÇÃO: chama API real ─────────────────────────
      const response = await fetch(API_CONFIG.endpoint, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + API_CONFIG.apiKey,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Erro na API: ' + response.status);
      resultado = await response.json();
    }

    // ── SUCESSO ──────────────────────────────────────────
    if (resultado.success) {
      ESTADO.assinaturaFeita = true;
      ESTADO.hashAssinatura  = resultado.hash;
      registrarAssinaturaUI(resultado);
    } else {
      throw new Error(resultado.message || 'Falha ao registrar assinatura.');
    }

  } catch (err) {
    btn.classList.remove('carregando');
    notif('Erro ao processar assinatura: ' + err.message);
    console.error('[Una Assinatura]', err);
  }
}

// ============================================================
// GERAR HASH DEMO (simulado, não criptograficamente seguro)
// ============================================================
function gerarHashDemo(payload) {
  const str = JSON.stringify(payload) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256:${h}${h}${h}${h}${h}${h}${h}${h}`.substring(0, 71);
}

// ============================================================
// ATUALIZAR UI APÓS ASSINATURA
// ============================================================
function registrarAssinaturaUI(resultado) {
  // Ocultar status pendente, mostrar assinado
  document.getElementById('assin-status-pendente').classList.remove('vis');
  document.getElementById('assin-status-assinado').classList.add('vis');
  document.getElementById('btn-assinar').classList.remove('carregando');
  document.getElementById('btn-assinar').disabled = true;
  document.getElementById('btn-assinar').innerHTML = '<i class="bi bi-patch-check-fill"></i> Documento assinado';
  document.getElementById('assin-acoes-extra').classList.add('vis');

  // Mostrar tela de sucesso no conteúdo
  document.querySelectorAll('.doc-section').forEach(s => s.classList.remove('ativa'));
  document.getElementById('assin-concluida').classList.add('vis');

  // Hash
  document.getElementById('hash-valor').textContent = resultado.hash;

  notif('Documento assinado com sucesso! ✓');
}

// ============================================================
// AÇÕES PÓS-ASSINATURA
// ============================================================
function baixarPDF() {
  // Em produção: window.open(resultado.pdf_url, '_blank')
  notif('Em produção: PDF gerado e enviado para ' + USER.email);
}

function compartilharWpp() {
  const msg = encodeURIComponent(
    `Olá! Acabei de assinar eletronicamente o documento da Una Instituto de Beleza.\n\nHash: ${ESTADO.hashAssinatura}`
  );
  window.open('https://wa.me/?text=' + msg, '_blank');
}

// ============================================================
// NOTIFICAÇÃO
// ============================================================
let notifTimer;
function notif(msg) {
  const n = document.getElementById('notif');
  document.getElementById('notif-txt').textContent = msg;
  n.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => n.classList.remove('show'), 3800);
}
