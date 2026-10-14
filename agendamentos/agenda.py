"""Regras de negócio da agenda (quem atende o quê, e quando).

Tudo que antes estava fixo no JavaScript (OCUPADOS, lista de horários,
profissionais por serviço) agora é calculado aqui a partir do banco.
"""
from datetime import date, time, timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import AceiteTermos, Agendamento, Disponibilidade, Pagamento, Profissional, Servico


class AgendamentoInvalido(Exception):
    """Erro de regra de negócio, com mensagem pronta para mostrar ao usuário."""

    def __init__(self, mensagem, codigo=400):
        super().__init__(mensagem)
        self.mensagem = mensagem
        self.codigo = codigo


# ---------------------------------------------------------------------------
# utilitários
# ---------------------------------------------------------------------------
def _min(t):
    return t.hour * 60 + t.minute


def _fmt(minutos):
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def _sobrepoe(a_ini, a_fim, b_ini, b_fim):
    return a_ini < b_fim and b_ini < a_fim


def hoje():
    return timezone.localdate()


def agora_min():
    n = timezone.localtime()
    return n.hour * 60 + n.minute


# ---------------------------------------------------------------------------
# quem atende o quê
# ---------------------------------------------------------------------------
def profissionais_para_servico(servico):
    """Profissionais aprovadas, com horário cadastrado, que atendem a categoria."""
    return (
        Profissional.objects.filter(
            aprovado=True,
            especialidades__categoria=servico.categoria,
            disponibilidades__isnull=False,
        )
        .distinct()
        .prefetch_related("especialidades")
        .order_by("nome_completo")
    )


def profissional_atende(profissional, servico):
    return profissional.especialidades.filter(categoria=servico.categoria).exists()


# ---------------------------------------------------------------------------
# horários
# ---------------------------------------------------------------------------
def _ocupados(profissional, dia):
    """Intervalos (início, fim) em minutos já reservados no dia."""
    itens = []
    qs = Agendamento.objects.filter(profissional=profissional, data=dia).exclude(
        status="cancelado"
    )
    for ag in qs:
        ini = _min(ag.hora)
        itens.append((ini, ini + max(ag.duracao_min, 1)))
    return itens


def grade_horarios(profissional, dia, duracao_min):
    """Todos os horários possíveis do dia, com a marca de livre/ocupado.

    Retorna lista de dicts: {"hora": "09:00", "livre": True}.
    Horários que já passaram (no dia de hoje) nem aparecem.
    """
    if dia < hoje() or dia > hoje() + timedelta(days=settings.AGENDA_ANTECEDENCIA_MAX_DIAS):
        return []
    disp = Disponibilidade.objects.filter(
        profissional=profissional, dia_semana=dia.weekday()
    ).first()
    if not disp:
        return []

    passo = settings.AGENDA_PASSO_MINUTOS
    inicio, fim = _min(disp.inicio), _min(disp.fim)
    pausa = (
        (_min(disp.pausa_inicio), _min(disp.pausa_fim))
        if disp.pausa_inicio and disp.pausa_fim
        else None
    )
    ocupados = _ocupados(profissional, dia)
    limite_hoje = agora_min() if dia == hoje() else -1

    grade = []
    t = inicio
    while t + duracao_min <= fim:
        fim_slot = t + duracao_min
        na_pausa = bool(pausa) and _sobrepoe(t, fim_slot, *pausa)
        if t > limite_hoje and not na_pausa:  # na pausa ou já passado: nem aparece
            livre = not any(_sobrepoe(t, fim_slot, ini, fim_o) for ini, fim_o in ocupados)
            grade.append({"hora": _fmt(t), "livre": livre})
        t += passo
    return grade


def dias_com_vaga(profissional, ano, mes, duracao_min):
    """Números dos dias do mês que ainda têm algum horário livre."""
    dias = []
    d = date(ano, mes, 1)
    while d.month == mes:
        if any(h["livre"] for h in grade_horarios(profissional, d, duracao_min)):
            dias.append(d.day)
        d += timedelta(days=1)
    return dias


# ---------------------------------------------------------------------------
# criar / alterar agendamento
# ---------------------------------------------------------------------------
def termo_responsabilidade_assinado(usuario):
    """A cliente precisa ter assinado o Termo de Responsabilidade (versão atual) para agendar."""
    return AceiteTermos.objects.filter(
        usuario=usuario, documento="responsabilidade", versao=settings.VERSAO_TERMOS
    ).exists()


@transaction.atomic
def criar_agendamento(*, cliente, servico, profissional, dia, hora, observacoes=""):
    """Cria o agendamento. O pagamento é sempre "no local" (nada é cobrado pelo site)."""
    if not termo_responsabilidade_assinado(cliente.usuario):
        raise AgendamentoInvalido(
            "Antes de agendar, leia e assine o Termo de Responsabilidade.", 428
        )
    if not servico.ativo:
        raise AgendamentoInvalido("Este serviço não está mais disponível.")
    if not profissional.aprovado:
        raise AgendamentoInvalido("Esta profissional não está disponível.")
    if not profissional_atende(profissional, servico):
        raise AgendamentoInvalido("Esta profissional não realiza este serviço.")
    # trava a linha da profissional: duas pessoas reservando ao mesmo tempo
    # são atendidas uma de cada vez (em bancos que suportam select_for_update)
    Profissional.objects.select_for_update().get(pk=profissional.pk)

    livres = {h["hora"] for h in grade_horarios(profissional, dia, servico.duracao_min) if h["livre"]}
    if hora.strftime("%H:%M") not in livres:
        raise AgendamentoInvalido(
            "Esse horário acabou de ser ocupado ou não está disponível. Escolha outro.", 409
        )

    ag = Agendamento.objects.create(
        cliente=cliente,
        profissional=profissional,
        servico=servico,
        data=dia,
        hora=hora,
        duracao_min=servico.duracao_min,
        preco_cobrado=servico.preco,
        observacoes=(observacoes or "")[:500],
    )
    Pagamento.objects.create(
        agendamento=ag, forma_pagamento="local", valor_total=servico.preco
    )
    return ag


STATUS_PROFISSIONAL = {"confirmado", "concluido", "cancelado", "pendente"}


def alterar_status(agendamento, novo, *, por_cliente):
    """Regras de quem pode mudar o quê.

    Cliente: só cancela, e apenas um agendamento futuro ainda ativo.
    Profissional: confirma, conclui, cancela ou volta para pendente.
    """
    if agendamento.status in ("cancelado", "concluido") and por_cliente:
        raise AgendamentoInvalido("Este agendamento não pode mais ser alterado.")
    if por_cliente:
        if novo != "cancelado":
            raise AgendamentoInvalido("Você só pode cancelar o agendamento.", 403)
        if agendamento.inicio_dt <= timezone.localtime().replace(tzinfo=None):
            raise AgendamentoInvalido("Não é possível cancelar um horário que já passou.")
    elif novo not in STATUS_PROFISSIONAL:
        raise AgendamentoInvalido("Status inválido.")
    agendamento.status = novo
    agendamento.save(update_fields=["status"])
    return agendamento


def segunda_da_semana(dia):
    return dia - timedelta(days=dia.weekday())


def parse_hora(texto):
    try:
        h, m = texto.split(":")
        return time(int(h), int(m))
    except (ValueError, AttributeError):
        raise AgendamentoInvalido("Horário inválido.")


def parse_data(texto):
    try:
        return date.fromisoformat(texto)
    except (ValueError, TypeError):
        raise AgendamentoInvalido("Data inválida.")
