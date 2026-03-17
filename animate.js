
function lerp(a, b, t) { return a + (b - a) * t; }

function interpPath(path, t) {
    const seg = path.length - 1;
    const s = t * seg;
    const i = Math.min(Math.floor(s), seg - 1);
    const lt = s - i;
    return {
        x: lerp(path[i].x, path[i + 1].x, lt),
        y: lerp(path[i].y, path[i + 1].y, lt),
    };
}

function interpScale(scales, t) {
    const seg = scales.length - 1;
    const s = t * seg;
    const i = Math.min(Math.floor(s), seg - 1);
    return lerp(scales[i], scales[Math.min(i + 1, seg)], s - i);
}

function getScrollT(selector = '.hero') {
    const container = document.querySelector(selector);
    if (!container) return 0;
    const max = container.offsetHeight - window.innerHeight;
    return max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
}


function animatePath(id, path, scales, options = {}) {
    const el = document.getElementById(id);
    if (!el) { console.warn(`animatePath: #${id} introuvable`); return; }

    const {
        container = '.hero',
        flipDown = 1,
        flipUp = 1,
    } = options;

    const applyFrame = (goingDown) => {
        const t = getScrollT(container);
        const pos = interpPath(path, t);
        const scale = interpScale(scales, t);
        const flipX = goingDown ? flipDown : flipUp;

        el.style.left = pos.x + 'vw';
        el.style.top = pos.y + 'vh';
        el.style.transform = `scaleX(${flipX * scale}) scaleY(${scale})`;
    };

    applyFrame(true);

    _pathAnimations.push(applyFrame);
}



const _pathAnimations = [];
let _lastScrollY = window.scrollY;
let _goingDown = true;

window.addEventListener('scroll', () => {
    _goingDown = window.scrollY >= _lastScrollY;
    _lastScrollY = window.scrollY;
    _pathAnimations.forEach(fn => fn(_goingDown));
    _animations.forEach(fn => fn());
}, { passive: true });
