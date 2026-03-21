const API_URL = 'https://sitebds-production.up.railway.app';

/* Pars d ici c pas pour toi masta */
/* Une faille révélée = 1 allo gratuit */

let currentUser = null;
let adminToken = null;

const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
const urlError = urlParams.get('error');

if (urlToken) {
    localStorage.setItem('admin_token', urlToken);
    window.history.replaceState({}, '', '/admin.html');
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
            currentUser = data.login;
            document.getElementById('admin-app').style.display = 'block';
            document.getElementById('admin-user').textContent = currentUser;
            init();
        })
        .catch(() => {
            window.location.href = `${API_URL}/admin/login`;
        });
}

function init() {
    loadOrders();
    document.getElementById('refresh-btn').addEventListener('click', loadOrders);
    document.getElementById('qg-select').addEventListener('change', loadOrders);
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch(`${API_URL}/admin/logout`, {
            headers: { 'x-admin-token': adminToken }
        });
        localStorage.removeItem('admin_token');
        window.location.href = 'https://w59ny1o37izpd8sy68bsb6e96lj63r.eirb.fr/index.html';
    });
    setInterval(loadOrders, 30_000);
}

async function loadOrders() {
    try {
        const qg = document.getElementById('qg-select').value;
        const res = await fetch(`${API_URL}/commandes?qg=${qg}`, {
            headers: { 'x-admin-token': adminToken }
        });
        const commandes = await res.json();
        renderOrders(commandes);
        updateStats(commandes);
        updateTimestamp();
    } catch (err) {
        console.error('Erreur chargement commandes :', err);
    }
}

function renderOrders(commandes) {
    const tbody = document.getElementById('orders-body');
    const emptyRow = document.getElementById('empty-row');

    [...tbody.querySelectorAll('tr:not(#empty-row)')].forEach(r => r.remove());

    const actives = commandes.filter(c => c.statut !== 'livrée');

    if (actives.length === 0) {
        emptyRow.style.display = '';
        return;
    }

    emptyRow.style.display = 'none';

    actives.forEach(cmd => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${cmd.id}</td>
            <td>${cmd.prenom ?? '—'} ${cmd.nom ?? ''}</td>
            <td>${cmd.login_cas}</td>
            <td>${cmd.phone ?? '—'}</td>
            <td>${cmd.adresse ?? '—'}</td>
            <td>${formatArticles(cmd.articles)}</td>
            <td>${cmd.total ?? '—'} €</td>
            <td>${badgeStatut(cmd.statut)}</td>
            <td>${actionsStatut(cmd.id, cmd.statut)}</td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, statut } = btn.dataset;
            updateStatut(id, statut);
        });
    });
}

function updateStats(commandes) {
    document.getElementById('stat-total').textContent = commandes.length;
    document.getElementById('stat-pending').textContent = commandes.filter(c => c.statut === 'en attente').length;
    document.getElementById('stat-progress').textContent = commandes.filter(c => c.statut === 'en cours').length;
    document.getElementById('stat-done').textContent = commandes.filter(c => c.statut === 'livrée').length;
}

async function updateStatut(id, nouveauStatut) {
    try {
        await fetch(`${API_URL}/commandes/${id}/statut`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken
            },
            body: JSON.stringify({ statut: nouveauStatut })
        });
        loadOrders();
    } catch (err) {
        console.error('Erreur mise à jour statut :', err);
    }
}

function formatArticles(articles) {
    return Object.entries(articles)
        .map(([nom, qte]) => `${qte}× ${nom}`)
        .join(', ');
}

function badgeStatut(statut) {
    const map = {
        'en attente': '<span class="badge badge--pending">En attente</span>',
        'en cours': '<span class="badge badge--progress">En cours</span>',
        'livrée': '<span class="badge badge--done">Livrée</span>',
    };
    return map[statut] ?? statut;
}

function actionsStatut(id, statut) {
    if (statut === 'en attente') {
        return `<button class="action-btn" data-id="${id}" data-statut="en cours">Prendre en charge</button>`;
    }
    if (statut === 'en cours') {
        return `<button class="action-btn" data-id="${id}" data-statut="livrée">Marquer livrée</button>`;
    }
    return '—';
}

function updateTimestamp() {
    document.getElementById('last-update').textContent =
        `Dernière mise à jour : ${new Date().toLocaleTimeString('fr-FR')}`;
}
