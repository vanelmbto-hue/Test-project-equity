#!/usr/bin/env node

// Script pour peupler la base de données avec les données historiques des indices
// Usage: node scripts/populate-indices-db.js

const axios = require('axios');
const { D1Database } = require('@cloudflare/d1');

// Configuration
const INDICES_TO_FETCH = {
    national: [
        '^GSPC', // S&P 500
        '^DJI',  // Dow Jones
        '^IXIC', // NASDAQ
        '^FCHI', // CAC 40
        '^GDAXI', // DAX
        '^FTSE', // FTSE 100
        '^AEX',  // AEX
        '^N225', // Nikkei 225
        '^HSI',  // Hang Seng
        '^KS11'  // KOSPI
    ],
    stoxx: [
        'SX8P.DE',  // Technology
        'SXKP.DE',  // Telecoms
        'SXDP.DE',  // Health
        'SXFP.DE',  // Finance
        'SX7P.DE',  // Banks
        'SXIP.DE',  // Insurance
        'SXAP.DE',  // Auto
        'SX3P.DE',  // Food
        'SXNP.DE',  // Industrial
        'SXEP.DE',  // Energy
        'SX6P.DE'   // Utilities
    ]
};

// Fonction pour télécharger les données d'un indice
async function fetchIndexData(symbol, years = 5) {
    console.log(`📊 Téléchargement des données pour ${symbol}...`);
    
    try {
        const endDate = Math.floor(Date.now() / 1000);
        const startDate = endDate - (years * 365 * 24 * 60 * 60); // 5 ans de données
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${startDate}&period2=${endDate}&interval=1d&includePrePost=true&events=div%2Csplit`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.data || !response.data.chart || !response.data.chart.result) {
            throw new Error('Invalid response format');
        }
        
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        
        const data = [];
        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.close[i] !== null) {
                data.push({
                    date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                    open: quotes.open[i],
                    high: quotes.high[i],
                    low: quotes.low[i],
                    close: quotes.close[i],
                    volume: quotes.volume[i]
                });
            }
        }
        
        console.log(`✅ ${symbol}: ${data.length} jours de données récupérés`);
        return { symbol, data, metadata: result.meta };
        
    } catch (error) {
        console.error(`❌ Erreur pour ${symbol}:`, error.message);
        return null;
    }
}

// Fonction pour calculer les rolling returns
function calculateRollingReturns(data, windowYears = 3) {
    const windowSize = windowYears * 252; // Jours de trading par an
    const rollingReturns = [];
    
    // Trier les données par date (ordre chronologique)
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (let i = windowSize; i < sortedData.length; i++) {
        const startPrice = sortedData[i - windowSize].close;
        const endPrice = sortedData[i].close;
        
        if (startPrice && endPrice) {
            const totalReturn = (endPrice / startPrice) - 1;
            const annualizedReturn = (Math.pow(1 + totalReturn, 1 / windowYears) - 1) * 100;
            
            rollingReturns.push({
                date: sortedData[i].date,
                value: annualizedReturn
            });
        }
    }
    
    return rollingReturns;
}

// Fonction pour calculer le YTD
function calculateYTD(data) {
    const currentYear = new Date().getFullYear();
    const yearData = data.filter(d => new Date(d.date).getFullYear() === currentYear);
    
    if (yearData.length < 2) return null;
    
    const sortedData = [...yearData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startPrice = sortedData[0].close;
    const endPrice = sortedData[sortedData.length - 1].close;
    
    return ((endPrice / startPrice) - 1) * 100;
}

// Fonction principale
async function main() {
    console.log('🚀 Début du téléchargement des données des indices...\n');
    
    const allData = {
        national: [],
        stoxx: []
    };
    
    // Télécharger les indices nationaux
    console.log('📈 Indices nationaux:');
    for (const symbol of INDICES_TO_FETCH.national) {
        const result = await fetchIndexData(symbol);
        if (result) {
            allData.national.push(result);
            // Attendre un peu entre les requêtes pour éviter le rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n📊 Indices STOXX:');
    for (const symbol of INDICES_TO_FETCH.stoxx) {
        const result = await fetchIndexData(symbol);
        if (result) {
            allData.stoxx.push(result);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Calculer les métriques
    console.log('\n🧮 Calcul des métriques...');
    
    for (const indexData of [...allData.national, ...allData.stoxx]) {
        if (!indexData) continue;
        
        // Calculer rolling returns 3 ans
        const rolling3y = calculateRollingReturns(indexData.data, 3);
        
        // Calculer YTD
        const ytd = calculateYTD(indexData.data);
        
        console.log(`${indexData.symbol}: ${rolling3y.length} rolling returns, YTD: ${ytd?.toFixed(2)}%`);
    }
    
    // Sauvegarder dans un fichier JSON pour import ultérieur
    const fs = require('fs');
    const outputPath = './indices-data.json';
    
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
    console.log(`\n✅ Données sauvegardées dans ${outputPath}`);
    console.log(`📊 Total: ${allData.national.length} indices nationaux, ${allData.stoxx.length} indices STOXX`);
}

// Lancer le script
if (require.main === module) {
    main().catch(console.error);
}