// ── Year ──────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Theme ─────────────────────────────────────────
const html = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-btn') === theme);
  });
}

applyTheme(savedTheme);

document.querySelectorAll('[data-theme-btn]').forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme-btn')));
});

// ── Language ──────────────────────────────────────
const savedLang = localStorage.getItem('lang') || (navigator.language && navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en');
let currentLang = savedLang;
html.setAttribute('data-lang', savedLang);

function applyLang(lang) {
  currentLang = lang;
  html.setAttribute('data-lang', lang);
  localStorage.setItem('lang', lang);

  // Update all elements with data-en / data-es
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text) el.innerHTML = text;
  });

  // Update active button
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
  });

  // Update placeholders
  document.querySelectorAll('[data-placeholder-en]').forEach(el => {
    el.placeholder = el.getAttribute(`data-placeholder-${lang}`) || el.getAttribute('data-placeholder-en');
  });

  // Update html lang attr
  html.lang = lang === 'es' ? 'es' : 'en';
}

applyLang(savedLang);

document.querySelectorAll('[data-lang-btn]').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang-btn')));
});

// ── Navbar scroll + scroll-to-top ─────────────────
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Parallax hero ─────────────────────────────────
const heroBg = document.getElementById('heroBg');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  if (scrolled < window.innerHeight) {
    heroBg.style.transform = `scale(1.08) translateY(${scrolled * 0.25}px)`;
  }
}, { passive: true });

// ── Mobile menu ───────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── Scroll reveal ─────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Gallery lightbox ──────────────────────────────
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');
let currentGalleryItems = [];
let currentIndex = 0;

let lastFocusedElement = null;
const lightboxFocusable = [lightboxClose, lightboxPrev, lightboxNext];

function openLightbox(items, index) {
  if (!lightbox.classList.contains('open')) lastFocusedElement = document.activeElement;
  currentGalleryItems = items;
  currentIndex = index;
  const img = currentGalleryItems[index].querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCounter.textContent = `${index + 1} / ${currentGalleryItems.length}`;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

['gallery-landscape', 'gallery-interior'].forEach(galleryId => {
  const galleryEl = document.getElementById(galleryId);
  if (!galleryEl) return;
  const items = Array.from(galleryEl.querySelectorAll('.gallery-item'));
  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(items, i));
  });
});

lightboxPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  openLightbox(currentGalleryItems, (currentIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length);
});

lightboxNext.addEventListener('click', (e) => {
  e.stopPropagation();
  openLightbox(currentGalleryItems, (currentIndex + 1) % currentGalleryItems.length);
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

// ── Swipe support for mobile ──
let touchStartX = 0;
let touchStartY = 0;
lightbox.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].screenX - touchStartX;
  const dy = e.changedTouches[0].screenY - touchStartY;
  if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
  if (dx < 0) openLightbox(currentGalleryItems, (currentIndex + 1) % currentGalleryItems.length);
  else openLightbox(currentGalleryItems, (currentIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length);
}, { passive: true });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') openLightbox(currentGalleryItems, (currentIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length);
  if (e.key === 'ArrowRight') openLightbox(currentGalleryItems, (currentIndex + 1) % currentGalleryItems.length);
  if (e.key === 'Tab') {
    const idx = lightboxFocusable.indexOf(document.activeElement);
    if (e.shiftKey) {
      e.preventDefault();
      lightboxFocusable[(idx <= 0 ? lightboxFocusable.length : idx) - 1].focus();
    } else {
      e.preventDefault();
      lightboxFocusable[(idx + 1) % lightboxFocusable.length].focus();
    }
  }
});

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocusedElement) lastFocusedElement.focus();
}

// ── Contact form ──────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('[type="submit"]');
  const original = btn.innerHTML;

  btn.innerHTML = currentLang === 'es' ? 'Enviando...' : 'Sending...';
  btn.disabled = true;

  fetch('php/send.php', { method: 'POST', body: new FormData(form) })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        btn.innerHTML = currentLang === 'es' ? '¡Mensaje Enviado!' : 'Message Sent!';
        btn.style.background = '#5a7d5e';
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.background = '';
          btn.disabled = false;
          form.reset();
        }, 3000);
      } else {
        btn.innerHTML = currentLang === 'es' ? 'Error. Intentá de nuevo.' : 'Error. Please try again.';
        btn.style.background = '#b94040';
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.background = '';
          btn.disabled = false;
        }, 3000);
      }
    })
    .catch(() => {
      btn.innerHTML = currentLang === 'es' ? 'Error. Intentá de nuevo.' : 'Error. Please try again.';
      btn.style.background = '#b94040';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });
}

// ── Image error fallback ──────────────────────────
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    const parent = img.closest('.gallery-item');
    if (parent) {
      parent.style.background = 'var(--bg-alt)';
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.justifyContent = 'center';
      img.style.opacity = '0';
    }
  });
});
