// Calculs avancés pour les indices boursiers
// YTD Returns, Rolling Returns, Performance comparisons

class IndicesAnalytics {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
    }

    /**
     * Calcule le return Year-to-Date (YTD)
     * @param {Array} data - Données historiques de l'indice
     * @returns {number} - Return YTD en pourcentage
     */
    calculateYTDReturn(data) {
        if (!data || data.length === 0) return null;
        
        // Trouver le dernier jour de trading de l'année précédente
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        
        // Filtrer les données pour l'année en cours
        const yearData = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startOfYear;
        });
        
        if (yearData.length < 2) {
            // Si on n'a pas assez de données pour l'année, prendre la dernière donnée de l'année précédente
            const lastYearData = data.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate < startOfYear;
            });
            
            if (lastYearData.length === 0) return null;
            
            const startPrice = parseFloat(lastYearData[0].close); // Plus récente de l'année précédente
            const currentPrice = parseFloat(data[0].close); // Prix actuel
            
            return ((currentPrice / startPrice) - 1) * 100;
        }
        
        // Calculer le return YTD
        const startPrice = parseFloat(yearData[yearData.length - 1].close); // Premier jour de l'année
        const currentPrice = parseFloat(yearData[0].close); // Prix actuel
        
        return ((currentPrice / startPrice) - 1) * 100;
    }

    /**
     * Calcule les rolling returns sur une période donnée
     * @param {Array} data - Données historiques
     * @param {number} years - Nombre d'années pour le rolling return
     * @returns {Array} - Série temporelle des rolling returns
     */
    calculateRollingReturns(data, years = 3) {
        if (!data || data.length === 0) return [];
        
        const tradingDaysPerYear = 252;
        const windowSize = years * tradingDaysPerYear;
        const rollingReturns = [];
        
        // Les données sont en ordre inverse (plus récent en premier)
        // On doit les inverser pour le calcul
        const chronologicalData = [...data].reverse();
        
        // Calculer le rolling return pour chaque point possible
        for (let i = windowSize; i < chronologicalData.length; i++) {
            const startPrice = parseFloat(chronologicalData[i - windowSize].close);
            const endPrice = parseFloat(chronologicalData[i].close);
            
            if (startPrice > 0 && endPrice > 0) {
                // Return annualisé sur la période
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

    /**
     * Récupère les données d'un indice avec cache
     * @param {string} symbol - Symbole de l'indice
     * @returns {Promise} - Données de l'indice
     */
    async fetchIndexData(symbol) {
        // Vérifier le cache
        const cacheKey = `index_${symbol}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            const response = await axios.get(`/api/stock/${encodeURIComponent(symbol)}`);
            if (response.data && response.data.success) {
                const data = response.data.data;
                
                // Mettre en cache
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                return data;
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'indice ${symbol}:`, error);
            return null;
        }
    }

    /**
     * Récupère les données YTD pour plusieurs indices
     * @param {Object} indices - Objet avec les symboles des indices
     * @returns {Promise<Object>} - Returns YTD pour chaque indice
     */
    async fetchMultipleIndicesYTD(indices) {
        const results = {};
        
        for (const [symbol, info] of Object.entries(indices)) {
            try {
                const data = await this.fetchIndexData(symbol);
                if (data) {
                    const ytdReturn = this.calculateYTDReturn(data);
                    results[symbol] = {
                        ...info,
                        ytdReturn: ytdReturn,
                        lastPrice: data[0] ? parseFloat(data[0].close) : null,
                        lastUpdate: data[0] ? data[0].date : null
                    };
                }
            } catch (error) {
                console.error(`Erreur pour ${symbol}:`, error);
                results[symbol] = {
                    ...info,
                    ytdReturn: null,
                    lastPrice: null,
                    lastUpdate: null
                };
            }
        }
        
        return results;
    }

    /**
     * Récupère les rolling returns pour plusieurs indices
     * @param {Array} symbols - Liste des symboles
     * @param {number} years - Période de rolling (défaut 3 ans)
     * @returns {Promise<Object>} - Rolling returns pour chaque indice
     */
    async fetchMultipleIndicesRollingReturns(symbols, years = 3) {
        const results = {};
        
        for (const symbol of symbols) {
            try {
                const data = await this.fetchIndexData(symbol);
                if (data) {
                    const rollingReturns = this.calculateRollingReturns(data, years);
                    results[symbol] = rollingReturns;
                }
            } catch (error) {
                console.error(`Erreur rolling returns pour ${symbol}:`, error);
                results[symbol] = [];
            }
        }
        
        return results;
    }

    /**
     * Formate un return pour l'affichage avec couleur
     * @param {number} value - Valeur du return
     * @returns {Object} - Objet avec la valeur formatée et la couleur
     */
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

    /**
     * Prépare les données pour Chart.js (rolling returns)
     * @param {Object} rollingReturnsData - Données de rolling returns par symbole
     * @param {Object} indexNames - Noms des indices
     * @returns {Object} - Configuration pour Chart.js
     */
    prepareRollingReturnsChartData(rollingReturnsData, indexNames) {
        const datasets = [];
        const colors = {
            '^GSPC': { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.1)' }, // Bleu
            '^FCHI': { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.1)' }, // Rouge
            '^GDAXI': { border: 'rgb(34, 197, 94)', background: 'rgba(34, 197, 94, 0.1)' }, // Vert
            '^FTSE': { border: 'rgb(168, 85, 247)', background: 'rgba(168, 85, 247, 0.1)' }, // Violet
            '^N225': { border: 'rgb(251, 146, 60)', background: 'rgba(251, 146, 60, 0.1)' }  // Orange
        };
        
        // Trouver toutes les dates uniques
        const allDates = new Set();
        Object.values(rollingReturnsData).forEach(data => {
            data.forEach(item => allDates.add(item.date));
        });
        
        const sortedDates = Array.from(allDates).sort();
        
        // Créer un dataset pour chaque indice
        Object.entries(rollingReturnsData).forEach(([symbol, data]) => {
            const dataMap = new Map(data.map(item => [item.date, item.return]));
            
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

// Export global
window.IndicesAnalytics = IndicesAnalytics;