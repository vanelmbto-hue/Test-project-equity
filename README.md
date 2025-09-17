# Plateforme de Prix d'Actions

## Aperçu du Projet
- **Nom** : Plateforme de Prix d'Actions
- **Objectif** : Collecter et afficher les données historiques des prix d'actions d'entreprises cotées en bourse
- **Fonctionnalités principales** : 
  - Recherche d'entreprises par nom ou symbole
  - Affichage des données historiques complètes
  - Graphiques interactifs des prix
  - Filtrage par période
  - Export CSV des données
  - Interface responsive et moderne

## URLs
- **Production** : https://3000-i0vdzrb2wyi61rtlqdfem-6532622b.e2b.dev
- **GitHub** : À déployer
- **API Status** : https://3000-i0vdzrb2wyi61rtlqdfem-6532622b.e2b.dev/api/status

## Fonctionnalités Implémentées ✅
1. **Interface de recherche** : Barre de recherche avec suggestions automatiques
2. **API de recherche** : `/api/search/:query` - Recherche d'entreprises par nom/symbole
3. **API de données** : `/api/stock/:symbol` - Récupération de l'historique complet des prix
4. **Filtrage par dates** : `/api/stock/:symbol/range?start=YYYY-MM-DD&end=YYYY-MM-DD`
5. **Graphiques interactifs** : Visualisation des prix avec Chart.js
6. **Tableau de données** : Affichage paginé avec tri et navigation
7. **Export CSV** : Téléchargement des données au format CSV
8. **Interface responsive** : Design adaptatif pour tous les appareils

## Endpoints API Fonctionnels
- `GET /api/status` - Statut de l'API
- `GET /api/search/:query` - Recherche d'entreprises (min 2 caractères)
- `GET /api/stock/:symbol` - Données historiques complètes d'une action
- `GET /api/stock/:symbol/range?start=YYYY-MM-DD&end=YYYY-MM-DD` - Données avec filtre de dates

## Architecture des Données
- **Source de données** : Yahoo Finance API (finance.yahoo.com)
- **Couverture historique** : Données quotidiennes depuis la création de l'entreprise
- **Exemple de couverture** : NVIDIA (NVDA) - 6704+ jours d'historique disponibles
- **Format des données** : 
  - Date, Prix d'ouverture, Plus haut, Plus bas, Prix de clôture, Volume
  - Calcul automatique des variations en pourcentage
- **Performance** : Recherche temps réel avec suggestions, chargement rapide des données

## Sources de Données Supportées
1. **Yahoo Finance** (Principal) ✅
   - API : `query1.finance.yahoo.com` et `query2.finance.yahoo.com`
   - Couverture : Actions mondiales, ETFs, indices
   - Historique : Complet depuis la création

2. **Investing.com** (Prévu) 🔄
   - En développement pour diversifier les sources

## Guide Utilisateur

### Recherche d'Actions
1. **Recherche basique** : Entrez un symbole (ex: NVDA, AAPL) ou nom d'entreprise
2. **Suggestions automatiques** : Tapez au moins 2 caractères pour voir les suggestions
3. **Sélection rapide** : Cliquez sur une suggestion pour rechercher automatiquement

### Visualisation des Données
1. **Graphique interactif** : Visualisation des prix sur les 90 derniers jours
2. **Tableau détaillé** : Données complètes avec pagination (50/100/250/500 lignes)
3. **Filtrage par dates** : Sélectionnez une période spécifique avec les champs de dates
4. **Export des données** : Bouton "Exporter CSV" pour télécharger les données

### Navigation du Tableau
- **Pagination** : Boutons Précédent/Suivant pour naviguer dans l'historique
- **Nombre d'entrées** : Sélecteur pour ajuster le nombre de lignes affichées
- **Variations** : Couleurs automatiques (vert/rouge) pour les variations de prix

## Déploiement
- **Plateforme** : Cloudflare Pages (prévu)
- **Statut actuel** : ✅ Développement actif
- **Stack technique** : 
  - Backend : Hono + TypeScript
  - Frontend : HTML/CSS/JavaScript natif + TailwindCSS
  - Graphiques : Chart.js
  - Requêtes : Axios
- **Dernière mise à jour** : 2025-09-17

## Exemples d'Usage

### Recherche d'Entreprises Populaires
- `NVDA` - NVIDIA Corporation
- `AAPL` - Apple Inc.
- `MSFT` - Microsoft Corporation
- `GOOGL` - Alphabet Inc.
- `TSLA` - Tesla Inc.
- `AMZN` - Amazon.com Inc.

### Cas d'Usage Typiques
1. **Analyse technique** : Consulter l'historique des prix pour identifier des tendances
2. **Recherche fondamentale** : Examiner la performance historique d'une entreprise
3. **Comparaison de périodes** : Utiliser les filtres de dates pour analyser des périodes spécifiques
4. **Export de données** : Télécharger les données pour analyse externe (Excel, etc.)

## Fonctionnalités Non Implémentées 🔄
1. **Stockage persistant** : Base de données Cloudflare D1 pour cache et favoris
2. **Comparaison d'actions** : Graphiques comparatifs entre plusieurs entreprises
3. **Alertes de prix** : Notifications pour des seuils de prix spécifiques
4. **Portfolio tracking** : Suivi de portefeuille personnel
5. **Sources multiples** : Intégration d'Investing.com et autres sources
6. **Données intraday** : Prix en temps réel (actuellement quotidiens uniquement)

## Prochaines Étapes Recommandées
1. **Configuration Cloudflare D1** : Pour le stockage de cache et améliorer les performances
2. **Déploiement production** : Mise en ligne sur Cloudflare Pages
3. **Source de données secondaire** : Intégration d'Investing.com comme backup
4. **Fonctionnalités avancées** : Comparaison d'actions multiples
5. **Optimisation mobile** : Améliorer l'expérience sur smartphones
6. **Indicateurs techniques** : Moyennes mobiles, RSI, MACD, etc.

## Performance et Limitations
- **Vitesse de recherche** : ~200-500ms par requête API
- **Limitation de taux** : Dépendant de Yahoo Finance (généralement pas de limite stricte)
- **Données en temps réel** : Délai de ~15-20 minutes (standard pour données gratuites)
- **Couverture géographique** : Marchés mondiaux supportés (US, Europe, Asie, etc.)