// ============================================================
// DATA.JS
// ============================================================

// ============================================================
// PREFERENCES APPLICATION
// ============================================================
let appPrefs = {
  pageSize: 50, // Nombre de produits par page (0 = illimité)
};

let userPrefs = {
  theme: 'light', // 'light' | 'dark' — affichage utilisateur, pas encore applique
};

let seuilCompletion = 80;
let productDirty = false;
let pendingNavTarget = null;

// ============================================================
// GROUPE SYNTHESE — figé, transversal, non déplaçable
// ============================================================
// Chaque élément est soit un attribut { kind:'attr', code:'...' }
// soit une action { kind:'action', code:'delete', label:'Suppr.' }
// L'action Suppr. n'est plus proposée par défaut, elle reste ajoutable
// depuis Administration > Vue Synthese.
let syntheseItems = [
  { kind: 'attr',   code: 'visuel_face', label: 'Visuel'     },
  { kind: 'attr',   code: 'nom',         label: 'Nom produit'},
  { kind: 'attr',   code: 'sap',         label: 'Code SAP'   },
  { kind: 'attr',   code: 'ean',         label: 'Code EAN/GTIN' },
  { kind: 'attr',   code: 'cat',         label: 'Categorie'  },
  { kind: 'attr',   code: 'createdAt',   label: 'Date creation'},
  { kind: 'attr',   code: 'miseEnLigne', label: 'Mise en ligne'},
  { kind: 'attr',   code: 'statut_publication', label: 'Statut publication'},
  { kind: 'attr',   code: 'completion',  label: 'Completion' },
  { kind: 'attr',   code: 'maj',         label: 'Derniere MAJ'},
];

// ============================================================
// GROUPES D'ATTRIBUTS
// ============================================================
let attrGroups = [
  { id:1,  name:'Informations generales',      code:'infos_generales',       system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[1,2,3,78,4,5,77,66,67,59,68,60,61,79] },
  { id:2,  name:'Visuels',                     code:'visuels',               system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[54,55,56,57,58] },
  { id:3,  name:'Conditions commerciales',     code:'conditions_commerciales', system:true, isSynthGroup:false, isBrandGroup:true,  attrIds:[69,70,78,80,62,21,63,64,65,17] },
  { id:4,  name:'Caracteristiques monture',    code:'caract_monture',        system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[7,8,9,10,11,12,13,71,14,15,16,17] },
  { id:5,  name:'Tarification monture',        code:'tarif_monture',         system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[18,19,20,21,22,23,24,25] },
  { id:6,  name:'SEO monture',                 code:'seo_monture',           system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[26,27,28,29] },
  { id:7,  name:'Caracteristiques lentille',   code:'caract_lentille',       system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[30,31,72,34,35,36,37,38,32,39,73,40,41,33] },
  { id:8,  name:'Tarification lentille',       code:'tarif_lentille',        system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[42,43] },
  { id:9,  name:'Logistique lentille',         code:'logistique_lentille',   system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[46] },
  { id:10, name:'SEO lentille',                code:'seo_lentille',          system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[47,48,49,50] },
  { id:11, name:'Caracteristiques accessoire', code:'caract_accessoire',     system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[51,52] },
  { id:12, name:'Caracteristiques PEL',        code:'caract_pel',            system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[74,30,70,75,76,45,44] },
];

