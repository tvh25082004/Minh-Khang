/* =========================================================
   THIỆP THÔI NÔI BÉ GẤU - JavaScript
   ========================================================= */
(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    /* =========================================================
       CỔNG CHÀO & NHẠC NỀN
       ========================================================= */
    const TRACKS = [
        { src: 'audio/khuc-hat-mung-sinh-nhat.mp3', title: 'Khúc Hát Mừng Sinh Nhật' },
        { src: 'audio/giac-mo-than-tien.mp3', title: 'Giấc Mơ Thần Tiên' }
    ];

    const audio = $('#bgm');
    const musicBar = $('#musicBar');
    const musicTitle = $('#musicTitle');
    const musicProgress = $('#musicProgress');
    const musicToggle = $('#musicToggle');

    let currentTrack = 0;
    let musicStarted = false;

    function loadTrack(index) {
        currentTrack = index % TRACKS.length;
        audio.src = TRACKS[currentTrack].src;
        musicTitle.textContent = TRACKS[currentTrack].title;
        musicProgress.style.width = '0%';
    }

    function playMusic() {
        musicStarted = true;
        musicBar.classList.remove('hidden');
        musicBar.classList.add('playing');
        audio.play().catch(() => { /* trình duyệt chặn, chờ lần tương tác sau */ });
    }

    function toggleMusic() {
        if (audio.paused) {
            audio.play().catch(() => {});
            musicBar.classList.add('playing');
        } else {
            audio.pause();
            musicBar.classList.remove('playing');
        }
    }

    function nextTrack() {
        loadTrack(currentTrack + 1);
        if (!audio.paused) audio.play().catch(() => {});
    }

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            musicProgress.style.width = (audio.currentTime / audio.duration) * 100 + '%';
        }
    });

    audio.addEventListener('ended', nextTrack);

    /* Mở cổng chào */
    const gate = $('#gate');
    const gateBtn = $('#gateOpenBtn');

    gateBtn.addEventListener('click', () => {
        gate.classList.add('hide');
        document.body.style.overflow = '';
        playMusic();
        window.ParticleFX && window.ParticleFX.start();
        setTimeout(() => gate.remove(), 900);
    });

    /* Nút nhạc */
    musicToggle.addEventListener('click', toggleMusic);
    $('#musicNext').addEventListener('click', nextTrack);

    /* =========================================================
       ĐẾM NGƯỢC ĐẾN 18H00 - 03/12/2026
       ========================================================= */
    const TARGET = new Date('2026-12-03T18:00:00+07:00').getTime();

    const tDays = $('#tDays');
    const tHours = $('#tHours');
    const tMins = $('#tMins');
    const tSecs = $('#tSecs');

    function flash(el) {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function setTime(el, value) {
        const v = pad(value);
        if (el.textContent !== v) {
            el.textContent = v;
            flash(el);
        }
    }

    function updateCountdown() {
        const diff = Math.max(0, TARGET - Date.now());
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTime(tDays, days);
        setTime(tHours, hours);
        setTime(tMins, mins);
        setTime(tSecs, secs);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
})();

