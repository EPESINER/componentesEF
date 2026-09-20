# Relatório Final — Evolução do Portal CAEF/UFPB

Este relatório documenta o trabalho realizado sobre o portal de Educação Física do CAEF/UFPB. Ele **não substitui o código** — é um resumo do que foi feito, do que precisa de atenção humana e do que ficou pendente. O produto principal é a pasta `dist/`, pronta para publicação, e o `dist/README.md`, com instruções de manutenção.

> **Nota de atualização:** a identidade visual descrita na seção "Identidade visual" abaixo (tipografia Oswald + JetBrains Mono) reflete a rodada em que este relatório foi escrito. Desde então, a identidade visual do portal passou por revisões posteriores conduzidas pela gestão Sinergia, e a versão **atualmente publicada usa uma família tipográfica única (Source Sans 3) para títulos, corpo, navegação e rótulos**, com hierarquia definida por peso/tamanho/traço em vez de fontes diferentes por função. Este relatório é mantido como registro histórico da decisão original; a seção 9 (ao final deste arquivo) documenta a rodada de manutenção mais recente e a identidade tipográfica realmente em vigor.

---

## 1. Resumo do que foi feito

O portal foi redesenhado e reorganizado mantendo 100% do conteúdo curricular original (grades do Bacharelado e da Licenciatura, trilhas de saúde e CCHLA, quiz de trilhas, comparativo entre cursos, perfis de carreira) e adicionando uma nova camada de serviços e descoberta de oportunidades, construída a partir de documentos reais da Diretoria de Ensino, Pesquisa e Extensão do CAEF (localizados no Google Drive, conforme autorizado) e do `index.html` original enviado.

Estrutura final:
- **Início** — nova página inicial como hub de navegação ("O que você procura?"), com 8 atalhos diretos e um bloco "Acontecendo agora" com apenas informações reais e verificadas (nada de notícias fictícias).
- **Radar CAEF** (novo) — ferramenta central de busca e filtro de oportunidades de Extensão, Pesquisa, Monitoria e Eventos, com contadores dinâmicos por filtro e painel de detalhes.
- **Ensino** — as 8 páginas originais preservadas integralmente (grades, trilhas, quiz, carreiras), com navegação lateral e busca global adicionadas.
- **Pesquisa e Laboratórios** (novo) — lista de laboratórios/grupos do DEF, distinguindo fonte pública (SIGAA) de mapeamento direto do CAEF.
- **CAEF Portas Abertas** (novo) — programa de visitação a laboratórios, hoje em estado "sem edição definida" (não inventamos uma data).
- **Extensão** — chamada para o Radar CAEF + dado histórico oficial do SIGAA, claramente distinguido do mapeamento do CAEF.
- **CAEF Formação** (novo) — ciclo de oficinas, com o exemplo real já mapeado ("Currículo Lattes do Zero"), campos de logística em aberto exibidos como "Em breve".
- **Acervo Acadêmico Digital** (novo) — fontes oficiais gratuitas (CAPES, SciELO, SIBi/UFPB), acesso ao Drive organizado por período, regras de uso e a campanha "Desengaveta".
- **Apadrinhamento Acadêmico** — reformulado como programa **em execução** (não "futuro"), com jornada em 5 fases, atribuições, regras e horas de AACC (confirmadas em até 60h/semestre, ver seção 3).
- **Ouvidoria do Discente** — canal reformulado com escopo claro, linguagem de tratamento responsável (sem prometer sigilo absoluto não documentado) e uma seção "Transparência da Ouvidoria" (hoje em estado "dados ainda não publicados", sem números inventados).
- **Loja, Créditos e Rodapé** — Loja mantida em "em breve" (fiel ao conteúdo original); Créditos preservado; rodapé institucional novo, deixando claro que o CAEF é uma entidade estudantil, distinta dos canais oficiais da UFPB.

### Identidade visual
O antigo padrão "pista/raia" foi reinterpretado como um sistema editorial mais sóbrio: paleta verde/dourado aprofundada, tipografia de destaque (Oswald) + texto (Source Sans 3) + mono (JetBrains Mono), numeração de seção estilo editorial ("01 — ..."), linhas finas em SVG e grid sutil no hero — sem dumbbells, sem mascotes, sem glassmorphism, sem gradientes/cards excessivos. As imagens originais que pareciam ilustração genérica de IA/academia/fitness foram deliberadamente removidas do design; os dois logos institucionais reais (CAEF e Sinergia) foram mantidos.

---

## 2. Bugs corrigidos

1. **Link de filtro do Radar CAEF não funcionava.** Os botões "Ver vagas de Extensão/Pesquisa no Radar" (nas páginas de Extensão e Pesquisa) marcavam a caixinha de filtro certa, mas a lista de resultados não era recalculada — o evento `change` disparado por código não propagava até o listener do filtro (`new Event('change')` sem `{bubbles:true}`). Corrigido: o evento agora é disparado com `bubbles:true`, e o pulo do link já filtra corretamente (testado nas duas direções: Pesquisa→Radar e Extensão→Radar).
2. **Menu mobile (hambúrguer) nunca abria.** A regra CSS que mostra o menu ao marcar o checkbox (`.nav-check:checked ~ .nav-inner .nav-menu`) dependia de `.nav-inner` ser irmão direto do checkbox — mas `.nav-inner` está um nível abaixo, dentro do `<header>`. O seletor `~` (irmão geral) nunca combinava, então o menu mobile nunca aparecia. Corrigido para `.nav-check:checked ~ .site-nav .nav-menu` (e equivalentes para a animação do ícone). Testado em viewport de 390px: o menu abre, navega e fecha corretamente.

