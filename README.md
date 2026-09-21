# Projeto Integrador — versão Django

Projeto de agendamento de salão de beleza (cliente, profissional, serviços,
agendamento e pagamento), migrado do protótipo em HTML/CSS/JS para Django.

Este projeto cobre três atividades da disciplina:

1. **Criando os Models no Django** — `agendamentos/models.py`
2. **Landing Page** — a home (`index.html`) virou uma view Django que busca
   os serviços direto do banco, em vez de cartões fixos no HTML
3. **Rotas URL** — `agendamentos/urls.py`, com rotas nomeadas e uma rota
   dinâmica com parâmetro
4. **Cadastros com Class Based Views e ModelForm** — CRUD completo de
   `Servico` em `/servicos/`

> ⚠️ O enunciado completo dessas duas últimas atividades não estava
> disponível pra mim (fica atrás do login do Moodle/SUAP do IFRO). O que fiz
> abaixo segue o caminho mais comum desse tipo de atividade em cursos de
> Django. Se o professor pediu algo específico e diferente disso, me manda o
> enunciado (o `.docx`/`.pdf` da tarefa, ou o texto colado) que eu ajusto.

## Como rodar no PyCharm (já configurado)

Esse projeto já vem com as **Run Configurations do PyCharm** prontas (pasta
`.idea/`) e o **banco de dados já migrado e populado**
(`db.sqlite3` — inclui os serviços/especialidades iniciais e um usuário
admin). Você só precisa apontar o interpretador Python.

1. **Abra a pasta do projeto no PyCharm** (`File > Open`, selecione a pasta
   que tem o `manage.py` dentro).
2. **Configure o interpretador**: `File > Settings > Project > Python
   Interpreter` → engrenagem → `Add` → `Virtualenv Environment` → `New`.
   Deixe o PyCharm criar o `venv` para esse projeto.
3. O PyCharm normalmente detecta o `requirements.txt` sozinho e mostra um
   aviso ("Install requirements") no topo do editor — clique em **Install**.
   Se não aparecer, abra o terminal do PyCharm (aba **Terminal**, embaixo) e
   rode:
   ```
   pip install -r requirements.txt
   ```
4. **Rode o servidor** de um dos dois jeitos:
   - Pelo menu de Run Configurations, no canto superior direito, selecione
     **"Run Server"** e clique no ▶ verde (já vem configurada, roda
     `manage.py runserver`); ou
   - Pelo terminal do PyCharm:
     ```
     python manage.py runserver
     ```
5. Abra `http://127.0.0.1:8000/` no navegador. O painel admin fica em
   `http://127.0.0.1:8000/admin/` — login `admin`, senha `admin12345`
   (troque essa senha ou apague esse usuário antes de entregar/publicar o
   projeto, é só de conveniência para você testar).

Se mudar algo em `models.py`, gere e aplique a migração pelo terminal:
```
python manage.py makemigrations
python manage.py migrate
```
(ou use a Run Configuration **"Migrate"**, que já vem pronta para o
`manage.py migrate`).

## Como rodar manualmente (sem PyCharm)

```bash
# 1. Crie e ative um ambiente virtual (opcional, mas recomendado)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Rode as migrações (já vêm prontas em agendamentos/migrations/)
python manage.py migrate

# 4. Crie um usuário admin para acessar o painel /admin
python manage.py createsuperuser

# 5. Suba o servidor
python manage.py runserver
```

Depois é só acessar `http://127.0.0.1:8000/` no navegador — o site abre
exatamente como o protótipo original (index, sobre, termos, cadastro,
login e agenda), agora servido pelo Django.

O painel administrativo fica em `http://127.0.0.1:8000/admin/`.

## Estrutura

```
projetointegrador/     -> configurações do projeto Django (settings, urls)
agendamentos/           -> app com os models, admin e views
    models.py            -> Especialidade, Cliente, Profissional, Servico,
                            Agendamento, Pagamento
    admin.py              -> cadastro dos models no painel admin
    migrations/           -> migrações já geradas (0001_initial.py)
templates/               -> as páginas HTML do protótipo (viram templates)
static/css, static/js, static/img -> os mesmos arquivos do protótipo original
```

## Modelo de dados (resumo)

- **Especialidade** — nome (ex.: Corte de Cabelo, Coloração).
- **Cliente** — ligado 1-para-1 a um `User` (login). Guarda CPF, telefone,
  data de nascimento, gênero, CEP, foto.
- **Profissional** — também 1-para-1 com `User`. Tem uma relação
  muitos-para-muitos com `Especialidade`, além de horário de atendimento,
  apresentação e status de aprovação.
- **Servico** — nome, categoria, preço (`DecimalField`), duração em minutos.
- **Agendamento** — o "nó" central: `ForeignKey` para `Cliente`,
  `Profissional` e `Servico` (cada agendamento pertence a apenas um de cada),
  com `on_delete=PROTECT` para não perder o histórico se um cadastro for
  removido.
- **Pagamento** — `OneToOneField` com `Agendamento` (cada agendamento tem no
  máximo um pagamento), com `on_delete=CASCADE` (se o agendamento some, o
  pagamento dele some junto).

