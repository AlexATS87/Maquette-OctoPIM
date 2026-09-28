# Suivi OctoPIM

Fichier de continuite. A lire en debut de session, a mettre a jour a chaque changement avec les pages `spec/*.html` concernees.

- `spec/*.html` : besoin, regles, captures. Langage metier. Collage Confluence via le bouton de chaque page.
- Ce fichier : decisions, points ouverts, derniere evolution. Pas un journal de conversation.

## Comment tenir le fil

1. Modifier la maquette et la page spec du sujet dans le meme geste.
2. Ajouter ici une ligne datee (decision, question ouverte, ou correctif).
3. Ne pas decrire une solution technique comme si c'etait le besoin. Si le volume ou un autre systeme rend la maquette fragile, le dire.

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
- Unicite EAN, cycle de vie (brouillon / valide / archive) : non tranchés.
- Evolution du dashboard sur 6 mois : mois passes illustratifs.
- Visuels : maquette = fichier local. Cible = Babil.
- Comptes : maquette = switch local. Cible = Okta.
- Code marque IWI : 3 caracteres maximum, pose sur la marque. Exemples charges : Esprit 43, Saint Laurent SLX, MontBlanc MMM, Julbo JUL.
- Prix 2 IWI = prix catalogue. Prix 1 IWI = PA ATS.
- IWI : code et nom du distributeur sont des constantes d’export (ATS / Audioptic Trade Services). Le code fabricant varie et reste un attribut du groupe IWI.
- Completion : cases « Completion pour » sur le groupe d'attributs, liste des groupes utilisateur. Aucune case = tout le monde. Admin systeme compte tout.

## Derniere evolution

- 2026-09-24 — Correctif completion (31/34 sur la monture Vogue alors que les champs picto etaient remplis) : doublons d'onglet, visuels, commentaire, et conditions commerciales non saisies sur la fiche.
- 2026-09-24 — Pastille « Optionnel » retiree des visuels. Sans picto de completion, le champ est optionnel. La pastille « Obligatoire » ne reste que si le champ est vraiment obligatoire.
- 2026-09-24 — Cadrage IWI et BDD (onglet Table seulement, groupe IWI pour les champs d'export). Trois points encore ouverts : masque du code marque, Prix 1, fabricant vs distributeur.
- 2026-09-24 — Barre de completion par groupe, meme dessin que la barre produit, mise a jour a la saisie. Export : trames, coches groupes/champs, onglet unique, zip, blocage IWI si colonne exigee vide.
- 2026-09-24 — PDF d’inspiration depose : spec/references/Exemple de specs (ici FGP).pdf. A utiliser pour completer les pages spec, sans figer un comportement de maquette qui ne tient pas au volume ni aux systemes cibles.
