/* =========================================
   MSCC — script.js
   - Floating squishy letters background
   - Typing bubble effect
   - Admins image gallery
   - Navbar mobile toggle
   ========================================= */

// ============================================
// 1. FLOATING SQUISHY LETTERS BACKGROUND
// ============================================
(function() {
  const canvas = document.getElementById('letterCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  window.addEventListener('resize', () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  });

  const CHARS = 'MSCCMapuaDiscordCommunity'.split('');
  const COLORS = [
    'rgba(255,107,0,0.18)',
    'rgba(224,85,0,0.14)',
    'rgba(255,140,0,0.16)',
    'rgba(255,154,64,0.12)',
    'rgba(255,255,255,0.06)',
    'rgba(179,67,0,0.20)',
  ];

  const COUNT = 55;
  let mouse = { x: -9999, y: -9999 };

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  class Letter {
    constructor() { this.reset(true); }

    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 40;
      this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
      this.baseSize = 14 + Math.random() * 22;
      this.size = this.baseSize;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(0.2 + Math.random() * 0.5);
      this.scaleX = 1;
      this.scaleY = 1;
      this.targetScaleX = 1;
      this.targetScaleY = 1;
      this.squishTimer = 0;
      this.opacity = 0.15 + Math.random() * 0.55;
      this.rotation = (Math.random() - 0.5) * 0.5;
      this.rotSpeed = (Math.random() - 0.5) * 0.008;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;

      // Cursor repulsion squish
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const RADIUS = 100;

      if (dist < RADIUS) {
        const force = (1 - dist / RADIUS);
        this.vx += (dx / dist) * force * 0.8;
        this.vy += (dy / dist) * force * 0.8;

        // squish towards cursor axis
        const angle = Math.atan2(dy, dx);
        const squishAmt = 1 + force * 0.6;
        this.targetScaleX = Math.abs(Math.cos(angle)) * squishAmt + (1 - Math.abs(Math.cos(angle)));
        this.targetScaleY = Math.abs(Math.sin(angle)) * squishAmt + (1 - Math.abs(Math.sin(angle)));
        this.squishTimer = 20;
      } else {
        if (this.squishTimer > 0) {
          this.squishTimer--;
        } else {
          this.targetScaleX = 1;
          this.targetScaleY = 1;
        }
      }

      // Dampen velocity
      this.vx *= 0.97;
      this.vy = this.vy * 0.97 - (dist < RADIUS ? 0 : 0.003);

      // Lerp scale
      this.scaleX += (this.targetScaleX - this.scaleX) * 0.12;
      this.scaleY += (this.targetScaleY - this.scaleY) * 0.12;

      // Wrap or reset
      if (this.x < -60) this.x = W + 40;
      if (this.x > W + 60) this.x = -40;
      if (this.y < -60) this.reset(false);
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scaleX, this.scaleY);
      ctx.font = `bold ${this.size}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fillText(this.char, 0, 0);
      ctx.restore();
    }
  }

  const letters = Array.from({ length: COUNT }, () => new Letter());

  function animate() {
    ctx.clearRect(0, 0, W, H);
    letters.forEach(l => { l.update(); l.draw(); });
    requestAnimationFrame(animate);
  }

  animate();
})();


// ============================================
// 2. TYPING BUBBLE EFFECT
// ============================================
(function() {
  const el = document.getElementById('typing-text');
  if (!el) return;

  const phrases = ['MSCC', 'Mapua Discord', 'Mapua Community'];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const typeSpeed = 90;
  const deleteSpeed = 55;
  const pauseDuration = 1800;

  function type() {
    const current = phrases[phraseIndex];

    if (!deleting) {
      el.textContent = current.slice(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(type, pauseDuration);
        return;
      }
      setTimeout(type, typeSpeed);
    } else {
      el.textContent = current.slice(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(type, 350);
        return;
      }
      setTimeout(type, deleteSpeed);
    }
  }

  type();
})();


// ============================================
// 3. ADMINS GALLERY
// ============================================
(function() {
  const track = document.getElementById('galleryTrack');
  const dotsContainer = document.getElementById('galleryDots');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  if (!track) return;

  const slides = track.querySelectorAll('.gallery-slide');
  let current = 0;
  let autoTimer;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function updateDots() {
    dotsContainer.querySelectorAll('.gallery-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
    resetAuto();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  // Auto-rotate every 3.5 seconds
  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 3500);
  }

  // Touch/swipe support
  let touchStartX = 0;
  track.parentElement.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  });
  track.parentElement.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  });

  resetAuto();
})();


// ============================================
// 4. NAVBAR MOBILE TOGGLE
// ============================================
(function() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close when a link is clicked
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
})();


// ============================================
// 5. SCROLL NAVBAR SHADOW BOOST
// ============================================
(function() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20
      ? '0 4px 24px rgba(255,107,0,0.15)'
      : '0 2px 16px rgba(0,0,0,0.3)';
  });
})();