Ambos os bugs foram encontrados por meio de testes automatizados com navegador headless (Playwright) cobrindo navegação por abas, busca do Ensino, filtros e painel de detalhes do Radar CAEF, menu mobile e o quiz — não apenas por leitura do código.

---

## 3. REQUER VALIDAÇÃO HUMANA — itens sensíveis

### 3.1. Formulário da Ouvidoria — esquema de campos não confirmado
Não foi possível abrir o arquivo do Google Forms da Ouvidoria diretamente pelo Google Drive (erro de tipo de arquivo não suportado / erro interno na segunda tentativa). O **link do formulário em si é real e foi confirmado** e está em uso no site (`OUVIDORIA_FORM_LINK`). O que não pôde ser verificado foi a lista exata de perguntas do formulário — o escopo divulgado no site (`OUVIDORIA_ESCOPO`) foi construído a partir do documento "Plano de Ação e Banco de Ideias" da Diretoria, não do formulário em si. **Recomenda-se que alguém com acesso direto ao Google Forms confirme se a lista de escopo no site corresponde exatamente às perguntas do formulário.**

### 3.2. Exclusões por falta de autorização de divulgação
Os mapeamentos de Extensão e de Pesquisa/Laboratórios continham, cada um, uma resposta claramente marcada como **sem autorização de divulgação** por parte da responsável (projeto de paradesporto/atividade adaptada vinculado à Profª Elaine Cappellazzo Souto). Essas respostas **não foram publicadas no Radar CAEF**. Importante notar a distinção: o **Laboratório de Estudos e Pesquisa em Atividade Física Adaptada (LEPAFA)**, vinculado à mesma professora, é informação pública já publicada pelo próprio SIGAA da UFPB — por isso ele aparece normalmente na página "Pesquisa e Laboratórios" (fonte `"sigaa"`), mas a vaga/projeto específico mapeado pelo formulário do CAEF não aparece no Radar até que haja autorização explícita. Uma resposta do tipo "não tenho projeto de extensão" também foi descartada por não representar uma oportunidade real.

### 3.3. Status formal da emenda do Acervo Acadêmico junto ao Colegiado (novo nesta rodada)
A "Proposta de Emenda — Acervo Acadêmico Digital e Colaborativo" é uma carta formal, redigida pelo próprio CAEF, endereçada ao Colegiado do curso de Bacharelado em Educação Física. Porém, nos documentos acessíveis não há confirmação de protocolo ou recebimento formal (número de processo, ata, resposta do Colegiado) — o arquivo está apenas no Drive de quem o redigiu, com duas versões de rascunho a cerca de 3 horas de diferença uma da outra, o que sugere que ainda estava em fase de elaboração. Por isso o site **não afirma** que a emenda está formalmente "em tramitação"; usa linguagem compatível apenas com o estágio confirmado (proposta redigida e endereçada ao Colegiado — ver detalhes em 4.5). **Ação recomendada:** confirmar número de protocolo/ata antes de atualizar `ACERVO_STATUS` (em `dist/js/data/acervo.js`) para `"em_tramitacao"` ou `"aprovada"`.

### 3.4. Item resolvido nesta rodada — carga horária de AACC do Apadrinhamento
Na versão anterior deste relatório, esta seção sinalizava uma divergência entre 60h (fonte oficial) e uma faixa de 15–30h (minuta interna posterior) como pendente de validação. A Diretoria confirmou explicitamente que **60 horas é o valor válido** para a versão atual do portal, e que a minuta de 15–30h está desatualizada e não deve mais ser exibida. O aviso "Requer validação humana" específico para essa divergência foi removido do site e dos dados (detalhes em 4.1 e 4.3). Este item está encerrado e não exige mais nenhuma ação.

---

## 4. Revisão Pré-Publicação (segunda rodada — logo oficial, auditoria de afirmações e testes finais)

Esta seção documenta uma rodada adicional de revisão, feita imediatamente antes da publicação, a pedido explícito da Diretoria. O objetivo não foi redesenhar o portal, e sim: (a) substituir a logomarca do CAEF pela versão oficial mais recente, (b) auditar cada afirmação pública do site em busca de dados sem lastro documental confirmado, e (c) revalidar tudo com testes de desktop e mobile antes da entrega final. A estrutura, o sistema visual, a arquitetura de navegação e o Radar CAEF aprovados anteriormente foram preservados integralmente — nenhum deles foi reconstruído.

### 4.1 Afirmações corrigidas
- **Horas de AACC do Apadrinhamento** — com a confirmação explícita da gestão do programa, o texto do site e o arquivo `apadrinhamento.js` passaram a informar "até 60 horas de AACC por semestre de participação ativa", sempre acompanhado da ressalva de que a concessão depende do cumprimento integral dos critérios do programa (não é automática). A faixa antiga de 15–30h não aparece em nenhum lugar do site.
- **Linguagem de confidencialidade da Ouvidoria** — a frase que prometia tratamento "confidencial" foi trocada por uma formulação mais precisa: "tratadas de forma responsável, com acesso restrito às pessoas responsáveis pelo encaminhamento", sem prometer sigilo absoluto ou anonimato que não está documentado formalmente.
- **Descrição do CAEF Formação** — o texto de apresentação, que citava "PIBIC" como parte do ciclo, foi ajustado para descrever apenas o que está confirmado (oficina introdutória de Currículo Lattes), evitando presumir um escopo mais amplo do programa.
- **Status do Acervo Acadêmico** — o texto que citava "emenda formal em tramitação no Colegiado" foi trocado por uma formulação mais cautelosa: "emenda encaminhada ao Colegiado do curso — status formal a confirmar" (o campo `ACERVO_STATUS` mudou de `"em_tramitacao"` para `"proposta_enviada"`; ver seção 3.3).

