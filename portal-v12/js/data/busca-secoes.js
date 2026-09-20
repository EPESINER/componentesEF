/* =====================================================================
   BUSCA NO PORTAL — Fase 1: índice de seções e canais oficiais do CAEF
   =====================================================================
   Esta é a ÚNICA lista que a busca do cabeçalho consulta. Para adicionar,
   editar ou remover um destino da busca, edite apenas este arquivo —
   não é preciso mexer em js/main.js. Qualquer objeto adicionado aqui
   passa a aparecer automaticamente nos resultados.

   Cada destino é um objeto com:
   - id: identificador único interno (só para organização deste arquivo).
   - tipo: "interna" (uma seção do próprio portal) | "externa" (um canal
     fora do portal, como Instagram ou WhatsApp).
   - titulo: título exibido no resultado. Use o mesmo nome já usado no
     menu/Central do Estudante — nunca invente um nome novo para a seção.
   - resumo: uma frase curta e real sobre o destino (reaproveite o texto
     que já existe no cartão da Central do Estudante ou no cabeçalho da
     própria seção). É o texto que o estudante vê no resultado.
   - destino: para tipo "interna", o id da seção com "#" na frente (ex.:
     "#radar") — precisa ser exatamente o id de uma <section class="tab-
     panel"> em index.html, ou "#creditos". Para tipo "externa", o
     endereço completo (https://...), sempre o mesmo endereço já usado
     no rodapé do portal.
   - termos: lista de palavras que devem levar a esse resultado, além do
     próprio título. Use só palavras que realmente aparecem no título, no
     resumo da seção ou no menu/Central — nunca associe uma palavra a um
     destino só para ele aparecer em mais buscas. Não é preciso repetir
     acentos de propósito: a busca ignora acentuação e maiúsculas/
     minúsculas automaticamente.

   IMPORTANTE:
   - Cada destino deve aparecer só UMA VEZ nesta lista, mesmo que exista
     mais de um link para ele no portal (ex.: "Radar CAEF" é linkado no
     menu, no botão de destaque e na Central — mas é um único objeto
     aqui, para não duplicar resultados).
   - Esta fase cobre só seções do portal e os dois canais já aprovados
     (Instagram e WhatsApp). Avisos do Mural, oportunidades do Radar,
     disciplinas e laboratórios específicos ainda NÃO entram nesta
     busca — isso fica para uma fase futura, avaliada separadamente.
   - Nunca adicione aqui uma seção, canal ou link que ainda não existe
     de verdade no portal.
   ===================================================================== */

