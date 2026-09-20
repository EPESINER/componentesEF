# Portal CAEF/UFPB — Educação Física

Site estático, sem framework e sem build step, mantido pela **Diretoria de Ensino, Pesquisa e Extensão do CAEF**. Este README explica como publicar o site e como uma pessoa **sem experiência em programação** pode atualizar o conteúdo com segurança.

---

## 1. Estrutura do projeto

```
dist/
├── index.html              → todas as páginas do portal (uma única página, navegação por abas)
├── css/
│   └── style.css           → toda a aparência visual (cores, layout, tipografia)
├── js/
│   ├── main.js              → toda a lógica/interação (não precisa mexer aqui no dia a dia)
│   └── data/                → AQUI é onde você atualiza o conteúdo do site
│       ├── oportunidades.js     → Radar CAEF (extensão, pesquisa, monitoria, eventos)
│       ├── laboratorios.js      → Página "Pesquisa e laboratórios"
│       ├── formacao.js          → CAEF Formação (oficinas/minicursos)
│       ├── portas-abertas.js    → CAEF Portas Abertas
│       ├── acervo.js            → Acervo Acadêmico Digital
│       ├── apadrinhamento.js    → Apadrinhamento Acadêmico
│       └── ouvidoria.js         → Ouvidoria do Discente
└── assets/img/               → logomarca oficial, favicon e imagem de compartilhamento
    ├── logo-caef.png             → logomarca oficial do CAEF (versão grande — rodapé, Créditos)
    ├── logo-caef-sm.png          → mesma logomarca, versão leve para o cabeçalho
    ├── logo-sinergia.png         → logomarca da gestão Sinergia
    ├── favicon.png                → ícone da aba do navegador
    └── og-image.png               → imagem exibida ao compartilhar o link (WhatsApp, redes sociais)
```

**Regra de ouro:** conteúdo (textos, vagas, links, datas) fica nos arquivos de `js/data/`. Você quase nunca precisa abrir `index.html`, `main.js` ou `style.css` para o uso do dia a dia.

---

## 2. Como rodar o site localmente (para testar antes de publicar)

Não é necessário instalar nada além de um navegador. Duas opções:

**Opção simples:** dê duplo-clique no arquivo `dist/index.html` — ele abre direto no navegador. Algumas poucas coisas (não neste site) podem não funcionar assim, então se algo parecer estranho use a opção abaixo.

**Opção recomendada (servidor local):** com Python instalado, abra um terminal dentro da pasta `dist/` e rode:

