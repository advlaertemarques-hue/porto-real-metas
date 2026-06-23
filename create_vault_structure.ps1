$vault = "C:\Users\Usuario\Documents\Obsidian Vault"
$folders = @(
    "00 - Índice",
    "01 - Porto Real\Estratégia & OKRs",
    "01 - Porto Real\Processos & Documentação",
    "01 - Porto Real\Contratos & Jurídico",
    "01 - Porto Real\Corretor de Alta Performance (curso)",
    "02 - Locare\Produto & Funcionalidades",
    "02 - Locare\Decisões técnicas",
    "02 - Locare\Roadmap",
    "03 - 2Bits Co.\Marca & Identidade",
    "03 - 2Bits Co.\Orçou",
    "04 - Conhecimento\Jurídico & Tributário",
    "04 - Conhecimento\Gestão & Negócios (MBA)",
    "04 - Conhecimento\Tech & IA",
    "05 - Pessoal\Reflexões, leituras, fé",
    "06 - Reuniões & Decisões",
    "07 - Inbox",
    "08 - Arquivo"
)

foreach ($f in $folders) {
    $path = Join-Path $vault $f
    New-Item -ItemType Directory -Force -Path $path
}
