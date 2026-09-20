/* =====================================================================
   OUVIDORIA DO DISCENTE — canal fixo da Diretoria de Ensino, Pesquisa
   e Extensão do CAEF.
   =====================================================================
   Fonte: "Plano de Ação e Banco de Ideias — Diretoria de Ensino,
   Pesquisa e Extensão (CAEF-UFPB)" e formulário oficial "Ouvidoria e
   Canal Direto Discente — CAEF/UFPB".
   IMPORTANTE: nunca publique aqui relatos individuais, nomes,
   e-mails, matrículas ou qualquer dado que identifique quem enviou
   uma manifestação. Os números de TRANSPARENCIA_OUVIDORIA abaixo só
   devem ser preenchidos com contagens agregadas, nunca com conteúdo
   de manifestações.
   ===================================================================== */

const OUVIDORIA_FORM_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSffGsTBcHwbHfm9-Vi1ylgOzmE30B9OeWa51-Fg7-3FuJ2zow/viewform?usp=header";

const OUVIDORIA_ESCOPO = [
  "Oferta de disciplinas e choques de horário.",
  "Assiduidade e cumprimento de ementas/planos de curso pelos docentes.",
  "Sugestões para a Diretoria de Ensino, Pesquisa e Extensão.",
  "Demandas gerais relacionadas à vida acadêmica no DEF."
];

const OUVIDORIA_NAO_COBRE = "A Ouvidoria do CAEF é um canal estudantil de escuta e encaminhamento — não substitui a Ouvidoria-Geral da UFPB, a Coordenação do Curso, a Chefia do DEF ou os canais institucionais oficiais para questões administrativas, disciplinares ou jurídicas.";

/* Preencha apenas quando houver números agregados reais publicados
   pela diretoria. Deixe null enquanto não houver dado consolidado. */
const TRANSPARENCIA_OUVIDORIA = {
  disponivel: false,
  recebidas: null,
  encaminhadas: null,
  concluidas: null,
  emAcompanhamento: null,
  periodoReferencia: ""
};
