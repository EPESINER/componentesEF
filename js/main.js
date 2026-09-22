/* =====================================================================
   CAEF/UFPB — Portal de Educação Física — main.js
   Sem framework, sem build step. Lógica organizada por módulo (IIFE).
   Dados ficam em js/data/*.js (carregados antes deste arquivo).
   ===================================================================== */
(function(){
  "use strict";

  /* ---------------------------------------------------------------
     NAV + TABS (âncoras viram "páginas" trocando .tab-panel.active)
     --------------------------------------------------------------- */
  var tabPanels = document.querySelectorAll('.tab-panel');
  var tabIds = Array.prototype.map.call(tabPanels, function(p){ return p.id; });
  var navLinks = document.querySelectorAll('a[href^="#"]');

  function activateTab(id, opts){
    opts = opts || {};
    if (tabIds.indexOf(id) === -1) return false;
    tabPanels.forEach(function(p){ p.classList.toggle('active', p.id === id); });
    navLinks.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
    document.querySelectorAll('.ensino-explore-links a').forEach(function(a){
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.subtab-nav a').forEach(function(a){
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (!opts.silent && window.scrollTo){ window.scrollTo({top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); }
    if (!opts.noHash && history.replaceState){ history.replaceState(null, '', '#' + id); }
    document.dispatchEvent(new CustomEvent('caef:tabchange', {detail:{id:id}}));
    return true;
  }
  window.caefActivateTab = activateTab;

  /* ---------------------------------------------------------------
     MENU MOBILE — botão real (substitui o par checkbox+label antigo,
     que nunca era alcançável por teclado: o checkbox ficava fora da
     árvore de foco por display:none, e o <label> não tinha tabindex
     nem respondia a Enter/Espaço). Um único acionador, sem estado
     concorrente: o próprio botão guarda o estado em aria-expanded e
     na classe "nav-open" do cabeçalho. */
  var siteNav = document.querySelector('.site-nav');
  var navToggle = document.getElementById('navToggle');

  function isMobileMenuOpen(){
    return !!(siteNav && siteNav.classList.contains('nav-open'));
  }
  function closeMobileMenu(){
    if (!siteNav || !navToggle || !isMobileMenuOpen()) return;
    siteNav.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  }
  function openMobileMenu(){
    if (!siteNav || !navToggle) return;
    siteNav.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Fechar menu');
  }
  if (navToggle){
    /* <button> nativo: clique (mouse e toque) e Enter/Espaço via
       teclado já disparam "click" sem nenhum código extra. */
    navToggle.addEventListener('click', function(){
      if (isMobileMenuOpen()) closeMobileMenu(); else openMobileMenu();
    });
  }
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && isMobileMenuOpen()){
      closeMobileMenu();
      navToggle.focus();
    }
  });

  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var openGroup = a.closest('.nav-group');
    if (openGroup) openGroup.open = false;
    closeMobileMenu();
    if (id && tabIds.indexOf(id) !== -1){
      e.preventDefault();
      activateTab(id);
      return;
    }
    if (id){
      var target = document.getElementById(id);
      if (target && !tabIds.length){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth'});
      } else if (id === 'sobre-portal' && target){
        /* Os dois links para a Central do Estudante dentro da própria
           Home ("Conhecer o portal" no herói e o link da dica do
           guia) usam o salto nativo do navegador — a rolagem até lá
           já funciona corretamente hoje, inclusive respeitando
           "movimento reduzido" (scroll-behavior em css/style.css).
           Por isso NÃO usamos preventDefault aqui: a rolagem nativa
           continua exatamente como antes. Só faltava o foco seguir
           para o destino, como acontece no resto da navegação do
           site — é só isso que este trecho adiciona. */
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: true});
      } else if (target){
        /* Link interno para um elemento que mora DENTRO de uma aba
           (um cartão de trilha, por exemplo) — não a aba inteira.
           Casos: os 5 links "Ver a trilha completa" do resultado do
           Quiz, e os links de Atividades para cartões de Trilhas
           CCHLA. Tratamento único e genérico (não específico do
           Quiz): se o destino está dentro de um .tab-panel que não
           é a aba ativa hoje, ativa essa aba primeiro (mesmo
           mecanismo de activateTab usado em todo o site) e só então
           leva foco e rolagem até o cartão — mesma técnica já usada
           pela Busca Geral (focusDestino) e pela busca interna do
           Ensino (jumpTo): tabindex="-1" + foco sem rolar o próprio
           foco + scrollIntoView central + destaque .search-jump. */
        var hostPanel = target.closest('.tab-panel');
        if (hostPanel && tabIds.indexOf(hostPanel.id) !== -1){
          e.preventDefault();
          activateTab(hostPanel.id, {silent:true});
          setTimeout(function(){
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            target.focus({preventScroll: true});
            var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (target.scrollIntoView){
              try{ target.scrollIntoView({behavior: reduzMovimento ? 'auto' : 'smooth', block: 'center'}); }
              catch(err){ target.scrollIntoView(); }
            }
            target.classList.remove('search-jump');
            void target.offsetWidth;
            target.classList.add('search-jump');
          }, 30);
        }
      }
    }
  });

  var navGroups = document.querySelectorAll('.nav-group');
  navGroups.forEach(function(group){
    group.addEventListener('toggle', function(){
      if (group.open){ navGroups.forEach(function(o){ if (o!==group) o.open=false; }); }
    });
  });
  document.addEventListener('click', function(e){
    if (e.target.closest('.nav-group')) return;
    navGroups.forEach(function(g){ g.open = false; });
  });

  /* Teclado nos dropdowns do menu (Ensino/Pesquisa/Serviços):
     - Esc fecha o dropdown aberto e devolve o foco ao <summary> que o
       abriu (sem isso, Esc não fazia nada — comportamento nativo do
       <details>, sem tratamento próprio).
     - Sair do dropdown por Tab (ou Shift+Tab) fecha o dropdown sem
       interceptar a tecla: o navegador já decide para onde o foco vai
       a seguir, isto só fecha o que ficou para trás. Tabular ENTRE os
       itens de um mesmo dropdown aberto não o fecha. */
  navGroups.forEach(function(group){
    var summary = group.querySelector('summary');
    group.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && group.open){
        e.preventDefault();
        group.open = false;
        if (summary) summary.focus();
      }
    });
    group.addEventListener('focusout', function(e){
      if (group.open && !group.contains(e.relatedTarget)) group.open = false;
    });
  });

  (function initTab(){
    var initial = (location.hash || '').replace('#','');
    if (tabIds.indexOf(initial) === -1) initial = tabIds[0];
    activateTab(initial, {silent:true, noHash:true});
  })();

  /* ---------------------------------------------------------------
     BUSCA GLOBAL (Ensino) — igual à versão anterior do portal
     --------------------------------------------------------------- */
  var searchInput = document.getElementById('globalSearch');
  if (searchInput){
    var searchClear = document.getElementById('searchClear');
    var searchCount = document.getElementById('searchCount');
    var searchResultsEl = document.getElementById('searchResults');
    var searchable = document.querySelectorAll('[data-search]');
    var laps = document.querySelectorAll('details.lap');
    var trailCards = document.querySelectorAll('.trail-card');
    var MAX_RESULTS = 30;

    function getItemInfo(el){
      var title, context;
      if (el.tagName === 'TR'){
        var firstTd = el.querySelector('td');
        title = firstTd ? firstTd.textContent.trim() : el.textContent.trim().slice(0,70);
        var lapDetails = el.closest('details.lap');
        var section = el.closest('section[id]');
        var courseLabel = '';
        if (section && section.id === 'bacharelado') courseLabel = 'Bacharelado';
        else if (section && section.id === 'licenciatura') courseLabel = 'Licenciatura';
        else if (el.closest('table.compare')) courseLabel = 'Comparativo';
        if (lapDetails){
          var lapTitleEl = lapDetails.querySelector('.lap-title');
          var lapTitle = lapTitleEl ? lapTitleEl.textContent.trim() : '';
          context = [courseLabel, lapTitle].filter(Boolean).join(' · ');
        } else { context = courseLabel || 'Comparativo'; }
      } else if (el.tagName === 'LI'){
        var nameEl = el.querySelector('.d-name');
        title = nameEl ? nameEl.textContent.trim() : el.textContent.trim().slice(0,70);
        var card = el.closest('.trail-card');
        var h3 = card ? card.querySelector('h3') : null;
        context = h3 ? h3.textContent.trim() : 'Trilha';
      } else if (el.classList.contains('career-row')){
        var roleEl = el.querySelector('.career-role');
        title = roleEl ? roleEl.textContent.trim() : el.textContent.trim().slice(0,70);
        context = 'Perfil de carreira';
      } else if (el.classList.contains('special-item')){
        var bEl = el.querySelector('b');
        title = bEl ? bEl.textContent.trim() : el.textContent.trim().slice(0,70);
        context = 'Atividade especial';
      } else if (el.classList.contains('opt-text')){
        var sec2 = el.closest('section[id]');
        var cl2 = '';
        if (sec2 && sec2.id === 'bacharelado') cl2 = 'Bacharelado';
        else if (sec2 && sec2.id === 'licenciatura') cl2 = 'Licenciatura';
        title = 'Bloco de optativas'; context = cl2;
      } else {
        title = el.textContent.trim().slice(0,70); context = '';
      }
      return {title:title, context:context, el:el};
    }

    function jumpTo(el){
      searchInput.value = ''; runSearch();
      var panel = el.closest('.tab-panel');
      if (panel) activateTab(panel.id, {silent:true});
      var lapDetails = el.closest('details.lap');
      if (lapDetails) lapDetails.open = true;
      setTimeout(function(){
        if (el.scrollIntoView){ try{ el.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){ el.scrollIntoView(); } }
        el.classList.remove('search-jump'); void el.offsetWidth; el.classList.add('search-jump');
      }, 30);
    }

    function renderResults(matchedEls){
      searchResultsEl.innerHTML = '';
      if (!matchedEls.length){ searchResultsEl.classList.remove('show'); searchResultsEl.hidden = true; return; }
      var shown = matchedEls.slice(0, MAX_RESULTS);
      shown.forEach(function(el){
        var info = getItemInfo(el);
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'search-result-item';
        var nameSpan = document.createElement('span');
        nameSpan.className = 'search-result-name'; nameSpan.textContent = info.title;
        btn.appendChild(nameSpan);
        if (info.context){
          var ctxSpan = document.createElement('span');
          ctxSpan.className = 'search-result-context'; ctxSpan.textContent = info.context;
          btn.appendChild(ctxSpan);
        }
        btn.addEventListener('click', function(){ jumpTo(info.el); });
        searchResultsEl.appendChild(btn);
      });
      if (matchedEls.length > MAX_RESULTS){
        var more = document.createElement('div');
        more.className = 'search-results-more';
        more.textContent = '+ ' + (matchedEls.length - MAX_RESULTS) + ' resultado(s) a mais — refine sua busca';
        searchResultsEl.appendChild(more);
      }
      searchResultsEl.hidden = false; searchResultsEl.classList.add('show');
    }

    function runSearch(){
      var q = searchInput.value.trim().toLowerCase();
      var matched = [];
      searchable.forEach(function(el){
        var show = q === '' || el.textContent.toLowerCase().indexOf(q) !== -1;
        el.classList.toggle('search-hide', !show);
        if (show && q !== '') matched.push(el);
      });
      searchClear.hidden = (searchInput.value === '');
      if (q !== ''){
        laps.forEach(function(d){
          var hasVisible = d.querySelector('[data-search]:not(.search-hide)');
          d.classList.toggle('search-all-hidden', !hasVisible);
          if (hasVisible) d.open = true;
        });
        trailCards.forEach(function(c){
          var hasVisible = c.querySelector('[data-search]:not(.search-hide)');
          c.classList.toggle('search-all-hidden', !hasVisible);
        });
        searchCount.textContent = matched.length + (matched.length === 1 ? ' resultado' : ' resultados');
        renderResults(matched);
      } else {
        laps.forEach(function(d){ d.classList.remove('search-all-hidden'); });
        trailCards.forEach(function(c){ c.classList.remove('search-all-hidden'); });
        searchCount.textContent = ''; searchResultsEl.hidden = true; searchResultsEl.classList.remove('show');
      }
    }
    searchInput.addEventListener('input', runSearch);
    if (searchClear) searchClear.addEventListener('click', function(){ searchInput.value=''; runSearch(); searchInput.focus(); });
  }

  /* ---------------------------------------------------------------
     COMPARADOR NÍVEL A NÍVEL (Ensino)
     --------------------------------------------------------------- */
  var LEVELS = {"bach":{"1":{"total":"375h","items":[["Bioquímica Aplicada à Educação Física","60h"],["Crescimento e Desenvolvimento","60h"],["Produção e Veiculação do Conhecimento em EF","60h"],["Fundamentos Didático-Pedagógicos do Esporte","60h"],["Anatomia Aplicada à Educação Física","75h"],["Fisiologia Humana I","60h"]]},"2":{"total":"405h","items":[["Atletismo","60h"],["Fundamentos Epistemológicos da EF","45h"],["Fisiologia da Atividade Física (Bach)","60h"],["Ginástica Artística","60h"],["Fundamentos Históricos e Filosóficos da EF e do Esporte","45h"],["Futebol","60h"],["Nutrição e Atividade Física","45h"]]},"3":{"total":"435h","items":[["Dança","60h"],["Natação","60h"],["Pesquisa Aplicada à Educação Física","60h"],["Atividades Físicas em Academia I","60h"],["Cinesiologia e Biomecânica Aplicada à EF","60h"],["Handebol","60h"],["Primeiros Socorros","30h"]]},"4":{"total":"420h","items":[["Atividade Física e Saúde","45h"],["Futsal","60h"],["Treinamento Desportivo I","60h"],["Medidas e Avaliação em EF I","60h"],["Voleibol","60h"],["Lazer e Sociedade","45h"],["Análise e Interpretação de Dados em EF","45h"]]},"5":{"total":"540h","items":[["Treinamento Desportivo II","45h"],["Judô","60h"],["Atividade Física e Terceira Idade","45h"],["Atividades Físicas para Grupos Especiais","60h"],["Aprendizagem e Controle Motor","60h"],["Estágio Profissional Supervisionado em Esportes I","105h"]]},"6":{"total":"540h","items":[["Sociologia do Desporto","45h"],["Ginástica Rítmica","60h"],["Ética Profissional na EF","45h"],["Basquetebol","60h"],["Prescrição de Exercícios Físicos","60h"],["Desporto Adaptado","60h"],["Administração e Marketing em EF","45h"],["Estágio Profissional Supervisionado em Esportes II","105h"]]},"7":{"total":"585h","items":[["Seminário de Monografia I — TCC I","60h"],["Psicologia do Esporte","45h"],["Organização e Gestão Desportiva","45h"],["Musculação","45h"],["Estágio Prof. Superv. em Atividade Física, Lazer e Saúde","195h"]]},"8":{"total":"60h","items":[["Seminário de Monografia II — TCC II","30h"]]}},"lic":{"1":{"total":"375h","items":[["Fundamentos Psicológicos da Educação","60h"],["Fundamentos Antropofilosóficos da Educação","60h"],["Crescimento e Desenvolvimento","60h"],["Produção e Veiculação do Conhecimento em EF","60h"],["Anatomia Aplicada à EF","75h"],["Libras","60h"]]},"2":{"total":"465h","items":[["Atletismo","60h"],["Fundamentos Epistemológicos da EF","45h"],["Ginástica Artística","60h"],["Futebol","60h"],["Dança","60h"],["Educação Física e Saúde","30h"],["Fisiologia Humana I","60h"],["Nutrição e Atividade Física","45h"]]},"3":{"total":"495h","items":[["Didática","60h"],["Fundamentos Históricos e Filosóficos da EF e do Esporte","45h"],["Educação Física Infantil","60h"],["Fisiologia da Atividade Física (Lic)","60h"],["Natação","60h"],["Ginástica Rítmica","60h"],["Primeiros Socorros","30h"]]},"4":{"total":"525h","items":[["Pesquisa Aplicada à EF","60h"],["Cinesiologia e Biomecânica Aplicada à EF","60h"],["Handebol","60h"],["Voleibol","60h"],["Aprendizagem e Controle Motor","60h"],["Ética Profissional na EF","45h"],["Didática Aplicada à EF","45h"]]},"5":{"total":"585h","items":[["Fundamentos Sócio-Históricos da Educação","60h"],["Psicologia da Aprendizagem","60h"],["Futsal","60h"],["Medidas e Avaliação em EF I","60h"],["Análise e Interpretação de Dados em EF","45h"],["Judô","60h"],["Estágio Profissional Supervisionado I","150h"]]},"6":{"total":"525h","items":[["Treinamento Desportivo I","60h"],["Basquetebol","60h"],["Manifestações Culturais","45h"],["Pedagogia do Lazer","45h"],["Estágio Profissional Supervisionado II","150h"]]},"7":{"total":"360h","items":[["Política e Gestão da Educação","60h"],["Organização de Eventos e Competições Escolares","30h"],["Educação Física Especial","45h"],["Seminário de Monografia I — TCC I","60h"],["Estágio Profissional Supervisionado III","105h"]]},"8":{"total":"120h","items":[["Seminário de Monografia II — TCC II","30h"]]}}};

  var levelBachEl = document.getElementById('levelBach');
  if (levelBachEl){
    var levelLicEl = document.getElementById('levelLic');
    var levelBachTotal = document.getElementById('levelBachTotal');
    var levelLicTotal = document.getElementById('levelLicTotal');
    var pills = document.querySelectorAll('.level-pill');
    var levelStatus = document.getElementById('levelCompareStatus');
    function renderLevel(n){
      var b = LEVELS.bach[n], l = LEVELS.lic[n];
      levelBachEl.innerHTML = b.items.map(function(it){ return '<li>'+it[0]+'<span>'+it[1]+'</span></li>'; }).join('');
      levelLicEl.innerHTML = l.items.map(function(it){ return '<li>'+it[0]+'<span>'+it[1]+'</span></li>'; }).join('');
      levelBachTotal.textContent = b.total; levelLicTotal.textContent = l.total;
    }
    pills.forEach(function(p){
      p.addEventListener('click', function(){
        pills.forEach(function(x){ x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        p.classList.add('active'); p.setAttribute('aria-pressed', 'true');
        renderLevel(p.dataset.level);
        /* Único anúncio curto por seleção — mesmo espírito do
           aria-live do Quiz (#quizStepText): não lê a lista inteira
           de disciplinas de novo, só confirma que a comparação foi
           atualizada e para qual período. */
        if (levelStatus) levelStatus.textContent = 'Comparativo atualizado: ' + p.textContent.trim() + ' período — Bacharelado e Licenciatura.';
      });
    });
    if (pills.length) renderLevel('1');
  }

  /* ---------------------------------------------------------------
     QUIZ "Qual trilha combina com você?"
     --------------------------------------------------------------- */
  var QUIZ = {
    rendimento:{title:'Preparador físico / esporte de rendimento',desc:'Seu caminho passa pelo Bacharelado, com forte apoio da trilha de Clínica e Reabilitação e de Sociologia/Antropologia do esporte para embasar seu trabalho com atletas.',tags:['Fisioterapia Desportiva','Cinesiologia','Biomecânica','Traumatologia','Ortopedia'],anchor:'#trilha-clinica-reabilitacao'},
    clinica:{title:'Personal trainer / academia clínica',desc:'Bacharelado com ênfase em fisiologia aplicada e nutrição esportiva — a base para atuar com populações clínicas em academias e estúdios.',tags:['Fisiologia do Exercício','Farmacologia Básica','Nutrição e Atividade Física','Avaliação Nutricional'],anchor:'#trilha-nutricao-esportiva'},
    escola:{title:'EF escolar / inclusiva (Licenciatura)',desc:'A Licenciatura é o caminho natural, reforçada pelas trilhas de humanidades do CCHLA — psicologia da aprendizagem, Libras e inclusão.',tags:['Psicologia Educacional','Libras I–VI','Didática da Libras','Currículo e Trabalho Pedagógico'],anchor:'#trilha-inclusao-libras'},
    comunidade:{title:'Educação Física social / projetos comunitários',desc:'Bacharelado ou Licenciatura funcionam — o essencial é reforçar com Serviço Social e Sociologia, voltado à atuação em comunidades e políticas sociais.',tags:['Trabalho com Comunidade I e II','Terceiro Setor','Sociologia da Juventude','Direitos Humanos e Cidadania'],anchor:'#trilha-servico-social'},
    pesquisa:{title:'Pesquisa acadêmica / pós-graduação',desc:'Qualquer um dos dois cursos serve de base — o essencial é reforçar metodologia científica e ciências humanas que dão profundidade teórica à pesquisa em Educação Física.',tags:['Bioestatística','Epidemiologia','Antropologia Cultural e da Saúde','Sociologia da Juventude/Trabalho'],anchor:'#trilha-sociologia-antropologia'}
  };
  var quizOpts = document.querySelectorAll('.quiz-opt');
  if (quizOpts.length){
    var quizResult = document.getElementById('quizResult');
    var quizTitle = document.getElementById('quizResultTitle');
    var quizDesc = document.getElementById('quizResultDesc');
    var quizTags = document.getElementById('quizResultTags');
    var quizLink = document.getElementById('quizResultLink');
    quizOpts.forEach(function(btn){
      btn.addEventListener('click', function(){
        quizOpts.forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
        var stepText = document.getElementById('quizStepText');
        var stepFill = document.getElementById('quizStepFill');
        if (stepText) stepText.textContent = 'Sua sugestão está pronta';
        if (stepFill) stepFill.style.width = '100%';
        var data = QUIZ[btn.dataset.key];
        quizTitle.textContent = data.title; quizDesc.textContent = data.desc;
        quizTags.innerHTML = data.tags.map(function(t){ return '<span>'+t+'</span>'; }).join('');
        quizLink.href = data.anchor; quizResult.hidden = false;
        if (quizResult.scrollIntoView){ try{ quizResult.scrollIntoView({behavior:'smooth', block:'nearest'}); }catch(e){} }
      });
    });
    quizOpts.forEach(function(btn){btn.setAttribute('aria-pressed', 'false');});
    var quizReset = document.getElementById('quizReset');
    if (quizReset) quizReset.addEventListener('click', function(){
      quizOpts.forEach(function(btn){btn.classList.remove('active');btn.setAttribute('aria-pressed','false');});
      quizResult.hidden = true;
      var stepText = document.getElementById('quizStepText');
      var stepFill = document.getElementById('quizStepFill');
      if (stepText) stepText.textContent = 'Escolha uma área para ver sua sugestão';
      if (stepFill) stepFill.style.width = '0%';
      var options = document.getElementById('quizOptions');
      if (options) options.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
      if (quizOpts[0]) quizOpts[0].focus({preventScroll:true});
    });
  }

  /* ---------------------------------------------------------------
     RADAR CAEF — motor de busca/filtro de oportunidades
     --------------------------------------------------------------- */
  var radarGrid = document.getElementById('radarGrid');
  /* V28 — segurança: todo texto vindo dos dados do Radar passa por aqui
     antes de entrar em innerHTML (antes: interpolação direta, sem
     tratamento — risco real de XSS assim que o conteúdo passasse a ser
     editável pelo Painel de Gestão). Aplicado sempre, tanto com os dados
     estáticos quanto com o Supabase — os dados estáticos já eram
     confiáveis (só um desenvolvedor editava o arquivo), mas a mesma
     função protege os dois casos sem precisar de dois caminhos de
     código diferentes. */
  function escapeRadarHtml(str){
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  /* Só aceita URLs http/https explícitas — nunca "javascript:", "data:"
     ou qualquer outro esquema, e nunca um valor vazio tratado como link
     válido. */
  function validarLinkRadar(url){
    if (!url) return '';
    var s = String(url).trim();
    return /^https?:\/\//i.test(s) ? s : '';
  }
  function showRadarIndisponivel(){
    if (!radarGrid) return;
    radarGrid.innerHTML = '<div class="opp-empty"><h4>Radar CAEF indisponível no momento</h4><p>Não foi possível carregar as oportunidades agora. Isso não significa que não existam vagas — tente novamente em instantes.</p></div>';
    var radarCountEl = document.getElementById('radarCount');
    if (radarCountEl) radarCountEl.textContent = 'Indisponível no momento';
    var mobileCountEl = document.getElementById('radarMobileCount');
    if (mobileCountEl) mobileCountEl.textContent = 'Indisponível';
    window.caefOportunidadesAutorizadas = [];
    window.caefOpenOportunidade = function(){};
    /* V28 — distingue "falha ao carregar" de "carregado e vazio de
       verdade" para quem consome window.caefOportunidadesAutorizadas
       fora deste arquivo (ex.: Busca Geral). caefRadarCarregado marca
       que uma tentativa terminou (sucesso ou falha); caefRadarIndisponivel
       diferencia qual dos dois casos foi. */
    window.caefRadarCarregado = true;
    window.caefRadarIndisponivel = true;
    window.dispatchEvent(new CustomEvent('caef:conteudo-atualizado', {detail:{tipo:'radar'}}));
  }
  function initRadar(ALL){
    if (!radarGrid) return;
    var radarSearch = document.getElementById('radarSearch');
    var radarCount = document.getElementById('radarCount');
    var filterTypeWrap = document.getElementById('filterType');
    var filterShiftWrap = document.getElementById('filterShift');
    var filterAvailWrap = document.getElementById('filterAvail');
    var filterAreaWrap = document.getElementById('filterArea');
    var resetBtn = document.getElementById('filterResetBtn');
    var activeWrap = document.getElementById('radarActive');
    var clearAllBtn = document.getElementById('radarClearAll');
    var mobileToggle = document.getElementById('radarMobileToggle');
    var mobileClose = document.getElementById('radarMobileClose');
    var mobileApply = document.getElementById('radarMobileApply');
    var mobileFilters = document.getElementById('radarFilters');
    var mobileBadge = document.getElementById('radarMobileBadge');
    var mobileCount = document.getElementById('radarMobileCount');
    function setMobileFilters(open){
      mobileFilters.classList.toggle('mobile-open',open);
      mobileToggle.setAttribute('aria-expanded',String(open));
      if(open){mobileClose.focus();}else{mobileToggle.focus();}
    }
    mobileToggle.addEventListener('click',function(){setMobileFilters(!mobileFilters.classList.contains('mobile-open'));});
    mobileClose.addEventListener('click',function(){setMobileFilters(false);});
    mobileApply.addEventListener('click',function(){setMobileFilters(false);});
    mobileFilters.addEventListener('keydown',function(e){if(e.key==='Escape'&&mobileFilters.classList.contains('mobile-open')){setMobileFilters(false);}});


    var TYPE_LABEL = {extensao:'Extensão', pesquisa:'Pesquisa/Laboratório', monitoria:'Monitoria', evento:'Evento'};
    var AVAIL_LABEL = {vagas:'Com vagas', consultar:'Consultar disponibilidade', encerrado:'Seleção encerrada / em planejamento'};

    function uniqueSorted(arr){ return Array.from(new Set(arr)).sort(function(a,b){return a.localeCompare(b,'pt-BR');}); }

    function buildFilterGroup(container, values, labelFn){
      container.innerHTML = '';
      values.forEach(function(v){
        var count = ALL.filter(function(o){ return container.dataset.field === 'type' ? o.type === v : (container.dataset.field === 'avail' ? o.status.availability === v : (container.dataset.field === 'shift' ? (o.shifts||[]).indexOf(v)!==-1 : o.area === v)); }).length;
        var label = document.createElement('label');
        label.className = 'filter-opt';
        // V28 — segurança: "área" e "turno" vêm dos dados (agora
        // potencialmente editáveis pelo Painel de Gestão), então precisam
        // do mesmo tratamento contra XSS já aplicado ao resto do Radar.
        // "value" do checkbox usa o texto de fato (não HTML), então o
        // valor real do filtro continua intacto — só a exibição é escapada.
        label.innerHTML = '<input type="checkbox" value="'+escapeRadarHtml(v)+'"><span>'+escapeRadarHtml(labelFn(v))+'</span><span class="fc">'+count+'</span>';
        container.appendChild(label);
      });
    }

    buildFilterGroup(filterTypeWrap, uniqueSorted(ALL.map(function(o){return o.type;})), function(v){ return TYPE_LABEL[v] || v; });
    buildFilterGroup(filterShiftWrap, uniqueSorted([].concat.apply([], ALL.map(function(o){return o.shifts||[];}))), function(v){ return v; });
    buildFilterGroup(filterAvailWrap, uniqueSorted(ALL.map(function(o){return o.status.availability;})), function(v){ return AVAIL_LABEL[v] || v; });
    buildFilterGroup(filterAreaWrap, uniqueSorted(ALL.map(function(o){return o.area;}).filter(Boolean)), function(v){ return v; });

    function getChecked(container){
      return Array.prototype.map.call(container.querySelectorAll('input:checked'), function(i){ return i.value; });
    }

    function matchesFilters(o){
      var types = getChecked(filterTypeWrap);
      var shifts = getChecked(filterShiftWrap);
      var avails = getChecked(filterAvailWrap);
      var areas = getChecked(filterAreaWrap);
      if (types.length && types.indexOf(o.type) === -1) return false;
      if (shifts.length && !(o.shifts||[]).some(function(s){return shifts.indexOf(s)!==-1;})) return false;
      if (avails.length && avails.indexOf(o.status.availability) === -1) return false;
      if (areas.length && areas.indexOf(o.area) === -1) return false;
      var q = (radarSearch.value||'').trim().toLowerCase();
      if (q){
        var hay = [o.title,o.area,o.coordinator,o.description,o.labName].filter(Boolean).join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }

    function statusDotClass(a){ return a === 'vagas' ? 'vagas' : (a === 'consultar' ? 'consultar' : 'encerrado'); }
    function statusText(a, note){
      if (note) return note;
      if (a === 'vagas') return 'Com vagas';
      if (a === 'consultar') return 'Consultar disponibilidade';
      return 'Seleção encerrada';
    }

    function cardHTML(o){
      var typeClass = o.type;
      var meta = [];
      if (o.shifts && o.shifts.length) meta.push(o.shifts.join('/'));
      if (o.workload) meta.push(o.workload);
      if (o.dedication) meta.push(o.dedication);
      return ''+
        '<button class="opp-card" type="button" data-id="'+escapeRadarHtml(o.id)+'">'+
          '<div class="opp-top">'+
            '<span class="opp-type '+escapeRadarHtml(typeClass)+'">'+escapeRadarHtml(TYPE_LABEL[o.type]||o.type)+'</span>'+
            '<span class="opp-status '+statusDotClass(o.status.availability)+'"><i class="dot"></i>'+escapeRadarHtml(statusText(o.status.availability,o.status.note))+'</span>'+
          '</div>'+
          '<h3>'+escapeRadarHtml(o.shortTitle||o.title)+'</h3>'+
          '<div class="opp-area">'+escapeRadarHtml(o.area||'')+(o.coordinator?' · '+escapeRadarHtml(o.coordinator):'')+'</div>'+
          (meta.length ? '<div class="opp-meta">'+meta.map(function(m){return '<span>'+escapeRadarHtml(m)+'</span>';}).join('')+'</div>' : '')+
          '<div class="opp-cta">Ver oportunidade →</div>'+
        '</button>';
    }

    function clearFilters(){
      document.querySelectorAll('.radar-filters input[type=checkbox]').forEach(function(i){ i.checked = false; });
      radarSearch.value = '';
      render();
      radarSearch.focus();
    }
    function renderActiveFilters(){
      activeWrap.replaceChildren();
      var selected = Array.prototype.slice.call(document.querySelectorAll('.radar-filters input:checked'));
      var query = radarSearch.value.trim();
      var hasActive = selected.length > 0 || !!query;
      clearAllBtn.hidden = !hasActive;
      if (query){
        var searchChip = document.createElement('button');
        searchChip.type = 'button'; searchChip.className = 'radar-active-chip';
        searchChip.textContent = 'Busca: '+query+' ×';
        searchChip.setAttribute('aria-label','Remover busca: '+query);
        searchChip.addEventListener('click',function(){ radarSearch.value=''; render(); radarSearch.focus(); });
        activeWrap.appendChild(searchChip);
      }
      selected.forEach(function(input){
        var chip = document.createElement('button');
        chip.type='button'; chip.className='radar-active-chip';
        var name = input.parentElement.querySelector('span');
        var label = name ? name.textContent : input.value;
        chip.textContent = label+' ×';
        chip.setAttribute('aria-label','Remover filtro: '+label);
        chip.addEventListener('click',function(){input.checked=false;render();});
        activeWrap.appendChild(chip);
      });
    }
    function render(){
      renderActiveFilters();
      var filtered = ALL.filter(matchesFilters);
      radarCount.textContent = filtered.length + (filtered.length===1?' oportunidade encontrada':' oportunidades encontradas');
      mobileCount.textContent = filtered.length + (filtered.length===1?' oportunidade':' oportunidades');
      var selectedCount = document.querySelectorAll('.radar-filters input:checked').length;
      mobileBadge.hidden = !selectedCount;
      mobileBadge.textContent = String(selectedCount);
      if (!filtered.length){
        radarGrid.innerHTML = '<div class="opp-empty"><h4>Nenhuma oportunidade encontrada</h4><p>Tente remover alguns filtros ou buscar por outro termo.</p><button type="button" class="radar-empty-reset">Limpar busca e filtros</button></div>';
        radarGrid.querySelector('.radar-empty-reset').addEventListener('click',clearFilters);
        return;
      }
      radarGrid.innerHTML = filtered.map(cardHTML).join('');
      radarGrid.querySelectorAll('.opp-card').forEach(function(btn){
        btn.addEventListener('click', function(){ openDetail(btn.dataset.id); });
      });
    }

    [filterTypeWrap, filterShiftWrap, filterAvailWrap, filterAreaWrap].forEach(function(c){
      c.addEventListener('change', render);
    });
    radarSearch.addEventListener('input', render);
    if (resetBtn) resetBtn.addEventListener('click',clearFilters);
    clearAllBtn.addEventListener('click',clearFilters);

    /* ---- detail drawer ---- */
    var overlay = document.getElementById('detailOverlay');
    var panel = document.getElementById('detailPanel');
    var detailBody = document.getElementById('detailBody');
    var detailCloseBtn = document.getElementById('detailClose');
    var lastFocused = null;

    function field(label, valueHtml){
      // valueHtml já vem pronto para inserção (texto simples escapado
      // pelo chamador, ou um pequeno HTML de confiança montado por esta
      // mesma função — nunca texto bruto do banco sem passar por
      // escapeRadarHtml antes de chegar aqui).
      if (!valueHtml) return '';
      return '<div class="detail-field"><dt>'+escapeRadarHtml(label)+'</dt><dd>'+valueHtml+'</dd></div>';
    }

    /* Mesma técnica já usada nos painéis da Busca Geral e da Gestão
       para conter o Tab dentro do diálogo aberto: lista os controles
       focáveis do painel a cada tecla, sempre recalculada (o conteúdo
       do painel muda a cada oportunidade aberta). */
    function getFocusable(){
      return Array.prototype.filter.call(
        panel.querySelectorAll('a,button,input,[tabindex]:not([tabindex="-1"])'),
        function(el){ return !el.hidden && el.offsetParent !== null; }
      );
    }

    /* Um elemento só é um destino de foco válido para devolver o foco
       ao fechar se ainda estiver de verdade na página e visível — o
       clique pode ter vindo de um cartão que a listagem já substituiu
       (filtro mudou enquanto o painel estava aberto) ou de um momento
       em que o foco real já não estava em lugar nenhum específico
       (ex.: logo depois que a Busca Geral fecha o próprio painel,
       antes de abrir este). Nesses casos não presumimos que o cartão
       de oportunidade ainda é o "acionador real". */
    function isValidReturnTarget(el){
      return !!(el && typeof el.focus === 'function' && document.body.contains(el) && el.offsetParent !== null);
    }

    function openDetail(id){
      var o = ALL.filter(function(x){return x.id===id;})[0];
      if (!o) return;
      var linkSelecaoValido = validarLinkRadar(o.selectionLink);
      var selecaoHtml = escapeRadarHtml(o.selection||'') + (linkSelecaoValido ? ' — <a href="'+escapeRadarHtml(linkSelecaoValido)+'" target="_blank" rel="noopener">acessar formulário</a>' : '');
      var html = '<h2>'+escapeRadarHtml(o.title)+'</h2>'+
        '<div class="opp-top" style="margin-bottom:16px;">'+
          '<span class="opp-type '+escapeRadarHtml(o.type)+'">'+escapeRadarHtml(TYPE_LABEL[o.type]||o.type)+'</span>'+
          '<span class="opp-status '+statusDotClass(o.status.availability)+'"><i class="dot"></i>'+escapeRadarHtml(statusText(o.status.availability,o.status.note))+'</span>'+
        '</div>'+
        field('Área', escapeRadarHtml(o.area)) +
        field('Laboratório / grupo', escapeRadarHtml(o.labName)) +
        field('Coordenação', escapeRadarHtml(o.coordinator)) +
        field('Contato', escapeRadarHtml(o.contact)) +
        field('Descrição', escapeRadarHtml(o.description)) +
        field('Público', escapeRadarHtml(o.audience)) +
        field('Modalidade de participação', escapeRadarHtml(o.participationType)) +
        field('Modalidades de ingresso', o.modalities ? escapeRadarHtml(o.modalities.join(', ')) : '') +
        field('Carga horária', escapeRadarHtml(o.workload)) +
        field('Dedicação semanal', escapeRadarHtml(o.dedication)) +
        field('Turno', escapeRadarHtml((o.shifts||[]).join(', '))) +
        field('Nível', o.level ? escapeRadarHtml(o.level.join(', ')) : '') +
        field('Pré-requisitos', escapeRadarHtml(o.requirements)) +
        field('Processo seletivo', o.selection ? selecaoHtml : '') +
        field('Duração prevista', escapeRadarHtml(o.duration)) +
        field('Vínculo com pós-graduação', o.postgrad === true ? 'Sim' : (o.postgrad === false ? 'Não' : '')) +
        '<p class="detail-updated">Atualizado em: '+escapeRadarHtml(o.lastUpdated||'não informado')+'. Informação organizada pelo CAEF a partir de mapeamento direto com o(a) coordenador(a). Confirme os detalhes finais com o responsável.</p>'+
        '<button type="button" class="detail-share" id="detailShare">Compartilhar oportunidade ↗</button><p class="detail-share-feedback" id="detailShareFeedback" role="status" aria-live="polite"></p>';
      detailBody.innerHTML = html;
      document.getElementById('detailShare').addEventListener('click',function(){
        var url = new URL(window.location.href);
        url.searchParams.set('oportunidade',o.id);
        url.hash = 'radar';
        var shareUrl = url.toString();
        var feedback = document.getElementById('detailShareFeedback');
        if (navigator.share){
          navigator.share({title:o.title,url:shareUrl}).catch(function(err){if(err.name!=='AbortError')feedback.textContent='Não foi possível compartilhar. Copie o endereço da página.';});
        } else if(navigator.clipboard && window.isSecureContext){
          navigator.clipboard.writeText(shareUrl).then(function(){feedback.textContent='Link copiado!';},function(){feedback.textContent='Não foi possível copiar. Use a barra de endereço do navegador.';});
        } else {
          var link = document.createElement('input'); link.value=shareUrl;link.readOnly=true;
          feedback.replaceChildren(link);link.select();
          feedback.insertAdjacentText('afterbegin','Copie este endereço: ');
        }
      });
      lastFocused = document.activeElement;
      panel.inert = false;
      overlay.classList.add('open'); panel.classList.add('open');
      document.body.style.overflow = 'hidden';
      /* Foco inicial dentro do diálogo ao abrir (mesmo padrão do
         painel da Gestão): sem isso, quem abre por teclado ou usa
         leitor de tela não tinha nenhum sinal de que um diálogo modal
         apareceu, e ainda precisaria tabular por conta própria até
         alcançá-lo. O atraso deixa o painel sair do estado inert antes
         de tentar focar algo dentro dele. */
      setTimeout(function(){ if (panel.classList.contains('open')) detailCloseBtn.focus(); }, 10);
    }
    function closeDetail(){
      if (!panel.classList.contains('open')) return;
      overlay.classList.remove('open'); panel.classList.remove('open');
      document.body.style.overflow = '';
      /* Devolve o foco ao elemento que abriu o detalhe, quando ele
         ainda existe e está acessível (o caso comum: o cartão da
         oportunidade clicado ou focado por teclado). Quando não é o
         caso — por exemplo, o detalhe foi aberto a partir de um
         resultado da Busca Geral, cujo painel já fechou e ficou inert
         antes deste abrir — não tenta focar nada dentro do painel de
         busca fechado; em vez disso vai para um destino visível e
         lógico: a própria seção do Radar, que já está em exibição. */
      var destino = isValidReturnTarget(lastFocused) ? lastFocused : null;
      lastFocused = null;
      if (destino){
        destino.focus();
      } else {
        var secaoRadar = document.getElementById('radar');
        if (secaoRadar){
          if (!secaoRadar.hasAttribute('tabindex')) secaoRadar.setAttribute('tabindex', '-1');
          secaoRadar.focus({ preventScroll: true });
        }
      }
      /* Mesma correção já aplicada aos painéis da Busca Geral e da
         Gestão nesta etapa: sem isso, o botão de fechar e os demais
         controles deste painel continuavam alcançáveis por Tab mesmo
         com o painel fora da tela (fechado só visualmente, por
         transform), travando a navegação por teclado nesse ponto. */
      if (panel.contains(document.activeElement) && document.activeElement.blur) document.activeElement.blur();
      panel.inert = true;
    }
    overlay.addEventListener('click', closeDetail);
    detailCloseBtn.addEventListener('click', closeDetail);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeDetail(); });

    /* Contenção de foco dentro do diálogo aberto (role="dialog"
       aria-modal="true"): Tab no último controle volta ao primeiro,
       Shift+Tab no primeiro vai para o último — o teclado nunca
       alcança o conteúdo de fundo enquanto o painel está aberto.
       Mesmo padrão já usado nos painéis da Busca Geral e da Gestão. */
    panel.addEventListener('keydown', function(e){
      if (!panel.classList.contains('open')) return;
      if (e.key !== 'Tab') return;
      var focusable = getFocusable();
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });

    render();
    var linkedId = new URLSearchParams(window.location.search).get('oportunidade');
    if (linkedId && ALL.some(function(o){return o.id===linkedId;})){
      /* Ativa a aba do Radar de verdade (não só o hash da URL), senão
         quem abre um link compartilhado vê o painel de detalhe sobre
         a página Início em vez de sobre os resultados do Radar. */
      activateTab('radar', {silent:true});
      openDetail(linkedId);
    }

    /* Exposição controlada para a Busca Geral (Etapa 4 — Fase 2): expõe
       só a lista já autorizada (ALL, nunca o array bruto OPORTUNIDADES)
       e uma função de abertura que ativa a aba do Radar e abre o
       mesmo painel de detalhe usado pelos cartões do Radar — a busca
       nunca reimplementa o filtro de autorização nem monta o painel
       por conta própria. */
    window.caefOportunidadesAutorizadas = ALL;
    window.caefOpenOportunidade = function(id){
      /* Lê ALL no momento da chamada (closure), não no momento em que
         esta função foi criada — então continua funcionando mesmo
         depois de uma atualização de dados via atualizarDadosRadar. */
      if (!ALL.some(function(o){ return o.id === id; })) return;
      activateTab('radar', {silent:true});
      openDetail(id);
    };
    window.caefRadarCarregado = true;
    window.caefRadarIndisponivel = false;

    /* V28 — item 1: permite atualizar os dados do Radar (nova
       publicação, edição, arquivamento ou exclusão feita no Painel de
       Gestão) sem recarregar a página e SEM reanexar os listeners de
       filtro/busca já registrados acima (o que causaria duplicação a
       cada atualização). Reatribui a mesma variável ALL que todas as
       funções deste bloco já leem por closure (buildFilterGroup,
       matchesFilters, render, openDetail, window.caefOpenOportunidade
       acima) — então todas passam a enxergar os dados novos
       automaticamente, sem precisar recriar nada. */
    function atualizarDadosRadar(novoALL){
      ALL = novoALL;
      buildFilterGroup(filterTypeWrap, uniqueSorted(ALL.map(function(o){return o.type;})), function(v){ return TYPE_LABEL[v] || v; });
      buildFilterGroup(filterShiftWrap, uniqueSorted([].concat.apply([], ALL.map(function(o){return o.shifts||[];}))), function(v){ return v; });
      buildFilterGroup(filterAvailWrap, uniqueSorted(ALL.map(function(o){return o.status.availability;})), function(v){ return AVAIL_LABEL[v] || v; });
      buildFilterGroup(filterAreaWrap, uniqueSorted(ALL.map(function(o){return o.area;}).filter(Boolean)), function(v){ return v; });
      render();
      window.caefOportunidadesAutorizadas = ALL;
      window.caefRadarCarregado = true;
      window.caefRadarIndisponivel = false;
      window.dispatchEvent(new CustomEvent('caef:conteudo-atualizado', {detail:{tipo:'radar'}}));
    }
    radarAtualizarDados = atualizarDadosRadar;
    window.dispatchEvent(new CustomEvent('caef:conteudo-atualizado', {detail:{tipo:'radar'}}));
  }

  /* V28 — escolhe a fonte de dados do Radar: Supabase (quando a flag de
     conteúdo está ligada) ou o arquivo estático js/data/oportunidades.js
     (comportamento idêntico à V27). Nunca as duas ao mesmo tempo, nunca
     conteúdo duplicado — e se a fonte Supabase falhar, mostra um estado
     de indisponibilidade claro, nunca dados antigos como se fossem
     atuais. */
  /* V28 — item 1: radarInicializado/radarAtualizarDados permitem que
     bootstrapRadar() seja chamado de novo (ver window.caefRefreshRadar,
     usado pelo Painel de Gestão após publicar/editar/arquivar/excluir)
     sem reexecutar todo o initRadar — que reanexaria os listeners de
     filtro e busca a cada chamada. Na primeira vez, roda o setup
     completo; nas seguintes, só atualiza os dados exibidos. */
  var radarInicializado = false;
  var radarAtualizarDados = null;
  function bootstrapRadar(){
    if (!radarGrid) return;
    function aplicarSucesso(items){
      if (radarInicializado && radarAtualizarDados){
        radarAtualizarDados(items);
      } else {
        initRadar(items);
        radarInicializado = true;
      }
    }
    function aplicarFalha(){
      if (radarInicializado){
        /* Falha numa ATUALIZAÇÃO (já havia dados carregados com
           sucesso antes): uma falha passageira não apaga o que já
           estava funcionando na tela — só registra o problema. */
        console.warn('[Radar CAEF] Falha ao atualizar o Radar — mantendo os dados já carregados.');
        return;
      }
      showRadarIndisponivel();
    }
    if (window.CAEF_CONTENT_CONFIG && window.CAEF_CONTENT_CONFIG.useSupabaseContent && window.caefContentSource){
      window.caefContentSource.getRadarAutorizados().then(aplicarSucesso)['catch'](aplicarFalha);
    } else if (typeof OPORTUNIDADES !== 'undefined'){
      /* Segurança informacional: só publica no Radar quem tem
         authorized === true de forma explícita. Um item sem o campo
         preenchido (ex.: esquecido ao copiar um modelo) fica de fora
         por padrão, em vez de aparecer por engano. */
      aplicarSucesso(OPORTUNIDADES.filter(function(o){ return o.authorized === true; }));
    }
  }
  bootstrapRadar();
  /* Exposta para o Painel de Gestão chamar após qualquer operação bem-
     sucedida (publicar, editar, arquivar, excluir), para refletir a
     mudança no próprio portal sem recarregar a página. Só tem efeito
     quando useSupabaseContent=true (com os dados estáticos, o Painel
     de Gestão não realiza essas operações). */
  window.caefRefreshRadar = bootstrapRadar;

  /* ---------------------------------------------------------------
     PESQUISA — lista de laboratórios
     --------------------------------------------------------------- */
  var labsWrap = document.getElementById('labsWrap');
  if (labsWrap && typeof LABORATORIOS !== 'undefined'){
    labsWrap.innerHTML = LABORATORIOS.map(function(l, i){
      return '<div class="lab-row" data-search>'+
        '<div class="lab-num">'+String(i+1).padStart(2,'0')+'</div>'+
        '<div><div class="lab-sigla">'+(l.sigla!=='—'?l.sigla:'')+'</div>'+
          '<h3 class="lab-nome">'+l.nome+'</h3>'+
          '<div class="lab-linhas">'+l.linhas+'</div>'+
          '<div class="lab-resp">Responsável: '+l.responsavel+(l.nota?' · '+l.nota:'')+'</div>'+
        '</div>'+
        '<span class="lab-src '+l.fonte+'">'+(l.fonte==='sigaa'?'Fonte: SIGAA':'Mapeado pelo CAEF')+'</span>'+
      '</div>';
    }).join('');
    var labsNota = document.getElementById('labsNotaGeral');
    if (labsNota && typeof LABORATORIOS_NOTA_GERAL !== 'undefined') labsNota.textContent = LABORATORIOS_NOTA_GERAL;
  }

  /* ---------------------------------------------------------------
     CAEF FORMAÇÃO
     --------------------------------------------------------------- */
  var formWrap = document.getElementById('formacaoWrap');
  if (formWrap && typeof FORMACAO !== 'undefined'){
    if (!FORMACAO.length){
      formWrap.innerHTML = '<div class="empty-state"><h4>Nenhuma atividade cadastrada no momento</h4><p>Novas oficinas e minicursos aparecem aqui assim que forem planejados pela Diretoria de Ensino, Pesquisa e Extensão.</p></div>';
    } else {
      formWrap.innerHTML = FORMACAO.map(function(f){
        var badge = f.status === 'confirmada' ? 'CONFIRMADA' : (f.status === 'encerrada' ? 'ENCERRADA' : 'EM BREVE');
        var badgeClass = f.status === 'confirmada' ? 'confirmada' : '';
        return '<div class="formation-card" id="form-'+f.id+'">'+
          '<span class="formation-badge '+badgeClass+'">'+badge+'</span>'+
          '<div style="flex:1;">'+
            '<div class="kicker" style="margin-bottom:4px;">'+f.formato+'</div>'+
            '<h3 style="font-family:var(--font-display);text-transform:uppercase;color:var(--green-900);margin:0 0 8px;font-size:19px;">'+f.titulo+'</h3>'+
            '<p style="margin:0;color:var(--ink-muted);font-size:14.5px;line-height:1.6;">'+f.descricao+'</p>'+
            '<dl class="formation-fields">'+
              '<div><dt>Data</dt><dd>'+(f.data||'Em breve')+'</dd></div>'+
              '<div><dt>Local</dt><dd>'+(f.local||'Em breve')+'</dd></div>'+
              '<div><dt>Ministrante</dt><dd>'+(f.ministrante||'Em breve')+'</dd></div>'+
              '<div><dt>Vagas</dt><dd>'+(f.vagas||'Em breve')+'</dd></div>'+
            '</dl>'+
            (f.inscricaoLink ? '<p style="margin-top:14px;"><a class="btn btn-line" href="'+f.inscricaoLink+'" target="_blank" rel="noopener">Inscrever-se →</a></p>' : '')+
          '</div>'+
        '</div>';
      }).join('');
    }
    /* Exposição controlada para a Busca Geral (Etapa 4 — Fase 2): só a
       lista SEM atividades "encerradas" — elas continuam aparecendo
       normalmente aqui na seção Formação (nada nesta filtragem muda o
       que "formWrap" mostra), mas não devem aparecer como resultado
       de busca. O status e os dados cadastrados não são alterados,
       só a lista extra usada pela busca deixa de fora quem já
       encerrou. */
    window.caefFormacaoBusca = FORMACAO.filter(function(f){ return f.status !== 'encerrada'; });
  }

  /* ---------------------------------------------------------------
     MURAL DE AVISOS
     --------------------------------------------------------------- */
  var muralWrap = document.getElementById('muralWrap');
  function escapeAvisoHtml(str){
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function parseDataBR(str){
    if (!str) return null;
    var partes = String(str).split('/');
    if (partes.length !== 3) return null;
    var d = new Date(partes[2], partes[1]-1, partes[0]);
    return isNaN(d.getTime()) ? null : d;
  }
  function showMuralIndisponivel(){
    if (!muralWrap) return;
    muralWrap.innerHTML = '<div class="empty-state"><h4>Mural de Avisos indisponível no momento</h4><p>Não foi possível carregar os avisos agora. Isso não significa que não haja comunicados novos — tente novamente em instantes.</p></div>';
    window.caefAvisosPublicados = [];
    /* V28 — item 1: distingue "falha ao carregar" de "carregado e
       vazio de verdade" para quem consome window.caefAvisosPublicados
       fora deste arquivo (Área do Estudante, "Avisos recentes", Busca
       Geral). caefAvisosCarregado marca que uma tentativa terminou
       (sucesso ou falha); caefAvisosIndisponivel diferencia qual dos
       dois casos foi — um array vazio sozinho não permite essa
       distinção. */
    window.caefAvisosCarregado = true;
    window.caefAvisosIndisponivel = true;
    window.dispatchEvent(new CustomEvent('caef:conteudo-atualizado', {detail:{tipo:'avisos'}}));
  }
  function initMural(avisosPublicados){
    if (!muralWrap) return;
    if (!avisosPublicados.length){
      muralWrap.innerHTML = '<div class="empty-state"><h4>Nenhum aviso publicado no momento</h4><p>Novos comunicados da Diretoria Geral do CAEF aparecem aqui assim que forem avaliados e aprovados para publicação.</p></div>';
    } else {
      muralWrap.innerHTML = avisosPublicados.map(function(a){
        // V28: imagem opcional — avisos sem imagem (a imensa maioria,
        // incluindo todo o conteúdo migrado da V27) continuam exatamente
        // como antes, sem nenhuma alteração de layout.
        var imagemHtml = a.imagemUrl
          ? '<img class="formation-card-img" src="'+escapeAvisoHtml(a.imagemUrl)+'" alt="'+escapeAvisoHtml(a.imagemAlt||'')+'" loading="lazy">'
          : '';
        return '<div class="formation-card" id="aviso-'+escapeAvisoHtml(a.id)+'">'+
          '<span class="formation-badge">AVISO</span>'+
          imagemHtml+
          '<div style="flex:1;">'+
            '<div class="kicker" style="margin-bottom:4px;">'+escapeAvisoHtml(a.origem)+'</div>'+
            '<h3 style="font-family:var(--font-display);text-transform:uppercase;color:var(--green-900);margin:0 0 8px;font-size:19px;">'+escapeAvisoHtml(a.titulo)+'</h3>'+
            '<p style="margin:0;color:var(--ink-muted);font-size:14.5px;line-height:1.6;">'+escapeAvisoHtml(a.texto)+'</p>'+
            '<dl class="formation-fields">'+
              '<div><dt>Comunicado em</dt><dd>'+escapeAvisoHtml(a.dataOriginal||'—')+'</dd></div>'+
            '</dl>'+
          '</div>'+
        '</div>';
      }).join('');
    }
    /* Exposição controlada para a Busca Geral (Etapa 4 — Fase 2): a
       busca lê exatamente esta lista, já filtrada por situação de
       publicação e validade — nunca reimplementa essa regra por
       conta própria. Se este arquivo não carregar por algum motivo,
       a busca simplesmente não mostra avisos (ver "typeof" no módulo
       de busca), em vez de quebrar. */
    window.caefAvisosPublicados = avisosPublicados;
    window.caefAvisosCarregado = true;
    window.caefAvisosIndisponivel = false;
    /* V28 — item 1: avisa quem depende desta lista (Área do Estudante,
       "Avisos recentes", Busca Geral) que ela acabou de ser
       (re)carregada, para que se atualizem sem precisar de reload —
       tanto na primeira carga quanto numa atualização depois de uma
       publicação/edição/arquivamento/exclusão feita no Painel de
       Gestão. */
    window.dispatchEvent(new CustomEvent('caef:conteudo-atualizado', {detail:{tipo:'avisos'}}));
  }
  /* V28 — item 1: muralInicializado evita que uma falha numa
     ATUALIZAÇÃO (chamada via window.caefRefreshMural, depois que o
     Mural já carregou com sucesso uma vez) apague avisos que já
     estavam exibidos corretamente — só a falha na carga INICIAL mostra
     o estado "indisponível". Ao contrário do Radar, initMural() não
     anexa listeners persistentes a elementos fora do próprio
     muralWrap, então pode ser chamado de novo com segurança sem o
     mesmo cuidado de separar "setup" de "atualização". */
  var muralInicializado = false;
  function bootstrapMural(){
    if (!muralWrap) return;
    if (window.CAEF_CONTENT_CONFIG && window.CAEF_CONTENT_CONFIG.useSupabaseContent && window.caefContentSource){
      window.caefContentSource.getAvisosPublicados().then(function(avisos){
        initMural(avisos);
        muralInicializado = true;
      })['catch'](function(){
        if (muralInicializado){
          console.warn('[Mural de Avisos] Falha ao atualizar o Mural — mantendo os avisos já carregados.');
          return;
        }
        showMuralIndisponivel();
      });
      return;
    }
    if (typeof AVISOS === 'undefined') return;
    var hojeMural = new Date();
    var avisosPublicados = AVISOS.filter(function(a){
      if (a.situacaoPublicacao !== 'publicado') return false;
      var validade = parseDataBR(a.validoAte);
      if (validade){
        validade.setHours(23,59,59,999);
        if (hojeMural > validade) return false;
      }
      return true;
    });
    /* Sinalização apenas para manutenção (console do navegador) — nunca
       exibida ao público — quando um aviso publicado passa da própria
       data de revisão editorial sem confirmação. */
    AVISOS.forEach(function(a){
      if (a.situacaoPublicacao !== 'publicado') return;
      var revisao = parseDataBR(a.revisaoEditorial);
      if (revisao && hojeMural > revisao){
        console.warn('[Mural de Avisos] O aviso "'+a.titulo+'" passou da data de revisão editorial ('+a.revisaoEditorial+'). Confirme com a Diretoria Geral do CAEF se a orientação ainda está vigente antes de manter, atualizar ou arquivar o comunicado.');
      }
    });
    initMural(avisosPublicados);
    muralInicializado = true;
  }
  bootstrapMural();
  /* Exposta para o Painel de Gestão chamar após qualquer operação bem-
     sucedida sobre avisos (publicar, editar, arquivar, excluir,
     enviar/substituir/remover imagem), para refletir a mudança no
     próprio portal sem recarregar a página. Só tem efeito quando
     useSupabaseContent=true. */
  window.caefRefreshMural = bootstrapMural;

  /* ---------------------------------------------------------------
     PORTAS ABERTAS
     --------------------------------------------------------------- */
  var portasWrap = document.getElementById('portasAbertasWrap');
  if (portasWrap && typeof PROXIMA_EDICAO_PORTAS !== 'undefined'){
    if (!PROXIMA_EDICAO_PORTAS.definida){
      portasWrap.innerHTML = '<div class="edition-card"><p class="edition-concept">Próxima edição</p><h3 style="font-family:var(--font-display);text-transform:uppercase;color:var(--green-900);margin:10px 0;">Em planejamento</h3><p style="color:var(--ink-muted);font-size:14.5px;">Ainda não há data confirmada para a próxima edição do CAEF Portas Abertas. Fique de olho no Mural — o lançamento será anunciado por lá.</p></div>';
    } else {
      var pe = PROXIMA_EDICAO_PORTAS;
      portasWrap.innerHTML = '<div class="edition-card"><p class="edition-concept">Próxima edição</p><h3 style="font-family:var(--font-display);text-transform:uppercase;color:var(--green-900);margin:10px 0 16px;">'+pe.laboratorio+'</h3>'+
        '<dl class="edition-fields">'+
          '<div><dt>Data</dt><dd>'+pe.data+'</dd></div>'+
          '<div><dt>Horário</dt><dd>'+pe.horario+'</dd></div>'+
          '<div><dt>Local</dt><dd>'+pe.local+'</dd></div>'+
          '<div><dt>Vagas</dt><dd>'+pe.vagas+'</dd></div>'+
        '</dl>'+
        (pe.inscricaoLink ? '<a class="btn btn-primary" href="'+pe.inscricaoLink+'" target="_blank" rel="noopener">Inscrever-se →</a>' : '')+
      '</div>';
    }
    var edWrap = document.getElementById('edicoesAnterioresWrap');
    if (edWrap){
      if (!EDICOES_ANTERIORES_PORTAS.length){
        edWrap.innerHTML = '<p style="color:var(--ink-muted);font-size:14px;">Nenhuma edição anterior registrada até o momento.</p>';
      } else {
        edWrap.innerHTML = EDICOES_ANTERIORES_PORTAS.map(function(e){
          return '<div class="plain-card"><b>'+e.laboratorio+'</b><br><span style="font-family:var(--font-mono);font-size:12.5px;color:var(--ink-muted);">'+e.data+'</span></div>';
        }).join('');
      }
    }
  }

  /* ---------------------------------------------------------------
     OUVIDORIA — transparência
     --------------------------------------------------------------- */
  var transpWrap = document.getElementById('transparencyWrap');
  if (transpWrap && typeof TRANSPARENCIA_OUVIDORIA !== 'undefined'){
    if (!TRANSPARENCIA_OUVIDORIA.disponivel){
      transpWrap.innerHTML = '<div class="empty-state"><h4>Dados agregados ainda não publicados</h4><p>Assim que a Diretoria de Ensino, Pesquisa e Extensão consolidar os números do período, eles aparecerão aqui — sempre de forma agregada, sem identificar quem enviou cada manifestação.</p></div>';
    } else {
      var t = TRANSPARENCIA_OUVIDORIA;
      transpWrap.innerHTML = '<div class="transparency-grid">'+
        '<div class="transparency-cell"><div class="num">'+t.recebidas+'</div><div class="lbl">Recebidas</div></div>'+
        '<div class="transparency-cell"><div class="num">'+t.encaminhadas+'</div><div class="lbl">Encaminhadas</div></div>'+
        '<div class="transparency-cell"><div class="num">'+t.concluidas+'</div><div class="lbl">Concluídas</div></div>'+
        '<div class="transparency-cell"><div class="num">'+t.emAcompanhamento+'</div><div class="lbl">Em acompanhamento</div></div>'+
      '</div><p style="font-family:var(--font-mono);font-size:11.5px;color:var(--ink-faint);margin-top:10px;">Período de referência: '+t.periodoReferencia+'</p>';
    }
  }

  /* ---------------------------------------------------------------
     APADRINHAMENTO — fases + regras + AACC (render a partir de dados)
     --------------------------------------------------------------- */
  var phaseWrap = document.getElementById('apadrinhamentoFases');
  if (phaseWrap && typeof APADRINHAMENTO_FASES !== 'undefined'){
    phaseWrap.innerHTML = APADRINHAMENTO_FASES.map(function(f){
      return '<div class="phase-row"><div class="phase-num">'+f.n+'</div><div class="phase-body">'+
        '<span class="phase-period">'+f.periodo+'</span>'+
        '<h4>'+f.nome+'</h4>'+
        '<p>'+f.descricao+'</p>'+
      '</div></div>';
    }).join('');
  }
  var atribWrap = document.getElementById('apadrinhamentoAtribuicoes');
  if (atribWrap && typeof APADRINHAMENTO_ATRIBUICOES !== 'undefined'){
    atribWrap.innerHTML = '<ul class="rule-list">'+APADRINHAMENTO_ATRIBUICOES.map(function(a){return '<li>'+a+'</li>';}).join('')+'</ul>';
  }
  var regrasWrap = document.getElementById('apadrinhamentoRegras');
  if (regrasWrap && typeof APADRINHAMENTO_REGRAS !== 'undefined'){
    regrasWrap.innerHTML = '<ul class="rule-list">'+APADRINHAMENTO_REGRAS.map(function(a){return '<li>'+a+'</li>';}).join('')+'</ul>';
  }

  /* ---------------------------------------------------------------
     Links "Ver vagas de X no Radar" — elementos com
     data-radar-type="extensao|pesquisa|..." abrem o Radar já com
     aquele filtro de Tipo marcado.
     --------------------------------------------------------------- */
  document.addEventListener('click', function(e){
    var link = e.target.closest ? e.target.closest('[data-radar-type]') : null;
    if (!link) return;
    var type = link.getAttribute('data-radar-type');
    setTimeout(function(){
      var input = document.querySelector('#filterType input[value="'+type+'"]');
      if (input && !input.checked){ input.checked = true; input.dispatchEvent(new Event('change', {bubbles:true})); }
    }, 60);
  });

})();

/* ---------------------------------------------------------------
   CONHEÇA A GESTÃO — cartões por diretoria + painel de detalhe
   ---------------------------------------------------------------
   Lê GESTAO_DIRETORIAS e GESTAO_INTEGRANTES (js/data/gestao.js).
   Cada cartão é um <button>, acionável por mouse, toque e teclado.
   O painel de detalhe reaproveita a mesma técnica de foco acessível
   já usada no painel da Busca Geral (Fase 2): fundo marcado como
   inert, Tab preso dentro do painel, Esc fecha, foco volta para o
   cartão que abriu. Bloco independente — replica a lógica em vez de
   compartilhar closure, seguindo o padrão já usado neste arquivo. */
(function(){
  'use strict';
  var wrap = document.getElementById('gestaoWrap');
  if (!wrap || typeof GESTAO_INTEGRANTES === 'undefined' || typeof GESTAO_DIRETORIAS === 'undefined') return;

  function escapeGestaoHtml(str){
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var porDiretoria = {};
  GESTAO_INTEGRANTES.forEach(function(m){
    if (!porDiretoria[m.diretoriaId]) porDiretoria[m.diretoriaId] = [];
    porDiretoria[m.diretoriaId].push(m);
  });

  // Colagem fotográfica discreta no banner de abertura — gerada a partir
  // dos mesmos dados, para nunca ficar dessincronizada da lista real de
  // integrantes (adicionar/remover alguém em gestao.js já atualiza tudo).
  var heroCollage = document.getElementById('gestaoHeroCollage');
  if (heroCollage){
    heroCollage.innerHTML = GESTAO_INTEGRANTES.map(function(m){
      return '<img src="assets/img/gestao/'+escapeGestaoHtml(m.foto)+'" alt="" style="object-position:'+escapeGestaoHtml(m.fotoPosicao||'center')+';" loading="lazy">';
    }).join('');
  }

  // Mosaico fotográfico por diretoria: cada integrante é um cartão-foto
  // (a foto é o próprio cartão, com nome e cargo em legenda sobre a
  // imagem). Coordenação Geral ganha destaque visual com cartões mais
  // altos (3:4) em sua própria composição; as demais diretorias usam
  // cartões quadrados no desktop. --cols é calculado por diretoria (até
  // 4) para que os cartões preencham a largura disponível sem deixar
  // espaço vazio quando há menos de 4 integrantes.
  wrap.innerHTML = GESTAO_DIRETORIAS.map(function(d){
    var membros = porDiretoria[d.id] || [];
    if (!membros.length) return '';
    var isCoord = d.id === 'organizacao';
    var gridClass = isCoord ? 'gestao-coord-grid' : 'gestao-grid';
    var cols = Math.min(membros.length, 4);
    var tiles = membros.map(function(m){
      return '<button type="button" class="gestao-tile" data-gestao-id="'+escapeGestaoHtml(m.id)+'">'+
        '<img src="assets/img/gestao/'+escapeGestaoHtml(m.foto)+'" alt="" style="object-position:'+escapeGestaoHtml(m.fotoPosicao||'center')+';" loading="lazy">'+
        '<span class="gestao-cap"><h4>'+escapeGestaoHtml(m.nome)+'</h4><p>'+escapeGestaoHtml(m.funcao)+'</p></span>'+
      '</button>';
    }).join('');
    return '<div class="gestao-section">'+
      '<div class="gestao-section-head"><h3>'+escapeGestaoHtml(d.nome)+'</h3><span class="gestao-section-count">'+membros.length+(membros.length===1?' integrante':' integrantes')+'</span></div>'+
      '<div class="'+gridClass+'" style="--cols:'+cols+';">'+tiles+'</div>'+
      '<details class="gestao-atribuicoes"><summary>Ver atribuições da diretoria</summary><p>'+escapeGestaoHtml(d.resumoEstatuto)+'</p><span class="gestao-artigo">'+escapeGestaoHtml(d.artigo)+'</span></details>'+
    '</div>';
  }).join('');

  var overlay = document.getElementById('gestaoOverlay');
  var panel = document.getElementById('gestaoPanel');
  var closeBtn = document.getElementById('gestaoPanelClose');
  var bodyEl = document.getElementById('gestaoPanelBody');
  var titleEl = document.getElementById('gestaoPanelTitle');
  if (!overlay || !panel || !closeBtn || !bodyEl) return;

  var lastFocused = null;
  var inertedEls = [];
  var cardButtons = wrap.querySelectorAll('.gestao-tile');

  function isToggle(el){ return Array.prototype.indexOf.call(cardButtons, el) !== -1; }
  function containsToggle(el){
    for (var i = 0; i < cardButtons.length; i++){ if (el.contains(cardButtons[i])) return true; }
    return false;
  }
  function setBackgroundInert(on){
    if (on){
      inertedEls = [];
      (function walk(nodeList){
        Array.prototype.forEach.call(nodeList, function(el){
          if (el === overlay || el === panel) return;
          if (isToggle(el)) return;
          if (containsToggle(el)){ walk(el.children); return; }
          if (el.hasAttribute('inert')) return;
          el.setAttribute('inert', '');
          inertedEls.push(el);
        });
      })(document.body.children);
    } else {
      inertedEls.forEach(function(el){ el.removeAttribute('inert'); });
      inertedEls = [];
    }
  }
  function getFocusable(){
    return Array.prototype.filter.call(
      panel.querySelectorAll('a,button,input,[tabindex]:not([tabindex="-1"])'),
      function(el){ return !el.hidden && el.offsetParent !== null; }
    );
  }

  function openMember(id){
    var m = GESTAO_INTEGRANTES.filter(function(x){ return x.id === id; })[0];
    if (!m) return;
    titleEl.textContent = m.nome;
    bodyEl.innerHTML =
      '<div class="gestao-detail-photo"><img src="assets/img/gestao/'+escapeGestaoHtml(m.foto)+'" alt="" style="object-position:'+escapeGestaoHtml(m.fotoPosicao||'center')+';"></div>'+
      '<p class="gestao-detail-area">'+escapeGestaoHtml(m.area)+'</p>'+
      '<h2 style="margin:0 0 4px;">'+escapeGestaoHtml(m.nome)+'</h2>'+
      '<p style="margin:0;color:var(--ink-muted);font-size:14.5px;">'+escapeGestaoHtml(m.funcao)+'</p>'+
      '<p class="gestao-detail-note">O CAEF é uma iniciativa estudantil do curso de Educação Física — não é um canal oficial da UFPB.</p>';
    lastFocused = document.activeElement;
    panel.inert = false;
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);
    setTimeout(function(){ closeBtn.focus(); }, 10);
  }

  function closeMember(){
    if (!panel.classList.contains('open')) return;
    overlay.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
    setBackgroundInert(false);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
    if (panel.contains(document.activeElement) && document.activeElement.blur) document.activeElement.blur();
    /* Mesma correção já aplicada ao painel da Busca Geral nesta rodada:
       sem isso, o botão de fechar deste painel continuava alcançável
       por Tab mesmo fechado, e o handler de Tab abaixo prendia o foco
       nele para sempre — travando a navegação por teclado do restante
       da página. Necessário para o teste de navegação só por teclado
       (item 8 da aprovação) conseguir chegar ao rodapé. */
    panel.inert = true;
  }

  wrap.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.gestao-tile') : null;
    if (!btn) return;
    openMember(btn.getAttribute('data-gestao-id'));
  });
  overlay.addEventListener('click', closeMember);
  closeBtn.addEventListener('click', closeMember);

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && panel.classList.contains('open')) closeMember();
  });

  panel.addEventListener('keydown', function(e){
    if (!panel.classList.contains('open')) return;
    if (e.key !== 'Tab') return;
    var focusable = getFocusable();
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
})();

