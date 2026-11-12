// ============================================================
// DATA.JS
// ============================================================

// ============================================================
// PREFERENCES APPLICATION
// ============================================================
let appPrefs = {
  pageSize: 50, // 25, 50 ou 100. Pas d'affichage de tout le catalogue.
};

let userPrefs = {
  theme: 'light', // 'light' | 'dark' — affichage utilisateur, pas encore applique
};

let seuilCompletion = 80;
let productDirty = false;
let attrFormDirty = false;
let pendingNavTarget = null;

// ============================================================
// GROUPE SYNTHESE — figé, transversal, non déplaçable
// ============================================================
// Chaque élément est soit un attribut { kind:'attr', code:'...' }
// soit une action { kind:'action', code:'delete', label:'Suppr.' }
// L'action Suppr. n'est plus proposée par défaut, elle reste ajoutable
// depuis Administration > Vue Synthese.
// Vue synthèse : 10 champs au plus (colonnes de la liste et bandeau de la fiche)
const SYNTH_MAX_FIELDS = 10;
let syntheseItems = [
  { kind: 'attr',   code: 'visuel_face', label: 'Vue de face' },
  { kind: 'attr',   code: 'nom',         label: 'Nom produit'},
  { kind: 'attr',   code: 'ean',         label: 'Code EAN/GTIN' },
  { kind: 'attr',   code: 'cat',         label: 'Catégorie'  },
  { kind: 'attr',   code: 'created_at',  label: 'Date de création'},
  { kind: 'attr',   code: 'miseEnLigne', label: 'Date de mise en ligne prévue'},
  { kind: 'attr',   code: 'statut_publication', label: 'Publié'},
  { kind: 'attr',   code: 'etape_workflow', label: 'Étape du workflow'},
  { kind: 'attr',   code: 'completion',  label: 'Complétion' },
  { kind: 'attr',   code: 'updated_at',  label: 'Date de dernière MAJ'},
];

// ============================================================
// GROUPES D'ATTRIBUTS
// ============================================================
let attrGroups = [
  { id:1,  name:'Informations générales',      code:'infos_generales',       system:false, isSynthGroup:false, audienceGroupIds:[], attrIds:['§Identification',1,2,3,78,'§Publication',77,66,67,59,68,114,'§Suivi',130,115,116,131,4,5] },
  { id:3,  name:'Conditions commerciales',     code:'conditions_commerciales', system:false, isSynthGroup:false,  audienceGroupIds:[1], attrIds:[69,70,62,21,63,64,65] },
  { id:4,  name:'Caractéristiques monture',    code:'caract_monture',        system:false, isSynthGroup:false, audienceGroupIds:[2], attrIds:['§Identification',7,96,13,8,'§Typologie',10,9,93,15,11,12,97,'§Dimensions (mm)',71,82,83,84,85,14,'§Verres solaires',88,109,89,90,91,'§Confort et optique',86,87,92,95,'§Origine et douane',94,16,98,'§Commentaire',17] },
  { id:16, name:'Tarification lentille et PEL', code:'tarif_lentille_pel',  system:false, isSynthGroup:false, audienceGroupIds:[], attrIds:[138,135,136] },
  { id:14, name:'Prix de vente',               code:'prix_vente',            system:false, isSynthGroup:false, audienceGroupIds:[], attrIds:[132,52,113,24,133,25] },
  { id:5,  name:'Tarification monture',        code:'tarif_monture',         system:false, isSynthGroup:false, audienceGroupIds:[1], attrIds:[18,19,23,22] },
  { id:15, name:'Tarification accessoire',     code:'tarif_accessoire',      system:false, isSynthGroup:false, audienceGroupIds:[1], attrIds:[117,118,120,119,128] },
  { id:2,  name:'Visuels',                     code:'visuels',               system:false, isSynthGroup:false, audienceGroupIds:[], attrIds:[134,54,55,56,57] },
  { id:6,  name:'SEO',                                 code:'seo',                   system:false, isSynthGroup:false, attrIds:[26,27,28,29] },
  { id:7,  name:'Caractéristiques lentille',   code:'caract_lentille',       system:false, isSynthGroup:false, attrIds:['§Identification',70,30,31,33,'§Typologie',72,32,34,35,41,'§Matériau',36,37,39,73,38,40] },
  { id:11, name:'Caractéristiques accessoire', code:'caract_accessoire',     system:false, isSynthGroup:false, attrIds:['§Identification',51,122,121,'§Description',13,123,124,125] },
  { id:12, name:'Caractéristiques PEL',        code:'caract_pel',            system:false, isSynthGroup:false, attrIds:['§Identification',74,70,30,'§Produit',76,45,75,44] },
  { id:13, name:'IWI',                         code:'iwi',                   system:false, isSynthGroup:false, attrIds:[99,137,112,101,111,102,103,104,105,106,107,108,110] },
];

// ============================================================
// ATTRIBUTS
// mask : syntaxe Access — A=lettre, 9=chiffre, *=alphanum
// ex: 'A999999999999' pour code SAP
// ============================================================
// Valeurs d'un canal de vente (reprises de l'ancien statut commercial).
// Publie : Actif ou Ecoulement de stock. Reassort : Actif ou En cours.
const CANAL_STATUTS = ['En cours', 'Actif', 'Écoulement de stock', 'Inactif', 'Arrêté'];

