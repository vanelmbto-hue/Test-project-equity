import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Helper function to fetch stock data from Yahoo Finance
async function fetchYahooFinanceData(symbol: string, period: string = '1y'): Promise<any> {
  try {
    // Yahoo Finance API endpoint (using their historical data endpoint)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=0&period2=9999999999&interval=1d&includePrePost=true&events=div%2Csplit`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data found for this symbol')
    }

    const result = data.chart.result[0]
    const timestamps = result.timestamp
    const quotes = result.indicators.quote[0]
    
    // Convert to array of daily prices
    const historicalData = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: quotes.open[index]?.toFixed(2) || 'N/A',
      high: quotes.high[index]?.toFixed(2) || 'N/A',
      low: quotes.low[index]?.toFixed(2) || 'N/A',
      close: quotes.close[index]?.toFixed(2) || 'N/A',
      volume: quotes.volume[index] || 'N/A'
    })).filter(item => item.close !== 'N/A').reverse() // Most recent first

    return {
      symbol: result.meta.symbol,
      companyName: result.meta.symbol, // Yahoo doesn't always provide company name
      currency: result.meta.currency,
      exchangeName: result.meta.exchangeName,
      data: historicalData
    }
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error)
    throw error
  }
}

// Helper function to search for company symbols
async function searchCompanySymbol(query: string): Promise<any> {
  try {
    // Yahoo Finance search API
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&newsCount=0&listsCount=0`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return data.quotes?.map((quote: any) => ({
      symbol: quote.symbol,
      shortname: quote.shortname || quote.longname || quote.symbol,
      longname: quote.longname || quote.shortname || quote.symbol,
      exchDisp: quote.exchDisp || 'Unknown',
      typeDisp: quote.typeDisp || 'Stock'
    })) || []
  } catch (error) {
    console.error('Error searching symbols:', error)
    return []
  }
}

// API Routes

// Search for company symbols
app.get('/api/search/:query', async (c) => {
  try {
    const query = c.req.param('query')
    
    if (!query || query.length < 2) {
      return c.json({ error: 'Query must be at least 2 characters long' }, 400)
    }

    const results = await searchCompanySymbol(query)
    
    return c.json({
      success: true,
      query,
      results: results.slice(0, 10) // Limit to 10 results
    })
  } catch (error) {
    return c.json({ 
      error: 'Failed to search companies', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Get historical stock data
app.get('/api/stock/:symbol', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    
    if (!symbol) {
      return c.json({ error: 'Symbol parameter is required' }, 400)
    }

    const stockData = await fetchYahooFinanceData(symbol)
    
    return c.json({
      success: true,
      symbol,
      totalDays: stockData.data.length,
      ...stockData
    })
  } catch (error) {
    return c.json({ 
      error: 'Failed to fetch stock data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// Get stock data with date range
app.get('/api/stock/:symbol/range', async (c) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase()
    const startDate = c.req.query('start')
    const endDate = c.req.query('end')
    
    if (!symbol) {
      return c.json({ error: 'Symbol parameter is required' }, 400)
    }

    const stockData = await fetchYahooFinanceData(symbol)
    
    let filteredData = stockData.data
    
    if (startDate) {
      filteredData = filteredData.filter((item: any) => item.date >= startDate)
    }
    
    if (endDate) {
      filteredData = filteredData.filter((item: any) => item.date <= endDate)
    }
    
    return c.json({
      success: true,
      symbol,
      startDate,
      endDate,
      totalDays: filteredData.length,
      ...stockData,
      data: filteredData
    })
  } catch (error) {
    return c.json({ 
      error: 'Failed to fetch stock data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// API status endpoint
app.get('/api/status', (c) => {
  return c.json({
    success: true,
    message: 'Financial Data API is running',
    endpoints: {
      search: '/api/search/:query',
      stock: '/api/stock/:symbol',
      stockRange: '/api/stock/:symbol/range?start=YYYY-MM-DD&end=YYYY-MM-DD'
    },
    version: '1.0.0'
  })
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Plateforme de Prix d'Actions</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-white shadow-lg border-b border-gray-200">
                <div class="max-w-7xl mx-auto px-4 py-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-chart-line text-3xl text-blue-600"></i>
                            <h1 class="text-3xl font-bold text-gray-800">Plateforme de Prix d'Actions</h1>
                        </div>
                        <div class="text-sm text-gray-500">
                            <i class="fas fa-database mr-1"></i>
                            Données historiques en temps réel
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-7xl mx-auto px-4 py-8">
                <!-- Search Section -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-search text-xl text-blue-600 mr-3"></i>
                        <h2 class="text-xl font-semibold text-gray-800">Rechercher une entreprise</h2>
                    </div>
                    
                    <div class="flex space-x-4">
                        <div class="flex-1 relative">
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="Entrez le nom ou symbole de l'entreprise (ex: NVDA, Apple, Microsoft...)"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                            <div id="searchSuggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden shadow-lg max-h-60 overflow-y-auto">
                            </div>
                        </div>
                        <button 
                            id="searchBtn" 
                            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            <i class="fas fa-search mr-2"></i>
                            Rechercher
                        </button>
                    </div>

                    <!-- Date Range Filter -->
                    <div class="mt-4 flex space-x-4 items-center">
                        <label class="text-sm font-medium text-gray-700">Filtrer par période :</label>
                        <input 
                            type="date" 
                            id="startDate" 
                            class="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                        <span class="text-gray-500">à</span>
                        <input 
                            type="date" 
                            id="endDate" 
                            class="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                        <button 
                            id="filterBtn" 
                            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            <i class="fas fa-filter mr-1"></i>
                            Filtrer
                        </button>
                    </div>
                </div>

                <!-- Loading State -->
                <div id="loadingState" class="hidden bg-white rounded-lg shadow-lg p-8 text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                    <p class="text-gray-600">Chargement des données financières...</p>
                </div>

                <!-- Results Section -->
                <div id="resultsSection" class="hidden bg-white rounded-lg shadow-lg">
                    <!-- Company Info -->
                    <div class="p-6 border-b border-gray-200">
                        <div id="companyInfo" class="flex items-center justify-between">
                            <div>
                                <h3 id="companyName" class="text-2xl font-bold text-gray-800"></h3>
                                <p id="companyDetails" class="text-gray-600"></p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-500">Total de jours</p>
                                <p id="totalDays" class="text-2xl font-bold text-blue-600"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Price Chart -->
                    <div class="p-6 border-b border-gray-200">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-chart-area mr-2"></i>
                            Évolution des prix
                        </h4>
                        <div class="relative" style="height: 400px;">
                            <canvas id="priceChart"></canvas>
                        </div>
                    </div>

                    <!-- Data Table -->
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-table mr-2"></i>
                                Données historiques
                            </h4>
                            <div class="flex space-x-2">
                                <button id="exportBtn" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                    <i class="fas fa-download mr-1"></i>
                                    Exporter CSV
                                </button>
                                <select id="recordsPerPage" class="px-3 py-2 border border-gray-300 rounded">
                                    <option value="50">50 lignes</option>
                                    <option value="100">100 lignes</option>
                                    <option value="250">250 lignes</option>
                                    <option value="500">500 lignes</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full table-auto border-collapse">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Date</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Ouverture</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Plus Haut</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Plus Bas</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Clôture</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Volume</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Variation %</th>
                                    </tr>
                                </thead>
                                <tbody id="dataTableBody" class="bg-white divide-y divide-gray-200">
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div id="pagination" class="flex items-center justify-between mt-6">
                            <div class="flex items-center space-x-2">
                                <button id="prevPage" class="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <span id="pageInfo" class="text-sm text-gray-600"></span>
                                <button id="nextPage" class="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            <div class="text-sm text-gray-600">
                                <span id="recordsInfo"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error State -->
                <div id="errorState" class="hidden bg-red-50 border border-red-200 rounded-lg p-6">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl mr-3"></i>
                        <div>
                            <h3 class="text-red-800 font-semibold">Erreur</h3>
                            <p id="errorMessage" class="text-red-700"></p>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-white border-t border-gray-200 mt-12">
                <div class="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
                    <p class="mb-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Données fournies par Yahoo Finance et autres sources financières
                    </p>
                    <p class="text-sm">
                        Les données peuvent avoir un délai. Utilisez à titre informatif uniquement.
                    </p>
                </div>
            </footer>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app