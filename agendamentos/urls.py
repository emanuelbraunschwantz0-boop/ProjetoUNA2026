from django.urls import path

from . import views

app_name = "agendamentos"

urlpatterns = [
    # Rotas "estáticas" — uma para cada página do protótipo.
    # Mantemos os mesmos nomes de arquivo (index.html, sobre.html, ...)
    # porque o JavaScript original (agendamento.js, login.js, inicial.js)
    # já faz window.location.href='agendamento.html' etc — trocar esses
    # caminhos quebraria os redirecionamentos existentes.
    path("", views.home, name="home"),
    path("index.html", views.home, name="home_html"),
    path("sobre.html", views.sobre, name="sobre"),
    path("termos.html", views.termos, name="termos"),
    path("cadastro.html", views.cadastro, name="cadastro"),
    path("index_agenda.html", views.login_view, name="login"),
    path("index_inical.html", views.inicial, name="inicial"),
    path("agendamento.html", views.agendamento, name="agendamento"),

    # Rota dinâmica, com parâmetro capturado da URL (path converter <int:pk>).
    # Ex.: /profissional/3/  ->  abre a página da profissional de id 3.
    path("profissional/<int:pk>/", views.profissional_detalhe, name="profissional_detalhe"),

    # -----------------------------------------------------------------
    # CRUD de Serviço com Class Based Views (Aula 09)
    # -----------------------------------------------------------------
    path("servicos/", views.ServicoListView.as_view(), name="servico_list"),
    path("servicos/novo/", views.ServicoCreateView.as_view(), name="servico_create"),
    path("servicos/<int:pk>/", views.ServicoDetailView.as_view(), name="servico_detail"),
    path("servicos/<int:pk>/editar/", views.ServicoUpdateView.as_view(), name="servico_update"),
    path("servicos/<int:pk>/excluir/", views.ServicoDeleteView.as_view(), name="servico_delete"),
]
