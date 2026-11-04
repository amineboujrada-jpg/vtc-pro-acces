/* Page Modèles : enregistre l'adresse (avec consentement) dans Supabase, puis affiche les liens de téléchargement. */
(function () {
  "use strict";
  // Clé publique : la table n'accepte que des ajouts avec consentement, et personne ne peut la lire sans être administrateur.
  var URL_API = "https://izjwblfezffiksoyapwa.supabase.co/rest/v1/leads";
  var CLE = "sb_publishable_oHSTBBoFqNQEBLQWgrOTgA_d5sACoZU";
  var f = document.getElementById("modeles-form");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var msg = $("m-msg");

  function enregistrer(email, modele) {
    return fetch(URL_API, {
      method: "POST",
      headers: { "apikey": CLE, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ email: email, modele: modele, consentement: true, source: "vtcrentable.com/modeles" })
    }).then(function (r) {
      if (r.ok || r.status === 409) return true;   // 409 : adresse déjà inscrite pour ce modèle
      throw new Error("HTTP " + r.status);
    });
  }

  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = $("m-email").value.trim();
    var choix = Array.prototype.slice.call(f.querySelectorAll("input[name=modele]:checked")).map(function (el) { return el.value; });
    msg.className = "m-msg";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Vérifie ton adresse e-mail."; msg.classList.add("err"); return; }
    if (!choix.length) { msg.textContent = "Choisis au moins un modèle."; msg.classList.add("err"); return; }
    if (!$("m-ok").checked) { msg.textContent = "Coche la case de consentement pour recevoir les modèles."; msg.classList.add("err"); return; }

    var btn = $("m-btn"); btn.disabled = true; btn.textContent = "Envoi…";
    Promise.all(choix.map(function (m) { return enregistrer(email, m); }))
      .then(function () {
        msg.textContent = ""; f.hidden = true;
        choix.forEach(function (m) { var el = $("dl-" + m); if (el) el.hidden = false; });
        $("m-done").hidden = false;
        $("m-done").focus();
      })
      .catch(function () {
        msg.textContent = "L'envoi n'a pas marché. Réessaie dans un instant, ou écris-nous à contact@vtcrentable.com.";
        msg.classList.add("err");
        btn.disabled = false; btn.textContent = "Recevoir les modèles";
      });
  });
})();
