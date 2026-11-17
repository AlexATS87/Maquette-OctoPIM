// ============================================================
// AIDE EN LIGNE — un « ? » par écran ouvre un panneau latéral.
// Un seul texte par écran, ici. Masquable dans Préférences d'affichage.
// ============================================================
const HELP_SECTIONS = {
  import: {
    title: 'Importer des produits',
    html: `
      <h4>1. Choisir l'action</h4>
      <ul>
        <li><b>Ajout</b> : crée les produits du fichier. Un produit déjà connu est ignoré et listé dans le rapport.</li>
        <li><b>Modification</b> : met à jour les produits existants.</li>
        <li><b>Suppression</b> : retire les produits du fichier (EAN ou Code SAP suffit).</li>
      </ul>
      <h4>2. Préparer le fichier</h4>
      <ul>
        <li>Formats : .xlsx, .csv, ou .zip (tableur + images). Une ligne = un produit.</li>
        <li>L'en-tête de chaque colonne est le <b>code technique</b> de l'attribut (<code>ean</code>, <code>sap</code>, <code>nom</code>…) ou son libellé exact. Les colonnes sont alors reliées toutes seules.</li>
        <li>Le plus simple : partir d'un export avec la trame <b>Catalogue</b>, dont les en-têtes sont les codes techniques.</li>
        <li>Une <b>trame</b> enregistrée relie d'avance des en-têtes différents (fichier fournisseur, par exemple).</li>
      </ul>
      <h4>3. Relier les colonnes</h4>
      <ul>
        <li>Une colonne non reconnue se relie à la main, ou reste sur <b>-- Ignorer --</b>.</li>
      </ul>
      <h4>4. Reconnaissance des produits</h4>
      <ul>
        <li>Un produit est reconnu par son <b>EAN</b>, sinon par son <b>Code SAP</b> (code article magasin).</li>
      </ul>
      <h4>5. Contenu des cellules</h4>
      <ul>
        <li>En modification, une cellule <b>vide</b> ne change rien.</li>
        <li>Pour vider un champ, écrire <b>#VIDE</b> dans la cellule. Refusé sur un champ obligatoire.</li>
        <li>Champ calculé : une valeur différente du calcul est enregistrée comme valeur <b>forcée</b> ; une valeur identique laisse le calcul.</li>
        <li>Une valeur hors liste ou mal formée n'est pas reprise : elle est listée dans le rapport.</li>
      </ul>
      <h4>6. Rapport de fin</h4>
      <ul>
        <li>Compteurs : Ajoutés, Modifiés, Supprimés, Ignorés (produits déjà existants en ajout), Erreurs.</li>
        <li>Puis le détail : valeurs non reprises, champs calculés forcés, lignes refusées et leur raison.</li>
      </ul>`,
    // Visite guidée : blocs visibles à l'étape Configuration
    tour: [
      { el: () => document.querySelector('.import-stepper-inner'), title: 'Trois étapes',
        text: 'Configuration, puis Aperçu & Mapping (les colonnes du fichier reliées aux attributs), puis le rapport de fin.' },
      { el: () => (document.querySelector('.import-action-radio') || {}).parentElement, title: 'Action',
        text: 'Ajout, Modification ou Suppression. En modification, une cellule vide ne change rien ; #VIDE vide le champ.' },
      { el: () => helpBlock('#import-cat', '.field-row'), title: 'Catégorie cible',
        text: 'Catégorie des produits créés, quand le fichier n’a pas de colonne cat. Obligatoire en ajout.' },
      { el: () => helpBlock('#import-trame', '.field-row'), title: 'Trame',
        text: 'Relie d’avance les en-têtes du fichier aux attributs. [Télécharger] donne un fichier vide aux bons en-têtes (sans trame : Catalogue de la catégorie).' },
      { el: () => helpBlock('#import-required-list', '.field-row'), title: 'Champs obligatoires',
        text: 'Colonnes exigées en ajout. En modification, seules les colonnes présentes sont contrôlées, et #VIDE y est refusé.' },
      { el: () => helpBlock('#import-dropzone', '.field-group'), title: 'Fichier à importer',
        text: '.xlsx, .csv, ou .zip (tableur + images). En-têtes = codes techniques des attributs (ean, sap, nom…).' },
      { el: () => helpBlock('#visual-files-input', '.field-group'), title: 'Visuels en masse',
        text: 'Images seules ou .zip : le nom de chaque fichier désigne le produit et la vue, selon la règle de nommage des visuels.' }
    ]
  },

  dashboard: {
    title: 'Tableau de bord',
    html: `
      <h4>1. Lire les indicateurs</h4>
      <ul>
        <li><b>Total produits</b> : nombre de produits que vous avez le droit de voir. Un clic ouvre la liste.</li>
        <li><b>Répartition par catégorie</b> et <b>Évolution récente</b> (6 derniers mois) situent le catalogue.</li>
        <li><b>Produits incomplets</b> : produits dont la complétion est sous le seuil indiqué. Un clic ouvre la liste filtrée sur ces produits.</li>
        <li><b>Taux de complétion global</b> : moyenne du catalogue, comparée à l’objectif, avec le détail par catégorie.</li>
      </ul>
      <h4>2. Suivre le workflow</h4>
      <ul>
        <li>Quand le workflow est activé, un bloc compte les produits par étape (jalon le plus avancé atteint). Un clic sur une étape ouvre la liste des produits à cette étape.</li>
      </ul>
      <h4>3. Traiter les alertes</h4>
      <ul>
        <li>Chaque carte d’alerte affiche une règle et le nombre de produits concernés. Un clic ouvre la liste filtrée sur ces produits.</li>
      </ul>
      <h4>4. Vue fournisseur</h4>
      <ul>
        <li>Répartition des produits par fournisseur, avec ses catégories et ses marques. Un clic sur un fournisseur ouvre la liste filtrée.</li>
      </ul>
      <h4>Bon à savoir</h4>
      <ul>
        <li>Les chiffres ne portent que sur les catégories auxquelles vous avez accès.</li>
      </ul>`,
    tour: [
      { el: () => helpBlock('#kpi-total', '.dash-kpi-card'), title: 'Total produits',
        text: 'Nombre de produits accessibles. Un clic ouvre la liste des produits.' },
      { el: () => helpBlock('#donut-svg', '.dash-kpi-card'), title: 'Répartition par catégorie',
        text: 'Part de chaque catégorie dans le catalogue.' },
      { el: () => helpBlock('#dashboard-evolution-chart', '.dash-kpi-card'), title: 'Évolution récente',
        text: 'Évolution du catalogue sur les 6 derniers mois.' },
      { el: () => helpBlock('#kpi-incomplets', '.dash-kpi-card'), title: 'Produits incomplets',
        text: 'Produits sous le seuil de complétion. Un clic ouvre la liste filtrée.' },
      { el: () => helpBlock('#bar-global', '.dash-kpi-card'), title: 'Complétion globale',
        text: 'Moyenne du catalogue face à l’objectif, avec le détail par catégorie.' },
      { el: () => { const e = document.querySelector('#dashboard-workflow .dash-kpi-card'); return e && e.offsetHeight ? e : null; }, title: 'Workflow',
        text: 'Produits par étape du workflow. Un clic sur une étape ouvre la liste correspondante.' },
      { el: () => { const e = document.getElementById('dashboard-alerts'); return e && e.offsetHeight ? e : null; }, title: 'Alertes',
        text: 'Une carte par règle d’alerte, avec le nombre de produits concernés. Un clic ouvre la liste filtrée.' },
      { el: () => helpBlock('#supplier-chart-container', '.dash-kpi-card'), title: 'Vue fournisseur',
        text: 'Produits par fournisseur, catégories et marques. Un clic sur un fournisseur ouvre la liste filtrée.' }
    ]
  },

  products: {
    title: 'Liste des produits',
    html: `
      <h4>1. Trouver des produits</h4>
      <ul>
        <li>La <b>recherche</b> porte sur le code, l’EAN, la désignation et la marque.</li>
        <li>Le filtre <b>catégorie</b> limite la liste à une catégorie.</li>
        <li>Dans l’en-tête de chaque colonne : cliquer sur le libellé trie, le petit triangle filtre. [Effacer les filtres] remet tout à zéro.</li>
      </ul>
      <h4>2. Choisir la vue</h4>
      <ul>
        <li><b>Synthèse</b> : les colonnes principales, choisies par l’administrateur.</li>
        <li><b>Détaillée</b> : tous les attributs de la catégorie choisie, avec des puces pour afficher ou masquer chaque groupe d’attributs.</li>
      </ul>
      <h4>3. Ouvrir ou créer une fiche</h4>
      <ul>
        <li>Cliquer sur le produit ouvre sa fiche.</li>
        <li>[+ Nouveau produit] ouvre le formulaire de création.</li>
      </ul>
      <h4>4. Agir sur plusieurs produits</h4>
      <ul>
        <li>Cocher des lignes fait apparaître la barre bleue et son menu <b>Actions</b> : modifier un attribut, comparer (2 produits au moins), exporter la sélection, supprimer, désélectionner.</li>
        <li>Si une action n’est pas proposée, contactez l’administrateur de la solution.</li>
      </ul>
      <h4>5. Parcourir</h4>
      <ul>
        <li>La pagination, au-dessus et sous le tableau, indique le nombre de produits affichés.</li>
      </ul>`,
    tour: [
      { el: () => document.getElementById('products-search'), title: 'Recherche',
        text: 'Code, EAN, désignation ou marque.' },
      { el: () => document.getElementById('filter-cat'), title: 'Catégorie',
        text: 'Limite la liste à une catégorie. En vue Détaillée, elle donne accès aux groupes d’attributs.' },
      { el: () => helpBlock('#btn-view-synth', '.view-toggle-pill'), title: 'Vue',
        text: 'Synthèse (colonnes principales) ou Détaillée (tous les attributs d’une catégorie).' },
      { el: () => document.getElementById('btn-new-product'), title: 'Nouveau produit',
        text: 'Ouvre le formulaire de création d’un produit.' },
      { el: () => helpBlock('#pagination-info', 'div[style*="justify-content"]'), title: 'Pagination',
        text: 'Nombre de produits affichés et navigation entre les pages.' },
      { el: () => helpBlock('#products-thead input[type=checkbox]', 'th'), title: 'Sélection',
        text: 'Cocher des produits ouvre le menu Actions : modifier un attribut, comparer, exporter, supprimer.' },
      { el: () => document.getElementById('products-scroll'), title: 'Tableau',
        text: 'Cliquer sur un libellé de colonne trie, sur le triangle filtre. Cliquer sur un produit ouvre sa fiche.' }
    ]
  },

  product: {
    title: 'Fiche produit',
    html: `
      <h4>1. Lire le bandeau</h4>
      <ul>
        <li>Le bandeau du haut résume le produit : visuel, désignation, complétion, étape du workflow et principaux champs.</li>
        <li>Un champ surligné en rouge est manquant : cliquer dessus ouvre l’onglet où le renseigner.</li>
      </ul>
      <h4>2. Compléter les onglets</h4>
      <ul>
        <li>Chaque onglet est un groupe d’attributs. Son pourcentage de complétion s’affiche dans son libellé, avec une coche à 100 %.</li>
        <li>Un astérisque (*) marque un champ obligatoire.</li>
        <li>Un champ calculé se remplit tout seul. Une valeur saisie à la place est enregistrée comme valeur forcée.</li>
      </ul>
      <h4>3. Enregistrer</h4>
      <ul>
        <li>[Enregistrer] (ou <code>Ctrl+S</code>) valide les modifications. Il est refusé tant qu’un champ obligatoire est vide.</li>
        <li>Quitter la fiche avec des modifications non enregistrées déclenche une demande de confirmation.</li>
        <li>Si l’enregistrement n’est pas proposé, contactez l’administrateur de la solution.</li>
      </ul>
      <h4>4. Consulter l’historique</h4>
      <ul>
        <li>Le dernier onglet, <b>Historique</b>, liste chaque modification enregistrée : date, utilisateur, champ, ancienne et nouvelle valeur.</li>
      </ul>`,
    tour: [
      { el: () => document.querySelector('.topbar-detail.btn'), title: 'Retour',
        text: 'Revient à la liste des produits.' },
      { el: () => document.getElementById('product-header-left'), title: 'Bandeau',
        text: 'Visuel, désignation et principaux champs. Un champ en rouge est manquant : un clic ouvre l’onglet où le renseigner.' },
      { el: () => helpBlock('#product-header-left .ps-comp', '.ps-item'), title: 'Complétion',
        text: 'Part des champs qui comptent dans la complétion et sont renseignés.' },
      { el: () => document.getElementById('product-tabs'), title: 'Onglets',
        text: 'Un onglet par groupe d’attributs, avec sa complétion. Une coche indique 100 %.' },
      { el: () => document.getElementById('product-tab-contents'), title: 'Champs',
        text: 'Un astérisque (*) marque un champ obligatoire. Un champ calculé se remplit seul ; une valeur saisie est enregistrée comme forcée.' },
      { el: () => document.getElementById('btn-save-product'), title: 'Enregistrer',
        text: 'Valide les modifications (Ctrl+S). Refusé tant qu’un champ obligatoire est vide.' },
      { el: () => { const t = document.querySelectorAll('#product-tabs .tab'); return t.length ? t[t.length - 1] : null; }, title: 'Historique',
        text: 'Dernier onglet : date, utilisateur, champ, ancienne et nouvelle valeur de chaque modification enregistrée.' }
    ]
  },

  exports: {
    title: 'Exporter des produits',
    html: `
      <h4>1. Vérifier le périmètre</h4>
      <ul>
        <li>Le périmètre reprend la recherche, la catégorie et les filtres de colonne de la liste des produits, ainsi que la sélection en cours. [Tout exporter] ignore la sélection.</li>
        <li>Pour le changer, retourner à la liste, puis revenir ici.</li>
      </ul>
      <h4>2. Choisir la trame</h4>
      <ul>
        <li>La trame fixe les colonnes du fichier. <b>Catalogue</b> exporte les attributs avec leurs codes techniques ; une trame de partenaire respecte son format.</li>
        <li>Cocher ou décocher un groupe, ou un champ après avoir déplié le groupe, ajuste les colonnes.</li>
        <li>Avec une trame de partenaire, un compteur rouge signale les valeurs manquantes d’une colonne bloquante : l’export est alors refusé.</li>
        <li>Enregistrer une nouvelle trame n’est proposé qu’aux personnes autorisées. Sinon, contactez l’administrateur de la solution.</li>
      </ul>
      <h4>3. Exporter</h4>
      <ul>
        <li>Choisir le format (.xlsx, .csv ou .zip), puis [Exporter]. Le fichier est téléchargé.</li>
      </ul>`,
    tour: [
      { el: () => document.getElementById('export-scope'), title: 'Périmètre',
        text: 'Produits exportés : recherche, catégorie, filtres de la liste et sélection en cours. [Tout exporter] ignore la sélection.' },
      { el: () => helpBlock('#export-trame select', 'div'), title: 'Trame',
        text: 'Fixe les colonnes du fichier : Catalogue, ou le format d’un partenaire.' },
      { el: () => document.querySelector('#export-trame > div:last-child'), title: 'Colonnes',
        text: 'Cocher un groupe ou déplier-le pour cocher champ par champ. Une valeur manquante en colonne bloquante est signalée en rouge.' },
      { el: () => document.querySelector('#export-actions select'), title: 'Format',
        text: '.xlsx, .csv ou .zip.' },
      { el: () => document.querySelector('#export-actions .btn-primary'), title: 'Exporter',
        text: 'Télécharge le fichier. L’export est refusé si une colonne bloquante est vide.' }
    ]
  },

  // ---------- Administration ----------
  admin: {
    title: 'Administration',
    html: `
      <h4>1. Choisir un module</h4>
      <ul>
        <li>Chaque <b>tuile</b> ouvre un module de réglage de l’outil : catégories, groupes d’attributs, attributs, groupe Synthèse, référentiels, utilisateurs et groupes, alertes, trames, champs calculés, workflow, préférences de l’application.</li>
        <li>Le nombre affiché sous le titre est le nombre d’éléments du module (le workflow affiche <b>Off</b> quand il est désactivé).</li>
      </ul>
      <h4>2. Obtenir de l’aide sur un module</h4>
      <ul>
        <li>L’ampoule dans le coin d’une tuile ouvre l’aide du module sans l’ouvrir. Une fois dans le module, la même ampoule est à côté du titre.</li>
      </ul>
      <h4>Bon à savoir</h4>
      <ul>
        <li>Seules les tuiles des modules ouverts à votre groupe d’affectation s’affichent. S’il en manque une, contactez l’administrateur de la solution.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#admin-grid'), title: 'Les modules',
        text: 'Une tuile par module de réglage. Un clic sur une tuile ouvre le module.' },
      { el: () => helpVis('#admin-grid .admin-card-count'), title: 'Compteur',
        text: 'Nombre d’éléments du module. Pour le workflow, Off indique qu’il est désactivé.' },
      { el: () => helpVis('#admin-grid .admin-card-help .help-btn'), title: 'Ampoule d’une tuile',
        text: 'Ouvre l’aide du module sans quitter cette page.' }
    ]
  },

  'admin-categories': {
    title: 'Catégories',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Une catégorie regroupe des produits de même nature. Elle est associée à des <b>groupes d’attributs</b> : ce sont eux qui forment les onglets de la fiche des produits de cette catégorie.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>[+ Nouvelle catégorie] ouvre le formulaire de création (nom, couleur).</li>
        <li>[Modifier] (ou [Voir] sans droit d’écriture) ouvre la catégorie : nom, couleur, puis les groupes associés.</li>
        <li>Dans <b>Groupes associés</b>, la liste donne l’ordre des groupes ; la recherche en dessous permet d’en ajouter.</li>
        <li>La corbeille supprime la catégorie, après confirmation. Elle n’apparaît qu’avec le droit de suppression.</li>
      </ul>
      <h4>Bon à savoir</h4>
      <ul>
        <li>Le code technique est déduit du nom et ne se saisit pas.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#btn-new-category'), title: 'Nouvelle catégorie',
        text: 'Ouvre le formulaire de création : nom et couleur.' },
      { el: () => helpVis('#page-admin-categories .table-container'), title: 'Liste des catégories',
        text: 'Nom, code technique, couleur et nombre de groupes d’attributs de chaque catégorie.' },
      { el: () => helpVis('#cats-tbody tr td:nth-child(4)'), title: 'Groupes',
        text: 'Nombre de groupes d’attributs associés, c’est-à-dire d’onglets sur la fiche.' },
      { el: () => helpVis('#cats-tbody .action-btn'), title: 'Modifier ou voir',
        text: 'Ouvre la catégorie : nom, couleur, groupes associés et leur ordre.' },
      { el: () => helpVis('#cats-tbody .btn-trash'), title: 'Supprimer',
        text: 'Supprime la catégorie après confirmation.' }
    ]
  },

  'admin-groups': {
    title: 'Groupes d’attributs',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Un groupe d’attributs est une liste d’attributs affichée comme un <b>onglet</b> sur la fiche produit. Une catégorie reprend les groupes qu’on lui associe.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>[+ Nouveau groupe] crée un groupe.</li>
        <li><b>Glisser</b> une carte par sa poignée change l’ordre des groupes.</li>
        <li>[Modifier] (ou [Voir]) ouvre le groupe : nom, <b>Complétion pour</b> (les groupes d’affectation concernés) et contenu de l’onglet.</li>
        <li>Dans le contenu, ajouter un attribut ou un <b>intertitre</b>, glisser pour réordonner, retirer avec la croix.</li>
        <li>La corbeille supprime le groupe, après confirmation, sauf pour un groupe système (cadenas) ou sans droit de suppression.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#btn-new-group'), title: 'Nouveau groupe',
        text: 'Crée un groupe d’attributs.' },
      { el: () => helpVis('#attr-groups-list'), title: 'Liste des groupes',
        text: 'Une carte par groupe, avec ses attributs en pastilles et leur nombre.' },
      { el: () => helpVis('#attr-groups-list .drag-handle'), title: 'Réordonner',
        text: 'Glisser la carte par cette poignée pour changer l’ordre des groupes.' },
      { el: () => helpVis('#attr-groups-list .action-btn'), title: 'Modifier ou voir',
        text: 'Ouvre le groupe : nom, groupes d’affectation concernés par la complétion, attributs et intertitres de l’onglet.' }
    ]
  },

  'admin-attributes': {
    title: 'Attributs',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Un attribut est un champ de la fiche produit : son type, ses règles de saisie et son groupe se règlent ici.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>La <b>recherche</b> porte sur le nom, le code technique et le type.</li>
        <li>Cliquer sur l’en-tête d’une colonne trie la liste.</li>
        <li>Cliquer sur le nom d’un attribut ouvre sa fiche : identité (nom, code, type, groupe, obligatoire, compte dans la complétion, affichage conditionnel, largeur) et saisie (champ calculé, texte d’aide, longueur, masque, options selon le type).</li>
        <li>[+ Nouvel attribut] ouvre la création.</li>
        <li>La corbeille supprime l’attribut, sauf attribut système (cadenas) ou sans droit de suppression.</li>
      </ul>
      <h4>3. Lire la colonne Rempli</h4>
      <ul>
        <li>Part des produits concernés qui ont une valeur. À 0 %, l’attribut est un candidat à la suppression.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#attrs-search'), title: 'Recherche',
        text: 'Nom, code technique ou type de l’attribut.' },
      { el: () => helpVis('#btn-new-attr'), title: 'Nouvel attribut',
        text: 'Ouvre la création d’un attribut.' },
      { el: () => helpVis('#attrs-thead'), title: 'Colonnes triables',
        text: 'Un clic sur un en-tête trie la liste : nom, type, groupe, obligatoire, complétion, taux de remplissage.' },
      { el: () => helpVis('#attrs-tbody .cell-link'), title: 'Ouvrir un attribut',
        text: 'Le nom ouvre la fiche de l’attribut : identité, groupe, règles de saisie.' },
      { el: () => helpVis('#attrs-thead th:nth-child(6)'), title: 'Rempli',
        text: 'Part des produits concernés qui ont une valeur. À 0 %, l’attribut est candidat à la suppression.' }
    ]
  },

  'admin-synthese': {
    title: 'Groupe Synthèse',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Le groupe Synthèse définit les colonnes de la vue <b>Synthèse</b> de la liste des produits, communes à toutes les catégories.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>Dans <b>Colonnes actives</b>, glisser pour réordonner, la croix retire une colonne. Le compteur indique le nombre d’attributs : 10 au maximum (les actions ne comptent pas). Au-delà, l’ajout est refusé.</li>
        <li><b>Ajouter un attribut</b> : choisir dans la liste, puis [+ Ajouter].</li>
        <li><b>Ajouter une action</b> : choisir l’action (par exemple Supprimer), puis [+ Ajouter].</li>
        <li><b>Visuel de la synthèse</b> : l’attribut Image affiché en vignette.</li>
        <li><b>Attributs système</b> : [+ Ajouter] les place dans les colonnes.</li>
      </ul>`,
    tour: [
      { el: () => helpBlock('#synthese-items-list', '.field-group'), title: 'Colonnes actives',
        text: 'Colonnes de la vue Synthèse. Glisser pour réordonner, la croix pour retirer.' },
      { el: () => helpBlock('#synth-add-attr', '.field-group'), title: 'Ajouter un attribut',
        text: 'Choisir un attribut puis [+ Ajouter]. Le nombre de colonnes est limité.' },
      { el: () => helpBlock('#synth-add-action', '.field-group'), title: 'Ajouter une action',
        text: 'Place une action (par exemple Supprimer) parmi les colonnes.' },
      { el: () => helpBlock('#synth-visual', '.field-group'), title: 'Visuel',
        text: 'Attribut Image affiché en vignette dans la synthèse.' },
      { el: () => helpVis('#synth-system'), title: 'Attributs système',
        text: 'Attributs gérés par l’outil, ajoutables en colonne.' }
    ]
  },

  'admin-referentials': {
    title: 'Référentiels',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Un référentiel est un tableau de données de référence (fournisseurs, marques, conditions…). Chaque onglet est un référentiel.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>Saisir directement dans le tableau, avec [+ Ligne] et [+ Colonne]. La recherche filtre les lignes.</li>
        <li>[Importer un fichier] reprend un tableur ou un .csv : les colonnes sont reconnues par leur nom.</li>
        <li>Une colonne peut être une <b>clé</b> reliée à un attribut du produit : le référentiel s’applique alors au produit selon cet attribut.</li>
        <li>[+ Référentiel] (dernier onglet) en crée un nouveau.</li>
        <li>La case <b>Groupe d’attributs</b> crée un groupe avec les champs du référentiel. Elle demande qu’une colonne clé soit reliée avant.</li>
      </ul>
      <h4>Bon à savoir</h4>
      <ul>
        <li>Une ligne ou une colonne utilisée ne peut pas être supprimée. La flèche circulaire d’une ligne ouvre son historique.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#page-admin-suppliers .acc-tabs'), title: 'Onglets',
        text: 'Un onglet par référentiel, avec son nombre de lignes. [+ Référentiel] en crée un.' },
      { el: () => helpVis('#page-admin-suppliers .acc-toolbar'), title: 'Barre d’outils',
        text: 'Recherche, case Groupe d’attributs, ajout de lignes et de colonnes, import d’un fichier.' },
      { el: () => helpVis('#page-admin-suppliers .ref-group-check'), title: 'Groupe d’attributs',
        text: 'Crée un groupe avec les champs du référentiel. Une colonne clé doit d’abord être reliée à un attribut.' },
      { el: () => helpVis('#page-admin-suppliers .ref-key-select'), title: 'Colonne clé',
        text: 'Relie une colonne à un attribut du produit. Sans clé, la colonne est une valeur.' },
      { el: () => helpVis('#page-admin-suppliers .ref-table'), title: 'Tableau',
        text: 'Les lignes se modifient directement. La corbeille supprime une ligne si elle n’est pas utilisée.' }
    ]
  },

  'admin-roles': {
    title: 'Utilisateurs et groupes',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Trois onglets règlent qui voit et fait quoi : les <b>utilisateurs</b>, les <b>groupes d’affectation</b> et les <b>niveaux de droits</b>.</li>
      </ul>
      <h4>2. Utilisateurs</h4>
      <ul>
        <li>Liste filtrable par nom, par e-mail et par niveau. Le niveau vient d’Okta et ne se change pas ici.</li>
        <li>On choisit le <b>groupe d’affectation</b> de chaque personne. Sans groupe, elle voit tout : le compteur « sans groupe » aide à les repérer.</li>
      </ul>
      <h4>3. Groupes d’affectation</h4>
      <ul>
        <li>[+ Groupe] en crée un. [Régler] ouvre ses réglages : catégories visibles, menus visibles et modules d’administration ouverts.</li>
      </ul>
      <h4>4. Niveaux de droits</h4>
      <ul>
        <li>Une matrice coche, pour chaque niveau, ce qu’il a le droit de faire (consulter, créer et modifier, supprimer, importer, exporter, modules d’administration). L’Administrateur a toujours tous les droits et il est seul à gérer les utilisateurs, les groupes et les niveaux.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#roles-grid .acc-tabs'), title: 'Trois onglets',
        text: 'Utilisateurs, groupes d’affectation et niveaux de droits.' },
      { el: () => helpVis('#roles-grid .acc-tabs .tab:nth-child(1)'), title: 'Utilisateurs',
        text: 'Liste filtrable. Le niveau vient d’Okta ; le groupe d’affectation se choisit ici. Sans groupe, une personne voit tout.' },
      { el: () => helpVis('#roles-grid .acc-tabs .tab:nth-child(2)'), title: 'Groupes d’affectation',
        text: 'Chaque groupe fixe les catégories, les menus et les modules d’administration visibles.' },
      { el: () => helpVis('#roles-grid .acc-tabs .tab:nth-child(3)'), title: 'Niveaux de droits',
        text: 'Matrice des droits de chaque niveau (produits, imports, exports, administration).' },
      { el: () => helpVis('#roles-grid .acc-tab-body'), title: 'Contenu de l’onglet',
        text: 'Le tableau de l’onglet choisi.' }
    ]
  },

  'admin-alerts': {
    title: 'Alertes',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Une alerte est une règle : elle repère les produits qui remplissent <b>toutes</b> ses conditions. Chaque alerte devient une carte du tableau de bord.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>[+ Alerte] ouvre la création : nom, conditions (attribut, opérateur, valeur) et description. [+ Condition] en ajoute une.</li>
        <li>Un champ vide ne déclenche jamais l’alerte.</li>
        <li>[Modifier] (ou [Voir]) rouvre l’alerte. La corbeille la supprime, avec le droit de suppression.</li>
        <li>La colonne <b>Produits</b> donne le nombre de produits concernés.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#page-admin-alerts .btn-primary'), title: 'Nouvelle alerte',
        text: 'Ouvre la création : nom, conditions et description.' },
      { el: () => helpVis('#page-admin-alerts .table-container'), title: 'Liste des alertes',
        text: 'Une ligne par alerte, avec ses conditions et sa description.' },
      { el: () => helpVis('#page-admin-alerts thead th:nth-child(2)'), title: 'Conditions',
        text: 'Toutes les conditions doivent être vraies pour qu’un produit soit concerné.' },
      { el: () => helpVis('#page-admin-alerts thead th:nth-child(4)'), title: 'Produits',
        text: 'Nombre de produits concernés par l’alerte.' },
      { el: () => helpVis('#page-admin-alerts .action-btn'), title: 'Modifier ou voir',
        text: 'Rouvre l’alerte dans une fenêtre.' }
    ]
  },

  'admin-trames': {
    title: 'Trames d’import / export',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Une trame fixe les colonnes d’un fichier : à l’import elle relie les en-têtes d’un fichier aux attributs, à l’export elle décide des colonnes produites.</li>
      </ul>
      <h4>2. La liste</h4>
      <ul>
        <li>Chaque trame indique son usage (import, export), ses catégories et son nombre de colonnes. Un clic sur le nom l’ouvre.</li>
        <li>[+ Trame] en crée une. La trame <b>Catalogue</b> (cadenas) est automatique et ne se modifie pas.</li>
      </ul>
      <h4>3. Une trame</h4>
      <ul>
        <li>Nom, nom de la feuille, <b>Usage</b> (import, export) et <b>Catégories</b> (aucune cochée = toutes).</li>
        <li>[+ Colonne] ajoute une colonne : bloc, intitulé, source (un attribut, une valeur fixe ou vide) et case <b>Bloquante à l’export</b>.</li>
        <li>Les flèches réordonnent les colonnes ; la corbeille supprime la colonne ou la trame.</li>
        <li>[← Trames] revient à la liste.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#page-admin-export-formats .btn-primary'), title: 'Nouvelle trame',
        text: 'Crée une trame vide, à remplir colonne par colonne.' },
      { el: () => helpVis('#page-admin-export-formats .table-container table:not(.ref-table)'), title: 'Liste des trames',
        text: 'Usage, catégories et nombre de colonnes de chaque trame. Un clic sur le nom l’ouvre.' },
      { el: () => helpVis('#page-admin-export-formats .cell-link'), title: 'Ouvrir une trame',
        text: 'Le nom ouvre la trame : usage, catégories et colonnes.' },
      { el: () => helpVis('#page-admin-export-formats .trame-settings'), title: 'Usage et catégories',
        text: 'Import, export, et catégories concernées (aucune cochée = toutes).' },
      { el: () => helpVis('#page-admin-export-formats .fmt-table'), title: 'Colonnes',
        text: 'Une ligne par colonne du fichier : bloc, intitulé, source et colonne bloquante à l’export.' },
      { el: () => helpVis('#page-admin-export-formats .fmt-table th:nth-child(6)'), title: 'Bloquante à l’export',
        text: 'Cochée, une valeur manquante dans cette colonne refuse l’export.' }
    ]
  },

  'admin-calc': {
    title: 'Champs calculés',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Un champ calculé se remplit tout seul à partir d’autres champs du produit. Ce module liste ces champs et leur règle.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>La recherche et le filtre (Tous, Tables, Formules) réduisent la liste.</li>
        <li>Cliquer sur un champ ouvre son calcul. Quand c’est permis, un bouton bascule entre <b>Table</b> et <b>Formule</b>.</li>
        <li><b>Table</b> : des conditions en colonnes, des lignes de valeurs et un résultat. [+ Condition] et [+ Ligne] complètent la table ; une ligne jamais atteinte est signalée.</li>
        <li><b>Formule</b> : on saisit la formule et on peut s’aider des opérateurs et des codes de champs affichés dessous.</li>
        <li>Une modification reste « Non enregistrée » tant qu’on n’a pas cliqué sur [Enregistrer].</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#page-admin-calc input'), title: 'Recherche',
        text: 'Cherche un champ calculé par son nom ou son code.' },
      { el: () => helpVis('#page-admin-calc select'), title: 'Filtre',
        text: 'Affiche tous les champs, ou seulement ceux calculés par une table ou par une formule.' },
      { el: () => helpVis('#page-admin-calc .calc-card-head'), title: 'Un champ calculé',
        text: 'Un clic ouvre ou ferme son calcul. La pastille indique son mode.' }
    ]
  },

  'admin-workflow': {
    title: 'Workflow',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Le workflow suit l’avancement des produits par <b>jalons</b>. Chaque jalon a une règle ; l’étape d’un produit est le jalon le plus avancé qu’il atteint.</li>
      </ul>
      <h4>2. Gestes</h4>
      <ul>
        <li>L’interrupteur active ou désactive le workflow. Désactivé, la colonne <b>À cette étape</b> reste vide.</li>
        <li>[+ Jalon] ajoute un jalon. Les flèches le déplacent, la corbeille le supprime.</li>
        <li>La règle d’un jalon : <b>Complétion des onglets ≥</b> un seuil sur les onglets cochés, <b>Champ renseigné</b>, ou <b>Champ égal à</b> une valeur.</li>
        <li>Les colonnes <b>Atteint</b> et <b>À cette étape</b> comptent les produits ; le nombre de la seconde ouvre la liste de ces produits.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#page-admin-workflow .wf-toggle'), title: 'Activer le workflow',
        text: 'Interrupteur général du workflow.' },
      { el: () => helpVis('#page-admin-workflow .btn-primary'), title: 'Nouveau jalon',
        text: 'Ajoute un jalon à la fin de la liste.' },
      { el: () => helpVis('#page-admin-workflow table'), title: 'Jalons',
        text: 'Nom du jalon, règle, nombre de produits qui l’atteignent et nombre de produits à cette étape.' },
      { el: () => helpVis('#page-admin-workflow .wf-rule'), title: 'Règle',
        text: 'Complétion des onglets, champ renseigné, ou champ égal à une valeur.' }
    ]
  },

  'admin-prefs': {
    title: 'Préférences application',
    html: `
      <h4>1. À quoi ça sert</h4>
      <ul>
        <li>Réglages qui s’appliquent à tous les utilisateurs de l’application.</li>
      </ul>
      <h4>2. Réglages</h4>
      <ul>
        <li><b>Nombre de produits par page</b> : 25, 50 ou 100 dans la liste des produits.</li>
        <li><b>Seuil de complétion</b> : en dessous, un produit est compté incomplet (tableau de bord).</li>
        <li><b>Import de visuels</b> : le nom d’un fichier image se compose du code SAP ou EAN, d’un séparateur et du suffixe du visuel.</li>
        <li>[Enregistrer] applique les réglages, [Annuler] revient à l’administration.</li>
      </ul>`,
    tour: [
      { el: () => helpVis('#pref-page-size'), title: 'Produits par page',
        text: '25, 50 ou 100 produits dans la liste.' },
      { el: () => helpVis('#pref-seuil'), title: 'Seuil de complétion',
        text: 'Pourcentage sous lequel un produit est compté incomplet.' },
      { el: () => helpBlock('#pref-visual-key', '.field-row'), title: 'Nom des fichiers de visuels',
        text: 'Code SAP ou EAN, séparateur et suffixe du visuel. L’exemple se met à jour.' },
      { el: () => helpVis('#page-admin-prefs .btn-primary'), title: 'Enregistrer',
        text: 'Applique les réglages et revient à l’administration.' }
    ]
  }
};

