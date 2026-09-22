/* Widget global de conta — V27.
   Acesso rápido a Meu Perfil / Minha Conta / Sair (ou Entrar / Criar conta
   para quem não está autenticado), disponível em qualquer parte do portal,
   não só quando a pessoa rola até a Área do Estudante.

   Este arquivo NÃO conhece Supabase nem sessão: ele só chama as funções
   expostas em window.caefAccountActions (definidas em js/area-estudante.js)
   e escuta o evento "caef:accountstate" para saber o que mostrar. Isso
   evita duas fontes de verdade sobre quem está logado.

   O mesmo elemento (#accountWidget) é movido entre dois "encaixes" por
   JavaScript conforme a largura da tela — nunca duplicado — para que o
   acesso à conta seja um botão flutuante no canto inferior esquerdo no
   desktop, e uma linha dentro do próprio menu mobile (mesmo breakpoint de
   900px já usado pelo menu-hambúrguer) em telas estreitas. Assim não existe
   uma "segunda navegação de conta": em qualquer largura, só um ponto de
   acesso existe por vez. */
(function () {
  'use strict';

  var widget = document.getElementById('accountWidget');
  var slotDesktop = document.getElementById('accountWidgetSlotDesktop');
  var slotMobile = document.getElementById('accountWidgetSlotMobile');
  var toggle = document.getElementById('accountWidgetToggle');
  var menu = document.getElementById('accountWidgetMenu');
  if (!widget || !slotDesktop || !slotMobile || !toggle || !menu) return;

  var head = document.getElementById('accountMenuHead');
  var emailEl = document.getElementById('accountMenuEmail');
  var itemProfile = document.getElementById('accountMenuProfile');
  var itemConta = document.getElementById('accountMenuConta');
  var itemPainel = document.getElementById('accountMenuPainel'); // V28
  var itemLogout = document.getElementById('accountMenuLogout');
  var itemLogin = document.getElementById('accountMenuLogin');
  var itemSignup = document.getElementById('accountMenuSignup');

  var fabPhoto = document.getElementById('accountFabPhoto');
  var fabInitials = document.getElementById('accountFabInitials');
  var fabGuestIcon = document.getElementById('accountFabGuestIcon');

  var mq = window.matchMedia('(max-width:900px)');

  /* ---------------------------------------------------------------
     Reposicionamento: desktop (flutuante, inferior esquerda) vs.
     mobile (dentro do menu hambúrguer já existente).
     --------------------------------------------------------------- */
  function placeWidget() {
    var mobile = mq.matches;
    widget.classList.toggle('account-widget-mobile', mobile);
    widget.classList.toggle('account-widget-desktop', !mobile);
    var targetSlot = mobile ? slotMobile : slotDesktop;
    if (widget.parentNode !== targetSlot) {
      closeMenu(false);
      targetSlot.appendChild(widget);
    }
  }
  placeWidget();
  if (mq.addEventListener) mq.addEventListener('change', placeWidget);
  else if (mq.addListener) mq.addListener(placeWidget); // navegadores mais antigos

  /* Evita que o botão flutuante (desktop) fique sobreposto a links do
     rodapé: quando o rodapé entra na tela, o botão sobe (ver
     .account-avoid-footer em css/style.css). */
  var siteFooter = document.querySelector('footer');
  if (siteFooter && 'IntersectionObserver' in window) {
    var footerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        widget.classList.toggle('account-avoid-footer', entry.isIntersecting);
      });
    });
    footerObserver.observe(siteFooter);
  }

  /* ---------------------------------------------------------------
     Abrir / fechar o menu
     --------------------------------------------------------------- */
  function menuItems() {
    return Array.prototype.slice.call(menu.querySelectorAll('.account-menu-item')).filter(function (el) { return !el.hidden; });
  }
  function isOpen() { return !menu.hidden; }
  function openMenu() {
    if (isOpen()) return;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    var items = menuItems();
    if (items.length) items[0].focus();
    document.addEventListener('click', onOutsideClick, true);
  }
  function closeMenu(returnFocus) {
    if (!isOpen()) { document.removeEventListener('click', onOutsideClick, true); return; }
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutsideClick, true);
    if (returnFocus !== false) toggle.focus();
  }
  function onOutsideClick(e) {
    if (widget.contains(e.target)) return;
    closeMenu(false);
  }
  toggle.addEventListener('click', function () {
    if (isOpen()) closeMenu(); else openMenu();
  });
  menu.addEventListener('keydown', function (e) {
    var items = menuItems();
    var idx = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); var n = items[(idx + 1 + items.length) % items.length]; if (n) n.focus(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); var p = items[(idx - 1 + items.length) % items.length]; if (p) p.focus(); return; }
    if (e.key === 'Home') { e.preventDefault(); if (items[0]) items[0].focus(); return; }
    if (e.key === 'End') { e.preventDefault(); if (items.length) items[items.length - 1].focus(); return; }
    if (e.key === 'Tab') { closeMenu(false); } // Tab sai do menu normalmente, sem prender o foco
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });

  function bindAction(el, fn) {
    if (!el) return;
    // Estes itens são links reais (<a href="#area-estudante">): o clique
    // continua navegando normalmente (o próprio main.js já trata
    // a[href^="#"] e ativa a aba certa) — aqui só fechamos o menu e
    // disparamos a ação extra (trocar de sub-aba, abrir Entrar/Cadastro).
    el.addEventListener('click', function () {
      closeMenu(false);
      if (fn) fn();
    });
  }
  bindAction(itemProfile, function () { window.caefAccountActions && window.caefAccountActions.goToProfile(); });
  bindAction(itemConta, function () { window.caefAccountActions && window.caefAccountActions.goToConta(); });
  bindAction(itemLogin, function () { window.caefAccountActions && window.caefAccountActions.goToLogin(); });
  bindAction(itemSignup, function () { window.caefAccountActions && window.caefAccountActions.goToSignup(); });
  if (itemLogout) itemLogout.addEventListener('click', function () {
    closeMenu(false);
    window.caefAccountActions && window.caefAccountActions.signOut();
  });

  /* ---------------------------------------------------------------
     Estado (visitante x autenticado) — vem de js/area-estudante.js
     --------------------------------------------------------------- */
  function render(detail) {
    var authed = !!(detail && detail.authenticated);
    if (head) head.hidden = !authed;
    if (emailEl) emailEl.textContent = authed ? (detail.email || '') : '';
    if (itemProfile) itemProfile.hidden = !authed;
    if (itemConta) itemConta.hidden = !authed;
    // V28: só aparece quando a própria conta é confirmada como admin no
    // banco (ver js/area-estudante.js, refreshAdminStatus) — nunca por
    // suposição da interface.
    if (itemPainel) itemPainel.hidden = !(authed && detail && detail.isAdmin === true);
    if (itemLogout) itemLogout.hidden = !authed;
    if (itemLogin) itemLogin.hidden = authed;
    if (itemSignup) itemSignup.hidden = authed;
    toggle.setAttribute('aria-label', authed ? 'Conta — ' + (detail.email || 'autenticado') : 'Conta — entrar ou criar conta');

    var hasPhoto = authed && detail && detail.avatarUrl;
    if (fabPhoto) { if (hasPhoto) { fabPhoto.src = detail.avatarUrl; fabPhoto.hidden = false; } else { fabPhoto.removeAttribute('src'); fabPhoto.hidden = true; } }
    if (fabInitials) { fabInitials.hidden = !(authed && !hasPhoto); fabInitials.textContent = authed ? (detail.initials || '') : ''; }
    // accountFabGuestIcon é um <svg>: a propriedade IDL .hidden não é
    // refletida de forma confiável em todos os navegadores para elementos
    // SVG (testado e confirmado — ver relatório). setAttribute/removeAttribute
    // funciona em qualquer elemento, HTML ou SVG, então é o jeito seguro
    // de alternar o atributo hidden aqui.
    if (fabGuestIcon) { if (authed) fabGuestIcon.setAttribute('hidden', ''); else fabGuestIcon.removeAttribute('hidden'); }
  }
  // Estado inicial (antes do primeiro evento): visitante, para nunca sugerir
  // uma sessão que ainda não foi confirmada.
  render({ authenticated: false });
  document.addEventListener('caef:accountstate', function (e) { render(e.detail || {}); });
})();
