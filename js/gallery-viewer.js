(() => {
  const gallery = document.querySelector('.gallery-grid');
  if (!gallery || !HTMLDialogElement.prototype.showModal) return;

  const links = [...gallery.querySelectorAll('.gallery-image[href]')];
  const photos = links.map(link => JSON.parse(link.querySelector('.w-json').textContent).items[0]);
  if (!photos.length) return;

  const viewer = document.createElement('dialog');
  viewer.className = 'gallery-viewer';
  viewer.setAttribute('aria-labelledby', 'gallery-viewer-title');
  viewer.innerHTML = `
    <header class="gallery-viewer__header">
      <h2 class="gallery-viewer__title" id="gallery-viewer-title"></h2>
      <span class="gallery-viewer__count" aria-live="polite" aria-atomic="true"></span>
      <button class="gallery-viewer__control gallery-viewer__close" type="button" aria-label="Close gallery">
        <span class="gallery-viewer__cross" aria-hidden="true"></span>
      </button>
    </header>
    <figure class="gallery-viewer__stage">
      <img class="gallery-viewer__photo" alt="" draggable="false">
    </figure>
    <footer class="gallery-viewer__footer">
      <button class="gallery-viewer__control gallery-viewer__previous" type="button" aria-label="Previous photo">
        <span class="gallery-viewer__arrow" aria-hidden="true"></span>
      </button>
      <p class="gallery-viewer__caption"></p>
      <button class="gallery-viewer__control gallery-viewer__next" type="button" aria-label="Next photo">
        <span class="gallery-viewer__arrow" aria-hidden="true"></span>
      </button>
    </footer>`;
  document.body.append(viewer);

  const title = gallery.dataset.galleryTitle;
  const count = viewer.querySelector('.gallery-viewer__count');
  const stage = viewer.querySelector('.gallery-viewer__stage');
  const photo = viewer.querySelector('.gallery-viewer__photo');
  const caption = viewer.querySelector('.gallery-viewer__caption');
  const close = viewer.querySelector('.gallery-viewer__close');
  let currentIndex = 0;
  let opener;
  let swipe;

  viewer.querySelector('.gallery-viewer__title').textContent = title;

  function showPhoto(index) {
    currentIndex = (index + photos.length) % photos.length;
    const current = photos[currentIndex];
    photo.src = current.url;
    photo.alt = current.caption || `${title} photo ${currentIndex + 1}`;
    caption.textContent = current.caption || '';
    count.textContent = `${currentIndex + 1} / ${photos.length}`;
  }

  links.forEach((link, index) => {
    link.setAttribute('aria-label', `Open ${title} photo ${index + 1} of ${photos.length}`);
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showPhoto(index);
      viewer.showModal();
      close.focus({ preventScroll: true });
    });
  });

  close.addEventListener('click', () => viewer.close());
  viewer.querySelector('.gallery-viewer__previous').addEventListener('click', () => showPhoto(currentIndex - 1));
  viewer.querySelector('.gallery-viewer__next').addEventListener('click', () => showPhoto(currentIndex + 1));

  viewer.addEventListener('close', () => {
    swipe = undefined;
    opener?.focus({ preventScroll: true });
  });

  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPhoto(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  });

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointerup', event => {
    if (swipe?.id !== event.pointerId) return;
    const x = event.clientX - swipe.x;
    const y = event.clientY - swipe.y;
    swipe = undefined;
    if (Math.abs(x) >= 45 && Math.abs(x) > Math.abs(y) * 1.25) {
      showPhoto(currentIndex + (x < 0 ? 1 : -1));
    }
  });

  stage.addEventListener('pointercancel', event => {
    if (swipe?.id === event.pointerId) swipe = undefined;
  });
})();
