# Mise en ligne — Maison TRAAC

```
Netlify (front React, client/)  ──▶  Render (API Express, server/)  ──▶  Supabase
```

Netlify et Render redéploient automatiquement à chaque push sur la branche choisie (ici `master`).

## Variables d'environnement

| Où | Variable | Valeur |
| --- | --- | --- |
| Render | `SUPABASE_URL` | URL du projet Supabase |
| Render | `SUPABASE_KEY` | clé **secret** Supabase (jamais dans le front) |
| Render | `FRONTEND_ORIGIN` | URL Netlify, **sans `/` final** (ex. `https://maison-traac.netlify.app`) |
| Netlify | `VITE_API_URL` | facultatif : par défaut, le build vise `https://maison-traac.onrender.com` |

`PORT` est fourni par Render : ne pas le définir.

## Ordre à suivre

Netlify lit `netlify.toml` dans la branche qu'il déploie (`master` sur GitHub) :
le code doit donc être poussé **avant** de créer le site.
Et la nouvelle API n'accepte que l'origine `FRONTEND_ORIGIN` : on la règle en premier.

### 1. Régler l'API sur Render

Dans le service existant (`maison-traac`) :

1. **Settings** : Root Directory `server`, Build Command `npm install`, Start Command `npm start`, Branch `master`.
2. **Environment** : ajouter `FRONTEND_ORIGIN` = l'URL Netlify **prévue**, sans `/` final
   (ex. `https://maison-traac.netlify.app`). Plusieurs adresses possibles, séparées par des virgules.
3. Enregistrer.

L'API actuellement en ligne ignore cette variable : ce réglage ne casse rien.

### 2. Publier le code sur `master`

Fusionner la branche de travail dans `master` puis pousser :

```bash
git switch master
git merge nouv_modif
git push origin master
```

Render redéploie la nouvelle API tout seul (2 à 5 minutes), et `netlify.toml` est maintenant sur GitHub.

### 3. Créer le site Netlify

1. Netlify → **Add new site** → **Import an existing project** → GitHub → repo `forme-26`.
2. Branche : `master`. Laisser les champs de build vides : ils sont lus dans `netlify.toml`
   (base `client`, commande `npm run build`, dossier publié `dist`, Node 22).
3. **Deploy**, puis **Site configuration → Change site name** : le nom choisi à l'étape 1 (ex. `maison-traac`).
4. Si ce nom est déjà pris, en choisir un autre et mettre la nouvelle URL dans `FRONTEND_ORIGIN` sur Render.

Ensuite, chaque push sur `master` redéploie le front et l'API.

### 4. Vérifier

- Ouvrir le site Netlify : les articles s'affichent, aucune erreur CORS dans la console (F12).
- Page Gérant : ajouter, rendre indisponible, supprimer un article.
- L'API répond bien au site :

```bash
curl -s -o /dev/null -D - -H "Origin: https://<nom>.netlify.app" https://maison-traac.onrender.com/vetements
```

  La réponse doit contenir `access-control-allow-origin: https://<nom>.netlify.app`.

## Le jour de la démo

L'offre gratuite de Render met l'API en veille après 15 minutes sans visite :
la première requête prend alors environ 1 minute. Ouvrir le site 2 minutes avant de passer.

## En local

- API : `cd server && npm start` (fichier `server/.env` avec `SUPABASE_URL` et `SUPABASE_KEY`).
- Front : `cd client && npm run dev` → appelle `http://localhost:3000` par défaut.
- Si Vite démarre sur un autre port que 5173, l'ajouter dans `FRONTEND_ORIGIN` du `.env` serveur
  (ex. `FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174`).
