function attachDragEvents() {
  const cards = document.querySelectorAll('.product-card[draggable]');
  cards.forEach(card => {
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend', onDragEnd);
  });
}

function onDragStart(e) {
  const id = parseInt(e.currentTarget.dataset.id);
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  e.dataTransfer.setData('application/json', JSON.stringify(product));
  e.dataTransfer.effectAllowed = 'copy';
  e.currentTarget.classList.add('dragging');

  // Show cart drawer with drop zone highlighted after slight delay
  setTimeout(() => showCartDrawer(), 50);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}

function initDragDrop() {
  const dropZone = document.getElementById('cartDropZone');
  if (!dropZone) return;

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', e => {
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    try {
      const product = JSON.parse(e.dataTransfer.getData('application/json'));
      if (product) addToCart(product);
    } catch {}
  });
}
