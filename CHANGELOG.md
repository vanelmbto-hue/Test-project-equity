# Changelog - Amindis Equity Oracle

## Version 2.0.2 - 26 Septembre 2025 (Suite)

### ✨ Nouvelles fonctionnalités

#### Returns Year-to-Date (YTD) pour les indices mondiaux
- **✅ Affichage des returns YTD** : 
  - Calcul automatique du rendement depuis le début de l'année
  - Coloration dynamique : vert pour gains, rouge pour pertes
  - Mise à jour pour tous les indices (US, Europe, Asie)
  - Format : +X.XX% ou -X.XX% avec couleur appropriée

#### Graphique de Rolling Returns 3 ans
- **✅ Nouveau graphique de rolling returns** :
  - Affichage des rendements glissants sur 3 ans
  - 5 indices principaux : S&P 500, CAC 40, DAX, FTSE 100, Nikkei 225
  - Graphique en ligne avec couleurs distinctes
  - Placé sous le graphique de performance des indices
  - Calcul des rendements annualisés sur fenêtre glissante

### 🔧 Améliorations techniques
- **Nouveau module `indices-analytics.js`** : 
  - Classe spécialisée pour les calculs d'indices
  - Cache intelligent de 1 minute pour optimiser les performances
  - Fonctions de calcul YTD et rolling returns
- **Amélioration de l'interface** :
  - Indicateurs de chargement pendant la récupération des données
  - Gestion des erreurs avec messages explicites
  - Affichage responsif des nouveaux éléments

### 🎯 Fonctionnalités ajoutées
1. **Returns YTD** : Visible directement sur la page d'accueil pour chaque indice
2. **Rolling Returns Chart** : Graphique dynamique chargé après les indices
3. **Coloration conditionnelle** : Rouge/vert selon performance positive/négative
4. **Optimisation des requêtes** : Cache pour éviter les appels API redondants

## Version 2.0.1 - 26 Septembre 2025

### 🐛 Corrections de bugs majeurs

#### Métriques financières corrigées
- **✅ Volatilité 5 ans** : 
  - **Problème**: Affichait des valeurs aberrantes (ex: 3152.22%)
  - **Solution**: Amélioration du filtrage des rendements aberrants, plafonnement intelligent à 150%
  - **Résultat**: Volatilité maintenant réaliste et cohérente avec les standards du marché

- **✅ Return Total 5 ans** :
  - **Problème**: N'affichait pas de valeur ou affichait 0.00%
  - **Solution**: Correction du calcul du return cumulé sur la période disponible
  - **Résultat**: Affichage correct du return total cumulé en pourcentage

- **✅ Calcul automatique des métriques** :
  - **Problème**: Les métriques ne se calculaient pas après le chargement des données
  - **Solution**: Ajout d'un déclencheur automatique après le chargement des données
  - **Résultat**: Les métriques s'affichent automatiquement sans clic sur "Recalculer"

#### Améliorations techniques
- **Gestion des données chronologiques** : Correction de l'ordre des données pour les calculs (plus ancien → plus récent)
- **Filtrage amélioré** : Meilleure détection et exclusion des splits et ajustements de prix
- **Validation des données** : Vérification de la qualité des données avant calcul
- **Logs de débogage** : Ajout de logs détaillés pour tracer les calculs
- **Plafonnement intelligent** : Limites réalistes pour éviter les valeurs aberrantes

### 📊 Métriques affichées
- **Volatilité annualisée** : Sur la période disponible (jusqu'à 5 ans)
- **Return total cumulé** : Gain/perte total en % sur la période
- **Corrélation sectorielle** : Corrélation avec le benchmark du secteur
- **Tracking Error** : Écart de suivi vs benchmark
- **Sharpe Ratio** : Ratio rendement/risque
- **Beta** : Sensibilité au marché
- **Alpha** : Surperformance vs secteur
- **Maximum Drawdown** : Perte maximale historique

### 🔧 Détails techniques
- Utilisation de rendements logarithmiques pour plus de précision
- Annualisation basée sur 252 jours de trading
- Taux sans risque fixé à 3% (obligations européennes)
- Filtrage des rendements > ±100% par jour (splits/erreurs)

---

## Version 2.0.0 - 18 Septembre 2025

### ✨ Interface révolutionnaire
- **Interface Modal Visuelle** : Remplacement des prompts texte par une interface graphique
- **Sélection par pays** : 8 panneaux avec drapeaux pour sélectionner les bourses
- **Panneaux d'entreprises** : Affichage visuel avec secteurs et icônes
- **Design responsive** : Adaptation automatique à toutes les tailles d'écran

### 📊 Couverture étendue
- **15 marchés européens** couverts
- **200+ entreprises** avec classification sectorielle STOXX
- **Matrice Pays/Secteurs** interactive
- **Données en temps réel** via Yahoo Finance

### 🛠️ Architecture technique
- **Hono Framework** pour le backend léger
- **Cloudflare Workers** pour le déploiement edge
- **TailwindCSS** pour le design
- **Chart.js** pour les graphiques

---

## Version 1.0.0 - Septembre 2025

### 🎉 Lancement initial
- API de données financières
- Graphiques interactifs
- Analyse technique de base
- Export CSV/Excel
- Support CAC40 et DAX30