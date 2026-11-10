## Divisão do projeto em 4 partes

Cada integrante é dono de uma área do sistema. **Cada arquivo pertence a uma
única pessoa**: ninguém edita arquivo de outra parte. Quando precisar de algo
de outra área, é só importar e usar (somente leitura) ou pedir ao dono.

| Parte | Integrante | Área |
|---|---|---|
| 1 | André Felipe Souza da Silva | Agendamento (horários, reserva e agenda) |
| 2 | Lucas Lara Fonseca | Contas e acesso (cadastro, login, senha, perfil) |
| 3 | Emanuel Braun Schwantz | Ficha de saúde e termos |
| 4 | Rogerio Timm da Cruz | Site institucional e serviços |

---

### Passo 0 — Preparação (antes de todo mundo começar)

Hoje `models.py`, `views.py`, `forms.py`, `api.py`, `admin.py`, `urls.py`,
`tests.py` e `agendamento.html/js/css` misturam as 4 áreas. Para ninguém
mexer no mesmo arquivo, **uma pessoa (André) faz um commit único** separando
tudo conforme a tabela abaixo, sem mudar o comportamento. Depois do merge,
todos puxam a `main` e só então começam.

Arquivos a quebrar:

- `agendamentos/views.py` → `views_agendamento.py`, `views_conta.py`, `views_saude.py`, `views_site.py`
- `agendamentos/api.py` → `api_agendamento.py`, `api_conta.py`, `api_servicos.py`
- `agendamentos/forms.py` → `forms_conta.py`, `forms_saude.py`, `forms_servico.py`
- `agendamentos/models.py` → pacote `models/` (`conta.py`, `agendamento.py`, `saude.py`, `servico.py`) com `__init__.py` reexportando tudo
- `agendamentos/admin.py` → um arquivo de admin por parte
- `agendamentos/urls.py` → um arquivo de rotas por parte, incluídos no `urls.py` principal
- `agendamentos/tests.py` → um arquivo de testes por parte
- `templates/agendamento.html` → mantém só o esqueleto e passa a incluir `_secao_perfil.html` (Parte 2) e `_secao_servicos.html` (Parte 4)
- `static/js/agendamento.js` → mantém só o fluxo de agendamento; perfil e senha vão para `perfil.js` (Parte 2) e a gestão de serviços para `gestao_servicos.js` (Parte 4)
- `static/css/agenda.css` → o que for de perfil vai para `perfil.css` (Parte 2) e o que for de serviços para `gestao_servicos.css` (Parte 4)

Aproveitar o mesmo commit para tirar do repositório `venv/`, `db.sqlite3`,
`__pycache__/` e `.idea/` (e colocar no `.gitignore`).

---

### Parte 1 — André Felipe Souza da Silva: Agendamento

Responsável pelo coração do sistema: escolher serviço e profissional, calcular
horários livres, reservar sem conflito, acompanhar o histórico e a agenda do
profissional.

**Arquivos dele**
- Backend: `views_agendamento.py`, `api_agendamento.py` (`dados`, `horarios`, `agendar`, `agenda`, `mudar_status`), `urls_agendamento.py`, `admin_agendamento.py`, `tests_agendamento.py`
- Models: `models/agendamento.py` (`Agendamento`, `Pagamento`) e suas migrações (inclui a restrição de horário único)
- Front: `templates/agendamento.html` (esqueleto), `static/js/agendamento.js`, `static/css/agenda.css`

**Regras de negócio**
- Grade de horários conforme a duração do serviço, sem conflito entre agendamentos.
- Fluxo do cliente: serviço → profissional → data → horário → confirmação.
- Fluxo do profissional: agenda semanal, abrir evento, mudar status (confirmar, concluir, cancelar).
- Cliente só cancela o próprio agendamento.
- A agenda do profissional exibe um resumo da ficha de saúde do cliente (lê os dados da Parte 3, sem editar).

---

### Parte 2 — Lucas Lara Fonseca: Contas e acesso

Responsável por tudo que envolve a identidade do usuário: criar conta, entrar,
sair, recuperar senha, editar perfil e segurança geral.