```
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador. Pressione `Ctrl+C` no terminal para parar.

---

## 3. Como publicar o site

O site é 100% estático (HTML/CSS/JS puro) — não precisa de banco de dados nem servidor especial. Qualquer uma destas opções funciona, bastando enviar a pasta `dist/` inteira:

- **GitHub Pages** (gratuito): suba a pasta `dist/` para um repositório e ative o GitHub Pages nas configurações.
- **Netlify / Vercel** (gratuito): arraste a pasta `dist/` na interface deles.
- **Hospedagem já usada pelo CAEF/Sinergia**, se houver: basta copiar o conteúdo de `dist/` para o servidor via FTP/painel de hospedagem.

Sempre publique a pasta `dist/` **inteira** (mantendo a estrutura de subpastas `css/`, `js/`, `assets/`) — nunca apenas o `index.html` sozinho.

---

## 4. Como editar cada seção (sem programar)

Abra o arquivo indicado com qualquer editor de texto simples (Bloco de Notas, VS Code, etc.). Cada arquivo já tem comentários em português explicando os campos. Regras gerais:

- Textos ficam sempre entre aspas `"assim"`.
- Depois de editar um campo, **não apague a vírgula `,`** no final da linha (exceto no último campo do bloco).
- Se não tiver uma informação (ex.: ainda não sabe o horário), deixe o campo como `""` (aspas vazias) — o site mostra automaticamente algo como "Em breve" ou esconde o campo. **Nunca invente** uma data, nome ou número só para preencher.
- Depois de salvar, atualize o site publicado (repita o passo 3).

### 4.1. Registrar uma nova oportunidade no Radar CAEF

Arquivo: `js/data/oportunidades.js`

1. Copie um bloco `{ ... }` já existente do **mesmo tipo** (extensão, pesquisa, monitoria ou evento) — use como modelo.
2. Cole o bloco copiado **antes** do `];` que fecha o array `OPORTUNIDADES`.
3. Altere os valores. Campos principais:
   - `id`: um código único, sem espaços (ex.: `"ext-nome-do-projeto"`).
   - `type`: apenas `"extensao"`, `"pesquisa"`, `"monitoria"` ou `"evento"`.
   - `title` / `shortTitle`: nome completo e nome curto do projeto.
   - `area`, `coordinator`, `contact`, `description`, `requirements`, `selection`, `selectionLink`, `shifts` (lista, ex.: `["Manhã","Tarde"]`), `workload`, `duration`.
   - `status.availability`: apenas `"vagas"` (com vagas), `"consultar"` (consultar disponibilidade) ou `"encerrado"`.
   - `lastUpdated`: data no formato `"DD/MM/AAAA"`.
   - **`authorized: true`** — **obrigatório**. Só publique um projeto depois de confirmar com o coordenador/docente responsável que ele autoriza a divulgação pública. Sem essa confirmação, não adicione o bloco (ou deixe `authorized: false`, e ele não aparecerá no site).

### 4.2. Mudar o status de uma vaga (ex.: de "consultar" para "com vagas")

No mesmo arquivo `oportunidades.js`, localize o projeto pelo `id` ou `title` e altere apenas:

```js
status: { availability: "vagas" }
```

Para adicionar uma observação especial (ex.: "Seleção prevista para outubro/2026"), use:

```js
status: { availability: "consultar", note: "Seleção prevista para outubro/2026" }
```

### 4.3. Cadastrar um laboratório

Arquivo: `js/data/laboratorios.js`. Copie um bloco existente do array `LABORATORIOS` como modelo. O campo `fonte` indica se a informação vem de fonte pública (`"sigaa"`) ou de mapeamento direto do CAEF (`"caef"`).

### 4.4. Adicionar uma oficina/minicurso (CAEF Formação)

Arquivo: `js/data/formacao.js`. Copie o bloco existente dentro do array `FORMACAO`. Se data/local/ministrante/vagas ainda não estiverem definidos, deixe `""` — o site mostra "Em breve" automaticamente. Use `status: "planejada"`, `"confirmada"` ou `"encerrada"`.

### 4.5. Registrar uma edição do CAEF Portas Abertas

Arquivo: `js/data/portas-abertas.js`.

- Para anunciar a **próxima edição confirmada**, preencha o objeto `PROXIMA_EDICAO_PORTAS` e mude `definida` para `true`.
- Quando uma edição **acontecer/terminar**, mova as informações dela para dentro do array `EDICOES_ANTERIORES_PORTAS` (não apague o histórico) e limpe/zere `PROXIMA_EDICAO_PORTAS` (volte `definida` para `false`) até a próxima ser marcada.

### 4.6. Atualizar links e contatos (Apadrinhamento, Ouvidoria, Acervo)

- `js/data/apadrinhamento.js`: links de inscrição/manual em `APADRINHAMENTO_INSCRICAO_LINK` e `APADRINHAMENTO_MANUAL_LINK`; fases da jornada em `APADRINHAMENTO_FASES`; regras em `APADRINHAMENTO_REGRAS`. A carga horária de AACC (bloco `APADRINHAMENTO_AACC`) está confirmada em **até 60 horas por semestre** — o campo `horas` já reflete isso e o campo `observacao` deixa claro que a concessão depende do cumprimento dos critérios, não é automática. Se a diretoria decidir revisar esse número no futuro, atualize os dois campos juntos.
- `js/data/ouvidoria.js`: link do formulário em `OUVIDORIA_FORM_LINK`; o que a Ouvidoria recebe em `OUVIDORIA_ESCOPO`. **Nunca adicione dados individuais de manifestações** (nomes, e-mails, matrículas, relatos) em lugar nenhum deste arquivo — apenas números agregados quando/se a diretoria decidir publicá-los, em `TRANSPARENCIA_OUVIDORIA`.
- `js/data/acervo.js`: link da pasta do Drive em `ACERVO_DRIVE_LINK`; regras de uso em `ACERVO_REGRAS`.

### 4.7. Trocar o link de "Ver vagas no Radar" por tipo (Extensão/Pesquisa)

Esses links já existem prontos nas páginas de Extensão e Pesquisa (`index.html`) e não precisam de manutenção — eles abrem o Radar CAEF com o filtro certo já marcado automaticamente. Não é necessário editar isso.

### 4.8. Trocar a logomarca do CAEF no futuro

Se a logomarca oficial mudar novamente:

1. Gere três versões do novo arquivo, mantendo sempre a proporção original da arte (nunca esticar/achatar):
   - `assets/img/logo-caef.png` — versão grande (recomendado: ~480px no lado maior), usada no rodapé e em Créditos.
   - `assets/img/logo-caef-sm.png` — versão leve (recomendado: ~176px no lado maior), usada no cabeçalho.
   - `assets/img/favicon.png` — versão pequena (recomendado: 64×64), usada como ícone da aba.
2. Se quiser atualizar também a imagem de compartilhamento (`assets/img/og-image.png`, 1200×630), centralize a nova logo sobre um fundo simples — não distorça a arte para preencher o espaço.
3. Os três arquivos já têm esses nomes referenciados em `index.html` — basta substituir o conteúdo de cada arquivo mantendo o mesmo nome, sem precisar editar HTML/CSS.
4. A logomarca aparece sobre uma "plaqueta" branca arredondada (classe `.brand-mark` em `css/style.css`) para funcionar bem sobre o fundo escuro do cabeçalho e do rodapé — isso é automático e não precisa ser refeito a cada troca de logo.

### 4.9. Revisar e manter os avisos do Mural

Arquivo: `js/data/avisos.js`.

- Reveja periodicamente os avisos com `situacaoPublicacao: "publicado"` — recomendamos junto da revisão mensal/quinzenal de conteúdo do portal, e sempre que a Diretoria Geral do CAEF sinalizar uma mudança de contexto.
- Ao confirmar que um aviso continua válido, atualize o campo `revisaoEditorial` para uma nova data futura (formato `"DD/MM/AAAA"`). Isso não muda o texto do aviso — só marca até quando ele foi revisado.
- Quando um aviso deixar de ser pertinente (situação resolvida, prazo encerrado, orientação superada), mude `situacaoPublicacao` para `"arquivado"`. Não é necessário apagar o objeto — isso preserva o histórico de avisos já publicados.
- Se quiser encerrar automaticamente a exibição em uma data certa, preencha `validoAte` (`"DD/MM/AAAA"`). Deixar em branco não significa "permanente" — apenas que nenhuma data de encerramento automático foi definida; a revisão manual continua sendo o que garante que o conteúdo está correto.
- Quando a data de `revisaoEditorial` de um aviso publicado é ultrapassada, o navegador exibe uma mensagem no **console de desenvolvedor** (ferramenta técnica do navegador, visível apenas para quem abre o código-fonte da página) pedindo confirmação. **Isso não é uma notificação automática**: ninguém recebe e-mail, mensagem ou aviso quando a data passa, e nada disso aparece para quem visita o site. A conferência periódica manual descrita acima continua sendo a única forma confiável de manter os avisos atualizados.
- Nunca invente título, texto, origem ou data de um aviso — publique exatamente o que foi aprovado.

---

## 5. O que **não** editar sem apoio técnico

- `js/main.js` — contém toda a lógica de navegação, busca, filtros do Radar CAEF e renderização dos dados. Alterações aqui podem quebrar o site inteiro. Só mexa se souber JavaScript.
- `css/style.css` — controla toda a aparência. Pequenos ajustes de cor/texto são possíveis para quem tem noção de CSS, mas não é necessário para atualizar conteúdo.
- A estrutura de `index.html` (tags HTML) — o conteúdo das seções de Ensino (grades curriculares, trilhas, quiz) está fixo diretamente no HTML porque é conteúdo curricular estável; para alterá-lo é necessário editar o HTML diretamente e validar cuidadosamente.

Se precisar de uma mudança estrutural (nova seção, novo tipo de filtro, etc.), procure apoio de alguém com experiência em HTML/CSS/JavaScript.

---

## 6. Pontos que exigem validação humana (não decididos por esta ferramenta)

Este projeto foi construído com uma regra central: nunca inventar ou "corrigir sozinho" uma informação institucional divergente. Os pontos abaixo foram sinalizados e precisam de decisão da Diretoria — veja o `RELATORIO_FINAL.md` para o detalhamento completo, seção "Revisão Pré-Publicação". Os principais:

- **Status formal da emenda do Acervo Acadêmico junto ao Colegiado**: os documentos disponíveis mostram uma proposta de emenda redigida e endereçada ao Colegiado, mas não uma confirmação de protocolo/recebimento (número de processo, ata, resposta). O site usa linguagem hedged ("emenda encaminhada... status formal a confirmar") em vez de afirmar que está oficialmente em tramitação. Assim que houver confirmação de protocolo (ou de aprovação), atualize `ACERVO_STATUS` e o texto correspondente em `index.html` (seção Acervo).
- **Número histórico de ações de extensão do DEF**: a estatística anterior ("121 ações desde 2017... 1.800 pessoas por semestre") foi removida por não ter sido reverificada na fonte primária nesta rodada. Se a diretoria confirmar os números atualizados, eles podem ser reinseridos na seção Extensão de `index.html`.
- **Contato via WhatsApp de um docente no Radar CAEF**: o projeto de pesquisa do Prof. Alexandre Sérgio Silva (LETFADS) lista um número de WhatsApp pessoal como contato, fornecido por ele mesmo no formulário de mapeamento — cujo propósito era justamente divulgar contatos publicamente. Mantivemos por entender que há autorização implícita nesse contexto, mas recomendamos confirmar diretamente com o docente se ele está confortável com a exposição pública desse número neste portal.
- **Favicon**: a nova logomarca é bastante detalhada; em 16×16 pixels (tamanho real do ícone na aba do navegador) ela perde legibilidade. Não criamos um símbolo alternativo — o favicon atual é um redimensionamento conservador da própria arte oficial. Se a gestão do CAEF tiver ou quiser produzir uma versão simplificada da marca (só o "C" ou um símbolo reduzido), ela pode substituir `assets/img/favicon.png` no futuro.

A carga horária de AACC do Apadrinhamento Acadêmico (60h) foi confirmada pela gestão responsável e não é mais um ponto em aberto — ver seção 4.6.

---

## 7. Contato técnico

Dúvidas sobre a estrutura do código podem ser encaminhadas a quem mantém o repositório do portal. Dúvidas sobre o conteúdo institucional (vagas, laboratórios, Apadrinhamento, Ouvidoria) devem ser resolvidas com a Diretoria de Ensino, Pesquisa e Extensão do CAEF antes de publicar qualquer atualização.


## Guia interativo “Por onde começar?”
Na Home, a opção Serviços abre quatro destinos: Acervo (`#acervo`), Apadrinhamento (`#apadrinhamento`), Ouvidoria (`#ouvidoria`) e Central de Serviços (central de navegação existente, `#sobre-portal`). A central não é uma nova página; o guia leva à seção já existente na Home. O fluxo é local, sem cadastro, cookies ou coleta de respostas.


