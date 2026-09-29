import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

const SOURCE_MAP = [
  { source: "js/data.js", extracts: "Entites, catalogue attributs, formules, masques, categories, roles, jeux d'essai", pages: "01. Modele de donnees" },
  { source: "index.html", extracts: "Arborescence ecrans, navigation, menus, modales", pages: "02. Ecrans" },
  { source: "js/utils.js", extracts: "RBAC r/w/d, menus, completion, stockage champ vs produit, navigation", pages: "04. RG + 05. Tech" },
  { source: "js/products.js", extracts: "Liste synthese/detaillee, filtres, tri, pagination, creation, dirty check", pages: "02 + 03 Produits" },
  { source: "js/detail.js", extracts: "Fiche produit, onglets, conditions commerciales, validation, historique", pages: "02 + 03 Fiche" },
  { source: "js/admin.js", extracts: "Categories, groupes, attributs, synthese, fournisseurs, roles, prefs app", pages: "02 Admin" },
  { source: "js/import.js", extracts: "Workflow 3 etapes, champs obligatoires, matching ean/sap, trame", pages: "03 Import" },
  { source: "js/export.js", extracts: "Colonnes = codes techniques, onglets synthese/detail, options", pages: "03 Export" },
  { source: "js/dashboard.js", extracts: "KPIs, completion, vue fournisseur — distinguer mock vs cible", pages: "02 Dashboard" },
];

const CONFLUENCE = [
  { id: "00", title: "Cadre", contents: "Objet, hors perimetre, maquette vs cible, glossaire, principes (code technique, attributs systeme)" },
  { id: "01", title: "Modele de donnees (MDD)", contents: "Page d'ensemble : entites, cardinalites, schemas. Canvas mdd-octopim." },
  { id: "01a", title: "Attributs", contents: "Catalogue plat. Colonne groupe d'init. N-N vers les groupes." },
  { id: "01b", title: "Groupes d'attributs", contents: "Page dediee : membership N-N, ordre, rattachement categories." },
  { id: "02", title: "Arborescence ecrans", contents: "Une page par ecran, gabarit identique, captures + schemas + RG" },
  { id: "03", title: "Workflows", contents: "CRUD produit, import, export, matching conditions, auth" },
  { id: "04", title: "Regles de gestion", contents: "RG numerotees, testables, avec source code + ecran" },
  { id: "05", title: "Spec technique", contents: "API, stockage, Okta, droits, hors maquette (pas dans le JS)" },
];

const SCREENS = [
  { screen: "Tableau de bord", page: "page-dashboard", notes: "KPIs reels + courbe evolution partiellement illustrative" },
  { screen: "Liste produits", page: "page-products", notes: "Vues Synthese / Detaillee, filtres, tri, pagination" },
  { screen: "Fiche produit", page: "page-product-detail", notes: "Onglets = groupes de la categorie" },
  { screen: "Imports", page: "page-imports", notes: "Config > mapping > resultat" },
  { screen: "Exports", page: "page-exports", notes: "En-tetes = codes techniques" },
  { screen: "Prefs affichage", page: "page-user-prefs", notes: "Theme utilisateur, pas admin" },
  { screen: "Admin accueil", page: "page-admin", notes: "Cartes module, gated par mod_*" },
  { screen: "Categories", page: "page-admin-categories", notes: "CRUD + groupIds (onglets fiche)" },
  { screen: "Groupes d'attributs", page: "page-admin-groups", notes: "Page spec dediee. Membership N-N, ordre" },
  { screen: "Attributs", page: "page-admin-attributes", notes: "Catalogue plat, groupe d'init, pastilles N-N" },
  { screen: "Vue synthese", page: "page-admin-synthese", notes: "Ordre colonnes liste" },
  { screen: "Conditions commerciales", page: "page-admin-suppliers", notes: "Table marque x fournisseur x categorie x segmentation" },
  { screen: "Roles & permissions", page: "page-admin-roles", notes: "cat_*, menu_*, mod_* — r / w / d" },
  { screen: "Prefs application", page: "page-admin-prefs", notes: "Pagination, seuil completion" },
];