const BULB_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg>';

// Bloc visible seulement (une page masquée ou un bloc absent donne null)
function helpVis(sel) {
  const e = document.querySelector(sel);
  return e && e.offsetHeight ? e : null;
}

function helpBlock(sel, up) {
  const e = document.querySelector(sel);
  return e ? (e.closest(up) || e) : null;
}

function helpButtonHtml(key) {
  if (!HELP_SECTIONS[key] || userPrefs.showHelp === false) return '';
  return `<button type="button" class="help-btn" title="Aide" aria-label="Aide" onclick="event.stopPropagation();openHelp('${key}')">${BULB_ICON}</button>`;
}

function openHelp(key) {
  const s = HELP_SECTIONS[key];
  if (!s) return;
  let panel = document.getElementById('help-panel');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'help-panel';
    panel.className = 'help-panel';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div class="help-panel-head">
      <span>${escapeHtml(s.title)}</span>
      ${s.tour ? `<button type="button" class="btn btn-secondary help-tour-btn" onclick="startTour('${key}')">Visite guidée</button>` : ''}
      <button type="button" class="help-close" aria-label="Fermer" onclick="closeHelp()">&#10005;</button>
    </div>
    <div class="help-panel-body">${s.html}</div>`;
  panel.classList.add('open');
}

function closeHelp() {
  const panel = document.getElementById('help-panel');
  if (panel) panel.classList.remove('open');
}

// ---------- Visite guidée : projecteur sur un bloc, le reste assombri ----------
let _tour = null;

function startTour(key) {
  const steps = ((HELP_SECTIONS[key] || {}).tour || []).filter(t => t.el());
  if (!steps.length) return;
  closeHelp();
  _tour = { key, steps, i: 0 };
  if (!document.getElementById('tour-spot')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div id="tour-block" class="tour-block"></div><div id="tour-spot" class="tour-spot"></div><div id="tour-bubble" class="tour-bubble"></div>');
    window.addEventListener('resize', showTourStep);
  }
  showTourStep();
}

function showTourStep() {
  if (!_tour) return;
  const step = _tour.steps[_tour.i];
  const el = step.el();
  if (!el) return endTour();
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  const r = el.getBoundingClientRect(), pad = 6;
  const spot = document.getElementById('tour-spot');
  Object.assign(spot.style, { top: (r.top - pad) + 'px', left: (r.left - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
  const n = _tour.steps.length, last = _tour.i === n - 1;
  const b = document.getElementById('tour-bubble');
  b.innerHTML = `
    <div class="tour-count">${_tour.i + 1} / ${n}</div>
    <div class="tour-title">${escapeHtml(step.title)}</div>
    <div class="tour-text">${escapeHtml(step.text)}</div>
    <div class="tour-actions">
      <button type="button" class="btn btn-secondary" onclick="endTour()">Quitter</button>
      <span style="flex:1"></span>
      ${_tour.i ? '<button type="button" class="btn btn-secondary" onclick="tourGo(-1)">Précédent</button>' : ''}
      <button type="button" class="btn btn-primary" onclick="${last ? 'endTour(true)' : 'tourGo(1)'}">${last ? 'Terminer' : 'Suivant'}</button>
    </div>`;
  const bw = 320, below = r.bottom + pad + 12 + 170 < window.innerHeight;
  b.style.left = Math.max(12, Math.min(r.left, window.innerWidth - bw - 12)) + 'px';
  b.style.top = (below ? r.bottom + pad + 12 : Math.max(12, r.top - pad - 12 - b.offsetHeight)) + 'px';
  document.getElementById('tour-block').style.display = spot.style.display = b.style.display = 'block';
}

function tourGo(d) {
  if (!_tour) return;
  _tour.i = Math.max(0, Math.min(_tour.steps.length - 1, _tour.i + d));
  showTourStep();
}

function endTour(reopen) {
  const key = _tour && _tour.key;
  _tour = null;
  ['tour-block', 'tour-spot', 'tour-bubble'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
  if (reopen && key) openHelp(key);
}

document.addEventListener('keydown', e => {
  if (_tour) {
    if (e.key === 'Escape') endTour();
    else if (e.key === 'ArrowRight') tourGo(1);
    else if (e.key === 'ArrowLeft') tourGo(-1);
    return;
  }
  if (e.key === 'Escape') closeHelp();
});
