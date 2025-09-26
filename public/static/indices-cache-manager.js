// Gestionnaire de cache avancé pour les indices
// Utilise localStorage pour persister les données et réduire les appels API

class IndicesCacheManager {
    constructor() {
        this.CACHE_PREFIX = 'indices_cache_';
        this.CACHE_DURATION = {
            ytd: 5 * 60 * 1000,      // 5 minutes pour YTD
            rolling: 30 * 60 * 1000,  // 30 minutes pour rolling returns
            history: 60 * 60 * 1000   // 1 heure pour l'historique
        };
        this.pendingRequests = new Map(); // Pour éviter les requêtes multiples
    }

    // Générer une clé de cache
    getCacheKey(type, params) {
        return `${this.CACHE_PREFIX}${type}_${JSON.stringify(params)}`;
    }

    // Récupérer du cache
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const data = JSON.parse(cached);
            const now = Date.now();

            // Vérifier l'expiration
            if (data.expires && now > data.expires) {
                localStorage.removeItem(key);
                return null;
            }

            console.log(`📦 Cache hit: ${key}`);
            return data.value;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    // Sauvegarder dans le cache
    saveToCache(key, value, duration) {
        try {
            const data = {
                value: value,
                expires: Date.now() + duration,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`💾 Cache saved: ${key}`);
        } catch (error) {
            // Si localStorage est plein, nettoyer les anciennes entrées
            if (error.name === 'QuotaExceededError') {
                this.cleanupCache();
                // Réessayer
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (e) {
                    console.error('Cache save failed after cleanup:', e);
                }
            }
        }
    }

