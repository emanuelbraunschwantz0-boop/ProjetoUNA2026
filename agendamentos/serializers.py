"""Converte objetos do banco no formato simples que o JavaScript consome."""


def serializar_servico(s):
    return {
        "id": s.pk,
        "nome": s.nome,
        "ico": s.icone or "bi-scissors",
        "dur": s.duracao_min,
        "preco": float(s.preco),
        "cat": s.categoria,
        "desc": s.descricao,
    }


def iniciais(nome):
    return "".join(p[0] for p in nome.split()[:2]).upper()


def serializar_profissional(p):
    return {
        "id": p.pk,
        "nome": p.nome_completo,
        "esp": p.resumo_especialidades,
        "ini": iniciais(p.nome_completo),
    }


def moeda(valor):
    """1234.5 -> 'R$ 1.234,50' (formato brasileiro)."""
    texto = f"{float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {texto}"
