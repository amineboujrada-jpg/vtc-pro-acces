/* Calculateur des seuils de TVA VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  // Seuils 2026 de la franchise en base pour les prestations de services, taux du transport de personnes.
  var T = { base: 37500, majore: 41250, taux: 0.10 };
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var KEY = "vtcr-calc-tva";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  function calc() {
    var verse = $("base").value === "verse";   // la base des seuils est toujours le prix total des courses
    var com = Math.min(num("com"), 90) / 100;
    var conv = verse ? 1 / (1 - com) : 1;   // montants versés → prix total des courses
    $("f-com").classList.toggle("hide", !verse);

    var mois = Math.min(Math.max(num("mois"), 0), 12);
    var caNow = num("caan") * conv;
    var caPrec = num("caprec") * conv;
    var parMois = mois ? caNow / mois : 0;
    var projection = parMois * 12;

    var v = $("r-verdict"), titre, texte, cls;
    if (caPrec > T.base) {
      cls = "bad"; titre = "Tu n'as plus droit à la franchise";
      texte = "Ton chiffre de l'an dernier (" + eur.format(caPrec) + ") dépasse 37 500 € : la TVA s'applique depuis le 1er janvier de cette année.";
    } else if (caNow > T.majore) {
      cls = "bad"; titre = "TVA due depuis le dépassement";
      texte = "Ton chiffre de l'année (" + eur.format(caNow) + ") dépasse déjà 41 250 € : la franchise a cessé le jour du dépassement.";
    } else if (projection > T.majore) {
      var m = Math.ceil((T.majore - caNow) / parMois + mois);
      cls = "bad"; titre = "Dépassement probable cette année";
      texte = "À ce rythme, tu passeras 41 250 € vers " + (m <= 12 ? MOIS[m - 1] : "la fin de l'année") + ". La TVA s'appliquera dès ce jour-là.";
    } else if (projection > T.base) {
      cls = "mid"; titre = "TVA au 1er janvier prochain";
      texte = "À ce rythme, tu finis l'année vers " + eur.format(projection) + " : entre 37 500 € et 41 250 €. Tu restes en franchise cette année, mais la TVA s'appliquera l'an prochain.";
    } else {
      cls = "ok"; titre = "Tu restes en franchise";
      texte = "À ce rythme, tu finis l'année vers " + eur.format(projection) + ", sous 37 500 €. Il te reste " + eur.format(T.base - projection) + " de marge.";
    }
    v.className = "verdict " + cls;
    v.innerHTML = "<b>" + titre + "</b>" + texte;

    $("r-net").textContent = mois ? eur.format(projection) : "—";
    var tva = projection * T.taux / (1 + T.taux);
    $("r-kpis").innerHTML = [
      [eur.format(caNow), "de prix des courses depuis janvier"],
      [eur.format(Math.max(T.base - caNow, 0)), "avant le seuil de 37 500 €"],
      [eur.format(Math.max(T.majore - caNow, 0)), "avant le seuil de 41 250 €"],
      [eur.format(tva), "de TVA à 10 % sur une année comme celle-ci"]
    ].map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");

    $("r-msg").textContent = "Si tu deviens redevable et que les prix des plateformes ne bougent pas, environ 9 % de ce que tu encaisses part en TVA (10 % du prix hors taxe). Une partie est compensée par la TVA récupérable sur tes dépenses : carburant, entretien, voiture.";

    try {
      var save = {};
      f.querySelectorAll("input, select").forEach(function (el) { save[el.id] = el.value; });
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (e) { /* stockage indisponible : sans importance */ }
  }

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) Object.keys(saved).forEach(function (id) {
      var el = $(id); if (!el) return;
      if (el.tagName === "SELECT" && !Array.prototype.some.call(el.options, function (o) { return o.value === saved[id]; })) return;
      el.value = saved[id];
    });
  } catch (e) { /* ignore */ }

  f.addEventListener("input", calc);
  f.addEventListener("change", calc);
  f.addEventListener("submit", function (ev) { ev.preventDefault(); calc(); });
  $("raz").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    f.reset(); calc();
  });
  calc();
})();
