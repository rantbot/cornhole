/* Pocket Cornhole — usage.
   Records what happened in a game, and nothing else. No scores, no device, no
   location, no throw data. Only the name of a moment and a random id belonging
   to this browser.

   A plain script rather than a module, because the game is one file and this
   sits beside it.

   The counts appear on the experiments page. */

(function () {
  "use strict";

  var CONFIG = {
    supabaseUrl: "https://anpdtpaozmblptqrqaam.supabase.co",
    supabaseAnonKey: "sb_publishable_qDlGahllytUw1ZdvVgloyQ_wZ2b3IqN",
    slug: "pocket-cornhole",
    version: "b77",
  };

  var KEY = "experiments-visitor";
  var seen = {};

  /* A random id kept in this browser. Not a person, not an account. */
  function visitorId() {
    try {
      var id = localStorage.getItem(KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
      }
      return id;
    } catch (e) {
      return crypto.randomUUID();
    }
  }

  /* once: true for something that should count a single time per visit.
     Never throws, never waits, never gets in the way of a throw landing. */
  function track(action, options) {
    if (!action || action.length > 40) return;
    if (options && options.once) {
      if (seen[action]) return;
      seen[action] = true;
    }

    try {
      fetch(CONFIG.supabaseUrl + "/rest/v1/experiment_actions", {
        method: "POST",
        headers: {
          apikey: CONFIG.supabaseAnonKey,
          Authorization: "Bearer " + CONFIG.supabaseAnonKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          slug: CONFIG.slug,
          visitor_id: visitorId(),
          action: action,
          version: CONFIG.version
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {
      /* Offline, or blocked. A game is worth more than a count. */
    }
  }

  window.experimentsTrack = track;

  /* Somebody opened it at all, which is the denominator for everything else. */
  track("opened-the-game", { once: true });

  /* Installed to a home screen, which for a phone game is the real adoption
     signal. Counted once per visit rather than on every load. */
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
    track("played-from-the-home-screen", { once: true });
  } else if (window.navigator.standalone) {
    track("played-from-the-home-screen", { once: true });
  }
})();
