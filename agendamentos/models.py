from django.contrib.auth.models import User
from django.db import models


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
