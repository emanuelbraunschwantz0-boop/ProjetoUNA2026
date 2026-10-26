from django.contrib import admin

from .models import (
    Especialidade,
    Cliente,
    Profissional,
    Servico,
    Agendamento,
    Pagamento,
    FichaSaude,
    TermoAssinado,
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


@admin.register(FichaSaude)
class FichaSaudeAdmin(admin.ModelAdmin):
    list_display = ["cliente", "atualizado_em"]
    search_fields = ["cliente__nome_completo"]


@admin.register(TermoAssinado)
class TermoAssinadoAdmin(admin.ModelAdmin):
    """Somente leitura: termos assinados são prova e não podem ser alterados."""

    list_display = ["usuario", "tipo", "versao", "assinado_em", "ip", "hash_sha256"]
    list_filter = ["tipo"]
    search_fields = ["usuario__email", "hash_sha256"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
