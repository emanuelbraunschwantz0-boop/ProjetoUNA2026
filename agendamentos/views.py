from django.shortcuts import get_object_or_404, render
from django.urls import reverse_lazy
from django.views.generic import (
    CreateView,
    DeleteView,
    DetailView,
    ListView,
    UpdateView,
)

from .forms import ServicoForm
from .models import Profissional, Servico


def home(request):
    """Landing page (index.html) — traz os serviços ativos direto do banco."""
    servicos = Servico.objects.filter(ativo=True)
    return render(request, "index.html", {"servicos": servicos})


def sobre(request):
    return render(request, "sobre.html")


def termos(request):
    return render(request, "termos.html")


def cadastro(request):
    return render(request, "cadastro.html")


def login_view(request):
    return render(request, "index_agenda.html")


def inicial(request):
    servicos = Servico.objects.filter(ativo=True)
    return render(request, "index_inical.html", {"servicos": servicos})


def agendamento(request):
    servicos = Servico.objects.filter(ativo=True)
    profissionais = Profissional.objects.filter(aprovado=True)
    return render(
        request,
        "agendamento.html",
        {"servicos": servicos, "profissionais": profissionais},
    )


def profissional_detalhe(request, pk):
    """Rota com parâmetro: /profissional/<pk>/ — demonstra path converter <int:pk>."""
    profissional = get_object_or_404(Profissional, pk=pk, aprovado=True)
    return render(request, "profissional_detalhe.html", {"profissional": profissional})


# ---------------------------------------------------------------------------
# CRUD de Serviço com Class Based Views + ModelForm
# (Aula 09 — Cadastros com Class Based Views e ModelForm)
# ---------------------------------------------------------------------------


class ServicoListView(ListView):
    """READ (lista). Suporta busca (?q=) e ordenação (?ordenar=campo)
    através de get_queryset(), além de paginação com paginate_by."""

    model = Servico
    template_name = "agendamentos/servico_list.html"
    context_object_name = "servicos"
    paginate_by = 6

    ORDENACOES_VALIDAS = ["nome", "-nome", "preco", "-preco", "categoria"]

    def get_queryset(self):
        queryset = Servico.objects.all()

        termo = self.request.GET.get("q", "").strip()
        if termo:
            queryset = queryset.filter(nome__icontains=termo)

        ordenar = self.request.GET.get("ordenar", "nome")
        if ordenar not in self.ORDENACOES_VALIDAS:
            ordenar = "nome"
        queryset = queryset.order_by(ordenar)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # devolve pro template o que foi digitado/escolhido, pra manter
        # o campo de busca e a ordenação selecionada entre uma página e outra
        context["q"] = self.request.GET.get("q", "")
        context["ordenar"] = self.request.GET.get("ordenar", "nome")
        return context


class ServicoDetailView(DetailView):
    """READ (detalhe de um único registro)."""

    model = Servico
    template_name = "agendamentos/servico_detail.html"
    context_object_name = "servico"


class ServicoCreateView(CreateView):
    """CREATE — usa o ModelForm para gerar e validar o formulário."""

    model = Servico
    form_class = ServicoForm
    template_name = "agendamentos/servico_form.html"
    success_url = reverse_lazy("agendamentos:servico_list")


class ServicoUpdateView(UpdateView):
    """UPDATE — mesmo form e mesmo template do CREATE."""

    model = Servico
    form_class = ServicoForm
    template_name = "agendamentos/servico_form.html"
    success_url = reverse_lazy("agendamentos:servico_list")


class ServicoDeleteView(DeleteView):
    """DELETE — exige confirmação antes de excluir."""

    model = Servico
    template_name = "agendamentos/servico_confirm_delete.html"
    context_object_name = "servico"
    success_url = reverse_lazy("agendamentos:servico_list")
