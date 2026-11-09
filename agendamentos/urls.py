
from django.urls import path
from django.contrib.auth import views as auth_views

from . import api, views

app_name = "agendamentos"

urlpatterns = [
    # Páginas principais
    path("", views.home, name="home"),
    path("index.html", views.home, name="home_html"),
    path("sobre.html", views.sobre, name="sobre"),
    path("termos.html", views.termos, name="termos"),
    path("cadastro.html", views.cadastro, name="cadastro"),
    path("index_agenda.html", views.login_view, name="login"),
    path("index_inical.html", views.inicial, name="inicial"),
    path("agendamento.html", views.agendamento, name="agendamento"),

    # APIs
    path("api/dados/", api.dados, name="api_dados"),
    path("api/horarios/", api.horarios, name="api_horarios"),
    path("api/perfil/", api.perfil, name="api_perfil"),
    path("api/senha/", api.senha, name="api_senha"),
    path("api/agendar/", api.agendar, name="api_agendar"),
    path("api/agenda/", api.agenda, name="api_agenda"),
    path(
        "api/agendamento/<int:pk>/status/",
        api.mudar_status,
        name="api_status"
    ),
    path(
        "api/servicos/salvar/",
        api.servico_salvar,
        name="api_servico_salvar"
    ),
    path(
        "api/servicos/<int:pk>/excluir/",
        api.servico_excluir,
        name="api_servico_excluir"
    ),

    # Recuperação de senha
    path(
        "senha/redefinir/",
        views.SolicitarRedefinicao.as_view(),
        name="senha_redefinir"
    ),
    path(
        "senha/enviado/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="conta/redefinir_enviado.html"
        ),
        name="senha_enviada"
    ),
    path(
        "senha/nova/<uidb64>/<token>/",
        views.ConfirmarRedefinicao.as_view(),
        name="senha_confirmar"
    ),
    path(
        "senha/concluida/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="conta/redefinir_concluido.html"
        ),
        name="senha_concluida"
    ),

    # Outras funcionalidades
    path("sair/", views.sair, name="sair"),
    path("ficha-saude/", views.ficha_saude, name="ficha_saude"),
    path("termo/<int:pk>/", views.termo_detalhe, name="termo_detalhe"),
    path(
        "profissional/<int:pk>/",
        views.profissional_detalhe,
        name="profissional_detalhe"
    ),

    # CRUD de serviços
    path(
        "servicos/",
        views.ServicoListView.as_view(),
        name="servico_list"
    ),
    path(
        "servicos/novo/",
        views.ServicoCreateView.as_view(),
        name="servico_create"
    ),
    path(
        "servicos/<int:pk>/",
        views.ServicoDetailView.as_view(),
        name="servico_detail"
    ),
    path(
        "servicos/<int:pk>/editar/",
        views.ServicoUpdateView.as_view(),
        name="servico_update"
    ),
    path(
        "servicos/<int:pk>/excluir/",
        views.ServicoDeleteView.as_view(),
        name="servico_delete"
    ),
]
