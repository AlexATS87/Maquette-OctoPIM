import {
  Callout,
  Card,
  CardBody,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

const SHOT = "file:///C:/Users/ber_ale/OctoPIM/Maquette-OctoPIM/spec/captures";

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
      <Text tone="tertiary" size="small">{caption} — maquette OctoPIM</Text>
    </Stack>
  );
}

function MddDiagram() {
  const t = useHostTheme();
  const fill = t.fill.tertiary;
  const stroke = t.stroke.primary;
  const ink = t.text.primary;
  const muted = t.text.secondary;
  const accent = t.accent.primary;

  const box = (x: number, y: number, w: number, h: number, title: string, sub: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} stroke={stroke} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fill={ink} fontSize="13" fontWeight="600">
        {title}
      </text>
      <text x={x + w / 2} y={y + 40} textAnchor="middle" fill={muted} fontSize="10">
        {sub}
      </text>
    </g>
  );

  return (
    <svg viewBox="0 0 760 340" width="100%" role="img" aria-label="Modele de donnees OctoPIM">
      {box(280, 8, 200, 52, "Categorie", "Montures, Lentilles…")}
      {box(20, 120, 200, 52, "Produit", "fields{}, cat, history")}
      {box(280, 120, 200, 52, "Groupe d'attributs", "onglet fiche")}
      {box(540, 120, 200, 52, "Attribut", "code unique")}
      {box(20, 250, 200, 52, "User / Role", "RBAC r/w/d")}
      {box(280, 250, 200, 52, "BrandSetting", "marque × fournisseur")}
      {box(540, 250, 200, 52, "Historique", "flush a l'enregistrement")}

      <line x1="380" y1="60" x2="120" y2="120" stroke={stroke} />
      <line x1="380" y1="60" x2="380" y2="120" stroke={stroke} />
      <text x="200" y="88" fill={accent} fontSize="11">1-N</text>
      <text x="390" y="92" fill={accent} fontSize="11">N-N</text>

      <line x1="480" y1="146" x2="540" y2="146" stroke={accent} strokeWidth="1.5" />
      <text x="500" y="138" fill={accent} fontSize="11" fontWeight="600">N-N</text>

      <line x1="120" y1="172" x2="380" y2="250" stroke={stroke} />
      <text x="200" y="220" fill={muted} fontSize="10">marque + fournisseur + cat</text>

      <line x1="120" y1="172" x2="120" y2="250" stroke={stroke} />
      <text x="128" y="220" fill={muted} fontSize="10">droits cat_*</text>
    </svg>
  );
}

export default function MddOctoPim() {
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>Modele de donnees OctoPIM</H1>
        <Text tone="secondary">
          Page Confluence « MDD ». Vue d'ensemble des entites. Les catalogues
          detailles vivent ailleurs : Attributs (un objet, plusieurs groupes)
          et Groupes d'attributs (page dediee).
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="7" label="Entites coeur" />
        <Stat value="N-N" label="Attribut ↔ Groupe" />
        <Stat value="N-N" label="Categorie ↔ Groupe" />
        <Stat value="1-N" label="Categorie → Produits" />
      </Grid>

      <Callout tone="info" title="Convention visuelle des pages spec">
        Chaque page (celle-ci et les suivantes) embarque : (1) un schema
        simple des relations, (2) une ou plusieurs captures de la maquette,
        (3) une table de cardinalites ou de champs. Objectif : un lecteur
        Confluence comprend sans ouvrir le JS.
      </Callout>

      <H2>Schema d'ensemble</H2>
      <MddDiagram />
      <Text tone="tertiary" size="small">
        Une categorie expose des groupes (onglets). Un groupe expose des
        attributs (N-N, meme code technique). Le produit porte les valeurs
        et se rattache a une categorie. BrandSetting n'est pas un attribut
        duplique : c'est une ligne marque × fournisseur × type × segmentation.
      </Text>

      <H2>Cardinalites</H2>
      <Table
        headers={["De", "Vers", "Card.", "Sens"]}
        rows={[
          ["Categorie", "Produit", "1-N", "Un produit a une categorie (identite)."],
          ["Categorie", "Groupe", "N-N", "groupIds ordonnes = onglets de la fiche."],
          ["Groupe", "Attribut", "N-N", "attrIds. Un attribut peut etre dans plusieurs groupes."],
          ["Attribut", "Groupe (init)", "N-1", "groupId a la creation. Ne bloque pas les extras."],
          ["Produit", "Valeur", "1-N", "product.fields[code], hors cat / dates / completion."],
          ["Marque + Fournisseur + Cat + Seg", "BrandSetting", "1-1", "Ligne de conditions commerciales."],
          ["Role", "Permission", "1-N", "cles cat_* / menu_* / mod_* en r/w/d."],
          ["Produit", "Historique", "1-N", "Buffer pending puis flush a Enregistrer."],
        ]}
      />

      <H2>Ou ça se voit dans la maquette</H2>
      <Grid columns={2} gap={16}>
        <Capture
          file="fiche-produit-onglets.jpg"
          caption="Produit + Categorie + Groupes : les onglets sont les groupes de la categorie."
        />
        <Capture
          file="admin-attributs.jpg"
          caption="Attribut ↔ Groupes : un code, plusieurs pastilles (N-N)."
        />
      </Grid>
      <Capture
        file="groupe-conditions-edit.jpg"
        caption="Groupe : liste ordonnee d'attributs (membership). Page Groupes d'attributs a detailler a part."
      />

      <H2>Entites (maquette)</H2>
      <Table
        headers={["Entite", "Identifiant", "Porte", "Page spec"]}
        rows={[
          ["Categorie", "id / code / name", "groupIds[], color", "MDD (cette page) + ecran Admin categories"],
          ["Groupe d'attributs", "id / code", "attrIds[], system, isBrandGroup", "Page Groupes (a ecrire)"],
          ["Attribut", "code technique", "type, required, formula, groupId", "Page Attributs"],
          ["Produit", "id", "cat, fields{}, history[], forcedFields", "Ecran fiche + workflows"],
          ["BrandSetting", "marque+fournisseur+type+seg", "RF, RFA, remises 0–1", "Conditions commerciales"],
          ["Role / User", "roleId", "perms r/w/d", "RBAC"],
          ["Historique", "ts + field", "old / new / user", "Fiche — onglet Historique"],
        ]}
      />

      <H3>Hors de product.fields</H3>
      <Card>
        <CardBody>
          <Stack gap={6}>
            <Text>cat, createdAt, maj, completion, segmentation ne vivent pas dans fields. Note d'implementation, pas un type d'attribut.</Text>
            <Text>Les attributs systeme (cat, dates, marque, fournisseur, segmentation, completion) restent des attributs au catalogue — ils sont juste non CRUD.</Text>
          </Stack>
        </CardBody>
      </Card>

      <Divider />
      <Callout tone="neutral" title="A completer sur cette page">
        Diagramme cible API (tables SQL / resources REST) quand le stockage
        sera tranche. Ajouter alors les FK, unicite EAN, cycle de vie
        referentiel (C10). Captures source : spec/captures/.
      </Callout>
    </Stack>
  );
}
