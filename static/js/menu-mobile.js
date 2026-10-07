/* ============================================================
   Menu lateral responsivo (gaveta) — Una Instituto de Beleza
   Em telas <= 900px o menu lateral fica escondido e abre pelo
   botão "hambúrguer". Funciona com .menu (home/sobre) e .sidebar
   (agendamento). O botão e o fundo escuro são criados aqui, então
   basta incluir este script na página.
   ============================================================ */
(function () {
  var menu = document.querySelector('.menu, .sidebar');
  if (!menu) return;

  if (!menu.id) menu.id = 'menu-principal';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-toggle';
  btn.setAttribute('aria-label', 'Abrir menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', menu.id);
  btn.innerHTML = '<span class="menu-toggle-barras" aria-hidden="true"></span>';

  var fundo = document.createElement('div');
  fundo.className = 'menu-backdrop';

  document.body.appendChild(btn);
  document.body.appendChild(fundo);

  function definir(aberto) {
    document.body.classList.toggle('menu-aberto', aberto);
    btn.setAttribute('aria-expanded', String(aberto));
    btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  }

  btn.addEventListener('click', function () {
    definir(!document.body.classList.contains('menu-aberto'));
  });

  fundo.addEventListener('click', function () { definir(false); });

  // fecha ao escolher um item (links e botões do menu, inclusive os criados por JS)
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) definir(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') definir(false);
  });

  // se a tela voltar a ser grande, garante o menu fechado/resetado
  var larga = window.matchMedia('(min-width: 901px)');
  var aoMudar = function (e) { if (e.matches) definir(false); };
  if (larga.addEventListener) larga.addEventListener('change', aoMudar);
  else if (larga.addListener) larga.addListener(aoMudar);
})();
