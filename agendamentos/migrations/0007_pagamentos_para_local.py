from django.db import migrations


def tudo_no_local(apps, schema_editor):
    """O salão só recebe no local: pagamentos antigos (pix/cartão) passam a "local"."""
    Pagamento = apps.get_model("agendamentos", "Pagamento")
    Pagamento.objects.exclude(forma_pagamento="local").update(forma_pagamento="local")


class Migration(migrations.Migration):

    dependencies = [
        ("agendamentos", "0006_pagamento_local_termos_configuracao"),
    ]

    operations = [
        migrations.RunPython(tudo_no_local, migrations.RunPython.noop),
    ]
