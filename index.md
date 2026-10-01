# Suivi OctoPIM

Fichier de continuite. A lire en debut de session, a mettre a jour a chaque changement avec les pages `spec/*.html` concernees.

- `spec/` : la spec seulement (pages HTML, styles, scripts, captures). Langage metier. Collage Confluence via le bouton de chaque page.
- `docs/` : le reste (references, cahier de test, guide, canvases).
- Ce fichier, a la racine : decisions, points ouverts, derniere evolution. Pas un journal de conversation.

## Comment tenir le fil

1. Lire ce fichier avant toute decision ou modification de comportement.
2. En cas de doute sur le besoin ou la mise en oeuvre, challenger avant de coder.
3. Choix d'ergonomie : expert UI. Pas de texte qui repete une evidence.
4. Chaque directive globale d'une conversation est reportee ici, en ligne datee.
5. Chaque regle de gestion (agencement, caracteristiques d'attribut, limites, contraintes) est ecrite dans la page `spec/*.html` du sujet, dans le meme geste que la maquette. Le guide utilisateur (`docs/Guide utilisateur/index.html`) suit le meme geste des qu'un parcours ou un droit change.
6. Ecrire le besoin avant la solution. Si le volume vise (100 000 produits) ou un systeme cible (SAP, Babil, Okta) rend la maquette fragile, le dire dans la spec au lieu de figer ce comportement.
7. A chaque PR sur `main` : mettre a jour les captures `spec/captures` si l'ecran a change, tenir `docs/Cahier de test/Cahier de test OctoPIM.xlsx` (Ok ? vide tant que le test n'est pas joue), et tenir le guide utilisateur. Si un droit manque pour modifier ou supprimer, le guide renvoie a Alexis Beranger, administrateur de la solution.

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

## Points ouverts

- Recherche liste : le besoin est de retrouver un produit comme dans Excel, sur un catalogue vise a plus de 100 000 lignes. La maquette filtre par les valeurs affichees d'une colonne. Cette liste de valeurs ne tiendra pas a ce volume. A trancher : recherche par saisie, pas enumeration.
- Unicite EAN : non tranchee.
- Pas de cycle de vie brouillon / valide / archive. Le PDF FGP sert d'exemple de parcours (qui, quand, comment), pas de statuts a recopier.
- Evolution du dashboard sur 6 mois : mois passes illustratifs.
- Visuels : maquette = fichier local. Cible = Babil.
- Comptes : maquette = switch local. Cible = Okta.
- 2026-09-29 — Depot GitHub public. Preference : n’y laisser que le code (spec, docs, index.md hors de GitHub). Pas execute : un commit qui retire les fichiers laisse l’historique, et reecrire l’historique demande un accord explicite. La spec publiee vise Confluence, une fois le MCP Atlassian connecte.
- 2026-09-29 — Ne pas passer le depot en prive tant que GitHub Pages sert le site. L’URL https://alexats87.github.io/Maquette-OctoPIM/ publie aussi spec/ et le guide, sans connexion. Sur GitHub Free, un depot prive coupe Pages. Sur Pro, l’URL reste publique. Un site Pages prive demande GitHub Enterprise Cloud.
- Code marque IWI : 3 caracteres maximum, pose sur la marque. Exemples charges : Esprit 43, Saint Laurent SLX, MontBlanc MMM, Julbo JUL.
- Prix 2 IWI = prix catalogue. Prix 1 IWI = PA ATS.
- IWI : code et nom du distributeur sont des constantes d’export (ATS / Audioptic Trade Services). Le code fabricant varie et reste un attribut du groupe IWI.
- Completion : cases « Completion pour » sur le groupe d'attributs, liste des groupes utilisateur. Aucune case = tout le monde. Admin systeme compte tout.
- 2026-09-28 — Export : toujours un onglet. Format a cote du bouton (.xlsx, .csv, .zip). Toute trame (Catalogue, IWI, enregistree) se regle avec les memes cases. IWI propose ses 76 colonnes, qu’on peut decocher ensuite. Manque en rouge sur chaque colonne exigee encore cochee. Une selection est indiquee, avec « Tout exporter ».
- 2026-09-28 — Nombre : 0, 1 ou 2 decimales, defaut arrondi. Prix et PA a 2 decimales, prix final arrondi a 0.
- 2026-09-28 — Date de modification IWI = attribut calcule, date du jour a l'export. Action = constante 1 de la trame, pas un attribut.
- 2026-09-28 — Le cycle de vie FGP n'est pas un statut OctoPIM. La spec decrit un parcours type (qui, quand, comment), exemple Admin Achats.

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
- 2026-10-01 — La spec decrit chaque ecran au meme niveau que le dashboard : a quoi il sert, ce que l’utilisateur voit selon ses droits, chaque section, le calcul, le dessin, le clic. Le HTML reste la source. Confluence reprend ces pages. Le clic de tous les reportings vers la liste est le besoin ; la maquette ne le fait pas encore sur le camembert, l’evolution et les barres de completion. L’evolution mensuelle vise le cumul des dates de creation ; les mois passes de la maquette restent illustratifs.