#!/usr/bin/env python3
"""
Simple HTTP server for Amindis Equity Oracle
Sert les fichiers statiques et fournit les endpoints API de base
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import urllib.parse
from datetime import datetime
import threading
import time

class FinancialDataHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Change to serve from public directory
        super().__init__(*args, directory="/home/user/webapp/public", **kwargs)
    
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # API endpoints
        if path == "/api/status":
            self.send_json_response({
                "success": True,
                "message": "Financial Data API is running (Simple Server)",
                "endpoints": {
                    "search": "/api/search/:query",
                    "stock": "/api/stock/:symbol",
                    "indices": "/api/indices/ytd"
                },
                "version": "1.0.0"
            })
        elif path == "/api/indices/ytd":
            # Données YTD simulées pour les tests
            self.send_json_response({
                "success": True,
                "data": [
                    {"symbol": "^GSPC", "name": "S&P 500", "country": "US", "ytd_return": 18.5, "last_update": "2025-09-26"},
                    {"symbol": "^DJI", "name": "Dow Jones", "country": "US", "ytd_return": 12.3, "last_update": "2025-09-26"},
                    {"symbol": "^IXIC", "name": "NASDAQ", "country": "US", "ytd_return": 22.1, "last_update": "2025-09-26"},
                    {"symbol": "^GDAXI", "name": "DAX", "country": "DE", "ytd_return": 15.6, "last_update": "2025-09-26"},
                    {"symbol": "^FCHI", "name": "CAC 40", "country": "FR", "ytd_return": 5.7, "last_update": "2025-09-26"},
                    {"symbol": "^FTSE", "name": "FTSE 100", "country": "GB", "ytd_return": 2.8, "last_update": "2025-09-26"},
                    {"symbol": "^N225", "name": "Nikkei 225", "country": "JP", "ytd_return": 28.5, "last_update": "2025-09-26"},
                    {"symbol": "^HSI", "name": "Hang Seng", "country": "HK", "ytd_return": -3.2, "last_update": "2025-09-26"},
                    {"symbol": "^SSEC", "name": "Shanghai", "country": "CN", "ytd_return": -5.8, "last_update": "2025-09-26"},
                    {"symbol": "^BSESN", "name": "BSE Sensex", "country": "IN", "ytd_return": 8.9, "last_update": "2025-09-26"},
                    {"symbol": "^BVSP", "name": "Bovespa", "country": "BR", "ytd_return": -2.1, "last_update": "2025-09-26"},
                    {"symbol": "^GSPTSE", "name": "S&P/TSX", "country": "CA", "ytd_return": 14.2, "last_update": "2025-09-26"}
                ]
            })
        elif path.startswith("/api/indices/rolling"):
            # Données rolling simulées
            self.send_json_response({
                "success": True,
                "data": {
                    "^GSPC": {"symbol": "^GSPC", "name": "S&P 500", "rolling_return": 45.2},
                    "^GDAXI": {"symbol": "^GDAXI", "name": "DAX", "rolling_return": 38.5},
                    "^FCHI": {"symbol": "^FCHI", "name": "CAC 40", "rolling_return": 22.1},
                    "^FTSE": {"symbol": "^FTSE", "name": "FTSE 100", "rolling_return": 18.9},
                    "^N225": {"symbol": "^N225", "name": "Nikkei 225", "rolling_return": 62.3}
                }
            })
        elif path == "/":
            # Serve the main HTML page
            self.serve_index_html()
        else:
            # Serve static files
            super().do_GET()
    
    def serve_index_html(self):
        """Serve the main HTML page"""
        # Read and serve the standalone HTML file
        try:
            with open('/home/user/webapp/index_standalone.html', 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html_content.encode('utf-8'))
            return
        except:
            pass
        
        html = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amindis Equity Oracle</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.30.0/index.min.js"></script>
    <link href="/static/style.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 min-h-screen text-white">
    <div class="container mx-auto p-6">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Amindis Equity Oracle
            </h1>
            <p class="text-gray-300 text-lg">Analyse en Temps Réel des Marchés Financiers Mondiaux</p>
        </div>

        <!-- Main Content -->
        <div id="app" class="space-y-6">
            <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
                <h2 class="text-2xl font-semibold mb-4 text-cyan-300">Indices Boursiers Mondiaux</h2>
                <div id="indices-table-container">
                    <div class="flex justify-center items-center py-8">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Container -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
                    <h3 class="text-xl font-semibold mb-4 text-cyan-300">Performance Comparative</h3>
                    <canvas id="performanceChart"></canvas>
                </div>
                
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
                    <h3 class="text-xl font-semibold mb-4 text-cyan-300">Rendements Rolling 3 Ans</h3>
                    <canvas id="rollingReturnsChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 text-gray-400 text-sm">
            <p>Dernière mise à jour : <span id="lastUpdate"></span></p>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/static/financial-calculations-academic.js"></script>
    <script src="/static/indices-analytics.js"></script>
    <script src="/static/indices-cache-manager.js"></script>
    <script src="/static/financial-analytics.js"></script>
    <script src="/static/app-extended.js"></script>
    <script src="/static/market-data.js"></script>
    <script src="/static/app.js"></script>
    <script>
        // Update last update time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('fr-FR');
        
        // Initialize the app
        if (typeof window.initializeApp === 'function') {
            window.initializeApp();
        }
    </script>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to reduce log verbosity"""
        if '/api/' in args[0] or args[1] != '200':
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} - {args[1]}")

def run_server(port=3000):
    """Run the HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, FinancialDataHandler)
    print(f"""
    ╔════════════════════════════════════════════════╗
    ║     Amindis Equity Oracle - Simple Server     ║
    ╠════════════════════════════════════════════════╣
    ║  Server running on http://0.0.0.0:{port}        ║
    ║  Ready to serve financial data!               ║
    ╚════════════════════════════════════════════════╝
    """)
    httpd.serve_forever()

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServer stopped.")