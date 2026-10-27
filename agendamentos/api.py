import json
from datetime import date, datetime, time, timedelta
from functools import wraps

from django.db import transaction
from django.db.models import ProtectedError
from django.http import JsonResponse
from django.db import IntegrityError
from django.utils import timezone
from django.utils.cache import add_never_cache_headers
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .forms import PerfilForm, ServicoForm
from .models import CONDICOES, Agendamento, Especialidade, Profissional, Servico

SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
         "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
         "17:30", "18:00"]
FECHAMENTO = 20 * 60  # nenhum atendimento pode terminar depois das 20:00
ROTULOS = dict(CONDICOES)


def _erro(msg, status=400):
    return JsonResponse({"ok": False, "erro": msg}, status=status)


def api_login(view):
    @wraps(view)
    def w(request, *a, **k):
        if not request.user.is_authenticated:
            return _erro("Sessão expirada. Faça login novamente.", 401)
        resp = view(request, *a, **k)
        add_never_cache_headers(resp)  # horários e agenda nunca podem vir de cache
        return resp
    return w


def _body(request):
    try:
        d = json.loads(request.body or b"{}")
        return d if isinstance(d, dict) else {}
    except ValueError:
        return {}


def _cliente(u):
    return getattr(u, "cliente", None)


def _prof(u):
    p = getattr(u, "profissional", None)
    return p if p and p.aprovado else None


def _gestao(u):
    return u.is_staff or bool(_prof(u))


def _agora():
    n = timezone.now()
    return (timezone.localtime(n) if timezone.is_aware(n) else n).replace(tzinfo=None)


def _min(hhmm):
    h, m = str(hhmm)[:5].split(":")
    return int(h) * 60 + int(m)


def _servico(s):
    return {"id": s.id, "nome": s.nome, "ico": s.icone or "bi-stars", "dur": s.duracao_min,
            "preco": float(s.preco), "cat": s.categoria, "desc": s.descricao}


def _brl(v):
    return "R$ " + f"{v:.2f}".replace(".", ",")


def _hhmm(m):
    return f"{m // 60:02d}:{m % 60:02d}"


def _blocos(qs):
    out = []
    for ag in qs.exclude(status="cancelado").select_related("servico"):
        ini = _min(ag.hora.strftime("%H:%M"))
        out.append((ini, ini + ag.servico.duracao_min))
    return out