/* ---------------------------------------------------------------
   Mostrar a busca do Ensino apenas nas páginas de Ensino
   --------------------------------------------------------------- */
(function(){
  var ENSINO_IDS = ['comparativo','bacharelado','licenciatura','trilhas','trilhas-cchla','atividades','quiz','carreiras'];
  var wrap = document.getElementById('ensinoSearchWrap');
  if (!wrap) return;
  document.addEventListener('caef:tabchange', function(e){
    wrap.style.display = ENSINO_IDS.indexOf(e.detail.id) !== -1 ? '' : 'none';
  });
  var initial = (location.hash||'').replace('#','');
  wrap.style.display = ENSINO_IDS.indexOf(initial) !== -1 ? '' : 'none';
})();

/* ---------------------------------------------------------------
   ACERVO ACADÊMICO
   --------------------------------------------------------------- */
(function(){
  var fontesWrap = document.getElementById('acervoFontesWrap');
  if (!fontesWrap || typeof ACERVO_FONTES_OFICIAIS === 'undefined') return;

  fontesWrap.innerHTML = ACERVO_FONTES_OFICIAIS.map(function(f){
    return '<div class="plain-card"><p class="kicker" style="margin-bottom:6px;">'+f.like+'</p>'+
      '<h3 style="font-family:var(--font-display);text-transform:uppercase;color:var(--green-900);margin:0 0 8px;font-size:16px;">'+f.nome+'</h3>'+
      '<p style="font-size:13.5px;color:var(--ink-muted);margin:0 0 10px;line-height:1.55;">'+f.descricao+'</p>'+
      '<p style="font-size:12.5px;color:var(--ink-faint);margin:0 0 12px;line-height:1.5;">'+f.comoAcessar+'</p>'+
      '<a class="btn btn-line" href="'+f.href+'" target="_blank" rel="noopener" style="padding:8px 14px;font-size:12px;">Acessar →</a>'+
    '</div>';
  }).join('');

  var driveLink = document.getElementById('acervoDriveLink');
  if (driveLink) driveLink.href = ACERVO_DRIVE_LINK;

  var periodosWrap = document.getElementById('acervoPeriodosWrap');
  if (periodosWrap) periodosWrap.innerHTML = ACERVO_PERIODOS.map(function(p){
    return '<a class="period-chip" href="'+ACERVO_DRIVE_LINK+'" target="_blank" rel="noopener">'+p+'</a>';
  }).join('');

  var regrasWrap = document.getElementById('acervoRegrasWrap');
  if (regrasWrap) regrasWrap.innerHTML = ACERVO_REGRAS.map(function(r){ return '<li>'+r+'</li>'; }).join('');

  var d = ACERVO_DESENGAVETA;
  var t = document.getElementById('desengavetaTitulo'); if (t) t.textContent = d.titulo;
  var de = document.getElementById('desengavetaDesc'); if (de) de.textContent = d.descricao;
  var c = document.getElementById('desengavetaColeta'); if (c) c.textContent = d.pontoColeta;
  var cat = document.getElementById('desengavetaCatalogo'); if (cat) cat.href = d.catalogoLink;
})();

