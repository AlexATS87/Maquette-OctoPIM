# Suivi OctoPIM

Fichier de continuite. A lire en debut de session, a mettre a jour a chaque changement avec les pages `spec/*.html` concernees.

- Confluence (espace OctoPim, partie Fonctionnement de l’outil) est la spec de travail. Le HTML `spec/` n’est plus tenu a jour.
- `docs/` : le reste (references, cahier de test, guide, canvases).
- `docs/` : le reste (references, cahier de test, guide, canvases).
- Ce fichier, a la racine : decisions, points ouverts, derniere evolution. Pas un journal de conversation.

## Comment tenir le fil

1. Lire ce fichier avant toute decision ou modification de comportement.
2. En cas de doute sur le besoin ou la mise en oeuvre, challenger avant de coder.
3. Choix d'ergonomie : expert UI. Pas de texte qui repete une evidence.
4. Chaque directive globale d'une conversation est reportee ici, en ligne datee.
5. Chaque regle de gestion est ecrite dans la page Confluence du sujet (Fonctionnement de l’outil). Le guide utilisateur suit des qu’un parcours ou un droit change. Le HTML `spec/` n’est plus la source.
6. Ecrire le besoin avant la solution. L'outil est dimensionne pour un grand catalogue, sans seuil numerique. Si la maquette ou un systeme cible (SAP, Babil, Okta) ne tient pas ce comportement, le dire dans la spec au lieu de le figer.
7. A chaque PR sur `main` : mettre a jour les captures `spec/captures` si l'ecran a change, tenir `docs/Cahier de test/Cahier de test OctoPIM.xlsx` (Ok ? vide tant que le test n'est pas joue), et tenir le guide utilisateur. Si un droit manque pour modifier ou supprimer, le guide renvoie a Alexis Beranger, administrateur de la solution.
8. Un libelle d'ecran (bouton, menu, onglet) s'ecrit entre crochets, en gras, tel qu'il est sur l'ecran. Un code technique reste en police code. Un mot nu est le concept. Une capture globale montre l'organisation ou l'initialisation. Une zone decrite est cadree en rouge, le reste est voile.

## Decisions en vigueur

- 2026-09-22 — Referentiel unique. Excel a remplacer en priorite. Akeneo a pouvoir remplacer. Interfaces cibles : SAP, Babil, Snowflake, Cosium, Osmose.
- 2026-09-22 — Un attribut, plusieurs groupes, un seul identifiant. Deux natures : systeme ou classique.
- 2026-09-22 — Obligatoire = seul flag d'obligation. SAP n'est pas obligatoire a la creation. EAN, nom et categorie le sont.
- 2026-09-22 — Pourcentages affiches en %, stockes entre 0 et 1.
- 2026-09-22 — Marque = referentiel unique, liste extensible.
- 2026-09-24 — Completion : uniquement les champs que l'utilisateur peut remplir, une seule fois. Hors taux : systeme, calcules, visuels, commentaire. Une condition reprise de l'accord fournisseur compte comme renseignee. Le picto s'affiche sur tous les types, images comprises.

## Décisions du 24/09 (soir)

