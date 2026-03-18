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