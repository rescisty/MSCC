/*
  ============================================================
  MSCC — script.js — v4
  ============================================================
  Sections:
  00. Page Load Bar           — top progress bar while page loads
  01. Lenis Smooth Scroll     — weighted, inertial scroll feel
  02. Aurora Canvas           — animated colour orbs in the hero
  03. Grain Overlay           — subtle film-grain texture
  04. Custom Cursor           — dot + ring that replaces OS cursor
  05. Cursor Light Effect     — faint glow that follows the cursor
  06. Magnetic Buttons        — buttons drift toward the cursor
  07. Page Transition Overlay — orange wipe between pages
  08. Dynamic Island Nav      — collapses to search bubble on scroll
  09. Morphing Hero Word      — cycles Connect / Thrive / Grow
  10. 3D Carousel             — about section card stack
  11. Scroll Reveal           — fade+slide in on scroll
  12. SplitType Letter Reveal — character-by-character heading animation
  13. GSAP ScrollTrigger      — scroll-linked animations
  14. Scroll Progress Bar     — horizontal fill bar at the top
  15. Stats Counter           — numbers count up on scroll
  16. Member Track Drag       — draggable horizontal scroll
  17. Active Nav Highlighting — highlights current section in nav
  ============================================================
*/


/* ============================================================
   00. PAGE LOAD BAR
   ============================================================
   Animates #load-bar-fill from 0% to 100% width as the page
   loads. When done, the whole bar fades out.

   We fake a "progress" using a timer because browsers don't
   expose real loading progress easily. The bar races to 90%
   quickly, then waits for the real load event to finish to 100%.
   ============================================================ */

const loadBarFill = document.getElementById('load-bar-fill');
const loadBar     = document.getElementById('load-bar');

if (loadBarFill && loadBar) {
  let loadProgress = 0;

  /* Animate from 0 to ~88% while page is still loading */
  const loadInterval = setInterval(() => {
    /* Slow down as it approaches 88% — makes it feel realistic */
    loadProgress += (88 - loadProgress) * 0.08;
    loadBarFill.style.width = loadProgress + '%';
    if (loadProgress > 87.5) clearInterval(loadInterval);
  }, 50);

  /* When page is fully loaded, jump to 100% then fade out */
  window.addEventListener('load', () => {
    clearInterval(loadInterval);
    loadBarFill.style.width = '100%';

    /* After the fill completes (300ms), fade the bar out */
    setTimeout(() => {
      loadBar.style.transition = 'opacity 0.5s ease';
      loadBar.style.opacity = '0';
      /* Remove from DOM after the fade-out so it can't be interacted with */
      setTimeout(() => loadBar.remove(), 500);
    }, 300);
  });
}


/* ============================================================
   01. LENIS SMOOTH SCROLL
   ============================================================
   Lenis replaces the browser's native scroll with its own
   physics simulation, giving that buttery weighted feel.

   KEY FIX from v3: autoRaf is now FALSE.
   We manually tick Lenis via gsap.ticker instead.
   Having autoRaf:true AND gsap.ticker both calling lenis.raf()
   was making it run twice per frame = jank/lag.

   Settings:
   - lerp: 0.08       → lower = heavier/smoother scroll
   - duration: 1.2    → how long inertia lasts in seconds
   - smoothWheel:true → applies to mouse wheel events
   ============================================================ */

const lenis = new Lenis({
  autoRaf:         false,   /* WE drive the animation frame, not Lenis */
  lerp:            0.08,
  duration:        1.2,
  easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel:     true,
  touchMultiplier: 1.5,
});

/* Tell GSAP's ScrollTrigger to update whenever Lenis scrolls */
gsap.registerPlugin(ScrollTrigger);           /* Register FIRST — before anything uses it */
lenis.on('scroll', ScrollTrigger.update);

/* Manually tick Lenis on every GSAP animation frame */
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

/* Make in-page anchor links (href="#section") use Lenis for smooth scroll */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    }
  });
});


/* ============================================================
   04. CUSTOM CURSOR
   ============================================================
   Two elements replace the OS cursor:
   - #cursor-dot  : 6px dot, snaps exactly to cursor position
   - #cursor-ring : 36px ring, follows with lerp lag (feels weighted)

   Lerp = linear interpolation. We move the ring 12% of the
   remaining distance to the cursor each frame — this creates
   the trailing, weighted feel.

   Only active on desktop (pointer: fine = mouse/trackpad).
   ============================================================ */

const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

