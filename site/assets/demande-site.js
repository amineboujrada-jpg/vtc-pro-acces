/* Page Site vitrine : enregistre la demande (avec consentement) dans Supabase, puis affiche la confirmation. */
(function () {
  "use strict";
  // Clé publique : la table n'accepte que des ajouts avec consentement, et personne ne peut la lire sans être administrateur.
  var URL_API = "https://izjwblfezffiksoyapwa.supabase.co/rest/v1/demandes_site";
  var CLE = "sb_publishable_oHSTBBoFqNQEBLQWgrOTgA_d5sACoZU";
  var f = document.getElementById("site-form");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var msg = $("s-msg");

  function erreur(t) { msg.textContent = t; msg.className = "m-msg err"; }

  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nom = $("s-nom").value.trim();
    var tel = $("s-tel").value.trim();
    var email = $("s-email").value.trim();
    var ville = $("s-ville").value.trim();
    var message = $("s-message").value.trim();
    msg.className = "m-msg"; msg.textContent = "";
    if (nom.length < 2) return erreur("Indique ton nom et ton prénom.");
    if (tel.replace(/[^0-9+]/g, "").length < 6) return erreur("Vérifie ton numéro de téléphone.");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erreur("Vérifie ton adresse e-mail, ou laisse le champ vide.");
    if (ville.length < 2) return erreur("Indique la ville où tu travailles.");
    if (!$("s-ok").checked) return erreur("Coche la case de consentement pour qu'on puisse te recontacter.");

    var btn = $("s-btn"); btn.disabled = true; btn.textContent = "Envoi…";
    fetch(URL_API, {
      method: "POST",
      headers: { "apikey": CLE, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({
        nom: nom, telephone: tel, email: email || null, ville: ville,
        message: message || null, consentement: true, source: location.hostname + location.pathname
      })
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      f.hidden = true;
      $("s-done").hidden = false;
      $("s-done").focus();
    }).catch(function () {
      erreur("L'envoi n'a pas marché. Réessaie dans un instant, ou écris-nous à contact@vtcrentable.com.");
      btn.disabled = false; btn.textContent = "Envoyer ma demande";
    });
  });
})();
