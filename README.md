# Projeto UNA 2026

Sistema web de **agendamento para salão de beleza**, desenvolvido em grupo como projeto integrador da UNA em 2026. Clientes criam conta, preenchem a ficha de saúde, assinam o termo de responsabilidade e reservam horários com os profissionais. A equipe do salão gerencia agenda, serviços e cadastros.

---

## Funcionalidades

**Para a cliente**
- Cadastro, login, recuperação de senha por e-mail e edição de perfil (com foto)
- Ficha de saúde e termo de responsabilidade com assinatura digital, obrigatórios antes do primeiro agendamento
- Agendamento em etapas: serviço → profissional → data → horário → confirmação
- Histórico de agendamentos e cancelamento dos próprios horários

**Para profissionais e equipe**
- Agenda semanal com resumo da ficha de saúde da cliente
- Confirmação, conclusão e cancelamento de atendimentos
- Cadastro de funcionários com aprovação e senha de administrador
- Gestão de serviços (criar, editar, excluir, buscar, ordenar e paginar)

**Site institucional**
- Página inicial com os serviços ativos, vindos do banco de dados
- Página "Sobre" e página individual de cada profissional aprovado

## Regras de negócio

- Os horários seguem a duração de cada serviço e nunca entram em conflito com outros agendamentos.
- A ficha de saúde é obrigatória antes de agendar.
- O termo assinado registra IP, data, versão do texto e dados preenchidos, e **não pode ser alterado nem apagado**.
- Cada pessoa vê apenas o próprio termo; a equipe vê todos.
- Profissionais só acessam o sistema depois de aprovados.
- Há limite de tentativas em login, cadastro e redefinição de senha.
- A redefinição de senha usa link de uso único enviado por e-mail.

## Tecnologias

- **Python / Django**
- **SQLite** como banco de dados
- **HTML, CSS e JavaScript** no front-end (templates Django e arquivos estáticos)
- **Vercel** para publicação

## Estrutura do projeto

```
ProjetoUNA2026/
├── agendamentos/        # App principal (models, views, APIs, forms, rotas, admin e testes)
├── projetointegrador/   # Configurações do projeto Django
├── templates/           # Páginas HTML
├── static/              # CSS, JavaScript e imagens
├── media/               # Arquivos enviados (ex.: fotos de perfil)
├── criar_demo.py        # Script para popular dados de demonstração
├── manage.py
├── requirements.txt
└── DIVISAO_DO_PROJETO.md
```


## Equipe e divisão do trabalho

O sistema foi dividido em quatro áreas. Cada integrante é responsável por uma delas, e cada arquivo pertence a uma única pessoa.

| Integrante | Área | O que desenvolveu |
| --- | --- | --- |
| **André Felipe Souza da Silva** | Agendamento | Grade de horários sem conflito, fluxo de reserva da cliente, agenda semanal do profissional, mudança de status (confirmar, concluir, cancelar), histórico e pagamentos. Models `Agendamento` e `Pagamento`; front em `agendamento.html`, `agendamento.js` e `agenda.css`. |
| **Lucas Lara Fonseca** | Contas e acesso | Cadastro de clientes e funcionários, login e logout, redefinição de senha por e-mail, edição de perfil com upload de foto, validação de CPF, limite de tentativas e aprovação de profissionais. Models `Especialidade`, `Cliente`, `Profissional` e `ConfigSalao`; middleware e configurações de segurança, e-mail e sessão. |
| **Emanuel Braun Schwantz** | Ficha de saúde e termos | Ficha de saúde obrigatória, termo de responsabilidade com assinatura digital e registro imutável das assinaturas (IP, data, versão do texto), controle de acesso aos termos. Models `FichaSaude` e `TermoAssinado`; telas `ficha_saude.html`, `termo_assinado.html` e `termos.html`. |
| **Rogerio Timm da Cruz** | Site institucional e serviços | Landing page com serviços ativos, páginas "Sobre" e de cada profissional, CRUD de serviços com busca, ordenação e paginação, dados de demonstração (`criar_demo.py`) e identidade visual (CSS e imagens). Model `Servico`. |

Os detalhes completos, com a lista de arquivos de cada parte, estão em [DIVISAO_DO_PROJETO.md](DIVISAO_DO_PROJETO.md).

### Combinados do grupo

- `Cliente`, `Profissional` e `Servico` são usados por todas as partes: o dono só pode **adicionar** campos, nunca renomear ou remover, e avisa o grupo antes.
- Cada integrante cria migrações apenas dos seus próprios models.
- Cada parte mantém suas rotas no próprio arquivo `urls_*.py`.
- Uma branch por parte (`parte-1-agendamento`, `parte-2-contas`, `parte-3-saude`, `parte-4-site`), com pull request para a `main` contendo só arquivos da própria área.
- Cada um escreve e mantém os testes da sua parte, e `python manage.py test` precisa passar antes do pull request.