if (cursorDot && cursorRing && window.matchMedia('(pointer: fine)').matches) {

  let mouseX = 0, mouseY = 0;   /* Current mouse position */
  let ringX  = 0, ringY  = 0;   /* Ring's lerped (lagging) position */

  /* Update mouse position on every move */
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    /* Dot snaps directly to cursor — no delay */
    cursorDot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
  });

  /* Animate the ring — lerps toward the dot position every frame */
  function animateCursor() {
    ringX += (mouseX - ringX) * 0.12;   /* 0.12 = lag factor */
    ringY += (mouseY - ringY) * 0.12;
    /* calc(${x}px - 50%) centres the ring on the cursor point */
    cursorRing.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* Ring grows when hovering a clickable element */
  const hoverTargets = 'a, button, .btn-primary, .btn-secondary, .magnetic, .admin-card, .carousel-card, .showcase-frame, .member-card';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('ring-hover'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('ring-hover'));
  });

  /* Fade out when cursor leaves the window, fade in when it returns */
  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity  = '0';
    cursorRing.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity  = '1';
    cursorRing.style.opacity = '1';
  });
}


/* ============================================================
   05. CURSOR LIGHT EFFECT
   ============================================================
   Sets CSS custom properties --cursor-x and --cursor-y on the
   root element, which style.css uses to position the body::before
   radial glow that follows the cursor like a faint torch.
   ============================================================ */

document.addEventListener('mousemove', e => {
  document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
  document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
});


/* ============================================================
   06. MAGNETIC BUTTONS
   ============================================================
   Elements with the class .magnetic slowly drift toward the
   cursor as it moves over them, then snap back on mouse leave.
   The "strength" value controls how far they move (0–1).
   ============================================================ */

document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', function(e) {
    const rect    = this.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width  / 2);
    const offsetY = e.clientY - (rect.top  + rect.height / 2);
    const strength = 0.35;   /* 35% of the cursor offset */
    this.style.transform  = `translate(${offsetX * strength}px, ${offsetY * strength}px)`;
    this.style.transition = 'transform 0.1s ease';
  });

  el.addEventListener('mouseleave', function() {
    /* Spring back to resting position */
    this.style.transform  = 'translate(0, 0)';
    this.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });
});


/* ============================================================
   07. PAGE TRANSITION OVERLAY
   ============================================================
   When clicking a .nav-transition-link:
   1. JS adds .is-leaving to #page-transition (orange wipes in)
   2. After 450ms, browser navigates to the new URL
   3. New page loads with .is-entering (orange wipes out)
   This makes page navigation feel like a smooth SPA.
   ============================================================ */

const pageTransition = document.getElementById('page-transition');

/* On page load: play the "entering" animation (overlay wipes out) */
if (pageTransition) {
  pageTransition.classList.add('is-entering');
  setTimeout(() => pageTransition.classList.remove('is-entering'), 700);
}

/* Intercept all .nav-transition-link clicks */
document.querySelectorAll('.nav-transition-link').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href.startsWith('#')) return;   /* Skip in-page anchors */

    e.preventDefault();
    if (pageTransition) pageTransition.classList.add('is-leaving');

    /* Navigate after the wipe animation finishes */
    setTimeout(() => { window.location.href = href; }, 450);
  });
});


/* ============================================================
   08. DYNAMIC ISLAND NAVIGATION
   ============================================================
   Collapses to a small search bubble after scrolling 60px.
   Placeholder text rotates every 2.5s while collapsed.
   ============================================================ */

const navbar         = document.querySelector('#navbar');
const navSearchInput = document.querySelector('#navSearchInput');

const searchPlaceholders = [
  'Mapua Server',
  'MSCC Events',
  'Study Resources',
  'Art Showcase',
  'Community Links',
  'Meet the Admins',
];

let currentPlaceholderIndex = 0;
let placeholderInterval     = null;

/* Fades placeholder out, swaps text, fades back in */
function rotatePlaceholder() {
  if (!navSearchInput) return;
  navSearchInput.style.opacity = '0';
  setTimeout(() => {
    currentPlaceholderIndex = (currentPlaceholderIndex + 1) % searchPlaceholders.length;
    navSearchInput.placeholder = searchPlaceholders[currentPlaceholderIndex];
    navSearchInput.style.opacity = '1';
  }, 300);
}

/* Called on scroll — adds/removes .nav-scrolled class */
function handleNavScroll() {
  const isScrolled = window.scrollY > 60;
  if (isScrolled) {
    navbar.classList.add('nav-scrolled');
    if (!placeholderInterval) placeholderInterval = setInterval(rotatePlaceholder, 2500);
  } else {
    navbar.classList.remove('nav-scrolled');
    if (placeholderInterval) { clearInterval(placeholderInterval); placeholderInterval = null; }
    currentPlaceholderIndex = 0;
    if (navSearchInput) navSearchInput.placeholder = searchPlaceholders[0];
  }
}

