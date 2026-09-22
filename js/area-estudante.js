/* Área do Estudante — autenticação Supabase gerenciada (e-mail + senha),
   sem dados do SIGAA. Enquanto a configuração estiver desligada, nenhum
   pedido de rede é executado.
   V26: cadastro/login por senha (antes: link mágico), Meu Perfil
   (dados opcionais autodeclarados, tabela public.student_profiles) e
   redesign visual. As chamadas de autenticação em si (criação de conta,
   confirmação por e-mail, recuperação de senha, sessão, exclusão de
   conta) seguem os métodos atuais do Supabase Auth; a restrição de
   domínio e o hook Before User Created no servidor não foram alterados. */
(function () {
  'use strict';
  var cfg = window.CAEF_STUDENT_CONFIG || {};

  var loading = document.getElementById('studentLoading');
  var setup = document.getElementById('studentSetup');
  var setupStatus = document.getElementById('studentSetupStatus');
  var auth = document.getElementById('studentAuth');
  var logged = document.getElementById('studentLogged');
  if (!loading || !setup || !auth || !logged) return;

  var client, currentUser = null, currentProfile = null, busy = false;
  var currentIsAdmin = false; // V28: nunca decide nada sozinho — só espelha o que public.admin_roles diz no banco
  var currentAvatarUrl = null; // URL de objeto local (blob), nunca um link público
  var AVATAR_BUCKET = 'avatares-caef';
  var ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  var MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB — mesmo limite do bucket no Supabase

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  function tell(el, message, isError) {
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('student-error', !!isError);
  }
  function domainOf(email) { return String(email || '').trim().toLowerCase().split('@').slice(1).join('@'); }
  function allowed(email) {
    var str = String(email || '').trim();
    return /^[^\s@]+@[^\s@]+$/.test(str) && domainOf(str) === cfg.allowedEmailDomain;
  }
  function initials(nameOrEmail) {
    var s = String(nameOrEmail || '').trim();
    if (!s) return '--';
    var namePart = s.indexOf('@') !== -1 ? s.split('@')[0] : s;
    var words = namePart.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '--';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (err) { return '—'; }
  }
  function habilitacaoLabel(value) {
    if (value === 'bacharelado') return 'Bacharelado';
    if (value === 'licenciatura') return 'Licenciatura';
    return 'Não informado';
  }
  function setDisabled(form, value) {
    if (!form) return;
    Array.prototype.forEach.call(form.querySelectorAll('button,input,select'), function (el) { el.disabled = value; });
  }

  /* ---------------------------------------------------------------
     Estado principal: loading / setup / auth / logged
     --------------------------------------------------------------- */
  function show(which) {
    loading.hidden = which !== 'loading';
    setup.hidden = which !== 'setup';
    auth.hidden = which !== 'auth';
    logged.hidden = which !== 'logged';
  }

  /* ---------------------------------------------------------------
     Sub-estados da tela de acesso (login / cadastro / recuperação…)
     --------------------------------------------------------------- */
  var ACCESS_VIEWS = ['Login', 'Signup', 'SignupSent', 'Forgot', 'ForgotSent', 'Reset'];
  function showAccessView(view, focusTarget) {
    ACCESS_VIEWS.forEach(function (v) {
      var el = document.getElementById('studentView' + v);
      if (el) el.hidden = (v !== view);
    });
    if (focusTarget) {
      var target = document.getElementById(focusTarget);
      if (target) target.focus();
    }
  }

  /* ---------------------------------------------------------------
     Mostrar/ocultar senha
     --------------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('.student-toggle-pw'), function (btn) {
    btn.addEventListener('click', function () {
      var ids = (btn.getAttribute('data-toggle-for') || '').split(',');
      var showingNow = btn.getAttribute('aria-pressed') === 'true';
      var next = !showingNow;
      ids.forEach(function (id) {
        var input = document.getElementById(id.trim());
        if (input) input.type = next ? 'text' : 'password';
      });
      btn.setAttribute('aria-pressed', String(next));
      btn.textContent = next ? 'Ocultar' : 'Mostrar';
    });
  });

  /* ---------------------------------------------------------------
     Comunicados (reaproveita o Mural público — window.caefAvisosPublicados)
     --------------------------------------------------------------- */
  var announcements = document.getElementById('studentAnnouncements');
  /* V28 — item 1: distingue três estados em vez de só "tem ou não tem
     itens" — window.caefAvisosCarregado/caefAvisosIndisponivel (ver
     js/main.js, blocos MURAL DE AVISOS) dizem se uma carga já
     terminou e se terminou em falha, para que "ainda carregando" e
     "falhou ao carregar" nunca apareçam como "nenhum comunicado
     publicado" (que é uma afirmação sobre o conteúdo, não sobre o
     carregamento). Também passou a ser reexecutada sempre que os
     avisos são (re)carregados — ver o listener de
     "caef:conteudo-atualizado" logo abaixo — em vez de rodar só uma
     vez no login. */
  function renderAnnouncements() {
    if (!announcements) return;
    announcements.replaceChildren();
    if (window.caefAvisosCarregado !== true) {
      var loading = document.createElement('p');
      loading.textContent = 'Carregando comunicados…';
      announcements.appendChild(loading);
      return;
    }
    if (window.caefAvisosIndisponivel === true) {
      var falha = document.createElement('p');
      falha.textContent = 'Não foi possível carregar os comunicados agora. Isso não significa que não existam novos — tente novamente em instantes.';
      announcements.appendChild(falha);
      return;
    }
    var items = window.caefAvisosPublicados;
    if (!Array.isArray(items) || !items.length) {
      var empty = document.createElement('p');
      empty.textContent = 'Não há comunicados publicados no momento.';
      announcements.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var article = document.createElement('article'); article.className = 'student-announcement';
      var heading = document.createElement('h5'); heading.textContent = item.titulo || 'Comunicado';
      var desc = document.createElement('p'); desc.textContent = item.texto || '';
      article.appendChild(heading); article.appendChild(desc); announcements.appendChild(article);
    });
  }
  /* Reexecuta só enquanto a área logada está de fato em exibição
     (currentUser setado por refreshUser) — evita mexer no DOM enquanto
     a Área do Estudante mostra a tela de login, e evita erro se
     "announcements" não existir nesta página. */
  window.addEventListener('caef:conteudo-atualizado', function (e) {
    if (e && e.detail && e.detail.tipo === 'avisos' && currentUser) renderAnnouncements();
  });

  /* ---------------------------------------------------------------
     Meu Perfil — tabela public.student_profiles (ver supabase-profile-v26.sql)
     Dados OPCIONAIS e autodeclarados; nunca comprovam matrícula/curso/período.
     --------------------------------------------------------------- */
  var profileView = document.getElementById('studentProfileView');
  var profileForm = document.getElementById('studentProfileForm');
  var profileStatus = document.getElementById('studentProfileStatus');
  var profileNameEl = document.getElementById('studentProfileName');
  var profileHabEl = document.getElementById('studentProfileHabilitacao');
  var profilePerEl = document.getElementById('studentProfilePeriodo');
  var profileCreatedEl = document.getElementById('studentProfileCreated');
  var avatarRemoveBtn = document.getElementById('studentAvatarRemove');
  var avatarInput = document.getElementById('studentAvatarInput');
  var avatarStatus = document.getElementById('studentAvatarStatus');

  function dispatchAccountState() {
    var authed = !!currentUser;
    document.dispatchEvent(new CustomEvent('caef:accountstate', {
      detail: {
        authenticated: authed,
        email: authed ? currentUser.email : '',
        initials: authed ? initials((currentProfile && currentProfile.display_name) || currentUser.email) : '',
        avatarUrl: authed ? currentAvatarUrl : null,
        isAdmin: authed ? currentIsAdmin : false // V28: controla só a exibição do link "Painel de Gestão" — a permissão real é sempre a RLS do banco, nunca esta flag de interface
      }
    }));
  }

  function revokeAvatarUrl() {
    if (currentAvatarUrl) { try { URL.revokeObjectURL(currentAvatarUrl); } catch (ignored) {} currentAvatarUrl = null; }
  }

  /* Aplica foto/iniciais nos DOIS lugares que mostram o avatar (cabeçalho
     da área autenticada e bloco de Meu Perfil) e avisa o widget global de
     conta (js/account-widget.js) via evento, para manter os três em
     sincronia sem acoplamento direto entre os arquivos. */
  function applyAvatarToView() {
    var initialsText = initials((currentProfile && currentProfile.display_name) || (currentUser && currentUser.email));
    [
      { img: document.getElementById('studentAvatarPhoto'), span: document.getElementById('studentAvatarInitials') },
      { img: document.getElementById('studentProfileAvatarPhoto'), span: document.getElementById('studentProfileAvatarInitials') }
    ].forEach(function (pair) {
      if (!pair.img || !pair.span) return;
      if (currentAvatarUrl) { pair.img.src = currentAvatarUrl; pair.img.hidden = false; pair.span.hidden = true; }
      else { pair.img.removeAttribute('src'); pair.img.hidden = true; pair.span.hidden = false; pair.span.textContent = initialsText; }
    });
    // "Remover foto" depende de HAVER uma foto salva (avatar_path), não de
    // ela ter carregado com sucesso agora — assim uma falha passageira ao
    // baixar a imagem não esconde a opção de remover uma foto que ainda
    // existe no Storage.
    if (avatarRemoveBtn) avatarRemoveBtn.hidden = !(currentProfile && currentProfile.avatar_path);
    dispatchAccountState();
  }

  async function loadAvatar() {
    revokeAvatarUrl();
    if (!client || !currentUser || !currentProfile || !currentProfile.avatar_path) { applyAvatarToView(); return; }
    try {
      var dl = await client.storage.from(AVATAR_BUCKET).download(currentProfile.avatar_path);
      if (dl.error) throw dl.error;
      currentAvatarUrl = URL.createObjectURL(dl.data);
    } catch (err) {
      currentAvatarUrl = null; // falha silenciosa: interface cai para iniciais
    }
    applyAvatarToView();
  }

  function applyProfileToView() {
    var p = currentProfile || {};
    profileNameEl.textContent = p.display_name || 'Não informado';
    profileHabEl.textContent = habilitacaoLabel(p.habilitacao);
    profilePerEl.textContent = p.periodo || 'Não informado';
    profileCreatedEl.textContent = currentUser ? formatDate(currentUser.created_at) : '—';
    applyAvatarToView();
  }

  if (avatarInput) avatarInput.addEventListener('change', async function () {
    var file = avatarInput.files && avatarInput.files[0];
    avatarInput.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!file || !client || !currentUser || busy) return;
    if (ALLOWED_AVATAR_TYPES.indexOf(file.type) === -1) { tell(avatarStatus, 'Formato não aceito. Envie um arquivo JPEG, PNG ou WEBP.', true); return; }
    if (file.size > MAX_AVATAR_BYTES) { tell(avatarStatus, 'Arquivo muito grande. O limite é 2 MB.', true); return; }
    try {
      busy = true; tell(avatarStatus, 'Enviando foto…');
      var path = currentUser.id + '/avatar';
      var up = await client.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      var result = await client.from('student_profiles')
        .upsert({ id: currentUser.id, avatar_path: path }, { onConflict: 'id' })
        .select('display_name,habilitacao,periodo,avatar_path').maybeSingle();
      if (result.error) throw result.error;
      currentProfile = result.data || Object.assign({}, currentProfile, { avatar_path: path });
      tell(avatarStatus, 'Foto atualizada.');
      await loadAvatar();
    } catch (err) {
      tell(avatarStatus, 'Não foi possível enviar a foto agora. Tente novamente.', true);
    } finally {
      busy = false;
    }
  });

  if (avatarRemoveBtn) avatarRemoveBtn.addEventListener('click', async function () {
    if (!client || !currentUser || busy || !currentProfile || !currentProfile.avatar_path) return;
    var oldPath = currentProfile.avatar_path;
    try {
      busy = true; tell(avatarStatus, 'Removendo foto…');
      /* Ordem corrigida: só apagamos a referência no perfil DEPOIS de o
         Storage confirmar a remoção do arquivo — nunca antes. Checamos
         tanto uma exceção quanto o campo "error" da resposta de
         remove(): a própria comunidade do Supabase já relatou casos em
         que remove() resolve sem "error" mesmo sem remover nada (ver
         relatório), então tratar só a exceção não bastaria.
         Se qualquer uma das duas etapas falhar, NÃO alteramos
         currentProfile.avatar_path — a referência à foto continua
         exatamente como estava, "Remover foto" permanece visível e
         tentar de novo é seguro: remover, de novo, um arquivo que já
         tenha sumido do Storage numa tentativa anterior bem-sucedida
         não é motivo de novo erro nessa etapa — a tentativa seguinte
         apenas conclui o que ainda faltava (atualizar o perfil). */
      var rm = await client.storage.from(AVATAR_BUCKET).remove([oldPath]);
      if (rm.error) throw rm.error;
      var result = await client.from('student_profiles')
        .upsert({ id: currentUser.id, avatar_path: null }, { onConflict: 'id' })
        .select('display_name,habilitacao,periodo,avatar_path').maybeSingle();
      if (result.error) throw result.error;
      currentProfile = result.data || Object.assign({}, currentProfile, { avatar_path: null });
      revokeAvatarUrl();
      applyAvatarToView();
      tell(avatarStatus, 'Foto removida.');
    } catch (err) {
      // Falha real (exceção ou "error") em qualquer uma das duas etapas.
      // Nunca informamos que a foto foi removida quando isso não foi
      // confirmado — nem alteramos nenhum estado local otimisticamente.
      tell(avatarStatus, 'Não foi possível concluir a remoção da foto agora. Tente novamente.', true);
    } finally {
      busy = false;
    }
  });

  function fillProfileForm() {
    var p = currentProfile || {};
    document.getElementById('studentProfileNameInput').value = p.display_name || '';
    document.getElementById('studentProfileHabilitacaoInput').value = p.habilitacao || '';
    document.getElementById('studentProfilePeriodoInput').value = p.periodo || '';
  }

  async function loadProfile() {
    if (!client || !currentUser) return;
    try {
      var result = await client
        .from('student_profiles')
        .select('display_name,habilitacao,periodo,avatar_path')
        .eq('id', currentUser.id)
        .maybeSingle();
      if (result.error) throw result.error;
      currentProfile = result.data || null;
    } catch (err) {
      currentProfile = null;
      // Silencioso: a área autenticada continua utilizável (comunicados,
      // sair, excluir) mesmo que o perfil opcional não possa ser lido agora.
    }
    applyProfileToView();
    await loadAvatar();
  }

  document.getElementById('studentProfileEdit').addEventListener('click', function () {
    fillProfileForm();
    profileView.hidden = true;
    profileForm.hidden = false;
    tell(profileStatus, '');
    document.getElementById('studentProfileNameInput').focus();
  });
  document.getElementById('studentProfileCancel').addEventListener('click', function () {
    profileForm.hidden = true;
    profileView.hidden = false;
    tell(profileStatus, '');
  });
  profileForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || !currentUser || busy) return;
    var name = document.getElementById('studentProfileNameInput').value.trim().slice(0, 80);
    var hab = document.getElementById('studentProfileHabilitacaoInput').value;
    var per = document.getElementById('studentProfilePeriodoInput').value.trim().slice(0, 40);
    try {
      busy = true; setDisabled(profileForm, true);
      tell(profileStatus, 'Salvando…');
      var result = await client.from('student_profiles').upsert({
        id: currentUser.id,
        display_name: name || null,
        habilitacao: hab || null,
        periodo: per || null
      }, { onConflict: 'id' }).select('display_name,habilitacao,periodo,avatar_path').maybeSingle();
      if (result.error) throw result.error;
      currentProfile = result.data || Object.assign({}, currentProfile, { display_name: name || null, habilitacao: hab || null, periodo: per || null });
      applyProfileToView();
      profileForm.hidden = true;
      profileView.hidden = false;
      tell(profileStatus, '');
      tell(document.getElementById('studentProfileStatus'), 'Perfil atualizado.');
    } catch (err) {
      tell(profileStatus, 'Não foi possível salvar o perfil agora. Tente novamente.', true);
    } finally {
      busy = false; setDisabled(profileForm, false);
    }
  });

  /* ---------------------------------------------------------------
     Sub-navegação Início / Meu Perfil / Minha Conta
     --------------------------------------------------------------- */
  var SUBTABS = [
    { tab: 'studentTabInicio', panel: 'studentPanelInicio' },
    { tab: 'studentTabPerfil', panel: 'studentPanelPerfil' },
    { tab: 'studentTabConta', panel: 'studentPanelConta' }
  ];
  function selectSubTab(index) {
    SUBTABS.forEach(function (entry, i) {
      var tabEl = document.getElementById(entry.tab);
      var panelEl = document.getElementById(entry.panel);
      var selected = i === index;
      tabEl.setAttribute('aria-selected', String(selected));
      tabEl.tabIndex = selected ? 0 : -1;
      panelEl.hidden = !selected;
    });
  }
  SUBTABS.forEach(function (entry, i) {
    var tabEl = document.getElementById(entry.tab);
    tabEl.addEventListener('click', function () { selectSubTab(i); tabEl.focus(); });
    tabEl.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % SUBTABS.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + SUBTABS.length) % SUBTABS.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = SUBTABS.length - 1;
      if (next !== null) {
        e.preventDefault();
        selectSubTab(next);
        document.getElementById(SUBTABS[next].tab).focus();
      }
    });
  });

  /* ---------------------------------------------------------------
     Sessão
     --------------------------------------------------------------- */
  async function refreshUser() {
    var sessionResult = await client.auth.getSession();
    if (!sessionResult.data || !sessionResult.data.session) { currentUser = null; show('auth'); showAccessView('Login'); dispatchAccountState(); return; }
    var result = await client.auth.getUser(); // verificação no servidor, não apenas dados de cache
    var user = result && result.data && result.data.user;
    if (result.error && !user) throw result.error;
    if (user && user.email_confirmed_at && allowed(user.email)) {
      currentUser = user;
      document.getElementById('studentAccountEmail').textContent = user.email;
      selectSubTab(0);
      renderAnnouncements();
      await loadProfile();
      show('logged');
      var heading = document.getElementById('studentLoggedTitle');
      if (heading) heading.focus();
      refreshAdminStatus(); // não bloqueia a exibição da área logada — atualiza o widget quando resolver
      refreshNotifyPreference();
    } else {
      currentUser = null;
      if (user) { await client.auth.signOut(); tell(document.getElementById('studentAccessStatus'), 'Este endereço não atende às condições de acesso.', true); }
      show('auth'); showAccessView('Login');
      dispatchAccountState();
    }
  }
  async function restoreSession() {
    try { await refreshUser(); } catch (err) { show('auth'); showAccessView('Login'); tell(document.getElementById('studentAccessStatus'), 'Não foi possível conferir a sessão. Tente novamente mais tarde.', true); dispatchAccountState(); }
  }

  /* V28: confere se a conta logada é administradora consultando
     public.admin_roles (só a própria linha — a política de RLS não
     deixa ler a lista inteira). Falha de rede aqui nunca trava o
     login nem aparece como erro visível: o pior caso é simplesmente
     não mostrar o link do Painel de Gestão até a próxima verificação. */
  async function refreshAdminStatus() {
    currentIsAdmin = false;
    if (!currentUser || !window.caefContentSource || !window.caefContentSource.admin) return;
    try { currentIsAdmin = !!(await window.caefContentSource.admin.checarIsAdmin()); }
    catch (err) { currentIsAdmin = false; }
    dispatchAccountState();
  }

  /* V28: preferência de notificação por e-mail, em Minha Conta. Sempre
     opt-in explícito — nunca é ativada pelo cadastro, e a ausência de
     linha em notification_preferences já é tratada como "desligado"
     pela própria consulta (ver js/supabase-content.js). */
  var notifyBlock = document.getElementById('studentNotifyBlock');
  var notifyToggle = document.getElementById('studentNotifyToggle');
  var notifyStatus = document.getElementById('studentNotifyStatus');

  async function refreshNotifyPreference() {
    if (!notifyBlock || !notifyToggle) return;
    if (!currentUser || !window.caefContentSource || !window.caefContentSource.notificacoes) { notifyBlock.hidden = true; return; }
    notifyBlock.hidden = false;
    tell(notifyStatus, '');
    try { notifyToggle.checked = !!(await window.caefContentSource.notificacoes.obterPreferencia()); }
    catch (err) { tell(notifyStatus, 'Não foi possível carregar sua preferência de notificação agora.', true); }
  }

  if (notifyToggle) {
    notifyToggle.addEventListener('change', async function () {
      var desejado = notifyToggle.checked;
      notifyToggle.disabled = true;
      tell(notifyStatus, 'Salvando...');
      try {
        await window.caefContentSource.notificacoes.definirPreferencia(desejado);
        tell(notifyStatus, desejado ? 'Notificações ativadas.' : 'Notificações desativadas.');
      } catch (err) {
        notifyToggle.checked = !desejado; // a preferência real não mudou — a interface não afirma o contrário
        tell(notifyStatus, 'Não foi possível salvar agora. Tente novamente.', true);
      } finally {
        notifyToggle.disabled = false;
      }
    });
  }

  /* ---------------------------------------------------------------
     Retorno de link de e-mail (confirmação de cadastro OU recuperação)
     --------------------------------------------------------------- */
  function scrubEmailTokenFromUrl() {
    var url = new URL(window.location.href);
    url.searchParams.delete('token_hash'); url.searchParams.delete('type');
    history.replaceState(null, '', url.pathname + url.search + '#area-estudante');
    if (window.caefActivateTab) window.caefActivateTab('area-estudante', { silent: true });
  }
  async function consumeEmailLink(type, hash) {
    scrubEmailTokenFromUrl();
    if (!/^(signup|recovery)$/.test(type || '')) {
      show('auth'); showAccessView('Login');
      tell(document.getElementById('studentAccessStatus'), 'Link inválido. Peça um novo link.', true);
      return;
    }
    try {
      var result = await client.auth.verifyOtp({ token_hash: hash, type: type });
      if (result.error) throw result.error;
      if (type === 'recovery') {
        show('auth'); showAccessView('Reset');
      } else {
        await refreshUser();
        tell(document.getElementById('studentAccessStatus'), 'E-mail confirmado. Seu acesso está disponível.');
      }
    } catch (err) {
      show('auth'); showAccessView('Login');
      var msg = type === 'recovery'
        ? 'O link de redefinição é inválido, expirou ou já foi usado. Solicite outro.'
        : 'O link de confirmação é inválido, expirou ou já foi usado. Cadastre-se novamente ou tente entrar.';
      tell(document.getElementById('studentAccessStatus'), msg, true);
    }
  }

  /* ---------------------------------------------------------------
     Início / carregamento do SDK
     --------------------------------------------------------------- */
  async function start() {
    var url = new URL(window.location.href);
    var hasToken = url.searchParams.has('token_hash');
    var tokenType = url.searchParams.get('type');
    var tokenHash = url.searchParams.get('token_hash');

    if (!cfg.enabled) {
      if (hasToken) { scrubEmailTokenFromUrl(); tell(setupStatus, 'O acesso ainda não está disponível neste portal.', true); }
      return;
    }
    if (!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(cfg.supabaseUrl || '') ||
        !cfg.supabasePublishableKey || cfg.allowedEmailDomain !== 'academico.ufpb.br') {
      tell(setupStatus, 'Configuração de acesso incompleta. Consulte o responsável pelo portal.', true);
      return;
    }
    show('loading');
    try {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.crossOrigin = 'anonymous';
      await new Promise(function (resolve, reject) { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
      if (!window.supabase || typeof window.supabase.createClient !== 'function') throw Error('SDK indisponível');
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
        auth: { flowType: 'pkce', detectSessionInUrl: false, autoRefreshToken: true, persistSession: true }
      });
      // V28: reaproveitado por js/supabase-content.js (Painel de Gestão e
      // preferência de notificação) — nunca um segundo client separado,
      // para as duas partes do código nunca discordarem sobre a sessão.
      window.caefStudentClient = client;
      if (hasToken) await consumeEmailLink(tokenType, tokenHash);
      else await restoreSession();
      client.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_OUT') { currentUser = null; currentProfile = null; currentIsAdmin = false; revokeAvatarUrl(); show('auth'); showAccessView('Login'); dispatchAccountState(); }
        // Não chamar getUser no callback: evita deadlock da lib de auth.
      });
    } catch (err) {
      show('setup');
      tell(setupStatus, 'O serviço de acesso não pôde ser carregado. Tente novamente mais tarde.', true);
    }
  }

  /* ---------------------------------------------------------------
     Navegação entre sub-estados de acesso
     --------------------------------------------------------------- */
  document.getElementById('studentGoSignup').addEventListener('click', function () { showAccessView('Signup', 'studentSignupEmail'); });
  document.getElementById('studentGoLoginFromSignup').addEventListener('click', function () { showAccessView('Login', 'studentLoginEmail'); });
  document.getElementById('studentGoLoginFromSignupSent').addEventListener('click', function () { showAccessView('Login', 'studentLoginEmail'); });
  document.getElementById('studentGoForgot').addEventListener('click', function () { showAccessView('Forgot', 'studentForgotEmail'); });
  document.getElementById('studentGoLoginFromForgot').addEventListener('click', function () { showAccessView('Login', 'studentLoginEmail'); });
  document.getElementById('studentGoLoginFromForgotSent').addEventListener('click', function () { showAccessView('Login', 'studentLoginEmail'); });

  /* ---------------------------------------------------------------
     Entrar (e-mail + senha)
     --------------------------------------------------------------- */
  var loginForm = document.getElementById('studentLoginForm');
  var accessStatus = document.getElementById('studentAccessStatus');
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || busy) return;
    var emailInput = document.getElementById('studentLoginEmail');
    var passwordInput = document.getElementById('studentLoginPassword');
    var email = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value;
    if (!allowed(email)) { tell(accessStatus, 'Use um endereço @academico.ufpb.br válido.', true); emailInput.focus(); return; }
    try {
      busy = true; setDisabled(loginForm, true);
      tell(accessStatus, 'Entrando…');
      var result = await client.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      passwordInput.value = '';
      await refreshUser();
    } catch (err) {
      passwordInput.value = '';
      if (err && err.code === 'email_not_confirmed') {
        tell(accessStatus, 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e o spam.', true);
      } else if (err && err.code === 'invalid_credentials') {
        tell(accessStatus, 'E-mail ou senha incorretos.', true);
      } else {
        tell(accessStatus, 'Não foi possível entrar agora. Verifique sua conexão e tente novamente.', true);
      }
    } finally {
      busy = false; setDisabled(loginForm, false);
    }
  });

  /* ---------------------------------------------------------------
     Cadastro (e-mail + senha + confirmação de senha)
     --------------------------------------------------------------- */
  var signupForm = document.getElementById('studentSignupForm');
  var signupStatus = document.getElementById('studentSignupStatus');
  signupForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || busy) return;
    var emailInput = document.getElementById('studentSignupEmail');
    var passwordInput = document.getElementById('studentSignupPassword');
    var confirmInput = document.getElementById('studentSignupPasswordConfirm');
    var email = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value;
    var confirm = confirmInput.value;
    if (!allowed(email)) { tell(signupStatus, 'Use um endereço @academico.ufpb.br válido.', true); emailInput.focus(); return; }
    if (password.length < 8) { tell(signupStatus, 'A senha deve ter pelo menos 8 caracteres.', true); passwordInput.focus(); return; }
    if (password !== confirm) { tell(signupStatus, 'As senhas não coincidem.', true); confirmInput.focus(); return; }
    try {
      busy = true; setDisabled(signupForm, true);
      tell(signupStatus, 'Enviando cadastro…');
      var redirect = window.location.origin + window.location.pathname;
      var result = await client.auth.signUp({ email: email, password: password, options: { emailRedirectTo: redirect } });
      if (result.error) throw result.error;
      passwordInput.value = ''; confirmInput.value = '';
      document.getElementById('studentSignupSentEmail').textContent = email;
      emailInput.value = '';
      tell(signupStatus, '');
      showAccessView('SignupSent');
    } catch (err) {
      if (err && err.code === 'user_already_exists') {
        /* Não confirmamos a existência prévia da conta: o comportamento
           visual é o mesmo de um cadastro bem-sucedido (mesma tela
           "Verifique seu e-mail", cujo texto já é neutro quanto a isso).
           Quem já tem conta não recebe um novo e-mail de confirmação,
           mas nada na interface revela essa diferença. */
        passwordInput.value = ''; confirmInput.value = '';
        document.getElementById('studentSignupSentEmail').textContent = email;
        emailInput.value = '';
        tell(signupStatus, '');
        showAccessView('SignupSent');
        return;
      }
      passwordInput.value = ''; confirmInput.value = '';
      if (err && err.code === 'weak_password') {
        tell(signupStatus, 'Senha muito fraca. Use pelo menos 8 caracteres, com letras e números.', true);
      } else if (err && err.message) {
        tell(signupStatus, err.message, true);
      } else {
        tell(signupStatus, 'Não foi possível concluir o cadastro agora. Tente novamente.', true);
      }
    } finally {
      busy = false; setDisabled(signupForm, false);
    }
  });

  /* ---------------------------------------------------------------
     Esqueci minha senha
     --------------------------------------------------------------- */
  var forgotForm = document.getElementById('studentForgotForm');
  var forgotStatus = document.getElementById('studentForgotStatus');
  forgotForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || busy) return;
    var emailInput = document.getElementById('studentForgotEmail');
    var email = emailInput.value.trim().toLowerCase();
    if (!allowed(email)) { tell(forgotStatus, 'Use um endereço @academico.ufpb.br válido.', true); emailInput.focus(); return; }
    try {
      busy = true; setDisabled(forgotForm, true);
      tell(forgotStatus, 'Enviando…');
      var redirect = window.location.origin + window.location.pathname;
      var result = await client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
      if (result.error) throw result.error;
      document.getElementById('studentForgotSentEmail').textContent = email;
      emailInput.value = '';
      tell(forgotStatus, '');
      showAccessView('ForgotSent');
    } catch (err) {
      tell(forgotStatus, 'Não foi possível enviar o link agora. Tente novamente mais tarde.', true);
    } finally {
      busy = false; setDisabled(forgotForm, false);
    }
  });

  /* ---------------------------------------------------------------
     Definir nova senha (após link de recuperação)
     --------------------------------------------------------------- */
  var resetForm = document.getElementById('studentResetForm');
  var resetStatus = document.getElementById('studentResetStatus');
  resetForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || busy) return;
    var passwordInput = document.getElementById('studentResetPassword');
    var confirmInput = document.getElementById('studentResetPasswordConfirm');
    var password = passwordInput.value;
    var confirm = confirmInput.value;
    if (password.length < 8) { tell(resetStatus, 'A senha deve ter pelo menos 8 caracteres.', true); passwordInput.focus(); return; }
    if (password !== confirm) { tell(resetStatus, 'As senhas não coincidem.', true); confirmInput.focus(); return; }
    try {
      busy = true; setDisabled(resetForm, true);
      tell(resetStatus, 'Salvando nova senha…');
      var result = await client.auth.updateUser({ password: password });
      if (result.error) throw result.error;
      passwordInput.value = ''; confirmInput.value = '';
      tell(resetStatus, '');
      await refreshUser();
      tell(document.getElementById('studentAccessStatus'), 'Senha redefinida.');
    } catch (err) {
      passwordInput.value = ''; confirmInput.value = '';
      tell(resetStatus, 'Não foi possível salvar a nova senha agora. Tente novamente.', true);
    } finally {
      busy = false; setDisabled(resetForm, false);
    }
  });

  /* ---------------------------------------------------------------
     Sair / excluir conta
     --------------------------------------------------------------- */
  async function doSignOut() {
    if (!client || busy) return;
    try {
      var out = await client.auth.signOut();
      if (out.error) throw out.error;
      currentUser = null; currentProfile = null; currentIsAdmin = false; revokeAvatarUrl();
      show('auth'); showAccessView('Login');
      tell(document.getElementById('studentAccessStatus'), 'Você saiu da sua conta.');
      dispatchAccountState();
    } catch (err) {
      tell(document.getElementById('studentAccountStatus'), 'Não foi possível encerrar a sessão agora.', true);
    }
  }
  document.getElementById('studentLogout').addEventListener('click', doSignOut);

  var deleteForm = document.getElementById('studentDeleteForm');
  var accountStatus = document.getElementById('studentAccountStatus');
  document.getElementById('studentDeleteOpen').addEventListener('click', function () { deleteForm.hidden = false; document.getElementById('studentDeleteConfirm').focus(); });
  document.getElementById('studentDeleteCancel').addEventListener('click', function () { deleteForm.hidden = true; document.getElementById('studentDeleteConfirm').value = ''; tell(accountStatus, ''); });
  deleteForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!client || !currentUser || busy) return;
    if (document.getElementById('studentDeleteConfirm').value.trim() !== 'EXCLUIR') { tell(accountStatus, 'Digite EXCLUIR para confirmar.', true); return; }
    busy = true; setDisabled(deleteForm, true);
    /* Passo 1: a foto (se existir) precisa sair do Storage ANTES da
       exclusão da conta — a política de Storage só autoriza o dono a
       remover, e a sessão ainda precisa estar válida para isso; depois
       que a conta é apagada, a sessão deixa de valer.
       Diferente de antes, uma falha real aqui (exceção OU campo "error"
       da resposta — checamos os dois, pelo mesmo motivo explicado no
       botão "Remover foto" de Meu Perfil) agora INTERROMPE a exclusão
       em vez de seguir em frente escondendo o problema: continuar
       apagaria a conta e poderia deixar um arquivo órfão no bucket sem
       que ninguém — nem a pessoa, nem quem audita o projeto depois —
       ficasse sabendo. A pessoa pode tentar excluir de novo: se a foto
       já tiver sido removida numa tentativa anterior mas a exclusão em
       si tiver falhado depois, remover de novo um arquivo que já não
       existe no Storage não é motivo de novo erro nesta etapa. */
    if (currentProfile && currentProfile.avatar_path) {
      try {
        var rm = await client.storage.from(AVATAR_BUCKET).remove([currentProfile.avatar_path]);
        if (rm.error) throw rm.error;
      } catch (err) {
        tell(accountStatus, 'Não foi possível remover sua foto de perfil agora, então a exclusão da conta foi interrompida. Tente novamente.', true);
        busy = false; setDisabled(deleteForm, false);
        return;
      }
    }
    // Passo 2: excluir a conta em si — só chega aqui se a foto (quando
    // existia) já tiver sido confirmadamente removida do Storage.
    try {
      // A RPC exige sessão válida e apaga somente auth.uid(), nunca um ID vindo da tela.
      // A linha de public.student_profiles é removida sozinha (ON DELETE CASCADE).
      var result = await client.rpc('delete_my_account');
      if (result.error) throw result.error;
      try { await client.auth.signOut({ scope: 'local' }); } catch (ignored) { /* conta já excluída no servidor */ }
      currentUser = null; currentProfile = null; currentIsAdmin = false; revokeAvatarUrl();
      deleteForm.hidden = true;
      show('auth'); showAccessView('Login');
      tell(document.getElementById('studentAccessStatus'), 'Sua conta foi excluída.');
      dispatchAccountState();
    } catch (err) {
      tell(accountStatus, 'Não foi possível excluir a conta agora. Tente novamente ou contate o CAEF.', true);
    } finally {
      busy = false; setDisabled(deleteForm, false);
    }
  });

  /* ---------------------------------------------------------------
     Ações expostas ao widget global de conta (js/account-widget.js):
     o widget não conhece o funcionamento interno desta área, só chama
     estas funções e escuta o evento "caef:accountstate" para saber o
     que mostrar. Disponível mesmo com enabled:false (nesse caso, só
     navega até a seção, sem forçar nenhuma view de acesso). */
  window.caefAccountActions = {
    goToProfile: function () {
      if (window.caefActivateTab) window.caefActivateTab('area-estudante');
      if (currentUser) selectSubTab(1);
    },
    goToConta: function () {
      if (window.caefActivateTab) window.caefActivateTab('area-estudante');
      if (currentUser) selectSubTab(2);
    },
    goToLogin: function () {
      if (window.caefActivateTab) window.caefActivateTab('area-estudante');
      if (!currentUser && cfg.enabled && client) { show('auth'); showAccessView('Login', 'studentLoginEmail'); }
    },
    goToSignup: function () {
      if (window.caefActivateTab) window.caefActivateTab('area-estudante');
      if (!currentUser && cfg.enabled && client) { show('auth'); showAccessView('Signup', 'studentSignupEmail'); }
    },
    signOut: function () { doSignOut(); }
  };

  start();
})();
