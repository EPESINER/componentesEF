/* =====================================================================
   MURAL DE AVISOS — comunicados oficiais selecionados manualmente a
   partir do grupo "Avisos" da comunidade "CAEF UFPB" no WhatsApp.
   =====================================================================
   NÃO existe sincronização automática com o WhatsApp. Cada aviso é
   selecionado, resumido e publicado manualmente pela coordenação do
   portal, um por um. Nunca invente título, texto, origem ou data de
   um aviso — use exatamente o que foi aprovado para publicação.

   Campos de cada aviso:
   - situacaoPublicacao: "publicado" | "pendente" | "arquivado"
       Só avisos com situacaoPublicacao "publicado" aparecem no site.
       "pendente" = selecionado mas ainda sem aprovação para publicar.
       "arquivado" = já foi publicado, mas não deve mais aparecer.
       Para retirar um aviso do ar, basta mudar para "arquivado" — não
       é preciso apagar o objeto (mantém o histórico de decisões).
   - dataOriginal: data do comunicado original no WhatsApp (DD/MM/AAAA),
       apenas para referência. Nunca é usada para decidir se o aviso
       some do site.
   - validoAte: "" ou uma data "DD/MM/AAAA".
       Se preenchida, o aviso deixa de aparecer automaticamente depois
       dessa data (sem apagar o histórico do WhatsApp nem este objeto).
       Se vazia, NENHUMA expiração automática está configurada — isso
       não deve ser lido como "aviso permanente", apenas como "ainda
       sem prazo definido". A revisão manual (campo abaixo) é o que
       garante que o conteúdo continua correto.
   - revisaoEditorial: "" ou uma data "DD/MM/AAAA" — data proposta para
       a coordenação reconfirmar se o aviso continua válido. Quando
       essa data passa sem confirmação (ou seja, sem que alguém volte
       aqui e a atualize), o site registra um aviso no console do
       navegador (visível só para quem inspeciona o código, nunca para
       o público) pedindo revisão. O site nunca informa ao público que
       uma orientação "deixou de valer" por causa dessa data.
   ===================================================================== */

const AVISOS = [
  {
    id: "aviso-sala-descanso-estudo",
    titulo: "Sala de descanso e estudo",
    texto: "Pedimos a colaboração de todos para manter um nível de barulho mais baixo na sala de descanso e estudo, respeitando quem utiliza o espaço para estudar, descansar ou ter um momento de tranquilidade entre as atividades.",
    origem: "Diretoria Geral do CAEF",
    dataOriginal: "16/09/2026",
    situacaoPublicacao: "publicado",
    validoAte: "",
    revisaoEditorial: "16/12/2026"
  }
];
