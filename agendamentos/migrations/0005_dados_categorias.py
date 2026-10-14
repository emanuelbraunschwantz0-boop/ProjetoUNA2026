from django.db import migrations

# Liga cada especialidade já existente à categoria de serviços que ela atende.
CATEGORIAS = {
    "Corte de Cabelo": "corte",
    "Coloração": "coloracao",
    "Manicure": "manicure",
    "Pedicure": "manicure",
    "Tratamento Capilar": "tratamento",
    "Escova Progressiva": "tratamento",
    "Design de Sobrancelha": "sobrancelha",
    "Maquiagem": "estetica",
}
FORMAS_ANTIGAS = {"cartao": "credito", "dinheiro": "local"}


def aplicar(apps, schema_editor):
    Especialidade = apps.get_model("agendamentos", "Especialidade")
    for nome, categoria in CATEGORIAS.items():
        Especialidade.objects.filter(nome=nome, categoria="").update(categoria=categoria)

    Agendamento = apps.get_model("agendamentos", "Agendamento")
    for ag in Agendamento.objects.filter(duracao_min=0).select_related("servico"):
        ag.duracao_min = ag.servico.duracao_min
        ag.save(update_fields=["duracao_min"])

    Pagamento = apps.get_model("agendamentos", "Pagamento")
    for antiga, nova in FORMAS_ANTIGAS.items():
        Pagamento.objects.filter(forma_pagamento=antiga).update(forma_pagamento=nova)


class Migration(migrations.Migration):

    dependencies = [
        ("agendamentos", "0004_disponibilidade_termos_pagamento"),
    ]

    operations = [
        migrations.RunPython(aplicar, migrations.RunPython.noop),
    ]