## V10: Ensino interativo
Na seção Comparativo, atalhos para Bacharelado e Licenciatura usam as rotas existentes. O quiz original permanece uma pergunta de escolha de área; a barra sinaliza apenas seleção concluída (não há novas perguntas). Incluídos botão de reiniciar e estados acessíveis.


## Manutenção 19/09/2026: consolidação de CSS e correção do compartilhamento
`css/style.css` tinha regras duplicadas de versões antigas nunca unificadas (ver `RELATORIO_FINAL.md`, seção 9). Foram removidas com um método que não move nenhuma regra de lugar — só apaga uma declaração mais antiga quando uma ocorrência mais nova do **mesmo seletor** já a substitui — e reconferido por comparação automatizada de estilo computado e de pixels: nenhuma mudança visual. A tipografia atual (Source Sans 3 em títulos, corpo, navegação e rótulos, com hierarquia por peso/tamanho) foi identificada como a identidade realmente em vigor (bloco "V4 — SINERGIA" do CSS) e preservada; o `<link>` de fontes em `index.html` passou a carregar também o peso 800, que o CSS já usava mas a fonte não trazia. Também foi concluída a correção do link individual do Radar CAEF (`?oportunidade=<id>#radar`): abrir esse link agora leva direto para a aba Radar com a oportunidade certa aberta, e fechar o painel mantém a pessoa no Radar.


