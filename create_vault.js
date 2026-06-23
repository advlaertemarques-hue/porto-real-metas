const fs = require('fs');
const path = require('path');

const vault = 'C:\\Users\\Usuario\\Documents\\Obsidian Vault';

const foldersToDelete = [
    "00 - ?ndice",
    "00 - ï¿½ndice",
    "01 - Porto Real",
    "02 - Locare",
    "03 - 2Bits Co.",
    "04 - Conhecimento",
    "05 - Pessoal",
    "06 - Reuni?es & Decis?es",
    "06 - Reunies & Decises",
    "06 - Reuniï¿½es & Decisï¿½es",
    "07 - Inbox",
    "08 - Arquivo",
    "00 - Índice",
    "06 - Reuniões & Decisões",
    "01 - Porto Real\\Estratégia & OKRs"
];

for (const d of foldersToDelete) {
    const p = path.join(vault, d.split('\\')[0]);
    if (fs.existsSync(p)) {
        try {
            fs.rmSync(p, { recursive: true, force: true });
        } catch (e) {}
    }
}

const foldersToCreate = [
    "00 - Índice",
    "01 - Porto Real\\Estratégia & OKRs",
    "01 - Porto Real\\Processos & Documentação",
    "01 - Porto Real\\Contratos & Jurídico",
    "01 - Porto Real\\Corretor de Alta Performance (curso)",
    "02 - Locare\\Produto & Funcionalidades",
    "02 - Locare\\Decisões técnicas",
    "02 - Locare\\Roadmap",
    "03 - 2Bits Co.\\Marca & Identidade",
    "03 - 2Bits Co.\\Orçou",
    "04 - Conhecimento\\Jurídico & Tributário",
    "04 - Conhecimento\\Gestão & Negócios (MBA)",
    "04 - Conhecimento\\Tech & IA",
    "05 - Pessoal\\Reflexões, leituras, fé",
    "06 - Reuniões & Decisões",
    "07 - Inbox",
    "08 - Arquivo"
];

for (const f of foldersToCreate) {
    const p = path.join(vault, f);
    fs.mkdirSync(p, { recursive: true });
}

const homeContent = `# Painel Geral\n\nBem-vindo à Home do seu Vault. Use este espaço como ponto de partida (dashboard) para acessar os projetos rapidamente.\n\n## Acesso Rápido\n- [[01 - Porto Real/Estratégia & OKRs/Estratégia Geral|Estratégia Porto Real]]\n- [[07 - Inbox/Anotações Rápidas|Ir para Inbox]]\n\n---`;

fs.writeFileSync(path.join(vault, '00 - Índice', 'Home.md'), homeContent, 'utf-8');

console.log("Feito!");
