// Global variables
let currentData = [];
let filteredData = [];
let currentPage = 1;
let recordsPerPage = 50;
let priceChart = null;

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const filterBtn = document.getElementById('filterBtn');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeDateInputs();
});

function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Real-time search suggestions
    searchInput.addEventListener('input', debounce(handleSearchSuggestions, 300));
    
    // Click outside to close suggestions
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.classList.add('hidden');
        }
    });

    // Date filtering
    filterBtn.addEventListener('click', handleDateFilter);

    // Table controls
    document.getElementById('recordsPerPage').addEventListener('change', function(e) {
        recordsPerPage = parseInt(e.target.value);
        currentPage = 1;
        displayData(filteredData);
    });

    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayData(filteredData);
        }
    });

    document.getElementById('nextPage').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredData.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayData(filteredData);
        }
    });

    // Export functionality
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
}

function initializeDateInputs() {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    endDateInput.value = today.toISOString().split('T')[0];
    startDateInput.value = oneYearAgo.toISOString().split('T')[0];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = function() {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleSearchSuggestions() {
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        searchSuggestions.classList.add('hidden');
        return;
    }

    try {
        const response = await axios.get(`/api/search/${encodeURIComponent(query)}`);
        const { results } = response.data;
        
        if (results && results.length > 0) {
            displaySearchSuggestions(results);
        } else {
            searchSuggestions.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        searchSuggestions.classList.add('hidden');
    }
}

function displaySearchSuggestions(results) {
    searchSuggestions.innerHTML = '';
    
    results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <span class="font-semibold text-blue-600">${result.symbol}</span>
                    <span class="text-gray-800 ml-2">${result.shortname}</span>
                </div>
                <span class="text-sm text-gray-500">${result.exchDisp}</span>
            </div>
        `;
        
        div.addEventListener('click', function() {
            searchInput.value = result.symbol;
            searchSuggestions.classList.add('hidden');
            handleSearch();
        });
        
        searchSuggestions.appendChild(div);
    });
    
    searchSuggestions.classList.remove('hidden');
}

async function handleSearch() {
    const symbol = searchInput.value.trim().toUpperCase();
    
    if (!symbol) {
        showError('Veuillez entrer un symbole d\'entreprise');
        return;
    }

    hideAllStates();
    showLoading();

    try {
        const response = await axios.get(`/api/stock/${encodeURIComponent(symbol)}`);
        const stockData = response.data;
        
        currentData = stockData.data;
        filteredData = [...currentData];
        currentPage = 1;
        
        displayCompanyInfo(stockData);
        displayChart(filteredData);
        displayData(filteredData);
        showResults();
        
    } catch (error) {
        console.error('Error fetching stock data:', error);
        const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Erreur lors de la récupération des données';
        showError(errorMsg);
    }
}

async function handleDateFilter() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
        showError('Veuillez sélectionner les dates de début et de fin');
        return;
    }

    if (startDate > endDate) {
        showError('La date de début doit être antérieure à la date de fin');
        return;
    }

    // Filter current data
    filteredData = currentData.filter(item => {
        return item.date >= startDate && item.date <= endDate;
    });

    currentPage = 1;
    displayChart(filteredData);
    displayData(filteredData);
    
    // Update total days display
    document.getElementById('totalDays').textContent = filteredData.length;
}

function displayCompanyInfo(stockData) {
    document.getElementById('companyName').textContent = `${stockData.symbol} - ${stockData.companyName}`;
    document.getElementById('companyDetails').innerHTML = `
        <i class="fas fa-building mr-1"></i>${stockData.exchangeName || 'N/A'} • 
        <i class="fas fa-coins mr-1"></i>${stockData.currency || 'USD'}
    `;
    document.getElementById('totalDays').textContent = stockData.totalDays;
}

function displayChart(data) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (priceChart) {
        priceChart.destroy();
    }

    // Prepare chart data (showing last 90 days for performance)
    const chartData = data.slice(0, 90).reverse(); // Last 90 days, oldest first for chart
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(item => formatDate(item.date)),
            datasets: [
                {
                    label: 'Prix de clôture',
                    data: chartData.map(item => parseFloat(item.close)),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Plus haut',
                    data: chartData.map(item => parseFloat(item.high)),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Plus bas',
                    data: chartData.map(item => parseFloat(item.low)),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Évolution des prix (${chartData.length} derniers jours)`
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Prix (USD)'
                    }
                }
            }
        }
    });
}

function displayData(data) {
    const tableBody = document.getElementById('dataTableBody');
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = data.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    pageData.forEach((item, index) => {
        const previousItem = data[startIndex + index + 1]; // Next item in array (previous day)
        const change = previousItem ? calculatePercentChange(parseFloat(previousItem.close), parseFloat(item.close)) : 0;
        const changeClass = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
        const changeIcon = change > 0 ? 'fa-arrow-up' : change < 0 ? 'fa-arrow-down' : 'fa-minus';
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 border text-sm font-medium text-gray-900">${formatDate(item.date)}</td>
            <td class="px-4 py-3 border text-sm text-gray-900">${formatPrice(item.open)}</td>
            <td class="px-4 py-3 border text-sm text-green-600 font-medium">${formatPrice(item.high)}</td>
            <td class="px-4 py-3 border text-sm text-red-600 font-medium">${formatPrice(item.low)}</td>
            <td class="px-4 py-3 border text-sm text-gray-900 font-bold">${formatPrice(item.close)}</td>
            <td class="px-4 py-3 border text-sm text-gray-600">${formatVolume(item.volume)}</td>
            <td class="px-4 py-3 border text-sm font-medium ${changeClass}">
                <i class="fas ${changeIcon} mr-1"></i>
                ${change.toFixed(2)}%
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    updatePagination(data);
}

function updatePagination(data) {
    const totalPages = Math.ceil(data.length / recordsPerPage);
    const startRecord = (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, data.length);
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} sur ${totalPages}`;
    document.getElementById('recordsInfo').textContent = `Affichage ${startRecord} à ${endRecord} sur ${data.length} enregistrements`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function exportToCSV() {
    if (filteredData.length === 0) {
        showError('Aucune donnée à exporter');
        return;
    }

    const headers = ['Date', 'Ouverture', 'Plus Haut', 'Plus Bas', 'Clôture', 'Volume'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
            item.date,
            item.open,
            item.high,
            item.low,
            item.close,
            item.volume
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const symbol = searchInput.value.trim().toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${symbol}_prix_historiques_${today}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatPrice(price) {
    if (price === 'N/A' || !price) return 'N/A';
    return parseFloat(price).toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' $';
}

function formatVolume(volume) {
    if (volume === 'N/A' || !volume) return 'N/A';
    const num = parseInt(volume);
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('fr-FR');
}

function calculatePercentChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

function hideAllStates() {
    loadingState.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorState.classList.add('hidden');
}

function showLoading() {
    loadingState.classList.remove('hidden');
}

function showResults() {
    resultsSection.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

// API test on page load
async function testAPI() {
    try {
        const response = await axios.get('/api/status');
        console.log('API Status:', response.data);
    } catch (error) {
        console.error('API test failed:', error);
    }
}

// Run API test
testAPI();