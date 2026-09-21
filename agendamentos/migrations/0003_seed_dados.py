from django.db import migrations


ESPECIALIDADES = [
    "Corte de Cabelo",
    "Coloração",
    "Manicure",
    "Pedicure",
    "Tratamento Capilar",
    "Escova Progressiva",
    "Design de Sobrancelha",
    "Maquiagem",
]

# (nome, categoria, preco, duracao_min, icone, descricao)
SERVICOS = [
    (
        "Design de Sobrancelhas",
        "sobrancelha",
        "45.00",
        30,
        "bi-brush",
        "Design personalizado com henna ou tintura, valorizando o formato "
        "natural do seu rosto e realçando seu olhar.",
    ),
    (
        "Brow Lamination",
        "sobrancelha",
        "90.00",
        40,
        "bi-stars",
        "Técnica que alinha e modela os fios das sobrancelhas, proporcionando "
        "mais volume, definição e um efeito moderno.",
    ),
    (
        "Lash Lifting",
        "sobrancelha",
        "85.00",
        45,
        "bi-eye",
        "Curvatura dos cílios naturais desde a raiz, deixando o olhar mais "
        "aberto e expressivo, com efeito semelhante a rímel.",
    ),
    (
        "Reconstrução de Sobrancelhas",
        "sobrancelha",
        "70.00",
        40,
        "bi-heart",
        "Tratamentos que fortalecem, hidratam e estimulam o crescimento dos "
        "fios, recuperando sobrancelhas falhadas.",
    ),
    (
        "Micropigmentação",
        "estetica",
        "350.00",
        120,
        "bi-pencil",
        "Procedimentos em sobrancelhas e lábios para realçar a beleza com "
        "naturalidade e longa duração.",
    ),
    (
        "Remoção a Laser",
        "estetica",
        "180.00",
        30,
        "bi-lightning",
        "Tecnologia para remoção de tatuagens e micropigmentação, clareando "
        "ou eliminando pigmentos da pele.",
    ),
    ("Corte de Cabelo", "corte", "60.00", 45, "bi-scissors", "Cortes personalizados por profissionais experientes."),
    ("Manicure", "manicure", "35.00", 40, "bi-hand-index", "Cuidado completo para suas unhas."),
    ("Pedicure", "manicure", "40.00", 50, "bi-hand-index-thumb", "Tratamento completo para os pés."),
    ("Manicure + Pedicure", "manicure", "65.00", 90, "bi-stars", "Combo completo mãos e pés."),
    ("Tratamento Capilar", "tratamento", "80.00", 60, "bi-droplet", "Revitalização profunda dos fios."),
    ("Coloração", "coloracao", "150.00", 120, "bi-palette", "Coloração e luzes profissionais."),
    ("Escova Progressiva", "tratamento", "200.00", 180, "bi-wind", "Alisamento e progressiva."),
]


def seed_dados(apps, schema_editor):
    Especialidade = apps.get_model("agendamentos", "Especialidade")
    Servico = apps.get_model("agendamentos", "Servico")

    for nome in ESPECIALIDADES:
        Especialidade.objects.get_or_create(nome=nome)

    for nome, categoria, preco, duracao_min, icone, descricao in SERVICOS:
        Servico.objects.get_or_create(
            nome=nome,
            categoria=categoria,
            defaults={
                "preco": preco,
                "duracao_min": duracao_min,
                "icone": icone,
                "descricao": descricao,
            },
        )


def remover_dados(apps, schema_editor):
    Especialidade = apps.get_model("agendamentos", "Especialidade")
    Servico = apps.get_model("agendamentos", "Servico")
    Especialidade.objects.filter(nome__in=ESPECIALIDADES).delete()
    Servico.objects.filter(nome__in=[s[0] for s in SERVICOS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("agendamentos", "0002_alter_servico_categoria"),
    ]

    operations = [
        migrations.RunPython(seed_dados, remover_dados),
    ]