let attributes = [
  { id:1,  name:'Code SAP',         code:'sap',              type:'Texte',           groupId:1,  required:false, calc:false, inCompletion:true, formula:'', mask:'*************', maskMin:6, showInSynth:true,  clickToOpen:false },
  { id:2,  name:'Code EAN/GTIN',    code:'ean', helpText:'EAN / GTIN : code-barres international du produit',              type:'Texte',           groupId:1,  required:true,  calc:false, inCompletion:true, formula:'', mask:'99999999999999', showInSynth:true,  clickToOpen:false },
  { id:3, width:'wide',  name:'Nom produit',      code:'nom',              type:'Texte',           groupId:1,  required:true,  calc:false, inCompletion:true, formula:'', mask:'',              showInSynth:true,  clickToOpen:true  },
  { id:4,  name:'Date de création', code:'created_at',       type:'Date',            groupId:1,  required:false, calc:false, inCompletion:false, formula:'', mask:'',              readonly:true,     showInSynth:false, clickToOpen:false, system:true },
  { id:5,  name:'Date de dernière MAJ', code:'updated_at',   type:'Date',            groupId:1,  required:false, calc:false, inCompletion:false, formula:'', mask:'',              readonly:true,     showInSynth:false, clickToOpen:false, system:true },
  { id:78, name:'Catégorie',        code:'cat',              type:'Simple select',   groupId:1,  required:true,  calc:false, inCompletion:true, formula:'', mask:'',              showInSynth:true,  clickToOpen:false, system:true },
  { id:79, name:'Complétion',       code:'completion',       type:'Nombre',          groupId:1,  required:false, calc:false, inCompletion:false, formula:'', mask:'',              readonly:true,     showInSynth:true,  clickToOpen:false, system:true },
  { id:130, name:'Étape du workflow', code:'etape_workflow', type:'Simple select', groupId:1, required:false, calc:false, inCompletion:false, formula:'', mask:'', readonly:true, system:true, showInSynth:true, clickToOpen:false, options:[],
    helpText:'Jalon le plus avancé atteint, selon les règles du module Workflow' },
  { id:66, name:'Canal O',          code:'active_o',         type:'Simple select',   groupId:1,  required:true, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:CANAL_STATUTS.slice() },
  { id:67, name:'Canal L',          code:'active_l',         type:'Simple select',   groupId:1,  required:true, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:CANAL_STATUTS.slice() },
  { id:59, name:'Publié', code:'statut_publication', type:'Oui / Non', groupId:1, required:false, calc:true, inCompletion:false,
    formula:'=TABLE()',
    formulaLabel:'Table de calcul : Oui dès qu\'un canal vaut Actif ou Écoulement de stock',
    mask:'', showInSynth:true,  clickToOpen:false },
  { id:68, name:'Date de changement de publication', code:'date_maj_statut', type:'Date', groupId:1, required:false, calc:true, inCompletion:false,
    formula:'DATE_MAJ(statut_publication)',
    formulaLabel:'Date du dernier changement de statut de publication',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:77, name:'Date de mise en ligne prévue', code:'miseEnLigne', type:'Date', groupId:1, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:true, clickToOpen:false },
  { id:114, name:'Réassort automatique SAP', code:'reassort_sap', type:'Simple select', groupId:1, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Activé','Désactivé'] },
  { id:115, name:'Commande d\'implantation envoyée', code:'commande_implantation', type:'Oui / Non', groupId:1, required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:116, name:'Date de disponibilité produit', code:'date_dispo', type:'Date', groupId:1, required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:131, name:'Contribution Akeneo faite', code:'contribution_akeneo', type:'Oui / Non', groupId:1, required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:69, name:'Fournisseur',         code:'fournisseur_code',    type:'Simple select', groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, listRef:{ ref:'Fournisseurs', label:'Nom' } },
  { id:70, name:'Marque',              code:'marque',              type:'Simple select', groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:[], listRef:{ ref:'Marques' } },
  { id:62, name:'RF',                  code:'rf', helpText:'RF : remise sur facture',                  type:'Nombre',    groupId:3,  required:false, calc:true, inCompletion:false, formula:'=REFERENTIEL("Conditions commerciales","RF")', formulaLabel:'Lu dans le référentiel Conditions commerciales', mask:'', stepEnabled:true, step:0.005, min:0, max:1, showInSynth:false, clickToOpen:false, displayFormat:'percent' },
  { id:63, name:'Remise ATS',      code:'remiseEnseigne',      type:'Nombre', decimals:0,    groupId:3,  required:false, calc:true, inCompletion:false, formula:'=REFERENTIEL("Conditions commerciales","Remise ATS")', formulaLabel:'Lu dans le référentiel Conditions commerciales', mask:'', stepEnabled:true, step:0.005, min:0, max:1, showInSynth:false, clickToOpen:false, displayFormat:'percent' },
  { id:64, name:'Reprise échange',     code:'repriseEchange',      type:'Oui / Non', groupId:3,  required:false, calc:true, inCompletion:false, formula:'=REFERENTIEL("Conditions commerciales","Reprise échange")', formulaLabel:'Lu dans le référentiel Conditions commerciales', mask:'', showInSynth:false, clickToOpen:false },
  { id:65, name:'Conditions de livraison', code:'conditionsLivraison', type:'Texte', groupId:3,  required:false, calc:true, inCompletion:false, formula:'=REFERENTIEL("Conditions commerciales","Conditions de livraison")', formulaLabel:'Lu dans le référentiel Conditions commerciales', mask:'', showInSynth:false, clickToOpen:false },
  { id:7, width:'narrow',  name:'Référence monture',   code:'ref_monture',   type:'Texte',           groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:8, width:'wide',  name:'Nom marketing',       code:'nom_marketing', type:'Texte',   groupId:4,  required:false, calc:true, inCompletion:false,
    formula:'=SI([ref_monture]=="","",CONCAT(marque, " - ", ref_monture, " - ", couleur))', formulaLabel:'Marque - Référence monture - Couleur',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:9,  name:'Cible',               code:'cible',         type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Homme','Femme','Mixte','Enfant','Junior'] },
  { id:10, name:'Optique / Solaire',   code:'optique_solaire',type:'Simple select',  groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Optique','Solaire','Clip','Masque','Prémontée'] },
  { id:11, name:'Matière',             code:'matiere',       type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Acetate','Métal','Titane','Plastique','Bois','Carbone'] },
  { id:12, name:'Cerclage',            code:'cerclage',      type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Cercle','Semi-cercle','Sans cerclage','Nylor'] },
  { id:13, width:'narrow', name:'Couleur',             code:'couleur',       type:'Texte',           groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:71, width:'narrow', name:'Largeur des verres',  code:'largeur_verres', type:'Nombre',         groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:14, width:'narrow', name:'Taille',              code:'taille',        type:'Texte',           groupId:4,  required:false, calc:true, inCompletion:false,
    formula:'=TABLE()',
    formulaLabel:'Table de calcul : largeur des verres',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:15, name:'Forme de la monture', code:'forme',         type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Ronde', 'Carree', 'Rectangulaire', 'Ovale', 'Papillon', 'Aviateur', 'Clubmaster', 'rondes/ovales/pantos', 'carrées', 'rectangles', 'Masque', 'pilotes/aviator', 'hexagonales/anguleuses', 'papillon/œil de chat', 'wayfarer', 'rétro', 'Masque de ski'] },
  { id:16, name:'Code douanier',       code:'code_douanier', type:'Texte',           groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'99999999', showInSynth:false, clickToOpen:false },
  { id:17, name:'Commentaire',         code:'commentaire',   type:'Texte long',      groupId:4,  required:false, calc:false, inCompletion:false, formula:'', mask:'', maxLength:500, showInSynth:false, clickToOpen:false },
  { id:18, name:'Prix catalogue HT',   code:'prix_catalogue_monture', type:'Nombre', groupId:5,  required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:19, name:'PA ATS HT',       code:'pa_interne_monture', helpText:'PA : prix d’achat',     type:'Nombre', groupId:5,  required:false, calc:true, inCompletion:false,
    formula:'=SI([prix_catalogue_monture]=="","",[prix_catalogue_monture]*(1-[remiseEnseigne]))', formulaLabel:'Prix catalogue HT x (1 - Remise ATS)',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:21, name:'RFA',                 code:'rfa', helpText:'RFA : remise de fin d’année',           type:'Nombre',          groupId:3,  required:false, calc:true, inCompletion:false, formula:'=REFERENTIEL("Conditions commerciales","RFA")', formulaLabel:'Lu dans le référentiel Conditions commerciales', mask:'', stepEnabled:true, step:0.005, min:0, max:1, showInSynth:false, clickToOpen:false, displayFormat:'percent' },
  { id:22, name:'Marge ATS HT',    code:'marge_interne_monture', type:'Nombre', groupId:5, required:false, calc:true, inCompletion:false,
    formula:'=SI([pa_opticien_monture]=="" OU [pa_interne_monture]=="","",[pa_opticien_monture]-[pa_interne_monture])', formulaLabel:'PA opticien HT - PA ATS HT',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:23, name:'PA opticien HT',      code:'pa_opticien_monture', helpText:'PA : prix d’achat',   type:'Nombre', groupId:5, required:false, calc:true, inCompletion:false,
    formula:'=SI([prix_catalogue_monture]=="","",[prix_catalogue_monture]*(1-[rf])*(1-[rfa]))', formulaLabel:'Prix catalogue HT x (1 - RF) x (1 - RFA)',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  // Groupe commun Prix de vente : une seule formule pour toutes les categories.
  // Le coefficient vient du module Baremes ; sans ligne de bareme, le PVMC se force.
  { id:135, name:'PA opticien HT', code:'pa_opticien_lentille_pel', type:'Nombre', groupId:16, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:136, name:'PVMC fixé',      code:'pvmc_fixe',                type:'Nombre', groupId:16, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:138, name:'PA ATS HT', code:'pa_ats_lentille_pel', type:'Nombre', groupId:16, required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:132, hideOnSheet:true, name:'Prix de base HT',    code:'prix_base',     type:'Nombre',  groupId:14, required:false, calc:true, inCompletion:false,
    formula:'=SI([prix_catalogue_monture]!="",[prix_catalogue_monture],[prix_opticien_unitaire_accessoire])',
    formulaLabel:'Prix catalogue HT (monture) ou prix opticien unitaire HT (accessoire)',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:52, name:'Coefficient',         code:'coefficient',   type:'Nombre',  groupId:14, required:false, calc:true, inCompletion:false,
    formula:'=TABLE()', formulaLabel:'Table de calcul : catégorie, optique / solaire, type d\'accessoire, tranche de prix de base HT',
    mask:'', decimals:1, showInSynth:false, clickToOpen:false },
  { id:113, name:'PVMC',               code:'pvmc',          type:'Nombre',  groupId:14, required:false, calc:true, inCompletion:false,
    formula:'=SI([pvmc_fixe]!="",[pvmc_fixe],SI([prix_base]=="" OU [coefficient]=="","",ROUNDUP([prix_base]*[coefficient],0)))',
    formulaLabel:'PVMC fixé s’il est renseigné, sinon prix de base HT x coefficient arrondi à l’euro supérieur',
    mask:'', decimals:0, showInSynth:false, clickToOpen:false },
  { id:24, name:'PV HT',               code:'pv_ht',         type:'Nombre',  groupId:14, required:false, calc:true, inCompletion:false,
    formula:'=SI([pvmc]=="","",[pvmc]/1.2)', formulaLabel:'PVMC hors TVA à 20 %',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  // Coût opticien et taux de marque : communs, comme le prix de base
  { id:133, hideOnSheet:true, name:'Coût opticien HT',   code:'cout_opticien', type:'Nombre',  groupId:14, required:false, calc:true, inCompletion:false,
    formula:'=SI([pa_opticien_monture]!="",[pa_opticien_monture],SI([prix_opticien_unitaire_accessoire]!="",[prix_opticien_unitaire_accessoire],[pa_opticien_lentille_pel]))',
    formulaLabel:'PA opticien HT (monture, lentille, PEL) ou prix opticien unitaire HT (accessoire)',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:25, name:'Taux de marque',      code:'taux_marque',   type:'Nombre', displayFormat:'percent', decimals:2,  groupId:14, required:false, calc:true, inCompletion:false,
    formula:'=SI([pv_ht]=="" OU [cout_opticien]=="","",([pv_ht]-[cout_opticien])/[pv_ht])', formulaLabel:'(PV HT - coût opticien HT) / PV HT', displayFormat:'percent',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:26, name:'Titre SEO O',      code:'seo_titre_o',  type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'=SI([cat]=="Accessoires",CONCAT("Accessoires ",nom,": Achat en ligne - Optic 2000"),SI([cat]=="Lentilles",CONCAT("Lentilles ",nom," : Achat en ligne – Optic 2000"),SI([cat]=="PEL",CONCAT("Produit d\'entretien de lentilles ",nom," : Achat en ligne - Optic 2000"),SI([optique_solaire]=="Optique",CONCAT("Lunettes de vue ",cible," ",nom_marketing," ",forme," : Réservation en ligne - Optic 2000"),CONCAT("Lunettes de soleil ",cible," ",nom_marketing," : Achat en ligne - Optic 2000")))))', formulaLabel:'Phrase de la base actuelle selon la catégorie (montures : vue ou soleil, cible, nom marketing, forme)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:27, name:'Description SEO O',code:'seo_desc_o',   type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'=SI([cat]=="Accessoires",CONCAT("Découvrez nos ➤ Accessoires ",nom," en ligne & chez les opticiens Optic 2000 ✔️ Achat en ligne ⭐ Livraison à domicile ! ⚡ Click & Collect !"),SI([cat]=="Lentilles",CONCAT("Découvrez nos ➤ Lentilles de contact ",nom," en ligne & chez les opticiens Optic 2000 ✔️ Achat en ligne ⭐ Livraison à domicile ! ⚡ Click & Collect !"),SI([cat]=="PEL",CONCAT("Découvrez notre ➤ Produit d\'entretien de lentilles ",nom," en ligne & chez les opticiens Optic 2000 ✔️ Achat en ligne ⭐ Livraison à domicile ! ⚡ Click & Collect !"),SI([optique_solaire]=="Optique",CONCAT("Découvrez nos ➤ Lunettes de vue ",cible," ",nom_marketing," en ligne & chez les opticiens Optic 2000 ✔ Réservez en ligne ⭐ Livraison en magasin !"),CONCAT("Découvrez nos ➤ Lunettes de soleil ",cible," ",nom_marketing," en ligne & chez les opticiens Optic 2000 ✔️ Achat en ligne ⭐ Livraison à domicile ! ⚡ Click & Collect !")))))',
    formulaLabel:'Phrase de la base actuelle selon la catégorie',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:28, name:'Titre SEO L',          code:'seo_titre_l', type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'=SI([cat]=="Accessoires",CONCAT("Accessoires ",nom,": Achat en ligne - Lissac"),SI([cat]=="Lentilles",CONCAT("Lentilles de contact ",nom," | Opticien Lissac"),SI([cat]=="PEL",CONCAT("Produit d\'entretien de lentilles ",nom," | Opticien Lissac"),SI([optique_solaire]=="Optique",CONCAT("Lunettes de vue ",cible," ",nom_marketing," ",forme," : Réservation en ligne | Lissac l\'opticien"),CONCAT("Lunettes de soleil ",cible," ",nom_marketing," : Achat en ligne | Lissac l\'opticien")))))', formulaLabel:'Phrase de la base actuelle selon la catégorie (montures : vue ou soleil, cible, nom marketing, forme)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:29, name:'Description SEO L',    code:'seo_desc_l',  type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'=SI([cat]=="Accessoires",CONCAT("Découvrez nos ➤ Accessoires ",nom," en ligne & chez les opticiens Lissac ✔️ Achat en ligne ⭐ Livraison à domicile ! ⚡ Click & Collect !"),SI([cat]=="Lentilles",CONCAT("Découvrez les Lentilles de contact ",nom," chez les opticiens Lissac ✔️ Venez les essayer en magasin ! ⭐"),SI([cat]=="PEL",CONCAT("Découvrez le Produit d\'entretien de lentilles ",nom," chez les opticiens Lissac ✔️ Venez le voir en magasin ! ⭐"),SI([optique_solaire]=="Optique",CONCAT("Découvrez les lunettes de vue ",cible," ",nom_marketing," en ligne & chez Lissac l\'opticien ✔ Réservation et livraison en magasin !"),CONCAT("Découvrez les lunettes de soleil ",cible," ",nom_marketing," en ligne & chez Lissac l\'opticien ✔️ Achat en ligne ⭐ Livraison à domicile ! ⚡ Click & Collect !")))))',
    formulaLabel:'Phrase de la base actuelle selon la catégorie',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:30, name:'Laboratoire',         code:'laboratoire',   type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Alcon', 'Bausch & Lomb', 'CooperVision', 'Johnson & Johnson', 'Menicon', 'CVE', 'MDD', 'AMO', 'LCS', 'Horus', 'Precilens', 'Ophtalmic'] },
  { id:31, width:'narrow', name:'Nombre de lentilles par boîte', code:'nb_lentilles', type:'Simple select', groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['2','6','10','12','30','90','180'] },
  { id:72, name:'Lentille correctrice ou de couleur',                code:'type_usage',    type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Correctrices','Couleurs'] },
  { id:32, name:'Lentille souple ou rigide',   code:'type_lentille', type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Souple','Rigide'] },
  { id:33, name:'Couleur lentille',    code:'couleur_lentille', type:'Texte',        groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:34, name:'Type de vision',      code:'type_vision',   type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Sphérique','Torique','Multifocal'] },
  { id:35, name:'Renouvellement',      code:'renouvellement',type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Journalier', 'Bimensuelle', 'Mensuelle', 'Hebdomadaire'] },
  { id:36, name:'Matériau lentille',   code:'materiau_lentille', type:'Simple select', groupId:7, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Hydrogel','Silicone Hydrogel'] },
  { id:37, width:'narrow', name:'Hydrophilie en %',    code:'hydrophilie',   type:'Nombre',          groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:38, width:'narrow', name:'Filtre UV',           code:'filtre_uv',     type:'Oui / Non',       groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:39, width:'narrow', name:'Transmissibilité à l\'oxygène (Dk/t)', code:'sensibilite_o2', type:'Nombre', groupId:7, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:73, width:'narrow', name:'HEMA',                code:'hema',          type:'Oui / Non',       groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:40, width:'narrow', name:'Teinte de manipulation', code:'teinte_manip', type:'Oui / Non',     groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:41, name:'Défauts visuels',     code:'defauts_visuels', type:'Multi select',  groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Hypermétropie / Myopie','Astigmatisme','Presbytie'] },
  { id:44, name:'Durée de conservation après ouverture', code:'duree_conservation', type:'Texte', groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:45, name:'Type de solution',    code:'type_solution', type:'Simple select',   groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Multi-fonction', 'Oxydant', 'Décontaminant', 'Nettoyage', 'Rinçage', 'Trempage', 'Gouttes de confort', 'Solution d’hydratation', 'Déprotéinisant', 'Sérum physiologique tamponné', 'Produit d’entretien LRPG', 'Produit d’entretien sclérales', 'Produit d’entretien souples et hybrides'] },
  { id:74, name:'Code produit',        code:'code_produit',  type:'Texte',           groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:75, name:'Conditionnement',     code:'conditionnement', type:'Texte',         groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:76, name:'Type de PEL',                code:'type_pel',      type:'Simple select',   groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Gouttes de confort','Flight Pack','Produits d’entretien','Pack entretien','Comprimés'] },
  { id:51, name:'Type d\'accessoire',     code:'type_produit_acc', type:'Simple select', groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false,
    options:['Cadeau fid','Chainette','Chamoisine','Charlie Chill','Clips','Coffret','Complément alimentaire','Cordon','Etui','Lunettes','Produits d\'entretien','Textile','Autre'] },
  { id:54, name:'Vue de face',         code:'visuel_face',   type:'Image',           groupId:2,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:55, name:'Vue 3/4',             code:'visuel_tq',     type:'Image',           groupId:2,  required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:56, name:'Vue de profil',       code:'visuel_profil', type:'Image',           groupId:2,  required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:57, name:'Visuel ambiance',     code:'visuel_ambiance', type:'Image',         groupId:2,  required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:134, name:'Origine des visuels', code:'origine_visuels', type:'Simple select', groupId:2, required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Fournisseur','Shooting'] },
  { id:82, width:'narrow', name:'Hauteur des verres',  code:'hauteur_verres', type:'Nombre', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:83, width:'narrow', name:'Taille du nez',       code:'taille_nez',     type:'Nombre', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:84, width:'narrow', name:'Largeur de la face',  code:'largeur_face',   type:'Nombre', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:85, width:'narrow', name:'Taille des branches', code:'taille_branches', type:'Nombre', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:86, width:'narrow', name:'Branches flex',       code:'branches_flex',  type:'Oui / Non', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:87, width:'narrow', name:'Branches antidérapantes', code:'branches_antiderapantes', type:'Oui / Non', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:88, name:'Teinte des verres',   code:'teinte_verres',  type:'Texte', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, showIfAttr:'optique_solaire', showIfValue:'Solaire ; Clip ; Masque' },
  { id:89, width:'narrow', name:'Pola',                code:'pola',           type:'Oui / Non', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, showIfAttr:'optique_solaire', showIfValue:'Solaire ; Clip ; Masque' },
  { id:90, width:'narrow', name:'Miroir',              code:'miroir',         type:'Oui / Non', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, showIfAttr:'optique_solaire', showIfValue:'Solaire ; Clip ; Masque' },
  { id:91, width:'narrow', name:'Dégradé',             code:'degrade',        type:'Oui / Non', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, showIfAttr:'optique_solaire', showIfValue:'Solaire ; Clip ; Masque' },
  { id:92, width:'narrow', name:'Adaptable à la vue',  code:'adaptable_vue',  type:'Oui / Non', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:93, name:'Style',               code:'style',          type:'Simple select', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Classique', 'Fashion', 'Sport', 'Vintage', 'Urbain', 'Créateur', 'Sportswear', 'Design', 'Couturier', 'Glamour', 'Pop'] },
  { id:94, name:'Pays d\'origine',      code:'pays_origine',   type:'Texte', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:95, width:'narrow', name:'Adaptable verres progressifs', code:'adaptable_progressifs', type:'Oui / Non', groupId:4, required:false, calc:true, inCompletion:false, formula:'=SI([hauteur_verres]=="","",SI([cible]=="Enfant" OU [cible]=="Junior","Non",SI([hauteur_verres]>=16,"Oui","Non")))', formulaLabel:'Oui si la cible n’est pas Enfant ou Junior et que la hauteur des verres est d’au moins 16 mm', mask:'', showInSynth:false, clickToOpen:false },
  { id:96, width:'narrow', name:'Code couleur',        code:'code_couleur',   type:'Texte', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:97, name:'Profil de caractère', code:'profil_caractere', type:'Simple select', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['PFL0010 : Homme','PFL0030 : Mixte','PFL0020 : Femme','PFL0040 : Junior'] },
  { id:98, name:'Groupe de marchandise', code:'groupe_marchandise', type:'Texte', groupId:4, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul : optique / solaire, matière, cerclage', mask:'', showInSynth:false, clickToOpen:false },
  { id:109, width:'narrow', name:'Catégorie du verre', code:'categorie_verre', type:'Simple select', groupId:4, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Catégorie 1','Catégorie 2','Catégorie 3','Catégorie 4'], showIfAttr:'optique_solaire', showIfValue:'Solaire ; Clip ; Masque' },
  { id:99, name:'Code fabricant',      code:'code_fabricant', type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'RECHERCHE("Fournisseurs",[fournisseur_code],"Trigramme")', formulaLabel:'Trigramme du fournisseur (référentiel Fournisseurs)', mask:'', showInSynth:false, clickToOpen:false },
  { id:137, name:'IWI - Nom du fabricant', code:'iwi_nom_fabricant', type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'RECHERCHE("Fournisseurs",[fournisseur_code],"Nom")', formulaLabel:'Nom du fournisseur (référentiel Fournisseurs)', mask:'', showInSynth:false, clickToOpen:false },
  { id:101, name:'IWI - Type',              code:'iwi_type',              type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:102, name:'IWI - Sous-type',         code:'iwi_sous_type',         type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:103, name:'IWI - Matériau face',     code:'iwi_materiau_face',     type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:104, name:'IWI - Matériau branche',  code:'iwi_materiau_branche',  type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:105, name:'IWI - Type utilisateur',  code:'iwi_utilisateur',       type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:106, name:'IWI - Forme',             code:'iwi_forme',             type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:107, name:'IWI - Marque',            code:'iwi_marque',            type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=SI(RECHERCHE("Marques",[marque],"Code IWI")=="","",CONCAT(RECHERCHE("Marques",[marque],"Code IWI")," - ",marque))', formulaLabel:'Code IWI de la marque (référentiel Marques), tiret, marque', mask:'', showInSynth:false, clickToOpen:false },
  { id:108, name:'IWI - Date de modification', code:'iwi_date_modif',     type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'TODAY()', formulaLabel:'Date du jour a l\'export', mask:'', showInSynth:false, clickToOpen:false },
  { id:110, name:'IWI - Code douanier', code:'iwi_code_douanier', type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul : optique / solaire, matière', mask:'', showInSynth:false, clickToOpen:false },
  { id:111, name:'IWI - Prescription',  code:'iwi_prescription',  type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'=TABLE()', formulaLabel:'Table de calcul', mask:'', showInSynth:false, clickToOpen:false },
  { id:112, name:'IWI - Code marquage', code:'iwi_code_marquage', type:'Texte', groupId:13, required:false, calc:true, inCompletion:false, formula:'CONCAT(ref_monture, " ", code_couleur, " ", largeur_verres, taille_nez)', formulaLabel:'Référence, espace, code couleur, espace, calibre et nez collés', mask:'', showInSynth:false, clickToOpen:false },
  { id:117, name:'PA unitaire HT ATS', code:'pa_unitaire_accessoire', type:'Nombre', groupId:15, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:118, name:'PA par lot HT ATS', code:'pa_lot_accessoire', type:'Nombre', groupId:15, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:120, name:'Prix opticien par lot HT', code:'prix_opticien_lot_accessoire', type:'Nombre', groupId:15, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:119, name:'Prix opticien unitaire HT', code:'prix_opticien_unitaire_accessoire', type:'Nombre', groupId:15, required:false, calc:true, inCompletion:false,
    formula:'=SI([prix_opticien_lot_accessoire]=="" OU [conditionnement_origine]=="","",[prix_opticien_lot_accessoire]/[conditionnement_origine])',
    formulaLabel:'Prix opticien par lot HT / conditionnement d\'origine',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
  { id:121, width:'narrow', name:'Année de lancement', code:'annee_lancement', type:'Nombre', groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:0, showInSynth:false, clickToOpen:false },
  { id:122, width:'wide', name:'Désignation magasin', code:'designation_magasin', type:'Texte', groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:123, name:'Matière accessoire', code:'matiere_acc', type:'Texte', groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:124, name:'Dimensions', code:'dimensions_acc', type:'Texte', groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:125, width:'narrow', name:'Conditionnement d\'origine', code:'conditionnement_origine', type:'Nombre', groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', decimals:0, showInSynth:false, clickToOpen:false },
  { id:128, name:'Marge HT ATS', code:'marge_accessoire', type:'Nombre', groupId:15, required:false, calc:true, inCompletion:false,
    formula:'=SI([pv_ht]=="" OU [prix_opticien_unitaire_accessoire]=="","",[pv_ht]-[prix_opticien_unitaire_accessoire])',
    formulaLabel:'PV HT - prix opticien unitaire HT',
    mask:'', decimals:2, showInSynth:false, clickToOpen:false },
];

// ============================================================
// REFERENTIEL FOURNISSEURS / MARQUES
// ============================================================


// ============================================================
// RÉFÉRENTIELS (Administration > Référentiels)
// Tous les référentiels se règlent de la même façon (Fournisseurs et Marques
// compris) : colonnes, colonnes clés reliées à un attribut du produit,
// groupe d'attributs. RECHERCHE("référentiel", [champ], "colonne") lit la
// ligne dont la première colonne vaut le champ.
// ============================================================

let refTables = [
  { id: 'ref_fournisseurs', name: 'Fournisseurs', columns: ['Code', 'Nom', 'Trigramme'], keys: { 'Code': 'fournisseur_code' },
    rows: [
      { 'Code': 'R90307', 'Nom': "L'AMY", 'Trigramme': '' },
      { 'Code': 'R90048', 'Nom': 'ADCL', 'Trigramme': 'ADC' },
      { 'Code': 'R90085', 'Nom': 'APLUS', 'Trigramme': '' },
      { 'Code': 'R90122', 'Nom': 'BOLLE BRANDS', 'Trigramme': 'BSH' },
      { 'Code': 'R90714', 'Nom': 'BLI-DBP', 'Trigramme': '' },
      { 'Code': 'R90159', 'Nom': 'CHARMANT', 'Trigramme': 'CHA' },
      { 'Code': 'R90196', 'Nom': 'DE RIGO', 'Trigramme': 'DRF' },
      { 'Code': 'R90233', 'Nom': 'GRASSET', 'Trigramme': '' },
      { 'Code': 'R90270', 'Nom': 'JULBO', 'Trigramme': 'JUL' },
      { 'Code': 'R90825', 'Nom': 'KERING', 'Trigramme': 'KEY' },
      { 'Code': 'R90344', 'Nom': 'LUXOTTICA', 'Trigramme': 'LUX' },
      { 'Code': 'R90381', 'Nom': 'MARCHON', 'Trigramme': 'MAF' },
      { 'Code': 'R90418', 'Nom': 'MARCOLIN', 'Trigramme': 'MAR' },
      { 'Code': 'R90455', 'Nom': 'MENRAD', 'Trigramme': 'MVF' },
      { 'Code': 'R90788', 'Nom': 'COMO SAS', 'Trigramme': '' },
      { 'Code': 'R90492', 'Nom': 'ODLM', 'Trigramme': '' },
      { 'Code': 'R90529', 'Nom': 'OPAL', 'Trigramme': '' },
      { 'Code': 'R90566', 'Nom': 'SAFILO', 'Trigramme': 'SAF' },
      { 'Code': 'R90677', 'Nom': 'SEAPORT', 'Trigramme': '' },
      { 'Code': 'R90751', 'Nom': 'VISIOPTIS', 'Trigramme': 'VIS' },
      { 'Code': 'R90603', 'Nom': 'VUARNET', 'Trigramme': 'SOP' },
      { 'Code': 'R90862', 'Nom': 'FRENCH RETRO', 'Trigramme': 'FRE' },
      { 'Code': 'R90640', 'Nom': 'GROSFILLEY FRANCE', 'Trigramme': 'GRL' },
      { 'Code': 'R90011', 'Nom': 'CCO', 'Trigramme': '' },
      { 'Code': 'R90899', 'Nom': 'PACIFIC', 'Trigramme': '' },
      { 'Code': 'R90936', 'Nom': 'TRADECON', 'Trigramme': '' },
      { 'Code': 'R90973', 'Nom': 'CLASSICPACKING', 'Trigramme': '' }
    ] },
  { id: 'ref_marques', name: 'Marques', columns: ['Marque', 'Code IWI', 'Fabricant'], keys: { 'Marque': 'marque' },
    rows: [
      { 'Marque': 'Adidas', 'Code IWI': '', 'Fabricant': 'MAR' },
      { 'Marque': 'Alcon', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Aosept Plus', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Ba&sh', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Banana Moon', 'Code IWI': '', 'Fabricant': 'VIS' },
      { 'Marque': 'Biotrue', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Bolle', 'Code IWI': '', 'Fabricant': 'BSH' },
      { 'Marque': 'Boss', 'Code IWI': '', 'Fabricant': 'SAF' },
      { 'Marque': 'Burberry', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Calvin Klein', 'Code IWI': '', 'Fabricant': 'MAF' },
      { 'Marque': 'Carrera', 'Code IWI': '', 'Fabricant': 'SAF' },
      { 'Marque': 'Carven', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Cebe', 'Code IWI': '', 'Fabricant': 'BSH' },
      { 'Marque': 'Chloe', 'Code IWI': '', 'Fabricant': 'KEY' },
      { 'Marque': 'Diesel', 'Code IWI': '', 'Fabricant': 'MAR' },
      { 'Marque': 'Dolce&Gabbana', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Elle', 'Code IWI': '', 'Fabricant': 'CHA' },
      { 'Marque': 'Emporio Armani', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Esprit', 'Code IWI': '43', 'Fabricant': 'CHA' },
      { 'Marque': 'Faconnable', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'FRENCH RETRO', 'Code IWI': '', 'Fabricant': 'FRE' },
      { 'Marque': 'Gucci', 'Code IWI': '', 'Fabricant': 'KEY' },
      { 'Marque': 'Guess', 'Code IWI': '', 'Fabricant': 'MAR' },
      { 'Marque': 'Hugo', 'Code IWI': '', 'Fabricant': 'SAF' },
      { 'Marque': 'Jimmy Choo', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Julbo', 'Code IWI': 'JUL', 'Fabricant': 'JUL' },
      { 'Marque': 'Karl Lagerfeld', 'Code IWI': '', 'Fabricant': 'MAF' },
      { 'Marque': 'Lacoste', 'Code IWI': '', 'Fabricant': 'MAF' },
      { 'Marque': 'Lancel', 'Code IWI': '', 'Fabricant': 'GRL' },
      { 'Marque': 'Little Paul & Joe', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Longchamp', 'Code IWI': '', 'Fabricant': 'MAF' },
      { 'Marque': 'Marc Jacobs', 'Code IWI': '', 'Fabricant': 'SAF' },
      { 'Marque': 'Mauboussin', 'Code IWI': '', 'Fabricant': 'ADC' },
      { 'Marque': 'Maui Jim', 'Code IWI': '', 'Fabricant': 'KEY' },
      { 'Marque': 'Michael Kors', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Moncler', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'MontBlanc', 'Code IWI': 'MMM', 'Fabricant': 'KEY' },
      { 'Marque': 'Morgan', 'Code IWI': '', 'Fabricant': 'MVF' },
      { 'Marque': 'Nike', 'Code IWI': '', 'Fabricant': 'MAF' },
      { 'Marque': 'Oakley', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Opti-Free', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'PAUL & JOE', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Persol', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Polaroid', 'Code IWI': '', 'Fabricant': 'SAF' },
      { 'Marque': 'Police', 'Code IWI': '', 'Fabricant': 'DRF' },
      { 'Marque': 'Polo Ralph Lauren', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Prada', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Puma', 'Code IWI': '', 'Fabricant': 'KEY' },
      { 'Marque': 'Ralph Lauren', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Ray-Ban', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Renu', 'Code IWI': '', 'Fabricant': '' },
      { 'Marque': 'Rip Curl', 'Code IWI': '', 'Fabricant': 'ADC' },
      { 'Marque': 'Saint Laurent', 'Code IWI': 'SLX', 'Fabricant': 'KEY' },
      { 'Marque': 'Swarovski', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Versace', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Vogue', 'Code IWI': '', 'Fabricant': 'LUX' },
      { 'Marque': 'Vuarnet', 'Code IWI': '', 'Fabricant': 'SOP' }
    ] },
  { id: 'ref_conditions', name: 'Conditions commerciales', groupId: 3,
    columns: ['Fournisseur', 'Marque', 'Catégorie', 'Optique / Solaire', 'RF', 'RFA', 'Remise ATS', 'Reprise échange', 'Conditions de livraison'],
    // colonnes clés reliées à un attribut du produit (case vide = toutes)
    keys: { 'Fournisseur': 'fournisseur_code', 'Marque': 'marque', 'Catégorie': 'cat', 'Optique / Solaire': 'optique_solaire' },
    rows: [
      { 'Fournisseur': 'R90048', 'Marque': 'Rip Curl', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0', 'RFA': '0.02', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90048', 'Marque': 'Rip Curl', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.08', 'RFA': '0', 'Remise ATS': '0.25', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90048', 'Marque': 'Mauboussin', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.05', 'Remise ATS': '0.4', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90048', 'Marque': 'Mauboussin', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.4', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90122', 'Marque': 'Cebe', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.1', 'RFA': '0.03', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90122', 'Marque': 'Bolle', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.06', 'RFA': '0.01', 'Remise ATS': '0.2', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90159', 'Marque': 'Esprit', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90159', 'Marque': 'Esprit', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.05', 'RFA': '0', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90159', 'Marque': 'Elle', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0', 'RFA': '0.03', 'Remise ATS': '0.45', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90159', 'Marque': 'Elle', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.05', 'RFA': '0.01', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90196', 'Marque': 'Police', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.05', 'RFA': '0.02', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90196', 'Marque': 'Police', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.45', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90270', 'Marque': 'Julbo', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0', 'RFA': '0.02', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco 45€ minimum' },
      { 'Fournisseur': 'R90825', 'Marque': 'Gucci', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.05', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'Gucci', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.05', 'RFA': '0.03', 'Remise ATS': '0.25', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'Chloe', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.05', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'Chloe', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0', 'RFA': '0.02', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'Puma', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.03', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'Saint Laurent', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'MontBlanc', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0', 'Remise ATS': '0.35', 'Reprise échange': 'Non', 'Conditions de livraison': 'Au reel' },
      { 'Fournisseur': 'R90825', 'Marque': 'Maui Jim', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.05', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco internet / Franco 300€ magasin' },
      { 'Fournisseur': 'R90344', 'Marque': 'Ray-Ban', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.3', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Ray-Ban', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.35', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Vogue', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.05', 'Remise ATS': '0.2', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Vogue', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.08', 'RFA': '0.01', 'Remise ATS': '0.25', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Oakley', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0', 'RFA': '0.05', 'Remise ATS': '0.45', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Oakley', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0', 'RFA': '0.05', 'Remise ATS': '0.35', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Burberry', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.01', 'Remise ATS': '0.35', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Dolce&Gabbana', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.03', 'RFA': '0', 'Remise ATS': '0.45', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Persol', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.03', 'Remise ATS': '0.45', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Prada', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.3', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Prada', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.08', 'RFA': '0.03', 'Remise ATS': '0.45', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Versace', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.05', 'RFA': '0.05', 'Remise ATS': '0.45', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Emporio Armani', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.03', 'Remise ATS': '0.35', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Michael Kors', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.01', 'Remise ATS': '0.3', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Swarovski', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.05', 'RFA': '0', 'Remise ATS': '0.2', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Moncler', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.03', 'RFA': '0.05', 'Remise ATS': '0.35', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Jimmy Choo', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.03', 'Remise ATS': '0.3', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Polo Ralph Lauren', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.03', 'RFA': '0.02', 'Remise ATS': '0.45', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90344', 'Marque': 'Ralph Lauren', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.03', 'Remise ATS': '0.4', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90381', 'Marque': 'Karl Lagerfeld', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.03', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90381', 'Marque': 'Lacoste', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90381', 'Marque': 'Calvin Klein', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.05', 'RFA': '0.03', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90381', 'Marque': 'Nike', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.05', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90381', 'Marque': 'Longchamp', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.01', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90418', 'Marque': 'Diesel', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.03', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco 2 pces' },
      { 'Fournisseur': 'R90418', 'Marque': 'Adidas', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.02', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco 2 pces' },
      { 'Fournisseur': 'R90418', 'Marque': 'Guess', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.05', 'RFA': '0', 'Remise ATS': '0.25', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco 2 pces' },
      { 'Fournisseur': 'R90455', 'Marque': 'Morgan', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.03', 'Remise ATS': '0.25', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco 5 pces' },
      { 'Fournisseur': 'R90455', 'Marque': 'Morgan', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.06', 'RFA': '0', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco 5 pces' },
      { 'Fournisseur': 'R90566', 'Marque': 'Carrera', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0', 'RFA': '0.03', 'Remise ATS': '0.4', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90566', 'Marque': 'Boss', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0', 'Remise ATS': '0.4', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90566', 'Marque': 'Hugo', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.03', 'RFA': '0.01', 'Remise ATS': '0.2', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90566', 'Marque': 'Marc Jacobs', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0', 'Remise ATS': '0.4', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90566', 'Marque': 'Polaroid', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.05', 'RFA': '0.02', 'Remise ATS': '0.25', 'Reprise échange': 'Non', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90603', 'Marque': 'Vuarnet', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0', 'RFA': '0.02', 'Remise ATS': '0.45', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90640', 'Marque': 'Lancel', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.08', 'RFA': '0.05', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90751', 'Marque': 'Banana Moon', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.01', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90862', 'Marque': 'FRENCH RETRO', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.03', 'RFA': '0.03', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco - regroupement reassorts 1x/semaine' },
      { 'Fournisseur': 'R90677', 'Marque': 'Faconnable', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.03', 'RFA': '0.05', 'Remise ATS': '0.45', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Faconnable', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.08', 'RFA': '0.02', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Carven', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.01', 'Remise ATS': '0.25', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Carven', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.08', 'RFA': '0.02', 'Remise ATS': '0.4', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'PAUL & JOE', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.06', 'RFA': '0.03', 'Remise ATS': '0.25', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'PAUL & JOE', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0.08', 'RFA': '0.01', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Little Paul & Joe', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0', 'RFA': '0', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Little Paul & Joe', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0', 'RFA': '0', 'Remise ATS': '0.3', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Ba&sh', 'Catégorie': 'Montures', 'Optique / Solaire': 'Optique', 'RF': '0.1', 'RFA': '0.02', 'Remise ATS': '0.2', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' },
      { 'Fournisseur': 'R90677', 'Marque': 'Ba&sh', 'Catégorie': 'Montures', 'Optique / Solaire': 'Solaire', 'RF': '0', 'RFA': '0.05', 'Remise ATS': '0.35', 'Reprise échange': 'Oui', 'Conditions de livraison': 'Franco' }
    ] },
  { id: 'ref_pays', name: 'Pays', columns: ['Pays', 'Code ISO'],
    rows: [ { 'Pays': 'Chine', 'Code ISO': 'CN' }, { 'Pays': 'France', 'Code ISO': 'FR' }, { 'Pays': 'Italie', 'Code ISO': 'IT' },
            { 'Pays': 'Japon', 'Code ISO': 'JP' }, { 'Pays': 'Roumanie', 'Code ISO': 'RO' } ] },
];


function allReferentials() {
  return ((refTables || []).map(t => ({
    id: t.id, name: t.name, system: false, table: t, data: () => t.rows,
    cols: t.columns.map((c, i) => ({ name: c, prop: c, key: i === 0 })),
  })));
}
function refTableRows(name) {
  const t = (refTables || []).find(x => refNorm(x.name) === refNorm(name));
  return t ? t.rows : [];
}
// Fournisseurs et marques lus dans leurs référentiels
function supplierList() {
  return refTableRows('Fournisseurs').map(r => ({ code: String(r['Code'] || ''), name: String(r['Nom'] || ''), trigram: String(r['Trigramme'] || '') }));
}

function refNorm(v) {
  return String(v == null ? '' : v).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function findReferential(name) {
  return allReferentials().find(r => refNorm(r.name) === refNorm(name)) || null;
}
// Ligne d'un référentiel à colonnes clés qui correspond à un produit : une
// case clé vide vaut « toutes », la ligne la plus précise l'emporte
function refRowForProduct(R, ctx) {
  const keys = (R && R.table && R.table.keys) || {};
  const cols = Object.keys(keys);
  if (!cols.length) return null;
  let best = null, bestScore = -1;
  R.data().forEach(row => {
    let score = 0;
    for (const c of cols) {
      const cell = String(row[c] == null ? '' : row[c]).trim();
      if (!cell) continue;
      if (refNorm(cell) !== refNorm(ctx[keys[c]])) return;
      score++;
    }
    if (score > bestScore) { best = row; bestScore = score; }
  });
  return best;
}
function refValueForProduct(refName, col, ctx) {
  const R = findReferential(refName);
  if (!R) return '';
  const row = refRowForProduct(R, ctx);
  const c = R.cols.find(x => refNorm(x.name) === refNorm(col));
  return row && c && row[c.prop] != null ? row[c.prop] : '';
}

function lookupReferential(ref, value, col) {
  const R = findReferential(ref);
  if (!R || value == null || String(value) === '') return '';
  const key = R.cols[0];
  const c = R.cols.find(x => refNorm(x.name) === refNorm(col));
  if (!c) return '';
  const row = R.data().find(x => refNorm(x[key.prop]) === refNorm(value));
  return row && row[c.prop] != null ? row[c.prop] : '';
}

// ============================================================
// MOTEUR DE FORMULES
// ============================================================
function evalFormula(formula, fields) {
  if (!formula || !formula.startsWith('=')) return '';
  let expr = formula.slice(1).trim();

  if (expr.toUpperCase().startsWith('SI(')) {
    return evalSi(expr, fields);
  }

  // Remplacer [code] par la valeur du champ
  expr = expr.replace(/\[([^\]]+)\]/g, (match, code) => {
    const val = fields[code];
    if (val === undefined || val === null || val === '') return '""';
    const n = parseFloat(val);
    if (!isNaN(n) && String(val).trim() !== '') return String(n);
    return '"' + String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  });

  try {
    const result = Function('"use strict";return (' + expr + ')')();
    if (result === null || result === undefined) return '';
    if (typeof result === 'number') {
      if (!isFinite(result) || isNaN(result)) return '';
      return parseFloat(result.toFixed(4)).toString();
    }
    const str = String(result).trim();
    return str === '0' ? '' : str;
  } catch(e) {
    return '';
  }
}

// Extraire le contenu entre parentheses en respectant le nestage
function extractCallInner(expr) {
  const open = expr.indexOf('(');
  if (open < 0) return '';
  let depth = 0, inStr = false;
  for (let i = open; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"') inStr = !inStr;
    else if (!inStr && c === '(') depth++;
    else if (!inStr && c === ')') {
      depth--;
      if (depth === 0) return expr.slice(open + 1, i);
    }
  }
  return expr.slice(open + 1);
}

function splitFormulaArgs(inner) {
  const args = [];
  let current = '', depth = 0, inStr = false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '"') inStr = !inStr;
    else if (!inStr && c === '(') depth++;
    else if (!inStr && c === ')') depth--;
    else if (!inStr && depth === 0 && c === ',') {
      args.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  args.push(current.trim());
  return args;
}

function evalFormulaArg(arg, fields) {
  if (!arg) return '';
  const t = arg.trim();
  if (t.length > 1 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  if (/^SI\s*\(/i.test(t)) return evalSi(t, fields);
  if (typeof evaluateFormula === 'function') return evaluateFormula(t, fields);
  return evalFormula(t.startsWith('=') ? t : '=' + t, fields);
}

// SI(condition) -> Oui/Non
// SI(condition, siVrai, siFaux) -> valeur, siFaux peut etre un SI imbrique
function evalSi(expr, fields) {
  const args = splitFormulaArgs(extractCallInner(expr));
  if (!args.length) return '';
  const ok = evalCondition(args[0], fields);
  if (args.length === 1) return ok ? 'Oui' : 'Non';
  if (args.length >= 3) return ok ? evalFormulaArg(args[1], fields) : evalFormulaArg(args[2], fields);
  return ok ? evalFormulaArg(args[1], fields) : '';
}

function isEventFormula(formula) {
  return /^\s*=?\s*DATE_MAJ\s*\(/i.test(formula || '');
}

// Une formule qui relit son propre champ (sinon, garder la saisie) doit
// conserver la valeur en base. Les autres formules sont recalculees.
function formulaKeepsStoredValue(a) {
  if (!a || !a.formula || isEventFormula(a.formula)) return false;
  const code = String(a.code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('\\[' + code + '\\]').test(a.formula);
}

function eventFormulaSource(formula) {
  const m = (formula || '').match(/DATE_MAJ\s*\(\s*\[?([^)\s\]]+)\]?\s*\)/i);
  return m ? m[1] : null;
}

function evalCondition(expr, fields) {
  let e = expr.replace(/VRAI/gi, 'true').replace(/FAUX/gi, 'false');
  e = e.replace(/\[([^\]]+)\]/g, (match, code) => {
    const raw = fields[code];
    if (raw === undefined || raw === null || String(raw).trim() === '') return '""';
    const val = String(raw).trim();
    if (/^(oui|true)$/i.test(val)) return 'true';
    if (/^(non|false)$/i.test(val)) return 'false';
    const n = parseFloat(val);
    if (!isNaN(n) && val !== '') return String(n);
    return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  });
  e = e.replace(/\bOU\b/gi, '||').replace(/\bET\b/gi, '&&');
  try { return !!Function('"use strict";return (' + e + ')')(); }
  catch(err) { return false; }
}


// Pendant un affichage (liste, tableau de bord), chaque produit n'est
// recalculé qu'une fois : rien ne change entre deux lignes.
let _calcBatch = null;
function withCalcBatch(fn) {
  if (_calcBatch) return fn();
  _calcBatch = new Set();
  try { return fn(); } finally { _calcBatch = null; }
}

function computeCalcFields(product) {
  if (_calcBatch) { if (_calcBatch.has(product)) return; _calcBatch.add(product); }
  const f = product.fields;
  const forced = product.forcedFields || {};

  const eventAttrs = attributes.filter(a => a.formula && isEventFormula(a.formula));
  if (!product._watchPrev) product._watchPrev = {};

  const calcAttrs = attributes.filter(a =>
    (a.calc || a.formula) && a.formula && !isEventFormula(a.formula)
  );
  // Passes successives jusqu'a stabilite : les champs calcules s'enchainent
  // (prix opticien unitaire -> prix de base -> coefficient -> PVMC -> PV HT -> taux)
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    calcAttrs.forEach(attr => {
      const ctx = Object.assign({}, f, { cat: product.cat || '' });
      const table = isTableFormula(attr.formula) ? calcTableFor(attr.code) : null;
      const next = Object.prototype.hasOwnProperty.call(forced, attr.code)
        ? forced[attr.code]
        : (isTableFormula(attr.formula) ? (table ? evalCalcTable(table, ctx) : '') : evaluateFormula(attr.formula, ctx));
      if (String(f[attr.code] ?? '') !== String(next ?? '')) changed = true;
      f[attr.code] = next;
    });
    if (!changed && pass > 0) break;
  }

  // DATE_MAJ : on compare a la valeur vue au calcul precedent.
  // Le premier passage initialise le souvenir sans horodater (chargement).
  eventAttrs.forEach(a => {
    const src = eventFormulaSource(a.formula);
    if (!src) return;
    if (Object.prototype.hasOwnProperty.call(forced, a.code)) {
      product._watchPrev[src] = f[src];
      return;
    }
    const known = Object.prototype.hasOwnProperty.call(product._watchPrev, src);
    const prev = product._watchPrev[src];
    const curr = f[src];
    if (known && String(prev ?? '') !== String(curr ?? '')) {
      const oldDate = f[a.code];
      f[a.code] = todayStr();
      if (typeof addPendingChange === 'function' && String(oldDate ?? '') !== String(f[a.code])) {
        addPendingChange(product, a.name, oldDate, f[a.code]);
      }
    }
    product._watchPrev[src] = curr;
  });


  // Etape du workflow : posee en dernier, elle lit les autres champs calcules
  if (typeof workflowStateLabel === 'function') f.etape_workflow = isWorkflowOn() ? workflowStateLabel(product) : '';

  return f;
}

// ============================================================
// COHERENCE DES DONNEES PRODUITS
// Un champ à formule n'a pas de valeur stockée, elle est recalculée à
// chaque rendu. Les formules DATE_MAJ font exception : leur valeur est
// l'information elle-même. Toute clé d'attribut absente est posée à ''.
// ============================================================
function coercePercentStored(v) {
  if (v === undefined || v === null || String(v).trim() === '') return '';
  const n = parseFloat(String(v).replace('%', '').replace(',', '.'));
  if (isNaN(n)) return '';
  const unit = Math.abs(n) > 1 ? n / 100 : n;
  return String(parseFloat(Math.max(0, Math.min(1, unit)).toFixed(6)));
}

function normalizeProducts() {
  let corriges = 0;
  products.forEach(p => {
    if (!p.fields) p.fields = {};
    let corrige = false;
    attributes.forEach(a => {
      if (!attrStoresInFields(a)) {
        if (a.code in p.fields) { delete p.fields[a.code]; corrige = true; }
        return;
      }
      if (a.formula && !isEventFormula(a.formula) && !formulaKeepsStoredValue(a)) {
        if (a.code in p.fields) { delete p.fields[a.code]; corrige = true; }
      } else if (!(a.code in p.fields)) {
        p.fields[a.code] = '';
        corrige = true;
      } else if (a.displayFormat === 'percent' && p.fields[a.code] !== '') {
        const c = coercePercentStored(p.fields[a.code]);
        if (String(p.fields[a.code]) !== c) { p.fields[a.code] = c; corrige = true; }
      }
    });
    if (corrige) corriges++;
  });
  return corriges;
}

// ============================================================
// MASQUE DE SAISIE — syntaxe Access
// A = lettre obligatoire
// 9 = chiffre obligatoire
// * = alphanumérique obligatoire
// Tout autre caractère = littéral fixe
// ============================================================
function applyInputMask(el, mask) {
  if (!mask) return;
  el.addEventListener('input', function() {
    const raw = el.value.replace(/[^a-zA-Z0-9]/g, '');
    let result = '';
    let ri = 0;
    for (let mi = 0; mi < mask.length && ri < raw.length; mi++) {
      const m = mask[mi];
      const c = raw[ri];
      if (m === 'A') {
        if (/[a-zA-Z]/.test(c)) { result += c.toUpperCase(); ri++; }
        else { ri++; mi--; }
      } else if (m === '9') {
        if (/[0-9]/.test(c)) { result += c; ri++; }
        else { ri++; mi--; }
      } else if (m === '*') {
        result += c; ri++;
      } else {
        result += m;
        if (c === m) ri++;
      }
    }
    el.value = result;
  });
}

function validateMask(value, mask) {
  if (!mask) return true;
  if (value.length !== mask.length) return false;
  for (let i = 0; i < mask.length; i++) {
    const m = mask[i];
    const c = value[i];
    if (m === 'A' && !/[a-zA-Z]/.test(c)) return false;
    if (m === '9' && !/[0-9]/.test(c)) return false;
    if (m !== 'A' && m !== '9' && m !== '*' && c !== m) return false;
  }
  return true;
}

// ============================================================
// CATEGORIES
// ============================================================
let categories = [
  { id:1, name:'Montures',    code:'monture',    color:'#4fc3f7', groupIds:[1,2,3,4,14,5,6,13] },
  { id:2, name:'Lentilles',   code:'lentille',   color:'#66bb6a', groupIds:[1,2,7,14,16,6] },
  { id:3, name:'Accessoires', code:'accessoire', color:'#ffa726', groupIds:[1,2,11,3,14,15,6] },
  { id:4, name:'PEL',         code:'pel',        color:'#ef5350', groupIds:[1,2,12,14,16,6]    },
];

// ============================================================
// ROLES & COMPTES
// ============================================================
const ADMIN_MODULES = [
  { key: 'mod_categories', label: 'Categories'              },
  { key: 'mod_groups',     label: "Groupes d'attributs"     },
  { key: 'mod_attributes', label: 'Attributs'               },
  { key: 'mod_synthese',   label: 'Vue Synthèse'            },
  { key: 'mod_conditions', label: 'Référentiels' },
  { key: 'mod_roles',      label: 'Utilisateurs & groupes'  },
  { key: 'mod_prefs',      label: 'Preferences'             },
  { key: 'mod_alerts',     label: 'Alertes'                 },
  { key: 'mod_trames',     label: 'Trames d’import / export' },
  { key: 'mod_calc',       label: 'Champs calculés'         },
  { key: 'mod_workflow',   label: 'Workflow'                },
];

const NAV_MENUS = [
  { key: 'menu_dashboard', nav: 'dashboard', page: 'dashboard', label: 'Tableau de bord' },
  { key: 'menu_products',  nav: 'products',  page: 'products',  label: 'Produits' },
  { key: 'menu_imports',   nav: 'imports',   page: 'imports',   label: 'Imports' },
  { key: 'menu_exports',   nav: 'exports',   page: 'exports',   label: 'Exports' },
  { key: 'menu_admin',     nav: 'admin',     page: 'admin',     label: 'Administration' },
];

function permFull() { return { r: true,  w: true,  d: true  }; }
function permRead() { return { r: true,  w: false, d: false }; }
function permNone() { return { r: false, w: false, d: false }; }

function defaultPermsForRole(roleId) {
  const perms = {};
  categories.forEach(c => {
    const montures = c.id === 1;
    if (roleId === 1) perms['cat_' + c.id] = permFull();
    else if (roleId === 2) perms['cat_' + c.id] = montures ? permFull() : permNone();
    else if (roleId === 3) perms['cat_' + c.id] = permRead();
    else if (roleId === 4) perms['cat_' + c.id] = montures ? permRead() : permNone();
    else perms['cat_' + c.id] = permNone();
  });
  ADMIN_MODULES.forEach(m => {
    perms[m.key] = roleId === 1 ? permFull() : permNone();
  });
  NAV_MENUS.forEach(m => {
    const isAdminMenu = m.key === 'menu_admin';
    const isImport    = m.key === 'menu_imports';
    if (roleId === 1) perms[m.key] = permFull();
    else if (roleId === 2) perms[m.key] = isAdminMenu ? permNone() : permRead();
    else if (roleId === 3 || roleId === 4) {
      perms[m.key] = (isAdminMenu || isImport) ? permNone() : permRead();
    } else {
      perms[m.key] = permNone();
    }
  });
  return perms;
}

// Une nouvelle categorie n'entre dans aucun groupe d'affectation :
// l'administrateur l'ajoute aux groupes qui doivent la voir.
function grantPermsForNewCategory(cat) {}

// ============================================================
// DROITS : niveau donne par le groupe Okta, visibilite par le groupe
// d'affectation gere dans l'application. Sans groupe : voit tout.
// ============================================================
const ACCESS_LEVELS = [
  { key:'admin',   name:'Administrateur', okta:'OctoPIM_Administrateur',
    desc:'Tous les droits, partout. Seul à gérer les utilisateurs, les groupes et les niveaux de droits.' },
  { key:'contrib', name:'Contributeur',   okta:'OctoPIM_Contributeur',
    desc:'Administrateur local : travaille sur les produits et règle les modules d’administration ouverts à son groupe.' },
  { key:'user',    name:'Utilisateur',    okta:'OctoPIM_Utilisateur',
    desc:'Travaille sur les produits des catégories visibles pour son groupe.' },
  { key:'read',    name:'Consultation',   okta:'OctoPIM_Consultation',
    desc:'Consulte les produits des catégories visibles pour son groupe.' },
];

// Ce que chaque niveau a le droit de faire. Okta dit seulement QUI a quel
// niveau ; le contenu du niveau se règle ici (Administration > Utilisateurs
// & groupes > Niveaux de droits). L'Administrateur a toujours tout.
const LEVEL_RIGHT_DEFS = [
  { key:'prod_r',     label:'Consulter les produits' },
  { key:'prod_w',     label:'Créer et modifier des produits' },
  { key:'prod_d',     label:'Supprimer des produits' },
  { key:'imports',    label:'Importer des fichiers' },
  { key:'exports',    label:'Exporter' },
  { key:'admin_mods', label:'Modifier les modules d’administration ouverts à son groupe' },
];
let levelRights = {
  contrib: { prod_r:true, prod_w:true,  prod_d:true,  imports:true,  exports:true, admin_mods:true  },
  user:    { prod_r:true, prod_w:true,  prod_d:false, imports:true,  exports:true, admin_mods:false },
  read:    { prod_r:true, prod_w:false, prod_d:false, imports:false, exports:true, admin_mods:false },
};
function levelCan(levelKey, right) {
  if (levelKey === 'admin') return true;
  return !!(levelRights[levelKey] || {})[right];
}

let affectGroups = [
  { id:1, name:'Achats montures', catIds:[1],
    menuKeys:['menu_dashboard','menu_products','menu_imports','menu_exports','menu_admin'],
    modKeys:['mod_conditions','mod_calc','mod_alerts'] },
  { id:3, name:'Contacto', catIds:[2,4],
    menuKeys:['menu_dashboard','menu_products','menu_imports','menu_exports'],
    modKeys:[] },
  { id:2, name:'Référencement', catIds:[1,2,3,4],
    menuKeys:['menu_dashboard','menu_products','menu_imports','menu_exports','menu_admin'],
    modKeys:['mod_categories','mod_groups','mod_attributes','mod_synthese','mod_workflow','mod_trames'] },
];
let nextAffectGroupId = 4;

let users = [
  { id:1, name:'J. Doe',     initials:'JD', levelKey:'admin',   groupId:null, email:'j.doe@exemple.fr', lastLogin:'09/11/2026 08:42', color:'#1565c0' },
  { id:2, name:'A. Martin',  initials:'AM', levelKey:'contrib', groupId:1,    email:'a.martin@exemple.fr', lastLogin:'08/11/2026 17:05', color:'#2e7d32' },
  { id:3, name:'C. Leroy',   initials:'CL', levelKey:'read',    groupId:null, email:'c.leroy@exemple.fr', lastLogin:'30/10/2026 10:12', color:'#6a1b9a' },
  { id:4, name:'U. Bernard', initials:'UB', levelKey:'user',    groupId:1,    email:'u.bernard@exemple.fr', lastLogin:'09/11/2026 09:30', color:'#e65100' },
  { id:5, name:'L. Petit',   initials:'LP', levelKey:'contrib', groupId:2,    email:'l.petit@exemple.fr', lastLogin:'05/11/2026 14:48', color:'#00838f' },
  { id:7, name:'S. Moreau',  initials:'SM', levelKey:'user',    groupId:3,    email:'s.moreau@exemple.fr', lastLogin:'07/11/2026 11:20', color:'#5d4037' },
  { id:6, name:'M. Roux',    initials:'MR', levelKey:'user',    groupId:null, email:'m.roux@exemple.fr', lastLogin:'—', color:'#ad1457' },
];

function accessLevel(key) {
  return ACCESS_LEVELS.find(l => l.key === key) || ACCESS_LEVELS[ACCESS_LEVELS.length - 1];
}

function affectGroupOf(u) {
  return u && u.groupId ? (affectGroups.find(g => g.id === u.groupId) || null) : null;
}

// Droits effectifs : le niveau dit ce qu'on peut faire, le groupe ce qu'on voit
function effectivePerms(u) {
  const perms = {};
  if (!u) return perms;
  const lvl = u.levelKey;
  const g = affectGroupOf(u);
  categories.forEach(c => {
    const seen = lvl === 'admin' || !g || g.catIds.includes(c.id);
    const r = seen && levelCan(lvl, 'prod_r');
    perms['cat_' + c.id] = { r, w: r && levelCan(lvl, 'prod_w'), d: r && levelCan(lvl, 'prod_d') };
  });
  ADMIN_MODULES.forEach(m => {
    const seen = lvl === 'admin'
      || (m.key !== 'mod_roles' && levelCan(lvl, 'admin_mods') && (!g || g.modKeys.includes(m.key)));
    perms[m.key] = seen ? permFull() : permNone();
  });
  NAV_MENUS.forEach(m => {
    let seen = lvl === 'admin' || !g || g.menuKeys.includes(m.key);
    if (m.key === 'menu_admin') seen = seen && ADMIN_MODULES.some(x => perms[x.key].r);
    if (m.key === 'menu_imports') seen = seen && levelCan(lvl, 'imports');
    if (m.key === 'menu_exports') seen = seen && levelCan(lvl, 'exports');
    perms[m.key] = seen ? permRead() : permNone();
  });
  return perms;
}

let currentUserId = 1;
let sessionLoggedIn = true;

// ============================================================
// PRODUITS
// ============================================================
let products = [
  { id:1,  cat:'Montures',    createdAt:'26/02/2025', maj:'04/07/2025 14:32', visualSrc:null, visuals:0,
    history:[
      { ts:'04/07/2025 14:32', user:'J. Doe', field:'pa interne',       old:'40',        new:'45'         },
      { ts:'15/03/2025 09:10', user:'J. Doe', field:'Mise en ligne', old:'',         new:'15/03/2025' },
    ], pendingChanges:[],
    fields:{ sap:'M908642300001', ean:'02000000079688', nom:'Monture Vogue VO4279S', miseEnLigne:'15/03/2025',
             marque:'Vogue', fournisseur_code:'R90344', ref_monture:'VO4279S', couleur:'Noir',
             optique_solaire:'Optique', matiere:'Acetate', cerclage:'Cercle', forme:'Rectangulaire',
             largeur_verres:'54', code_douanier:'9003190000', rfa:'0.02', prix_catalogue_monture:'168',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Inactif', date_maj_statut:'15/03/2025' } },
  { id:2,  cat:'Lentilles',   createdAt:'28/02/2025', maj:'02/07/2025 09:15', visualSrc:null, visuals:0,
    history:[
      { ts:'02/07/2025 09:15', user:'J. Doe', field:'Prix de vente', old:'30', new:'35' },
    ], pendingChanges:[],
    fields:{ pa_opticien_lentille_pel:'17.5', pvmc_fixe:'35', sap:'M900048700001', ean:'02000000167910', nom:'Lentille Aosept Plus', miseEnLigne:'01/03/2025',
             marque:'Alcon', laboratoire:'Alcon', nb_lentilles:'90', type_lentille:'Souple',
             type_vision:'Sphérique', renouvellement:'Journalier', materiau_lentille:'Silicone Hydrogel',
             type_usage:'Correctrices', defauts_visuels:'Hypermétropie / Myopie',
             hydrophilie:'38', filtre_uv:'Oui', sensibilite_o2:'140', teinte_manip:'Oui',
             
             reassort_sap:'Activé', active_o:'Actif', active_l:'Actif', date_maj_statut:'01/03/2025' } },
  { id:3, cat:'Montures',    createdAt:'01/03/2025', maj:'01/07/2025 11:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'M906452900001', ean:'02000000244714', nom:'Solaire Ray-Ban RB3025',
             marque:'Ray-Ban', fournisseur_code:'R90344', ref_monture:'RB3025', couleur:'Or',
             optique_solaire:'Solaire', matiere:'Métal', cerclage:'Cercle', forme:'Aviateur',
             largeur_verres:'58',
             code_douanier:'9004100000', rfa:'0.02',
             reassort_sap:'Activé', active_o:'Écoulement de stock', active_l:'Inactif', date_maj_statut:'12/05/2025' } },
  { id:4,  cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D011280', ean:'2000000323622', nom:'ETUI BANDOULIERE BEIGE',
             designation_magasin:'ETUI BANDOULIERE BEIGE', type_produit_acc:'Etui', couleur:'Beige', matiere_acc:'Matière teddy bear 100 % Polyester', dimensions_acc:'195 x 120 mm',
             conditionnement_origine:'1', annee_lancement:'2025', fournisseur_code:'R90936',
             pa_unitaire_accessoire:'2.48', pa_lot_accessoire:'2.5', prix_opticien_lot_accessoire:'3.56',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Actif' } },
  { id:5,  cat:'Montures',    createdAt:'02/04/2025', maj:'03/07/2025 16:20', visualSrc:null, visuals:1,
    history:[
      { ts:'03/07/2025 16:20', user:'J. Doe', field:'Taille',        old:'',          new:'M'          },
      { ts:'10/04/2025 08:00', user:'J. Doe', field:'Mise en ligne', old:'',          new:'10/04/2025' },
    ], pendingChanges:[],
    fields:{ sap:'M908458500001', ean:'02000000401683', nom:'Monture Oakley OX8046', miseEnLigne:'10/04/2025',
             marque:'Oakley', fournisseur_code:'R90344', ref_monture:'OX8046', couleur:'Gris',
             optique_solaire:'Optique', matiere:'Métal', cerclage:'Semi-cercle', forme:'Rectangulaire',
             code_douanier:'9003190000', cible:'Homme', largeur_verres:'50', rfa:'0.02',
             prix_catalogue_monture:'259', reassort_sap:'Activé', active_o:'Actif', active_l:'Actif', date_maj_statut:'10/04/2025' } },
  { id:6,  cat:'Montures',    createdAt:'26/02/2025', maj:'28/06/2025 10:10', visualSrc:null, visuals:0,
    history:[
      { ts:'28/06/2025 10:10', user:'J. Doe', field:'Couleur', old:'Bleu', new:'Rose' },
    ], pendingChanges:[],
    fields:{ sap:'M900037000001', ean:'02000000478481', nom:'Monture Vogue VO3987', miseEnLigne:'05/03/2025',
             marque:'Vogue', fournisseur_code:'R90344', ref_monture:'VO3987', couleur:'Rose',
             optique_solaire:'Optique', matiere:'Acetate', cerclage:'Cercle', forme:'Papillon',
             largeur_verres:'45',
             code_douanier:'9003190000', rfa:'0', prix_catalogue_monture:'170',
             reassort_sap:'Activé', active_o:'Inactif', active_l:'Inactif', date_maj_statut:'05/03/2025' } },
  { id:7,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ pa_opticien_lentille_pel:'6.2', pvmc_fixe:'12.9', sap:'PEL001', ean:'', nom:'Aosept Plus 360ml', miseEnLigne:'',
             code_produit:'PEL001', laboratoire:'Alcon', marque:'Aosept Plus',
             conditionnement:'360 ml', type_pel:'Produits d’entretien', type_solution:'Oxydant',
             reassort_sap:'Désactivé', active_o:'Inactif', active_l:'Inactif', date_maj_statut:'25/08/2026' } },
  { id:8,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ pa_opticien_lentille_pel:'6.8', pvmc_fixe:'13.9', sap:'PEL002', ean:'', nom:'Aosept Plus HydraGlyde 360ml', miseEnLigne:'15/12/2026', code_produit:'PEL002', laboratoire:'Alcon', marque:'Aosept Plus', conditionnement:'360 ml', type_pel:'Produits d’entretien', type_solution:'Oxydant', reassort_sap:'Activé', active_o:'En cours', active_l:'Inactif', date_maj_statut:'25/08/2026' } },
  { id:9,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ pa_opticien_lentille_pel:'5.4', pvmc_fixe:'11.5', sap:'PEL003', ean:'', nom:'Optifree Puremoist 300ml', miseEnLigne:'', code_produit:'PEL003', laboratoire:'Alcon', marque:'Opti-Free', conditionnement:'300 ml', reassort_sap:'Activé', active_o:'Inactif', active_l:'Inactif', date_maj_statut:'25/08/2026' } },
  { id:10, cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL004', ean:'', nom:'Biotrue 300ml', miseEnLigne:'', code_produit:'PEL004', laboratoire:'Bausch + Lomb', marque:'Biotrue', conditionnement:'300 ml', type_pel:'Produits d’entretien', type_solution:'Multi-fonction', reassort_sap:'Activé', active_o:'Inactif', active_l:'Inactif', date_maj_statut:'25/08/2026' } },
  { id:11, cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL005', ean:'', nom:'Renu MPS 360ml', miseEnLigne:'', code_produit:'PEL005', laboratoire:'Bausch + Lomb', marque:'Renu', conditionnement:'360 ml', type_pel:'Produits d’entretien', reassort_sap:'Activé', active_o:'Inactif', active_l:'Inactif', date_maj_statut:'25/08/2026' } },

  { id:12, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90382600001", ean:"200000562067", nom:"Esprit - 33513 - Ecaille", marque:"Esprit", fournisseur_code:"R90159", cerclage:"Cercle", ref_monture:"33513", code_couleur:"545", couleur:"Ecaille", largeur_verres:"48", hauteur_verres:"44", taille_nez:"21", largeur_face:"140", taille_branches:"140", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rondes/ovales/pantos", style:"Classique", pays_origine:"Chine", cible:"Femme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031100", matiere:"Plastique", profil_caractere:"PFL0020 : Femme", groupe_marchandise:"GM0040     Mont.Opt.Pl.Cerclées", prix_catalogue_monture:"59", rfa:"0.03" } },
  { id:13, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90538400001", ean:"200000636122", nom:"Saint Laurent - SL753 OPT - Noir", marque:"Saint Laurent", fournisseur_code:"R90825", cerclage:"Cercle", ref_monture:"SL753 OPT", code_couleur:"001", couleur:"Noir", largeur_verres:"50", hauteur_verres:"39.899", taille_nez:"20", largeur_face:"145", taille_branches:"145", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rondes/ovales/pantos", style:"Classique", pays_origine:"Japon", cible:"Mixte", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031100", matiere:"Plastique", profil_caractere:"PFL0030 : Mixte", groupe_marchandise:"GM0040     Mont.Opt.Pl.Cerclées", prix_catalogue_monture:"121", rfa:"0" } },
  { id:14, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90535500001", ean:"200000722614", nom:"Saint Laurent - SLM146 - Noir", marque:"Saint Laurent", fournisseur_code:"R90825", cerclage:"Cercle", categorie_verre:"Catégorie 3", ref_monture:"SLM146", code_couleur:"001", couleur:"Noir", largeur_verres:"54", hauteur_verres:"46.2", taille_nez:"19", largeur_face:"145", taille_branches:"145", branches_antiderapantes:"Non", teinte_verres:"Gris", pola:"Non", miroir:"Non", degrade:"Non", adaptable_vue:"Oui", forme:"carrées", style:"Fashion", pays_origine:"Italie", cible:"Femme", optique_solaire:"Solaire", adaptable_progressifs:"Oui", code_douanier:"90041091", matiere:"Plastique", profil_caractere:"PFL0020 : Femme", groupe_marchandise:"GM0130     Mont Sol Pl.Cerclées", prix_catalogue_monture:"156", rfa:"0.02" } },
  { id:15, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10778700001", ean:"200000798884", nom:"MontBlanc - MB0279O - Gris", marque:"MontBlanc", fournisseur_code:"R90825", cerclage:"Sans cerclage", ref_monture:"MB0279O", code_couleur:"001", couleur:"Gris", largeur_verres:"54", hauteur_verres:"37.6", taille_nez:"20", largeur_face:"145", taille_branches:"145", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rectangles", style:"Classique", pays_origine:"Italie", cible:"Homme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031930", matiere:"Métal", profil_caractere:"PFL0010 : Homme", groupe_marchandise:"GM0030     Mont.Opt.Mé.Percées", prix_catalogue_monture:"134", rfa:"0.02" } },
  { id:16, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10943200001", ean:"200000871895", nom:"MontBlanc - MB0389O - Bleu", marque:"MontBlanc", fournisseur_code:"R90825", cerclage:"Cercle", ref_monture:"MB0389O", code_couleur:"009", couleur:"Bleu", largeur_verres:"52", hauteur_verres:"39.8", taille_nez:"22", largeur_face:"145", taille_branches:"145", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rectangles", style:"Classique", pays_origine:"Japon", cible:"Homme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031930", matiere:"Métal", profil_caractere:"PFL0010 : Homme", groupe_marchandise:"GM0010     Mont.Opt.Mé.Cerclée", prix_catalogue_monture:"97", rfa:"0.02" } },
  { id:17, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10627000001", ean:"200000955009", nom:"MontBlanc - MB0292O - Noir", marque:"MontBlanc", fournisseur_code:"R90825", cerclage:"Cercle", ref_monture:"MB0292O", code_couleur:"001", couleur:"Noir", largeur_verres:"51", hauteur_verres:"49.2", taille_nez:"20", largeur_face:"150", taille_branches:"150", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rectangles", style:"Classique", pays_origine:"Italie", cible:"Homme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031100", matiere:"Plastique", profil_caractere:"PFL0010 : Homme", groupe_marchandise:"GM0040     Mont.Opt.Pl.Cerclées", prix_catalogue_monture:"92", rfa:"0" } },
  { id:18, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10586000001", ean:"200001034260", nom:"MontBlanc - MB0305O - Noir", marque:"MontBlanc", fournisseur_code:"R90825", cerclage:"Cercle", ref_monture:"MB0305O", code_couleur:"001", couleur:"Noir", largeur_verres:"51", hauteur_verres:"45", taille_nez:"21", largeur_face:"145", taille_branches:"145", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rectangles", style:"Classique", pays_origine:"Japon", cible:"Homme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031100", matiere:"Plastique", profil_caractere:"PFL0010 : Homme", groupe_marchandise:"GM0040     Mont.Opt.Pl.Cerclées", prix_catalogue_monture:"135", rfa:"0.02" } },
  { id:19, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10214500001", ean:"200001112203", nom:"MontBlanc - MB0422O - Ecaille", marque:"MontBlanc", fournisseur_code:"R90825", cerclage:"Cercle", ref_monture:"MB0422O", code_couleur:"008", couleur:"Ecaille", largeur_verres:"53", hauteur_verres:"45.1", taille_nez:"21", largeur_face:"150", taille_branches:"150", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rectangles", style:"Classique", pays_origine:"Italie", cible:"Homme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031100", matiere:"Plastique", profil_caractere:"PFL0010 : Homme", groupe_marchandise:"GM0040     Mont.Opt.Pl.Cerclées", prix_catalogue_monture:"93", rfa:"0.03" } },
  { id:20, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10842100001", ean:"200001193448", nom:"Saint Laurent - SL M112 - Ecaille", marque:"Saint Laurent", fournisseur_code:"R90825", cerclage:"Cercle", ref_monture:"SL M112", code_couleur:"002", couleur:"Ecaille", largeur_verres:"54", hauteur_verres:"45", taille_nez:"16", largeur_face:"145", taille_branches:"145", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_vue:"Oui", forme:"rondes/ovales/pantos", style:"Classique", pays_origine:"Italie", cible:"Femme", optique_solaire:"Optique", adaptable_progressifs:"Oui", code_douanier:"90031100", matiere:"Plastique", profil_caractere:"PFL0020 : Femme", groupe_marchandise:"GM0040     Mont.Opt.Pl.Cerclées", prix_catalogue_monture:"114", rfa:"0.02" } },
  { id:21, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10083900001", ean:"02000001275492", nom:"Julbo - J567 FREQUENCY - Vert", marque:"Julbo", fournisseur_code:"R90270", cerclage:"Sans cerclage", categorie_verre:"Catégorie 3", ref_monture:"J567 FREQUENCY", code_couleur:"1116", couleur:"Vert", largeur_verres:"130", taille_nez:"13", largeur_face:"140", taille_branches:"123", branches_flex:"Non", branches_antiderapantes:"Oui", teinte_verres:"Vert", pola:"Non", miroir:"Oui", degrade:"Non", adaptable_vue:"Oui", forme:"Masque", style:"Sport", pays_origine:"Roumanie", cible:"Mixte", optique_solaire:"Solaire", adaptable_progressifs:"Non", code_douanier:"90041091", matiere:"Plastique", profil_caractere:"PFL0030 : Mixte", groupe_marchandise:"GM0150     Mont.Sol.Pl.Percées", prix_catalogue_monture:"47", rfa:"0.05" } },
  { id:22, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10490600001", ean:"02000001354382", nom:"Julbo - J590 INTENSITY - Bleu", marque:"Julbo", fournisseur_code:"R90270", cerclage:"Sans cerclage", categorie_verre:"Catégorie 3", ref_monture:"J590 INTENSITY", code_couleur:"1512", couleur:"Bleu", largeur_verres:"136", taille_nez:"14", largeur_face:"136", taille_branches:"130", branches_flex:"Non", branches_antiderapantes:"Oui", teinte_verres:"Rose", pola:"Non", miroir:"Oui", degrade:"Non", adaptable_vue:"Oui", forme:"Masque", style:"Sport", pays_origine:"Roumanie", cible:"Mixte", optique_solaire:"Solaire", adaptable_progressifs:"Non", code_douanier:"90041091", matiere:"Plastique", profil_caractere:"PFL0030 : Mixte", groupe_marchandise:"GM0150     Mont.Sol.Pl.Percées", prix_catalogue_monture:"76", rfa:"0" } },
  { id:23, cat:'Montures', createdAt:'24/09/2026', maj:'24/09/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10688200001", ean:"02000001430804", nom:"Julbo - J586 WARD - Vert", marque:"Julbo", fournisseur_code:"R90270", cerclage:"Cercle", categorie_verre:"Catégorie 3", ref_monture:"J586 WARD", code_couleur:"1116", couleur:"Vert", largeur_verres:"56", hauteur_verres:"48", taille_nez:"17", largeur_face:"137", taille_branches:"137", branches_flex:"Non", branches_antiderapantes:"Oui", teinte_verres:"Gris", pola:"Non", miroir:"Oui", degrade:"Non", adaptable_vue:"Oui", forme:"pilotes/aviator", style:"Sport", pays_origine:"Roumanie", cible:"Mixte", optique_solaire:"Solaire", adaptable_progressifs:"Oui", code_douanier:"90041091", matiere:"Plastique", profil_caractere:"PFL0030 : Mixte", groupe_marchandise:"GM0130     Mont Sol Pl.Cerclées", prix_catalogue_monture:"32", rfa:"0.05" } },
  { id:24, cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D018112', ean:'2000001513019', nom:'CHAINETTE CORDAGE ROND METAL',
             designation_magasin:'CHAINETTE CORDAGE ROND METAL X2', type_produit_acc:'Chainette', couleur:'Métal doré', matiere_acc:'Métal', dimensions_acc:'65cm',
             conditionnement_origine:'2', annee_lancement:'2025', fournisseur_code:'R90899',
             pa_unitaire_accessoire:'3.3', pa_lot_accessoire:'7.36', prix_opticien_lot_accessoire:'7.85',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Actif' } },
  { id:25, cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D016584', ean:'2000001589234', nom:'CLIP SOLAIRE POLA G15 + ETUI',
             designation_magasin:'CLIP SOLAIRE POLA G15 + ETUI', type_produit_acc:'Clips', couleur:'G15', dimensions_acc:'Avec étui 15,8*6,46*2,03cm',
             conditionnement_origine:'1', annee_lancement:'2025', fournisseur_code:'R90899',
             pa_unitaire_accessoire:'2.92', pa_lot_accessoire:'2.32', prix_opticien_lot_accessoire:'4.88',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Inactif' } },
  { id:26, cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D014093', ean:'2000001672686', nom:'CORDON SPORT NOIR',
             designation_magasin:'CORDON SPORT NOIR X3', type_produit_acc:'Cordon', couleur:'Noir', matiere_acc:'Plastique', dimensions_acc:'60cm',
             conditionnement_origine:'3', annee_lancement:'2025', fournisseur_code:'R90899',
             pa_unitaire_accessoire:'1.44', pa_lot_accessoire:'3.19', prix_opticien_lot_accessoire:'5.06',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Actif' } },
  { id:27, cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D012448', ean:'2000001743188', nom:'Kit entretien Premium Beige Revoir',
             designation_magasin:'Kit entretien Premium Beige Revoir', type_produit_acc:"Produits d'entretien", couleur:'Beige', conditionnement_origine:'1', annee_lancement:'2025', fournisseur_code:'R90973',
             pa_unitaire_accessoire:'5.1', pa_lot_accessoire:'4.61', prix_opticien_lot_accessoire:'7.04',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Inactif' } },
  { id:28, cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D014526', ean:'2000001829707', nom:'BOB CHARLIE CHILL',
             designation_magasin:'BOB CHARLIE CHILL', type_produit_acc:'Charlie Chill', conditionnement_origine:'1', annee_lancement:'2025',
             pa_unitaire_accessoire:'3.85', pa_lot_accessoire:'5.06', prix_opticien_lot_accessoire:'4.97',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Actif' } },
  { id:29, cat:'Accessoires', createdAt:'01/10/2026', maj:'01/10/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'D013097', ean:'2000001903382', nom:'SAC RAYURES BLEUES O2',
             designation_magasin:'SAC RAYURES BLEUES O2', type_produit_acc:'Textile', conditionnement_origine:'1', annee_lancement:'2025',
             pa_unitaire_accessoire:'5.15', pa_lot_accessoire:'5.13', prix_opticien_lot_accessoire:'4.82',
             reassort_sap:'Activé', active_o:'Actif', active_l:'Inactif' } },
  // Montures ajoutées pour la démo (fichier IWI Seaport + lignes de commande SAP), complétude variable
  { id:30, cat:'Montures', createdAt:'19/08/2026', maj:'05/09/2026 11:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90658200001", ean:"2000001982787", nom:"Faconnable - AREGNO06 - E009", marque:"Faconnable", fournisseur_code:"R90677", ref_monture:"AREGNO06", code_couleur:"E009", couleur:"E009", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"54", hauteur_verres:"40", taille_nez:"20", taille_branches:"148", largeur_face:"140", code_douanier:"90041091", prix_catalogue_monture:"61", rfa:"0.02", style:"Classique", pays_origine:"Italie", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Vert", categorie_verre:"Catégorie 3", pola:"Non", miroir:"Non", degrade:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"21/09/2026", date_maj_statut:"21/09/2026" } },
  { id:31, cat:'Montures', createdAt:'03/09/2026', maj:'04/09/2026 16:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90802500001", ean:"2000002059323", nom:"Faconnable - EZE01 - E068", marque:"Faconnable", fournisseur_code:"R90677", ref_monture:"EZE01", code_couleur:"E068", couleur:"E068", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"57", hauteur_verres:"43", taille_nez:"19", taille_branches:"150", largeur_face:"145", code_douanier:"90041091", prix_catalogue_monture:"71", rfa:"0.01", style:"Sport", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:32, cat:'Montures', createdAt:'05/08/2026', maj:'15/08/2026 14:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90822000001", ean:"2000002138958", nom:"Faconnable - FA104 - GUBR", marque:"Faconnable", fournisseur_code:"R90677", ref_monture:"FA104", code_couleur:"GUBR", couleur:"GUBR", optique_solaire:"Optique", cerclage:"Semi-cercle", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"57", hauteur_verres:"41", taille_nez:"19", taille_branches:"150", largeur_face:"145", code_douanier:"90031900", prix_catalogue_monture:"66", rfa:"0.05", style:"Fashion", pays_origine:"Chine", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:33, cat:'Montures', createdAt:'17/09/2026', maj:'11/10/2026 09:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90180500001", ean:"2000002223362", nom:"Faconnable - FA106T - CR67", marque:"Faconnable", fournisseur_code:"R90677", ref_monture:"FA106T", code_couleur:"CR67", couleur:"CR67", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"58", hauteur_verres:"43", taille_nez:"19", taille_branches:"153", largeur_face:"147", code_douanier:"90031100", prix_catalogue_monture:"69", rfa:"0", style:"Fashion", pays_origine:"Japon", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Inactif", active_l:"Écoulement de stock", miseEnLigne:"14/10/2026", date_maj_statut:"14/10/2026" } },
  { id:34, cat:'Montures', createdAt:'22/09/2026', maj:'10/10/2026 18:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90154300001", ean:"2000002296933", nom:"Faconnable - FR048 - MA41", marque:"Faconnable", fournisseur_code:"R90677", ref_monture:"FR048", code_couleur:"MA41", couleur:"MA41", optique_solaire:"Optique", cerclage:"Semi-cercle", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"51", hauteur_verres:"39", taille_nez:"19", taille_branches:"140", largeur_face:"133", code_douanier:"90031900", prix_catalogue_monture:"60", rfa:"0", style:"Fashion", pays_origine:"Chine", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"17/10/2026", date_maj_statut:"17/10/2026" } },
  { id:35, cat:'Montures', createdAt:'03/09/2026', maj:'27/09/2026 12:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90829900001", ean:"2000002376415", nom:"Faconnable - NV323T - NOGU", marque:"Faconnable", fournisseur_code:"R90677", ref_monture:"NV323T", code_couleur:"NOGU", couleur:"NOGU", optique_solaire:"Optique", largeur_verres:"48", taille_nez:"22", rfa:"0.01" } },
  { id:36, cat:'Montures', createdAt:'20/09/2026', maj:'12/10/2026 11:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90321500001", ean:"2000002460291", nom:"Carven - CC1109 - OL68", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1109", code_couleur:"OL68", couleur:"OL68", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"47", taille_nez:"17", taille_branches:"142", largeur_face:"135", code_douanier:"90031100", prix_catalogue_monture:"85", rfa:"0.05", style:"Classique", pays_origine:"Chine", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"08/11/2026", date_maj_statut:"06/11/2026" } },
  { id:37, cat:'Montures', createdAt:'22/09/2026', maj:'01/11/2026 16:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90711600001", ean:"2000002543521", nom:"Carven - CC1116 - E100", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1116", code_couleur:"E100", couleur:"E100", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"44", taille_nez:"19", taille_branches:"143", largeur_face:"135", code_douanier:"90031100", prix_catalogue_monture:"87", rfa:"0", style:"Fashion", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"En cours", active_l:"En cours", miseEnLigne:"29/10/2026", date_maj_statut:"29/10/2026" } },
  { id:38, cat:'Montures', createdAt:'13/08/2026', maj:'18/09/2026 13:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90494100001", ean:"2000002617905", nom:"Carven - CC1117 - E939", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1117", code_couleur:"E939", couleur:"E939", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"44", taille_nez:"21", taille_branches:"143", largeur_face:"137", code_douanier:"90031100", prix_catalogue_monture:"82", rfa:"0", style:"Sport", pays_origine:"France", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"17/09/2026", date_maj_statut:"17/09/2026" } },
  { id:39, cat:'Montures', createdAt:'15/10/2026', maj:'06/11/2026 14:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90577100001", ean:"2000002698238", nom:"Carven - CC1118 - E933", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1118", code_couleur:"E933", couleur:"E933", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"46", taille_nez:"17", taille_branches:"143", largeur_face:"135", code_douanier:"90031100", prix_catalogue_monture:"87", rfa:"0", style:"Sport", pays_origine:"Japon", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:40, cat:'Montures', createdAt:'22/08/2026', maj:'27/08/2026 08:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90883500001", ean:"2000002772761", nom:"Carven - CC1120 - GROR", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1120", code_couleur:"GROR", couleur:"GROR", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"51", hauteur_verres:"45", taille_nez:"20", taille_branches:"142", largeur_face:"134", code_douanier:"90031100", prix_catalogue_monture:"76", rfa:"0.01", style:"Classique", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:41, cat:'Montures', createdAt:'23/09/2026', maj:'22/10/2026 16:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90795100001", ean:"2000002854791", nom:"Carven - CC1121 - BROR", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1121", code_couleur:"BROR", couleur:"BROR", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"50", hauteur_verres:"45", taille_nez:"19", taille_branches:"142", largeur_face:"131", code_douanier:"90031100", prix_catalogue_monture:"101", rfa:"0.05", style:"Classique", pays_origine:"Italie", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"En cours", active_l:"Actif", miseEnLigne:"31/10/2026", date_maj_statut:"31/10/2026" } },
  { id:42, cat:'Montures', createdAt:'29/09/2026', maj:'29/09/2026 12:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90117400001", ean:"2000002938215", nom:"Carven - CC1122 - NOOR", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC1122", code_couleur:"NOOR", couleur:"NOOR", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"51", hauteur_verres:"34", taille_nez:"20", taille_branches:"142", largeur_face:"134", code_douanier:"90031100", prix_catalogue_monture:"101", rfa:"0.02", style:"Classique", pays_origine:"Italie", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"Actif", miseEnLigne:"28/10/2026", date_maj_statut:"28/10/2026" } },
  { id:43, cat:'Montures', createdAt:'21/09/2026', maj:'25/10/2026 16:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90432500001", ean:"2000003015821", nom:"Carven - CC4108S - BR69", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC4108S", code_couleur:"BR69", couleur:"BR69", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"58", hauteur_verres:"48", taille_nez:"16", taille_branches:"143", largeur_face:"144", code_douanier:"90041091", prix_catalogue_monture:"110", rfa:"0.05", style:"Fashion", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"13/11/2026" } },
  { id:44, cat:'Montures', createdAt:'13/09/2026', maj:'28/09/2026 17:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90688500001", ean:"2000003096604", nom:"Carven - CC4113S - GA69", marque:"Carven", fournisseur_code:"R90677", ref_monture:"CC4113S", code_couleur:"GA69", couleur:"GA69", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"51", hauteur_verres:"47", taille_nez:"21", taille_branches:"145", largeur_face:"135", code_douanier:"90041091", prix_catalogue_monture:"115", rfa:"0.02", style:"Classique", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Brun", categorie_verre:"Catégorie 3", pola:"Oui", miroir:"Non", degrade:"Non", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"Actif", miseEnLigne:"19/10/2026", date_maj_statut:"19/10/2026" } },
  { id:45, cat:'Montures', createdAt:'11/10/2026', maj:'06/11/2026 11:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90576500001", ean:"2000003173480", nom:"PAUL & JOE - AURORE07 - ECDO", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"AURORE07", code_couleur:"ECDO", couleur:"ECDO", optique_solaire:"Optique", largeur_verres:"53", taille_nez:"19", rfa:"0" } },
  { id:46, cat:'Montures', createdAt:'30/08/2026', maj:'24/09/2026 18:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90237300001", ean:"2000003256613", nom:"PAUL & JOE - AURORE08 - NOOR", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"AURORE08", code_couleur:"NOOR", couleur:"NOOR", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Métal", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"45", taille_nez:"19", taille_branches:"143", largeur_face:"135", code_douanier:"90031900", prix_catalogue_monture:"62", rfa:"0.03", style:"Sport", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"03/10/2026" } },
  { id:47, cat:'Montures', createdAt:'17/09/2026', maj:'22/10/2026 11:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90556900001", ean:"2000003330650", nom:"PAUL & JOE - CHERRY10 - NO61", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"CHERRY10", code_couleur:"NO61", couleur:"NO61", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"55", hauteur_verres:"46", taille_nez:"16", taille_branches:"143", largeur_face:"138", code_douanier:"90031100", prix_catalogue_monture:"79", rfa:"0.05", style:"Classique", pays_origine:"Italie", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"11/10/2026", date_maj_statut:"11/10/2026" } },
  { id:48, cat:'Montures', createdAt:'09/08/2026', maj:'13/08/2026 16:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90632700001", ean:"2000003411450", nom:"PAUL & JOE - CHERRY10 - RS68", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"CHERRY10", code_couleur:"RS68", couleur:"RS68", optique_solaire:"Optique", largeur_verres:"55", taille_nez:"16", rfa:"0.01" } },
  { id:49, cat:'Montures', createdAt:'09/09/2026', maj:'22/09/2026 16:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90926400001", ean:"2000003489266", nom:"PAUL & JOE - CHERRY11 - E068", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"CHERRY11", code_couleur:"E068", couleur:"E068", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"51", hauteur_verres:"39", taille_nez:"19", taille_branches:"143", largeur_face:"133", code_douanier:"90031100", prix_catalogue_monture:"77", rfa:"0.02", style:"Sport", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:50, cat:'Montures', createdAt:'29/08/2026', maj:'25/09/2026 13:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90515400001", ean:"2000003569085", nom:"PAUL & JOE - DONNA04 - E813", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"DONNA04", code_couleur:"E813", couleur:"E813", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"46", taille_nez:"17", taille_branches:"142", largeur_face:"133", code_douanier:"90031100", prix_catalogue_monture:"80", rfa:"0.03", style:"Sport", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"13/10/2026", date_maj_statut:"13/10/2026" } },
  { id:51, cat:'Montures', createdAt:'17/09/2026', maj:'23/09/2026 11:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90742800001", ean:"2000003642962", nom:"PAUL & JOE - GARY01 - E747", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"GARY01", code_couleur:"E747", couleur:"E747", optique_solaire:"Solaire", largeur_verres:"54", taille_nez:"20", rfa:"0.03" } },
  { id:52, cat:'Montures', createdAt:'29/08/2026', maj:'06/09/2026 14:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90435200001", ean:"2000003723498", nom:"PAUL & JOE - GARY03 - E068", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"GARY03", code_couleur:"E068", couleur:"E068", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"49", hauteur_verres:"38", taille_nez:"23", taille_branches:"149", largeur_face:"133", code_douanier:"90041091", prix_catalogue_monture:"81", rfa:"0.03", style:"Fashion", pays_origine:"France", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:53, cat:'Montures', createdAt:'14/08/2026', maj:'18/09/2026 09:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90814400001", ean:"2000003810314", nom:"PAUL & JOE - GINGER02 - NO61", marque:"PAUL & JOE", fournisseur_code:"R90677", ref_monture:"GINGER02", code_couleur:"NO61", couleur:"NO61", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"55", hauteur_verres:"47", taille_nez:"17", taille_branches:"143", largeur_face:"139", code_douanier:"90041091", prix_catalogue_monture:"85", rfa:"0.01", style:"Classique", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Gris", categorie_verre:"Catégorie 3", pola:"Non", miroir:"Non", degrade:"Non", reassort_sap:"Activé", active_o:"Actif", active_l:"En cours", miseEnLigne:"06/09/2026", date_maj_statut:"06/09/2026" } },
  { id:54, cat:'Montures', createdAt:'26/08/2026', maj:'19/09/2026 12:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90976600001", ean:"2000003883578", nom:"Little Paul & Joe - MANEKI07 - BR67", marque:"Little Paul & Joe", fournisseur_code:"R90677", ref_monture:"MANEKI07", code_couleur:"BR67", couleur:"BR67", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Enfant", profil_caractere:"PFL0040 : Junior", largeur_verres:"46", hauteur_verres:"41", taille_nez:"15", taille_branches:"132", largeur_face:"119", code_douanier:"90031100", prix_catalogue_monture:"56", rfa:"0.03", style:"Fashion", pays_origine:"France", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Inactif", active_l:"Actif", miseEnLigne:"27/09/2026", date_maj_statut:"27/09/2026" } },
  { id:55, cat:'Montures', createdAt:'11/09/2026', maj:'14/09/2026 17:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90085600001", ean:"2000003960877", nom:"Little Paul & Joe - MANEKI08 - E612", marque:"Little Paul & Joe", fournisseur_code:"R90677", ref_monture:"MANEKI08", code_couleur:"E612", couleur:"E612", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Enfant", profil_caractere:"PFL0040 : Junior", largeur_verres:"45", hauteur_verres:"35", taille_nez:"17", taille_branches:"132", largeur_face:"119", code_douanier:"90031100", prix_catalogue_monture:"52", rfa:"0.01", style:"Classique", pays_origine:"Japon", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Inactif", active_l:"Écoulement de stock", miseEnLigne:"03/11/2026", date_maj_statut:"03/11/2026" } },
  { id:56, cat:'Montures', createdAt:'25/08/2026', maj:'26/09/2026 09:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90517800001", ean:"2000004038962", nom:"Ba&sh - BA1106 - E339", marque:"Ba&sh", fournisseur_code:"R90677", ref_monture:"BA1106", code_couleur:"E339", couleur:"E339", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"50", hauteur_verres:"42", taille_nez:"18", taille_branches:"140", largeur_face:"130", code_douanier:"90031100", prix_catalogue_monture:"79", rfa:"0.01", style:"Classique", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"21/10/2026", date_maj_statut:"21/10/2026" } },
  { id:57, cat:'Montures', createdAt:'20/10/2026', maj:'25/10/2026 14:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90836500001", ean:"2000004118958", nom:"Ba&sh - BA1107 - E594", marque:"Ba&sh", fournisseur_code:"R90677", ref_monture:"BA1107", code_couleur:"E594", couleur:"E594", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"50", taille_nez:"19", taille_branches:"140", largeur_face:"137", code_douanier:"90031100", prix_catalogue_monture:"63", rfa:"0.01", style:"Fashion", pays_origine:"Japon", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"En cours", active_l:"Actif", miseEnLigne:"25/11/2026", date_maj_statut:"06/11/2026" } },
  { id:58, cat:'Montures', createdAt:'24/09/2026', maj:'13/10/2026 15:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90506200001", ean:"2000004201081", nom:"Ba&sh - BA1109 - E920", marque:"Ba&sh", fournisseur_code:"R90677", ref_monture:"BA1109", code_couleur:"E920", couleur:"E920", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"49", taille_nez:"17", taille_branches:"140", largeur_face:"135", code_douanier:"90031100", prix_catalogue_monture:"53", rfa:"0.05", style:"Classique", pays_origine:"Italie", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"17/11/2026", date_maj_statut:"06/11/2026" } },
  { id:59, cat:'Montures', createdAt:'01/09/2026', maj:'09/09/2026 13:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90048400001", ean:"2000004277206", nom:"Ba&sh - BA1111 - E416", marque:"Ba&sh", fournisseur_code:"R90677", ref_monture:"BA1111", code_couleur:"E416", couleur:"E416", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"47", taille_nez:"18", taille_branches:"143", largeur_face:"134", code_douanier:"90031100", prix_catalogue_monture:"69", rfa:"0", style:"Classique", pays_origine:"Japon", forme:"rectangles", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"04/11/2026" } },
  { id:60, cat:'Montures', createdAt:'12/09/2026', maj:'15/10/2026 08:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90259900001", ean:"2000004357177", nom:"Ba&sh - BA1112 - E100", marque:"Ba&sh", fournisseur_code:"R90677", ref_monture:"BA1112", code_couleur:"E100", couleur:"E100", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"49", hauteur_verres:"11", taille_nez:"20", taille_branches:"143", largeur_face:"130", code_douanier:"90031100", prix_catalogue_monture:"69", rfa:"0.05", style:"Fashion", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"18/10/2026" } },
  { id:61, cat:'Montures', createdAt:'11/12/2025', maj:'14/12/2025 09:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90677500001", ean:"2000004440112", nom:"Bolle - BS005 - 003S", marque:"Bolle", fournisseur_code:"R90122", ref_monture:"BS005", code_couleur:"003S", couleur:"003s", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"99", hauteur_verres:"39", taille_nez:"0", taille_branches:"145", largeur_face:"210", code_douanier:"90041091", prix_catalogue_monture:"109", style:"Fashion", pays_origine:"Italie", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Brun", categorie_verre:"Catégorie 3", pola:"Non", miroir:"Non", degrade:"Non", reassort_sap:"Activé", active_o:"Actif", active_l:"Inactif", miseEnLigne:"04/02/2026", date_maj_statut:"04/02/2026" } },
  { id:62, cat:'Montures', createdAt:'05/12/2025', maj:'14/12/2025 14:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90003100001", ean:"2000004522647", nom:"Bolle - BS139 - 004S", marque:"Bolle", fournisseur_code:"R90122", ref_monture:"BS139", code_couleur:"004S", couleur:"004s", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"59", hauteur_verres:"44", taille_nez:"21", taille_branches:"140", largeur_face:"153", code_douanier:"90041091", prix_catalogue_monture:"78", style:"Classique", pays_origine:"Japon", forme:"rectangles", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:63, cat:'Montures', createdAt:'04/11/2025', maj:'19/11/2025 10:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90450300001", ean:"2000004595634", nom:"Bolle - BS140 - 003", marque:"Bolle", fournisseur_code:"R90122", ref_monture:"BS140", code_couleur:"003", couleur:"003", optique_solaire:"Solaire", largeur_verres:"51", taille_nez:"21" } },
  { id:64, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 14:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10784900001", ean:"2000004672395", nom:"Julbo - J5581127 - Gris", marque:"Julbo", fournisseur_code:"R90270", ref_monture:"J5581127", code_couleur:"GRIS", couleur:"Gris", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"55", hauteur_verres:"47", taille_nez:"14", taille_branches:"145", largeur_face:"134", code_douanier:"90041091", prix_catalogue_monture:"71", style:"Sport", pays_origine:"Chine", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:65, cat:'Montures', createdAt:'22/01/2025', maj:'08/02/2025 13:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M10518300001", ean:"2000004761352", nom:"Julbo - J5019412 - Bleu", marque:"Julbo", fournisseur_code:"R90270", ref_monture:"J5019412", code_couleur:"BLEU", couleur:"Bleu", optique_solaire:"Solaire", largeur_verres:"58", taille_nez:"15" } },
  { id:66, cat:'Montures', createdAt:'06/05/2025', maj:'28/05/2025 13:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90801200001", ean:"2000004831068", nom:"Julbo - J533 LOOP M - Bleu", marque:"Julbo", fournisseur_code:"R90270", ref_monture:"J533 LOOP M", code_couleur:"BLEU", couleur:"Bleu", optique_solaire:"Solaire", cerclage:"Sans cerclage", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"41", hauteur_verres:"45", taille_nez:"14", taille_branches:"145", largeur_face:"104", code_douanier:"90041091", prix_catalogue_monture:"59", style:"Classique", pays_origine:"France", forme:"Papillon", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"07/06/2025" } },
  { id:67, cat:'Montures', createdAt:'14/06/2025', maj:'21/06/2025 12:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90537300001", ean:"2000004917447", nom:"Dolce&Gabbana - DG6177 - 501/8", marque:"Dolce&Gabbana", fournisseur_code:"R90344", ref_monture:"DG6177", code_couleur:"501/8", couleur:"501/8", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"46", hauteur_verres:"37", taille_nez:"0", taille_branches:"145", largeur_face:"104", code_douanier:"90031100", prix_catalogue_monture:"175", style:"Fashion", pays_origine:"France", forme:"rectangles", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"01/08/2025" } },
  { id:68, cat:'Montures', createdAt:'19/10/2025', maj:'01/11/2025 14:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90924100001", ean:"2000004998910", nom:"Versace - VE3320U - 5217", marque:"Versace", fournisseur_code:"R90344", ref_monture:"VE3320U", code_couleur:"5217", couleur:"5217", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"56", hauteur_verres:"40", taille_nez:"16", taille_branches:"150", largeur_face:"140", code_douanier:"90031100", prix_catalogue_monture:"106", style:"Fashion", pays_origine:"France", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Écoulement de stock", miseEnLigne:"08/12/2025", date_maj_statut:"08/12/2025" } },
  { id:69, cat:'Montures', createdAt:'22/09/2026', maj:'06/10/2026 11:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90968900001", ean:"2000005068881", nom:"Polo Ralph Lauren - PH4110 - 5413", marque:"Polo Ralph Lauren", fournisseur_code:"R90344", ref_monture:"PH4110", code_couleur:"5413", couleur:"5413", optique_solaire:"Optique", cerclage:"Semi-cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"50", hauteur_verres:"46", taille_nez:"21", taille_branches:"145", largeur_face:"129", code_douanier:"90031100", prix_catalogue_monture:"69", style:"Classique", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:70, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 09:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90821000001", ean:"2000005155053", nom:"Polo Ralph Lauren - PH2126 - 5504", marque:"Polo Ralph Lauren", fournisseur_code:"R90344", ref_monture:"PH2126", code_couleur:"5504", couleur:"5504", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"39", taille_nez:"16", taille_branches:"150", largeur_face:"133", code_douanier:"90031100", prix_catalogue_monture:"87", style:"Classique", pays_origine:"Chine", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Écoulement de stock", miseEnLigne:"11/12/2026", date_maj_statut:"06/11/2026" } },
  { id:71, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 14:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90460200001", ean:"2000005232705", nom:"Ralph Lauren - RL6136 - 5003", marque:"Ralph Lauren", fournisseur_code:"R90344", ref_monture:"RL6136", code_couleur:"5003", couleur:"5003", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"44", taille_nez:"16", taille_branches:"145", largeur_face:"136", code_douanier:"90031100", prix_catalogue_monture:"103", style:"Sport", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"21/12/2026" } },
  { id:72, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 13:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90883700001", ean:"2000005311066", nom:"Burberry - BE3132 - 1337SB", marque:"Burberry", fournisseur_code:"R90344", ref_monture:"BE3132", code_couleur:"1337SB", couleur:"1337sb", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"58", hauteur_verres:"40", taille_nez:"19", taille_branches:"150", largeur_face:"143", code_douanier:"90031100", prix_catalogue_monture:"123", style:"Classique", pays_origine:"Chine", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"En cours", active_l:"Actif", miseEnLigne:"09/12/2026", date_maj_statut:"06/11/2026" } },
  { id:73, cat:'Montures', createdAt:'02/07/2026', maj:'07/08/2026 14:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90555500001", ean:"2000005386149", nom:"Burberry - BE4344 - 300187", marque:"Burberry", fournisseur_code:"R90344", ref_monture:"BE4344", code_couleur:"300187", couleur:"300187", optique_solaire:"Optique", largeur_verres:"51", taille_nez:"20" } },
  { id:74, cat:'Montures', createdAt:'24/09/2026', maj:'25/10/2026 08:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90974700001", ean:"2000005471614", nom:"Dolce&Gabbana - DG1323 - 1334", marque:"Dolce&Gabbana", fournisseur_code:"R90344", ref_monture:"DG1323", code_couleur:"1334", couleur:"1334", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Métal", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"54", hauteur_verres:"47", taille_nez:"16", taille_branches:"145", largeur_face:"135", code_douanier:"90031930", prix_catalogue_monture:"143", style:"Fashion", pays_origine:"France", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Écoulement de stock", miseEnLigne:"15/10/2026", date_maj_statut:"15/10/2026" } },
  { id:75, cat:'Montures', createdAt:'14/11/2025', maj:'04/12/2025 11:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90540700001", ean:"2000005553176", nom:"Persol - PO3007VM - 1160", marque:"Persol", fournisseur_code:"R90344", ref_monture:"PO3007VM", code_couleur:"1160", couleur:"1160", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"52", hauteur_verres:"38", taille_nez:"19", taille_branches:"150", largeur_face:"132", code_douanier:"90031100", prix_catalogue_monture:"134", style:"Fashion", pays_origine:"Japon", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"En cours", active_l:"Actif", miseEnLigne:"09/12/2025", date_maj_statut:"09/12/2025" } },
  { id:76, cat:'Montures', createdAt:'21/04/2026', maj:'03/05/2026 08:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90207500001", ean:"2000005631261", nom:"Persol - PO3189V - 24", marque:"Persol", fournisseur_code:"R90344", ref_monture:"PO3189V", code_couleur:"24", couleur:"24", optique_solaire:"Optique", largeur_verres:"55", taille_nez:"18" } },
  { id:77, cat:'Montures', createdAt:'23/08/2025', maj:'30/08/2025 10:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90473500001", ean:"2000005710948", nom:"Prada - PR 17WS - 1AB5S0", marque:"Prada", fournisseur_code:"R90344", ref_monture:"PR 17WS", code_couleur:"1AB5S0", couleur:"1ab5s0", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"49", hauteur_verres:"40", taille_nez:"20", taille_branches:"145", largeur_face:"127", code_douanier:"90041091", prix_catalogue_monture:"188", style:"Classique", pays_origine:"Italie", forme:"rectangles", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:78, cat:'Montures', createdAt:'23/10/2025', maj:'30/11/2025 09:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90486400001", ean:"2000005784299", nom:"Versace - VE1283 - 1480", marque:"Versace", fournisseur_code:"R90344", ref_monture:"VE1283", code_couleur:"1480", couleur:"1480", optique_solaire:"Optique", largeur_verres:"54", taille_nez:"18" } },
  { id:79, cat:'Montures', createdAt:'17/02/2026', maj:'23/02/2026 14:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90390600001", ean:"2000005867404", nom:"Versace - VE3291 - 108", marque:"Versace", fournisseur_code:"R90344", ref_monture:"VE3291", code_couleur:"108", couleur:"108", optique_solaire:"Optique", largeur_verres:"51", taille_nez:"18" } },
  { id:80, cat:'Montures', createdAt:'17/12/2025', maj:'15/01/2026 14:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90188400001", ean:"2000005940813", nom:"Burberry - BE1361 - 1109", marque:"Burberry", fournisseur_code:"R90344", ref_monture:"BE1361", code_couleur:"1109", couleur:"1109", optique_solaire:"Optique", cerclage:"Semi-cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"46", taille_nez:"18", taille_branches:"145", largeur_face:"136", code_douanier:"90031100", prix_catalogue_monture:"191", style:"Fashion", pays_origine:"Japon", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:81, cat:'Montures', createdAt:'01/06/2026', maj:'17/06/2026 13:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90791800001", ean:"2000006021586", nom:"Prada - PR 24XS - 2AU6S1", marque:"Prada", fournisseur_code:"R90344", ref_monture:"PR 24XS", code_couleur:"2AU6S1", couleur:"2au6s1", optique_solaire:"Solaire", cerclage:"Semi-cercle", matiere:"Métal", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"43", taille_nez:"18", taille_branches:"145", largeur_face:"131", code_douanier:"90041091", prix_catalogue_monture:"223", style:"Fashion", pays_origine:"Italie", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Brun", categorie_verre:"Catégorie 3", pola:"Oui", miroir:"Non", degrade:"Non", reassort_sap:"Activé", active_o:"Inactif", active_l:"Écoulement de stock", miseEnLigne:"06/07/2026", date_maj_statut:"06/07/2026" } },
  { id:82, cat:'Montures', createdAt:'03/01/2026', maj:'09/02/2026 13:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90895700001", ean:"2000006107442", nom:"Ray-Ban - RX5356 - 2012", marque:"Ray-Ban", fournisseur_code:"R90344", ref_monture:"RX5356", code_couleur:"2012", couleur:"2012", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"52", hauteur_verres:"40", taille_nez:"19", taille_branches:"145", largeur_face:"134", code_douanier:"90031100", prix_catalogue_monture:"83", style:"Fashion", pays_origine:"France", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"En cours", active_l:"Inactif", miseEnLigne:"09/02/2026", date_maj_statut:"09/02/2026" } },
  { id:83, cat:'Montures', createdAt:'24/02/2026', maj:'13/03/2026 17:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90555200001", ean:"2000006181648", nom:"Ralph Lauren - RL6222 - 5003", marque:"Ralph Lauren", fournisseur_code:"R90344", ref_monture:"RL6222", code_couleur:"5003", couleur:"5003", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"54", hauteur_verres:"44", taille_nez:"16", taille_branches:"145", largeur_face:"133", code_douanier:"90031100", prix_catalogue_monture:"63", style:"Fashion", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"18/04/2026" } },
  { id:84, cat:'Montures', createdAt:'02/05/2025', maj:'02/06/2025 09:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90182400001", ean:"2000006258481", nom:"Dolce&Gabbana - DG4405 - 501/8", marque:"Dolce&Gabbana", fournisseur_code:"R90344", ref_monture:"DG4405", code_couleur:"501/8", couleur:"501/8", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"53", hauteur_verres:"36", taille_nez:"20", taille_branches:"145", largeur_face:"139", code_douanier:"90031930", prix_catalogue_monture:"154", style:"Fashion", pays_origine:"France", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"12/06/2025" } },
  { id:85, cat:'Montures', createdAt:'13/02/2025', maj:'22/02/2025 10:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90886100001", ean:"2000006338495", nom:"Persol - PO3292V - 95", marque:"Persol", fournisseur_code:"R90344", ref_monture:"PO3292V", code_couleur:"95", couleur:"95", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"48", hauteur_verres:"43", taille_nez:"21", taille_branches:"140", largeur_face:"129", code_douanier:"90031100", prix_catalogue_monture:"150", style:"Fashion", pays_origine:"Italie", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"10/04/2025" } },
  { id:86, cat:'Montures', createdAt:'15/08/2026', maj:'23/09/2026 09:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90930700001", ean:"2000006421731", nom:"Prada - PR 15WS - 01R0A6", marque:"Prada", fournisseur_code:"R90344", ref_monture:"PR 15WS", code_couleur:"01R0A6", couleur:"01r0a6", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"54", hauteur_verres:"40", taille_nez:"19", taille_branches:"150", largeur_face:"137", code_douanier:"90041091", prix_catalogue_monture:"193", style:"Classique", pays_origine:"Japon", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"25/09/2026" } },
  { id:87, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 15:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90336800001", ean:"2000006502762", nom:"Lacoste - L2237 - 424", marque:"Lacoste", fournisseur_code:"R90381", ref_monture:"L2237", code_couleur:"424", couleur:"424", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"43", taille_nez:"18", taille_branches:"145", largeur_face:"132", code_douanier:"90031100", prix_catalogue_monture:"84", style:"Classique", pays_origine:"Japon", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"En cours", miseEnLigne:"03/12/2026", date_maj_statut:"06/11/2026" } },
  { id:88, cat:'Montures', createdAt:'02/02/2025', maj:'02/03/2025 09:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90828300001", ean:"2000006577562", nom:"Calvin Klein - CK22539 - 432", marque:"Calvin Klein", fournisseur_code:"R90381", ref_monture:"CK22539", code_couleur:"432", couleur:"432", optique_solaire:"Optique", largeur_verres:"54", taille_nez:"16" } },
  { id:89, cat:'Montures', createdAt:'03/08/2026', maj:'04/08/2026 09:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90472800001", ean:"2000006659033", nom:"Calvin Klein - CK22543 - 444", marque:"Calvin Klein", fournisseur_code:"R90381", ref_monture:"CK22543", code_couleur:"444", couleur:"444", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"56", hauteur_verres:"45", taille_nez:"15", taille_branches:"140", largeur_face:"138", code_douanier:"90031100", prix_catalogue_monture:"79", style:"Classique", pays_origine:"Japon", forme:"Papillon", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"13/09/2026" } },
  { id:90, cat:'Montures', createdAt:'14/10/2025', maj:'04/11/2025 13:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90556800001", ean:"2000006733636", nom:"Calvin Klein - CK22543 - 240", marque:"Calvin Klein", fournisseur_code:"R90381", ref_monture:"CK22543", code_couleur:"240", couleur:"240", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"56", hauteur_verres:"46", taille_nez:"15", taille_branches:"150", largeur_face:"135", code_douanier:"90031100", prix_catalogue_monture:"97", style:"Classique", pays_origine:"Japon", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Inactif", active_l:"Actif", miseEnLigne:"28/11/2025", date_maj_statut:"28/11/2025" } },
  { id:91, cat:'Montures', createdAt:'09/06/2025', maj:'09/06/2025 18:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90983200001", ean:"2000006814436", nom:"Nike - NIKE 5048 - 030", marque:"Nike", fournisseur_code:"R90381", ref_monture:"NIKE 5048", code_couleur:"030", couleur:"030", optique_solaire:"Optique", largeur_verres:"49", taille_nez:"13" } },
  { id:92, cat:'Montures', createdAt:'25/10/2026', maj:'06/11/2026 10:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90982200001", ean:"2000006891976", nom:"Nike - NIKE DZ7353 - 011", marque:"Nike", fournisseur_code:"R90381", ref_monture:"NIKE DZ7353", code_couleur:"011", couleur:"011", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"69", hauteur_verres:"43", taille_nez:"7", taille_branches:"150", largeur_face:"159", code_douanier:"90031100", prix_catalogue_monture:"46", style:"Sport", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"03/12/2026", date_maj_statut:"06/11/2026" } },
  { id:93, cat:'Montures', createdAt:'15/02/2025', maj:'04/03/2025 14:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90290000001", ean:"2000006973988", nom:"Nike - NIKE DZ7373 - 434", marque:"Nike", fournisseur_code:"R90381", ref_monture:"NIKE DZ7373", code_couleur:"434", couleur:"434", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"54", hauteur_verres:"37", taille_nez:"19", taille_branches:"145", largeur_face:"138", code_douanier:"90031100", prix_catalogue_monture:"68", style:"Sport", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:94, cat:'Montures', createdAt:'11/07/2026', maj:'30/07/2026 17:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90442200001", ean:"2000007056729", nom:"Lacoste - L2287 - 410", marque:"Lacoste", fournisseur_code:"R90381", ref_monture:"L2287", code_couleur:"410", couleur:"410", optique_solaire:"Optique", cerclage:"Semi-cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"55", hauteur_verres:"48", taille_nez:"18", taille_branches:"145", largeur_face:"142", code_douanier:"90031100", prix_catalogue_monture:"43", style:"Sport", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Inactif", active_l:"En cours", miseEnLigne:"21/08/2026", date_maj_statut:"21/08/2026" } },
  { id:95, cat:'Montures', createdAt:'23/04/2026', maj:'23/05/2026 14:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90485200001", ean:"2000007135789", nom:"Lacoste - L2908 - 240", marque:"Lacoste", fournisseur_code:"R90381", ref_monture:"L2908", code_couleur:"240", couleur:"240", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"55", hauteur_verres:"39", taille_nez:"17", taille_branches:"150", largeur_face:"136", code_douanier:"90031100", prix_catalogue_monture:"112", style:"Classique", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"En cours", miseEnLigne:"19/05/2026", date_maj_statut:"19/05/2026" } },
  { id:96, cat:'Montures', createdAt:'24/01/2026', maj:'09/02/2026 13:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90722000001", ean:"2000007209491", nom:"Longchamp - LO2109 - 771", marque:"Longchamp", fournisseur_code:"R90381", ref_monture:"LO2109", code_couleur:"771", couleur:"771", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"51", hauteur_verres:"38", taille_nez:"19", taille_branches:"150", largeur_face:"135", code_douanier:"90031100", prix_catalogue_monture:"71", style:"Sport", pays_origine:"Italie", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"En cours", miseEnLigne:"05/03/2026", date_maj_statut:"05/03/2026" } },
  { id:97, cat:'Montures', createdAt:'03/10/2025', maj:'09/10/2025 18:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90226900001", ean:"2000007289761", nom:"Longchamp - LO2133 - 720", marque:"Longchamp", fournisseur_code:"R90381", ref_monture:"LO2133", code_couleur:"720", couleur:"720", optique_solaire:"Optique", cerclage:"Sans cerclage", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"52", hauteur_verres:"39", taille_nez:"18", taille_branches:"145", largeur_face:"131", code_douanier:"90031100", prix_catalogue_monture:"54", style:"Sport", pays_origine:"Chine", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"En cours", miseEnLigne:"26/10/2025", date_maj_statut:"26/10/2025" } },
  { id:98, cat:'Montures', createdAt:'14/09/2025', maj:'08/10/2025 17:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90780400001", ean:"2000007365098", nom:"Longchamp - LO2140 - 772", marque:"Longchamp", fournisseur_code:"R90381", ref_monture:"LO2140", code_couleur:"772", couleur:"772", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"54", hauteur_verres:"45", taille_nez:"17", taille_branches:"145", largeur_face:"134", code_douanier:"90031100", prix_catalogue_monture:"54", style:"Sport", pays_origine:"Chine", forme:"carrées", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Inactif", miseEnLigne:"20/10/2025", date_maj_statut:"20/10/2025" } },
  { id:99, cat:'Montures', createdAt:'15/02/2025', maj:'16/03/2025 12:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90385800001", ean:"2000007448869", nom:"Guess - GU7842 - 28F", marque:"Guess", fournisseur_code:"R90418", ref_monture:"GU7842", code_couleur:"28F", couleur:"28f", optique_solaire:"Optique", cerclage:"Sans cerclage", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"58", hauteur_verres:"41", taille_nez:"17", taille_branches:"145", largeur_face:"146", code_douanier:"90031100", prix_catalogue_monture:"83", style:"Sport", pays_origine:"France", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"22/04/2025" } },
  { id:100, cat:'Montures', createdAt:'13/11/2025', maj:'14/12/2025 12:10', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90176200001", ean:"2000007525609", nom:"Guess - GU2906 - 083", marque:"Guess", fournisseur_code:"R90418", ref_monture:"GU2906", code_couleur:"083", couleur:"083", optique_solaire:"Optique", largeur_verres:"55", taille_nez:"15" } },
  { id:101, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 12:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90528000002", ean:"2000007608337", nom:"Boss - BOSS0989 - PZH", marque:"Boss", fournisseur_code:"R90566", ref_monture:"BOSS0989", code_couleur:"PZH", couleur:"Pzh", optique_solaire:"Optique", largeur_verres:"51", taille_nez:"18" } },
  { id:102, cat:'Montures', createdAt:'11/05/2025', maj:'14/06/2025 13:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90700100001", ean:"2000007683310", nom:"Polaroid - PLD4108S - 086LA", marque:"Polaroid", fournisseur_code:"R90566", ref_monture:"PLD4108S", code_couleur:"086LA", couleur:"086la", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Métal", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"55", hauteur_verres:"47", taille_nez:"19", taille_branches:"150", largeur_face:"138", code_douanier:"90041091", prix_catalogue_monture:"57", style:"Fashion", pays_origine:"Chine", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Gris", categorie_verre:"Catégorie 3", pola:"Non", miroir:"Non", degrade:"Non", reassort_sap:"Activé", active_o:"Actif", active_l:"Inactif", miseEnLigne:"04/06/2025", date_maj_statut:"04/06/2025" } },
  { id:103, cat:'Montures', createdAt:'26/02/2026', maj:'21/03/2026 18:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90594500001", ean:"2000007765119", nom:"Vuarnet - VL2103 - CRISTAL", marque:"Vuarnet", fournisseur_code:"R90603", ref_monture:"VL2103", code_couleur:"CRISTAL", couleur:"Cristal", optique_solaire:"Solaire", cerclage:"Sans cerclage", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"52", hauteur_verres:"42", taille_nez:"22", taille_branches:"140", largeur_face:"136", code_douanier:"90041091", prix_catalogue_monture:"96", style:"Sport", pays_origine:"Japon", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Brun", categorie_verre:"Catégorie 3", pola:"Non", miroir:"Non", degrade:"Oui", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"En cours", miseEnLigne:"26/04/2026", date_maj_statut:"26/04/2026" } },
  { id:104, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 09:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90028300001", ean:"2000007841747", nom:"Vuarnet - VL2008 - Gris", marque:"Vuarnet", fournisseur_code:"R90603", ref_monture:"VL2008", code_couleur:"GRIS", couleur:"Gris", optique_solaire:"Solaire", cerclage:"Cercle", matiere:"Métal", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"54", hauteur_verres:"37", taille_nez:"18", taille_branches:"145", largeur_face:"134", code_douanier:"90041091", prix_catalogue_monture:"53", style:"Classique", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", teinte_verres:"Gris", categorie_verre:"Catégorie 3", pola:"Non", miroir:"Non", degrade:"Non", reassort_sap:"Activé", active_o:"Actif", active_l:"En cours", miseEnLigne:"02/12/2026", date_maj_statut:"06/11/2026" } },
  { id:105, cat:'Montures', createdAt:'12/12/2025', maj:'18/12/2025 18:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90166300001", ean:"2000007926871", nom:"Banana Moon - BM243P - 2", marque:"Banana Moon", fournisseur_code:"R90751", ref_monture:"BM243P", code_couleur:"2", couleur:"2", optique_solaire:"Optique", largeur_verres:"56", taille_nez:"21" } },
  { id:106, cat:'Montures', createdAt:'07/05/2026', maj:'14/06/2026 08:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90233700001", ean:"2000007999354", nom:"Banana Moon - BM243P - 3", marque:"Banana Moon", fournisseur_code:"R90751", ref_monture:"BM243P", code_couleur:"3", couleur:"3", optique_solaire:"Optique", cerclage:"Sans cerclage", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"56", hauteur_verres:"37", taille_nez:"21", taille_branches:"150", largeur_face:"141", code_douanier:"90031100", prix_catalogue_monture:"74", style:"Fashion", pays_origine:"Chine", forme:"carrées", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:107, cat:'Montures', createdAt:'11/04/2025', maj:'20/04/2025 10:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90352800001", ean:"2000008083401", nom:"Banana Moon - BM244P - 2", marque:"Banana Moon", fournisseur_code:"R90751", ref_monture:"BM244P", code_couleur:"2", couleur:"2", optique_solaire:"Optique", cerclage:"Semi-cercle", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"55", hauteur_verres:"48", taille_nez:"16", taille_branches:"145", largeur_face:"140", code_douanier:"90031930", prix_catalogue_monture:"53", style:"Fashion", pays_origine:"Chine", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"01/05/2025", date_maj_statut:"01/05/2025" } },
  { id:108, cat:'Montures', createdAt:'06/01/2026', maj:'13/01/2026 09:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90667500001", ean:"2000008161444", nom:"Gucci - GG1044O - 002", marque:"Gucci", fournisseur_code:"R90825", ref_monture:"GG1044O", code_couleur:"002", couleur:"002", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"57", hauteur_verres:"40", taille_nez:"13", taille_branches:"140", largeur_face:"136", code_douanier:"90031100", prix_catalogue_monture:"229", style:"Sport", pays_origine:"Japon", forme:"Papillon", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Inactif", miseEnLigne:"27/02/2026", date_maj_statut:"27/02/2026" } },
  { id:109, cat:'Montures', createdAt:'21/08/2026', maj:'27/08/2026 15:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90347800001", ean:"2000008241801", nom:"Chloe - CH0123O - 002", marque:"Chloe", fournisseur_code:"R90825", ref_monture:"CH0123O", code_couleur:"002", couleur:"002", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Métal", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"50", hauteur_verres:"36", taille_nez:"18", taille_branches:"140", largeur_face:"129", code_douanier:"90031930", prix_catalogue_monture:"190", style:"Classique", pays_origine:"Italie", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"18/09/2026", date_maj_statut:"18/09/2026" } },
  { id:110, cat:'Montures', createdAt:'20/07/2026', maj:'26/07/2026 09:55', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90971300001", ean:"2000008318857", nom:"Chloe - CH0132O - 004", marque:"Chloe", fournisseur_code:"R90825", ref_monture:"CH0132O", code_couleur:"004", couleur:"004", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"49", hauteur_verres:"44", taille_nez:"20", taille_branches:"145", largeur_face:"129", code_douanier:"90031100", prix_catalogue_monture:"192", style:"Classique", pays_origine:"France", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours" } },
  { id:111, cat:'Montures', createdAt:'14/06/2025', maj:'14/07/2025 09:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90311500001", ean:"2000008399083", nom:"Chloe - CH0132O - 005", marque:"Chloe", fournisseur_code:"R90825", ref_monture:"CH0132O", code_couleur:"005", couleur:"005", optique_solaire:"Optique", cerclage:"Sans cerclage", matiere:"Plastique", cible:"Femme", profil_caractere:"PFL0020 : Femme", largeur_verres:"53", hauteur_verres:"41", taille_nez:"20", taille_branches:"145", largeur_face:"136", code_douanier:"90031100", prix_catalogue_monture:"148", style:"Classique", pays_origine:"Italie", forme:"pilotes/aviator", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"06/08/2025" } },
  { id:112, cat:'Montures', createdAt:'04/11/2026', maj:'06/11/2026 08:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90921200001", ean:"2000008478751", nom:"Gucci - GG1222O - 001", marque:"Gucci", fournisseur_code:"R90825", ref_monture:"GG1222O", code_couleur:"001", couleur:"001", optique_solaire:"Optique", largeur_verres:"48", taille_nez:"22" } },
  { id:113, cat:'Montures', createdAt:'22/03/2025', maj:'26/04/2025 13:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90363600001", ean:"2000008552682", nom:"Gucci - GG1192O - 005", marque:"Gucci", fournisseur_code:"R90825", ref_monture:"GG1192O", code_couleur:"005", couleur:"005", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"53", hauteur_verres:"43", taille_nez:"16", taille_branches:"145", largeur_face:"136", code_douanier:"90031100", prix_catalogue_monture:"171", style:"Fashion", pays_origine:"Chine", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"Actif", miseEnLigne:"19/05/2025", date_maj_statut:"19/05/2025" } },
  { id:114, cat:'Montures', createdAt:'23/05/2025', maj:'01/06/2025 17:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90082400001", ean:"2000008636814", nom:"Puma - PJ0043O - 007", marque:"Puma", fournisseur_code:"R90825", ref_monture:"PJ0043O", code_couleur:"007", couleur:"007", optique_solaire:"Optique", cerclage:"Sans cerclage", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"46", hauteur_verres:"48", taille_nez:"19", taille_branches:"145", largeur_face:"121", code_douanier:"90031100", prix_catalogue_monture:"104", style:"Classique", pays_origine:"Chine", forme:"rondes/ovales/pantos", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Écoulement de stock", active_l:"Actif", miseEnLigne:"06/07/2025", date_maj_statut:"06/07/2025" } },
  { id:115, cat:'Montures', createdAt:'06/11/2026', maj:'06/11/2026 08:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90456000001", ean:"2000008720584", nom:"Puma - PU0378O - 004", marque:"Puma", fournisseur_code:"R90825", ref_monture:"PU0378O", code_couleur:"004", couleur:"004", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"53", hauteur_verres:"48", taille_nez:"18", taille_branches:"140", largeur_face:"132", code_douanier:"90031100", prix_catalogue_monture:"59", style:"Fashion", pays_origine:"France", forme:"pilotes/aviator", adaptable_vue:"Oui", branches_flex:"Non", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Inactif", active_l:"En cours", miseEnLigne:"13/12/2026", date_maj_statut:"06/11/2026" } },
  { id:116, cat:'Montures', createdAt:'10/02/2026', maj:'07/03/2026 17:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90787400001", ean:"2000008792323", nom:"Puma - PU0394O - 002", marque:"Puma", fournisseur_code:"R90825", ref_monture:"PU0394O", code_couleur:"002", couleur:"002", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Métal", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"57", hauteur_verres:"46", taille_nez:"16", taille_branches:"150", largeur_face:"142", code_douanier:"90031930", prix_catalogue_monture:"74", style:"Classique", pays_origine:"Chine", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Actif", miseEnLigne:"20/03/2026", date_maj_statut:"20/03/2026" } },
  { id:117, cat:'Montures', createdAt:'13/03/2025', maj:'04/04/2025 09:40', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90572100001", ean:"2000008873211", nom:"Saint Laurent - SL M112 - 001", marque:"Saint Laurent", fournisseur_code:"R90825", ref_monture:"SL M112", code_couleur:"001", couleur:"001", optique_solaire:"Optique", largeur_verres:"54", taille_nez:"16" } },
  { id:118, cat:'Montures', createdAt:'28/02/2026', maj:'26/03/2026 12:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90283500001", ean:"2000008955940", nom:"Saint Laurent - SL M113 - 002", marque:"Saint Laurent", fournisseur_code:"R90825", ref_monture:"SL M113", code_couleur:"002", couleur:"002", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Homme", profil_caractere:"PFL0010 : Homme", largeur_verres:"54", hauteur_verres:"41", taille_nez:"17", taille_branches:"150", largeur_face:"137", code_douanier:"90031100", prix_catalogue_monture:"178", style:"Sport", pays_origine:"Italie", forme:"rectangles", adaptable_vue:"Oui", reassort_sap:"Activé", active_o:"En cours", miseEnLigne:"08/05/2026" } },
  { id:119, cat:'Montures', createdAt:'28/07/2025', maj:'02/08/2025 14:25', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:"M90769900001", ean:"2000009028003", nom:"Saint Laurent - SL 555 OPT - 001", marque:"Saint Laurent", fournisseur_code:"R90825", ref_monture:"SL 555 OPT", code_couleur:"001", couleur:"001", optique_solaire:"Optique", cerclage:"Cercle", matiere:"Plastique", cible:"Mixte", profil_caractere:"PFL0030 : Mixte", largeur_verres:"48", hauteur_verres:"37", taille_nez:"20", taille_branches:"145", largeur_face:"127", code_douanier:"90031100", prix_catalogue_monture:"244", style:"Fashion", pays_origine:"Chine", forme:"rectangles", adaptable_vue:"Oui", branches_flex:"Oui", branches_antiderapantes:"Non", adaptable_progressifs:"Oui", reassort_sap:"Activé", active_o:"Actif", active_l:"Écoulement de stock", miseEnLigne:"26/09/2025", date_maj_statut:"26/09/2025" } },
];

// ============================================================
// COMPTEURS AUTO-INCREMENT
// ============================================================
let nextAttrId     = 139;

// Avancement du workflow sur l'echantillon (donnees fictives) : quelques
// commandes, visuels et contributions Akeneo pour illustrer les etapes.
const VISUEL_DEMO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">'
  + '<rect width="160" height="120" fill="#eef3f8"/>'
  + '<g fill="none" stroke="#1a2332" stroke-width="5">'
  + '<rect x="22" y="44" width="48" height="34" rx="12"/><rect x="90" y="44" width="48" height="34" rx="12"/>'
  + '<path d="M70 56 q10 -8 20 0"/><path d="M22 52 l-12 -6"/><path d="M138 52 l12 -6"/></g></svg>');
[
  [1,  { commande_implantation:'Oui', origine_visuels:'Fournisseur', visuel_face:VISUEL_DEMO, contribution_akeneo:'Oui' }],
  [4,  { commande_implantation:'Oui', origine_visuels:'Shooting', visuel_face:VISUEL_DEMO, contribution_akeneo:'Oui' }],
  [5,  { commande_implantation:'Oui', origine_visuels:'Fournisseur', visuel_face:VISUEL_DEMO }],
  [6,  { commande_implantation:'Oui' }],
  [12, { commande_implantation:'Oui' }],
  [13, { commande_implantation:'Oui', origine_visuels:'Shooting', visuel_face:VISUEL_DEMO }],
  [24, { commande_implantation:'Oui' }],
].forEach(([id, values]) => {
  const p = products.find(x => x.id === id);
  if (p) Object.assign(p.fields, values);
});
// Montures ajoutees (id 30+) : avancement varie selon les canaux
products.filter(p => p.id >= 30).forEach(p => {
  const f = p.fields, k = (p.id * 37) % 10;
  if (f.active_o === 'Actif' || f.active_l === 'Actif' || f.active_o === 'Écoulement de stock') {
    Object.assign(f, { commande_implantation:'Oui', origine_visuels: k < 6 ? 'Fournisseur' : 'Shooting' });
    if (k < 8) f.visuel_face = VISUEL_DEMO;
    if (k < 6) f.contribution_akeneo = 'Oui';
  } else if (f.active_o === 'En cours' && k < 6) {
    f.commande_implantation = 'Oui';
    if (k < 3) f.origine_visuels = k < 2 ? 'Fournisseur' : 'Shooting';
  }
});

let alerts = [
  { id: 1, name: 'Taux de marque faible',
    conds: [ { attrCode: 'taux_marque', op: '<', value: '20' } ] },
  { id: 2, name: 'Réassort SAP à désactiver',
    conds: [ { attrCode: 'reassort_sap', op: '=', value: 'Activé' },
             { attrCode: 'active_o', op: '≠', value: 'Actif ; En cours' },
             { attrCode: 'active_l', op: '≠', value: 'Actif ; En cours' } ] },
];
let nextAlertId = 3;

// ============================================================
// CHAMPS CALCULES PAR TABLE (module global de l'administration)
// Une table par champ calcule. Colonnes = conditions (un champ et un
// operateur), lignes = valeurs de ces conditions puis resultat.
// La premiere ligne dont toutes les conditions sont vraies donne le
// resultat. Une case vide = peu importe. Pour « = » et « ≠ », plusieurs
// valeurs se separent par « ; ». Aucune ligne vraie : resultat vide.
// Un champ calcule par une table a pour formule =TABLE().
// ============================================================
const CALC_OPS = ['=', '≠', '<', '≤', '>', '≥'];
const GM = (code, label) => code + '     ' + label;

let calcTables = [
  { id:1, attrCode:'coefficient',
    note:'Coefficient du PVMC : Montures selon Optique / Solaire, Accessoires selon le type et la tranche de prix de base HT (fichier BDD Accessoires).',
    conditions:[ { attrCode:'cat', op:'=' }, { attrCode:'optique_solaire', op:'=' },
                 { attrCode:'type_produit_acc', op:'=' }, { attrCode:'prix_base', op:'≤' } ],
    lines:[
      { vals:['Montures', 'Optique', '', ''], result:'2.6' },
      { vals:['Montures', '', '', ''], result:'1.9' },
      { vals:['Accessoires', '', 'Etui ; Chainette', '2'], result:'5' },
      { vals:['Accessoires', '', 'Etui ; Chainette', '4'], result:'4' },
      { vals:['Accessoires', '', 'Etui ; Chainette', '6'], result:'3.4' },
      { vals:['Accessoires', '', 'Etui ; Chainette', '8'], result:'2.5' },
      { vals:['Accessoires', '', 'Etui ; Chainette', '9.99'], result:'2.1' },
      { vals:['Accessoires', '', 'Etui ; Chainette', ''], result:'2' },
      { vals:['Accessoires', '', 'Cadeau fid', '4'], result:'4' },
      { vals:['Accessoires', '', 'Charlie Chill ; Coffret ; Produits d\'entretien', ''], result:'2.5' },
      { vals:['Accessoires', '', 'Clips', ''], result:'3.4' },
      { vals:['Accessoires', '', 'Cordon', ''], result:'3.5' },
      { vals:['Accessoires', '', 'Textile', ''], result:'2' },
    ] },
  { id:2, attrCode:'statut_publication',
    note:'Publié dès qu\'un canal vaut Actif ou Écoulement de stock.',
    conditions:[ { attrCode:'active_o', op:'=' }, { attrCode:'active_l', op:'=' } ],
    lines:[
      { vals:['Actif ; Écoulement de stock', ''], result:'Oui' },
      { vals:['', 'Actif ; Écoulement de stock'], result:'Oui' },
      { vals:['', ''], result:'Non' },
    ] },
  { id:3, attrCode:'groupe_marchandise',
    note:'Code et libellé de la table BDD des groupes de marchandise.',
    conditions:[ { attrCode:'optique_solaire', op:'=' }, { attrCode:'matiere', op:'=' }, { attrCode:'cerclage', op:'=' } ],
    lines:[
      { vals:['Optique', 'Métal ; Metal', 'Cercle'], result:GM('GM0010', 'Mont.Opt.Mé.Cerclée') },
      { vals:['Optique', 'Métal ; Metal', 'Nylor ; Semi-cercle'], result:GM('GM0020', 'Mont.Opt.Me.Fils') },
      { vals:['Optique', 'Métal ; Metal', 'Sans cerclage'], result:GM('GM0030', 'Mont.Opt.Mé.Percées') },
      { vals:['Optique', 'Plastique ; Acetate', 'Cercle'], result:GM('GM0040', 'Mont.Opt.Pl.Cerclées') },
      { vals:['Optique', 'Plastique ; Acetate', 'Nylor ; Semi-cercle'], result:GM('GM0050', 'Mont.Opt.Pl.Fils') },
      { vals:['Optique', 'Plastique ; Acetate', 'Sans cerclage'], result:GM('GM0060', 'Mont.Opt.Pl.Percées') },
      { vals:['Optique', 'Titane', 'Cercle'], result:GM('GM0070', 'Mont.Opt.Ti.Cerclées') },
      { vals:['Optique', 'Titane', 'Nylor ; Semi-cercle'], result:GM('GM0080', 'Mont.Opt.Ti.Fils') },
      { vals:['Optique', 'Titane', 'Sans cerclage'], result:GM('GM0090', 'Mont.Opt.Ti.Percées') },
      { vals:['Solaire', 'Métal ; Metal', 'Cercle'], result:GM('GM0100', 'Mont.Sol.Mé.Cerclées') },
      { vals:['Solaire', 'Métal ; Metal', 'Nylor ; Semi-cercle'], result:GM('GM0110', 'Mont.Sol.Mé.Fils') },
      { vals:['Solaire', 'Métal ; Metal', 'Sans cerclage'], result:GM('GM0120', 'Mont.Sol.Mé.Percées') },
      { vals:['Solaire', 'Plastique ; Acetate', 'Cercle'], result:GM('GM0130', 'Mont Sol Pl.Cerclées') },
      { vals:['Solaire', 'Plastique ; Acetate', 'Nylor ; Semi-cercle'], result:GM('GM0140', 'Mont.Sol.Pl.Fils') },
      { vals:['Solaire', 'Plastique ; Acetate', 'Sans cerclage'], result:GM('GM0150', 'Mont.Sol.Pl.Percées') },
      { vals:['Solaire', 'Titane', 'Cercle'], result:GM('GM0160', 'Mont.Sol.Ti.Cerclées') },
      { vals:['Solaire', 'Titane', 'Nylor ; Semi-cercle'], result:GM('GM0170', 'Mont.Sol.Ti.Fils') },
      { vals:['Solaire', 'Titane', 'Sans cerclage'], result:GM('GM0180', 'Mont.Sol.Ti.Percées') },
    ] },
  { id:4, attrCode:'iwi_code_douanier',
    note:'Code douanier de l\'export IWI selon optique / solaire et la matière.',
    conditions:[ { attrCode:'optique_solaire', op:'=' }, { attrCode:'matiere', op:'=' } ],
    lines:[
      { vals:['Optique ; Prémontée', 'Plastique ; Acetate'], result:'9003110010' },
      { vals:['Optique ; Prémontée', 'Métal ; Metal ; Titane'], result:'9003190030' },
      { vals:['Optique ; Prémontée', 'Bois ; Carbone'], result:'9003190090' },
      { vals:['Solaire', 'Plastique ; Acetate'], result:'9004109100' },
      { vals:['Solaire', 'Métal ; Metal ; Titane ; Bois ; Carbone'], result:'9004109900' },
    ] },
  { id:5, attrCode:'taille',
    note:'Taille de la monture selon la largeur des verres (mm).',
    conditions:[ { attrCode:'largeur_verres', op:'≥' } ],
    lines:[
      { vals:['56'], result:'Adulte L' },
      { vals:['51'], result:'Adulte M' },
      { vals:['49'], result:'Adulte S' },
      { vals:['47'], result:'Adolescent' },
      { vals:['44'], result:'Enfant' },
      { vals:['0'], result:'Bébé' },
    ] },
  { id:6, attrCode:'iwi_type',
    note:'Lettre IWI du type de monture.',
    conditions:[ { attrCode:'optique_solaire', op:'=' } ],
    lines:[
      { vals:['Optique'], result:'A' },
      { vals:['Solaire'], result:'B' },
      { vals:['Clip'], result:'C' },
      { vals:['Masque'], result:'D' },
      { vals:['Prémontée'], result:'E' },
    ] },
  { id:7, attrCode:'iwi_sous_type',
    note:'Lettre IWI du cerclage.',
    conditions:[ { attrCode:'cerclage', op:'=' } ],
    lines:[
      { vals:['Cercle'], result:'A' },
      { vals:['Semi-cercle ; Nylor'], result:'B' },
      { vals:['Sans cerclage'], result:'C' },
    ] },
  { id:8, attrCode:'iwi_materiau_face',
    note:'Lettre IWI de la matière de la face.',
    conditions:[ { attrCode:'matiere', op:'=' } ],
    lines:[
      { vals:['Plastique ; Acetate'], result:'A' },
      { vals:['Métal ; Metal'], result:'C' },
      { vals:['Titane'], result:'F' },
      { vals:['Bois'], result:'H' },
      { vals:['Carbone'], result:'G' },
    ] },
  { id:9, attrCode:'iwi_materiau_branche',
    note:"Lettre IWI de la matière des branches (même matière que la face tant qu'il n'y a pas d'attribut branche).",
    conditions:[ { attrCode:'matiere', op:'=' } ],
    lines:[
      { vals:['Plastique ; Acetate'], result:'A' },
      { vals:['Métal ; Metal'], result:'C' },
      { vals:['Titane'], result:'F' },
      { vals:['Bois'], result:'H' },
      { vals:['Carbone'], result:'G' },
    ] },
  { id:10, attrCode:'iwi_utilisateur',
    note:'Lettre IWI de la cible.',
    conditions:[ { attrCode:'cible', op:'=' } ],
    lines:[
      { vals:['Homme'], result:'A' },
      { vals:['Femme'], result:'B' },
      { vals:['Enfant ; Junior'], result:'C' },
      { vals:['Mixte'], result:'D' },
    ] },
  { id:11, attrCode:'iwi_forme',
    note:'Code IWI de la forme. Rondes / ovales / pantos reste vide : trop de codes IWI pour un seul libellé.',
    conditions:[ { attrCode:'forme', op:'=' } ],
    lines:[
      { vals:['Aviateur ; pilotes/aviator'], result:'1' },
      { vals:['Carree ; carrées'], result:'2' },
      { vals:['Clubmaster'], result:'3' },
      { vals:['Masque'], result:'4' },
      { vals:['Ovale'], result:'5' },
      { vals:['Papillon'], result:'8' },
      { vals:['Rectangulaire ; rectangles'], result:'9' },
      { vals:['Ronde'], result:'10' },
    ] },
  { id:12, attrCode:'iwi_prescription',
    note:'0 en solaire, 1 en optique ou prémontée.',
    conditions:[ { attrCode:'optique_solaire', op:'=' } ],
    lines:[
      { vals:['Optique ; Prémontée'], result:'1' },
      { vals:['Solaire'], result:'0' },
    ] },
];
let nextCalcTableId = 13;

function calcTableFor(attrCode) {
  return (calcTables || []).find(t => t.attrCode === attrCode) || null;
}

function isTableFormula(formula) {
  return /^=?\s*TABLE\s*\(\s*\)\s*$/i.test(String(formula || ''));
}

function calcNum(v) {
  const n = parseFloat(String(v == null ? '' : v).trim().replace(',', '.'));
  return isFinite(n) ? n : null;
}

// Une condition : case vide = vraie. « = » / « ≠ » : liste de valeurs « ; ».
function calcCondTrue(op, cell, raw) {
  const c = String(cell == null ? '' : cell).trim();
  if (c === '') return true;
  const v = String(raw == null ? '' : raw).trim();
  if (op === '=' || op === '≠') {
    const list = c.split(';').map(x => x.trim()).filter(Boolean);
    const hit = list.some(x => x === v || (calcNum(x) !== null && calcNum(x) === calcNum(v) && v !== ''));
    return op === '=' ? hit : !hit;
  }
  const a = calcNum(v), b = calcNum(c);
  if (a === null || b === null) return false;
  if (op === '<') return a < b;
  if (op === '≤') return a <= b;
  if (op === '>') return a > b;
  if (op === '≥') return a >= b;
  return false;
}

// Rang de la premiere ligne vraie (-1 si aucune)
function calcTableLineIndex(t, ctx) {
  return t.lines.findIndex(l => t.conditions.every((c, i) => calcCondTrue(c.op, l.vals[i], ctx[c.attrCode])));
}

function evalCalcTable(t, ctx) {
  const i = calcTableLineIndex(t, ctx);
  return i < 0 ? '' : String(t.lines[i].result);
}

// ============================================================
// WORKFLOW : jalons atteints automatiquement selon une regle sur un champ
// kind : 'groups' (complétion des onglets choisis >= seuil), 'filled' (champ
// renseigné), 'equals' (champ égal à une valeur). Le module s'active ou se
// désactive (workflowEnabled) : désactivé, ni frise, ni colonne, ni section. L'étape du produit est le
// jalon le plus avancé atteint ; un jalon précédent non atteint est à régulariser.
// ============================================================
const WORKFLOW_START_LABEL = 'En création';
let workflowEnabled = true;
let workflowSteps = [
  { id:1, name:'Produit renseigné',      rule:{ kind:'groups', groupIds:[4,7,11,12], threshold:100 } },
  { id:2, name:'Code SAP renseigné',     rule:{ kind:'filled', attrCode:'sap' } },
  { id:3, name:'Commande effectuée',     rule:{ kind:'equals', attrCode:'commande_implantation', value:'Oui' } },
  { id:4, name:'Visuels OK',             rule:{ kind:'filled', attrCode:'visuel_face' } },
  { id:5, name:'Contribution Akeneo OK', rule:{ kind:'equals', attrCode:'contribution_akeneo', value:'Oui' } },
  { id:6, name:'Publié',                 rule:{ kind:'equals', attrCode:'statut_publication', value:'Oui' } },
];
let nextWorkflowStepId = 8;

function workflowLabels() {
  return [WORKFLOW_START_LABEL].concat(workflowSteps.map(s => s.name));
}

function syncWorkflowAttrOptions() {
  const a = attributes.find(x => x.code === 'etape_workflow');
  if (a) a.options = workflowLabels();
}
syncWorkflowAttrOptions();
let _filterAlertId = null;
let nextCatId      = 6;
let nextGroupId    = 17;
let nextProductId  = 120;
let _filterIncomplets = false;

// ============================================================
// ETAT UI GLOBAL
// ============================================================
let editingCatId      = null;
let editingGroupId    = null;
let pendingDelete     = null;
let currentProductId  = null;
let currentView       = 'synth';
let selectedProductIds = [];
let compareMode       = false;
let activeGroupFilters = null;
let colFilters        = {};
let activeColFilterDropdown = null;
let currentPage       = 1;

// ============================================================
// EXPORT STATE — filtres actifs au moment du clic "Exporter"
// ============================================================
let exportPick = null;
let activeExportTemplate = 'catalogue';
let exportOpenGroups = new Set();
let exportIgnoreSelection = false;
// ============================================================
// TRAMES D'IMPORT / EXPORT (Administration > Trames d'import / export)
// Une trame décrit un fichier : colonnes dans l'ordre, chacune avec son bloc,
// son intitulé et sa source (un attribut, une valeur fixe, ou rien), et sert
// à l'import, à l'export ou aux deux. À l'export, une colonne bloquante vide
// sur un produit bloque l'export. À l'import, la trame relie d'office les
// colonnes du fichier à leurs attributs. « Catalogue » est une trame système :
// tous les attributs des onglets de la catégorie, en-tête = code technique
// (à l'export comme à l'import).
// ============================================================
let trames = [
  { id: 'catalogue', name: 'Catalogue', system: true, dynamic: 'catalogue', export: true, import: true, cats: [], columns: [] },
  { id: 'fmt_iwi', name: 'IWI', export: true, import: false, cats: ['Montures'], sheet: 'Montures', columns: [
    { bloc:'Général', header:'Code fabricant', code:'code_fabricant', required:true },
    { bloc:'Général', header:'Nom du fabricant', code:'iwi_nom_fabricant', required:true },
    { bloc:'Général', header:'Code du distributeur', fixed:'ATS', required:true },
    { bloc:'Général', header:'Nom du distributeur', fixed:'ATS', required:true },
    { bloc:'Général', header:'GTIN', code:'ean', required:true },
    { bloc:'Général', header:'Nom du produit', code:'nom' },
    { bloc:'Général', header:'Code enseigne' },
    { bloc:'Général', header:'Code produit public' },
    { bloc:'Général', header:'Code marquage', code:'iwi_code_marquage' },
    { bloc:'Général', header:'Code commande' },
    { bloc:'Général', header:'Code modèle' },
    { bloc:'Général', header:'Code interne' },
    { bloc:'Général', header:'Code monture' },
    { bloc:'Général', header:'UPC' },
    { bloc:'Général', header:'EAN', code:'ean' },
    { bloc:'Général', header:'Type', code:'iwi_type', required:true },
    { bloc:'Général', header:'Sous-type monture', code:'iwi_sous_type', required:true },
    { bloc:'Général', header:'Type de pièce détachée' },
    { bloc:'Général', header:'Taille du verre emboité (calibre)', code:'largeur_verres' },
    { bloc:'Général', header:'Taille du pont (nez)', code:'taille_nez' },
    { bloc:'Général', header:'Longueur de branche nominale', code:'taille_branches' },
    { bloc:'Général', header:'Numéro de série' },
    { bloc:'Général', header:'Marque', code:'iwi_marque', required:true },
    { bloc:'Général', header:'Collection' },
    { bloc:'Général', header:'Code de la couleur' },
    { bloc:'Général', header:'Nom de la couleur', code:'couleur' },
    { bloc:'Technique', header:'Gabarit' },
    { bloc:'Technique', header:'Forme de la monture', code:'iwi_forme' },
    { bloc:'Technique', header:'Longueur de branche', code:'taille_branches' },
    { bloc:'Technique', header:'Diamètre effectif de la monture' },
    { bloc:'Technique', header:'Angle pantoscopique' },
    { bloc:'Technique', header:'Angle de la monture' },
    { bloc:'Technique', header:'Base de la monture' },
    { bloc:'Technique', header:'Instruction de manipulation des montures' },
    { bloc:'Technique', header:'Disponibilité des pièces détachées' },
    { bloc:'Technique', header:'Compatibilité de clip' },
    { bloc:'Technique', header:'Identifiant du verre' },
    { bloc:'Technique', header:'Base de courbure du verre' },
    { bloc:'Technique', header:'Descriptif du verre' },
    { bloc:'Technique', header:'Catégorie CEN du verre', code:'categorie_verre' },
    { bloc:'Technique', header:'Restriction du verre' },
    { bloc:'Technique', header:'Type de filtration du verre' },
    { bloc:'Technique', header:'Matériau du verre' },
    { bloc:'Technique', header:'Puissance' },
    { bloc:'Technique', header:'Prescription', code:'iwi_prescription' },
    { bloc:'Technique', header:'Type de découpe de la tranche du verre' },
    { bloc:'Technique', header:'Largeur du verre', code:'largeur_verres' },
    { bloc:'Technique', header:'Hauteur du verre', code:'hauteur_verres' },
    { bloc:'Technique', header:'Distance entre les verres' },
    { bloc:'Commercial', header:'Action', fixed:'1', required:true },
    { bloc:'Commercial', header:'Date de début de validité' },
    { bloc:'Commercial', header:'Date de fin de validité' },
    { bloc:'Commercial', header:'Code douanier', code:'iwi_code_douanier' },
    { bloc:'Commercial', header:'Prix 1', code:'pa_interne_monture', required:true },
    { bloc:'Commercial', header:'Prix 2', code:'prix_catalogue_monture', required:true },
    { bloc:'Commercial', header:'Prix additionnel (non configuré)' },
    { bloc:'Commercial', header:'Prix additionnel (non configuré)' },
    { bloc:'Commercial', header:'Prix additionnel (non configuré)' },
    { bloc:'Commercial', header:'Prix additionnel (non configuré)' },
    { bloc:'Commercial', header:'Charnière sur ressort' },
    { bloc:'Commercial', header:'Matériau principal de la face', code:'iwi_materiau_face', required:true },
    { bloc:'Commercial', header:'Matériau principal de la branche', code:'iwi_materiau_branche' },
    { bloc:'Commercial', header:'Type d\'utilisateur', code:'iwi_utilisateur', required:true },
    { bloc:'Commercial', header:'Type d\'utilisation' },
    { bloc:'Commercial', header:'Couleur NRF (US uniquement)' },
    { bloc:'Commercial', header:'Spécifications additionnelles' },
    { bloc:'Commercial', header:'Petite image' },
    { bloc:'Commercial', header:'Image de face' },
    { bloc:'Commercial', header:'Image droite' },
    { bloc:'Commercial', header:'Image gauche' },
    { bloc:'Commercial', header:'Image de dessus' },
    { bloc:'Commercial', header:'Image de dessous' },
    { bloc:'Commercial', header:'Caractéristiques essentielles' },
    { bloc:'Commercial', header:'Origine garantie' },
    { bloc:'Commercial', header:'Date de création', code:'created_at' },
    { bloc:'Commercial', header:'Date de modification', code:'iwi_date_modif', required:true }
  ] },
  { id: 'trm_base_montures', name: 'Base montures', export: true, import: true, cats: ['Montures'], sheet: 'Table', columns: [
    { header:'Code SAP', code:'sap' }, { header:'Code EAN / SKU / GTIN', code:'ean' }, { header:'Réassort automatique SAP', code:'reassort_sap' },
    { header:'CODE FOURNISSEUR', code:'fournisseur_code' }, { header:'Marque', code:'marque' }, { header:'Profil de caractère', code:'profil_caractere' },
    { header:'Nom du modèle', code:'ref_monture' }, { header:'Code couleur', code:'code_couleur' }, { header:'Couleur Akénéo  (nom complet)', code:'couleur' },
    { header:'Largeur des verres', code:'largeur_verres' }, { header:'Hauteur des verres', code:'hauteur_verres' }, { header:'Taille Nez', code:'taille_nez' },
    { header:'Largeur de la face', code:'largeur_face' }, { header:'Taille Branches', code:'taille_branches' }, { header:'Branches flex', code:'branches_flex' },
    { header:'Branches antidérapantes', code:'branches_antiderapantes' }, { header:'Teinte verres', code:'teinte_verres' }, { header:'Catégorie', code:'categorie_verre' },
    { header:'Pola', code:'pola' }, { header:'Miroir', code:'miroir' }, { header:'Dégradé', code:'degrade' }, { header:'Monture adaptable à la vue', code:'adaptable_vue' },
    { header:'Forme de la monture', code:'forme' }, { header:'Style', code:'style' }, { header:'Pays d\'origine', code:'pays_origine' }, { header:'Cible', code:'cible' },
    { header:'Opt / Sol', code:'optique_solaire' }, { header:'Code douanier', code:'code_douanier' }, { header:'Matière', code:'matiere' },
    { header:'Prix catalogue', code:'prix_catalogue_monture' }, { header:'Prix final arrondi TTC', code:'pvmc' }, { header:'Commentaires', code:'commentaire' },
  ] },
];
let nextTrameId = 4;

function trameById(id) { return (trames || []).find(f => f.id === id) || null; }
function currentExportFormat() { return exportPick ? trameById(exportPick.formatId) : null; }
function exportFormatCols() { const f = currentExportFormat(); return f ? f.columns : []; }

function exportGroupsForCat(catName) {
  const cat = catName ? getCatByName(catName) : null;
  const ids = cat ? cat.groupIds : attrGroups.map(g => g.id);
  return ids.map(id => getGroupById(id)).filter(Boolean);
}

function exportTemplateMode(id) {
  const t = trameById(id);
  return t && t.dynamic === 'catalogue' ? 'catalogue' : 'format';
}
function exportTemplateFormatId(id) { return trameById(id) ? id : null; }
// Trames proposées pour une catégorie (sans catégorie = toutes)
function tramesFor(usage, catName) {
  return trames.filter(t => t[usage] && (!catName || !(t.cats || []).length || t.cats.includes(catName)));
}

function ensureExportPick() {
  const cat = exportSnapshot.catFilter || '';
  if (exportPick && exportPick.cat === cat && exportPick.template === activeExportTemplate) return;
  const mode = exportTemplateMode(activeExportTemplate);
  if (mode === 'format') {
    const f = trameById(exportTemplateFormatId(activeExportTemplate));
    const fcols = f ? f.columns : [];
    exportPick = {
      cat, template: activeExportTemplate, mode, formatId: f ? f.id : null,
      groups: new Set(fcols.map(c => c.bloc || '')),
      attrs: new Set(fcols.map((_, i) => String(i))),
      format: 'xlsx',
    };
    return;
  }
  const groups = exportGroupsForCat(cat);
  const groupIds = new Set(groups.map(g => g.id));
  const attrs = new Set();
  groups.forEach(g => (g.attrIds || []).forEach(id => {
    const a = getAttrById(id);
    if (a && a.code !== 'completion') attrs.add(a.code);
  }));
  exportPick = { cat, template: activeExportTemplate, mode, groups: groupIds, attrs, format: 'xlsx' };
}

function exportPickerHtml() {
  ensureExportPick();
  const list = tramesFor('export', exportPick.cat);
  if (!list.some(t => t.id === activeExportTemplate) && trameById(activeExportTemplate)) list.push(trameById(activeExportTemplate));
  const tplOpts = list.map(t =>
    `<option value="${t.id}"${t.id === activeExportTemplate ? ' selected' : ''}>${escapeHtml(t.name)}</option>`
  ).join('');
  const canSave = canMod('mod_trames', 'w');
  const iwi = exportPick.mode === 'format';
  const missing = (iwi && typeof iwiMissingCounts === 'function' && typeof exportScopeProducts === 'function')
    ? iwiMissingCounts(exportScopeProducts()) : {};
  const blocks = iwi ? exportIwiPickerBlocks(missing) : exportCataloguePickerBlocks();
  return `
    <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 6px rgba(0,0,0,0.07);margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:#1a2332;margin-bottom:12px">Trame</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <select class="form-select" style="max-width:240px" onchange="selectExportTemplate(this.value)">${tplOpts}</select>
        ${canSave ? `<input class="field-input" id="export-template-name" placeholder="Nom d'une nouvelle trame" style="max-width:220px">
        <button class="btn btn-secondary" onclick="saveExportTemplate()">Enregistrer la trame</button>` : ''}
      </div>
      <div>${blocks}</div>
    </div>`;
}

function exportCheckBlock(key, name, on, groupChange, items) {
  const open = exportOpenGroups.has(String(key));
  const checked = items.filter(it => it.on).length;
  const fields = open ? items.map(it => `
    <label style="display:flex;align-items:center;gap:6px;font-size:12px;margin:2px 0 2px 28px;color:${on ? '#1a2332' : '#a0b0c0'}">
      <input type="checkbox" ${it.on ? 'checked' : ''} ${on ? '' : 'disabled'} onchange="${it.change}">
      ${escapeHtml(it.label)}${it.extra || ''}
    </label>`).join('') : '';
  return `<div style="margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:8px">
      <input type="checkbox" ${on ? 'checked' : ''} onchange="${groupChange}">
      <button type="button" style="background:none;border:0;padding:0;font-weight:600;font-size:13px;cursor:pointer" onclick="toggleExportSection('${key}')">${open ? '▾' : '▸'} ${escapeHtml(name)}</button>
      <span style="font-size:12px;color:#607080">${checked}/${items.length}</span>
    </div>
    ${fields}
  </div>`;
}

function exportCataloguePickerBlocks() {
  return exportGroupsForCat(exportPick.cat).map(g => {
    const on = exportPick.groups.has(g.id);
    const attrs = (g.attrIds || []).map(id => getAttrById(id)).filter(a => a && a.code !== 'completion');
    const items = attrs.map(a => ({
      on: on && exportPick.attrs.has(a.code),
      label: a.name,
      change: `toggleExportAttr(${g.id},'${a.code}',this.checked)`,
    }));
    return exportCheckBlock('g' + g.id, g.name, on, `toggleExportGroup(${g.id},this.checked)`, items);
  }).join('');
}

function exportIwiPickerBlocks(missing) {
  const sections = [];
  exportFormatCols().forEach((col, i) => {
    const bloc = col.bloc || '';
    let sec = sections.find(s => s.name === bloc);
    if (!sec) { sec = { name: bloc, cols: [] }; sections.push(sec); }
    sec.cols.push({ col, i });
  });
  return sections.map(sec => {
    const on = exportPick.groups.has(sec.name);
    const items = sec.cols.map(({ col, i }) => {
      const n = missing[i] || 0;
      const isOn = on && exportPick.attrs.has(String(i));
      const mark = col.required && isOn && n
        ? `<span style="color:#c62828;font-weight:700;margin-left:8px">${n} valeur${n > 1 ? 's' : ''} manquante${n > 1 ? 's' : ''}</span>` : '';
      return {
        on: isOn,
        label: col.header || '(sans intitulé)',
        extra: mark,
        change: `toggleExportIwiCol(${i},this.checked)`,
      };
    });
    return exportCheckBlock('b' + sections.indexOf(sec), sec.name || 'Colonnes', on, `toggleExportIwiGroup(${sections.indexOf(sec)},this.checked)`, items);
  }).join('');
}

let exportSnapshot = {
  colFilters:    {},
  catFilter:     '',
  searchVal:     '',
  view:          'synth',
  syntheseItems: [],
};

function captureExportSnapshot() {
  exportSnapshot = {
    colFilters:    JSON.parse(JSON.stringify(
      Object.fromEntries(Object.entries(colFilters).map(([k, v]) => [
        k,
        v instanceof Set ? { kind: 'list', values: [...v] } : v
      ]))
    )),
    catFilter:     (document.getElementById('filter-cat') || {}).value || '',
    searchVal:     (document.getElementById('products-search') || {}).value || '',
    view:          currentView,
    syntheseItems: JSON.parse(JSON.stringify(syntheseItems)),
  };
}