Esse desenho cobre os três tipos de relação trabalhados na atividade
"Criando os Models no Django": `ForeignKey` (1:N), `ManyToManyField` (N:N,
entre Profissional e Especialidade) e `OneToOneField` (1:1, entre User e os
perfis de Cliente/Profissional, e entre Agendamento e Pagamento).

## Landing Page (o que foi feito)

A página inicial (`index.html`) deixou de ter os cartões de serviço
"chumbados" no HTML. Agora ela é renderizada por uma view (`views.home`) que
busca os `Servico` ativos no banco e a seção `#servicos` faz um
`{% for servico in servicos %}` sobre esse resultado. Uma migração de dados
(`0003_seed_dados.py`) já popula o banco com as `Especialidade`s e os
`Servico`s que estavam no protótipo original, então a página abre com
conteúdo real assim que você roda `migrate`.

## Rotas URL (o que foi feito)

- As rotas do site saíram do `projetointegrador/urls.py` e foram para
  `agendamentos/urls.py`, incluído no projeto via `include()` — é o padrão
  do Django para organizar rotas por app.
- Todas as rotas têm **nome** (`name=`) e usam o **namespace**
  `agendamentos:` (ex.: `agendamentos:home`, `agendamentos:cadastro`).
- Os links internos dos templates (`<a href="...">`) foram trocados de
  caminho fixo (`href="sobre.html"`) para a tag `{% url %}`
  (`href="{% url 'agendamentos:sobre' %}"`), que é o jeito certo de gerar
  URLs no Django — se o caminho mudar no `urls.py`, o link se atualiza
  sozinho, sem precisar editar HTML.
- Foi adicionada uma **rota dinâmica**, com parâmetro capturado da própria
  URL: `profissional/<int:pk>/` → view `profissional_detalhe`. Ela usa um
  *path converter* (`<int:pk>`) para pegar o id do profissional direto da
  URL e buscar no banco com `get_object_or_404`.
- Os nomes de arquivo (`agendamento.html`, `index_agenda.html`, etc.) foram
  mantidos como caminho das rotas de propósito: o JavaScript original
  (`agendamento.js`, `login.js`, `inicial.js`) já faz
  `window.location.href = 'agendamento.html'` em vários pontos, então trocar
  esses caminhos quebraria os redirecionamentos que já existiam no
  protótipo.

## Cadastros com Class Based Views e ModelForm (o que foi feito)

CRUD completo de `Servico` em `/servicos/`, seguindo à risca o mapa do
slide (View → papel → template):

| View | Papel | Template |
|---|---|---|
| `ServicoListView` | Lista (com busca `?q=` e ordenação `?ordenar=`) | `servico_list.html` |
| `ServicoDetailView` | Mostra um registro | `servico_detail.html` |
| `ServicoCreateView` | Cria via formulário | `servico_form.html` |
| `ServicoUpdateView` | Altera via formulário | `servico_form.html` (mesmo do create) |
| `ServicoDeleteView` | Remove com confirmação | `servico_confirm_delete.html` |

- **`ServicoForm`** (`agendamentos/forms.py`) é um `ModelForm`: nasce do
  model (`Meta.model = Servico`), `fields` escolhe os campos que aparecem
  na tela, e a validação (obrigatoriedade, tamanho, tipo) vem herdada do
  próprio model — não foi reescrita à mão.
- **`ServicoListView.get_queryset()`** aplica a busca por nome
  (`?q=`) e a ordenação (`?ordenar=nome|-nome|preco|-preco|categoria`)
  antes de paginar. **`paginate_by = 6`** divide a listagem em páginas.
- **`success_url`** em cada view de escrita/exclusão manda de volta para
  `agendamentos:servico_list` depois de salvar ou excluir.
- Rotas em `agendamentos/urls.py`:
  `servicos/`, `servicos/novo/`, `servicos/<pk>/`,
  `servicos/<pk>/editar/`, `servicos/<pk>/excluir/`.
- Um link **"Gerenciar serviços"** foi adicionado no menu da home
  (`index.html`) apontando para essa listagem.
- Visual do CRUD em `static/css/crud.css`, reaproveitando a paleta de
  cores (`--marrom`, `--dourado`, `--creme`) já usada no resto do site.

> Escolhi `Servico` como a "entidade principal" pedida no roteiro do slide
> por ser a mais simples de demonstrar o CRUD completo sem depender de
> login (diferente de `Cliente`/`Profissional`, que exigem um `User`
> associado). Se o professor esperava o CRUD em outra entidade
> (`Cliente`, `Profissional` ou `Agendamento`, por exemplo), me avisa que
> eu adapto — a estrutura (forms.py + views baseadas em classe + templates)
> é a mesma para qualquer uma delas.

## Observação sobre login

O cadastro em `cadastro.html` ainda funciona só no front-end (JavaScript),
pois o formulário não está ligado ao banco de dados por enquanto. Os models
e o `/admin` já estão prontos para isso — o próximo passo natural do projeto
é criar as `views` e os `forms` do Django para salvar o cadastro e o
agendamento diretamente no banco.
