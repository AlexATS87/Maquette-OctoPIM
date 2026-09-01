// ============================================================
// DATA.JS
// ============================================================

// ============================================================
// PREFERENCES APPLICATION
// ============================================================
let appPrefs = {
  pageSize: 50, // Nombre de produits par page (0 = illimité)
};

let seuilCompletion = 80;
let productDirty = false;
let pendingNavTarget = null;

// ============================================================
// GROUPE SYNTHESE — figé, transversal, non déplaçable
// ============================================================
// Chaque élément est soit un attribut { kind:'attr', code:'...' }
// soit une action { kind:'action', code:'delete', label:'Suppr.' }
let syntheseItems = [
  { kind: 'action', code: 'delete',     label: 'Suppr.'      },
  { kind: 'attr',   code: 'visuel_face', label: 'Visuel'     },
  { kind: 'attr',   code: 'sap',         label: 'Code SAP'   },
  { kind: 'attr',   code: 'ean',         label: 'Code EAN'   },
  { kind: 'attr',   code: 'nom',         label: 'Nom produit'},
  { kind: 'attr',   code: 'cat',         label: 'Categorie'  },
  { kind: 'attr',   code: 'createdAt',   label: 'Date creation'},
  { kind: 'attr',   code: 'miseEnLigne', label: 'Mise en ligne'},
  { kind: 'attr',   code: 'completion',  label: 'Completion' },
  { kind: 'attr',   code: 'maj',         label: 'Derniere MAJ'},
];

// ============================================================
// GROUPES D'ATTRIBUTS
// ============================================================
let attrGroups = [
  { id:1,  name:'Informations generales',      code:'infos_generales',       system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[1,2,3,4,5,53] },
  { id:2,  name:'Visuels',                     code:'visuels',               system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[54,55,56,57,58] },
  { id:3,  name:'Marque',                      code:'marque',                system:false, isSynthGroup:false, isBrandGroup:true,  attrIds:[6] },
  { id:4,  name:'Caracteristiques monture',    code:'caract_monture',        system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[7,8,9,10,11,12,13,14,15,16,17] },
  { id:5,  name:'Tarification monture',        code:'tarif_monture',         system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[18,19,20,21,22,23,24,25] },
  { id:6,  name:'SEO monture',                 code:'seo_monture',           system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[26,27,28,29] },
  { id:7,  name:'Caracteristiques lentille',   code:'caract_lentille',       system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[30,31,32,33,34,35,36,37,38,39,40,41] },
  { id:8,  name:'Tarification lentille',       code:'tarif_lentille',        system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[42,43] },
  { id:9,  name:'Logistique lentille',         code:'logistique_lentille',   system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[44,45,46] },
  { id:10, name:'SEO lentille',                code:'seo_lentille',          system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[47,48,49,50] },
  { id:11, name:'Caracteristiques accessoire', code:'caract_accessoire',     system:false, isSynthGroup:false, isBrandGroup:false, attrIds:[51,52] },
];

