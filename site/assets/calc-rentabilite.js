/* Calculateur de rentabilité VTC (€ / heure, € / km) — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  var f = document.getElementById("rent");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var fmt2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function calc() {
    var ca = num("ca"), h = num("h"), km = num("km");
    var charges = num("carb") + num("frais") + num("fixes") + ca * num("statut") / 100;
    var net = ca - charges;
    $("r-net").textContent = fmt.format(net);
    $("r-net").classList.toggle("neg", net < 0);
    var k = [];
    if (h) { k.push([fmt2.format(ca / h), "par heure en brut"]); k.push([fmt2.format(net / h), "par heure en net"]); }
    if (km) { k.push([fmt2.format(ca / km), "par km en brut"]); k.push([fmt2.format(net / km), "par km en net"]); }
    if (ca) k.push([Math.round(net / ca * 100) + " %", "du chiffre d'affaires gardé"]);
    $("r-kpis").innerHTML = k.map(function (x) { return '<div class="kpi"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("");
    var carbPct = ca ? num("carb") / ca * 100 : 0;
    $("r-msg").textContent = !ca ? "Indique ce que tu as encaissé pour voir ta rentabilité." :
      carbPct > 12 ? "Ton carburant fait " + Math.round(carbPct) + " % de ton chiffre d'affaires : c'est plus que les 8 à 10 % habituels." :
      !h ? "Ajoute tes heures pour voir ton € / heure." : "";
  }
  f.addEventListener("input", calc);
  f.addEventListener("submit", function (ev) { ev.preventDefault(); });
  calc();
})();