(function () {
    'use strict';

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    /* =========================================================
       HIỆU ỨNG REVEAL KHI CUỘN
       ========================================================= */
    const revealEls = $$('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('visible'));
    }

    /* =========================================================
       ALBUM ẢNH - VUỐT NGANG + DOTS
       ========================================================= */
    const swipeTrack = $('#swipeTrack');
    const slides = $$('.slide', swipeTrack);
    const dotsWrap = $('#swipeDots');

    slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
            slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
        dotsWrap.appendChild(dot);
    });

    const dots = $$('.dot', dotsWrap);

    function syncDots() {
        const activeIdx = Math.min(Math.round(swipeTrack.scrollLeft / (swipeTrack.children[0].offsetWidth + 16)), slides.length - 1);
        dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
        autoIdx = activeIdx;
    }

    swipeTrack.addEventListener('scroll', syncDots, { passive: true });

    /* =========================================================
       ALBUM TỰ ĐỘNG CHẠY (autoplay)
       Ngừng khi bạn chạm/rê chuột, rồi tự chạy lại sau một chút
       ========================================================= */
    const AUTOPLAY_MS = 3000;
    const RESUME_MS = 7000;
    const swipeSection = $('#swipe');

    let autoIdx = 0;
    let autoTimer = null;
    let inView = true;
    let interacting = false;
    let resumeTimer = null;

    function goToSlide(idx) {
        autoIdx = (idx + slides.length) % slides.length;
        slides[autoIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    function startAuto() {
        stopAuto();
        if (!inView || interacting || document.hidden) return;
        autoTimer = setInterval(() => {
            if (document.hidden) return;
            goToSlide(autoIdx + 1);
        }, AUTOPLAY_MS);
    }

    function holdAuto(delay) {
        interacting = true;
        stopAuto();
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
            interacting = false;
            startAuto();
        }, delay || RESUME_MS);
    }

    ['touchstart', 'pointerdown'].forEach((evt) =>
        swipeTrack.addEventListener(evt, () => holdAuto(), { passive: true })
    );
    ['touchend', 'pointerup'].forEach((evt) =>
        swipeTrack.addEventListener(evt, () => holdAuto(RESUME_MS), { passive: true })
    );
    swipeTrack.addEventListener('mouseenter', () => holdAuto());
    swipeTrack.addEventListener('mouseleave', () => holdAuto(RESUME_MS));

    /* Chỉ chạy khi album nằm trong màn hình */
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.target === swipeSection) {
                    inView = entry.isIntersecting;
                    startAuto();
                }
            });
        }, { threshold: 0.35 }).observe(swipeSection);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAuto(); else startAuto();
    });

    startAuto();

    /* =========================================================
       LIGHTBOX XEM ẢNH
       ========================================================= */
    const lightbox = $('#lightbox');
    const lbImg = $('#lbImg');
    const lbCaption = $('#lbCaption');
    const lbCounter = $('#lbCounter');
    let lbIndex = 0;

    function openLightbox(index) {
        lbIndex = (index + slides.length) % slides.length;
        const slide = slides[lbIndex];
        const img = $('img', slide);
        lbImg.src = img.src;
        lbCaption.textContent = slide.getAttribute('data-caption') || '';
        lbCounter.textContent = (lbIndex + 1) + ' / ' + slides.length;
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden';
        stopAuto();
    }

    function closeLightbox() {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
        startAuto();
    }

    function navLightbox(dir) {
        lbImg.style.opacity = '0';
        lbImg.style.transition = 'opacity .25s ease';
        setTimeout(() => {
            openLightbox(lbIndex + dir);
            lbImg.style.opacity = '1';
        }, 250);
    }

    slides.forEach((slide, i) => {
        slide.addEventListener('click', () => openLightbox(i));
    });

    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', () => navLightbox(-1));
    $('#lbNext').addEventListener('click', () => navLightbox(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    /* Vuốt trong lightbox */
    let touchX = 0;
    lightbox.addEventListener('touchstart', (e) => {
        touchX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 45) navLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });

    /* Bàn phím */
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('show')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navLightbox(-1);
        if (e.key === 'ArrowRight') navLightbox(1);
    });

    /* =========================================================
       NÚT BẢN ĐỒ - ẩn khi chưa có link thật
       ========================================================= */
    const mapLink = $('#mapLink');
    if (mapLink && mapLink.getAttribute('href') === '#') {
        mapLink.style.display = 'none';
    }

    /* =========================================================
       CHIA SẺ THIỆP
       ========================================================= */
    $('#shareInvite').addEventListener('click', async () => {
        const shareData = {
            title: 'Thôi Nôi Bé Gấu - Tròn 1 Tuổi',
            text: 'Thiệp mời thôi nôi bé Gấu - Lê Chí Minh Khang (18h00, 03/12/2026 - Số nhà 28/68, phố Ái Sơn, phường Hạc Thành, TP Thanh Hóa). Cùng gửi lời chúc yêu thương đến bé nhé!',
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (e) { /* user huỷ */ }
        } else if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(shareData.text + ' ' + window.location.href);
                const btn = $('#shareInvite');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép link';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Chia sẻ thiệp mời';
                }, 2200);
            } catch (e) { /* noop */ }
        }
    });
})();

