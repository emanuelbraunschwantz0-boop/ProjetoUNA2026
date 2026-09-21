# Una — Instituto de Beleza

Sistema de agendamento para salão de beleza (cliente, profissional, serviços,
agendamento e pagamento), desenvolvido em **Django** como Projeto Integrador
do curso.

O protótipo original em HTML/CSS/JS foi migrado para Django: as páginas
continuam com a mesma cara, mas agora são views que buscam os dados no
banco em vez de conteúdo fixo no HTML.

## Funcionalidades

- **Landing page** com os serviços do salão carregados direto do banco.
- **CRUD completo de Serviço** (`/servicos/`), com busca, ordenação e
  paginação, usando Class Based Views + `ModelForm`.
- **Página dinâmica de profissional** (`/profissional/<id>/`), usando rota
  com parâmetro.
- **Painel administrativo** do Django (`/admin/`) para gerenciar todos os
  cadastros.
- Páginas de cadastro, login, agenda, sobre e termos, herdadas do
  protótipo original.

## Tecnologias

- Python / Django (>=5.0, <7.0)
- Pillow (upload de imagens — fotos de cliente e profissional)
- SQLite (banco de dados padrão do projeto)
- HTML, CSS e JavaScript (templates e estáticos do protótipo original)

## Como rodar o projeto

O banco já vem migrado e populado (`db.sqlite3`), então basta instalar as
dependências e subir o servidor.

```bash
# 1. Crie e ative um ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Aplique as migrações
python manage.py migrate

# 4. (opcional) crie um usuário admin próprio
python manage.py createsuperuser

# 5. Suba o servidor
python manage.py runserver
```

Depois acesse:

- Site: `http://127.0.0.1:8000/`
- Painel admin: `http://127.0.0.1:8000/admin/`
  (usuário de conveniência já incluso: `admin` / `admin12345` — troque ou
  apague antes de entregar/publicar o projeto)

### Rodando pelo PyCharm

O projeto já vem com as Run Configurations do PyCharm prontas (`.idea/`):

1. Abra a pasta do projeto (`File > Open`, escolha a pasta com o
   `manage.py`).
2. Configure o interpretador em
   `File > Settings > Project > Python Interpreter` → `Add` →
   `Virtualenv Environment` → `New`.
3. Instale as dependências pelo aviso do editor ou pelo terminal do
   PyCharm (`pip install -r requirements.txt`).
4. Rode com a configuração **"Run Server"** (▶ verde) ou pelo terminal:
   `python manage.py runserver`.

Se alterar `models.py`, gere e aplique a migração:

```bash
python manage.py makemigrations
python manage.py migrate
```

(ou use a Run Configuration **"Migrate"**)

## Estrutura do projeto

```
projetointegrador/   -> configurações do projeto (settings, urls)
agendamentos/         -> app principal
    models.py           -> Especialidade, Cliente, Profissional, Servico,
                           Agendamento, Pagamento
    views.py             -> views das páginas + CRUD de Serviço (CBVs)
    forms.py             -> ServicoForm (ModelForm)
    urls.py               -> rotas do app, com namespace "agendamentos"
    admin.py              -> cadastro dos models no painel admin
    migrations/           -> migrações, incluindo seed de dados iniciais
templates/             -> páginas HTML (templates Django)
static/css, static/js, static/img -> arquivos estáticos do protótipo original
```

## Modelo de dados

| Model | Descrição | Relações |
|---|---|---|
| `Especialidade` | Ex.: Corte de Cabelo, Coloração | — |
| `Cliente` | Perfil de cliente | 1:1 com `User` |
| `Profissional` | Perfil de profissional | 1:1 com `User`; N:N com `Especialidade` |
| `Servico` | Nome, categoria, preço, duração | — |
| `Agendamento` | Nó central: cliente + profissional + serviço | FK (1:N) para os três |
| `Pagamento` | Pagamento de um agendamento | 1:1 com `Agendamento` |

`Agendamento` usa `on_delete=PROTECT` nas suas relações (não perde
histórico se um cadastro for removido); `Pagamento` usa `on_delete=CASCADE`
com `Agendamento` (some junto se o agendamento for removido).

## Rotas principais

| Rota | View | Nome |
|---|---|---|
| `/` | `home` | `agendamentos:home` |
| `/sobre.html` | `sobre` | `agendamentos:sobre` |
| `/cadastro.html` | `cadastro` | `agendamentos:cadastro` |
| `/index_agenda.html` | `login_view` | `agendamentos:login` |
| `/agendamento.html` | `agendamento` | `agendamentos:agendamento` |
| `/profissional/<id>/` | `profissional_detalhe` | `agendamentos:profissional_detalhe` |
| `/servicos/` | `ServicoListView` | `agendamentos:servico_list` |
| `/servicos/novo/` | `ServicoCreateView` | `agendamentos:servico_create` |
| `/servicos/<id>/` | `ServicoDetailView` | `agendamentos:servico_detail` |
| `/servicos/<id>/editar/` | `ServicoUpdateView` | `agendamentos:servico_update` |
| `/servicos/<id>/excluir/` | `ServicoDeleteView` | `agendamentos:servico_delete` |

Os nomes de arquivo das rotas (`sobre.html`, `agendamento.html` etc.) foram
mantidos de propósito: o JavaScript original (`agendamento.js`, `login.js`,
`inicial.js`) faz `window.location.href = 'agendamento.html'` em vários
pontos, e trocar esses caminhos quebraria os redirecionamentos já
existentes no protótipo.

## Observações

- O formulário de `cadastro.html` ainda funciona só no front-end
  (JavaScript) — não está ligado ao banco ainda. Os models e o `/admin`
  já estão prontos para isso; o próximo passo natural é criar as views e
  forms Django que salvam cadastro e agendamento diretamente no banco.
- `Servico` foi escolhido como entidade do CRUD por ser a mais simples de
  demonstrar sem depender de login (diferente de `Cliente`/`Profissional`,
  que exigem um `User` associado).
