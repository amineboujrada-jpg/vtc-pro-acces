/* Calculateur du coût de la voiture au km — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  var KEY = "vtcr-calc-voiture";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var eur3 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 3, maximumFractionDigits: 3 });

  function calc() {
    var mode = $("mode").value;
    var loc = mode === "location";
    $("opt-achat").classList.toggle("hide", loc);
    $("opt-loc").classList.toggle("hide", !loc);
    var assInc = loc && $("assinc").checked;
    $("f-ass").classList.toggle("hide", assInc);

    var kmAn = num("kman");
    var ans = num("mois") / 12;
    var postes = [];
    if (loc) {
      postes.push(["Location" + (assInc ? " (assurance incluse)" : ""), num("loyer") * 12, "fixe"]);
    } else {
      postes.push(["Perte de valeur de la voiture", ans ? Math.max(num("achat") - num("revente"), 0) / ans : 0, "fixe"]);
      postes.push(["Intérêts du crédit", ans ? num("interets") / ans : 0, "fixe"]);
    }
    if (!assInc) postes.push(["Assurance", num("assurance") * 12, "fixe"]);
    postes.push(["Carburant ou recharge", kmAn * num("conso") / 100 * num("prixcarb"), "var"]);
    postes.push(["Entretien et révisions", num("entretien"), "var"]);
    postes.push(["Pneus", num("pneus"), "var"]);
    postes.push(["Contrôle technique, lavage, divers", num("divers"), "var"]);
    postes = postes.filter(function (p) { return p[1] > 0; });

    var total = postes.reduce(function (s, p) { return s + p[1]; }, 0);
    var fixe = postes.filter(function (p) { return p[2] === "fixe"; }).reduce(function (s, p) { return s + p[1]; }, 0);
    var parKm = kmAn ? total / kmAn : 0;

    $("r-net").textContent = kmAn ? eur3.format(parKm) : "—";
    $("r-kpis").innerHTML = [
      [eur.format(total / 12), "par mois"],
      [eur.format(total / 52), "par semaine"],
      [kmAn ? eur.format(parKm * 100) : "—", "pour 100 km"],
      [total ? Math.round(fixe / total * 100) + " %" : "—", "de coûts fixes (payés même à l'arrêt)"]
    ].map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");

    var colors = { fixe: "#e8743b", var: "#f7b267" };
    $("r-bar").innerHTML = postes.map(function (p, i) {
      return '<i style="width:' + (total ? p[1] / total * 100 : 0) + "%;background:" + colors[p[2]] + ";opacity:" + (1 - (i % 3) * 0.18) + '"></i>';
    }).join("");
    $("r-tab").innerHTML = postes.map(function (p) {
      return "<tr><td>" + p[0] + '</td><td class="n">' + eur.format(p[1] / 12) + '</td><td class="n">' + (kmAn ? eur3.format(p[1] / kmAn) : "—") + "</td></tr>";
    }).join("") + '<tr class="tot"><td>Total</td><td class="n">' + eur.format(total / 12) + '</td><td class="n">' + (kmAn ? eur3.format(parKm) : "—") + "</td></tr>";

    var msg;
    if (!kmAn) msg = "Indique combien de kilomètres tu fais par an pour voir le coût au kilomètre.";
    else if (total && fixe / total > 0.5) msg = "Plus de la moitié du coût est fixe : chaque kilomètre en plus fait baisser ton coût au km. Une voiture qui dort coûte cher.";
    else msg = "La plus grosse part de ton coût dépend des kilomètres : le carburant et l'entretien sont les leviers à surveiller.";
    $("r-msg").textContent = msg;

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
