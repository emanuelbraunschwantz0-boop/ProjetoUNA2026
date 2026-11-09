from django.contrib.auth import views as auth_views
from django.core.cache import cache
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db import IntegrityError, transaction
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from django.views.generic import (
    CreateView,
    DeleteView,
    DetailView,
    ListView,
    UpdateView,
)

from . import textos
from .forms import CadastroForm, FichaSaudeForm, NovaSenhaForm, RedefinirForm, ServicoForm
from .models import (
    CONDICOES, SIM_NAO, FichaSaude, Profissional, Servico, TermoAssinado,
)


def _excedeu(chave, maximo):
    return cache.get(chave, 0) >= maximo


def _contar(chave, janela):
    try:
        cache.incr(chave)
    except ValueError:
        cache.set(chave, 1, janela)


def home(request):
    """Landing page (index.html) — traz os serviços ativos direto do banco."""
    servicos = Servico.objects.filter(ativo=True)
    return render(request, "index.html", {"servicos": servicos})


def sobre(request):
    return redirect(reverse("agendamentos:home") + "#sobre")  # seção Sobre da nova home (responsiva)


def termos(request):
    return render(request, "termos.html")


def cadastro(request):
    if request.method == "POST":
        ip = request.META.get("REMOTE_ADDR")
        if _excedeu(f"cad:{ip}", 10):  # no máximo 10 contas novas por hora por IP
            return JsonResponse(
                {"ok": False, "erros": {"cadastro": "Muitos cadastros deste dispositivo. Tente mais tarde."}},
                status=429)
        chave = f"adm:{ip}"
        if request.POST.get("funcionario") and cache.get(chave, 0) >= 5:
            return JsonResponse(
                {"ok": False, "erros": {"senha_adm": "Muitas tentativas. Aguarde 15 minutos."}}, status=429)
        form = CadastroForm(request.POST, request.FILES)
        if not form.is_valid():
            if "senha_adm" in form.errors:
                cache.set(chave, cache.get(chave, 0) + 1, 900)
            erros = {c: " ".join(e) for c, e in form.errors.items()}
            return JsonResponse({"ok": False, "erros": erros}, status=400)
        try:
            user = form.save(request)
        except IntegrityError:  # duas pessoas cadastrando o mesmo e-mail/CPF ao mesmo tempo
            return JsonResponse(
                {"ok": False, "erros": {"cadastro": "E-mail ou CPF já cadastrado."}}, status=400)
        _contar(f"cad:{ip}", 3600)
        if not form.cleaned_data["funcionario"]:
            login(request, user)
            destino = reverse("agendamentos:ficha_saude")
        else:
            destino = reverse("agendamentos:login")
        return JsonResponse({"ok": True, "redirect": destino})
    return render(request, "cadastro.html")


