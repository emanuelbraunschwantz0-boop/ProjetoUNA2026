import re

from django.core.exceptions import ValidationError


def somente_digitos(valor):
    return re.sub(r"\D", "", valor or "")


def formatar_cpf(valor):
    d = somente_digitos(valor)
    return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}" if len(d) == 11 else valor


def cpf_valido(valor):
    """Confere os dígitos verificadores do CPF (e recusa 111.111.111-11 etc.)."""
    d = somente_digitos(valor)
    if len(d) != 11 or d == d[0] * 11:
        return False
    for tamanho in (9, 10):
        soma = sum(int(d[i]) * (tamanho + 1 - i) for i in range(tamanho))
        digito = (soma * 10) % 11 % 10
        if digito != int(d[tamanho]):
            return False
    return True


def validar_cpf(valor):
    if not cpf_valido(valor):
        raise ValidationError("CPF inválido.")


def validar_telefone(valor):
    if len(somente_digitos(valor)) not in (10, 11):
        raise ValidationError("Informe um telefone com DDD, ex.: (69) 9 9999-9999.")