const BUSCA_SECOES = [
  {
    id: "inicio",
    tipo: "interna",
    titulo: "Início",
    resumo: "Página inicial do portal, com a Central do Estudante e o guia \"Por onde começar?\".",
    destino: "#inicio",
    termos: ["início", "home", "página inicial", "central do estudante", "por onde começar", "começar"]
  },
  {
    id: "radar",
    tipo: "interna",
    titulo: "Radar CAEF",
    resumo: "Vagas de extensão e de pesquisa em laboratórios do DEF, mapeadas com os responsáveis e reunidas num buscador com filtros.",
    destino: "#radar",
    termos: ["radar", "radar caef", "oportunidades", "vagas", "extensão", "pesquisa", "laboratórios", "eventos", "buscador", "filtros"]
  },
  {
    id: "comparativo",
    tipo: "interna",
    titulo: "Comparativo Bacharelado × Licenciatura",
    resumo: "Entenda as diferenças entre as duas habilitações antes de escolher seu caminho.",
    destino: "#comparativo",
    termos: ["comparativo", "bacharelado", "licenciatura", "diferenças", "habilitações"]
  },
  {
    id: "bacharelado",
    tipo: "interna",
    titulo: "Grade do Bacharelado",
    resumo: "Grade curricular do Bacharelado em Educação Física (currículo 632007).",
    destino: "#bacharelado",
    termos: ["bacharelado", "grade curricular", "grade do bacharelado", "matriz curricular", "disciplinas", "currículo"]
  },
  {
    id: "licenciatura",
    tipo: "interna",
    titulo: "Grade da Licenciatura",
    resumo: "Grade curricular da Licenciatura em Educação Física (currículo 632007).",
    destino: "#licenciatura",
    termos: ["licenciatura", "grade curricular", "grade da licenciatura", "matriz curricular", "disciplinas", "currículo"]
  },
  {
    id: "trilhas",
    tipo: "interna",
    titulo: "Trilhas de disciplinas de saúde",
    resumo: "Disciplinas de outros cursos de saúde que podem contar como optativas.",
    destino: "#trilhas",
    termos: ["trilhas", "trilhas de saúde", "optativas", "formação", "saúde"]
  },
  {
    id: "trilhas-cchla",
    tipo: "interna",
    titulo: "Trilhas CCHLA",
    resumo: "Disciplinas de humanidades que podem contar como optativas, com foco na Licenciatura.",
    destino: "#trilhas-cchla",
    termos: ["trilhas", "trilhas cchla", "humanidades", "optativas", "licenciatura"]
  },
  {
    id: "atividades",
    tipo: "interna",
    titulo: "Atividades acadêmicas especiais",
    resumo: "Atividades acadêmicas especiais aproveitáveis — componentes flexíveis da grade.",
    destino: "#atividades",
    termos: ["atividades", "atividades especiais", "componentes flexíveis", "aproveitamento"]
  },
  {
    id: "quiz",
    tipo: "interna",
    titulo: "Descubra sua trilha",
    resumo: "Um quiz rápido para ver uma sugestão inicial de disciplinas conforme sua área de interesse.",
    destino: "#quiz",
    termos: ["quiz", "trilha", "trilhas", "descubra sua trilha", "teste"]
  },
  {
    id: "carreiras",
    tipo: "interna",
    titulo: "Perfis de carreira",
    resumo: "Áreas de atuação da Educação Física e as disciplinas-chave para cada uma.",
    destino: "#carreiras",
    termos: ["carreiras", "carreira", "perfis de carreira", "áreas de atuação"]
  },
  {
    id: "pesquisa",
    tipo: "interna",
    titulo: "Pesquisa",
    resumo: "Laboratórios, grupos e linhas de pesquisa do DEF/UFPB, com a fonte de cada informação identificada.",
    destino: "#pesquisa",
    termos: ["pesquisa", "laboratórios", "grupos de pesquisa", "linhas de pesquisa"]
  },
  {
    id: "portas-abertas",
    tipo: "interna",
    titulo: "CAEF Portas Abertas",
    resumo: "Visitas guiadas para conhecer laboratórios, espaços acadêmicos e as pessoas que fazem pesquisa no curso.",
    destino: "#portas-abertas",
    termos: ["portas abertas", "visitas guiadas", "laboratórios", "pesquisa"]
  },
  {
    id: "extensao",
    tipo: "interna",
    titulo: "Extensão",
    resumo: "Projetos de extensão do DEF/UFPB mapeados com os coordenadores responsáveis.",
    destino: "#extensao",
    termos: ["extensão", "projetos de extensão", "projetos"]
  },
  {
    id: "formacao",
    tipo: "interna",
    titulo: "CAEF Formação",
    resumo: "Oficinas e minicursos para apoiar a vida acadêmica. A primeira edição será sobre Currículo Lattes.",
    destino: "#formacao",
    termos: ["formação", "caef formação", "oficinas", "minicursos", "currículo lattes"]
  },
  {
    id: "acervo",
    tipo: "interna",
    titulo: "Acervo Acadêmico",
    resumo: "Fontes gratuitas e legais de bibliografia, organizadas por período.",
    destino: "#acervo",
    termos: ["acervo", "acervo acadêmico", "biblioteca", "bibliografia", "materiais acadêmicos", "fontes de estudo"]
  },
  {
    id: "apadrinhamento",
    tipo: "interna",
    titulo: "Apadrinhamento Acadêmico",
    resumo: "Mentoria entre veteranos e calouros. A edição 2026.2 está em andamento.",
    destino: "#apadrinhamento",
    termos: ["apadrinhamento", "apadrinhamento acadêmico", "mentoria", "veteranos", "calouros", "padrinho", "madrinha"]
  },
  {
    id: "ouvidoria",
    tipo: "interna",
    titulo: "Ouvidoria do Discente",
    resumo: "Acesse o canal para encaminhar uma dúvida, sugestão ou manifestação ao CAEF.",
    destino: "#ouvidoria",
    termos: ["ouvidoria", "ouvidoria do discente", "manifestação", "dúvida", "sugestão"]
  },
  {
    id: "loja",
    tipo: "interna",
    titulo: "Loja da Sinergia",
    resumo: "A loja está sendo organizada. Quando os produtos, valores e formas de compra estiverem definidos, as informações serão publicadas aqui.",
    destino: "#loja",
    termos: ["loja", "loja da sinergia", "vestuário", "ingressos", "acessórios", "produtos"]
  },
  {
    id: "mural",
    tipo: "interna",
    titulo: "Mural de Avisos",
    resumo: "Comunicados oficiais do CAEF, selecionados manualmente pela Diretoria Geral a partir dos canais internos do centro acadêmico.",
    destino: "#mural",
    termos: ["mural", "mural de avisos", "avisos", "comunicados"]
  },
  {
    id: "gestao",
    tipo: "interna",
    titulo: "Conheça a Gestão",
    resumo: "Integrantes da Gestão Sinergia, organizados pelas três diretorias do CAEF.",
    destino: "#gestao",
    termos: ["gestão", "conheça a gestão", "sinergia", "diretoria", "coordenação", "integrantes", "quem somos"]
  },
  {
    id: "creditos",
    tipo: "interna",
    titulo: "Créditos",
    resumo: "Quem realizou o portal: gestão Sinergia do CAEF.",
    destino: "#creditos",
    termos: ["créditos", "realização", "sinergia"]
  },
  {
    id: "canal-instagram",
    tipo: "externa",
    titulo: "Instagram do CAEF",
    resumo: "Perfil oficial do CAEF no Instagram.",
    destino: "https://www.instagram.com/caef_ufpb/",
    termos: ["instagram", "insta", "rede social", "canal do caef"]
  },
  {
    id: "canal-whatsapp",
    tipo: "externa",
    titulo: "Comunidade do CAEF no WhatsApp",
    resumo: "Acesso à comunidade oficial do CAEF no WhatsApp.",
    destino: "https://chat.whatsapp.com/GBH6Jfzxzfs1wHDBFTYhsD",
    termos: ["whatsapp", "zap", "comunidade", "grupo"]
  }
];