### 4.2 Afirmações neutralizadas / dados removidos por falta de confirmação
A frase "121 ações de extensão desde 2017 [...] cerca de 1.800 pessoas por semestre" foi **removida** da página de Extensão por não ter sido reverificada na fonte primária nesta rodada (na primeira rodada esse número havia sido mantido — ver seção 3.4 sobre o item agora resolvido de forma diferente: o número não ficou, foi retirado). Em seu lugar, o site descreve, em linguagem qualitativa, que o DEF mantém desde 2017 ações de extensão em frentes diversas (esporte, atividade física para crianças e idosos, Educação Física para pessoas com deficiência, lazer), sem apresentar nenhum número substituto inventado.

### 4.3 Revisão do Apadrinhamento Acadêmico
A caixa "Horas de AACC" na página de Apadrinhamento agora mostra "Até 60 horas de AACC por semestre de participação ativa", uma observação de que a concessão não é automática, e a lista real de critérios de participação/certificação — sem exibir a faixa antiga de 15–30h. O aviso "Requer validação humana" que existia especificamente para essa divergência foi removido, por instrução explícita da Diretoria e por o item estar resolvido (seção 3.4).

### 4.4 Revisão da Ouvidoria
Além da mudança de linguagem sobre confidencialidade (4.1), foi reconfirmado que o site não publica manifestações individuais, nomes, e-mails, matrículas ou qualquer dado identificável de quem usa o canal — a seção "Transparência da Ouvidoria" continua mostrando apenas dados agregados (hoje, "ainda não publicados"), nunca casos individuais. Nenhuma nova promessa de sigilo além do que está documentado foi adicionada.

### 4.5 Revisão do Acervo Acadêmico
Os dois documentos-fonte (Guia de Acesso e Proposta de Emenda) foram reconsultados diretamente no Google Drive. A proposta é uma carta formal endereçada ao Colegiado, mas não há, nos documentos acessíveis, confirmação de protocolo/recebimento — apenas o arquivo no Drive pessoal de quem a redigiu, com duas versões de rascunho a cerca de 3 horas de diferença, sugerindo que ainda estava em fase de elaboração. Por isso a linguagem pública foi ajustada para não afirmar tramitação formal (4.1), e o item permanece sinalizado como "Requer validação humana" internamente (3.3) até que haja confirmação de protocolo. O acervo em si (Drive organizado por período) já funciona normalmente na prática, independente do status da emenda.

### 4.6 Revisão do CAEF Formação
A descrição do ciclo de oficinas foi restrita ao que está de fato confirmado: uma oficina introdutória de Currículo Lattes ("Currículo Lattes do Zero"). Referências a PIBIC ou a busca de orientador foram removidas do texto de apresentação por não estarem documentalmente confirmadas como parte do escopo atual do programa. Data, local, ministrante e número de vagas continuam exibidos como "Em breve", sem nenhum dado inventado.

### 4.7 Substituição da logomarca do CAEF
- A logomarca oficial mais recente, fornecida pela Diretoria, substituiu a versão anterior em todos os pontos do site: cabeçalho (desktop e mobile), menu mobile, rodapé, seção de Créditos, favicon e imagem de Open Graph (compartilhamento em redes sociais/mensageiros).
- O processamento foi estritamente não destrutivo: a imagem original não foi recriada, redesenhada, regerada por IA, recolorida ou estilizada — apenas redimensionada (reamostragem Lanczos) para os tamanhos necessários em cada contexto, preservando integralmente proporções, cores e composição.
- Como o fundo branco da imagem oficial faz parte do arquivo (sem transparência) e o site usa fundos escuros no cabeçalho e no rodapé, foi criado um componente de apresentação não destrutivo (`.brand-mark`, em `css/style.css`) — um selo branco arredondado que emoldura a logo sem cortar nem alterar nenhum elemento dela. Essa foi a alternativa escolhida a um recorte circular: uma análise da imagem mostrou que um recorte circular cortaria o texto do nome institucional na parte inferior da arte.
- Cabeçalho: a logo aparece sozinha dentro do selo, em altura reduzida (46px desktop / 38px mobile) para não aumentar a altura do cabeçalho nem comprometer a legibilidade da navegação, sem redesenhar a marca em si.
- Rodapé e Créditos: a logo aparece maior (64px), com mais espaço de respiro, mantendo bom contraste sobre o fundo escuro.
- Favicon: a arte completa da logo perde legibilidade em 16×16/32×32 (é um selo circular com texto). Não foi criado um símbolo novo para substituí-la — isso equivaleria a redesenhar a marca. O favicon atual é uma versão reduzida e conservadora da própria logo oficial. **Fica documentado como limitação temporária**: se a Diretoria quiser um favicon mais legível nesse tamanho, o caminho recomendado é solicitar ao responsável pela identidade visual uma versão simplificada oficial (um monograma, por exemplo) — o portal não deve criar essa variação por conta própria.
- Open Graph (`og:image`): antes desta rodada não havia nenhuma imagem de Open Graph configurada. Foi criada uma composição simples e não destrutiva (1200×630px, fundo verde escuro sólido da paleta do site, logo oficial centralizada em tamanho grande), sem elementos gráficos adicionais que pudessem descaracterizar a marca.
- Texto alternativo: todas as instâncias da logo usam `alt="Logo do Centro Acadêmico de Educação Física — CAEF"`.
- Uso de cor: as cores da logo nova (azul-marinho, verde, amarelo/dourado, branco, preto/cinza) não motivaram nenhuma paleta nova no site — a paleta verde/dourado já usada no redesenho foi mantida como está, evitando tanto um redesenho completo quanto uma composição que lembrasse a bandeira do Brasil.
- Arquivos antigos removidos/substituídos: `assets/img/logo-caef.png` (cabeçalho/rodapé/créditos, sobrescrito pela versão oficial em 480×480) e `assets/img/favicon.png` (sobrescrito, 64×64). Nenhum arquivo com a logo antiga permanece no projeto.
- Novos assets criados: `assets/img/logo-caef-sm.png` (176×176, versão compacta usada no cabeçalho) e `assets/img/og-image.png` (1200×630, composição de Open Graph). `assets/img/logo-sinergia.png` não foi alterado (logo de outra entidade, fora do escopo desta troca).