const ENTITIES = [
  { entity: "Product", keys: "id, cat, createdAt, maj, fields{}, history[], visuals", persist: "Oui" },
  { entity: "Attribute", keys: "id, name, code, type, groupId, required, calc, formula, mask, inCompletion, system", persist: "Oui — referentiel" },
  { entity: "AttrGroup", keys: "id, name, code, system, isBrandGroup, attrIds[]", persist: "Oui — referentiel" },
  { entity: "Category", keys: "id, name, code, color, groupIds[]", persist: "Oui — referentiel" },
  { entity: "BrandSetting", keys: "marque, fournisseurCode, type, segAttrCode/Value, RF, RFA, remises…", persist: "Oui" },
  { entity: "Role", keys: "id, name, okta, mode, perms{ key: {r,w,d} }", persist: "Oui + mapping Okta" },
  { entity: "User", keys: "id, name, roleId — maquette ; cible = Okta", persist: "Cible : IdP" },
];

const MOCK_VS_TARGET = [
  { topic: "Stockage", mock: "Variables JS en memoire", target: "API + BDD (referentiel + produits + historique)" },
  { topic: "Auth", mock: "Switch utilisateur local", target: "Okta (groupes deja nommes sur les roles)" },
  { topic: "Dashboard evolution", mock: "Mois passes illustres, mois courant = count reel", target: "A specifier : source temporelle reelle" },
  { topic: "Theme sombre", mock: "Placeholder desactive", target: "Prefs user, a livrer plus tard" },
  { topic: "Visuels", mock: "Upload local, pas de DAM", target: "Stockage fichiers / URLs a specifier" },
  { topic: "Import/export", mock: "SheetJS cote client", target: "Job serveur, quotas, journal d'erreurs" },
];

const TEMPLATE = [
  { section: "1. Intention", what: "Que fait l'ecran, pour qui" },
  { section: "2. Entree / sortie", what: "D'ou on vient, ou on va, droits menu_* / cat_* / mod_*" },
  { section: "3. Contenu", what: "Zones, champs, actions, etats vides / erreur / lecture seule" },
  { section: "4. Visuels", what: "Schema simple + capture(s) maquette legendes. Fichiers : spec/captures/." },
  { section: "5. Regles", what: "Liens RG-xxx, validation, formules, completion" },
  { section: "6. Donnees", what: "Entites lues/ecrites, codes techniques" },
  { section: "7. Hors maquette", what: "API, perf, audit, messages d'erreur cibles" },
  { section: "8. Trace", what: "Fichier + fonctions source (ex. runImport, canCat)" },
];

