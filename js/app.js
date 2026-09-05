const products = [
  {
    id: 1,
    title: "Camisa de lino Cala",
    description: "Corte holgado, algodón/lino",
    price: 649,
    category: "ropa",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Chaqueta Bruma",
    description: "Sarga resistente al agua",
    price: 1290,
    category: "ropa",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Pantalón Recto Osca",
    description: "Sastrería, cintura media",
    price: 890,
    category: "ropa",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Suéter Alero",
    description: "Lana merino, cuello redondo",
    price: 990,
    stock: "Quedan 3",
    category: "ropa",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "Vestido Talara",
    description: "Punto midi, manga larga",
    price: 1150,
    category: "ropa",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "Refrigerador Nive 320L",
    description: "No Frost, inverter",
    price: 8990,
    stock: "Quedan 5",
    category: "electrodomesticos",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop"
  }
];

let currentCategory = 'todo';

function initApp() {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <header>
      <h1>Mulltienda</h1>
      <div class="header-icons">
        <button class="icon-btn">⚡</button>
        <button class="icon-btn">🛍️</button>
        <button class="icon-btn">⚙️</button>
      </div>
    </header>

    <div class="categories">
      <button class="cat-btn active" data-cat="todo">Todo</button>
      <button class="cat-btn" data-cat="ropa">Ropa</button>
      <button class="cat-btn" data-cat="electrodomesticos">Electrodomésticos</button>
    </div>

    <div class="products-grid" id="productsGrid"></div>
  `;

  setupEvents();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const filteredProducts = currentCategory === 'todo' 
    ? products 
    : products.filter(p => p.category === currentCategory);

  grid.innerHTML = filteredProducts.map(p => `
    <div class="card">
      <div class="card-img-container">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
      </div>
      <div class="card-content">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-footer">
          <div class="price-row">
            <span class="card-price">$${p.price.toLocaleString('es-MX')}</span>
            ${p.stock ? `<span class="badge">${p.stock}</span>` : ''}
          </div>
          <button class="add-btn" data-id="${p.id}">Añadir al carrito</button>
        </div>
      </div>
    </div>
  `).join('');
}

function setupEvents() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-btn')) {
      document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-cat');
      renderProducts();
    }

    if (e.target.classList.contains('add-btn')) {
      const id = parseInt(e.target.getAttribute('data-id'));
      const product = products.find(p => p.id === id);
      alert(`Añadido al carrito: ${product.title}`);
    }
  });
}

document.addEventListener('DOMContentLoaded
