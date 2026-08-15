// ==UserScript==
// @name           Zen Context Menu (Lean) — Pinned URL extractor
// @version        1.0.0
// @description    Moves 'Replace pinned URL with current' out of the 'Edit pinned URL' submenu, placing it right above 'Reset pinned tab'. Icon is preserved (CMI styles by ID).
// @author         Impre
// @include        main
// ==/UserScript==

(function () {
  'use strict';

  const ITEM_ID = 'context_zen-replace-pinned-url-with-current';
  const ANCHOR_ID = 'context_zen-reset-pinned-tab';

  function extract() {
    if (window.__zcmPinnedUrlExtracted) return true;

    const item = document.getElementById(ITEM_ID);
    const anchor = document.getElementById(ANCHOR_ID);
    if (!item || !anchor || !anchor.parentNode) return false;

    // DOM move keeps the node's ID, listeners and commands intact
    anchor.parentNode.insertBefore(item, anchor);
    window.__zcmPinnedUrlExtracted = true;
    console.log('[ZCM-Lean] replace-pinned-url extrait du sous-menu Edit pinned URL');
    return true;
  }

  function init() {
    // The tab context menu is static XUL: items usually exist at startup
    if (extract()) return;

    // Fallback: retry on first menu opening (event-driven, no polling)
    const menu = document.getElementById('tabContextMenu');
    if (!menu) return;
    menu.addEventListener('popupshowing', () => extract(), { once: true });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
