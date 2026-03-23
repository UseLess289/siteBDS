import protect from "/lib/protect.js";

const API_URL = 'https://sitebds-production.up.railway.app';

const MENUS = {
    talence: [
        { nom: 'Crêpe sucre', prix: 0.10 },
        { nom: 'Crêpe pâte à tartiner', prix: 0.10 },
        { nom: 'Wrap poulet halal', prix: 1.50 },
        { nom: 'Panini nutella', prix: 1.50 },
        //{ nom: 'Panini fromage', prix: 1.50 },
        { nom: 'Brownie', prix: 2.00 },
        { nom: 'Encens', prix: 6.50 },
        { nom: 'Le J, le S', prix: 1.50 },
    ],
    bordeaux: [
        { nom: 'Crêpe sucre', prix: 0.10 },
        { nom: 'Crêpe pâte à tartiner', prix: 0.10 },
        { nom: 'Wrap poulet halal', prix: 1.50 },
        { nom: 'Panini nutella', prix: 1.50 },
        //{ nom: 'Panini fromage',         prix: 1.50 },
        { nom: 'Brownie', prix: 2.00 },
        { nom: 'Tiramisu spéculos', prix: 2.50 },
        { nom: 'Tiramisu oreo', prix: 2.50 },
        { nom: 'Tiramisu café', prix: 2.50 },
        { nom: 'Madeleine', prix: 1.00 },
        { nom: 'Encens', prix: 6.50 },
        { nom: 'Le J, le S', prix: 1.50 },
    ],
    pessac: [
        { nom: 'Crêpe sucre', prix: 0.10 },
        { nom: 'Crêpe pâte à tartiner', prix: 0.10 },
        { nom: 'Wrap poulet halal', prix: 1.50 },
        { nom: 'Panini nutella', prix: 1.50 },
        //{ nom: 'Panini fromage', prix: 1.50 },
        { nom: 'Brownie', prix: 2.00 },
        { nom: 'Encens', prix: 6.50 },
        { nom: 'Le J, le S', prix: 1.50 },
    ],
};

const QG_LABELS = {
    talence: 'QG — Talence',
    bordeaux: 'QG — Bordeaux',
    pessac: 'QG — Pessac',
};

const QG_MAP = { c1: 'talence', c2: 'bordeaux', c3: 'pessac' };

let currentUser = null;
let currentQG = null;
let quantities = {};

protect.getData()
    .then(data => { currentUser = data.user.uid; })
    .catch(() => { });

function getOpenQG() {
    for (const [inputId, qg] of Object.entries(QG_MAP)) {
        const input = document.getElementById(inputId);
        if (input && input.checked) return qg;
    }
    return null;
}

function openModal(qg) {
    currentQG = qg;
    quantities = {};

    document.getElementById('modal-qg-title').textContent = QG_LABELS[qg];
    document.getElementById('commande-confirm-msg').textContent = '';
    document.getElementById('field-prenom').value = '';
    document.getElementById('field-nom').value = '';
    document.getElementById('field-tel').value = '';
    document.getElementById('field-adresse').value = '';

    renderMenu(qg);
    updateTotal();

    document.getElementById('commande-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('commande-modal').classList.remove('show');
}

function renderMenu(qg) {
    function nomToId(nom) {
        return nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
    }
    const container = document.getElementById('commande-menu');
    container.innerHTML = '';

    MENUS[qg].forEach(item => {
        quantities[item.nom] = 0;

        const ligne = document.createElement('div');
        ligne.className = 'menu-ligne';
        ligne.innerHTML = `
            <div class="menu-ligne-info">
                <span class="menu-ligne-nom">${item.nom}</span>
                <span class="menu-ligne-prix">${item.prix.toFixed(2)} €</span>
            </div>
            <div class="menu-ligne-counter">
                <button class="counter-btn" data-nom="${item.nom}" data-action="minus">−</button>
                <span class="counter-val" id="qty-${nomToId(item.nom)}">0</span>
                <button class="counter-btn" data-nom="${item.nom}" data-action="plus">+</button>
            </div>
        `;
        container.appendChild(ligne);
    });

    container.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nom = btn.dataset.nom;
            const action = btn.dataset.action;
            if (action === 'plus') quantities[nom] = (quantities[nom] || 0) + 1;
            if (action === 'minus') quantities[nom] = Math.max(0, (quantities[nom] || 0) - 1);

            const key = nomToId(nom);
            document.getElementById(`qty-${key}`).textContent = quantities[nom];
            updateTotal();
        });
    });
}

function updateTotal() {
    const menu = MENUS[currentQG] || [];
    const total = menu.reduce((sum, item) => sum + (quantities[item.nom] || 0) * item.prix, 0);
    document.getElementById('commande-total-price').textContent = total.toFixed(2) + ' €';
}

async function submitCommande() {
    const prenom = document.getElementById('field-prenom').value.trim();
    const nom = document.getElementById('field-nom').value.trim();
    const tel = document.getElementById('field-tel').value.trim();
    const adresse = document.getElementById('field-adresse').value.trim();
    const msg = document.getElementById('commande-confirm-msg');

    if (!prenom || !nom || !tel || !adresse) {
        msg.style.color = '#ef4444';
        msg.textContent = 'Remplis tous les champs.';
        return;
    }

    const articles = {};
    Object.entries(quantities).forEach(([nom, qty]) => {
        if (qty > 0) articles[nom] = qty;
    });

    if (Object.keys(articles).length === 0) {
        msg.style.color = '#ef4444';
        msg.textContent = 'Sélectionne au moins un article.';
        return;
    }

    if (!currentUser) {
        protect.login();
        return;
    }

    const total = MENUS[currentQG].reduce((sum, item) => sum + (quantities[item.nom] || 0) * item.prix, 0);

    try {
        const res = await fetch(`${API_URL}/commandes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login_cas: currentUser,
                prenom,
                nom,
                tel,
                adresse,
                articles,
                qg: currentQG,
                total: total.toFixed(2),
            }),
        });

        if (!res.ok) throw new Error();

        msg.style.color = '#22c55e';
        msg.textContent = 'Commande envoyée !';
        document.getElementById('commande-submit').disabled = true;

        setTimeout(closeModal, 2000);
    } catch {
        msg.style.color = '#ef4444';
        msg.textContent = 'Erreur, réessaie.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.command').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();

            if (!currentUser) {
                try {
                    const data = await protect.getData();
                    currentUser = data.user.uid;
                } catch {
                    protect.login();
                    return;
                }
            }

            const qg = getOpenQG();
            if (!qg) return;
            openModal(qg);
        });
    });

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.commande-modal-bg').addEventListener('click', closeModal);
    document.getElementById('commande-submit').addEventListener('click', submitCommande);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
});
