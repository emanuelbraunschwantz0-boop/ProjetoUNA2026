import hmac
import re
from datetime import date

from django import forms
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction

from . import textos
from .models import (
    CONDICOES, SIM_NAO, Cliente, Especialidade, Profissional, Servico, TermoAssinado,
)

GENEROS = {"Feminino": "F", "Masculino": "M", "Não-binário": "O", "Outro": "O"}


def cpf_valido(cpf):
    n = [int(x) for x in re.sub(r"\D", "", cpf)]
    if len(n) != 11 or len(set(n)) == 1:
        return False
    for i in (9, 10):
        s = sum(n[j] * (i + 1 - j) for j in range(i))
        if (s * 10) % 11 % 10 != n[i]:
            return False
    return True


class ServicoForm(forms.ModelForm):
    """ModelForm do slide: o formulário nasce do model (Meta.model),
    'fields' escolhe quais campos aparecem na tela, e a validação
    (obrigatoriedade, tamanho máximo, etc.) vem herdada direto do model,
    sem precisar reescrever nada aqui."""

    class Meta:
        model = Servico
        fields = ["nome", "categoria", "preco", "duracao_min", "icone", "descricao", "ativo"]
        widgets = {
            "descricao": forms.Textarea(attrs={"rows": 4}),
        }
        labels = {
            "duracao_min": "Duração (minutos)",
            "icone": "Ícone (classe Bootstrap Icons, ex.: bi-scissors)",
        }


class CadastroForm(forms.Form):
    """Cadastro real (substitui a simulação em JS): cria User + Cliente/Profissional."""

    nome = forms.CharField(max_length=100)
    email = forms.EmailField()
    tel = forms.CharField(max_length=16)
    cpf = forms.CharField(max_length=14)
    nasc = forms.DateField()
    genero = forms.CharField(required=False)
    cep = forms.CharField(max_length=9, required=False)
    bio = forms.CharField(required=False)
    senha = forms.CharField()
    funcionario = forms.BooleanField(required=False)
    senha_adm = forms.CharField(required=False)
    horario = forms.CharField(max_length=100, required=False)
    foto = forms.ImageField(required=False)
    aceite_termos = forms.BooleanField()
    aceite_compromisso = forms.BooleanField()

    def clean_email(self):
        e = self.cleaned_data["email"].lower()
        if User.objects.filter(username=e).exists():
            raise ValidationError("E-mail já cadastrado.")
        return e

    def clean_cpf(self):
        c = self.cleaned_data["cpf"]
        if not cpf_valido(c):
            raise ValidationError("CPF inválido.")
        d = re.sub(r"\D", "", c)
        c = f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}"
        if Cliente.objects.filter(cpf=c).exists() or Profissional.objects.filter(cpf=c).exists():
            raise ValidationError("CPF já cadastrado.")
        return c

    def clean_nasc(self):
        n = self.cleaned_data["nasc"]
        h = date.today()
        if h.year - n.year - ((h.month, h.day) < (n.month, n.day)) < 18:
            raise ValidationError("Cadastro permitido apenas para maiores de 18 anos.")
        return n

    def clean_senha(self):
        s = self.cleaned_data["senha"]
        validate_password(s)
        return s

    def clean_foto(self):
        foto = self.cleaned_data.get("foto")
        if foto and foto.size > 2 * 1024 * 1024:
            raise ValidationError("Foto deve ter no máximo 2MB.")
        return foto

    def clean(self):
        d = super().clean()
        if d.get("funcionario"):
            esperado = settings.SENHA_ADM_CADASTRO.encode()
            if not hmac.compare_digest((d.get("senha_adm") or "").encode(), esperado):
                self.add_error("senha_adm", "Senha de administrador inválida.")
            if not [e for e in self.data.getlist("especialidades") if e.strip()]:
                self.add_error("funcionario", "Selecione ao menos uma especialidade.")
        return d

    @transaction.atomic
    def save(self, request):
        d = self.cleaned_data
        user = User.objects.create_user(
            username=d["email"], email=d["email"], password=d["senha"],
            first_name=d["nome"].split()[0][:150],
        )
        base = dict(
            usuario=user, nome_completo=d["nome"], cpf=d["cpf"], telefone=d["tel"],
            data_nascimento=d["nasc"], genero=GENEROS.get(d["genero"], ""), cep=d["cep"],
        )
        if d.get("foto"):
            base["foto"] = d["foto"]
        if not d["funcionario"]:
            Cliente.objects.create(aceitou_termos=True, **base)
        else:
            p = Profissional.objects.create(
                apresentacao=d["bio"], horario_atendimento=d["horario"],
                aprovado=True, **base,  # liberada pela senha de administrador
            )
            p.especialidades.set([
                Especialidade.objects.get_or_create(nome=n.strip()[:50])[0]
                for n in self.data.getlist("especialidades") if n.strip()
            ])
        request.user = user  # para registrar o termo
        TermoAssinado.registrar(
            request, "cadastro", textos.VERSAO, textos.TEXTO_CADASTRO,
            {"tipo": "profissional" if d["funcionario"] else "cliente", "email": d["email"], "cpf": d["cpf"]},
        )
        return user


