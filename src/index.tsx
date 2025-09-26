import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { getAnalystPageHTML } from './analyst-page'

const app = new Hono()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.get('/api/status', (c) => {
  return c.json({
    success: true,
    message: 'Financial Data API is running',
    endpoints: {
      markets: '/api/markets/overview',
      matrix: '/api/matrix/stoxx-sectors'
    },
    version: '2.0.0'
  })
})

// Markets overview API
app.get('/api/markets/overview', async (c) => {
  // Simulated market data - in production this would fetch real data
  const markets = [
    { index: 'S&P 500', symbol: '^GSPC', value: 5498.42, change: 1.2, country: 'US' },
    { index: 'Dow Jones', symbol: '^DJI', value: 42250.75, change: 0.8, country: 'US' },
    { index: 'NASDAQ', symbol: '^IXIC', value: 17254.82, change: 1.5, country: 'US' },
    { index: 'DAX', symbol: '^GDAXI', value: 19425.60, change: 0.6, country: 'DE' },
    { index: 'CAC 40', symbol: '^FCHI', value: 7625.75, change: 0.3, country: 'FR' },
    { index: 'FTSE 100', symbol: '^FTSE', value: 8285.52, change: -0.2, country: 'GB' },
    { index: 'Nikkei 225', symbol: '^N225', value: 38925.63, change: 1.8, country: 'JP' },
    { index: 'Hang Seng', symbol: '^HSI', value: 17985.20, change: -0.5, country: 'HK' },
    { index: 'Shanghai', symbol: '^SSEC', value: 2895.42, change: -0.8, country: 'CN' },
  ]
  
  return c.json({ success: true, data: markets })
})

// API for stock historical data - Real Yahoo Finance Integration
app.get('/api/stock/:symbol/historical', async (c) => {
  const symbol = c.req.param('symbol')
  const period = c.req.query('period') || '1Y' // 1M, 3M, 6M, 1Y, 5Y, 10Y, MAX
  
  try {
    // Get real historical data from Yahoo Finance
    const historicalData = await fetchYahooHistoricalData(symbol, period)
    
    if (!historicalData || historicalData.length === 0) {
      return c.json({ 
        success: false, 
        error: `No data found for symbol ${symbol.toUpperCase()}. Please verify the symbol is correct.`,
        symbol: symbol.toUpperCase()
      }, 404)
    }
    
    return c.json({ 
      success: true, 
      symbol: symbol.toUpperCase(),
      period,
      data: historicalData,
      count: historicalData.length,
      source: 'Yahoo Finance'
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return c.json({ 
      success: false, 
      error: `Failed to fetch data for ${symbol.toUpperCase()}. ${error instanceof Error ? error.message : 'Unknown error'}`,
      symbol: symbol.toUpperCase()
    }, 500)
  }
})

// API for company info - Real Yahoo Finance Integration
app.get('/api/stock/:symbol/info', async (c) => {
  const symbol = c.req.param('symbol')
  
  try {
    // Get real company info from Yahoo Finance
    const companyInfo = await fetchYahooCompanyInfo(symbol)
    
    if (!companyInfo) {
      return c.json({ 
        success: false, 
        error: `Company information not found for ${symbol.toUpperCase()}`,
        symbol: symbol.toUpperCase()
      }, 404)
    }
    
    return c.json({ 
      success: true, 
      data: companyInfo,
      source: 'Yahoo Finance'
    })
  } catch (error) {
    console.error('Error fetching company info:', error)
    return c.json({ 
      success: false, 
      error: `Failed to fetch company info for ${symbol.toUpperCase()}`,
      symbol: symbol.toUpperCase()
    }, 500)
  }
})

// API for risk-free rates (French government bonds)
app.get('/api/risk-free-rate', async (c) => {
  const period = c.req.query('period') || '5Y'
  
  try {
    // In production, this would fetch from ECB API, Banque de France, or similar
    // For now, return historical estimates based on French 5Y government bonds
    
    const riskFreeRates = {
      '2025': 2.85,
      '2024': 2.80,
      '2023': 2.20,
      '2022': 1.50,
      '2021': 0.30,
      '2020': 0.10,
      '2019': 0.25,
      '2018': 0.45,
      'default': 2.00
    }
    
    const currentYear = new Date().getFullYear().toString()
    const rate = riskFreeRates[currentYear] || riskFreeRates['default']
    
    return c.json({ 
      success: true, 
      data: {
        rate: rate,
        period: period,
        source: 'French Government Bonds (OAT 5Y)',
        date: new Date().toISOString().split('T')[0],
        note: 'Estimated rates based on French Treasury bonds - production should use ECB API'
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch risk-free rate' }, 500)
  }
})

// STOXX Sectors Matrix API
app.get('/api/matrix/stoxx-sectors', async (c) => {
  // This would be populated with real company data
  const matrix = {
    sectors: [
      'Technology',
      'Health Care',
      'Financials',
      'Industrials',
      'Consumer Goods',
      'Consumer Services',
      'Utilities',
      'Telecommunications',
      'Basic Materials',
      'Energy'
    ],
    countries: ['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'CH', 'SE', 'BE', 'DK'],
    data: {} // Will be populated with company classifications
  }
  
  return c.json({ success: true, data: matrix })
})

// Real Yahoo Finance API Integration

// Helper function to convert period to Yahoo Finance range parameter
function periodToYahooRange(period: string): string {
  const periodMap: Record<string, string> = {
    '1M': '1mo',
    '3M': '3mo', 
    '6M': '6mo',
    '1Y': '1y',
    '5Y': '5y',
    '10Y': '10y',
    'MAX': 'max'
  }
  return periodMap[period] || '1y'
}

// Fetch real historical data from Yahoo Finance
async function fetchYahooHistoricalData(symbol: string, period: string) {
  try {
    // Normalize symbol (handle both CAP.PA and CAPGEMINI formats)
    const normalizedSymbol = normalizeSymbol(symbol)
    const range = periodToYahooRange(period)
    
    // Yahoo Finance Chart API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=${range}&interval=1d&indicators=quote&includeTimestamps=true`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://finance.yahoo.com/',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error(`No data found for symbol ${normalizedSymbol}`)
    }
    
    const result = data.chart.result[0]
    const timestamps = result.timestamp
    const quotes = result.indicators.quote[0]
    
    if (!timestamps || !quotes) {
      throw new Error('Invalid data structure from Yahoo Finance')
    }
    
    // Convert to our format
    const historicalData = []
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i]
      const date = new Date(timestamp * 1000)
      
      // Skip if any required data is null
      if (quotes.open[i] == null || quotes.high[i] == null || 
          quotes.low[i] == null || quotes.close[i] == null) {
        continue
      }
      
      const open = parseFloat(quotes.open[i].toFixed(2))
      const high = parseFloat(quotes.high[i].toFixed(2))
      const low = parseFloat(quotes.low[i].toFixed(2))
      const close = parseFloat(quotes.close[i].toFixed(2))
      const volume = quotes.volume[i] || 0
      
      const change = parseFloat((close - open).toFixed(2))
      const changePercent = open > 0 ? parseFloat(((change / open) * 100).toFixed(2)) : 0
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        open,
        high, 
        low,
        close,
        volume,
        change,
        changePercent
      })
    }
    
    return historicalData
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error)
    throw error
  }
}