### 4.8 Testes desktop (1440px)
Repetidos manualmente e via Playwright após a troca de logo e a revisão de conteúdo: menu superior, Início, Radar CAEF (busca, filtros, contadores, painel de detalhes), Ensino (grades, trilhas, quiz), Pesquisa e Laboratórios, Extensão, CAEF Formação, Portas Abertas, Acervo, Apadrinhamento (incluindo a nova caixa de AACC), Ouvidoria (incluindo o novo texto de tratamento de dados), links do rodapé, Créditos, e a logo em si (cabeçalho, rodapé, Créditos) sobre fundo escuro e sobre fundo claro. Nenhum erro relevante no console do navegador. Nenhuma deformação, esticamento ou corte da logo em nenhum ponto testado.

### 4.9 Testes mobile
Repetidos nos breakpoints 360, 375, 390, 430, 768 e 1024px (além do 1440px+ acima): sem rolagem horizontal, sem sobreposição da logo com o menu, sem corte da logo, menu hambúrguer abrindo/fechando corretamente (bug já corrigido na primeira rodada, reconfirmado aqui), navegação sempre acessível, rodapé sem desalinhamento em nenhum desses tamanhos. A logo compacta do cabeçalho (38px de altura no mobile) permanece legível e proporcional em todos eles.

### 4.10 Itens que ainda exigem validação humana após esta rodada
1. Status formal da emenda do Acervo Acadêmico junto ao Colegiado (seção 3.3) — confirmar número de protocolo/ata antes de avançar o `ACERVO_STATUS` para `"em_tramitacao"` ou `"aprovada"`.
2. Esquema de perguntas do formulário da Ouvidoria (seção 3.1, já sinalizado na primeira rodada, ainda em aberto).
3. Favicon em tamanhos muito pequenos (seção 4.7) — se desejado, solicitar ao designer responsável pela identidade visual uma versão simplificada oficial da marca.
4. Contato de WhatsApp do Prof. Alexandre Sérgio Silva, publicado no Radar CAEF em uma vaga de monitoria/extensão: o número foi fornecido pelo próprio professor em um formulário cujo propósito explícito era divulgação pública para captação de estudantes, e o registro está marcado como `authorized: true`. Foi mantido no ar com base nesse contexto, mas fica registrado aqui como uma decisão de julgamento para a Diretoria revisar/confirmar, por se tratar de um número de celular pessoal.

---

## 5. Links que precisam de confirmação humana periódica

Estes links são reais e foram usados como encontrados nos documentos-fonte, mas por serem formulários/pastas do Google, sua validade deve ser conferida periodicamente (podem expirar, ser fechados após uma seleção, etc.):

| Link | Uso no site |
|---|---|
| `forms.gle/N7En6TbHYm2rkhjW6` | Formulário de interesse — projeto CORRE |
| `docs.google.com/forms/.../1FAIpQLSfPA_lrVZ...` | Inscrição — Apadrinhamento Acadêmico |
| `docs.google.com/forms/.../1FAIpQLSffGsTBcHwbHfm9...` | Formulário — Ouvidoria do Discente |
| `docs.google.com/document/.../1jZGOkxY7ddx2uI5JLOMK...` | Manual Oficial do Apadrinhamento |
| `drive.google.com/drive/folders/1kpOA4avqskP7l4S5PZCXloiQ4q-KonRE` | Pasta do Acervo Acadêmico (Drive) |

Links institucionais estáveis usados (SIGAA, Portal UFPB, CAPES, SciELO, SIBi/UFPB, e-mail `coordef@ccs.ufpb.br`) não exigem verificação frequente, mas vale conferir após qualquer reestruturação de sites da própria UFPB.

Não há, no HTML final, nenhum link `href="#"` "morto": os três casos de `href="#"` encontrados no código são placeholders preenchidos automaticamente pelo JavaScript ao carregar a página (inscrição/manual do Apadrinhamento e formulário da Ouvidoria) — comportamento intencional, igual ao padrão já usado no site original para o link de resultado do quiz.

---

## 6. Dados ausentes (registrados como "em branco" — nada foi inventado)

