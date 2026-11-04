/* Calculateur de revenu net VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  // Taux 2026, mêmes valeurs que l'article sur les charges auto-entrepreneur. À revoir chaque année.
  var TAUX = {
    urssaf: 0.212,          // prestations de services BIC
    formation: 0.001,       // contribution à la formation professionnelle (ordre de grandeur)
    versementLib: 0.017,    // versement libératoire de l'impôt
    semParMois: 52 / 12
  };
  var KEY = "vtcr-calc-net";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var fmt2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var periode = "semaine";

  function setPeriode(p) {
    periode = p;
    f.querySelectorAll(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.p === p)); });
    f.querySelectorAll("[data-per]").forEach(function (el) { el.textContent = p === "semaine" ? "la semaine" : "le mois"; });
    calc();
  }

  function syncStatut() {
    var s = $("statut").value;
    $("opt-ae").classList.toggle("hide", s !== "ae");
    $("opt-soc").classList.toggle("hide", s !== "societe");
    $("opt-ratt").classList.toggle("hide", s !== "ratt");
    $("opt-com").classList.toggle("hide", $("saisie").value !== "avant");
  }

  function calc() {
    syncStatut();
    var parSem = periode === "semaine";
    var moisVersPeriode = parSem ? 12 / 52 : 1;   // charges mensuelles ramenées à la période
    var semVersPeriode = parSem ? 1 : TAUX.semParMois;

    var ca = num("ca");
    var commissions = $("saisie").value === "avant" ? ca * num("com") / 100 : 0;
    var encaisse = ca - commissions;

    var s = $("statut").value, statutLib, statutMontant;
    if (s === "ae") {
      var acre = parseFloat($("acre").value) || 0;
      var taux = TAUX.urssaf * (1 - acre) + TAUX.formation + ($("vl").checked ? TAUX.versementLib : 0);
      statutMontant = encaisse * taux;
      statutLib = "Cotisations URSSAF" + ($("vl").checked ? " et impôt" : "") + " (" + (taux * 100).toFixed(1).replace(".", ",") + " %)";
    } else if (s === "societe") {
      statutMontant = encaisse * num("soc") / 100;
      statutLib = "Charges et impôt de la société (" + num("soc") + " %)";
    } else {
      statutMontant = num("ratt") * semVersPeriode;
      statutLib = "Société de rattachement";
    }

    var fixes = (num("voiture") + num("assurance") + num("abos")) * moisVersPeriode;
    var variables = num("carburant") + num("entretien") + num("peage") + num("repas");
    var frais = fixes + variables;
    var net = encaisse - statutMontant - frais;

    var h = num("heures"), km = num("km");
    var base = ca > 0 ? ca : 1;
    var part = function (x) { return Math.max(0, x) / base * 100; };

    var big = $("r-net");
    big.textContent = fmt.format(net);
    big.classList.toggle("neg", net < 0);
    $("r-per").textContent = parSem ? "de revenu net sur la semaine" : "de revenu net sur le mois";

    var kpis = [];
    kpis.push(parSem ? [fmt.format(net * TAUX.semParMois), "par mois en moyenne"] : [fmt.format(net / TAUX.semParMois), "par semaine en moyenne"]);
    if (ca > 0) kpis.push([Math.round(net / ca * 100) + " %", "du chiffre d'affaires gardé"]);
    if (h) kpis.push([fmt2.format(net / h), "net par heure"]);
    if (km) kpis.push([fmt2.format(net / km), "net par km"]);
    if (km && frais) kpis.push([fmt2.format(frais / km), "de frais par km"]);
    $("r-kpis").innerHTML = kpis.map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");

    $("r-bar").innerHTML =
      '<i style="width:' + part(commissions) + '%;background:#8b93a7"></i>' +
      '<i style="width:' + part(statutMontant) + '%;background:#e8743b"></i>' +
      '<i style="width:' + part(frais) + '%;background:#f7b267"></i>' +
      '<i style="width:' + part(net) + '%;background:#3ccf7d"></i>';

    var rows = [["Chiffre d'affaires saisi", ca, ""]];
    if (commissions) rows.push(["Commissions des plateformes", -commissions, "minus"]);
    rows.push([statutLib, -statutMontant, "minus"]);
    if (fixes) rows.push(["Voiture, assurance et abonnements" + (parSem ? " (ramenés à la semaine)" : ""), -fixes, "minus"]);
    if (variables) rows.push(["Carburant, entretien, péages, repas", -variables, "minus"]);
    $("r-tab").innerHTML = rows.map(function (r) {
      return '<tr class="' + r[2] + '"><td>' + r[0] + '</td><td class="n">' + (r[1] < 0 ? "− " + fmt.format(-r[1]) : fmt.format(r[1])) + "</td></tr>";
    }).join("") + '<tr class="tot"><td>Revenu net</td><td class="n">' + fmt.format(net) + "</td></tr>";

    var msg = "";
    if (!ca) msg = "Saisis ton chiffre d'affaires pour voir le résultat.";
    else if (net < 0) msg = "Sur cette période, tes charges dépassent ce que tu encaisses : tu travailles à perte.";
    else if (net / ca < 0.35) msg = "Il te reste moins d'un tiers de ce que tu encaisses. Regarde en priorité ton plus gros poste de dépense.";
    else msg = "Pense à l'impôt sur le revenu s'il n'est pas déjà compris, et à refaire le calcul chaque semaine : le net change beaucoup d'une semaine à l'autre.";
    $("r-msg").textContent = msg;

    try {
      var save = { periode: periode };
      f.querySelectorAll("input, select").forEach(function (el) { save[el.id] = el.type === "checkbox" ? el.checked : el.value; });
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (e) { /* stockage indisponible : sans importance */ }
  }

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) {
      Object.keys(saved).forEach(function (id) {
        var el = $(id); if (!el) return;
        if (el.type === "checkbox") el.checked = !!saved[id]; else el.value = saved[id];
      });
      if (saved.periode) periode = saved.periode;
    }
  } catch (e) { /* ignore */ }

  f.addEventListener("input", calc);
  f.addEventListener("change", calc);
  f.addEventListener("submit", function (ev) { ev.preventDefault(); calc(); });
  f.querySelectorAll(".seg button").forEach(function (b) { b.addEventListener("click", function () { setPeriode(b.dataset.p); }); });
  $("raz").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    f.reset(); setPeriode("semaine");
  });
  setPeriode(periode);
})();
