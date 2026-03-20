require('dotenv').config();
const express   = require('express');
const session   = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors      = require('cors');
const crypto    = require('crypto');
const pool      = require('./db');
const { discovery, randomState, randomNonce, authorizationCodeGrant, fetchUserInfo } = require('openid-client');

const app = express();

let oidcConfig = null;

async function getOidcConfig() {
    if (oidcConfig) return oidcConfig;
    oidcConfig = await discovery(
        new URL(process.env.OPENID_ISSUER),
        process.env.OPENID_CLIENT_ID,
        process.env.OPENID_CLIENT_SECRET
    );
    return oidcConfig;
}

async function verifyToken(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ error: 'non autorisé' });
    const result = await pool.query(
        'SELECT login FROM admin_tokens WHERE token = $1 AND expires_at > NOW()',
        [token]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'token invalide' });
    req.adminLogin = result.rows[0].login;
    next();
}

app.use(cors({
    origin: [
        'http://localhost:5500',
        'https://w59ny1o37izpd8sy68bsb6e96lj63r.eirb.fr'
    ],
    credentials: true
}));

app.use(express.json());

app.use(session({
    store: new pgSession({ pool, tableName: 'sessions' }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.get('/admin/login', async (req, res) => {
    const config = await getOidcConfig();
    const state  = randomState();
    const nonce  = randomNonce();
    const stateWithNonce = `${state}|${nonce}`;

    const params = new URLSearchParams({
        response_type: 'code',
        client_id:     process.env.OPENID_CLIENT_ID,
        redirect_uri:  process.env.OPENID_REDIRECT_URI,
        scope:         'openid profile email',
        state:         stateWithNonce,
        nonce,
    });

    const authUrl = `${config.serverMetadata().authorization_endpoint}?${params}`;
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    try {
        const config    = await getOidcConfig();
        const rawState  = req.query.state || '';
        const [, expectedNonce] = rawState.split('|');

        const tokens = await authorizationCodeGrant(
            config,
            new URL(`${process.env.OPENID_REDIRECT_URI}?${new URLSearchParams(req.query)}`),
            { pkceCodeVerifier: undefined, expectedState: rawState, expectedNonce }
        );

        const userinfo = await fetchUserInfo(config, tokens.access_token, tokens.claims().sub);
        const login    = userinfo.uid || userinfo.preferred_username;

        const result = await pool.query('SELECT login FROM admins WHERE login = $1', [login]);
        if (result.rows.length === 0) {
            return res.redirect('https://w59ny1o37izpd8sy68bsb6e96lj63r.eirb.fr/admin.html?error=unauthorized');
        }

        const token   = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(
            'INSERT INTO admin_tokens (token, login, expires_at) VALUES ($1, $2, $3)',
            [token, login, expires]
        );

        res.redirect(`https://w59ny1o37izpd8sy68bsb6e96lj63r.eirb.fr/admin.html?token=${token}`);
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('https://w59ny1o37izpd8sy68bsb6e96lj63r.eirb.fr/admin.html?error=auth_failed');
    }
});

app.get('/admin/me', async (req, res) => {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ error: 'token manquant' });
    const result = await pool.query(
        'SELECT login FROM admin_tokens WHERE token = $1 AND expires_at > NOW()',
        [token]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'token invalide' });
    res.json({ login: result.rows[0].login });
});

app.get('/admin/logout', async (req, res) => {
    const token = req.headers['x-admin-token'];
    console.log("#### DECONNEXION ####")
    if (token) {
        const result = await pool.query('DELETE FROM admin_tokens WHERE token = $1', [token]);
        console.log('Token supprimé, rows affected:', result.rowCount);
    }
    res.json({ ok: true });
});

app.get('/auth/verify', async (req, res) => {
    const { login } = req.query;
    if (!login) return res.status(400).json({ error: 'login manquant' });
    const result = await pool.query('SELECT login FROM admins WHERE login = $1', [login]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'non autorisé' });
    res.json({ ok: true });
});

app.get('/auth/antileak', async (req, res) => {
    const { login } = req.query;
    if (!login) return res.status(400).json({ error: 'login manquant' });
    const result = await pool.query('SELECT login FROM antileak WHERE login = $1', [login]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'non autorisé' });
    res.json({ ok: true });
});

app.post('/commandes', async (req, res) => {
    const { login_cas, prenom, nom, tel, adresse, articles, qg, total } = req.body;
    if (!login_cas || !articles) return res.status(400).json({ error: 'données manquantes' });
    const result = await pool.query(
        'INSERT INTO commandes (login_cas, prenom, nom, phone, adresse, articles, qg, total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [login_cas, prenom, nom, tel, adresse, JSON.stringify(articles), qg, total]
    );
    res.json(result.rows[0]);
});

app.get('/commandes', verifyToken, async (req, res) => {
    const { qg } = req.query;
    const result = qg
        ? await pool.query('SELECT * FROM commandes WHERE qg = $1 ORDER BY created_at DESC', [qg])
        : await pool.query('SELECT * FROM commandes ORDER BY created_at DESC');
    res.json(result.rows);
});

app.patch('/commandes/:id/statut', verifyToken, async (req, res) => {
    const { id }    = req.params;
    const { statut } = req.body;
    const valides   = ['en attente', 'en cours', 'livrée'];
    if (!valides.includes(statut)) return res.status(400).json({ error: 'statut invalide' });
    const result = await pool.query(
        'UPDATE commandes SET statut = $1 WHERE id = $2 RETURNING *',
        [statut, id]
    );
    res.json(result.rows[0]);
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Serveur lancé sur http://localhost:${process.env.PORT || 3000}`);
});