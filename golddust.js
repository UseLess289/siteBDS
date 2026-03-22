// Gold dust particle system
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'gold-dust-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0'; // Put it behind most things but in front of deep backgrounds if needed, or adjust as necessary. In equipage.html, z-index: -1 is svg.
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    const particleCount = 200; // Increased density

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 3 + 1.4, // Increased size
            vx: (Math.random() - 0.5) * 1.0, // Increased horizontal drift
            vy: Math.random() * 1.5 + 1.0, // Increased vertical speed slightly
            opacity: Math.random() * 0.6 + 0.4 // Increased base opacity
        });
    }

    function render() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            ctx.shadowBlur = 12; // Increased glow
            ctx.shadowColor = 'rgba(255, 215, 0, 1)';
            ctx.fill();

            // Twinkle effect
            if (Math.random() < 0.05) {
                p.opacity = Math.random() * 0.6 + 0.4;
            }

            if (p.y > height + 10) {
                p.y = -10;
                p.x = Math.random() * width;
            }
        });
        requestAnimationFrame(render);
    }
    render();
})();