// ============================================================
// ATTRIBUTS
// mask : syntaxe Access — A=lettre, 9=chiffre, *=alphanum
// ex: 'A999999999999' pour code SAP
// ============================================================
let attributes = [
  { id:1,  name:'Code SAP',         code:'sap',              type:'Texte',           groupId:1,  required:true,  calc:false, formula:'', mask:'A999999999999', showInSynth:true,  clickToOpen:false },
  { id:2,  name:'Code EAN',         code:'ean',              type:'Texte',           groupId:1,  required:true,  calc:false, formula:'', mask:'99999999999999', showInSynth:true,  clickToOpen:false },
  { id:3,  name:'Nom produit',      code:'nom',              type:'Texte',           groupId:1,  required:true,  calc:false, formula:'', mask:'',              showInSynth:true,  clickToOpen:true  },
  { id:4,  name:'Date de creation', code:'created_at',       type:'Date',            groupId:1,  required:false, calc:false, formula:'', mask:'',              readonly:true,     showInSynth:false, clickToOpen:false },
  { id:5,  name:'Date de derniere MAJ', code:'updated_at',   type:'Date',            groupId:1,  required:false, calc:false, formula:'', mask:'',              readonly:true,     showInSynth:false, clickToOpen:false },
  { id:53, name:'Active',           code:'active_global',    type:'Texte calcule',   groupId:1,  required:false, calc:true,
    formula:'=SI([active_o2]==VRAI OU [active_lissac]==VRAI OU [active_audio2000]==VRAI)',
    formulaLabel:'Actif si au moins un canal est active (O2, Lissac, Audio 2000)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:6,  name:'Marque',           code:'marque',           type:'Simple select',   groupId:3,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false,
    options:['Vogue','Ray-Ban','Oakley','Alcon','Bausch & Lomb','Essilor','Carrera','Boss','Lacoste','Calvin Klein','Gucci','Chloe','Prada','Versace','Emporio Armani','Michael Kors','Dolce&Gabbana','Persol','Burberry','Moncler','Jimmy Choo','Polo Ralph Lauren','Ralph Lauren','Swarovski','Police','Diesel','Guess','Adidas','Karl Lagerfeld','Nike','Longchamp','Esprit','Elle','Julbo','Morgan','Rip Curl','Mauboussin','Cebe','Bolle'] },
  { id:7,  name:'Reference monture',   code:'ref_monture',   type:'Texte',           groupId:4,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:8,  name:'Nom marketing',       code:'nom_marketing', type:'Texte calcule',   groupId:4,  required:false, calc:true,
    formula:'=[marque]+[ref_monture]+[couleur]', formulaLabel:'Marque + Reference monture + Couleur',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:9,  name:'Cible',               code:'cible',         type:'Simple select',   groupId:4,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Homme','Femme','Mixte','Enfant','Junior'] },
  { id:10, name:'Optique / Solaire',   code:'optique_solaire',type:'Simple select',  groupId:4,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Optique','Solaire'] },
  { id:11, name:'Matiere',             code:'matiere',       type:'Simple select',   groupId:4,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Acetate','Metal','Titane','Plastique','Bois','Carbone'] },
  { id:12, name:'Cerclage',            code:'cerclage',      type:'Simple select',   groupId:4,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Cercle','Semi-cercle','Sans cerclage','Nylor'] },
  { id:13, name:'Couleur',             code:'couleur',       type:'Texte',           groupId:4,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:14, name:'Taille',              code:'taille',        type:'Simple select',   groupId:4,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['XS','S','M','L','XL','Ado','Enfant'] },
  { id:15, name:'Forme de la monture', code:'forme',         type:'Simple select',   groupId:4,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Ronde','Carree','Rectangulaire','Ovale','Papillon','Aviateur','Clubmaster'] },
  { id:16, name:'Code douanier',       code:'code_douanier', type:'Texte',           groupId:4,  required:true,  calc:false, formula:'', mask:'99999999', showInSynth:false, clickToOpen:false },
  { id:17, name:'Commentaire',         code:'commentaire',   type:'Texte long',      groupId:4,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:18, name:'Prix catalogue',      code:'prix_catalogue',type:'Nombre',          groupId:5,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:19, name:'pa interne',              code:'pa_interne',        type:'Nombre',          groupId:5,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:20, name:'Remise sur facture',  code:'remise',        type:'Nombre',          groupId:5,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:21, name:'RFA',                 code:'rfa',           type:'Nombre',          groupId:5,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:22, name:'marge interne',           code:'marge_interne',     type:'Nombre calcule',  groupId:5,  required:false, calc:true,
    formula:'=[pa_interne]*(1-[remise]/100)*(1+[rfa]/100)', formulaLabel:'pa interne x (1 - Remise/100) x (1 + RFA/100)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:23, name:'PA opticien',         code:'pa_opticien',   type:'Nombre calcule',  groupId:5,  required:false, calc:true,
    formula:'=[pa_interne]*(1-[remise]/100)', formulaLabel:'pa interne x (1 - Remise/100)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:24, name:'Prix final arrondi',  code:'prix_final',    type:'Nombre calcule',  groupId:5,  required:false, calc:true,
    formula:'=[pa_opticien]*2', formulaLabel:'PA opticien x 2',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:25, name:'Taux de marque',      code:'taux_marque',   type:'Nombre calcule',  groupId:5,  required:false, calc:true,
    formula:'=([prix_final]-[pa_opticien])/[prix_final]*100', formulaLabel:'(Prix final - PA opticien) / Prix final x 100',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:26, name:'Titre SEO Optic 2000',      code:'seo_titre_o2000',  type:'Texte calcule', groupId:6,  required:false, calc:true, formula:'', formulaLabel:'Formule a definir avec equipe e-commerce', mask:'', showInSynth:false, clickToOpen:false },
  { id:27, name:'Description SEO Optic 2000',code:'seo_desc_o2000',   type:'Texte calcule', groupId:6,  required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:28, name:'Titre SEO Lissac',          code:'seo_titre_lissac', type:'Texte calcule', groupId:6,  required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:29, name:'Description SEO Lissac',    code:'seo_desc_lissac',  type:'Texte calcule', groupId:6,  required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:30, name:'Laboratoire',         code:'laboratoire',   type:'Simple select',   groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Alcon','Bausch & Lomb','CooperVision','Johnson & Johnson','Menicon'] },
  { id:31, name:'Nb lentilles par boite', code:'nb_lentilles', type:'Simple select', groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['1','6','10','30','90'] },
  { id:32, name:'Type de lentille',    code:'type_lentille', type:'Simple select',   groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Souple','Rigide','Torique','Multifocale','Coloree'] },
  { id:33, name:'Couleur lentille',    code:'couleur_lentille', type:'Texte',        groupId:7,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:34, name:'Type de vision',      code:'type_vision',   type:'Simple select',   groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Myopie','Hypermetropie','Presbytie','Astigmatisme'] },
  { id:35, name:'Renouvellement',      code:'renouvellement',type:'Simple select',   groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Journalier','Bi-hebdomadaire','Mensuel','Trimestriel','Annuel'] },
  { id:36, name:'Materiau lentille',   code:'materiau_lentille', type:'Simple select', groupId:7, required:true, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Hydrogel','Silicone hydrogel','PMMA','RGP'] },
  { id:37, name:'Hydrophilie',         code:'hydrophilie',   type:'Nombre',          groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:38, name:'Filtre UV',           code:'filtre_uv',     type:'Oui / Non',       groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:39, name:'Sensibilite a l oxygene', code:'sensibilite_o2', type:'Nombre',     groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:40, name:'Teinte de manipulation', code:'teinte_manip', type:'Oui / Non',     groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:41, name:'Defauts visuels',     code:'defauts_visuels', type:'Multi select',  groupId:7,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Myopie','Hypermetropie','Presbytie','Astigmatisme','Amblyopie'] },
  { id:42, name:'Prix de vente',       code:'prix_vente',    type:'Nombre',          groupId:8,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:43, name:'Prix TVA',            code:'prix_tva',      type:'Nombre calcule',  groupId:8,  required:false, calc:true,
    formula:'=[prix_vente]*1.055', formulaLabel:'Prix de vente x 1.055 (TVA 5.5%)',
    mask:'', showInSynth:false, clickToOpen:false },
  { id:44, name:'Duree de conservation', code:'duree_conservation', type:'Texte',    groupId:9,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:45, name:'Type de solution',    code:'type_solution', type:'Simple select',   groupId:9,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Multifonction','Peroxyde','Saline','Enzymatique'] },
  { id:46, name:'Type',                code:'type_produit_lentille', type:'Simple select', groupId:9, required:true, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false, options:['Correction','Esthetique','Therapeutique'] },
  { id:47, name:'Titre SEO Optic 2000',       code:'seo_titre_o2000_l',  type:'Texte calcule', groupId:10, required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:48, name:'Description SEO Optic 2000', code:'seo_desc_o2000_l',   type:'Texte calcule', groupId:10, required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:49, name:'Titre SEO Lissac',           code:'seo_titre_lissac_l', type:'Texte calcule', groupId:10, required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:50, name:'Description SEO Lissac',     code:'seo_desc_lissac_l',  type:'Texte calcule', groupId:10, required:false, calc:true, formula:'', formulaLabel:'Formule a definir', mask:'', showInSynth:false, clickToOpen:false },
  { id:51, name:'Type de produit',     code:'type_produit_acc', type:'Texte',        groupId:11, required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:52, name:'Coefficient',         code:'coefficient',   type:'Nombre',          groupId:11, required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:54, name:'Vue de face',         code:'visuel_face',   type:'Image',           groupId:2,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:55, name:'Vue 3/4',             code:'visuel_tq',     type:'Image',           groupId:2,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:56, name:'Vue de profil',       code:'visuel_profil', type:'Image',           groupId:2,  required:true,  calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:57, name:'Visuel ambiance',     code:'visuel_ambiance', type:'Image',         groupId:2,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
  { id:58, name:'Visuel fournisseur',  code:'visuel_fournisseur', type:'Image',      groupId:2,  required:false, calc:false, formula:'', mask:'', showInSynth:false, clickToOpen:false },
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
  { marque:'Rip Curl',       fournisseurCode:'R00001', type:'Optique', rf:0.08,   rfa:0.125,  remiseinterne:0.40, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Rip Curl',       fournisseurCode:'R00001', type:'Solaire', rf:0.08,   rfa:0.125,  remiseinterne:0.35, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Mauboussin',     fournisseurCode:'R00001', type:'Optique', rf:0,      rfa:0.015,  remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Mauboussin',     fournisseurCode:'R00001', type:'Solaire', rf:0,      rfa:0.015,  remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Cebe',           fournisseurCode:'R00020', type:'Solaire', rf:0.08,   rfa:0.0722, remiseinterne:0.20, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:"CEBE N'EST PLUS REFERENCE CHEZ BOLLE, NOUVELLE STE SOUS LE NOM DE CEBE" },
  { marque:'Bolle',          fournisseurCode:'R00020', type:'Solaire', rf:0.08,   rfa:0.0722, remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Esprit',         fournisseurCode:'R00028', type:'Optique', rf:0.07,   rfa:0.09,   remiseinterne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Esprit',         fournisseurCode:'R00028', type:'Solaire', rf:0.07,   rfa:0.09,   remiseinterne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Elle',           fournisseurCode:'R00028', type:'Optique', rf:0.07,   rfa:0.09,   remiseinterne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Elle',           fournisseurCode:'R00028', type:'Solaire', rf:0.07,   rfa:0.09,   remiseinterne:0.50, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Police',         fournisseurCode:'R00039', type:'Optique', rf:0.10,   rfa:0.08,   remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Police',         fournisseurCode:'R00039', type:'Solaire', rf:0.10,   rfa:0.08,   remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Julbo',          fournisseurCode:'R00066', type:'Solaire', rf:0.12,   rfa:0.0614, remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco 45€ minimum',                        commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Gucci',          fournisseurCode:'R01554', type:'Optique', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'5% maximum du CA Net Facture Annuel' },
  { marque:'Gucci',          fournisseurCode:'R01554', type:'Solaire', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'' },
  { marque:'Chloe',          fournisseurCode:'R01554', type:'Optique', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'5% maximum du CA Net Facture Annuel' },
  { marque:'Chloe',          fournisseurCode:'R01554', type:'Solaire', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'' },
  { marque:'Puma',           fournisseurCode:'R01554', type:'Optique', rf:0.10,   rfa:0,      remiseinterne:0.20, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'' },
  { marque:'Saint Laurent',  fournisseurCode:'R01554', type:'Optique', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:true,  conditionsLivraison:'Au reel',                                   commentaire:'Ajout centralisation e-commerce' },
  { marque:'MontBlanc',      fournisseurCode:'R01554', type:'Optique', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:false, conditionsLivraison:'Au reel',                                   commentaire:'Ajout centralisation e-commerce' },
  { marque:'Maui Jim',       fournisseurCode:'R01554', type:'Optique', rf:0.04,   rfa:0,      remiseinterne:0.04, repriseEchange:true,  conditionsLivraison:'Franco internet / Franco 300€ magasin',     commentaire:'3% RFA si volume 30pcs atteint' },
  { marque:'Ray-Ban',        fournisseurCode:'R00078', type:'Optique', rf:0.08,   rfa:0,      remiseinterne:0.08, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Ray-Ban',        fournisseurCode:'R00078', type:'Solaire', rf:0,      rfa:0,      remiseinterne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Vogue',          fournisseurCode:'R00078', type:'Optique', rf:0.13,   rfa:0,      remiseinterne:0.13, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Vogue',          fournisseurCode:'R00078', type:'Solaire', rf:0.13,   rfa:0,      remiseinterne:0.13, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Oakley',         fournisseurCode:'R00078', type:'Optique', rf:0,      rfa:0,      remiseinterne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Oakley',         fournisseurCode:'R00078', type:'Solaire', rf:0,      rfa:0,      remiseinterne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Burberry',       fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Dolce&Gabbana',  fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Persol',         fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Prada',          fournisseurCode:'R00078', type:'Optique', rf:0,      rfa:0,      remiseinterne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Plus de remise e-commerce - Mail Ludmila 22/07/2025' },
  { marque:'Prada',          fournisseurCode:'R00078', type:'Solaire', rf:0,      rfa:0,      remiseinterne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Plus de remise e-commerce - Mail Ludmila 22/07/2025' },
  { marque:'Versace',        fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Emporio Armani', fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Michael Kors',   fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Swarovski',      fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Moncler',        fournisseurCode:'R00078', type:'Optique', rf:0,      rfa:0,      remiseinterne:0,    repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Plus de remise e-commerce - Mail Ludmila 22/07/2025' },
  { marque:'Jimmy Choo',     fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Polo Ralph Lauren', fournisseurCode:'R00078', type:'Optique', rf:0.05, rfa:0,     remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                   commentaire:'' },
  { marque:'Ralph Lauren',   fournisseurCode:'R00078', type:'Optique', rf:0.05,   rfa:0,      remiseinterne:0.05, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Karl Lagerfeld', fournisseurCode:'R00079', type:'Optique', rf:0,      rfa:0.0478, remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Lacoste',        fournisseurCode:'R00079', type:'Optique', rf:0.08,   rfa:0.0478, remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Calvin Klein',   fournisseurCode:'R00079', type:'Optique', rf:0.08,   rfa:0.0478, remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Nike',           fournisseurCode:'R00079', type:'Optique', rf:0.05,   rfa:0.0478, remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Longchamp',      fournisseurCode:'R00079', type:'Optique', rf:0,      rfa:0.0478, remiseinterne:0.15, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Diesel',         fournisseurCode:'R00080', type:'Optique', rf:0.12,   rfa:0,      remiseinterne:0.35, repriseEchange:true,  conditionsLivraison:'Franco 2 pces',                             commentaire:'' },
  { marque:'Adidas',         fournisseurCode:'R00080', type:'Optique', rf:0,      rfa:0.12,   remiseinterne:0.35, repriseEchange:true,  conditionsLivraison:'Franco 2 pces',                             commentaire:'' },
  { marque:'Guess',          fournisseurCode:'R00080', type:'Optique', rf:0.10,   rfa:0.12,   remiseinterne:0.35, repriseEchange:true,  conditionsLivraison:'Franco 2 pces',                             commentaire:'BAISSE RF 2023 DE 12% A 10%' },
  { marque:'Morgan',         fournisseurCode:'R00087', type:'Optique', rf:0.08,   rfa:0.121,  remiseinterne:0.40, repriseEchange:true,  conditionsLivraison:'Franco 5 pces',                             commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'Morgan',         fournisseurCode:'R00087', type:'Solaire', rf:0.08,   rfa:0.121,  remiseinterne:0.37, repriseEchange:true,  conditionsLivraison:'Franco 5 pces',                             commentaire:'' },
  { marque:'Carrera',        fournisseurCode:'R00117', type:'Optique', rf:0.1233, rfa:0,      remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'Remise en fonction du CA opticien - plusieurs paliers' },
  { marque:'Boss',           fournisseurCode:'R00117', type:'Optique', rf:0.0733, rfa:0,      remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Hugo',           fournisseurCode:'R00117', type:'Optique', rf:0.0733, rfa:0,      remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Marc Jacobs',    fournisseurCode:'R00117', type:'Optique', rf:0.0733, rfa:0,      remiseinterne:0.20, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Polaroid',       fournisseurCode:'R00117', type:'Optique', rf:0.1233, rfa:0,      remiseinterne:0.24, repriseEchange:false, conditionsLivraison:'Franco',                                    commentaire:'' },
  { marque:'Vuarnet',        fournisseurCode:'R00124', type:'Solaire', rf:0.08,   rfa:0.054,  remiseinterne:0.23, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'PAS DE VUARNET OPTIQUE EN 2023' },
  { marque:'Lancel',         fournisseurCode:'R00863', type:'Optique', rf:0,      rfa:0,      remiseinterne:0.12, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'Mail Clemence 18/12/2024' },
  { marque:'Banana Moon',    fournisseurCode:'R01285', type:'Optique', rf:0.08,   rfa:0,      remiseinterne:0.40, repriseEchange:true,  conditionsLivraison:'Franco',                                    commentaire:'RF ET RFA 2021 MAJ PAR NC' },
  { marque:'FRENCH RETRO',   fournisseurCode:'R01785', type:'Optique', rf:0,      rfa:0,      remiseinterne:0.30, repriseEchange:true,  conditionsLivraison:'Franco - regroupement reassorts 1x/semaine', commentaire:'RF ET RFA 2021 MAJ PAR NC' },
];

// ============================================================
// MOTEUR DE FORMULES
// ============================================================
function evalFormula(formula, fields) {
  if (!formula || !formula.startsWith('=')) return '';
  let expr = formula.slice(1).trim();
  if (expr.toUpperCase().startsWith('SI(')) {
    const inner = expr.slice(3, expr.lastIndexOf(')'));
    return evalCondition(inner, fields) ? 'Oui' : 'Non';
  }
  expr = expr.replace(/\[([^\]]+)\]/g, (match, code) => {
    const val = fields[code];
    if (val === undefined || val === null || val === '') return '0';
    const n = parseFloat(val);
    return isNaN(n) ? `"${val}"` : String(n);
  });
  if (expr.includes('"')) {
    try {
      const parts = expr.split('+').map(p => p.trim().replace(/^"|"$/g, ''));
      return parts.filter(p => p !== '0' && p !== '').join(' ');
    } catch(e) { return ''; }
  }
  try {
    const result = Function('"use strict";return (' + expr + ')')();
    if (isNaN(result) || !isFinite(result)) return '';
    return parseFloat(result.toFixed(4)).toString();
  } catch(e) { return ''; }
}

function evalCondition(expr, fields) {
  let e = expr.replace(/VRAI/gi, 'true').replace(/FAUX/gi, 'false');
  e = e.replace(/\[([^\]]+)\]/g, (match, code) => {
    const val = (fields[code] || '').toString().trim().toLowerCase();
    if (val === 'oui' || val === 'true') return 'true';
    if (val === 'non' || val === 'false') return 'false';
    return `"${val}"`;
  });
  e = e.replace(/\bOU\b/gi, '||').replace(/\bET\b/gi, '&&');
  try { return !!Function('"use strict";return (' + e + ')')(); }
  catch(err) { return false; }
}

function computeCalcFields(product) {
  const f = product.fields;
  attributes.filter(a => a.calc && a.formula && a.formula.startsWith('=')).forEach(attr => {
    f[attr.code] = evalFormula(attr.formula, f);
  });
  const pa = parseFloat(f.pa_interne) || 0;
  const rem = parseFloat(f.remise) || 0;
  const rfa = parseFloat(f.rfa) || 0;
  const pv  = parseFloat(f.prix_vente) || 0;
  f.pa_opticien  = pa > 0 ? (pa * (1 - rem / 100)).toFixed(2) : '';
  f.marge_interne    = pa > 0 ? (pa * (1 - rem / 100) * (1 + rfa / 100)).toFixed(2) : '';
  const paOpt    = parseFloat(f.pa_opticien) || 0;
  f.prix_final   = paOpt > 0 ? (paOpt * 2).toFixed(2) : '';
  const pf       = parseFloat(f.prix_final) || 0;
  f.taux_marque  = pf > 0 ? ((pf - paOpt) / pf * 100).toFixed(1) : '';
  f.nom_marketing = [f.marque, f.ref_monture, f.couleur].filter(Boolean).join(' ') || '';
  f.prix_tva     = pv > 0 ? (pv * 1.055).toFixed(2) : '';
  return f;
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
  { id:2, name:'Lentilles',   code:'lentille',   color:'#66bb6a', groupIds:[1,2,3,7,8,9,10] },
  { id:3, name:'Solaires',    code:'solaire',    color:'#ab47bc', groupIds:[1,2,3,4,5,6]   },
  { id:4, name:'Accessoires', code:'accessoire', color:'#ffa726', groupIds:[1,2,11]         },
  { id:5, name:'PEL',         code:'pel',        color:'#ef5350', groupIds:[1,2,8]          },
];

// ============================================================
// ROLES
// ============================================================
let roles = [
  { id:1, name:'Admin Systeme', okta:'OctoPIM_Admin_Systeme', mode:'Manuel',     perms:{} },
  { id:2, name:'Admin Achats',  okta:'OctoPIM_Admin_Achats',  mode:'Manuel',     perms:{} },
  { id:3, name:'Consultation',  okta:'OctoPIM_Consultation',  mode:'Automatique',perms:{} },
  { id:4, name:'Users Achats',  okta:'OctoPIM_Users_Achats',  mode:'Automatique',perms:{} },
];

// Profil courant simulé — 'admin' voit les codes techniques, 'user' ne les voit pas
const currentUserRole = 'admin'; // 'admin' | 'user'

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
             code_douanier:'9003190000', pa_interne:'45', remise:'10', rfa:'2', prix_catalogue:'180',
             active_o2:'Oui', active_lissac:'Non', active_audio2000:'Non' } },
  { id:2,  cat:'Lentilles',   createdAt:'28/02/2025', maj:'02/07/2025 09:15', visualSrc:null, visuals:0,
    history:[
      { ts:'02/07/2025 09:15', user:'J. Doe', field:'Prix de vente', old:'30', new:'35' },
    ], pendingChanges:[],
    fields:{ sap:'M906343000001', ean:'08056262500668', nom:'Lentille Aosept Plus', miseEnLigne:'01/03/2025',
             marque:'Alcon', laboratoire:'Alcon', nb_lentilles:'90', type_lentille:'Souple',
             type_vision:'Myopie', renouvellement:'Journalier', materiau_lentille:'Silicone hydrogel',
             hydrophilie:'38', filtre_uv:'Oui', sensibilite_o2:'140', teinte_manip:'Oui',
             defauts_visuels:'Myopie', prix_vente:'35',
             active_o2:'Oui', active_lissac:'Oui', active_audio2000:'Non' } },
  { id:3,  cat:'Solaires',    createdAt:'01/03/2025', maj:'01/07/2025 11:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'M906344000001', ean:'08056262500637', nom:'Solaire Ray-Ban RB3025',
             marque:'Ray-Ban', fournisseur_code:'R00078', ref_monture:'RB3025', couleur:'Or',
             optique_solaire:'Solaire', matiere:'Metal', cerclage:'Cercle', forme:'Aviateur',
             code_douanier:'9004100000', pa_interne:'60', remise:'15', rfa:'3',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:4,  cat:'Accessoires', createdAt:'26/02/2025', maj:'30/06/2025 08:45', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'M906345000001', ean:'08056262500620', nom:'Accessoire Etui rigide',
             type_produit_acc:'Etui', coefficient:'2.5',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:5,  cat:'Montures',    createdAt:'02/04/2025', maj:'03/07/2025 16:20', visualSrc:null, visuals:1,
    history:[
      { ts:'03/07/2025 16:20', user:'J. Doe', field:'Taille',        old:'',          new:'M'          },
      { ts:'10/04/2025 08:00', user:'J. Doe', field:'Mise en ligne', old:'',          new:'10/04/2025' },
    ], pendingChanges:[],
    fields:{ sap:'M906346000001', ean:'08056262361245', nom:'Monture Oakley OX8046', miseEnLigne:'10/04/2025',
             marque:'Oakley', fournisseur_code:'R00078', ref_monture:'OX8046', couleur:'Gris',
             optique_solaire:'Optique', matiere:'Metal', cerclage:'Semi-cercle', forme:'Rectangulaire',
             code_douanier:'9003190000', cible:'Homme', taille:'M', pa_interne:'55', remise:'12', rfa:'2',
             prix_catalogue:'220', active_o2:'Oui', active_lissac:'Oui', active_audio2000:'Oui' } },
  { id:6,  cat:'Montures',    createdAt:'26/02/2025', maj:'28/06/2025 10:10', visualSrc:null, visuals:0,
    history:[
      { ts:'28/06/2025 10:10', user:'J. Doe', field:'Couleur', old:'Bleu', new:'Rose' },
    ], pendingChanges:[],
    fields:{ sap:'M906347000001', ean:'08056262471586', nom:'Monture Vogue VO3987', miseEnLigne:'05/03/2025',
             marque:'Vogue', fournisseur_code:'R00078', ref_monture:'VO3987', couleur:'Rose',
             optique_solaire:'Optique', matiere:'Acetate', cerclage:'Cercle', forme:'Papillon',
             code_douanier:'9003190000', pa_interne:'42', remise:'10', rfa:'2', prix_catalogue:'165',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:7,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL001', ean:'', nom:'Aosept Plus 360ml', miseEnLigne:'', prix_vente:'',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:8,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL002', ean:'', nom:'Aosept Plus HydraGlyde 360ml', miseEnLigne:'', prix_vente:'',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:9,  cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL003', ean:'', nom:'Optifree Puremoist 300ml', miseEnLigne:'', prix_vente:'',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:10, cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL004', ean:'', nom:'Biotrue 300ml', miseEnLigne:'', prix_vente:'',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
  { id:11, cat:'PEL', createdAt:'25/08/2026', maj:'25/08/2026 00:00', visualSrc:null, visuals:0,
    history:[], pendingChanges:[],
    fields:{ sap:'PEL005', ean:'', nom:'Renu MPS 360ml', miseEnLigne:'', prix_vente:'',
             active_o2:'Non', active_lissac:'Non', active_audio2000:'Non' } },
];

// ============================================================
// COMPTEURS AUTO-INCREMENT
// ============================================================
let nextAttrId     = 59;
let nextCatId      = 6;
let nextGroupId    = 12;
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