- **Lista completa de laboratórios do DEF.** O próprio DEF declara ter mais de 20 laboratórios; o site lista os 9 já confirmados por fonte pública ou mapeamento direto, com uma nota explícita orientando quem quiser a lista completa a solicitar à chefia do DEF (`coordef@ccs.ufpb.br`).
- **Vagas de Monitoria.** Nenhuma foi mapeada até o momento; o filtro "Monitoria" existe no Radar CAEF e mostrará corretamente "Nenhuma oportunidade encontrada" até que uma seja cadastrada — não foi criada nenhuma vaga fictícia.
- **Próxima edição do CAEF Portas Abertas.** Ainda não definida; a seção exibe estado vazio orientando a aguardar.
- **Logística da oficina "Currículo Lattes do Zero"** (CAEF Formação): data, local, ministrante e vagas ainda não definidos — exibidos como "Em breve".
- **Números agregados da Ouvidoria** (Transparência da Ouvidoria): ainda não publicados pela diretoria — a seção existe pronta para receber esses números quando houver consolidação, mas hoje mostra o aviso "Dados agregados ainda não publicados".
- **Eixo Carreira** mencionado na especificação como eixo futuro: não foi criado conteúdo para ele, conforme instruído — os perfis de carreira que já existiam (parte do Comparativo/quiz) foram preservados normalmente.

---

## 7. Melhorias técnicas

- **Mobile-first e responsivo** — testado em 390px (celular) e 1440px (desktop) na primeira rodada, e reconfirmado nos breakpoints 360/375/390/430/768/1024/1440+px nesta rodada, especificamente por causa das novas dimensões da logo (seção 4.9); menu, filtros do Radar, cartões e formulários se reorganizam corretamente.
- **Acessibilidade** — HTML semântico, link "pular para o conteúdo", foco visível, textos alternativos em imagens/logos (incluindo a nova logo oficial, seção 4.7), `prefers-reduced-motion` respeitado nas transições, contraste revisado na nova paleta.
- **Performance** — as imagens em Base64 embutidas no HTML original (95% do peso do arquivo, ~2,3 MB) foram extraídas para arquivos de imagem separados; o `index.html` final é muito mais leve. A nova logomarca oficial foi incorporada já otimizada (redimensionada por contexto de uso — 480px, 176px e 64px — sem perder fidelidade visual em relação ao arquivo original) em vez de servir uma única imagem grande em todo lugar.
- **SEO básico** — título, meta description, Open Graph (agora com `og:image`, ver seção 4.7) e favicon.
- **Separação dados/apresentação** — todo o conteúdo editável (vagas, laboratórios, prazos, links) ficou isolado em `js/data/*.js`, com comentários extensos em português, para que a própria equipe do CAEF consiga atualizar o site sem depender de um programador no dia a dia (ver `dist/README.md`, que agora também inclui instruções para trocar a logomarca no futuro).
- **Programação defensiva** — campos ausentes nos dados (ex.: `selectionLink: ""`) não quebram o layout; estados vazios (“Em breve”, “Consulte disponibilidade”, “Nenhuma oportunidade cadastrada no momento”) aparecem automaticamente em vez de espaços em branco ou erros. Nesta rodada, o filtro de autorização do Radar CAEF (`js/main.js`) foi corrigido de `authorized !== false` para `authorized === true`, para que um item cujo campo de autorização seja esquecido em branco fique de fora por padrão, em vez de ser publicado por engano.
- **Testes realizados** — validação de sintaxe de todos os arquivos JavaScript; verificação estrutural do HTML final (nenhuma tag duplicada, nenhum ID duplicado, todas as seções presentes e únicas); testes funcionais automatizados (Playwright) cobrindo navegação por abas, Radar CAEF (filtros, busca, painel de detalhes), busca global do Ensino, quiz, menu mobile e, nesta rodada, a nova logomarca em todos os pontos do site — sem erros de JavaScript no console em nenhum desses fluxos (seções 4.8 e 4.9).

---

## 8. Sugestões de próximos passos

1. Confirmar formalmente o protocolo/tramitação da emenda do Acervo Acadêmico junto ao Colegiado (seção 3.3) e, quando houver confirmação, atualizar `ACERVO_STATUS` em `acervo.js` de `"proposta_enviada"` para o valor que refletir a nova situação formal.
2. Confirmar com quem administra o Google Forms da Ouvidoria se o escopo descrito no site corresponde às perguntas reais do formulário (seção 3.1).
3. Solicitar à chefia do DEF a lista completa e atualizada de laboratórios para eventualmente ampliar a página "Pesquisa e Laboratórios".
4. Definir data da próxima edição do CAEF Portas Abertas e da oficina "Currículo Lattes do Zero" assim que houver decisão, atualizando os respectivos arquivos de dados (instruções no README).
5. Quando a Ouvidoria tiver o primeiro período consolidado de números agregados, preencher `TRANSPARENCIA_OUVIDORIA` em `ouvidoria.js` — nunca com dados individuais.
6. Reavaliar periodicamente a validade dos links de formulários do Google (podem ser fechados após uma seleção específica).
7. Quando houver um número atualizado e reverificado de ações/pessoas atendidas pela Extensão do DEF, publicá-lo na página de Extensão (seção 4.2) — até lá, manter apenas a descrição qualitativa.
8. Se a Diretoria quiser um favicon mais legível em tamanhos muito pequenos, solicitar ao responsável pela identidade visual uma versão simplificada oficial da marca (seção 4.7).
9. Revisar/confirmar a divulgação do contato de WhatsApp do Prof. Alexandre Sérgio Silva no Radar CAEF (seção 4.10, item 4).

---

## 9. Atualização — Consolidação de CSS e correção do compartilhamento do Radar (19/09/2026)

Rodada de manutenção sobre a versão do portal com o guia "Por onde começar?", a barra de filtros mobile do Radar e os atalhos de Ensino. Escopo: apenas os três problemas abaixo. **Nenhum dado acadêmico, regra de autorização, conteúdo validado, funcionalidade ou aparência aprovada foi alterado.**

### 9.1 Identidade tipográfica — o que foi preservado

