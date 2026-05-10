# Le compagnon du P'tit Bac

Application web générée avec Cursor 3.3.30 pour animer des parties de Petit Bac en local: configuration des joueurs, tirage de lettre, chrono, categories et suivi des scores.

## Fonctionnalites

- Configuration de partie: niveau de difficulte, nombre de categories, nombre de joueurs et noms.
- Generation de categories par manche selon la difficulte.
- Tirage anime des lettres avec effet sonore, en evitant les lettres deja utilisees.
- Chronometre avec presets, duree personnalisable, animation visuelle et alertes sonores.
- Tableau de scores avec increment/decrement par joueur et remise a zero.
- Confirmations via popups visuelles coherentes avec le style du jeu.
- Sauvegarde locale automatique (joueurs, scores, categories, duree, lettres utilisees).

## Lancer en local (WSL/Linux)

Depuis la racine du projet:

```bash
python3 -m http.server 8000
```

Puis ouvrir:

- [http://localhost:8000](http://localhost:8000)

## Progressive Web App (PWA)

L'application est compatible PWA:

- Manifest (`manifest.webmanifest`)
- Service Worker (`sw.js`) avec cache offline des assets
- Icône d'application (`icons/app-icon.svg`)
- Installation possible depuis le navigateur (selon Chrome/Edge)
- Detection de nouvelle version avec toast "Nouvelle version disponible" et bouton de mise a jour

## Donnees conservees

L'etat de jeu est enregistre dans `localStorage`:

- joueurs
- scores
- categorie et difficulte
- duree du chrono
- categories de la manche
- lettres deja tirees

Le bouton "Effacer la sauvegarde" supprime toute la partie locale.  
Le bouton "Reinitialiser les scores" remet les scores et l'historique des lettres a zero.
