/* V28 — Camada de acesso ao Supabase para conteúdo público (Mural de
   Avisos, Radar CAEF) e para o Painel de Gestão administrativo.

   Este arquivo NUNCA decide sozinho se deve chamar a rede: só faz
   qualquer requisição quando window.CAEF_CONTENT_CONFIG.useSupabaseContent
   é true (leitura pública) ou quando uma função administrativa é chamada
   explicitamente pelo Painel de Gestão (escrita, sempre autenticada).

   Não conhece HTML nem manipula o DOM — só busca/envia dados e devolve
   Promises. js/main.js consome as funções de leitura pública; um futuro
   js/admin-panel.js consome as funções administrativas.

   Duas "linhas" de cliente Supabase, de propósito:
   - Cliente público (chave anônima/publishable, sem sessão de login):
     usado para Mural/Radar públicos. Criado por este arquivo, sob
     demanda, independente da Área do Estudante estar ligada ou não.
   - Cliente autenticado: é o MESMO client já criado por
     js/area-estudante.js quando o login de estudante está ligado
     (window.CAEF_STUDENT_CONFIG.enabled = true) — reaproveitado via
     window.caefStudentClient, exposto por area-estudante.js logo após
     criar o client. Nunca criamos um segundo client autenticado
     separado: dois clients distintos apontando para o mesmo projeto
     poderiam divergir sobre qual sessão está ativa. Funções
     administrativas (painel) e a preferência de notificação em Minha
     Conta dependem deste cliente existir — ou seja, dependem do login
     de estudante estar ligado, o que já é esperado (só se vira
     administrador quem consegue logar). */