## V11 — Microinterações
Adicionadas animações discretas aos grafismos existentes do Hero, entrada inicial do conteúdo, feedback de hover em cards/botões e transição leve entre abas. Não foram criadas novas seções, dependências ou coleta de dados. A preferência `prefers-reduced-motion` desativa os efeitos e evita rolagem animada ao trocar de aba.


## V12 — Apadrinhamento: Acompanhamento e Certificação
Na seção Apadrinhamento, a área "Acompanhamento e certificação" está organizada em três etapas: **Etapa 1 · Durante o semestre** (registros quinzenais de padrinhos/madrinhas e de feras — dois cartões separados, cada um com seu próprio formulário), **Etapa 2 · Encerramento** (Relatório Final de Atividades, preenchido no navegador e impresso) e **Etapa 3 · Certificação** (explicação objetiva dos critérios do manual e aviso de que os registros/PDF não concedem horas automaticamente).

**Relatório Final de Atividades** (`js/apadrinhamento-acompanhamento.js`): formulário preenchido inteiramente no navegador — nada é enviado ou armazenado pelo portal. Ao clicar em "Imprimir / salvar PDF", monta um documento limpo para impressão em A4, com identificação do programa/período, do padrinho/madrinha e do fera, atividades, síntese da experiência, campo de data e duas linhas de assinatura (afilhado e padrinho/madrinha). Usa `window.print()`, então o "salvar em PDF" é feito pelo próprio diálogo de impressão do navegador (destino "Salvar como PDF"). O rodapé do documento deixa explícito que ele não vale como comprovante de entrega/validação só por ter sido gerado.

