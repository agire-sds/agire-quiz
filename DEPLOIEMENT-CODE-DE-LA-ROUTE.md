# Déploiement du mode Code de la route

Le ZIP de livraison contient uniquement les fichiers ajoutés ou modifiés, dans leurs chemins d'origine. Copier ces fichiers à la racine du dépôt `agire-quiz`.

1. Dans Supabase SQL Editor, exécuter `supabase/migrations/002_road_quiz.sql` **une seule fois**, après `001_initial.sql`, puis `supabase/migrations/003_road_multiple_answers.sql`, puis `supabase/migrations/004_road_auto_save.sql`. Si 002 et 003 ont déjà été exécutées, lancer uniquement 004. La migration crée les séries, les parties, les réponses, le stockage des médias et la correction transactionnelle.
2. Déployer la nouvelle Edge Function : `supabase functions deploy road-api --no-verify-jwt`. Conserver également la fonction `game-api` existante. `road-api` valide elle-même les jetons administrateur et joueur.
3. Garder les secrets GitHub Actions `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` actuels. Aucune clé secrète Supabase ne doit entrer dans le dépôt.
4. Pousser les fichiers sur `main`, puis vérifier le workflow GitHub Pages. L'adresse publique reste `https://agire-sds.github.io/agire-quiz/`.
5. Dans Administration, ouvrir **Bibliothèque Code de la route**, créer une série et choisir son nombre de diapositives (1 à 40). Chaque diapositive nécessite une photo ou vidéo et 1 à 3 questions. Une question a 2 à 4 réponses et une ou plusieurs bonnes réponses.
6. Faire une répétition avec deux téléphones : connexion par QR/PIN, TOP, revalidation d'une réponse avant 15 s, correction, classement, export XLSX et rechargement de la page animateur pendant une partie.

Le mode classique, ses tables et sa fonction `game-api` restent en place. Les médias du nouveau mode sont publics dans le bucket `road-media` ; éviter les images ou vidéos confidentielles. Les séries sont modifiables après utilisation, car chaque partie garde une copie de la série au lancement. Supprimer une série ne supprime pas ses anciennes parties.

Le bouton ZIP exporte la série et ses médias ; l'import recrée les médias dans Supabase. Le résultat XLSX exporte le score par diapositive et le temps cumulé des réponses correctes. Le score est de 1 point par diapositive si toutes ses questions sont correctes. Chaque choix est enregistré automatiquement. Le bouton Valider donne le bonus de vitesse ; sans validation, ce bonus est de 0.

La reprise après incident utilise la partie enregistrée dans Supabase. L'animateur peut rouvrir `#/road/host/ID_DE_PARTIE` ; un joueur retrouve son identité sur le même navigateur et dans le même onglet. Le mode automatique est conservé dans le navigateur de l'animateur. Si un autre appareil est utilisé, il faut rouvrir l'URL de la partie et activer à nouveau le mode automatique.

La compilation locale a réussi avec `npm run build`. Aucun test de bout en bout connecté à Supabase n'a pu être réalisé ici, faute de paramètres et d'accès au projet Supabase de production.
