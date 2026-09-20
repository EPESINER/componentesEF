/* =====================================================================
   CONHEÇA A GESTÃO — integrantes e diretorias da Gestão Sinergia
   =====================================================================
   Fonte dos nomes, cargos e agrupamentos: artes de apresentação "Conheça
   a Gestão Sinergia 2026–2027" (@caef_ufpb) e confirmação explícita do
   Coordenador de Ensino, Pesquisa e Extensão do CAEF, em conversa
   registrada nesta etapa do projeto. As fotografias foram associadas
   uma a uma, mediante conferência visual aprovada nome a nome — nenhuma
   foi deduzida pela aparência.

   Para adicionar, corrigir ou remover um integrante, edite apenas este
   arquivo — não é preciso mexer em js/main.js.

   Cada integrante é um objeto com:
   - id: identificador único interno.
   - nome: nome exibido, exatamente como está na arte.
   - funcao: cargo exibido, exatamente como está na arte (ex.:
     "Coordenador Geral"). Nunca um cargo de coordenação que a arte não
     tenha indicado para a pessoa.
   - diretoriaId: liga o integrante a um objeto de GESTAO_DIRETORIAS.
   - area: rótulo da área/diretoria exibido no cartão, com a grafia
     usada nas próprias artes da Gestão Sinergia.
   - foto: nome do arquivo em assets/img/gestao/.
   - fotoPosicao: valor CSS de object-position, para enquadrar o rosto
     sem distorcer ou cortar a foto — ajuste aqui, se necessário, sem
     precisar reprocessar a imagem.

   Todos os integrantes — incluindo o Coordenador de Ensino, Pesquisa e
   Extensão — são apresentados da mesma forma nesta lista: nome, foto e
   cargo na gestão, sem distinção. O crédito pelo desenvolvimento do
   portal fica só na seção "Créditos" (index.html), separado do cargo de
   gestão e sem ser descrito como atribuição estatutária da diretoria.

   IMPORTANTE — publicação pública: esta versão é só para conferência
   local (Live Server). O Coordenador ainda vai confirmar, pessoa a
   pessoa, a autorização de uso de cada fotografia antes de qualquer
   publicação real do portal (GitHub/Netlify). Nenhum arquivo deste
   projeto deve ser publicado nesses destinos sem essa confirmação.
   ===================================================================== */

const GESTAO_DIRETORIAS = [
  {
    id: "organizacao",
    nome: "Coordenação Geral",
    resumoEstatuto: "No Estatuto do CAEF, esta função corresponde à Diretoria de Organização (Art. 20º): condução das reuniões, acompanhamento das diretorias, administração da entidade e prestação de contas.",
    artigo: "Art. 20º do Estatuto do CAEF"
  },
  {
    id: "ensino-pesquisa-extensao",
    nome: "Ensino, Pesquisa e Extensão",
    resumoEstatuto: "A Diretoria de Ensino, Pesquisa e Extensão (Art. 23º do Estatuto do CAEF) atua no acompanhamento do ensino, da oferta de disciplinas e dos projetos de pesquisa e extensão, além da promoção de atividades acadêmicas.",
    artigo: "Art. 23º do Estatuto do CAEF"
  },
  {
    id: "esporte-cultura-eventos",
    nome: "Esportes, Cultura e Eventos",
    resumoEstatuto: "A Diretoria de Esporte, Cultura e Eventos (Art. 22º do Estatuto do CAEF) organiza eventos esportivos, culturais e acadêmicos e promove iniciativas de integração estudantil.",
    artigo: "Art. 22º do Estatuto do CAEF"
  }
];

/* As competências acima são da DIRETORIA como um todo — nunca de uma
   pessoa específica. Os cartões individuais mostram só nome, função
   confirmada, área e fotografia. */

const GESTAO_INTEGRANTES = [
  {
    id: "maxuell-lopes",
    nome: "Maxuell Lopes",
    funcao: "Coordenador Geral",
    diretoriaId: "organizacao",
    area: "Coordenação Geral",
    foto: "maxuell-lopes.jpg",
    fotoPosicao: "50% 18%",
  },
  {
    id: "kaique-santos",
    nome: "Kaique Santos",
    funcao: "Vice-coordenador Geral",
    diretoriaId: "organizacao",
    area: "Coordenação Geral",
    foto: "kaique-santos.jpg",
    fotoPosicao: "50% 22%",
  },
  {
    id: "aryuska-souza",
    nome: "Aryuska Souza",
    funcao: "Vice-coordenadora Geral",
    diretoriaId: "organizacao",
    area: "Coordenação Geral",
    foto: "aryuska-souza.jpg",
    fotoPosicao: "50% 18%",
  },
  {
    id: "luiz-felipe",
    nome: "Luiz Felipe",
    funcao: "Coordenador",
    diretoriaId: "ensino-pesquisa-extensao",
    area: "Ensino, Pesquisa e Extensão",
    foto: "luiz-felipe.jpg",
    fotoPosicao: "50% 12%",
  },
  {
    id: "evely-kaline",
    nome: "Evely Kaline",
    funcao: "Integrante",
    diretoriaId: "ensino-pesquisa-extensao",
    area: "Ensino, Pesquisa e Extensão",
    foto: "evely-kaline.jpg",
    fotoPosicao: "50% 18%",
  },
  {
    id: "dheizfy-pereira",
    nome: "Dheizfy Pereira",
    funcao: "Integrante",
    diretoriaId: "ensino-pesquisa-extensao",
    area: "Ensino, Pesquisa e Extensão",
    foto: "dheizfy-pereira.jpg",
    fotoPosicao: "50% 10%",
  },
  {
    id: "raphael-sousa",
    nome: "Raphael Sousa",
    funcao: "Integrante",
    diretoriaId: "ensino-pesquisa-extensao",
    area: "Ensino, Pesquisa e Extensão",
    foto: "raphael-sousa.jpg",
    fotoPosicao: "50% 28%",
  },
  {
    id: "allan-rodriguez",
    nome: "Allan Rodriguez",
    funcao: "Coordenador",
    diretoriaId: "esporte-cultura-eventos",
    area: "Esportes, Cultura e Eventos",
    foto: "allan-rodriguez.jpg",
    fotoPosicao: "50% 18%",
  },
  {
    id: "ygor-kalenieves",
    nome: "Ygor Kalenieves",
    funcao: "Integrante",
    diretoriaId: "esporte-cultura-eventos",
    area: "Esportes, Cultura e Eventos",
    foto: "ygor-kalenieves.jpg",
    fotoPosicao: "50% 28%",
  },
  {
    id: "joao-felipe",
    nome: "João Felipe",
    funcao: "Integrante",
    diretoriaId: "esporte-cultura-eventos",
    area: "Esportes, Cultura e Eventos",
    foto: "joao-felipe.jpg",
    fotoPosicao: "50% 12%",
  }
];