Antes de mexer em qualquer arquivo, o CSS foi analisado por inteiro para identificar qual tipografia está de fato em vigor hoje, em vez de reaplicar a decisão antiga da seção "Identidade visual" (Oswald + JetBrains Mono) ou assumir que a regra que "vence" a cascata é automaticamente a certa. O arquivo tinha três blocos de identidade sobrepostos, escritos em momentos diferentes (o original "pista/raia", uma revisão editorial com Georgia, e o bloco mais recente, explicitamente comentado no código como **"V4 — SINERGIA / EDUCAÇÃO FÍSICA EM MOVIMENTO"**, refletindo a comunicação pública atual da gestão). Esse último bloco é o único que define as variáveis de fonte hoje realmente aplicadas (`--font-display` e `--font-body`, ambas **Source Sans 3**) e é o único que os blocos seguintes (guia interativo, barra mobile do Radar, atalhos de Ensino) pressupõem e não redefinem — ou seja, é a base confirmada como vigente, não uma suposição. Essa hierarquia foi mantida exatamente como estava: mesma família em títulos/corpo/navegação/rótulos, com a diferenciação visual vindo de peso, tamanho, letter-spacing e caixa (maiúsculas), não de fontes diferentes. Não houve redesign nem introdução de nova identidade.

Uma lacuna real foi corrigida: o `<link>` do Google Fonts em `index.html` carregava apenas os pesos 400/600/700 (+ 400 itálico) de Source Sans 3, mas o CSS usa `font-weight:800` em elementos centrais (título do hero, botões, títulos de card, badges, rótulos do guia). Sem o peso 800 carregado, o navegador precisa aproximar/sintetizar esse peso a partir do 700 disponível. Foi adicionado `0,800` à lista de pesos solicitados — nenhuma regra de CSS foi alterada, apenas o arquivo de fonte correto passou a ser carregado para o que o CSS já pedia.

### 9.2 CSS — consolidação sem alteração visual

O arquivo `css/style.css` tinha 56 seletores duplicados (a mesma regra escrita mais de uma vez, em blocos de versões diferentes que nunca foram unificados), incluindo `:root` (três vezes), `.btn`, `.hero`, `h1.hero-title`, `.hub-card`, `.opp-card`, `.now-tag`, `header.site-nav`, entre outros. Isso deixava o arquivo maior do que precisa ser e sujeito a comportamento imprevisível caso uma futura edição mexesse na ordem das regras.

A consolidação seguiu uma regra de segurança estrita: nenhuma regra foi movida de lugar no arquivo. Para cada seletor duplicado, uma propriedade só foi removida de uma ocorrência mais antiga quando uma ocorrência **mais nova do mesmo seletor exato** já redefinia essa mesma propriedade — condição em que a remoção é comprovadamente segura, pois não depende de nenhuma outra regra do arquivo. Um teste automatizado (Playwright) comparou o estilo computado (`getComputedStyle`) de ~55 seletores e ~20 propriedades CSS cada, em três resoluções (1440×900 desktop, 768×1024 tablet, 390×844 mobile), entre a versão antes e depois da consolidação: **zero diferenças**. Um segundo teste comparou pixel a pixel capturas de tela de página inteira da Home e do Radar em sete larguras (360/375/390/430/768/1024/1440px): **zero pixels diferentes** em todas elas. O arquivo caiu de 70.298 para 63.651 bytes (~9% menor) sem qualquer mudança de aparência. As diferenças intencionais entre desktop e mobile (media queries) foram preservadas integralmente — nenhuma delas fazia parte da duplicação removida.

### 9.3 Compartilhamento do Radar — link direto

Ao abrir um link compartilhado (`?oportunidade=<id>#radar`), o site deixava a aba Início ativa por trás do painel de detalhes, em vez de abrir sobre os resultados do Radar — porque o código apenas alterava `window.location.hash`, o que não aciona o mesmo mecanismo (`activateTab`) usado pelos cliques normais de navegação. Corrigido em `js/main.js` para chamar `activateTab('radar', ...)` diretamente, que já é a função responsável por ativar a aba certa e por manter a URL consistente. Também foi confirmado que fechar o painel de detalhes aberto por um link compartilhado mantém a pessoa no Radar (não retorna à Home) — esse comportamento já usava a mesma lógica de fechamento dos cartões abertos normalmente e não precisou de alteração adicional.

### 9.4 Testes realizados nesta rodada

Automatizados via Playwright, em desktop (1440×900) e mobile (390×844):
- Link compartilhado aberto diretamente → chega no Radar com a oportunidade correta já aberta no painel de detalhes, em ambas as resoluções.
- Fechar o painel de detalhes aberto por link compartilhado → permanece no Radar (não retorna à Início), em ambas as resoluções.
- Abrir e fechar uma oportunidade pelo fluxo normal (clique no card) → funciona sem regressão.
- Filtros do Radar (busca por texto, checkbox de filtro, chip de "filtro ativo", limpar filtros) → funcionam sem erros.
- Barra de filtros mobile do Radar (`#radarMobileToggle`/`#radarMobileClose`) → abre e fecha corretamente em 390px.
- Botão Voltar do navegador → testado após navegação por abas e após abrir um link compartilhado; a navegação por abas do site usa `history.replaceState` (não `history.pushState`) desde a versão original — ou seja, trocar de aba não cria um novo item no histórico do navegador. Esse comportamento já existia antes desta rodada, não foi alterado (não fazia parte dos três problemas relatados) e o Voltar não produz erro nem deixa a página em estado inconsistente.
- Varredura por todas as abas do site (Radar, Comparativo, Licenciatura, Trilhas CCHLA, Atividades, Quiz, Pesquisa, Portas Abertas, Extensão) → nenhum erro no console em nenhuma delas.
- `h1.hero-title` e demais elementos com `font-weight:800` → o navegador agora recebe o arquivo de fonte no peso correto para a declaração que o CSS já fazia.