**Arquivos dele**
- Backend: `views_conta.py` (`cadastro`, `login_view`, `sair`, redefinição de senha), `api_conta.py` (`perfil`, `senha`), `forms_conta.py` (`CadastroForm`, `PerfilForm`, `RedefinirForm`, `NovaSenhaForm`, validação de CPF), `urls_conta.py`, `admin_conta.py`, `tests_conta.py`
- Models: `models/conta.py` (`Especialidade`, `Cliente`, `Profissional`, `ConfigSalao`) e suas migrações
- Segurança: `middleware.py` e as configurações de segurança, e-mail e sessão em `settings.py`
- Front: `cadastro.html`, `cadastro.js`, `cadastro.css`, `index_agenda.html`, `login.js`, `login.css`, `templates/conta/*`, `conta.css`, `_secao_perfil.html`, `perfil.js`, `perfil.css`

**Regras de negócio**
- Cadastro de cliente e de funcionário (com senha de administrador).
- Profissional só entra depois de aprovado.
- Limite de tentativas de login, cadastro e redefinição.
- Redefinição de senha por e-mail com link de uso único.
- Upload e validação de foto de perfil.

---

### Parte 3 — Emanuel Braun Schwantz: Ficha de saúde e termos

Responsável pela parte legal e de segurança da cliente: termo de
responsabilidade, ficha de saúde e registro das assinaturas.

**Arquivos dele**
- Backend: `views_saude.py` (`ficha_saude`, `termo_detalhe`, `termos`), `forms_saude.py` (`FichaSaudeForm`), `textos.py`, `urls_saude.py`, `admin_saude.py`, `tests_saude.py`
- Models: `models/saude.py` (`FichaSaude`, `TermoAssinado`) e suas migrações
- Front: `ficha_saude.html`, `termo_assinado.html`, `termos.html`, `termos.js`, `termos.css`

**Regras de negócio**
- Ficha obrigatória antes da cliente conseguir agendar.
- Assinatura digital e registro do termo com IP, data, versão do texto e dados preenchidos.
- Termo assinado não pode ser alterado nem apagado.
- Cada pessoa só vê o próprio termo (equipe vê todos).

---

### Parte 4 — Rogerio Timm da Cruz: Site institucional e serviços

Responsável pela vitrine do salão e pelo cadastro de serviços.

**Arquivos dele**
- Backend: `views_site.py` (`home`, `sobre`, `inicial`, `profissional_detalhe`, CRUD de serviço), `api_servicos.py` (`servico_salvar`, `servico_excluir`), `forms_servico.py` (`ServicoForm`), `urls_site.py`, `admin_servico.py`, `tests_site.py`, `criar_demo.py`
- Models: `models/servico.py` (`Servico`) e suas migrações, incluindo a carga inicial de dados
- Front: `index.html`, `index_inical.html`, `sobre.html`, `profissional_detalhe.html`, `templates/agendamentos/*` (lista, detalhe, formulário e exclusão), `_secao_servicos.html`, `gestao_servicos.js`, `gestao_servicos.css`, `home.css`, `style.css`, `layout.css`, `layout_ts.css`, `crud.css`, `inicial.js`, `static/img/`

**Regras de negócio**
- Landing page com serviços ativos vindos do banco.
- Página de cada profissional aprovado.
- CRUD de serviços com busca, ordenação e paginação, restrito à equipe e a profissionais aprovados.

---

### Combinados para não gerar conflito

1. **Pontos de contato fixos.** `Cliente`, `Profissional` e `Servico` são usados por todas as partes. Quem é dono só pode *adicionar* campos, nunca renomear ou remover, e avisa o grupo antes.
2. **Migrações.** Cada um cria migrações apenas dos seus models. Se duas migrações saírem com o mesmo número, rodar `python manage.py makemigrations --merge`.
3. **Rotas.** Cada parte mantém suas rotas no próprio `urls_*.py`. Os nomes (`agendamentos:...`) não mudam sem avisar.
4. **Uma branch por parte** (`parte-1-agendamento`, `parte-2-contas`, `parte-3-saude`, `parte-4-site`). Pull request para a `main` só com arquivos da própria área.
5. **Testes.** Cada um escreve e mantém os testes da própria parte, e `python manage.py test` precisa passar antes de abrir o pull request.
