/* V28 — Painel de Gestão (Mural de Avisos + Radar CAEF).
   Só é útil quando window.caefContentSource existe (sempre carregado) e
   quando a conta logada é administradora — verificado tanto aqui (para
   decidir o que mostrar) quanto, de forma real e definitiva, pela RLS do
   banco a cada operação. Se este arquivo tiver algum bug e tentar uma
   operação indevida, o Supabase recusa; este arquivo só evita mostrar
   telas/erros confusos para quem não é administrador. */
(function () {
  'use strict';
  var painelSection = document.getElementById('painel-gestao');
  if (!painelSection) return;

  var elRestrito = document.getElementById('painelGestaoRestrito');
  var elIndisponivel = document.getElementById('painelGestaoIndisponivel');
  var elConteudo = document.getElementById('painelGestaoConteudo');
  var tabMural = document.getElementById('painelTabMural');
  var tabRadar = document.getElementById('painelTabRadar');
  var modMural = document.getElementById('painelMural');
  var modRadar = document.getElementById('painelRadar');
  var listaMural = document.getElementById('painelMuralLista');
  var listaRadar = document.getElementById('painelRadarLista');
  var btnNovoMural = document.getElementById('painelMuralNovo');
  var btnNovoRadar = document.getElementById('painelRadarNovo');

  var formOverlay = document.getElementById('painelFormOverlay');
  var formPanel = document.getElementById('painelFormPanel');
  var formClose = document.getElementById('painelFormClose');
  var formBody = document.getElementById('painelFormBody');

  if (!elRestrito || !elIndisponivel || !elConteudo || !formPanel) return;

  var estadoConta = { authenticated: false, isAdmin: false };
  var carregado = { mural: false, radar: false };
  var cacheMural = [];
  var cacheRadar = [];
  var lastFocused = null;

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function slugify(str) {
    return String(str || '').toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function csvToArray(str) {
    return String(str || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* CORREÇÃO desta rodada (item 2): as funções de exclusão/remoção/
     substituição de imagem já retornavam indicadores de falha na limpeza
     do Storage (imagemNaoRemovida, imagemNaoRemovidaDoStorage,
     imagemAnteriorNaoRemovida) — mas o painel os ignorava, mostrando
     sempre uma mensagem genérica de sucesso. Um banner PERSISTENTE (não um
     status de campo que desaparece quando o formulário fecha ou é
     reaberto, como pfAvisoImgStatus) para cada pendência, com o CAMINHO do
     arquivo que precisa de conferência manual — visível independente de
     qual aba/formulário estiver aberto, até a pessoa marcar como
     verificado. Nunca é mostrado como "sucesso completo" (classe
     is-warning, não is-ok). */
  var pendenciasLimpeza = [];
  var elPendenciasLimpeza = document.createElement('div');
  elPendenciasLimpeza.id = 'painelPendenciasLimpeza';
  elPendenciasLimpeza.className = 'painel-pendencias-limpeza';
  if (elConteudo.firstChild) elConteudo.insertBefore(elPendenciasLimpeza, elConteudo.firstChild);
  else elConteudo.appendChild(elPendenciasLimpeza);

  function registrarPendenciaLimpeza(mensagem) {
    var id = 'pl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    pendenciasLimpeza.push({ id: id, mensagem: mensagem });
    renderPendenciasLimpeza();
  }
  function renderPendenciasLimpeza() {
    elPendenciasLimpeza.innerHTML = pendenciasLimpeza.map(function (p) {
      return '<div class="painel-form-status is-warning" data-pendencia="' + p.id + '">' +
        '<span>' + escapeHtml(p.mensagem) + '</span> ' +
        '<button type="button" class="student-button student-secondary" data-acao="fechar-pendencia">Ok, verifiquei</button>' +
        '</div>';
    }).join('');
    Array.prototype.forEach.call(elPendenciasLimpeza.querySelectorAll('[data-acao="fechar-pendencia"]'), function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.parentNode;
        var pid = wrap && wrap.getAttribute('data-pendencia');
        pendenciasLimpeza = pendenciasLimpeza.filter(function (p) { return p.id !== pid; });
        renderPendenciasLimpeza();
      });
    });
  }

  /* --------------------------------------------------------------- */
  document.addEventListener('caef:accountstate', function (e) {
    estadoConta = e.detail || { authenticated: false, isAdmin: false };
    if (painelSection.classList.contains('active')) avaliarAcesso();
  });
  document.addEventListener('caef:tabchange', function (e) {
    if (e.detail && e.detail.id === 'painel-gestao') avaliarAcesso();
  });
  if (window.location.hash === '#painel-gestao') avaliarAcesso();

  function avaliarAcesso() {
    if (!window.caefContentSource || !window.caefContentSource.admin) {
      elRestrito.hidden = true; elConteudo.hidden = true; elIndisponivel.hidden = false;
      return;
    }
    elIndisponivel.hidden = true;
    if (!estadoConta.authenticated || !estadoConta.isAdmin) {
      elConteudo.hidden = true; elRestrito.hidden = false;
      return;
    }
    elRestrito.hidden = true; elConteudo.hidden = false;
    if (!carregado.mural) carregarMural();
    if (!carregado.radar) carregarRadar();
  }

  /* --------------------------------------------------------------- */
  if (tabMural) tabMural.addEventListener('click', function () { trocarModulo('mural'); });
  if (tabRadar) tabRadar.addEventListener('click', function () { trocarModulo('radar'); });
  function trocarModulo(qual) {
    var isMural = qual === 'mural';
    tabMural.setAttribute('aria-selected', String(isMural));
    tabRadar.setAttribute('aria-selected', String(!isMural));
    modMural.hidden = !isMural;
    modRadar.hidden = isMural;
  }

  /* =================================================================
     MURAL — listagem
     ================================================================= */
  var SITUACAO_LABEL = { publicado: 'Publicado', pendente: 'Pendente', arquivado: 'Arquivado' };

  function carregarMural() {
    listaMural.innerHTML = '<p class="painel-form-status">Carregando…</p>';
    window.caefContentSource.admin.listarAvisos().then(function (avisos) {
      cacheMural = avisos; carregado.mural = true; renderMural();
    })['catch'](function () {
      carregado.mural = false;
      listaMural.innerHTML = '<p class="painel-form-status is-error">Não foi possível carregar o Mural agora. <button type="button" class="student-button student-secondary" id="painelMuralRetry">Tentar de novo</button></p>';
      var retry = document.getElementById('painelMuralRetry');
      if (retry) retry.addEventListener('click', carregarMural);
    });
  }

  function renderMural() {
    if (!cacheMural.length) { listaMural.innerHTML = '<p class="painel-form-status">Nenhum aviso cadastrado ainda.</p>'; return; }
    /* V28 — item 7: sinaliza internamente (só no Painel de Gestão —
       nunca ao público, nunca confundido com validade/expiração) quando
       um aviso publicado já passou da própria data de revisão editorial
       sem confirmação. Comparação por string funciona porque
       revisaoEditorial vem sempre como "AAAA-MM-DD" (tipo date do
       Postgres). */
    var hojeISO = new Date().toISOString().slice(0, 10);
    listaMural.innerHTML = cacheMural.map(function (a) {
      var precisaRevisao = a.situacaoPublicacao === 'publicado' && a.revisaoEditorial && a.revisaoEditorial <= hojeISO;
      return '<div class="painel-item" data-id="' + escapeHtml(a.id) + '">' +
        '<div class="painel-item-info">' +
          '<h4>' + escapeHtml(a.titulo) + '</h4>' +
          '<p>' + escapeHtml(a.origem || 'Sem origem informada') + '</p>' +
          '<div class="painel-item-badges">' +
            '<span class="painel-badge ' + escapeHtml(a.situacaoPublicacao) + '">' + escapeHtml(SITUACAO_LABEL[a.situacaoPublicacao] || a.situacaoPublicacao) + '</span>' +
            (a.imagemPath ? '<span class="painel-badge">Com imagem</span>' : '') +
            (precisaRevisao ? '<span class="painel-badge revisao-pendente">Revisão editorial pendente</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="painel-item-actions">' +
          '<button type="button" class="student-button student-secondary" data-acao="editar">Editar</button>' +
          '<button type="button" class="student-button student-danger" data-acao="excluir-iniciar">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');
    Array.prototype.forEach.call(listaMural.querySelectorAll('.painel-item'), function (row) {
      var id = row.dataset.id;
      row.querySelector('[data-acao="editar"]').addEventListener('click', function () { abrirFormularioAviso(id); });
      row.querySelector('[data-acao="excluir-iniciar"]').addEventListener('click', function () { iniciarExclusao(row, 'aviso', id); });
    });
  }

  /* Exclusão: confirmação em duas etapas, dentro da própria linha (sem
     diálogo nativo confirm()), mesmo espírito do fluxo já usado em
     Minha Conta (digitar "EXCLUIR"). */
  function iniciarExclusao(row, tipo, id) {
    if (row.querySelector('.painel-confirm')) return;
    var confirmBlock = document.createElement('div');
    confirmBlock.className = 'painel-confirm';
    confirmBlock.innerHTML = 'Excluir definitivamente? Esta ação não pode ser desfeita. ' +
      '<button type="button" class="student-button student-danger" data-acao="excluir-confirmar">Sim, excluir</button>' +
      '<button type="button" class="student-button student-secondary" data-acao="excluir-cancelar">Cancelar</button>';
    row.appendChild(confirmBlock);
    confirmBlock.querySelector('[data-acao="excluir-cancelar"]').addEventListener('click', function () { confirmBlock.remove(); });
    confirmBlock.querySelector('[data-acao="excluir-confirmar"]').addEventListener('click', function () {
      var btn = confirmBlock.querySelector('[data-acao="excluir-confirmar"]');
      btn.disabled = true; btn.textContent = 'Excluindo…';
      // item 2: captura o título ANTES de filtrar a linha do cache, para a
      // pendência de limpeza (se houver) identificar o aviso pelo nome.
      var tituloExcluido = (tipo === 'aviso' && (cacheMural.filter(function (x) { return x.id === id; })[0] || {}).titulo) || id;
      var promessa = tipo === 'aviso' ? window.caefContentSource.admin.excluirAviso(id) : window.caefContentSource.admin.excluirRadarItem(id);
      promessa.then(function (resultado) {
        /* V28 — item 1: reflete a exclusão no Mural/Radar públicos e na
           Busca Geral, sem recarregar a página. */
        if (tipo === 'aviso') {
          cacheMural = cacheMural.filter(function (x) { return x.id !== id; }); renderMural(); if (window.caefRefreshMural) window.caefRefreshMural();
          // item 2: exclusão bem-sucedida no banco não significa que o
          // arquivo de imagem também foi removido do Storage — distingue
          // as duas coisas em vez de deixar a linha simplesmente sumir em
          // silêncio quando há uma pendência.
          if (resultado && resultado.imagemNaoRemovida) {
            registrarPendenciaLimpeza('Aviso "' + tituloExcluido + '" excluído, mas o arquivo de imagem (' + (resultado.imagemPath || '?') + ') pode ter permanecido no bucket avisos-caef — confira manualmente (manual-limpeza-imagens-orfas.md).');
          }
        }
        else { cacheRadar = cacheRadar.filter(function (x) { return x.id !== id; }); renderRadar(); if (window.caefRefreshRadar) window.caefRefreshRadar(); }
      })['catch'](function () {
        confirmBlock.innerHTML = '<span>Não foi possível excluir agora. Tente novamente.</span> <button type="button" class="student-button student-secondary" data-acao="excluir-cancelar2">Fechar</button>';
        confirmBlock.querySelector('[data-acao="excluir-cancelar2"]').addEventListener('click', function () { confirmBlock.remove(); });
      });
    });
  }

  /* -------- formulário de aviso (criar/editar) -------- */
  function abrirFormularioAviso(id) {
    var aviso = id ? cacheMural.filter(function (a) { return a.id === id; })[0] : null;
    var editando = !!aviso;
    var html = '<h2 id="painelFormTitle">' + (editando ? 'Editar aviso' : 'Novo aviso') + '</h2>' +
      '<form id="painelAvisoForm">' +
        (editando ? '' : '<div class="painel-form-field"><label for="pfAvisoId">Identificador (id)</label><input type="text" id="pfAvisoId" required placeholder="ex.: aviso-nome-curto" value=""></div>') +
        '<div class="painel-form-field"><label for="pfAvisoTitulo">Título</label><input type="text" id="pfAvisoTitulo" required value="' + escapeHtml(aviso && aviso.titulo) + '"></div>' +
        '<div class="painel-form-field"><label for="pfAvisoTexto">Texto</label><textarea id="pfAvisoTexto" required>' + escapeHtml(aviso && aviso.texto) + '</textarea></div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="pfAvisoOrigem">Origem</label><input type="text" id="pfAvisoOrigem" value="' + escapeHtml(aviso && aviso.origem) + '"></div>' +
          '<div class="painel-form-field"><label for="pfAvisoData">Data do comunicado (DD/MM/AAAA)</label><input type="text" id="pfAvisoData" value="' + escapeHtml(aviso && aviso.dataOriginal) + '"></div>' +
        '</div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="pfAvisoValidoAte">Válido até (opcional)</label><input type="date" id="pfAvisoValidoAte" value="' + (aviso && aviso.validoAte ? String(aviso.validoAte).slice(0, 10) : '') + '"></div>' +
          '<div class="painel-form-field"><label for="pfAvisoOrdem">Ordem de exibição</label><input type="text" id="pfAvisoOrdem" inputmode="numeric" value="' + (aviso ? aviso.ordem : (cacheMural.length + 1)) + '"></div>' +
        '</div>' +
        '<div class="painel-form-field"><label for="pfAvisoRevisaoEditorial">Revisão editorial (opcional)</label><input type="date" id="pfAvisoRevisaoEditorial" value="' + (aviso && aviso.revisaoEditorial ? String(aviso.revisaoEditorial).slice(0, 10) : '') + '">' +
          '<p style="font-size:12px;color:var(--ink-muted);margin:4px 0 0;">Data para reconferir se este conteúdo ainda está correto/atual. Uso só interno — nunca aparece ao público e não afeta a publicação nem a validade (Válido até).</p></div>' +
        '<div class="painel-form-field"><label for="pfAvisoSituacao">Situação</label><select id="pfAvisoSituacao">' +
          ['pendente', 'publicado', 'arquivado'].map(function (s) { return '<option value="' + s + '"' + (aviso && aviso.situacaoPublicacao === s ? ' selected' : (!aviso && s === 'pendente' ? ' selected' : '')) + '>' + SITUACAO_LABEL[s] + '</option>'; }).join('') +
        '</select></div>' +
        (editando ? '<label class="painel-form-check"><input type="checkbox" id="pfAvisoNotificar"> Notificar estudantes optantes sobre esta atualização (além de publicar/retirar, que já notificam sozinhos)</label>' : '') +
        '<div class="painel-form-field">' +
          '<label>Imagem (opcional)</label>' +
          (aviso && aviso.imagemUrl ? '<div class="painel-img-current"><img src="' + escapeHtml(aviso.imagemUrl) + '" alt="' + escapeHtml(aviso.imagemAlt || '') + '"><button type="button" class="student-button student-secondary" id="pfAvisoImgRemover">Remover imagem</button></div>' : '') +
          '<input type="file" id="pfAvisoImgArquivo" accept="image/jpeg,image/png,image/webp">' +
          '<input type="text" id="pfAvisoImgAlt" placeholder="Texto alternativo (obrigatório se enviar imagem)" value="' + escapeHtml(aviso && aviso.imagemAlt) + '" style="margin-top:8px;">' +
          (editando ? '<button type="button" class="student-button student-secondary" id="pfAvisoImgEnviar" style="margin-top:8px;">Enviar/substituir imagem</button>' : '<p style="font-size:12.5px;color:var(--ink-muted);margin-top:6px;">Salve o aviso primeiro; a imagem é enviada depois, ao editá-lo.</p>') +
          '<p class="painel-form-status" id="pfAvisoImgStatus"></p>' +
        '</div>' +
        '<p class="painel-form-status" id="pfAvisoStatus"></p>' +
        '<div class="student-controls"><button type="submit" class="student-button" id="pfAvisoSalvar">Salvar aviso</button></div>' +
      '</form>';
    formBody.innerHTML = html;
    abrirPainelFormulario();

    var form = document.getElementById('painelAvisoForm');
    var statusEl = document.getElementById('pfAvisoStatus');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = document.getElementById('pfAvisoSalvar');
      btn.disabled = true;
      statusEl.className = 'painel-form-status'; statusEl.textContent = 'Salvando…';
      var payload = {
        id: editando ? aviso.id : null,
        novoId: editando ? undefined : slugify(document.getElementById('pfAvisoId').value),
        titulo: document.getElementById('pfAvisoTitulo').value.trim(),
        texto: document.getElementById('pfAvisoTexto').value.trim(),
        origem: document.getElementById('pfAvisoOrigem').value.trim(),
        dataOriginal: document.getElementById('pfAvisoData').value.trim(),
        validoAte: document.getElementById('pfAvisoValidoAte').value || null,
        revisaoEditorial: document.getElementById('pfAvisoRevisaoEditorial').value || null,
        situacaoPublicacao: document.getElementById('pfAvisoSituacao').value,
        ordem: parseInt(document.getElementById('pfAvisoOrdem').value, 10) || 999,
        notificarAtualizacao: editando && document.getElementById('pfAvisoNotificar') ? document.getElementById('pfAvisoNotificar').checked : false
      };
      if (!editando && !payload.novoId) { statusEl.className = 'painel-form-status is-error'; statusEl.textContent = 'Informe um identificador válido.'; btn.disabled = false; return; }
      window.caefContentSource.admin.salvarAviso(payload).then(function (salvo) {
        statusEl.className = 'painel-form-status is-ok'; statusEl.textContent = 'Aviso salvo com sucesso.';
        if (editando) cacheMural = cacheMural.map(function (a) { return a.id === salvo.id ? Object.assign({}, a, salvo) : a; });
        else cacheMural = cacheMural.concat([salvo]);
        renderMural();
        /* V28 — item 1: publicação/edição refletida no Mural público, na
           Área do Estudante e na Busca Geral sem recarregar a página. */
        if (window.caefRefreshMural) window.caefRefreshMural();
        setTimeout(fecharPainelFormulario, 900);
      })['catch'](function (err) {
        statusEl.className = 'painel-form-status is-error';
        statusEl.textContent = 'Não foi possível salvar agora. ' + (err && err.message ? err.message : 'Tente novamente.');
        btn.disabled = false;
      });
    });

    var btnRemoverImg = document.getElementById('pfAvisoImgRemover');
    if (btnRemoverImg) {
      btnRemoverImg.addEventListener('click', function () {
        var imgStatus = document.getElementById('pfAvisoImgStatus');
        btnRemoverImg.disabled = true;
        imgStatus.className = 'painel-form-status'; imgStatus.textContent = 'Removendo…';
        // Mesmo padrão da V27 (remoção de foto de perfil): Storage primeiro,
        // checando error explicitamente; só então o banco é atualizado; em
        // qualquer falha, nada muda e a pessoa pode tentar de novo.
        window.caefContentSource.admin.removerImagemAviso(aviso.id, aviso.imagemPath).then(function (resultado) {
          // V28 — item 2: removerImagemAviso agora pode ter salvo no banco
          // mas falhado ao apagar o arquivo antigo do Storage. Isso NÃO é
          // "Imagem removida." sem ressalva — a pessoa precisa saber que
          // sobrou um arquivo órfão para revisar manualmente.
          if (resultado && resultado.imagemNaoRemovidaDoStorage) {
            imgStatus.className = 'painel-form-status is-warning';
            imgStatus.textContent = 'Imagem desvinculada do aviso, mas o arquivo pode ter permanecido no Storage — confira manualmente.';
            registrarPendenciaLimpeza('Imagem do aviso "' + (aviso.titulo || aviso.id) + '" removida do cadastro, mas o arquivo (' + (resultado.imagemPath || '?') + ') pode ter permanecido no bucket avisos-caef — confira manualmente (manual-limpeza-imagens-orfas.md).');
          } else {
            imgStatus.className = 'painel-form-status is-ok'; imgStatus.textContent = 'Imagem removida.';
          }
          aviso.imagemPath = null; aviso.imagemUrl = null; aviso.imagemAlt = null;
          cacheMural = cacheMural.map(function (a) { return a.id === aviso.id ? Object.assign({}, a, { imagemPath: null, imagemUrl: null, imagemAlt: null }) : a; });
          renderMural();
          if (window.caefRefreshMural) window.caefRefreshMural();
          setTimeout(function () { abrirFormularioAviso(aviso.id); }, 700);
        })['catch'](function (err) {
          /* V28 — item 3: removerImagemAviso agora pode recusar por
             conflito de concorrência (a imagem já foi alterada por outra
             sessão) — mostra a mensagem real em vez de um texto genérico,
             para que a pessoa saiba que precisa atualizar a lista antes de
             tentar de novo, em vez de insistir no mesmo estado. */
          imgStatus.className = 'painel-form-status is-error';
          imgStatus.textContent = (err && err.message) ? err.message : 'Não foi possível remover a imagem agora. Tente de novo.';
          btnRemoverImg.disabled = false;
        });
      });
    }
    var btnEnviarImg = document.getElementById('pfAvisoImgEnviar');
    if (btnEnviarImg) {
      btnEnviarImg.addEventListener('click', function () {
        var arquivo = document.getElementById('pfAvisoImgArquivo').files[0];
        var alt = document.getElementById('pfAvisoImgAlt').value;
        var imgStatus = document.getElementById('pfAvisoImgStatus');
        if (!arquivo) { imgStatus.className = 'painel-form-status is-error'; imgStatus.textContent = 'Escolha um arquivo de imagem primeiro.'; return; }
        btnEnviarImg.disabled = true;
        imgStatus.className = 'painel-form-status'; imgStatus.textContent = 'Enviando…';
        window.caefContentSource.admin.enviarImagemAviso(aviso.id, arquivo, alt).then(function (salvo) {
          // V28 — item 2: a substituição pode ter salvo a imagem nova com
          // sucesso mas falhado ao apagar a imagem ANTERIOR do Storage —
          // isso deixa um arquivo órfão que precisa de revisão manual, e
          // não pode ser relatado como sucesso completo sem ressalva.
          if (salvo && salvo.imagemAnteriorNaoRemovida) {
            imgStatus.className = 'painel-form-status is-warning';
            imgStatus.textContent = 'Imagem enviada, mas a imagem anterior pode ter permanecido no Storage — confira manualmente.';
            registrarPendenciaLimpeza('Imagem do aviso "' + (aviso.titulo || aviso.id) + '" substituída, mas o arquivo anterior (' + (salvo.imagemAnteriorPath || '?') + ') pode ter permanecido no bucket avisos-caef — confira manualmente (manual-limpeza-imagens-orfas.md).');
          } else {
            imgStatus.className = 'painel-form-status is-ok'; imgStatus.textContent = 'Imagem enviada.';
          }
          cacheMural = cacheMural.map(function (a) { return a.id === salvo.id ? Object.assign({}, a, salvo) : a; });
          renderMural();
          if (window.caefRefreshMural) window.caefRefreshMural();
          setTimeout(function () { abrirFormularioAviso(salvo.id); }, 700);
        })['catch'](function (err) {
          imgStatus.className = 'painel-form-status is-error';
          imgStatus.textContent = (err && err.message) ? err.message : 'Não foi possível enviar a imagem agora. Tente de novo.';
          btnEnviarImg.disabled = false;
        });
      });
    }
  }

  /* =================================================================
     RADAR — listagem
     ================================================================= */
  var TYPE_LABEL = { extensao: 'Extensão', pesquisa: 'Pesquisa/Laboratório', monitoria: 'Monitoria', evento: 'Evento' };

  function carregarRadar() {
    listaRadar.innerHTML = '<p class="painel-form-status">Carregando…</p>';
    window.caefContentSource.admin.listarRadar().then(function (itens) {
      cacheRadar = itens; carregado.radar = true; renderRadar();
    })['catch'](function () {
      carregado.radar = false;
      listaRadar.innerHTML = '<p class="painel-form-status is-error">Não foi possível carregar o Radar agora. <button type="button" class="student-button student-secondary" id="painelRadarRetry">Tentar de novo</button></p>';
      var retry = document.getElementById('painelRadarRetry');
      if (retry) retry.addEventListener('click', carregarRadar);
    });
  }

  function renderRadar() {
    if (!cacheRadar.length) { listaRadar.innerHTML = '<p class="painel-form-status">Nenhuma oportunidade cadastrada ainda.</p>'; return; }
    listaRadar.innerHTML = cacheRadar.map(function (o) {
      return '<div class="painel-item" data-id="' + escapeHtml(o.id) + '">' +
        '<div class="painel-item-info">' +
          '<h4>' + escapeHtml(o.shortTitle || o.title) + '</h4>' +
          '<p>' + escapeHtml(TYPE_LABEL[o.type] || o.type) + (o.area ? ' · ' + escapeHtml(o.area) : '') + '</p>' +
          '<div class="painel-item-badges"><span class="painel-badge ' + (o.authorized ? 'autorizado' : 'nao-autorizado') + '">' + (o.authorized ? 'Autorizado' : 'Não autorizado') + '</span></div>' +
        '</div>' +
        '<div class="painel-item-actions">' +
          '<button type="button" class="student-button student-secondary" data-acao="editar">Editar</button>' +
          '<button type="button" class="student-button ' + (o.authorized ? 'student-secondary' : '') + '" data-acao="alternar-autorizacao">' + (o.authorized ? 'Desautorizar' : 'Autorizar') + '</button>' +
          '<button type="button" class="student-button student-danger" data-acao="excluir-iniciar">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');
    Array.prototype.forEach.call(listaRadar.querySelectorAll('.painel-item'), function (row) {
      var id = row.dataset.id;
      row.querySelector('[data-acao="editar"]').addEventListener('click', function () { abrirFormularioRadar(id); });
      row.querySelector('[data-acao="excluir-iniciar"]').addEventListener('click', function () { iniciarExclusao(row, 'radar', id); });
      row.querySelector('[data-acao="alternar-autorizacao"]').addEventListener('click', function (ev) {
        var item = cacheRadar.filter(function (x) { return x.id === id; })[0];
        if (!item) return;
        var btn = ev.currentTarget; btn.disabled = true;
        // CORREÇÃO desta rodada (achado na segunda leitura independente):
        // cacheRadar guarda os itens no formato de normalizeRadarItem(),
        // que aninha a disponibilidade em item.status.{availability,note}
        // — mas salvarRadarItem()/admin_radar_upsert() esperam os campos
        // PLANOS statusAvailability/statusNote (é o formato que o
        // formulário de edição já monta corretamente). Um Object.assign
        // direto de "item" deixava esses dois campos undefined no payload
        // deste botão de alternância rápida; undefined não é serializado
        // pelo JSON.stringify, então a chamada de RPC saía sem o parâmetro
        // p_status_availability — que não tem valor padrão na função SQL
        // (admin_radar_upsert), e o PostgREST não encontra nenhuma
        // assinatura correspondente para a chamada. O SDK de teste local
        // não pegava isso porque, no stub, um parâmetro ausente vira
        // silenciosamente null em vez de recusar a chamada (só o Supabase
        // real reproduz o erro de verdade).
        var payload = Object.assign({}, item, {
          authorized: !item.authorized,
          statusAvailability: item.status && item.status.availability,
          statusNote: item.status && item.status.note
        });
        window.caefContentSource.admin.salvarRadarItem(payload).then(function (salvo) {
          cacheRadar = cacheRadar.map(function (x) { return x.id === salvo.id ? salvo : x; });
          renderRadar();
          if (window.caefRefreshRadar) window.caefRefreshRadar();
        })['catch'](function () { btn.disabled = false; });
      });
    });
  }

  function abrirFormularioRadar(id) {
    var item = id ? cacheRadar.filter(function (o) { return o.id === id; })[0] : null;
    var editando = !!item;
    var html = '<h2 id="painelFormTitle">' + (editando ? 'Editar oportunidade' : 'Nova oportunidade') + '</h2>' +
      '<form id="painelRadarForm">' +
        (editando ? '<div class="painel-form-field"><label>Identificador (id)</label><input type="text" value="' + escapeHtml(item.id) + '" disabled></div>' :
          '<div class="painel-form-field"><label for="prId">Identificador (id) — usado em links, não muda depois</label><input type="text" id="prId" required placeholder="ex.: ext-nome-curto"></div>') +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prType">Tipo</label><select id="prType">' + ['extensao', 'pesquisa', 'monitoria', 'evento'].map(function (t) { return '<option value="' + t + '"' + (item && item.type === t ? ' selected' : '') + '>' + TYPE_LABEL[t] + '</option>'; }).join('') + '</select></div>' +
          '<div class="painel-form-field"><label for="prArea">Área</label><input type="text" id="prArea" value="' + escapeHtml(item && item.area) + '"></div>' +
        '</div>' +
        '<div class="painel-form-field"><label for="prTitle">Título completo</label><input type="text" id="prTitle" required value="' + escapeHtml(item && item.title) + '"></div>' +
        '<div class="painel-form-field"><label for="prShortTitle">Título curto (cartão)</label><input type="text" id="prShortTitle" value="' + escapeHtml(item && item.shortTitle) + '"></div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prCoordinator">Coordenação</label><input type="text" id="prCoordinator" value="' + escapeHtml(item && item.coordinator) + '"></div>' +
          '<div class="painel-form-field"><label for="prContact">Contato</label><input type="text" id="prContact" value="' + escapeHtml(item && item.contact) + '"></div>' +
        '</div>' +
        '<div class="painel-form-field"><label for="prDescription">Descrição</label><textarea id="prDescription">' + escapeHtml(item && item.description) + '</textarea></div>' +
        '<div class="painel-form-field"><label for="prRequirements">Pré-requisitos</label><textarea id="prRequirements">' + escapeHtml(item && item.requirements) + '</textarea></div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prSelection">Processo seletivo</label><input type="text" id="prSelection" value="' + escapeHtml(item && item.selection) + '"></div>' +
          '<div class="painel-form-field"><label for="prSelectionLink">Link do processo (http/https)</label><input type="url" id="prSelectionLink" value="' + escapeHtml(item && item.selectionLink) + '"></div>' +
        '</div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prShifts">Turnos (separados por vírgula)</label><input type="text" id="prShifts" value="' + escapeHtml(item && (item.shifts || []).join(', ')) + '"></div>' +
          '<div class="painel-form-field"><label for="prAvail">Disponibilidade</label><select id="prAvail">' + ['vagas', 'consultar', 'encerrado'].map(function (a) { return '<option value="' + a + '"' + (item && item.status && item.status.availability === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
        '</div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prStatusNote">Observação de status (opcional)</label><input type="text" id="prStatusNote" value="' + escapeHtml(item && item.status && item.status.note) + '"></div>' +
          '<div class="painel-form-field"><label for="prLastUpdated">Atualizado em (DD/MM/AAAA)</label><input type="text" id="prLastUpdated" value="' + escapeHtml(item && item.lastUpdated) + '"></div>' +
        '</div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prAudience">Público (extensão)</label><input type="text" id="prAudience" value="' + escapeHtml(item && item.audience) + '"></div>' +
          '<div class="painel-form-field"><label for="prParticipationType">Modalidade de participação (extensão)</label><input type="text" id="prParticipationType" value="' + escapeHtml(item && item.participationType) + '"></div>' +
        '</div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prWorkload">Carga horária (extensão)</label><input type="text" id="prWorkload" value="' + escapeHtml(item && item.workload) + '"></div>' +
          '<div class="painel-form-field"><label for="prDuration">Duração (extensão)</label><input type="text" id="prDuration" value="' + escapeHtml(item && item.duration) + '"></div>' +
        '</div>' +
        '<div class="painel-form-field"><label for="prLabName">Laboratório/grupo (pesquisa)</label><input type="text" id="prLabName" value="' + escapeHtml(item && item.labName) + '"></div>' +
        '<div class="painel-form-row">' +
          '<div class="painel-form-field"><label for="prModalities">Modalidades de ingresso — pesquisa (vírgula)</label><input type="text" id="prModalities" value="' + escapeHtml(item && (item.modalities || []).join(', ')) + '"></div>' +
          '<div class="painel-form-field"><label for="prLevel">Nível — pesquisa (vírgula)</label><input type="text" id="prLevel" value="' + escapeHtml(item && (item.level || []).join(', ')) + '"></div>' +
        '</div>' +
        '<div class="painel-form-field"><label for="prDedication">Dedicação semanal (pesquisa)</label><input type="text" id="prDedication" value="' + escapeHtml(item && item.dedication) + '"></div>' +
        '<div class="painel-form-field"><label for="prOrdem">Ordem de exibição</label><input type="text" id="prOrdem" inputmode="numeric" value="' + (item ? item.ordem : (cacheRadar.length + 1)) + '"></div>' +
        '<label class="painel-form-check"><input type="checkbox" id="prAuthorized"' + (item && item.authorized ? ' checked' : '') + '> Autorizado (visível ao público)</label>' +
        (editando ? '<label class="painel-form-check"><input type="checkbox" id="prNotificar"> Notificar estudantes optantes sobre esta atualização</label>' : '') +
        '<p class="painel-form-status" id="prStatus"></p>' +
        '<div class="student-controls"><button type="submit" class="student-button" id="prSalvar">Salvar oportunidade</button></div>' +
      '</form>';
    formBody.innerHTML = html;
    abrirPainelFormulario();

    document.getElementById('painelRadarForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = document.getElementById('prSalvar');
      var statusEl = document.getElementById('prStatus');
      btn.disabled = true;
      statusEl.className = 'painel-form-status'; statusEl.textContent = 'Salvando…';
      var linkDigitado = document.getElementById('prSelectionLink').value.trim();
      if (linkDigitado && !window.caefContentSource.validarUrlHttp(linkDigitado)) {
        statusEl.className = 'painel-form-status is-error'; statusEl.textContent = 'O link do processo seletivo precisa começar com http:// ou https://.';
        btn.disabled = false; return;
      }
      var payload = {
        id: editando ? item.id : null,
        novoId: editando ? undefined : slugify(document.getElementById('prId').value),
        type: document.getElementById('prType').value,
        title: document.getElementById('prTitle').value.trim(),
        shortTitle: document.getElementById('prShortTitle').value.trim(),
        area: document.getElementById('prArea').value.trim(),
        coordinator: document.getElementById('prCoordinator').value.trim(),
        contact: document.getElementById('prContact').value.trim(),
        description: document.getElementById('prDescription').value.trim(),
        requirements: document.getElementById('prRequirements').value.trim(),
        selection: document.getElementById('prSelection').value.trim(),
        selectionLink: linkDigitado,
        shifts: csvToArray(document.getElementById('prShifts').value),
        statusAvailability: document.getElementById('prAvail').value,
        statusNote: document.getElementById('prStatusNote').value.trim(),
        lastUpdated: document.getElementById('prLastUpdated').value.trim(),
        audience: document.getElementById('prAudience').value.trim(),
        participationType: document.getElementById('prParticipationType').value.trim(),
        workload: document.getElementById('prWorkload').value.trim(),
        duration: document.getElementById('prDuration').value.trim(),
        labName: document.getElementById('prLabName').value.trim(),
        modalities: csvToArray(document.getElementById('prModalities').value),
        level: csvToArray(document.getElementById('prLevel').value),
        dedication: document.getElementById('prDedication').value.trim(),
        ordem: parseInt(document.getElementById('prOrdem').value, 10) || 999,
        authorized: document.getElementById('prAuthorized').checked,
        notificarAtualizacao: editando && document.getElementById('prNotificar') ? document.getElementById('prNotificar').checked : false
      };
      if (!editando && !payload.novoId) { statusEl.className = 'painel-form-status is-error'; statusEl.textContent = 'Informe um identificador válido.'; btn.disabled = false; return; }
      window.caefContentSource.admin.salvarRadarItem(payload).then(function (salvo) {
        statusEl.className = 'painel-form-status is-ok'; statusEl.textContent = 'Oportunidade salva com sucesso.';
        if (editando) cacheRadar = cacheRadar.map(function (o) { return o.id === salvo.id ? salvo : o; });
        else cacheRadar = cacheRadar.concat([salvo]);
        renderRadar();
        /* V28 — item 1: publicação/edição refletida no Radar público e na
           Busca Geral sem recarregar a página. */
        if (window.caefRefreshRadar) window.caefRefreshRadar();
        setTimeout(fecharPainelFormulario, 900);
      })['catch'](function (err) {
        statusEl.className = 'painel-form-status is-error';
        statusEl.textContent = 'Não foi possível salvar agora. ' + (err && err.message ? err.message : 'Tente novamente.');
        btn.disabled = false;
      });
    });
  }

  if (btnNovoMural) btnNovoMural.addEventListener('click', function () { abrirFormularioAviso(null); });
  if (btnNovoRadar) btnNovoRadar.addEventListener('click', function () { abrirFormularioRadar(null); });

  /* O botão "Limpar imagens sem referência" foi retirado do painel nesta
     rodada: a função que ele chamava (window.caefContentSource.admin.
     limparImagensOrfasAvisos, em js/supabase-content.js) não consegue
     garantir, só com código do navegador, que nunca vai remover um arquivo
     de um upload/substituição concorrente ainda em andamento — mitigado
     (idade mínima + reconferência por arquivo antes de cada remoção), mas
     não garantido de forma absoluta sem coordenação do lado do servidor,
     fora do escopo desta rodada. A função continua no código, mais
     defensiva, como reforço interno; o procedimento seguro para limpar
     manualmente, quando necessário, está documentado em
     manual-limpeza-imagens-orfas.md (fora do navegador, direto no painel
     do Supabase). */

  /* =================================================================
     Diálogo do formulário (painel deslizante) — mesmo padrão de
     acessibilidade já usado no detalhe do Radar (foco preso, Esc fecha,
     foco devolvido ao fechar).
     ================================================================= */
  function getFocavel() {
    return Array.prototype.filter.call(formPanel.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'), function (el) { return !el.hidden && el.offsetParent !== null; });
  }
  function abrirPainelFormulario() {
    lastFocused = document.activeElement;
    formPanel.inert = false;
    formOverlay.classList.add('open'); formPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { if (formPanel.classList.contains('open')) formClose.focus(); }, 10);
  }
  function fecharPainelFormulario() {
    if (!formPanel.classList.contains('open')) return;
    formOverlay.classList.remove('open'); formPanel.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused && document.body.contains(lastFocused) && lastFocused.offsetParent !== null) lastFocused.focus();
    lastFocused = null;
    if (formPanel.contains(document.activeElement) && document.activeElement.blur) document.activeElement.blur();
    formPanel.inert = true;
    formBody.innerHTML = '';
  }
  formOverlay.addEventListener('click', fecharPainelFormulario);
  formClose.addEventListener('click', fecharPainelFormulario);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharPainelFormulario(); });
  formPanel.addEventListener('keydown', function (e) {
    if (!formPanel.classList.contains('open') || e.key !== 'Tab') return;
    var focavel = getFocavel();
    if (!focavel.length) return;
    var first = focavel[0], last = focavel[focavel.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  formPanel.inert = true;
})();
