/* Comparateur des plateformes VTC — tout se calcule dans le navigateur, rien n'est envoyé. */
(function () {
  "use strict";
  var KEY = "vtcr-calc-plateformes";
  var f = document.getElementById("calc");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(String($(id).value).replace(",", ".")); return isFinite(v) && v > 0 ? v : 0; };
  var eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var eur0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); };
  var PF = [["uber", "Uber"], ["bolt", "Bolt"], ["heetch", "Heetch"], ["freenow", "FreeNow"], ["autre", "Autre"]];

  function calc() {
    var prix = num("prix");
    var tStat = Math.min(num("stat"), 90) / 100;
    var cout = num("cout");
    var courses = num("courses") * 52 / 12;
    var nomAutre = ($("nomautre").value || "").trim();

    var res = PF.map(function (p) {
      var com = Math.min(num("c-" + p[0]), 95) / 100;
      var verse = prix * (1 - com);
      var reste = verse * (1 - tStat) - cout;
      return { nom: p[0] === "autre" ? nomAutre : p[1], com: com, verse: verse, reste: reste };
    }).filter(function (r) { return r.nom; });

    var tri = res.slice().sort(function (a, b) { return b.reste - a.reste; });
    var best = tri[0], worst = tri[tri.length - 1];
    $("r-net").textContent = prix ? best.nom : "—";
    $("r-sub").textContent = prix ? "te laisse le plus sur une course à " + eur.format(prix) + " : " + eur.format(best.reste) + ", soit " + eur.format(best.reste - worst.reste) + " de plus qu'avec " + worst.nom : "Saisis le prix d'une course pour comparer.";

    var max = Math.max.apply(null, res.map(function (r) { return Math.max(r.verse, 0.01); }));
    $("r-bars").innerHTML = res.map(function (r) {
      return '<div class="pf"><div class="pf-h"><b>' + esc(r.nom) + "</b><span>" + String(Math.round(r.com * 1000) / 10).replace(".", ",") + ' % de commission</span></div>' +
        '<div class="pf-bar"><i style="width:' + Math.max(r.reste, 0) / max * 100 + '%;background:#3ccf7d"></i><i style="width:' + (r.verse - Math.max(r.reste, 0)) / max * 100 + '%;background:#f7b267"></i></div>' +
        '<div class="pf-n"><span>Versé ' + eur.format(r.verse) + '</span><b' + (r.reste < 0 ? ' style="color:#ff8a7a"' : "") + ">Il te reste " + eur.format(r.reste) + "</b></div></div>";
    }).join("");

    var ecartMois = (best.reste - worst.reste) * courses;
    $("r-kpis").innerHTML = courses && prix ? '<div class="kpi"><b>' + eur0.format(ecartMois) + "</b><span>d'écart par mois entre " + esc(best.nom) + " et " + esc(worst.nom) + ", pour " + Math.round(num("courses")) + " courses par semaine à ce prix</span></div>" : "";

    $("r-msg").textContent = "La commission ne dit pas tout : le nombre de courses, les majorations et les bonus changent d'une plateforme à l'autre. Mets tes propres taux, relevés sur tes relevés de paiement : ils varient selon la ville et, chez Uber, selon la course.";

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