- Liste détaillée : uniquement les groupes de la catégorie filtrée. « Toutes catégories » : on masque la barre de groupes.
- Un attribut dans deux groupes sert deux populations. A l'export, il sort si au moins un de ses groupes est coché.
- Un champ masqué par une condition ne compte pas dans la complétion.
- Le groupe choisi à la création ou à l'édition d'un attribut le rattache à ce groupe. Ce n'est pas une étiquette.
- L'onglet Visuels suit la même liste d'attributs que les autres groupes. Le type Image suffit.
- Pas d'onglet Synthèse sur la fiche. On évite le doublon à l'affichage et à l'export.
- Trame IWI : l'export ne part que s'il est importable par IWI. L'utilisateur métier voit les manques avant.
- 2026-09-24 — Produits BDD : uniquement l'onglet Table. On ignore les colonnes qui n'existent pas, sauf celles de l'exemple IWI, qui sont a creer.
- 2026-09-24 — Nouvel attribut : caracteristique produit dans « Caracteristiques monture ». Champ utile seulement a IWI dans un groupe « IWI ».
- 2026-09-24 — Le CSV des codes marque ne sert qu'a la correspondance IWI.
- Code marque IWI : 3 caracteres maximum, pose sur la marque. Exemples charges : Esprit 43, Saint Laurent SLX, MontBlanc MMM, Julbo JUL.
- Prix 2 IWI = prix catalogue. Prix 1 IWI = PA ATS.
- IWI : code et nom du distributeur sont des constantes d’export (ATS / Audioptic Trade Services). Le code fabricant varie et reste un attribut du groupe IWI.
- Completion : cases « Completion pour » sur le groupe d'attributs, liste des groupes utilisateur. Aucune case = tout le monde. Admin systeme compte tout.
- 2026-09-28 — Export : toujours un onglet. Format a cote du bouton (.xlsx, .csv, .zip). Toute trame (Catalogue, IWI, enregistree) se regle avec les memes cases. IWI propose ses 76 colonnes, qu’on peut decocher ensuite. Manque en rouge sur chaque colonne exigee encore cochee. Une selection est indiquee, avec « Tout exporter ».
- 2026-09-28 — Nombre : 0, 1 ou 2 decimales, defaut arrondi. Prix et PA a 2 decimales, prix final arrondi a 0.
- 2026-09-28 — Date de modification IWI = attribut calcule, date du jour a l'export. Action = constante 1 de la trame, pas un attribut.

## Points ouverts

Aucun.

## Hors spec

- 2026-09-29 — Depot GitHub public. Preference : n’y laisser que le code (spec, docs, index.md hors de GitHub). Pas execute : un commit qui retire les fichiers laisse l’historique, et reecrire l’historique demande un accord explicite.
- 2026-09-29 — Ne pas passer le depot en prive tant que GitHub Pages sert le site. L’URL https://alexats87.github.io/Maquette-OctoPIM/ publie aussi spec/ et le guide, sans connexion. Sur GitHub Free, un depot prive coupe Pages. Sur Pro, l’URL reste publique. Un site Pages prive demande GitHub Enterprise Cloud.

## Derniere evolution

