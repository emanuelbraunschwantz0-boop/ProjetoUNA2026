"""Cria dados de demonstração: uma cliente, três profissionais já aprovadas
(com horários de atendimento) e alguns agendamentos nesta semana.

    python manage.py seed_demo

É seguro rodar mais de uma vez (não duplica). Senha das contas: Una@2026
"""
from datetime import date, time, timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from agendamentos.agenda import segunda_da_semana
from agendamentos.models import (
    AceiteTermos,
    Agendamento,
    Cliente,
    Disponibilidade,
    Especialidade,
    Pagamento,
    Profissional,
    Servico,
)

SENHA = "Una@2026"

PROFISSIONAIS = [
    # email, nome, cpf, telefone, especialidades
    ("prof@una.com", "Carla Mendes", "529.982.247-25", "(69) 9 8401-1111", ["Corte de Cabelo", "Coloração"]),
    ("juliana@una.com", "Juliana Ramos", "168.995.350-09", "(69) 9 8401-2222", ["Manicure", "Pedicure", "Design de Sobrancelha"]),
    ("beatriz@una.com", "Beatriz Costa", "111.444.777-35", "(69) 9 8401-3333", ["Tratamento Capilar", "Escova Progressiva", "Maquiagem"]),
]

CLIENTES = [
    ("cliente@una.com", "Maria Silva", "390.533.447-05", "(69) 9 9111-0001"),
    ("ana@una.com", "Ana Paula Ferreira", "935.411.347-80", "(69) 9 9111-0002"),
    ("fernanda@una.com", "Fernanda Lima", "746.971.314-01", "(69) 9 9111-0003"),
]

# (profissional, cliente, serviço, dia da semana 0=seg, hora)
AGENDAMENTOS = [
    ("Carla Mendes", "Ana Paula Ferreira", "Coloração", 0, time(9, 0)),
    ("Carla Mendes", "Fernanda Lima", "Corte de Cabelo", 1, time(10, 0)),
    ("Carla Mendes", "Maria Silva", "Corte de Cabelo", 3, time(14, 0)),
    ("Juliana Ramos", "Maria Silva", "Manicure + Pedicure", 2, time(9, 0)),
    ("Juliana Ramos", "Ana Paula Ferreira", "Manicure", 4, time(15, 0)),
    ("Beatriz Costa", "Fernanda Lima", "Tratamento Capilar", 1, time(11, 0)),
]


class Command(BaseCommand):
    help = "Cria contas e agendamentos de demonstração."

    @transaction.atomic
    def handle(self, *args, **opts):
        def usuario(email, nome):
            primeiro, _, resto = nome.partition(" ")
            u, criado = User.objects.get_or_create(
                username=email, defaults={"email": email, "first_name": primeiro, "last_name": resto}
            )
            if criado:
                u.set_password(SENHA)
                u.save()
            return u

        clientes = {}
        for email, nome, cpf, tel in CLIENTES:
            c, _ = Cliente.objects.get_or_create(
                usuario=usuario(email, nome),
                defaults=dict(nome_completo=nome, cpf=cpf, telefone=tel, data_nascimento=date(1995, 5, 20), aceitou_termos=True),
            )
            clientes[nome] = c
            # contas de demonstração já assinaram o Termo de Responsabilidade (senão não conseguiriam agendar)
            AceiteTermos.objects.get_or_create(
                usuario=c.usuario, documento="responsabilidade", versao=settings.VERSAO_TERMOS,
                defaults={"hash_assinatura": "sha256:demonstracao"},
            )

        profs = {}
        for email, nome, cpf, tel, esps in PROFISSIONAIS:
            p, criada = Profissional.objects.get_or_create(
                usuario=usuario(email, nome),
                defaults=dict(nome_completo=nome, cpf=cpf, telefone=tel, data_nascimento=date(1990, 3, 10),
                              aprovado=True, aceitou_termos=True),
            )
            if criada:
                p.especialidades.set(Especialidade.objects.filter(nome__in=esps))
                for dia in range(6):  # segunda a sábado
                    Disponibilidade.objects.create(
                        profissional=p, dia_semana=dia, inicio=time(8, 0), fim=time(18, 0),
                        pausa_inicio=time(12, 0), pausa_fim=time(13, 0),
                    )
            profs[nome] = p

        segunda = segunda_da_semana(date.today())
        novos = 0
        for prof, cli, serv, dia, hora in AGENDAMENTOS:
            servico = Servico.objects.get(nome=serv)
            ag, criado = Agendamento.objects.get_or_create(
                profissional=profs[prof], data=segunda + timedelta(days=dia), hora=hora,
                defaults=dict(cliente=clientes[cli], servico=servico, duracao_min=servico.duracao_min,
                              preco_cobrado=servico.preco, status="confirmado"),
            )
            if criado:
                Pagamento.objects.create(agendamento=ag, forma_pagamento="local", valor_total=servico.preco)
                novos += 1

        self.stdout.write(self.style.SUCCESS(
            f"Pronto! Contas (senha {SENHA}): cliente@una.com, prof@una.com, juliana@una.com, beatriz@una.com. "
            f"{novos} agendamento(s) criado(s) nesta semana."
        ))
