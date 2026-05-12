'use strict';

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');

if (cursor && cursorDot) {
  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  });

  function animateCursor() {
    curX += (mouseX - curX) * 0.12;
    curY += (mouseY - curY) * 0.12;
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

/* ============================================================
   HEADER – scroll behaviour
   ============================================================ */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ============================================================
   MOBILE MENU
   ============================================================ */
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ============================================================
   HERO BACKGROUND – subtle parallax
   ============================================================ */
const heroBg = document.getElementById('heroBg');
if (heroBg) {
  setTimeout(() => heroBg.classList.add('loaded'), 100);

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
  }, { passive: true });
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealEls = document.querySelectorAll(
  '.section-intro, .section-tag, .gallery-item, .video-card, .about-grid, .contact-inner, .filter-bar'
);

revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 40);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

revealEls.forEach(el => revealObserver.observe(el));

/* ============================================================
   GALLERY FILTER
   ============================================================ */
const filterBtns   = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;

    galleryItems.forEach(item => {
      // Split comma-separated categories so "landscape, wedding" matches both filters
      const cats = (item.dataset.category || '').split(',').map(c => c.trim());
      const show = filter === 'all' || cats.includes(filter);
      item.classList.toggle('hidden', !show);
    });
  });
});

/* ============================================================
   CURSOR FIX – iframes block mousemove events
   Overlay iframes with a transparent div; on click, remove it
   so the user can still interact with the video.
   ============================================================ */
document.querySelectorAll('.video-frame').forEach(frame => {
  // Create a transparent click-shield over the iframe
  const shield = document.createElement('div');
  shield.className = 'iframe-shield';
  frame.style.position = 'relative';
  frame.appendChild(shield);

  // First click activates the video (removes shield), cursor resumes normally
  shield.addEventListener('click', () => {
    shield.remove();
  });

  // When mouse leaves the video card, restore the shield so cursor works again
  const card = frame.closest('.video-card');
  if (card) {
    card.addEventListener('mouseleave', () => {
      if (!frame.querySelector('.iframe-shield')) {
        const newShield = document.createElement('div');
        newShield.className = 'iframe-shield';
        frame.appendChild(newShield);
        newShield.addEventListener('click', () => newShield.remove());
        card.addEventListener('mouseleave', () => {
          if (!frame.querySelector('.iframe-shield')) {
            // already handled by outer listener re-adding
          }
        }, { once: true });
      }
    });
  }
});

/* ============================================================
   PHOTOSWIPE LIGHTBOX
   ============================================================ */
if (typeof PhotoSwipeLightbox !== 'undefined') {
  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery',
    children: 'a.gallery-item',
    pswpModule: PhotoSwipe,
    bgOpacity: 0.95,
    showHideAnimationType: 'zoom',
  });
  lightbox.init();
}