// Fetch real company info from Yahoo Finance
async function fetchYahooCompanyInfo(symbol: string) {
  try {
    const normalizedSymbol = normalizeSymbol(symbol)
    
    // Yahoo Finance Quote Summary API
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${normalizedSymbol}?modules=assetProfile,summaryProfile,price`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*', 
        'Referer': 'https://finance.yahoo.com/',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.quoteSummary || !data.quoteSummary.result || data.quoteSummary.result.length === 0) {
      throw new Error(`No company info found for ${normalizedSymbol}`)
    }
    
    const result = data.quoteSummary.result[0]
    const assetProfile = result.assetProfile || {}
    const price = result.price || {}
    
    return {
      symbol: normalizedSymbol,
      name: price.longName || price.shortName || normalizedSymbol,
      sector: assetProfile.sector || 'Unknown',
      industry: assetProfile.industry || 'Unknown',
      country: assetProfile.country || 'Unknown',
      currency: price.currency || 'USD',
      marketCap: price.marketCap?.raw || null,
      employees: assetProfile.fullTimeEmployees || null,
      website: assetProfile.website || null,
      description: assetProfile.longBusinessSummary || `${price.longName || normalizedSymbol} company information.`
    }
  } catch (error) {
    console.error(`Error fetching company info for ${symbol}:`, error)
    throw error
  }
}

// Helper function to normalize symbol names
function normalizeSymbol(symbol: string): string {
  // Convert common alternative names to Yahoo Finance symbols
  const symbolMap: Record<string, string> = {
    'CAPGEMINI': 'CAP.PA',  // Capgemini on Euronext Paris
    'LVMH': 'MC.PA',       // LVMH on Euronext Paris
    'LOREAL': 'OR.PA',     // L'Oréal on Euronext Paris
    'SANOFI': 'SAN.PA',    // Sanofi on Euronext Paris
    'AIRBUS': 'AIR.PA',    // Airbus on Euronext Paris
    'BNP': 'BNP.PA',       // BNP Paribas on Euronext Paris
    'PEUGEOT': 'UG.PA',    // Peugeot on Euronext Paris
    'KERING': 'KER.PA',    // Kering on Euronext Paris
    'TOTALENERGIES': 'TTE' // TotalEnergies
  }
  
  const upperSymbol = symbol.toUpperCase()
  return symbolMap[upperSymbol] || symbol.toUpperCase()
}

// Analyst page route  
app.get('/analyst', (c) => {
  const symbol = c.req.query('symbol') || 'CAP.PA'  // Default to Capgemini
  return c.html(getAnalystPageHTML(symbol))
})

// Homepage route
app.get('/', (c) => {
  return c.html(getHomepageHTML())
})

// Function to get homepage HTML
function getHomepageHTML() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Marchés Financiers</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .matrix-cell {
            min-height: 80px;
            max-height: 150px;
            overflow-y: auto;
            scrollbar-width: thin;
        }
        .matrix-cell::-webkit-scrollbar { width: 4px; }
        .matrix-cell::-webkit-scrollbar-track { background: #f1f1f1; }
        .matrix-cell::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
        .flag-icon { width: 20px; height: 15px; display: inline-block; margin-right: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        .nav-active { background-color: #3B82F6; color: white; }
        .company-link { cursor: pointer; transition: all 0.2s; }
        .company-link:hover { background-color: #EBF8FF; color: #1D4ED8; }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header with Navigation -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        <h1 class="text-2xl font-bold text-gray-800">Dashboard Marchés Financiers</h1>
                    </div>
                    
                    <!-- Navigation Buttons -->
                    <div class="flex items-center space-x-4">
                        <nav class="flex space-x-1 bg-gray-100 rounded-lg p-1">
                            <a href="/" class="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                </svg>
                                Overview
                            </a>
                            <a href="/analyst" class="px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-200">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                Analyst
                            </a>
                        </nav>
                        
                        <div class="text-sm text-gray-500">
                            <span id="lastUpdate"></span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <!-- Section 1: Overview des marchés mondiaux -->
            <section class="bg-white rounded-lg shadow-md p-6 fade-in">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Overview des Marchés Mondiaux
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="marketsGrid">
                    <!-- Markets data will be populated here -->
                    <div class="text-center py-8 col-span-3">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p class="text-gray-500 mt-2">Chargement des données...</p>
                    </div>
                </div>
            </section>

            <!-- Section 2: Matrice Secteurs STOXX / Pays -->
            <section class="bg-white rounded-lg shadow-md p-6 fade-in">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                    Matrice Secteurs STOXX / Pays
                </h2>
                
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse" id="matrixTable">
                        <thead>
                            <tr>
                                <th class="border bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                    Secteur / Pays
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="border px-4 py-8 text-center text-gray-500" colspan="11">
                                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p class="mt-2">Chargement de la matrice...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-4 text-sm text-gray-600">
                    <p class="font-semibold">Légende des pays:</p>
                    <div class="grid grid-cols-5 gap-2 mt-2">
                        <span>🇫🇷 FR - France</span>
                        <span>🇩🇪 DE - Allemagne</span>
                        <span>🇬🇧 GB - Royaume-Uni</span>
                        <span>🇮🇹 IT - Italie</span>
                        <span>🇪🇸 ES - Espagne</span>
                        <span>🇳🇱 NL - Pays-Bas</span>
                        <span>🇨🇭 CH - Suisse</span>
                        <span>🇸🇪 SE - Suède</span>
                        <span>🇧🇪 BE - Belgique</span>
                        <span>🇩🇰 DK - Danemark</span>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <script src="/static/companies-data.js"></script>
    <script src="/static/stoxx-sectors.js"></script>
    <script>
        // Update time
        function updateTime() {
            const now = new Date();
            document.getElementById('lastUpdate').textContent = 
                'Dernière mise à jour: ' + now.toLocaleString('fr-FR');
        }
        updateTime();
        setInterval(updateTime, 60000);

        // Load markets overview
        async function loadMarketsOverview() {
            try {
                const response = await fetch('/api/markets/overview');
                const result = await response.json();
                
                if (result.success) {
                    const grid = document.getElementById('marketsGrid');
                    grid.innerHTML = result.data.map(market => {
                        const changeColor = market.change >= 0 ? 'text-green-600' : 'text-red-600';
                        const changeIcon = market.change >= 0 ? '↑' : '↓';
                        const flag = getCountryFlag(market.country);
                        
                        return '<div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">' +
                            '<div class="flex items-center justify-between mb-2">' +
                                '<span class="text-lg font-semibold text-gray-800">' +
                                    flag + ' ' + market.index +
                                '</span>' +
                                '<span class="text-xs text-gray-500">' + market.symbol + '</span>' +
                            '</div>' +
                            '<div class="text-2xl font-bold text-gray-900">' +
                                market.value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
                            '</div>' +
                            '<div class="' + changeColor + ' font-medium">' +
                                changeIcon + ' ' + (market.change > 0 ? '+' : '') + market.change + '%' +
                            '</div>' +
                        '</div>';
                    }).join('');
                }
            } catch (error) {
                console.error('Error loading markets:', error);
            }
        }

        // Country flags mapping
        function getCountryFlag(code) {
            const flags = {
                'US': '🇺🇸', 'DE': '🇩🇪', 'FR': '🇫🇷', 'GB': '🇬🇧',
                'JP': '🇯🇵', 'HK': '🇭🇰', 'CN': '🇨🇳', 'IT': '🇮🇹',
                'ES': '🇪🇸', 'NL': '🇳🇱', 'CH': '🇨🇭', 'SE': '🇸🇪',
                'BE': '🇧🇪', 'DK': '🇩🇰'
            };
            return flags[code] || '🌍';
        }

        // Load STOXX sectors matrix
        async function loadStoxxMatrix() {
            try {
                // Load company data and sectors
                if (typeof window.COMPANIES_DATA === 'undefined' || typeof window.STOXX_SECTORS === 'undefined') {
                    console.warn('Company data not loaded yet, using sample data');
                    displaySampleMatrix();
                    return;
                }

                const sectors = window.STOXX_SECTORS;
                const companies = window.COMPANIES_DATA;
                const countries = ['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'CH', 'SE', 'BE', 'DK'];
                
                // Build matrix
                const matrix = {};
                sectors.forEach(sector => {
                    matrix[sector] = {};
                    countries.forEach(country => {
                        matrix[sector][country] = [];
                    });
                });

                // Classify companies
                Object.values(companies).forEach(company => {
                    if (company.sector && company.country) {
                        if (matrix[company.sector] && matrix[company.sector][company.country]) {
                            matrix[company.sector][company.country].push(company);
                        }
                    }
                });

                // Display matrix
                displayMatrix(sectors, countries, matrix);
                
            } catch (error) {
                console.error('Error loading matrix:', error);
                displaySampleMatrix();
            }
        }

        function displayMatrix(sectors, countries, matrix) {
            const table = document.getElementById('matrixTable');
            
            // Build header
            let headerHtml = '<tr><th class="border bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700">Secteur / Pays</th>';
            countries.forEach(country => {
                headerHtml += '<th class="border bg-gray-100 px-2 py-2 text-center text-sm font-semibold text-gray-700">' + getCountryFlag(country) + '<br>' + country + '</th>';
            });
            headerHtml += '</tr>';
            
            // Build rows
            let bodyHtml = '';
            sectors.forEach((sector, index) => {
                const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                bodyHtml += '<tr class="' + bgColor + '">';
                bodyHtml += '<td class="border px-4 py-2 font-medium text-sm text-gray-700">' + sector + '</td>';
                
                countries.forEach(country => {
                    const companies = matrix[sector][country];
                    const count = companies.length;
                    const bgIntensity = count === 0 ? '' : count <= 2 ? 'bg-blue-50' : count <= 5 ? 'bg-blue-100' : 'bg-blue-200';
                    
                    bodyHtml += '<td class="border px-2 py-2 text-xs ' + bgIntensity + ' matrix-cell">';
                    if (count > 0) {
                        bodyHtml += '<div class="font-semibold text-blue-800 mb-1">' + count + ' société' + (count > 1 ? 's' : '') + '</div>';
                        bodyHtml += '<div class="space-y-1">';
                        companies.slice(0, 3).forEach(company => {
                            bodyHtml += '<div class="text-gray-600 truncate company-link" title="' + company.name + '" onclick="goToAnalyst(' + "'" + company.symbol + "'" + ')">' + company.symbol + '</div>';
                        });
                        if (count > 3) {
                            bodyHtml += '<div class="text-gray-400 italic">+' + (count - 3) + ' autres</div>';
                        }
                        bodyHtml += '</div>';
                    } else {
                        bodyHtml += '<div class="text-gray-400 text-center">-</div>';
                    }
                    bodyHtml += '</td>';
                });
                
                bodyHtml += '</tr>';
            });
            
            table.innerHTML = '<thead>' + headerHtml + '</thead><tbody>' + bodyHtml + '</tbody>';
        }

        function displaySampleMatrix() {
            // Sample matrix with some example companies
            const sectors = [
                'Technology',
                'Health Care', 
                'Financials',
                'Industrials',
                'Consumer Goods',
                'Consumer Services',
                'Utilities',
                'Telecommunications',
                'Basic Materials',
                'Energy'
            ];
            
            const countries = ['FR', 'DE', 'GB', 'IT', 'ES', 'NL', 'CH', 'SE', 'BE', 'DK'];
            
            const sampleMatrix = {
                'Technology': {
                    'FR': [{symbol: 'CAP', name: 'Capgemini'}, {symbol: 'STM', name: 'STMicroelectronics'}],
                    'DE': [{symbol: 'SAP', name: 'SAP'}, {symbol: 'IFX', name: 'Infineon'}],
                    'NL': [{symbol: 'ASML', name: 'ASML'}]
                },
                'Health Care': {
                    'FR': [{symbol: 'SAN', name: 'Sanofi'}],
                    'CH': [{symbol: 'ROG', name: 'Roche'}, {symbol: 'NOVN', name: 'Novartis'}],
                    'DK': [{symbol: 'NOVO B', name: 'Novo Nordisk'}]
                },
                'Financials': {
                    'FR': [{symbol: 'BNP', name: 'BNP Paribas'}, {symbol: 'ACA', name: 'Crédit Agricole'}],
                    'DE': [{symbol: 'DBK', name: 'Deutsche Bank'}, {symbol: 'ALV', name: 'Allianz'}],
                    'GB': [{symbol: 'HSBA', name: 'HSBC'}, {symbol: 'BARC', name: 'Barclays'}],
                    'ES': [{symbol: 'SAN', name: 'Santander'}, {symbol: 'BBVA', name: 'BBVA'}]
                },
                'Industrials': {
                    'FR': [{symbol: 'AIR', name: 'Airbus'}, {symbol: 'SU', name: 'Schneider Electric'}],
                    'DE': [{symbol: 'SIE', name: 'Siemens'}, {symbol: 'BMW', name: 'BMW'}],
                    'SE': [{symbol: 'VOLV B', name: 'Volvo'}, {symbol: 'ABB', name: 'ABB'}]
                },
                'Consumer Goods': {
                    'FR': [{symbol: 'MC', name: 'LVMH'}, {symbol: 'OR', name: "L'Oréal"}],
                    'DE': [{symbol: 'ADS', name: 'Adidas'}, {symbol: 'BAS', name: 'BASF'}],
                    'NL': [{symbol: 'UNA', name: 'Unilever'}, {symbol: 'HEIA', name: 'Heineken'}]
                },
                'Energy': {
                    'FR': [{symbol: 'TTE', name: 'TotalEnergies'}],
                    'GB': [{symbol: 'SHEL', name: 'Shell'}, {symbol: 'BP', name: 'BP'}],
                    'ES': [{symbol: 'REP', name: 'Repsol'}],
                    'IT': [{symbol: 'ENI', name: 'Eni'}]
                },
                'Telecommunications': {
                    'FR': [{symbol: 'ORA', name: 'Orange'}],
                    'DE': [{symbol: 'DTE', name: 'Deutsche Telekom'}],
                    'ES': [{symbol: 'TEF', name: 'Telefónica'}],
                    'GB': [{symbol: 'VOD', name: 'Vodafone'}]
                },
                'Utilities': {
                    'FR': [{symbol: 'ENGI', name: 'Engie'}, {symbol: 'EDF', name: 'EDF'}],
                    'DE': [{symbol: 'EOAN', name: 'E.ON'}, {symbol: 'RWE', name: 'RWE'}],
                    'ES': [{symbol: 'IBE', name: 'Iberdrola'}],
                    'IT': [{symbol: 'ENEL', name: 'Enel'}]
                },
                'Basic Materials': {},
                'Consumer Services': {}
            };

            // Fill empty sectors
            sectors.forEach(sector => {
                if (!sampleMatrix[sector]) {
                    sampleMatrix[sector] = {};
                }
                countries.forEach(country => {
                    if (!sampleMatrix[sector][country]) {
                        sampleMatrix[sector][country] = [];
                    }
                });
            });

            displayMatrix(sectors, countries, sampleMatrix);
        }

        // Navigate to analyst page
        function goToAnalyst(symbol) {
            window.location.href = '/analyst?symbol=' + symbol;
        }

        // Initialize
        loadMarketsOverview();
        loadStoxxMatrix();
        
        // Refresh every 60 seconds
        setInterval(() => {
            loadMarketsOverview();
        }, 60000);
    </script>
</body>
</html>`
}

export default app