class FichaSaudeForm(forms.Form):
    alergias = forms.CharField(required=False, label="Alergias conhecidas",
                               widget=forms.Textarea(attrs={"rows": 2}))
    medicamentos = forms.CharField(required=False, label="Medicamentos em uso",
                                   widget=forms.Textarea(attrs={"rows": 2}))
    outras_doencas = forms.CharField(required=False, label="Outras doenças/condições",
                                     widget=forms.Textarea(attrs={"rows": 2}))
    aceite_responsabilidade = forms.BooleanField(
        label="Li o termo e assumo a responsabilidade pelas informações prestadas.")
    aceite_lgpd = forms.BooleanField(
        label="Autorizo o tratamento dos meus dados de saúde para segurança do atendimento (LGPD).")
    assinatura = forms.CharField(widget=forms.HiddenInput)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for chave, rotulo in CONDICOES:
            self.fields[chave] = forms.ChoiceField(
                label=rotulo, choices=SIM_NAO, initial="N", widget=forms.RadioSelect)
        self.condicoes = [self[c] for c, _ in CONDICOES]

    def clean_assinatura(self):
        a = self.cleaned_data["assinatura"]
        if not a.startswith("data:image/png;base64,") or len(a) < 1500 or len(a) > 600000:
            raise ValidationError("Desenhe sua assinatura no quadro.")
        return a


class PerfilForm(forms.Form):
    """Edição do perfil (cliente ou profissional) no painel."""

    nome = forms.CharField(max_length=100)
    email = forms.EmailField()
    tel = forms.CharField(max_length=16)
    cep = forms.CharField(max_length=9, required=False)
    genero = forms.ChoiceField(choices=[("", "—")] + Cliente.GENERO_CHOICES, required=False)
    nasc = forms.DateField()
    bio = forms.CharField(required=False)
    horario = forms.CharField(max_length=100, required=False)
    foto = forms.ImageField(required=False)

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

    def clean_email(self):
        e = self.cleaned_data["email"].lower()
        if User.objects.filter(username=e).exclude(pk=self.user.pk).exists():
            raise ValidationError("E-mail já cadastrado.")
        return e

    def clean_nasc(self):
        n = self.cleaned_data["nasc"]
        h = date.today()
        if h.year - n.year - ((h.month, h.day) < (n.month, n.day)) < 18:
            raise ValidationError("Permitido apenas para maiores de 18 anos.")
        return n

    def clean_foto(self):
        foto = self.cleaned_data.get("foto")
        if foto and foto.size > 2 * 1024 * 1024:
            raise ValidationError("Foto deve ter no máximo 2MB.")
        return foto
