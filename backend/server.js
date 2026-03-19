require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5500', credentials: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Test que le serveur tourne
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(process.env.PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${process.env.PORT}`);
});
const pool = require('./db');


app.get('/auth/verify', async (req, res) => {
    const { login } = req.query;
    if (!login) return res.status(400).json({ error: 'login manquant' });

    const result = await pool.query('SELECT login FROM admins WHERE login = $1', [login]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'non autorisé' });

    res.json({ ok: true });
});

app.post('/commandes', async (req, res) => {
    const { login_cas, articles } = req.body;
    if (!login_cas || !articles) return res.status(400).json({ error: 'données manquantes' });

    const result = await pool.query(
        'INSERT INTO commandes (login_cas, articles) VALUES ($1, $2) RETURNING *',
        [login_cas, JSON.stringify(articles)]
    );
    res.json(result.rows[0]);
});

app.get('/commandes', async (req, res) => {
    const result = await pool.query('SELECT * FROM commandes ORDER BY created_at DESC');
    res.json(result.rows);
});

app.patch('/commandes/:id/statut', async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;

    const valides = ['en attente', 'en cours', 'livrée'];
    if (!valides.includes(statut)) return res.status(400).json({ error: 'statut invalide' });

    const result = await pool.query(
        'UPDATE commandes SET statut = $1 WHERE id = $2 RETURNING *',
        [statut, id]
    );
    res.json(result.rows[0]);
});
