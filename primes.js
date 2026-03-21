const API_URL = 'https://sitebds-production.up.railway.app';
let currentUser = null;
let pendingValidation = null;

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

    const params = new URLSearchParams(window.location.search);
    const loginMembre = params.get('valider');
    if (loginMembre) {
        window.history.replaceState({}, '', '/primes.html');
        openValidationModal(loginMembre);
    }
}

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
    const [membresRes, validesRes] = await Promise.all([
        fetch(`${API_URL}/primes/membres`),
        fetch(`${API_URL}/primes/joueur/${currentUser}/valides`),
    ]);

    const membres = await membresRes.json();
    let validesLogins = [];
    if (validesRes.ok) {
        const valides = await validesRes.json();
        validesLogins = valides.map(v => v.login_membre);
    }

    const grid = document.getElementById('membres-grid');
    grid.innerHTML = '';

    membres.forEach((m, i) => {
        const deja = validesLogins.includes(m.login);
        const card = document.createElement('div');
        card.className = 'wanted-card';
        card.style.animationDelay = `${i * 0.06}s`;

        const prenom = m.nom.split(' ')[0].toLowerCase();
        const photoSrc = `assets/members/${prenom}_bis_.jpg`;

        card.innerHTML = `
            <img class="wanted-frame" src="assets/frame_prime.png" alt="">
            <img class="wanted-photo" src="${photoSrc}" alt="${m.nom}"
                 onerror="this.src='assets/logo.png'">
            <div class="wanted-info">
                <div class="wanted-nom">${m.nom}</div>
                <div class="wanted-prime-val">${m.valeur_prime} M berries</div>
            </div>
            <div class="wanted-defi">${m.challenge}</div>
            ${deja ? '<div class="wanted-done">VALIDÉ ✓</div>' : ''}
        `;

        if (!deja) {
            card.addEventListener('click', () => openValidationModal(m.login, m));
        }

        grid.appendChild(card);
    });
}

async function openValidationModal(loginMembre, membreData = null) {
    if (!membreData) {
        const res = await fetch(`${API_URL}/primes/membres`);
        const list = await res.json();
        membreData = list.find(m => m.login === loginMembre);
    }

    if (!membreData) return;

    pendingValidation = loginMembre;
    document.getElementById('val-titre').textContent = `Défi de ${membreData.nom}`;
    document.getElementById('val-defi').textContent = membreData.challenge;
    document.getElementById('val-gain').textContent = `+ ${membreData.valeur_prime} M berries`;
    document.getElementById('val-msg').textContent = '';
    document.getElementById('validation-modal').classList.add('show');
}

function closeValidationModal() {
    document.getElementById('validation-modal').classList.remove('show');
    pendingValidation = null;
}

document.getElementById('val-cancel').addEventListener('click', closeValidationModal);
document.querySelector('.val-modal-bg').addEventListener('click', closeValidationModal);

document.getElementById('val-confirm').addEventListener('click', async () => {
    if (!pendingValidation || !currentUser) return;

    const msg = document.getElementById('val-msg');
    const btn = document.getElementById('val-confirm');
    btn.disabled = true;

    const res = await fetch(`${API_URL}/primes/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_joueur: currentUser, login_membre: pendingValidation }),
    });

    const data = await res.json();

    if (res.status === 409) {
        msg.style.color = '#c0392b';
        msg.textContent = 'Tu as déjà validé ce défi';
        btn.disabled = false;
        return;
    }

    if (!res.ok) {
        msg.style.color = '#c0392b';
        msg.textContent = 'Erreur, réessaie.';
        btn.disabled = false;
        return;
    }

    msg.style.color = '#27ae60';
    msg.textContent = `+${data.gain} M berries !`;

    setTimeout(async () => {
        closeValidationModal();
        await Promise.all([loadClassement(), loadMembres(), loadPlayerScore()]);
    }, 1500);
});
