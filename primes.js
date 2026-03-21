const API_URL = 'https://sitebds-production.up.railway.app';
let currentUser = null;

document.addEventListener('user-ready', () => {
    currentUser = window._currentUser;
    document.getElementById('player-name').textContent = window._currentName;
    init();
});

async function init() {
    await Promise.all([
        loadClassement(),
        loadMembres(),
        loadPlayerScore(),
    ]);
}

function openModal(m) {
    document.getElementById('val-titre').textContent = `Défi de ${m.nom}`;
    document.getElementById('val-defi').textContent = m.challenge;
    document.getElementById('val-gain').textContent = `+ ${m.valeur_prime} M berries`;
    document.getElementById('val-msg').textContent = '';

    const btn = document.getElementById('val-demander');
    btn.disabled = false;
    btn.onclick = async () => {
        btn.disabled = true;
        const res = await fetch(`${API_URL}/primes/demander`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login_joueur: currentUser, login_membre: m.login })
        });
        const data = await res.json();
        const msg = document.getElementById('val-msg');
        if (res.status === 409) {
            msg.style.color = '#c0392b';
            msg.textContent = 'Demande déjà envoyée !';
            return;
        }
        msg.style.color = '#27ae60';
        msg.textContent = '✅ Demande envoyée à un admin !';
    };

    document.getElementById('validation-modal').classList.add('show');
}

document.querySelector('.val-modal-bg').addEventListener('click', () => {
    document.getElementById('validation-modal').classList.remove('show');
});
async function loadClassement() {
    const res = await fetch(`${API_URL}/primes/classement`);
    const data = await res.json();

    const slots = [
        document.getElementById('podium-1'),
        document.getElementById('podium-2'),
        document.getElementById('podium-3'),
    ];

    [0, 1, 2].forEach(i => {
        const joueur = data[i];
        const slot = slots[i];
        if (!joueur) return;
        slot.querySelector('.podium-name').textContent = joueur.login;
        slot.querySelector('.podium-prime').textContent = `${joueur.prime_totale} M`;
    });
}

async function loadPlayerScore() {
    const res = await fetch(`${API_URL}/primes/joueur/${currentUser}`);
    const data = await res.json();
    document.getElementById('player-prime').textContent = `${data.prime_totale} M`;
}

async function loadMembres() {
    const res = await fetch(`${API_URL}/primes/membres`);
    const membres = await res.json();

    const grid = document.getElementById('membres-grid');
    grid.innerHTML = '';

    membres.forEach((m, i) => {
        const card = document.createElement('div');
        card.className = 'wanted-card';
        card.style.animationDelay = `${i * 0.06}s`;

        const prenom = m.nom.split(' ')[0].toLowerCase();
        const photoSrc = `assets/members/${prenom}_bis_.jpg`;

        card.innerHTML = `
            <img class="wanted-frame" src="assets/frame_prime.png" alt="">
            <img class="wanted-photo" src="${photoSrc}" alt="${m.nom}"
                 onerror="this.src=''">
            <div class="wanted-info">
                <div class="wanted-nom">${m.nom}</div>
                <div class="wanted-prime-val">${m.valeur_prime} M berries</div>
            </div>
            <div class="wanted-defi">${m.challenge}</div>
        `;

        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openModal(m));
        grid.appendChild(card);
    });
}
