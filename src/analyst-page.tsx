// Analyst page HTML generator
export function getAnalystPageHTML(symbol: string = 'AAPL') {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyse ${symbol.toUpperCase()} - Dashboard Marchés Financiers</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        .nav-active { background-color: #3B82F6; color: white; }
        .data-table { font-size: 0.875rem; }
        .data-table th { padding: 0.5rem; background-color: #F9FAFB; font-weight: 600; }
        .data-table td { padding: 0.5rem; border-bottom: 1px solid #E5E7EB; }
        .positive { color: #059669; }
        .negative { color: #DC2626; }
        .pagination-btn { padding: 0.5rem 1rem; margin: 0 0.25rem; border: 1px solid #D1D5DB; background: white; cursor: pointer; }
        .pagination-btn:hover { background: #F3F4F6; }
        .pagination-btn.active { background: #3B82F6; color: white; }
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
                            <a href="/" class="px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-200">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                </svg>
                                Overview
                            </a>
                            <a href="/analyst" class="px-4 py-2 rounded-md text-sm font-medium transition-colors nav-active">
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
            <!-- Search Section -->
            <section class="bg-white rounded-lg shadow-md p-6 fade-in">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Recherche d'Actions
                    </h2>
                </div>
                
                <div class="flex items-center space-x-4 mb-4">
                    <div class="flex-1">
                        <input 
                            type="text" 
                            id="symbolInput" 
                            placeholder="Entrez un symbole (ex: AAPL, NVDA, MSFT...)" 
                            value="${symbol.toUpperCase()}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button 
                        onclick="searchSymbol()" 
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Analyser
                    </button>
                </div>
            </section>

            <!-- Company Info Section -->
            <section class="bg-white rounded-lg shadow-md p-6 fade-in" id="companySection" style="display: none;">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v10"></path>
                    </svg>
                    Informations de l'Entreprise
                </h2>
                <div id="companyInfo" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Company info will be loaded here -->
                </div>
            </section>

            <!-- Price Chart Section -->
            <section class="bg-white rounded-lg shadow-md p-6 fade-in" id="chartSection" style="display: none;">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Évolution des Prix
                    </h2>
                    
                    <!-- Period Selector -->
                    <div class="flex items-center space-x-2">
                        <label class="text-sm text-gray-600">Période:</label>
                        <select id="periodSelector" onchange="changePeriod()" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="1M">1 Mois</option>
                            <option value="3M" selected>3 Mois</option>
                            <option value="6M">6 Mois</option>
                            <option value="1Y">1 An</option>
                            <option value="2Y">2 Ans</option>
                            <option value="5Y">5 Ans</option>
                        </select>
                    </div>
                </div>
                
                <div class="h-96">
                    <canvas id="priceChart"></canvas>
                </div>
            </section>

            <!-- Historical Data Table -->
            <section class="bg-white rounded-lg shadow-md p-6 fade-in" id="dataSection" style="display: none;">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center">
                        <svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        Données Historiques
                    </h2>
                    
                    <!-- Data Controls -->
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <label class="text-sm text-gray-600">Afficher:</label>
                            <select id="rowsPerPage" onchange="changeRowsPerPage()" class="px-3 py-1 border border-gray-300 rounded text-sm">
                                <option value="25">25 lignes</option>
                                <option value="50" selected>50 lignes</option>
                                <option value="100">100 lignes</option>
                                <option value="250">250 lignes</option>
                            </select>
                        </div>
                        
                        <button onclick="exportToCSV()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full data-table border-collapse">
                        <thead>
                            <tr class="border-b-2 border-gray-200">
                                <th class="text-left">Date</th>
                                <th class="text-right">Ouverture</th>
                                <th class="text-right">Plus Haut</th>
                                <th class="text-right">Plus Bas</th>
                                <th class="text-right">Clôture</th>
                                <th class="text-right">Volume</th>
                                <th class="text-right">Variation</th>
                                <th class="text-right">Variation %</th>
                            </tr>
                        </thead>
                        <tbody id="dataTableBody">
                            <!-- Data will be populated here -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="flex items-center justify-between mt-4">
                    <div class="text-sm text-gray-600" id="paginationInfo">
                        <!-- Pagination info will be displayed here -->
                    </div>
                    <div class="flex items-center space-x-2" id="paginationControls">
                        <!-- Pagination controls will be displayed here -->
                    </div>
                </div>
            </section>
        </div>
    </div>

    <script>
        let currentSymbol = '${symbol.toUpperCase()}';
        let currentData = [];
        let currentPage = 1;
        let rowsPerPage = 50;
        let priceChart = null;

        // Update time
        function updateTime() {
            const now = new Date();
            document.getElementById('lastUpdate').textContent = 
                'Dernière mise à jour: ' + now.toLocaleString('fr-FR');
        }
        updateTime();
        setInterval(updateTime, 60000);

        // Search for a symbol
        function searchSymbol() {
            const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();
            if (symbol) {
                currentSymbol = symbol;
                loadCompanyData(symbol);
                // Update URL without refreshing
                const url = new URL(window.location);
                url.searchParams.set('symbol', symbol);
                window.history.replaceState({}, '', url);
            }
        }

        // Handle Enter key in search input
        document.getElementById('symbolInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchSymbol();
            }
        });

        // Load company data
        async function loadCompanyData(symbol) {
            try {
                // Show loading state
                document.getElementById('companySection').style.display = 'block';
                document.getElementById('chartSection').style.display = 'block';
                document.getElementById('dataSection').style.display = 'block';
                
                // Load company info
                const infoResponse = await axios.get(\`/api/stock/\${symbol}/info\`);
                if (infoResponse.data.success) {
                    displayCompanyInfo(infoResponse.data.data);
                }
                
                // Load historical data
                await loadHistoricalData(symbol);
                
            } catch (error) {
                console.error('Error loading company data:', error);
                alert('Erreur lors du chargement des données pour ' + symbol);
            }
        }

        // Display company info
        function displayCompanyInfo(company) {
            const infoDiv = document.getElementById('companyInfo');
            infoDiv.innerHTML = \`
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-gray-800">\${company.symbol}</h3>
                    <p class="text-gray-600">\${company.name}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">Secteur</p>
                    <p class="text-lg font-semibold text-gray-800">\${company.sector}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">Cap. Boursière</p>
                    <p class="text-lg font-semibold text-gray-800">\${formatMarketCap(company.marketCap)}</p>
                </div>
            \`;
        }

        // Load historical data
        async function loadHistoricalData(symbol, period = '3M') {
            try {
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = getStartDate(period);
                
                const response = await axios.get(\`/api/stock/\${symbol}/historical?start=\${startDate}&end=\${endDate}\`);
                if (response.data.success) {
                    currentData = response.data.data;
                    currentPage = 1;
                    
                    // Update chart
                    updatePriceChart(currentData);
                    
                    // Update table
                    updateDataTable();
                }
            } catch (error) {
                console.error('Error loading historical data:', error);
            }
        }

        // Get start date based on period
        function getStartDate(period) {
            const now = new Date();
            switch(period) {
                case '1M': return new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
                case '3M': return new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
                case '6M': return new Date(now.setMonth(now.getMonth() - 6)).toISOString().split('T')[0];
                case '1Y': return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
                case '2Y': return new Date(now.setFullYear(now.getFullYear() - 2)).toISOString().split('T')[0];
                case '5Y': return new Date(now.setFullYear(now.getFullYear() - 5)).toISOString().split('T')[0];
                default: return new Date(now.setMonth(now.getMonth() - 3)).toISOString().split('T')[0];
            }
        }

        // Update price chart
        function updatePriceChart(data) {
            const ctx = document.getElementById('priceChart').getContext('2d');
            
            if (priceChart) {
                priceChart.destroy();
            }
            
            const chartData = data.slice(-90); // Last 90 days for chart
            
            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.map(d => new Date(d.date).toLocaleDateString('fr-FR')),
                    datasets: [{
                        label: 'Prix de Clôture',
                        data: chartData.map(d => d.close),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: '#E5E7EB'
                            }
                        },
                        x: {
                            grid: {
                                color: '#E5E7EB'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Update data table
        function updateDataTable() {
            const tbody = document.getElementById('dataTableBody');
            const startIndex = (currentPage - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            const pageData = currentData.slice(startIndex, endIndex);
            
            tbody.innerHTML = pageData.map(row => \`
                <tr class="hover:bg-gray-50">
                    <td class="font-medium">\${new Date(row.date).toLocaleDateString('fr-FR')}</td>
                    <td class="text-right">\${row.open.toFixed(2)}</td>
                    <td class="text-right">\${row.high.toFixed(2)}</td>
                    <td class="text-right">\${row.low.toFixed(2)}</td>
                    <td class="text-right font-medium">\${row.close.toFixed(2)}</td>
                    <td class="text-right">\${formatVolume(row.volume)}</td>
                    <td class="text-right \${row.change >= 0 ? 'positive' : 'negative'}">\${row.change > 0 ? '+' : ''}\${row.change.toFixed(2)}</td>
                    <td class="text-right \${row.changePercent >= 0 ? 'positive' : 'negative'}">\${row.changePercent > 0 ? '+' : ''}\${row.changePercent.toFixed(2)}%</td>
                </tr>
            \`).join('');
            
            updatePaginationInfo();
            updatePaginationControls();
        }

        // Update pagination info
        function updatePaginationInfo() {
            const startIndex = (currentPage - 1) * rowsPerPage + 1;
            const endIndex = Math.min(currentPage * rowsPerPage, currentData.length);
            document.getElementById('paginationInfo').textContent = 
                \`Affichage de \${startIndex} à \${endIndex} sur \${currentData.length} entrées\`;
        }

        // Update pagination controls
        function updatePaginationControls() {
            const totalPages = Math.ceil(currentData.length / rowsPerPage);
            const controls = document.getElementById('paginationControls');
            
            let html = '';
            
            // Previous button
            if (currentPage > 1) {
                html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage - 1) + ')">« Précédent</button>';
            }
            
            // Page numbers (show 5 pages max)
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + 4);
            
            for (let i = startPage; i <= endPage; i++) {
                html += \`<button class="pagination-btn \${i === currentPage ? 'active' : ''}" onclick="goToPage(\${i})">\${i}</button>\`;
            }
            
            // Next button
            if (currentPage < totalPages) {
                html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage + 1) + ')">Suivant »</button>';
            }
            
            controls.innerHTML = html;
        }

        // Go to specific page
        function goToPage(page) {
            currentPage = page;
            updateDataTable();
        }

        // Change period
        function changePeriod() {
            const period = document.getElementById('periodSelector').value;
            loadHistoricalData(currentSymbol, period);
        }

        // Change rows per page
        function changeRowsPerPage() {
            rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
            currentPage = 1;
            updateDataTable();
        }

        // Export to CSV
        function exportToCSV() {
            const headers = ['Date', 'Ouverture', 'Plus Haut', 'Plus Bas', 'Clôture', 'Volume', 'Variation', 'Variation %'];
            const csvContent = [
                headers.join(','),
                ...currentData.map(row => [
                    row.date,
                    row.open,
                    row.high,
                    row.low,
                    row.close,
                    row.volume,
                    row.change,
                    row.changePercent
                ].join(','))
            ].join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`\${currentSymbol}_historical_data.csv\`;
            a.click();
            window.URL.revokeObjectURL(url);
        }

        // Utility functions
        function formatMarketCap(value) {
            if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T €';
            if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B €';
            if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M €';
            return value.toLocaleString('fr-FR') + ' €';
        }

        function formatVolume(value) {
            if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
            if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
            return value.toLocaleString('fr-FR');
        }

        // Initialize page
        if (currentSymbol) {
            loadCompanyData(currentSymbol);
        }
    </script>
</body>
</html>`;
}