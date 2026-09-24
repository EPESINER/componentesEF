/* CAEF V29 — Central de Demandas + Percurso Acadêmico
   Carregue após js/area-estudante.js. */
(function(){
'use strict';
var cfg=window.CAEF_STUDENT_CONFIG||{}, pubP=null, state={authenticated:false,isAdmin:false}, user=null, profile=null, feed=[], comments={}, votes={};
var avatarCache=new Map();
var CAT={ensino:'Ensino',formacao:'Formação',acervo:'Acervo',eventos:'Eventos',infraestrutura:'Infraestrutura',outras:'Outras'};
var SIT={recebida:'Recebida',em_analise:'Em análise',encaminhada:'Encaminhada',concluida:'Concluída'};
var MOD={pendente:'Aguardando moderação',aprovada:'Publicada',recusada:'Não publicada',oculta:'Oculta'};
var STEPS=[
['explorar_habilitacoes','Entender Bacharelado e Licenciatura','#comparativo'],
['consultar_grade','Consultar minha matriz curricular','#comparativo'],
['planejar_periodo','Planejar o período','#comparativo'],
['explorar_trilhas','Explorar optativas e trilhas','#trilhas'],
['consultar_acervo','Montar minhas referências de estudo','#acervo'],
['conhecer_projetos','Conhecer pesquisa e extensão','#pesquisa'],
['acompanhar_radar','Acompanhar oportunidades','#radar'],
['consultar_estagios','Revisar estágios e atividades especiais','#atividades'],
['planejar_tcc','Preparar a etapa de TCC','#comparativo']
];
function esc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function tell(el,msg,err){if(!el)return;el.textContent=msg||'';el.classList.toggle('v29err',!!err)}
function date(x){try{return new Date(x).toLocaleDateString('pt-BR')}catch(_){return''}}
function initials(x){return (String(x||'Estudante').trim().split(/\s+/).map(function(v){return v[0]||''}).join('').slice(0,2)||'E').toUpperCase()}
function sdk(){if(window.supabase)return Promise.resolve();return new Promise(function(ok,no){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function pub(){if(pubP)return pubP;pubP=sdk().then(function(){return window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})});return pubP}
function auth(){return window.caefStudentClient?Promise.resolve(window.caefStudentClient):Promise.reject(new Error('Entre na Área do Estudante para participar.'))}

function styles(){
if(document.getElementById('v29css'))return;var s=document.createElement('style');s.id='v29css';s.textContent=`
.v29sec{padding:58px 0;background:#f8fbf6;border-top:1px solid var(--line)}.v29head{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;flex-wrap:wrap}.v29head p{max-width:760px;color:var(--ink-muted);line-height:1.6}.v29tools{display:flex;gap:10px;flex-wrap:wrap;margin:22px 0}.v29tools select,.v29form input,.v29form select,.v29form textarea{font:inherit;border:1px solid #a5b9aa;border-radius:9px;background:#fff;padding:11px 12px}.v29feed{display:grid;gap:15px}.v29card{background:#fff;border:1px solid #dce4d7;border-radius:17px;padding:20px}.v29top{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}.v29who{display:flex;gap:10px;align-items:center}.v29ava{width:40px;height:40px;border-radius:50%;background:#0b633b;color:#fff;display:grid;place-items:center;font-weight:800;overflow:hidden}.v29ava img{width:100%;height:100%;object-fit:cover}.v29meta{font-size:12.5px;color:var(--ink-faint)}.v29badges{display:flex;gap:7px;flex-wrap:wrap}.v29badge{font-size:11.5px;font-weight:800;padding:5px 8px;border-radius:999px;background:#eef5ec;color:#225b3c}.v29card h3{margin:15px 0 8px}.v29desc{white-space:pre-wrap;color:var(--ink-muted);line-height:1.65}.v29actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}.v29btn{border:1px solid #c8d6ca;background:#fff;color:#174c31;border-radius:999px;padding:8px 12px;font:inherit;font-size:13px;font-weight:750;cursor:pointer}.v29btn.on{background:#e9f5e7;border-color:#5d9d69}.v29btn.neg.on{background:#f8eeee;border-color:#b98b8b;color:#7b2d2d}.v29resp{margin-top:14px;padding:13px 15px;border-left:4px solid #2d8552;background:#eff8f0}.v29comments{margin-top:13px}.v29comment{padding:11px 0;border-top:1px solid var(--line)}.v29comment p{white-space:pre-wrap;margin:4px 0}.v29comment .v29ava{width:30px;height:30px;font-size:11px}.v29report{margin-top:12px;padding:12px;border-radius:11px;background:#f5f8f4}.v29report textarea{width:100%;min-height:78px;max-width:100%;font:inherit;border:1px solid #a5b9aa;border-radius:9px;padding:10px}.v29btn:disabled{opacity:.55;cursor:wait}.v29report[hidden],.v29comments[hidden],#studentPanelPercurso[hidden],#studentPanelDemandas[hidden]{display:none!important}.v29form{display:grid;gap:10px}.v29form textarea{min-height:120px;resize:vertical}.v29ident{display:flex;gap:15px;flex-wrap:wrap;font-size:13px}.v29ident label{display:flex!important;align-items:center;gap:7px;margin:0!important}.v29status{font-size:13.5px;font-weight:700;color:#17623c}.v29err{color:#9a2020!important}.v29empty{padding:20px;border:1px dashed #c8d6ca;border-radius:13px;background:#fff;color:var(--ink-muted)}.v29step{display:grid;grid-template-columns:auto 1fr auto;gap:12px;padding:14px 0;border-top:1px solid var(--line)}.v29step input{width:20px;height:20px}.v29step h5{margin:0 0 4px}.v29step p{margin:0;color:var(--ink-muted);font-size:13.5px}.v29own{padding:14px 0;border-top:1px solid var(--line)}.v29btn{transition:background-color .15s ease,border-color .15s ease,transform .1s ease}.v29btn:active{transform:scale(.97)}.v29card{transition:box-shadow .15s ease}.v29card:hover{box-shadow:0 6px 18px rgba(8,45,25,.06)}@media(max-width:650px){.v29step{grid-template-columns:auto 1fr}.v29step>a{grid-column:2}.v29head{align-items:flex-start}.v29tools{flex-direction:column;align-items:stretch}}

/* V29.1 — Corrige conflito com os estilos gerais de .student-panel.
   Campos e opções de privacidade são responsivos e mantêm rótulos legíveis. */
#studentPanelDemandas .v29form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
  width: 100%;
}
#studentPanelDemandas .v29form > label {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  margin: 0;
  font-weight: 750;
}
#studentPanelDemandas .v29form > label > :is(input:not([type="checkbox"]), select, textarea) {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  min-width: 0;
  margin: 0;
  padding: 12px 14px;
  font: inherit;
  font-size: 16px;
  line-height: 1.45;
  border: 1px solid #a5b9aa;
  border-radius: 9px;
  background: #fff;
  color: #173221;
}
#studentPanelDemandas .v29form > label > select { min-height: 46px; }
#studentPanelDemandas .v29form > label > textarea {
  min-height: 140px;
  resize: vertical;
}
#studentPanelDemandas .v29ident {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 22px;
  min-width: 0;
}
#studentPanelDemandas .v29ident label {
  display: inline-flex !important;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin: 0 !important;
  min-width: 0;
  width: auto;
  max-width: 100%;
  min-height: 28px;
  line-height: 1.5;
  cursor: pointer;
}
#studentPanelDemandas .v29ident input[type="checkbox"] {
  display: inline-block;
  box-sizing: border-box;
  flex: 0 0 18px;
  width: 18px;
  min-width: 18px;
  max-width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  accent-color: #145c36;
  cursor: pointer;
}
#studentPanelDemandas .v29ident input[type="checkbox"]:disabled { cursor: not-allowed; }
#studentPanelDemandas .v29form > .student-button {
  justify-self: start;
  max-width: 100%;
  margin-top: 0;
}
#studentPanelDemandas #v29form > .student-button {
  justify-self: stretch;
}
#studentPanelDemandas .v29form > .v29meta,
#studentPanelDemandas .v29form > .v29status { margin: 0; }
@media (max-width: 600px) {
  #studentPanelDemandas .v29form { gap: 14px; }
  #studentPanelDemandas .v29ident { align-items: flex-start; gap: 10px; }
  #studentPanelDemandas .v29ident label { width: 100%; }
  #studentPanelDemandas .v29form > .student-button { justify-self: stretch; }
}

/* V29.2 — Feed compacto. Estilos isolados da Central para preservar as demais páginas. */
.v29sec{padding:34px 0 42px}
.v29sec>.wrap{max-width:1040px}
.v29head{align-items:center;gap:12px}
.v29head h2{font-size:clamp(26px,3vw,36px);line-height:1.14;margin:6px 0 5px}
.v29head p{font-size:14px;line-height:1.5;margin:0;max-width:710px}
.v29head .student-button{padding:10px 15px;flex-shrink:0}
.v29rules{margin:15px 0 0;border:1px solid #dbe7da;border-radius:10px;background:#fff}
.v29rules summary{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 14px;font-size:13px;font-weight:750;color:#174b32;cursor:pointer;list-style:none}
.v29rules summary::-webkit-details-marker{display:none}
.v29rules summary::after{content:'+';font-size:19px;line-height:1;font-weight:400}
.v29rules[open] summary::after{content:'−'}
.v29rules-content{border-top:1px solid #edf1e9;padding:8px 14px 12px;font-size:13px;line-height:1.55;color:var(--ink-muted)}
.v29rules-content p{margin:0 0 8px}.v29rules-content p:last-child{margin-bottom:0}
.v29tools{align-items:center;gap:8px 15px;margin:13px 0 14px}
.v29tools>label{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;margin:0}
.v29tools select{box-sizing:border-box;height:36px;min-height:36px;max-width:164px;min-width:0;padding:6px 28px 6px 10px;font-size:13px;line-height:1.3;border-radius:8px}
.v29feed{gap:12px}.v29card{padding:16px 18px;border-radius:14px}
.v29top{align-items:center;gap:7px 12px}.v29who{gap:8px;min-width:0}.v29who>b,.v29who>div{min-width:0}
.v29ava{width:34px;height:34px;flex:0 0 34px;font-size:11px;line-height:1}
.v29ava img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 65%;border-radius:50%}
.v29badge{font-size:10px;line-height:1.2;padding:4px 7px}
.v29meta{font-size:11.5px;line-height:1.4}
.v29card h3{font-size:18px;line-height:1.35;margin:11px 0 7px;overflow-wrap:anywhere}
.v29desc{font-size:14px;line-height:1.52;margin:0;overflow-wrap:anywhere}
.v29card.v29collapsed .v29desc{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;line-clamp:4;overflow:hidden;white-space:normal}
.v29expand{display:inline-flex;align-items:center;margin:5px 0 0;padding:4px 2px;min-height:28px;background:none;border:0;font:inherit;font-size:12px;font-weight:800;color:#185d3a;cursor:pointer}
.v29expand:hover{text-decoration:underline;text-underline-offset:3px}
.v29actions{gap:5px;margin-top:11px;padding-top:10px}
.v29actions .v29btn{min-height:34px;border-radius:9px;padding:6px 10px;font-size:12px;line-height:1.15;white-space:nowrap}
.v29actions .v29btn[data-report]{margin-left:auto;color:#6c655a;background:transparent;border-color:transparent;text-decoration:underline;text-underline-offset:2px}
.v29resp{margin-top:11px;padding:10px 12px;font-size:13px;line-height:1.45;border-radius:7px}
.v29comments{margin-top:10px}.v29comment{padding:10px 0}.v29comment p{font-size:13px;line-height:1.5}
.v29card:focus-within{outline-offset:3px}
/* Dialog de enquadramento: os pixels da imagem só são enviados após Salvar. */
.v29crop-overlay[hidden]{display:none!important}
.v29crop-overlay{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;overflow:auto;background:rgba(10,31,21,.72);padding:16px}
.v29crop-dialog{box-sizing:border-box;width:min(100%,470px);max-height:calc(100dvh - 32px);overflow-y:auto;border-radius:16px;background:#fff;padding:18px;box-shadow:0 18px 70px #001b13aa}
.v29crop-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.v29crop-head h3{font-size:20px;margin:0}
.v29crop-close{width:36px;height:36px;background:#eff5ec;border:0;border-radius:50%;font-size:21px;cursor:pointer}
.v29crop-help{font-size:13px;line-height:1.5;color:#52635b;margin:8px 0 12px}
.v29crop-canvas{display:block;box-sizing:border-box;width:min(100%,260px);height:auto;aspect-ratio:1;margin:0 auto 12px;border-radius:50%;background:#edf1e9;touch-action:none;cursor:grab;border:3px solid #e1e9dd}
.v29crop-canvas:active{cursor:grabbing}
.v29crop-controls{display:grid;gap:8px}.v29crop-controls label{display:grid;grid-template-columns:85px minmax(0,1fr);gap:10px;align-items:center;font-size:13px;font-weight:700}
.v29crop-controls input[type=range]{width:100%;min-width:0;accent-color:#145c36}
.v29crop-file{display:block;margin:11px 0;font-size:13px}
.v29crop-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin:12px 0 2px}.v29crop-actions button{min-height:40px}
.v29crop-dialog .v29status{margin:7px 0 0;font-size:12px}
#studentPanelPerfil #v29editPhoto{align-self:flex-start}
@media(max-width:650px){
 .v29sec{padding:22px 0 29px}
 .v29sec>.wrap{padding-left:16px;padding-right:16px}
 .v29head{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
 .v29head h2{font-size:26px;line-height:1.13;margin:4px 0 6px}
 .v29head p{font-size:13px;line-height:1.45}
 .v29head .student-button{justify-self:start;width:auto;min-height:39px;padding:8px 14px;font-size:13px}
 .v29rules{margin-top:12px}.v29rules summary{padding:10px 12px}
 .v29tools{display:flex;flex-direction:row;align-items:center;gap:8px;margin:12px 0}
 .v29tools>label{display:inline-flex;flex:1 1 0;min-width:0;flex-direction:column;align-items:stretch;gap:3px;font-size:11px}
 .v29tools select{width:100%;max-width:none;padding:6px 24px 6px 9px;height:35px;min-height:35px;font-size:12px}
 .v29feed{gap:10px}.v29card{padding:13px 14px;border-radius:13px}
 .v29top{gap:6px}.v29who{gap:7px}.v29ava{width:32px;height:32px;flex-basis:32px}
 .v29card h3{font-size:16px;line-height:1.34;margin:10px 0 6px}
 .v29desc{font-size:13.5px;line-height:1.45}
 .v29card.v29collapsed .v29desc{-webkit-line-clamp:4;line-clamp:4}
 .v29actions{gap:4px;flex-wrap:wrap;margin-top:10px;padding-top:9px}
 .v29actions .v29btn{font-size:11px;min-height:32px;padding:5px 8px}
 .v29actions .v29btn[data-report]{margin-left:0}
 .v29badge{font-size:9px;padding:3px 6px}.v29meta{font-size:11px}
 .v29crop-overlay{padding:10px}.v29crop-dialog{max-height:calc(100dvh - 20px);padding:14px}
 .v29crop-canvas{width:min(100%,220px)}
}
@media(prefers-reduced-motion:reduce){.v29card,.v29btn{transition:none!important}}
`;document.head.appendChild(s)
}

function publicUI(){
if(document.getElementById('central-demandas'))return;var home=document.getElementById('inicio');if(!home)return;
var sec=document.createElement('section');sec.id='central-demandas';sec.className='v29sec';sec.innerHTML=`<div class="wrap"><div class="v29head"><div><p class="section-index">Participação estudantil</p><h2 class="section-title">Central de Demandas</h2><p>Sugestões aprovadas ficam visíveis para todos. Somente pessoas logadas com e-mail acadêmico confirmado podem sugerir, apoiar, discordar, responder ou denunciar.</p></div><button class="student-button" id="v29suggest">Enviar sugestão</button></div><details class="v29rules"><summary>Regras e orientações de uso</summary><div class="v29rules-content"><p>Use a Central para sugestões de melhoria acadêmica. Comente sobre as propostas com respeito, evite mensagens repetidas e não compartilhe dados pessoais de terceiros.</p><p>Publicações e respostas passam por moderação. Para situações individuais ou que exijam sigilo, procure a <a href="#ouvidoria">Ouvidoria</a>. Apoios e discordâncias não são uma votação oficial.</p></div></details><div class="v29tools"><label>Categoria <select id="v29cat"><option value="">Todas</option>${Object.keys(CAT).map(function(k){return'<option value="'+k+'">'+CAT[k]+'</option>'}).join('')}</select></label><label>Ordenar <select id="v29sort"><option value="recentes">Mais recentes</option><option value="apoios">Mais apoiadas</option><option value="respostas">Mais debatidas</option></select></label></div><p id="v29pubstatus" class="v29status"></p><div id="v29feed" class="v29feed"></div></div>`;
var now=home.querySelector('.now-strip');now?home.insertBefore(sec,now):home.appendChild(sec);
var ou=document.querySelector('#sobre-portal a[href="#ouvidoria"]');if(ou&&ou.parentNode&&!document.querySelector('#sobre-portal a[href="#central-demandas"]')){var a=document.createElement('a');a.className='hub-card';a.href='#central-demandas';a.innerHTML='<h3>Central de Demandas</h3><p>Sugira melhorias e participe com apoios, discordâncias e respostas.</p><span class="go">Participar →</span>';ou.parentNode.appendChild(a)}
document.getElementById('v29suggest').onclick=function(){openStudent('demandas')};document.getElementById('v29cat').onchange=render;document.getElementById('v29sort').onchange=render
}

function studentUI(){
var nav=document.querySelector('#studentLogged .student-subnav'),conta=document.getElementById('studentPanelConta');if(!nav||!conta||document.getElementById('studentTabPercurso'))return;
function mk(id,label){var b=document.createElement('button');b.type='button';b.role='tab';b.id=id;b.textContent=label;b.setAttribute('aria-selected','false');b.tabIndex=-1;return b}
var bp=mk('studentTabPercurso','Meu Percurso'),bd=mk('studentTabDemandas','Minhas Demandas');nav.insertBefore(bp,document.getElementById('studentTabConta'));nav.insertBefore(bd,document.getElementById('studentTabConta'));
var pp=document.createElement('div');pp.id='studentPanelPercurso';pp.className='student-panel';pp.hidden=true;pp.innerHTML='<div id="v29journey"></div>';
var pd=document.createElement('div');pd.id='studentPanelDemandas';pd.className='student-panel';pd.hidden=true;pd.innerHTML=`<h4>Enviar uma sugestão</h4><p class="student-note">A sugestão só aparece publicamente depois da moderação. Relatos pessoais ou sensíveis devem ir para a <a href="#ouvidoria">Ouvidoria</a>.</p><form id="v29form" class="v29form"><label>Categoria<select id="v29fcat">${Object.keys(CAT).map(function(k){return'<option value="'+k+'">'+CAT[k]+'</option>'}).join('')}</select></label><label>Título<input id="v29title" minlength="8" maxlength="140" required></label><label>Descrição<textarea id="v29desc" minlength="15" maxlength="3000" required></textarea></label><div class="v29ident"><label><input type="checkbox" id="v29name"> Mostrar meu nome de exibição</label><label><input type="checkbox" id="v29photo"> Mostrar minha foto de perfil</label></div><p id="v29idhint" class="v29meta"></p><button class="student-button">Enviar sugestão</button><p id="v29formstatus" class="v29status"></p></form><div style="margin-top:28px"><h4>Minhas sugestões</h4><div id="v29own"></div><h4 style="margin-top:24px">Minhas respostas</h4><div id="v29ownReplies"></div></div>`;
conta.parentNode.insertBefore(pp,conta);conta.parentNode.insertBefore(pd,conta);
Array.prototype.forEach.call(nav.querySelectorAll('button:not(#studentTabPercurso):not(#studentTabDemandas)'),function(b){b.addEventListener('click',function(){pp.hidden=true;pd.hidden=true;bp.setAttribute('aria-selected','false');bd.setAttribute('aria-selected','false')})});
bp.onclick=function(){selectStudent('percurso')};bd.onclick=function(){selectStudent('demandas')};document.getElementById('v29form').onsubmit=submitDemand;
/* CORREÇÃO/melhoria: a navegação por setas do teclado em
   js/area-estudante.js (SUBTABS) só conhece as 3 abas originais — as
   duas abas novas ficavam fora do ciclo de Tab/setas. Isto cobre pelo
   menos a navegação entre as duas abas novas e o limite com "Minha
   Conta", sem precisar alterar area-estudante.js. */
var tabConta=document.getElementById('studentTabConta');
[bp,bd].forEach(function(b,i){b.addEventListener('keydown',function(e){var alvo=null;if(e.key==='ArrowRight')alvo=i===0?bd:tabConta;else if(e.key==='ArrowLeft')alvo=i===0?document.getElementById('studentTabPerfil'):bp;if(alvo){e.preventDefault();alvo.focus();alvo.click()}})});
}
function selectStudent(which){if(!state.authenticated)return;['studentPanelInicio','studentPanelPerfil','studentPanelConta'].forEach(function(id){var e=document.getElementById(id);if(e)e.hidden=true});['studentTabInicio','studentTabPerfil','studentTabConta'].forEach(function(id){var e=document.getElementById(id);if(e)e.setAttribute('aria-selected','false')});var jp=document.getElementById('studentPanelPercurso'),dp=document.getElementById('studentPanelDemandas'),jb=document.getElementById('studentTabPercurso'),db=document.getElementById('studentTabDemandas'),j=which==='percurso';jp.hidden=!j;dp.hidden=j;jb.setAttribute('aria-selected',String(j));db.setAttribute('aria-selected',String(!j));j?loadJourney():loadOwn()}
function openStudent(which){if(window.caefActivateTab)window.caefActivateTab('area-estudante');if(!state.authenticated){var s=document.getElementById('studentAccessStatus');if(s)s.textContent='Entre para participar da Central de Demandas.';return}setTimeout(function(){selectStudent(which)},40)}

function refreshProfile(){profile=null;if(!state.authenticated)return Promise.resolve();return auth().then(function(c){return c.auth.getUser().then(function(r){user=r.data&&r.data.user;if(!user)return;c=c;return c.from('student_profiles').select('display_name,habilitacao,periodo,avatar_path').eq('id',user.id).maybeSingle()})}).then(function(r){if(r&&r.error)throw r.error;if(r)profile=r.data||null;identityHint()}).catch(function(){identityHint()})}
function identityHint(){var h=document.getElementById('v29idhint'),n=document.getElementById('v29name'),p=document.getElementById('v29photo');if(!h)return;var hn=!!(profile&&profile.display_name),hp=!!(profile&&profile.avatar_path);n.disabled=!hn;p.disabled=!hp;h.textContent=(hn?'Nome disponível. ':'Adicione um nome em Meu Perfil para poder mostrá-lo. ')+(hp?'Foto disponível.':'Adicione uma foto em Meu Perfil para poder mostrá-la.')}

function loadFeed(){var st=document.getElementById('v29pubstatus');tell(st,'Carregando…');return pub().then(function(c){return Promise.all([c.from('caef_demandas_feed_publico').select('*').order('criado_em',{ascending:false}),c.from('caef_demandas_comentarios_publicos').select('*').order('criado_em',{ascending:true})])}).then(function(a){if(a[0].error)throw a[0].error;if(a[1].error)throw a[1].error;feed=a[0].data||[];comments={};(a[1].data||[]).forEach(function(x){(comments[x.demanda_id]||(comments[x.demanda_id]=[])).push(x)});tell(st,'');return loadVotes().then(render)}).catch(function(){tell(st,'Não foi possível carregar as demandas agora.',true)})}
/* CORREÇÃO: sem filtro por autor, esta consulta dependia inteiramente da
   RLS (não incluída neste pacote) para não devolver os votos de outras
   contas. Defesa em profundidade — igual ao padrão já adotado no resto
   do portal — mesmo que o banco também precise bloquear isso. */
function loadVotes(){votes={};if(!state.authenticated)return Promise.resolve();return auth().then(function(c){return c.auth.getUser().then(function(r){var u=r.data&&r.data.user;if(!u)return{data:[]};return c.from('caef_demandas_votos').select('demanda_id,voto').eq('autor_id',u.id)})}).then(function(r){if(r.error)throw r.error;(r.data||[]).forEach(function(v){votes[v.demanda_id]=v.voto})}).catch(function(){})}
function render(){var w=document.getElementById('v29feed');if(!w)return;var cat=document.getElementById('v29cat').value,sort=document.getElementById('v29sort').value,rows=feed.filter(function(d){return!cat||d.categoria===cat}).slice();if(sort==='apoios')rows.sort(function(a,b){return Number(b.apoios)-Number(a.apoios)});if(sort==='respostas')rows.sort(function(a,b){return Number(b.respostas)-Number(a.respostas)});if(!rows.length){w.innerHTML='<div class="v29empty">Nenhuma sugestão publicada neste filtro.</div>';return}w.innerHTML=rows.map(function(d){var cs=comments[d.id]||[],v=votes[d.id]||0,needExpand=String(d.descricao||'').length>210||String(d.descricao||'').split('\n').length>4;return`<article class="v29card ${needExpand?'v29collapsed':''}" data-id="${esc(d.id)}"><div class="v29top"><div class="v29who"><span class="v29ava" data-avatar="${esc(d.foto_publica_path||'')}" data-name="${esc(d.nome_exibicao)}">${esc(initials(d.nome_exibicao))}</span><div><b>${esc(d.nome_exibicao)}</b><div class="v29meta">${esc(date(d.criado_em))}</div></div></div><div class="v29badges"><span class="v29badge">${esc(CAT[d.categoria]||d.categoria)}</span><span class="v29badge">${esc(SIT[d.situacao]||d.situacao)}</span></div></div><h3>${esc(d.titulo)}</h3><p class="v29desc">${esc(d.descricao)}</p>${needExpand?'<button type="button" class="v29expand" data-expand aria-expanded="false" aria-label="Ler a descrição completa de '+esc(d.titulo)+'">Ler mais ↓</button>':''}${d.resposta_gestao?'<div class="v29resp"><b>Resposta da gestão</b><br>'+esc(d.resposta_gestao)+'</div>':''}<div class="v29actions"><button class="v29btn ${v===1?'on':''}" data-v="1" data-count="${Number(d.apoios||0)}">Apoiar ${Number(d.apoios||0)}</button><button class="v29btn neg ${v===-1?'on':''}" data-v="-1" data-count="${Number(d.discordancias||0)}">Discordar ${Number(d.discordancias||0)}</button><button class="v29btn" data-c>Respostas (${Number(d.respostas||0)})</button><button class="v29btn" data-report>Denunciar</button></div><p class="v29meta" data-vstatus></p><div class="v29comments" hidden>${cs.map(function(c){return'<div class="v29comment" data-comment="'+esc(c.id)+'"><div class="v29who"><span class="v29ava" data-avatar="'+esc(c.foto_publica_path||'')+'" data-name="'+esc(c.nome_exibicao)+'">'+esc(initials(c.nome_exibicao))+'</span><div><b>'+esc(c.nome_exibicao)+'</b><span class="v29meta"> · '+esc(date(c.criado_em))+'</span></div></div><p>'+esc(c.mensagem)+'</p><button type="button" class="v29btn" data-report-comment>Denunciar resposta</button>'+reportForm()+'</div>'}).join('')}${state.authenticated?'<form class="v29form v29reply"><textarea minlength="2" maxlength="1500" required placeholder="Escreva uma resposta"></textarea><div class="v29ident"><label><input type="checkbox" name="showName"> Mostrar meu nome</label><label><input type="checkbox" name="showPhoto" '+(profile&&profile.avatar_path?'':'disabled')+'> Mostrar minha foto</label></div><button class="student-button student-secondary">Enviar resposta</button><p class="v29status"></p></form>':'<p class="v29meta">Entre para responder.</p>'}</div>${reportForm()}</article>`}).join('');Array.prototype.forEach.call(w.querySelectorAll('.v29card'),wire);hydrateAvatars(w)}
function reportForm(){return '<form class="v29report v29form" hidden><label>Motivo da denúncia<textarea required minlength="8" maxlength="500" placeholder="Explique por que este conteúdo precisa ser revisado pela gestão. Não inclua dados pessoais."></textarea></label><p class="v29meta">Sua denúncia será recebida somente pela gestão e não aparecerá publicamente.</p><button class="student-button student-secondary" type="submit">Enviar denúncia</button><p class="v29status" role="status" aria-live="polite"></p></form>'}
function hydrateAvatars(root){
  Array.prototype.forEach.call(root.querySelectorAll('.v29ava[data-avatar]'),function(el){
    var path=el.getAttribute('data-avatar');if(!path)return;
    var cached=avatarCache.get(path);
    if(cached&&cached.expires>Date.now()){setAvatar(el,cached.url);return}
    pub().then(function(c){return c.storage.from('avatares-caef').createSignedUrl(path,600)}).then(function(r){
      if(r.error||!r.data||!r.data.signedUrl)return;
      avatarCache.set(path,{url:r.data.signedUrl,expires:Date.now()+300000});
      if(el.isConnected)setAvatar(el,r.data.signedUrl);
    }).catch(function(){ /* Sem foto: mantém as iniciais. */ });
  });
}
function setAvatar(el,url){
  el.textContent='';var img=document.createElement('img');img.src=url;img.alt='Foto compartilhada voluntariamente';
  img.onerror=function(){el.textContent=initials(el.getAttribute('data-name'))};el.appendChild(img);
}
function toggleReport(button,form){
  if(!state.authenticated){openStudent('demandas');return}
  form.hidden=!form.hidden;
  if(!form.hidden){var t=form.querySelector('textarea');if(t)t.focus()}
}
function submitReport(form,demandId,commentId){
  var st=form.querySelector('.v29status'),textarea=form.querySelector('textarea'),motivo=textarea.value.trim();
  if(motivo.length<8){tell(st,'Escreva pelo menos 8 caracteres.',true);return}
  tell(st,'Enviando…');var btn=form.querySelector('button[type="submit"]');btn.disabled=true;
  auth().then(function(c){return c.auth.getUser().then(function(r){
    var u=r.data&&r.data.user;if(!u)throw new Error('Entre novamente para enviar a denúncia.');
    return c.from('caef_demandas_denuncias').insert({denunciante_id:u.id,demanda_id:commentId?null:demandId,comentario_id:commentId||null,motivo:motivo});
  })}).then(function(r){if(r.error)throw r.error;textarea.value='';tell(st,'Denúncia enviada para análise.');})
  .catch(function(e){tell(st,e.message||'Não foi possível enviar.',true)})
  .finally(function(){btn.disabled=false});
}
function wire(card){var expand=card.querySelector('[data-expand]');if(expand)expand.onclick=function(){var collapsed=card.classList.toggle('v29collapsed');expand.textContent=collapsed?'Ler mais ↓':'Mostrar menos ↑';expand.setAttribute('aria-expanded',String(!collapsed))};card.querySelector('[data-c]').onclick=function(){var x=card.querySelector('.v29comments');x.hidden=!x.hidden};var demandForm=card.querySelector(':scope > .v29report');card.querySelector('[data-report]').onclick=function(){toggleReport(this,demandForm)};demandForm.onsubmit=function(e){e.preventDefault();submitReport(demandForm,card.dataset.id,null)};Array.prototype.forEach.call(card.querySelectorAll('.v29comment'),function(row){var btn=row.querySelector('[data-report-comment]'),form=row.querySelector('.v29report');btn.onclick=function(){toggleReport(btn,form)};form.onsubmit=function(e){e.preventDefault();submitReport(form,card.dataset.id,row.dataset.comment)}});Array.prototype.forEach.call(card.querySelectorAll('[data-v]'),function(b){b.onclick=function(){vote(card,Number(b.dataset.v))}});var f=card.querySelector('.v29reply');if(f)f.onsubmit=function(e){e.preventDefault();submitReply(card.dataset.id,f)}}
/* CORREÇÃO: antes recarregava a lista inteira (2 consultas) a cada voto —
   além de desperdiçar chamadas, isso recolhia qualquer thread de
   respostas que estivesse aberta em QUALQUER card da tela, não só no
   votado (o innerHTML da lista inteira era reconstruído). Agora a
   contagem é atualizada de forma otimista só no card clicado, sem
   recarregar nada; se o servidor recusar, a UI volta ao estado anterior.
   O `alert()` bloqueante também foi trocado por um aviso inline. */
function vote(card,v){if(!state.authenticated){openStudent('demandas');return}var id=card.dataset.id,up=card.querySelector('[data-v="1"]'),down=card.querySelector('[data-v="-1"]'),st=card.querySelector('[data-vstatus]'),prev=votes[id]||0,novo=prev===v?0:v;if(up.disabled||down.disabled)return;up.disabled=true;down.disabled=true;aplicarVotoUI(up,down,prev,novo);votes[id]=novo;atualizarFeedLocal(id,prev,novo);tell(st,'');auth().then(function(c){return c.auth.getUser().then(function(r){var u=r.data.user;if(novo===0)return c.from('caef_demandas_votos').delete().eq('demanda_id',id).eq('autor_id',u.id);return c.from('caef_demandas_votos').upsert({demanda_id:id,autor_id:u.id,voto:novo},{onConflict:'demanda_id,autor_id'})})}).then(function(r){if(r.error)throw r.error}).catch(function(){aplicarVotoUI(up,down,novo,prev);votes[id]=prev;atualizarFeedLocal(id,novo,prev);tell(st,'Não foi possível registrar o voto agora. Tente novamente.',true)}).finally(function(){up.disabled=false;down.disabled=false})}
function aplicarVotoUI(up,down,de,para){var upN=Number(up.dataset.count||0),downN=Number(down.dataset.count||0);if(de===1)upN--;if(de===-1)downN--;if(para===1)upN++;if(para===-1)downN++;up.dataset.count=upN;down.dataset.count=downN;up.textContent='Apoiar '+upN;down.textContent='Discordar '+downN;up.classList.toggle('on',para===1);down.classList.toggle('on',para===-1)}
function atualizarFeedLocal(id,de,para){var d=feed.filter(function(x){return x.id===id})[0];if(!d)return;if(de===1)d.apoios=Number(d.apoios||0)-1;if(de===-1)d.discordancias=Number(d.discordancias||0)-1;if(para===1)d.apoios=Number(d.apoios||0)+1;if(para===-1)d.discordancias=Number(d.discordancias||0)+1}
/* CORREÇÃO: o caminho da foto pública era um palpite (`u.id+'/avatar'`)
   em vez do valor real já carregado em profile.avatar_path — podia
   marcar "mostrar foto" e gravar um caminho que não bate com o arquivo
   de verdade no Storage. Também vale conferir, quando o SQL desta
   funcionalidade existir, se é esse mesmo o formato de caminho esperado. */
function submitReply(id,f){var st=f.querySelector('.v29status'),msg=f.querySelector('textarea').value.trim();tell(st,'Enviando…');auth().then(function(c){return c.auth.getUser().then(function(r){var u=r.data.user,photo=f.elements.showPhoto.checked;return c.from('caef_demandas_comentarios').insert({demanda_id:id,autor_id:u.id,mensagem:msg,nome_publico:'Estudante',mostrar_nome:f.elements.showName.checked,mostrar_foto:photo,foto_publica_path:photo&&profile&&profile.avatar_path?profile.avatar_path:null,moderacao:'pendente'})})}).then(function(r){if(r.error)throw r.error;f.reset();tell(st,'Resposta enviada para moderação.')}).catch(function(e){tell(st,e.message||'Falha ao enviar.',true)})}

function submitDemand(e){e.preventDefault();var st=document.getElementById('v29formstatus'),photo=document.getElementById('v29photo').checked;tell(st,'Enviando…');auth().then(function(c){return c.auth.getUser().then(function(r){var u=r.data.user;return c.from('caef_demandas').insert({autor_id:u.id,categoria:document.getElementById('v29fcat').value,titulo:document.getElementById('v29title').value.trim(),descricao:document.getElementById('v29desc').value.trim(),nome_publico:'Estudante',mostrar_nome:document.getElementById('v29name').checked,mostrar_foto:photo,foto_publica_path:photo&&profile&&profile.avatar_path?profile.avatar_path:null,moderacao:'pendente',situacao:'recebida'})})}).then(function(r){if(r.error)throw r.error;e.target.reset();tell(st,'Sugestão enviada para moderação.');loadOwn()}).catch(function(x){tell(st,x.message||'Falha ao enviar.',true)})}
/* CORREÇÃO: sem filtro por autor, esta consulta dependia inteiramente da
   RLS para não listar as sugestões de outras contas em "Minhas
   Demandas" (inclusive as pendentes/recusadas, que têm texto sensível). */
function loadOwn(){var w=document.getElementById('v29own');if(!w||!state.authenticated)return;w.innerHTML='<p class="v29status">Carregando…</p>';refreshProfile().then(auth).then(function(c){return c.auth.getUser().then(function(r){var u=r.data.user;return c.from('caef_demandas').select('id,titulo,mostrar_nome,mostrar_foto,moderacao,situacao,resposta_gestao,criado_em').eq('autor_id',u.id).order('criado_em',{ascending:false})})}).then(function(r){if(r.error)throw r.error;var a=r.data||[];w.innerHTML=a.length?a.map(function(d){return`<div class="v29own" data-id="${esc(d.id)}"><h5>${esc(d.titulo)}</h5><span class="v29badge">${esc(MOD[d.moderacao]||d.moderacao)}</span> <span class="v29badge">${esc(SIT[d.situacao]||d.situacao)}</span>${d.resposta_gestao?'<p class="v29meta"><b>Gestão:</b> '+esc(d.resposta_gestao)+'</p>':''}<div class="v29ident"><label><input data-n type="checkbox" ${d.mostrar_nome?'checked':''} ${profile&&profile.display_name?'':'disabled'}> Mostrar nome</label><label><input data-p type="checkbox" ${d.mostrar_foto?'checked':''} ${profile&&profile.avatar_path?'':'disabled'}> Mostrar foto</label><button class="v29btn" data-save>Salvar privacidade</button></div><p class="v29status"></p></div>`}).join(''):'<div class="v29empty">Você ainda não enviou sugestões.</div>';Array.prototype.forEach.call(w.querySelectorAll('[data-save]'),function(b){b.onclick=function(){savePrivacy(b.closest('.v29own'))}})}).then(loadOwnReplies).catch(function(){w.innerHTML='<p class="v29err">Não foi possível carregar suas sugestões.</p>'})}
function loadOwnReplies(){
  var w=document.getElementById('v29ownReplies');if(!w||!state.authenticated)return Promise.resolve();
  w.innerHTML='<p class="v29status">Carregando…</p>';
  return auth().then(function(c){return c.auth.getUser().then(function(r){
    var u=r.data&&r.data.user;if(!u)throw new Error('Sem sessão.');
    return c.from('caef_demandas_comentarios').select('id,mensagem,mostrar_nome,mostrar_foto,moderacao,criado_em').eq('autor_id',u.id).order('criado_em',{ascending:false});
  })}).then(function(r){if(r.error)throw r.error;var arr=r.data||[];
    w.innerHTML=arr.length?arr.map(function(c){return '<div class="v29own" data-comment-id="'+esc(c.id)+'"><p>'+esc(c.mensagem)+'</p><span class="v29badge">'+esc(MOD[c.moderacao]||c.moderacao)+'</span><div class="v29ident"><label><input type="checkbox" data-reply-name '+(c.mostrar_nome?'checked ':'')+(profile&&profile.display_name?'':'disabled')+'> Mostrar nome</label><label><input type="checkbox" data-reply-photo '+(c.mostrar_foto?'checked ':'')+(profile&&profile.avatar_path?'':'disabled')+'> Mostrar foto</label><button type="button" class="v29btn" data-reply-save>Salvar privacidade</button></div><p class="v29status"></p></div>'}).join(''):'<div class="v29empty">Você ainda não enviou respostas.</div>';
    Array.prototype.forEach.call(w.querySelectorAll('[data-reply-save]'),function(b){b.onclick=function(){
      var row=b.closest('.v29own'),status=row.querySelector('.v29status');tell(status,'Salvando…');
      auth().then(function(c){return c.rpc('caef_v29_definir_identidade_comentario',{p_id:row.dataset.commentId,p_mostrar_nome:row.querySelector('[data-reply-name]').checked,p_mostrar_foto:row.querySelector('[data-reply-photo]').checked})})
        .then(function(r){if(r.error)throw r.error;tell(status,'Privacidade atualizada.');loadFeed()})
        .catch(function(err){tell(status,err.message||'Não foi possível atualizar.',true)});
    }});
  }).catch(function(){w.innerHTML='<p class="v29err">Não foi possível carregar suas respostas.</p>'});
}
function savePrivacy(row){var st=row.querySelector('.v29status');tell(st,'Salvando…');auth().then(function(c){return c.rpc('caef_v29_definir_identidade_demanda',{p_id:row.dataset.id,p_mostrar_nome:row.querySelector('[data-n]').checked,p_mostrar_foto:row.querySelector('[data-p]').checked})}).then(function(r){if(r.error)throw r.error;tell(st,'Privacidade atualizada.');loadFeed()}).catch(function(e){tell(st,e.message||'Falha ao salvar.',true)})}

/* CORREÇÃO: sem filtro por autor, dependia inteiramente da RLS para não
   trazer o checklist de percurso de outras contas. */
function loadJourney(){var w=document.getElementById('v29journey');if(!w||!state.authenticated)return;w.innerHTML='<p class="v29status">Carregando…</p>';Promise.all([refreshProfile(),auth().then(function(c){return c.auth.getUser().then(function(r){return c.from('caef_percurso_etapas').select('etapa,concluida').eq('autor_id',r.data.user.id)})})]).then(function(a){var r=a[1];if(r.error)throw r.error;var d={};(r.data||[]).forEach(function(x){d[x.etapa]=x.concluida});var count=STEPS.filter(function(x){return d[x[0]]}).length,grade=profile&&profile.habilitacao==='bacharelado'?'#bacharelado':profile&&profile.habilitacao==='licenciatura'?'#licenciatura':'#comparativo';w.innerHTML='<h4>Meu percurso acadêmico</h4><p class="student-note">Checklist pessoal e autodeclarado. Não consulta o SIGAA e não substitui a matriz oficial.</p><p class="v29status">'+count+' de '+STEPS.length+' etapas marcadas</p>'+STEPS.map(function(x){var href=x[0]==='consultar_grade'?grade:x[2];return'<div class="v29step"><input type="checkbox" data-step="'+x[0]+'" '+(d[x[0]]?'checked':'')+'><div><h5>'+esc(x[1])+'</h5><p>Use esta etapa como referência pessoal de organização.</p></div><a href="'+href+'">Abrir →</a></div>'}).join('')+'<p id="v29jstatus" class="v29status"></p>';Array.prototype.forEach.call(w.querySelectorAll('[data-step]'),function(cb){cb.onchange=saveStep})}).catch(function(){w.innerHTML='<p class="v29err">Não foi possível carregar o percurso.</p>'})}
function saveStep(e){var cb=e.target,st=document.getElementById('v29jstatus');tell(st,'Salvando…');auth().then(function(c){return c.auth.getUser().then(function(r){return c.from('caef_percurso_etapas').upsert({autor_id:r.data.user.id,etapa:cb.dataset.step,concluida:cb.checked,atualizado_em:new Date().toISOString()},{onConflict:'autor_id,etapa'})})}).then(function(r){if(r.error)throw r.error;loadJourney()}).catch(function(){cb.checked=!cb.checked;tell(st,'Falha ao salvar.',true)})}


/* V29.2 — Editor de avatar local (sem bibliotecas externas).
   Mantém o caminho único do avatar no Storage, exigido pelas regras RLS.
   A alteração da foto só é enviada ao servidor depois da confirmação. */
var cropState={image:null,url:null,x:0,y:0,zoom:100},cropBusy=false,cropLastFocus=null,cropSequence=0;
function installAvatarCropper(){
  var profilePanel=document.getElementById('studentPanelPerfil'),photoActions=profilePanel&&profilePanel.querySelector('.student-photo-actions');
  var originalInput=document.getElementById('studentAvatarInput');
  if(!photoActions||!originalInput||document.getElementById('v29editPhoto'))return;
  var edit=document.createElement('button');edit.id='v29editPhoto';edit.type='button';edit.className='student-button student-secondary';edit.textContent='Ajustar foto';photoActions.appendChild(edit);
  var note=profilePanel.querySelector('.student-photo-block + .student-note');
  if(note)note.textContent='Sua foto é privada por padrão. Ela só aparece na Central de Demandas quando você escolher mostrar a foto na publicação. Aceitamos JPEG, PNG e WEBP; a foto ajustada é salva com até 2 MB.';
  var layer=document.createElement('div');layer.id='v29CropLayer';layer.className='v29crop-overlay';layer.hidden=true;
  layer.innerHTML='<div class="v29crop-dialog" role="dialog" aria-modal="true" aria-labelledby="v29cropTitle"><div class="v29crop-head"><h3 id="v29cropTitle">Ajustar foto de perfil</h3><button type="button" class="v29crop-close" id="v29cropClose" aria-label="Fechar editor">×</button></div><p class="v29crop-help">Arraste a imagem para centralizar o rosto. Ajuste o zoom, se necessário. O círculo mostra como a foto aparecerá no portal.</p><canvas id="v29cropCanvas" class="v29crop-canvas" width="512" height="512" role="img" aria-label="Prévia circular do enquadramento da foto"></canvas><div class="v29crop-controls"><label>Zoom<input type="range" id="v29cropZoom" min="100" max="300" step="5" value="100"></label><label>Horizontal<input type="range" id="v29cropX" min="-100" max="100" value="0"></label><label>Vertical<input type="range" id="v29cropY" min="-100" max="100" value="0"></label></div><label class="v29crop-file" for="v29cropChoose">Trocar imagem (JPEG, PNG ou WEBP)<input type="file" id="v29cropChoose" accept="image/jpeg,image/png,image/webp"></label><div class="v29crop-actions"><button type="button" class="student-button student-secondary" id="v29cropCancel">Cancelar</button><button type="button" class="student-button" id="v29cropSave" disabled>Salvar enquadramento</button></div><p id="v29cropStatus" class="v29status" role="status" aria-live="polite"></p></div>';
  document.body.appendChild(layer);
  var canvas=document.getElementById('v29cropCanvas'),zoom=document.getElementById('v29cropZoom'),xs=document.getElementById('v29cropX'),ys=document.getElementById('v29cropY'),status=document.getElementById('v29cropStatus'),save=document.getElementById('v29cropSave');
  function renderCrop(){
    var img=cropState.image;if(!img)return;
    var side=canvas.width,scale=Math.max(side/img.naturalWidth,side/img.naturalHeight)*cropState.zoom/100;
    var w=img.naturalWidth*scale,h=img.naturalHeight*scale;
    var x=(side-w)/2+(cropState.x/100)*Math.max(0,w-side)/2;
    var y=(side-h)/2+(cropState.y/100)*Math.max(0,h-side)/2;
    var ctx=canvas.getContext('2d',{alpha:false});ctx.clearRect(0,0,side,side);ctx.fillStyle='#f2f5ef';ctx.fillRect(0,0,side,side);ctx.drawImage(img,x,y,w,h);
    return {w:w,h:h};
  }
  function readSliders(){cropState.zoom=Number(zoom.value);cropState.x=Number(xs.value);cropState.y=Number(ys.value);renderCrop()}
  [zoom,xs,ys].forEach(function(s){s.addEventListener('input',readSliders)});
  function closeCrop(){if(cropBusy)return;layer.hidden=true;save.disabled=true;cropState.image=null;if(cropState.url)URL.revokeObjectURL(cropState.url);cropState.url=null;if(cropLastFocus&&cropLastFocus.isConnected)cropLastFocus.focus()}
  document.getElementById('v29cropClose').onclick=closeCrop;document.getElementById('v29cropCancel').onclick=closeCrop;
  layer.addEventListener('click',function(e){if(e.target===layer)closeCrop()});
  document.addEventListener('keydown',function(e){if(layer.hidden)return;if(e.key==='Escape'){e.preventDefault();closeCrop()}else if(e.key==='Tab'){
    var focusables=Array.prototype.filter.call(layer.querySelectorAll('button:not(:disabled),input:not(:disabled)'),function(x){return x.offsetParent!==null});
    if(!focusables.length)return;var first=focusables[0],last=focusables[focusables.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }});
  function loadCropFile(blob){
    var seq=++cropSequence;
    if(!blob||!(/^(image\/(jpeg|png|webp)|application\/octet-stream)?$/.test(blob.type))||blob.size>10*1024*1024){tell(status,'Selecione JPEG, PNG ou WEBP de até 10 MB para recortar.',true);return}
    tell(status,'Abrindo imagem…');save.disabled=true;
    var url=URL.createObjectURL(blob),img=new Image();
    img.onload=function(){
      if(seq!==cropSequence){URL.revokeObjectURL(url);return}
      if(img.naturalWidth*img.naturalHeight>32000000||!img.naturalWidth||!img.naturalHeight){URL.revokeObjectURL(url);tell(status,'Imagem grande demais para edição neste aparelho.',true);return}
      if(cropState.url)URL.revokeObjectURL(cropState.url);
      cropState.url=url;cropState.image=img;cropState.zoom=100;cropState.x=0;cropState.y=0;
      zoom.value='100';xs.value='0';ys.value='0';renderCrop();save.disabled=false;tell(status,'Arraste a foto ou use os controles para ajustar o enquadramento.');
    };
    img.onerror=function(){URL.revokeObjectURL(url);tell(status,'Não foi possível abrir essa imagem.',true)};
    img.src=url;
  }
  function openCrop(file){
    if(!state.authenticated){openStudent('demandas');return}
    cropLastFocus=document.activeElement;layer.hidden=false;tell(status,'');
    document.getElementById('v29cropClose').focus();
    if(file){loadCropFile(file);return}
    save.disabled=true;tell(status,'Carregando sua foto atual…');
    refreshProfile().then(function(){
      if(!profile||!profile.avatar_path){tell(status,'Escolha uma imagem para ajustar.');return}
      return auth().then(function(c){return c.storage.from('avatares-caef').download(profile.avatar_path)}).then(function(r){if(r.error)throw r.error;loadCropFile(r.data)});
    }).catch(function(){tell(status,'Não foi possível carregar a foto atual. Selecione o arquivo original para ajustar.',true)});
  }
  edit.onclick=function(){openCrop(null)};
  /* Captura antes do listener antigo: uma foto nova agora passa primeiro pelo editor. */
  originalInput.addEventListener('change',function(e){if(!this.files||!this.files.length)return;e.stopImmediatePropagation();var file=this.files[0];this.value='';openCrop(file)},true);
  document.getElementById('v29cropChoose').addEventListener('change',function(){if(this.files&&this.files.length)loadCropFile(this.files[0]);this.value=''});
  var drag=null;
  canvas.addEventListener('pointerdown',function(e){if(!cropState.image||cropBusy)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:cropState.x,startY:cropState.y};if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',function(e){if(!drag||drag.id!==e.pointerId)return;var over=renderCrop();if(!over)return;var side=canvas.getBoundingClientRect().width;if(!side)return;
    if(over.w>canvas.width+1){cropState.x=Math.max(-100,Math.min(100,drag.startX+(e.clientX-drag.x)*canvas.width/side*200/(over.w-canvas.width)));xs.value=String(Math.round(cropState.x))}
    if(over.h>canvas.height+1){cropState.y=Math.max(-100,Math.min(100,drag.startY+(e.clientY-drag.y)*canvas.height/side*200/(over.h-canvas.height)));ys.value=String(Math.round(cropState.y))}
    renderCrop();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){canvas.addEventListener(type,function(){drag=null})});
  save.onclick=function(){
    if(!cropState.image||cropBusy)return;cropBusy=true;save.disabled=true;tell(status,'Salvando o enquadramento…');renderCrop();
    canvas.toBlob(function(blob){
      if(!blob||blob.size>2*1024*1024){cropBusy=false;save.disabled=false;tell(status,'Não foi possível gerar a foto. Tente outra imagem.',true);return}
      auth().then(function(c){return c.auth.getUser().then(function(r){
        var u=r.data&&r.data.user;if(!u)throw new Error('Entre novamente para salvar sua foto.');
        var path=u.id+'/avatar';return c.storage.from('avatares-caef').upload(path,blob,{upsert:true,contentType:blob.type,cacheControl:'0'}).then(function(upload){
          if(upload.error)throw upload.error;
          return c.from('student_profiles').upsert({id:u.id,avatar_path:path},{onConflict:'id'}).select('avatar_path').maybeSingle();
        }).then(function(result){if(result.error)throw result.error;avatarCache.delete(path)})
      })}).then(function(){tell(status,'Foto salva! Atualizando os avatares…');window.setTimeout(function(){window.location.reload()},350)})
      .catch(function(err){cropBusy=false;save.disabled=false;tell(status,err&&err.message?err.message:'Não foi possível salvar. Tente novamente.',true)});
    },'image/webp',0.88);
  };
}

var eventoRealRecebido=false;
function account(d){state=d||{authenticated:false,isAdmin:false};if(!state.authenticated){user=null;profile=null;votes={};render();return}refreshProfile().then(function(){loadVotes().then(render)})}
document.addEventListener('caef:accountstate',function(e){eventoRealRecebido=true;account(e.detail)});
/* CORREÇÃO: este era um segundo caminho, paralelo ao evento oficial
   "caef:accountstate" (js/area-estudante.js), para decidir se a pessoa
   está logada — mas sem repetir a verificação de e-mail confirmado e de
   domínio acadêmico que js/area-estudante.js faz antes de considerar a
   sessão válida (e que pode terminar em signOut()). Rodava sempre, de
   forma incondicional, 700ms após o carregamento, então por um instante
   podia mostrar a Central de Demandas como "logada" para uma sessão que
   o restante do site estava prestes a invalidar. Agora só roda como
   última tentativa, e apenas se o evento oficial nunca chegou — nunca
   sobrepõe um estado que a área do estudante já determinou. */
function bootAccount(){if(eventoRealRecebido||!window.caefStudentClient)return;window.caefStudentClient.auth.getSession().then(function(r){if(eventoRealRecebido)return;var u=r.data&&r.data.session&&r.data.session.user;var on=!!(u&&u.email_confirmed_at&&/@academico\.ufpb\.br$/i.test(u.email||'')&&document.getElementById('studentLogged')&&!document.getElementById('studentLogged').hidden);if(!on)return account({authenticated:false,isAdmin:false});var p=window.caefContentSource&&window.caefContentSource.admin?window.caefContentSource.admin.checarIsAdmin():Promise.resolve(false);p.then(function(a){if(!eventoRealRecebido)account({authenticated:true,isAdmin:!!a})})})}
function init(){styles();publicUI();studentUI();installAvatarCropper();loadFeed();setTimeout(bootAccount,1500)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();