window.addEventListener('scroll', handleNavScroll, { passive: true });
lenis.on('scroll', handleNavScroll);
handleNavScroll();   /* Run once immediately on load */

/* Let users type in the search input when focused */
if (navSearchInput) {
  navSearchInput.addEventListener('focus', () => {
    navSearchInput.removeAttribute('readonly');
    navSearchInput.placeholder = '';
  });
  navSearchInput.addEventListener('blur', () => {
    navSearchInput.setAttribute('readonly', true);
    navSearchInput.value = '';
    navSearchInput.placeholder = searchPlaceholders[currentPlaceholderIndex];
  });
}


/* ============================================================
   09. MORPHING HERO WORD
   ============================================================
   Cycles through ['Connect.', 'Thrive.', 'Grow.'] with a
   vertical slot-machine slide animation every 2.8 seconds.

   How the animation works:
   1. Exit: current word slides UP out of view (translateY(-110%))
   2. Swap: text content is changed while off-screen
   3. Snap: new word is positioned BELOW (translateY(110%))
   4. Enter: new word slides UP into view (translateY(0))
   ============================================================ */

const morphWord  = document.getElementById('morphWord');
const morphWords = ['Connect.', 'Thrive.', 'Grow.'];
let morphIndex   = 0;

/* Set the wrapper height to match the word's rendered height.
   This clips the overflow so only one word is visible at a time. */
function setMorphWrapperHeight() {
  const wrapper = document.querySelector('.hero-morph-wrapper');
  if (wrapper && morphWord) wrapper.style.height = morphWord.offsetHeight + 'px';
}

function morphToNextWord() {
  if (!morphWord) return;

  /* Step 1: slide current word upward out of view */
  morphWord.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.4s ease';
  morphWord.style.transform  = 'translateY(-110%)';
  morphWord.style.opacity    = '0';

  setTimeout(() => {
    /* Step 2: change the text while it's invisible */
    morphIndex = (morphIndex + 1) % morphWords.length;
    morphWord.textContent = morphWords[morphIndex];

    /* Step 3: snap to below with no transition (instant repositioning) */
    morphWord.style.transition = 'none';
    morphWord.style.transform  = 'translateY(110%)';
    morphWord.style.opacity    = '0';

    /* Double rAF (requestAnimationFrame) ensures the browser has registered
       the "snapped below" position before we start the enter animation.
       Without this, the browser might skip the transition entirely. */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      /* Step 4: animate the new word up into view */
      morphWord.style.transition = 'transform 0.5s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.4s ease';
      morphWord.style.transform  = 'translateY(0)';
      morphWord.style.opacity    = '1';
    }));
  }, 500);   /* Wait for exit animation to finish (500ms) */
}

if (morphWord) {
  setMorphWrapperHeight();
  window.addEventListener('resize', setMorphWrapperHeight);
  setInterval(morphToNextWord, 2800);   /* Swap words every 2.8 seconds */
}


/* ============================================================
   10. 3D CAROUSEL
   ============================================================
   Cycles 4 cards through CSS position classes:
   card-active / card-next / card-prev / card-behind
   Each class has a different 3D CSS transform applied.

   Auto-advances every 3 seconds.
   Supports: dot clicks, card clicks, touch swipe, pause on hover.
   ============================================================ */

const carouselCards = Array.from(document.querySelectorAll('.carousel-card'));
const carouselDots  = Array.from(document.querySelectorAll('.dot'));
let   activeCardIndex = 0;
const cardPositionClasses = ['card-active', 'card-next', 'card-prev', 'card-behind'];

/* Rotate cards: assign position classes based on offset from active */
function goToCard(targetIndex) {
  const total = carouselCards.length;
  carouselCards.forEach((card, i) => {
    card.classList.remove('card-active', 'card-next', 'card-prev', 'card-behind');
    const offset = (i - targetIndex + total) % total;
    card.classList.add(cardPositionClasses[offset]);
  });
  carouselDots.forEach((dot, i) => dot.classList.toggle('dot-active', i === targetIndex));
  activeCardIndex = targetIndex;
}

function nextCard() { goToCard((activeCardIndex + 1) % carouselCards.length); }

let carouselTimer = setInterval(nextCard, 3000);

