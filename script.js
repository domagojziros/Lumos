
'use strict';

/* ================================================================
   1. UTILITY HELPERS
   ================================================================ */

/**
 * querySelector shorthand with null-guard
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element|null}
 */
const qs  = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * querySelectorAll shorthand – returns real Array
 * @param {string} selector
 * @param {Element|Document} [ctx=document]
 * @returns {Element[]}
 */
const qsa = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Clamp a number between min and max
 */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Linear interpolate between a and b by t
 */
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Debounce – delays fn execution until after `delay` ms of silence
 */
const debounce = (fn, delay = 150) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle – executes fn at most once every `limit` ms
 */
const throttle = (fn, limit = 100) => {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if the user prefers reduced motion
 */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Run fn after DOM is ready
 */
const onReady = (fn) => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn, { once: true });
};


/* ================================================================
   2. NAVIGATION
   ================================================================ */

const initNavigation = () => {
  const nav       = qs('.nav');
  const toggle    = qs('.nav__toggle');
  const mobileNav = qs('.nav__mobile');
  const mobileLinks = qsa('.nav__mobile-link');
  const closeBtn  = qs('.nav__mobile-close');

  if (!nav) return;

  /* ---- Scroll-aware nav state ---- */
  let lastY   = 0;
  let ticking = false;

  const updateNav = () => {
    const y = window.scrollY;

    // Add scrolled class after 60px for stronger background
    if (y > 60) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }

    lastY   = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  /* ---- Mobile menu ---- */
  if (!toggle || !mobileNav) return;

  const openMenu = () => {
    mobileNav.classList.add('nav__mobile--open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first link
    const firstLink = qs('a, button', mobileNav);
    if (firstLink) firstLink.focus();
  };

  const closeMenu = () => {
    mobileNav.classList.remove('nav__mobile--open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('nav__mobile--open');
    isOpen ? closeMenu() : openMenu();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on backdrop click (outside menu)
  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('nav__mobile--open')) {
      closeMenu();
    }
  });

  /* ---- Focus trap for mobile nav ---- */
  mobileNav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = qsa('a, button, [tabindex]:not([tabindex="-1"])', mobileNav)
      .filter(el => !el.disabled);
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
};


/* ================================================================
   3. SCROLL-REVEAL ANIMATIONS
   ================================================================ */

