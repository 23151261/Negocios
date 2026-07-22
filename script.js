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
            date: '15/01/2025 14:30',
            edited: false 
        },
        { 
            id: 2, 
            name: 'Carlos López', 
            text: 'Muy buena atención y la comida llegó caliente. La hamburguesa BBQ estaba deliciosa.', 
            date: '14/01/2025 18:45',
            edited: false 
        },
        { 
            id: 3, 
            name: 'Ana Martínez', 
            text: 'El ceviche de camarón es el mejor que he probado. Fresco, bien sazonado y con una presentación impecable.', 
            date: '13/01/2025 12:20',
            edited: false 
        },
        { 
            id: 4, 
            name: 'Pedro Ramírez', 
            text: 'Buena comida pero el tiempo de entrega fue un poco largo. La ensalada César estaba rica.', 
            date: '12/01/2025 20:10',
            edited: false 
        },
        { 
            id: 5, 
            name: 'Juan Pérez', 
            text: 'Excelente servicio, la pizza llegó caliente y muy sabrosa. ¡La recomiendo al 100%!', 
            date: '16/01/2025 19:30',
            edited: false 
        },
        { 
            id: 6, 
            name: 'Juan Pérez', 
            text: 'El salmón a la plancha estaba en su punto, jugoso y con un sabor increíble. Volveré a pedir.', 
            date: '17/01/2025 13:15',
            edited: false 
        }
    ];

    let nextCommentId = 7;

    // ============================================================
    // C2C - PUBLICACIONES DE USUARIOS
    // ============================================================
    
    let userPublications = [
        { 
            id: 1, 
            nombre: 'Pizza Hawaiana Casera', 
            precio: 8.50, 
            categoria: 'Pizzas', 
            descripcion: 'Deliciosa pizza hawaiana hecha en casa con piña natural y jamón de primera calidad.', 
            foto: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop',
            fecha: '18/01/2025',
            usuario: 'Juan Pérez',
            compras: 3
        },
        { 
            id: 2, 
            nombre: 'Hamburguesa Gourmet', 
            precio: 12.00, 
            categoria: 'Hamburguesas', 
            descripcion: 'Hamburguesa con carne Angus, queso cheddar, cebolla caramelizada y salsa especial.', 
            foto: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
            fecha: '17/01/2025',
            usuario: 'Juan Pérez',
            compras: 1
        }
    ];
    
    let nextPublicationId = 3;
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
    let editingCommentId = null;

    let cart = [];
    let clients = [];
    let orders = [];
    let promociones = [];
    let historialCompras = [];

    // ============================================================
    // CHECKOUT - VARIABLES
    // ============================================================
    
    let checkoutCurrentStep = 1;
    let checkoutData = {
        direccion: {},
        metodoPago: 'tarjeta',
        total: 0,
        items: []
    };

    // ============================================================
    // HISTORIAL DE COMPRAS (PEDIDOS SIMULADOS CON TODOS LOS DATOS)
    // ============================================================

    const defaultHistorialCompras = [
        {
            id: 'DEL-2026-1001',
            fecha: '15/01/2026 14:30',
            items: [
                { name: 'Pizza Margarita', quantity: 2, price: 12.50, subtotal: 25.00 },
                { name: 'Café de especialidad', quantity: 1, price: 4.20, subtotal: 4.20 }
            ],
            total: 29.20,
            metodo: 'Tarjeta',
            estado: 'entregado',
            direccion: {
                nombre: 'Juan Pérez',
                email: 'juan.perez@email.com',
                telefono: '55 1234 5678',
                direccion: 'Calle Principal 123, Colonia Centro',
                ciudad: 'Ciudad de México',
                cp: '12345'
            }
        },
        {
            id: 'DEL-2026-1002',
            fecha: '10/01/2026 12:15',
            items: [
                { name: 'Hamburguesa Clásica', quantity: 1, price: 10.90, subtotal: 10.90 },
                { name: 'Ensalada César', quantity: 1, price: 11.80, subtotal: 11.80 },
                { name: 'Café de especialidad', quantity: 2, price: 4.20, subtotal: 8.40 }
            ],
            total: 31.10,
            metodo: 'Transferencia',
            estado: 'entregado',
            direccion: {
                nombre: 'Juan Pérez',
                email: 'juan.perez@email.com',
                telefono: '55 1234 5678',
                direccion: 'Calle Principal 123, Colonia Centro',
                ciudad: 'Ciudad de México',
                cp: '12345'
            }
        }
    ];

    // ============================================================
    // CARGA DE DATOS DESDE LOCALSTORAGE
    // ============================================================

    try {
        const savedProducts = localStorage.getItem('delicias_products');
        products = savedProducts ? JSON.parse(savedProducts) : JSON.parse(JSON.stringify(defaultProducts));
    } catch (e) {}

    try {
        const savedCart = localStorage.getItem('delicias_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {}

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

    try {
        const savedHistorial = localStorage.getItem('delicias_historial');
        if (savedHistorial) {
            historialCompras = JSON.parse(savedHistorial);
        } else {
            historialCompras = JSON.parse(JSON.stringify(defaultHistorialCompras));
            saveHistorial();
        }
    } catch (e) {
        historialCompras = JSON.parse(JSON.stringify(defaultHistorialCompras));
        saveHistorial();
    }

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
        } catch (e) {
            console.log('Error guardando publicaciones:', e);
        }
    }

    function saveHistorial() {
        try {
            localStorage.setItem('delicias_historial', JSON.stringify(historialCompras));
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
    // FUNCIONES DE REDIRECCIÓN DESPUÉS DE LOGIN
    // ============================================================

    function verificarLoginAntesDeCheckout() {
        if (!isLoggedIn) {
            sessionStorage.setItem('redirect_after_login', 'checkout');
            sessionStorage.setItem('cart_before_login', JSON.stringify(cart));
            
            var feedback = document.getElementById('cart-feedback');
            if (feedback) {
                setTimeout(function() { 
                    feedback.style.display = 'none';
                    closeCart();
                    showPage('login');
                }, 2000);
            } else {
                closeCart();
                showPage('login');
            }
            return false;
        }
        return true;
    }

    function restaurarCarritoDespuesDeLogin() {
        var redirectTo = sessionStorage.getItem('redirect_after_login');
        var savedCart = sessionStorage.getItem('cart_before_login');
        
        if (redirectTo === 'checkout' && savedCart) {
            try {
                var parsedCart = JSON.parse(savedCart);
                if (parsedCart && parsedCart.length > 0) {
                    cart = parsedCart;
                    saveCart();
                    updateCartUI();
                }
            } catch (e) {}
            
            sessionStorage.removeItem('redirect_after_login');
            sessionStorage.removeItem('cart_before_login');
            return true;
        }
        return false;
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
        'mis-publicaciones': document.getElementById('page-mis-publicaciones'),
        checkout: document.getElementById('page-checkout'),
        factura: document.getElementById('page-factura'),
        'mis-compras': document.getElementById('page-mis-compras'),
        'mis-comentarios': document.getElementById('page-mis-comentarios')
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

        var dropdownMenu = document.getElementById('profile-dropdown-menu');
        var profileBtn = document.getElementById('nav-profile-btn');
        if (dropdownMenu) dropdownMenu.classList.remove('show');
        if (profileBtn) profileBtn.classList.remove('active');

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

        if (pageId === 'login') {
            mostrarMensajeLoginRequerido();
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

        if (pageId === 'mis-compras') {
            renderHistorialCompras();
        }

        if (pageId === 'mis-comentarios') {
            renderMisComentarios();
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

    function mostrarMensajeLoginRequerido() {
        var redirectTo = sessionStorage.getItem('redirect_after_login');
        var mensajeRequerido = document.getElementById('login-requerido');
        
        if (redirectTo === 'checkout' && mensajeRequerido) {
            mensajeRequerido.classList.remove('hidden');
        } else if (mensajeRequerido) {
            mensajeRequerido.classList.add('hidden');
        }
    }

    // ============================================================
    // ACTUALIZAR NAVEGACIÓN CON DROPDOWN
    // ============================================================

    function updateNavVisibility() {
        var userNavItems = document.querySelectorAll('.user-nav');
        var adminNavItems = document.querySelectorAll('.admin-nav');
        var navLoginLi = document.getElementById('nav-login-li');
        var profileContainer = document.getElementById('profile-dropdown-container');
        var profileBtn = document.getElementById('nav-profile-btn');
        var profileName = document.getElementById('nav-profile-name');
        var navLoginBtn = document.getElementById('nav-login-btn');

        if (profileContainer) profileContainer.style.display = 'none';
        if (navLoginLi) navLoginLi.style.display = 'list-item';

        if (isAdmin) {
            userNavItems.forEach(function(el) { 
                if (el.id !== 'profile-dropdown-container' && el.id !== 'nav-login-li') {
                    el.style.display = 'none'; 
                }
            });
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
            if (profileContainer) profileContainer.style.display = 'none';
            if (navLoginLi) navLoginLi.style.display = 'list-item';
        } else if (isLoggedIn) {
            userNavItems.forEach(function(el) { 
                if (el.id !== 'profile-dropdown-container' && el.id !== 'nav-login-li') {
                    el.style.display = 'list-item'; 
                }
            });
            adminNavItems.forEach(function(el) {
                el.style.display = 'none';
                el.style.background = '';
            });
            document.body.classList.remove('admin-mode');
            
            if (profileContainer) {
                profileContainer.style.display = 'list-item';
                profileContainer.style.background = 'transparent';
            }
            if (navLoginLi) navLoginLi.style.display = 'none';
            
            if (profileName) {
                var nameDisplay = currentUser && currentUser.name ? currentUser.name : 'Mi Perfil';
                var nameShort = nameDisplay.length > 15 ? nameDisplay.substring(0, 15) + '...' : nameDisplay;
                profileName.textContent = nameShort;
            }
            
            if (profileBtn) {
                profileBtn.innerHTML = '<i class="fas fa-user-circle" aria-hidden="true"></i> <span id="nav-profile-name">' + 
                    (currentUser && currentUser.name ? currentUser.name : 'Mi Perfil') + 
                    '</span> <i class="fas fa-chevron-down dropdown-arrow" aria-hidden="true"></i>';
            }
        } else {
            userNavItems.forEach(function(el) { 
                if (el.id !== 'profile-dropdown-container') {
                    el.style.display = 'list-item'; 
                }
            });
            adminNavItems.forEach(function(el) {
                el.style.display = 'none';
                el.style.background = '';
            });
            document.body.classList.remove('admin-mode');
            if (profileContainer) profileContainer.style.display = 'none';
            if (navLoginLi) navLoginLi.style.display = 'list-item';
            
            if (navLoginBtn) {
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
    // DROPDOWN - TOGGLE Y CIERRE
    // ============================================================

    var profileBtn = document.getElementById('nav-profile-btn');
    var dropdownMenu = document.getElementById('profile-dropdown-menu');
    var profileContainer = document.getElementById('profile-dropdown-container');

    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            this.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(e) {
        if (profileContainer && dropdownMenu) {
            if (!profileContainer.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                if (profileBtn) profileBtn.classList.remove('active');
            }
        }
    });

    if (dropdownMenu) {
        dropdownMenu.querySelectorAll('a[data-page]').forEach(function(link) {
            link.addEventListener('click', function() {
                dropdownMenu.classList.remove('show');
                if (profileBtn) profileBtn.classList.remove('active');
            });
        });
    }

    var dropdownLogout = document.getElementById('dropdown-logout-btn');
    if (dropdownLogout) {
        dropdownLogout.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.remove('show');
            if (profileBtn) profileBtn.classList.remove('active');
            
            isLoggedIn = false;
            isAdmin = false;
            updateNavVisibility();
            showPage('inicio');
        });
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

    // ============================================================
    // FUNCIÓN PROCESAR PAGO (CON VERIFICACIÓN DE LOGIN)
    // ============================================================

    function processPayment() {
        if (cart.length === 0) return;
        
        if (!isLoggedIn) {
            sessionStorage.setItem('redirect_after_login', 'checkout');
            sessionStorage.setItem('cart_before_login', JSON.stringify(cart));
            
            var feedback = document.getElementById('cart-feedback');
            if (feedback) {
                setTimeout(function() { 
                    feedback.style.display = 'none';
                    closeCart();
                    showPage('login');
                }, 2000);
            } else {
                closeCart();
                showPage('login');
            }
            return;
        }
        
        var hasItems = false;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].quantity > 0) {
                hasItems = true;
                break;
            }
        }
        
        if (!hasItems) {
            var feedback = document.getElementById('cart-feedback');
            if (feedback) {
                feedback.textContent = '⚠️ Tu carrito está vacío.';
                feedback.style.display = 'block';
                feedback.style.background = '#fce4ec';
                feedback.style.color = '#c62828';
                feedback.style.borderLeftColor = '#e53935';
                setTimeout(function() { feedback.style.display = 'none'; }, 3000);
            }
            return;
        }
        
        closeCart();
        showPage('checkout');
        
        checkoutCurrentStep = 1;
        actualizarCheckoutProgress(1);
        
        if (isLoggedIn && currentUser) {
            var nombreInput = document.getElementById('checkout-nombre');
            var emailInput = document.getElementById('checkout-email');
            var direccionInput = document.getElementById('checkout-direccion');
            var telefonoInput = document.getElementById('checkout-telefono');
            
            if (nombreInput && currentUser.name) {
                nombreInput.value = currentUser.name;
            }
            if (emailInput && currentUser.email) {
                emailInput.value = currentUser.email;
            }
            if (direccionInput && currentUser.address) {
                direccionInput.value = currentUser.address;
            }
            if (telefonoInput && currentUser.phone) {
                telefonoInput.value = currentUser.phone;
            }
        }
        
        var total = 0;
        checkoutData.items = [];
        
        for (var j = 0; j < cart.length; j++) {
            var product = products.find(function(p) { return p.id === cart[j].productId; });
            if (product) {
                var subtotal = product.price * cart[j].quantity;
                total += subtotal;
                checkoutData.items.push({
                    name: product.name,
                    quantity: cart[j].quantity,
                    price: product.price,
                    subtotal: subtotal
                });
            } else if (cart[j].esMarketplace) {
                var subtotalMP = (cart[j].precio || 0) * cart[j].quantity;
                total += subtotalMP;
                checkoutData.items.push({
                    name: cart[j].nombre || 'Producto marketplace',
                    quantity: cart[j].quantity,
                    price: cart[j].precio || 0,
                    subtotal: subtotalMP
                });
            }
        }
        
        checkoutData.total = total;
    }

    // ============================================================
    // CHECKOUT - FUNCIONES
    // ============================================================

    function actualizarCheckoutProgress(step) {
        document.querySelectorAll('.step-indicator').forEach(function(el) {
            var s = parseInt(el.getAttribute('data-step'));
            el.classList.remove('active', 'done');
            if (s === step) {
                el.classList.add('active');
            } else if (s < step) {
                el.classList.add('done');
            }
        });
        
        document.querySelectorAll('.checkout-step').forEach(function(el) {
            el.classList.remove('active');
        });
        var target = document.getElementById('checkout-step-' + step);
        if (target) {
            target.classList.add('active');
        }
        
        var checkoutContainer = document.querySelector('.checkout-card');
        if (checkoutContainer) {
            checkoutContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function irAlPaso(step) {
        checkoutCurrentStep = step;
        actualizarCheckoutProgress(step);
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
            nameInput.value = p.name || '';
            if (categoryInput) categoryInput.value = p.category || 'Pizzas';
            if (priceInput) priceInput.value = p.price || '';
            if (descInput) descInput.value = p.desc || '';
            if (stockInput) stockInput.value = p.stock || '';
            if (statusInput) statusInput.value = p.status || 'disponible';
            if (imageInput) imageInput.value = p.image || '';
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
            html += '<tr><td><strong>' + (c.name || 'Sin nombre') + '</strong></td>';
            html += '<td>' + (c.email || '') + '</td>';
            html += '<td>' + (c.phone || '') + '</td>';
            html += '<td>' + (c.orders || 0) + '</td>';
            html += '<td>$' + (c.spent || 0).toFixed(2) + '</td>';
            html += '<td>' + (c.registeredDate || '') + '</td>';
            html += '<td><div class="table-actions">';
            html += '<button class="btn-edit" data-index="' + i + '" aria-label="Editar ' + (c.name || 'cliente') + '"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-delete" data-index="' + i + '" aria-label="Eliminar ' + (c.name || 'cliente') + '"><i class="fas fa-trash"></i></button>';
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
            nameInput.value = c.name || '';
            if (emailInput) emailInput.value = c.email || '';
            if (phoneInput) phoneInput.value = c.phone || '';
            if (addressInput) addressInput.value = c.address || '';
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
            html += '<tr><td>#' + (order.id || '') + '</td>';
            html += '<td>' + (order.client || '') + '</td>';
            html += '<td>' + (order.products || '') + '</td>';
            html += '<td>$' + (order.total || 0).toFixed(2) + '</td>';
            html += '<td><span class="status-badge ' + statusClass + '">' + (order.status || '') + '</span></td>';
            html += '<td>' + (order.date || '') + '</td>';
            html += '<td><button class="btn-secondary order-action-btn" type="button" data-order-id="' + (order.id || '') + '">Cambiar estado</button></td></tr>';
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
            html += '<td><strong>' + (promo.nombre || '') + '</strong></td>';
            html += '<td>' + (promo.descuento || '') + '</td>';
            html += '<td>' + (promo.productos || '') + '</td>';
            html += '<td>' + (promo.vigencia || '') + '</td>';
            html += '<td><span class="status-badge ' + estadoClass + '">' + (promo.estado || '') + '</span></td>';
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
                var promoName = promociones[index] ? (promociones[index].nombre || 'esta promoción') : 'esta promoción';
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
            document.getElementById('promo-form-name').value = promo.nombre || '';
            document.getElementById('promo-form-discount').value = promo.descuento || '';
            document.getElementById('promo-form-products').value = promo.productos || '';
            document.getElementById('promo-form-validity').value = promo.vigencia || '';
            document.getElementById('promo-form-status').value = promo.estado || 'Activa';
        }

        showAdminPage('promo-form');
        form.scrollIntoView({ behavior: 'smooth' });
    }

    function savePromoForm() {
        var name = document.getElementById('promo-form-name')?.value || '';
        var discount = document.getElementById('promo-form-discount')?.value || '';
        var products = document.getElementById('promo-form-products')?.value || '';
        var validity = document.getElementById('promo-form-validity')?.value || '';
        var status = document.getElementById('promo-form-status')?.value || 'Activa';
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

                if (badge) badge.textContent = promo.descuento || '0%';
                if (title) title.textContent = promo.nombre || 'Promoción';
                if (desc) desc.textContent = 'Promoción especial: ' + (promo.productos || '');
                if (meta) {
                    meta.innerHTML = '<span><i class="fas fa-clock" aria-hidden="true"></i> ' + (promo.vigencia || '') + '</span><span><i class="fas fa-tag" aria-hidden="true"></i> ' + (promo.estado || '') + '</span>';
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
                var editadoTexto = c.edited ? ' <span style="font-size:0.65rem; color:#6b4f7a; font-style:italic;">(Editado)</span>' : '';
                html += '<div class="comment-item">';
                html += '<div class="comment-header">';
                html += '<div class="comment-author"><strong>' + (c.name || 'Anónimo') + '</strong></div>';
                html += '</div>';
                html += '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">';
                html += '<p style="margin:0.4rem 0 0 0; flex:1;">' + (c.text || '<em style="color:#999;">[Comentario vacío]</em>') + editadoTexto + '</p>';
                html += '<span class="comment-date" style="white-space:nowrap;">' + (c.date || '') + '</span>';
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
            date: dateStr,
            edited: false
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

    // ============================================================
    // FUNCIONES DE MIS COMENTARIOS
    // ============================================================

    function renderMisComentarios() {
        var container = document.getElementById('mis-comentarios-list');
        var count = document.getElementById('mis-comentarios-count');
        
        if (!container) return;

        var userComments = communityComments.filter(function(c) {
            return c.name.toLowerCase() === currentUser.name.toLowerCase();
        });

        if (userComments.length === 0) {
            container.innerHTML = '<div class="empty-state" style="text-align:center; padding:2rem; color:#6b4f7a;">' +
                '<i class="fas fa-comment-slash" style="font-size:2rem; color:#d9c4e8; display:block; margin-bottom:0.8rem;"></i>' +
                '<p>Aún no has publicado comentarios en la comunidad.</p>' +
                '</div>';
            if (count) count.textContent = '0';
            return;
        }

        var html = '';
        for (var i = 0; i < userComments.length; i++) {
            var c = userComments[i];
            var editadoTexto = c.edited ? ' <span style="font-size:0.65rem; color:#6b4f7a; font-style:italic;">(Editado)</span>' : '';
            
            html += '<div class="comment-item" data-id="' + c.id + '">';
            html += '<div class="comment-header">';
            html += '<div class="comment-author"><strong>' + (c.name || 'Anónimo') + '</strong></div>';
            html += '</div>';
            html += '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">';
            html += '<p style="margin:0.4rem 0 0 0; flex:1;" class="comment-text">' + (c.text || '<em style="color:#999;">[Comentario vacío]</em>') + editadoTexto + '</p>';
            html += '<span class="comment-date" style="white-space:nowrap;">' + (c.date || '') + '</span>';
            html += '</div>';
            html += '<div style="display:flex; gap:0.5rem; margin-top:0.5rem;">';
            html += '<button class="btn-edit-comment" data-id="' + c.id + '" style="padding:0.2rem 0.8rem; font-size:0.75rem; min-height:28px;">';
            html += '<i class="fas fa-edit"></i> Editar';
            html += '</button>';
            html += '<button class="btn-delete-comment" data-id="' + c.id + '" style="padding:0.2rem 0.8rem; font-size:0.75rem; min-height:28px;">';
            html += '<i class="fas fa-trash"></i> Eliminar';
            html += '</button>';
            html += '</div>';
            html += '</div>';
        }
        container.innerHTML = html;

        if (count) count.textContent = userComments.length;

        container.querySelectorAll('.btn-edit-comment').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                abrirModalEditarComentario(id);
            });
        });

        container.querySelectorAll('.btn-delete-comment').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                eliminarComentario(id);
            });
        });
    }

    function abrirModalEditarComentario(id) {
        var comment = null;
        for (var i = 0; i < communityComments.length; i++) {
            if (communityComments[i].id === id) {
                comment = communityComments[i];
                break;
            }
        }
        if (!comment) return;

        editingCommentId = id;
        
        var modal = document.getElementById('edit-comment-modal');
        var textarea = document.getElementById('edit-comment-text');
        var feedback = document.getElementById('edit-comment-feedback');
        
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.textContent = '';
            feedback.className = '';
        }
        
        if (textarea) textarea.value = comment.text || '';
        if (modal) modal.style.display = 'flex';
    }

    function cerrarModalEditarComentario() {
        var modal = document.getElementById('edit-comment-modal');
        if (modal) modal.style.display = 'none';
        editingCommentId = null;
        
        var feedback = document.getElementById('edit-comment-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.textContent = '';
            feedback.className = '';
        }
    }

    function guardarEdicionComentario() {
        if (editingCommentId === null) return;
        
        var comment = null;
        for (var i = 0; i < communityComments.length; i++) {
            if (communityComments[i].id === editingCommentId) {
                comment = communityComments[i];
                break;
            }
        }
        if (!comment) return;

        var textarea = document.getElementById('edit-comment-text');
        var nuevoTexto = textarea ? textarea.value || '' : '';
        var feedback = document.getElementById('edit-comment-feedback');

        comment.text = nuevoTexto.trim() || '';
        comment.edited = true;
        
        var now = new Date();
        comment.date = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear() + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0') + ' (editado)';
        
        saveComments();
        renderMisComentarios();
        renderCommunityComments();
        
        if (feedback) {
            showFormMessage(feedback, '✅ Comentario editado exitosamente.', 'success');
            setTimeout(function() {
                cerrarModalEditarComentario();
            }, 1500);
        } else {
            cerrarModalEditarComentario();
        }
    }

    function eliminarComentario(id) {
        showConfirmModal('¿Eliminar este comentario?', function(confirmed) {
            if (confirmed) {
                var idx = -1;
                for (var i = 0; i < communityComments.length; i++) {
                    if (communityComments[i].id === id) {
                        idx = i;
                        break;
                    }
                }
                if (idx !== -1) {
                    communityComments.splice(idx, 1);
                    saveComments();
                    renderMisComentarios();
                    renderCommunityComments();
                    
                    var feedback = document.getElementById('mis-comentarios-feedback');
                    if (feedback) {
                        showFormMessage(feedback, '🗑️ Comentario eliminado.', 'success');
                        setTimeout(function() {
                            feedback.classList.add('hidden');
                        }, 3000);
                    }
                }
            }
        });
    }

    function publicarComentarioDesdeMisComentarios(text) {
        var now = new Date();
        var dateStr = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear() + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
        
        var newComment = {
            id: nextCommentId++,
            name: currentUser.name || 'Anónimo',
            text: text || '',
            date: dateStr,
            edited: false
        };
        
        communityComments.unshift(newComment);
        saveComments();
        renderMisComentarios();
        renderCommunityComments();
        
        var feedback = document.getElementById('mis-comentarios-feedback');
        if (feedback) {
            showFormMessage(feedback, '¡Comentario publicado exitosamente!', 'success');
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
        
        if (resumenPublicaciones) resumenPublicaciones.textContent = totalPublicaciones;

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
            html += '<div class="ultima-img"><img src="' + (p.foto || 'https://via.placeholder.com/200x100/8b5cf6/ffffff?text=Producto') + '" alt="' + (p.nombre || 'Producto') + '" onerror="this.src=\'https://via.placeholder.com/200x100/8b5cf6/ffffff?text=Producto\'"></div>';
            html += '<div class="ultima-nombre">' + (p.nombre || 'Producto sin nombre') + '</div>';
            html += '<div class="ultima-precio">$' + parseFloat(p.precio || 0).toFixed(2) + '</div>';
            html += '<div class="ultima-fecha">' + (p.fecha || '') + '</div>';
            html += '<button class="btn-comprar-marketplace comprar-marketplace-btn" data-id="' + p.id + '" data-nombre="' + (p.nombre || 'Producto') + '" data-precio="' + (p.precio || 0) + '">';
            html += '<i class="fas fa-shopping-cart" aria-hidden="true"></i> Comprar';
            html += '</button>';
            html += '</div>';
        }
        container.innerHTML = html;

        container.querySelectorAll('.comprar-marketplace-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = parseInt(this.getAttribute('data-id'));
                var nombre = this.getAttribute('data-nombre') || 'Producto';
                var precio = parseFloat(this.getAttribute('data-precio')) || 0;
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
                nombre: nombre || 'Producto',
                precio: precio || 0,
                esMarketplace: true
            });
        }
        
        saveCart();
        updateCartUI();
        
        var feedback = document.createElement('div');
        feedback.style.cssText = 'position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:#4caf50; color:white; padding:12px 24px; border-radius:40px; font-weight:600; z-index:9999; box-shadow:0 4px 20px rgba(0,0,0,0.2); animation:fadeIn 0.3s ease;';
        feedback.textContent = '✅ "' + (nombre || 'Producto') + '" agregado al carrito';
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
    // FUNCIÓN PARA PUBLICAR PRODUCTO
    // ============================================================

    function publicarProducto() {
        console.log('🔍 Función publicarProducto() ejecutada');
        
        var nombreInput = document.getElementById('publicar-nombre');
        var precioInput = document.getElementById('publicar-precio');
        var categoriaSelect = document.getElementById('publicar-categoria');
        var descripcionTextarea = document.getElementById('publicar-descripcion');
        var fotoInput = document.getElementById('publicar-foto');
        var msg = document.getElementById('publicar-message');

        if (!nombreInput || !precioInput) {
            console.error('❌ No se encontraron los campos del formulario');
            if (msg) {
                msg.className = 'auth-error alert-message';
                msg.textContent = '❌ Error: No se encontraron los campos del formulario.';
                msg.classList.remove('hidden');
            }
            return;
        }

        var nombre = nombreInput.value || '';
        var precio = precioInput.value || '';
        var categoria = categoriaSelect ? categoriaSelect.value : 'Otros';
        var descripcion = descripcionTextarea ? descripcionTextarea.value || '' : '';
        var foto = fotoInput ? fotoInput.value || '' : '';

        console.log('📝 Datos del formulario:', { nombre, precio, categoria, descripcion, foto });

        if (!nombre || nombre.trim() === '') {
            nombre = 'Producto sin nombre';
            console.log('📝 Nombre vacío, usando valor por defecto');
        }
        
        var precioNum = parseFloat(precio);
        if (isNaN(precioNum) || precioNum < 0) {
            precioNum = 0;
            console.log('📝 Precio vacío o inválido, usando 0');
        }

        if (!foto || foto.trim() === '') {
            foto = 'https://via.placeholder.com/400x250/8b5cf6/ffffff?text=' + encodeURIComponent(nombre || 'Producto');
            console.log('🖼️ Usando imagen por defecto');
        }

        var now = new Date();
        var dateStr = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear();

        var newPublication = {
            id: nextPublicationId++,
            nombre: nombre.trim(),
            precio: precioNum,
            categoria: categoria || 'Otros',
            descripcion: descripcion || '',
            foto: foto,
            fecha: dateStr,
            usuario: currentUser.name || 'Usuario',
            compras: 0
        };

        console.log('✅ Nuevo producto creado:', newPublication);

        userPublications.push(newPublication);
        savePublications();
        
        renderMisPublicaciones();
        renderMarketplace();

        showFormMessage(msg, '✅ ¡Producto "' + nombre.trim() + '" publicado exitosamente!', 'success');
        console.log('✅ Producto publicado con éxito');

        nombreInput.value = '';
        precioInput.value = '';
        if (categoriaSelect) categoriaSelect.value = 'Otros';
        if (descripcionTextarea) descripcionTextarea.value = '';
        if (fotoInput) fotoInput.value = '';
        
        var preview = document.getElementById('publicar-image-preview');
        if (preview) {
            preview.innerHTML = '<div class="empty-preview" style="text-align:center; color:#8b5cf6; padding:1rem;">' +
                '<i class="fas fa-image" style="font-size:2rem; display:block; margin-bottom:0.5rem;" aria-hidden="true"></i>' +
                '<span>Vista previa</span>' +
                '</div>';
        }

        setTimeout(function() {
            console.log('🔀 Redirigiendo a "Mis publicaciones"');
            showPage('mis-publicaciones');
        }, 2000);
    }

    // ============================================================
    // C2C - MIS PUBLICACIONES
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
            html += '<div class="publicacion-img"><img src="' + (p.foto || 'https://via.placeholder.com/80x80/8b5cf6/ffffff?text=Producto') + '" alt="' + (p.nombre || 'Producto') + '" onerror="this.src=\'https://via.placeholder.com/80x80/8b5cf6/ffffff?text=Producto\'"></div>';
            html += '<div class="publicacion-info">';
            html += '<h4>' + (p.nombre || 'Producto sin nombre') + '</h4>';
            html += '<span class="publicacion-precio">$' + parseFloat(p.precio || 0).toFixed(2) + '</span>';
            html += ' <span class="publicacion-categoria">' + (p.categoria || 'Otros') + '</span>';
            html += '<p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.2rem;">' + (p.descripcion || '') + '</p>';
            html += '<span style="font-size:0.7rem; color:var(--text-secondary);">Publicado: ' + (p.fecha || '') + '</span>';
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

        showConfirmModal('¿Eliminar la publicación "' + (pub.nombre || 'Producto') + '"?', function(confirmed) {
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
                feedback.textContent = 'Por favor ingresa una oferta válida mayor a 0.';
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
            usuario: usuario || 'Invitado',
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
            html += '<span class="oferta-usuario">' + icono + (oferta.usuario || 'Invitado') + '</span>';
            html += '<span class="oferta-monto">$' + (oferta.monto || 0).toFixed(2) + '</span>';
            html += '<span class="oferta-timestamp">' + (oferta.timestamp || '') + '</span>';
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
            var name = document.getElementById('form-product-name')?.value || '';
            var category = document.getElementById('form-product-category')?.value || 'Pizzas';
            var price = parseFloat(document.getElementById('form-product-price')?.value) || 0;
            var desc = document.getElementById('form-product-desc')?.value || '';
            var stock = parseInt(document.getElementById('form-product-stock')?.value) || 0;
            var status = document.getElementById('form-product-status')?.value || 'disponible';
            var image = document.getElementById('form-product-image')?.value || '';
            var msg = document.getElementById('form-message');

            if (editingProductId) {
                var idx = -1;
                for (var i = 0; i < products.length; i++) {
                    if (products[i].id === editingProductId) { idx = i; break; }
                }
                if (idx !== -1) {
                    products[idx] = { ...products[idx], name: name || 'Sin nombre', category: category || 'Pizzas', price: price || 0, desc: desc || '', stock: stock || 0, status: status || 'disponible', image: image || '' };
                }
                showFormMessage(msg, 'Producto actualizado correctamente.', 'success');
            } else {
                var newId = 0;
                for (var j = 0; j < products.length; j++) {
                    if (products[j].id > newId) newId = products[j].id;
                }
                newId++;
                products.push({ id: newId, name: name || 'Sin nombre', category: category || 'Pizzas', price: price || 0, desc: desc || '', image: image || '', badge: null, badgeText: null, stock: stock || 0, status: status || 'disponible' });
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
            var name = document.getElementById('form-client-name')?.value || '';
            var email = document.getElementById('form-client-email')?.value || '';
            var phone = document.getElementById('form-client-phone')?.value || '';
            var address = document.getElementById('form-client-address')?.value || '';
            var msg = document.getElementById('client-form-message');

            if (editingClientId !== null && editingClientId >= 0) {
                clients[editingClientId].name = name || 'Sin nombre';
                clients[editingClientId].email = email || '';
                clients[editingClientId].phone = phone || '';
                clients[editingClientId].address = address || '';
                showFormMessage(msg, 'Cliente actualizado correctamente.', 'success');
            } else {
                var newId = 0;
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].id > newId) newId = clients[i].id;
                }
                newId++;
                var newClient = {
                    id: newId,
                    name: name || 'Sin nombre',
                    email: email || '',
                    phone: phone || '',
                    address: address || '',
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
    // EVENT LISTENERS - AUTH (LOGIN CON REDIRECCIÓN)
    // ============================================================

    var registroBtn = document.getElementById('registro-btn');
    if (registroBtn) {
        registroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var msg = document.getElementById('registro-message');
            if (msg) showFormMessage(msg, 'Registro exitoso (simulado).', 'success');
            
            isLoggedIn = true;
            isAdmin = false;
            
            document.getElementById('registro-nombre').value = '';
            document.getElementById('registro-email').value = '';
            document.getElementById('registro-password').value = '';
            
            var redirectTo = sessionStorage.getItem('redirect_after_login');
            var savedCart = sessionStorage.getItem('cart_before_login');
            
            if (redirectTo === 'checkout' && savedCart) {
                try {
                    var parsedCart = JSON.parse(savedCart);
                    if (parsedCart && parsedCart.length > 0) {
                        cart = parsedCart;
                        saveCart();
                        updateCartUI();
                    }
                } catch (e) {}
                
                sessionStorage.removeItem('redirect_after_login');
                sessionStorage.removeItem('cart_before_login');
                
                setTimeout(function() {
                    updateNavVisibility();
                    processPayment();
                }, 1500);
            } else {
                setTimeout(function() {
                    updateNavVisibility();
                    showPage('login');
                }, 1500);
            }
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
            
            var redirectTo = sessionStorage.getItem('redirect_after_login');
            var savedCart = sessionStorage.getItem('cart_before_login');
            
            if (redirectTo === 'checkout' && savedCart) {
                try {
                    var parsedCart = JSON.parse(savedCart);
                    if (parsedCart && parsedCart.length > 0) {
                        cart = parsedCart;
                        saveCart();
                        updateCartUI();
                    }
                } catch (e) {}
                
                sessionStorage.removeItem('redirect_after_login');
                sessionStorage.removeItem('cart_before_login');
                
                setTimeout(function() {
                    updateNavVisibility();
                    processPayment();
                }, 1500);
            } else {
                setTimeout(function() {
                    updateNavVisibility();
                    showPage('perfil');
                }, 1500);
            }
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
            sessionStorage.removeItem('redirect_after_login');
            sessionStorage.removeItem('cart_before_login');
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
            var text = commentInput ? commentInput.value || '' : '';
            addCommunityComment(name, text);
            if (nameInput) nameInput.value = '';
            if (commentInput) commentInput.value = '';
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
    // EVENT LISTENERS - MIS COMENTARIOS
    // ============================================================

    var misComentariosForm = document.getElementById('mis-comentarios-form');
    if (misComentariosForm) {
        misComentariosForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var textInput = document.getElementById('mis-comentarios-text');
            var text = textInput ? textInput.value || '' : '';
            publicarComentarioDesdeMisComentarios(text);
            if (textInput) textInput.value = '';
        });
    }

    // ============================================================
    // EVENT LISTENERS - MODAL EDITAR COMENTARIO
    // ============================================================

    var editCommentModal = document.getElementById('edit-comment-modal');
    var editCommentSaveBtn = document.getElementById('edit-comment-save-btn');
    var editCommentCancelBtn = document.getElementById('edit-comment-cancel-btn');

    if (editCommentSaveBtn) {
        editCommentSaveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            guardarEdicionComentario();
        });
    }

    if (editCommentCancelBtn) {
        editCommentCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cerrarModalEditarComentario();
        });
    }

    if (editCommentModal) {
        editCommentModal.addEventListener('click', function(e) {
            if (e.target === editCommentModal) {
                cerrarModalEditarComentario();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var modal = document.getElementById('edit-comment-modal');
            if (modal && modal.style.display === 'flex') {
                cerrarModalEditarComentario();
            }
        }
    });

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
                if (products[i].name && products[i].name.toLowerCase().includes('pepperoni')) {
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
    // CHECKOUT - EVENT LISTENERS
    // ============================================================

    document.querySelectorAll('.checkout-next-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (checkoutCurrentStep === 1) {
                var direccion = document.getElementById('checkout-direccion')?.value || '';
                var nombre = document.getElementById('checkout-nombre')?.value || '';
                var email = document.getElementById('checkout-email')?.value || '';
                var telefono = document.getElementById('checkout-telefono')?.value || '';
                var ciudad = document.getElementById('checkout-ciudad')?.value || '';
                var cp = document.getElementById('checkout-cp')?.value || '';
                
                checkoutData.direccion = {
                    nombre: nombre || '',
                    email: email || '',
                    telefono: telefono || '',
                    direccion: direccion || '',
                    ciudad: ciudad || '',
                    cp: cp || ''
                };
                
                irAlPaso(2);
                
            } else if (checkoutCurrentStep === 2) {
                var metodoSeleccionado = document.querySelector('input[name="payment-method"]:checked');
                if (metodoSeleccionado) {
                    checkoutData.metodoPago = metodoSeleccionado.value;
                } else {
                    checkoutData.metodoPago = 'tarjeta';
                }
                
                if (checkoutData.items.length === 0) {
                    for (var i = 0; i < cart.length; i++) {
                        var p = products.find(function(pr) { return pr.id === cart[i].productId; });
                        if (p) {
                            checkoutData.items.push({
                                name: p.name,
                                quantity: cart[i].quantity,
                                price: p.price,
                                subtotal: p.price * cart[i].quantity
                            });
                        } else if (cart[i].esMarketplace) {
                            checkoutData.items.push({
                                name: cart[i].nombre || 'Producto marketplace',
                                quantity: cart[i].quantity,
                                price: cart[i].precio || 0,
                                subtotal: (cart[i].precio || 0) * cart[i].quantity
                            });
                        }
                    }
                    checkoutData.total = 0;
                    for (var j = 0; j < checkoutData.items.length; j++) {
                        checkoutData.total += checkoutData.items[j].subtotal;
                    }
                }
                
                document.getElementById('checkout-total').textContent = '$' + checkoutData.total.toFixed(2);
                document.getElementById('checkout-payment-method').textContent = 
                    checkoutData.metodoPago.charAt(0).toUpperCase() + checkoutData.metodoPago.slice(1);
                
                var numeroPedido = 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);
                document.getElementById('checkout-order-number').textContent = '#' + numeroPedido;
                document.getElementById('checkout-order-date').textContent = new Date().toLocaleString('es-ES');
                
                var resumenContainer = document.getElementById('checkout-resumen-items');
                var htmlResumen = '';
                for (var k = 0; k < checkoutData.items.length; k++) {
                    var item = checkoutData.items[k];
                    htmlResumen += '<div style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid #ede6f5; font-size:0.9rem;">';
                    htmlResumen += '<span>' + item.quantity + ' x ' + item.name + '</span>';
                    htmlResumen += '<span>$' + item.subtotal.toFixed(2) + '</span>';
                    htmlResumen += '</div>';
                }
                resumenContainer.innerHTML = htmlResumen;
                
                irAlPaso(3);
                
                guardarCompra({
                    id: numeroPedido,
                    fecha: new Date().toLocaleString('es-ES'),
                    items: checkoutData.items,
                    total: checkoutData.total,
                    metodo: checkoutData.metodoPago,
                    estado: 'entregado'
                });
                
                cart = [];
                saveCart();
                updateCartUI();
                
                var mensajeExito = document.querySelector('#checkout-step-3 .checkout-card p');
                if (mensajeExito) {
                    mensajeExito.textContent = '✅ ¡Tu compra ha sido confirmada exitosamente!';
                    mensajeExito.style.color = '#2e7d32';
                    mensajeExito.style.fontWeight = '500';
                }
            }
        });
    });

    document.querySelectorAll('.checkout-prev-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (checkoutCurrentStep > 1) {
                irAlPaso(checkoutCurrentStep - 1);
            }
        });
    });

    document.querySelectorAll('.payment-method').forEach(function(method) {
        method.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            
            document.querySelectorAll('.payment-form').forEach(function(form) {
                form.style.display = 'none';
            });
            
            const target = this.querySelector('.payment-form');
            if (target) target.style.display = 'block';
        });
    });

    var defaultPaymentMethod = document.querySelector('input[name="payment-method"][value="tarjeta"]');
    if (defaultPaymentMethod) {
        defaultPaymentMethod.checked = true;
        var defaultMethodContainer = defaultPaymentMethod.closest('.payment-method');
        if (defaultMethodContainer) {
            var defaultForm = defaultMethodContainer.querySelector('.payment-form');
            if (defaultForm) defaultForm.style.display = 'block';
        }
    }

    document.getElementById('checkout-continuar-btn')?.addEventListener('click', function() {
        showPage('perfil');
    });
    
    // ============================================================
    // CHECKOUT - CONFIRMAR COMPRA (PASO 3)
    // ============================================================

    document.getElementById('confirmar-compra-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 1. Verificar que se hayan aceptado los términos
        const terminosCheckbox = document.getElementById('aceptar-terminos');
        const terminosError = document.getElementById('terminos-error');
        
        if (!terminosCheckbox || !terminosCheckbox.checked) {
            if (terminosError) {
                terminosError.style.display = 'block';
                // Ocultar el error después de 3 segundos
                setTimeout(function() {
                    terminosError.style.display = 'none';
                }, 3000);
            }
            return;
        }
        
        // Ocultar error si existe
        if (terminosError) {
            terminosError.style.display = 'none';
        }
        
        // 2. Preparar los datos del pedido
        const total = checkoutData.total || calcularTotalCheckout();
        const items = checkoutData.items || obtenerItemsCheckout();
        const metodo = checkoutData.metodoPago || 'Tarjeta';
        const direccion = checkoutData.direccion || {
            nombre: currentUser.name || 'Juan Pérez',
            email: currentUser.email || 'juan@email.com',
            telefono: currentUser.phone || '55 1234 5678',
            direccion: currentUser.address || 'Calle Principal 123, Colonia Centro',
            ciudad: 'Ciudad de México',
            cp: '12345'
        };
        
        // 3. Crear el número de pedido
        const numeroPedido = 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);
        const fecha = new Date().toLocaleString('es-ES');
        
        // 4. Guardar en el historial
        const compra = {
            id: numeroPedido,
            fecha: fecha,
            items: items,
            total: total,
            metodo: metodo,
            estado: 'entregado',
            direccion: direccion
        };
        
        // 5. Guardar en el historial
        historialCompras.unshift(compra);
        saveHistorial();
        
        // 6. Vaciar el carrito
        cart = [];
        saveCart();
        updateCartUI();
        
        // 7. Actualizar la interfaz del paso 3 - mostrar la sección de éxito
        document.getElementById('confirmacion-terminos').style.display = 'none';
        document.getElementById('confirmacion-exito').style.display = 'block';
        
        // 8. Actualizar los datos en la sección de éxito
        document.getElementById('checkout-order-number').textContent = '#' + numeroPedido;
        document.getElementById('checkout-order-date').textContent = fecha;
        document.getElementById('checkout-payment-method').textContent = metodo.charAt(0).toUpperCase() + metodo.slice(1);
        document.getElementById('checkout-total').textContent = '$' + total.toFixed(2);
        
        // 9. Generar resumen de items
        const resumenContainer = document.getElementById('checkout-resumen-items');
        if (resumenContainer) {
            let htmlResumen = '';
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                htmlResumen += '<div style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid #ede6f5; font-size:0.9rem;">';
                htmlResumen += '<span>' + (item.quantity || 1) + 'x ' + (item.name || 'Producto') + '</span>';
                htmlResumen += '<span>$' + (item.subtotal || (item.price * item.quantity) || 0).toFixed(2) + '</span>';
                htmlResumen += '</div>';
            }
            resumenContainer.innerHTML = htmlResumen;
        }
        
        // 10. Guardar los datos de la compra para la factura
        facturaData = {
            folio: numeroPedido,
            fecha: fecha.split(' ')[0] || new Date().toLocaleDateString('es-ES'),
            hora: fecha.split(' ')[1] || new Date().toLocaleTimeString('es-ES'),
            cliente: {
                nombre: direccion.nombre || currentUser.name || 'Juan Pérez',
                email: direccion.email || currentUser.email || 'juan@email.com',
                direccion: direccion.direccion || currentUser.address || 'Calle Principal 123, Colonia Centro'
            },
            items: items,
            total: total,
            metodo: metodo
        };
        
        console.log('✅ Compra confirmada:', facturaData);
    });

    // ============================================================
    // FUNCIONES DE APOYO PARA CHECKOUT
    // ============================================================

    function calcularTotalCheckout() {
        let total = 0;
        for (let i = 0; i < cart.length; i++) {
            const product = products.find(function(p) { return p.id === cart[i].productId; });
            if (product) {
                total += product.price * cart[i].quantity;
            } else if (cart[i].esMarketplace) {
                total += (cart[i].precio || 0) * cart[i].quantity;
            }
        }
        return total;
    }

    function obtenerItemsCheckout() {
        const items = [];
        for (let i = 0; i < cart.length; i++) {
            const product = products.find(function(p) { return p.id === cart[i].productId; });
            if (product) {
                items.push({
                    name: product.name,
                    quantity: cart[i].quantity,
                    price: product.price,
                    subtotal: product.price * cart[i].quantity
                });
            } else if (cart[i].esMarketplace) {
                items.push({
                    name: cart[i].nombre || 'Producto marketplace',
                    quantity: cart[i].quantity,
                    price: cart[i].precio || 0,
                    subtotal: (cart[i].precio || 0) * cart[i].quantity
                });
            }
        }
        return items;
    }

    // ============================================================
    // BOTÓN "VER FACTURA" - REDIRIGE AL TICKET
    // ============================================================

    document.getElementById('checkout-generar-factura')?.addEventListener('click', function() {
        // Verificar si hay datos del ticket
        if (ticketData) {
            // Mostrar el ticket directamente
            document.getElementById('ticket-view').style.display = 'block';
            document.getElementById('factura-fiscal-view').style.display = 'none';
            document.getElementById('factura-generada-view').style.display = 'none';
            showPage('factura');
        } else {
            // Si no hay datos, crear un ticket con los datos del checkout
            const compra = {
                id: 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000),
                fecha: new Date().toLocaleString('es-ES'),
                items: checkoutData.items || obtenerItemsCheckout(),
                total: checkoutData.total || calcularTotalCheckout(),
                metodo: checkoutData.metodoPago || 'Tarjeta',
                estado: 'entregado',
                direccion: checkoutData.direccion || {
                    nombre: currentUser.name || 'Juan Pérez',
                    email: currentUser.email || 'juan@email.com',
                    telefono: currentUser.phone || '55 1234 5678',
                    direccion: currentUser.address || 'Calle Principal 123, Colonia Centro',
                    ciudad: 'Ciudad de México',
                    cp: '12345'
                }
            };
            mostrarTicket(compra);
        }
    });

    // ============================================================
    // BOTÓN "CONTINUAR" DEL PASO DE ÉXITO
    // ============================================================

    document.getElementById('checkout-continuar-btn')?.addEventListener('click', function() {
        showPage('perfil');
    });

    // ============================================================
    // FACTURA - FUNCIONALIDAD 
    // ============================================================

    let facturaData = null;

    function generarFactura(compra) {
        // Si no hay compra, usar datos por defecto
        if (!compra) {
            compra = {
                id: 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000),
                fecha: new Date().toLocaleString('es-ES'),
                items: checkoutData.items || [],
                total: checkoutData.total || 0,
                metodo: checkoutData.metodoPago || 'Tarjeta',
                estado: 'entregado',
                direccion: checkoutData.direccion || {
                    nombre: currentUser.name || 'Juan Pérez',
                    email: currentUser.email || 'juan@email.com',
                    telefono: currentUser.phone || '55 1234 5678',
                    direccion: currentUser.address || 'Calle Principal 123, Colonia Centro',
                    ciudad: 'Ciudad de México',
                    cp: '12345'
                }
            };
        }

        facturaData = {
            folio: compra.id || 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000),
            fecha: compra.fecha || new Date().toLocaleDateString('es-ES'),
            hora: compra.fecha ? compra.fecha.split(' ')[1] || '12:00' : new Date().toLocaleTimeString('es-ES'),
            cliente: {
                nombre: compra.direccion?.nombre || currentUser.name || 'Juan Pérez',
                email: compra.direccion?.email || currentUser.email || 'juan@email.com',
                direccion: compra.direccion?.direccion || currentUser.address || 'Calle Principal 123, Colonia Centro'
            },
            items: compra.items || [],
            total: compra.total || 0,
            metodo: compra.metodo || 'Tarjeta'
        };
        
        // Actualizar la factura en el DOM
        document.getElementById('factura-folio').textContent = facturaData.folio;
        document.getElementById('factura-fecha').textContent = facturaData.fecha;
        document.getElementById('factura-hora').textContent = facturaData.hora;
        document.getElementById('factura-cliente-nombre').textContent = facturaData.cliente.nombre;
        document.getElementById('factura-cliente-email').textContent = facturaData.cliente.email;
        document.getElementById('factura-cliente-direccion').textContent = facturaData.cliente.direccion;
        
        const tbody = document.getElementById('factura-productos-body');
        let htmlItems = '';
        if (facturaData.items && facturaData.items.length > 0) {
            for (let i = 0; i < facturaData.items.length; i++) {
                const item = facturaData.items[i];
                htmlItems += '<tr>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:center;">' + (item.quantity || 0) + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem;">' + (item.name || 'Producto') + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:right;">$' + (item.price || 0).toFixed(2) + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:right;">$' + (item.subtotal || 0).toFixed(2) + '</td>';
                htmlItems += '</tr>';
            }
        } else {
            htmlItems = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#6b4f7a;">No hay productos en esta factura.</td></tr>';
        }
        tbody.innerHTML = htmlItems;
        document.getElementById('factura-total').textContent = '$' + (facturaData.total || 0).toFixed(2);
        
        showPage('factura');
    }

    document.getElementById('factura-descargar-pdf')?.addEventListener('click', function() {
        const feedback = document.getElementById('factura-feedback');
        feedback.className = 'auth-success alert-message';
        feedback.textContent = '📄 Generando PDF (simulado)...';
        feedback.classList.remove('hidden');
        
        setTimeout(function() {
            feedback.textContent = '✅ PDF descargado correctamente (simulación)';
            setTimeout(function() {
                feedback.classList.add('hidden');
            }, 2500);
        }, 1500);
    });

    document.getElementById('factura-imprimir-btn')?.addEventListener('click', function() {
        const feedback = document.getElementById('factura-feedback');
        feedback.className = 'auth-success alert-message';
        feedback.textContent = '🖨️ Enviando a impresión (simulado)...';
        feedback.classList.remove('hidden');
        
        setTimeout(function() {
            feedback.textContent = '✅ Impresión enviada correctamente (simulación)';
            setTimeout(function() {
                feedback.classList.add('hidden');
            }, 2000);
        }, 1500);
    });

    document.getElementById('factura-volver-btn')?.addEventListener('click', function() {
        showPage('perfil');
    });

    // ============================================================
    // HISTORIAL DE COMPRAS (CORREGIDO)
    // ============================================================

    function guardarCompra(compra) {
        historialCompras.unshift(compra);
        saveHistorial();
        renderHistorialCompras();
    }

    function renderHistorialCompras() {
        const container = document.getElementById('compras-lista-container');
        const vacio = document.getElementById('compras-vacio');
        const filtroEstado = document.getElementById('compras-filtro-estado')?.value || 'todos';
        const busqueda = document.getElementById('compras-buscar')?.value?.toLowerCase() || '';
        
        let filtrados = historialCompras;
        
        if (filtroEstado !== 'todos') {
            filtrados = filtrados.filter(function(c) { return c.estado === filtroEstado; });
        }
        
        if (busqueda) {
            filtrados = filtrados.filter(function(c) {
                return (c.id || '').toLowerCase().includes(busqueda) ||
                       c.items.some(function(i) { return (i.name || '').toLowerCase().includes(busqueda); });
            });
        }
        
        if (filtrados.length === 0) {
            container.innerHTML = '';
            vacio.classList.remove('hidden');
            return;
        }
        vacio.classList.add('hidden');
        
        let html = '';
        for (let i = 0; i < filtrados.length; i++) {
            const c = filtrados[i];
            const estadoClass = c.estado === 'entregado' ? 'status-available' : 
                               (c.estado === 'en preparacion' ? 'status-warning' : 
                               (c.estado === 'pendiente' ? 'status-out-of-stock' : 'status-inactive'));
            
            let estadoIcon = '';
            if (c.estado === 'entregado') estadoIcon = '✅';
            else if (c.estado === 'en preparacion') estadoIcon = '🔄';
            else if (c.estado === 'pendiente') estadoIcon = '⏳';
            
            html += '<div class="compra-item" style="background:#faf8fc; border-radius:16px; padding:1rem; border:1px solid var(--border); transition:0.2s; margin-bottom:0.8rem;">';
            html += '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">';
            html += '<div style="flex:1;">';
            html += '<div style="font-weight:700; color:var(--text-primary); font-size:1rem;">' + (c.id || '') + '</div>';
            html += '<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.2rem;">';
            html += '<i class="far fa-calendar-alt" style="margin-right:0.3rem;"></i> ' + (c.fecha || '');
            html += '</div>';
            html += '<div style="font-size:0.85rem; color:var(--text-secondary);">';
            html += '<i class="fas fa-credit-card" style="margin-right:0.3rem;"></i> ' + (c.metodo || '') + ' · ' + (c.items ? c.items.length : 0) + ' productos';
            html += '</div>';
            html += '<div style="margin-top:0.3rem; display:flex; flex-wrap:wrap; gap:0.3rem;">';
            if (c.items && c.items.length > 0) {
                var itemsMostrar = c.items.slice(0, 3);
                for (var j = 0; j < itemsMostrar.length; j++) {
                    html += '<span style="background:#ede6f5; padding:0.1rem 0.6rem; border-radius:12px; font-size:0.7rem; color:var(--text-secondary);">';
                    html += itemsMostrar[j].quantity + 'x ' + itemsMostrar[j].name;
                    html += '</span>';
                }
                if (c.items.length > 3) {
                    html += '<span style="background:#ede6f5; padding:0.1rem 0.6rem; border-radius:12px; font-size:0.7rem; color:var(--text-secondary);">';
                    html += '+' + (c.items.length - 3) + ' más';
                    html += '</span>';
                }
            }
            html += '</div>';
            html += '</div>';
            html += '<div style="text-align:right; min-width:100px;">';
            html += '<span class="status-badge ' + estadoClass + '" style="font-size:0.75rem;">' + estadoIcon + ' ' + (c.estado ? c.estado.charAt(0).toUpperCase() + c.estado.slice(1) : '') + '</span>';
            html += '<div style="font-weight:700; color:var(--primary); font-size:1.2rem; margin-top:0.3rem;">$' + (c.total || 0).toFixed(2) + '</div>';
            html += '</div>';
            html += '</div>';
            html += '<div style="display:flex; gap:0.5rem; margin-top:0.8rem; flex-wrap:wrap; border-top:1px solid var(--border); padding-top:0.8rem;">';
            html += '<button class="btn-secondary compra-ver-detalle" data-index="' + i + '" style="padding:0.4rem 1rem; font-size:0.85rem; min-height:36px; width:100%; justify-content:center;">';
            html += '<i class="fas fa-eye"></i> Ver detalle';
            html += '</button>';
            html += '</div>';
            html += '</div>';
        }
        container.innerHTML = html;
        
        container.querySelectorAll('.compra-ver-detalle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                const compra = historialCompras[idx];
                if (compra) {
                    generarFactura(compra);
                } else {
                    console.error('Compra no encontrada:', idx);
                }
            });
        });
    }

    document.getElementById('compras-filtro-estado')?.addEventListener('change', renderHistorialCompras);
    document.getElementById('compras-buscar')?.addEventListener('input', renderHistorialCompras);

    document.getElementById('compras-ir-catalogo')?.addEventListener('click', function() {
        showPage('catalogo');
    });

    // ============================================================
    // EVENT LISTENER - PUBLICAR PRODUCTO
    // ============================================================

    var publicarBtn = document.getElementById('publicar-btn');
    if (publicarBtn) {
        publicarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Botón "Publicar producto" clickeado');
            publicarProducto();
        });
    }

    var publicarForm = document.getElementById('publicar-form');
    if (publicarForm) {
        publicarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Formulario de publicación enviado');
            publicarProducto();
        });
    }

    // ============================================================
    // FACTURA - VARIABLES GLOBALES
    // ============================================================

    let ticketData = null;
    let facturaFiscalData = null;

    // ============================================================
    // FUNCIÓN PARA MOSTRAR TICKET DESDE CHECKOUT
    // ============================================================

    function mostrarTicket(compra) {
        // Si no hay compra, usar datos del checkout
        if (!compra) {
            compra = {
                id: 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000),
                fecha: new Date().toLocaleString('es-ES'),
                items: checkoutData.items || obtenerItemsCheckout(),
                total: checkoutData.total || calcularTotalCheckout(),
                metodo: checkoutData.metodoPago || 'Tarjeta',
                estado: 'entregado',
                direccion: checkoutData.direccion || {
                    nombre: currentUser.name || 'Juan Pérez',
                    email: currentUser.email || 'juan@email.com',
                    telefono: currentUser.phone || '55 1234 5678',
                    direccion: currentUser.address || 'Calle Principal 123, Colonia Centro',
                    ciudad: 'Ciudad de México',
                    cp: '12345'
                }
            };
        }

        // Guardar datos del ticket
        ticketData = {
            folio: compra.id || 'DEL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000),
            fecha: compra.fecha || new Date().toLocaleString('es-ES'),
            hora: compra.fecha ? compra.fecha.split(' ')[1] || '12:00' : new Date().toLocaleTimeString('es-ES'),
            cliente: {
                nombre: compra.direccion?.nombre || currentUser.name || 'Juan Pérez',
                email: compra.direccion?.email || currentUser.email || 'juan@email.com',
                direccion: compra.direccion?.direccion || currentUser.address || 'Calle Principal 123, Colonia Centro'
            },
            items: compra.items || [],
            total: compra.total || 0,
            metodo: compra.metodo || 'Tarjeta'
        };

        // Actualizar ticket en DOM
        document.getElementById('ticket-folio').textContent = ticketData.folio;
        document.getElementById('ticket-fecha').textContent = ticketData.fecha;
        document.getElementById('ticket-hora').textContent = ticketData.hora;
        document.getElementById('ticket-cliente-nombre').textContent = ticketData.cliente.nombre;
        document.getElementById('ticket-cliente-email').textContent = ticketData.cliente.email;
        document.getElementById('ticket-cliente-direccion').textContent = ticketData.cliente.direccion;

        // Productos
        const tbody = document.getElementById('ticket-productos-body');
        let htmlItems = '';
        if (ticketData.items && ticketData.items.length > 0) {
            for (let i = 0; i < ticketData.items.length; i++) {
                const item = ticketData.items[i];
                htmlItems += '<tr>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:center;">' + (item.quantity || 0) + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem;">' + (item.name || 'Producto') + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:right;">$' + (item.price || 0).toFixed(2) + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:right;">$' + (item.subtotal || (item.price * item.quantity) || 0).toFixed(2) + '</td>';
                htmlItems += '</tr>';
            }
        } else {
            htmlItems = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#6b4f7a;">No hay productos en este ticket.</td></tr>';
        }
        tbody.innerHTML = htmlItems;
        document.getElementById('ticket-total').textContent = '$' + (ticketData.total || 0).toFixed(2);

        // Ocultar feedback
        const feedback = document.getElementById('ticket-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.textContent = '';
            feedback.className = 'hidden alert-message';
        }

        // Mostrar ticket, ocultar factura fiscal
        document.getElementById('ticket-view').style.display = 'block';
        document.getElementById('factura-fiscal-view').style.display = 'none';
        document.getElementById('factura-generada-view').style.display = 'none';

        showPage('factura');
    }

    // ============================================================
    // FUNCIÓN PARA IR A FACTURA FISCAL DESDE TICKET
    // ============================================================

    function irAFacturaFiscal() {
        // Cargar datos del ticket en la factura fiscal
        document.getElementById('factura-folio-generada').textContent = ticketData.folio;
        document.getElementById('factura-fecha-generada').textContent = ticketData.fecha;
        document.getElementById('factura-hora-generada').textContent = ticketData.hora;
        document.getElementById('factura-show-cliente-nombre').textContent = ticketData.cliente.nombre;
        document.getElementById('factura-show-cliente-email').textContent = ticketData.cliente.email;
        document.getElementById('factura-show-cliente-direccion').textContent = ticketData.cliente.direccion;

        // Productos
        const tbody = document.getElementById('factura-productos-body-generada');
        let htmlItems = '';
        if (ticketData.items && ticketData.items.length > 0) {
            for (let i = 0; i < ticketData.items.length; i++) {
                const item = ticketData.items[i];
                htmlItems += '<tr>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:center;">' + (item.quantity || 0) + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem;">' + (item.name || 'Producto') + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:right;">$' + (item.price || 0).toFixed(2) + '</td>';
                htmlItems += '<td style="padding:0.3rem 0.5rem; text-align:right;">$' + (item.subtotal || (item.price * item.quantity) || 0).toFixed(2) + '</td>';
                htmlItems += '</tr>';
            }
        } else {
            htmlItems = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#6b4f7a;">No hay productos en esta factura.</td></tr>';
        }
        tbody.innerHTML = htmlItems;
        document.getElementById('factura-total-generada').textContent = '$' + (ticketData.total || 0).toFixed(2);

        // Limpiar formulario
        document.getElementById('factura-rfc').value = '';
        document.getElementById('factura-razon-social').value = '';
        document.getElementById('factura-regimen').value = 'Régimen General de Ley';
        document.getElementById('factura-cp').value = '';
        document.getElementById('factura-uso-cfdi').value = 'G01 - Adquisición de mercancias';
        
        const feedback = document.getElementById('factura-fiscal-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.textContent = '';
            feedback.className = 'hidden alert-message';
        }

        // Ocultar generada, mostrar formulario
        document.getElementById('factura-generada-view').style.display = 'none';
        document.getElementById('factura-fiscal-view').style.display = 'block';
        document.getElementById('ticket-view').style.display = 'none';

        // Scroll al inicio
        document.querySelector('.factura-container').scrollIntoView({ behavior: 'smooth' });
    }

    // ============================================================
    // FUNCIÓN PARA GENERAR FACTURA (simulada)
    // ============================================================

    function generarFacturaFiscal() {
        const rfc = document.getElementById('factura-rfc').value.trim().toUpperCase();
        const razonSocial = document.getElementById('factura-razon-social').value.trim();
        const regimen = document.getElementById('factura-regimen').value;
        const cp = document.getElementById('factura-cp').value.trim();
        const uso = document.getElementById('factura-uso-cfdi').value;
        const feedback = document.getElementById('factura-fiscal-feedback');

       
        // Guardar datos fiscales
        facturaFiscalData = {
            rfc: rfc,
            razonSocial: razonSocial,
            regimen: regimen,
            cp: cp || 'No especificado',
            uso: uso
        };

        // Mostrar en la vista generada
        document.getElementById('factura-show-rfc').textContent = rfc;
        document.getElementById('factura-show-razon').textContent = razonSocial;
        document.getElementById('factura-show-regimen').textContent = regimen;
        document.getElementById('factura-show-cp').textContent = cp || 'No especificado';
        document.getElementById('factura-show-uso').textContent = uso;

        // Ocultar formulario, mostrar factura generada
        document.getElementById('factura-fiscal-view').querySelector('form').style.display = 'none';
        document.getElementById('factura-generada-view').style.display = 'block';

        // Feedback de éxito
        showFormMessage(feedback, '✅ Factura CFDI generada correctamente.', 'success');

        // Scroll a la factura generada
        document.getElementById('factura-generada-view').scrollIntoView({ behavior: 'smooth' });
    }

    // ============================================================
    // FUNCIÓN PARA DESCARGAR PDF (vincular a Factura.pdf)
    // ============================================================

    function descargarFacturaPDF() {
        const feedback = document.getElementById('factura-generada-feedback');
        
        // Mostrar feedback de descarga
        if (feedback) {
            feedback.className = 'auth-success alert-message';
            feedback.textContent = '📄 Descargando factura...';
            feedback.classList.remove('hidden');
        }

        // Simular descarga - ABRIR EL ARCHIVO Factura.pdf
        setTimeout(function() {
            // Abrir el PDF en una nueva ventana/pestaña
            window.open('Factura.pdf', '_blank');
            
            if (feedback) {
                feedback.textContent = '✅ Factura descargada correctamente.';
                feedback.className = 'auth-success alert-message';
                setTimeout(function() {
                    feedback.classList.add('hidden');
                }, 3000);
            }
        }, 800);
    }

    // ============================================================
    // EVENT LISTENERS - FACTURA
    // ============================================================

    // Botón "Descargar Factura Fiscal" desde el ticket
    document.getElementById('ticket-facturar-btn')?.addEventListener('click', function() {
        irAFacturaFiscal();
    });

    // Botón "Volver atrás" desde el ticket
    document.getElementById('ticket-volver-btn')?.addEventListener('click', function() {
        showPage('perfil');
    });

    // Botón "Generar Factura" desde el formulario
    document.getElementById('factura-generar-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        generarFacturaFiscal();
    });

    // Botón "Volver atrás" desde el formulario de factura
    document.getElementById('factura-volver-ticket-btn')?.addEventListener('click', function() {
        document.getElementById('factura-fiscal-view').style.display = 'none';
        document.getElementById('ticket-view').style.display = 'block';
        document.getElementById('factura-generada-view').style.display = 'none';
        // Restaurar formulario
        document.getElementById('factura-fiscal-view').querySelector('form').style.display = 'block';
        const feedback = document.getElementById('factura-fiscal-feedback');
        if (feedback) {
            feedback.classList.add('hidden');
            feedback.textContent = '';
            feedback.className = 'hidden alert-message';
        }
    });

    // Botón "Descargar PDF" desde la factura generada
    document.getElementById('factura-descargar-pdf-btn')?.addEventListener('click', function() {
        descargarFacturaPDF();
    });

    // Botón "Volver atrás" desde la factura generada
    document.getElementById('factura-volver-final-btn')?.addEventListener('click', function() {
        showPage('perfil');
    });

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
    renderHistorialCompras();
    showPage('inicio');

});