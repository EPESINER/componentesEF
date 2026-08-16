(function(){
  // ---------- Tabs ----------
  const tabLinks = document.querySelectorAll('nav.subnav a');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const tabIds = Array.prototype.map.call(tabPanels, function(p){ return p.id; });

  function activateTab(id, opts){
    opts = opts || {};
    if (tabIds.indexOf(id) === -1) return;
    tabPanels.forEach(function(p){ p.classList.toggle('active', p.id === id); });
    tabLinks.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
    if (!opts.silent && window.scrollTo){
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
    if (!opts.noHash && history.replaceState){
      history.replaceState(null, '', '#' + id);
    }
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (tabIds.indexOf(id) !== -1){
      e.preventDefault();
      activateTab(id);
      return;
    }
    var target = document.getElementById(id);
    if (target){
      e.preventDefault();
      jumpTo(target);
    }
  });

  // ---------- Mega nav: só um dropdown aberto por vez ----------
  var navGroups = document.querySelectorAll('.mega-nav-group');
  navGroups.forEach(function(group){
    group.addEventListener('toggle', function(){
      if (group.open){
        navGroups.forEach(function(other){
          if (other !== group) other.open = false;
        });
      }
    });
  });

  (function initTab(){
    var initial = (location.hash || '').replace('#', '');
    if (tabIds.indexOf(initial) === -1) initial = tabIds[0];
    activateTab(initial, {silent: true, noHash: true});
  })();

  // ---------- Global search ----------
  const searchInput = document.getElementById('globalSearch');
  const searchClear = document.getElementById('searchClear');
  const searchCount = document.getElementById('searchCount');
  const searchResultsEl = document.getElementById('searchResults');
  const searchable = document.querySelectorAll('[data-search]');
  const laps = document.querySelectorAll('details.lap');
  const trailCards = document.querySelectorAll('.trail-card');
  const MAX_RESULTS = 30;

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
      } else {
        context = courseLabel || 'Comparativo';
      }
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
      title = 'Bloco de optativas';
      context = cl2;
    } else if (el.classList.contains('mural-card')){
      var muralH3 = el.querySelector('h3');
      var muralTag = el.querySelector('.mural-tag');
      title = muralH3 ? muralH3.textContent.trim() : el.textContent.trim().slice(0,70);
      context = 'Mural' + (muralTag ? ' · ' + muralTag.textContent.trim() : '');
    } else {
      title = el.textContent.trim().slice(0,70);
      context = '';
    }
    return {title: title, context: context, el: el};
  }

  function jumpTo(el){
    searchInput.value = '';
    runSearch();
    var panel = el.closest('.tab-panel');
    if (panel) activateTab(panel.id, {silent: true});
    var lapDetails = el.closest('details.lap');
    if (lapDetails) lapDetails.open = true;
    setTimeout(function(){
      if (el.scrollIntoView){
        try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e) { el.scrollIntoView(); }
      }
      el.classList.remove('search-jump');
      void el.offsetWidth;
      el.classList.add('search-jump');
    }, 30);
  }

  function renderResults(matchedEls){
    searchResultsEl.innerHTML = '';
    if (!matchedEls.length){
      searchResultsEl.classList.remove('show');
      searchResultsEl.hidden = true;
      return;
    }
    var shown = matchedEls.slice(0, MAX_RESULTS);
    shown.forEach(function(el){
      var info = getItemInfo(el);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-result-item';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'search-result-name';
      nameSpan.textContent = info.title;
      btn.appendChild(nameSpan);
      if (info.context){
        var ctxSpan = document.createElement('span');
        ctxSpan.className = 'search-result-context';
        ctxSpan.textContent = info.context;
        btn.appendChild(ctxSpan);
      }
      btn.addEventListener('click', function(){ jumpTo(info.el); });
      searchResultsEl.appendChild(btn);
    });
    if (matchedEls.length > MAX_RESULTS){
      var more = document.createElement('div');
      more.className = 'search-results-more';
      more.textContent = '+ ' + (matchedEls.length - MAX_RESULTS) + ' resultado(s) a mais — refine sua busca para ver todos';
      searchResultsEl.appendChild(more);
    }
    searchResultsEl.hidden = false;
    searchResultsEl.classList.add('show');
  }

  function runSearch(){
    const q = searchInput.value.trim().toLowerCase();
    let matched = [];
    searchable.forEach(function(el){
      const show = q === '' || el.textContent.toLowerCase().includes(q);
      el.classList.toggle('search-hide', !show);
      if (show && q !== '') matched.push(el);
    });

    searchClear.hidden = (searchInput.value === '');

    if (q !== '') {
      laps.forEach(function(d){
        const hasVisible = d.querySelector('[data-search]:not(.search-hide)');
        d.classList.toggle('search-all-hidden', !hasVisible);
        if (hasVisible) d.open = true;
      });
      trailCards.forEach(function(c){
        const hasVisible = c.querySelector('[data-search]:not(.search-hide)');
        c.classList.toggle('search-all-hidden', !hasVisible);
      });
      searchCount.textContent = matched.length + (matched.length === 1 ? ' resultado' : ' resultados');
      renderResults(matched);
    } else {
      laps.forEach(function(d){ d.classList.remove('search-all-hidden'); });
      trailCards.forEach(function(c){ c.classList.remove('search-all-hidden'); });
      searchCount.textContent = '';
      searchResultsEl.hidden = true;
      searchResultsEl.classList.remove('show');
    }
  }
  if (searchInput) searchInput.addEventListener('input', runSearch);
  if (searchClear) searchClear.addEventListener('click', function(){
    searchInput.value = '';
    runSearch();
    searchInput.focus();
  });

  // ---------- Level-by-level comparator ----------
  const LEVELS = {"bach": {"1": {"total": "375h", "items": [["Bioquímica Aplicada à Educação Física", "60h"], ["Crescimento e Desenvolvimento", "60h"], ["Produção e Veiculação do Conhecimento em EF", "60h"], ["Fundamentos Didático-Pedagógicos do Esporte", "60h"], ["Anatomia Aplicada à Educação Física", "75h"], ["Fisiologia Humana I", "60h"]]}, "2": {"total": "405h", "items": [["Atletismo", "60h"], ["Fundamentos Epistemológicos da EF", "45h"], ["Fisiologia da Atividade Física (Bach)", "60h"], ["Ginástica Artística", "60h"], ["Fundamentos Históricos e Filosóficos da EF e do Esporte", "45h"], ["Futebol", "60h"], ["Nutrição e Atividade Física", "45h"]]}, "3": {"total": "435h", "items": [["Dança", "60h"], ["Natação", "60h"], ["Pesquisa Aplicada à Educação Física", "60h"], ["Atividades Físicas em Academia I", "60h"], ["Cinesiologia e Biomecânica Aplicada à EF", "60h"], ["Handebol", "60h"], ["Primeiros Socorros", "30h"]]}, "4": {"total": "420h", "items": [["Atividade Física e Saúde", "45h"], ["Futsal", "60h"], ["Treinamento Desportivo I", "60h"], ["Medidas e Avaliação em EF I", "60h"], ["Voleibol", "60h"], ["Lazer e Sociedade", "45h"], ["Análise e Interpretação de Dados em EF", "45h"]]}, "5": {"total": "540h", "items": [["Treinamento Desportivo II", "45h"], ["Judô", "60h"], ["Atividade Física e Terceira Idade", "45h"], ["Atividades Físicas para Grupos Especiais", "60h"], ["Aprendizagem e Controle Motor", "60h"], ["Estágio Profissional Supervisionado em Esportes I", "105h"]]}, "6": {"total": "540h", "items": [["Sociologia do Desporto", "45h"], ["Ginástica Rítmica", "60h"], ["Ética Profissional na EF", "45h"], ["Basquetebol", "60h"], ["Prescrição de Exercícios Físicos", "60h"], ["Desporto Adaptado", "60h"], ["Administração e Marketing em EF", "45h"], ["Estágio Profissional Supervisionado em Esportes II", "105h"]]}, "7": {"total": "585h", "items": [["Seminário de Monografia I — TCC I", "60h"], ["Psicologia do Esporte", "45h"], ["Organização e Gestão Desportiva", "45h"], ["Musculação", "45h"], ["Estágio Prof. Superv. em Atividade Física, Lazer e Saúde", "195h"]]}, "8": {"total": "60h", "items": [["Seminário de Monografia II — TCC II", "30h"]]}}, "lic": {"1": {"total": "375h", "items": [["Fundamentos Psicológicos da Educação", "60h"], ["Fundamentos Antropofilosóficos da Educação", "60h"], ["Crescimento e Desenvolvimento", "60h"], ["Produção e Veiculação do Conhecimento em EF", "60h"], ["Anatomia Aplicada à EF", "75h"], ["Libras", "60h"]]}, "2": {"total": "465h", "items": [["Atletismo", "60h"], ["Fundamentos Epistemológicos da EF", "45h"], ["Ginástica Artística", "60h"], ["Futebol", "60h"], ["Dança", "60h"], ["Educação Física e Saúde", "30h"], ["Fisiologia Humana I", "60h"], ["Nutrição e Atividade Física", "45h"]]}, "3": {"total": "495h", "items": [["Didática", "60h"], ["Fundamentos Históricos e Filosóficos da EF e do Esporte", "45h"], ["Educação Física Infantil", "60h"], ["Fisiologia da Atividade Física (Lic)", "60h"], ["Natação", "60h"], ["Ginástica Rítmica", "60h"], ["Primeiros Socorros", "30h"]]}, "4": {"total": "525h", "items": [["Pesquisa Aplicada à EF", "60h"], ["Cinesiologia e Biomecânica Aplicada à EF", "60h"], ["Handebol", "60h"], ["Voleibol", "60h"], ["Aprendizagem e Controle Motor", "60h"], ["Ética Profissional na EF", "45h"], ["Didática Aplicada à EF", "45h"]]}, "5": {"total": "585h", "items": [["Fundamentos Sócio-Históricos da Educação", "60h"], ["Psicologia da Aprendizagem", "60h"], ["Futsal", "60h"], ["Medidas e Avaliação em EF I", "60h"], ["Análise e Interpretação de Dados em EF", "45h"], ["Judô", "60h"], ["Estágio Profissional Supervisionado I", "150h"]]}, "6": {"total": "525h", "items": [["Treinamento Desportivo I", "60h"], ["Basquetebol", "60h"], ["Manifestações Culturais", "45h"], ["Pedagogia do Lazer", "45h"], ["Estágio Profissional Supervisionado II", "150h"]]}, "7": {"total": "360h", "items": [["Política e Gestão da Educação", "60h"], ["Organização de Eventos e Competições Escolares", "30h"], ["Educação Física Especial", "45h"], ["Seminário de Monografia I — TCC I", "60h"], ["Estágio Profissional Supervisionado III", "105h"]]}, "8": {"total": "120h", "items": [["Seminário de Monografia II — TCC II", "30h"]]}}};
  const levelBachEl = document.getElementById('levelBach');
  const levelLicEl = document.getElementById('levelLic');
  const levelBachTotal = document.getElementById('levelBachTotal');
  const levelLicTotal = document.getElementById('levelLicTotal');
  const pills = document.querySelectorAll('.level-pill');

  function renderLevel(n){
    const b = LEVELS.bach[n], l = LEVELS.lic[n];
    levelBachEl.innerHTML = b.items.map(function(it){ return '<li>' + it[0] + '<span>' + it[1] + '</span></li>'; }).join('');
    levelLicEl.innerHTML = l.items.map(function(it){ return '<li>' + it[0] + '<span>' + it[1] + '</span></li>'; }).join('');
    levelBachTotal.textContent = b.total;
    levelLicTotal.textContent = l.total;
  }
  pills.forEach(function(p){
    p.addEventListener('click', function(){
      pills.forEach(function(x){ x.classList.remove('active'); });
      p.classList.add('active');
      renderLevel(p.dataset.level);
    });
  });
  if (pills.length) renderLevel('1');

  // ---------- Quiz ----------
  const QUIZ = {
    rendimento: {
      title: 'Preparador físico / esporte de rendimento',
      desc: 'Seu caminho passa pelo Bacharelado, com forte apoio da trilha de Clínica e Reabilitação e de Sociologia/Antropologia do esporte para embasar seu trabalho com atletas.',
      tags: ['Fisioterapia Desportiva', 'Cinesiologia', 'Biomecânica', 'Traumatologia', 'Ortopedia'],
      anchor: '#trilha-clinica-reabilitacao'
    },
    clinica: {
      title: 'Personal trainer / academia clínica',
      desc: 'Bacharelado com ênfase em fisiologia aplicada e nutrição esportiva — a base para atuar com populações clínicas em academias e estúdios.',
      tags: ['Fisiologia do Exercício', 'Farmacologia Básica', 'Nutrição e Atividade Física', 'Avaliação Nutricional'],
      anchor: '#trilha-nutricao-esportiva'
    },
    escola: {
      title: 'EF escolar / inclusiva (Licenciatura)',
      desc: 'A Licenciatura é o caminho natural, reforçada pelas trilhas de humanidades do CCHLA — psicologia da aprendizagem, Libras e inclusão.',
      tags: ['Psicologia Educacional', 'Libras I–VI', 'Didática da Libras', 'Currículo e Trabalho Pedagógico'],
      anchor: '#trilha-inclusao-libras'
    },
    comunidade: {
      title: 'Educação Física social / projetos comunitários',
      desc: 'Bacharelado ou Licenciatura funcionam — o que mais importa aqui é reforçar com Serviço Social e Sociologia, voltado à atuação em comunidades e políticas sociais.',
      tags: ['Trabalho com Comunidade I e II', 'Terceiro Setor', 'Sociologia da Juventude', 'Direitos Humanos e Cidadania'],
      anchor: '#trilha-servico-social'
    },
    pesquisa: {
      title: 'Pesquisa acadêmica / pós-graduação',
      desc: 'Qualquer um dos dois cursos serve de base — o essencial é reforçar metodologia científica e as disciplinas de ciências humanas que dão profundidade teórica à pesquisa em Educação Física.',
      tags: ['Bioestatística', 'Epidemiologia', 'Antropologia Cultural e da Saúde', 'Sociologia da Juventude/Trabalho'],
      anchor: '#trilha-sociologia-antropologia'
    }
  };

  const quizOpts = document.querySelectorAll('.quiz-opt');
  const quizResult = document.getElementById('quizResult');
  const quizTitle = document.getElementById('quizResultTitle');
  const quizDesc = document.getElementById('quizResultDesc');
  const quizTags = document.getElementById('quizResultTags');
  const quizLink = document.getElementById('quizResultLink');

  quizOpts.forEach(function(btn){
    btn.addEventListener('click', function(){
      quizOpts.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      const data = QUIZ[btn.dataset.key];
      quizTitle.textContent = data.title;
      quizDesc.textContent = data.desc;
      quizTags.innerHTML = data.tags.map(function(t){ return '<span>' + t + '</span>'; }).join('');
      quizLink.href = data.anchor;
      quizResult.hidden = false;
      if (quizResult.scrollIntoView) {
        try { quizResult.scrollIntoView({behavior: 'smooth', block: 'nearest'}); } catch(e) {}
      }
    });
  });
})();