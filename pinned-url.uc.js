// ==UserScript==
// @name           Zen Context Menu (Lean) — Pinned URL extractor
// @version        1.3.0
// @description    Moves 'Replace pinned URL with current' out of the 'Edit pinned URL' submenu, right above 'Reset pinned tab', shortens its label to 'Remplacer l'URL', hides the gutted 'Edit pinned URL' submenu, and only shows the item on pinned tabs. Zen's own popupshowing handlers undo DOM edits, so everything is (re)applied on popupshown, which fires after them.
// @author         Impre
// @include        main
// ==/UserScript==

(function () {
  'use strict';

  const ITEM_ID = 'context_zen-replace-pinned-url-with-current';
  const ANCHOR_ID = 'context_zen-reset-pinned-tab';
  const SHORT_LABEL = 'Remplacer l\u2019URL';

  // Cached <menu> 'Edit pinned URL' — re-derived if Zen rebuilds the nodes
  let editMenuRef = null;

  function apply() {
    const item = document.getElementById(ITEM_ID);
    const anchor = document.getElementById(ANCHOR_ID);
    const menu = document.getElementById('tabContextMenu');
    if (!item || !anchor || !menu) return false;

    // 0. Learn the 'Edit pinned URL' submenu BEFORE any move — after the
    //    item is top-level, closest('menu') returns null and the reference
    //    would never be learned. Confirmed ID: context_zen-edit-pinned-page.
    const host = item.closest('menu');
    if (host) editMenuRef = host;
    if (!editMenuRef || !editMenuRef.isConnected) {
      const byId = document.getElementById('context_zen-edit-pinned-page');
      if (byId) editMenuRef = byId;
    }

    // 1. Ensure top-level position, right above the anchor.
    //    Zen's popupshowing handlers may have re-parented the item into the
    //    Edit submenu — popupshown runs after them, so we win the race.
    if (item.parentNode !== menu) menu.insertBefore(item, anchor);

    // 2. Short label. data-l10n-id/args must go, otherwise Fluent re-applies
    //    the long localized sentence on every menu opening.
    if (item.getAttribute('label') !== SHORT_LABEL) {
      item.removeAttribute('data-l10n-id');
      item.removeAttribute('data-l10n-args');
      item.setAttribute('label', SHORT_LABEL);
    }

    // 3. Hide the gutted 'Edit pinned URL' submenu. Zen resurrects it
    //    (hidden = false) on pinned tabs — re-assert every time.
    if (editMenuRef && editMenuRef.isConnected) editMenuRef.hidden = true;

    // 4. Visibility: pinned tab → show, anything else → hide.
    //    TabContextMenu.contextTab is the tab the menu was opened on.
    const tab = window.TabContextMenu && TabContextMenu.contextTab;
    item.hidden = !(tab && tab.pinned);

    return true;
  }

  function init() {
    // Early structural pass (menu closed) so the first opening is already clean
    apply();

    const menu = document.getElementById('tabContextMenu');
    if (!menu) return;

    // popupshown fires AFTER Zen's popupshowing handlers — the only reliable
    // moment to (re)assert position, label, and flags. Event-driven, no polling.
    menu.addEventListener('popupshown', apply);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