/* ---------------------------------------------------------------
   APADRINHAMENTO — status, links, elegibilidade, AACC, SOS
   (fases/atribuições/regras já são renderizados acima)
   --------------------------------------------------------------- */
(function(){
  if (typeof APADRINHAMENTO_STATUS === 'undefined') return;

  var STATUS_LABELS = { em_execucao: 'EM EXECUÇÃO', planejado: 'EM PLANEJAMENTO', encerrado: 'ENCERRADO' };
  var badge = document.getElementById('apadrinhamentoStatusBadge');
  if (badge) badge.textContent = STATUS_LABELS[APADRINHAMENTO_STATUS] || 'CONSULTAR STATUS';

  var inscLink = document.getElementById('apadrinhamentoInscricaoLink');
  if (inscLink) inscLink.href = APADRINHAMENTO_INSCRICAO_LINK;

  var manLink = document.getElementById('apadrinhamentoManualLink');
  if (manLink) manLink.href = APADRINHAMENTO_MANUAL_LINK;

  var eleg = document.getElementById('apadrinhamentoElegibilidade');
  if (eleg) eleg.textContent = APADRINHAMENTO_ELEGIBILIDADE;

  var horas = document.getElementById('apadrinhamentoAACCHoras');
  if (horas) horas.innerHTML = APADRINHAMENTO_AACC.horas;

  var crit = document.getElementById('apadrinhamentoAACCCriterios');
  if (crit) crit.innerHTML = APADRINHAMENTO_AACC.criterios.map(function(c){ return '<li>'+c+'</li>'; }).join('');

  var obs = document.getElementById('apadrinhamentoAACCObs');
  if (obs && APADRINHAMENTO_AACC.observacao) obs.textContent = APADRINHAMENTO_AACC.observacao;

  /* Se algum dia uma nova divergência documental precisar ser sinalizada
     publicamente, adicione um campo "validacaoPendente" em
     js/data/apadrinhamento.js e reaproveite o componente .validate-flag
     (ver classe em css/style.css) para exibi-lo aqui. */

  var sosNome = document.getElementById('apadrinhamentoSOSNome');
  if (sosNome) sosNome.textContent = APADRINHAMENTO_SOS.nome;

  var sosDesc = document.getElementById('apadrinhamentoSOSDesc');
  if (sosDesc) sosDesc.textContent = APADRINHAMENTO_SOS.descricao;
})();