- 2026-09-24 — Correctif completion (31/34 sur la monture Vogue alors que les champs picto etaient remplis) : doublons d'onglet, visuels, commentaire, et conditions commerciales non saisies sur la fiche.
- 2026-09-24 — Pastille « Optionnel » retiree des visuels. Sans picto de completion, le champ est optionnel. La pastille « Obligatoire » ne reste que si le champ est vraiment obligatoire.
- 2026-09-24 — Cadrage IWI et BDD (onglet Table seulement, groupe IWI pour les champs d'export). Trois points encore ouverts : masque du code marque, Prix 1, fabricant vs distributeur.
- 2026-09-24 — Barre de completion par groupe, meme dessin que la barre produit, mise a jour a la saisie. Export : trames, coches groupes/champs, onglet unique, zip, blocage IWI si colonne exigee vide.
- 2026-09-24 — PDF d’inspiration : docs/references/Exemple de specs (ici FGP).pdf. A utiliser pour completer les pages spec, sans figer un comportement de maquette qui ne tient pas au volume ni aux systemes cibles.
- 2026-09-28 — Export un onglet, format au bouton, compteurs IWI en rouge, decimales, attributs calcules IWI, parcours Admin Achats.
- 2026-09-28 — Meme selecteur de champs pour Catalogue, IWI et les trames enregistrees. Retrait des textes d’export qui repetent le perimetre.
- 2026-09-29 — Directive de travail : un seul fil. Lire ce fichier avant une decision. Y reporter chaque directive globale. Challenger les doutes. Expert UI sur l’ergonomie. Toute regle de gestion va dans la spec.
- 2026-09-29 — Rattrapage spec a partir du code : saisie et agencement des attributs, fiche, liste, droits par role, import, preferences.
- 2026-09-29 — A chaque PR sur main : captures spec si l'ecran change, et cahier de test Excel. `spec/` = spec seule. `docs/` = references, cahier, guide, canvases.
- 2026-09-29 — Guide utilisateur tenu comme la spec, le cahier et index.md. Droit insuffisant pour modifier ou supprimer : contacter Alexis Beranger.
- 2026-09-29 — Arborescence Confluence OctoPim reconstruite : Cadrage, Referentiel, Usages, Administration et acces, Technique et securite. Les pages existantes sont deplacees (familles sous Categories, SSO sous Utilisateurs, creation de produit sous Workflows). Les pages HTML manquantes sont creees avec leurs regles. Le HTML local reste la spec de travail.
- 2026-09-29 — Spec Confluence completee : comportements et caracteristiques du produit, caracteristiques des objets sur Entites et relations, regles HTML (liste, import, export, attributs, roles), captures sur ces pages. Schemas draw.io joints (parcours, modele). Le workflow draw.io « gestion des produits » reste sur Creation d'un produit. Document SSO : piece jointe de Gestion SSO OKTA, OctoPim_Prerequis integration SSO v1.0.docx.
- 2026-09-29 — Confluence : schema entites sans trait sur les cases. Referentiel dans l’ordre produit, attributs, groupes, categories. Page Groupes d’attributs : panneau (nom, code, completion pour, ordre glisser-deposer, ajout), ordre des cartes, ordre des groupes dans la liste via la categorie, droits du module dans Roles. Captures de l’UI courante.
- 2026-09-29 — Attributs : edition en deux colonnes, confirmation si quitter sans enregistrer, attribut systeme en lecture seule. Champs solaires (miroir, pola, degrade, teinte, categorie du verre) juste apres Optique / Solaire, visibles des le changement. Listes style, profil, teinte, categorie du verre. Metal fusionne dans Métal. Groupe de marchandise, code douanier IWI, prescription, code marquage et type IWI (A a E) calcules depuis les fichiers IWI et la table BDD. Nom du fournisseur a la place de Nom du fabricant. Trigramme fabricant : CHARMANT CHA, KERING KEY, JULBO JUL. Fiche : fond rose pale sur un champ de completion vide. Export : le compteur et le fichier suivent la selection de la liste.
- 2026-10-01 — Fournisseur : trigramme facultatif, initialise depuis Fab. des associations IWI quand une marque du fournisseur y figure. Liste : nom, code, trigramme. Pas de commentaire sur l’accord. Historique de la ligne dans Modifier, ecrit a l’enregistrement. Attribut Nom du fournisseur (groupe IWI) supprime. Le champ Code fournisseur s’appelle Nom fournisseur. Code fabricant = trigramme du fournisseur, pas une formule MAP. Groupe de marchandise et code douanier IWI en SI imbriques : MAP ne lit qu’un champ, CONCAT n’en choisit pas. Remise sur facture et RFA de la tarification supprimes ; marge interne et PA opticien lisent le RF et la RFA de l’accord. Fiche : le panneau conditions affiche le code et le trigramme. Export : un manque IWI s’affiche « N valeurs manquantes » en rouge et ne bloque plus le fichier.
- 2026-10-01 — Tarifs : libelles HT (PA interne, marge interne, PA opticien, prix arrondi). PVMC = prix TTC arrondi a l’euro superieur (catalogue × 2,6 en optique, × 1,9 sinon). Prix arrondi HT = PVMC / 1,2. PA opticien HT = prix catalogue × (1 − RF) × (1 − RFA). Infos generales : reassort SAP, commande d’implantation, date de disponibilite, hors completion. Module Alertes : seuil numerique, carte du tableau de bord vers la liste filtree, picto en liste et sur la fiche. Alerte en place : taux de marque inferieur a 20 %. Marge interne HT = PA opticien HT − PA interne HT.
- 2026-10-01 — Réassort automatique SAP : si actif canal O et actif canal L sont Non, la valeur devient A désactiver. Un canal vide ne declenche pas la regle. Sinon la valeur saisie est conservee. La liste est verrouillee seulement dans ce cas.
- 2026-10-01 — Accessoires : couleur partagee avec la monture, sans groupe general. Matiere accessoire a part, la liste monture alimente IWI. Dimensions, conditionnement d’origine, annee de lancement et designation magasin dans Caracteristiques accessoire. Code article magasin = code SAP. Fournisseurs PACIFIC, TRADECON, CLASSICPACKING, sans accord. Tarification et SEO renommes. Canaux : Oui, Non, En attente.
- 2026-10-01 — Une formule ne change pas selon la categorie. Si la regle differe, champ dedie. Tarification monture : PVMC, prix arrondi HT, marge interne, taux de marque. Tarification accessoire : PV TTC arrondi, PV HT, marge HT, taux accessoire. Groupe « Tarification lentilles + PEL » : prix de vente TTC et HT seulement, 2 decimales, sur Lentilles et PEL. Marque en tete des caracteristiques lentille.
- 2026-10-01 — Le fichier BDD Accessoires reste en local. Il sert au contexte et aux regles. Il ne va pas sur GitHub.
- 2026-10-01 — La spec decrit chaque ecran au meme niveau que le dashboard : a quoi il sert, ce que l’utilisateur voit selon ses droits, chaque section, le calcul, le dessin, le clic. Le HTML reste la source. Confluence reprend ces pages.
- 2026-10-05 — La spec de travail est Confluence (Fonctionnement de l’outil). Le HTML spec n’est plus tenu. Chaque propriete s’ecrit en quatre temps : a quoi ca sert, comment ca fonctionne, regles, donnees a initialiser. Une liste deroulante se filtre en tapant.
- 2026-10-05 — Preferences : la taille de page est une liste fermee 25, 50 ou 100 (defaut 50). Le 0 « tout afficher » n’existe plus.
- 2026-10-05 — Les pages famille Montures, Lentilles et PEL, Accessoires sont retirees de l’arborescence. Le tableau d’initialisation d’une categorie porte ses groupes. Celui d’un groupe porte ses attributs, dans l’ordre. Celui des attributs liste chaque attribut.
- 2026-10-05 — Un developpeur lit Fonctionnement de l’outil dans l’ordre : produit, attributs, groupes, categories, conditions, alertes, synthese, roles, utilisateurs, administration, puis dashboard, liste, import, export, workflows. Les schemas restent sur leur page. L’index est sur la page mere. Le modele de juillet n’est pas la spec a implementer.
- 2026-10-05 — Langue des formules sur Gestion des attributs : opérateurs, champ vide, recalcul, formule qui relit son champ, DATE_MAJ, masque de saisie. La maquette arrondit un calcul à 4 décimales et efface un texte « 0 » : ce n’est pas le besoin. Alerte : comparaison stricte, valeur vide ignorée. RG-ATT-11 à 13, RG-ALR-05.
- 2026-10-05 — La liste d'initialisation des attributs reprend le contrat de l'administration : obligatoire, complétion, formule. Rempli n'est pas une donnée à charger. C'est la part des produits sur lesquels l'attribut s'affiche et qui ont une valeur. 0 % signale un attribut inutilisé, sans le supprimer. Sur 100 000 produits le taux se calcule côté serveur. RG-ATT-10, page Gestion des attributs.
- 2026-10-05 — Les fonctionnalites suivent le meme plan que les proprietes : a quoi ca sert, comment ca fonctionne, regles, donnees a initialiser. Dashboard RG-DSH-05 a 07. Liste RG-LST-08 a 10. Import RG-IMP-06 a 10. Export RG-EXP-09 et les 76 colonnes IWI. Workflows : parcours de creation, fiche, forcage, canaux, accord, import, export, parametrage, Okta, Babil. Le schema draw.io reste.
- 2026-10-05 — Racine Confluence : Cadrage, Fonctionnement de l’outil, Technique et securite. Les coquilles Referentiel, Usages et Administration et acces sont archivees. Les droits et l’administration se lisent dans Fonctionnement (etapes 8 a 10). Acteurs et roles reste dans Cadrage.
- 2026-10-05 — Workflows fonctionnels est un chapitre de Fonctionnement, a cote des fonctionnalites, et non plus une etape a l'interieur. Diagrammes de flux : modifier une fiche, creer un produit, ajout en masse, nouvel attribut sur une monture, publier un canal, forcer un champ calcule. Le schema metier de Creation d’un produit n’est pas recopie. Fournisseur, Okta, Babil et export restent en texte : le parcours est lineaire.
- 2026-10-05 — Les diagrammes de flux partagent la legende de Creation d’un produit : bleu Achats, vert OctoPIM, jaune Administration, losange rose pour une decision ou un refus. Chaque parcours commence a la connexion, puis un clic par etape (menu, action). Le schema metier de Creation d’un produit n’est pas repeint.
- 2026-10-05 — Un workflow est une page : objectif et etapes, comme Creation d’un produit. Pas de section Regles ni Donnees a initialiser sur un parcours. Ces deux sections restent sur une propriete, et sur une fonctionnalite qui porte vraiment une regle ou un jeu (export IWI, attributs, categories). Elles sont retirees du dashboard, de la liste et de l’import, qui disaient n’avoir aucun jeu propre. Le geste Nouveau produit est ajoute en bas de Creation d’un produit, sans reprendre le parcours metier.
- 2026-10-05 — Creation d’un produit : les points ouverts et le pic des conventions sont retires. Akeneo reste dans les acteurs, les equipes y travaillent encore. SAP, Babil, IWI, Magento et les autres briques du schema « demain » du cadrage sont prevus pour la solution cible. Le contrat de chaque echange n’est pas ecrit. La carte est sur Architecture technique. RG-CTX-04 ne les declare plus hors spec. Snowflake est cite comme lecteur et n’est pas sur ce schema.
- 2026-10-15 — Passage prevu vers VS Code et Claude Code. Les consignes sont dans `CLAUDE.md`, le serveur Atlassian dans `.mcp.json`. La cle Bedrock reste dans l'environnement de l'utilisateur, pas dans le depot. Le remote de cette copie est encore GitHub : aucun workspace Bitbucket n'est configure ici.
- 2026-10-06 — Un libelle d'ecran (bouton, menu, onglet) s'ecrit entre crochets, en gras. Un code technique reste en police code. Un mot nu est le concept. Une capture globale montre l'organisation ou l'initialisation. Une zone decrite est cadree en rouge, le reste est voile. Premiere application : la recherche de la liste.
- 2026-10-06 — L'outil est dimensionne pour un grand catalogue. Les regles ne citent plus un seuil de 100 000 produits. La liste, les comptes du dashboard et le taux Rempli se calculent sans charger le catalogue a l'ecran. La maquette reste sur son echantillon.
- 2026-10-06 — La liste se comporte comme sur un grand catalogue, meme sur l'echantillon local. Recherche a partir de deux caracteres sur code magasin, code web, EAN, designations et marque. Une liste fermee (categorie, canal, select court) se coche sans parcourir les produits. Une colonne libre se filtre par « contient ». Marque et fournisseur : suggestion a partir de deux caracteres, huit propositions. Le tri porte sur le resultat filtre, avant la page.
- 2026-10-05 — La spec decrit le besoin, sans notes de conversation. Liste : recherche par saisie (code magasin, code web, EAN, designations, marque) a partir de deux caracteres ; filtres a liste seulement quand les valeurs sont peu nombreuses ; page de 25, 50 ou 100 (defaut 50) ; pas d’affichage de tout le catalogue ; tri et comptes cote serveur. EAN, code magasin et code web sont uniques des qu’ils sont renseignes. Visuels = Babil. Comptes = Okta. Les flux SAP, Snowflake, Cosium et Osmose sont hors de cette spec. Evolution du dashboard : cumul des produits visibles crees jusqu’a la fin de chaque mois, six mois, clic vers la liste. Tout reporting ouvre la liste filtree. Confluence : Cadrage a part ; le reste du fonctionnement s’appelle « Fonctionnement de l’outil », avec Proprietes puis Fonctionnalites. La maquette charge encore son echantillon en local.