Nenhum dado de `js/data/*.js`, nenhuma regra de `authorized`, nenhum texto validado nas rodadas anteriores e nenhuma funcionalidade existente foi tocado nesta rodada.

---

## 10. Apadrinhamento — Acompanhamento e Certificação (19/09/2026)

Implementação da área "Acompanhamento e Certificação" pedida para o Programa de Apadrinhamento Acadêmico 2026.2, a partir do "Manual Oficial: Programa de Apadrinhamento Acadêmico — 2026.2" (lido integralmente, em PDF e na cópia em Google Docs enviados pelo usuário — mesmo conteúdo nos dois).

### 10.1 Fonte de verdade e o que o manual efetivamente estabelece
O manual define 5 fases da jornada (Acolhimento, Adaptação, Integração, Acompanhamento, Encerramento) e 3 critérios de certificação de até 60h de AACC: presença validada em pelo menos 4 dos 5 checkpoints do período, entrega do Relatório Final assinado pelo afilhado, e não ter sido substituído por inatividade. O manual **não define** um modelo detalhado de campos para o Relatório Final nem estabelece equivalência entre os 5 checkpoints e registros quinzenais — por isso, conforme instrução explícita do usuário, essa equivalência **não foi inventada**: o portal trata os registros quinzenais como ferramenta complementar, deixando texto explícito de que eles não substituem os checkpoints nem concedem horas automaticamente (Etapa 3 da seção Acompanhamento).

### 10.2 O que já existia nesta entrega e foi mantido
Uma implementação parcial já estava presente no ZIP recebido: o gerador do Relatório Final (preenchimento no navegador, impressão em A4, sem envio/armazenamento pelo portal) e os dois cartões de registro quinzenal como "aguardando link oficial". Essa base foi mantida e completada, não recriada.

### 10.3 O que foi corrigido/completado nesta rodada
- **Campo de data ausente no Relatório Final impresso:** o manual e o pedido do usuário exigem "espaço para data e assinatura do fera"; o gerador (`js/apadrinhamento-acompanhamento.js`) tinha as duas linhas de assinatura mas nenhum campo de data. Adicionada uma linha "Data: ___ / ___ / ______" acima das assinaturas, com o respectivo ajuste de espaçamento no CSS de impressão (`@media print`).
- **Descrição do SOS Padrinho:** o texto em `js/data/apadrinhamento.js` afirmava que o canal funciona "via formulário quinzenal e WhatsApp exclusivo" — a palavra "quinzenal" não consta no manual (que diz apenas "via formulário ou WhatsApp exclusivo"). Ajustado para refletir exatamente o manual, mantendo o SOS Padrinho como canal de apoio para falta de contato ou problemas de convivência.
- **Reorganização em três etapas:** a área "Acompanhamento e certificação" foi reagrupada em **Etapa 1 · Durante o semestre** (registros quinzenais), **Etapa 2 · Encerramento** (Relatório Final) e **Etapa 3 · Certificação** (conferência dos requisitos), reaproveitando os três cartões e os estilos já aprovados (`.mentor-step`, `.kicker`, o padrão de título já usado em outras seções do site) — sem nenhuma regra de CSS nova além do necessário para agrupar os blocos existentes.
- **Botões dos formulários quinzenais preparados para o link real:** os textos "Aguardando link oficial do formulário" passaram de `<span>` para `<a>` inertes (`href="#"`, `aria-disabled="true"`, `tabindex="-1"`, `onclick="return false;"`, com `data-quinzenal-form="padrinhos"`/`"feras"` para identificação), prontos para receber a URL real assim que fornecida — sem nenhum link fictício.

### 10.4 O que depende de decisão/ação da equipe (não implementado nesta rodada)
- **Os dois Google Forms reais** (padrinhos/madrinhas e feras): não há, nas ferramentas disponíveis nesta sessão, capacidade de criar formulários do Google Forms (só Google Docs, Planilhas, Slides e pastas via Google Drive). Por isso, foi preparado em `FORMULARIOS_QUINZENAIS.md` o conteúdo completo de ambos os formulários (perguntas, tipos de resposta, obrigatoriedade, textos de apresentação, incluindo os campos de código da dupla e período quinzenal pedidos pelo usuário para permitir cruzar as respostas) e o passo a passo para criá-los, ligar as respostas ao Google Sheets e restringir o acesso — para o usuário criar e enviar os dois links.
- **Planilha de acompanhamento da equipe:** por decisão do usuário, só será criada depois que os dois formulários existirem, para garantir que as colunas correspondam ao formato real das respostas. A estrutura recomendada já está documentada em `FORMULARIOS_QUINZENAIS.md`, seção 4.
- **Integração dos links reais ao portal:** quando os dois links forem enviados, os dois elementos `a[data-quinzenal-form="padrinhos"]` e `a[data-quinzenal-form="feras"]` em `index.html` devem ter o `href` substituído pela URL real e os atributos `aria-disabled`/`tabindex`/`onclick` removidos (trocando a classe visual de "pendente" para um botão ativo, ex. `btn btn-primary`).