/* ---------------------------------------------------------------
   OUVIDORIA — link do formulário, escopo, disclaimer
   (transparência já é renderizada acima)
   --------------------------------------------------------------- */
(function(){
  if (typeof OUVIDORIA_FORM_LINK === 'undefined') return;

  var formLink = document.getElementById('ouvidoriaFormLink');
  if (formLink) formLink.href = OUVIDORIA_FORM_LINK;

  var escopoWrap = document.getElementById('ouvidoriaEscopoWrap');
  if (escopoWrap) escopoWrap.innerHTML = OUVIDORIA_ESCOPO.map(function(e){ return '<li>'+e+'</li>'; }).join('');

  var naoCobreWrap = document.getElementById('ouvidoriaNaoCobreWrap');
  if (naoCobreWrap) naoCobreWrap.innerHTML = '<b>O que a Ouvidoria do CAEF não é:</b> ' + OUVIDORIA_NAO_COBRE;
})();

/* ---------------------------------------------------------------
   Rodapé — ano corrente (evita data fixa desatualizada)
   --------------------------------------------------------------- */
(function(){
  var y = document.getElementById('footerYear');
  if (y) y.textContent = '© ' + new Date().getFullYear() + ' CAEF UFPB';
})();


/* Guia "Por onde começar?" com 4 caminhos (Etapa 1). Não coleta dados;
   usa somente destinos e textos reais do portal (as mesmas descrições já
   usadas nos cartões da Central do Estudante). Não navega sozinho ao
   selecionar uma opção: o foco vai para o botão de acesso, que precisa
   ser confirmado (clique/Enter) para sair da página. */
