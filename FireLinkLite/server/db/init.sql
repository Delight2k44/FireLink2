-- FireLink Lite Database Initialization Script
-- SQLite database schema and seed data

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'community' CHECK (role IN ('agent', 'community')),
    name TEXT,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    reporter_name TEXT,
    reporter_phone TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'resolved')),
    alert_type TEXT NOT NULL DEFAULT 'general' CHECK (alert_type IN ('fire', 'medical', 'general')),
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    resolved_at INTEGER,
    assigned_agent_id TEXT REFERENCES users(id)
);

-- Create callback_requests table
CREATE TABLE IF NOT EXISTS callback_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    alert_id TEXT NOT NULL REFERENCES alerts(id),
    requester_name TEXT NOT NULL,
    requester_phone TEXT NOT NULL,
    preferred_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
);

-- Create community_responses table
CREATE TABLE IF NOT EXISTS community_responses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    alert_id TEXT NOT NULL REFERENCES alerts(id),
    user_id TEXT REFERENCES users(id),
    response_type TEXT NOT NULL CHECK (response_type IN ('en_route', 'arrived', 'assisting')),
    timestamp INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    user_id TEXT REFERENCES users(id),
    subscription TEXT NOT NULL,
    lat REAL,
    lng REAL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts(lat, lng);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_callback_requests_status ON callback_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_responses_alert ON community_responses(alert_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_location ON push_subscriptions(lat, lng);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Insert seed data

-- Insert default EMS agent user
-- Password is bcrypt hash of "ChangeMe123!" with 10 rounds
INSERT OR IGNORE INTO users (
    id,
    username,
    password,
    role,
    name,
    phone,
    is_active,
    created_at
) VALUES (
    'agent-001-uuid',
    'agent@example.com',
    '$2b$10$8K1p.D0U7IKyNFjEhD.M5uKaQ3q3Hgs5Gzr5YrG4X8B1vM2nP9Q8m',
    'agent',
    'Emergency Agent Sarah',
    '+1-555-0100',
    1,
    unixepoch()
);

-- Insert a secondary agent for testing
INSERT OR IGNORE INTO users (
    id,
    username,
    password,
    role,
    name,
    phone,
    is_active,
    created_at
) VALUES (
    'agent-002-uuid',
    'agent2@example.com',
    '$2b$10$8K1p.D0U7IKyNFjEhD.M5uKaQ3q3Hgs5Gzr5YrG4X8B1vM2nP9Q8m',
    'agent',
    'Emergency Agent Mike',
    '+1-555-0101',
    1,
    unixepoch()
);

-- Insert sample community user for testing
INSERT OR IGNORE INTO users (
    id,
    username,
    password,
    role,
    name,
    phone,
    is_active,
    created_at
) VALUES (
    'community-001-uuid',
    'community@example.com',
    '$2b$10$8K1p.D0U7IKyNFjEhD.M5uKaQ3q3Hgs5Gzr5YrG4X8B1vM2nP9Q8m',
    'community',
    'Community Member John',
    '+1-555-0200',
    1,
    unixepoch()
);

-- Sample data for development/testing (commented out for production)
-- Uncomment the following lines if you want sample alerts for testing

/*
-- Insert sample resolved alert
INSERT OR IGNORE INTO alerts (
    id,
    lat,
    lng,
    reporter_name,
    reporter_phone,
    message,
    status,
    alert_type,
    timestamp,
    resolved_at,
    assigned_agent_id
) VALUES (
    'alert-sample-001',
    37.7749,
    -122.4194,
    'John Doe',
    '+1-555-0123',
    'Small kitchen fire contained, but need EMS check',
    'resolved',
    'fire',
    unixepoch() - 3600,
    unixepoch() - 1800,
    'agent-001-uuid'
);

-- Insert sample active alert
INSERT OR IGNORE INTO alerts (
    id,
    lat,
    lng,
    reporter_name,
    reporter_phone,
    message,
    status,
    alert_type,
    timestamp,
    resolved_at,
    assigned_agent_id
) VALUES (
    'alert-sample-002',
    37.7849,
    -122.4094,
    'Jane Smith',
    '+1-555-0124',
    'Elderly person fell, conscious but needs assistance',
    'active',
    'medical',
    unixepoch() - 300,
    NULL,
    NULL
);

-- Insert sample callback request
INSERT OR IGNORE INTO callback_requests (
    id,
    alert_id,
    requester_name,
    requester_phone,
    preferred_time,
    status,
    timestamp,
    completed_at
) VALUES (
    'callback-sample-001',
    'alert-sample-001',
    'John Doe',
    '+1-555-0123',
    'Within 1 hour',
    'pending',
    unixepoch() - 600,
    NULL
);

-- Insert sample community response
INSERT OR IGNORE INTO community_responses (
    id,
    alert_id,
    user_id,
    response_type,
    timestamp
) VALUES (
    'response-sample-001',
    'alert-sample-002',
    'community-001-uuid',
    'en_route',
    unixepoch() - 120
);
*/

-- Create views for commonly used queries

-- View for active alerts with assigned agent info
CREATE VIEW IF NOT EXISTS active_alerts_with_agents AS
SELECT 
    a.*,
    u.name as agent_name,
    u.phone as agent_phone
FROM alerts a
LEFT JOIN users u ON a.assigned_agent_id = u.id
WHERE a.status = 'active';

-- View for recent community responses
CREATE VIEW IF NOT EXISTS recent_community_responses AS
SELECT 
    cr.*,
    a.alert_type,
    a.lat,
    a.lng,
    u.name as responder_name
FROM community_responses cr
JOIN alerts a ON cr.alert_id = a.id
LEFT JOIN users u ON cr.user_id = u.id
WHERE cr.timestamp > (unixepoch() - 86400); -- Last 24 hours

-- Verify schema creation
SELECT 'Database initialized successfully' as status;

-- Display table counts
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'alerts' as table_name,
    COUNT(*) as record_count  
FROM alerts
UNION ALL
SELECT 
    'callback_requests' as table_name,
    COUNT(*) as record_count
FROM callback_requests
UNION ALL
SELECT 
    'community_responses' as table_name,
    COUNT(*) as record_count
FROM community_responses
UNION ALL
SELECT 
    'push_subscriptions' as table_name,
    COUNT(*) as record_count
FROM push_subscriptions;
