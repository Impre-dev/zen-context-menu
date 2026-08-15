// ==UserScript==
// @name           CMI Buttons Layout Tagger
// @version        1.1.0
// @description    Tags #tabContextMenu with the number of visible CMI action buttons (ucbtns="N") on popupshowing, and exposes the centering nudge as the --uc-cmi-nudge CSS variable (from the uc.fixcontext.cminudge pref, e.g. "2.5px"). Drives the centered-layout CSS in chrome.css — replaces :has() matching, which Gecko freezes when Firefox toggles the hidden attribute on menu items during popupshowing.
// @author         Impre
// @include        main
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_SELECTORS = [
    '#context_reloadTab',
    '#context_reloadSelectedTabs',
    '#context_zen-add-essential',
    '#context_zen-remove-essential',
    '#context_pinTab',
    '#context_unpinTab',
    '#context_pinSelectedTabs',
    '#context_unpinSelectedTabs',
    '#context_bookmarkTab',
    '#context_bookmarkSelectedTabs',
  ];

  const NUDGE_PREF = 'uc.fixcontext.cminudge';

  function applyNudge(menu) {
    // CSS length string, e.g. "2.5px" or "-1px". Empty/invalid → remove the
    // inline property so chrome.css falls back to its 2.5px default.
    let nudge = '';
    try {
      nudge = Services.prefs.getStringPref(NUDGE_PREF, '').trim();
    } catch (e) {
      /* pref absent → default */
    }
    if (nudge) menu.style.setProperty('--uc-cmi-nudge', nudge);
    else menu.style.removeProperty('--uc-cmi-nudge');
  }

  function tagButtons(menu) {
    let visible = 0;
    for (const sel of BUTTON_SELECTORS) {
      const el = menu.querySelector(sel);
      if (el && !el.hidden) visible++;
    }
    menu.setAttribute('ucbtns', String(visible));
    applyNudge(menu);
  }

  // Purely event-driven (no polling):
  //  - popupshowing: native handlers have run, item visibility is up to date
  //  - popupshown: safety net in case items are toggled between the two events
  // Setting the attribute is idempotent.
  document.addEventListener(
    'popupshowing',
    (e) => {
      if (e.target.id === 'tabContextMenu') tagButtons(e.target);
    },
    true,
  );
  document.addEventListener(
    'popupshown',
    (e) => {
      if (e.target.id === 'tabContextMenu') tagButtons(e.target);
    },
    true,
  );
})();
