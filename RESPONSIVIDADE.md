# Responsividade — o que foi feito

Só front-end (CSS/JS/HTML). Nada de banco, models, views ou URLs foi alterado.

## Arquivos novos
- `static/css/responsivo.css` — todas as regras para telas menores. É carregado POR ÚLTIMO em cada página, então só sobrescreve o necessário. Acima de 1100px nada muda.
- `static/js/menu-mobile.js` — cria o botão hambúrguer e o fundo escuro; em telas <= 900px o menu lateral vira uma gaveta.

## Breakpoints
| Largura | O que acontece |
|---|---|
| <= 1100px | paddings menores, serviços da home em 2 colunas, painel de assinatura dos termos passa a aparecer (antes sumia) |
| <= 900px | menu lateral vira gaveta; grids viram 1 coluna; hero deixa de ter altura fixa |
| <= 640px | tipografia e botões ajustados para o dedo; agenda semanal rola para o lado; tabela do CRUD rola para o lado |
| <= 400px | ajustes finos de padding |

## Como funciona o escopo
Cada página tem uma classe no `<body>` (`pg-home`, `pg-sobre`, `pg-agenda`, `pg-login`, `pg-cadastro`, `pg-termos`, `pg-crud`, `pg-simples`).
As regras em `responsivo.css` usam essa classe, então um ajuste nunca vaza para outra página.
Página nova? Coloque `<link rel="stylesheet" href="/static/css/responsivo.css">` por último no `<head>` e uma classe `pg-...` no `<body>`.

## Correções de HTML/CSS feitas junto (afetavam o layout)
- `agendamento.html`: `div.logo-wrap` nunca era fechada.
- `index.html`: `<main>` dentro de `<main>` sem fechamento.
- `profissional_detalhe.html`: faltava `<meta name="viewport">` (no celular aparecia em tamanho de desktop).
- `index.html`: `<i class="bi bi-geo-alt">Localização</i>` tinha texto dentro da tag do ícone.
- `index.html` (desktop): o rodapé ficava escondido atrás do menu lateral fixo.
- `crud.css`: usava `var(--marrom)` etc. sem definir; o cabeçalho da tabela ficava branco sobre branco.
- `servico_list.html`: tabela agora dentro de `.crud-tabela-wrap` (rolagem lateral no celular).

## Não mexido de propósito
- `index_inical.html` / `layout.css`: página antiga duplicada, sem nenhum link apontando para ela. Sugestão: apagar na fase de integração.