/* Dot click: jump to specific card */
carouselDots.forEach(dot => {
  dot.addEventListener('click', () => {
    goToCard(parseInt(dot.dataset.target));
    clearInterval(carouselTimer);
    carouselTimer = setInterval(nextCard, 3000);
  });
});

/* Card click: advance to next */
carouselCards.forEach(card => {
  card.addEventListener('click', () => {
    nextCard();
    clearInterval(carouselTimer);
    carouselTimer = setInterval(nextCard, 3000);
  });
});

const carouselStage = document.querySelector('#carouselStage');
if (carouselStage) {
  /* Pause auto-advance when hovering */
  carouselStage.addEventListener('mouseenter', () => clearInterval(carouselTimer));
  carouselStage.addEventListener('mouseleave', () => { carouselTimer = setInterval(nextCard, 3000); });

  /* Touch swipe support */
  let touchStartX = 0;
  carouselStage.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  carouselStage.addEventListener('touchend', e => {
    const dist = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(dist) > 40) {
      dist > 0 ? nextCard() : goToCard((activeCardIndex - 1 + carouselCards.length) % carouselCards.length);
      clearInterval(carouselTimer);
      carouselTimer = setInterval(nextCard, 3000);
    }
  }, { passive: true });
}

if (carouselCards.length) goToCard(0);   /* Initialise the carousel */


/* ============================================================
   11. SCROLL REVEAL (IntersectionObserver)
   ============================================================
   Watches all .reveal-up / .reveal-left / .reveal-right elements.
   When they scroll into the viewport, the class .revealed is
   added — CSS transitions handle the actual fade+slide animation.
   Each element animates only once (unobserved after reveal).
   ============================================================ */

const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);   /* One-time only */
    }
  });
}, { threshold: 0.12 });   /* Trigger when 12% of element is visible */

revealElements.forEach(el => revealObserver.observe(el));


/* ============================================================
   12. SPLITTYPE CHARACTER REVEAL
   ============================================================
   SplitType breaks a heading into individual <span> characters.
   GSAP + ScrollTrigger then staggers each character in from below.
   Result: letters appear one-by-one as the heading enters view.
   ============================================================ */

if (typeof SplitType !== 'undefined') {
  /* Wait for fonts to load so SplitType measures characters correctly */
  document.fonts.ready.then(() => {
    document.querySelectorAll('.split-text').forEach(el => {
      /* Split the text into individual character spans */
      const split = new SplitType(el, { types: 'chars' });

      /* Stagger each character in from 40px below */
      gsap.from(split.chars, {
        scrollTrigger: {
          trigger: el,
          start:   'top 85%',           /* Start when 85% from top of viewport */
          toggleActions: 'play none none none',   /* Play once, don't reverse */
        },
        opacity:  0,
        y:        40,
        duration: 0.6,
        ease:     'power3.out',
        stagger:  0.025,   /* 25ms gap between each character */
      });
    });
  });
}


/* ============================================================
   13. GSAP SCROLLTRIGGER ANIMATIONS
   ============================================================
   Additional scroll-linked animations that run alongside the
   IntersectionObserver reveals above. These use GSAP's more
   powerful API for bounce, scale, and stagger effects.
   ============================================================ */

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

  /* Stats numbers: scale in with a bounce */
  gsap.utils.toArray('.stat-number').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 80%' },
      scale:    0.7,
      opacity:  0,
      duration: 0.7,
      ease:     'back.out(1.7)',
    });
  });

  /* About features: staggered slide-up */
  const features = gsap.utils.toArray('.about-feature');
  if (features.length) {
    gsap.from(features, {
      scrollTrigger: { trigger: features[0], start: 'top 80%' },
      y:        30,
      opacity:  0,
      duration: 0.6,
      ease:     'power2.out',
      stagger:  0.15,
    });
  }

  /* Admin cards: stagger scale-in */
  const adminCards = gsap.utils.toArray('.admin-card');
  if (adminCards.length) {
    gsap.from(adminCards, {
      scrollTrigger: { trigger: '.admins-grid', start: 'top 75%' },
      scale:    0.94,
      opacity:  0,
      duration: 0.5,
      ease:     'power2.out',
      stagger:  0.06,
    });
  }

  /* Bio cards: slide up stagger */
  const bioCards = gsap.utils.toArray('.bio-card');
  if (bioCards.length) {
    gsap.from(bioCards, {
      scrollTrigger: { trigger: '.bio-content', start: 'top 80%' },
      y:        20,
      opacity:  0,
      duration: 0.5,
      ease:     'power2.out',
      stagger:  0.08,
    });
  }

  /* Showcase frames: stagger scale-in from below */
  const showcaseFrames = gsap.utils.toArray('.showcase-frame');
  if (showcaseFrames.length) {
    gsap.from(showcaseFrames, {
      scrollTrigger: { trigger: '.showcase-grid', start: 'top 80%' },
      scale:    0.92,
      opacity:  0,
      duration: 0.55,
      ease:     'power2.out',
      stagger:  0.07,
    });
  }

  /* Member cards: slide in from the right as the section enters */
  const memberCards = gsap.utils.toArray('.member-card');
  if (memberCards.length) {
    gsap.from(memberCards, {
      scrollTrigger: { trigger: '.member-track', start: 'top 85%' },
      x:        40,
      opacity:  0,
      duration: 0.5,
      ease:     'power2.out',
      stagger:  0.06,
    });
  }
}