// ============================================================
// ATTRIBUTS
// mask : syntaxe Access — A=lettre, 9=chiffre, *=alphanum
// ex: 'A999999999999' pour code SAP
// ============================================================
let attributes = [
  { id:1,  name:'Code SAP',         code:'sap',              type:'Texte',           groupId:1,  required:false, calc:false, inCompletion:true, formula:'', mask:'*************', maskMin:6, showInSynth:true,  clickToOpen:false },
  { id:2,  name:'Code EAN/GTIN',    code:'ean',              type:'Texte',           groupId:1,  required:true,  calc:false, inCompletion:true, formula:'', mask:'99999999999999', showInSynth:true,  clickToOpen:false },
  { id:3,  name:'Nom produit',      code:'nom',              type:'Texte',           groupId:1,  required:true,  calc:false, inCompletion:true, formula:'', mask:'',              showInSynth:true,  clickToOpen:true  },
  { id:4,  name:'Date de creation', code:'created_at',       type:'Date',            groupId:1,  required:false, calc:false, inCompletion:false, formula:'', mask:'',              readonly:true,     showInSynth:false, clickToOpen:false, system:true },
  { id:5,  name:'Date de derniere MAJ', code:'updated_at',   type:'Date',            groupId:1,  required:false, calc:false, inCompletion:false, formula:'', mask:'',              readonly:true,     showInSynth:false, clickToOpen:false, system:true },
  { id:78, name:'Categorie',        code:'cat',              type:'Simple select',   groupId:1,  required:true,  calc:false, inCompletion:false, formula:'', mask:'',              showInSynth:true,  clickToOpen:false, system:true },
  { id:79, name:'Completion',       code:'completion',       type:'Nombre',          groupId:1,  required:false, calc:false, inCompletion:false, formula:'', mask:'',              readonly:true,     showInSynth:true,  clickToOpen:false, system:true },
  { id:66, name:'Actif canal O',    code:'active_o',         type:'Oui / Non',       groupId:1,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:67, name:'Actif canal L',    code:'active_l',         type:'Oui / Non',       groupId:1,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:59, name:'Statut de publication', code:'statut_publication', type:'Texte', groupId:1, required:false, calc:true, inCompletion:false,
    formula:'=SI([active_o]==VRAI OU [active_l]==VRAI)',
    helpText:'Oui si au moins un canal (O ou L) est actif',
    mask:'', showInSynth:true,  clickToOpen:false },
  { id:68, name:'Date de mise a jour du statut', code:'date_maj_statut', type:'Date', groupId:1, required:false, calc:true, inCompletion:false,
    formula:'DATE_MAJ(statut_publication)',
    formulaLabel:'Date du dernier changement de statut de publication',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:60, name:'Statut commercial',  code:'statut_commercial', type:'Simple select', groupId:1, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:true,  clickToOpen:false,
    options:['Actif','Inactif','Ecoulement de stock','En cours','Arrêté'] },
  { id:77, name:'Date de mise en ligne', code:'miseEnLigne', type:'Date', groupId:1, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:true, clickToOpen:false },
  { id:61, name:'Code e-commerce',    code:'code_ecommerce',    type:'Texte',         groupId:1, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:69, name:'Code fournisseur',    code:'fournisseur_code',    type:'Texte',         groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, system:true },
  { id:70, name:'Marque',              code:'marque',              type:'Texte',         groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, system:true },
  { id:80, name:'Segmentation',        code:'segmentation',        type:'Texte',         groupId:3,  required:false, calc:false, inCompletion:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, system:true },
  { id:6,  name:'Conditions commerciales',           code:'conditions_commerciales',           type:'Simple select',   groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false,
    options:['Vogue','Ray-Ban','Oakley','Alcon','Bausch & Lomb','Essilor','Carrera','Boss','Lacoste','Calvin Klein','Gucci','Chloe','Prada','Versace','Emporio Armani','Michael Kors','Dolce&Gabbana','Persol','Burberry','Moncler','Jimmy Choo','Polo Ralph Lauren','Ralph Lauren','Swarovski','Police','Diesel','Guess','Adidas','Karl Lagerfeld','Nike','Longchamp','Esprit','Elle','Julbo','Morgan','Rip Curl','Mauboussin','Cebe','Bolle'] },
  { id:62, name:'RF',                  code:'rf',                  type:'Nombre',    groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, isConditionCommerciale:true },
  { id:63, name:'Remise interne',      code:'remiseEnseigne',      type:'Nombre',    groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', stepEnabled:true, step:0.5, min:0, max:100, showInSynth:false, clickToOpen:false, isConditionCommerciale:true, displayFormat:'percent' },
  { id:64, name:'Reprise échange',     code:'repriseEchange',      type:'Oui / Non', groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, isConditionCommerciale:true },
  { id:65, name:'Conditions de livraison', code:'conditionsLivraison', type:'Texte', groupId:3,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, isConditionCommerciale:true },
  { id:7,  name:'Reference monture',   code:'ref_monture',   type:'Texte',           groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:8,  name:'Nom marketing',       code:'nom_marketing', type:'Texte',   groupId:4,  required:false, calc:true, inCompletion:false,
    formula:'CONCAT(marque, " ", ref_monture, " ", couleur)', formulaLabel:'Marque + Reference monture + Couleur',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:9,  name:'Cible',               code:'cible',         type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Homme','Femme','Mixte','Enfant','Junior'] },
  { id:10, name:'Optique / Solaire',   code:'optique_solaire',type:'Simple select',  groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Optique','Solaire'] },
  { id:11, name:'Matiere',             code:'matiere',       type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Acetate','Metal','Titane','Plastique','Bois','Carbone'] },
  { id:12, name:'Cerclage',            code:'cerclage',      type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Cercle','Semi-cercle','Sans cerclage','Nylor'] },
  { id:13, name:'Couleur',             code:'couleur',       type:'Texte',           groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:71, name:'Largeur des verres',  code:'largeur_verres', type:'Nombre',         groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:14, name:'Taille',              code:'taille',        type:'Texte',           groupId:4,  required:false, calc:true, inCompletion:false,
    formula:'=SI([largeur_verres]>=56,"Adulte L",SI([largeur_verres]>=51,"Adulte M",SI([largeur_verres]>=49,"Adulte S",SI([largeur_verres]>=47,"Adolescent",SI([largeur_verres]>=44,"Enfant",SI([largeur_verres]>=40,"Bébé",""))))))',
    formulaLabel:'Adulte L (56+), Adulte M (51-55), Adulte S (49-50), Adolescent (47-48), Enfant (44-46), Bébé (40-43)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:15, name:'Forme de la monture', code:'forme',         type:'Simple select',   groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Ronde','Carree','Rectangulaire','Ovale','Papillon','Aviateur','Clubmaster'] },
  { id:16, name:'Code douanier',       code:'code_douanier', type:'Texte',           groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'99999999', showInSynth:false, clickToOpen:false },
  { id:17, name:'Commentaire',         code:'commentaire',   type:'Texte long',      groupId:4,  required:false, calc:false, inCompletion:true, formula:'', mask:'', maxLength:500, showInSynth:false, clickToOpen:false, isConditionCommerciale:true },
  { id:18, name:'Prix catalogue',      code:'prix_catalogue',type:'Nombre',          groupId:5,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:19, name:'PA interne',          code:'pa_interne',        type:'Nombre',          groupId:5,  required:false, calc:true, inCompletion:false,
    formula:'=[prix_catalogue]*(1-[remiseEnseigne]/100)', formulaLabel:'Prix catalogue x (1 - Remise interne/100)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:20, name:'Remise sur facture',  code:'remise',        type:'Nombre',          groupId:5,  required:false, calc:false, inCompletion:true, formula:'', mask:'', stepEnabled:true, step:1, min:0, max:100, showInSynth:false, clickToOpen:false },
  { id:21, name:'RFA',                 code:'rfa',           type:'Nombre',          groupId:5,  required:false, calc:false, inCompletion:true, formula:'', mask:'', stepEnabled:true, step:0.5, min:0, max:100, showInSynth:false, clickToOpen:false, isConditionCommerciale:true },
  { id:22, name:'marge interne',           code:'marge_interne',     type:'Nombre',  groupId:5,  required:false, calc:true, inCompletion:false,
    formula:'=[pa_interne]*(1-[remise]/100)*(1+[rfa]/100)', formulaLabel:'pa interne x (1 - Remise/100) x (1 + RFA/100)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:23, name:'PA opticien',         code:'pa_opticien',   type:'Nombre',  groupId:5,  required:false, calc:true, inCompletion:false,
    formula:'=[pa_interne]*(1-[remise]/100)', formulaLabel:'pa interne x (1 - Remise/100)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:24, name:'Prix final arrondi',  code:'prix_final',    type:'Nombre',  groupId:5,  required:false, calc:true, inCompletion:false,
    formula:'=[pa_opticien]*2', formulaLabel:'PA opticien x 2',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:25, name:'Taux de marque',      code:'taux_marque',   type:'Nombre',  groupId:5,  required:false, calc:true, inCompletion:false,
    formula:'=([prix_final]-[pa_opticien])/[prix_final]*100', formulaLabel:'(Prix final - PA opticien) / Prix final x 100',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:26, name:'Titre SEO O',      code:'seo_titre_o',  type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'CONCAT(nom, " | Optic 2000")', formulaLabel:'Nom produit | Optic 2000',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:27, name:'Description SEO O',code:'seo_desc_o',   type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'CONCAT("Lunettes ", optique_solaire, " ", marque, " ", ref_monture, " ", couleur, ". Achetez ", nom, " sur Optic 2000.")',
    formulaLabel:'Lunettes + Optique/Solaire + Marque + Reference + Couleur + Nom | Optic 2000',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:28, name:'Titre SEO L',          code:'seo_titre_l', type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'CONCAT(nom, " | Lissac")', formulaLabel:'Nom produit | Lissac',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:29, name:'Description SEO L',    code:'seo_desc_l',  type:'Texte', groupId:6,  required:false, calc:true, inCompletion:false,
    formula:'CONCAT("Lunettes ", optique_solaire, " ", marque, " ", ref_monture, " ", couleur, ". Achetez ", nom, " sur Lissac.")',
    formulaLabel:'Lunettes + Optique/Solaire + Marque + Reference + Couleur + Nom | Lissac',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:30, name:'Laboratoire',         code:'laboratoire',   type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Alcon','Bausch & Lomb','CooperVision','Johnson & Johnson','Menicon','CVE','MDD'] },
  { id:31, name:'Nb lentilles par boite', code:'nb_lentilles', type:'Simple select', groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['2','6','10','12','30','90','180'] },
  { id:72, name:'Type',                code:'type_usage',    type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Correctrices','Couleurs'] },
  { id:32, name:'Type de lentilles',   code:'type_lentille', type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Souple','Rigide'] },
  { id:33, name:'Couleur lentille',    code:'couleur_lentille', type:'Texte',        groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:34, name:'Type de vision',      code:'type_vision',   type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Spherique','Toric','Multifocal'] },
  { id:35, name:'Renouvellement',      code:'renouvellement',type:'Simple select',   groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Journalier','Bi-mensuelle','Mensuelle'] },
  { id:36, name:'Materiau lentille',   code:'materiau_lentille', type:'Simple select', groupId:7, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Hydrogel','Silicone Hydrogel'] },
  { id:37, name:'Hydrophilie en %',    code:'hydrophilie',   type:'Nombre',          groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:38, name:'Filtre UV',           code:'filtre_uv',     type:'Oui / Non',       groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:39, name:'Transmissibilite a l oxygene (DK/t)', code:'sensibilite_o2', type:'Nombre', groupId:7, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:73, name:'HEMA',                code:'hema',          type:'Oui / Non',       groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:40, name:'Teinte de manipulation', code:'teinte_manip', type:'Oui / Non',     groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:41, name:'Defauts visuels',     code:'defauts_visuels', type:'Multi select',  groupId:7,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Hypermetropie / Myopie','Astigmatisme','Presbytie'] },
  { id:42, name:'Prix de vente TTC',   code:'prix_vente',    type:'Nombre',          groupId:8,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:43, name:'Prix de vente HT',    code:'prix_tva',      type:'Nombre',  groupId:8,  required:false, calc:true, inCompletion:false,
    formula:'=[prix_vente]/1.2', formulaLabel:'Prix de vente TTC / 1.2 (TVA 20%)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:44, name:'Duree de conservation apres ouverture', code:'duree_conservation', type:'Texte', groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:45, name:'Type de solution',    code:'type_solution', type:'Simple select',   groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Multi-fonction','Oxydant','Decontaminant','Nettoyage','Rincage','Trempage','Gouttes de confort','Solution d hydratation','Deproteinisant'] },
  { id:46, name:'Utilisation lentille', code:'utilisation_lentille', type:'Simple select', groupId:9, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Correction','Esthetique','Therapeutique'] },
  { id:74, name:'Code produit',        code:'code_produit',  type:'Texte',           groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:75, name:'Conditionnement',     code:'conditionnement', type:'Texte',         groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:76, name:'Type',                code:'type_pel',      type:'Simple select',   groupId:12, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Gouttes de confort','Flight Pack','Produits d entretien','Pack entretien','Comprimes'] },
  { id:47, name:'Titre SEO O',          code:'seo_titre_o2000_l',  type:'Texte', groupId:10, required:false, calc:true, inCompletion:false,
    formula:'CONCAT(nom, " | Optic 2000")', formulaLabel:'Nom produit | Optic 2000',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:48, name:'Description SEO O',    code:'seo_desc_o2000_l',   type:'Texte', groupId:10, required:false, calc:true, inCompletion:false,
    formula:'CONCAT(nom, " ", laboratoire, " ", type_lentille, " ", renouvellement, ". Achetez sur Optic 2000.")',
    formulaLabel:'Nom + Laboratoire + Type + Renouvellement | Optic 2000',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:49, name:'Titre SEO L',          code:'seo_titre_lissac_l', type:'Texte', groupId:10, required:false, calc:true, inCompletion:false,
    formula:'CONCAT(nom, " | Lissac")', formulaLabel:'Nom produit | Lissac',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:50, name:'Description SEO L',    code:'seo_desc_lissac_l',  type:'Texte', groupId:10, required:false, calc:true, inCompletion:false,
    formula:'CONCAT(nom, " ", laboratoire, " ", type_lentille, " ", renouvellement, ". Achetez sur Lissac.")',
    formulaLabel:'Nom + Laboratoire + Type + Renouvellement | Lissac',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:51, name:'Type de produit',     code:'type_produit_acc', type:'Texte',        groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:52, name:'Coefficient',         code:'coefficient',   type:'Nombre',          groupId:11, required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:54, name:'Vue de face',         code:'visuel_face',   type:'Image',           groupId:2,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:55, name:'Vue 3/4',             code:'visuel_tq',     type:'Image',           groupId:2,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:56, name:'Vue de profil',       code:'visuel_profil', type:'Image',           groupId:2,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:57, name:'Visuel ambiance',     code:'visuel_ambiance', type:'Image',         groupId:2,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:58, name:'Visuel fournisseur',  code:'visuel_fournisseur', type:'Image',      groupId:2,  required:false, calc:false, inCompletion:true, formula:'', mask:'', showInSynth:false, clickToOpen:false },
];

// ============================================================
// REFERENTIEL FOURNISSEURS / MARQUES
// ============================================================
let suppliers = [
  { code:'R00001', name:'ADCL' },
  { code:'R00008', name:'APLUS' },
  { code:'R00020', name:'BOLLE BRANDS' },
  { code:'R01240', name:'BLI-DBP' },
  { code:'R00028', name:'CHARMANT' },
  { code:'R00039', name:'DE RIGO' },
  { code:'R00060', name:'GRASSET' },
  { code:'R00066', name:'JULBO' },
  { code:'R01554', name:'KERING' },
  { code:'R00071', name:"L'AMY" },
  { code:'R00078', name:'LUXOTTICA' },
  { code:'R00079', name:'MARCHON' },
  { code:'R00080', name:'MARCOLIN' },
  { code:'R00087', name:'MENRAD' },
  { code:'R01286', name:'COMO SAS' },
  { code:'R00095', name:'ODLM' },
  { code:'R00099', name:'OPAL' },
  { code:'R00117', name:'SAFILO' },
  { code:'R01064', name:'SEAPORT' },
  { code:'R01285', name:'VISIOPTIS' },
  { code:'R00124', name:'VUARNET' },
  { code:'R01785', name:'FRENCH RETRO' },
  { code:'R00863', name:'GROSFILLEY FRANCE' },
  { code:'G05137', name:'CCO' },
];

let brandSettings = [
  { marque:'Rip Curl',          fournisseurCode:'R00001', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.08,   rfa:0.125,  remiseEnseigne:0.40, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Rip Curl',          fournisseurCode:'R00001', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.08,   rfa:0.125,  remiseEnseigne:0.35, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Mauboussin',        fournisseurCode:'R00001', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0.015,  remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Mauboussin',        fournisseurCode:'R00001', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0,      rfa:0.015,  remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Cebe',              fournisseurCode:'R00020', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.08,   rfa:0.0722, remiseEnseigne:0.20, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:"CEBE N'EST PLUS REFERENCE CHEZ BOLLE, NOUVELLE STE SOUS LE NOM DE CEBE" },
  { marque:'Bolle',             fournisseurCode:'R00020', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.08,   rfa:0.0722, remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Esprit',            fournisseurCode:'R00028', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.07,   rfa:0.09,   remiseEnseigne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Esprit',            fournisseurCode:'R00028', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.07,   rfa:0.09,   remiseEnseigne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Elle',              fournisseurCode:'R00028', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.07,   rfa:0.09,   remiseEnseigne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Elle',              fournisseurCode:'R00028', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.07,   rfa:0.09,   remiseEnseigne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Police',            fournisseurCode:'R00039', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.10,   rfa:0.08,   remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Police',            fournisseurCode:'R00039', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.10,   rfa:0.08,   remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Julbo',             fournisseurCode:'R00066', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.12,   rfa:0.0614, remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco 45€ minimum',                        commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Gucci',             fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'5% maximum du CA Net Facture Annuel' },
  { marque:'Gucci',             fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'' },
  { marque:'Chloe',             fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'5% maximum du CA Net Facture Annuel' },
  { marque:'Chloe',             fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'' },
  { marque:'Puma',              fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.10,   rfa:0,      remiseEnseigne:0.20, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'' },
  { marque:'Saint Laurent',     fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'Ajout centralisation e-commerce' },
  { marque:'MontBlanc',         fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:false, conditionsLivraison:'Au reel',                                   commentaire:'Ajout centralisation e-commerce' },
  { marque:'Maui Jim',          fournisseurCode:'R01554', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.04,   rfa:0,      remiseEnseigne:0.04, repriseEchange:true,  conditionsLivraison:'Franco internet / Franco 300€ magasin',     commentaire:'3% RFA si volume 30pcs atteint' },
  { marque:'Ray-Ban',           fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.08,   rfa:0,      remiseEnseigne:0.08, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Ray-Ban',           fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0,      rfa:0,      remiseEnseigne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Vogue',             fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.13,   rfa:0,      remiseEnseigne:0.13, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Vogue',             fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.13,   rfa:0,      remiseEnseigne:0.13, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Oakley',            fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0,      remiseEnseigne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Oakley',            fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0,      rfa:0,      remiseEnseigne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Burberry',          fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Dolce&Gabbana',     fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Persol',            fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Prada',             fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0,      remiseEnseigne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Plus de remise e-commerce - Mail Ludmila 22/07/2025' },
  { marque:'Prada',             fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0,      rfa:0,      remiseEnseigne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Plus de remise e-commerce - Mail Ludmila 22/07/2025' },
  { marque:'Versace',           fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Emporio Armani',    fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Michael Kors',      fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Swarovski',         fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Moncler',           fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0,      remiseEnseigne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Plus de remise e-commerce - Mail Ludmila 22/07/2025' },
  { marque:'Jimmy Choo',        fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Polo Ralph Lauren', fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Ralph Lauren',      fournisseurCode:'R00078', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0,      remiseEnseigne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Karl Lagerfeld',    fournisseurCode:'R00079', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0.0478, remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Lacoste',           fournisseurCode:'R00079', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.08,   rfa:0.0478, remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Calvin Klein',      fournisseurCode:'R00079', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.08,   rfa:0.0478, remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Nike',              fournisseurCode:'R00079', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.05,   rfa:0.0478, remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Longchamp',         fournisseurCode:'R00079', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0.0478, remiseEnseigne:0.15, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Diesel',            fournisseurCode:'R00080', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.12,   rfa:0,      remiseEnseigne:0.35, repriseEchange:true,  conditionsLivraison:'Franco 2 pces',                             commentaire:'' },
  { marque:'Adidas',            fournisseurCode:'R00080', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0.12,   remiseEnseigne:0.35, repriseEchange:true,  conditionsLivraison:'Franco 2 pces',                             commentaire:'' },
  { marque:'Guess',             fournisseurCode:'R00080', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.10,   rfa:0.12,   remiseEnseigne:0.35, repriseEchange:true,  conditionsLivraison:'Franco 2 pces',                             commentaire:'BAISSE RF 2023 DE 12% A 10%' },
  { marque:'Morgan',            fournisseurCode:'R00087', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.08,   rfa:0.121,  remiseEnseigne:0.40, repriseEchange:true,  conditionsLivraison:'Franco 5 pces',                             commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Morgan',            fournisseurCode:'R00087', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.08,   rfa:0.121,  remiseEnseigne:0.37, repriseEchange:true,  conditionsLivraison:'Franco 5 pces',                             commentaire:'' },
  { marque:'Carrera',           fournisseurCode:'R00117', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.1233, rfa:0,      remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Remise en fonction du CA opticien - plusieurs paliers' },
  { marque:'Boss',              fournisseurCode:'R00117', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.0733, rfa:0,      remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Hugo',              fournisseurCode:'R00117', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.0733, rfa:0,      remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Marc Jacobs',       fournisseurCode:'R00117', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.0733, rfa:0,      remiseEnseigne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Polaroid',          fournisseurCode:'R00117', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.1233, rfa:0,      remiseEnseigne:0.24, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Vuarnet',           fournisseurCode:'R00124', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Solaire', rf:0.08,   rfa:0.054,  remiseEnseigne:0.23, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'PAS DE VUARNET OPTIQUE EN 2023' },
  { marque:'Lancel',            fournisseurCode:'R00863', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0,      remiseEnseigne:0.12, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'Mail Clemence 18/12/2024' },
  { marque:'Banana Moon',       fournisseurCode:'R01285', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0.08,   rfa:0,      remiseEnseigne:0.40, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'FRENCH RETRO',      fournisseurCode:'R01785', type:'Montures', segAttrCode:'optique_solaire', segAttrValue:'Optique', rf:0,      rfa:0,      remiseEnseigne:0.30, repriseEchange:true,  conditionsLivraison:'Franco - regroupement reassorts 1x/semaine', commentaire:'RF ET RFA 2021 MAJ PAR NC' },
];

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

function applyBrandConditionFields(product) {
  if (typeof getBrandInfoForProduct !== 'function') return;
  const b = getBrandInfoForProduct(product);
  if (!b) return;
  const f = product.fields;
  if (b.remiseEnseigne !== undefined && b.remiseEnseigne !== null && b.remiseEnseigne !== '') {
    f.remiseEnseigne = String(parseFloat((Number(b.remiseEnseigne) * 100).toFixed(4)));
  }
}

function computeCalcFields(product) {
  const f = product.fields;
  const forced = product.forcedFields || {};
  applyBrandConditionFields(product);

  const eventAttrs = attributes.filter(a => a.formula && isEventFormula(a.formula));
  if (!product._watchPrev) product._watchPrev = {};

  const calcAttrs = attributes.filter(a =>
    (a.calc || a.formula) && a.formula && !isEventFormula(a.formula)
  );
  // Deux passes pour gérer les dépendances entre champs calculés
  for (let pass = 0; pass < 2; pass++) {
    calcAttrs.forEach(attr => {
      // Une valeur forcée au niveau du produit prime sur la formule
      f[attr.code] = Object.prototype.hasOwnProperty.call(forced, attr.code)
        ? forced[attr.code]
        : evaluateFormula(attr.formula, f);
    });
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

  return f;
}

// ============================================================
// COHERENCE DES DONNEES PRODUITS
// Un champ à formule n'a pas de valeur stockée, elle est recalculée à
// chaque rendu. Les formules DATE_MAJ font exception : leur valeur est
// l'information elle-même. Toute clé d'attribut absente est posée à ''.
// ============================================================
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
      if (a.formula && !isEventFormula(a.formula)) {
        if (a.code in p.fields) { delete p.fields[a.code]; corrige = true; }
      } else if (!(a.code in p.fields)) {
        p.fields[a.code] = '';
        corrige = true;
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
  { id:1, name:'Montures',    code:'monture',    color:'#4fc3f7', groupIds:[1,2,3,4,5,6]   },
  { id:2, name:'Lentilles',   code:'lentille',   color:'#66bb6a', groupIds:[1,2,7,8] },
  { id:3, name:'Accessoires', code:'accessoire', color:'#ffa726', groupIds:[1,2,11]         },
  { id:4, name:'PEL',         code:'pel',        color:'#ef5350', groupIds:[1,2,12,8]          },
];

// ============================================================
// ROLES & COMPTES
// ============================================================
const ADMIN_MODULES = [
  { key: 'mod_categories', label: 'Categories'              },
  { key: 'mod_groups',     label: "Groupes d'attributs"     },
  { key: 'mod_attributes', label: 'Attributs'               },
  { key: 'mod_synthese',   label: 'Vue Synthese'            },
  { key: 'mod_conditions', label: 'Conditions commerciales' },
  { key: 'mod_roles',      label: 'Roles & Permissions'     },
  { key: 'mod_prefs',      label: 'Preferences'             },
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

function grantPermsForNewCategory(cat) {
  if (!cat) return;
  roles.forEach(role => {
    if (!role.perms) role.perms = {};
    if (role.id === 1) role.perms['cat_' + cat.id] = permFull();
    else if (role.id === 3) role.perms['cat_' + cat.id] = permRead();
    else role.perms['cat_' + cat.id] = permNone();
  });
}

let roles = [
  { id:1, name:'Admin Systeme', okta:'OctoPIM_Admin_Systeme', mode:'Manuel',      perms: defaultPermsForRole(1) },
  { id:2, name:'Admin Achats',  okta:'OctoPIM_Admin_Achats',  mode:'Manuel',      perms: defaultPermsForRole(2) },
  { id:3, name:'Consultation',  okta:'OctoPIM_Consultation',  mode:'Automatique', perms: defaultPermsForRole(3) },
  { id:4, name:'Users Achats',  okta:'OctoPIM_Users_Achats',  mode:'Automatique', perms: defaultPermsForRole(4) },
];

let users = [
  { id:1, name:'J. Doe',     initials:'JD', roleId:1, color:'#1565c0' },
  { id:2, name:'A. Martin',  initials:'AM', roleId:2, color:'#2e7d32' },
  { id:3, name:'C. Leroy',   initials:'CL', roleId:3, color:'#6a1b9a' },
  { id:4, name:'U. Bernard', initials:'UB', roleId:4, color:'#e65100' },
];

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
    fields:{ sap:'M906342000001', ean:'08056262500675', nom:'Monture Vogue VO4279S', miseEnLigne:'15/03/2025',
             marque:'Vogue', fournisseur_code:'R00078', ref_monture:'VO4279S', couleur:'Noir',
             optique_solaire:'Optique', matiere:'Acetate', cerclage:'Cercle', forme:'Rectangulaire',
             largeur_verres:'54', code_douanier:'9003190000', pa_interne:'45', remise:'10', rfa:'2', prix_catalogue:'180',
             active_o:'Oui', active_l:'Non', date_maj_statut:'15/03/2025' } },
  { id:2,  cat:'Lentilles',   createdAt:'28/02/2025', maj:'02/07/2025 09:15', visualSrc:null, visuals:0,
    history:[
      { ts:'02/07/2025 09:15', user:'J. Doe', field:'Prix de vente', old:'30', new:'35' },
    ], pendingChanges:[],
    fields:{ sap:'M906343000001', ean:'08056262500668', nom:'Lentille Aosept Plus', miseEnLigne:'01/03/2025',
             marque:'Alcon', laboratoire:'Alcon', nb_lentilles:'90', type_lentille:'Souple',
             type_vision:'Spherique', renouvellement:'Journalier', materiau_lentille:'Silicone Hydrogel',
             type_usage:'Correctrices', defauts_visuels:'Hypermetropie / Myopie',
             hydrophilie:'38', filtre_uv:'Oui', sensibilite_o2:'140', teinte_manip:'Oui',
             prix_vente:'35',
             active_o:'Oui', active_l:'Oui', date_maj_statut:'01/03/2025' } },
  { id:3, cat:'Montures',    createdAt:'01/03/2025', maj:'01/07/2025 11:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'M906344000001', ean:'08056262500637', nom:'Solaire Ray-Ban RB3025',
             marque:'Ray-Ban', fournisseur_code:'R00078', ref_monture:'RB3025', couleur:'Or',
             optique_solaire:'Solaire', matiere:'Metal', cerclage:'Cercle', forme:'Aviateur',
             largeur_verres:'58',
             code_douanier:'9004100000', pa_interne:'60', remise:'15', rfa:'3',
             active_o:'Non', active_l:'Non', date_maj_statut:'12/05/2025' } },
  { id:4,  cat:'Accessoires', createdAt:'26/02/2025', maj:'30/06/2025 08:45', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'M906345000001', ean:'08056262500620', nom:'Accessoire Etui rigide',
             type_produit_acc:'Etui', coefficient:'2.5',
             active_o:'Non', active_l:'Non', date_maj_statut:'08/04/2025' } },
  { id:5,  cat:'Montures',    createdAt:'02/04/2025', maj:'03/07/2025 16:20', visualSrc:null, visuals:1,
    history:[
      { ts:'03/07/2025 16:20', user:'J. Doe', field:'Taille',        old:'',          new:'M'          },
      { ts:'10/04/2025 08:00', user:'J. Doe', field:'Mise en ligne', old:'',          new:'10/04/2025' },
    ], pendingChanges:[],
    fields:{ sap:'M906346000001', ean:'08056262361245', nom:'Monture Oakley OX8046', miseEnLigne:'10/04/2025',
             marque:'Oakley', fournisseur_code:'R00078', ref_monture:'OX8046', couleur:'Gris',
             optique_solaire:'Optique', matiere:'Metal', cerclage:'Semi-cercle', forme:'Rectangulaire',
             code_douanier:'9003190000', cible:'Homme', largeur_verres:'50', pa_interne:'55', remise:'12', rfa:'2',
             prix_catalogue:'220', active_o:'Oui', active_l:'Oui', date_maj_statut:'10/04/2025' } },
  { id:6,  cat:'Montures',    createdAt:'26/02/2025', maj:'28/06/2025 10:10', visualSrc:null, visuals:0,
    history:[
      { ts:'28/06/2025 10:10', user:'J. Doe', field:'Couleur', old:'Bleu', new:'Rose' },
    ], pendingChanges:[],
    fields:{ sap:'M906347000001', ean:'08056262471586', nom:'Monture Vogue VO3987', miseEnLigne:'05/03/2025',
             marque:'Vogue', fournisseur_code:'R00078', ref_monture:'VO3987', couleur:'Rose',
             optique_solaire:'Optique', matiere:'Acetate', cerclage:'Cercle', forme:'Papillon',
             largeur_verres:'45',
             code_douanier:'9003190000', pa_interne:'42', remise:'10', rfa:'2', prix_catalogue:'165',
             active_o:'Non', active_l:'Non', date_maj_statut:'05/03/2025' } },
  { id:7,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL001', ean:'', nom:'Aosept Plus 360ml', miseEnLigne:'',
             code_produit:'PEL001', laboratoire:'Alcon', marque:'Aosept Plus',
             conditionnement:'360 ml', type_pel:'Produits d entretien', type_solution:'Oxydant',
             prix_vente:'', active_o:'Non', active_l:'Non', date_maj_statut:'25/08/2026' } },
  { id:8,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL002', ean:'', nom:'Aosept Plus HydraGlyde 360ml', miseEnLigne:'', prix_vente:'',
             active_o:'Non', active_l:'Non', date_maj_statut:'25/08/2026' } },
  { id:9,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL003', ean:'', nom:'Optifree Puremoist 300ml', miseEnLigne:'', prix_vente:'',
             active_o:'Non', active_l:'Non', date_maj_statut:'25/08/2026' } },
  { id:10, cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL004', ean:'', nom:'Biotrue 300ml', miseEnLigne:'', prix_vente:'',
             active_o:'Non', active_l:'Non', date_maj_statut:'25/08/2026' } },
  { id:11, cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL005', ean:'', nom:'Renu MPS 360ml', miseEnLigne:'', prix_vente:'',
             active_o:'Non', active_l:'Non', date_maj_statut:'25/08/2026' } },
];

// ============================================================
// COMPTEURS AUTO-INCREMENT
// ============================================================
let nextAttrId     = 82;
let nextCatId      = 6;
let nextGroupId    = 13;
let nextProductId  = 12;
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
      Object.fromEntries(Object.entries(colFilters).map(([k,v]) => [k, [...v]]))
    )),
    catFilter:     (document.getElementById('filter-cat') || {}).value || '',
    searchVal:     (document.getElementById('products-search') || {}).value || '',
    view:          currentView,
    syntheseItems: JSON.parse(JSON.stringify(syntheseItems)),
  };
}
