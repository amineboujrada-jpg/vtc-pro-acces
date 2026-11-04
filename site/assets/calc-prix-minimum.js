/* Calculateur du prix minimum d'une course VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  var KEY = "vtcr-calc-prixmin";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var pct = function (id) { return Math.min(num(id), 95) / 100; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function calc() {
    var kmCourse = num("kmc"), kmVide = num("kmv");
    var h = (num("minc") + num("minv")) / 60;
    var tCom = pct("com"), tStat = pct("stat");
    var coutKm = num("conso") / 100 * num("prixcarb") + num("entretien");
    var coutRoute = (kmCourse + kmVide) * coutKm;
    var heuresMois = num("heuresmois");
    var coutFixe = heuresMois ? num("fixes") / heuresMois * h : 0;
    var objectif = num("objh") * h;
    var garde = 1 - tStat;

    var plancher = (coutRoute + coutFixe) / garde;          // montant versé pour ne rien perdre
    var verseMin = (coutRoute + coutFixe + objectif) / garde; // montant versé pour atteindre l'objectif
    var clientMin = verseMin / (1 - tCom);

    $("r-net").textContent = h ? eur.format(verseMin) : "—";
    $("r-net").classList.remove("neg");

    var kpis = [[eur.format(clientMin), "prix client minimum (avant commission)"],
                [eur.format(plancher), "seuil pour ne rien perdre"],
                [eur.format(coutRoute + coutFixe), "coût réel de la course"]];
    if (kmCourse) kpis.push([eur.format(verseMin / kmCourse), "minimum par km de course"]);
    $("r-kpis").innerHTML = kpis.map(function (k) { return '<div class="kpi"><b>' + k[0] + "</b><span>" + k[1] + "</span></div>"; }).join("");

    var statMontant = verseMin * tStat;
    $("r-tab").innerHTML = [
      ["Carburant et entretien (" + (kmCourse + kmVide).toLocaleString("fr-FR") + " km, dont " + kmVide.toLocaleString("fr-FR") + " à vide)", coutRoute],
      ["Part des charges fixes (" + Math.round(h * 60) + " min)", coutFixe],
      ["Charges de ton statut (" + String(Math.round(tStat * 1000) / 10).replace(".", ",") + " %)", statMontant],
      ["Ton revenu net visé", objectif]
    ].map(function (r) { return "<tr><td>" + r[0] + '</td><td class="n">' + eur.format(r[1]) + "</td></tr>"; }).join("") +
      '<tr class="tot"><td>Minimum à accepter (montant versé)</td><td class="n">' + eur.format(verseMin) + "</td></tr>";

    var offre = num("offre"), v = $("r-verdict"), msg = "";
    v.className = "verdict";
    if (offre && h) {
      var net = offre * garde - coutRoute - coutFixe;
      var netH = net / h;
      v.classList.add(net < 0 ? "bad" : netH < num("objh") ? "mid" : "ok");
      v.innerHTML = "<b>" + (net < 0 ? "À refuser : tu perds de l'argent" : netH < num("objh") ? "En dessous de ton objectif" : "Rentable") + "</b>" +
        "Pour " + eur.format(offre) + " versés, il te reste " + eur.format(net) + ", soit " + eur.format(netH) + " de l'heure.";
    } else {
      v.innerHTML = "<b>Tester une offre</b>Saisis le montant proposé par la plateforme pour savoir si la course vaut le coup.";
    }
    if (!h) msg = "Indique la durée de la course pour voir le résultat.";
    else if (kmVide > kmCourse) msg = "Tu fais plus de kilomètres à vide que de course : c'est souvent là que la rentabilité se perd.";
    else msg = "Le trajet à vide et le temps d'approche comptent autant que la course : c'est ce que les plateformes n'affichent pas.";
    $("r-msg").textContent = msg;

    try {
      var save = {};
      f.querySelectorAll("input").forEach(function (el) { save[el.id] = el.value; });
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch (e) { /* stockage indisponible : sans importance */ }
  }

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) Object.keys(saved).forEach(function (id) { if ($(id)) $(id).value = saved[id]; });
  } catch (e) { /* ignore */ }

  f.addEventListener("input", calc);
  f.addEventListener("submit", function (ev) { ev.preventDefault(); calc(); });
  $("raz").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    f.reset(); calc();
  });
  calc();
})();
