// --- Map Toggle ---
let confettiInterval = null;
function changeMap(location) {
  const iframe = document.getElementById('mapFrame');
  const maps = {
    Ritual:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955.4969905228725!2d122.95844581477291!3d10.680559379498298!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aed18e98535d85%3A0xc3476691b4864e2d!2sRitwal%20Cafe%20-%20Courtyard!5e0!3m2!1sen!2sph!4v1697315761234!5m2!1sen!2sph',
    puerta:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.596785708245!2d122.9593113147765!3d10.677239215407734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aed1527b39f9df%3A0x76422e05c2c157d!2sPUERTA%20NUEVE!5e0!3m2!1sen!2sph!4v1697317123456!5m2!1sen!2sph',
  };
  if (maps[location]) iframe.src = maps[location];
}

// --- On Load ---
document.addEventListener('DOMContentLoaded', () => {
  // Scroll-in animations
  const animated = document.querySelectorAll('.animate-on-scroll');
  if (animated.length) {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      }), { threshold: 0.1 }
    );
    animated.forEach(el => obs.observe(el));
  }

  // Staggered image fades in About
  document.querySelectorAll('.animation-container').forEach(container => {
    const imgs = container.querySelectorAll('img');
    if (!imgs.length) return;
    const step = 4;
    const total = imgs.length * step;
    imgs.forEach((img, i) => {
      img.style.animation = `fadeSlide ${total}s infinite ease-in-out, glitch 2s infinite linear`;
      img.style.animationDelay = `${i * step}s, 0s`;
    });
  });

  // Slider
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const carousel = document.querySelector('.carousel');
  const list = document.querySelector('.carousel .list');
  const seeMoreBtns = document.querySelectorAll('.seeMore');
  const backBtn = document.getElementById('back');

  let unblock;
  const showSlider = (type) => {
    if (!carousel || !list || !nextBtn || !prevBtn) return;
    nextBtn.style.pointerEvents = 'none';
    prevBtn.style.pointerEvents = 'none';
    carousel.classList.remove('next', 'prev');

    const items = document.querySelectorAll('.carousel .list .item');
    if (!items.length) return;

    if (type === 'next') {
      list.appendChild(items[0]);
      carousel.classList.add('next');
    } else {
      list.prepend(items[items.length - 1]);
      carousel.classList.add('prev');
    }

    clearTimeout(unblock);
    unblock = setTimeout(() => {
      nextBtn.style.pointerEvents = 'auto';
      prevBtn.style.pointerEvents = 'auto';
    }, 1100);
  };

  nextBtn && (nextBtn.onclick = () => showSlider('next'));
  prevBtn && (prevBtn.onclick = () => showSlider('prev'));

  // Ensure each detail panel has an inline Back button (inserted once)
  document.querySelectorAll('.carousel .list .item .detail').forEach(ensureInlineBack);

  seeMoreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.item');
      const detail = item.querySelector('.detail');

      // Make sure inline back exists for this detail (defensive)
      ensureInlineBack(detail);

      // Open detail view + reset panel states
      carousel && carousel.classList.add('showDetail');
      resetQuantity(detail);
      resetOrderPanel(item);
    });
  });

  // Legacy BACK control (bottom of carousel)
  backBtn && (backBtn.onclick = () => {
    carousel && carousel.classList.remove('showDetail');
    const activeItem = carousel.querySelector('.list .item:first-child');
    resetOrderPanel(activeItem);
  });

  // Cart
  let cart = {}; // id -> {name, price, quantity}

  const viewCartBtn = document.getElementById('view-cart-btn');
  const cartItemCount = document.getElementById('cart-item-count');
  const cartTotalPrice = document.getElementById('cart-total-price');

  const cartOverlay = document.getElementById('cart-overlay');
  const cartModal = document.getElementById('cart-modal');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartBody = document.getElementById('cart-body');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');

  const receiptOverlay = document.getElementById('receipt-overlay');
  const receiptItems = document.getElementById('receipt-items');
  const receiptTotalPrice = document.getElementById('receipt-total-price');
  const receiptCloseBtn = document.getElementById('receipt-close-btn');

  // Init product panels
  document.querySelectorAll('.grab-checkout-panel').forEach(panel => {
    const detail = panel.closest('.detail');
    const minusBtn = panel.querySelector('.quantity-minus');
    const plusBtn = panel.querySelector('.quantity-plus');
    const addBtn = panel.querySelector('.add-to-cart-btn');
    const orderBtn = panel.querySelector('.order-with-grab-btn');
    const orderPanel = panel.querySelector('.order-panel');

    orderBtn && orderBtn.addEventListener('click', () => {
      orderBtn.classList.add('hidden');
      orderPanel.classList.add('visible');
    });

    minusBtn && minusBtn.addEventListener('click', () => updateQuantity(detail, -1));
    plusBtn && plusBtn.addEventListener('click', () => updateQuantity(detail, 1));

    addBtn && addBtn.addEventListener('click', (e) => {
      const name = detail.dataset.name;
      const price = parseInt(detail.dataset.price);
      const qty = parseInt(panel.querySelector('.quantity-display').textContent) || 1;
      if (!name || isNaN(price)) return;
      addToCart(name, price, qty);
      e.currentTarget.classList.add('popped');
      setTimeout(() => e.currentTarget.classList.remove('popped'), 300);
    });
  });

  // --- Helpers ---
  function ensureInlineBack(detail) {
    if (!detail) return;
    let backBtn = detail.querySelector('.back-inline-btn');
    if (backBtn) return; // already present

    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'back-inline-btn';
    backBtn.textContent = 'Back';

    const grabPanel = detail.querySelector('.grab-checkout-panel');
    (grabPanel?.parentNode || detail).insertBefore(
      backBtn,
      grabPanel ? grabPanel.nextSibling : null
    );

    backBtn.addEventListener('click', () => {
      document.querySelector('.carousel')?.classList.remove('showDetail');
      const item = detail.closest('.item');
      if (item) {
        const orderPanel = item.querySelector('.order-panel');
        const orderBtn = item.querySelector('.order-with-grab-btn');
        orderPanel?.classList.remove('visible');
        orderBtn?.classList.remove('hidden');
      }
    });
  }

  function updateQuantity(detail, change) {
    if (!detail) return;
    const panel = detail.querySelector('.grab-checkout-panel');
    const display = panel.querySelector('.quantity-display');
    const minusBtn = panel.querySelector('.quantity-minus');
    let qty = parseInt(display.textContent) + change;
    qty = Math.max(1, Math.min(20, qty));
    display.textContent = qty;
    minusBtn.disabled = qty === 1;
    updateItemTotal(detail, qty);
  }

  function updateItemTotal(detail, qty) {
    const panel = detail.querySelector('.grab-checkout-panel');
    const totalDisplay = panel.querySelector('.item-total');
    const price = parseInt(detail.dataset.price);
    totalDisplay.textContent = `₱ ${price * qty}`;
  }

  function resetQuantity(detail) {
    if (!detail) return;
    const panel = detail.querySelector('.grab-checkout-panel');
    panel.querySelector('.quantity-display').textContent = '1';
    panel.querySelector('.quantity-minus').disabled = true;
    updateItemTotal(detail, 1);
  }

  function resetOrderPanel(item) {
    if (!item) return;
    const panel = item.querySelector('.grab-checkout-panel');
    if (!panel) return;
    panel.querySelector('.order-panel').classList.remove('visible');
    panel.querySelector('.order-with-grab-btn').classList.remove('hidden');
  }

  function addToCart(name, price, quantity) {
    const id = name.replace(/\s+/g, '_').toLowerCase();
    cart[id] = cart[id]
      ? { ...cart[id], quantity: cart[id].quantity + quantity }
      : { name, price, quantity };
    updateCartView();
  }

  /**
   * ==========================================================
   * MODIFIED FUNCTION: updateCartView
   * This now builds the interactive cart items with +/-/x buttons
   * ==========================================================
   */
  function updateCartView() {
    let totalItems = 0;
    let subtotal = 0;
    cartBody.innerHTML = ''; // Clear the cart body first

    const ids = Object.keys(cart);
    if (!ids.length) {
      // Cart is empty, show the empty message
      cartBody.innerHTML = '<p class="cart-empty-msg">Your Basket is empty.</p>';
      viewCartBtn.classList.remove('visible');
      cartCheckoutBtn.disabled = true;
      cartItemCount.textContent = '0 Items';
      cartTotalPrice.textContent = '₱ 0';
      cartSubtotal.textContent = '₱ 0';
      return;
    }

    // Cart has items, loop through them and build the HTML
    ids.forEach(id => {
      const item = cart[id];
      totalItems += item.quantity;
      subtotal += item.price * item.quantity;
      
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.dataset.id = id; // Add the id as a data attribute
      
      el.innerHTML = `
        <div class="cart-item-details">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">₱ ${item.price}</span>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-selector">
            <button class="quantity-btn quantity-minus" ${item.quantity === 1 ? 'disabled' : ''}>–</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn quantity-plus">+</button>
          </div>
        </div>
        <button class="cart-item-remove-btn" aria-label="Remove ${item.name}">×</button>
      `;
      cartBody.appendChild(el);
    });

    // Update all the totals and buttons
    cartItemCount.textContent = `${totalItems} ${totalItems > 1 ? 'Items' : 'Item'}`;
    cartTotalPrice.textContent = `₱ ${subtotal}`;
    viewCartBtn.classList.add('visible');
    cartSubtotal.textContent = `₱ ${subtotal}`;
    cartCheckoutBtn.disabled = false;
  }
  // ==========================================================
  // END OF MODIFIED FUNCTION
  // ==========================================================


  // Show/Hide cart
  viewCartBtn.addEventListener('click', () => {
    cartOverlay.classList.add('visible');
    cartModal.classList.remove('closing');
  });
  cartCloseBtn.addEventListener('click', () => {
    cartModal.classList.add('closing');
    setTimeout(() => cartOverlay.classList.remove('visible'), 400);
  });

  /**
   * ==========================================================
   * NEW EVENT LISTENER
   * This handles clicks on '+', '–', and '×' INSIDE the cart.
   * ==========================================================
   */
  cartBody.addEventListener('click', (e) => {
    const target = e.target;
    
    // Find the parent .cart-item
    const itemEl = target.closest('.cart-item');
    if (!itemEl) return; // Click wasn't on an item control

    const id = itemEl.dataset.id;
    if (!cart[id]) return; // Item not in cart (safety check)

    if (target.classList.contains('cart-item-remove-btn')) {
      // --- REMOVE button (×) was clicked ---
      delete cart[id];
    } else if (target.classList.contains('quantity-plus')) {
      // --- PLUS button (+) was clicked ---
      cart[id].quantity++;
    } else if (target.classList.contains('quantity-minus')) {
      // --- MINUS button (–) was clicked ---
      if (cart[id].quantity > 1) {
        cart[id].quantity--;
      } else {
        // Quantity is 1, so clicking minus removes the item
        delete cart[id];
      }
    }

    // After any change, re-render the entire cart
    updateCartView();
  });
  // ==========================================================
  // END OF NEW EVENT LISTENER
  // ==========================================================


  // Checkout -> Receipt
  cartCheckoutBtn.addEventListener('click', () => {
    cartModal.classList.add('closing');
    setTimeout(() => cartOverlay.classList.remove('visible'), 400);
    showReceipt();
  });