    // Nettoyer le cache expiré
    cleanupCache() {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        let removed = 0;

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.expires && now > data.expires) {
                        localStorage.removeItem(key);
                        removed++;
                    }
                } catch (e) {
                    // Supprimer les entrées corrompues
                    localStorage.removeItem(key);
                    removed++;
                }
            }
        });

        console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }

    // Récupérer les données avec cache et déduplication
    async fetchWithCache(key, fetchFunction, duration) {
        // Vérifier le cache d'abord
        const cached = this.getFromCache(key);
        if (cached) {
            return cached;
        }

        // Vérifier si une requête est déjà en cours
        if (this.pendingRequests.has(key)) {
            console.log(`⏳ Waiting for pending request: ${key}`);
            return this.pendingRequests.get(key);
        }

        // Créer une nouvelle requête
        const promise = fetchFunction().then(data => {
            // Sauvegarder dans le cache
            this.saveToCache(key, data, duration);
            // Retirer de la liste des requêtes en cours
            this.pendingRequests.delete(key);
            return data;
        }).catch(error => {
            this.pendingRequests.delete(key);
            throw error;
        });

        // Ajouter à la liste des requêtes en cours
        this.pendingRequests.set(key, promise);
        return promise;
    }

    // Précharger les données importantes
    async preloadEssentialData() {
        console.log('🚀 Preloading essential indices data...');

        // Liste des indices essentiels
        const essentialIndices = ['^GSPC', '^FCHI', '^GDAXI', '^FTSE', '^N225'];

        // Précharger les YTD
        const ytdPromises = essentialIndices.map(symbol => {
            const key = this.getCacheKey('ytd', { symbol });
            if (!this.getFromCache(key)) {
                return this.fetchIndexYTD(symbol);
            }
            return Promise.resolve();
        });

        // Précharger les rolling returns
        const rollingKey = this.getCacheKey('rolling', { symbols: essentialIndices, years: 3 });
        if (!this.getFromCache(rollingKey)) {
            this.fetchRollingReturns(essentialIndices, 3);
        }

        await Promise.all(ytdPromises);
        console.log('✅ Essential data preloaded');
    }

    // Récupérer le YTD d'un indice
    async fetchIndexYTD(symbol) {
        const key = this.getCacheKey('ytd', { symbol });
        return this.fetchWithCache(key, async () => {
            const response = await axios.get(`/api/stock/${encodeURIComponent(symbol)}`);
            if (response.data && response.data.success) {
                const data = response.data.data;
                return this.calculateYTD(data);
            }
            return null;
        }, this.CACHE_DURATION.ytd);
    }

    // Calculer le YTD
    calculateYTD(data) {
        if (!data || data.length === 0) return null;

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        // Filtrer pour l'année en cours
        const yearData = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startOfYear;
        });

        if (yearData.length < 2) return null;

        const startPrice = parseFloat(yearData[yearData.length - 1].close);
        const currentPrice = parseFloat(yearData[0].close);

        return ((currentPrice / startPrice) - 1) * 100;
    }

    // Récupérer les rolling returns avec cache
    async fetchRollingReturns(symbols, years = 3) {
        const key = this.getCacheKey('rolling', { symbols, years });
        return this.fetchWithCache(key, async () => {
            const results = {};
            
            // Traiter les symboles par batch pour éviter trop de requêtes simultanées
            const batchSize = 2;
            for (let i = 0; i < symbols.length; i += batchSize) {
                const batch = symbols.slice(i, i + batchSize);
                const promises = batch.map(async symbol => {
                    try {
                        const response = await axios.get(`/api/stock/${encodeURIComponent(symbol)}`);
                        if (response.data && response.data.success) {
                            const rollingReturns = this.calculateRollingReturns(response.data.data, years);
                            results[symbol] = rollingReturns;
                        }
                    } catch (error) {
                        console.error(`Error fetching ${symbol}:`, error);
                        results[symbol] = [];
                    }
                });
                await Promise.all(promises);
                
                // Petit délai entre les batchs
                if (i + batchSize < symbols.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            return results;
        }, this.CACHE_DURATION.rolling);
    }

    // Calculer les rolling returns
    calculateRollingReturns(data, years = 3) {
        if (!data || data.length === 0) return [];

        const windowSize = years * 252;
        const rollingReturns = [];
        const chronologicalData = [...data].reverse();

        // Échantillonner les données pour réduire la taille
        // Prendre un point tous les 5 jours pour les graphiques
        const samplingRate = 5;

        for (let i = windowSize; i < chronologicalData.length; i += samplingRate) {
            const startPrice = parseFloat(chronologicalData[i - windowSize].close);
            const endPrice = parseFloat(chronologicalData[i].close);

            if (startPrice > 0 && endPrice > 0) {
                const totalReturn = (endPrice / startPrice) - 1;
                const annualizedReturn = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;

                rollingReturns.push({
                    date: chronologicalData[i].date,
                    return: annualizedReturn
                });
            }
        }

        return rollingReturns;
    }

    // Nettoyer tout le cache
    clearAll() {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`🗑️ Cleared ${cleared} cache entries`);
    }

    // Obtenir des statistiques sur le cache
    getStats() {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));
        const now = Date.now();
        let expired = 0;
        let valid = 0;
        let totalSize = 0;

        cacheKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                totalSize += key.length + JSON.stringify(data).length;
                
                if (data.expires && now > data.expires) {
                    expired++;
                } else {
                    valid++;
                }
            } catch (e) {
                // Ignorer les entrées corrompues
            }
        });

        return {
            total: cacheKeys.length,
            valid,
            expired,
            sizeKB: (totalSize / 1024).toFixed(2)
        };
    }
}

// Export global
window.IndicesCacheManager = IndicesCacheManager;

// Initialiser automatiquement au chargement
window.addEventListener('DOMContentLoaded', () => {
    window.indicesCacheManager = new IndicesCacheManager();
    
    // Nettoyer le cache expiré au démarrage
    window.indicesCacheManager.cleanupCache();
    
    // Précharger les données essentielles après un court délai
    setTimeout(() => {
        window.indicesCacheManager.preloadEssentialData();
    }, 2000);
});