from django.contrib import admin

from .models import (
    Especialidade,
    Cliente,
    Profissional,
    Servico,
    Agendamento,
    Pagamento,
)


@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    search_fields = ["nome"]


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ["nome_completo", "cpf", "telefone", "criado_em"]
    search_fields = ["nome_completo", "cpf"]


@admin.register(Profissional)
class ProfissionalAdmin(admin.ModelAdmin):
    list_display = ["nome_completo", "cpf", "telefone", "aprovado"]
    list_filter = ["aprovado", "especialidades"]
    search_fields = ["nome_completo", "cpf"]
    filter_horizontal = ["especialidades"]


@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ["nome", "categoria", "preco", "duracao_min", "ativo"]
    list_filter = ["categoria", "ativo"]
    search_fields = ["nome"]


@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = ["cliente", "profissional", "servico", "data", "hora", "status"]
    list_filter = ["status", "data", "profissional"]
    search_fields = ["cliente__nome_completo", "profissional__nome_completo"]


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ["agendamento", "forma_pagamento", "valor_total", "status"]
    list_filter = ["forma_pagamento", "status"]