**Formulários quinzenais:** os dois cartões da Etapa 1 já têm o link real, enviado pelo usuário e integrado — botões "Abrir formulário →" (`target="_blank"`), um para padrinhos/madrinhas e outro para feras, cada um levando ao seu próprio Google Forms. O conteúdo completo dos dois formulários (perguntas, tipos de resposta, campos obrigatórios, textos de apresentação), o passo a passo de criação/configuração e o status atual (incluindo dois pontos a conferir manualmente no Formulário 1) estão em `FORMULARIOS_QUINZENAIS.md`.

**Planilha de controle/acompanhamento:** criada na conta do Google Drive do usuário, com a estrutura recomendada em `FORMULARIOS_QUINZENAIS.md` (seção 4) e uma linha de exemplo. Permanece privada — não foi compartilhada com ninguém.

**SOS Padrinho:** a descrição foi ajustada para refletir exatamente o texto do Manual Oficial ("via formulário ou WhatsApp exclusivo"), removendo a palavra "quinzenal" que não consta nesse documento-fonte.

Nada foi alterado nas demais seções, nos links de inscrição/manual existentes, nas regras de autorização do Radar ou no conteúdo validado em rodadas anteriores. Nada foi publicado nem compartilhado — a entrega é o ZIP para revisão e publicação posterior pelo próprio usuário.


## V15 — Mural de Avisos e canais oficiais do CAEF

Nova seção "Mural de Avisos" (`#mural`), acessível por um link na página inicial (abaixo de "Acontecendo agora", que permanece inalterada) e pelo rodapé — sem entrar no menu principal. O conteúdo vem de `js/data/avisos.js`, seguindo o mesmo padrão de `formacao.js` (ver seção 4.9 acima para a rotina de manutenção). Nesta rodada, só o comunicado "Sala de descanso e estudo" (Diretoria Geral do CAEF, 16/09/2026) foi publicado, com o texto exatamente como aprovado. Os campos de título, texto e origem de cada aviso são exibidos sempre como texto simples (nunca como HTML interpretado), então marcação eventualmente digitada em `avisos.js` aparece na tela como texto, sem efeito sobre o layout.

No rodapé, a coluna "Institucional" manteve seus 4 links originais (Créditos, SIGAA, Portal UFPB, Chefia do DEF) e ganhou um segundo grupo abaixo, "Canais do CAEF", com o Instagram (`instagram.com/caef_ufpb`, bio conferida antes da publicação) e a comunidade do CAEF no WhatsApp (link de convite `chat.whatsapp.com/GBH6Jfzxzfs1wHDBFTYhsD`, confirmado pelo usuário como o convite correto de acesso à comunidade). Nenhuma coluna nova foi criada e a estrutura de 4 colunas do rodapé não mudou. O WhatsApp é identificado apenas como acesso à comunidade do CAEF — não como canal de atendimento individual nem de resposta imediata. Não há qualquer sincronização automática com WhatsApp ou Instagram: a atualização do Mural continua sendo manual, um aviso de cada vez, com aprovação prévia da Diretoria Geral do CAEF.
