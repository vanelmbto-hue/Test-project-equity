// Version optimisée des calculs d'indices qui utilise la base de données D1
// Pour des performances maximales

class OptimizedIndicesAnalytics {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes cache
        this.useDatabase = false; // Désactivé car la DB n'est pas accessible via Pages
        this.cacheManager = window.indicesCacheManager || null;
    }

    /**
     * Récupère les données YTD depuis la DB ou l'API
     */
    async fetchYTDFromDatabase() {
        const cacheKey = 'ytd_all';
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📊 Using cached YTD data');
                return cached.data;
            }
        }
        
        try {
            // Essayer d'abord la DB
            const response = await axios.get('/api/indices/ytd');
            if (response.data && response.data.success) {
                const data = response.data.data;
                
                // Transformer en format attendu
                const formatted = {};
                data.forEach(item => {
                    formatted[item.symbol] = {
                        name: item.name,
                        country: item.country,
                        ytdReturn: item.ytd_return,
                        lastUpdate: item.last_update
                    };
                });
                
                // Mettre en cache
                this.cache.set(cacheKey, {
                    data: formatted,
                    timestamp: Date.now()
                });
                
                console.log('✅ YTD data loaded from database');
                return formatted;
            }
        } catch (error) {
            console.warn('⚠️ Database unavailable, falling back to API calls');
        }
        
        // Fallback vers l'API classique si la DB n'est pas disponible
        return null;
    }

    /**
     * Récupère les rolling returns depuis la DB
     */
    async fetchRollingReturnsFromDatabase(symbols, years = 3) {
        const cacheKey = `rolling_${years}_${symbols.join(',')}`;
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📊 Using cached rolling returns');
                return cached.data;
            }
        }
        
        try {
            const response = await axios.get(`/api/indices/rolling/${years}?symbols=${symbols.join(',')}`);
            if (response.data && response.data.success) {
                const data = response.data.data;
                
                // Mettre en cache
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                console.log('✅ Rolling returns loaded from database');
                return data;
            }
        } catch (error) {
            console.warn('⚠️ Database unavailable for rolling returns');
        }
        
        return null;
    }

    /**
     * Récupère les données YTD pour affichage (avec fallback)
     */
    async fetchMultipleIndicesYTD(indices) {
        // Utiliser le cache manager si disponible
        if (this.cacheManager) {
            const results = {};
            const promises = [];
            
            for (const [symbol, info] of Object.entries(indices)) {
                promises.push(
                    this.cacheManager.fetchIndexYTD(symbol).then(ytdReturn => {
                        results[symbol] = {
                            ...info,
                            ytdReturn: ytdReturn
                        };
                    }).catch(error => {
                        console.error(`Error fetching YTD for ${symbol}:`, error);
                        results[symbol] = {
                            ...info,
                            ytdReturn: null
                        };
                    })
                );
            }
            
            await Promise.all(promises);
            return results;
        }
        
        // Essayer d'abord la DB (si activée)
        if (this.useDatabase) {
            const dbData = await this.fetchYTDFromDatabase();
            if (dbData) {
            // Filtrer et formater pour les indices demandés
            const results = {};
            for (const [symbol, info] of Object.entries(indices)) {
                if (dbData[symbol]) {
                    results[symbol] = {
                        ...info,
                        ...dbData[symbol]
                    };
                } else {
                    // Si pas dans la DB, utiliser l'API classique
                    results[symbol] = {
                        ...info,
                        ytdReturn: null
                    };
                }
            }
            return results;
        }
        
        // Fallback vers la méthode classique (héritée)
        if (window.IndicesAnalytics) {
            const fallback = new IndicesAnalytics();
            return fallback.fetchMultipleIndicesYTD(indices);
        }
        
        // Retour par défaut
        const results = {};
        for (const [symbol, info] of Object.entries(indices)) {
            results[symbol] = {
                ...info,
                ytdReturn: null
            };
        }
        return results;
    }

    /**
     * Récupère les rolling returns optimisés
     */
    async fetchMultipleIndicesRollingReturns(symbols, years = 3) {
        // Utiliser le cache manager si disponible
        if (this.cacheManager) {
            try {
                const data = await this.cacheManager.fetchRollingReturns(symbols, years);
                if (data && Object.keys(data).length > 0) {
                    return data;
                }
            } catch (error) {
                console.error('Error with cache manager:', error);
            }
        }
        
        // Essayer d'abord la DB (si activée)
        if (this.useDatabase) {
            const dbData = await this.fetchRollingReturnsFromDatabase(symbols, years);
            if (dbData && Object.keys(dbData).length > 0) {
                return dbData;
            }
        }
        
        // Fallback vers la méthode classique si nécessaire
        if (window.IndicesAnalytics) {
            console.log('⚠️ Falling back to API calls for rolling returns');
            const fallback = new IndicesAnalytics();
            return fallback.fetchMultipleIndicesRollingReturns(symbols, years);
        }
        
        return {};
    }

    // Méthodes utilitaires (identiques à la version classique)
    formatReturn(value) {
        if (value === null || value === undefined) {
            return {
                text: 'N/A',
                color: 'gray',
                class: 'text-gray-500'
            };
        }
        
        const formatted = value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
        const color = value >= 0 ? 'green' : 'red';
        const className = value >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
        
        return {
            text: formatted,
            color: color,
            class: className
        };
    }

    prepareRollingReturnsChartData(rollingReturnsData, indexNames) {
        const datasets = [];
        const colors = {
            '^GSPC': { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.1)' },
            '^FCHI': { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.1)' },
            '^GDAXI': { border: 'rgb(34, 197, 94)', background: 'rgba(34, 197, 94, 0.1)' },
            '^FTSE': { border: 'rgb(168, 85, 247)', background: 'rgba(168, 85, 247, 0.1)' },
            '^N225': { border: 'rgb(251, 146, 60)', background: 'rgba(251, 146, 60, 0.1)' }
        };
        
        // Trouver toutes les dates uniques
        const allDates = new Set();
        Object.values(rollingReturnsData).forEach(data => {
            if (Array.isArray(data)) {
                data.forEach(item => allDates.add(item.date));
            }
        });
        
        const sortedDates = Array.from(allDates).sort();
        
        // Créer un dataset pour chaque indice
        Object.entries(rollingReturnsData).forEach(([symbol, data]) => {
            if (!Array.isArray(data)) return;
            
            const dataMap = new Map(data.map(item => [item.date, item.return || item.value]));
            
            datasets.push({
                label: indexNames[symbol] || symbol,
                data: sortedDates.map(date => ({
                    x: date,
                    y: dataMap.get(date) || null
                })),
                borderColor: colors[symbol]?.border || 'rgb(156, 163, 175)',
                backgroundColor: colors[symbol]?.background || 'rgba(156, 163, 175, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: false,
                spanGaps: true,
                pointRadius: 0,
                pointHoverRadius: 4
            });
        });
        
        return {
            labels: sortedDates,
            datasets: datasets
        };
    }
}

// Remplacer automatiquement la classe existante si elle existe
if (typeof window !== 'undefined') {
    window.OptimizedIndicesAnalytics = OptimizedIndicesAnalytics;
    
    // Remplacer automatiquement IndicesAnalytics par la version optimisée
    if (!window.IndicesAnalyticsOriginal) {
        window.IndicesAnalyticsOriginal = window.IndicesAnalytics;
    }
    window.IndicesAnalytics = OptimizedIndicesAnalytics;
}