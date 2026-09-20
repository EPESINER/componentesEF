/* =====================================================================
   APADRINHAMENTO ACADÊMICO — 2026.2 (programa em execução)
   =====================================================================
   Fonte: "Manual Oficial: Programa de Apadrinhamento Acadêmico —
   2026.2" e "Regulamento Institucional — Guia de Sobrevivência"
   (CAEF/Gestão Sinergia + A.A.A. Furiosa).

   CARGA HORÁRIA DE AACC — CONFIRMADA (ver RELATORIO_FINAL.md):
   o Manual Oficial e o Regulamento Institucional falam em até 60h de
   AACC por semestre. Uma minuta interna anterior ("Proposta revisada
   v2") mencionava uma faixa de 15 a 30h — essa minuta foi confirmada
   pela gestão responsável pelo programa como desatualizada para esta
   implementação. Use "até 60 horas" (não uma garantia automática: a
   concessão depende do cumprimento dos critérios abaixo), nunca a
   faixa de 15–30h.
   ===================================================================== */

const APADRINHAMENTO_STATUS = "em_execucao"; // 2026.2

const APADRINHAMENTO_INSCRICAO_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSfPA_lrVZltMNsTDOV8QWnR5Q74kbWckyQG_Rm5jDu-RcYL4Q/viewform?usp=dialog";

const APADRINHAMENTO_MANUAL_LINK = "https://docs.google.com/document/d/1jZGOkxY7ddx2uI5JLOMKdUNSr5CdUEzkz_JAHIVm5yc/edit?usp=sharing";

const APADRINHAMENTO_FASES = [
  { n: 1, nome: "Acolhimento", periodo: "28/08 a 03/09", descricao: "Primeiro contato, revelação das duplas e apresentação oficial na Semana de Acolhimento." },
  { n: 2, nome: "Adaptação", periodo: "Setembro", descricao: "Tour pelo campus, orientações sobre SIGAA, Biblioteca Setorial e Restaurante Universitário (RU)." },
  { n: 3, nome: "Integração", periodo: "Outubro", descricao: "Apresentação de grupos de pesquisa e participação na Gincana de integração." },
  { n: 4, nome: "Acompanhamento", periodo: "Novembro / Dezembro", descricao: "Manutenção do vínculo, suporte contínuo e participação em eventos do CAEF/Atlética." },
  { n: 5, nome: "Encerramento", periodo: "Última semana de aula", descricao: "Relatório final de atividades e validação para liberação das horas." }
];

const APADRINHAMENTO_ATRIBUICOES = [
  "Apoio prático: orientar sobre a estrutura física do campus (DEF/CCS, ginásios, laboratórios, Biblioteca Setorial, RU, xerox e secretarias).",
  "Rotina acadêmica: auxiliar na compreensão do calendário e navegação no SIGAA.",
  "Integração social: facilitar o acesso à rede de contatos, ao CAEF e à vida social/esportiva do curso (Atlética Furiosa).",
  "Integração científica: apresentar grupos de pesquisa, laboratórios do DEF e projetos de extensão."
];

const APADRINHAMENTO_REGRAS = [
  "Zero trote: é terminantemente proibida a prática ou conivência com trotes abusivos ou humilhantes.",
  "O padrinho/madrinha orienta, mas nunca substitui o afilhado em trabalhos, avaliações ou atividades de monitoria.",
  "A inatividade injustificada por mais de 48h após notificação resulta em substituição por padrinho reserva, perda do direito às horas de AACC e impedimento de participar nas próximas duas edições."
];

const APADRINHAMENTO_AACC = {
  horas: "Até 60 horas de AACC por semestre de participação ativa",
  observacao: "A concessão da carga horária não é automática: depende do cumprimento integral dos critérios abaixo.",
  criterios: [
    "Presença validada em pelo menos 4 dos 5 checkpoints do período.",
    "Entrega do Relatório Final assinado pelo afilhado ao término do semestre.",
    "Nunca ter sido substituído por inatividade durante a jornada."
  ]
};

const APADRINHAMENTO_ELEGIBILIDADE = "Veteranos regularmente matriculados a partir do 2º período dos cursos de Bacharelado ou Licenciatura em Educação Física.";

const APADRINHAMENTO_SOS = {
  nome: "SOS Padrinho",
  descricao: "Se houver falta de contato com o padrinho ou a madrinha, ou dificuldades de convivência durante o programa, entre em contato com Luiz Felipe, Coordenador de Ensino, Pesquisa e Extensão do CAEF, responsável pelo acompanhamento do Apadrinhamento Acadêmico."
};