### 10.5 Testes executados nesta rodada
Automatizados via Playwright, em desktop (1440×900) e mobile (390×844): as três etapas (`.mentor-stage`) estão presentes e rotuladas corretamente; a descrição do SOS Padrinho não menciona mais "quinzenal" e continua citando formulário/WhatsApp; os dois botões pendentes existem, têm os atributos `data-quinzenal-form` corretos e um clique neles não navega para lugar nenhum; o Relatório Final continua em sua própria etapa (Encerramento), separado dos cartões de registro quinzenal (Durante o semestre); o texto da Etapa 3 contém, literalmente, a frase de que os registros/PDF não concedem horas automaticamente e a exigência de 4 dos 5 checkpoints; nenhuma correção anterior regrediu (link compartilhado do Radar, filtros, barra mobile, varredura por todas as abas) — sem erros de console em nenhum fluxo. O Relatório Final foi testado com campos vazios (bloqueia o envio/impressão via validação nativa do navegador, sem gerar documento), com texto longo (~6.000 caracteres, sem quebra de layout) e com caracteres potencialmente perigosos (`<script>`, `&`, aspas) no nome dos participantes — confirmado que o conteúdo é inserido como texto puro (`textContent`), nunca interpretado como HTML. A impressão foi verificada com emulação de mídia `print`: o cabeçalho/navegação do site fica oculto e só o documento do relatório fica visível, em layout A4. Não foi testado o envio real dos formulários quinzenais nem a planilha de controle, porque nenhum dos dois existe ainda — o `FORMULARIOS_QUINZENAIS.md` deixa claro que essa etapa está pendente, sem afirmar que o envio funciona.

### 10.6 O que não foi alterado
Links de inscrição de padrinhos, do Manual Oficial, da Ouvidoria e demais canais de contato existentes; as 5 fases, atribuições, regras e critérios de AACC (exceto a frase do SOS Padrinho); qualquer outra seção do portal; a identidade visual e a tipografia aprovadas. Nada foi publicado — a entrega é o ZIP para revisão e publicação posterior pelo próprio usuário.

### 10.7 Atualização — Integração dos links reais dos formulários quinzenais (19/09/2026)
O usuário enviou os dois links reais e publicados dos formulários (padrinhos/madrinhas e feras), já criados por ele no Google Forms.

- **Conferência dos campos antes de integrar:** como as ferramentas desta sessão não têm acesso à API do Google Forms (só ao Google Drive, que não lê o conteúdo de formulários — nem pelo ID publicado do `viewform`, que é diferente do ID de arquivo do Drive), os dois formulários foram lidos por busca na página pública (`WebFetch`), que é um resumo gerado por um modelo menor — não uma leitura literal garantida. Resultado: as 11 perguntas do Formulário 1 (Padrinhos/Madrinhas) e as 9 perguntas do Formulário 2 (Feras) batem, em ordem e tipo, com o conteúdo preparado em `FORMULARIOS_QUINZENAIS.md`. Duas perguntas do Formulário 1 ("Tempo dedicado às atividades no período" e "Breve resumo da experiência") apareceram como obrigatórias nessa leitura, enquanto a especificação sugeria opcionais — como a leitura não é garantidamente exata, isso fica sinalizado para conferência do usuário, sem presumir que seja um erro. A seção condicional sugerida no Formulário 2 (pergunta 9 exibida só após pedido de apoio) já estava configurada.
- **Integração ao portal:** em `index.html`, os dois elementos que eram `<a class="mentor-pending" href="#" aria-disabled="true" tabindex="-1" onclick="return false;">` passaram a ser links ativos (`class="btn btn-line"`, `target="_blank"`, `rel="noopener"`, texto "Abrir formulário →"), com o `href` de cada um apontando exatamente para o link enviado pelo usuário — nenhum link foi inventado ou alterado além dos dois recebidos. Os atributos de inércia (`aria-disabled`, `tabindex="-1"`, `onclick="return false;"`) foram removidos. O atributo `data-quinzenal-form` foi mantido para identificação.
- **Planilha de controle/conferência criada:** conforme autorização prévia do usuário ("crio a planilha depois que os dois formulários existirem e eu conferir os campos reais"), foi criada no Google Drive do usuário a planilha **"Apadrinhamento CAEF 2026.2 — Planilha de Acompanhamento (controle)"**, com a estrutura de colunas da seção 4 de `FORMULARIOS_QUINZENAIS.md` (código da dupla, período, quem enviou, contato relatado por cada lado, divergência, pedido de apoio, status) e uma linha de exemplo marcada `[exemplo]`. **A planilha não foi compartilhada com ninguém** — permanece privada, de propriedade exclusiva do usuário, sem alteração de permissões. Como esta sessão não tem acesso às duas planilhas de respostas reais (criadas pelo próprio Forms, na conta do usuário), a nova planilha é um modelo/estrutura pronta para uso manual ou por fórmula (ex. `PROCV`) — não está ligada automaticamente às respostas.
- **Testes:** repetida a suíte completa de regressão (47 verificações automatizadas via Playwright, cobrindo desktop, mobile e varredura de todas as abas) mais uma nova suíte específica de 15 verificações sobre os links reais — confirmando: nenhum elemento `.mentor-pending` inerte restante; os dois `href` batem exatamente com as URLs enviadas; `target="_blank"`/`rel="noopener"` presentes; nenhum atributo de inércia restante; estilo de botão ativo aplicado; nenhuma regressão em nenhuma outra parte do site. **Nenhum dado de teste foi enviado aos formulários reais** — as chamadas de rede para `docs.google.com` foram bloqueadas propositalmente durante os testes automatizados, exatamente para nunca poluir respostas reais nem enviar nada em nome do usuário.
- **Nada foi publicado.** A entrega continua sendo o ZIP atualizado, para revisão e publicação posterior pelo próprio usuário.