(function(){
  'use strict';
  var buckets=document.querySelectorAll('.start-guide-bucket');
  var first=document.getElementById('startGuideStepOne');
  var second=document.getElementById('startGuideStepTwo');
  var back=document.getElementById('startGuideBack');
  var result=document.getElementById('startGuideResult');
  var optionsWrap=document.getElementById('startGuideOptions');
  var stepLabel=document.getElementById('startGuideStepTwoLabel');
  var question=document.getElementById('startGuideQuestion');
  if(!buckets.length||!first||!second||!back||!result||!optionsWrap)return;
  var title=document.getElementById('startGuideResultTitle');
  var desc=document.getElementById('startGuideResultText');
  var link=document.getElementById('startGuideResultLink');
  /* Guarda o botão do caminho aberto no momento, para que "← Voltar"
     devolva o foco a ele — e não ao primeiro caminho da lista. */
  var currentBucket=null;

  var DATA={
    estudos:{
      label:'Organizar meus estudos',
      question:'Para onde você quer ir?',
      items:[
        {title:'Comparativo Bacharelado × Licenciatura',description:'Entenda as diferenças entre as duas habilitações antes de escolher seu caminho.',href:'#comparativo',action:'Comparar'},
        {title:'Trilhas de disciplinas de saúde',description:'Disciplinas de outros cursos de saúde que podem contar como optativas.',href:'#trilhas',action:'Ver trilhas'},
        {title:'Trilhas CCHLA',description:'Disciplinas de humanidades que podem contar como optativas, com foco na Licenciatura.',href:'#trilhas-cchla',action:'Ver trilhas'},
        {title:'Descubra sua trilha',description:'Um quiz rápido para ver uma sugestão inicial de disciplinas conforme sua área de interesse.',href:'#quiz',action:'Fazer o quiz'},
        {title:'Perfis de carreira',description:'Áreas de atuação da Educação Física e as disciplinas-chave para cada uma.',href:'#carreiras',action:'Ver perfis'}
      ]
    },
    oportunidades:{
      label:'Encontrar oportunidades',
      question:'Que tipo de oportunidade você procura?',
      items:[
        {title:'Radar CAEF',description:'Vagas de extensão e de pesquisa em laboratórios do DEF, mapeadas com os responsáveis e reunidas num buscador com filtros.',href:'#radar',action:'Ver oportunidades'},
        {title:'CAEF Portas Abertas',description:'Visitas guiadas para conhecer laboratórios, espaços acadêmicos e as pessoas que fazem pesquisa no curso.',href:'#portas-abertas',action:'Conhecer o programa'},
        {title:'CAEF Formação',description:'Oficinas e minicursos para apoiar a vida acadêmica. A primeira edição será sobre Currículo Lattes.',href:'#formacao',action:'Ver programação'},
        {title:'Pesquisa no DEF',description:'Laboratórios, grupos e linhas de pesquisa do DEF/UFPB, com a fonte de cada informação identificada.',href:'#pesquisa',action:'Ver pesquisa'},
        {title:'Extensão no DEF',description:'Projetos de extensão do DEF/UFPB mapeados com os coordenadores responsáveis.',href:'#extensao',action:'Ver extensão'}
      ]
    },
    apoio:{
      label:'Buscar apoio ou serviços',
      question:'Como podemos ajudar?',
      items:[
        {title:'Acervo Acadêmico',description:'Fontes gratuitas e legais de bibliografia, organizadas por período.',href:'#acervo',action:'Acessar acervo'},
        {title:'Apadrinhamento Acadêmico',description:'Mentoria entre veteranos e calouros. A edição 2026.2 está em andamento.',href:'#apadrinhamento',action:'Saiba mais'},
        {title:'Ouvidoria CAEF',description:'Canal direto com a Diretoria de Ensino, Pesquisa e Extensão do CAEF.',href:'#ouvidoria',action:'Ir para a Ouvidoria'}
      ]
    },
    comunidade:{
      label:'Conhecer o CAEF',
      question:'O que você quer conhecer?',
      items:[
        {title:'CAEF Formação',description:'Oficinas e minicursos para apoiar a vida acadêmica. A primeira edição será sobre Currículo Lattes.',href:'#formacao',action:'Ver programação'},
        {title:'Conheça a Gestão',description:'Integrantes da Gestão Sinergia, organizados pelas três diretorias do CAEF.',href:'#gestao',action:'Conhecer a gestão'}
      ]
    }
  };

  function goToSobrePortal(e,href){
    if(href!=='#sobre-portal')return;
    e.preventDefault();
    if(typeof window.caefActivateTab==='function')window.caefActivateTab('inicio');
    history.replaceState(null,'','#sobre-portal');
    var hub=document.getElementById('sobre-portal');
    if(hub)hub.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }

  function resetBuckets(){buckets.forEach(function(b){b.setAttribute('aria-expanded','false');});}

  function openBucket(bucketBtn){
    var data=DATA[bucketBtn.getAttribute('data-bucket')];
    if(!data)return;
    resetBuckets();
    bucketBtn.setAttribute('aria-expanded','true');
    currentBucket=bucketBtn;
    first.hidden=true;second.hidden=false;result.hidden=true;
    if(stepLabel)stepLabel.textContent=data.label;
    if(question)question.textContent=data.question;
    optionsWrap.innerHTML='';
    data.items.forEach(function(item){
      var opt=document.createElement('button');
      opt.type='button';opt.className='start-guide-option';opt.setAttribute('aria-pressed','false');
      var strong=document.createElement('strong');strong.textContent=item.title;
      var span=document.createElement('span');span.textContent=item.description;
      opt.appendChild(strong);opt.appendChild(span);
      opt.addEventListener('click',function(){
        Array.prototype.forEach.call(optionsWrap.querySelectorAll('.start-guide-option'),function(o){o.setAttribute('aria-pressed',String(o===opt));});
        title.textContent=item.title;desc.textContent=item.description;link.href=item.href;
        if(link.firstChild)link.firstChild.textContent=item.action+' ';
        result.hidden=false;
        /* Acesso direto mais evidente: o resultado já mostra a descrição
           (lida antes, no próprio cartão da opção); o foco vai direto para
           o botão de acesso, para quem usa teclado, sem navegar sozinho —
           é preciso confirmar (Enter/clique) para sair da página. */
        result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
        link.focus();
      });
      optionsWrap.appendChild(opt);
    });
    var firstOption=optionsWrap.querySelector('.start-guide-option');
    if(firstOption)firstOption.focus();
  }

  buckets.forEach(function(b){b.addEventListener('click',function(){openBucket(b);});});
  back.addEventListener('click',function(){
    second.hidden=true;first.hidden=false;result.hidden=true;
    resetBuckets();
    /* Foco volta exatamente para o caminho de origem (currentBucket);
       o primeiro botão da lista só é usado como reserva, caso essa
       referência não exista por algum motivo. */
    var target=currentBucket||buckets[0];
    if(target)target.focus();
  });
  /* #sobre-portal é uma seção dentro da Home; o roteador só troca painéis. */
  link.addEventListener('click',function(e){goToSobrePortal(e,link.getAttribute('href'));});
})();