function showReceipt() {
    let subtotal = 0;
    receiptItems.innerHTML = '';
    Object.keys(cart).forEach(id => {
      const item = cart[id];
      subtotal += item.price * item.quantity;
      const row = document.createElement('div');
      row.className = 'receipt-item';
      row.innerHTML = `<span class="name">${item.quantity}x ${item.name}</span><span class="price">₱ ${item.price * item.quantity}</span>`;
      receiptItems.appendChild(row);
    });
    receiptTotalPrice.textContent = `₱ ${subtotal}`;
    receiptOverlay.classList.add('visible');

    startConfettiBurst(); // <-- ADD THIS LINE

    // Reset cart
    cart = {};
    updateCartView();
  }

  receiptCloseBtn.addEventListener('click', () => {
    receiptOverlay.classList.remove('visible');
	  stopConfettiBurst();
  });
});
function createConfetti() {
  // We must define confettiContainer here, *inside* the function,
  // because the script loads before the DOM is fully ready.
  const confettiContainer = document.getElementById('confetti-container');
  if (!confettiContainer) return; // Don't run if container isn't found

  const confetti = document.createElement('div');
  confetti.classList.add('confetti');

  //Randomize size
  const size = Math.random() * 10 + 5 + 'px'; // between 5 and 15
  confetti.style.width = size;
  confetti.style.height = size;

  //Randomize shape
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  confetti.classList.add(shape);

  //Randomize color
  const colors = ['#FFC0CB', '#FFD700', '#ADFF2F', '#00FFFF', '#FF4500', '#9400D3', '#00FA9A', '#FF6347'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  if (shape === 'triangle') {
    confetti.style.borderBottomColor = color; //Triangle color
  } else {
    confetti.style.backgroundColor = color; //Square and circle color
  }

  //Randomize position
  confetti.style.left = `${Math.random() * 100}vw`;

  //Randomize fall duration
  const fallDuration = Math.random() * 3 + 2; // between 2s and 5s
  confetti.style.animationDuration = `${fallDuration}s`;

  //Add confetti to container
  confettiContainer.appendChild(confetti);

  //Remove confetti after animation
  setTimeout(() => {
    confetti.remove();
  }, fallDuration * 1000);
}

// This function starts the confetti rain
function startConfettiBurst() {
  if (confettiInterval) return; // Don't start if already running
  confettiInterval = setInterval(() => {
    for (let i = 0; i < 5; i++) {
      createConfetti();
    }
  }, 100);
}

// This function stops the confetti rain and clears any pieces
function stopConfettiBurst() {
  clearInterval(confettiInterval);
  confettiInterval = null;
  const confettiContainer = document.getElementById('confetti-container');
  if (confettiContainer) {
    confettiContainer.innerHTML = '';
  }
}