const initScrollReveal = () => {
  if (prefersReducedMotion()) {
    // Make everything visible immediately
    qsa('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Unobserve after reveal to save resources
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  qsa('.reveal').forEach(el => observer.observe(el));
};


/* ================================================================
   4. HERO ANIMATIONS
   ================================================================ */

const initHeroAnimations = () => {
  if (prefersReducedMotion()) return;

  const badge    = qs('.hero__badge');
  const lines    = qsa('.hero__heading-line');
  const sub      = qs('.hero__sub');
  const cta      = qs('.hero__cta');
  const trust    = qs('.hero__trust');
  const visual   = qs('.hero__visual');
  const scrollCue = qs('.scroll-cue');

  // Staggered entrance using CSS animation classes already defined
  // This JS confirms elements are ready and triggers the CSS animations
  // by removing the 'will-animate' placeholder state if needed.
  // The CSS handles the actual keyframes; we just ensure timing is right.

  const items = [badge, ...lines, sub, cta, trust, visual, scrollCue];
  items.forEach(el => {
    if (el) el.style.willChange = 'opacity, transform';
  });

  // Clean up will-change after animations complete
  const cleanup = setTimeout(() => {
    items.forEach(el => {
      if (el) el.style.willChange = 'auto';
    });
  }, 2500);

  // Store for potential cleanup
  return () => clearTimeout(cleanup);
};

/* ---- Subtle hero background parallax ---- */
const initHeroParallax = () => {
  if (prefersReducedMotion()) return;

  const hero     = qs('.hero');
  const gradient = qs('.hero__gradient');
  const noise    = qs('.hero__noise');

  if (!hero || !gradient) return;

  let rafId = null;
  let targetY = 0;
  let currentY = 0;

  const handleScroll = () => {
    targetY = window.scrollY;
    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  };


  const animate = () => {
  currentY = lerp(currentY, targetY, 0.08);
  const shift = currentY * 0.25;

  // Use translate3d to ensure GPU compositing
  if (gradient) gradient.style.transform = `translate3d(0, ${shift}px, 0)`;
  if (noise)    noise.style.transform    = `translate3d(0, ${shift * 0.5}px, 0)`;

    // Stop animating when close enough to avoid constant repaints
    if (Math.abs(currentY - targetY) > 0.5) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
};


/* ================================================================
   5. ANIMATED COUNTERS (Stats Section)
   ================================================================ */

const initCounters = () => {
  const statsSection = qs('.stats');
  if (!statsSection) return;

  const statNumbers = qsa('.stat__number', statsSection);
  if (!statNumbers.length) return;

  let animated = false;

  /**
   * Animate a single counter from 0 to `target`
   * @param {Element} el
   * @param {number} target
   * @param {string} suffix
   * @param {number} duration  ms
   */
  const animateCounter = (el, target, suffix, duration = 1800) => {
    if (prefersReducedMotion()) {
      el.textContent = target + suffix;
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    // Easing: ease-out cubic
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased    = ease(progress);
      const current  = Math.round(lerp(startValue, target, eased));

      el.textContent = current + suffix;
      el.setAttribute('aria-label', `${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  /**
   * Parse stat number element to extract numeric value + suffix
   * e.g. "95%" → { value: 95, suffix: "%" }
   *      "5+"  → { value: 5, suffix: "+" }
   *      "200" → { value: 200, suffix: "" }
   */
  const parseStatEl = (el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d+)([^\d]*)$/);
    if (!match) return { value: 0, suffix: '' };
    return { value: parseInt(match[1], 10), suffix: match[2] || '' };
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          observer.disconnect();

          statNumbers.forEach((el, i) => {
            const { value, suffix } = parseStatEl(el);
            // Stagger each counter
            setTimeout(() => {
              animateCounter(el, value, suffix, 1600 + i * 100);
            }, i * 120);
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(statsSection);
};


/* ================================================================
   6. SERVICE CARD INTERACTIONS
   ================================================================ */

const initServiceCards = () => {
  const cards = qsa('.service-card');
  if (!cards.length || prefersReducedMotion()) return;

  cards.forEach(card => {
    let rect = card.getBoundingClientRect();
    let rafId = null;
    let lastX = 0;
    let lastY = 0;

    const update = () => {
      rafId = null;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (lastX - cx) / (rect.width / 2);
      const dy = (lastY - cy) / (rect.height / 2);

      const tiltX = clamp(-dy * 4, -4, 4);
      const tiltY = clamp(dx * 4, -4, 4);

      // Apply transform (GPU-friendly)
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    };

    const onPointerMove = (e) => {
      // Ignore touch input for tilt on mobile
      if (e.pointerType === 'touch') return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    const onPointerEnter = (e) => {
      // Recompute rect on enter
      rect = card.getBoundingClientRect();
      card.style.willChange = 'transform';
      card.addEventListener('pointermove', onPointerMove);
    };

    const onPointerLeave = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      card.style.transform = '';
      card.style.willChange = 'auto';
      card.removeEventListener('pointermove', onPointerMove);
    };

    card.addEventListener('pointerenter', onPointerEnter);
    card.addEventListener('pointerleave', onPointerLeave);

    // Recompute bounding rect on resize (throttled)
    const recompute = throttle(() => { rect = card.getBoundingClientRect(); }, 200);
    window.addEventListener('resize', recompute, { passive: true });
  });
};


/* ================================================================
   7. SMOOTH SCROLL FOR ANCHOR LINKS
   ================================================================ */

const initSmoothScroll = () => {
  const navHeight = qs('.nav')?.offsetHeight ?? 80;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = qs(targetId);
    if (!target) return;

    e.preventDefault();

    const y = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

    window.scrollTo({ top: y, behavior: 'smooth' });

    // Update URL without triggering scroll
    if (history.pushState) {
      history.pushState(null, null, targetId);
    }

    // Move focus to target for accessibility
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  });
};


/* ================================================================
   8. FOOTER – CURRENT YEAR
   ================================================================ */

const initFooterYear = () => {
  const yearEl = qs('#currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};


/* ================================================================
   9. LAZY-LOAD MAP IFRAME
   ================================================================ */

const initLazyMap = () => {
  const mapFrame = qs('.map-frame iframe');
  if (!mapFrame) return;

  // If IntersectionObserver isn't available, load immediately
  if (!('IntersectionObserver' in window)) {
    return; // src already set in HTML
  }

  // Support both patterns: if markup provided data-src keep it; otherwise capture src
  const realSrc = mapFrame.getAttribute('data-src') || mapFrame.getAttribute('src');
  if (!realSrc) return;

  // If src is present in markup, move it to data-src so browser doesn't eager-load.
  if (mapFrame.getAttribute('src')) {
    mapFrame.setAttribute('data-src', realSrc);
    mapFrame.removeAttribute('src');
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const src = entry.target.getAttribute('data-src');
          if (src) entry.target.setAttribute('src', src);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '200px 0px', threshold: 0 }
  );

  observer.observe(mapFrame);
};


/* ================================================================
   10. ACTIVE NAV LINK (section spy)
   ================================================================ */

const initNavSpy = () => {
  const sections  = qsa('section[id]');
  const navLinks  = qsa('.nav__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const setActive = (id) => {
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('nav__link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0,
    }
  );

  sections.forEach(s => observer.observe(s));
};


/* ================================================================
   11. SERVICE TABS / FILTER (if applicable)
   ================================================================ */

const initServiceFilter = () => {
  const filterBtns = qsa('[data-filter]');
  if (!filterBtns.length) return;

  const cards = qsa('.service-card[data-category]');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });

      // Show/hide cards
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const show = filter === 'all' || cat === filter;
        card.style.display = show ? '' : 'none';
        card.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
    });
  });
};


/* ================================================================
   12. TESTIMONIALS / RESULTS SECTION FADE
   ================================================================ */

const initTestimonials = () => {
  const items = qsa('.testimonial-item');
  if (!items.length || prefersReducedMotion()) return;

  // Already handled by scroll-reveal; just ensure accessibility
  items.forEach(item => {
    item.setAttribute('tabindex', '0');
  });
};


/* ================================================================
   13. CONTACT CARD RIPPLE
   ================================================================ */

const initContactCards = () => {
  const cards = qsa('.contact__card');
  if (!cards.length || prefersReducedMotion()) return;

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top:  ${y}px;
        width: 0;
        height: 0;
        background: rgba(196, 172, 135, 0.18);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: rippleAnim 0.55s ease-out forwards;
        pointer-events: none;
      `;

      card.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Inject ripple keyframes once
  if (!qs('#lumos-ripple-style')) {
    const style = document.createElement('style');
    style.id = 'lumos-ripple-style';
    style.textContent = `
      @keyframes rippleAnim {
        to {
          width: 300px;
          height: 300px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};


/* ================================================================
   14. LOGO / BRAND ANIMATION (wand sparkle on hover)
   ================================================================ */

const initLogoSparkle = () => {
  const logos = qsa('.nav__logo, .footer__logo');
  if (!logos.length || prefersReducedMotion()) return;

  logos.forEach(logo => {
    logo.addEventListener('mouseenter', () => {
      const svgStar = qs('polygon, circle[fill="#C4AC87"]', logo);
      if (svgStar) {
        svgStar.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        svgStar.style.transformOrigin = 'center';
        svgStar.style.transform = 'rotate(20deg) scale(1.1)';
      }
    });

    logo.addEventListener('mouseleave', () => {
      const svgStar = qs('polygon, circle[fill="#C4AC87"]', logo);
      if (svgStar) {
        svgStar.style.transform = '';
      }
    });
  });
};


/* ================================================================
   15. SCROLL-TO-TOP (scroll cue button)
   ================================================================ */

const initScrollCue = () => {
  const cue = qs('.scroll-cue');
  if (!cue) return;

  cue.addEventListener('click', (e) => {
    e.preventDefault();
    const target = qs('#o-nama') || qs('section:first-of-type');
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
};


/* ================================================================
   16. PERFORMANCE: IMAGE LOADING OBSERVER
   ================================================================ */

const initLazyImages = () => {
  const imgs = qsa('img[loading="lazy"]');
  if (!imgs.length) return;

  // Inject scoped fade-in style — ONLY for img[loading="lazy"],
  // ne globalno na sve img jer to interferira s .reveal opacity animacijama
  if (!qs('#lumos-img-style')) {
    const style = document.createElement('style');
    style.id = 'lumos-img-style';
    style.textContent = `
      img[loading="lazy"]:not(.img--loaded):not(.img--error) { opacity: 0; transition: opacity 0.4s ease; }
      img[loading="lazy"].img--loaded { opacity: 1; }
      img[loading="lazy"].img--error  { opacity: 0.3; }
    `;
    document.head.appendChild(style);
  }

  imgs.forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('img--loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('img--loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('img--error'), { once: true });
    }
  });
};


/* ================================================================
   17. WHY-LUMOS CARD STAGGER (enhanced)
   ================================================================ */

const initWhyCards = () => {
  const whyGrid = qs('.why__grid');
  if (!whyGrid || prefersReducedMotion()) return;

  const cards = qsa('.why__card', whyGrid);

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.add('in-view');
          }, i * 80);
        });
        observer.disconnect();
      }
    },
    { threshold: 0.15 }
  );

  observer.observe(whyGrid);
};


/* ================================================================
   18. ABOUT PILLARS STAGGER
   ================================================================ */

const initAboutPillars = () => {
  const pillarsGrid = qs('.about__pillars');
  if (!pillarsGrid || prefersReducedMotion()) return;

  const pillars = qsa('.about__pillar', pillarsGrid);

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        pillars.forEach((pillar, i) => {
          setTimeout(() => {
            pillar.classList.add('in-view');
          }, i * 100);
        });
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );

  observer.observe(pillarsGrid);
};


/* ================================================================
   19. ACCESSIBILITY: ANNOUNCE PAGE SECTIONS
   ================================================================ */

const initAriaLiveRegion = () => {
  // Polite announcements for screen readers
  let liveRegion = qs('#lumos-live');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'lumos-live';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    // Visually hidden
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    `;
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
};


/* ================================================================
   20. SECURITY: EXTERNAL LINK PROTECTION
   ================================================================ */

const initExternalLinks = () => {
  qsa('a[target="_blank"]').forEach(link => {
    // Ensure rel="noopener noreferrer" on all external links
    const rel = link.getAttribute('rel') || '';
    if (!rel.includes('noopener')) {
      link.setAttribute('rel', (rel + ' noopener noreferrer').trim());
    }
    // Add accessible label if missing
    if (!link.getAttribute('aria-label')) {
      const text = link.textContent.trim();
      if (text) link.setAttribute('aria-label', `${text} (otvara se u novoj kartici)`);
    }
  });
};


/* ================================================================
   21. HERO ORBIT ANIMATION PAUSE ON HOVER
   ================================================================ */

const initOrbitPause = () => {
  const orbit = qs('.hero__orbit');
  if (!orbit || prefersReducedMotion()) return;

  // Rings use the class `hero__orbit-ring`
  const rings = qsa('.hero__orbit-ring', orbit);

  orbit.addEventListener('mouseenter', () => {
    rings.forEach(ring => {
      ring.style.animationPlayState = 'paused';
    });
  });

  orbit.addEventListener('mouseleave', () => {
    rings.forEach(ring => {
      ring.style.animationPlayState = 'running';
    });
  });
};


/* ================================================================
   22. RESPONSIVE: RESIZE HANDLER
   ================================================================ */

const initResizeHandler = () => {
  const handleResize = debounce(() => {
    // Re-compute nav height for smooth scroll offset
    const nav = qs('.nav');
    if (nav) {
      document.documentElement.style.setProperty(
        '--nav-height',
        `${nav.offsetHeight}px`
      );
    }
  }, 200);

  window.addEventListener('resize', handleResize, { passive: true });
  handleResize(); // run once on init
};


/* ================================================================
   INIT — Bootstrap all modules
   ================================================================ */

const init = () => {
  initFooterYear();
  initNavigation();
  initScrollReveal();
  initHeroAnimations();
  initHeroParallax();
  initSmoothScroll();
  initNavSpy();
  initCounters();
  initServiceCards();
  initServiceFilter();
  initTestimonials();
  initContactCards();
  initLogoSparkle();
  initScrollCue();
  initLazyImages();
  initLazyMap();
  initWhyCards();
  initAboutPillars();
  initAriaLiveRegion();
  initExternalLinks();
  initOrbitPause();
  initResizeHandler();

  // Dev indicator (remove in production)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.info('%c✨ LUMOS — script.js loaded', 'color: #C4AC87; font-weight: bold;');
  }
};

onReady(init);