/* "Avisos recentes", dentro de "Programas e ferramentas do CAEF" (Etapa 1).
   Lê exclusivamente window.caefAvisosPublicados (exposto pelo bloco do
   Mural, acima neste arquivo) — não duplica texto: é a mesma lista.
   Todo campo vindo dos dados (título, texto, origem, dataOriginal) é
   escrito com textContent via createElement — nunca concatenado em
   innerHTML — então nenhum deles pode injetar HTML/script, qualquer
   que seja o conteúdo cadastrado em avisos.js. */
(function(){
  'use strict';
  var wrap=document.getElementById('nowAvisosList');
  if(!wrap)return;
  /* V28 — item 1: virou função reaproveitável, chamada tanto na carga
     inicial quanto sempre que window.caefAvisosPublicados é
     (re)carregado (evento "caef:conteudo-atualizado", tipo "avisos") —
     assim uma publicação, edição, arquivamento ou exclusão feita no
     Painel de Gestão aparece aqui sem precisar recarregar a página. */
  function render(){
    var lista=window.caefAvisosPublicados;
    wrap.innerHTML='';
    if(!lista||!lista.length){
      var empty=document.createElement('p');
      empty.className='now-avisos-empty';
      empty.textContent='Nenhum aviso publicado no momento.';
      wrap.appendChild(empty);
      return;
    }
    lista.slice(0,2).forEach(function(a){
      var card=document.createElement('a');
      card.className='now-aviso-card';
      card.href='#mural';
      var h4=document.createElement('h4');
      h4.textContent=a.titulo||'';
      var p=document.createElement('p');
      p.textContent=a.texto||'';
      var origem=document.createElement('span');
      origem.className='now-avisos-origem';
      origem.textContent=(a.origem||'')+' · '+(a.dataOriginal||'');
      card.appendChild(h4);
      card.appendChild(p);
      card.appendChild(origem);
      wrap.appendChild(card);
    });
  }
  render();
  window.addEventListener('caef:conteudo-atualizado', function(e){
    if (e && e.detail && e.detail.tipo === 'avisos') render();
  });
})();