def _grade(prof, dia, dur, cliente=None):
    """Todos os inícios possíveis do dia, cada um marcado como livre ou não.

    Além da grade de 30 em 30 min, o horário em que cada atendimento já marcado
    TERMINA vira uma opção (08:00 + 80 min => 09:20). Nada sobrepõe atendimentos da
    profissional nem outros agendamentos da própria cliente.
    """
    if dia.isoweekday() == 7:
        return [(h, False) for h in SLOTS]
    blocos = _blocos(Agendamento.objects.filter(profissional=prof, data=dia))
    if cliente:
        blocos += _blocos(Agendamento.objects.filter(cliente=cliente, data=dia))
    candidatos = {_min(h) for h in SLOTS}
    for _, fim in blocos:
        fim = -(-fim // 5) * 5  # arredonda para cima de 5 em 5 min
        if _min(SLOTS[0]) <= fim <= _min(SLOTS[-1]):
            candidatos.add(fim)
    agora, res = _agora(), []
    for ini in sorted(candidatos):
        fim = ini + dur
        livre = (
            fim <= FECHAMENTO
            and datetime.combine(dia, time(ini // 60, ini % 60)) > agora
            and not any(ini < b1 and fim > b0 for b0, b1 in blocos)
        )
        res.append((_hhmm(ini), livre))
    return res


def _disponiveis(prof, dia, dur, cliente=None):
    return [h for h, livre in _grade(prof, dia, dur, cliente) if livre]


@api_login
@require_GET
def dados(request):
    u = request.user
    cli, prof = _cliente(u), _prof(u)
    perfil = cli or prof
    if not perfil:
        return _erro("Conta sem perfil ativo.", 403)
    profs = Profissional.objects.filter(aprovado=True).prefetch_related("especialidades")
    d = {
        "servicos": [_servico(s) for s in Servico.objects.filter(ativo=True)],
        "profissionais": [{
            "id": p.id, "nome": p.nome_completo,
            "esp": ", ".join(e.nome for e in p.especialidades.all()[:2]) or "Profissional",
            "ini": "".join(x[0] for x in p.nome_completo.split()[:2]).upper(),
        } for p in profs],
        "perfil": {"tipo": "profissional" if prof else "cliente", "nome": perfil.nome_completo,
                   "email": u.email, "tel": perfil.telefone, "prof_id": prof.id if prof else None},
    }
    if cli:
        agora = _agora()
        d["historico"] = [{
            "id": a.id, "data": a.data.strftime("%d/%m/%Y"), "hora": a.hora.strftime("%H:%M"),
            "serv": a.servico.nome, "prof": a.profissional.nome_completo,
            "preco": _brl(a.preco_cobrado), "status": a.status,
            "pode_cancelar": a.status in ("pendente", "confirmado")
            and datetime.combine(a.data, a.hora) > agora,
        } for a in cli.agendamentos.select_related("servico", "profissional")[:50]]
    return JsonResponse(d)


@api_login
@require_GET
def horarios(request):
    try:
        prof = Profissional.objects.get(pk=request.GET.get("prof"), aprovado=True)
        serv = Servico.objects.get(pk=request.GET.get("servico"), ativo=True)
        dia = date.fromisoformat(request.GET.get("data", ""))
    except (Profissional.DoesNotExist, Servico.DoesNotExist, ValueError, TypeError):
        return _erro("Parâmetros inválidos.")
    grade = _grade(prof, dia, serv.duracao_min, _cliente(request.user))
    return JsonResponse({
        "ok": True, "duracao": serv.duracao_min,
        "horarios": [{"h": h, "livre": livre} for h, livre in grade],
        "disponiveis": [h for h, livre in grade if livre],
    })


@api_login
@require_POST
def agendar(request):
    cli = _cliente(request.user)
    if not cli:
        return _erro("Apenas clientes podem agendar.", 403)
    if not hasattr(cli, "ficha_saude"):
        return _erro("Preencha o termo e a ficha de saúde antes de agendar.", 403)
    b = _body(request)
    try:
        serv = Servico.objects.get(pk=b.get("servico"), ativo=True)
        prof = Profissional.objects.get(pk=b.get("prof"), aprovado=True)
        dia = date.fromisoformat(b.get("data", ""))
        hora = str(b.get("hora", ""))
        time.fromisoformat(hora)
    except (Servico.DoesNotExist, Profissional.DoesNotExist, ValueError, TypeError):
        return _erro("Dados do agendamento inválidos.")
    if dia > _agora().date() + timedelta(days=180):
        return _erro("Só é possível agendar com até 6 meses de antecedência.")
    indisponivel = _erro("Esse horário não está mais disponível (ocupado ou em conflito "
                         "com outro agendamento). Escolha outro.", 409)
    try:
        with transaction.atomic():
            if hora[:5] not in _disponiveis(prof, dia, serv.duracao_min, cli):
                return indisponivel
            a = Agendamento.objects.create(
                cliente=cli, profissional=prof, servico=serv, data=dia,
                hora=time.fromisoformat(hora[:5]), preco_cobrado=serv.preco,
                observacoes=str(b.get("obs", ""))[:500])
    except IntegrityError:  # outra cliente pegou o mesmo horário no mesmo instante
        return indisponivel
    return JsonResponse({"ok": True, "id": a.id})


@api_login
@require_POST
def mudar_status(request, pk):
    u = request.user
    a = Agendamento.objects.filter(pk=pk).first()
    cli, prof = _cliente(u), _prof(u)
    if a and cli and a.cliente_id == cli.id:
        permitido = {"pendente": ["cancelado"], "confirmado": ["cancelado"]}
    elif a and prof and a.profissional_id == prof.id:
        permitido = {"pendente": ["confirmado", "cancelado"], "confirmado": ["concluido", "cancelado"]}
    else:
        return _erro("Agendamento não encontrado.", 404)
    novo = _body(request).get("status")
    if novo not in permitido.get(a.status, []):
        return _erro("Ação não permitida para este agendamento.")
    comecou = datetime.combine(a.data, a.hora) <= _agora()
    if novo == "concluido" and not comecou:
        return _erro("Só é possível concluir um atendimento que já começou.")
    if novo == "cancelado" and cli and a.cliente_id == cli.id and comecou:
        return _erro("Não é possível cancelar um atendimento que já começou.")
    a.status = novo
    a.save(update_fields=["status"])
    return JsonResponse({"ok": True})


def _ficha_resumo(cliente):
    """Resumo de biossegurança, visível só para a profissional do atendimento."""
    f = getattr(cliente, "ficha_saude", None)
    if not f:
        return None
    r = f.respostas
    return {
        "sim": [ROTULOS[k] for k, v in r.items() if v == "S" and k in ROTULOS],
        "nao_informado": [ROTULOS[k] for k, v in r.items() if v == "X" and k in ROTULOS],
        "alergias": f.alergias, "medicamentos": f.medicamentos, "outras": f.outras_doencas,
    }


@api_login
@require_GET
def agenda(request):
    prof = _prof(request.user)
    if not prof:
        return _erro("Apenas profissionais aprovadas.", 403)
    try:
        ini = date.fromisoformat(request.GET.get("inicio", ""))
    except ValueError:
        h = _agora().date()
        ini = h - timedelta(days=h.weekday())
    qs = prof.agendamentos.filter(data__gte=ini, data__lt=ini + timedelta(days=7)) \
        .select_related("cliente", "servico").order_by("data", "hora")
    return JsonResponse({"ok": True, "eventos": [{
        "id": a.id, "dia": a.data.isoweekday(), "data": a.data.isoformat(),
        "h": a.hora.strftime("%H:%M"), "cli": a.cliente.nome_completo, "tel": a.cliente.telefone,
        "serv": a.servico.nome, "dur": a.servico.duracao_min, "tipo": a.servico.categoria,
        "preco": float(a.preco_cobrado), "status": a.status, "obs": a.observacoes,
        "ficha": _ficha_resumo(a.cliente) if a.status != "cancelado" else None,
    } for a in qs]})


@api_login
@require_POST
def servico_salvar(request):
    if not _gestao(request.user):
        return _erro("Sem permissão.", 403)
    b = _body(request)
    inst = Servico.objects.filter(pk=b["id"]).first() if b.get("id") else None
    form = ServicoForm({
        "nome": b.get("nome"), "categoria": b.get("categoria"), "preco": b.get("preco"),
        "duracao_min": b.get("duracao"), "icone": b.get("icone"),
        "descricao": b.get("descricao"), "ativo": True}, instance=inst)
    if not form.is_valid():
        return _erro(" ".join(f"{k}: {' '.join(v)}" for k, v in form.errors.items()))
    return JsonResponse({"ok": True, "servico": _servico(form.save())})


@api_login
@require_POST
def servico_excluir(request, pk):
    if not _gestao(request.user):
        return _erro("Sem permissão.", 403)
    s = Servico.objects.filter(pk=pk).first()
    if not s:
        return _erro("Serviço não encontrado.", 404)
    try:
        s.delete()
    except ProtectedError:  # tem agendamentos: apenas desativa, preservando o histórico
        s.ativo = False
        s.save(update_fields=["ativo"])
    return JsonResponse({"ok": True})


@api_login
@require_http_methods(["GET", "POST"])
def perfil(request):
    u = request.user
    cli, prof = _cliente(u), _prof(u)
    p = cli or prof
    if not p:
        return _erro("Conta sem perfil ativo.", 403)
    if request.method == "POST":
        form = PerfilForm(request.POST, request.FILES, user=u)
        esps = [e.strip() for e in request.POST.getlist("especialidades") if e.strip()]
        if not form.is_valid():
            return _erro(" ".join(f"{k}: {' '.join(v)}" for k, v in form.errors.items()))
        if prof and not esps:
            return _erro("Selecione ao menos uma especialidade.")
        d = form.cleaned_data
        with transaction.atomic():
            u.username = u.email = d["email"]
            u.first_name = d["nome"].split()[0][:150]
            u.save()
            p.nome_completo, p.telefone, p.cep = d["nome"], d["tel"], d["cep"]
            p.genero, p.data_nascimento = d["genero"], d["nasc"]
            if d.get("foto"):
                p.foto = d["foto"]
            if prof:
                p.apresentacao, p.horario_atendimento = d["bio"], d["horario"]
            p.save()
            if prof:
                p.especialidades.set(
                    [Especialidade.objects.get_or_create(nome=n[:50])[0] for n in esps])
        return JsonResponse({"ok": True, "nome": p.nome_completo})
    d = {"tipo": "profissional" if prof else "cliente", "nome": p.nome_completo, "email": u.email,
         "tel": p.telefone, "cep": p.cep, "genero": p.genero, "cpf": p.cpf,
         "nasc": p.data_nascimento.isoformat(), "foto": p.foto.url if p.foto else ""}
    if prof:
        d.update(bio=p.apresentacao, horario=p.horario_atendimento,
                 esps=[e.nome for e in p.especialidades.all()],
                 todas=list(Especialidade.objects.values_list("nome", flat=True)))
    else:
        f = getattr(cli, "ficha_saude", None)
        t = u.termos.filter(tipo="saude").first()
        d["ficha"] = {"em": timezone.localtime(f.atualizado_em).strftime("%d/%m/%Y") if f else None,
                      "termo": t.pk if t else None}
    return JsonResponse(d)


@api_login
@require_POST
def senha(request):
    b, u = _body(request), request.user
    if not u.check_password(str(b.get("atual", ""))):
        return _erro("Senha atual incorreta.")
    nova = str(b.get("nova", ""))
    try:
        validate_password(nova, u)
    except ValidationError as e:
        return _erro(" ".join(e.messages))
    u.set_password(nova)
    u.save()
    update_session_auth_hash(request, u)
    return JsonResponse({"ok": True})
