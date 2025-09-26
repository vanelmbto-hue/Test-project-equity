-- Données de test pour les indices (dernières valeurs pour YTD)
-- Ces données sont des exemples, remplacer par des vraies données

-- Insérer quelques données récentes pour S&P 500
INSERT OR REPLACE INTO national_indices (symbol, name, country, date, close, volume) VALUES
('^GSPC', 'S&P 500', 'US', '2025-01-01', 4200.00, 1000000),
('^GSPC', 'S&P 500', 'US', '2025-09-26', 4400.00, 1200000),
('^GSPC', 'S&P 500', 'US', '2025-09-25', 4395.00, 1100000),
('^GSPC', 'S&P 500', 'US', '2025-09-24', 4390.00, 1050000);

-- Insérer quelques données pour CAC 40
INSERT OR REPLACE INTO national_indices (symbol, name, country, date, close, volume) VALUES
('^FCHI', 'CAC 40', 'FR', '2025-01-01', 7000.00, 800000),
('^FCHI', 'CAC 40', 'FR', '2025-09-26', 7400.00, 900000),
('^FCHI', 'CAC 40', 'FR', '2025-09-25', 7390.00, 850000),
('^FCHI', 'CAC 40', 'FR', '2025-09-24', 7380.00, 820000);

-- Insérer quelques données pour DAX
INSERT OR REPLACE INTO national_indices (symbol, name, country, date, close, volume) VALUES
('^GDAXI', 'DAX', 'DE', '2025-01-01', 16000.00, 700000),
('^GDAXI', 'DAX', 'DE', '2025-09-26', 18500.00, 750000),
('^GDAXI', 'DAX', 'DE', '2025-09-25', 18450.00, 720000),
('^GDAXI', 'DAX', 'DE', '2025-09-24', 18400.00, 710000);

-- Calculer et insérer les YTD
INSERT OR REPLACE INTO indices_calculations (symbol, calculation_type, date, value) VALUES
('^GSPC', 'ytd', '2025-09-26', ((4400.00 / 4200.00) - 1) * 100),
('^FCHI', 'ytd', '2025-09-26', ((7400.00 / 7000.00) - 1) * 100),
('^GDAXI', 'ytd', '2025-09-26', ((18500.00 / 16000.00) - 1) * 100),
('^FTSE', 'ytd', '2025-09-26', 2.8),
('^N225', 'ytd', '2025-09-26', 15.5),
('^DJI', 'ytd', '2025-09-26', 8.5),
('^IXIC', 'ytd', '2025-09-26', 12.3),
('^HSI', 'ytd', '2025-09-26', 18.2),
('^KS11', 'ytd', '2025-09-26', 6.8),
('^AEX', 'ytd', '2025-09-26', 9.2);

-- Insérer quelques données de rolling returns pour test
INSERT OR REPLACE INTO indices_calculations (symbol, calculation_type, date, value) VALUES
-- S&P 500 rolling 3y
('^GSPC', 'rolling_3y', '2025-09-26', 12.5),
('^GSPC', 'rolling_3y', '2025-09-25', 12.3),
('^GSPC', 'rolling_3y', '2025-09-24', 12.1),
('^GSPC', 'rolling_3y', '2025-09-20', 11.8),
('^GSPC', 'rolling_3y', '2025-09-15', 11.5),
-- CAC 40 rolling 3y
('^FCHI', 'rolling_3y', '2025-09-26', 8.2),
('^FCHI', 'rolling_3y', '2025-09-25', 8.0),
('^FCHI', 'rolling_3y', '2025-09-24', 7.8),
('^FCHI', 'rolling_3y', '2025-09-20', 7.5),
('^FCHI', 'rolling_3y', '2025-09-15', 7.2),
-- DAX rolling 3y
('^GDAXI', 'rolling_3y', '2025-09-26', 10.5),
('^GDAXI', 'rolling_3y', '2025-09-25', 10.3),
('^GDAXI', 'rolling_3y', '2025-09-24', 10.1),
('^GDAXI', 'rolling_3y', '2025-09-20', 9.8),
('^GDAXI', 'rolling_3y', '2025-09-15', 9.5),
-- FTSE 100 rolling 3y
('^FTSE', 'rolling_3y', '2025-09-26', 6.5),
('^FTSE', 'rolling_3y', '2025-09-25', 6.3),
('^FTSE', 'rolling_3y', '2025-09-24', 6.1),
('^FTSE', 'rolling_3y', '2025-09-20', 5.8),
('^FTSE', 'rolling_3y', '2025-09-15', 5.5),
-- Nikkei 225 rolling 3y
('^N225', 'rolling_3y', '2025-09-26', 14.2),
('^N225', 'rolling_3y', '2025-09-25', 14.0),
('^N225', 'rolling_3y', '2025-09-24', 13.8),
('^N225', 'rolling_3y', '2025-09-20', 13.5),
('^N225', 'rolling_3y', '2025-09-15', 13.2);

-- Mettre à jour les métadonnées
UPDATE indices_metadata 
SET last_update = '2025-09-26',
    data_start_date = '2020-01-01',
    data_end_date = '2025-09-26'
WHERE symbol IN ('^GSPC', '^FCHI', '^GDAXI', '^FTSE', '^N225');