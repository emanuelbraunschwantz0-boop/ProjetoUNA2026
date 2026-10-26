import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projetointegrador.settings")
django.setup()
from datetime import date
from django.contrib.auth.models import User
from agendamentos.models import Cliente, Profissional, Especialidade

def usuario(email, nome):
    u, _ = User.objects.get_or_create(username=email, defaults={"email": email, "first_name": nome.split()[0]})
    u.set_password("Una@2026"); u.save()
    return u

Cliente.objects.get_or_create(usuario=usuario("cliente@una.com", "Maria Cliente"), defaults=dict(
    nome_completo="Maria Cliente", cpf="529.982.247-25", telefone="(69) 9 9999-0001",
    data_nascimento=date(1995, 5, 10), aceitou_termos=True))

pr, _ = Profissional.objects.get_or_create(usuario=usuario("prof@una.com", "Carla Profissional"), defaults=dict(
    nome_completo="Carla Profissional", cpf="111.444.777-35", telefone="(69) 9 9999-0002",
    data_nascimento=date(1990, 3, 3)))
pr.aprovado = True
pr.save()
pr.especialidades.add(*Especialidade.objects.filter(nome__in=["Manicure", "Pedicure"]))
print("OK - cliente@una.com e prof@una.com | senha: Una@2026")
