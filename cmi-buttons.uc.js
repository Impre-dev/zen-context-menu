// ==UserScript==
// @name           CMI Buttons Flex Row
// @version        1.1.1
// @description    Moves the CMI action buttons (reload / pin / essential / bookmark) into a real hbox container (#uc-cmi-btnrow) at the top of the tab context menu, so chrome.css can center them with native flex — replacing CMI's absolute % margins, which can't center square buttons reliably.
// @author         Impre
// @include        main
// ==/UserScript==

(function () {
  'use strict';

  const PREF = 'uc.fixcontext.cmibuttonsquare';
  const ROW_ID = 'uc-cmi-btnrow';

  // Visual order in the row. Hidden items stay in the row too — Firefox
  // toggles their hidden attribute per tab type and they collapse naturally,
  // so the row never needs to be re-arranged per menu opening.
  const ORDER = [
    '#context_reloadTab',
    '#context_reloadSelectedTabs',
    '#context_pinTab',
    '#context_unpinTab',
    '#context_pinSelectedTabs',
    '#context_unpinSelectedTabs',
    '#context_zen-add-essential',
    '#context_zen-remove-essential',
    '#context_bookmarkTab',
    '#context_bookmarkSelectedTabs',
  ];

  // Remember original positions the first time an item is moved, so the
  // layout can be fully restored if the pref is toggled off.
  const saved = new Map();

  // Services is usually a global in chrome windows, but not guaranteed in
  // every script context — fall back to the ES module import.
  let prefs = null;
  try {
    prefs = Services.prefs;
  } catch (e) {
    try {
      prefs = ChromeUtils.importESModule('resource://gre/modules/Services.sys.mjs').Services.prefs;
    } catch (e2) {
      console.error('[CMI-Flex] no prefs access:', e2.message);
    }
  }

  function prefOn() {
    if (!prefs) return false;
    try {
      return prefs.getBoolPref(PREF, false);
    } catch (e) {
      console.error('[CMI-Flex] pref read failed:', e.message);
      return false;
    }
  }

  function restore() {
    for (const [el, pos] of saved) {
      if (!el.isConnected) continue;
      pos.parent.insertBefore(el, pos.next && pos.next.isConnected ? pos.next : null);
    }
    const row = document.getElementById(ROW_ID);
    if (row) row.remove();
    saved.clear();
  }

  function apply(menu) {
    if (!prefOn()) {
      if (saved.size) restore();
      return;
    }

    let row = document.getElementById(ROW_ID);
    if (!row) {
      row = document.createXULElement('hbox');
      row.id = ROW_ID;
      menu.insertBefore(row, menu.firstChild);
      console.log('[CMI-Flex] row created');
    }

    for (const sel of ORDER) {
      const el = menu.querySelector(sel);
      if (!el || el.parentElement === row) continue;
      if (!saved.has(el)) {
        saved.set(el, { parent: el.parentElement, next: el.nextElementSibling });
      }
      row.appendChild(el); // append in ORDER → correct visual order
    }
  }

  console.log('[CMI-Flex] script loaded, prefs=' + (prefs ? 'ok' : 'MISSING'));

  // Purely event-driven (no polling). popupshowing fires after native
  // handlers have updated item visibility; the move is idempotent.
  document.addEventListener(
    'popupshowing',
    (e) => {
      if (e.target.id === 'tabContextMenu') apply(e.target);
    },
    true,
  );
})();
