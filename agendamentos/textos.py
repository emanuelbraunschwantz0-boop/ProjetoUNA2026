VERSAO = "2026.1"

TEXTO_CADASTRO = (
    f"Aceite dos Termos de Uso, Política de Privacidade (LGPD) e Termo de Compromisso "
    f"da Una Instituto de Beleza, versão {VERSAO}."
)


def texto_termo_saude(nome):
    return f"""TERMO DE RESPONSABILIDADE E FICHA DE SAÚDE (versão {VERSAO})

Eu, {nome}, declaro que:

1. As informações da ficha de saúde são verdadeiras e completas, e sei que omitir ou informar dados incorretos pode causar riscos à minha saúde e à de outras pessoas, sendo de minha responsabilidade.

2. Fui informado(a) de que procedimentos de manicure, pedicure, alongamento, esmaltação em gel e nail art envolvem instrumentos perfurocortantes, produtos químicos (acrílico, gel, monômero, acetona, formol) e contato com pele e unhas, com risco de alergia, infecção, sangramento e transmissão de doenças se houver falha de biossegurança.

3. Condições como HIV/AIDS, hepatites, herpes, diabetes, problemas circulatórios, uso de anticoagulantes, imunossupressão, micoses, infecções ativas, dermatites, alergias e gestação podem exigir adaptação do procedimento, uso de materiais descartáveis, liberação médica ou o adiamento do serviço.

4. A Una adota precauções universais de biossegurança com TODOS os clientes (esterilização, materiais descartáveis, luvas), independentemente das informações prestadas. Nenhum atendimento será recusado por discriminação em razão de condição de saúde (Lei nº 12.984/2014); a informação serve apenas para proteger você e a equipe.

5. O campo "Prefiro não informar" é permitido, mas, ao escolhê-lo, assumo os riscos decorrentes da ausência da informação, isentando a Una de responsabilidade por reações ou complicações ligadas a ela.

6. Comprometo-me a avisar a profissional, antes de qualquer procedimento, sobre qualquer mudança no meu estado de saúde, novas alergias, ferimentos, infecções ou medicamentos, e a seguir as orientações pós-procedimento.

7. Autorizo o tratamento dos meus dados de saúde (dados pessoais sensíveis, art. 11, I, da Lei nº 13.709/2018 - LGPD) exclusivamente para segurança e adequação do atendimento. O acesso é restrito à gestão e à profissional responsável, e posso revogar este consentimento a qualquer momento, pelo e-mail privacidade@una.com.br.

8. Reconheço que esta assinatura eletrônica, registrada com data, hora, IP e código de verificação (SHA-256), tem validade nos termos da Lei nº 14.063/2020 e da MP nº 2.200-2/2001.
"""