/* ---------------------------------------------------------------
   BUSCA NO PORTAL — Fase 1 (seções do portal + canais do CAEF) e
   Fase 2 (avisos, oportunidades, atividades de formação e trilhas)
   ---------------------------------------------------------------
   Fase 1: lê o índice pronto em js/data/busca-secoes.js
   (BUSCA_SECOES). Para adicionar/editar/remover uma seção ou canal
   da busca, edite apenas esse arquivo.

   Fase 2: NÃO cadastra avisos, oportunidades ou atividades de novo.
   Lê, uma vez, quando a página carrega, os mesmos dados que já
   alimentam o Mural, o Radar e a Formação (ver "Índice pré-
   normalizado" mais abaixo):
     - Avisos: window.caefAvisosPublicados — a mesmíssima lista já
       filtrada por situação de publicação e validade que o Mural usa
       para se renderizar (exposta no bloco MURAL DE AVISOS).
     - Oportunidades: window.caefOportunidadesAutorizadas — a lista já
       filtrada por autorização de divulgação que o Radar usa (exposta
       no bloco RADAR CAEF), mais window.caefOpenOportunidade(id), a
       função que abre o mesmo painel de detalhe do Radar.
     - Atividades de formação: window.caefFormacaoBusca — a lista da
       Formação MENOS as atividades "encerradas" (elas continuam
       aparecendo normalmente na própria seção Formação; só não
       aparecem como resultado de busca).
   Trilhas (cartões temáticos de Trilhas de saúde e Trilhas CCHLA) não
   têm arquivo de dados próprio — o índice é montado lendo direto os
   cartões ".trail-card" já publicados em index.html.

   Cada uma dessas fontes é lida através de "window.caefXxx" (nunca
   por variável compartilhada entre arquivos) porque este arquivo é
   dividido em vários blocos independentes — não um único módulo — e
   é a ordem em que eles aparecem no HTML que garante que Radar, Mural
   e Formação já rodaram e já expuseram seus dados antes deste bloco,
   que é sempre o último. Se uma dessas fontes não existir por algum
   motivo, a função correspondente devolve uma lista vazia — a busca
   nunca quebra por causa de um tipo de conteúdo indisponível, só
   deixa de mostrar aquele tipo.
   --------------------------------------------------------------- */
