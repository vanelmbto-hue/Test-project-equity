-- Table pour les indices nationaux (S&P 500, CAC 40, DAX, etc.)
CREATE TABLE IF NOT EXISTS national_indices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    date DATE NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL NOT NULL,
    volume INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- Table pour les indices STOXX sectoriels
CREATE TABLE IF NOT EXISTS stoxx_indices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    date DATE NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL NOT NULL,
    volume INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, date)
);

-- Table pour stocker les métadonnées des indices
CREATE TABLE IF NOT EXISTS indices_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    type TEXT NOT NULL, -- 'national' ou 'stoxx'
    country TEXT,
    sector TEXT,
    currency TEXT,
    last_update DATE,
    data_start_date DATE,
    data_end_date DATE,
    total_records INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les calculs pré-calculés (rolling returns, YTD, etc.)
CREATE TABLE IF NOT EXISTS indices_calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    calculation_type TEXT NOT NULL, -- 'ytd', 'rolling_3y', 'rolling_5y', etc.
    date DATE NOT NULL,
    value REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, calculation_type, date)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_national_indices_symbol_date ON national_indices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_national_indices_date ON national_indices(date DESC);
CREATE INDEX IF NOT EXISTS idx_stoxx_indices_symbol_date ON stoxx_indices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_stoxx_indices_date ON stoxx_indices(date DESC);
CREATE INDEX IF NOT EXISTS idx_indices_calculations_symbol_type ON indices_calculations(symbol, calculation_type, date DESC);

-- Insérer les métadonnées des indices principaux
INSERT OR REPLACE INTO indices_metadata (symbol, name, full_name, type, country, currency) VALUES
-- Indices US
('^GSPC', 'S&P 500', 'Standard & Poor''s 500', 'national', 'US', 'USD'),
('^DJI', 'Dow Jones', 'Dow Jones Industrial Average', 'national', 'US', 'USD'),
('^IXIC', 'NASDAQ', 'NASDAQ Composite', 'national', 'US', 'USD'),
('^RUT', 'Russell 2000', 'Russell 2000 Index', 'national', 'US', 'USD'),
-- Indices européens
('^FCHI', 'CAC 40', 'CAC 40 Index', 'national', 'FR', 'EUR'),
('^GDAXI', 'DAX', 'DAX Performance Index', 'national', 'DE', 'EUR'),
('^FTSE', 'FTSE 100', 'Financial Times Stock Exchange 100', 'national', 'GB', 'GBP'),
('^AEX', 'AEX', 'Amsterdam Exchange Index', 'national', 'NL', 'EUR'),
-- Indices asiatiques
('^N225', 'Nikkei 225', 'Nikkei Stock Average', 'national', 'JP', 'JPY'),
('^HSI', 'Hang Seng', 'Hang Seng Index', 'national', 'HK', 'HKD'),
('^SSEC', 'Shanghai', 'Shanghai Composite Index', 'national', 'CN', 'CNY'),
('^KS11', 'KOSPI', 'Korea Stock Price Index', 'national', 'KR', 'KRW'),
-- Indices STOXX sectoriels
('SX8P.DE', 'STOXX Technology', 'STOXX Europe 600 Technology', 'stoxx', 'EU', 'EUR'),
('SXKP.DE', 'STOXX Telecoms', 'STOXX Europe 600 Telecommunications', 'stoxx', 'EU', 'EUR'),
('SXDP.DE', 'STOXX Health', 'STOXX Europe 600 Health Care', 'stoxx', 'EU', 'EUR'),
('SXFP.DE', 'STOXX Finance', 'STOXX Europe 600 Financial Services', 'stoxx', 'EU', 'EUR'),
('SX7P.DE', 'STOXX Banks', 'STOXX Europe 600 Banks', 'stoxx', 'EU', 'EUR'),
('SXIP.DE', 'STOXX Insurance', 'STOXX Europe 600 Insurance', 'stoxx', 'EU', 'EUR'),
('SX86P.DE', 'STOXX Real Estate', 'STOXX Europe 600 Real Estate', 'stoxx', 'EU', 'EUR'),
('SXAP.DE', 'STOXX Auto', 'STOXX Europe 600 Automobiles & Parts', 'stoxx', 'EU', 'EUR'),
('SX3P.DE', 'STOXX Food', 'STOXX Europe 600 Food & Beverage', 'stoxx', 'EU', 'EUR'),
('SXQP.DE', 'STOXX Personal', 'STOXX Europe 600 Personal & Household Goods', 'stoxx', 'EU', 'EUR'),
('SXRP.DE', 'STOXX Retail', 'STOXX Europe 600 Retail', 'stoxx', 'EU', 'EUR'),
('SXMP.DE', 'STOXX Media', 'STOXX Europe 600 Media', 'stoxx', 'EU', 'EUR'),
('SXTP.DE', 'STOXX Travel', 'STOXX Europe 600 Travel & Leisure', 'stoxx', 'EU', 'EUR'),
('SX4P.DE', 'STOXX Construction', 'STOXX Europe 600 Construction & Materials', 'stoxx', 'EU', 'EUR'),
('SXNP.DE', 'STOXX Industrial', 'STOXX Europe 600 Industrial Goods & Services', 'stoxx', 'EU', 'EUR'),
('SXPP.DE', 'STOXX Resources', 'STOXX Europe 600 Basic Resources', 'stoxx', 'EU', 'EUR'),
('SXEP.DE', 'STOXX Energy', 'STOXX Europe 600 Energy', 'stoxx', 'EU', 'EUR'),
('SX6P.DE', 'STOXX Utilities', 'STOXX Europe 600 Utilities', 'stoxx', 'EU', 'EUR');