(function () {
    'use strict';

    /* =========================================================
       HIỆU ỨNG PARTICLE NỀN (bong bóng + sao lấp lánh)
       ========================================================= */
    const canvas = document.getElementById('fx');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let running = false;
    let lastBalloon = 0;

    const BOKEH = [
        'rgba(127, 200, 180, ',
        'rgba(233, 180, 76, ',
        'rgba(255, 233, 168, ',
        'rgba(169, 214, 232, ',
        'rgba(255, 255, 255, '
    ];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function makeParticle() {
        const type = Math.random() < 0.72 ? 'bokeh' : 'sparkle';
        const r = type === 'bokeh' ? (Math.random() * 26 + 6) : (Math.random() * 3 + 1.5);
        return {
            type,
            x: Math.random() * canvas.width,
            y: canvas.height + r,
            r,
            vy: -(Math.random() * 0.7 + 0.25),
            sway: Math.random() * 40 + 10,
            swaySpeed: Math.random() * 0.01 + 0.003,
            phase: Math.random() * Math.PI * 2,
            alpha: Math.random() * 0.4 + 0.15,
            color: BOKEH[Math.floor(Math.random() * BOKEH.length)],
            spin: Math.random() * Math.PI * 2
        };
    }

    function seed() {
        particles = [];
        const count = Math.min(42, Math.floor((canvas.width / 430) * 34));
        for (let i = 0; i < count; i++) {
            const p = makeParticle();
            p.y = Math.random() * canvas.height;
            particles.push(p);
        }
    }

    function spawnBalloon() {
        particles.push({
            type: 'balloon',
            x: Math.random() * canvas.width,
            y: canvas.height + 40,
            vy: -(Math.random() * 1.2 + 0.8),
            alpha: 0.95,
            phase: Math.random() * Math.PI * 2,
            sway: 26,
            swaySpeed: 0.01,
            size: Math.random() * 18 + 20
        });
    }

    function draw(p, t) {
        p.y += p.vy;
        p.phase += p.swaySpeed;
        const x = p.x + Math.sin(p.phase) * p.sway;

        if (p.type === 'bokeh') {
            const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 2);
            g.addColorStop(0, p.color + p.alpha + ')');
            g.addColorStop(1, p.color + '0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, p.y, p.r * 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'sparkle') {
            ctx.save();
            ctx.translate(x, p.y);
            ctx.rotate(p.spin);
            ctx.fillStyle = p.color + (p.alpha + Math.sin(t * 0.004) * 0.15) + ')';
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.lineTo(0, -p.r * 3);
                ctx.lineTo(p.r, 0);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (p.type === 'balloon') {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.font = p.size + 'px serif';
            ctx.textAlign = 'center';
            ctx.fillText('🎈', x, p.y);
            ctx.restore();
        }
    }

    function loop(t) {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            draw(particles[i], t);
            if (particles[i].y < -80) particles[i] = makeParticle();
        }

        if (t - lastBalloon > 6000) {
            lastBalloon = t;
            spawnBalloon();
        }

        requestAnimationFrame(loop);
    }

    window.ParticleFX = {
        start() {
            if (running) return;
            running = true;
            resize();
            seed();
            lastBalloon = performance.now();
            requestAnimationFrame(loop);
        },
        stop() {
            running = false;
        }
    };

    window.addEventListener('resize', resize);
})();

/* Mở sẵn thiệp khi truy cập bằng link có ?preview=1 (tiện cho xem trước) */
(function () {
    if (new URLSearchParams(window.location.search).has('preview')) {
        var gate = document.getElementById('gate');
        if (gate) { gate.classList.add('hide'); gate.remove(); }
        document.body.style.overflow = '';
        var mbar = document.getElementById('musicBar');
        if (mbar) mbar.classList.remove('hidden');
        if (window.ParticleFX) window.ParticleFX.start();
    }
})();
