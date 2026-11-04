/* Comparateur de statuts VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  // Taux et seuils 2026, mêmes valeurs que l'article sur les charges auto-entrepreneur.
  var T = { urssaf: 0.212, formation: 0.001, vl: 0.017, plafondMicro: 83600, franchiseTVA: 37500, semParMois: 52 / 12 };
  var KEY = "vtcr-calc-statuts";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  function calc() {
    var caM = num("ca") * T.semParMois;
    var fraisM = num("frais") * T.semParMois + num("charges");
    var base = caM - fraisM;

    var acre = parseFloat($("acre").value) || 0;
    var tauxAE = T.urssaf * (1 - acre) + T.formation + ($("vl").checked ? T.vl : 0);
    var ae = caM * tauxAE;
    var soc = caM * num("soc") / 100 + num("compta");
    var ratt = num("ratt") * T.semParMois + caM * num("rattpct") / 100;

    var res = [
      { nom: "Auto-entrepreneur", charge: ae, detail: "Cotisations URSSAF" + ($("vl").checked ? " et impôt" : "") + " (" + (tauxAE * 100).toFixed(1).replace(".", ",") + " % du CA)" },
      { nom: "Société", charge: soc, detail: "Charges et impôt (" + num("soc") + " % du CA) et comptable" },
      { nom: "Rattachement", charge: ratt, detail: "Prix du rattachement" + (num("rattpct") ? " et retenues (" + num("rattpct") + " %)" : "") }
    ];
    res.forEach(function (r) { r.net = base - r.charge; });
    var tri = res.slice().sort(function (a, b) { return b.net - a.net; });

    $("r-net").textContent = caM ? tri[0].nom : "—";
    $("r-sub").textContent = caM ? "te laisse le plus : " + eur.format(tri[0].net) + " par mois, soit " + eur.format(tri[0].net - tri[1].net) + " de plus qu'en " + tri[1].nom.toLowerCase() : "Saisis ton chiffre d'affaires pour comparer.";

    $("r-kpis").innerHTML = res.map(function (r) {
      return '<div class="kpi"' + (r === tri[0] ? ' style="border-color:#3ccf7d"' : "") + "><b>" + eur.format(r.net) + "</b><span>par mois en " + r.nom.toLowerCase() + "</span></div>";
    }).join("");

    $("r-base").textContent = "Pour " + eur.format(caM) + " de chiffre d'affaires et " + eur.format(fraisM) + " de frais et charges de voiture par mois :";
    $("r-tab").innerHTML = res.map(function (r) {
      return '<tr' + (r === tri[0] ? ' class="tot"' : "") + '><td>' + r.nom + '<small style="color:var(--night-muted)">' + r.detail + '</small></td><td class="n">− ' + eur.format(r.charge) + '</td><td class="n">' + eur.format(r.net) + "</td></tr>";
    }).join("");

    var caAn = caM * 12, alertes = [];
    if (caAn > T.plafondMicro) alertes.push("Ton CA annuel estimé (" + eur.format(caAn) + ") dépasse le plafond de la micro-entreprise (83 600 €) : l'auto-entreprise n'est pas possible sur la durée.");
    else if (caAn > T.franchiseTVA) alertes.push("Ton CA annuel estimé (" + eur.format(caAn) + ") dépasse la franchise de TVA (37 500 €) : en auto-entrepreneur, tu devras facturer et reverser la TVA, ce que ce calcul ne compte pas.");
    if (caM && tri[0].nom === "Rattachement" && !num("rattpct")) alertes.push("Vérifie ce que ta société de rattachement retient vraiment (cotisations, frais, TVA) : si elle prend plus que le prix affiché, indique-le dans les retenues.");
    alertes.push("En société, le pourcentage dépend de ta rémunération et de ton impôt : fais-le fixer par ton comptable avant de choisir.");
    $("r-msg").textContent = alertes.join(" ");

    try {
      var save = {};
      f.querySelectorAll("input, select").forEach(function (el) { save[el.id] = el.type === "checkbox" ? el.checked : el.value; });
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (e) { /* stockage indisponible : sans importance */ }
  }

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) Object.keys(saved).forEach(function (id) {
      var el = $(id); if (!el) return;
      if (el.type === "checkbox") el.checked = !!saved[id]; else el.value = saved[id];
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
