import protect from "/lib/protect.js";

const WHITELIST = [
    'smichelchagn',
    'rbourgoin'
];

const API_URL = 'https://TON-BACKEND.railway.app';

let currentUser = null;

protect.getData()
    .then(data => {
        currentUser = data.user.uid;
        //filtrer si user est bien autorisé
        if (!WHITELIST.includes(currentUser)) {
            document.getElementById('access-denied').style.display = 'flex';//on affiche la code html qui correspond à "pas vérifié"
            return;
        }

        // sinon, on lui charge l'app
        document.getElementById('admin-app').style.display = 'block';
        document.getElementById('admin-user').textContent = currentUser;

        init();
    })
    .catch(() => protect.login());

function init() {
    loadOrders();

    document.getElementById('refresh-btn').addEventListener('click', loadOrders);//refresh quand le bouton refresh est appuyé
    document.getElementById('logout-btn').addEventListener('click', () => protect.logout());// sécu

    // refresh auto 30sec
    setInterval(loadOrders, 30_000);
}

async function loadOrders() {
    try {
        const res = await fetch(`${API_URL}/commandes`);
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

    // Vider les lignes existantes (sauf empty-row)
    [...tbody.querySelectorAll('tr:not(#empty-row)')].forEach(r => r.remove());

    if (commandes.length === 0) {
        emptyRow.style.display = '';
        return;
    }

    emptyRow.style.display = 'none';

    commandes.forEach(cmd => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${cmd.id}</td>
            <td>${cmd.login_cas}</td>
            <td>${formatArticles(cmd.articles)}</td>
            <td>${formatTime(cmd.created_at)}</td>
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

async function updateStatut(id, nouveauStatut) {
    try {
        await fetch(`${API_URL}/commandes/${id}/statut`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: nouveauStatut })
        });
        loadOrders(); // refresh
    } catch (err) {
        console.error('Erreur mise à jour statut :', err);
    }
}

function updateStats(commandes) {
    document.getElementById('stat-total').textContent = commandes.length;
    document.getElementById('stat-pending').textContent = commandes.filter(c => c.statut === 'en attente').length;
    document.getElementById('stat-progress').textContent = commandes.filter(c => c.statut === 'en cours').length;
    document.getElementById('stat-done').textContent = commandes.filter(c => c.statut === 'livrée').length;
}

function formatArticles(articles) {
    return Object.entries(articles)
        .map(([nom, qte]) => `${qte}× ${nom}`)
        .join(', ');
}

function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
