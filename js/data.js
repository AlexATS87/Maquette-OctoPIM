// ============================================================
// DATA.JS
// ============================================================
let seuilCompletion = 80;

// ============================================================
// GROUPES D'ATTRIBUTS
// ============================================================
let attrGroups = [
  { id: 1,  name: 'Informations generales',      code: 'infos_generales',      system: true,  attrIds: [1, 2, 3, 4, 5, 54, 55, 56, 57] },
  { id: 2,  name: 'Visuels',                      code: 'visuels',              system: true,  attrIds: [58, 59, 60, 61, 62] },
  { id: 3,  name: 'Marque',                        code: 'marque',               system: false, attrIds: [6] },
  { id: 4,  name: 'Caracteristiques monture',      code: 'caract_monture',       system: false, attrIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
  { id: 5,  name: 'Tarification monture',          code: 'tarif_monture',        system: false, attrIds: [18, 19, 20, 21, 22, 23, 24, 25] },
  { id: 6,  name: 'SEO',                           code: 'seo',                  system: false, attrIds: [26, 27, 28, 29] },
  { id: 7,  name: 'Caracteristiques lentille',     code: 'caract_lentille',      system: false, attrIds: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 63, 64, 65, 66] },
  { id: 8,  name: 'Tarification lentille',         code: 'tarif_lentille',       system: false, attrIds: [42, 43, 67, 68] },
  { id: 9,  name: 'Logistique lentille',           code: 'logistique_lentille',  system: false, attrIds: [44, 45, 46] },
  { id: 10, name: 'SEO lentille',                  code: 'seo_lentille',         system: false, attrIds: [47, 48, 49, 50] },
  { id: 11, name: 'Caracteristiques accessoire',   code: 'caract_accessoire',    system: false, attrIds: [51, 52] }
];

