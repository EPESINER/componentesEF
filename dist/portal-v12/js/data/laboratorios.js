/* =====================================================================
   PESQUISA — laboratórios e grupos do DEF/UFPB
   =====================================================================
   Fonte: compilação a partir de registros públicos do SIGAA/UFPB
   (sigaa.ufpb.br) e do mapeamento direto do CAEF com docentes
   (ago/2026). Distinguimos:
     - "sigaa": informação pública já publicada pela própria UFPB
       (não passa pelo campo de autorização de divulgação do CAEF).
     - "caef": levantamento organizado pelo CAEF, com dados enviados
       diretamente pelo docente responsável.
   Ver também js/data/oportunidades.js para vagas/linhas específicas
   já com processo de ingresso aberto.
   ===================================================================== */

const LABORATORIOS = [
  {
    sigla: "LAFE",
    nome: "Laboratório de Atividade Física e Esporte",
    linhas: "Fisiologia do Esporte, Treinamento Esportivo e Avaliação do Desempenho Humano",
    responsavel: "Não informado — consultar o DEF",
    fonte: "sigaa",
    nota: "Laboratório mais recente do DEF."
  },
  {
    sigla: "LEPAFA",
    nome: "Laboratório de Estudos e Pesquisa em Atividade Física Adaptada para Pessoas com Deficiência",
    linhas: "Atividade física e esporte adaptado — paradesporto, goalball, rugby em cadeira de rodas, entre outros",
    responsavel: "Profª Elaine Cappellazzo Souto",
    fonte: "sigaa",
    nota: "Criado em maio de 2013; integra ensino, pesquisa e extensão. Vinculado ao GEPAFA (CNPq)."
  },
  {
    sigla: "GEPAFA",
    nome: "Grupo de Pesquisa em Atividade Física Adaptada",
    linhas: "Atividade física adaptada — cadastrado no CNPq",
    responsavel: "Vinculado ao LEPAFA",
    fonte: "sigaa",
    nota: ""
  },
  {
    sigla: "LEPAFS",
    nome: "Laboratório de Estudos e Pesquisas em Atividade Física e Saúde",
    linhas: "Relação entre atividade física e promoção da saúde",
    responsavel: "Não informado — consultar o DEF",
    fonte: "sigaa",
    nota: ""
  },
  {
    sigla: "GEPEAF",
    nome: "Grupo de Estudos e Pesquisa em Epidemiologia da Atividade Física",
    linhas: "Epidemiologia da atividade física, acelerometria, comportamento sedentário",
    responsavel: "Prof. José Cazuza de Farias Júnior · Prof. Felipe Vogt Cureau",
    fonte: "caef",
    nota: "Possui linha de pesquisa com vaga aberta — veja no Radar CAEF."
  },
  {
    sigla: "LETFADS",
    nome: "Laboratório de Estudo do Treinamento Físico Aplicado, Desempenho e Saúde",
    linhas: "Genética do emagrecimento, nutrição esportiva, hipertensão e exercício",
    responsavel: "Prof. Alexandre Sérgio Silva",
    fonte: "caef",
    nota: "Possui linha de pesquisa com vaga aberta — veja no Radar CAEF."
  },
  {
    sigla: "LEPEFTFS",
    nome: "Laboratório de Extensão e Pesquisa em Educação Física, Trabalho e Formação em Saúde",
    linhas: "Educação Física, trabalho e formação no SUS; saúde mental na Atenção Primária",
    responsavel: "Prof. André Luís Façanha da Silva",
    fonte: "caef",
    nota: "Possui linha de pesquisa com vaga aberta — veja no Radar CAEF."
  },
  {
    sigla: "—",
    nome: "Social Esporte Clube",
    linhas: "Sociologia do Esporte, com foco no Brasil e na América Latina",
    responsavel: "Murilo Moraes de Oliveira · Billy Graeff Bastos",
    fonte: "caef",
    nota: "Possui vaga aberta — veja no Radar CAEF."
  },
  {
    sigla: "—",
    nome: "Museu do Jogo (ex-Museu do Brinquedo)",
    linhas: "Cultura material do brincar, museologia e memória da Educação Física",
    responsavel: "Profª Elizara Carolina Marin",
    fonte: "sigaa",
    nota: "Recebe visitação mediada da comunidade interna e externa à UFPB."
  }
];

const LABORATORIOS_NOTA_GERAL = "O Departamento de Educação Física declara possuir mais de 20 laboratórios de pesquisa e ensino. A lista completa e atualizada deve ser solicitada diretamente à chefia do DEF (coordef@ccs.ufpb.br) ou consultada no site do departamento, em \"Grupos de Pesquisa e Laboratórios\". Esta página reúne os laboratórios já confirmados por fonte pública (SIGAA) ou mapeados diretamente pelo CAEF junto aos docentes.";