(function(){
  'use strict';
  var toggles = document.querySelectorAll('.nav-search-btn');
  var overlay = document.getElementById('siteSearchOverlay');
  var panel = document.getElementById('siteSearchPanel');
  var closeBtn = document.getElementById('siteSearchClose');
  var input = document.getElementById('siteSearchInput');
  var clearBtn = document.getElementById('siteSearchClear');
  var countEl = document.getElementById('siteSearchCount');
  var hintEl = document.getElementById('siteSearchHint');
  var resultsEl = document.getElementById('siteSearchResults');
  var emptyEl = document.getElementById('siteSearchEmpty');
  if (!toggles.length || !overlay || !panel || !closeBtn || !input || !resultsEl || !emptyEl) return;
  if (typeof BUSCA_SECOES === 'undefined') return;

  var lastFocused = null;
  var inertedEls = [];

  /* Foco e navegação assistiva enquanto o painel está aberto:
     - isToggle/containsToggle identificam o(s) botão(ões) que abrem/
       fecham a busca, para NUNCA torná-los inacessíveis.
     - setBackgroundInert aplica o atributo nativo "inert" a todo o
       conteúdo de fundo (menu, conteúdo das abas, rodapé etc.), o que
       remove esses elementos da árvore de acessibilidade e do foco
       sequencial enquanto o painel estiver aberto — não só do Tab,
       mas também da navegação por cursor virtual de leitores de tela.
       Containers que contêm o próprio botão de busca não são
       tornados inert; a função entra neles e trata os outros filhos,
       preservando o botão 100% utilizável para fechar o painel.

       Importante: um elemento pode já estar inert por outro motivo
       antes mesmo de a busca ser aberta (outro recurso do portal, por
       exemplo). Por isso, só marcamos como "nosso" (para desfazer ao
       fechar) um elemento que NÃO estava inert antes — inertedEls
       guarda só esses. Um elemento que já estava inert antes é
       deixado como está, tanto ao abrir quanto ao fechar, para nunca
       reativar por engano algo que já estava indisponível. */
  function isToggle(el){
    return Array.prototype.indexOf.call(toggles, el) !== -1;
  }
  function containsToggle(el){
    for (var i = 0; i < toggles.length; i++){
      if (el.contains(toggles[i])) return true;
    }
    return false;
  }
  function setBackgroundInert(on){
    if (on){
      inertedEls = [];
      (function walk(nodeList){
        Array.prototype.forEach.call(nodeList, function(el){
          if (el === overlay || el === panel) return;
          if (isToggle(el)) return;
          if (containsToggle(el)){ walk(el.children); return; }
          if (el.hasAttribute('inert')) return;
          el.setAttribute('inert', '');
          inertedEls.push(el);
        });
      })(document.body.children);
    } else {
      inertedEls.forEach(function(el){ el.removeAttribute('inert'); });
      inertedEls = [];
    }
  }

  /* Move o foco para o destino depois de uma navegação interna pela
     busca (em vez de deixar o foco preso no botão do cabeçalho).
     tabindex="-1" torna o elemento focável via script sem incluí-lo na
     ordem de tabulação normal — mesma técnica usada em apps de página
     única para mover o foco após uma navegação "sem recarregar".

     opts.scroll (Fase 2): quando o destino é um item específico
     DENTRO de uma seção (um aviso, uma atividade de formação, um
     cartão de trilha) — e não a seção inteira — o topo da seção não
     é o mesmo lugar que o item; por isso, além do foco, rola até ele
     e aplica por um instante o mesmo destaque (.search-jump) que a
     Busca do Ensino já usa para "achar" uma disciplina. Sem essa
     opção, o comportamento é EXATAMENTE o da Fase 1 (sem rolar, sem
     destacar) — usado quando o destino já é o topo da seção. */
  function focusDestino(id, opts){
    var alvo = document.getElementById(id);
    if (!alvo) return;
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
    if (opts && opts.scroll){
      var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      alvo.scrollIntoView({behavior: reduzMovimento ? 'auto' : 'smooth', block: 'center'});
      alvo.classList.remove('search-jump');
      void alvo.offsetWidth;
      alvo.classList.add('search-jump');
    }
  }

  /* Ignora acentuação e maiúsculas/minúsculas, para "formacao" achar
     "Formação" e vice-versa — sem depender de bibliotecas externas. */
  function normalize(str){
    return String(str || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* Quebra um texto normalizado em palavras. Comparar por palavra (e não
     por trecho solto) evita falsos positivos como "formacao" encontrar
     "informação" só porque uma string contém a outra no meio. */
  function palavras(strNorm){
    return strNorm.split(/[^a-z0-9]+/).filter(Boolean);
  }

  /* Cada palavra digitada precisa ser o INÍCIO de alguma palavra do
     texto indexado — assim "apadrin" ainda encontra "apadrinhamento"
     (prefixo real), mas "formacao" não encontra "informação". */
  function correspondePorPrefixo(palavrasTexto, palavrasTermo){
    return palavrasTermo.every(function(pt){
      return palavrasTexto.some(function(w){ return w.indexOf(pt) === 0; });
    });
  }

  /* Corta um texto para caber no mesmo espaço visual que os resumos
     das seções (Fase 1) já ocupam, sem cortar no meio de uma palavra.
     Só encurta o que é MOSTRADO — a correspondência da busca (mais
     abaixo) sempre usa o texto completo, nunca o cortado. */
  function truncar(str, max){
    str = String(str || '');
    if (str.length <= max) return str;
    return str.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  /* Seções e canais (Fase 1) — formato original de BUSCA_SECOES,
     só "traduzido" para o formato comum que todas as fontes da busca
     passam a usar a partir da Fase 2 (kindKey/contexto). Nada no
     conteúdo de js/data/busca-secoes.js muda. */
  function normalizarItemSecao(item){
    var externo = item.tipo === 'externa';
    return {
      kindKey: externo ? 'canal' : 'secao',
      titulo: item.titulo,
      resumo: item.resumo,
      termos: item.termos || [],
      contexto: externo ? 'Canal do CAEF' : 'Seção do portal',
      tipo: item.tipo,
      destino: item.destino,
      /* Opcional: permite que um item de js/data/busca-secoes.js aponte
         para um bloco específico dentro da própria seção (mesmo
         mecanismo de foco/rolagem já usado pelos itens de Fase 2,
         como um aviso dentro de #mural) — sem precisar ser uma aba
         própria. Ex.: a Central do Estudante mora dentro de #inicio. */
      focusId: item.focusId
    };
  }

  /* Avisos do Mural (Fase 2) — lê window.caefAvisosPublicados, a
     mesma lista já filtrada por situação de publicação e validade
     que o próprio Mural usa. Nunca refaz esse filtro aqui. */
  function itensDeAvisos(){
    var lista = window.caefAvisosPublicados;
    if (!lista || !lista.length) return [];
    return lista.map(function(a){
      return {
        kindKey: 'aviso',
        titulo: a.titulo,
        resumo: a.texto,
        termos: [a.origem || ''],
        contexto: 'Aviso',
        tipo: 'interna',
        destino: '#mural',
        focusId: 'aviso-' + a.id
      };
    });
  }

  /* Oportunidades do Radar (Fase 2) — lê
     window.caefOportunidadesAutorizadas, a mesma lista já filtrada
     por autorização de divulgação que o próprio Radar usa. O rótulo
     mostrado sempre inclui o estado real (Com vagas / Consultar
     disponibilidade / Seleção encerrada) — nunca um texto genérico
     que possa sugerir vaga confirmada quando não é o caso. */
  function itensDeOportunidades(){
    var lista = window.caefOportunidadesAutorizadas;
    if (!lista || !lista.length) return [];
    var TYPE_LABEL = {extensao:'Extensão', pesquisa:'Pesquisa/Laboratório', monitoria:'Monitoria', evento:'Evento'};
    var AVAIL_LABEL = {vagas:'Com vagas', consultar:'Consultar disponibilidade', encerrado:'Seleção encerrada'};
    return lista.map(function(o){
      var tipoLabel = TYPE_LABEL[o.type] || o.type || 'Oportunidade';
      var availLabel = (o.status && AVAIL_LABEL[o.status.availability]) || 'Consultar disponibilidade';
      return {
        kindKey: 'oportunidade',
        titulo: o.shortTitle || o.title,
        resumo: o.description || '',
        termos: [o.area || '', o.coordinator || ''],
        contexto: tipoLabel + ' · ' + availLabel,
        tipo: 'interna',
        oportunidadeId: o.id
      };
    });
  }

  /* Atividades do CAEF Formação (Fase 2) — lê window.caefFormacaoBusca
     (a lista da Formação já sem "encerradas"; ver o bloco CAEF
     FORMAÇÃO). O rótulo sempre mostra a situação real (Planejada ou
     Confirmada), nunca um texto genérico. */
  function itensDeFormacao(){
    var lista = window.caefFormacaoBusca;
    if (!lista || !lista.length) return [];
    return lista.map(function(f){
      var situacao = f.status === 'confirmada' ? 'Confirmada' : 'Planejada';
      return {
        kindKey: 'formacao',
        titulo: f.titulo,
        resumo: f.descricao || '',
        termos: [f.formato || ''],
        contexto: 'Atividade de formação · ' + situacao,
        tipo: 'interna',
        destino: '#formacao',
        focusId: 'form-' + f.id
      };
    });
  }

  /* Cartões temáticos das Trilhas de saúde e Trilhas CCHLA (Fase 2) —
     sem arquivo de dados próprio: lê direto os cartões ".trail-card"
     já publicados em index.html (cada um já tem id próprio). Os
     nomes das disciplinas de cada cartão viram "termos", para que
     buscar por uma disciplina (ex.: "fisioterapia") encontre o
     cartão que a contém — a navegação chega até o cartão, não até a
     disciplina individual dentro dele (fica para uma rodada futura).
     Aprovado nesta fase só o nível de cartão temático. */
  function itensDeTrilhas(){
    var cards = document.querySelectorAll('.trail-card[id]');
    if (!cards.length) return [];
    return Array.prototype.map.call(cards, function(card){
      var secao = card.closest('section[id]');
      var secaoId = secao ? secao.id : 'trilhas';
      var tituloEl = card.querySelector('.trail-head h3');
      var titulo = tituloEl ? tituloEl.textContent.trim() : '';
      var nomes = Array.prototype.map.call(card.querySelectorAll('.d-name'), function(n){ return n.textContent.trim(); });
      return {
        kindKey: 'trilha',
        titulo: titulo,
        resumo: nomes.length ? ('Inclui: ' + nomes.join(', ')) : '',
        termos: nomes,
        contexto: secaoId === 'trilhas-cchla' ? 'Trilha CCHLA' : 'Trilha de disciplinas de saúde',
        tipo: 'interna',
        destino: '#' + secaoId,
        focusId: card.id
      };
    });
  }

  /* V28 — item 1: o índice já foi montado só UMA VEZ, de forma
     síncrona, no carregamento da página. Isso quebrava a sincronização
     quando useSupabaseContent=true: bootstrapMural()/bootstrapRadar()
     passaram a ser assíncronos (Promise do Supabase), então este
     índice terminava de montar ANTES de window.caefAvisosPublicados e
     window.caefOportunidadesAutorizadas chegarem — a Busca Geral ficava
     permanentemente sem avisos/oportunidades até um reload completo da
     página. Agora "montarIndice" é uma função reaproveitável: roda uma
     vez no carregamento (com o que já estiver disponível na hora) e de
     novo sempre que o Mural ou o Radar (re)carregarem seus dados —
     inclusive depois de uma publicação, edição, arquivamento ou
     exclusão feita no próprio Painel de Gestão, sem recarregar a
     página. Seções/canais (Fase 1) e Trilhas nunca mudam depois do
     carregamento, então recalculá-los de novo a cada atualização é
     redundante mas inofensivo — a lista de destinos é pequena. */
  var todosItens, INDEX;
  function montarIndice(){
    todosItens = BUSCA_SECOES.map(normalizarItemSecao)
      .concat(itensDeAvisos())
      .concat(itensDeOportunidades())
      .concat(itensDeFormacao())
      .concat(itensDeTrilhas());
    INDEX = todosItens.map(function(item){
      return {
        item: item,
        tituloPalavras: palavras(normalize(item.titulo)),
        termosPalavras: palavras(normalize((item.termos || []).join(' '))),
        resumoPalavras: palavras(normalize(item.resumo))
      };
    });
  }
  montarIndice();
  /* Reconstrói o índice sempre que o Mural ou o Radar (re)carregam seus
     dados (evento disparado pelos blocos MURAL DE AVISOS e RADAR CAEF,
     acima neste arquivo). Se o painel de busca já estiver aberto com
     um termo digitado, também atualiza os resultados visíveis na hora
     — sem isso, quem já tinha a busca aberta continuaria vendo
     resultados desatualizados até fechar e abrir de novo. */
  window.addEventListener('caef:conteudo-atualizado', function(){
    montarIndice();
    if (panel.classList.contains('open') && input.value.trim()){
      renderResults(input.value);
    }
  });

  /* Relevância: título > termos relacionados > resumo. Cada destino
     entra no máximo uma vez, na melhor posição que ele alcançar —
     nunca duplicado, mesmo que combine em mais de um campo. */
  function buscar(query){
    var termoPalavras = palavras(normalize(query));
    if (!termoPalavras.length) return [];
    var achados = [];
    INDEX.forEach(function(entry){
      var tier = -1;
      if (correspondePorPrefixo(entry.tituloPalavras, termoPalavras)) tier = 0;
      else if (correspondePorPrefixo(entry.termosPalavras, termoPalavras)) tier = 1;
      else if (correspondePorPrefixo(entry.resumoPalavras, termoPalavras)) tier = 2;
      if (tier !== -1) achados.push({ item: entry.item, tier: tier });
    });
    achados.sort(function(a, b){ return a.tier - b.tier; });
    return achados.map(function(a){ return a.item; });
  }

  function buildResultItem(item){
    var externo = item.tipo === 'externa';
    var a = document.createElement('a');
    a.className = 'search-result-item';
    if (item.kindKey === 'oportunidade'){
      /* Sem seção/âncora própria: o destino real é abrir o painel de
         detalhe da oportunidade. O href continua funcional (mesmo
         endereço que o botão "Compartilhar" do Radar já gera), para
         abrir em nova aba/janela funcionar normalmente — mas o clique
         normal é interceptado (ver o ouvinte de clique mais abaixo)
         para abrir o painel na hora, sem recarregar a página. */
      a.href = '?oportunidade=' + encodeURIComponent(item.oportunidadeId) + '#radar';
      a.dataset.kind = 'oportunidade';
      a.dataset.oportunidadeId = item.oportunidadeId;
    } else {
      a.href = item.destino;
      if (item.focusId) a.dataset.focusId = item.focusId;
    }
    if (externo){ a.target = '_blank'; a.rel = 'noopener'; }

    var nome = document.createElement('span');
    nome.className = 'search-result-name';
    nome.textContent = item.titulo + (externo ? ' ↗' : '');

    var contexto = document.createElement('span');
    contexto.className = 'search-result-context';
    contexto.textContent = item.contexto;

    var resumo = document.createElement('span');
    resumo.style.cssText = 'display:block;font-size:12.5px;color:var(--ink-muted);line-height:1.4;margin-top:2px;';
    resumo.textContent = truncar(item.resumo, 150);

    a.appendChild(nome); a.appendChild(contexto); a.appendChild(resumo);
    return a;
  }

  function renderResults(query){
    var termo = query.trim();
    resultsEl.replaceChildren();

    if (!termo){
      hintEl.hidden = false;
      emptyEl.hidden = true;
      resultsEl.hidden = true; resultsEl.classList.remove('show');
      countEl.textContent = '';
      return;
    }
    hintEl.hidden = true;

    var achados = buscar(termo);
    if (!achados.length){
      emptyEl.hidden = false;
      resultsEl.hidden = true; resultsEl.classList.remove('show');
      countEl.textContent = '';
      return;
    }
    emptyEl.hidden = true;
    countEl.textContent = achados.length + (achados.length === 1 ? ' resultado encontrado' : ' resultados encontrados');
    achados.forEach(function(item){ resultsEl.appendChild(buildResultItem(item)); });
    resultsEl.hidden = false; resultsEl.classList.add('show');
  }

  function getFocusable(){
    return Array.prototype.filter.call(
      panel.querySelectorAll('a,button,input,[tabindex]:not([tabindex="-1"])'),
      function(el){ return !el.hidden && el.offsetParent !== null; }
    );
  }

  function openPanel(){
    lastFocused = document.activeElement;
    /* Antes de tudo: tira o painel do estado inert, para que ele volte
       a fazer parte da sequência de tabulação e da árvore de
       acessibilidade assim que passa a estar visível. */
    panel.inert = false;
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggles.forEach(function(b){ b.setAttribute('aria-expanded', 'true'); });
    setBackgroundInert(true);
    input.value = '';
    clearBtn.hidden = true;
    renderResults('');
    /* pequeno atraso para não roubar o foco antes do navegador
       terminar de processar o clique/tecla que abriu o painel */
    setTimeout(function(){ input.focus(); }, 10);
  }

  /* opts.returnFocus === false: usado quando a busca vai entregar o
     foco a outro lugar (a seção de destino de um resultado interno)
     em vez de devolvê-lo ao botão do cabeçalho. Em todos os outros
     casos (Esc, clique fora, botão fechar, resultado externo) o foco
     volta para onde estava antes de abrir o painel, como antes. */
  function closePanel(opts){
    if (!panel.classList.contains('open')) return;
    var returnFocus = !opts || opts.returnFocus !== false;
    overlay.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
    toggles.forEach(function(b){ b.setAttribute('aria-expanded', 'false'); });
    setBackgroundInert(false);
    /* Devolve o foco ANTES de tornar o painel inert: um elemento não
       pode ficar com foco e inert ao mesmo tempo, e o navegador não
       aceita marcar como inert um elemento que ainda contém o foco. */
    if (returnFocus && lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
    /* Quando returnFocus é false, o foco ainda pode estar em algo
       dentro do painel (ex.: o resultado clicado) neste exato momento
       — focusDestino só move o foco para o destino real um instante
       depois (setTimeout). Um elemento não pode ficar com foco e
       inert ao mesmo tempo, então tiramos o foco de dentro do painel
       antes de marcá-lo inert; o destino final assume o foco em
       seguida, normalmente. */
    if (panel.contains(document.activeElement) && document.activeElement.blur) document.activeElement.blur();
    /* Painel fechado: sai por completo da sequência de tabulação e da
       árvore de acessibilidade (não só visualmente, via transform).
       Sem isso, o botão de fechar e o campo de busca continuavam
       alcançáveis por Tab mesmo com o painel fora da tela, e o
       cancelamento de Tab do handler abaixo prendia o foco entre os
       dois para sempre. */
    panel.inert = true;
  }

  toggles.forEach(function(btn){
    btn.addEventListener('click', function(){
      if (panel.classList.contains('open')) closePanel();
      else openPanel();
    });
  });
  /* Chamadas sem argumento (não repassar o evento de clique como
     "opts") para sempre cair no comportamento padrão: devolver o
     foco para onde estava antes de abrir o painel. */
  closeBtn.addEventListener('click', function(){ closePanel(); });
  overlay.addEventListener('click', function(){ closePanel(); });

  input.addEventListener('input', function(){
    clearBtn.hidden = (input.value === '');
    renderResults(input.value);
  });
  clearBtn.addEventListener('click', function(){
    input.value = ''; clearBtn.hidden = true; renderResults(''); input.focus();
  });

  /* Clicar (ou ativar por Enter) num resultado fecha o painel; a
     navegação em si é feita pelo próprio link — reaproveitando o
     roteador de abas já existente (activateTab) para seções internas,
     e o comportamento nativo do navegador para "#creditos" e para os
     canais externos (target="_blank"). Nada aqui reimplementa isso.

     Oportunidade do Radar (Fase 2): é o único caso sem uma âncora
     própria — o destino real é abrir o mesmo painel de detalhe do
     Radar. Por isso o clique padrão é interceptado (preventDefault) e
     a busca fecha ANTES de chamar window.caefOpenOportunidade — nessa
     ordem, o fundo já deixou de estar inert e o painel de busca já
     está fechado quando o painel do Radar abre por cima (é exatamente
     o que evita o painel de busca "preso" aberto ou o conteúdo da
     página marcado como inert por engano).

     Foco após a navegação: para um resultado interno com seção
     própria (seção do portal, aviso, atividade de formação, trilha),
     o foco não volta para o botão de busca — ele segue para o próprio
     destino (focusDestino): a seção inteira, quando é o caso da Fase
     1, ou o item específico dentro dela (com rolagem e destaque),
     quando é um aviso/atividade/cartão de trilha da Fase 2. Isso só
     pode acontecer depois que o roteador de abas (ouvinte de clique
     global, em document) já tiver ativado a seção — por isso o
     pequeno atraso. Para um resultado externo (canal do CAEF), como o
     documento atual não navega para lugar nenhum, o foco continua
     voltando ao botão de busca, como antes. Para a oportunidade do
     Radar, o foco vai para o botão de fechar do painel de detalhe que
     acabou de abrir. */
  resultsEl.addEventListener('click', function(e){
    var link = e.target.closest('a.search-result-item');
    if (!link) return;

    if (link.dataset.kind === 'oportunidade'){
      e.preventDefault();
      var oportunidadeId = link.dataset.oportunidadeId;
      closePanel({ returnFocus: false });
      /* O próprio painel de detalhe do Radar agora cuida do foco
         inicial ao abrir (foca o botão de fechar) e sabe, ao fechar,
         que não deve tentar devolver o foco a um resultado que ficou
         dentro deste painel de busca já fechado e inert — por isso
         não é mais preciso focar nada aqui manualmente. */
      if (typeof window.caefOpenOportunidade === 'function'){
        window.caefOpenOportunidade(oportunidadeId);
      }
      return;
    }

    var externo = link.target === '_blank';
    if (externo){
      closePanel();
      return;
    }
    var destino = link.getAttribute('href') || '';
    var destinoId = destino.charAt(0) === '#' ? destino.slice(1) : '';
    var focusId = link.dataset.focusId || destinoId;
    var comRolagem = !!link.dataset.focusId;
    closePanel({ returnFocus: false });
    if (focusId){
      setTimeout(function(){ focusDestino(focusId, { scroll: comRolagem }); }, 20);
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });

  panel.addEventListener('keydown', function(e){
    /* Defesa extra: o atributo inert já impede o painel fechado de
       receber foco (e portanto este handler nem chegaria a rodar a
       partir dele), mas a checagem explícita documenta a intenção e
       protege contra qualquer futura mudança que pare de usar inert. */
    if (!panel.classList.contains('open')) return;
    if (e.key === 'Tab'){
      var focusable = getFocusable();
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var items = Array.prototype.slice.call(resultsEl.querySelectorAll('.search-result-item'));
    if (!items.length) return;
    var idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown'){
      e.preventDefault();
      if (idx === -1){ items[0].focus(); }
      else if (idx < items.length - 1){ items[idx + 1].focus(); }
    } else {
      e.preventDefault();
      if (idx === -1 || idx === 0){ input.focus(); }
      else { items[idx - 1].focus(); }
    }
  });
})();
