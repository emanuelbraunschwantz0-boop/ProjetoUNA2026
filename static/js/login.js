

function toggleSenha() {
  const inp = document.getElementById('inp-senha');
  const ico = document.getElementById('ico-senha');
  if(inp.type==='password'){inp.type='text';ico.className='bi bi-eye-slash';}
  else{inp.type='password';ico.className='bi bi-eye';}
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

async function fazerLogin() {
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
  const fd = new FormData();
  fd.append('email', email); fd.append('senha', senha);
  try {
    const r = await fetch(window.location.pathname, {
      method: 'POST', body: fd,
      headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value }
    });
    const d = await r.json();
    btn.classList.remove('carregando');
    if(!d.ok) { mostrarErro(d.erro || 'Não foi possível entrar.'); return; }
    window.location.href = d.redirect;
  } catch(e) {
    btn.classList.remove('carregando');
    mostrarErro('Falha de conexão. Tente novamente.');
  }
}

// Enter para logar
document.addEventListener('keydown', e => { if(e.key==='Enter') fazerLogin(); });

