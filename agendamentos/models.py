import hashlib
import json

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Especialidade(models.Model):
    """Ex.: Corte de Cabelo, Coloração, Manicure..."""
    nome = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Especialidade"
        verbose_name_plural = "Especialidades"


class Cliente(models.Model):
    """Perfil de cliente, ligado 1 para 1 a um usuário de login (User)."""

    GENERO_CHOICES = [
        ("F", "Feminino"),
        ("M", "Masculino"),
        ("O", "Outro"),
        ("N", "Prefiro não informar"),
    ]

    usuario = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="cliente"
    )
    nome_completo = models.CharField(max_length=100)
    cpf = models.CharField(max_length=14, unique=True)
    telefone = models.CharField(max_length=16)
    data_nascimento = models.DateField()
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, blank=True)
    cep = models.CharField(max_length=9, blank=True)
    foto = models.ImageField(upload_to="clientes/", blank=True)
    aceitou_termos = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome_completo

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"


class Profissional(models.Model):
    """Perfil de profissional do salão, ligado 1 para 1 a um usuário de login."""

    GENERO_CHOICES = Cliente.GENERO_CHOICES

    usuario = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profissional"
    )
    nome_completo = models.CharField(max_length=100)
    cpf = models.CharField(max_length=14, unique=True)
    telefone = models.CharField(max_length=16)
    data_nascimento = models.DateField()
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, blank=True)
    cep = models.CharField(max_length=9, blank=True)
    foto = models.ImageField(upload_to="profissionais/", blank=True)
    especialidades = models.ManyToManyField(Especialidade, related_name="profissionais")
    horario_atendimento = models.CharField(
        max_length=100, blank=True, help_text="Ex.: Seg a Sáb, 09h às 18h"
    )
    apresentacao = models.TextField(blank=True)
    codigo_convite = models.CharField(max_length=20, blank=True)
    aprovado = models.BooleanField(
        default=False, help_text="Conta liberada após análise da gestão do salão"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome_completo

    class Meta:
        verbose_name = "Profissional"
        verbose_name_plural = "Profissionais"


class Servico(models.Model):
    CATEGORIA_CHOICES = [
        ("corte", "Corte / Cabelo"),
        ("manicure", "Manicure / Pedicure"),
        ("tratamento", "Tratamento Capilar"),
        ("coloracao", "Coloração"),
        ("sobrancelha", "Sobrancelha / Cílios"),
        ("estetica", "Estética Facial"),
    ]

    nome = models.CharField(max_length=100)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    duracao_min = models.IntegerField(help_text="Duração em minutos")
    icone = models.CharField(
        max_length=40, blank=True, help_text="Classe do ícone, ex.: bi-scissors"
    )
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Serviço"
        verbose_name_plural = "Serviços"


class Agendamento(models.Model):
    """Um agendamento pertence a um único cliente, um único profissional
    e um único serviço — por isso as três ForeignKeys ficam aqui."""

    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("confirmado", "Confirmado"),
        ("cancelado", "Cancelado"),
        ("concluido", "Concluído"),
    ]

    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name="agendamentos"
    )
    profissional = models.ForeignKey(
        Profissional, on_delete=models.PROTECT, related_name="agendamentos"
    )
    servico = models.ForeignKey(
        Servico, on_delete=models.PROTECT, related_name="agendamentos"
    )
    data = models.DateField()
    hora = models.TimeField()
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="pendente"
    )
    preco_cobrado = models.DecimalField(
        max_digits=8, decimal_places=2, help_text="Preço do serviço no momento do agendamento"
    )
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.servico} - {self.cliente} com {self.profissional} em {self.data}"

    class Meta:
        verbose_name = "Agendamento"
        verbose_name_plural = "Agendamentos"
        ordering = ["-data", "-hora"]


