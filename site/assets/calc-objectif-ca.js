/* Calculateur d'objectif de chiffre d'affaires VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  var T = { urssaf: 0.212, formation: 0.001, vl: 0.017, plafondMicro: 83600, franchiseTVA: 37500 };
  var KEY = "vtcr-calc-objectif";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var eur2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function calc() {
    var s = $("statut").value;
    $("opt-ae").classList.toggle("hide", s !== "ae");
    $("opt-soc").classList.toggle("hide", s !== "societe");
    $("opt-ratt").classList.toggle("hide", s !== "ratt");

    var tStat = 0, fixesStatut = 0, lib;
    if (s === "ae") {
      tStat = T.urssaf * (1 - (parseFloat($("acre").value) || 0)) + T.formation + ($("vl").checked ? T.vl : 0);
      lib = "Cotisations URSSAF (" + (tStat * 100).toFixed(1).replace(".", ",") + " %)";
    } else if (s === "societe") {
      tStat = num("soc") / 100; fixesStatut = num("compta");
      lib = "Charges et impôt de la société (" + num("soc") + " %) et comptable";
    } else {
      fixesStatut = num("ratt") * 52 / 12;
      lib = "Rattachement";
    }
    var tVar = num("var") / 100;
    var fixes = num("fixes");
    var net = num("net");
    var garde = 1 - tStat - tVar;

    var semAn = Math.min(num("semaines"), 52), jours = Math.min(num("jours"), 7), heures = num("heures");
    if (garde <= 0) {
      $("r-net").textContent = "—";
      $("r-sub").textContent = "Avec ces pourcentages, il ne te reste rien sur chaque euro encaissé : baisse les frais ou les charges.";
      $("r-kpis").innerHTML = ""; $("r-tab").innerHTML = ""; $("r-msg").textContent = "";
      return;
    }
    var caMois = (net + fixes + fixesStatut) / garde;
    var caAn = caMois * 12;
    var caSem = semAn ? caAn / semAn : 0;
    var caJour = jours ? caSem / jours : 0;
    var caHeure = heures ? caJour / heures : 0;

    $("r-net").textContent = semAn ? eur.format(caSem) : "—";
    $("r-sub").textContent = "à encaisser par semaine travaillée, pour " + eur.format(net) + " nets par mois";
    var kpis = [[eur.format(caMois), "par mois en moyenne"], [eur.format(caAn), "par an"]];
    if (caJour) kpis.push([eur.format(caJour), "par jour travaillé"]);
    if (caHeure) kpis.push([eur2.format(caHeure), "par heure de travail"]);
    $("r-kpis").innerHTML = kpis.map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");

    var rows = [["Chiffre d'affaires nécessaire", caMois, ""],
                ["Frais variables (" + num("var") + " %)", -caMois * tVar, "minus"],
                [lib, -(caMois * tStat + fixesStatut), "minus"],
                ["Charges fixes", -fixes, "minus"]];
    $("r-tab").innerHTML = '<tr><th colspan="2">Par mois</th></tr>' + rows.filter(function (r) { return r[1] !== 0; }).map(function (r) {
      return '<tr class="' + r[2] + '"><td>' + r[0] + '</td><td class="n">' + (r[1] < 0 ? "− " + eur.format(-r[1]) : eur.format(r[1])) + "</td></tr>";
    }).join("") + '<tr class="tot"><td>Revenu net</td><td class="n">' + eur.format(net) + "</td></tr>";

    var msg = [];
    if (s === "ae" && caAn > T.plafondMicro) msg.push("Ce chiffre d'affaires (" + eur.format(caAn) + " par an) dépasse le plafond de la micro-entreprise (83 600 €) : en auto-entrepreneur, l'objectif n'est pas tenable sur la durée.");
    else if (s === "ae" && caAn > T.franchiseTVA) msg.push("Au-delà de 37 500 € de CA par an, la TVA s'applique : ce calcul ne la compte pas, prévois-la en plus.");
    if (caHeure > 30) msg.push("Plus de 30 € de CA par heure, c'est ambitieux : vérifie que ton nombre d'heures est réaliste.");
    if (!msg.length) msg.push("Compare ce rythme à tes vraies semaines : si tu en es loin, joue sur les heures, les créneaux ou les frais.");
    $("r-msg").textContent = msg.join(" ");

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
