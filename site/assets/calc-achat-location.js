/* Calculateur voiture achetée ou louée — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  var KEY = "vtcr-calc-achatloc";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  function calc() {
    var mois = num("mois"), ans = mois / 12, kmAn = num("kman");
    var assInc = $("assinc").checked, entInc = $("entinc").checked;
    $("f-assloc").classList.toggle("hide", assInc);
    $("f-entloc").classList.toggle("hide", entInc);

    var achat = [
      ["Perte de valeur (achat − revente)", Math.max(num("achat") - num("revente"), 0)],
      ["Intérêts du crédit", num("interets")],
      ["Assurance", num("assachat") * mois],
      ["Entretien et pneus", num("entachat") * ans]
    ];
    var kmInclus = num("kminclus");
    var kmSup = kmInclus ? Math.max(kmAn - kmInclus, 0) * ans : 0;
    var loc = [
      ["Loyers", num("loyer") * mois],
      ["Frais de mise en route", num("frais")],
      ["Assurance", assInc ? 0 : num("assloc") * mois],
      ["Entretien et pneus", entInc ? 0 : num("entloc") * ans],
      ["Km supplémentaires", kmSup * num("prixkm")]
    ];
    var tA = achat.reduce(function (s, p) { return s + p[1]; }, 0);
    var tL = loc.reduce(function (s, p) { return s + p[1]; }, 0);
    var diff = Math.abs(tA - tL);

    var big = $("r-net");
    if (!mois) { big.textContent = "—"; $("r-sub").textContent = "Indique une durée pour comparer."; }
    else if (diff < 1) { big.textContent = "Égalité"; $("r-sub").textContent = "Les deux options coûtent autant sur " + Math.round(mois) + " mois."; }
    else {
      big.textContent = tA < tL ? "Achat" : "Location";
      $("r-sub").textContent = "moins cher de " + eur.format(diff) + " sur " + Math.round(mois) + " mois, soit " + eur.format(diff / mois) + " par mois";
    }

    $("r-kpis").innerHTML = [
      [mois ? eur.format(tA / mois) : "—", "par mois à l'achat"],
      [mois ? eur.format(tL / mois) : "—", "par mois en location"],
      [eur.format(num("achat")), "à financer à l'achat (comptant ou crédit)"],
      [kmSup ? Math.round(kmSup).toLocaleString("fr-FR") + " km" : "0 km", "au-delà du forfait de location"]
    ].map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");

    var rows = [];
    achat.forEach(function (p) { if (p[1] > 0) rows.push(["Achat · " + p[0], p[1]]); });
    rows.push(["Total achat", tA, "tot"]);
    loc.forEach(function (p) { if (p[1] > 0) rows.push(["Location · " + p[0], p[1]]); });
    rows.push(["Total location", tL, "tot"]);
    $("r-tab").innerHTML = rows.map(function (r) {
      return '<tr class="' + (r[2] || "") + '"><td>' + r[0] + '</td><td class="n">' + eur.format(r[1]) + "</td></tr>";
    }).join("");

    var msg;
    if (!mois) msg = "";
    else if (tA < tL) msg = "L'achat revient moins cher, à condition d'avancer l'argent et de bien revendre. Une panne lourde ou une revente plus basse que prévu peuvent changer le résultat.";
    else msg = "La location revient moins cher ou équivalente, sans argent à avancer ni risque de revente. Vérifie le forfait de kilomètres et ce qui est inclus.";
    $("r-msg").textContent = msg;

    try {
      var save = {};
      f.querySelectorAll("input").forEach(function (el) { save[el.id] = el.type === "checkbox" ? el.checked : el.value; });
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
