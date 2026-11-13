# AGIRE Quiz

Application web pour quiz animés en direct. React + TypeScript + Vite, Supabase et GitHub Pages.

## Installation

1. Créer un projet Supabase (région UE recommandée).
2. Dans **SQL Editor**, exécuter `supabase/migrations/001_initial.sql`.
3. Dans **Authentication > Users**, créer un utilisateur administrateur (email et mot de passe). Copier son UUID.
4. Dans **SQL Editor**, exécuter `insert into public.profiles(id) values ('UUID_ADMIN');` en remplaçant l'UUID.
5. Dans **Supabase > Edge Functions**, déployer `supabase/functions/game-api/index.ts` sous le nom `game-api`. Avec Supabase CLI : `supabase login`, `supabase link --project-ref VOTRE_REF`, puis `supabase functions deploy game-api --no-verify-jwt`. L'Edge Function valide elle-même les jetons admin pour les opérations protégées, et les jetons secrets joueurs pour les autres. Ne pas exposer la clé `service_role` dans le frontend.
6. Copier `.env.example` en `.env.local` et renseigner **Project URL** et la clé publique **publishable** (ou ancienne clé `anon`) dans **Supabase > Project Settings > API**.
7. Installer Node.js 20+ ; lancer `npm install`, puis `npm run dev`.
8. Ouvrir `http://localhost:5173`, se connecter depuis **Administration**, créer un quiz et lancer une partie.

## GitHub Pages

L'application est configuree pour GitHub Pages sous `/agire-quiz/` et utilise les routes `#/...`. Suivre **GITHUB-PAGES-INSTALLATION.md** pour les secrets GitHub Actions, le deploiement et la fonction Supabase.

## Fonctionnement

- Admin : connexion, création et modification des quiz, lancement d'une partie.
- Joueur : saisie du PIN et d'un pseudo, participation sans compte.
- Animation : l'animateur ouvre et ferme les questions, révèle les résultats et avance manuellement.
- Classement final et export CSV des scores.
- Les données des parties sont isolées derrière une Edge Function ; les joueurs ne peuvent pas consulter directement les bonnes réponses pendant une question.

## Vérifications avant production

- Actualisation par interrogation toutes les 1,5 secondes (pas encore de Supabase Realtime). Le fonctionnement simultané à 50 joueurs doit être testé et les quotas Supabase vérifiés.
- Le QR code et le lien de connexion incluent le PIN et le chemin `/agire-quiz/`.
- La reconnexion joueur utilise `sessionStorage` : un rechargement du même onglet fonctionne, mais pas un autre navigateur.
- Pas de restriction anti-abus par adresse IP / CAPTCHA sur la fonction publique ; mettre en place un contrôle de débit avant une diffusion large.
- L'enregistrement des scores à la correction utilise des mises à jour successives : éviter les doubles clics sur « Afficher la correction » et migrer vers une fonction SQL transactionnelle avant production.
- Les résultats CSV contiennent les pseudos et les points, sans détail question par question.
- Les quiz créés par tous les administrateurs sont visibles par tous les administrateurs.
- La compilation a été vérifiée avec `npm run build`.

## Sécurité

Les clés `service_role` restent exclusivement dans les secrets Supabase Edge Functions. Les tables des parties n'ont aucune politique d'accès direct pour les clients. L'accès administrateur est contrôlé via la table `profiles`. Les pseudonymes doivent rester non identifiants pour minimiser les données personnelles.

## Mode Code de la route

Le nouveau mode se trouve dans **Administration > Bibliothèque Code de la route**. Le nombre de diapositives (1 à 40) se choisit lors de la création de la série. Lire `DEPLOIEMENT-CODE-DE-LA-ROUTE.md` avant le déploiement : les migrations `002_road_quiz.sql` et `003_road_multiple_answers.sql` et la fonction `road-api` sont indispensables.
