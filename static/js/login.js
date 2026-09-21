
// Usuários simulados
const usuarios = {
  'cliente@una.com':   {senha:'123456', tipo:'cliente',      nome:'Maria Silva'},
  'prof@una.com':      {senha:'123456', tipo:'profissional',  nome:'Carla Mendes'},
  'juliana@una.com':   {senha:'123456', tipo:'profissional',  nome:'Juliana Ramos'},
  'beatriz@una.com':   {senha:'123456', tipo:'profissional',  nome:'Beatriz Costa'},
};

let tipoAtual = 'cliente';

function setTipo(t) {
  tipoAtual = t;
  document.getElementById('tab-cliente').classList.toggle('ativo', t==='cliente');
  document.getElementById('tab-profissional').classList.toggle('ativo', t==='profissional');
  limparErros();
}

function toggleSenha() {
  const inp = document.getElementById('inp-senha');
  const ico = document.getElementById('ico-senha');
  if(inp.type==='password'){inp.type='text';ico.className='bi bi-eye-slash';}
  else{inp.type='password';ico.className='bi bi-eye';}
}

function preencher(email, senha, tipo) {
  document.getElementById('inp-email').value = email;
  document.getElementById('inp-senha').value = senha;
  setTipo(tipo);
}

function limparErros() {
  document.getElementById('alerta-erro').classList.remove('visivel');
  document.getElementById('erro-email').style.display='none';
  document.getElementById('erro-senha').style.display='none';
  document.getElementById('inp-email').style.borderColor='';
  document.getElementById('inp-senha').style.borderColor='';
}

function mostrarErro(msg) {
  document.getElementById('alerta-msg').textContent = msg;
  document.getElementById('alerta-erro').classList.add('visivel');
}

function fazerLogin() {
  limparErros();
  const email = document.getElementById('inp-email').value.trim();
  const senha = document.getElementById('inp-senha').value;
  let ok = true;

  if(!email || !email.includes('@')) {
    document.getElementById('erro-email').style.display='block';
    document.getElementById('inp-email').style.borderColor='#C0392B';
    ok = false;
  }
  if(!senha) {
    document.getElementById('erro-senha').style.display='block';
    document.getElementById('inp-senha').style.borderColor='#C0392B';
    ok = false;
  }
  if(!ok) return;

  const btn = document.getElementById('btn-entrar');
  btn.classList.add('carregando');

  setTimeout(() => {
    btn.classList.remove('carregando');
    const user = usuarios[email];
    if(!user || user.senha !== senha) {
      mostrarErro('E-mail ou senha incorretos. Tente novamente.');
      return;
    }
    if(user.tipo !== tipoAtual) {
      mostrarErro(`Esta conta é do tipo "${user.tipo}". Por favor selecione o perfil correto.`);
      return;
    }
    // Salvar sessão e redirecionar
    sessionStorage.setItem('una_user', JSON.stringify({email, nome:user.nome, tipo:user.tipo}));
    window.location.href = 'agendamento.html';
  }, 1200);
}

// Enter para logar
document.addEventListener('keydown', e => { if(e.key==='Enter') fazerLogin(); });

// Verificar se já logado
if(sessionStorage.getItem('una_user')) window.location.href='agendamento.html';
