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


class ContaTests(TestCase):
    def test_redefinicao_de_senha_envia_email_com_link(self):
        from django.core import mail
        from datetime import date
        from .models import Cliente
        u = User.objects.create_user(username="r@t.com", email="r@t.com", password=SENHA)
        Cliente.objects.create(usuario=u, nome_completo="R T", cpf="529.982.247-25", telefone="(69) 9 9999-0001",
                               data_nascimento=date(1995, 5, 10), aceitou_termos=True)
        # CPF errado: responde igual, mas não envia e-mail
        self.assertEqual(self.client.post("/senha/redefinir/", {"email": "r@t.com", "cpf": "111.111.111-11"}).status_code, 302)
        self.assertEqual(len(mail.outbox), 0)
        r = self.client.post("/senha/redefinir/", {"email": "r@t.com", "cpf": "52998224725"})
        self.assertEqual(r.status_code, 302)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/senha/nova/", mail.outbox[0].body)
        # e-mail inexistente responde igual (não revela quem tem conta)
        self.assertEqual(self.client.post("/senha/redefinir/", {"email": "x@t.com", "cpf": "52998224725"}).status_code, 302)
        self.assertEqual(len(mail.outbox), 1)

    def test_senha_de_administrador_personalizada(self):
        from .models import ConfigSalao
        from django.conf import settings
        self.assertTrue(ConfigSalao.senha_adm_confere(settings.SENHA_ADM_CADASTRO))
        cfg = ConfigSalao.objects.get_or_create(pk=1)[0]
        from django.contrib.auth.hashers import make_password
        cfg.senha_adm_hash = make_password("Nova@Adm123")
        cfg.save()
        self.assertTrue(ConfigSalao.senha_adm_confere("Nova@Adm123"))
        self.assertFalse(ConfigSalao.senha_adm_confere(settings.SENHA_ADM_CADASTRO))


class NovaSenhaTests(TestCase):
    def test_exige_data_de_nascimento(self):
        from datetime import date
        from django.core import mail
        from django.core.cache import cache
        from .models import Cliente
        cache.clear()
        u = User.objects.create_user(username="n@t.com", email="n@t.com", password=SENHA)
        Cliente.objects.create(usuario=u, nome_completo="N T", cpf="529.982.247-25", telefone="(69) 9 9999-0001",
                               data_nascimento=date(1995, 5, 10), aceitou_termos=True)
        self.client.post("/senha/redefinir/", {"email": "n@t.com", "cpf": "529.982.247-25"})
        import re
        link = re.search(r"/senha/nova/\S+", mail.outbox[0].body).group(0)
        url = self.client.get(link).url  # token vai para a sessão
        r = self.client.post(url, {"new_password1": "Outra@Senha77", "new_password2": "Outra@Senha77",
                                   "data_nascimento": "1990-01-01"})
        self.assertEqual(r.status_code, 200)  # data errada: continua na página
        u.refresh_from_db(); self.assertTrue(u.check_password(SENHA))
        r = self.client.post(url, {"new_password1": "Outra@Senha77", "new_password2": "Outra@Senha77",
                                   "data_nascimento": "1995-05-10"})
        self.assertEqual(r.status_code, 302)
        u.refresh_from_db(); self.assertTrue(u.check_password("Outra@Senha77"))