/* ============================================================
   14. SCROLL PROGRESS BAR
   ============================================================
   Updates #scroll-progress-fill width (0% to 100%) as the
   user scrolls from the top of the page to the bottom.
   Uses Lenis's scroll event which gives us scroll + limit values.
   ============================================================ */

const progressFill = document.getElementById('scroll-progress-fill');

if (progressFill) {
  lenis.on('scroll', ({ scroll, limit }) => {
    /* progress is 0 at the top and 1 at the very bottom */
    const progress = limit > 0 ? scroll / limit : 0;
    progressFill.style.width = (progress * 100) + '%';
  });
}


/* ============================================================
   15. STATS COUNTER
   ============================================================
   When a .counter element scrolls into view, it counts from 0
   to its data-target value with an easeOutQuart animation.
   data-suffix is appended after the number (e.g. "+", " yrs").
   ============================================================ */

/* Easing function: starts fast, decelerates smoothly toward the end */
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function animateCounter(el) {
  const target   = parseInt(el.dataset.target);
  const suffix   = el.dataset.suffix || '';
  const duration = 1800;   /* Total animation time in milliseconds */
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.round(easeOutQuart(progress) * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);   /* Only count once */
    }
  });
}, { threshold: 0.5 });   /* Trigger when 50% of the element is visible */

document.querySelectorAll('.counter').forEach(c => counterObserver.observe(c));


/* ============================================================
   16. MEMBER TRACK — DRAGGABLE SCROLL
   ============================================================
   Makes the horizontal member card row draggable with a mouse.
   On desktop, click and drag left/right to scroll the track.
   On mobile/touch, native touch-scroll handles it automatically.
   ============================================================ */

const memberTrack = document.getElementById('memberTrack');

if (memberTrack) {
  let isDragging   = false;
  let startX       = 0;    /* Mouse X position when drag started */
  let scrollLeft   = 0;    /* scrollLeft value when drag started */

  memberTrack.addEventListener('mousedown', e => {
    isDragging = true;
    memberTrack.classList.add('is-dragging');
    startX     = e.pageX - memberTrack.offsetLeft;
    scrollLeft = memberTrack.scrollLeft;
  });

  /* Stop dragging when mouse is released anywhere on the page */
  document.addEventListener('mouseup', () => {
    isDragging = false;
    memberTrack.classList.remove('is-dragging');
  });

  memberTrack.addEventListener('mousemove', e => {
    if (!isDragging) return;
    e.preventDefault();
    const x    = e.pageX - memberTrack.offsetLeft;
    const walk = (x - startX) * 1.5;    /* 1.5 = scroll speed multiplier */
    memberTrack.scrollLeft = scrollLeft - walk;
  });

  /* Prevent clicks from firing when releasing from a drag */
  memberTrack.addEventListener('click', e => {
    if (Math.abs(memberTrack.scrollLeft - scrollLeft) > 5) {
      e.preventDefault();
    }
  });
}


/* ============================================================
   17. ACTIVE NAV LINK HIGHLIGHTING
   ============================================================
   Highlights the nav link for whichever section is currently
   in the viewport. Uses IntersectionObserver with a rootMargin
   that only triggers when a section is near the middle of the
   screen (not just barely visible at the edge).
   ============================================================ */

const sections    = document.querySelectorAll('section[id]');
const navLinkList = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      /* Reset all links to default colour */
      navLinkList.forEach(link => link.style.color = '');
      /* Highlight the link matching the visible section */
      const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.style.color = 'var(--orange-primary)';
    }
  });
}, {
  /* -30% top + -60% bottom = only fire when section is in the middle 10% of viewport */
  rootMargin: '-30% 0px -60% 0px',
  threshold: 0,
});

sections.forEach(s => navObserver.observe(s));
