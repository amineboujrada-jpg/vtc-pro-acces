/* Calculateur des indemnités kilométriques VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  // Barème kilométrique voitures publié en avril 2026 (revenus 2025), non revalorisé depuis 2023.
  // Par puissance : [taux jusqu'à 5 000 km], [taux, fixe de 5 001 à 20 000 km], [taux au-delà de 20 000 km]
  var B = {
    3: [0.529, 0.316, 1065, 0.370],
    4: [0.606, 0.340, 1330, 0.407],
    5: [0.636, 0.357, 1395, 0.427],
    6: [0.665, 0.374, 1457, 0.447],
    7: [0.697, 0.394, 1515, 0.470]
  };
  var ELEC = 1.2;                          // majoration de 20 % pour les voitures 100 % électriques
  var ABAT = { taux: 0.10, min: 509, max: 14555 };   // déduction forfaitaire de 10 %, revenus 2025
  var KEY = "vtcr-calc-ik";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var eur3 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 3, maximumFractionDigits: 3 });

  function bareme(cv, d) {
    var b = B[cv] || B[5];
    if (d <= 5000) return d * b[0];
    if (d <= 20000) return d * b[1] + b[2];
    return d * b[3];
  }
  function kpis(list) {
    return list.map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");
  }

  function calc() {
    var statut = $("statut").value;
    $("f-ratt").classList.toggle("hide", statut !== "ratt");
    $("f-sasu").classList.toggle("hide", statut !== "sasu");

    var km = num("km");
    var ik = bareme(+$("cv").value, km) * ($("elec").value === "1" ? ELEC : 1);
    var parKm = km ? ik / km : 0;
    var v = $("r-verdict"), cls, titre, texte, list = [], msg = "";

    $("r-net").textContent = km ? eur.format(ik) : "—";
    $("r-sub").textContent = km ? "soit " + eur.format(ik / 12) + " par mois et " + eur3.format(parKm) + " par km" : "indique tes kilomètres de l'année";

    if (statut === "ratt") {
      var sal = num("sal"), indem = num("indem"), autres = num("autres"), tmi = +$("tmi").value;
      var abat = sal ? Math.min(Math.max(sal * ABAT.taux, ABAT.min), ABAT.max, sal) : 0;
      var reels = ik + autres;
      var gain = reels - indem - abat;          // baisse du revenu imposable si tu choisis les frais réels
      var plafond = Math.max(sal - abat, 0);    // le salaire imposable ne descend pas sous zéro dans l'estimation
      var depasse = gain > plafond;
      var impot = Math.min(Math.max(gain, 0), plafond) * tmi;
      if (gain > 0) {
        cls = "ok"; titre = "Les frais réels sont plus avantageux";
        texte = "Avec les frais réels, ton revenu imposable baisse de " + eur.format(gain) + " de plus qu'avec la déduction de 10 %." + (tmi ? " Environ " + eur.format(impot) + " d'impôt en moins." : " Tu n'es pas imposable : le choix ne change pas ton impôt cette année.");
      } else {
        cls = "mid"; titre = "Garde la déduction de 10 %";
        texte = "Tes frais réels, une fois retirés les frais déjà remboursés par ton employeur, ne dépassent pas la déduction forfaitaire de " + eur.format(abat) + ".";
      }
      list = [[eur.format(abat), "de déduction forfaitaire de 10 %"], [eur.format(reels), "de frais réels (indemnités + autres frais)"],
              [eur.format(Math.max(gain, 0)), "de revenu imposable en moins"], [eur.format(impot), "d'impôt économisé, estimation"]];
      msg = (depasse ? "Tes frais réels dépassent ton salaire : l'impôt estimé ici s'arrête à ton salaire, l'excédent peut réduire les autres revenus du foyer. " : "") + "Pour choisir les frais réels, coche l'option sur ta déclaration (case 1AK) et indique le total. Garde le relevé de tes kilomètres et tes justificatifs pendant trois ans.";
    } else if (statut === "sasu") {
      var cout = num("cout"), is = +$("is").value;
      cls = "ok"; titre = "Ta société peut te verser " + eur.format(ik) + " par an";
      texte = "Ces indemnités ne sont pas imposables pour toi, dans la limite du barème, et elles sont déduites du bénéfice de la société. Condition : la voiture est à ton nom et tu tiens un relevé de tes trajets.";
      list = [[eur.format(ik / 12), "versés chaque mois, sans impôt ni cotisations"], [eur.format(ik * is), "d'impôt sur les sociétés évité"]];
      if (cout) {
        var ecart = ik - cout;
        list.push([eur.format(cout), "de coût réel de ta voiture sur l'année"]);
        list.push([eur.format(Math.abs(ecart)), ecart >= 0 ? "de plus que ce que la voiture te coûte" : "de moins que ce que la voiture te coûte"]);
        msg = ecart >= 0 ? "Le barème rembourse plus que ce que ta voiture te coûte réellement : garder la voiture à ton nom et te verser des indemnités est intéressant." : "Ta voiture coûte plus que le barème : la mettre au nom de la société, ou la louer par la société, peut être plus avantageux. Fais le calcul avec ton comptable.";
      } else {
        msg = "La société ne peut pas te verser d'indemnités et payer en plus le carburant ou l'assurance de cette voiture : c'est l'un ou l'autre.";
      }
    } else if (statut === "ae") {
      cls = "bad"; titre = "Pas d'indemnités kilométriques en auto-entrepreneur";
      texte = "En micro-entreprise, l'abattement forfaitaire de 50 % pour les services couvre déjà tous tes frais, voiture comprise. Tu ne peux rien déduire en plus.";
      $("r-net").textContent = "0 €";
      $("r-sub").textContent = "le barème vaudrait " + eur.format(ik) + ", mais tu ne peux pas t'en servir";
      list = [[eur.format(ik), "ce que donnerait le barème, pour information"], [eur3.format(parKm), "par km selon le barème"]];
      msg = "Si tes frais de voiture sont très élevés, compare les statuts : en société ou au réel, ils se déduisent.";
    } else {
      cls = "mid"; titre = "À valider avec ton comptable";
      texte = "Le barème est prévu pour les salariés et les professions libérales. Un chauffeur VTC en entreprise individuelle au réel déduit en principe les frais réels de sa voiture, sur justificatifs.";
      list = [[eur.format(ik), "ce que donnerait le barème, pour comparer"], [eur3.format(parKm), "par km selon le barème"]];
      msg = "Compare ce montant au coût réel de ta voiture pour savoir ce que tu laisses sur la table.";
    }

    v.className = "verdict " + cls;
    v.innerHTML = "<b>" + titre + "</b>" + texte;
    $("r-kpis").innerHTML = kpis(list);
    $("r-msg").textContent = msg;

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
