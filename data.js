let seuilCompletion=80;
let attrGroups=[
  {id:1,name:'Informations generales',code:'infos_generales',system:true,attrIds:[1,2,3,4,5]},
  {id:2,name:'Visuels',code:'visuels',system:true,attrIds:[]},
  {id:3,name:'Marque',code:'marque',system:false,attrIds:[6]},
  {id:4,name:'Caracteristiques monture',code:'caract_monture',system:false,attrIds:[7,8,9,10,11,12,13,14,15,16,17]},
  {id:5,name:'Tarification monture',code:'tarif_monture',system:false,attrIds:[18,19,20,21,22,23,24,25]},
  {id:6,name:'SEO monture',code:'seo_monture',system:false,attrIds:[26,27,28,29]},
  {id:7,name:'Caracteristiques lentille',code:'caract_lentille',system:false,attrIds:[30,31,32,33,34,35,36,37,38,39,40,41]},
  {id:8,name:'Tarification lentille',code:'tarif_lentille',system:false,attrIds:[42,43]},
  {id:9,name:'Logistique lentille',code:'logistique_lentille',system:false,attrIds:[44,45,46]},
  {id:10,name:'SEO lentille',code:'seo_lentille',system:false,attrIds:[47,48,49,50]},
  {id:11,name:'Caracteristiques accessoire',code:'caract_accessoire',system:false,attrIds:[51,52]}
];
let attributes=[
  {id:1,name:'Code SAP',code:'sap',type:'Texte',groupId:1,required:true,calc:false,formula:''},
  {id:2,name:'Code EAN',code:'ean',type:'Texte',groupId:1,required:true,calc:false,formula:''},
  {id:3,name:'Nom produit',code:'nom',type:'Texte',groupId:1,required:true,calc:false,formula:''},
  {id:4,name:'Date de creation',code:'created_at',type:'Date',groupId:1,required:false,calc:false,formula:'',readonly:true},
  {id:5,name:'Date de derniere MAJ',code:'updated_at',type:'Date',groupId:1,required:false,calc:false,formula:'',readonly:true},
  {id:6,name:'Marque',code:'marque',type:'Simple select',groupId:3,required:true,calc:false,formula:'',options:['Vogue','Ray-Ban','Oakley','Alcon','Bausch & Lomb','Essilor']},
  {id:7,name:'Reference monture',code:'ref_monture',type:'Texte',groupId:4,required:true,calc:false,formula:''},
  {id:8,name:'Nom marketing',code:'nom_marketing',type:'Texte calcule',groupId:4,required:false,calc:true,formula:'marque+ref_monture+couleur',formulaLabel:'Marque + Reference monture + Couleur'},
  {id:9,name:'Cible',code:'cible',type:'Simple select',groupId:4,required:false,calc:false,formula:'',options:['Homme','Femme','Mixte','Enfant','Junior']},
  {id:10,name:'Optique / Solaire',code:'optique_solaire',type:'Simple select',groupId:4,required:true,calc:false,formula:'',options:['Optique','Solaire']},
  {id:11,name:'Matiere',code:'matiere',type:'Simple select',groupId:4,required:true,calc:false,formula:'',options:['Acetate','Metal','Titane','Plastique','Bois','Carbone']},
  {id:12,name:'Cerclage',code:'cerclage',type:'Simple select',groupId:4,required:true,calc:false,formula:'',options:['Cercle','Semi-cercle','Sans cerclage','Nylor']},
  {id:13,name:'Couleur',code:'couleur',type:'Texte',groupId:4,required:true,calc:false,formula:''},
  {id:14,name:'Taille',code:'taille',type:'Simple select',groupId:4,required:false,calc:false,formula:'',options:['XS','S','M','L','XL','Ado','Enfant']},
  {id:15,name:'Forme de la monture',code:'forme',type:'Simple select',groupId:4,required:true,calc:false,formula:'',options:['Ronde','Carree','Rectangulaire','Ovale','Papillon','Aviateur','Clubmaster']},
  {id:16,name:'Code douanier',code:'code_douanier',type:'Texte',groupId:4,required:true,calc:false,formula:''},
  {id:17,name:'Commentaire',code:'commentaire',type:'Texte long',groupId:4,required:false,calc:false,formula:''},
  {id:18,name:'Prix catalogue',code:'prix_catalogue',type:'Nombre',groupId:5,required:false,calc:false,formula:''},
  {id:19,name:'PA ATS',code:'pa_ats',type:'Nombre',groupId:5,required:true,calc:false,formula:''},
  {id:20,name:'Remise sur facture',code:'remise',type:'Nombre',groupId:5,required:true,calc:false,formula:''},
  {id:21,name:'RFA',code:'rfa',type:'Nombre',groupId:5,required:true,calc:false,formula:''},
  {id:22,name:'Marge ATS',code:'marge_ats',type:'Nombre calcule',groupId:5,required:false,calc:true,formula:'pa_ats*(1-remise/100)*(1+rfa/100)',formulaLabel:'PA ATS x (1 - Remise/100) x (1 + RFA/100)'},
  {id:23,name:'PA opticien',code:'pa_opticien',type:'Nombre calcule',groupId:5,required:false,calc:true,formula:'pa_ats*(1-remise/100)',formulaLabel:'PA ATS x (1 - Remise/100)'},
  {id:24,name:'Prix final arrondi',code:'prix_final',type:'Nombre calcule',groupId:5,required:false,calc:true,formula:'pa_opticien*2',formulaLabel:'PA opticien x 2'},
  {id:25,name:'Taux de marque',code:'taux_marque',type:'Nombre calcule',groupId:5,required:false,calc:true,formula:'(prix_final-pa_opticien)/prix_final*100',formulaLabel:'(Prix final - PA opticien) / Prix final x 100'},
  {id:26,name:'Titre SEO Optic 2000',code:'seo_titre_o2000',type:'Texte calcule',groupId:6,required:false,calc:true,formula:'',formulaLabel:'Formule a definir avec equipe e-commerce'},
  {id:27,name:'Description SEO Optic 2000',code:'seo_desc_o2000',type:'Texte calcule',groupId:6,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:28,name:'Titre SEO Lissac',code:'seo_titre_lissac',type:'Texte calcule',groupId:6,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:29,name:'Description SEO Lissac',code:'seo_desc_lissac',type:'Texte calcule',groupId:6,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:30,name:'Laboratoire',code:'laboratoire',type:'Simple select',groupId:7,required:true,calc:false,formula:'',options:['Alcon','Bausch & Lomb','CooperVision','Johnson & Johnson','Menicon']},
  {id:31,name:'Nb lentilles par boite',code:'nb_lentilles',type:'Simple select',groupId:7,required:true,calc:false,formula:'',options:['1','6','10','30','90']},
  {id:32,name:'Type de lentille',code:'type_lentille',type:'Simple select',groupId:7,required:true,calc:false,formula:'',options:['Souple','Rigide','Torique','Multifocale','Coloree']},
  {id:33,name:'Couleur lentille',code:'couleur_lentille',type:'Texte',groupId:7,required:false,calc:false,formula:''},
  {id:34,name:'Type de vision',code:'type_vision',type:'Simple select',groupId:7,required:true,calc:false,formula:'',options:['Myopie','Hypermetropie','Presbytie','Astigmatisme']},
  {id:35,name:'Renouvellement',code:'renouvellement',type:'Simple select',groupId:7,required:true,calc:false,formula:'',options:['Journalier','Bi-hebdomadaire','Mensuel','Trimestriel','Annuel']},
  {id:36,name:'Materiau lentille',code:'materiau_lentille',type:'Simple select',groupId:7,required:true,calc:false,formula:'',options:['Hydrogel','Silicone hydrogel','PMMA','RGP']},
  {id:37,name:'Hydrophilie',code:'hydrophilie',type:'Nombre',groupId:7,required:true,calc:false,formula:''},
  {id:38,name:'Filtre UV',code:'filtre_uv',type:'Oui / Non',groupId:7,required:true,calc:false,formula:''},
  {id:39,name:'Sensibilite a l oxygene',code:'sensibilite_o2',type:'Nombre',groupId:7,required:true,calc:false,formula:''},
  {id:40,name:'Teinte de manipulation',code:'teinte_manip',type:'Oui / Non',groupId:7,required:true,calc:false,formula:''},
  {id:41,name:'Defauts visuels',code:'defauts_visuels',type:'Multi select',groupId:7,required:true,calc:false,formula:'',options:['Myopie','Hypermetropie','Presbytie','Astigmatisme','Amblyopie']},
  {id:42,name:'Prix de vente',code:'prix_vente',type:'Nombre',groupId:8,required:true,calc:false,formula:''},
  {id:43,name:'Prix TVA',code:'prix_tva',type:'Nombre calcule',groupId:8,required:false,calc:true,formula:'prix_vente*1.055',formulaLabel:'Prix de vente x 1.055 (TVA 5.5%)'},
  {id:44,name:'Duree de conservation',code:'duree_conservation',type:'Texte',groupId:9,required:true,calc:false,formula:''},
  {id:45,name:'Type de solution',code:'type_solution',type:'Simple select',groupId:9,required:true,calc:false,formula:'',options:['Multifonction','Peroxyde','Saline','Enzymatique']},
  {id:46,name:'Type',code:'type_produit_lentille',type:'Simple select',groupId:9,required:true,calc:false,formula:'',options:['Correction','Esthetique','Therapeutique']},
  {id:47,name:'Titre SEO Optic 2000',code:'seo_titre_o2000_l',type:'Texte calcule',groupId:10,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:48,name:'Description SEO Optic 2000',code:'seo_desc_o2000_l',type:'Texte calcule',groupId:10,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:49,name:'Titre SEO Lissac',code:'seo_titre_lissac_l',type:'Texte calcule',groupId:10,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:50,name:'Description SEO Lissac',code:'seo_desc_lissac_l',type:'Texte calcule',groupId:10,required:false,calc:true,formula:'',formulaLabel:'Formule a definir'},
  {id:51,name:'Type de produit',code:'type_produit_acc',type:'Texte',groupId:11,required:false,calc:false,formula:''},
  {id:52,name:'Coefficient',code:'coefficient',type:'Nombre',groupId:11,required:false,calc:false,formula:''}
];
let categories=[
  {id:1,name:'Montures',code:'monture',color:'#4fc3f7',groupIds:[1,2,3,4,5,6]},
  {id:2,name:'Lentilles',code:'lentille',color:'#66bb6a',groupIds:[1,2,3,7,8,9,10]},
  {id:3,name:'Solaires',code:'solaire',color:'#ab47bc',groupIds:[1,2,3,4,5,6]},
  {id:4,name:'Accessoires',code:'accessoire',color:'#ffa726',groupIds:[1,2,11]}
];
let roles=[
  {id:1,name:'Admin Systeme',okta:'OctoPIM_Admin_Systeme',mode:'Manuel',perms:{}},
  {id:2,name:'Admin Achats',okta:'OctoPIM_Admin_Achats',mode:'Manuel',perms:{}},
  {id:3,name:'Consultation',okta:'OctoPIM_Consultation',mode:'Automatique',perms:{}},
  {id:4,name:'Users Achats',okta:'OctoPIM_Users_Achats',mode:'Automatique',perms:{}}
];
let products=[
  {id:1,cat:'Montures',createdAt:'26/02/2025',maj:'04/07/2025 14:32',visualSrc:null,visuals:0,
   history:[{ts:'04/07/2025 14:32',user:'A. Beranger',field:'PA ATS',old:'40',new:'45'},{ts:'15/03/2025 09:10',user:'A. Beranger',field:'Mise en ligne',old:'',new:'15/03/2025'}],
   fields:{sap:'M906342000001',ean:'08056262500675',nom:'Monture Vogue VO4279S',miseEnLigne:'15/03/2025',marque:'Vogue',ref_monture:'VO4279S',couleur:'Noir',optique_solaire:'Optique',matiere:'Acetate',cerclage:'Cercle',forme:'Rectangulaire',code_douanier:'9003190000',pa_ats:'45',remise:'10',rfa:'2',prix_catalogue:'180'}},
  {id:2,cat:'Lentilles',createdAt:'28/02/2025',maj:'02/07/2025 09:15',visualSrc:null,visuals:0,
   history:[{ts:'02/07/2025 09:15',user:'S. Mucchieli',field:'Prix de vente',old:'30',new:'35'}],
   fields:{sap:'M906343000001',ean:'08056262500668',nom:'Lentille Aosept Plus',miseEnLigne:'01/03/2025',marque:'Alcon',laboratoire:'Alcon',nb_lentilles:'90',type_lentille:'Souple',type_vision:'Myopie',renouvellement:'Journalier',materiau_lentille:'Silicone hydrogel',hydrophilie:'38',filtre_uv:'Oui',sensibilite_o2:'140',teinte_manip:'Oui',defauts_visuels:'Myopie',prix_vente:'35'}},
  {id:3,cat:'Solaires',createdAt:'01/03/2025',maj:'01/07/2025 11:00',visualSrc:null,visuals:0,history:[],
   fields:{sap:'M906344000001',ean:'08056262500637',nom:'Solaire Ray-Ban RB3025',marque:'Ray-Ban',ref_monture:'RB3025',couleur:'Or',optique_solaire:'Solaire',matiere:'Metal',cerclage:'Cercle',forme:'Aviateur',code_douanier:'9004100000',pa_ats:'60',remise:'15',rfa:'3'}},
  {id:4,cat:'Accessoires',createdAt:'26/02/2025',maj:'30/06/2025 08:45',visualSrc:null,visuals:0,history:[],
   fields:{sap:'M906345000001',ean:'08056262500620',nom:'Accessoire Etui rigide',type_produit_acc:'Etui',coefficient:'2.5'}},
  {id:5,cat:'Montures',createdAt:'02/04/2025',maj:'03/07/2025 16:20',visualSrc:null,visuals:1,
   history:[{ts:'03/07/2025 16:20',user:'A. Beranger',field:'Taille',old:'',new:'M'},{ts:'10/04/2025 08:00',user:'A. Beranger',field:'Mise en ligne',old:'',new:'10/04/2025'}],
   fields:{sap:'M906346000001',ean:'08056262361245',nom:'Monture Oakley OX8046',miseEnLigne:'10/04/2025',marque:'Oakley',ref_monture:'OX8046',couleur:'Gris',optique_solaire:'Optique',matiere:'Metal',cerclage:'Semi-cercle',forme:'Rectangulaire',code_douanier:'9003190000',cible:'Homme',taille:'M',pa_ats:'55',remise:'12',rfa:'2',prix_catalogue:'220'}},
  {id:6,cat:'Montures',createdAt:'26/02/2025',maj:'28/06/2025 10:10',visualSrc:null,visuals:0,
   history:[{ts:'28/06/2025 10:10',user:'S. Mucchieli',field:'Couleur',old:'Bleu',new:'Rose'}],
   fields:{sap:'M906347000001',ean:'08056262471586',nom:'Monture Vogue VO3987',miseEnLigne:'05/03/2025',marque:'Vogue',ref_monture:'VO3987',couleur:'Rose',optique_solaire:'Optique',matiere:'Acetate',cerclage:'Cercle',forme:'Papillon',code_douanier:'9003190000',pa_ats:'42',remise:'10',rfa:'2',prix_catalogue:'165'}}
];
let nextAttrId=53,nextCatId=5,nextGroupId=12,nextProductId=7;
let editingCatId=null,editingGroupId=null,pendingDelete=null;
let currentProductId=null,currentView='synth';
let selectedProductIds=[],compareMode=false;
let activeGroupFilters=null;
let colFilters={};
let activeColFilterDropdown=null;