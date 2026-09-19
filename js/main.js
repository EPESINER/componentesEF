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

  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var openGroup = a.closest('.nav-group');
    if (openGroup) openGroup.open = false;
    var navCheck = document.getElementById('navCheck');
    if (navCheck) navCheck.checked = false;
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
    function renderLevel(n){
      var b = LEVELS.bach[n], l = LEVELS.lic[n];
      levelBachEl.innerHTML = b.items.map(function(it){ return '<li>'+it[0]+'<span>'+it[1]+'</span></li>'; }).join('');
      levelLicEl.innerHTML = l.items.map(function(it){ return '<li>'+it[0]+'<span>'+it[1]+'</span></li>'; }).join('');
      levelBachTotal.textContent = b.total; levelLicTotal.textContent = l.total;
    }
    pills.forEach(function(p){
      p.addEventListener('click', function(){
        pills.forEach(function(x){ x.classList.remove('active'); });
        p.classList.add('active'); renderLevel(p.dataset.level);
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
  if (radarGrid && typeof OPORTUNIDADES !== 'undefined'){
    /* Segurança informacional: só publica no Radar quem tem
       authorized === true de forma explícita. Um item sem o campo
       preenchido (ex.: esquecido ao copiar um modelo) fica de fora
       por padrão, em vez de aparecer por engano. */
    var ALL = OPORTUNIDADES.filter(function(o){ return o.authorized === true; });
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
        label.innerHTML = '<input type="checkbox" value="'+v+'"><span>'+labelFn(v)+'</span><span class="fc">'+count+'</span>';
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
        '<button class="opp-card" type="button" data-id="'+o.id+'">'+
          '<div class="opp-top">'+
            '<span class="opp-type '+typeClass+'">'+(TYPE_LABEL[o.type]||o.type)+'</span>'+
            '<span class="opp-status '+statusDotClass(o.status.availability)+'"><i class="dot"></i>'+statusText(o.status.availability,o.status.note)+'</span>'+
          '</div>'+
          '<h3>'+(o.shortTitle||o.title)+'</h3>'+
          '<div class="opp-area">'+(o.area||'')+(o.coordinator?' · '+o.coordinator:'')+'</div>'+
          (meta.length ? '<div class="opp-meta">'+meta.map(function(m){return '<span>'+m+'</span>';}).join('')+'</div>' : '')+
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

    function field(label, value){
      if (!value) return '';
      return '<div class="detail-field"><dt>'+label+'</dt><dd>'+value+'</dd></div>';
    }

    function openDetail(id){
      var o = ALL.filter(function(x){return x.id===id;})[0];
      if (!o) return;
      var html = '<h2>'+o.title+'</h2>'+
        '<div class="opp-top" style="margin-bottom:16px;">'+
          '<span class="opp-type '+o.type+'">'+(TYPE_LABEL[o.type]||o.type)+'</span>'+
          '<span class="opp-status '+statusDotClass(o.status.availability)+'"><i class="dot"></i>'+statusText(o.status.availability,o.status.note)+'</span>'+
        '</div>'+
        field('Área', o.area) +
        field('Laboratório / grupo', o.labName) +
        field('Coordenação', o.coordinator) +
        field('Contato', o.contact) +
        field('Descrição', o.description) +
        field('Público', o.audience) +
        field('Modalidade de participação', o.participationType) +
        field('Modalidades de ingresso', o.modalities ? o.modalities.join(', ') : '') +
        field('Carga horária', o.workload) +
        field('Dedicação semanal', o.dedication) +
        field('Turno', (o.shifts||[]).join(', ')) +
        field('Nível', o.level ? o.level.join(', ') : '') +
        field('Pré-requisitos', o.requirements) +
        field('Processo seletivo', o.selection + (o.selectionLink ? ' — <a href="'+o.selectionLink+'" target="_blank" rel="noopener">acessar formulário</a>' : '')) +
        field('Duração prevista', o.duration) +
        field('Vínculo com pós-graduação', o.postgrad === true ? 'Sim' : (o.postgrad === false ? 'Não' : '')) +
        '<p class="detail-updated">Atualizado em: '+(o.lastUpdated||'não informado')+'. Informação organizada pelo CAEF a partir de mapeamento direto com o(a) coordenador(a). Confirme os detalhes finais com o responsável.</p>'+
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
      overlay.classList.add('open'); panel.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeDetail(){
      overlay.classList.remove('open'); panel.classList.remove('open');
      document.body.style.overflow = '';
    }
    overlay.addEventListener('click', closeDetail);
    document.getElementById('detailClose').addEventListener('click', closeDetail);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeDetail(); });

    render();
    var linkedId = new URLSearchParams(window.location.search).get('oportunidade');
    if (linkedId && ALL.some(function(o){return o.id===linkedId;})){
      /* Ativa a aba do Radar de verdade (não só o hash da URL), senão
         quem abre um link compartilhado vê o painel de detalhe sobre
         a página Início em vez de sobre os resultados do Radar. */
      activateTab('radar', {silent:true});
      openDetail(linkedId);
    }
  }

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
        return '<div class="formation-card">'+
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
  }

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


/* Guia "Por onde começar?". Não coleta dados e utiliza as rotas já existentes. */
(function(){
  'use strict';
  var start=document.getElementById('startGuideServices');
  var first=document.getElementById('startGuideStepOne');
  var second=document.getElementById('startGuideStepTwo');
  var back=document.getElementById('startGuideBack');
  var result=document.getElementById('startGuideResult');
  if(!start||!first||!second||!back||!result)return;
  var options=Array.prototype.slice.call(second.querySelectorAll('[data-service]'));
  var title=document.getElementById('startGuideResultTitle');
  var desc=document.getElementById('startGuideResultText');
  var link=document.getElementById('startGuideResultLink');
  var services={
    acervo:{title:'Acervo Acadêmico Digital',description:'Consulte as fontes de estudo e os materiais acadêmicos reunidos pelo CAEF.',href:'#acervo',action:'Ir para o Acervo'},
    apadrinhamento:{title:'Apadrinhamento Acadêmico',description:'Conheça o programa de acolhimento e acompanhamento entre estudantes.',href:'#apadrinhamento',action:'Conhecer o programa'},
    ouvidoria:{title:'Ouvidoria CAEF',description:'Acesse o canal para encaminhar uma dúvida, sugestão ou manifestação ao CAEF.',href:'#ouvidoria',action:'Ir para a Ouvidoria'},
    central:{title:'Central de Serviços',description:'Veja os serviços e as demais áreas do portal na central de navegação.',href:'#sobre-portal',action:'Ver a central de navegação'}
  };
  start.addEventListener('click',function(){first.hidden=true;second.hidden=false;start.setAttribute('aria-expanded','true');options[0].focus();});
  back.addEventListener('click',function(){second.hidden=true;first.hidden=false;result.hidden=true;start.setAttribute('aria-expanded','false');options.forEach(function(o){o.setAttribute('aria-pressed','false');});start.focus();});
  options.forEach(function(option){option.addEventListener('click',function(){
    var data=services[option.getAttribute('data-service')];if(!data)return;
    options.forEach(function(o){o.setAttribute('aria-pressed',String(o===option));});
    title.textContent=data.title;desc.textContent=data.description;link.href=data.href;link.firstChild.textContent=data.action+' ';result.hidden=false;
  });});
  /* #sobre-portal é uma seção dentro da Home; o roteador só troca painéis. */
  link.addEventListener('click',function(e){if(link.getAttribute('href')!=='#sobre-portal')return;
    e.preventDefault();if(typeof window.caefActivateTab==='function')window.caefActivateTab('inicio');
    history.replaceState(null,'','#sobre-portal');
    var hub=document.getElementById('sobre-portal');if(hub)hub.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
})();
