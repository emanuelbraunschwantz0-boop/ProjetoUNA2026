from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import make_password

from .models import (
    Especialidade,
    Cliente,
    Profissional,
    Servico,
    Agendamento,
    Pagamento,
    ConfigSalao,
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


class ConfigSalaoForm(forms.ModelForm):
    nova_senha_adm = forms.CharField(
        required=False, label="Nova senha de administrador",
        widget=forms.PasswordInput(render_value=False, attrs={"autocomplete": "new-password"}),
        help_text="Senha exigida na tela de cadastro para criar funcionários. "
                  "Mínimo de 8 caracteres. Deixe em branco para manter a atual.")

    class Meta:
        model = ConfigSalao
        fields = []

    def clean_nova_senha_adm(self):
        s = self.cleaned_data["nova_senha_adm"]
        if s and len(s) < 8:
            raise forms.ValidationError("Use pelo menos 8 caracteres.")
        return s

    def save(self, commit=True):
        obj = super().save(commit=False)
        if self.cleaned_data.get("nova_senha_adm"):
            obj.senha_adm_hash = make_password(self.cleaned_data["nova_senha_adm"])
        if commit:
            obj.save()
        return obj


@admin.register(ConfigSalao)
class ConfigSalaoAdmin(admin.ModelAdmin):
    """Só superusuários: define a senha de administrador do cadastro de funcionários."""

    form = ConfigSalaoForm
    fields = ["senha_status", "nova_senha_adm", "atualizado_em"]
    readonly_fields = ["senha_status", "atualizado_em"]

    @admin.display(description="Situação da senha")
    def senha_status(self, obj):
        if obj and obj.pk and obj.senha_personalizada:
            return "Senha personalizada definida."
        return "Usando a senha padrão do sistema (UNA_SENHA_ADM). Defina uma nova abaixo."

    def has_module_permission(self, request):
        return request.user.is_superuser

    has_view_permission = has_change_permission = has_module_permission

    def has_add_permission(self, request):
        return request.user.is_superuser and not ConfigSalao.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
