'use strict';

/* -----------------------
   DOM-Elemente
   ----------------------- */
const images = document.querySelectorAll('.gallery img');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox .close');
const prevBtn = document.querySelector('.lightbox .prev');
const nextBtn = document.querySelector('.lightbox .next');
const lightboxEl = document.getElementById('lightbox');

/* -----------------------
   PhotoSwipe initialisierung (optional)
   wir nennen die Instanz pswpLightbox, damit kein Name mit DOM kollidiert
   ----------------------- */
let pswpLightbox = null;
if (typeof PhotoSwipeLightbox !== 'undefined') {
  try {
    pswpLightbox = new PhotoSwipeLightbox({
      gallery: '.gallery',
      children: 'a',
      pswpModule: PhotoSwipe
    });
    pswpLightbox.init();
  } catch (err) {
    // Falls PhotoSwipe nicht geladen ist, nichts tun.
    console.warn('PhotoSwipe initialisierung fehlgeschlagen:', err);
  }
}

/* -----------------------
   State / Einstellungen
   ----------------------- */
let currentIndex = 0;

let zoomLevel = 1;       // aktueller Zoom-Faktor
const minZoom = 0.1;
const maxZoom = 5;
const zoomStep = 0.2;

let currentX = 0;
let currentY = 0;
let startX = 0;
let startY = 0;
let isPanning = false;
let moved = false;

/* -----------------------
   Hilfsfunktionen
   ----------------------- */
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function updateTransform(withTransition = true) {
  if (!lightboxImg) return;
  if (!withTransition) {
    lightboxImg.style.transition = 'none';
  } else {
    lightboxImg.style.transition = '';
  }
  lightboxImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${zoomLevel})`;
  if (zoomLevel > 1) {
    lightboxImg.classList.add('zoomed');
  } else {
    lightboxImg.classList.remove('zoomed');
  }
}

function resetZoom() {
  zoomLevel = 1;
  currentX = 0;
  currentY = 0;
  updateTransform(true);
}

function zoomTo(newZoom, clientX = null, clientY = null) {
  newZoom = clamp(newZoom, minZoom, maxZoom);
  if (newZoom === zoomLevel) return;

  const rect = lightboxImg.getBoundingClientRect();
  if (clientX === null || clientY === null) {
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;

  const ratio = 1 - (newZoom / zoomLevel);
  currentX += dx * ratio;
  currentY += dy * ratio;

  zoomLevel = newZoom;
  updateTransform(true);
}

/* -----------------------
   Lightbox: öffnen / schließen / Navigation
   ----------------------- */
images.forEach((img, index) => {
  img.addEventListener('click', (e) => {
    // Bestimme Vollbild-Link (href des umgebenden <a>)
    const link = img.closest('a');
    const full = link ? link.href : img.src;
    currentIndex = index;
    openLightbox(full);
  });
});

function openLightbox(src) {
  if (!lightboxEl || !lightboxImg) return;
  lightboxEl.classList.add('active');
  lightboxImg.src = src;
  resetZoom();
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('active');
  resetZoom();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  const link = images[currentIndex].closest('a');
  const full = link ? link.href : images[currentIndex].src;
  lightboxImg.src = full;
  resetZoom();
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  const link = images[currentIndex].closest('a');
  const full = link ? link.href : images[currentIndex].src;
  lightboxImg.src = full;
  resetZoom();
}

/* Buttons (schützen falls Element fehlt) */
if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
if (prevBtn) prevBtn.addEventListener('click', showPrev);
if (nextBtn) nextBtn.addEventListener('click', showNext);

/* Klick außerhalb schließt */
if (lightboxEl) {
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
}

/* Keyboard */
document.addEventListener('keydown', (e) => {
  if (!lightboxEl || !lightboxEl.classList.contains('active')) return;
  if (e.key === 'ArrowLeft') showPrev();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'Escape') closeLightbox();
});

/* -----------------------
   Zoom per Klick (Toggle)
   ----------------------- */
if (lightboxImg) {
  lightboxImg.addEventListener('click', (e) => {
    if (moved) { moved = false; return; }
    if (zoomLevel === 1) {
      const target = clamp(2, minZoom, maxZoom);
      zoomTo(target, e.clientX, e.clientY);
    } else {
      resetZoom();
    }
  });
}

/* -----------------------
   Mausrad Zoom (cursor-focused)
   ----------------------- */
if (lightboxEl) {
  lightboxEl.addEventListener('wheel', (e) => {
    if (!lightboxEl.classList.contains('active')) return;
    e.preventDefault();

    const delta = e.deltaY;
    let newZoom = zoomLevel;
    if (delta < 0) {
      newZoom = clamp(zoomLevel + zoomStep, minZoom, maxZoom);
    } else {
      newZoom = clamp(zoomLevel - zoomStep, minZoom, maxZoom);
    }

    zoomTo(newZoom, e.clientX, e.clientY);

    if (zoomLevel === 1) {
      currentX = 0;
      currentY = 0;
      updateTransform(true);
    }
  }, { passive: false });
}

/* -----------------------
   Drag / Pan mit Pointer Events (Mouse & Touch)
   ----------------------- */
if (lightboxImg) {
  lightboxImg.addEventListener('pointerdown', (e) => {
    if (zoomLevel <= 1) return;
    isPanning = true;
    moved = false;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    lightboxImg.style.cursor = 'grabbing';
    lightboxImg.style.transition = 'none';
    try { lightboxImg.setPointerCapture(e.pointerId); } catch (err) { }
  });

  lightboxImg.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    moved = true;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateTransform(false);
  });

  lightboxImg.addEventListener('pointerup', (e) => {
    if (!isPanning) return;
    isPanning = false;
    lightboxImg.style.cursor = 'grab';
    lightboxImg.style.transition = '';
    try { lightboxImg.releasePointerCapture(e.pointerId); } catch (err) { }
  });

  lightboxImg.addEventListener('pointercancel', (e) => {
    if (!isPanning) return;
    isPanning = false;
    lightboxImg.style.cursor = 'grab';
    lightboxImg.style.transition = '';
  });

  lightboxImg.addEventListener('dragstart', (e) => e.preventDefault());

  lightboxImg.addEventListener('load', () => {
    updateTransform(true);
  });
}
