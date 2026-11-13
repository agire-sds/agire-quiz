# AGIRE Quiz - Installation GitHub Pages

## 1. Remplacer les fichiers dans GitHub

Dans le depot prive `agire-sds/agire-quiz`, ajouter ou remplacer les fichiers de ce ZIP **en conservant les chemins**. Les trois fichiers modifies sont `vite.config.ts`, `src/main.tsx` et `README.md`. Ajouter `.github/workflows/deploy-pages.yml` et `GITHUB-PAGES-INSTALLATION.md`. L'ancien `vercel.json` est inutile et peut etre supprime.

Pour creer `.github/workflows/deploy-pages.yml` depuis le site GitHub : **Add file > Create new file**, saisir exactement `.github/workflows/deploy-pages.yml` dans le nom, puis coller le contenu du fichier fourni et valider. Le dossier `.github` sera cree automatiquement.

## 2. Variables dans GitHub

Dans le depot : **Settings > Secrets and variables > Actions > New repository secret**. Ajouter les deux secrets :

- `VITE_SUPABASE_URL` : URL du projet Supabase.
- `VITE_SUPABASE_ANON_KEY` : cle publique Supabase (publishable ou anon).

Ne jamais ajouter `service_role`, `sb_secret_...` ou un mot de passe a GitHub. Ces deux variables sont publiques dans le site compile, leur securite repose sur les controles RLS et les fonctions Supabase.

## 3. Activer GitHub Pages

**Settings > Pages > Build and deployment > Source : GitHub Actions**.

Dans **Actions**, lancer le workflow `Publier AGIRE Quiz sur GitHub Pages` via **Run workflow** si besoin, ou pousser un commit sur `main`. Attendre les jobs verts. Le site sera a :

https://agire-sds.github.io/agire-quiz/

## 4. Supabase : fonction serveur indispensable

Le SQL seul ne suffit pas pour jouer. Il faut egalement deployer l'Edge Function `supabase/functions/game-api/index.ts` sous le nom `game-api`, comme explique dans le README. Elle gere les joueurs, les parties et les scores. L'application ne pourra pas lancer de parties sans elle.

## 5. Authentification

Si l'authentification utilise des liens email, ajouter l'URL GitHub Pages dans **Supabase > Authentication > URL Configuration**. L'identification email/mot de passe deja utilisee ne necessite pas de callback particulier.

## 6. Limites

GitHub Pages ne fournit pas de backend : Supabase reste indispensable. Le site sera public meme si le depot est prive. Verifier les limites d'usage GitHub Pages et Supabase avant un evenement important.