class Pagamento(models.Model):
    """Cada agendamento tem no máximo um pagamento — relação um para um."""

    FORMA_CHOICES = [
        ("cartao", "Cartão de crédito"),
        ("pix", "Pix"),
        ("dinheiro", "Dinheiro"),
    ]
    STATUS_CHOICES = [
        ("pendente", "Pendente"),
        ("aprovado", "Aprovado"),
        ("recusado", "Recusado"),
    ]

    agendamento = models.OneToOneField(
        Agendamento, on_delete=models.CASCADE, related_name="pagamento"
    )
    forma_pagamento = models.CharField(max_length=10, choices=FORMA_CHOICES)
    parcelas = models.IntegerField(default=1)
    valor_total = models.DecimalField(max_digits=8, decimal_places=2)
    nome_no_cartao = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pendente")
    pago_em = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Pagamento de {self.agendamento} - {self.get_status_display()}"

    class Meta:
        verbose_name = "Pagamento"
        verbose_name_plural = "Pagamentos"


# ---------------------------------------------------------------------------
# Ficha de saúde (nail designer) + termo assinado
# ---------------------------------------------------------------------------

SIM_NAO = [("N", "Não"), ("S", "Sim"), ("X", "Prefiro não informar")]

CONDICOES = [
    ("hiv", "HIV/AIDS"),
    ("hepatite", "Hepatite B ou C"),
    ("herpes", "Herpes ativo"),
    ("diabetes", "Diabetes"),
    ("circulacao", "Problemas circulatórios / trombose"),
    ("coagulacao", "Uso de anticoagulantes ou problema de coagulação"),
    ("imunidade", "Imunossupressão, quimioterapia ou doença autoimune"),
    ("micose", "Micose de unha (onicomicose) ou de pele"),
    ("infeccao_unha", "Infecção, inflamação ou unha encravada ativa"),
    ("dermatite", "Psoríase, dermatite ou eczema nas mãos/pés"),
    ("alergia_acrilico", "Alergia a acrílico, gel, monômero ou metacrilato"),
    ("alergia_esmalte", "Alergia a esmalte, acetona, formol ou removedores"),
    ("alergia_latex", "Alergia a látex ou luvas"),
    ("cicatrizacao", "Dificuldade de cicatrização / queloide"),
    ("gestante", "Gestante ou lactante"),
]


class FichaSaude(models.Model):
    """Última ficha de saúde do cliente (dados sensíveis — LGPD art. 11)."""

    cliente = models.OneToOneField(
        Cliente, on_delete=models.CASCADE, related_name="ficha_saude"
    )
    respostas = models.JSONField(default=dict, help_text="condição -> N/S/X")
    alergias = models.TextField(blank=True)
    medicamentos = models.TextField(blank=True)
    outras_doencas = models.TextField(blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ficha de {self.cliente}"

    class Meta:
        verbose_name = "Ficha de saúde"
        verbose_name_plural = "Fichas de saúde"


class TermoAssinado(models.Model):
    """Registro imutável de aceite/assinatura (texto, respostas, assinatura,
    IP, data e hash SHA-256)."""

    TIPOS = [
        ("cadastro", "Termos de uso e compromisso"),
        ("saude", "Termo de responsabilidade e ficha de saúde"),
    ]

    usuario = models.ForeignKey(User, on_delete=models.PROTECT, related_name="termos")
    tipo = models.CharField(max_length=10, choices=TIPOS)
    versao = models.CharField(max_length=20)
    texto = models.TextField()
    dados = models.JSONField(default=dict, blank=True)
    assinatura = models.TextField(blank=True, help_text="PNG base64 do desenho")
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    assinado_em = models.DateTimeField(default=timezone.now, editable=False)
    hash_sha256 = models.CharField(max_length=64, editable=False)

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.usuario} ({self.assinado_em:%d/%m/%Y})"

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Termos assinados não podem ser alterados.")
        payload = json.dumps(
            {
                "u": self.usuario_id, "t": self.tipo, "v": self.versao,
                "x": self.texto, "d": self.dados, "a": self.assinatura,
                "w": self.assinado_em.isoformat(),
            },
            sort_keys=True, ensure_ascii=False,
        )
        self.hash_sha256 = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Termos assinados não podem ser excluídos.")

    @classmethod
    def registrar(cls, request, tipo, versao, texto, dados=None, assinatura=""):
        return cls.objects.create(
            usuario=request.user if request.user.is_authenticated else None,
            tipo=tipo, versao=versao, texto=texto, dados=dados or {},
            assinatura=assinatura, ip=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
        )

    class Meta:
        verbose_name = "Termo assinado"
        verbose_name_plural = "Termos assinados"
        ordering = ["-assinado_em"]
