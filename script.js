'use strict';

/* -----------------------
   Grundelemente
   ----------------------- */
const images = document.querySelectorAll('.gallery img');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox .close');
const prevBtn = document.querySelector('.lightbox .prev');
const nextBtn = document.querySelector('.lightbox .next');
const lightbox = new PhotoSwipeLightbox({
  gallery: '.gallery',
  children: 'a',
  pswpModule: PhotoSwipe
});
lightbox.init();


/* -----------------------
   State / Einstellungen
   ----------------------- */
let currentIndex = 0;

let zoomLevel = 1;       // aktueller Zoom-Faktor
const minZoom = 0.1;       // minimaler Zoom (1 = normal)
const maxZoom = 5;       // maximaler Zoom
const zoomStep = 0.2;    // Schrittweite pro Mausrad-Stufe

let currentX = 0;        // aktuelle Translation X (px)
let currentY = 0;        // aktuelle Translation Y (px)
let startX = 0;          // pointer start X für Pan
let startY = 0;          // pointer start Y für Pan
let isPanning = false;   // ob aktuell gepannt wird
let moved = false;       // Flag: wurde bei pointer bewegt (um Click-Toggle zu unterdrücken)

/* -----------------------
   Hilfsfunktionen
   ----------------------- */
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function updateTransform(withTransition = true) {
  // temporär Transition ausschalten beim Panning für Direktheit
  if (!withTransition) {
    lightboxImg.style.transition = 'none';
  } else {
    lightboxImg.style.transition = '';
  }
  lightboxImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${zoomLevel})`;
  // Klasse für CSS falls nötig
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

/**
 * Zoom to a specific level, keeping the point under clientX/clientY stationary (cursor-focus).
 * If clientX/clientY omitted, zoom towards center.
 */
function zoomTo(newZoom, clientX = null, clientY = null) {
  newZoom = clamp(newZoom, minZoom, maxZoom);
  if (newZoom === zoomLevel) return;

  // Bounding rect der sichtbaren Bildfläche
  const rect = lightboxImg.getBoundingClientRect();
  // Falls keine Mauskoordinaten übergeben -> mittig zoomen
  if (clientX === null || clientY === null) {
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  // Delta vom Bildzentrum zur Mausposition
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;

  // Passe Translation so an, dass der Punkt unter der Maus verbleibt
  // Formel: current += delta * (1 - new/old)
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
  img.addEventListener('click', () => {
    currentIndex = index;
    openLightbox(img.src);
  });
});

function openLightbox(src) {
  lightbox.classList.add('active');
  lightboxImg.src = src;
  resetZoom();
}

function closeLightbox() {
  lightbox.classList.remove('active');
  resetZoom();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  lightboxImg.src = images[currentIndex].src;
  resetZoom();
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  lightboxImg.src = images[currentIndex].src;
  resetZoom();
}

/* Buttons (schützen falls Element fehlt) */
if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
if (prevBtn) prevBtn.addEventListener('click', showPrev);
if (nextBtn) nextBtn.addEventListener('click', showNext);

/* Klick außerhalb schließt */
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* Keyboard */
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'ArrowLeft') showPrev();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'Escape') closeLightbox();
});

/* -----------------------
   Zoom per Klick (Toggle) - single click
   ----------------------- */
lightboxImg.addEventListener('click', (e) => {
  // Wenn während pointermove bewegt wurde, unterdrücke das Click-Toggle
  if (moved) { moved = false; return; }

  if (zoomLevel === 1) {
    // zoom auf 2x (oder bis maxZoom)
    const target = clamp(2, minZoom, maxZoom);
    zoomTo(target, e.clientX, e.clientY);
  } else {
    resetZoom();
  }
});

/* -----------------------
   Mausrad Zoom (cursor-focused)
   ----------------------- */
lightbox.addEventListener('wheel', (e) => {
  // Nur wenn Lightbox aktiv ist
  if (!lightbox.classList.contains('active')) return;
  e.preventDefault();

  const delta = e.deltaY;
  let newZoom = zoomLevel;
  if (delta < 0) {
    // scroll up -> reinzoomen
    newZoom = clamp(zoomLevel + zoomStep, minZoom, maxZoom);
  } else {
    // scroll down -> rauszoomen
    newZoom = clamp(zoomLevel - zoomStep, minZoom, maxZoom);
  }

  // Zoom mit Fokus auf Mausposition
  zoomTo(newZoom, e.clientX, e.clientY);

  // Wenn komplett rausgezoomt -> zentriere zurück
  if (zoomLevel === 1) {
    currentX = 0;
    currentY = 0;
    updateTransform(true);
  }
}, { passive: false });

/* -----------------------
   Drag / Pan mit Pointer Events (Mouse & Touch)
   ----------------------- */
lightboxImg.addEventListener('pointerdown', (e) => {
  if (zoomLevel <= 1) return; // nur panning bei aktivem Zoom
  isPanning = true;
  moved = false;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
  lightboxImg.style.cursor = 'grabbing';
  // Deaktiviert CSS-Transition während Drag für direkte Reaktion
  lightboxImg.style.transition = 'none';

  // Capture, damit pointermove auch bei schnellen Bewegungen an uns geht
  try { lightboxImg.setPointerCapture(e.pointerId); } catch (err) { }
});

lightboxImg.addEventListener('pointermove', (e) => {
  if (!isPanning) return;
  moved = true;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  updateTransform(false); // kein transition beim panning
});

lightboxImg.addEventListener('pointerup', (e) => {
  if (!isPanning) return;
  isPanning = false;
  lightboxImg.style.cursor = 'grab';
  // restore transition
  lightboxImg.style.transition = '';
  try { lightboxImg.releasePointerCapture(e.pointerId); } catch (err) { }
});

lightboxImg.addEventListener('pointercancel', (e) => {
  if (!isPanning) return;
  isPanning = false;
  lightboxImg.style.cursor = 'grab';
  lightboxImg.style.transition = '';
});

/* Prevent default drag image behavior */
lightboxImg.addEventListener('dragstart', (e) => e.preventDefault());

/* -----------------------
   Wenn Bild wechselt (nachgeladen) -> Reset Transform-Style (kleine Vorsichtsmaßnahme)
   ----------------------- */
lightboxImg.addEventListener('load', () => {
  // Sicherstellen, dass Darstellung konsistent ist
  updateTransform(true);
});
