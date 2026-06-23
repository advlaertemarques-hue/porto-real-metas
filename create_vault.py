import os
import shutil

vault = r"C:\Users\Usuario\Documents\Obsidian Vault"

folders_to_delete = [
    "00 - ?ndice",
    "01 - Porto Real",
    "02 - Locare",
    "03 - 2Bits Co.",
    "04 - Conhecimento",
    "05 - Pessoal",
    "06 - Reunies & Decises",
    "07 - Inbox",
    "08 - Arquivo",
    "00 - Índice",
    "06 - Reuniões & Decisões"
]

for d in folders_to_delete:
    p = os.path.join(vault, d)
    if os.path.exists(p):
        shutil.rmtree(p, ignore_errors=True)

folders = [
    "00 - Índice",
    r"01 - Porto Real\Estratégia & OKRs",
    r"01 - Porto Real\Processos & Documentação",
    r"01 - Porto Real\Contratos & Jurídico",
    r"01 - Porto Real\Corretor de Alta Performance (curso)",
    r"02 - Locare\Produto & Funcionalidades",
    r"02 - Locare\Decisões técnicas",
    r"02 - Locare\Roadmap",
    r"03 - 2Bits Co.\Marca & Identidade",
    r"03 - 2Bits Co.\Orçou",
    r"04 - Conhecimento\Jurídico & Tributário",
    r"04 - Conhecimento\Gestão & Negócios (MBA)",
    r"04 - Conhecimento\Tech & IA",
    r"05 - Pessoal\Reflexões, leituras, fé",
    "06 - Reuniões & Decisões",
    "07 - Inbox",
    "08 - Arquivo"
]

for d in folders:
    p = os.path.join(vault, d)
    os.makedirs(p, exist_ok=True)

home_content = """# Painel Geral

Bem-vindo à Home do seu Vault. Use este espaço como ponto de partida (dashboard) para acessar os projetos rapidamente.

## Acesso Rápido
- [[01 - Porto Real/Estratégia & OKRs/Estratégia Geral|Estratégia Porto Real]]
- [[07 - Inbox/Anotações Rápidas|Ir para Inbox]]

---"""

with open(os.path.join(vault, "00 - Índice", "Home.md"), "w", encoding="utf-8") as f:
    f.write(home_content)

print("Estrutura criada com sucesso!")
