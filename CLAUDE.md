# OctoPIM — consignes pour Claude Code

Lire `index.md` avant toute décision ou modification de comportement. Ce fichier-ci dit comment travailler. `index.md` porte les décisions.

L'utilisateur s'appelle Alexis. Il est product manager. Il travaille dans le code. En cas de doute sur le besoin, poser la question avant de modifier.

## Spec

Confluence est la spec de travail. Espace OctoPim, partie Fonctionnement de l'outil.

- Site : `https://audioptictradeservices.atlassian.net/wiki`
- cloudId : `692b908b-e782-4250-b949-3a657d411d07`
- spaceId : `3917971461`
- Le HTML `spec/` n'est plus tenu à jour. Ne pas le supprimer.
- Le guide `docs/Guide utilisateur/index.html` suit dès qu'un parcours ou un droit change. Si une action est impossible faute de droit, le guide dit de contacter Alexis Béranger, administrateur de la solution.
- Chaque directive globale est une ligne datée dans `index.md`.
- Écrire le besoin avant la solution. L'outil est dimensionné pour un grand catalogue, sans seuil numérique. Si la maquette ne tient pas ce comportement, le dire dans la spec.

À chaque passage sur `main` : captures dans `spec/captures` si un écran a changé, cahier `docs/Cahier de test/Cahier de test OctoPIM.xlsx` (colonne Ok ? vide tant que le test n'est pas joué), guide si un parcours visible a changé.

## Écriture

- Un libellé d'écran (bouton, menu, onglet) s'écrit **[Nouveau produit]**, tel qu'il est affiché.
- Un code technique reste en police code : `sap`.
- Un mot nu est le concept.
- Une capture globale montre l'organisation ou l'initialisation, sans cadre.
- Une zone décrite est cadrée en rouge et le reste est voilé. Elle suit le paragraphe.

## Confluence

Ne jamais réécrire le corps entier d'une page. Le markdown perd les images et les macros. Lire en HTML (`detail: full`) et noter le `snapshotToken` (`v:N`) juste avant d'écrire.

`cloudId` est un argument de premier niveau de `executeRead` et `executeWrite`, à côté de `name` et `inputs`. Le passer aussi dans `inputs` si l'opération le liste.

Sous PowerShell, `curl` est `Invoke-WebRequest`. Utiliser `curl.exe`.

### Schéma draw.io

1. Écrire un XML draw.io non compressé (`.drawio`). Le nom du fichier est le nom du schéma.
2. `discover` « upload a confluence page attachment ». L'opération est `createConfluenceAttachment`, via `executeWrite`. Inputs : `contentId` de la page, `localFilePath`, `fileSize`, `comment`.
3. L'appel ne transfère pas les octets. Lancer le `uploadCommand` renvoyé avec `curl.exe`. Ne pas recopier le jeton dans le chat.
4. La pièce jointe doit être sur la page qui affiche le schéma. Le macro le retrouve par `diagramName` et `pageId`.
5. Poser un `div` d'extension, pas l'ancien `ac:structured-macro` :

```html
<div data-type="extension" data-extension-key="drawio" data-extension-type="com.atlassian.confluence.macro.core" data-layout="default" data-parameters="…"></div>
```

Dans `data-parameters`, JSON échappé en `&quot;`. Paramètres : `baseUrl` = `https://audioptictradeservices.atlassian.net/wiki`, `diagramName`, `pageId`, `width`, `height`, `simple` = 0, `zoom` = 1, `lbox` = 1, `revision`.

`revision` dans les paramètres et `revision` dans l'URL `https://ac.draw.io/connectImage?...` sont le même nombre : `version.number` renvoyé par l'envoi. Si un seul des deux change, Confluence garde l'ancien dessin.

Pour remplacer un schéma, renvoyer le même nom de fichier. La version augmente. Monter `revision` des deux côtés. Garder le `macroId` et le `data-local-id` existants.

Légende des diagrammes de flux dans l'outil : bleu `#dae8fc` / `#6c8ebf` Action Achats, vert `#d5e8d4` / `#82b366` Action d'OctoPIM, jaune `#fff2cc` / `#d6b656` Action Administration, losange `#f8cecc` / `#b85450` décision ou refus. Le parcours commence à la connexion, un clic par étape. Ne pas repeindre le schéma métier de Création d'un produit (`4226252801`). Le fichier `docs/canvas/workflow-parcours.drawio` a une ancienne légende.

## Environnement

Claude Code tourne dans VS Code, via une clé Amazon Bedrock. La clé ne va pas dans le dépôt. Elle se pose dans l'environnement de l'utilisateur :

- `CLAUDE_CODE_USE_BEDROCK=1`
- `AWS_BEARER_TOKEN_BEDROCK` = la clé
- `AWS_REGION` = la région du modèle

Le remote Git de cette copie est encore `origin` → GitHub `AlexATS87/Maquette-OctoPIM`. Aucun remote Bitbucket n'est configuré sur cette machine. Ne pas inventer l'URL du workspace.

Ne pas committer de secret, de fichier `~$*`, ni `docs/references/BDD Accessoires.xlsx`.
