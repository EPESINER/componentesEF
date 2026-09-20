/* =====================================================================
   ACERVO ACADÊMICO DIGITAL E COLABORATIVO — CAEF
   =====================================================================
   Fonte: "Guia de Acesso ao Acervo Acadêmico CAEF" e a "Proposta de
   Emenda — Acervo Acadêmico Digital e Colaborativo", um documento de
   autoria do próprio CAEF, redigido como carta formal de submissão
   ao Colegiado do curso de Bacharelado em Educação Física (2026).

   REQUER VALIDAÇÃO HUMANA: o texto da proposta se dirige formalmente
   ao Colegiado ("vem respeitosamente submeter à apreciação..."), mas
   o arquivo está apenas no Drive de quem a redigiu — não há, nos
   documentos acessíveis, confirmação de protocolo/recebimento formal
   pelo Colegiado (ex.: número de processo, ata, resposta). Por isso
   NÃO afirmamos que a emenda está formalmente "em tramitação" —
   usamos linguagem compatível com o estágio confirmado (proposta
   redigida e endereçada ao Colegiado). Ajuste para "em_tramitacao"
   ou "aprovada" somente após confirmação (ex.: número de protocolo).

   O acervo em si já funciona na prática, independentemente do status
   da emenda (Drive organizado por período, já em uso).
   ===================================================================== */

const ACERVO_STATUS = "proposta_enviada"; // já operante na prática; formalização junto ao Colegiado ainda não confirmada (ver nota acima)

const ACERVO_DRIVE_LINK = "https://drive.google.com/drive/folders/1kpOA4avqskP7l4S5PZCXloiQ4q-KonRE";

const ACERVO_FONTES_OFICIAIS = [
  {
    nome: "Portal de Periódicos CAPES",
    descricao: "A maior base de dados acadêmicos do país. Essencial para Fisiologia, Cinesiologia e Biomecânica.",
    like: "periodicos.capes.gov.br",
    href: "https://www.periodicos.capes.gov.br/",
    comoAcessar: "Conectado à rede Wi-Fi da UFPB, o acesso a boa parte do conteúdo é automático. Fora do campus, use o acesso remoto via CAFe (Comunidade Acadêmica Federada): escolha \"UFPB\" na lista de instituições e entre com seu login SIGAA."
  },
  {
    nome: "SciELO",
    descricao: "Biblioteca eletrônica de acesso aberto a periódicos científicos brasileiros e latino-americanos. Boa para Saúde Pública e Pedagogia do Esporte.",
    like: "scielo.org",
    href: "https://www.scielo.org/",
    comoAcessar: "Acesso aberto e irrestrito — não é necessário login institucional."
  },
  {
    nome: "SIBi/UFPB",
    descricao: "Sistema unificado das bibliotecas da UFPB. Permite localizar obras físicas na Biblioteca Central ou setoriais.",
    like: "sistemabu.ufpb.br",
    href: "https://www.ufpb.br/sistemabu",
    comoAcessar: "Utilize suas credenciais do SIGAA para login, renovação de livros e reservas online. Em caso de dúvida sobre um título específico, procure o bibliotecário da Biblioteca Setorial do seu Centro."
  }
];

const ACERVO_PERIODOS = ["01º Período","02º Período","03º Período","04º Período","05º Período","06º Período","07º Período","08º Período","TCC e Monografias"];

const ACERVO_REGRAS = [
  "Conteúdo permitido: links de acesso aberto, material com autorização por escrito dos docentes, ou obras em domínio público.",
  "É estritamente proibido o upload de cópias digitalizadas de livros comerciais sem autorização expressa.",
  "Padronização de arquivos: Disciplina_Tipo_Ano (ex.: Cinesiologia_Resumo_2026).",
  "Em caso de dúvida sobre a legitimidade de um material, consulte a Comissão de Acervo antes da publicação.",
  "Visualização aberta a discentes do curso mediante login institucional; edição restrita à Comissão de Acervo e monitores."
];

const ACERVO_DESENGAVETA = {
  titulo: "Campanha \"Desengaveta\"",
  descricao: "Circulação de material físico entre estudantes, apoiando colegas em situação de vulnerabilidade e reduzindo desperdício. Os livros circulam entre estudantes e não são digitalizados.",
  pontoColeta: "Sede do CAEF",
  catalogo: "Disponível na pasta \"DOAÇÕES FÍSICAS\" no Drive do Acervo.",
  catalogoLink: "https://drive.google.com/drive/folders/1kpOA4avqskP7l4S5PZCXloiQ4q-KonRE"
};