(function () {
  'use strict';

  var cfg = window.CAEF_STUDENT_CONFIG || {};
  var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var sdkPromise = null;
  var publicClientPromise = null;

  function loadSdk() {
    if (window.supabase && typeof window.supabase.createClient === 'function') return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = SDK_URL;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = function () { sdkPromise = null; reject(new Error('SDK do Supabase indisponível')); };
      document.head.appendChild(script);
    });
    return sdkPromise;
  }

  function getPublicClient() {
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) return Promise.reject(new Error('Configuração do Supabase ausente'));
    if (publicClientPromise) return publicClientPromise;
    publicClientPromise = loadSdk().then(function () {
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
    });
    return publicClientPromise;
  }

  function getAdminClient() {
    if (window.caefStudentClient) return Promise.resolve(window.caefStudentClient);
    return Promise.reject(new Error('Sessão administrativa indisponível — faça login pela Área do Estudante.'));
  }

  /* -------------------------------------------------------------
     Normalização: linhas do Supabase (snake_case) -> mesmo formato
     usado pelos renderizadores de js/main.js (camelCase), para que
     o restante do código não precise saber qual é a fonte de dados.
     ------------------------------------------------------------- */
  function normalizeAviso(row) {
    return {
      id: row.id,
      titulo: row.titulo,
      texto: row.texto,
      origem: row.origem,
      dataOriginal: row.data_original,
      situacaoPublicacao: row.situacao_publicacao,
      validoAte: row.valido_ate,
      // Uso exclusivamente administrativo (nunca exibido ao público, nunca
      // usado para decidir validade/expiração — ver revisaoEditorial no
      // Painel de Gestão). A leitura pública (avisos_publico) não tem esta
      // coluna, então aqui vem sempre undefined -> null para quem lê como
      // visitante, que é o comportamento correto (nada a esconder no
      // frontend: o dado nem chega até aqui nesse caminho).
      revisaoEditorial: row.revisao_editorial || null,
      imagemPath: row.imagem_path || null,
      imagemAlt: row.imagem_alt || null,
      imagemUrl: null, // preenchido por resolveImagensAvisos()
      ordem: row.ordem
    };
  }

  function normalizeRadarItem(row) {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      shortTitle: row.short_title,
      area: row.area,
      coordinator: row.coordinator,
      contact: row.contact,
      description: row.description,
      requirements: row.requirements,
      selection: row.selection,
      selectionLink: row.selection_link,
      shifts: row.shifts || [],
      status: { availability: row.status_availability, note: row.status_note || undefined },
      lastUpdated: row.last_updated,
      authorized: row.authorized,
      audience: row.audience,
      participationType: row.participation_type,
      workload: row.workload,
      duration: row.duration,
      postgrad: row.postgrad,
      labName: row.lab_name,
      modalities: row.modalities || [],
      level: row.level || [],
      dedication: row.dedication,
      ordem: row.ordem
    };
  }

  /* Assina URLs temporárias das imagens de avisos que tiverem
     imagemPath. Chamado tanto para o Mural público quanto para o
     Painel de Gestão — a política de RLS do bucket decide, em cada
     caso, se a assinatura é de fato concedida (ver
     portal-v28-sql/03-storage-avisos.sql). Falha ao assinar uma
     imagem específica não derruba a lista inteira: o aviso continua
     aparecendo, só sem a imagem (tratado como "sem imagem"). */
  function resolveImagensAvisos(client, avisos, expiresInSeconds) {
    var tarefas = avisos.map(function (a) {
      if (!a.imagemPath) return Promise.resolve();
      return client.storage.from('avisos-caef').createSignedUrl(a.imagemPath, expiresInSeconds || 3600)
        .then(function (res) {
          if (res && !res.error && res.data && res.data.signedUrl) a.imagemUrl = res.data.signedUrl;
        })
        ['catch'](function () { /* imagem não resolvida: aviso continua sem imagem, não interrompe a lista */ });
    });
    return Promise.all(tarefas).then(function () { return avisos; });
  }

  /* =================================================================
     LEITURA PÚBLICA (Mural, Radar) — usada por js/main.js
     ================================================================= */

  // Tempo de vida da URL assinada usada na leitura PÚBLICA — reduzido
  // nesta rodada (era 3600s/1h) para limitar a janela de exposição de uma
  // URL "vazada" (compartilhada, salva, aberta em outra aba) que continue
  // funcionando mesmo depois de o aviso ser arquivado ou a imagem trocada
  // (limitação inerente às URLs assinadas — ver comentário em
  // portal-v28-sql/03-storage-avisos.sql). 10 minutos não prejudica a
  // exibição normal (a imagem, uma vez carregada, continua visível; só um
  // NOVO pedido da mesma URL depois do prazo deixaria de funcionar).
  var TTL_IMAGEM_PUBLICA_SEGUNDOS = 600;
  // O painel administrativo usa um prazo mais longo — quem tem acesso já
  // é administrador, e o fluxo de edição pode legitimamente levar mais
  // tempo numa mesma sessão.
  var TTL_IMAGEM_ADMIN_SEGUNDOS = 3600;

  /* CORREÇÃO desta rodada (item 8): a leitura pública passa a consultar as
     views avisos_publico/radar_itens_publico (portal-v28-sql/02-mural-
     radar-tabelas.sql) em vez das tabelas avisos/radar_itens diretamente.
     A política de RLS (quais LINHAS aparecem) continua idêntica — a
     mudança é só de QUAIS COLUNAS a API pública consegue ler: as views
     nunca incluem revisao_editorial, notificar_atualizacao,
     atualizado_por, criado_em, atualizado_em (uso exclusivamente
     administrativo). O filtro .eq(...) abaixo é mantido mesmo sendo
     redundante com a RLS — defesa em profundidade, nunca a única camada. */
  function getAvisosPublicados() {
    return getPublicClient().then(function (client) {
      return client.from('avisos_publico').select('*')
        .eq('situacao_publicacao', 'publicado')
        .order('ordem', { ascending: true })
        .then(function (res) {
          if (res.error) throw res.error;
          var avisos = (res.data || []).map(normalizeAviso);
          return resolveImagensAvisos(client, avisos, TTL_IMAGEM_PUBLICA_SEGUNDOS);
        });
    });
  }

  function getRadarAutorizados() {
    return getPublicClient().then(function (client) {
      return client.from('radar_itens_publico').select('*')
        .eq('authorized', true)
        .order('ordem', { ascending: true })
        .then(function (res) {
          if (res.error) throw res.error;
          return (res.data || []).map(normalizeRadarItem);
        });
    });
  }

  /* =================================================================
     PAINEL DE GESTÃO (administradores) — CRUD Mural + Radar
     Toda função abaixo depende de window.caefStudentClient (sessão
     autenticada). A autorização de fato é sempre reforçada pela RLS no
     banco — mesmo que este arquivo tivesse um erro e chamasse algo
     indevido, o Postgres recusaria a operação para quem não é admin.
     ================================================================= */

  /* CORREÇÃO desta rodada (item 1 — crítico): checarIsAdmin agora chama a
     RPC is_admin() (portal-v28-sql/01-administradores.sql) em vez de
     consultar admin_roles diretamente — é exatamente a mesma checagem que
     toda política e toda função administrativa já usam por baixo, sem
     depender de mais nenhuma tabela sendo lida pelo navegador. */
  function checarIsAdmin() {
    return getAdminClient().then(function (client) {
      return client.auth.getUser().then(function (userRes) {
        var user = userRes && userRes.data && userRes.data.user;
        if (!user) return false;
        return client.rpc('is_admin').then(function (res) {
          if (res.error) return false;
          return res.data === true;
        });
      });
    })['catch'](function () { return false; });
  }

  /* CORREÇÃO desta rodada (item 1 — crítico): a leitura administrativa
     completa (inclusive revisao_editorial, notificar_atualizacao,
     atualizado_por, criado_em, atualizado_em) não pode mais vir de
     client.from('avisos').select('*') — o privilégio de coluna da tabela
     agora restringe authenticated (papel compartilhado por estudantes E
     administradores) às mesmas colunas públicas da view (ver
     02-mural-radar-tabelas.sql). A leitura completa passa a vir da função
     SECURITY DEFINER admin_avisos_listar(), que confere is_admin() por
     dentro do próprio banco antes de devolver qualquer coisa — ver
     05-notificacoes.sql, seção "RPCs administrativas". */
  function listarAvisosAdmin() {
    return getAdminClient().then(function (client) {
      return client.rpc('admin_avisos_listar').then(function (res) {
        if (res.error) throw res.error;
        var avisos = (res.data || []).map(normalizeAviso);
        return resolveImagensAvisos(client, avisos, TTL_IMAGEM_ADMIN_SEGUNDOS);
      });
    });
  }

  /* CORREÇÃO desta rodada (item 1 — crítico): insert/update diretos na
     tabela pararam de devolver as colunas internas em ".select()" (RETURNING
     também exige privilégio de coluna, igual um SELECT) — mesmo para um
     administrador de verdade, porque authenticated é o mesmo papel de
     qualquer estudante. Passa a chamar admin_avisos_upsert(), que decide
     internamente entre inserir (p_id nulo) e atualizar (p_id preenchido),
     com o mesmo formato de payload de antes. */
  function salvarAviso(aviso) {
    // aviso: {id?, titulo, texto, origem, dataOriginal, validoAte, revisaoEditorial, situacaoPublicacao, ordem, notificarAtualizacao}
    return getAdminClient().then(function (client) {
      return client.rpc('admin_avisos_upsert', {
        p_id: aviso.id || null,
        p_novo_id: aviso.novoId || null,
        p_titulo: aviso.titulo,
        p_texto: aviso.texto,
        p_origem: aviso.origem || null,
        p_data_original: aviso.dataOriginal || null,
        p_valido_ate: aviso.validoAte || null,
        // Uso interno do painel — nunca confundir com valido_ate (prazo
        // público) nem afeta a situacao_publicacao. Só sinaliza que o
        // conteúdo merece reconferência editorial até esta data.
        p_revisao_editorial: aviso.revisaoEditorial || null,
        p_situacao_publicacao: aviso.situacaoPublicacao,
        p_ordem: aviso.ordem,
        p_notificar_atualizacao: !!aviso.notificarAtualizacao
      }).then(function (res) {
        if (res.error) throw res.error;
        return normalizeAviso(res.data);
      });
    });
  }

  /* CORREÇÃO desta rodada (item 3 — "excluir aviso que possui imagem"): a
     versão anterior removia a imagem do Storage PRIMEIRO (via
     removerImagemAviso, que também removia do Storage antes de atualizar
     o banco) e só depois excluía a linha do aviso. Se a exclusão da linha
     falhasse DEPOIS da imagem já ter sido removida (rede caiu, erro do
     banco etc.), o aviso continuava existindo, mas apontando para uma
     imagem que não existe mais — banco inconsistente, sem imagem
     nenhuma para recuperar.
     Ordem corrigida: primeiro EXCLUI A LINHA (com ".select()" encadeado,
     que devolve a linha exatamente como ela era no momento da exclusão —
     "delete ... returning", uma única instrução atômica no banco, sem
     nenhuma leitura separada antes que pudesse ficar desatualizada por
     uma edição concorrente). Só DEPOIS de o banco confirmar que a linha
     foi de fato excluída é que o arquivo de imagem (se havia um) é
     removido do Storage, em melhor esforço — uma falha nesta etapa final
     não desfaz a exclusão do aviso (que já terminou com sucesso) nem é
     reportada como erro da operação; só deixa um arquivo sem referência,
     que fica documentado para limpeza manual (ver
     manual-limpeza-imagens-orfas.md) — nunca um ponteiro quebrado no
     banco, que é o problema real que esta correção evita. */
  /* CORREÇÃO desta rodada (item 1 — crítico): a exclusão em si (DELETE ...
     RETURNING) passa a acontecer dentro de admin_avisos_excluir()
     (05-notificacoes.sql), pelo mesmo motivo das outras funções acima —
     RETURNING também precisa de privilégio de coluna, que authenticated
     não tem mais sobre as colunas internas. A função já devolve a linha
     excluída (para pegar imagem_path) e, do lado do banco, também já
     cuida da notificação de "retirada" quando o aviso excluído estava
     publicado (item 6) — nada disso muda o contrato desta função para
     quem a chama: continua devolvendo { imagemNaoRemovida }. */
  function excluirAviso(id) {
    return getAdminClient().then(function (client) {
      return client.rpc('admin_avisos_excluir', { p_id: id }).then(function (res) {
        if (res.error) throw res.error;
        var imagemPath = res.data && res.data.imagem_path;
        if (!imagemPath) return { imagemNaoRemovida: false };
        return client.storage.from('avisos-caef').remove([imagemPath]).then(function (rm) {
          // CORREÇÃO desta rodada (item 2): devolve também o caminho, não
          // só o booleano — é o que o painel precisa para dizer QUAL
          // arquivo exige conferência manual, em vez de só "algo pode ter
          // sobrado".
          return { imagemNaoRemovida: !!(rm && rm.error), imagemPath: imagemPath };
        })['catch'](function () {
          return { imagemNaoRemovida: true, imagemPath: imagemPath };
        });
      });
    });
  }

  /* CORREÇÃO desta rodada (item 3 — "remover imagem sem excluir o
     aviso"): a versão anterior removia o arquivo do Storage PRIMEIRO e só
     depois atualizava o banco (imagem_path = null) — se essa atualização
     falhasse depois da remoção, o aviso ficava apontando para um arquivo
     que não existe mais (mesma classe de bug do excluirAviso acima).
     Ordem corrigida: primeiro atualiza o banco (imagem_path = null),
     numa única instrução UPDATE ... WHERE id = ? AND imagem_path = ?
     (guarda de concorrência otimista: só aplica se a imagem atual no
     banco ainda for exatamente a que foi pedida para remover — se outra
     sessão já tiver trocado ou removido a imagem entre a tela carregar e
     o clique em "remover", a atualização não afeta nenhuma linha, e a
     função rejeita com um erro claro em vez de arriscar apagar o arquivo
     errado ou "suceder" sobre um estado que já mudou). Só DEPOIS de o
     banco confirmar é que o arquivo antigo é removido do Storage, em
     melhor esforço — uma falha aqui não desfaz a operação (o aviso já não
     referencia mais nenhuma imagem, que é o que foi pedido), só deixa um
     arquivo sem referência para a limpeza manual. */
  /* CORREÇÃO desta rodada (item 1 — crítico): o UPDATE ... WHERE id = ? AND
     imagem_path = ? (guarda de concorrência otimista) passa a acontecer
     dentro de admin_avisos_remover_imagem() (05-notificacoes.sql), mesmo
     motivo das funções acima. A mensagem de conflito de concorrência
     continua vindo do banco (agora como RAISE EXCEPTION dentro da função,
     em vez de "nenhuma linha afetada" verificado aqui) — o texto chega
     como res.error.message, preservando a mesma mensagem que o painel já
     mostra. */
  function removerImagemAviso(avisoId, imagemPath, clientOpcional) {
    var clientPromise = clientOpcional ? Promise.resolve(clientOpcional) : getAdminClient();
    return clientPromise.then(function (client) {
      return client.rpc('admin_avisos_remover_imagem', { p_id: avisoId, p_imagem_path: imagemPath }).then(function (res) {
        if (res.error) throw res.error;
        return client.storage.from('avisos-caef').remove([imagemPath]).then(function (rm) {
          // CORREÇÃO desta rodada (item 2): devolve também o caminho.
          return { imagemNaoRemovidaDoStorage: !!(rm && rm.error), imagemPath: imagemPath };
        })['catch'](function () {
          return { imagemNaoRemovidaDoStorage: true, imagemPath: imagemPath };
        });
      });
    });
  }

  /* CORREÇÃO desta rodada: a versão anterior removia a imagem ANTERIOR do
     Storage antes de enviar a nova e antes de confirmar a atualização no
     banco. Se o envio da nova imagem ou a atualização do banco falhassem
     depois disso, o aviso ficava sem nenhuma imagem, mesmo a pessoa tendo
     "só" tentado trocar por outra — a imagem antiga já tinha sido apagada
     e não havia como recuperá-la.
     Ordem corrigida: 1) envia a NOVA imagem para um caminho novo (nunca
     sobrescreve o arquivo anterior); 2) só then atualiza o banco para
     apontar para ela; 3) só DEPOIS de o banco confirmar é que a imagem
     ANTERIOR é removida. Qualquer falha nas etapas 1 ou 2 deixa a imagem
     anterior exatamente como estava — o aviso nunca fica sem imagem por
     causa de uma tentativa de substituição que não terminou. Uma falha na
     etapa 3 (remover a antiga, depois de tudo confirmado) não desfaz a
     operação — a nova imagem já está ativa e correta — só deixa um
     arquivo sem referência, que enviarImagemAviso tenta remover de
     imediato (melhor esforço); se essa tentativa também não vingar, o
     arquivo fica para a conferência manual (item 7 — ver
     manual-limpeza-imagens-orfas.md), sem nenhuma limpeza automática
     acionável pelo navegador. */
  function enviarImagemAviso(avisoId, file, alt) {
    var ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_BYTES = 3 * 1024 * 1024;
    if (ALLOWED.indexOf(file.type) === -1) return Promise.reject(new Error('Formato de imagem não permitido. Use JPEG, PNG ou WEBP.'));
    if (file.size > MAX_BYTES) return Promise.reject(new Error('Imagem maior que 3 MB.'));
    if (!alt || !String(alt).trim()) return Promise.reject(new Error('Texto alternativo (acessibilidade) é obrigatório.'));
    return getAdminClient().then(function (client) {
      return client.from('avisos').select('imagem_path').eq('id', avisoId).maybeSingle().then(function (res) {
        if (res.error) throw res.error;
        var anterior = res.data && res.data.imagem_path;
        var ext = (file.name && file.name.indexOf('.') !== -1) ? file.name.split('.').pop().toLowerCase() : (file.type === 'image/png' ? 'png' : (file.type === 'image/webp' ? 'webp' : 'jpg'));
        var caminho = avisoId + '/imagem-' + Date.now() + '.' + ext;

        // 1) Envia a nova imagem primeiro. Se falhar (exceção OU campo
        // "error" na resposta — mesma checagem dupla já usada no resto do
        // sistema desde a V27), nada mais acontece: a imagem anterior
        // nunca foi tocada.
        return client.storage.from('avisos-caef').upload(caminho, file, { contentType: file.type, upsert: false }).then(function (up) {
          if (up && up.error) throw up.error;

          /* 2) Só agora atualiza o banco para apontar para a imagem nova.
             CORREÇÃO desta rodada (item 1 — crítico): passa a usar a RPC
             admin_avisos_atualizar_imagem() em vez de update()+select()
             direto na tabela, mesmo motivo das outras funções acima. */
          return client.rpc('admin_avisos_atualizar_imagem', { p_id: avisoId, p_imagem_path: caminho, p_imagem_alt: String(alt).trim() }).then(function (res2) {
            if (res2.error) {
              // O banco recusou/falhou depois de a imagem já ter sido
              // enviada: a imagem anterior continua sendo a referenciada
              // (o UPDATE não foi aplicado), então nada mudou do ponto de
              // vista de quem vê o aviso. O arquivo recém-enviado é que
              // ficou sem referência — tenta removê-lo agora (melhor
              // esforço; se essa remoção também falhar, o arquivo fica
              // como órfão de verdade, para a conferência manual — item 7,
              // ver manual-limpeza-imagens-orfas.md). O erro relatado é
              // sempre o do banco, nunca o de uma limpeza que é só uma
              // cortesia.
              return client.storage.from('avisos-caef').remove([caminho])['catch'](function () {})
                .then(function () { throw res2.error; });
            }
            var avisoAtualizado = normalizeAviso(res2.data);

            // 3) Só depois do banco confirmar é que a imagem ANTERIOR é
            // removida. Uma falha aqui não é reportada como erro da
            // operação (a substituição, do ponto de vista de quem usa o
            // painel, já terminou com sucesso) — só marca que sobrou um
            // arquivo sem referência, para a conferência manual (item 2 —
            // registra também o caminho, não só o booleano).
            if (anterior && anterior !== caminho) {
              return client.storage.from('avisos-caef').remove([anterior]).then(function (rm) {
                if (rm && rm.error) { avisoAtualizado.imagemAnteriorNaoRemovida = true; avisoAtualizado.imagemAnteriorPath = anterior; }
                return avisoAtualizado;
              })['catch'](function () {
                avisoAtualizado.imagemAnteriorNaoRemovida = true;
                avisoAtualizado.imagemAnteriorPath = anterior;
                return avisoAtualizado;
              });
            }
            return avisoAtualizado;
          });
        });
      });
    });
  }

  /* CORREÇÃO desta rodada (item 7): a função limparImagensOrfasAvisos()
     (limpeza automática de imagens sem referência) foi REMOVIDA deste
     arquivo — não só do objeto exportado. Numa rodada anterior só o botão
     tinha sido retirado do Painel, mas a função continuava definida aqui
     e alcançável por qualquer administrador autenticado digitando
     window.caefContentSource.admin.limparImagensOrfasAvisos() no console
     do navegador; "sem botão na tela" nunca foi "inacessível pelo
     JavaScript". A decisão registrada continua sendo limpeza
     exclusivamente MANUAL (ver manual-limpeza-imagens-orfas.md) até
     existir coordenação de verdade do lado do servidor (um lock no banco,
     por exemplo) — sem isso, mesmo com as proteções de idade mínima e
     reconferência que essa função tinha, não dá para eliminar por completo
     a corrida com um upload concorrente ainda em andamento só com código
     do navegador. Uma futura reativação, com essa coordenação, pode
     reintroduzir a função a partir do histórico de versões deste arquivo.
  */

  /* CORREÇÃO desta rodada (item 1 — crítico): mesmo motivo do Mural — a
     leitura administrativa completa do Radar (inclusive
     notificar_atualizacao, atualizado_por, criado_em, atualizado_em) passa
     a vir de admin_radar_listar() (05-notificacoes.sql). */
  function listarRadarAdmin() {
    return getAdminClient().then(function (client) {
      return client.rpc('admin_radar_listar').then(function (res) {
        if (res.error) throw res.error;
        return (res.data || []).map(normalizeRadarItem);
      });
    });
  }

  /* CORREÇÃO desta rodada (item 1 — crítico): insert/update diretos pararam
     de devolver as colunas internas em RETURNING, mesmo motivo do Mural.
     Passa a chamar admin_radar_upsert(), mesmo contrato de antes (id
     ausente = inserir com novoId; id presente = atualizar). */
  function salvarRadarItem(item) {
    return getAdminClient().then(function (client) {
      return client.rpc('admin_radar_upsert', {
        p_id: item.id || null,
        p_novo_id: item.novoId || null,
        p_type: item.type,
        p_title: item.title,
        p_short_title: item.shortTitle || null,
        p_area: item.area || null,
        p_coordinator: item.coordinator || null,
        p_contact: item.contact || null,
        p_description: item.description || null,
        p_requirements: item.requirements || null,
        p_selection: item.selection || null,
        p_selection_link: validarUrlHttp(item.selectionLink) ? item.selectionLink : null,
        p_shifts: item.shifts || [],
        p_status_availability: item.statusAvailability,
        p_status_note: item.statusNote || null,
        p_last_updated: item.lastUpdated || null,
        p_authorized: !!item.authorized,
        p_audience: item.audience || null,
        p_participation_type: item.participationType || null,
        p_workload: item.workload || null,
        p_duration: item.duration || null,
        p_postgrad: item.postgrad === true ? true : (item.postgrad === false ? false : null),
        p_lab_name: item.labName || null,
        p_modalities: item.modalities || [],
        p_level: item.level || [],
        p_dedication: item.dedication || null,
        p_ordem: item.ordem,
        p_notificar_atualizacao: !!item.notificarAtualizacao
      }).then(function (res) {
        if (res.error) throw res.error;
        return normalizeRadarItem(res.data);
      });
    });
  }

  /* CORREÇÃO desta rodada (item 1 — crítico; item 6): a exclusão passa a
     acontecer dentro de admin_radar_excluir() (05-notificacoes.sql), que
     também cuida da notificação de "retirada" quando o item excluído
     estava autorizado (DELETE nunca passou pelo gatilho, que só dispara em
     INSERT/UPDATE). */
  function excluirRadarItem(id) {
    return getAdminClient().then(function (client) {
      return client.rpc('admin_radar_excluir', { p_id: id }).then(function (res) {
        if (res.error) throw res.error;
      });
    });
  }

  function validarUrlHttp(url) {
    if (!url) return false;
    return /^https?:\/\//i.test(String(url).trim());
  }

  /* =================================================================
     PREFERÊNCIA DE NOTIFICAÇÃO (Minha Conta) — opt-in explícito
     ================================================================= */

  function obterPreferenciaNotificacao() {
    return getAdminClient().then(function (client) {
      return client.auth.getUser().then(function (userRes) {
        var user = userRes && userRes.data && userRes.data.user;
        if (!user) throw new Error('Sem sessão ativa.');
        return client.from('notification_preferences').select('receber_notificacoes').eq('user_id', user.id).maybeSingle().then(function (res) {
          if (res.error) throw res.error;
          return res.data ? !!res.data.receber_notificacoes : false; // ausência de linha = nunca ativado = false
        });
      });
    });
  }

  function definirPreferenciaNotificacao(ligado) {
    return getAdminClient().then(function (client) {
      return client.auth.getUser().then(function (userRes) {
        var user = userRes && userRes.data && userRes.data.user;
        if (!user) throw new Error('Sem sessão ativa.');
        return client.from('notification_preferences')
          .upsert({ user_id: user.id, receber_notificacoes: !!ligado, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' })
          .then(function (res) {
            if (res.error) throw res.error;
          });
      });
    });
  }

  window.caefContentSource = {
    getAvisosPublicados: getAvisosPublicados,
    getRadarAutorizados: getRadarAutorizados,
    admin: {
      checarIsAdmin: checarIsAdmin,
      listarAvisos: listarAvisosAdmin,
      salvarAviso: salvarAviso,
      excluirAviso: excluirAviso,
      enviarImagemAviso: enviarImagemAviso,
      removerImagemAviso: function (avisoId, imagemPath) { return removerImagemAviso(avisoId, imagemPath); },
      // CORREÇÃO desta rodada (item 7): limparImagensOrfasAvisos deixou de
      // ser exportada aqui. O botão já tinha sido retirado do Painel numa
      // rodada anterior, mas a função continuava alcançável por qualquer
      // administrador autenticado digitando
      // window.caefContentSource.admin.limparImagensOrfasAvisos() no
      // console do navegador — "sem botão" não é "inacessível". A decisão
      // registrada é limpeza exclusivamente manual (ver
      // manual-limpeza-imagens-orfas.md) até existir coordenação de
      // verdade do lado do servidor; a função em si foi removida do
      // arquivo (não fica mais nem como código morto) — ver
      // manual-limpeza-imagens-orfas.md para o procedimento manual.
      listarRadar: listarRadarAdmin,
      salvarRadarItem: salvarRadarItem,
      excluirRadarItem: excluirRadarItem
    },
    notificacoes: {
      obterPreferencia: obterPreferenciaNotificacao,
      definirPreferencia: definirPreferenciaNotificacao
    },
    validarUrlHttp: validarUrlHttp
  };
})();
