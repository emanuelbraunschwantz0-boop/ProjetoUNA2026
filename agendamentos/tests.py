import json
from datetime import date, time, timedelta

from django.contrib.auth.models import User
from django.test import TestCase

from . import api
from .models import Agendamento, Cliente, FichaSaude, Profissional, Servico

SENHA = "Una@2026x"


def _perfil(nome, email, cpf):
    u = User.objects.create_user(username=email, email=email, password=SENHA)
    return dict(usuario=u, nome_completo=nome, cpf=cpf, telefone="(69) 9 9999-0000",
                data_nascimento=date(1990, 1, 1))


class AgendaTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cli = Cliente.objects.create(aceitou_termos=True, **_perfil("Cli", "c@t.com", "529.982.247-25"))
        cls.cli2 = Cliente.objects.create(aceitou_termos=True, **_perfil("Cli2", "c2@t.com", "111.444.777-35"))
        for c in (cls.cli, cls.cli2):
            FichaSaude.objects.create(cliente=c, respostas={})
        cls.prof = Profissional.objects.create(aprovado=True, **_perfil("Pro", "p@t.com", "390.533.447-05"))
        cls.serv = Servico.objects.create(nome="Gel", categoria="manicure", preco=90, duracao_min=80)
        d = date.today() + timedelta(days=2)
        while d.isoweekday() == 7:
            d += timedelta(days=1)
        cls.dia = d

    def agendar(self, hora, usuario="c@t.com"):
        self.client.login(username=usuario, password=SENHA)
        return self.client.post("/api/agendar/", data=json.dumps(
            dict(servico=self.serv.id, prof=self.prof.id, data=self.dia.isoformat(), hora=hora)),
            content_type="application/json")

    def test_80min_libera_so_quando_termina(self):
        Agendamento.objects.create(cliente=self.cli, profissional=self.prof, servico=self.serv,
                                   data=self.dia, hora=time(8, 0), preco_cobrado=90, status="confirmado")
        livres = api._disponiveis(self.prof, self.dia, 80)
        for h in ("08:00", "08:30", "09:00"):
            self.assertNotIn(h, livres)
        self.assertIn("09:20", livres)

    def test_conflito_e_rejeitado(self):
        self.assertEqual(self.agendar("08:00").status_code, 200)
        self.assertEqual(self.agendar("09:00", "c2@t.com").status_code, 409)
        self.assertEqual(self.agendar("09:20", "c2@t.com").status_code, 200)

    def test_api_exige_login(self):
        self.assertEqual(self.client.get("/api/dados/").status_code, 401)

    def test_cliente_nao_cancela_agendamento_de_outro(self):
        a = Agendamento.objects.create(cliente=self.cli, profissional=self.prof, servico=self.serv,
                                       data=self.dia, hora=time(10, 0), preco_cobrado=90)
        self.client.login(username="c2@t.com", password=SENHA)
        r = self.client.post(f"/api/agendamento/{a.id}/status/",
                             data=json.dumps({"status": "cancelado"}), content_type="application/json")
        self.assertEqual(r.status_code, 404)
