/* =====================================================================
   RADAR CAEF — dados de oportunidades (Extensão, Pesquisa/Laboratórios,
   Monitoria, Eventos)
   =====================================================================
   COMO EDITAR (sem programar):
   1. Cada oportunidade é um bloco { ... } dentro do array OPORTUNIDADES.
   2. Copie um bloco existente do MESMO "type" como modelo, cole antes do
      "];" final e altere os valores entre aspas.
   3. Campos que não têm informação: deixe "" (string vazia) — o site
      mostra automaticamente "Não informado" ou esconde o campo.
   4. status.availability aceita apenas: "vagas" | "consultar" | "encerrado"
   5. NUNCA publique um projeto sem confirmar autorização de divulgação
      do coordenador/docente responsável (campo authorized: true).
   6. Após editar, atualize "lastUpdated" (formato "DD/MM/AAAA").
   7. type aceita: "extensao" | "pesquisa" | "monitoria" | "evento"
   ===================================================================== */

const OPORTUNIDADES = [

  // ---------------------------------------------------------------
  // EXTENSÃO — fonte: Mapeamento de Projetos de Extensão - CAEF UFPB
  // (respostas), Google Forms, coletado ago/2026 pela Diretoria de
  // Ensino, Pesquisa e Extensão do CAEF.
  // ---------------------------------------------------------------
  {
    id: "ext-corre",
    type: "extensao",
    title: "CORRE — Transformando Saúde e Qualidade de Vida através do Movimento",
    shortTitle: "CORRE (CORREDEF)",
    area: "Saúde",
    coordinator: "Prof. Luciano Meireles de Pontes",
    contact: "projetocorreufpb@gmail.com",
    description: "Programa estruturado de condicionamento físico com ênfase em treinamento de iniciação à corrida, caminhada e exercícios funcionais, adaptado às necessidades e objetivos individuais da comunidade interna e externa da UFPB.",
    audience: "Discentes, docentes, servidores técnico-administrativos, terceirizados e comunidade externa, 18+ anos.",
    participationType: "Voluntário",
    workload: "Mínimo 4h; máximo 8h semanais",
    requirements: "CRA atualizado; estar cursando até o 5º período (Bacharelado ou Licenciatura); disponibilidade em pelo menos 2 dias na semana; interesse e compromisso com atendimento humanizado.",
    selection: "Inscrição via formulário de interesse.",
    selectionLink: "https://forms.gle/N7En6TbHYm2rkhjW6",
    shifts: ["Manhã", "Tarde"],
    status: { availability: "consultar" },
    postgrad: false,
    duration: "7 a 12 meses",
    lastUpdated: "06/08/2026",
    authorized: true
  },
  {
    id: "ext-mulher-oke",
    type: "extensao",
    title: "Mulher-okê: empoderamento, resistência das mulheres, música e karaokê",
    shortTitle: "Mulher-okê",
    area: "Educação",
    coordinator: "Profª Anamélia Soares Nóbrega",
    contact: "projetomulheroke@gmail.com",
    description: "Dialoga sobre os direitos femininos através da análise das letras de músicas, utilizando o karaokê como instrumento de motivação dos(as) participantes.",
    audience: "Alunos(as) e demais pessoas interessadas no assunto.",
    participationType: "Voluntário",
    workload: "4h semanais",
    requirements: "Alunos(as) do 2º ao 7º período.",
    selection: "Análise do histórico acadêmico.",
    selectionLink: "",
    shifts: ["Tarde"],
    status: { availability: "consultar" },
    postgrad: false,
    duration: "7 a 12 meses",
    lastUpdated: "07/08/2026",
    authorized: true
  },
  {
    id: "ext-progym",
    type: "extensao",
    title: "PROGYM UFPB — Ginástica Artística como Intervenção na Prática Pedagógica",
    shortTitle: "PROGYM UFPB",
    area: "Saúde",
    coordinator: "Prof. Claudio Meireles",
    contact: "claudiomeireles@hotmail.com",
    description: "Prática de melhoria do condicionamento físico por meio do esporte — ginástica artística como forma de melhoria dos aspectos biológicos, psicológicos e sociais dos participantes. Um dos projetos mais antigos do departamento, integrando ensino, pesquisa e extensão.",
    audience: "Público interno e externo à UFPB, 18+ anos.",
    participationType: "Bolsa PROEX",
    workload: "12h semanais",
    requirements: "Participação mínima de 6 meses no projeto; ter cursado a disciplina de Ginástica Artística com média mínima 7,0; gostar de fazer, ensinar e praticar a modalidade.",
    selection: "Entrevista, CRA e pontuação por participação anterior no teste do PROGYM.",
    selectionLink: "",
    shifts: ["Manhã", "Tarde"],
    status: { availability: "consultar" },
    postgrad: false,
    duration: "Mais de 12 meses",
    lastUpdated: "12/08/2026",
    authorized: true
  },
  {
    id: "ext-edupopinsus",
    type: "extensao",
    title: "EduPopInSUS — Extensão em Educação Popular e Interprofissional no SUS",
    shortTitle: "EduPopInSUS",
    area: "Saúde",
    coordinator: "Prof. André Luís Façanha da Silva",
    contact: "andre.facanha@academico.ufpb.br",
    description: "Promove a vivência extensionista na Estratégia Saúde da Família a partir da educação popular, educação interprofissional e clínica ampliada, com inserção de estudantes na Rede de Atenção à Saúde de João Pessoa (comunidade São Rafael), em equipe interprofissional com outros cursos da área da saúde.",
    audience: "Comunidade da USF São Rafael (~1.619 usuários, 719 famílias) e equipe de saúde.",
    participationType: "Bolsa PROEX",
    workload: "20h semanais",
    requirements: "Interesse.",
    selection: "Carta de intenção.",
    selectionLink: "",
    shifts: ["Manhã", "Tarde"],
    status: { availability: "consultar" },
    postgrad: false,
    duration: "7 a 12 meses",
    lastUpdated: "20/08/2026",
    authorized: true
  },
  {
    id: "ext-afirmacoes-jampasus",
    type: "extensao",
    title: "AfirmAções JampaSUS — pesquisa-ação, formação, comunicação e cuidado em saúde mental",
    shortTitle: "AfirmAções JampaSUS",
    area: "Saúde",
    coordinator: "Prof. André Luís Façanha da Silva",
    contact: "andre.facanha@academico.ufpb.br",
    description: "Projeto de pesquisa-ação junto a populações em situação de vulnerabilidade social, voltado à Atenção Básica de João Pessoa, com foco em saúde mental, educação popular em saúde e fortalecimento do cuidado em rede.",
    audience: "Populações socialmente vulnerabilizadas atendidas pela Atenção Básica de João Pessoa.",
    participationType: "Bolsa FLUEX",
    workload: "12h semanais",
    requirements: "Interesse.",
    selection: "Carta de intenção.",
    selectionLink: "",
    shifts: ["Manhã", "Tarde"],
    status: { availability: "consultar" },
    postgrad: false,
    duration: "Mais de 12 meses",
    lastUpdated: "20/08/2026",
    authorized: true
  },

  // ---------------------------------------------------------------
  // PESQUISA / LABORATÓRIOS — fonte: Mapeamento de Grupos de Pesquisa
  // - CAEF UFPB (respostas), coletado ago/2026.
  // ---------------------------------------------------------------
  {
    id: "pesq-gepeaf-questionario",
    type: "pesquisa",
    title: "GEPEAF — Questionário eletrônico de atividade física e comportamento sedentário em adolescentes",
    shortTitle: "GEPEAF",
    area: "Atividade Física e Saúde",
    coordinator: "Prof. José Cazuza de Farias Júnior",
    contact: "jcazuzajr@gmail.com",
    labName: "Grupo de Estudos e Pesquisa em Epidemiologia da Atividade Física (GEPEAF)",
    description: "Construção, confiabilidade e validade de um questionário eletrônico (baseado na web) para mensurar a atividade física e o comportamento sedentário de adolescentes de 10 a 19 anos.",
    modalities: ["PIBIC/PIBITI", "Estágio em Laboratório", "Orientação de TCC"],
    requirements: "Ter interesse em participar.",
    selection: "Procurar o GEPEAF pessoalmente.",
    selectionLink: "",
    level: ["Graduação", "Mestrado", "Doutorado", "Pós-doutorado"],
    dedication: "Até 5h semanais",
    shifts: [],
    status: { availability: "vagas" },
    lastUpdated: "06/08/2026",
    authorized: true
  },
  {
    id: "pesq-letfads",
    type: "pesquisa",
    title: "Genética do emagrecimento, controle de carga de treino, nutrição esportiva e exercício no tratamento da hipertensão",
    shortTitle: "LETFADS — Treinamento e Saúde",
    area: "Biodinâmica/Fisiologia",
    coordinator: "Prof. Alexandre Sérgio Silva",
    contact: "alexandresergiosilva@yahoo.com.br · WhatsApp (83) 9 8875-4775",
    labName: "Laboratório de Estudo do Treinamento Físico Aplicado, Desempenho e Saúde",
    description: "Quatro linhas de pesquisa investigam fatores genéticos e metabólicos que influenciam o efeito do treinamento físico no emagrecimento, controle da pressão arterial e eficácia de alimentos in natura no desempenho de atletas, além de ferramentas de controle fisiológico do treinamento.",
    modalities: ["PIBIC/PIBITI", "PIVIC/Voluntário", "Estágio em Laboratório", "Orientação de TCC"],
    requirements: "Aberto desde o primeiro período.",
    selection: "Contato direto por WhatsApp com o Prof. Alexandre.",
    selectionLink: "",
    level: ["Graduação", "Mestrado", "Doutorado", "Pós-doutorado"],
    dedication: "Até 5h semanais",
    shifts: [],
    status: { availability: "vagas" },
    lastUpdated: "09/08/2026",
    authorized: true
  },
  {
    id: "pesq-ericc",
    type: "pesquisa",
    title: "ERICC — Estudo de Fatores de Risco de Doenças e Agravos Não Transmissíveis em Crianças",
    shortTitle: "ERICC",
    area: "Atividade Física e Saúde",
    coordinator: "Prof. Felipe Vogt Cureau",
    contact: "fvc@academico.ufpb.br",
    labName: "Grupo de Estudos em Epidemiologia da Atividade Física (GEPEAF)",
    description: "Inquérito de base escolar com cerca de 12.000 crianças de 6 a 12 anos, matriculadas em escolas públicas e privadas, em áreas urbanas e rurais de cinco macrorregiões brasileiras.",
    modalities: ["PIVIC/Voluntário", "Estágio em Laboratório", "Orientação de TCC"],
    requirements: "Ter cursado as disciplinas de Análise de Dados e Atividade Física e Saúde (ou Educação Física e Saúde).",
    selection: "Contato por e-mail com o professor.",
    selectionLink: "",
    level: ["Graduação", "Mestrado", "Doutorado", "Pós-doutorado"],
    dedication: "De 11h a 20h semanais",
    shifts: [],
    status: { availability: "vagas" },
    lastUpdated: "10/08/2026",
    authorized: true
  },
  {
    id: "pesq-lepeftfs",
    type: "pesquisa",
    title: "LEPEFTFS — Educação Física, trabalho e formação no SUS",
    shortTitle: "LEPEFTFS",
    area: "Estudos Socioculturais/Pedagógicos",
    coordinator: "Prof. André Luís Façanha da Silva",
    contact: "andre.facanha@academico.ufpb.br",
    labName: "Laboratório de Extensão e Pesquisa em Educação Física, Trabalho e Formação em Saúde",
    description: "Tem como objeto de ensino, pesquisa e extensão a Educação Física, o trabalho e a formação no Sistema Único de Saúde (SUS). Atualmente com projeto de pesquisa e extensão em saúde mental na Atenção Primária à Saúde (programa AfirmaSUS/Ministério da Saúde, 2025–2028).",
    modalities: ["PIBIC/PIBITI"],
    requirements: "Interesse e disponibilidade de tempo para participar dos encontros.",
    selection: "Procurar o Prof. André Façanha.",
    selectionLink: "",
    level: ["Graduação"],
    dedication: "Até 5h semanais",
    shifts: [],
    status: { availability: "vagas" },
    lastUpdated: "17/08/2026",
    authorized: true
  },
  {
    id: "pesq-social-esporte-clube",
    type: "pesquisa",
    title: "Social Esporte Clube — Sociologia do Esporte",
    shortTitle: "Social Esporte Clube",
    area: "Estudos Socioculturais/Pedagógicos",
    coordinator: "Murilo Moraes de Oliveira (líder) · Billy Graeff Bastos (vice-líder)",
    contact: "billygraeff@gmail.com · murilaum@gmail.com",
    labName: "Social Esporte Clube",
    description: "Grupo dedicado ao avanço e consolidação da Sociologia do Esporte, com ênfase nos contextos do Brasil e da América Latina, discutindo temas alinhados às perspectivas do Sul Global. Possui vocação para intercâmbio acadêmico nacional e internacional (ISSA, ALESDE).",
    modalities: ["PIBIC/PIBITI", "PIVIC/Voluntário", "Estágio em Laboratório", "Orientação de TCC"],
    requirements: "Não informado.",
    selection: "Enviar e-mail.",
    selectionLink: "",
    level: ["Graduação", "Mestrado", "Doutorado", "Pós-doutorado"],
    dedication: "De 6h a 10h semanais",
    shifts: [],
    status: { availability: "vagas" },
    lastUpdated: "18/08/2026",
    authorized: true
  },

  // ---------------------------------------------------------------
  // EVENTOS — planejados, sem data confirmada. Fonte: Plano de Ação
  // e Banco de Ideias — Diretoria de Ensino, Pesquisa e Extensão.
  // ---------------------------------------------------------------
  {
    id: "evt-semana-academica",
    type: "evento",
    title: "Semana Acadêmica de Educação Física (SEF)",
    shortTitle: "Semana Acadêmica de EF",
    area: "Institucional",
    coordinator: "Diretoria de Ensino, Pesquisa e Extensão do CAEF",
    contact: "",
    description: "Evento integrador com apresentação de resumos, minicursos e mostras de pesquisa e extensão do curso. Projeto de médio/longo prazo da diretoria — ainda sem data, local ou programação definidos.",
    shifts: [],
    status: { availability: "encerrado", note: "Em planejamento — sem data definida" },
    lastUpdated: "29/07/2026",
    authorized: true
  }

];

/* Nenhuma vaga de MONITORIA foi cadastrada até o momento.
   Quando houver edital, adicione um objeto com type: "monitoria"
   seguindo o modelo das oportunidades de pesquisa acima. */
