document.addEventListener('DOMContentLoaded', function() {

    let products = [];
    const defaultProducts = [
        { 
            id: 1, 
            name: 'Pizza Margarita', 
            category: 'Pizzas', 
            price: 12.50, 
            desc: 'Clásica pizza con mozzarella, tomate fresco y albahaca.', 
            image: 'pizza.jpg',
            badge: 'popular', 
            badgeText: '⭐ Popular', 
            stock: 15, 
            status: 'disponible' 
        },
        { 
            id: 2, 
            name: 'Pizza Pepperoni', 
            category: 'Pizzas', 
            price: 14.90, 
            desc: 'Pizza con pepperoni, mozzarella y salsa de tomate.', 
            image: 'pepperoni.jpg',
            badge: 'new', 
            badgeText: 'Nuevo', 
            stock: 10, 
            status: 'disponible' 
        },
        { 
            id: 3, 
            name: 'Hamburguesa Clásica', 
            category: 'Hamburguesas', 
            price: 10.90, 
            desc: 'Carne 100% premium de res, lechuga, tomate, cebolla morada y salsa especial.', 
            image: 'clasica.jpg',
            badge: 'offer', 
            badgeText: 'Oferta', 
            stock: 8, 
            status: 'disponible' 
        },
        { 
            id: 4, 
            name: 'Hamburguesa BBQ', 
            category: 'Hamburguesas', 
            price: 13.50, 
            desc: 'Hamburguesa con salsa BBQ, aros de cebolla crujientes y queso cheddar.', 
            image: 'bbq.jpg',
            badge: null, 
            badgeText: null, 
            stock: 5, 
            status: 'disponible' 
        },
        { 
            id: 5, 
            name: 'Salmón a la plancha', 
            category: 'Pescados', 
            price: 18.40, 
            desc: 'Salmón fresco sellado a la plancha, con vegetales asados.', 
            image: 'salmon.jpg',
            badge: 'popular', 
            badgeText: '⭐ Popular', 
            stock: 0, 
            status: 'agotado' 
        },
        { 
            id: 6, 
            name: 'Ceviche de camarón', 
            category: 'Pescados', 
            price: 15.20, 
            desc: 'Camarones frescos marinados en jugo de limón con cebolla y cilantro.', 
            image: 'ceviche.jpg',
            badge: 'new', 
            badgeText: 'Nuevo', 
            stock: 7, 
            status: 'disponible' 
        },
        { 
            id: 7, 
            name: 'Café de especialidad', 
            category: 'Bebidas', 
            price: 4.20, 
            desc: 'Café de origen mexicano, tueste medio, con notas de chocolate.', 
            image: 'cafe.jpg',
            badge: null, 
            badgeText: null, 
            stock: 20, 
            status: 'disponible' 
        },
        { 
            id: 8, 
            name: 'Ensalada César', 
            category: 'Ensaladas', 
            price: 11.80, 
            desc: 'Lechuga romana, pollo a la plancha, parmesano y aderezo César.', 
            image: 'cesar.jpg',
            badge: 'vegan', 
            badgeText: 'Vegano', 
            stock: 0, 
            status: 'agotado' 
        }
    ];

    try {
        const savedProducts = localStorage.getItem('delicias_products');
        products = savedProducts ? JSON.parse(savedProducts) : JSON.parse(JSON.stringify(defaultProducts));
    } catch (e) {
        products = JSON.parse(JSON.stringify(defaultProducts));
    }

    function saveProducts() {
        try {
            localStorage.setItem('delicias_products', JSON.stringify(products));
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
    }

    let cart = [];
    try {
        const savedCart = localStorage.getItem('delicias_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
        cart = [];
    }

    function saveCart() {
        try {
            localStorage.setItem('delicias_cart', JSON.stringify(cart));
        } catch (e) {
            console.warn('No se pudo guardar el carrito:', e);
        }
    }

    let clients = [];
    const defaultClients = [
        { id: 1, name: 'María García', email: 'maria@email.com', phone: '55 1234 5678', address: 'Av. Principal 123', orders: 8, spent: 340.50, registeredDate: '10/01/2024' },
        { id: 2, name: 'Carlos López', email: 'carlos@email.com', phone: '55 2345 6789', address: 'Calle Centro 456', orders: 5, spent: 210.80, registeredDate: '15/03/2024' },
        { id: 3, name: 'Ana Martínez', email: 'ana@email.com', phone: '55 3456 7890', address: 'Boulevard Sur 789', orders: 12, spent: 520.30, registeredDate: '02/06/2024' },
        { id: 4, name: 'Pedro Ramírez', email: 'pedro@email.com', phone: '55 4567 8901', address: 'Paseo Norte 321', orders: 3, spent: 95.20, registeredDate: '20/08/2024' },
        { id: 5, name: 'Laura Fernández', email: 'laura@email.com', phone: '55 5678 9012', address: 'Avenida Este 654', orders: 6, spent: 280.00, registeredDate: '05/10/2024' }
    ];

    try {
        const savedClients = localStorage.getItem('delicias_clients');
        clients = savedClients ? JSON.parse(savedClients) : JSON.parse(JSON.stringify(defaultClients));
    } catch (e) {
        clients = JSON.parse(JSON.stringify(defaultClients));
    }

    function saveClients() {
        try {
            localStorage.setItem('delicias_clients', JSON.stringify(clients));
        } catch (e) {
            console.warn('No se pudo guardar los clientes:', e);
        }
    }

    let isLoggedIn = false;
    let isAdmin = false;
    let selectedCategory = 'todas';
    let currentQty = 1;
    let currentProductId = null;
    let editingProductId = null;
    let editingClientId = null;
    let cartOpen = false;

    const cartBadge = document.getElementById('cart-badge');
    const cartTotalBadge = document.getElementById('cart-total-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartToggleBtn = document.getElementById('cart-toggle-btn');

    const pages = {
        inicio: document.getElementById('page-inicio'),
        catalogo: document.getElementById('page-catalogo'),
        admin: document.getElementById('page-admin'),
        nosotros: document.getElementById('page-nosotros'),
        contacto: document.getElementById('page-contacto'),
        detalle: document.getElementById('page-detalle'),
        registro: document.getElementById('page-registro'),
        login: document.getElementById('page-login'),
        perfil: document.getElementById('page-perfil'),
        exito: document.getElementById('page-exito')
    };

    const adminPages = {
        dashboard: document.getElementById('admin-dashboard'),
        productos: document.getElementById('admin-productos'),
        'product-form': document.getElementById('admin-product-form'),
        pedidos: document.getElementById('admin-pedidos'),
        promociones: document.getElementById('admin-promociones'),
        clientes: document.getElementById('admin-clientes'),
        'client-form': document.getElementById('admin-client-form'),
        reportes: document.getElementById('admin-reportes')
    };

    function openCart() {
        if (cartOverlay) {
            cartOverlay.classList.add('open');
        }
        if (cartBackdrop) {
            cartBackdrop.classList.add('show');
        }
        document.body.style.overflow = 'hidden';
        if (cartToggleBtn) {
            cartToggleBtn.setAttribute('aria-expanded', 'true');
        }
        cartOpen = true;
    }

    function closeCart() {
        if (cartOverlay) {
            cartOverlay.classList.remove('open');
        }
        if (cartBackdrop) {
            cartBackdrop.classList.remove('show');
        }
        document.body.style.overflow = '';
        if (cartToggleBtn) {
            cartToggleBtn.setAttribute('aria-expanded', 'false');
        }
        cartOpen = false;
    }

    function toggleCart() {
        if (cartOpen) {
            closeCart();
        } else {
            openCart();
        }
    }

    function processPayment() {
        if (cart.length === 0) return;
        
        const orderItems = cart.map(item => {
            const p = products.find(pr => pr.id === item.productId);
            return { ...item, name: p ? p.name : 'Producto', price: p ? p.price : 0 };
        });
        
        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        closeCart();
        cart = [];
        saveCart();
        updateCartUI();

        const detailsContainer = document.getElementById('success-details');
        let html = '';
        orderItems.forEach(item => {
            html += `<div class="detail-row"><span>${item.quantity} × ${item.name}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>`;
        });
        html += `<div class="detail-row"><span><strong>Total</strong></span><span><strong>$${total.toFixed(2)}</strong></span></div>`;
        detailsContainer.innerHTML = html;

        Object.keys(pages).forEach(key => {
            if (pages[key]) pages[key].classList.remove('active');
        });
        if (pages.exito) pages.exito.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) cartBadge.textContent = totalItems;

        const totalPrice = cart.reduce((sum, item) => {
            const p = products.find(pr => pr.id === item.productId);
            return sum + (p ? p.price * item.quantity : 0);
        }, 0);
        if (cartTotalBadge) cartTotalBadge.textContent = '$' + totalPrice.toFixed(0);

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty" role="status">
                    <i class="fas fa-shopping-basket" aria-hidden="true"></i>
                    <p>Tu carrito está vacío</p>
                    <small>Explora nuestro catálogo y agrega tus productos favoritos</small>
                </div>
            `;
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (cartTotalAmount) cartTotalAmount.textContent = '$0.00';
            return;
        }

        let html = '';
        cart.forEach((item, index) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
            html += `
                <div class="cart-item" data-index="${index}" role="listitem">
                    <div class="cart-item-img">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23ede6f5%22 width=%2260%22 height=%2260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2210%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
                    </div>
                    <div class="cart-item-info">
                        <h4>${product.name}</h4>
                        <span class="item-price">$${product.price.toFixed(2)}</span>
                        <div class="cart-item-qty">
                            <button class="cart-qty-dec" data-index="${index}" aria-label="Disminuir cantidad">−</button>
                            <span>${item.quantity}</span>
                            <button class="cart-qty-inc" data-index="${index}" aria-label="Aumentar cantidad">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" data-index="${index}" aria-label="Eliminar producto"><i class="fas fa-times" aria-hidden="true"></i></button>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = html;

        document.querySelectorAll('.cart-qty-dec').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.getAttribute('data-index'));
                if (cart[idx] && cart[idx].quantity > 1) {
                    cart[idx].quantity--;
                } else {
                    cart.splice(idx, 1);
                }
                saveCart();
                updateCartUI();
            });
        });

        document.querySelectorAll('.cart-qty-inc').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.getAttribute('data-index'));
                if (cart[idx]) {
                    cart[idx].quantity++;
                    saveCart();
                    updateCartUI();
                }
            });
        });

        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.getAttribute('data-index'));
                cart.splice(idx, 1);
                saveCart();
                updateCartUI();
            });
        });

        const total = cart.reduce((sum, item) => {
            const p = products.find(pr => pr.id === item.productId);
            return sum + (p ? p.price * item.quantity : 0);
        }, 0);
        if (cartTotalAmount) cartTotalAmount.textContent = '$' + total.toFixed(2);
        if (checkoutBtn) checkoutBtn.disabled = false;
        saveCart();
    }

    function addToCart(productId, quantity = 1) {
        const existing = cart.find(item => item.productId === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ productId, quantity });
        }
        saveCart();
        updateCartUI();
        
        setTimeout(function() {
            openCart();
        }, 100);
    }

    function showPage(pageId) {
        Object.keys(pages).forEach(key => {
            if (pages[key]) pages[key].classList.remove('active');
        });
        if (pages[pageId]) pages[pageId].classList.add('active');

        document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
            link.classList.remove('active-link');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active-link');
            }
        });

        const socialFloat = document.getElementById('social-float');
        if (socialFloat) {
            socialFloat.style.display = pageId === 'admin' ? 'none' : 'flex';
        }

        if (pageId === 'catalogo') {
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        }

        if (pageId === 'admin') {
            showAdminPage('dashboard');
            updateDashboardStats();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showAdminPage(pageId) {
        Object.keys(adminPages).forEach(key => {
            if (adminPages[key]) {
                adminPages[key].classList.remove('active');
                adminPages[key].classList.add('hidden');
            }
        });
        if (adminPages[pageId]) {
            adminPages[pageId].classList.add('active');
            adminPages[pageId].classList.remove('hidden');
        }

        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-admin-page') === pageId) {
                link.classList.add('active');
            }
        });

        if (pageId === 'productos') renderProductTable();
        if (pageId === 'clientes') renderClientsTable();
        if (pageId === 'dashboard') updateDashboardStats();
    }

    function updateDashboardStats() {
        const total = products.length;
        const outOfStock = products.filter(p => p.status === 'agotado').length;
        const statProducts = document.getElementById('stat-products');
        const statOutOfStock = document.getElementById('stat-out-of-stock');
        if (statProducts) statProducts.textContent = total;
        if (statOutOfStock) statOutOfStock.textContent = outOfStock;
    }

    function updateNavVisibility() {
        const userNavItems = document.querySelectorAll('.user-nav');
        const adminNavItems = document.querySelectorAll('.admin-nav');
        const navLoginBtn = document.getElementById('nav-login-btn');

        if (isAdmin) {
            // Ocultar elementos de usuario normal (incluyendo carrito)
            userNavItems.forEach(el => el.style.display = 'none');
            
            // Mostrar elementos de admin
            adminNavItems.forEach(el => {
                el.style.display = 'list-item';
                el.style.background = 'transparent';
            });
            
            document.body.classList.add('admin-mode');
            
            if (navLoginBtn) {
                navLoginBtn.innerHTML = '<i class="fas fa-user-shield" aria-hidden="true"></i> Admin';
                navLoginBtn.setAttribute('data-page', 'admin');
                // Sin fondo y sin borde morado
                navLoginBtn.style.background = 'transparent';
                navLoginBtn.style.color = '#8b5cf6';
                navLoginBtn.style.padding = '0.3rem 0.8rem';
                navLoginBtn.style.border = 'none';
                navLoginBtn.style.borderRadius = '40px';
                navLoginBtn.style.fontWeight = '600';
                navLoginBtn.style.borderBottom = 'none';
            }
        } else {
            // Mostrar elementos de usuario normal (incluyendo carrito)
            userNavItems.forEach(el => el.style.display = 'list-item');
            
            // Ocultar elementos de admin
            adminNavItems.forEach(el => {
                el.style.display = 'none';
                el.style.background = '';
            });
            
            document.body.classList.remove('admin-mode');
            
            if (isLoggedIn && navLoginBtn) {
                navLoginBtn.innerHTML = '<i class="fas fa-user-circle" aria-hidden="true"></i> Mi Perfil';
                navLoginBtn.setAttribute('data-page', 'perfil');
                navLoginBtn.style.background = '#8b5cf6';
                navLoginBtn.style.color = 'white';
                navLoginBtn.style.border = 'none';
                navLoginBtn.style.borderRadius = '40px';
                navLoginBtn.style.padding = '0.4rem 1rem';
                navLoginBtn.style.borderBottom = 'none';
            } else if (navLoginBtn) {
                navLoginBtn.innerHTML = '<i class="fas fa-user-circle" aria-hidden="true"></i> Iniciar sesión';
                navLoginBtn.setAttribute('data-page', 'login');
                navLoginBtn.style.background = '#ede6f5';
                navLoginBtn.style.color = '#2d1b3d';
                navLoginBtn.style.border = 'none';
                navLoginBtn.style.borderRadius = '40px';
                navLoginBtn.style.padding = '0.4rem 1rem';
                navLoginBtn.style.borderBottom = 'none';
            }
        }
    }

    document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page === 'perfil' && !isLoggedIn) { showPage('login'); return; }
            if (page === 'admin' && !isAdmin) { showPage('login'); return; }
            showPage(page);
        });
    });

    const adminLogoutBtn = document.getElementById('nav-admin-logout');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            isLoggedIn = false;
            isAdmin = false;
            updateNavVisibility();
            showPage('inicio');
            const msg = document.getElementById('profile-message');
            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Has cerrado sesión exitosamente.';
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 3000);
            }
        });
    }

    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-admin-page');
            showAdminPage(page);
        });
    });

    document.querySelectorAll('.auth-link a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.getAttribute('data-page'));
        });
    });

    const heroBtn = document.querySelector('.hero .btn-primary');
    if (heroBtn) {
        heroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('catalogo');
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        });
    }

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleCart();
        });
    }

    const cartCloseBtn = document.getElementById('cart-close-btn');
    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeCart();
        });
    }

    if (cartBackdrop) {
        cartBackdrop.addEventListener('click', function(e) {
            e.preventDefault();
            closeCart();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCart();
            const modal = document.getElementById('login-required-modal');
            if (modal) modal.classList.remove('show');
        }
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) return;
            if (!isLoggedIn) {
                const modal = document.getElementById('login-required-modal');
                if (modal) modal.classList.add('show');
                return;
            }
            processPayment();
        });
    }

    const loginRequiredBtn = document.getElementById('login-required-btn');
    if (loginRequiredBtn) {
        loginRequiredBtn.addEventListener('click', function() {
            const modal = document.getElementById('login-required-modal');
            if (modal) modal.classList.remove('show');
            closeCart();
            showPage('login');
        });
    }

    const loginRequiredCancel = document.getElementById('login-required-cancel');
    if (loginRequiredCancel) {
        loginRequiredCancel.addEventListener('click', function() {
            const modal = document.getElementById('login-required-modal');
            if (modal) modal.classList.remove('show');
        });
    }

    const loginRequiredModal = document.getElementById('login-required-modal');
    if (loginRequiredModal) {
        loginRequiredModal.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('show');
        });
    }

    function buildCategoryMenu() {
        const menu = document.getElementById('category-menu');
        if (!menu) return;
        const categories = ['todas', ...new Set(products.map(p => p.category))];

        menu.innerHTML = categories.map(cat => `
            <button class="category-btn ${cat === selectedCategory ? 'active' : ''}" data-category="${cat}" role="tab" ${cat === selectedCategory ? 'aria-selected="true"' : ''}>
                ${cat === 'todas' ? 'Todas' : cat}
            </button>
        `).join('');

        menu.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                selectedCategory = category;
                menu.querySelectorAll('.category-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                renderCatalog(category);
            });
        });
    }

    function renderCatalog(category = 'todas') {
        const container = document.getElementById('catalog-container');
        if (!container) return;
        let filtered = category === 'todas' ? products : products.filter(p => p.category === category);

        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-results" style="grid-column:1/-1; text-align:center; padding:2rem; color:#6b4f7a;"><i class="fas fa-utensils" style="font-size:2rem; color:#d9c4e8; display:block; margin-bottom:0.8rem;"></i>No hay productos en esta categoría.</div>`;
            return;
        }

        let html = '<div class="catalog-grid">';
        filtered.forEach(p => {
            let badgeHTML = '';
            if (p.badge) {
                const badgeClass = p.badge === 'new' ? 'badge-new' : p.badge === 'offer' ? 'badge-offer' : p.badge === 'popular' ? 'badge-popular' : p.badge === 'vegan' ? 'badge-vegan' : '';
                badgeHTML = `<span class="badge ${badgeClass}">${p.badgeText || p.badge}</span>`;
            }
            html += `
                <div class="product-card" style="position:relative;">
                    ${badgeHTML}
                    <div class="product-img">
                        <img src="${p.image}" alt="${p.name}" class="food-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ede6f5%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2216%22%3E${p.name}%3C/text%3E%3C/svg%3E'">
                    </div>
                    <div class="product-category">${p.category}</div>
                    <h3>${p.name}</h3>
                    <div class="description">${p.desc}</div>
                    <span class="product-price">$${p.price.toFixed(2)}</span>
                    <button class="btn-secondary view-detail-btn" data-id="${p.id}" aria-label="Ver detalle de ${p.name}">Ver detalle</button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.view-detail-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                showDetail(id);
            });
        });
    }

    function showDetail(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        currentProductId = id;
        currentQty = 1;
        const qtyValue = document.getElementById('qty-value');
        if (qtyValue) qtyValue.textContent = currentQty;

        const feedback = document.getElementById('cart-feedback');
        if (feedback) {
            feedback.className = 'cart-feedback';
            feedback.textContent = '';
            feedback.style.display = 'none';
        }

        const title = document.getElementById('detail-title');
        const price = document.getElementById('detail-price');
        const desc = document.getElementById('detail-desc');
        const detailImg = document.getElementById('detail-img');

        if (title) title.textContent = product.name;
        if (price) price.textContent = '$' + product.price.toFixed(2);
        if (desc) desc.textContent = product.desc;

        if (detailImg) {
            detailImg.innerHTML = `<img src="${product.image}" alt="${product.name}" class="food-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ede6f5%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2220%22%3E${product.name}%3C/text%3E%3C/svg%3E'"><div class="img-overlay" aria-hidden="true"></div>`;
        }

        let related = products.filter(p => p.id !== id);
        if (selectedCategory !== 'todas') related = related.filter(p => p.category === selectedCategory);
        related = related.slice(0, 3);

        const relatedGrid = document.getElementById('related-grid');
        if (relatedGrid) {
            if (related.length === 0) {
                relatedGrid.innerHTML = '<p style="color:#6b4f7a; grid-column:1/-1; text-align:center;">No hay productos relacionados.</p>';
            } else {
                relatedGrid.innerHTML = related.map(p => `
                    <div class="related-card" data-id="${p.id}" role="button" tabindex="0">
                        <div class="product-img">
                            <img src="${p.image}" alt="${p.name}" class="food-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ede6f5%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2210%22%3E${p.name}%3C/text%3E%3C/svg%3E'">
                        </div>
                        <h4>${p.name}</h4>
                        <span class="product-price">$${p.price.toFixed(2)}</span>
                        <button class="btn-secondary view-related-btn" data-id="${p.id}" aria-label="Ver detalle de ${p.name}">Ver</button>
                    </div>
                `).join('');

                relatedGrid.querySelectorAll('.view-related-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showDetail(parseInt(this.getAttribute('data-id')));
                    });
                });

                relatedGrid.querySelectorAll('.related-card').forEach(card => {
                    card.addEventListener('click', function() {
                        showDetail(parseInt(this.getAttribute('data-id')));
                    });
                    card.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            showDetail(parseInt(this.getAttribute('data-id')));
                        }
                    });
                });
            }
        }

        showPage('detalle');
    }

    const qtyMinus = document.getElementById('qty-minus');
    if (qtyMinus) {
        qtyMinus.addEventListener('click', function() {
            if (currentQty > 1) {
                currentQty--;
                const qtyValue = document.getElementById('qty-value');
                if (qtyValue) qtyValue.textContent = currentQty;
            }
        });
    }

    const qtyPlus = document.getElementById('qty-plus');
    if (qtyPlus) {
        qtyPlus.addEventListener('click', function() {
            if (currentQty < 20) {
                currentQty++;
                const qtyValue = document.getElementById('qty-value');
                if (qtyValue) qtyValue.textContent = currentQty;
            }
        });
    }

    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            if (currentProductId === null) return;
            const product = products.find(p => p.id === currentProductId);
            if (!product) return;

            addToCart(currentProductId, currentQty);

            const feedback = document.getElementById('cart-feedback');
            const total = (product.price * currentQty).toFixed(2);
            if (feedback) {
                feedback.textContent = `✅ ${currentQty} × "${product.name}" agregado al carrito. Total: $${total}`;
                feedback.style.display = 'block';
                feedback.style.background = '#e8f5e9';
                feedback.style.color = '#2e7d32';
                feedback.style.borderLeftColor = '#4caf50';
            }

            const btn = this;
            btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> ¡Agregado!';
            btn.style.background = '#4caf50';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-shopping-cart" aria-hidden="true"></i> Agregar al carrito';
                btn.style.background = '#8b5cf6';
            }, 2000);

            if (feedback) {
                setTimeout(() => { feedback.style.display = 'none'; }, 4000);
            }
        });
    }

    const backToCatalog = document.getElementById('back-to-catalog');
    if (backToCatalog) {
        backToCatalog.addEventListener('click', function() {
            showPage('catalogo');
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        });
    }

    const successContinueBtn = document.getElementById('success-continue-btn');
    if (successContinueBtn) {
        successContinueBtn.addEventListener('click', function() {
            showPage('catalogo');
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        });
    }

    function renderProductTable() {
        const tbody = document.getElementById('product-table-body');
        if (!tbody) return;
        const searchInput = document.getElementById('product-search');
        const categoryFilter = document.getElementById('category-filter');
        const statusFilter = document.getElementById('status-filter');
        
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const category = categoryFilter ? categoryFilter.value : 'todas';
        const status = statusFilter ? statusFilter.value : 'todos';

        let filtered = products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
            const matchCategory = category === 'todas' || p.category === category;
            const matchStatus = status === 'todos' || p.status === status;
            return matchSearch && matchCategory && matchStatus;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#6b4f7a;">No se encontraron productos</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const statusClass = p.status === 'disponible' ? 'status-available' : p.status === 'agotado' ? 'status-out-of-stock' : 'status-inactive';
            const statusLabel = p.status === 'disponible' ? 'Disponible' : p.status === 'agotado' ? 'Agotado' : 'Inactivo';
            return `
                <tr>
                    <td><div class="product-img-thumb"><img src="${p.image}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23ede6f5%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2210%22%3E${p.name}%3C/text%3E%3C/svg%3E'"></div></td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-edit" data-id="${p.id}" aria-label="Editar ${p.name}"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" data-id="${p.id}" aria-label="Eliminar ${p.name}"><i class="fas fa-trash"></i></button>
                            <button class="btn-view" data-id="${p.id}" aria-label="Ver ${p.name}"><i class="fas fa-eye"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openProductForm(id);
            });
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('¿Estás seguro de eliminar este producto?')) {
                    const idx = products.findIndex(p => p.id === id);
                    if (idx !== -1) {
                        products.splice(idx, 1);
                        saveProducts();
                        renderProductTable();
                        renderCatalog(selectedCategory);
                        updateDashboardStats();
                    }
                }
            });
        });

        tbody.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                showDetail(id);
            });
        });

        updateDashboardStats();
    }

    function openProductForm(id = null) {
        editingProductId = id;
        const title = document.getElementById('form-title');
        const nameInput = document.getElementById('form-product-name');
        const categoryInput = document.getElementById('form-product-category');
        const priceInput = document.getElementById('form-product-price');
        const descInput = document.getElementById('form-product-desc');
        const stockInput = document.getElementById('form-product-stock');
        const statusInput = document.getElementById('form-product-status');
        const imageInput = document.getElementById('form-product-image');

        if (!nameInput) return;

        if (id) {
            const p = products.find(pr => pr.id === id);
            if (!p) return;
            if (title) title.textContent = 'Editar Producto';
            nameInput.value = p.name;
            if (categoryInput) categoryInput.value = p.category;
            if (priceInput) priceInput.value = p.price;
            if (descInput) descInput.value = p.desc;
            if (stockInput) stockInput.value = p.stock;
            if (statusInput) statusInput.value = p.status;
            if (imageInput) imageInput.value = p.image;
            updateImagePreview(p.image);
            const saveBtn = document.getElementById('form-save-btn');
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar';
        } else {
            if (title) title.textContent = 'Agregar Producto';
            nameInput.value = '';
            if (categoryInput) categoryInput.value = 'Pizzas';
            if (priceInput) priceInput.value = '';
            if (descInput) descInput.value = '';
            if (stockInput) stockInput.value = '';
            if (statusInput) statusInput.value = 'disponible';
            if (imageInput) imageInput.value = '';
            const preview = document.getElementById('form-image-preview');
            if (preview) preview.innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
            const saveBtn = document.getElementById('form-save-btn');
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
        }

        const msg = document.getElementById('form-message');
        if (msg) msg.className = 'hidden';
        showAdminPage('product-form');
    }

    function updateImagePreview(imgName) {
        const preview = document.getElementById('form-image-preview');
        if (!preview) return;
        if (imgName) {
            preview.innerHTML = `<img src="${imgName}" alt="Vista previa" onerror="this.parentElement.innerHTML='<div class=\\'empty-preview\\'><i class=\\'fas fa-image\\' style=\\'font-size:1.5rem; display:block; margin-bottom:0.3rem;\\' aria-hidden=\\'true\\'></i>Imagen no encontrada</div>'">`;
        } else {
            preview.innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
        }
    }

    const formImageInput = document.getElementById('form-product-image');
    if (formImageInput) {
        formImageInput.addEventListener('input', function() {
            updateImagePreview(this.value);
        });
    }

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('form-product-name')?.value.trim();
            const category = document.getElementById('form-product-category')?.value;
            const price = parseFloat(document.getElementById('form-product-price')?.value);
            const desc = document.getElementById('form-product-desc')?.value.trim();
            const stock = parseInt(document.getElementById('form-product-stock')?.value) || 0;
            const status = document.getElementById('form-product-status')?.value;
            const image = document.getElementById('form-product-image')?.value.trim() || 'https://via.placeholder.com/200x200/8b5cf6/ffffff?text=Producto';
            const msg = document.getElementById('form-message');

            if (!name || !price) {
                if (msg) {
                    msg.className = 'auth-error';
                    msg.textContent = 'Por favor, completa el nombre y el precio.';
                    msg.classList.remove('hidden');
                }
                return;
            }

            if (editingProductId) {
                const idx = products.findIndex(p => p.id === editingProductId);
                if (idx !== -1) {
                    products[idx] = { ...products[idx], name, category, price, desc, stock, status, image };
                }
            } else {
                const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                products.push({ id: newId, name, category, price, desc, image, badge: null, badgeText: null, stock, status });
            }

            saveProducts();

            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = editingProductId ? 'Producto actualizado correctamente.' : 'Producto agregado correctamente.';
                msg.classList.remove('hidden');
            }

            renderProductTable();
            renderCatalog(selectedCategory);
            updateDashboardStats();

            setTimeout(() => {
                showAdminPage('productos');
            }, 1000);
        });
    }

    const formCancelBtn = document.getElementById('form-cancel-btn');
    if (formCancelBtn) {
        formCancelBtn.addEventListener('click', function() {
            showAdminPage('productos');
        });
    }

    const adminAddProductBtn = document.getElementById('admin-add-product-btn');
    if (adminAddProductBtn) {
        adminAddProductBtn.addEventListener('click', function() {
            openProductForm(null);
        });
    }

    const adminAddProductBtn2 = document.getElementById('admin-add-product-btn2');
    if (adminAddProductBtn2) {
        adminAddProductBtn2.addEventListener('click', function() {
            openProductForm(null);
        });
    }

    const adminViewOrdersBtn = document.getElementById('admin-view-orders-btn');
    if (adminViewOrdersBtn) {
        adminViewOrdersBtn.addEventListener('click', function() {
            showAdminPage('pedidos');
        });
    }

    const adminCreatePromoBtn = document.getElementById('admin-create-promo-btn');
    if (adminCreatePromoBtn) {
        adminCreatePromoBtn.addEventListener('click', function() {
            showAdminPage('promociones');
        });
    }

    const adminCreatePromoBtn2 = document.getElementById('admin-create-promo-btn2');
    if (adminCreatePromoBtn2) {
        adminCreatePromoBtn2.addEventListener('click', function() {
            showAdminPage('promociones');
        });
    }

    const productSearch = document.getElementById('product-search');
    if (productSearch) productSearch.addEventListener('input', renderProductTable);
    
    const categoryFilterSelect = document.getElementById('category-filter');
    if (categoryFilterSelect) categoryFilterSelect.addEventListener('change', renderProductTable);
    
    const statusFilterSelect = document.getElementById('status-filter');
    if (statusFilterSelect) statusFilterSelect.addEventListener('change', renderProductTable);

    const registroBtn = document.getElementById('registro-btn');
    if (registroBtn) {
        registroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('registro-nombre')?.value.trim();
            const email = document.getElementById('registro-email')?.value.trim();
            const password = document.getElementById('registro-password')?.value.trim();
            const msg = document.getElementById('registro-message');

            if (!nombre || !email || !password) {
                if (msg) {
                    msg.className = 'auth-error';
                    msg.textContent = 'Por favor, completa todos los campos.';
                    msg.classList.remove('hidden');
                }
                return;
            }

            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Registro exitoso (simulado).';
                msg.classList.remove('hidden');
            }

            const nombreInput = document.getElementById('registro-nombre');
            const emailInput = document.getElementById('registro-email');
            const passwordInput = document.getElementById('registro-password');
            if (nombreInput) nombreInput.value = '';
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

            setTimeout(() => { showPage('login'); }, 1500);
        });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value.trim();
            const msg = document.getElementById('login-message');

            if (!email || !password) {
                if (msg) {
                    msg.className = 'auth-error';
                    msg.textContent = 'Por favor, ingresa tu correo y contraseña.';
                    msg.classList.remove('hidden');
                }
                return;
            }

            isLoggedIn = true;
            isAdmin = false;
            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Inicio de sesión exitoso.';
                msg.classList.remove('hidden');
            }

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

            setTimeout(() => {
                updateNavVisibility();
                showPage('perfil');
            }, 1500);
        });
    }

    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value.trim();
            const msg = document.getElementById('login-message');

            if (!email || !password) {
                if (msg) {
                    msg.className = 'auth-error';
                    msg.textContent = 'Por favor, ingresa tu correo y contraseña de administrador.';
                    msg.classList.remove('hidden');
                }
                return;
            }

            isLoggedIn = true;
            isAdmin = true;
            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Acceso de administrador concedido.';
                msg.classList.remove('hidden');
            }

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

            setTimeout(() => {
                updateNavVisibility();
                showPage('admin');
            }, 1500);
        });
    }

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const msg = document.getElementById('login-message');
            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Se ha enviado un enlace de restablecimiento (simulado).';
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 4000);
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            isLoggedIn = false;
            isAdmin = false;
            const msg = document.getElementById('profile-message');
            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Has cerrado sesión exitosamente.';
                msg.classList.remove('hidden');
            }
            updateNavVisibility();
            setTimeout(() => {
                if (msg) msg.classList.add('hidden');
                showPage('inicio');
            }, 2000);
        });
    }

    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            const msg = document.getElementById('profile-message');
            if (msg) {
                msg.className = 'auth-success';
                msg.textContent = 'Función de edición de perfil (simulada).';
                msg.classList.remove('hidden');
                setTimeout(() => msg.classList.add('hidden'), 3000);
            }
        });
    }

    const sendContactBtn = document.getElementById('send-contact-btn');
    if (sendContactBtn) {
        sendContactBtn.addEventListener('click', function() {
            const name = document.getElementById('contact-name')?.value.trim();
            const email = document.getElementById('contact-email')?.value.trim();
            const msg = document.getElementById('contact-message')?.value.trim();
            const feedback = document.getElementById('contact-feedback');

            if (!name || !email || !msg) {
                if (feedback) {
                    feedback.className = 'auth-error';
                    feedback.textContent = 'Por favor, completa todos los campos.';
                    feedback.classList.remove('hidden');
                    setTimeout(() => feedback.classList.add('hidden'), 3000);
                }
                return;
            }

            if (feedback) {
                feedback.className = 'auth-success';
                feedback.textContent = 'Mensaje enviado (simulado).';
                feedback.classList.remove('hidden');
            }

            const nameInput = document.getElementById('contact-name');
            const emailInput = document.getElementById('contact-email');
            const msgInput = document.getElementById('contact-message');
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (msgInput) msgInput.value = '';

            if (feedback) {
                setTimeout(() => feedback.classList.add('hidden'), 3500);
            }
        });
    }

    function renderClientsTable() {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#6b4f7a;">No hay clientes registrados</td></tr>`;
            return;
        }

        tbody.innerHTML = clients.map((c, index) => {
            return `
                <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.phone}</td>
                    <td>${c.orders}</td>
                    <td>$${c.spent.toFixed(2)}</td>
                    <td>${c.registeredDate}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-edit" data-index="${index}" aria-label="Editar ${c.name}"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" data-index="${index}" aria-label="Eliminar ${c.name}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                openClientForm(idx);
            });
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                if (confirm(`¿Estás seguro de eliminar a ${clients[idx].name}?`)) {
                    clients.splice(idx, 1);
                    saveClients();
                    renderClientsTable();
                }
            });
        });
    }

    function openClientForm(idx = null) {
        editingClientId = idx;
        const title = document.getElementById('client-form-title');
        const nameInput = document.getElementById('form-client-name');
        const emailInput = document.getElementById('form-client-email');
        const phoneInput = document.getElementById('form-client-phone');
        const addressInput = document.getElementById('form-client-address');

        if (!nameInput) return;

        if (idx !== null && idx >= 0) {
            const c = clients[idx];
            if (title) title.textContent = 'Editar cliente';
            nameInput.value = c.name;
            if (emailInput) emailInput.value = c.email;
            if (phoneInput) phoneInput.value = c.phone;
            if (addressInput) addressInput.value = c.address;
        } else {
            if (title) title.textContent = 'Agregar cliente';
            nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (addressInput) addressInput.value = '';
        }

        showAdminPage('client-form');
    }

    const adminAddClientBtn = document.getElementById('admin-add-client-btn');
    if (adminAddClientBtn) {
        adminAddClientBtn.addEventListener('click', function() {
            openClientForm(null);
        });
    }

    const clientFormSaveBtn = document.getElementById('form-client-save-btn');
    if (clientFormSaveBtn) {
        clientFormSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const name = document.getElementById('form-client-name')?.value.trim();
            const email = document.getElementById('form-client-email')?.value.trim();
            const phone = document.getElementById('form-client-phone')?.value.trim();
            const address = document.getElementById('form-client-address')?.value.trim();
            const msg = document.getElementById('client-form-message');

            if (!name || !email || !phone) {
                if (msg) {
                    msg.className = 'auth-error';
                    msg.textContent = 'Por favor, completa los campos requeridos.';
                    msg.classList.remove('hidden');
                }
                return;
            }

            if (editingClientId !== null && editingClientId >= 0) {
                clients[editingClientId].name = name;
                clients[editingClientId].email = email;
                clients[editingClientId].phone = phone;
                clients[editingClientId].address = address;
                if (msg) {
                    msg.className = 'auth-success';
                    msg.textContent = 'Cliente actualizado correctamente.';
                    msg.classList.remove('hidden');
                }
            } else {
                const newClient = {
                    id: Math.max(...clients.map(c => c.id), 0) + 1,
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    orders: 0,
                    spent: 0,
                    registeredDate: new Date().toLocaleDateString('es-ES')
                };
                clients.push(newClient);
                if (msg) {
                    msg.className = 'auth-success';
                    msg.textContent = 'Cliente creado correctamente.';
                    msg.classList.remove('hidden');
                }
            }

            saveClients();
            setTimeout(() => {
                showAdminPage('clientes');
                renderClientsTable();
                const formMsg = document.getElementById('client-form-message');
                if (formMsg) formMsg.classList.add('hidden');
            }, 1500);
        });
    }

    const clientFormCancelBtn = document.getElementById('form-client-cancel-btn');
    if (clientFormCancelBtn) {
        clientFormCancelBtn.addEventListener('click', function() {
            showAdminPage('clientes');
        });
    }

    buildCategoryMenu();
    renderCatalog(selectedCategory);
    renderProductTable();
    renderClientsTable();
    updateCartUI();
    updateNavVisibility();
    updateDashboardStats();
    showPage('inicio');

    console.log('✅ DeliciasResto inicializado correctamente');
    console.log('Productos cargados:', products.length);
    console.log('Clientes cargados:', clients.length);
    console.log('Items en carrito:', cart.length);

});