export default function SpecExtractionCanvas() {
  const { tokens } = useHostTheme();
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>Extraction maquette → specs Confluence</H1>
        <Text tone="secondary">
          Inventaire OctoPIM (maquette vanilla JS). La maquette est la source des
          regles fonctionnelles ; Confluence est le contrat pour l'equipe. Ne
          pas recopier le code : extraire le comportement.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="~12" label="Ecrans a specifier" />
        <Stat value="7" label="Entites coeur" />
        <Stat value="9" label="Fichiers source" />
        <Stat value="8" label="Espaces Confluence" />
      </Grid>

      <Callout tone="warning" title="Regle d'or">
        Toute spec extraite du JS doit etre etiquetee Maquette (comportement
        actuel) ou Cible (a developper). Sans ce tag, l'equipe prendra un
        placeholder pour une exigence.
      </Callout>

      <Callout tone="info" title="Convention visuelle (toutes les pages)">
        Chaque page spec embarque un schema simple (relations ou flux) et
        des captures de la maquette, pas seulement des tables. Captures
        actuelles : spec/captures/ (fiche, admin attributs, edition attribut,
        edition groupe, tarification %).
      </Callout>

      <H2>Arborescence Confluence recommandee</H2>
      <Table
        headers={["Espace", "Page parente", "Contenu"]}
        rows={CONFLUENCE.map((r) => [r.id, r.title, r.contents])}
      />

      <H2>Ou lire dans le code</H2>
      <Table
        headers={["Fichier", "Ce qu'on en tire", "Page Confluence"]}
        rows={SOURCE_MAP.map((r) => [r.source, r.extracts, r.pages])}
        rowTone={SOURCE_MAP.map(() => "neutral" as const)}
      />

      <H2>Methode en 5 passes</H2>
      <Grid columns={1} gap={10}>
        <Card>
          <CardHeader trailing={<Pill tone="info" size="sm">Passe 1</Pill>}>Referentiel</CardHeader>
          <CardBody>
            <Text>
              Extraire de data.js le catalogue : attributs (code, type, required,
              formula, mask, system, inCompletion), groupes, categories et
              brandSettings. Une ligne = une exigence de modele. Les produits
              d'exemple ne sont pas des specs, seulement des cas de test.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="info" size="sm">Passe 2</Pill>}>Ecrans</CardHeader>
          <CardBody>
            <Text>
              Partir des id="page-*" de index.html. Une page Confluence par
              ecran, gabarit identique (table ci-dessous). Capturer aussi les
              modales et le menu compte.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="info" size="sm">Passe 3</Pill>}>Workflows</CardHeader>
          <CardBody>
            <Text>
              Suivre les fonctions d'entree : showPage, openProductDetail,
              runImport, runExport, saveProduct, switchUser. Pour chaque flux :
              acteur, preconditions (RBAC), etapes, resultats, erreurs.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="info" size="sm">Passe 4</Pill>}>Regles implicites</CardHeader>
          <CardBody>
            <Text>
              Chercher canCat / canMod / canMenu, required, inCompletion,
              attrStoresInFields, evalFormula, DATE_MAJ, matching ean puis sap.
              Chaque if metier devient une RG numerotee, testable (Si… Alors…).
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="info" size="sm">Passe 5</Pill>}>Arbitration PM</CardHeader>
          <CardBody>
            <Text>
              Alexis tague Maquette vs Cible, tranche les zones floues (courbe
              dashboard, visuels, theme, persistance), puis collage Confluence.
              L'equipe ne developpe que le tagged Cible + le tagged Maquette
              valide.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <H2>Gabarit d'ecran (a coller tel quel)</H2>
      <Table
        headers={["Section", "A remplir"]}
        rows={TEMPLATE.map((r) => [r.section, r.what])}
      />

      <Divider />

      <H2>Ecrans de la maquette</H2>
      <Table
        headers={["Ecran", "Ancre HTML", "Point d'attention"]}
        rows={SCREENS.map((r) => [r.screen, r.page, r.notes])}
      />

      <H2>Modele — entites a documenter en premier</H2>
      <Table
        headers={["Entite", "Clefs observables dans la maquette", "Persistance cible"]}
        rows={ENTITIES.map((r) => [r.entity, r.keys, r.persist])}
      />

      <H2>Maquette vs cible (a trancher dans 00. Cadre)</H2>
      <Table
        headers={["Sujet", "Dans la maquette", "A specifier pour le build"]}
        rows={MOCK_VS_TARGET.map((r) => [r.topic, r.mock, r.target])}
      />

      <Stack gap={8}>
        <H2>Comment extraire avec Cursor</H2>
        <Text>
          Un domaine a la fois, jamais tout le PIM d'un coup. Prompt type :
        </Text>
        <Card>
          <CardBody>
            <Text>
              Extraire les regles fonctionnelles de [fichier / ecran] pour
              Confluence. Format : tables + RG Si/Alors. Distinguer Maquette et
              Cible. Ne pas inventer d'API. Citer les fonctions sources. Gabarit
              ecran : intention, droits, zones, RG, donnees, hors maquette.
            </Text>
          </CardBody>
        </Card>
        <Text tone="secondary">
          Ordre conseille : 1) catalogue attributs 2) RBAC 3) fiche produit
          4) import/export 5) conditions commerciales 6) dashboard 7) spec
          technique (vide a completer hors code).
        </Text>
      </Stack>

      <Callout tone="info" title="Publication Confluence">
        Cursor n'a pas d'acces Confluence ici. Sortie = Markdown / tableaux a
        coller (macro Markdown ou editor). Une page = un domaine. Lien croise
        par identifiant RG-xxx. Joindre captures spec/captures/ comme
        illustration de chaque caracteristique, plus un schema (N-N,
        flux, MDD) — pas la capture a la place de la spec.
      </Callout>

      <Text tone="tertiary" size="small">
        Source : Maquette-OctoPIM (index.html + js/*) · extraction methodologique, pas un dump du code
      </Text>
    </Stack>
  );
}
