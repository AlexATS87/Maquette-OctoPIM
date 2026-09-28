(function () {
  var PAGES = [
    { group: "Introduction", items: [
      { href: "index.html", label: "Sommaire" },
      { href: "contexte.html", label: "Contexte du projet" }
    ]},
    { group: "Referentiel", items: [
      { href: "produit.html", label: "Definition d'un produit" },
      { href: "attributs.html", label: "Gestion des attributs" },
      { href: "groupes.html", label: "Groupes d'attributs" },
      { href: "categories.html", label: "Categories de produit" }
    ]},
    { group: "Usages", items: [
      { href: "liste-produits.html", label: "Liste des produits" },
      { href: "conditions.html", label: "Conditions commerciales" },
      { href: "import.html", label: "Fonction d'import" },
      { href: "export.html", label: "Fonction d'export" },
      { href: "dashboard.html", label: "Dashboard" }
    ]},
    { group: "Administration", items: [
      { href: "administration.html", label: "Administration" },
      { href: "roles.html", label: "Roles et permissions" },
      { href: "synthese.html", label: "Vue de synthese" },
      { href: "utilisateurs.html", label: "Gestion des utilisateurs" }
    ]},
    { group: "Modele & parcours", items: [
      { href: "mdd.html", label: "Modele de donnees" },
      { href: "workflows.html", label: "Workflows d'utilisation" }
    ]}
  ];

  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!file || file === "spec") file = "index.html";

  var html = '<div class="brand">OctoPIM specs</div>' +
    '<div class="sub">Source HTML · copie Confluence</div>';
  PAGES.forEach(function (g) {
    html += '<div class="group">' + g.group + "</div>";
    g.items.forEach(function (p) {
      var active = p.href === file ? " active" : "";
      html += '<a class="' + active.trim() + '" href="' + p.href + '">' + p.label + "</a>";
    });
  });

  var nav = document.getElementById("spec-nav");
  if (nav) nav.innerHTML = html;
})();

async function copySpecForConfluence() {
  var article = document.getElementById("spec-article");
  var btn = document.querySelector(".btn-copy");
  if (!article) return;
  var clone = article.cloneNode(true);
  var imgs = clone.querySelectorAll("img");
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    try {
      var res = await fetch(img.getAttribute("src"));
      var blob = await res.blob();
      img.setAttribute("src", await blobToDataUrl(blob));
    } catch (e) {}
  }
  var html = "<div>" + clone.innerHTML + "</div>";
  var text = article.innerText;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" })
      })
    ]);
    if (btn) {
      btn.classList.add("ok");
      btn.textContent = "Copie — coller dans Confluence";
      setTimeout(function () {
        btn.classList.remove("ok");
        btn.textContent = "Copier pour Confluence";
      }, 2500);
    }
  } catch (e) {
    if (btn) btn.textContent = "Copie impossible (autoriser le presse-papiers)";
  }
}

function blobToDataUrl(blob) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(r.result); };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