// ============================================================
// ATTRIBUTS
// ============================================================
let attributes = [
  // --- Informations generales ---
  { id: 1,  name: 'Code SAP',             code: 'sap',             type: 'Texte',          groupId: 1,  required: true,  calc: false, formula: '', showInSynth: false },
  { id: 2,  name: 'Code EAN',             code: 'ean',             type: 'Texte',          groupId: 1,  required: true,  calc: false, formula: '', showInSynth: false },
  { id: 3,  name: 'Nom produit',          code: 'nom',             type: 'Texte',          groupId: 1,  required: true,  calc: false, formula: '', showInSynth: false, clickToOpen: true },
  { id: 4,  name: 'Date de creation',     code: 'created_at',      type: 'Date',           groupId: 1,  required: false, calc: false, formula: '', readonly: true,    showInSynth: false },
  { id: 5,  name: 'Date de derniere MAJ', code: 'updated_at',      type: 'Date',           groupId: 1,  required: false, calc: false, formula: '', readonly: true,    showInSynth: false },
  { id: 54, name: 'Activation O',         code: 'activation_o',    type: 'Simple select',  groupId: 1,  required: false, calc: false, formula: '', showInSynth: false,
    options: ['Active', 'Desactive', 'En attente'] },
  { id: 55, name: 'Activation L',         code: 'activation_l',    type: 'Simple select',  groupId: 1,  required: false, calc: false, formula: '', showInSynth: false,
    options: ['Active', 'Desactive', 'En attente'] },
  { id: 56, name: 'A destocker',          code: 'a_destocker',     type: 'Simple select',  groupId: 1,  required: false, calc: false, formula: '', showInSynth: false,
    options: ['Oui', 'Non'] },
  { id: 57, name: 'Active',               code: 'active_global',   type: 'Simple select',  groupId: 1,  required: false, calc: true,  showInSynth: true,
    formula: '=SI([activation_o]=="Active" OU [activation_l]=="Active")',
    formulaLabel: 'Active si Activation O ou Activation L = Active',
    options: ['Active', 'Desactive'] },

  // --- Marque ---
  { id: 6, name: 'Marque', code: 'marque', type: 'Simple select', groupId: 3, required: true, calc: false, formula: '', showInSynth: false,
    options: ['Vogue','Ray-Ban','Oakley','Alcon','Bausch & Lomb','Essilor','Carrera','Boss','Lacoste','Calvin Klein','Gucci','Chloe','Prada','Versace','Emporio Armani','Michael Kors','Dolce&Gabbana','Persol','Burberry','Moncler','Jimmy Choo','Polo Ralph Lauren','Ralph Lauren','Swarovski','Police','Diesel','Guess','Adidas','Karl Lagerfeld','Nike','Longchamp','Esprit','Elle','Julbo','Morgan','Rip Curl','Mauboussin','Cebe','Bolle'] },

  // --- Caracteristiques monture ---
  { id: 7,  name: 'Reference monture',  code: 'ref_monture',      type: 'Texte',         groupId: 4, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 8,  name: 'Nom marketing',      code: 'nom_marketing',    type: 'Texte calcule', groupId: 4, required: false, calc: true,
    formula: '=[marque]+[ref_monture]+[couleur]', formulaLabel: 'Marque + Reference monture + Couleur', showInSynth: false },
  { id: 9,  name: 'Cible',              code: 'cible',            type: 'Simple select', groupId: 4, required: false, calc: false, formula: '', showInSynth: false,
    options: ['Homme','Femme','Mixte','Enfant','Junior'] },
  { id: 10, name: 'Optique / Solaire',  code: 'optique_solaire',  type: 'Simple select', groupId: 4, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Optique','Solaire'] },
  { id: 11, name: 'Matiere',            code: 'matiere',          type: 'Simple select', groupId: 4, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Acetate','Metal','Titane','Plastique','Bois','Carbone'] },
  { id: 12, name: 'Cerclage',           code: 'cerclage',         type: 'Simple select', groupId: 4, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Cercle','Semi-cercle','Sans cerclage','Nylor'] },
  { id: 13, name: 'Couleur',            code: 'couleur',          type: 'Texte',         groupId: 4, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 14, name: 'Taille',             code: 'taille',           type: 'Simple select', groupId: 4, required: false, calc: false, formula: '', showInSynth: false,
    options: ['XS','S','M','L','XL','Ado','Enfant'] },
  { id: 15, name: 'Forme de la monture',code: 'forme',            type: 'Simple select', groupId: 4, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Ronde','Carree','Rectangulaire','Ovale','Papillon','Aviateur','Clubmaster'] },
  { id: 16, name: 'Code douanier',      code: 'code_douanier',    type: 'Texte',         groupId: 4, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 17, name: 'Commentaire',        code: 'commentaire',      type: 'Texte long',    groupId: 4, required: false, calc: false, formula: '', showInSynth: false },

  // --- Tarification monture ---
  { id: 18, name: 'Prix catalogue',   code: 'prix_catalogue', type: 'Nombre',          groupId: 5, required: false, calc: false, formula: '', showInSynth: false },
  { id: 19, name: 'PA ATS',           code: 'pa_ats',         type: 'Nombre',          groupId: 5, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 20, name: 'Remise sur facture',code: 'remise',        type: 'Nombre',          groupId: 5, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 21, name: 'RFA',              code: 'rfa',            type: 'Nombre',          groupId: 5, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 22, name: 'Marge ATS',        code: 'marge_ats',      type: 'Nombre calcule',  groupId: 5, required: false, calc: true,
    formula: '=[pa_ats]*(1-[remise]/100)*(1+[rfa]/100)', formulaLabel: 'PA ATS x (1 - Remise/100) x (1 + RFA/100)', showInSynth: false },
  { id: 23, name: 'PA opticien',      code: 'pa_opticien',    type: 'Nombre calcule',  groupId: 5, required: false, calc: true,
    formula: '=[pa_ats]*(1-[remise]/100)', formulaLabel: 'PA ATS x (1 - Remise/100)', showInSynth: false },
  { id: 24, name: 'Prix final arrondi',code: 'prix_final',    type: 'Nombre calcule',  groupId: 5, required: false, calc: true,
    formula: '=[pa_opticien]*2', formulaLabel: 'PA opticien x 2', showInSynth: false },
  { id: 25, name: 'Taux de marque',   code: 'taux_marque',    type: 'Nombre calcule',  groupId: 5, required: false, calc: true,
    formula: '=([prix_final]-[pa_opticien])/[prix_final]*100', formulaLabel: '(Prix final - PA opticien) / Prix final x 100', showInSynth: false },

  // --- SEO (anciennement SEO monture) ---
  { id: 26, name: 'Titre SEO O',       code: 'seo_titre_o',      type: 'Texte calcule', groupId: 6, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },
  { id: 27, name: 'Description SEO O', code: 'seo_desc_o',       type: 'Texte calcule', groupId: 6, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },
  { id: 28, name: 'Titre SEO L',       code: 'seo_titre_l',      type: 'Texte calcule', groupId: 6, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },
  { id: 29, name: 'Description SEO L', code: 'seo_desc_l',       type: 'Texte calcule', groupId: 6, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },

  // --- Caracteristiques lentille ---
  { id: 30, name: 'Laboratoire',           code: 'laboratoire',       type: 'Simple select', groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Alcon','Bausch & Lomb','CooperVision','Johnson & Johnson','Menicon'] },
  { id: 31, name: 'Nb lentilles par boite',code: 'nb_lentilles',      type: 'Simple select', groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['1','6','10','30','90'] },
  { id: 32, name: 'Type de lentille',      code: 'type_lentille',     type: 'Simple select', groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Souple','Rigide','Torique','Multifocale','Coloree'] },
  { id: 33, name: 'Couleur lentille',      code: 'couleur_lentille',  type: 'Texte',         groupId: 7, required: false, calc: false, formula: '', showInSynth: false },
  { id: 34, name: 'Type de vision',        code: 'type_vision',       type: 'Simple select', groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Myopie','Hypermetropie','Presbytie','Astigmatisme'] },
  { id: 35, name: 'Renouvellement',        code: 'renouvellement',    type: 'Simple select', groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Journalier','Bi-hebdomadaire','Mensuel','Trimestriel','Annuel'] },
  { id: 36, name: 'Materiau lentille',     code: 'materiau_lentille', type: 'Simple select', groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Hydrogel','Silicone hydrogel','PMMA','RGP'] },
  { id: 37, name: 'Hydrophilie',           code: 'hydrophilie',       type: 'Nombre',        groupId: 7, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 38, name: 'Filtre UV',             code: 'filtre_uv',         type: 'Oui / Non',     groupId: 7, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 39, name: 'Sensibilite a l oxygene',code:'sensibilite_o2',    type: 'Nombre',        groupId: 7, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 40, name: 'Teinte de manipulation',code: 'teinte_manip',      type: 'Oui / Non',     groupId: 7, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 41, name: 'Defauts visuels',       code: 'defauts_visuels',   type: 'Multi select',  groupId: 7, required: true,  calc: false, formula: '', showInSynth: false,
    options: ['Myopie','Hypermetropie','Presbytie','Astigmatisme','Amblyopie'] },
  { id: 63, name: 'Type de produit',       code: 'type_produit',      type: 'Simple select', groupId: 7, required: false, calc: false, formula: '', showInSynth: false,
    options: ['Correction','Esthetique','Therapeutique'] },
  { id: 64, name: 'Type de solution',      code: 'type_solution',     type: 'Simple select', groupId: 7, required: false, calc: false, formula: '', showInSynth: false,
    options: ['Multifonction','Peroxyde','Saline','Enzymatique'] },
  { id: 65, name: 'Conditionnement',       code: 'conditionnement',   type: 'Simple select', groupId: 7, required: false, calc: false, formula: '', showInSynth: false,
    options: ['Boite','Flacon','Sachet','Blister','Unite'] },
  { id: 66, name: 'Duree de conservation', code: 'duree_conservation',type: 'Simple select', groupId: 7, required: false, calc: false, formula: '', showInSynth: false,
    options: ['30 jours','60 jours','90 jours','120 jours','180 jours','365 jours','1 dose = 1 utilisation'] },

  // --- Tarification lentille ---
  { id: 42, name: 'Prix de vente',  code: 'prix_vente', type: 'Nombre',         groupId: 8, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 43, name: 'Prix TVA',       code: 'prix_tva',   type: 'Nombre calcule', groupId: 8, required: false, calc: true,
    formula: '=[prix_vente]*1.055', formulaLabel: 'Prix de vente x 1.055 (TVA 5.5%)', showInSynth: false },
  { id: 67, name: 'Prix Achat ATS',    code: 'pa_ats_lentille',    type: 'Nombre', groupId: 8, required: false, calc: false, formula: '', showInSynth: false },
  { id: 68, name: 'Prix Achat Magasin',code: 'pa_magasin_lentille',type: 'Nombre', groupId: 8, required: false, calc: false, formula: '', showInSynth: false },

  // --- Logistique lentille (anciens attributs repositionnes) ---
  { id: 44, name: 'Duree de conservation (ancien)', code: 'duree_conservation_old', type: 'Simple select', groupId: 9, required: false, calc: false, formula: '', showInSynth: false,
    options: ['30 jours','60 jours','90 jours','120 jours','180 jours','365 jours','1 dose = 1 utilisation'] },
  { id: 45, name: 'Type de solution (ancien)', code: 'type_solution_old', type: 'Simple select', groupId: 9, required: false, calc: false, formula: '', showInSynth: false,
    options: ['Multifonction','Peroxyde','Saline','Enzymatique'] },
  { id: 46, name: 'Type (ancien)',     code: 'type_produit_old',  type: 'Simple select', groupId: 9, required: false, calc: false, formula: '', showInSynth: false,
    options: ['Correction','Esthetique','Therapeutique'] },

  // --- SEO lentille ---
  { id: 47, name: 'Titre SEO O',       code: 'seo_titre_o_l',  type: 'Texte calcule', groupId: 10, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },
  { id: 48, name: 'Description SEO O', code: 'seo_desc_o_l',   type: 'Texte calcule', groupId: 10, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },
  { id: 49, name: 'Titre SEO L',       code: 'seo_titre_l_l',  type: 'Texte calcule', groupId: 10, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },
  { id: 50, name: 'Description SEO L', code: 'seo_desc_l_l',   type: 'Texte calcule', groupId: 10, required: false, calc: true, formula: '', formulaLabel: 'Formule a definir', showInSynth: false },

  // --- Caracteristiques accessoire ---
  { id: 51, name: 'Type de produit accessoire', code: 'type_produit_acc', type: 'Texte',   groupId: 11, required: false, calc: false, formula: '', showInSynth: false },
  { id: 52, name: 'Coefficient',                code: 'coefficient',      type: 'Nombre',  groupId: 11, required: false, calc: false, formula: '', showInSynth: false },

  // --- Visuels (groupe 2 — type Image) ---
  { id: 58, name: 'Vue de face',          code: 'img_face',     type: 'Image', groupId: 2, required: true,  calc: false, formula: '', showInSynth: true  },
  { id: 59, name: 'Vue 3/4',              code: 'img_trois_quarts', type: 'Image', groupId: 2, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 60, name: 'Profil',               code: 'img_profil',   type: 'Image', groupId: 2, required: true,  calc: false, formula: '', showInSynth: false },
  { id: 61, name: 'Visuel ambiance',      code: 'img_ambiance', type: 'Image', groupId: 2, required: false, calc: false, formula: '', showInSynth: false },
  { id: 62, name: 'Visuel fournisseur',   code: 'img_fournisseur', type: 'Image', groupId: 2, required: false, calc: false, formula: '', showInSynth: false },

  // --- Etat visuel (calcule, visible en synth) ---
  { id: 69, name: 'Etat visuel', code: 'etat_visuel', type: 'Texte calcule', groupId: 1, required: false, calc: true, showInSynth: true,
    formula: '=SI([img_face]!="" ET [img_trois_quarts]!="" ET [img_profil]!="")',
    formulaLabel: 'Oui si les 3 visuels obligatoires sont renseignes, sinon Non' }
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
    } catch (e) { return ''; }
  }

  try {
    const result = Function('"use strict";return (' + expr + ')')();
    if (isNaN(result) || !isFinite(result)) return '';
    return parseFloat(result.toFixed(4)).toString();
  } catch (e) { return ''; }
}

function evalCondition(expr, fields) {
  let e = expr.replace(/VRAI/gi, 'true').replace(/FAUX/gi, 'false');
  e = e.replace(/\[([^\]]+)\]/g, (match, code) => {
    const val = (fields[code] || '').toString().trim().toLowerCase();
    if (val === 'oui' || val === 'true' || val === 'active') return 'true';
    if (val === 'non' || val === 'false' || val === 'desactive') return 'false';
    return `"${val}"`;
  });
  e = e.replace(/!=""/g, '!=""').replace(/==""/g, '==""');
  e = e.replace(/\bOU\b/gi, '||').replace(/\bET\b/gi, '&&');
  try { return !!Function('"use strict";return (' + e + ')')(); }
  catch (err) { return false; }
}

function computeCalcFields(product) {
  const f = product.fields;
  // Calculs numeriques monture
  const pa = parseFloat(f.pa_ats) || 0, rem = parseFloat(f.remise) || 0, rfa = parseFloat(f.rfa) || 0, pv = parseFloat(f.prix_vente) || 0;
  f.pa_opticien  = pa > 0 ? (pa * (1 - rem / 100)).toFixed(2) : '';
  f.marge_ats    = pa > 0 ? (pa * (1 - rem / 100) * (1 + rfa / 100)).toFixed(2) : '';
  const paOpt = parseFloat(f.pa_opticien) || 0;
  f.prix_final   = paOpt > 0 ? (paOpt * 2).toFixed(2) : '';
  const pf = parseFloat(f.prix_final) || 0;
  f.taux_marque  = pf > 0 ? ((pf - paOpt) / pf * 100).toFixed(1) : '';
  f.nom_marketing = [f.marque, f.ref_monture, f.couleur].filter(Boolean).join(' ') || '';
  f.prix_tva     = pv > 0 ? (pv * 1.055).toFixed(2) : '';
  // Champ calcule Active
  const actO = (f.activation_o || '').toLowerCase();
  const actL = (f.activation_l || '').toLowerCase();
  f.active_global = (actO === 'active' || actL === 'active') ? 'Active' : 'Desactive';
  // Etat visuel
  f.etat_visuel = (f.img_face && f.img_trois_quarts && f.img_profil) ? 'Oui' : 'Non';
  return f;
}

// ============================================================
// REFERENTIEL FOURNISSEURS / MARQUES
// ============================================================
let suppliers = [
  { code: 'R00001', name: 'ADCL' },
  { code: 'R00008', name: 'APLUS' },
  { code: 'R00020', name: 'BOLLE BRANDS' },
  { code: 'R01240', name: 'BLI-DBP' },
  { code: 'R00028', name: 'CHARMANT' },
  { code: 'R00039', name: 'DE RIGO' },
  { code: 'R00060', name: 'GRASSET' },
  { code: 'R00066', name: 'JULBO' },
  { code: 'R01554', name: 'KERING' },
  { code: 'R00071', name: "L'AMY" },
  { code: 'R00078', name: 'LUXOTTICA' },
  { code: 'R00079', name: 'MARCHON' },
  { code: 'R00080', name: 'MARCOLIN' },
  { code: 'R00087', name: 'MENRAD' },
  { code: 'R01286', name: 'COMO SAS' },
  { code: 'R00095', name: 'ODLM' },
  { code: 'R00099', name: 'OPAL' },
  { code: 'R00117', name: 'SAFILO' },
  { code: 'R01064', name: 'SEAPORT' },
  { code: 'R01285', name: 'VISIOPTIS' },
  { code: 'R00124', name: 'VUARNET' },
  { code: 'R01785', name: 'FRENCH RETRO' },
  { code: 'R00863', name: 'GROSFILLEY FRANCE' },
  { code: 'G05137', name: 'CCO' }
];

let brandSettings = [
  { marque: 'Rip Curl',        fournisseurCode: 'R00001', type: 'Optique',  rf: 0.08,   rfa: 0.125,  remiseAts: 0.40, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'Rip Curl',        fournisseurCode: 'R00001', type: 'Solaire',  rf: 0.08,   rfa: 0.125,  remiseAts: 0.35, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Mauboussin',      fournisseurCode: 'R00001', type: 'Optique',  rf: 0,      rfa: 0.015,  remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Mauboussin',      fournisseurCode: 'R00001', type: 'Solaire',  rf: 0,      rfa: 0.015,  remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Cebe',            fournisseurCode: 'R00020', type: 'Solaire',  rf: 0.08,   rfa: 0.0722, remiseAts: 0.20, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: "CEBE N'EST PLUS REFERENCE CHEZ BOLLE" },
  { marque: 'Bolle',           fournisseurCode: 'R00020', type: 'Solaire',  rf: 0.08,   rfa: 0.0722, remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Esprit',          fournisseurCode: 'R00028', type: 'Optique',  rf: 0.07,   rfa: 0.09,   remiseAts: 0.50, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'Esprit',          fournisseurCode: 'R00028', type: 'Solaire',  rf: 0.07,   rfa: 0.09,   remiseAts: 0.50, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Elle',            fournisseurCode: 'R00028', type: 'Optique',  rf: 0.07,   rfa: 0.09,   remiseAts: 0.50, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Elle',            fournisseurCode: 'R00028', type: 'Solaire',  rf: 0.07,   rfa: 0.09,   remiseAts: 0.50, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Police',          fournisseurCode: 'R00039', type: 'Optique',  rf: 0.10,   rfa: 0.08,   remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'Police',          fournisseurCode: 'R00039', type: 'Solaire',  rf: 0.10,   rfa: 0.08,   remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Julbo',           fournisseurCode: 'R00066', type: 'Solaire',  rf: 0.12,   rfa: 0.0614, remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco 45 EUR min',   commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'Gucci',           fournisseurCode: 'R01554', type: 'Optique',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: true,  conditionsLivraison: 'Au reel',             commentaire: '5% max du CA Net Facture Annuel' },
  { marque: 'Gucci',           fournisseurCode: 'R01554', type: 'Solaire',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: true,  conditionsLivraison: 'Au reel',             commentaire: '' },
  { marque: 'Chloe',           fournisseurCode: 'R01554', type: 'Optique',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: true,  conditionsLivraison: 'Au reel',             commentaire: '5% max du CA Net Facture Annuel' },
  { marque: 'Chloe',           fournisseurCode: 'R01554', type: 'Solaire',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: true,  conditionsLivraison: 'Au reel',             commentaire: '' },
  { marque: 'Puma',            fournisseurCode: 'R01554', type: 'Optique',  rf: 0.10,   rfa: 0,      remiseAts: 0.20, repriseEchange: true,  conditionsLivraison: 'Au reel',             commentaire: '' },
  { marque: 'Saint Laurent',   fournisseurCode: 'R01554', type: 'Optique',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: true,  conditionsLivraison: 'Au reel',             commentaire: 'Ajout centralisation e-commerce' },
  { marque: 'MontBlanc',       fournisseurCode: 'R01554', type: 'Optique',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: false, conditionsLivraison: 'Au reel',             commentaire: 'Ajout centralisation e-commerce' },
  { marque: 'Maui Jim',        fournisseurCode: 'R01554', type: 'Optique',  rf: 0.04,   rfa: 0,      remiseAts: 0.04, repriseEchange: true,  conditionsLivraison: 'Franco internet / Franco 300 EUR magasin', commentaire: '3% RFA si volume 30pcs atteint' },
  { marque: 'Ray-Ban',         fournisseurCode: 'R00078', type: 'Optique',  rf: 0.08,   rfa: 0,      remiseAts: 0.08, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Ray-Ban',         fournisseurCode: 'R00078', type: 'Solaire',  rf: 0,      rfa: 0,      remiseAts: 0,    repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Vogue',           fournisseurCode: 'R00078', type: 'Optique',  rf: 0.13,   rfa: 0,      remiseAts: 0.13, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Vogue',           fournisseurCode: 'R00078', type: 'Solaire',  rf: 0.13,   rfa: 0,      remiseAts: 0.13, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Oakley',          fournisseurCode: 'R00078', type: 'Optique',  rf: 0,      rfa: 0,      remiseAts: 0,    repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Oakley',          fournisseurCode: 'R00078', type: 'Solaire',  rf: 0,      rfa: 0,      remiseAts: 0,    repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Burberry',        fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Dolce&Gabbana',   fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Persol',          fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Prada',           fournisseurCode: 'R00078', type: 'Optique',  rf: 0,      rfa: 0,      remiseAts: 0,    repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: 'Plus de remise e-commerce' },
  { marque: 'Prada',           fournisseurCode: 'R00078', type: 'Solaire',  rf: 0,      rfa: 0,      remiseAts: 0,    repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: 'Plus de remise e-commerce' },
  { marque: 'Versace',         fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Emporio Armani',  fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Michael Kors',    fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Swarovski',       fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Moncler',         fournisseurCode: 'R00078', type: 'Optique',  rf: 0,      rfa: 0,      remiseAts: 0,    repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: 'Plus de remise e-commerce' },
  { marque: 'Jimmy Choo',      fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Polo Ralph Lauren',fournisseurCode:'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Ralph Lauren',    fournisseurCode: 'R00078', type: 'Optique',  rf: 0.05,   rfa: 0,      remiseAts: 0.05, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Karl Lagerfeld',  fournisseurCode: 'R00079', type: 'Optique',  rf: 0,      rfa: 0.0478, remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'Lacoste',         fournisseurCode: 'R00079', type: 'Optique',  rf: 0.08,   rfa: 0.0478, remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Calvin Klein',    fournisseurCode: 'R00079', type: 'Optique',  rf: 0.08,   rfa: 0.0478, remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Nike',            fournisseurCode: 'R00079', type: 'Optique',  rf: 0.05,   rfa: 0.0478, remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Longchamp',       fournisseurCode: 'R00079', type: 'Optique',  rf: 0,      rfa: 0.0478, remiseAts: 0.15, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Diesel',          fournisseurCode: 'R00080', type: 'Optique',  rf: 0.12,   rfa: 0,      remiseAts: 0.35, repriseEchange: true,  conditionsLivraison: 'Franco 2 pces',       commentaire: '' },
  { marque: 'Adidas',          fournisseurCode: 'R00080', type: 'Optique',  rf: 0,      rfa: 0.12,   remiseAts: 0.35, repriseEchange: true,  conditionsLivraison: 'Franco 2 pces',       commentaire: '' },
  { marque: 'Guess',           fournisseurCode: 'R00080', type: 'Optique',  rf: 0.10,   rfa: 0.12,   remiseAts: 0.35, repriseEchange: true,  conditionsLivraison: 'Franco 2 pces',       commentaire: 'BAISSE RF 2023 DE 12% A 10%' },
  { marque: 'Morgan',          fournisseurCode: 'R00087', type: 'Optique',  rf: 0.08,   rfa: 0.121,  remiseAts: 0.40, repriseEchange: true,  conditionsLivraison: 'Franco 5 pces',       commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'Morgan',          fournisseurCode: 'R00087', type: 'Solaire',  rf: 0.08,   rfa: 0.121,  remiseAts: 0.37, repriseEchange: true,  conditionsLivraison: 'Franco 5 pces',       commentaire: '' },
  { marque: 'Carrera',         fournisseurCode: 'R00117', type: 'Optique',  rf: 0.1233, rfa: 0,      remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: 'Remise en fonction du CA opticien' },
  { marque: 'Boss',            fournisseurCode: 'R00117', type: 'Optique',  rf: 0.0733, rfa: 0,      remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Hugo',            fournisseurCode: 'R00117', type: 'Optique',  rf: 0.0733, rfa: 0,      remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Marc Jacobs',     fournisseurCode: 'R00117', type: 'Optique',  rf: 0.0733, rfa: 0,      remiseAts: 0.20, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Polaroid',        fournisseurCode: 'R00117', type: 'Optique',  rf: 0.1233, rfa: 0,      remiseAts: 0.24, repriseEchange: false, conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Vuarnet',         fournisseurCode: 'R00124', type: 'Solaire',  rf: 0.08,   rfa: 0.054,  remiseAts: 0.23, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: 'PAS DE VUARNET OPTIQUE EN 2023' },
  { marque: 'Lancel',          fournisseurCode: 'R00863', type: 'Optique',  rf: 0,      rfa: 0,      remiseAts: 0.12, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: '' },
  { marque: 'Banana Moon',     fournisseurCode: 'R01285', type: 'Optique',  rf: 0.08,   rfa: 0,      remiseAts: 0.40, repriseEchange: true,  conditionsLivraison: 'Franco',              commentaire: 'RF ET RFA 2021 MAJ PAR NC' },
  { marque: 'FRENCH RETRO',    fournisseurCode: 'R01785', type: 'Optique',  rf: 0,      rfa: 0,      remiseAts: 0.30, repriseEchange: true,  conditionsLivraison: 'Franco - regroupement reassorts 1x/semaine', commentaire: 'RF ET RFA 2021 MAJ PAR NC' }
];

// ============================================================
// CATEGORIES
// ============================================================
let categories = [
  { id: 1, name: 'Montures',    code: 'monture',    color: '#4fc3f7', groupIds: [1, 2, 3, 4, 5, 6] },
  { id: 2, name: 'Lentilles',   code: 'lentille',   color: '#66bb6a', groupIds: [1, 2, 3, 7, 8, 9, 10] },
  { id: 3, name: 'Solaires',    code: 'solaire',    color: '#ab47bc', groupIds: [1, 2, 3, 4, 5, 6] },
  { id: 4, name: 'Accessoires', code: 'accessoire', color: '#ffa726', groupIds: [1, 2, 11] },
  { id: 5, name: 'PEL',         code: 'pel',        color: '#26c6da', groupIds: [1, 2, 3, 7, 8, 9, 10] }
];

// ============================================================
// ROLES
// ============================================================
let roles = [
  { id: 1, name: 'Admin Systeme', okta: 'OctoPIM_Admin_Systeme', mode: 'Manuel',     perms: {} },
  { id: 2, name: 'Admin Achats',  okta: 'OctoPIM_Admin_Achats',  mode: 'Manuel',     perms: {} },
  { id: 3, name: 'Consultation',  okta: 'OctoPIM_Consultation',  mode: 'Automatique',perms: {} },
  { id: 4, name: 'Users Achats',  okta: 'OctoPIM_Users_Achats',  mode: 'Automatique',perms: {} }
];

// ============================================================
// PRODUITS
// ============================================================
let products = [
  { id: 1, cat: 'Montures',    createdAt: '26/02/2025', maj: '04/07/2025 14:32', images: {}, history: [
      { ts: '04/07/2025 14:32', user: 'AB', field: 'PA ATS',       old: '40',  new: '45' },
      { ts: '15/03/2025 09:10', user: 'AB', field: 'Mise en ligne', old: '',   new: '15/03/2025' }
    ],
    fields: { sap: 'M906342000001', ean: '08056262500675', nom: 'Monture V VO4279S', miseEnLigne: '15/03/2025', marque: 'Vogue', ref_monture: 'VO4279S', couleur: 'Noir', optique_solaire: 'Optique', matiere: 'Acetate', cerclage: 'Cercle', forme: 'Rectangulaire', code_douanier: '9003190000', pa_ats: '45', remise: '10', rfa: '2', prix_catalogue: '180', activation_o: 'Active', activation_l: 'Desactive' }
  },
  { id: 2, cat: 'Lentilles',   createdAt: '28/02/2025', maj: '02/07/2025 09:15', images: {}, history: [
      { ts: '02/07/2025 09:15', user: 'SM', field: 'Prix de vente', old: '30', new: '35' }
    ],
    fields: { sap: 'M906343000001', ean: '08056262500668', nom: 'Lentille Aosept Plus', miseEnLigne: '01/03/2025', marque: 'Alcon', laboratoire: 'Alcon', nb_lentilles: '90', type_lentille: 'Souple', type_vision: 'Myopie', renouvellement: 'Journalier', materiau_lentille: 'Silicone hydrogel', hydrophilie: '38', filtre_uv: 'Oui', sensibilite_o2: '140', teinte_manip: 'Oui', defauts_visuels: 'Myopie', prix_vente: '35', activation_o: 'Active', activation_l: 'Active' }
  },
  { id: 3, cat: 'Solaires',    createdAt: '01/03/2025', maj: '01/07/2025 11:00', images: {}, history: [],
    fields: { sap: 'M906344000001', ean: '08056262500637', nom: 'Solaire RB RB3025', marque: 'Ray-Ban', ref_monture: 'RB3025', couleur: 'Or', optique_solaire: 'Solaire', matiere: 'Metal', cerclage: 'Cercle', forme: 'Aviateur', code_douanier: '9004100000', pa_ats: '60', remise: '15', rfa: '3', activation_o: 'Desactive', activation_l: 'Desactive' }
  },
  { id: 4, cat: 'Accessoires', createdAt: '26/02/2025', maj: '30/06/2025 08:45', images: {}, history: [],
    fields: { sap: 'M906345000001', ean: '08056262500620', nom: 'Accessoire Etui rigide', type_produit_acc: 'Etui', coefficient: '2.5', activation_o: 'Desactive', activation_l: 'Desactive' }
  },
  { id: 5, cat: 'Montures',    createdAt: '02/04/2025', maj: '03/07/2025 16:20', images: {}, history: [
      { ts: '03/07/2025 16:20', user: 'AB', field: 'Taille',        old: '',   new: 'M' },
      { ts: '10/04/2025 08:00', user: 'AB', field: 'Mise en ligne', old: '',   new: '10/04/2025' }
    ],
    fields: { sap: 'M906346000001', ean: '08056262361245', nom: 'Monture O OX8046', miseEnLigne: '10/04/2025', marque: 'Oakley', ref_monture: 'OX8046', couleur: 'Gris', optique_solaire: 'Optique', matiere: 'Metal', cerclage: 'Semi-cercle', forme: 'Rectangulaire', code_douanier: '9003190000', cible: 'Homme', taille: 'M', pa_ats: '55', remise: '12', rfa: '2', prix_catalogue: '220', activation_o: 'Active', activation_l: 'Active' }
  },
  { id: 6, cat: 'Montures',    createdAt: '26/02/2025', maj: '28/06/2025 10:10', images: {}, history: [
      { ts: '28/06/2025 10:10', user: 'SM', field: 'Couleur', old: 'Bleu', new: 'Rose' }
    ],
    fields: { sap: 'M906347000001', ean: '08056262471586', nom: 'Monture V VO3987', miseEnLigne: '05/03/2025', marque: 'Vogue', ref_monture: 'VO3987', couleur: 'Rose', optique_solaire: 'Optique', matiere: 'Acetate', cerclage: 'Cercle', forme: 'Papillon', code_douanier: '9003190000', pa_ats: '42', remise: '10', rfa: '2', prix_catalogue: '165', activation_o: 'Desactive', activation_l: 'Desactive' }
  },
  // Produits PEL issus du fichier fournisseur
  { id: 7,  cat: 'PEL', createdAt: '25/08/2026', maj: '25/08/2026 00:00', images: {}, history: [],
    fields: { sap: 'PEL001', ean: '', nom: 'Aosept Plus 360ml', marque: 'Alcon', laboratoire: 'Alcon', conditionnement: 'Flacon', type_produit: 'Therapeutique', type_solution: 'Peroxyde', duree_conservation: '90 jours', activation_o: 'Active', activation_l: 'Active' }
  },
  { id: 8,  cat: 'PEL', createdAt: '25/08/2026', maj: '25/08/2026 00:00', images: {}, history: [],
    fields: { sap: 'PEL002', ean: '', nom: 'Aosept Plus HydraGlyde 360ml', marque: 'Alcon', laboratoire: 'Alcon', conditionnement: 'Flacon', type_produit: 'Therapeutique', type_solution: 'Peroxyde', duree_conservation: '90 jours', activation_o: 'Active', activation_l: 'Active' }
  },
  { id: 9,  cat: 'PEL', createdAt: '25/08/2026', maj: '25/08/2026 00:00', images: {}, history: [],
    fields: { sap: 'PEL003', ean: '', nom: 'Optifree Puremoist 300ml', marque: 'Alcon', laboratoire: 'Alcon', conditionnement: 'Flacon', type_produit: 'Therapeutique', type_solution: 'Multifonction', duree_conservation: '90 jours', activation_o: 'Active', activation_l: 'Active' }
  },
  { id: 10, cat: 'PEL', createdAt: '25/08/2026', maj: '25/08/2026 00:00', images: {}, history: [],
    fields: { sap: 'PEL004', ean: '', nom: 'Biotrue 300ml', marque: 'Bausch & Lomb', laboratoire: 'Bausch & Lomb', conditionnement: 'Flacon', type_produit: 'Therapeutique', type_solution: 'Multifonction', duree_conservation: '90 jours', activation_o: 'Active', activation_l: 'Active' }
  },
  { id: 11, cat: 'PEL', createdAt: '25/08/2026', maj: '25/08/2026 00:00', images: {}, history: [],
    fields: { sap: 'PEL005', ean: '', nom: 'Renu MPS 360ml', marque: 'Bausch & Lomb', laboratoire: 'Bausch & Lomb', conditionnement: 'Flacon', type_produit: 'Therapeutique', type_solution: 'Multifonction', duree_conservation: '90 jours', activation_o: 'Active', activation_l: 'Active' }
  }
];

let nextAttrId = 70, nextCatId = 6, nextGroupId = 12, nextProductId = 12;
let editingCatId = null, editingGroupId = null, pendingDelete = null;
let currentProductId = null, currentView = 'synth';
let selectedProductIds = [], compareMode = false;
let activeGroupFilters = null;
let colFilters = {};
let activeColFilterDropdown = null;
