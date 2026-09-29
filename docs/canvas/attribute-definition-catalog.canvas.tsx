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
  Select,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

const SHOT = "file:///C:/Users/ber_ale/OctoPIM/Maquette-OctoPIM/spec/captures";

const GROUPS_PAGE =
  "Page dediee a prevoir : Groupes d'attributs (membership N-N, ordre d'affichage, rattachement aux categories).";

const MDD_PAGE =
  "Page dediee a prevoir / amorcee : Modele de donnees complet (entites + cardinalites).";

type CatalogRow = {
  code: string;
  name: string;
  type: string;
  groupInit: string;
  extra: string;
  req: string;
  cpl: string;
  note: string;
};

const CATALOG: CatalogRow[] = [
  { code: "sap", name: "Code SAP", type: "Texte", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Oui", note: "Pas required. Masque + maskMin 6. Cle import n°2." },
  { code: "ean", name: "Code EAN/GTIN", type: "Texte", groupInit: "Informations generales", extra: "", req: "Oui", cpl: "Oui", note: "Masque 14 chiffres. Cle import n°1." },
  { code: "nom", name: "Nom produit", type: "Texte", groupInit: "Informations generales", extra: "", req: "Oui", cpl: "Oui", note: "Titre de synthese." },
  { code: "created_at", name: "Date de creation", type: "Date", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Non", note: "Systeme, readonly. Valeur = product.createdAt." },
  { code: "updated_at", name: "Date de derniere MAJ", type: "Date", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Non", note: "Systeme, readonly. Valeur = product.maj." },
  { code: "cat", name: "Categorie", type: "Simple select", groupInit: "Informations generales", extra: "Conditions commerciales", req: "Oui", cpl: "Non", note: "Systeme. Identite produit, pas fields." },
  { code: "completion", name: "Completion", type: "Nombre", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Non", note: "Systeme. Calcule JS, pas une formule." },
  { code: "active_o", name: "Actif canal O", type: "Oui / Non", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Oui", note: "Source de statut_publication." },
  { code: "active_l", name: "Actif canal L", type: "Oui / Non", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Oui", note: "Source de statut_publication." },
  { code: "statut_publication", name: "Statut de publication", type: "Texte", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Non", note: "Calcule SI(active_o OU active_l)." },
  { code: "date_maj_statut", name: "Date MAJ statut", type: "Date", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Non", note: "DATE_MAJ(statut_publication)." },
  { code: "statut_commercial", name: "Statut commercial", type: "Simple select", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Oui", note: "Actif / Inactif / Ecoulement / En cours / Arrete." },
  { code: "miseEnLigne", name: "Date de mise en ligne", type: "Date", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "code_ecommerce", name: "Code e-commerce", type: "Texte", groupInit: "Informations generales", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "visuel_face", name: "Vue de face", type: "Image", groupInit: "Visuels", extra: "", req: "Non", cpl: "Oui", note: "Vignette synthese possible." },
  { code: "visuel_tq", name: "Vue 3/4", type: "Image", groupInit: "Visuels", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "visuel_profil", name: "Vue de profil", type: "Image", groupInit: "Visuels", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "visuel_ambiance", name: "Visuel ambiance", type: "Image", groupInit: "Visuels", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "visuel_fournisseur", name: "Visuel fournisseur", type: "Image", groupInit: "Visuels", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "fournisseur_code", name: "Code fournisseur", type: "Texte", groupInit: "Conditions commerciales", extra: "", req: "Non", cpl: "Non", note: "Systeme. Matching brandSettings." },
  { code: "marque", name: "Marque", type: "Simple select", groupInit: "Conditions commerciales", extra: "Caracteristiques PEL", req: "Non", cpl: "Non", note: "Systeme. Unique liste de marques, extensible." },
  { code: "segmentation", name: "Segmentation", type: "Texte", groupInit: "Conditions commerciales", extra: "", req: "Non", cpl: "Non", note: "Systeme. Ligne brand, pas saisie produit." },
  { code: "rf", name: "RF", type: "Nombre", groupInit: "Conditions commerciales", extra: "", req: "Non", cpl: "Oui", note: "percent, stocke 0–1." },
  { code: "remiseEnseigne", name: "Remise interne", type: "Nombre", groupInit: "Conditions commerciales", extra: "", req: "Non", cpl: "Oui", note: "percent 0–1. Copiee depuis brand, alimente pa_interne." },
  { code: "repriseEchange", name: "Reprise echange", type: "Oui / Non", groupInit: "Conditions commerciales", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "conditionsLivraison", name: "Conditions de livraison", type: "Texte", groupInit: "Conditions commerciales", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "ref_monture", name: "Reference monture", type: "Texte", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "Entree nom_marketing + SEO." },
  { code: "nom_marketing", name: "Nom marketing", type: "Texte", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Non", note: "CONCAT(marque, ref, couleur)." },
  { code: "cible", name: "Cible", type: "Simple select", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "Homme Femme Mixte Enfant Junior." },
  { code: "optique_solaire", name: "Optique / Solaire", type: "Simple select", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "Clef de segmentation brand." },
  { code: "matiere", name: "Matiere", type: "Simple select", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "cerclage", name: "Cerclage", type: "Simple select", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "couleur", name: "Couleur", type: "Texte", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "Pas un select." },
  { code: "largeur_verres", name: "Largeur des verres", type: "Nombre", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "Source de taille." },
  { code: "taille", name: "Taille", type: "Texte", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Non", note: "Calcule par seuils 56 / 51 / 49 / 47 / 44 / 40." },
  { code: "forme", name: "Forme de la monture", type: "Simple select", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "code_douanier", name: "Code douanier", type: "Texte", groupInit: "Caracteristiques monture", extra: "", req: "Non", cpl: "Oui", note: "Masque 8 chiffres." },
  { code: "commentaire", name: "Commentaire", type: "Texte long", groupInit: "Caracteristiques monture", extra: "Conditions commerciales", req: "Non", cpl: "Oui", note: "maxLength 500. Meme objet, plusieurs groupes." },
  { code: "prix_catalogue", name: "Prix catalogue", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Oui", note: "Source PA interne." },
  { code: "pa_interne", name: "PA interne", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Non", note: "catalogue × (1 - remise interne)." },
  { code: "remise", name: "Remise sur facture", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Oui", note: "percent, stocke 0–1, affiche %." },
  { code: "rfa", name: "RFA", type: "Nombre", groupInit: "Tarification monture", extra: "Conditions commerciales", req: "Non", cpl: "Oui", note: "percent 0–1. Meme attribut dans 2 groupes." },
  { code: "marge_interne", name: "marge interne", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Non", note: "Calcule." },
  { code: "pa_opticien", name: "PA opticien", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Non", note: "Calcule." },
  { code: "prix_final", name: "Prix final arrondi", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Non", note: "PA opticien × 2." },
  { code: "taux_marque", name: "Taux de marque", type: "Nombre", groupInit: "Tarification monture", extra: "", req: "Non", cpl: "Non", note: "Calcule, stocke 0–1, affiche %." },
  { code: "seo_titre_o", name: "Titre SEO O", type: "Texte", groupInit: "SEO monture", extra: "", req: "Non", cpl: "Non", note: "CONCAT nom | Optic 2000." },
  { code: "seo_desc_o", name: "Description SEO O", type: "Texte", groupInit: "SEO monture", extra: "", req: "Non", cpl: "Non", note: "Calcule." },
  { code: "seo_titre_l", name: "Titre SEO L", type: "Texte", groupInit: "SEO monture", extra: "", req: "Non", cpl: "Non", note: "CONCAT nom | Lissac." },
  { code: "seo_desc_l", name: "Description SEO L", type: "Texte", groupInit: "SEO monture", extra: "", req: "Non", cpl: "Non", note: "Calcule." },
  { code: "laboratoire", name: "Laboratoire", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "Caracteristiques PEL", req: "Non", cpl: "Oui", note: "Meme attribut, 2 groupes." },
  { code: "nb_lentilles", name: "Nb lentilles par boite", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "Valeurs texte 2…180." },
  { code: "type_usage", name: "Type (lentille)", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "Correctrices / Couleurs. Homonyme type_pel." },
  { code: "type_lentille", name: "Type de lentilles", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "Souple / Rigide." },
  { code: "couleur_lentille", name: "Couleur lentille", type: "Texte", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "type_vision", name: "Type de vision", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "renouvellement", name: "Renouvellement", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "SEO lentille." },
  { code: "materiau_lentille", name: "Materiau lentille", type: "Simple select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "hydrophilie", name: "Hydrophilie en %", type: "Nombre", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "Grandeur 0–100, pas displayFormat percent." },
  { code: "filtre_uv", name: "Filtre UV", type: "Oui / Non", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "sensibilite_o2", name: "Transmissibilite DK/t", type: "Nombre", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "hema", name: "HEMA", type: "Oui / Non", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "teinte_manip", name: "Teinte de manipulation", type: "Oui / Non", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "defauts_visuels", name: "Defauts visuels", type: "Multi select", groupInit: "Caracteristiques lentille", extra: "", req: "Non", cpl: "Oui", note: "Seul multi du catalogue." },
  { code: "prix_vente", name: "Prix de vente TTC", type: "Nombre", groupInit: "Tarification lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "prix_tva", name: "Prix de vente HT", type: "Nombre", groupInit: "Tarification lentille", extra: "", req: "Non", cpl: "Non", note: "TTC / 1.2." },
  { code: "utilisation_lentille", name: "Utilisation lentille", type: "Simple select", groupInit: "Logistique lentille", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "seo_titre_o2000_l", name: "Titre SEO O (lentille)", type: "Texte", groupInit: "SEO lentille", extra: "", req: "Non", cpl: "Non", note: "Autre code que seo_titre_o." },
  { code: "seo_desc_o2000_l", name: "Description SEO O (lentille)", type: "Texte", groupInit: "SEO lentille", extra: "", req: "Non", cpl: "Non", note: "" },
  { code: "seo_titre_lissac_l", name: "Titre SEO L (lentille)", type: "Texte", groupInit: "SEO lentille", extra: "", req: "Non", cpl: "Non", note: "" },
  { code: "seo_desc_lissac_l", name: "Description SEO L (lentille)", type: "Texte", groupInit: "SEO lentille", extra: "", req: "Non", cpl: "Non", note: "" },
  { code: "type_produit_acc", name: "Type de produit", type: "Texte", groupInit: "Caracteristiques accessoire", extra: "", req: "Non", cpl: "Oui", note: "Pas un select." },
  { code: "coefficient", name: "Coefficient", type: "Nombre", groupInit: "Caracteristiques accessoire", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "code_produit", name: "Code produit", type: "Texte", groupInit: "Caracteristiques PEL", extra: "", req: "Non", cpl: "Oui", note: "Distinct de sap / ean." },
  { code: "conditionnement", name: "Conditionnement", type: "Texte", groupInit: "Caracteristiques PEL", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "type_pel", name: "Type (PEL)", type: "Simple select", groupInit: "Caracteristiques PEL", extra: "", req: "Non", cpl: "Oui", note: "Homonyme type_usage." },
  { code: "type_solution", name: "Type de solution", type: "Simple select", groupInit: "Caracteristiques PEL", extra: "", req: "Non", cpl: "Oui", note: "" },
  { code: "duree_conservation", name: "Duree conservation apres ouverture", type: "Texte", groupInit: "Caracteristiques PEL", extra: "", req: "Non", cpl: "Oui", note: "" },
];

function Capture({ file, caption }: { file: string; caption: string }) {
  const t = useHostTheme();
  return (
    <Stack gap={6}>
      <img
        src={`${SHOT}/${file}`}
        alt={caption}
        style={{
          display: "block",
          width: "100%",
          border: `1px solid ${t.stroke.secondary}`,
          borderRadius: 6,
          background: t.bg.elevated,
        }}
      />
      <Text tone="tertiary" size="small">
        {caption} — maquette OctoPIM
      </Text>
    </Stack>
  );
}

function NnDiagram() {
  const t = useHostTheme();
  const box = t.fill.tertiary;
  const stroke = t.stroke.primary;
  const accent = t.accent.primary;
  const ink = t.text.primary;
  const muted = t.text.secondary;
  return (
    <svg viewBox="0 0 720 220" width="100%" role="img" aria-label="Relation N-N attributs et groupes">
      <rect x="250" y="20" width="220" height="64" rx="8" fill={box} stroke={accent} />
      <text x="360" y="44" textAnchor="middle" fill={ink} fontSize="13" fontWeight="600">
        Attribut
      </text>
      <text x="360" y="64" textAnchor="middle" fill={muted} fontSize="11">
        code unique : marque
      </text>

      <line x1="300" y1="84" x2="160" y2="128" stroke={stroke} />
      <line x1="420" y1="84" x2="560" y2="128" stroke={stroke} />
      <text x="210" y="108" fill={accent} fontSize="11" fontWeight="600">N</text>
      <text x="500" y="108" fill={accent} fontSize="11" fontWeight="600">N</text>

      <rect x="40" y="128" width="240" height="70" rx="8" fill={box} stroke={stroke} />
      <text x="160" y="154" textAnchor="middle" fill={ink} fontSize="12" fontWeight="600">
        Groupe (init)
      </text>
      <text x="160" y="174" textAnchor="middle" fill={muted} fontSize="11">
        Conditions commerciales
      </text>
      <text x="160" y="190" textAnchor="middle" fill={muted} fontSize="10">
        groupId a la creation
      </text>

      <rect x="440" y="128" width="240" height="70" rx="8" fill={box} stroke={stroke} />
      <text x="560" y="154" textAnchor="middle" fill={ink} fontSize="12" fontWeight="600">
        Autre groupe
      </text>
      <text x="560" y="174" textAnchor="middle" fill={muted} fontSize="11">
        Caracteristiques PEL
      </text>
      <text x="560" y="190" textAnchor="middle" fill={muted} fontSize="10">
        via attrIds du groupe
      </text>
    </svg>
  );
}

function FicheTabsSketch() {
  const t = useHostTheme();
  const tabs = ["Infos", "Visuels", "Conditions", "Caract.", "Tarif", "SEO"];
  return (
    <svg viewBox="0 0 720 90" width="100%" role="img" aria-label="Onglets fiche = groupes de la categorie">
      <rect x="8" y="18" width="704" height="54" rx="8" fill={t.fill.tertiary} stroke={t.stroke.secondary} />
      {tabs.map((label, i) => {
        const x = 20 + i * 114;
        const active = i === 0;
        return (
          <g key={label}>
            <rect
              x={x}
              y="32"
              width="104"
              height="26"
              rx="4"
              fill={active ? t.accent.primary : t.bg.elevated}
              stroke={t.stroke.secondary}
            />
            <text
              x={x + 52}
              y="49"
              textAnchor="middle"
              fill={active ? t.text.onAccent : t.text.secondary}
              fontSize="11"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AttributeDefinitionCatalog() {
  const [q, setQ] = useCanvasState("attr-q", "");
  const [type, setType] = useCanvasState("attr-type", "tous");

  const types = ["tous", ...Array.from(new Set(CATALOG.map((r) => r.type)))];
  const filtered = CATALOG.filter((r) => {
    const hay = (r.code + r.name + r.groupInit + r.extra).toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (type !== "tous" && r.type !== type) return false;
    return true;
  });

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>Attribut — definition et catalogue</H1>
        <Text tone="secondary">
          Page Confluence « Attributs ». Un attribut peut etre rattache a un
          ou plusieurs groupes — le detail des groupes est une page dediee.
          Le catalogue ci-dessous n'est pas hierarchy par groupe : la colonne
          Groupe d'attributs porte le groupe d'initialisation (groupId).
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value={String(CATALOG.length)} label="Attributs (un par code)" />
        <Stat value="12" label="Groupes (page dediee)" />
        <Stat value="5" label="Attributs multi-groupes" />
        <Stat value="3" label="Required : ean, nom, cat" />
      </Grid>

      <H2>C'est quoi un attribut ?</H2>
      <Text>
        Un attribut est le contrat d'un champ PIM : nom metier, code technique
        unique, type, contraintes, eventuellement formule. Ce n'est pas la
        valeur. La valeur appartient au produit (ou a une ligne de conditions
        commerciales). Deux natures seulement : systeme (non supprimable, non
        reparametrable) et classique (CRUD).
      </Text>

      <H3>Sur la fiche, un groupe = un onglet</H3>
      <FicheTabsSketch />
      <Capture
        file="fiche-produit-onglets.jpg"
        caption="Fiche produit — les onglets sont les groupes rattaches a la categorie Montures. L'attribut (ex. Code SAP) s'affiche dans l'onglet de ses groupes."
      />

      <H2>Rattachement aux groupes (N-N)</H2>
      <Callout tone="info" title="Un attribut, un ou plusieurs groupes">
        Relation N-N : un attribut (un seul code technique) peut figurer dans
        plusieurs groupes. A la creation, on choisit un groupe
        d'initialisation (groupId). Les appartenances supplementaires se
        gerent sur la page Groupes d'attributs (attrIds). On ne duplique jamais
        l'attribut.
      </Callout>
      <NnDiagram />
      <Text tone="tertiary" size="small">
        Schema : attribut marque, groupe d'init = Conditions commerciales,
        aussi rattache a Caracteristiques PEL. {GROUPS_PAGE}
      </Text>

      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Liste admin — plusieurs pastilles</H3>
          <Capture
            file="admin-attributs.jpg"
            caption="Administration > Attributs. Categorie et Marque montrent deux groupes. SAP : Obligatoire = Non."
          />
        </Stack>
        <Stack gap={8}>
          <H3>Edition — groupe d'init + « Aussi dans »</H3>
          <Capture
            file="attr-edit-marque.jpg"
            caption="Edition de Marque. Groupe maison = Conditions commerciales (valeur d'init). Aussi dans = PEL. Les extras se gerent dans le groupe."
          />
        </Stack>
      </Grid>

      <H3>Ou on ajoute un attribut a un second groupe</H3>
      <Capture
        file="groupe-conditions-edit.jpg"
        caption="Edition du groupe Conditions commerciales : liste ordonnee d'attributs (codes techniques). C'est ici qu'on rattache RFA, Commentaire, Categorie… sans recreer l'objet."
      />

      <H2>Ce qu'il contient</H2>
      <Table
        headers={["Propriete", "Role", "Regle"]}
        rows={[
          ["code", "Contrat", "Cle unique. Formules, import, export. Immuable si systeme."],
          ["name", "Libelle", "Affichage. Plusieurs attributs peuvent partager un libelle (deux « Type »)."],
          ["type", "Widget", "Texte, Texte long, Nombre, Simple/Multi select, Oui/Non, Date, Image."],
          ["groupId", "Groupe d'init", "Valeur a la creation. Ne limite pas les rattachements ulterieurs."],
          ["required", "Obligation", "Seul flag. Fiche + import. SAP n'est pas required."],
          ["inCompletion", "Qualite", "Denominateur du taux, hors attributs systeme."],
          ["system", "Gouvernance", "Pas un 3e type. Non supprimable, formule/masque verrouilles."],
          ["formula", "Calcule", "Non stocke (sauf DATE_MAJ). Forcable (forcedFields, basse priorite)."],
          ["displayFormat", "Affichage", "percent : stocke 0–1, affiche %."],
          ["options", "Liste", "Locale a l'attribut. Marque = unique referentiel marques."],
        ]}
      />

      <H2>Valeurs en % (stockage vs affichage)</H2>
      <Capture
        file="fiche-tarification-percent.jpg"
        caption="Tarification monture — Remise sur facture affichee 10 % et RFA 2 % (stockees 0,10 et 0,02). Champs calcules en jaune, forcables."
      />

      <H2>Regles</H2>
      <Card>
        <CardBody>
          <Stack gap={6}>
            <Text>RG-A01 — Le code technique identifie l'attribut partout (formules, import, export).</Text>
            <Text>RG-A10 — Un attribut peut appartenir a plusieurs groupes sans dupliquer le code. groupId = init ; extras = page Groupes.</Text>
            <Text>RG-A04 — required est le seul flag d'obligation. SAP n'est pas required.</Text>
            <Text>RG-A05 — Les attributs systeme sont exclus de la completion.</Text>
            <Text>RG-A06 — Marque est le referentiel unique de marques, liste extensible.</Text>
            <Text>RG-A09 — percent : decimal 0–1 en stock, % a l'ecran.</Text>
          </Stack>
        </CardBody>
      </Card>

      <Divider />
      <H2>Catalogue plat</H2>
      <Text tone="secondary">
        Une ligne = un attribut (un code). Colonne Groupe d'attributs = groupe
        d'initialisation, pas une rubrique de classement. « Aussi dans » =
        rattachements N-N, documentes en detail sur la page Groupes.
      </Text>
      <Row gap={10} align="center">
        <TextInput value={q} onChange={setQ} placeholder="Filtrer code, nom, groupe…" style={{ flex: 1 }} />
        <Select
          value={type}
          onChange={setType}
          options={types.map((x) => ({ value: x, label: x === "tous" ? "Tous les types" : x }))}
          style={{ minWidth: 180 }}
        />
        <Pill tone="neutral">{filtered.length} / {CATALOG.length}</Pill>
      </Row>
      <Table
        headers={["Code", "Nom", "Type", "Groupe d'attributs (init)", "Aussi dans", "Req", "Cpl", "Notes"]}
        rows={filtered.map((r) => [
          r.code,
          r.name,
          r.type,
          r.groupInit,
          r.extra || "—",
          r.req,
          r.cpl,
          r.note,
        ])}
      />

      <Callout tone="neutral" title="Pages liees">
        {GROUPS_PAGE} {MDD_PAGE} Convention visuelle : chaque page spec
        embarque schema simple + capture maquette + table. Captures source :
        spec/captures/ (admin-attributs, attr-edit-marque, groupe-conditions-edit,
        fiche-produit-onglets, fiche-tarification-percent).
      </Callout>
    </Stack>
  );
}
