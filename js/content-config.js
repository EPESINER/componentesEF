/* V28 — Feature flag do CONTEÚDO PÚBLICO (Mural de Avisos e Radar CAEF).
   Independente do window.CAEF_STUDENT_CONFIG.enabled (que liga/desliga só
   o login de estudante) — decisão explícita desta rodada: Mural e Radar
   são conteúdo público, então precisam de um interruptor próprio,
   separado da Área do Estudante. Assim é possível, por exemplo, manter o
   login de estudante desligado e ainda assim nunca haver ambiguidade
   sobre qual fonte de dados o Mural/Radar usam.

   ENQUANTO false (valor entregue nesta rodada): Mural e Radar continuam
   funcionando exatamente como na V27 — dados de js/data/avisos.js e
   js/data/oportunidades.js, ZERO chamada de rede ao Supabase para esses
   módulos. Só troque para true depois de aplicar TODOS os scripts de
   portal-v28-sql/ (01 a 06) no projeto real e conferir a seção
   "VERIFICAÇÃO" de 06-migracao-dados.sql — nunca antes disso, ou o site
   mostrará "indisponível" para todo mundo até a migração existir de
   verdade no banco. */
window.CAEF_CONTENT_CONFIG = Object.freeze({
  useSupabaseContent: true
});