def login_view(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()[:254]
        ip = request.META.get("REMOTE_ADDR")
        chave = f"login:{ip}:{email}"
        if _excedeu(chave, 5) or _excedeu(f"loginip:{ip}", 30):  # proteção contra tentativa de adivinhar senha
            return JsonResponse(
                {"ok": False, "erro": "Muitas tentativas. Aguarde 15 minutos."}, status=429)
        user = authenticate(request, username=email, password=request.POST.get("senha", ""))
        if not user:
            cache.set(chave, cache.get(chave, 0) + 1, 900)
            _contar(f"loginip:{ip}", 900)
            return JsonResponse({"ok": False, "erro": "E-mail ou senha incorretos."}, status=400)
        cache.delete(chave)
        perfil = "profissional" if hasattr(user, "profissional") else (
            "cliente" if hasattr(user, "cliente") else None)
        if perfil is None and not user.is_staff:
            return JsonResponse({"ok": False, "erro": "Conta sem perfil ativo."}, status=403)
        if perfil == "profissional" and not user.profissional.aprovado:
            return JsonResponse(
                {"ok": False, "erro": "Sua conta profissional ainda está em análise."}, status=403)
        login(request, user)
        return JsonResponse({"ok": True, "redirect": reverse("agendamentos:agendamento")})
    if request.user.is_authenticated:
        return redirect("agendamentos:agendamento")
    return render(request, "index_agenda.html")


@require_POST
def sair(request):
    logout(request)
    return redirect("agendamentos:home")


def inicial(request):
    return redirect("agendamentos:home")


@never_cache
@login_required
def agendamento(request):
    u = request.user
    cliente = getattr(u, "cliente", None)
    prof = getattr(u, "profissional", None)
    if cliente and not hasattr(cliente, "ficha_saude"):
        return redirect("agendamentos:ficha_saude")  # ficha obrigatória antes de agendar
    if prof and not prof.aprovado:
        logout(request)
        return redirect("agendamentos:login")
    perfil = cliente or prof
    if not perfil:
        return redirect("admin:index")
    sessao = {
        "email": u.email,
        "nome": perfil.nome_completo if perfil else u.get_username(),
        "tipo": "profissional" if prof else "cliente",
        "foto": perfil.foto.url if perfil.foto else "",
    }
    servicos = Servico.objects.filter(ativo=True)
    profissionais = Profissional.objects.filter(aprovado=True)
    return render(
        request,
        "agendamento.html",
        {"servicos": servicos, "profissionais": profissionais, "sessao": sessao},
    )


@never_cache
@login_required
def ficha_saude(request):
    """Tela de termo de responsabilidade + ficha de saúde (nail designer)."""
    cliente = getattr(request.user, "cliente", None)
    if not cliente:
        return redirect("agendamentos:agendamento")
    ficha = getattr(cliente, "ficha_saude", None)
    texto = textos.texto_termo_saude(cliente.nome_completo)

    if request.method == "POST":
        form = FichaSaudeForm(request.POST)
        if form.is_valid():
            d = form.cleaned_data
            dados = {c: d[c] for c, _ in CONDICOES}
            extras = {k: d[k] for k in ("alergias", "medicamentos", "outras_doencas")}
            with transaction.atomic():
                FichaSaude.objects.update_or_create(
                    cliente=cliente, defaults={"respostas": dados, **extras})
                termo = TermoAssinado.registrar(
                    request, "saude", textos.VERSAO, texto,
                    {"respostas": dados, **extras, "cpf": cliente.cpf}, d["assinatura"])
            return redirect("agendamentos:termo_detalhe", pk=termo.pk)
    else:
        inicial_ = {**ficha.respostas, "alergias": ficha.alergias,
                    "medicamentos": ficha.medicamentos,
                    "outras_doencas": ficha.outras_doencas} if ficha else None
        form = FichaSaudeForm(initial=inicial_)
    return render(request, "ficha_saude.html", {"form": form, "texto": texto})


@never_cache
@login_required
def termo_detalhe(request, pk):
    termo = get_object_or_404(TermoAssinado, pk=pk)
    if termo.usuario_id != request.user.pk and not request.user.is_staff:
        raise Http404
    rot, sn = dict(CONDICOES), dict(SIM_NAO)
    respostas = [(rot[k], sn.get(v, v)) for k, v in termo.dados.get("respostas", {}).items() if k in rot]
    return render(request, "termo_assinado.html", {"termo": termo, "respostas": respostas})


def profissional_detalhe(request, pk):
    """Rota com parâmetro: /profissional/<pk>/ — demonstra path converter <int:pk>."""
    profissional = get_object_or_404(Profissional, pk=pk, aprovado=True)
    return render(request, "profissional_detalhe.html", {"profissional": profissional})


class AcessoGestaoMixin(LoginRequiredMixin, UserPassesTestMixin):
    """CRUD de serviços: só equipe (staff) ou profissional aprovado."""

    def test_func(self):
        u = self.request.user
        p = getattr(u, "profissional", None)
        return u.is_staff or bool(p and p.aprovado)


# ---------------------------------------------------------------------------
# CRUD de Serviço com Class Based Views + ModelForm
# (Aula 09 — Cadastros com Class Based Views e ModelForm)
# ---------------------------------------------------------------------------


class ServicoListView(AcessoGestaoMixin, ListView):
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


class ServicoDetailView(AcessoGestaoMixin, DetailView):
    """READ (detalhe de um único registro)."""

    model = Servico
    template_name = "agendamentos/servico_detail.html"
    context_object_name = "servico"


class ServicoCreateView(AcessoGestaoMixin, CreateView):
    """CREATE — usa o ModelForm para gerar e validar o formulário."""

    model = Servico
    form_class = ServicoForm
    template_name = "agendamentos/servico_form.html"
    success_url = reverse_lazy("agendamentos:servico_list")


class ServicoUpdateView(AcessoGestaoMixin, UpdateView):
    """UPDATE — mesmo form e mesmo template do CREATE."""

    model = Servico
    form_class = ServicoForm
    template_name = "agendamentos/servico_form.html"
    success_url = reverse_lazy("agendamentos:servico_list")


class ServicoDeleteView(AcessoGestaoMixin, DeleteView):
    """DELETE — exige confirmação antes de excluir."""

    model = Servico
    template_name = "agendamentos/servico_confirm_delete.html"
    context_object_name = "servico"
    success_url = reverse_lazy("agendamentos:servico_list")


# ---------------------------------------------------------------------------
# Redefinição de senha (e-mail com link de uso único, válido por 2 horas)
# ---------------------------------------------------------------------------
class SolicitarRedefinicao(auth_views.PasswordResetView):
    form_class = RedefinirForm
    template_name = "conta/redefinir_form.html"
    email_template_name = "conta/redefinir_email.txt"
    subject_template_name = "conta/redefinir_assunto.txt"
    success_url = reverse_lazy("agendamentos:senha_enviada")

    def post(self, request, *args, **kwargs):
        chave = f"reset:{request.META.get('REMOTE_ADDR')}"
        if _excedeu(chave, 5):  # evita disparar e-mails em massa
            return render(request, self.template_name,
                          {"form": self.get_form(), "bloqueado": True}, status=429)
        _contar(chave, 3600)
        return super().post(request, *args, **kwargs)


class ConfirmarRedefinicao(auth_views.PasswordResetConfirmView):
    form_class = NovaSenhaForm
    template_name = "conta/redefinir_confirmar.html"
    success_url = reverse_lazy("agendamentos:senha_concluida")
