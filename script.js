document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // PRODUCTOS
    // ============================================================
    
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
            badgeText: 'Popular', 
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
            badgeText: 'Popular', 
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

    // ============================================================
    // USUARIO ACTUAL
    // ============================================================
    
    let currentUser = {
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+52 55 1234 5678',
        address: 'Calle Principal 123, Colonia Centro',
        memberSince: '2024'
    };

    // ============================================================
    // COMENTARIOS DE LA COMUNIDAD
    // ============================================================
    
    let communityComments = [
        { 
            id: 1, 
            name: 'María García', 
            text: '¡La pizza Margarita es espectacular! La masa crujiente y los ingredientes frescos hacen una combinación perfecta.', 
            date: '15/01/2025 14:30' 
        },
        { 
            id: 2, 
            name: 'Carlos López', 
            text: 'Muy buena atención y la comida llegó caliente. La hamburguesa BBQ estaba deliciosa.', 
            date: '14/01/2025 18:45' 
        },
        { 
            id: 3, 
            name: 'Ana Martínez', 
            text: 'El ceviche de camarón es el mejor que he probado. Fresco, bien sazonado y con una presentación impecable.', 
            date: '13/01/2025 12:20' 
        },
        { 
            id: 4, 
            name: 'Pedro Ramírez', 
            text: 'Buena comida pero el tiempo de entrega fue un poco largo. La ensalada César estaba rica.', 
            date: '12/01/2025 20:10' 
        }
    ];

    let nextCommentId = 5;

    // ============================================================
    // C2C - PUBLICACIONES DE USUARIOS
    // ============================================================
    
    let userPublications = [];
    let nextPublicationId = 1;
    let editingPublicationId = null;

    // ============================================================
    // VARIABLES DE ESTADO
    // ============================================================
    
    let isLoggedIn = false;
    let isAdmin = false;
    let selectedCategory = 'todas';
    let currentQty = 1;
    let currentProductId = null;
    let editingProductId = null;
    let editingClientId = null;
    let cartOpen = false;

    let cart = [];
    let clients = [];
    let orders = [];
    let promociones = [];

    // ============================================================
    // CARGA DE DATOS DESDE LOCALSTORAGE
    // ============================================================

    try {
        const savedProducts = localStorage.getItem('delicias_products');
        products = savedProducts ? JSON.parse(savedProducts) : JSON.parse(JSON.stringify(defaultProducts));
    } catch (e) {
        products = JSON.parse(JSON.stringify(defaultProducts));
    }

    try {
        const savedCart = localStorage.getItem('delicias_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
        cart = [];
    }

    try {
        const savedComments = localStorage.getItem('delicias_comments');
        if (savedComments) {
            communityComments = JSON.parse(savedComments);
            let maxId = 0;
            communityComments.forEach(function(c) {
                if (c.id > maxId) maxId = c.id;
            });
            nextCommentId = maxId + 1;
        }
    } catch (e) {}

    try {
        const savedPublications = localStorage.getItem('delicias_publications');
        if (savedPublications) {
            userPublications = JSON.parse(savedPublications);
            let maxId = 0;
            userPublications.forEach(function(p) {
                if (p.id > maxId) maxId = p.id;
            });
            nextPublicationId = maxId + 1;
        }
    } catch (e) {}

    const defaultClients = [
        { id: 1, name: 'María García', email: 'maria@email.com', phone: '55 1234 5678', address: 'Av. Principal 123', orders: 8, spent: 340.50, registeredDate: '10/01/2024' },
        { id: 2, name: 'Carlos López', email: 'carlos@email.com', phone: '55 2345 6789', address: 'Calle Centro 456', orders: 5, spent: 210.80, registeredDate: '15/03/2024' },
        { id: 3, name: 'Ana Martínez', email: 'ana@email.com', phone: '55 3456 7890', address: 'Boulevard Sur 789', orders: 12, spent: 520.30, registeredDate: '02/06/2024' },
        { id: 4, name: 'Pedro Ramírez', email: 'pedro@email.com', phone: '55 4567 8901', address: 'Paseo Norte 321', orders: 3, spent: 95.20, registeredDate: '20/08/2024' },
        { id: 5, name: 'Laura Fernández', email: 'laura@email.com', phone: '55 5678 9012', address: 'Avenida Este 654', orders: 6, spent: 280.00, registeredDate: '05/10/2024' }
    ];

    const defaultOrders = [
        { id: 125, client: 'María García', products: 'Pizza Margarita (2)', total: 25.00, status: 'entregado', date: '15/01/2025 14:30' },
        { id: 124, client: 'Carlos López', products: 'Hamburguesa Clásica (1)', total: 10.90, status: 'entregado', date: '15/01/2025 13:15' },
        { id: 123, client: 'Ana Martínez', products: 'Salmón a la plancha (1)', total: 18.40, status: 'en preparacion', date: '15/01/2025 12:45' },
        { id: 122, client: 'Pedro Ramírez', products: 'Ceviche de camarón (2)', total: 30.40, status: 'pendiente', date: '15/01/2025 12:00' },
        { id: 121, client: 'Laura Fernández', products: 'Ensalada César (1)', total: 11.80, status: 'entregado', date: '15/01/2025 11:20' }
    ];

    try {
        const savedClients = localStorage.getItem('delicias_clients');
        clients = savedClients ? JSON.parse(savedClients) : JSON.parse(JSON.stringify(defaultClients));
    } catch (e) {
        clients = JSON.parse(JSON.stringify(defaultClients));
    }

    try {
        const savedOrders = localStorage.getItem('delicias_orders');
        orders = savedOrders ? JSON.parse(savedOrders) : JSON.parse(JSON.stringify(defaultOrders));
    } catch (e) {
        orders = JSON.parse(JSON.stringify(defaultOrders));
    }

    try {
        const savedPromos = localStorage.getItem('delicias_promociones');
        promociones = savedPromos ? JSON.parse(savedPromos) : [
            { nombre: 'Oferta de fin de semana', descuento: '20%', productos: 'Pizza Pepperoni, Hamburguesa BBQ', vigencia: '18-20 Ene', estado: 'Activa' },
            { nombre: 'Combo Familiar', descuento: '15%', productos: 'Pizza Margarita + Ensalada César', vigencia: '15-31 Ene', estado: 'Activa' },
            { nombre: '2x1 en bebidas', descuento: '50%', productos: 'Café de especialidad', vigencia: '10-20 Ene', estado: 'Vencida' }
        ];
    } catch (e) {}

    // ============================================================
    // FUNCIONES DE GUARDADO
    // ============================================================

    function saveProducts() {
        try {
            localStorage.setItem('delicias_products', JSON.stringify(products));
        } catch (e) {}
    }

    function saveCart() {
        try {
            localStorage.setItem('delicias_cart', JSON.stringify(cart));
        } catch (e) {}
    }

    function saveComments() {
        try {
            localStorage.setItem('delicias_comments', JSON.stringify(communityComments));
        } catch (e) {}
    }

    function saveClients() {
        try {
            localStorage.setItem('delicias_clients', JSON.stringify(clients));
        } catch (e) {}
    }

    function saveOrders() {
        try {
            localStorage.setItem('delicias_orders', JSON.stringify(orders));
        } catch (e) {}
    }

    function savePromociones() {
        try {
            localStorage.setItem('delicias_promociones', JSON.stringify(promociones));
        } catch (e) {}
    }

    function savePublications() {
        try {
            localStorage.setItem('delicias_publications', JSON.stringify(userPublications));
        } catch (e) {}
    }

    // ============================================================
    // FUNCIONES DE UTILIDAD
    // ============================================================

    function showFormMessage(msgElement, message, type) {
        if (!msgElement) return;
        msgElement.className = type === 'success' ? 'auth-success alert-message' : 'auth-error alert-message';
        msgElement.textContent = message;
        msgElement.classList.remove('hidden');
        
        setTimeout(function() {
            msgElement.classList.add('hidden');
        }, 4000);
    }

    function showConfirmModal(message, callback) {
        var modal = document.getElementById('confirm-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirm-modal';
            modal.className = 'modal-overlay';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-box">
                    <div class="modal-icon" aria-hidden="true"><i class="fas fa-question-circle"></i></div>
                    <h2>Confirmar</h2>
                    <p id="confirm-message">¿Estás seguro?</p>
                    <div style="display:flex; gap:0.8rem; justify-content:center; flex-wrap:wrap; margin-top:0.5rem;">
                        <button class="btn-primary" id="confirm-btn" style="min-width:100px;">Aceptar</button>
                        <button class="btn-secondary" id="confirm-cancel-btn" style="min-width:100px;">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        var messageEl = document.getElementById('confirm-message');
        var confirmBtn = document.getElementById('confirm-btn');
        var cancelBtn = document.getElementById('confirm-cancel-btn');

        messageEl.textContent = message;
        modal.classList.add('show');
        modal.style.display = 'flex';

        var newConfirmBtn = confirmBtn.cloneNode(true);
        var newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newConfirmBtn.addEventListener('click', function() {
            modal.classList.remove('show');
            modal.style.display = 'none';
            if (callback) callback(true);
        });

        newCancelBtn.addEventListener('click', function() {
            modal.classList.remove('show');
            modal.style.display = 'none';
            if (callback) callback(false);
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                if (callback) callback(false);
            }
        });
    }

    // ============================================================
    // NAVEGACIÓN - PÁGINAS
    // ============================================================

    const pages = {
        inicio: document.getElementById('page-inicio'),
        catalogo: document.getElementById('page-catalogo'),
        admin: document.getElementById('page-admin'),
        nosotros: document.getElementById('page-nosotros'),
        contacto: document.getElementById('page-contacto'),
        promociones: document.getElementById('page-promociones'),
        campana: document.getElementById('page-campana'),
        comunidad: document.getElementById('page-comunidad'),
        detalle: document.getElementById('page-detalle'),
        registro: document.getElementById('page-registro'),
        login: document.getElementById('page-login'),
        perfil: document.getElementById('page-perfil'),
        exito: document.getElementById('page-exito'),
        marketplace: document.getElementById('page-marketplace'),
        'publicar-producto': document.getElementById('page-publicar-producto'),
        'mis-publicaciones': document.getElementById('page-mis-publicaciones')
    };

    const adminPages = {
        dashboard: document.getElementById('admin-dashboard'),
        productos: document.getElementById('admin-productos'),
        'product-form': document.getElementById('admin-product-form'),
        pedidos: document.getElementById('admin-pedidos'),
        promociones: document.getElementById('admin-promociones'),
        'promo-form': document.getElementById('admin-promo-form'),
        clientes: document.getElementById('admin-clientes'),
        'client-form': document.getElementById('admin-client-form'),
        reportes: document.getElementById('admin-reportes')
    };

    function showPage(pageId) {
        for (var key in pages) {
            if (pages[key]) pages[key].classList.remove('active');
        }
        if (pages[pageId]) pages[pageId].classList.add('active');

        document.querySelectorAll('.nav-links a[data-page]').forEach(function(link) {
            link.classList.remove('active-link');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active-link');
            }
        });

        var socialFloat = document.getElementById('social-float');
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

        if (pageId === 'perfil') {
            updateProfileUI();
        }

        if (pageId === 'comunidad') {
            renderCommunityComments();
        }

        if (pageId === 'marketplace') {
            renderMarketplace();
            setTimeout(function() {
                var activeTab = document.querySelector('.marketplace-tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'subasta') {
                    iniciarSubasta();
                }
            }, 100);
        }

        if (pageId === 'mis-publicaciones') {
            renderMisPublicaciones();
        }

        if (pageId === 'publicar-producto') {
            if (editingPublicationId === null) {
                document.getElementById('publicar-nombre').value = '';
                document.getElementById('publicar-precio').value = '';
                document.getElementById('publicar-descripcion').value = '';
                document.getElementById('publicar-foto').value = '';
                document.getElementById('publicar-image-preview').innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
                document.getElementById('publicar-btn').innerHTML = '<i class="fas fa-cloud-upload-alt" aria-hidden="true"></i> Publicar producto';
                document.getElementById('publicar-title').textContent = 'Publica tu producto';
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showAdminPage(pageId) {
        for (var key in adminPages) {
            if (adminPages[key]) {
                adminPages[key].classList.remove('active');
                adminPages[key].classList.add('hidden');
            }
        }
        if (adminPages[pageId]) {
            adminPages[pageId].classList.add('active');
            adminPages[pageId].classList.remove('hidden');
        }

        document.querySelectorAll('.sidebar-menu a').forEach(function(link) {
            link.classList.remove('active');
            if (link.getAttribute('data-admin-page') === pageId) {
                link.classList.add('active');
            }
        });

        if (pageId === 'productos') renderProductTable();
        if (pageId === 'clientes') renderClientsTable();
        if (pageId === 'pedidos') renderOrdersTable();
        if (pageId === 'dashboard') updateDashboardStats();
        if (pageId === 'promociones') renderPromotionsAdmin();
    }

    function updateDashboardStats() {
        var total = products.length;
        var outOfStock = 0;
        for (var i = 0; i < products.length; i++) {
            if (products[i].status === 'agotado') outOfStock++;
        }
        var statProducts = document.getElementById('stat-products');
        var statOutOfStock = document.getElementById('stat-out-of-stock');
        if (statProducts) statProducts.textContent = total;
        if (statOutOfStock) statOutOfStock.textContent = outOfStock;
    }

    function updateNavVisibility() {
        var userNavItems = document.querySelectorAll('.user-nav');
        var adminNavItems = document.querySelectorAll('.admin-nav');
        var navLoginBtn = document.getElementById('nav-login-btn');

        if (isAdmin) {
            userNavItems.forEach(function(el) { el.style.display = 'none'; });
            adminNavItems.forEach(function(el) {
                el.style.display = 'list-item';
                el.style.background = 'transparent';
            });
            document.body.classList.add('admin-mode');
            if (navLoginBtn) {
                navLoginBtn.innerHTML = '<i class="fas fa-user-shield" aria-hidden="true"></i> Admin';
                navLoginBtn.setAttribute('data-page', 'admin');
                navLoginBtn.style.background = 'transparent';
                navLoginBtn.style.color = '#8b5cf6';
                navLoginBtn.style.padding = '0.3rem 0.8rem';
                navLoginBtn.style.border = 'none';
                navLoginBtn.style.borderRadius = '40px';
                navLoginBtn.style.fontWeight = '600';
                navLoginBtn.style.borderBottom = 'none';
            }
        } else {
            userNavItems.forEach(function(el) { el.style.display = 'list-item'; });
            adminNavItems.forEach(function(el) {
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

    // ============================================================
    // FUNCIONES DEL CARRITO
    // ============================================================

    const cartBadge = document.getElementById('cart-badge');
    const cartTotalBadge = document.getElementById('cart-total-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartToggleBtn = document.getElementById('cart-toggle-btn');

    function openCart() {
        if (cartOverlay) cartOverlay.classList.add('open');
        if (cartBackdrop) cartBackdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
        if (cartToggleBtn) cartToggleBtn.setAttribute('aria-expanded', 'true');
        cartOpen = true;
    }

    function closeCart() {
        if (cartOverlay) cartOverlay.classList.remove('open');
        if (cartBackdrop) cartBackdrop.classList.remove('show');
        document.body.style.overflow = '';
        if (cartToggleBtn) cartToggleBtn.setAttribute('aria-expanded', 'false');
        cartOpen = false;
    }

    function toggleCart() {
        cartOpen ? closeCart() : openCart();
    }

    function updateCartUI() {
        var totalItems = 0;
        for (var i = 0; i < cart.length; i++) totalItems += cart[i].quantity;
        if (cartBadge) cartBadge.textContent = totalItems;

        var totalPrice = 0;
        for (var j = 0; j < cart.length; j++) {
            var p = products.find(function(pr) { return pr.id === cart[j].productId; });
            if (p) totalPrice += p.price * cart[j].quantity;
        }
        if (cartTotalBadge) cartTotalBadge.textContent = '$' + totalPrice.toFixed(0);

        var clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) clearCartBtn.disabled = cart.length === 0;

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty" role="status"><i class="fas fa-shopping-basket" aria-hidden="true"></i><p>Tu carrito está vacío</p><small>Explora nuestro catálogo y agrega tus productos favoritos</small></div>';
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (cartTotalAmount) cartTotalAmount.textContent = '$0.00';
            return;
        }

        var html = '';
        for (var k = 0; k < cart.length; k++) {
            var product = products.find(function(p) { return p.id === cart[k].productId; });
            if (!product) continue;
            html += '<div class="cart-item" data-index="' + k + '" role="listitem">';
            html += '<div class="cart-item-img"><img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23ede6f5%22 width=%2260%22 height=%2260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2210%22%3E' + product.name + '%3C/text%3E%3C/svg%3E\'"></div>';
            html += '<div class="cart-item-info"><h4>' + product.name + '</h4><span class="item-price">$' + product.price.toFixed(2) + '</span>';
            html += '<div class="cart-item-qty"><button class="cart-qty-dec" data-index="' + k + '" aria-label="Disminuir cantidad">-</button><span>' + cart[k].quantity + '</span><button class="cart-qty-inc" data-index="' + k + '" aria-label="Aumentar cantidad">+</button></div></div>';
            html += '<button class="cart-item-remove" data-index="' + k + '" aria-label="Eliminar producto"><i class="fas fa-times" aria-hidden="true"></i></button></div>';
        }

        cartItemsContainer.innerHTML = html;

        document.querySelectorAll('.cart-qty-dec').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-index'));
                if (cart[idx] && cart[idx].quantity > 1) {
                    cart[idx].quantity--;
                } else {
                    cart.splice(idx, 1);
                }
                saveCart();
                updateCartUI();
            });
        });

        document.querySelectorAll('.cart-qty-inc').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-index'));
                if (cart[idx]) {
                    cart[idx].quantity++;
                    saveCart();
                    updateCartUI();
                }
            });
        });

        document.querySelectorAll('.cart-item-remove').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-index'));
                cart.splice(idx, 1);
                saveCart();
                updateCartUI();
            });
        });

        var total = 0;
        for (var m = 0; m < cart.length; m++) {
            var prod = products.find(function(p) { return p.id === cart[m].productId; });
            if (prod) total += prod.price * cart[m].quantity;
        }
        if (cartTotalAmount) cartTotalAmount.textContent = '$' + total.toFixed(2);
        if (checkoutBtn) checkoutBtn.disabled = false;
        saveCart();
    }

    function addToCart(productId, quantity) {
        if (quantity === undefined) quantity = 1;
        var existing = null;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].productId === productId) {
                existing = cart[i];
                break;
            }
        }
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ productId: productId, quantity: quantity });
        }
        saveCart();
        updateCartUI();
        setTimeout(function() { openCart(); }, 300);
    }

    function clearCart() {
        if (cart.length === 0) return;
        showConfirmModal('¿Estás seguro de que quieres vaciar tu carrito?', function(confirmed) {
            if (confirmed) {
                cart = [];
                saveCart();
                updateCartUI();
                var feedback = document.getElementById('cart-feedback');
                if (feedback) {
                    feedback.textContent = 'Carrito vaciado correctamente.';
                    feedback.style.display = 'block';
                    feedback.style.background = '#fff3e0';
                    feedback.style.color = '#e65100';
                    feedback.style.borderLeftColor = '#ff9800';
                    setTimeout(function() { feedback.style.display = 'none'; }, 3000);
                }
            }
        });
    }

    function processPayment() {
        if (cart.length === 0) return;
        var orderItems = cart.map(function(item) {
            var p = products.find(function(pr) { return pr.id === item.productId; });
            return { ...item, name: p ? p.name : 'Producto', price: p ? p.price : 0 };
        });
        var total = 0;
        for (var i = 0; i < orderItems.length; i++) {
            total += orderItems[i].price * orderItems[i].quantity;
        }
        closeCart();
        cart = [];
        saveCart();
        updateCartUI();

        var detailsContainer = document.getElementById('success-details');
        var html = '';
        for (var j = 0; j < orderItems.length; j++) {
            var item = orderItems[j];
            html += '<div class="detail-row"><span>' + item.quantity + ' x ' + item.name + '</span><span>$' + (item.price * item.quantity).toFixed(2) + '</span></div>';
        }
        html += '<div class="detail-row"><span><strong>Total</strong></span><span><strong>$' + total.toFixed(2) + '</strong></span></div>';
        detailsContainer.innerHTML = html;

        for (var key in pages) {
            if (pages[key]) pages[key].classList.remove('active');
        }
        if (pages.exito) pages.exito.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============================================================
    // FUNCIONES DE CATÁLOGO
    // ============================================================

    function buildCategoryMenu() {
        var menu = document.getElementById('category-menu');
        if (!menu) return;
        var categories = ['todas'];
        for (var i = 0; i < products.length; i++) {
            if (categories.indexOf(products[i].category) === -1) {
                categories.push(products[i].category);
            }
        }

        var html = '';
        for (var j = 0; j < categories.length; j++) {
            var cat = categories[j];
            var activeClass = cat === selectedCategory ? ' active' : '';
            html += '<button class="category-btn' + activeClass + '" data-category="' + cat + '" role="tab" ' + (cat === selectedCategory ? 'aria-selected="true"' : '') + '>' + (cat === 'todas' ? 'Todas' : cat) + '</button>';
        }
        menu.innerHTML = html;

        menu.querySelectorAll('.category-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var category = this.getAttribute('data-category');
                selectedCategory = category;
                menu.querySelectorAll('.category-btn').forEach(function(b) {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                renderCatalog(category);
            });
        });
    }

    function renderCatalog(category) {
        if (category === undefined) category = 'todas';
        var container = document.getElementById('catalog-container');
        if (!container) return;
        var filtered = [];
        for (var i = 0; i < products.length; i++) {
            if (category === 'todas' || products[i].category === category) {
                filtered.push(products[i]);
            }
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-results" style="grid-column:1/-1; text-align:center; padding:2rem; color:#6b4f7a;"><i class="fas fa-utensils" style="font-size:2rem; color:#d9c4e8; display:block; margin-bottom:0.8rem;"></i>No hay productos en esta categoría.</div>';
            return;
        }

        var html = '<div class="catalog-grid">';
        for (var j = 0; j < filtered.length; j++) {
            var p = filtered[j];
            var badgeHTML = '';
            if (p.badge) {
                var badgeClass = p.badge === 'new' ? 'badge-new' : (p.badge === 'offer' ? 'badge-offer' : (p.badge === 'popular' ? 'badge-popular' : (p.badge === 'vegan' ? 'badge-vegan' : '')));
                badgeHTML = '<span class="badge ' + badgeClass + '">' + (p.badgeText || p.badge) + '</span>';
            }
            html += '<div class="product-card" style="position:relative;">';
            html += badgeHTML;
            html += '<div class="product-img"><img src="' + p.image + '" alt="' + p.name + '" class="food-image" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ede6f5%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2216%22%3E' + p.name + '%3C/text%3E%3C/svg%3E\'"></div>';
            html += '<div class="product-category">' + p.category + '</div>';
            html += '<h3>' + p.name + '</h3>';
            html += '<div class="description">' + p.desc + '</div>';
            html += '<span class="product-price">$' + p.price.toFixed(2) + '</span>';
            html += '<button class="btn-secondary view-detail-btn" data-id="' + p.id + '" aria-label="Ver detalle de ' + p.name + '">Ver detalle</button>';
            html += '</div>';
        }
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.view-detail-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                showDetail(id);
            });
        });
    }

    // ============================================================
    // FUNCIONES DE DETALLE DE PRODUCTO
    // ============================================================

    function showDetail(id) {
        var product = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === id) {
                product = products[i];
                break;
            }
        }
        if (!product) return;

        currentProductId = id;
        currentQty = 1;
        var qtyValue = document.getElementById('qty-value');
        if (qtyValue) qtyValue.textContent = currentQty;

        var feedback = document.getElementById('cart-feedback');
        if (feedback) {
            feedback.className = 'cart-feedback';
            feedback.textContent = '';
            feedback.style.display = 'none';
        }

        var title = document.getElementById('detail-title');
        var price = document.getElementById('detail-price');
        var desc = document.getElementById('detail-desc');
        var detailImg = document.getElementById('detail-img');

        if (title) title.textContent = product.name;
        if (price) price.textContent = '$' + product.price.toFixed(2);
        if (desc) desc.textContent = product.desc;

        if (detailImg) {
            detailImg.innerHTML = '<img src="' + product.image + '" alt="' + product.name + '" class="food-image" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ede6f5%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2220%22%3E' + product.name + '%3C/text%3E%3C/svg%3E\'"><div class="img-overlay" aria-hidden="true"></div>';
        }

        var related = [];
        for (var j = 0; j < products.length; j++) {
            if (products[j].id !== id) related.push(products[j]);
        }
        if (selectedCategory !== 'todas') {
            related = related.filter(function(p) { return p.category === selectedCategory; });
        }
        related = related.slice(0, 3);

        var relatedGrid = document.getElementById('related-grid');
        if (relatedGrid) {
            if (related.length === 0) {
                relatedGrid.innerHTML = '<p style="color:#6b4f7a; grid-column:1/-1; text-align:center;">No hay productos relacionados.</p>';
            } else {
                var html = '';
                for (var k = 0; k < related.length; k++) {
                    var p = related[k];
                    html += '<div class="related-card" data-id="' + p.id + '" role="button" tabindex="0">';
                    html += '<div class="product-img"><img src="' + p.image + '" alt="' + p.name + '" class="food-image" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ede6f5%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2210%22%3E' + p.name + '%3C/text%3E%3C/svg%3E\'"></div>';
                    html += '<h4>' + p.name + '</h4>';
                    html += '<span class="product-price">$' + p.price.toFixed(2) + '</span>';
                    html += '<button class="btn-secondary view-related-btn" data-id="' + p.id + '" aria-label="Ver detalle de ' + p.name + '">Ver</button>';
                    html += '</div>';
                }
                relatedGrid.innerHTML = html;

                relatedGrid.querySelectorAll('.view-related-btn').forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showDetail(parseInt(this.getAttribute('data-id')));
                    });
                });

                relatedGrid.querySelectorAll('.related-card').forEach(function(card) {
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

    // ============================================================
    // FUNCIONES DE PERFIL
    // ============================================================

    function updateProfileUI() {
        var avatarText = document.getElementById('profile-avatar-text');
        var profileName = document.getElementById('profile-name');
        var profileEmail = document.getElementById('profile-email');
        var profileFullname = document.getElementById('profile-fullname');
        var profileUserEmail = document.getElementById('profile-user-email');
        var profilePhone = document.getElementById('profile-phone');
        var profileAddress = document.getElementById('profile-address');

        if (avatarText) {
            var initials = currentUser.name.split(' ').map(function(n) { return n[0]; }).join('');
            avatarText.textContent = initials;
        }
        if (profileName) profileName.textContent = currentUser.name;
        if (profileEmail) profileEmail.textContent = currentUser.email;
        if (profileFullname) profileFullname.textContent = currentUser.name;
        if (profileUserEmail) profileUserEmail.textContent = currentUser.email;
        if (profilePhone) profilePhone.textContent = currentUser.phone || '+52 55 1234 5678';
        if (profileAddress) profileAddress.textContent = currentUser.address || 'Calle Principal 123, Colonia Centro';
        renderUserComments();
    }

    function renderUserComments() {
        var container = document.getElementById('profile-comments-list');
        if (!container) return;

        var userComments = communityComments.filter(function(c) {
            return c.name.toLowerCase() === currentUser.name.toLowerCase();
        });

        if (userComments.length === 0) {
            container.innerHTML = '<p style="color:#6b4f7a; font-size:0.9rem; text-align:center; padding:0.5rem;">' +
                '<i class="fas fa-comment-slash" style="color:#d9c4e8; display:block; font-size:1.5rem; margin-bottom:0.5rem;"></i>' +
                'Aún no has publicado comentarios en la comunidad.' +
                '</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < userComments.length; i++) {
            var c = userComments[i];
            html += '<div class="profile-comment-item" style="background:#faf8fc; border-radius:12px; padding:0.8rem; margin-bottom:0.6rem; border:1px solid #ede6f5;">';
            html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">';
            html += '<span style="font-size:0.7rem; color:#6b4f7a;">' + c.date + '</span>';
            html += '</div>';
            html += '<p style="color:#2d1b3d; font-size:0.9rem; margin:0;">' + (c.text || '<em style="color:#999;">[Comentario vacío]</em>') + '</p>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    // ============================================================
    // FUNCIONES DE ADMIN - PRODUCTOS
    // ============================================================

    function renderProductTable() {
        var tbody = document.getElementById('product-table-body');
        if (!tbody) return;
        var searchInput = document.getElementById('product-search');
        var categoryFilter = document.getElementById('category-filter');
        var statusFilter = document.getElementById('status-filter');
        
        var search = searchInput ? searchInput.value.toLowerCase() : '';
        var category = categoryFilter ? categoryFilter.value : 'todas';
        var status = statusFilter ? statusFilter.value : 'todos';

        var filtered = [];
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            var matchSearch = p.name.toLowerCase().indexOf(search) !== -1 || p.category.toLowerCase().indexOf(search) !== -1;
            var matchCategory = category === 'todas' || p.category === category;
            var matchStatus = status === 'todos' || p.status === status;
            if (matchSearch && matchCategory && matchStatus) {
                filtered.push(p);
            }
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#6b4f7a;">No se encontraron productos</td></tr>';
            return;
        }

        var html = '';
        for (var j = 0; j < filtered.length; j++) {
            var p = filtered[j];
            var statusClass = p.status === 'disponible' ? 'status-available' : (p.status === 'agotado' ? 'status-out-of-stock' : 'status-inactive');
            var statusLabel = p.status === 'disponible' ? 'Disponible' : (p.status === 'agotado' ? 'Agotado' : 'Inactivo');
            html += '<tr><td><div class="product-img-thumb"><img src="' + p.image + '" alt="' + p.name + '" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23ede6f5%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%238b5cf6%22 font-family=%22sans-serif%22 font-size=%2210%22%3E' + p.name + '%3C/text%3E%3C/svg%3E\'"></div></td>';
            html += '<td><strong>' + p.name + '</strong></td>';
            html += '<td>' + p.category + '</td>';
            html += '<td>$' + p.price.toFixed(2) + '</td>';
            html += '<td>' + p.stock + '</td>';
            html += '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>';
            html += '<td><div class="table-actions">';
            html += '<button class="btn-edit" data-id="' + p.id + '" aria-label="Editar ' + p.name + '"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-delete" data-id="' + p.id + '" aria-label="Eliminar ' + p.name + '"><i class="fas fa-trash"></i></button>';
            html += '</div></td></tr>';
        }
        tbody.innerHTML = html;

        tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                openProductForm(id);
            });
        });

        tbody.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                var productName = '';
                for (var k = 0; k < products.length; k++) {
                    if (products[k].id === id) { productName = products[k].name; break; }
                }
                if (productName === 'Sin nombre' || productName === '') {
                    productName = 'este producto';
                }
                showConfirmModal('Eliminar el producto "' + productName + '"?', function(confirmed) {
                    if (confirmed) {
                        var idx = -1;
                        for (var k = 0; k < products.length; k++) {
                            if (products[k].id === id) { idx = k; break; }
                        }
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
        });

        updateDashboardStats();
    }

    function openProductForm(id) {
        if (id === undefined) id = null;
        editingProductId = id;
        var title = document.getElementById('form-title');
        var nameInput = document.getElementById('form-product-name');
        var categoryInput = document.getElementById('form-product-category');
        var priceInput = document.getElementById('form-product-price');
        var descInput = document.getElementById('form-product-desc');
        var stockInput = document.getElementById('form-product-stock');
        var statusInput = document.getElementById('form-product-status');
        var imageInput = document.getElementById('form-product-image');
        var msg = document.getElementById('form-message');

        if (!nameInput) return;
        
        if (msg) {
            msg.classList.add('hidden');
            msg.textContent = '';
            msg.className = '';
        }

        if (id) {
            var p = null;
            for (var i = 0; i < products.length; i++) {
                if (products[i].id === id) { p = products[i]; break; }
            }
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
            var saveBtn = document.getElementById('form-save-btn');
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
            var preview = document.getElementById('form-image-preview');
            if (preview) preview.innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
            var saveBtn2 = document.getElementById('form-save-btn');
            if (saveBtn2) saveBtn2.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Guardar';
        }

        showAdminPage('product-form');
    }

    function updateImagePreview(imgName) {
        var preview = document.getElementById('form-image-preview');
        if (!preview) return;
        if (imgName) {
            preview.innerHTML = '<img src="' + imgName + '" alt="Vista previa" onerror="this.parentElement.innerHTML=\'<div class=\\"empty-preview\\"><i class=\\"fas fa-image\\" style=\\"font-size:1.5rem; display:block; margin-bottom:0.3rem;\\" aria-hidden=\\"true\\"></i>Imagen no encontrada</div>\'">';
        } else {
            preview.innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
        }
    }

    // ============================================================
    // FUNCIONES DE ADMIN - CLIENTES
    // ============================================================

    function renderClientsTable() {
        var tbody = document.getElementById('clients-table-body');
        if (!tbody) return;

        if (clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:#6b4f7a;">No hay clientes registrados</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < clients.length; i++) {
            var c = clients[i];
            html += '<tr><td><strong>' + c.name + '</strong></td>';
            html += '<td>' + c.email + '</td>';
            html += '<td>' + c.phone + '</td>';
            html += '<td>' + c.orders + '</td>';
            html += '<td>$' + c.spent.toFixed(2) + '</td>';
            html += '<td>' + c.registeredDate + '</td>';
            html += '<td><div class="table-actions">';
            html += '<button class="btn-edit" data-index="' + i + '" aria-label="Editar ' + c.name + '"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-delete" data-index="' + i + '" aria-label="Eliminar ' + c.name + '"><i class="fas fa-trash"></i></button>';
            html += '</div></td></tr>';
        }
        tbody.innerHTML = html;

        tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-index'));
                openClientForm(idx);
            });
        });

        tbody.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-index'));
                var clientName = (clients[idx] && clients[idx].name && clients[idx].name !== 'Sin nombre') ? clients[idx].name : 'este cliente';
                showConfirmModal('Eliminar a ' + clientName + '?', function(confirmed) {
                    if (confirmed) {
                        clients.splice(idx, 1);
                        saveClients();
                        renderClientsTable();
                    }
                });
            });
        });
    }

    function openClientForm(idx) {
        if (idx === undefined) idx = null;
        editingClientId = idx;
        var title = document.getElementById('client-form-title');
        var nameInput = document.getElementById('form-client-name');
        var emailInput = document.getElementById('form-client-email');
        var phoneInput = document.getElementById('form-client-phone');
        var addressInput = document.getElementById('form-client-address');
        var msg = document.getElementById('client-form-message');

        if (!nameInput) return;
        
        if (msg) {
            msg.classList.add('hidden');
            msg.textContent = '';
            msg.className = '';
        }

        if (idx !== null && idx >= 0) {
            var c = clients[idx];
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

    // ============================================================
    // FUNCIONES DE ADMIN - PEDIDOS
    // ============================================================

    function getOrderStatusClass(status) {
        if (status === 'entregado') return 'status-available';
        if (status === 'en preparacion') return 'status-warning';
        if (status === 'pendiente') return 'status-out-of-stock';
        return 'status-inactive';
    }

    function getNextOrderStatus(status) {
        var orderFlow = ['pendiente', 'en preparacion', 'listo para entregar', 'entregado'];
        var index = orderFlow.indexOf(status);
        return orderFlow[index + 1] || orderFlow[0];
    }

    function renderOrdersTable() {
        var tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:#6b4f7a;">No hay pedidos registrados.</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            var statusClass = getOrderStatusClass(order.status);
            html += '<tr><td>#' + order.id + '</td>';
            html += '<td>' + order.client + '</td>';
            html += '<td>' + order.products + '</td>';
            html += '<td>$' + order.total.toFixed(2) + '</td>';
            html += '<td><span class="status-badge ' + statusClass + '">' + order.status + '</span></td>';
            html += '<td>' + order.date + '</td>';
            html += '<td><button class="btn-secondary order-action-btn" type="button" data-order-id="' + order.id + '">Cambiar estado</button></td></tr>';
        }
        tbody.innerHTML = html;

        tbody.querySelectorAll('.order-action-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var orderId = parseInt(this.getAttribute('data-order-id'));
                var order = null;
                for (var j = 0; j < orders.length; j++) {
                    if (orders[j].id === orderId) { order = orders[j]; break; }
                }
                if (!order) return;
                order.status = getNextOrderStatus(order.status);
                saveOrders();
                renderOrdersTable();
            });
        });
    }

    // ============================================================
    // FUNCIONES DE ADMIN - PROMOCIONES
    // ============================================================

    function renderPromotionsAdmin() {
        var tbody = document.getElementById('promo-table-body-admin');
        if (!tbody) return;

        if (promociones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#6b4f7a;">No hay promociones registradas.</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < promociones.length; i++) {
            var promo = promociones[i];
            var estadoClass = promo.estado === 'Activa' ? 'status-available' : (promo.estado === 'Vencida' ? 'status-out-of-stock' : 'status-warning');
            html += '<tr>';
            html += '<td><strong>' + promo.nombre + '</strong></td>';
            html += '<td>' + promo.descuento + '</td>';
            html += '<td>' + promo.productos + '</td>';
            html += '<td>' + promo.vigencia + '</td>';
            html += '<td><span class="status-badge ' + estadoClass + '">' + promo.estado + '</span></td>';
            html += '<td><div class="table-actions">';
            html += '<button class="btn-edit edit-promo-btn" data-index="' + i + '" aria-label="Editar promoción"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-delete delete-promo-btn" data-index="' + i + '" aria-label="Eliminar promoción"><i class="fas fa-trash"></i></button>';
            html += '</div></td></tr>';
        }
        tbody.innerHTML = html;

        tbody.querySelectorAll('.edit-promo-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'));
                openPromoForm(index);
            });
        });

        tbody.querySelectorAll('.delete-promo-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'));
                var promoName = promociones[index] ? promociones[index].nombre : 'esta promoción';
                if (promoName === 'Sin nombre' || promoName === '') {
                    promoName = 'esta promoción';
                }
                showConfirmModal('Eliminar la promoción "' + promoName + '"?', function(confirmed) {
                    if (confirmed) {
                        promociones.splice(index, 1);
                        savePromociones();
                        renderPromotionsAdmin();
                        renderPublicPromotions();
                    }
                });
            });
        });
    }

    function openPromoForm(index) {
        if (index === undefined) index = -1;
        var form = document.getElementById('admin-promo-form');
        var title = document.getElementById('promo-form-title');
        var msg = document.getElementById('promo-form-message');
        
        if (!form) return;
        
        msg.classList.add('hidden');
        msg.textContent = '';
        msg.className = '';

        if (index === -1) {
            title.textContent = 'Nueva Promoción';
            document.getElementById('promo-form-index').value = '';
            document.getElementById('promo-form-name').value = '';
            document.getElementById('promo-form-discount').value = '';
            document.getElementById('promo-form-products').value = '';
            document.getElementById('promo-form-validity').value = '';
            document.getElementById('promo-form-status').value = 'Activa';
        } else {
            title.textContent = 'Editar Promoción';
            var promo = promociones[index];
            document.getElementById('promo-form-index').value = index;
            document.getElementById('promo-form-name').value = promo.nombre;
            document.getElementById('promo-form-discount').value = promo.descuento;
            document.getElementById('promo-form-products').value = promo.productos;
            document.getElementById('promo-form-validity').value = promo.vigencia;
            document.getElementById('promo-form-status').value = promo.estado;
        }

        showAdminPage('promo-form');
        form.scrollIntoView({ behavior: 'smooth' });
    }

    function savePromoForm() {
        var name = document.getElementById('promo-form-name')?.value;
        var discount = document.getElementById('promo-form-discount')?.value;
        var products = document.getElementById('promo-form-products')?.value;
        var validity = document.getElementById('promo-form-validity')?.value;
        var status = document.getElementById('promo-form-status')?.value;
        var index = document.getElementById('promo-form-index')?.value;
        var msg = document.getElementById('promo-form-message');

        var promoData = { 
            nombre: name || 'Sin nombre', 
            descuento: discount || '0%', 
            productos: products || 'Sin productos', 
            vigencia: validity || 'Sin fecha', 
            estado: status || 'Activa' 
        };

        if (index === '') {
            promociones.push(promoData);
            showFormMessage(msg, 'Promoción creada exitosamente.', 'success');
        } else {
            promociones[parseInt(index)] = promoData;
            showFormMessage(msg, 'Promoción actualizada exitosamente.', 'success');
        }

        savePromociones();
        renderPromotionsAdmin();
        renderPublicPromotions();

        setTimeout(function() {
            showAdminPage('promociones');
        }, 1500);
    }

    function renderPublicPromotions() {
        var grid = document.querySelector('.promo-grid');
        if (!grid) return;

        var publicPromos = promociones.slice(0, 2);
        
        if (publicPromos.length === 0) return;

        var cards = grid.querySelectorAll('.promo-card');
        cards.forEach(function(card, index) {
            if (index < publicPromos.length) {
                var promo = publicPromos[index];
                var badge = card.querySelector('.promo-badge');
                var title = card.querySelector('h3');
                var desc = card.querySelector('p');
                var meta = card.querySelector('.promo-meta');

                if (badge) badge.textContent = promo.descuento;
                if (title) title.textContent = promo.nombre;
                if (desc) desc.textContent = 'Promoción especial: ' + promo.productos;
                if (meta) {
                    meta.innerHTML = '<span><i class="fas fa-clock" aria-hidden="true"></i> ' + promo.vigencia + '</span><span><i class="fas fa-tag" aria-hidden="true"></i> ' + promo.estado + '</span>';
                }
            }
        });
    }

    // ============================================================
    // FUNCIONES DE COMUNIDAD
    // ============================================================

    function renderCommunityComments() {
        var list = document.getElementById('community-comments-list');
        var count = document.getElementById('community-count');
        
        if (!list) return;

        var sortedComments = [...communityComments].sort(function(a, b) {
            return new Date(b.date.split(' ')[0].split('/').reverse().join('-')) - 
                   new Date(a.date.split(' ')[0].split('/').reverse().join('-'));
        });

        if (sortedComments.length === 0) {
            list.innerHTML = '<div class="empty-state" style="text-align:center; padding:2rem; color:#6b4f7a;">' +
                '<i class="fas fa-comment-slash" style="font-size:2rem; color:#d9c4e8; display:block; margin-bottom:0.8rem;"></i>' +
                '<p>No hay comentarios aún. Sé el primero en compartir tu experiencia.</p></div>';
        } else {
            var html = '';
            for (var i = 0; i < sortedComments.length; i++) {
                var c = sortedComments[i];
                html += '<div class="comment-item">';
                html += '<div class="comment-header">';
                html += '<div class="comment-author"><strong>' + c.name + '</strong></div>';
                html += '</div>';
                html += '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">';
                html += '<p style="margin:0.4rem 0 0 0; flex:1;">' + (c.text || '<em style="color:#999;">[Comentario vacío]</em>') + '</p>';
                html += '<span class="comment-date" style="white-space:nowrap;">' + c.date + '</span>';
                html += '</div>';
                html += '</div>';
            }
            list.innerHTML = html;
        }

        if (count) count.textContent = communityComments.length;
    }

    function addCommunityComment(name, text) {
        var now = new Date();
        var dateStr = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear() + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
        
        var newComment = {
            id: nextCommentId++,
            name: name || 'Anónimo',
            text: text || '',
            date: dateStr
        };
        
        communityComments.unshift(newComment);
        saveComments();
        renderCommunityComments();
        
        var feedback = document.getElementById('community-feedback');
        if (feedback) {
            showFormMessage(feedback, '¡Comentario publicado exitosamente!', 'success');
            setTimeout(function() {
                feedback.classList.add('hidden');
            }, 4000);
        }
        return true;
    }

    function publishCommentFromProfile(name, text) {
        var now = new Date();
        var dateStr = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear() + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
        
        var newComment = {
            id: nextCommentId++,
            name: name || 'Anónimo',
            text: text || '',
            date: dateStr
        };
        
        communityComments.unshift(newComment);
        saveComments();
        renderCommunityComments();
        renderUserComments();
        
        var feedback = document.getElementById('profile-comment-feedback');
        if (feedback) {
            showFormMessage(feedback, '¡Comentario publicado en la comunidad!', 'success');
            setTimeout(function() {
                feedback.classList.add('hidden');
            }, 4000);
        }
        return true;
    }

    // ============================================================
    // MARKETPLACE - FUNCIONES
    // ============================================================

    function renderMarketplace() {
        var totalPublicaciones = userPublications.length;
        var totalCompras = 0;
        
        for (var i = 0; i < userPublications.length; i++) {
            if (userPublications[i].compras) {
                totalCompras += userPublications[i].compras;
            }
        }
        
        var resumenPublicaciones = document.getElementById('resumen-publicaciones');
        var resumenCompras = document.getElementById('resumen-compras');
        
        if (resumenPublicaciones) resumenPublicaciones.textContent = totalPublicaciones;
        if (resumenCompras) resumenCompras.textContent = totalCompras;

        var container = document.getElementById('ultimas-publicaciones-list');
        if (!container) return;

        var sorted = [...userPublications].sort(function(a, b) {
            return new Date(b.fecha.split('/').reverse().join('-')) - 
                   new Date(a.fecha.split('/').reverse().join('-'));
        });

        var ultimas = sorted.slice(0, 6);

        var html = '';
        for (var i = 0; i < ultimas.length; i++) {
            var p = ultimas[i];
            html += '<div class="ultima-publicacion" data-id="' + p.id + '">';
            html += '<div class="ultima-img"><img src="' + (p.foto || 'https://via.placeholder.com/200x100/8b5cf6/ffffff?text=Producto') + '" alt="' + p.nombre + '" onerror="this.src=\'https://via.placeholder.com/200x100/8b5cf6/ffffff?text=Producto\'"></div>';
            html += '<div class="ultima-nombre">' + p.nombre + '</div>';
            html += '<div class="ultima-precio">$' + parseFloat(p.precio).toFixed(2) + '</div>';
            html += '<div class="ultima-fecha">' + p.fecha + '</div>';
            html += '<button class="btn-comprar-marketplace comprar-marketplace-btn" data-id="' + p.id + '" data-nombre="' + p.nombre + '" data-precio="' + p.precio + '">';
            html += '<i class="fas fa-shopping-cart" aria-hidden="true"></i> Comprar';
            html += '</button>';
            html += '</div>';
        }
        container.innerHTML = html;

        container.querySelectorAll('.comprar-marketplace-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = parseInt(this.getAttribute('data-id'));
                var nombre = this.getAttribute('data-nombre');
                var precio = parseFloat(this.getAttribute('data-precio'));
                agregarProductoMarketplaceAlCarrito(id, nombre, precio);
            });
        });
    }

    function agregarProductoMarketplaceAlCarrito(id, nombre, precio) {
        var existing = null;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].productId === id) {
                existing = cart[i];
                break;
            }
        }
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ 
                productId: id, 
                quantity: 1,
                nombre: nombre,
                precio: precio,
                esMarketplace: true
            });
        }
        
        saveCart();
        updateCartUI();
        
        var feedback = document.createElement('div');
        feedback.style.cssText = 'position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#4caf50; color:white; padding:12px 24px; border-radius:40px; font-weight:600; z-index:9999; box-shadow:0 4px 20px rgba(0,0,0,0.2); animation:fadeIn 0.3s ease;';
        feedback.textContent = '✅ "' + nombre + '" agregado al carrito';
        document.body.appendChild(feedback);
        
        setTimeout(function() {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.5s ease';
            setTimeout(function() {
                feedback.remove();
            }, 500);
        }, 3000);
        
        setTimeout(function() {
            openCart();
        }, 400);
    }

    // ============================================================
    // C2C - PUBLICAR PRODUCTO (MODIFICADO PARA PERMITIR CAMPOS VACÍOS)
    // ============================================================

    function renderMisPublicaciones() {
        var container = document.getElementById('mis-publicaciones-list');
        var count = document.getElementById('publicaciones-count');
        
        if (!container) return;

        if (userPublications.length === 0) {
            container.innerHTML = '<div class="empty-state" style="text-align:center; padding:2rem; color:#6b4f7a;">' +
                '<i class="fas fa-box-open" style="font-size:2rem; color:#d9c4e8; display:block; margin-bottom:0.8rem;"></i>' +
                '<p>No has publicado ningún producto aún.</p>' +
                '<button class="btn-primary" id="ir-a-publicar-btn" style="margin-top:0.5rem;"><i class="fas fa-plus" aria-hidden="true"></i> Publicar producto</button>' +
                '</div>';
            
            var irBtn = document.getElementById('ir-a-publicar-btn');
            if (irBtn) {
                irBtn.addEventListener('click', function() {
                    showPage('publicar-producto');
                });
            }
            if (count) count.textContent = '0';
            return;
        }

        var html = '';
        for (var i = 0; i < userPublications.length; i++) {
            var p = userPublications[i];
            html += '<div class="publicacion-item" data-id="' + p.id + '">';
            html += '<div class="publicacion-img"><img src="' + (p.foto || 'https://via.placeholder.com/80x80/8b5cf6/ffffff?text=Producto') + '" alt="' + p.nombre + '" onerror="this.src=\'https://via.placeholder.com/80x80/8b5cf6/ffffff?text=Producto\'"></div>';
            html += '<div class="publicacion-info">';
            html += '<h4>' + p.nombre + '</h4>';
            html += '<span class="publicacion-precio">$' + parseFloat(p.precio).toFixed(2) + '</span>';
            html += ' <span class="publicacion-categoria">' + p.categoria + '</span>';
            html += '<p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.2rem;">' + (p.descripcion || '') + '</p>';
            html += '<span style="font-size:0.7rem; color:var(--text-secondary);">Publicado: ' + p.fecha + '</span>';
            html += '</div>';
            html += '<div class="publicacion-actions">';
            html += '<button class="btn-edit-pub" data-id="' + p.id + '" aria-label="Editar"><i class="fas fa-edit"></i> Editar</button>';
            html += '<button class="btn-delete-pub" data-id="' + p.id + '" aria-label="Eliminar"><i class="fas fa-trash"></i> Eliminar</button>';
            html += '</div>';
            html += '</div>';
        }
        container.innerHTML = html;

        if (count) count.textContent = userPublications.length;

        container.querySelectorAll('.btn-edit-pub').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                editarPublicacion(id);
            });
        });

        container.querySelectorAll('.btn-delete-pub').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                eliminarPublicacion(id);
            });
        });
    }

    // FUNCIÓN MODIFICADA: Permite campos vacíos
    function publicarProducto() {
        var nombre = document.getElementById('publicar-nombre')?.value;
        var precio = document.getElementById('publicar-precio')?.value;
        var categoria = document.getElementById('publicar-categoria')?.value || 'Otros';
        var descripcion = document.getElementById('publicar-descripcion')?.value || '';
        var foto = document.getElementById('publicar-foto')?.value || 'https://via.placeholder.com/400x250/8b5cf6/ffffff?text=Producto';
        var msg = document.getElementById('publicar-message');

        // Asignar valores por defecto si están vacíos
        if (!nombre || nombre.trim() === '') {
            nombre = 'Producto sin nombre';
        }
        
        var precioNum = parseFloat(precio);
        if (isNaN(precioNum) || precioNum < 0) {
            precioNum = 0;
        }

        if (!foto) {
            foto = 'https://via.placeholder.com/400x250/8b5cf6/ffffff?text=Producto';
        }

        if (!descripcion) {
            descripcion = '';
        }

        var now = new Date();
        var dateStr = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear();

        var newPublication = {
            id: nextPublicationId++,
            nombre: nombre,
            precio: precioNum,
            categoria: categoria,
            descripcion: descripcion,
            foto: foto,
            fecha: dateStr,
            usuario: currentUser.name || 'Usuario',
            compras: 0
        };

        userPublications.push(newPublication);
        savePublications();
        renderMisPublicaciones();

        showFormMessage(msg, '¡Producto publicado exitosamente!', 'success');

        // Limpiar campos
        document.getElementById('publicar-nombre').value = '';
        document.getElementById('publicar-precio').value = '';
        document.getElementById('publicar-descripcion').value = '';
        document.getElementById('publicar-foto').value = '';
        document.getElementById('publicar-image-preview').innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';

        setTimeout(function() {
            showPage('mis-publicaciones');
        }, 1500);
    }

    // FUNCIÓN MODIFICADA: Maneja valores vacíos en edición
    function editarPublicacion(id) {
        var pub = null;
        for (var i = 0; i < userPublications.length; i++) {
            if (userPublications[i].id === id) {
                pub = userPublications[i];
                break;
            }
        }
        if (!pub) return;

        editingPublicationId = id;
        document.getElementById('publicar-nombre').value = pub.nombre || '';
        document.getElementById('publicar-precio').value = pub.precio || '';
        document.getElementById('publicar-categoria').value = pub.categoria || 'Otros';
        document.getElementById('publicar-descripcion').value = pub.descripcion || '';
        document.getElementById('publicar-foto').value = pub.foto || '';
        
        var preview = document.getElementById('publicar-image-preview');
        if (preview && pub.foto) {
            preview.innerHTML = '<img src="' + pub.foto + '" alt="Vista previa" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML=\'<div class=\\"empty-preview\\"><i class=\\"fas fa-image\\" style=\\"font-size:1.5rem; display:block; margin-bottom:0.3rem;\\" aria-hidden=\\"true\\"></i>Imagen no encontrada</div>\'">';
        }

        var btn = document.getElementById('publicar-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Actualizar producto';
        
        var title = document.getElementById('publicar-title');
        if (title) title.textContent = 'Editar producto';

        showPage('publicar-producto');
    }

    function eliminarPublicacion(id) {
        var pub = null;
        for (var i = 0; i < userPublications.length; i++) {
            if (userPublications[i].id === id) {
                pub = userPublications[i];
                break;
            }
        }
        if (!pub) return;

        showConfirmModal('¿Eliminar la publicación "' + pub.nombre + '"?', function(confirmed) {
            if (confirmed) {
                var idx = -1;
                for (var i = 0; i < userPublications.length; i++) {
                    if (userPublications[i].id === id) {
                        idx = i;
                        break;
                    }
                }
                if (idx !== -1) {
                    userPublications.splice(idx, 1);
                    savePublications();
                    renderMisPublicaciones();
                }
            }
        });
    }

    // ============================================================
    // SUBASTA - FUNCIONALIDAD
    // ============================================================

    let subastaActiva = false;
    let subastaTimerId = null;
    let subastaTiempoRestante = 1800;
    let subastaOfertaActual = 6.00;
    let subastaOfertas = [];

    function iniciarSubasta() {
        subastaActiva = true;
        subastaTiempoRestante = 1800;
        subastaOfertaActual = 6.00;
        subastaOfertas = [];
        
        const ofertaActual = document.getElementById('subasta-oferta-actual-main');
        const temporizador = document.getElementById('subasta-temporizador-main');
        const progreso = document.getElementById('subasta-progreso');
        const ofertasCount = document.getElementById('subasta-ofertas-count-main');
        const inputOferta = document.getElementById('subasta-oferta-main');
        const btnOfertar = document.getElementById('subasta-ofertar-main');
        const listaOfertas = document.getElementById('subasta-lista-ofertas-main');
        const feedback = document.getElementById('subasta-feedback-main');
        
        if (ofertaActual) ofertaActual.textContent = '$6.00';
        if (temporizador) {
            temporizador.textContent = '00:30';
            temporizador.className = 'subasta-temporizador';
        }
        if (progreso) {
            progreso.style.width = '100%';
            progreso.className = 'subasta-temporizador-progreso';
        }
        if (ofertasCount) ofertasCount.textContent = '0';
        if (inputOferta) {
            inputOferta.value = '6.50';
            inputOferta.disabled = false;
        }
        if (btnOfertar) {
            btnOfertar.disabled = false;
            btnOfertar.style.opacity = '1';
            btnOfertar.style.cursor = 'pointer';
        }
        
        if (listaOfertas) {
            listaOfertas.innerHTML = `
                <div class="subasta-sin-ofertas">
                    <i class="fas fa-inbox" aria-hidden="true"></i>
                    <p>No hay ofertas aún. ¡Sé el primero en ofertar!</p>
                </div>
            `;
        }
        
        if (feedback) {
            feedback.style.display = 'none';
            feedback.textContent = '';
            feedback.className = 'subasta-feedback';
        }
        
        iniciarTemporizadorSubasta();
    }

    function iniciarTemporizadorSubasta() {
        if (subastaTimerId) {
            clearInterval(subastaTimerId);
        }
        
        subastaTimerId = setInterval(function() {
            subastaTiempoRestante--;
            actualizarTemporizadorSubasta();
            
            if (subastaTiempoRestante <= 0) {
                clearInterval(subastaTimerId);
                subastaTimerId = null;
                subastaActiva = false;
                
                const inputOferta = document.getElementById('subasta-oferta-main');
                const btnOfertar = document.getElementById('subasta-ofertar-main');
                const feedback = document.getElementById('subasta-feedback-main');
                
                if (inputOferta) inputOferta.disabled = true;
                if (btnOfertar) {
                    btnOfertar.disabled = true;
                    btnOfertar.style.opacity = '0.5';
                    btnOfertar.style.cursor = 'not-allowed';
                }
                
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.textContent = '⏰ ¡Tiempo agotado! La subasta ha finalizado.';
                    feedback.className = 'subasta-feedback error';
                }
            }
        }, 1000);
    }

    function actualizarTemporizadorSubasta() {
        const minutos = Math.floor(subastaTiempoRestante / 60);
        const segundos = subastaTiempoRestante % 60;
        const timerStr = String(minutos).padStart(2, '0') + ':' + String(segundos).padStart(2, '0');
        
        const timerElement = document.getElementById('subasta-temporizador-main');
        const progresoElement = document.getElementById('subasta-progreso');
        
        if (timerElement) timerElement.textContent = timerStr;
        
        const porcentaje = (subastaTiempoRestante / 30) * 100;
        if (progresoElement) progresoElement.style.width = porcentaje + '%';
        
        if (timerElement) {
            timerElement.className = 'subasta-temporizador';
            if (subastaTiempoRestante <= 5) {
                timerElement.classList.add('danger');
            } else if (subastaTiempoRestante <= 10) {
                timerElement.classList.add('warning');
            }
        }
        
        if (progresoElement) {
            progresoElement.className = 'subasta-temporizador-progreso';
            if (subastaTiempoRestante <= 5) {
                progresoElement.classList.add('danger');
            } else if (subastaTiempoRestante <= 10) {
                progresoElement.classList.add('warning');
            }
        }
    }

    function realizarOfertaSubasta() {
        if (!subastaActiva) {
            const feedback = document.getElementById('subasta-feedback-main');
            if (feedback) {
                feedback.style.display = 'block';
                feedback.textContent = '⏰ La subasta ha finalizado.';
                feedback.className = 'subasta-feedback error';
            }
            return;
        }
        
        const input = document.getElementById('subasta-oferta-main');
        const ofertaValor = parseFloat(input ? input.value : 0);
        
        if (isNaN(ofertaValor) || ofertaValor <= 0) {
            const feedback = document.getElementById('subasta-feedback-main');
            if (feedback) {
                feedback.style.display = 'block';
                feedback.textContent = '⚠️ Por favor ingresa una oferta válida mayor a 0.';
                feedback.className = 'subasta-feedback error';
            }
            return;
        }
        
        if (ofertaValor <= subastaOfertaActual) {
            const feedback = document.getElementById('subasta-feedback-main');
            if (feedback) {
                feedback.style.display = 'block';
                feedback.textContent = '⚠️ La oferta debe ser mayor a $' + subastaOfertaActual.toFixed(2);
                feedback.className = 'subasta-feedback error';
            }
            return;
        }
        
        const usuario = isLoggedIn ? (currentUser ? currentUser.name : 'Usuario') : 'Invitado';
        const ahora = new Date();
        const timestamp = ahora.getHours().toString().padStart(2, '0') + ':' + 
                          ahora.getMinutes().toString().padStart(2, '0') + ':' + 
                          ahora.getSeconds().toString().padStart(2, '0');
        
        const nuevaOferta = {
            usuario: usuario,
            monto: ofertaValor,
            timestamp: timestamp
        };
        
        subastaOfertas.push(nuevaOferta);
        subastaOfertaActual = ofertaValor;
        
        const ofertaActual = document.getElementById('subasta-oferta-actual-main');
        const ofertasCount = document.getElementById('subasta-ofertas-count-main');
        
        if (ofertaActual) ofertaActual.textContent = '$' + ofertaValor.toFixed(2);
        if (ofertasCount) ofertasCount.textContent = subastaOfertas.length;
        
        const feedback = document.getElementById('subasta-feedback-main');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.textContent = '✅ ¡Oferta registrada (simulado)! $' + ofertaValor.toFixed(2) + ' - ' + usuario;
            feedback.className = 'subasta-feedback success';
        }
        
        const siguienteOferta = ofertaValor + 0.50;
        if (input) input.value = siguienteOferta.toFixed(2);
        
        actualizarListaOfertasSubasta();
        
        setTimeout(function() {
            if (feedback) {
                feedback.style.display = 'none';
            }
        }, 3000);
    }

    function actualizarListaOfertasSubasta() {
        const lista = document.getElementById('subasta-lista-ofertas-main');
        
        if (!lista) return;
        
        if (subastaOfertas.length === 0) {
            lista.innerHTML = `
                <div class="subasta-sin-ofertas">
                    <i class="fas fa-inbox" aria-hidden="true"></i>
                    <p>No hay ofertas aún. ¡Sé el primero en ofertar!</p>
                </div>
            `;
            return;
        }
        
        const ofertasOrdenadas = [...subastaOfertas].reverse();
        
        let html = '';
        for (let i = 0; i < ofertasOrdenadas.length; i++) {
            const oferta = ofertasOrdenadas[i];
            const esMayor = i === 0;
            let claseItem = 'subasta-oferta-item';
            if (esMayor) claseItem += ' highest';
            
            const icono = esMayor ? '<i class="fas fa-crown" aria-hidden="true"></i> ' : '';
            
            html += '<div class="' + claseItem + '">';
            html += '<span class="oferta-usuario">' + icono + oferta.usuario + '</span>';
            html += '<span class="oferta-monto">$' + oferta.monto.toFixed(2) + '</span>';
            html += '<span class="oferta-timestamp">' + oferta.timestamp + '</span>';
            html += '</div>';
        }
        
        lista.innerHTML = html;
    }

    // ============================================================
    // EVENT LISTENERS - MARKETPLACE TABS
    // ============================================================

    document.querySelectorAll('.marketplace-tab').forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.marketplace-tab').forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.marketplace-tab-content').forEach(function(content) {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById('marketplace-' + tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            if (tabName === 'subasta') {
                iniciarSubasta();
            }
        });
    });

    const btnOfertar = document.getElementById('subasta-ofertar-main');
    if (btnOfertar) {
        btnOfertar.addEventListener('click', function(e) {
            e.preventDefault();
            realizarOfertaSubasta();
        });
    }

    const inputOferta = document.getElementById('subasta-oferta-main');
    if (inputOferta) {
        inputOferta.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                realizarOfertaSubasta();
            }
        });
    }

    // ============================================================
    // EVENT LISTENERS - NAVEGACIÓN
    // ============================================================

    document.querySelectorAll('.nav-links a[data-page]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.getAttribute('data-page');
            if (page === 'perfil' && !isLoggedIn) { showPage('login'); return; }
            if (page === 'admin' && !isAdmin) { showPage('login'); return; }
            showPage(page);
        });
    });

    document.querySelectorAll('.sidebar-menu a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.getAttribute('data-admin-page');
            showAdminPage(page);
        });
    });

    document.querySelectorAll('.auth-link a[data-page]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.getAttribute('data-page'));
        });
    });

    var heroBtn = document.querySelector('.hero .btn-primary');
    if (heroBtn) {
        heroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('catalogo');
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        });
    }

    // ============================================================
    // EVENT LISTENERS - CARRITO
    // ============================================================

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleCart();
        });
    }

    var cartCloseBtn = document.getElementById('cart-close-btn');
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

    var clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearCart();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCart();
            var confirmModal = document.getElementById('confirm-modal');
            if (confirmModal && confirmModal.classList.contains('show')) {
                confirmModal.classList.remove('show');
                confirmModal.style.display = 'none';
            }
        }
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) return;
            processPayment();
        });
    }

    // ============================================================
    // EVENT LISTENERS - DETALLE DE PRODUCTO
    // ============================================================

    var qtyMinus = document.getElementById('qty-minus');
    if (qtyMinus) {
        qtyMinus.addEventListener('click', function() {
            if (currentQty > 1) {
                currentQty--;
                var qtyValue = document.getElementById('qty-value');
                if (qtyValue) qtyValue.textContent = currentQty;
            }
        });
    }

    var qtyPlus = document.getElementById('qty-plus');
    if (qtyPlus) {
        qtyPlus.addEventListener('click', function() {
            if (currentQty < 20) {
                currentQty++;
                var qtyValue = document.getElementById('qty-value');
                if (qtyValue) qtyValue.textContent = currentQty;
            }
        });
    }

    var addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            if (currentProductId === null) return;
            var product = null;
            for (var i = 0; i < products.length; i++) {
                if (products[i].id === currentProductId) {
                    product = products[i];
                    break;
                }
            }
            if (!product) return;

            addToCart(currentProductId, currentQty);

            var feedback = document.getElementById('cart-feedback');
            var total = (product.price * currentQty).toFixed(2);
            if (feedback) {
                feedback.textContent = currentQty + ' x "' + product.name + '" agregado al carrito. Total: $' + total;
                feedback.style.display = 'block';
                feedback.style.background = '#e8f5e9';
                feedback.style.color = '#2e7d32';
                feedback.style.borderLeftColor = '#4caf50';
            }

            var btn = this;
            btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Agregado!';
            btn.style.background = '#4caf50';
            setTimeout(function() {
                btn.innerHTML = '<i class="fas fa-shopping-cart" aria-hidden="true"></i> Agregar al carrito';
                btn.style.background = '#8b5cf6';
            }, 2000);

            if (feedback) {
                setTimeout(function() { feedback.style.display = 'none'; }, 4000);
            }
        });
    }

    var backToCatalog = document.getElementById('back-to-catalog');
    if (backToCatalog) {
        backToCatalog.addEventListener('click', function() {
            showPage('catalogo');
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        });
    }

    var successContinueBtn = document.getElementById('success-continue-btn');
    if (successContinueBtn) {
        successContinueBtn.addEventListener('click', function() {
            showPage('catalogo');
            buildCategoryMenu();
            renderCatalog(selectedCategory);
        });
    }

    // ============================================================
    // EVENT LISTENERS - ADMIN PRODUCTOS
    // ============================================================

    var formImageInput = document.getElementById('form-product-image');
    if (formImageInput) {
        formImageInput.addEventListener('input', function() {
            updateImagePreview(this.value);
        });
    }

    var productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var name = document.getElementById('form-product-name')?.value || 'Sin nombre';
            var category = document.getElementById('form-product-category')?.value || 'Pizzas';
            var price = parseFloat(document.getElementById('form-product-price')?.value) || 0;
            var desc = document.getElementById('form-product-desc')?.value || 'Sin descripción';
            var stock = parseInt(document.getElementById('form-product-stock')?.value) || 0;
            var status = document.getElementById('form-product-status')?.value || 'disponible';
            var image = document.getElementById('form-product-image')?.value || 'https://via.placeholder.com/200x200/8b5cf6/ffffff?text=Producto';
            var msg = document.getElementById('form-message');

            if (editingProductId) {
                var idx = -1;
                for (var i = 0; i < products.length; i++) {
                    if (products[i].id === editingProductId) { idx = i; break; }
                }
                if (idx !== -1) {
                    products[idx] = { ...products[idx], name: name, category: category, price: price, desc: desc, stock: stock, status: status, image: image };
                }
                showFormMessage(msg, 'Producto actualizado correctamente.', 'success');
            } else {
                var newId = 0;
                for (var j = 0; j < products.length; j++) {
                    if (products[j].id > newId) newId = products[j].id;
                }
                newId++;
                products.push({ id: newId, name: name, category: category, price: price, desc: desc, image: image, badge: null, badgeText: null, stock: stock, status: status });
                showFormMessage(msg, 'Producto agregado correctamente.', 'success');
            }

            saveProducts();
            renderProductTable();
            renderCatalog(selectedCategory);
            updateDashboardStats();

            setTimeout(function() {
                showAdminPage('productos');
            }, 1500);
        });
    }

    var formCancelBtn = document.getElementById('form-cancel-btn');
    if (formCancelBtn) {
        formCancelBtn.addEventListener('click', function() {
            showAdminPage('productos');
        });
    }

    var adminAddProductBtn = document.getElementById('admin-add-product-btn');
    if (adminAddProductBtn) {
        adminAddProductBtn.addEventListener('click', function() {
            openProductForm(null);
        });
    }

    var adminAddProductBtn2 = document.getElementById('admin-add-product-btn2');
    if (adminAddProductBtn2) {
        adminAddProductBtn2.addEventListener('click', function() {
            openProductForm(null);
        });
    }

    var adminViewOrdersBtn = document.getElementById('admin-view-orders-btn');
    if (adminViewOrdersBtn) {
        adminViewOrdersBtn.addEventListener('click', function() {
            showAdminPage('pedidos');
        });
    }

    var adminCreatePromoBtn = document.getElementById('admin-create-promo-btn');
    if (adminCreatePromoBtn) {
        adminCreatePromoBtn.addEventListener('click', function() {
            showAdminPage('promociones');
            renderPromotionsAdmin();
        });
    }

    var adminCreatePromoBtn2 = document.getElementById('admin-create-promo-btn2');
    if (adminCreatePromoBtn2) {
        adminCreatePromoBtn2.addEventListener('click', function() {
            openPromoForm(-1);
        });
    }

    var promoFormSaveBtn = document.getElementById('promo-form-save-btn');
    if (promoFormSaveBtn) {
        promoFormSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            savePromoForm();
        });
    }

    var promoFormCancelBtn = document.getElementById('promo-form-cancel-btn');
    if (promoFormCancelBtn) {
        promoFormCancelBtn.addEventListener('click', function() {
            showAdminPage('promociones');
        });
    }

    // ============================================================
    // EVENT LISTENERS - ADMIN CLIENTES
    // ============================================================

    var adminAddClientBtn = document.getElementById('admin-add-client-btn');
    if (adminAddClientBtn) {
        adminAddClientBtn.addEventListener('click', function() {
            openClientForm(null);
        });
    }

    var clientFormSaveBtn = document.getElementById('form-client-save-btn');
    if (clientFormSaveBtn) {
        clientFormSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var name = document.getElementById('form-client-name')?.value || 'Sin nombre';
            var email = document.getElementById('form-client-email')?.value || 'Sin email';
            var phone = document.getElementById('form-client-phone')?.value || 'Sin teléfono';
            var address = document.getElementById('form-client-address')?.value || 'Sin dirección';
            var msg = document.getElementById('client-form-message');

            if (editingClientId !== null && editingClientId >= 0) {
                clients[editingClientId].name = name;
                clients[editingClientId].email = email;
                clients[editingClientId].phone = phone;
                clients[editingClientId].address = address;
                showFormMessage(msg, 'Cliente actualizado correctamente.', 'success');
            } else {
                var newId = 0;
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].id > newId) newId = clients[i].id;
                }
                newId++;
                var newClient = {
                    id: newId,
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    orders: 0,
                    spent: 0,
                    registeredDate: new Date().toLocaleDateString('es-ES')
                };
                clients.push(newClient);
                showFormMessage(msg, 'Cliente creado correctamente.', 'success');
            }

            saveClients();
            setTimeout(function() {
                showAdminPage('clientes');
                renderClientsTable();
            }, 1500);
        });
    }

    var clientFormCancelBtn = document.getElementById('form-client-cancel-btn');
    if (clientFormCancelBtn) {
        clientFormCancelBtn.addEventListener('click', function() {
            showAdminPage('clientes');
        });
    }

    // ============================================================
    // EVENT LISTENERS - AUTH
    // ============================================================

    var registroBtn = document.getElementById('registro-btn');
    if (registroBtn) {
        registroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var msg = document.getElementById('registro-message');
            if (msg) showFormMessage(msg, 'Registro exitoso (simulado).', 'success');
            document.getElementById('registro-nombre').value = '';
            document.getElementById('registro-email').value = '';
            document.getElementById('registro-password').value = '';
            setTimeout(function() { showPage('login'); }, 1500);
        });
    }

    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var msg = document.getElementById('login-message');
            isLoggedIn = true;
            isAdmin = false;
            if (msg) showFormMessage(msg, 'Inicio de sesión exitoso.', 'success');
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            setTimeout(function() {
                updateNavVisibility();
                showPage('perfil');
            }, 1500);
        });
    }

    var adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var msg = document.getElementById('login-message');
            isLoggedIn = true;
            isAdmin = true;
            if (msg) showFormMessage(msg, 'Acceso de administrador concedido.', 'success');
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            setTimeout(function() {
                updateNavVisibility();
                showPage('admin');
            }, 1500);
        });
    }

    var forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            var msg = document.getElementById('login-message');
            if (msg) showFormMessage(msg, 'Se ha enviado un enlace de restablecimiento (simulado).', 'success');
        });
    }

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            isLoggedIn = false;
            isAdmin = false;
            var msg = document.getElementById('profile-message');
            if (msg) showFormMessage(msg, 'Has cerrado sesión exitosamente.', 'success');
            updateNavVisibility();
            setTimeout(function() {
                if (msg) msg.classList.add('hidden');
                showPage('inicio');
            }, 2000);
        });
    }

    var adminLogoutBtn = document.getElementById('nav-admin-logout');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            isLoggedIn = false;
            isAdmin = false;
            updateNavVisibility();
            showPage('inicio');
        });
    }

    var editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            var msg = document.getElementById('profile-message');
            if (msg) showFormMessage(msg, 'Función de edición de perfil (simulada).', 'success');
        });
    }

    // ============================================================
    // EVENT LISTENERS - CONTACTO
    // ============================================================

    var sendContactBtn = document.getElementById('send-contact-btn');
    if (sendContactBtn) {
        sendContactBtn.addEventListener('click', function() {
            var feedback = document.getElementById('contact-feedback');
            if (feedback) showFormMessage(feedback, 'Mensaje enviado (simulado).', 'success');
            document.getElementById('contact-name').value = '';
            document.getElementById('contact-email').value = '';
            document.getElementById('contact-message').value = '';
        });
    }

    // ============================================================
    // EVENT LISTENERS - PROMOCIONES
    // ============================================================

    var promoApplyBtn = document.getElementById('apply-promo-btn');
    var promoFeedback = document.getElementById('promo-feedback');
    var promoTotal = document.getElementById('promo-total');
    var promoDiscount = document.getElementById('promo-discount');

    if (promoApplyBtn) {
        promoApplyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (promoFeedback) {
                promoFeedback.textContent = 'Descuento aplicado (simulado)';
                promoFeedback.className = 'promo-feedback success';
            }
            if (promoTotal) promoTotal.textContent = '$21.60';
            if (promoDiscount) promoDiscount.textContent = 'Ahorro 10%';
        });
    }

    // ============================================================
    // EVENT LISTENERS - COMUNIDAD
    // ============================================================

    var communityForm = document.getElementById('community-form');
    if (communityForm) {
        communityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameInput = document.getElementById('community-name');
            var commentInput = document.getElementById('community-comment');
            var name = nameInput ? (nameInput.value.trim() || 'Anónimo') : 'Anónimo';
            var text = commentInput ? commentInput.value : '';
            addCommunityComment(name, text);
            if (nameInput) nameInput.value = '';
            if (commentInput) commentInput.value = '';
        });
    }

    // ============================================================
    // EVENT LISTENERS - PERFIL (PUBLICAR COMENTARIO)
    // ============================================================

    var profileCommentForm = document.getElementById('profile-comment-form');
    if (profileCommentForm) {
        profileCommentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var textInput = document.getElementById('profile-comment-text');
            var text = textInput ? textInput.value : '';
            var userName = currentUser && currentUser.name ? currentUser.name : 'Anónimo';
            publishCommentFromProfile(userName, text);
            if (textInput) textInput.value = '';
        });
    }

    // ============================================================
    // EVENT LISTENERS - PERFIL (BOTONES MARKETPLACE)
    // ============================================================

    var profilePublicarBtn = document.getElementById('profile-publicar-btn');
    if (profilePublicarBtn) {
        profilePublicarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            editingPublicationId = null;
            document.getElementById('publicar-nombre').value = '';
            document.getElementById('publicar-precio').value = '';
            document.getElementById('publicar-descripcion').value = '';
            document.getElementById('publicar-foto').value = '';
            document.getElementById('publicar-image-preview').innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
            document.getElementById('publicar-btn').innerHTML = '<i class="fas fa-cloud-upload-alt" aria-hidden="true"></i> Publicar producto';
            document.getElementById('publicar-title').textContent = 'Publica tu producto';
            showPage('publicar-producto');
        });
    }

    var profileMisPublicacionesBtn = document.getElementById('profile-mis-publicaciones-btn');
    if (profileMisPublicacionesBtn) {
        profileMisPublicacionesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            renderMisPublicaciones();
            showPage('mis-publicaciones');
        });
    }

    // ============================================================
    // EVENT LISTENERS - C2C PUBLICAR PRODUCTO (MODIFICADO)
    // ============================================================

    var publicarForm = document.getElementById('publicar-form');
    if (publicarForm) {
        publicarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (editingPublicationId !== null) {
                var pub = null;
                for (var i = 0; i < userPublications.length; i++) {
                    if (userPublications[i].id === editingPublicationId) {
                        pub = userPublications[i];
                        break;
                    }
                }
                if (pub) {
                    var nombre = document.getElementById('publicar-nombre').value;
                    var precio = document.getElementById('publicar-precio').value;
                    var categoria = document.getElementById('publicar-categoria').value;
                    var descripcion = document.getElementById('publicar-descripcion').value;
                    var foto = document.getElementById('publicar-foto').value;
                    
                    // Asignar valores por defecto si están vacíos
                    pub.nombre = (nombre && nombre.trim() !== '') ? nombre : 'Producto sin nombre';
                    var precioNum = parseFloat(precio);
                    pub.precio = !isNaN(precioNum) && precioNum >= 0 ? precioNum : 0;
                    pub.categoria = categoria || 'Otros';
                    pub.descripcion = descripcion || '';
                    pub.foto = foto || 'https://via.placeholder.com/400x250/8b5cf6/ffffff?text=Producto';
                    
                    savePublications();
                    renderMisPublicaciones();
                    
                    var msg = document.getElementById('publicar-message');
                    showFormMessage(msg, '¡Producto actualizado exitosamente!', 'success');
                    
                    editingPublicationId = null;
                    document.getElementById('publicar-btn').innerHTML = '<i class="fas fa-cloud-upload-alt" aria-hidden="true"></i> Publicar producto';
                    document.getElementById('publicar-title').textContent = 'Publica tu producto';
                    
                    setTimeout(function() {
                        showPage('mis-publicaciones');
                    }, 1500);
                }
            } else {
                publicarProducto();
            }
        });
    }

    // ============================================================
    // EVENT LISTENERS - C2C VISTA PREVIA DE IMAGEN
    // ============================================================

    var publicarFotoInput = document.getElementById('publicar-foto');
    if (publicarFotoInput) {
        publicarFotoInput.addEventListener('input', function() {
            var preview = document.getElementById('publicar-image-preview');
            if (preview && this.value) {
                preview.innerHTML = '<img src="' + this.value + '" alt="Vista previa" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML=\'<div class=\\"empty-preview\\"><i class=\\"fas fa-image\\" style=\\"font-size:1.5rem; display:block; margin-bottom:0.3rem;\\" aria-hidden=\\"true\\"></i>Imagen no encontrada</div>\'">';
            } else if (preview) {
                preview.innerHTML = '<div class="empty-preview"><i class="fas fa-image" style="font-size:1.5rem; display:block; margin-bottom:0.3rem;" aria-hidden="true"></i>Vista previa</div>';
            }
        });
    }

    // ============================================================
    // EVENT LISTENERS - CAMPAÑA
    // ============================================================

    var campaignBuyBtn = document.getElementById('campaign-buy-btn');
    if (campaignBuyBtn) {
        campaignBuyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addCampaignProductToCart();
        });
    }

    var campaignPromoBtn = document.getElementById('campaign-promo-btn');
    if (campaignPromoBtn) {
        campaignPromoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goToPromotions();
        });
    }

    // ============================================================
    // EVENT LISTENERS - PERFIL (IR A COMUNIDAD)
    // ============================================================

    var goToCommunityBtn = document.getElementById('go-to-community-btn');
    if (goToCommunityBtn) {
        goToCommunityBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('comunidad');
        });
    }

    // ============================================================
    // FUNCIONES DE CAMPAÑA
    // ============================================================

    function addCampaignProductToCart() {
        var campaignProduct = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].name === 'Pizza Pepperoni' || products[i].id === 2) {
                campaignProduct = products[i];
                break;
            }
        }
        
        if (!campaignProduct) {
            for (var i = 0; i < products.length; i++) {
                if (products[i].name.toLowerCase().includes('pepperoni')) {
                    campaignProduct = products[i];
                    break;
                }
            }
        }
        
        if (!campaignProduct && products.length > 0) {
            campaignProduct = products[0];
        }
        
        if (!campaignProduct) {
            var feedback = document.getElementById('campaign-feedback');
            if (feedback) {
                feedback.textContent = 'No hay productos disponibles en el catálogo.';
                feedback.style.display = 'block';
                feedback.style.background = '#fce4ec';
                feedback.style.color = '#c62828';
                feedback.style.borderLeftColor = '#e53935';
                setTimeout(function() { feedback.style.display = 'none'; }, 4000);
            }
            return;
        }
        
        var existing = null;
        for (var j = 0; j < cart.length; j++) {
            if (cart[j].productId === campaignProduct.id) {
                existing = cart[j];
                break;
            }
        }
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ productId: campaignProduct.id, quantity: 1 });
        }
        
        saveCart();
        updateCartUI();
        
        var feedback = document.getElementById('campaign-feedback');
        if (feedback) {
            feedback.textContent = '✅ "' + campaignProduct.name + '" agregado al carrito.';
            feedback.style.display = 'block';
            feedback.style.background = '#e8f5e9';
            feedback.style.color = '#2e7d32';
            feedback.style.borderLeftColor = '#4caf50';
            setTimeout(function() { feedback.style.display = 'none'; }, 4000);
        }
        
        setTimeout(function() {
            openCart();
        }, 300);
    }

    function goToPromotions() {
        showPage('promociones');
    }

    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    buildCategoryMenu();
    renderCatalog(selectedCategory);
    renderProductTable();
    renderClientsTable();
    renderOrdersTable();
    renderPromotionsAdmin();
    renderPublicPromotions();
    renderCommunityComments();
    renderMisPublicaciones();
    renderMarketplace();
    updateCartUI();
    updateNavVisibility();
    updateDashboardStats();
    showPage('inicio');

});