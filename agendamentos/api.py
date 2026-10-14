"""Endpoints JSON do painel. Substituem os dados que ficavam fixos no JavaScript.

Todos exigem login; os de gestão exigem profissional aprovada. O CSRF é
verificado pelo Django (o JS manda o token no cabeçalho X-CSRFToken).
"""
import base64
import binascii
import hashlib
import json
from datetime import timedelta
from functools import wraps
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from . import agenda
from .agenda import AgendamentoInvalido
from .forms import ServicoForm
from .models import (
    AceiteTermos,
    Agendamento,
    Profissional,
    Servico,
)
from .serializers import moeda, serializar_profissional, serializar_servico
from .views import eh_admin, tipo_painel

# ---------------------------------------------------------------------------
# utilitários
# ---------------------------------------------------------------------------
def erro(mensagem, status=400, **extra):
    return JsonResponse({"ok": False, "erro": mensagem, **extra}, status=status)


def corpo_json(request):
    try:
        dados = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        raise AgendamentoInvalido("Requisição inválida.")
    if not isinstance(dados, dict):
        raise AgendamentoInvalido("Requisição inválida.")
    return dados


def exige(tipo=None, admin=False):
    """Decorator: exige login e, opcionalmente, o tipo de perfil ou a administração."""

    def decorador(view):
        @wraps(view)
        def interna(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return erro("Faça login para continuar.", 401)
            quem, perfil = tipo_painel(request.user)
            if quem is None or (tipo and quem != tipo) or (admin and not eh_admin(request.user)):
                return erro("Você não tem permissão para esta ação.", 403)
            request.tipo, request.perfil = quem, perfil
            try:
                return view(request, *args, **kwargs)
            except AgendamentoInvalido as e:
                return erro(e.mensagem, e.codigo)

        return interna

    return decorador


def _primeiro_erro(form):
    for msgs in form.errors.values():
        return str(msgs[0])
    return "Dados inválidos."


# ---------------------------------------------------------------------------
# serviços (leitura para todos, gestão só para profissionais)
# ---------------------------------------------------------------------------
@exige()
@require_http_methods(["GET", "POST"])
def servicos(request):
    if request.method == "GET":
        return JsonResponse({"servicos": [serializar_servico(s) for s in Servico.objects.filter(ativo=True)]})
    if not eh_admin(request.user):
        return erro("Apenas a administração pode cadastrar serviços.", 403)
    form = ServicoForm(_dados_servico(corpo_json(request)))
    if not form.is_valid():
        return erro(_primeiro_erro(form), campos=form.errors.get_json_data())
    return JsonResponse({"ok": True, "servico": serializar_servico(form.save())}, status=201)


def _dados_servico(d):
    return {
        "nome": str(d.get("nome", "")).strip(),
        "categoria": d.get("categoria", ""),
        "preco": str(d.get("preco", "")).replace(",", "."),
        "duracao_min": d.get("duracao_min", ""),
        "icone": d.get("icone", ""),
        "descricao": str(d.get("descricao", "")).strip(),
        "ativo": "on",
    }


@exige(admin=True)
@require_http_methods(["PUT", "DELETE"])
def servico_detalhe(request, pk):
    servico = get_object_or_404(Servico, pk=pk, ativo=True)
    if request.method == "PUT":
        form = ServicoForm(_dados_servico(corpo_json(request)), instance=servico)
        if not form.is_valid():
            return erro(_primeiro_erro(form), campos=form.errors.get_json_data())
        return JsonResponse({"ok": True, "servico": serializar_servico(form.save())})
    # DELETE: com histórico apenas desativa (o histórico depende do serviço)
    if servico.agendamentos.exists():
        servico.ativo = False
        servico.save(update_fields=["ativo"])
    else:
        servico.delete()
    return JsonResponse({"ok": True})


# ---------------------------------------------------------------------------
# disponibilidade (cliente escolhendo profissional, dia e horário)
# ---------------------------------------------------------------------------
def _servico_ativo(request):
    try:
        return get_object_or_404(Servico, pk=int(request.GET.get("servico", "")), ativo=True)
    except ValueError:
        raise AgendamentoInvalido("Serviço inválido.")


def _profissional_do_servico(request, servico):
    try:
        prof = get_object_or_404(Profissional, pk=int(request.GET.get("profissional", "")), aprovado=True)
    except ValueError:
        raise AgendamentoInvalido("Profissional inválida.")
    if not agenda.profissional_atende(prof, servico):
        raise AgendamentoInvalido("Esta profissional não realiza este serviço.")
    return prof


@exige()
@require_http_methods(["GET"])
def profissionais(request):
    servico = _servico_ativo(request)
    lista = agenda.profissionais_para_servico(servico)
    return JsonResponse({"profissionais": [serializar_profissional(p) for p in lista]})


@exige()
@require_http_methods(["GET"])
def dias(request):
    servico = _servico_ativo(request)
    prof = _profissional_do_servico(request, servico)
    try:
        ano, mes = int(request.GET["ano"]), int(request.GET["mes"])
        if not (1 <= mes <= 12 and 2000 <= ano <= 2100):
            raise ValueError
    except (KeyError, ValueError):
        raise AgendamentoInvalido("Mês inválido.")
    return JsonResponse({"dias": agenda.dias_com_vaga(prof, ano, mes, servico.duracao_min)})


@exige()
@require_http_methods(["GET"])
def horarios(request):
    servico = _servico_ativo(request)
    prof = _profissional_do_servico(request, servico)
    dia = agenda.parse_data(request.GET.get("data"))
    return JsonResponse({"horarios": agenda.grade_horarios(prof, dia, servico.duracao_min)})


# ---------------------------------------------------------------------------
# agendamentos
# ---------------------------------------------------------------------------
@exige("cliente")
@require_http_methods(["POST"])
def agendamentos(request):
    d = corpo_json(request)
    try:
        servico_id, prof_id = int(d.get("servico") or 0), int(d.get("profissional") or 0)
    except (TypeError, ValueError):
        raise AgendamentoInvalido("Serviço ou profissional inválido.")
    servico = get_object_or_404(Servico, pk=servico_id)
    prof = get_object_or_404(Profissional, pk=prof_id)
    ag = agenda.criar_agendamento(
        cliente=request.perfil,
        servico=servico,
        profissional=prof,
        dia=agenda.parse_data(d.get("data")),
        hora=agenda.parse_hora(d.get("hora")),
        observacoes=str(d.get("observacoes", "")),
    )
    return JsonResponse({
        "ok": True,
        "id": ag.pk,
        "resumo": {
            "servico": servico.nome,
            "profissional": prof.nome_completo,
            "data": ag.data.strftime("%d/%m"),
            "hora": ag.hora.strftime("%H:%M"),
        },
    }, status=201)


@exige()
@require_http_methods(["POST"])
def agendamento_status(request, pk):
    ag = get_object_or_404(Agendamento, pk=pk)
    if request.tipo == "cliente":
        if ag.cliente_id != request.perfil.pk:
            return erro("Agendamento não encontrado.", 404)
    elif not eh_admin(request.user) and (request.perfil is None or ag.profissional_id != request.perfil.pk):
        return erro("Você só pode alterar os seus próprios atendimentos.", 403)
    novo = corpo_json(request).get("status", "")
    agenda.alterar_status(ag, novo, por_cliente=request.tipo == "cliente")
    return JsonResponse({"ok": True, "status": ag.status})


@exige("cliente")
@require_http_methods(["GET"])
def meus_agendamentos(request):
    agora = timezone.localtime().replace(tzinfo=None)
    itens = []
    qs = request.perfil.agendamentos.select_related("servico", "profissional")
    for ag in qs:
        itens.append({
            "id": ag.pk,
            "dia": ag.data.strftime("%d"),
            "mes": ag.data.month,
            "data": ag.data.strftime("%d/%m/%Y"),
            "hora": ag.hora.strftime("%H:%M"),
            "servico": ag.servico.nome,
            "profissional": ag.profissional.nome_completo,
            "preco": moeda(ag.preco_cobrado),
            "status": ag.status,
            "podeCancelar": ag.status in ("pendente", "confirmado") and ag.inicio_dt > agora,
        })
    return JsonResponse({"agendamentos": itens})


# ---------------------------------------------------------------------------
# painel da profissional (agenda)
# ---------------------------------------------------------------------------
def _ativos(qs):
    return qs.exclude(status="cancelado")


@exige("profissional")
@require_http_methods(["GET"])
def agenda_semana(request):
    try:
        prof = get_object_or_404(Profissional, pk=int(request.GET.get("profissional") or request.perfil.pk), aprovado=True)
    except ValueError:
        raise AgendamentoInvalido("Profissional inválida.")
    base = agenda.parse_data(request.GET["semana"]) if request.GET.get("semana") else agenda.hoje()
    segunda = agenda.segunda_da_semana(base)
    fim = segunda + timedelta(days=5)

    ags = list(
        _ativos(Agendamento.objects.filter(profissional=prof, data__range=(segunda, fim)))
        .select_related("cliente", "servico")
        .order_by("data", "hora")
    )
    eventos = []
    for ag in ags:
        eventos.append({
            "id": ag.pk,
            "col": ag.data.weekday() + 1,
            "h": ag.hora.strftime("%H:%M"),
            "fim": ag.fim_dt.strftime("%H:%M"),
            "cli": ag.cliente.nome_completo,
            "tel": ag.cliente.telefone,
            "serv": ag.servico.nome,
            "dur": ag.duracao_min,
            "tipo": ag.servico.categoria,
            "status": ag.status,
            "preco": moeda(ag.preco_cobrado),
            "obs": ag.observacoes,
        })
    populares = {}
    for ag in ags:
        populares[ag.servico.nome] = populares.get(ag.servico.nome, 0) + 1
    top = max(populares.items(), key=lambda kv: kv[1]) if populares else None
    return JsonResponse({
        "inicio": segunda.isoformat(),
        "dias": [(segunda + timedelta(days=i)).isoformat() for i in range(6)],
        "eventos": eventos,
        "stats": {
            "total": len(ags),
            "faturamento": float(sum(a.preco_cobrado for a in ags)),
            "horas": round(sum(a.duracao_min for a in ags) / 60),
            "popular": {"nome": top[0], "qtd": top[1]} if top else None,
        },
    })


# ---------------------------------------------------------------------------
# assinatura eletrônica dos termos
# ---------------------------------------------------------------------------
MAX_ASSINATURA_BYTES = 700 * 1024


@exige()
@require_http_methods(["POST"])
def assinar_termos(request):
    d = corpo_json(request)
    documento = d.get("documento_tipo", "")
    if documento not in dict(AceiteTermos.DOCUMENTO_CHOICES):
        raise AgendamentoInvalido("Documento inválido.")

    existente = AceiteTermos.objects.filter(
        usuario=request.user, documento=documento, versao=settings.VERSAO_TERMOS
    ).first()
    if existente:
        return JsonResponse(_resposta_aceite(existente, ja_assinado=True))

    try:
        _, _, b64 = str(d.get("assinatura_base64", "")).partition("base64,")
        png = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError):
        raise AgendamentoInvalido("Assinatura inválida.")
    if not png or len(png) > MAX_ASSINATURA_BYTES:
        raise AgendamentoInvalido("Assinatura inválida ou muito grande.")
    try:
        from PIL import Image

        Image.open(BytesIO(png)).verify()
    except Exception:
        raise AgendamentoInvalido("A assinatura precisa ser uma imagem PNG.")

    agora = timezone.now()
    ip = request.META.get("REMOTE_ADDR") or None
    ua = request.META.get("HTTP_USER_AGENT", "")[:300]
    selo = "|".join([str(request.user.pk), documento, settings.VERSAO_TERMOS, agora.isoformat(), ip or "", hashlib.sha256(png).hexdigest()])
    hash_final = "sha256:" + hashlib.sha256(selo.encode()).hexdigest()

    aceite = AceiteTermos(
        usuario=request.user, documento=documento, versao=settings.VERSAO_TERMOS,
        hash_assinatura=hash_final, ip=ip, user_agent=ua,
    )
    aceite.assinatura.save(f"{request.user.pk}-{documento}.png", ContentFile(png), save=False)
    aceite.save()
    return JsonResponse(_resposta_aceite(aceite), status=201)


def _resposta_aceite(a, ja_assinado=False):
    return {
        "success": True,
        "jaAssinado": ja_assinado,
        "hash": a.hash_assinatura,
        "id_assinatura": f"UNA-{a.pk}",
        "ip": a.ip or "",
        "assinadoEm": timezone.localtime(a.assinado_em).strftime("%d/%m/%Y %H:%M:%S"),
    }
