from django import forms

from .models import Servico


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
