const API_URL = 'https://sitebds-production.up.railway.app';
let adminToken = null;
let allMembres = [];

const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
const urlError = urlParams.get('error');

if (urlToken) {
    localStorage.setItem('admin_token', urlToken);
    window.history.replaceState({}, '', '/admin-primes.html');
}

adminToken = localStorage.getItem('admin_token');

if (urlError === 'unauthorized') {
    document.getElementById('access-denied').style.display = 'flex';
} else if (!adminToken) {
    window.location.href = `${API_URL}/admin/login`;
} else {
    fetch(`${API_URL}/admin/me`, {
        headers: { 'x-admin-token': adminToken }
    })
        .then(async res => {
            if (!res.ok) {
                localStorage.removeItem('admin_token');
                window.location.href = `${API_URL}/admin/login`;
                return;
            }
            const data = await res.json();
            document.getElementById('admin-app').style.display = 'block';
            document.getElementById('admin-user').textContent = data.login;
            init();
        })
        .catch(() => { window.location.href = `${API_URL}/admin/login`; });
}

async function init() {
    setInterval(loadClassement, 15_000);
    await Promise.all([loadClassement(), loadMembres()]);

    document.getElementById('search-btn').addEventListener('click', rechercherJoueur);
    document.getElementById('search-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') rechercherJoueur();
    });
    document.getElementById('add-membre-btn').addEventListener('click', ajouterMembre);
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch(`${API_URL}/admin/logout`, { headers: { 'x-admin-token': adminToken } });
        localStorage.removeItem('admin_token');
        window.location.href = 'https://pirat.eirb.fr/index.html';
    });
}

async function loadClassement() {
    const res = await fetch(`${API_URL}/primes/classement`, {
        headers: { 'x-admin-token': adminToken }
    });
    const data = await res.json();
    const tbody = document.getElementById('classement-body');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" id="empty-classement">Aucun joueur pour l\'instant.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach((j, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${i + 1}</td>
            <td>${j.login}</td>
            <td>${j.prime_totale} M</td>
            <td>${j.defis_reussis}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadMembres() {
    const res = await fetch(`${API_URL}/primes/membres`);
    allMembres = await res.json();

    const tbody = document.getElementById('membres-body');
    tbody.innerHTML = '';

    allMembres.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${m.login}</td>
            <td>${m.nom}</td>
            <td>${m.challenge}</td>
            <td>${m.valeur_prime} M</td>
        `;
        tbody.appendChild(tr);
    });
}

async function rechercherJoueur() {
    const login = document.getElementById('search-input').value.trim().toLowerCase();
    if (!login) return;

    const [joueurRes, demandesRes] = await Promise.all([
        fetch(`${API_URL}/admin-primes/joueur/${login}`, { headers: { 'x-admin-token': adminToken } }),
        fetch(`${API_URL}/admin-primes/demandes/${login}`, { headers: { 'x-admin-token': adminToken } })
    ]);

    const data = await joueurRes.json();
    const demandes = await demandesRes.json();

    document.getElementById('joueur-login').textContent = data.joueur.login;
    document.getElementById('joueur-prime').textContent = `${data.joueur.prime_totale} M berries`;
    document.getElementById('joueur-defis').textContent = `${data.joueur.defis_reussis} défis réussis`;

    const list = document.getElementById('membres-list');
    list.innerHTML = '';

    allMembres.forEach(m => {
        const deja = data.defis_valides.includes(m.login);
        const demande = demandes.includes(m.login);
        const row = document.createElement('div');
        row.className = `membre-row${deja ? ' done' : ''}`;
        row.innerHTML = `
            <div class="membre-row-info">
                <span class="membre-row-nom">${m.nom}</span>
                <span class="membre-row-challenge">${m.challenge}</span>
            </div>
            <span class="membre-row-valeur">+${m.valeur_prime} M</span>
            ${deja
                ? '<span class="done-badge">✓ Validé</span>'
                : demande
                    ? `<button class="valider-btn pending" data-membre="${m.login}"> Défi à valider</button>`
                    : `<button class="valider-btn" data-membre="${m.login}">Valider</button>`
            }
        `;
        list.appendChild(row);
    });

    list.querySelectorAll('.valider-btn').forEach(btn => {
        btn.addEventListener('click', () => validerDefi(login, btn.dataset.membre));
    });

    document.getElementById('joueur-panel').style.display = 'block';
}

async function validerDefi(login_joueur, login_membre) {
    const res = await fetch(`${API_URL}/admin-primes/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ login_joueur, login_membre })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Erreur'); return; }

    // Supprime la demande après validation
    await fetch(`${API_URL}/admin-primes/demandes/${login_joueur}/${login_membre}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
    });

    await Promise.all([loadClassement(), rechercherJoueur()]);
}

async function ajouterMembre() {
    const login = document.getElementById('new-login').value.trim();
    const nom = document.getElementById('new-nom').value.trim();
    const challenge = document.getElementById('new-challenge').value.trim();
    const valeur = parseInt(document.getElementById('new-valeur').value);
    const msg = document.getElementById('add-msg');

    if (!login || !nom || !challenge || !valeur) {
        msg.style.color = '#ef4444';
        msg.textContent = 'Remplis tous les champs.';
        return;
    }

    const res = await fetch(`${API_URL}/admin-primes/membres`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken
        },
        body: JSON.stringify({ login, nom, challenge, valeur_prime: valeur })
    });

    if (!res.ok) {
        msg.style.color = '#ef4444';
        msg.textContent = 'Erreur lors de l\'ajout.';
        return;
    }

    msg.style.color = '#22c55e';
    msg.textContent = 'Membre ajouté !';
    document.getElementById('new-login').value = '';
    document.getElementById('new-nom').value = '';
    document.getElementById('new-challenge').value = '';
    document.getElementById('new-valeur').value = '';

    await loadMembres();
    setTimeout(() => { msg.textContent = ''; }, 2000);
}
