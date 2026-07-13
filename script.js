document.addEventListener('DOMContentLoaded', function() {

    let products = [];
    const defaultProducts = [
        { 
            id: 1, 
            name: 'Pizza Margarita', 
            category: 'Pizzas', 
            price: 12.50, 
            desc: 'Clasica pizza con mozzarella, tomate fresco y albahaca.', 
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
            name: 'Hamburguesa Clasica', 
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
            name: 'Salmon a la plancha', 
            category: 'Pescados', 
            price: 18.40, 
            desc: 'Salmon fresco sellado a la plancha, con vegetales asados.', 
            image: 'salmon.jpg',
            badge: 'popular', 
            badgeText: 'Popular', 
            stock: 0, 
            status: 'agotado' 
        },
        { 
            id: 6, 
            name: 'Ceviche de camaron', 
            category: 'Pescados', 
            price: 15.20, 
            desc: 'Camarones frescos marinados en jugo de limon con cebolla y cilantro.', 
            image: 'ceviche.jpg',
            badge: 'new', 
            badgeText: 'Nuevo', 
            stock: 7, 
            status: 'disponible' 
        },
        { 
            id: 7, 
            name: 'Cafe de especialidad', 
            category: 'Bebidas', 
            price: 4.20, 
            desc: 'Cafe de origen mexicano, tueste medio, con notas de chocolate.', 
            image: 'cafe.jpg',
            badge: null, 
            badgeText: null, 
            stock: 20, 
            status: 'disponible' 
        },
        { 
            id: 8, 
            name: 'Ensalada Cesar', 
            category: 'Ensaladas', 
            price: 11.80, 
            desc: 'Lechuga romana, pollo a la plancha, parmesano y aderezo Cesar.', 
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
        } catch (e) {}
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
        } catch (e) {}
    }

    let clients = [];
    const defaultClients = [
        { id: 1, name: 'Maria Garcia', email: 'maria@email.com', phone: '55 1234 5678', address: 'Av. Principal 123', orders: 8, spent: 340.50, registeredDate: '10/01/2024' },
        { id: 2, name: 'Carlos Lopez', email: 'carlos@email.com', phone: '55 2345 6789', address: 'Calle Centro 456', orders: 5, spent: 210.80, registeredDate: '15/03/2024' },
        { id: 3, name: 'Ana Martinez', email: 'ana@email.com', phone: '55 3456 7890', address: 'Boulevard Sur 789', orders: 12, spent: 520.30, registeredDate: '02/06/2024' },
        { id: 4, name: 'Pedro Ramirez', email: 'pedro@email.com', phone: '55 4567 8901', address: 'Paseo Norte 321', orders: 3, spent: 95.20, registeredDate: '20/08/2024' },
        { id: 5, name: 'Laura Fernandez', email: 'laura@email.com', phone: '55 5678 9012', address: 'Avenida Este 654', orders: 6, spent: 280.00, registeredDate: '05/10/2024' }
    ];

    const defaultOrders = [
        { id: 125, client: 'Maria Garcia', products: 'Pizza Margarita (2)', total: 25.00, status: 'entregado', date: '15/01/2025 14:30' },
        { id: 124, client: 'Carlos Lopez', products: 'Hamburguesa Clasica (1)', total: 10.90, status: 'entregado', date: '15/01/2025 13:15' },
        { id: 123, client: 'Ana Martinez', products: 'Salmon a la plancha (1)', total: 18.40, status: 'en preparacion', date: '15/01/2025 12:45' },
        { id: 122, client: 'Pedro Ramirez', products: 'Ceviche de camaron (2)', total: 30.40, status: 'pendiente', date: '15/01/2025 12:00' },
        { id: 121, client: 'Laura Fernandez', products: 'Ensalada Cesar (1)', total: 11.80, status: 'entregado', date: '15/01/2025 11:20' }
    ];

    let orders = [];

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

    let promociones = [
        { nombre: 'Oferta de fin de semana', descuento: '20%', productos: 'Pizza Pepperoni, Hamburguesa BBQ', vigencia: '18-20 Ene', estado: 'Activa' },
        { nombre: 'Combo Familiar', descuento: '15%', productos: 'Pizza Margarita + Ensalada Cesar', vigencia: '15-31 Ene', estado: 'Activa' },
        { nombre: '2x1 en bebidas', descuento: '50%', productos: 'Cafe de especialidad', vigencia: '10-20 Ene', estado: 'Vencida' }
    ];

    let isLoggedIn = false;
    let isAdmin = false;
    let selectedCategory = 'todas';
    let currentQty = 1;
    let currentProductId = null;
    let editingProductId = null;
    let editingClientId = null;
    let cartOpen = false;

    let confirmCallback = null;
    let confirmTarget = null;

    const cartBadge = document.getElementById('cart-badge');
    const cartTotalBadge = document.getElementById('cart-total-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartToggleBtn = document.getElementById('cart-toggle-btn');

    const initialComments = [
        { name: 'Maria', text: 'Las pizzas son increibles y el servicio es super amable.' },
        { name: 'Luis', text: 'Me encanta la variedad de platos y la presentacion.' }
    ];

    function renderComments() {
        const commentsList = document.getElementById('comments-list');
        const communityCount = document.getElementById('community-count');
        if (!commentsList) return;
        commentsList.innerHTML = '';
        initialComments.forEach(function(comment) {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = '<strong>' + comment.name + '</strong><p>' + comment.text + '</p>';
            commentsList.appendChild(div);
        });
        if (communityCount) communityCount.textContent = initialComments.length;
    }

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
        exito: document.getElementById('page-exito')
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

    function showConfirmModal(message, callback) {
        var modal = document.getElementById('confirm-modal');
        var messageEl = document.getElementById('confirm-message');
        var confirmBtn = document.getElementById('confirm-btn');
        var cancelBtn = document.getElementById('confirm-cancel-btn');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirm-modal';
            modal.className = 'modal-overlay';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-box">
                    <div class="modal-icon" aria-hidden="true"><i class="fas fa-question-circle"></i></div>
                    <h2>Confirmar</h2>
                    <p id="confirm-message">¿Estas seguro?</p>
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

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                if (callback) callback(false);
            }
        });
    }

    function showFormMessage(msgElement, message, type) {
        if (!msgElement) return;
        msgElement.className = type === 'success' ? 'auth-success alert-message' : 'auth-error alert-message';
        msgElement.textContent = message;
        msgElement.classList.remove('hidden');
        
        setTimeout(function() {
            msgElement.classList.add('hidden');
        }, 4000);
    }

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
            html += '<button class="btn-edit edit-promo-btn" data-index="' + i + '" aria-label="Editar promocion"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-delete delete-promo-btn" data-index="' + i + '" aria-label="Eliminar promocion"><i class="fas fa-trash"></i></button>';
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
                var promoName = promociones[index] ? promociones[index].nombre : 'esta promocion';
                if (promoName === 'Sin nombre' || promoName === '') {
                    promoName = 'esta promocion';
                }
                showConfirmModal('Eliminar la promocion "' + promoName + '"?', function(confirmed) {
                    if (confirmed) {
                        promociones.splice(index, 1);
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
            title.textContent = 'Nueva Promocion';
            document.getElementById('promo-form-index').value = '';
            document.getElementById('promo-form-name').value = '';
            document.getElementById('promo-form-discount').value = '';
            document.getElementById('promo-form-products').value = '';
            document.getElementById('promo-form-validity').value = '';
            document.getElementById('promo-form-status').value = 'Activa';
        } else {
            title.textContent = 'Editar Promocion';
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
            showFormMessage(msg, 'Promocion creada exitosamente.', 'success');
        } else {
            promociones[parseInt(index)] = promoData;
            showFormMessage(msg, 'Promocion actualizada exitosamente.', 'success');
        }

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
                if (desc) desc.textContent = 'Promocion especial: ' + promo.productos;
                if (meta) {
                    meta.innerHTML = '<span><i class="fas fa-clock" aria-hidden="true"></i> ' + promo.vigencia + '</span><span><i class="fas fa-tag" aria-hidden="true"></i> ' + promo.estado + '</span>';
                }
            }
        });
    }

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

    function updateCartUI() {
        var totalItems = 0;
        for (var i = 0; i < cart.length; i++) {
            totalItems += cart[i].quantity;
        }
        if (cartBadge) cartBadge.textContent = totalItems;

        var totalPrice = 0;
        for (var j = 0; j < cart.length; j++) {
            var p = products.find(function(pr) { return pr.id === cart[j].productId; });
            if (p) totalPrice += p.price * cart[j].quantity;
        }
        if (cartTotalBadge) cartTotalBadge.textContent = '$' + totalPrice.toFixed(0);

        var clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.disabled = cart.length === 0;
        }

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty" role="status"><i class="fas fa-shopping-basket" aria-hidden="true"></i><p>Tu carrito esta vacio</p><small>Explora nuestro catalogo y agrega tus productos favoritos</small></div>';
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
        
        setTimeout(function() {
            openCart();
        }, 100);
    }

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
                navLoginBtn.innerHTML = '<i class="fas fa-user-circle" aria-hidden="true"></i> Iniciar sesion';
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
            var modal = document.getElementById('login-required-modal');
            if (modal) modal.classList.remove('show');
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
            if (!isLoggedIn) {
                var modal = document.getElementById('login-required-modal');
                if (modal) modal.classList.add('show');
                return;
            }
            processPayment();
        });
    }

    var loginRequiredBtn = document.getElementById('login-required-btn');
    if (loginRequiredBtn) {
        loginRequiredBtn.addEventListener('click', function() {
            var modal = document.getElementById('login-required-modal');
            if (modal) modal.classList.remove('show');
            closeCart();
            showPage('login');
        });
    }

    var loginRequiredCancel = document.getElementById('login-required-cancel');
    if (loginRequiredCancel) {
        loginRequiredCancel.addEventListener('click', function() {
            var modal = document.getElementById('login-required-modal');
            if (modal) modal.classList.remove('show');
        });
    }

    var loginRequiredModal = document.getElementById('login-required-modal');
    if (loginRequiredModal) {
        loginRequiredModal.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('show');
        });
    }

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
            container.innerHTML = '<div class="no-results" style="grid-column:1/-1; text-align:center; padding:2rem; color:#6b4f7a;"><i class="fas fa-utensils" style="font-size:2rem; color:#d9c4e8; display:block; margin-bottom:0.8rem;"></i>No hay productos en esta categoria.</div>';
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
                            var msg = document.getElementById('form-message');
                            if (msg) {
                                showFormMessage(msg, 'Producto eliminado correctamente.', 'success');
                            }
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
            var desc = document.getElementById('form-product-desc')?.value || 'Sin descripcion';
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

    var productSearch = document.getElementById('product-search');
    if (productSearch) productSearch.addEventListener('input', renderProductTable);
    
    var categoryFilterSelect = document.getElementById('category-filter');
    if (categoryFilterSelect) categoryFilterSelect.addEventListener('change', renderProductTable);
    
    var statusFilterSelect = document.getElementById('status-filter');
    if (statusFilterSelect) statusFilterSelect.addEventListener('change', renderProductTable);

    var registroBtn = document.getElementById('registro-btn');
    if (registroBtn) {
        registroBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var nombre = document.getElementById('registro-nombre')?.value || '';
            var email = document.getElementById('registro-email')?.value || '';
            var password = document.getElementById('registro-password')?.value || '';
            var msg = document.getElementById('registro-message');

            if (msg) {
                showFormMessage(msg, 'Registro exitoso (simulado).', 'success');
            }

            var nombreInput = document.getElementById('registro-nombre');
            var emailInput = document.getElementById('registro-email');
            var passwordInput = document.getElementById('registro-password');
            if (nombreInput) nombreInput.value = '';
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

            setTimeout(function() { showPage('login'); }, 1500);
        });
    }

    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var email = document.getElementById('login-email')?.value || '';
            var password = document.getElementById('login-password')?.value || '';
            var msg = document.getElementById('login-message');

            isLoggedIn = true;
            isAdmin = false;
            if (msg) {
                showFormMessage(msg, 'Inicio de sesion exitoso.', 'success');
            }

            var emailInput = document.getElementById('login-email');
            var passwordInput = document.getElementById('login-password');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

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
            var email = document.getElementById('login-email')?.value || '';
            var password = document.getElementById('login-password')?.value || '';
            var msg = document.getElementById('login-message');

            isLoggedIn = true;
            isAdmin = true;
            if (msg) {
                showFormMessage(msg, 'Acceso de administrador concedido.', 'success');
            }

            var emailInput = document.getElementById('login-email');
            var passwordInput = document.getElementById('login-password');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';

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
            if (msg) {
                showFormMessage(msg, 'Se ha enviado un enlace de restablecimiento (simulado).', 'success');
            }
        });
    }

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            isLoggedIn = false;
            isAdmin = false;
            var msg = document.getElementById('profile-message');
            if (msg) {
                showFormMessage(msg, 'Has cerrado sesion exitosamente.', 'success');
            }
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
            var msg = document.getElementById('profile-message');
            if (msg) {
                showFormMessage(msg, 'Has cerrado sesion exitosamente.', 'success');
            }
        });
    }

    var editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            var msg = document.getElementById('profile-message');
            if (msg) {
                showFormMessage(msg, 'Funcion de edicion de perfil (simulada).', 'success');
            }
        });
    }

    var sendContactBtn = document.getElementById('send-contact-btn');
    if (sendContactBtn) {
        sendContactBtn.addEventListener('click', function() {
            var name = document.getElementById('contact-name')?.value || '';
            var email = document.getElementById('contact-email')?.value || '';
            var msg = document.getElementById('contact-message')?.value || '';
            var feedback = document.getElementById('contact-feedback');

            if (feedback) {
                showFormMessage(feedback, 'Mensaje enviado (simulado).', 'success');
            }

            var nameInput = document.getElementById('contact-name');
            var emailInput = document.getElementById('contact-email');
            var msgInput = document.getElementById('contact-message');
            if (nameInput) nameInput.value = '';
            if (emailInput) emailInput.value = '';
            if (msgInput) msgInput.value = '';
        });
    }

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
            var phone = document.getElementById('form-client-phone')?.value || 'Sin telefono';
            var address = document.getElementById('form-client-address')?.value || 'Sin direccion';
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
    // COMUNIDAD - GESTIÓN DE COMENTARIOS
    // ============================================================

    var communityComments = [
        { 
            id: 1, 
            name: 'María García', 
            rating: 5, 
            text: '¡La pizza Margarita es espectacular! La masa crujiente y los ingredientes frescos hacen una combinación perfecta. Definitivamente volveré a pedir.', 
            date: '15/01/2025 14:30' 
        },
        { 
            id: 2, 
            name: 'Carlos López', 
            rating: 4, 
            text: 'Muy buena atención y la comida llegó caliente. La hamburguesa BBQ estaba deliciosa, aunque me hubiera gustado más salsa.', 
            date: '14/01/2025 18:45' 
        },
        { 
            id: 3, 
            name: 'Ana Martínez', 
            rating: 5, 
            text: 'El ceviche de camarón es el mejor que he probado. Fresco, bien sazonado y con una presentación impecable. ¡100% recomendado!', 
            date: '13/01/2025 12:20' 
        },
        { 
            id: 4, 
            name: 'Pedro Ramírez', 
            rating: 3, 
            text: 'Buena comida pero el tiempo de entrega fue un poco largo. La ensalada Cesar estaba rica pero le faltaba un poco de aderezo.', 
            date: '12/01/2025 20:10' 
        }
    ];

    var nextCommentId = 5;

    function renderCommunityComments() {
        var list = document.getElementById('community-comments-list');
        var count = document.getElementById('community-count');
        var avgRating = document.getElementById('avg-rating');
        var totalComments = document.getElementById('total-comments');
        
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
                var stars = '';
                for (var j = 0; j < 5; j++) {
                    stars += j < c.rating ? '★' : '☆';
                }
                html += '<div class="comment-item">';
                html += '<div class="comment-header">';
                html += '<div class="comment-author"><strong>' + c.name + '</strong></div>';
                html += '<span class="comment-rating">' + stars + '</span>';
                html += '</div>';
                html += '<div style="display:flex; justify-content:space-between; align-items:center;">';
                html += '<p>' + c.text + '</p>';
                html += '<span class="comment-date">' + c.date + '</span>';
                html += '</div>';
                html += '</div>';
            }
            list.innerHTML = html;
        }

        if (count) count.textContent = communityComments.length;
        if (totalComments) totalComments.textContent = communityComments.length;
        
        if (communityComments.length > 0) {
            var total = 0;
            for (var k = 0; k < communityComments.length; k++) {
                total += communityComments[k].rating;
            }
            var avg = (total / communityComments.length).toFixed(1);
            if (avgRating) avgRating.textContent = avg;
        } else {
            if (avgRating) avgRating.textContent = '0.0';
        }
    }

    function addCommunityComment(name, rating, text) {
        var now = new Date();
        var dateStr = now.getDate().toString().padStart(2, '0') + '/' + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                      now.getFullYear() + ' ' + 
                      now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
        
        var newComment = {
            id: nextCommentId++,
            name: name,
            rating: rating,
            text: text,
            date: dateStr
        };
        
        communityComments.unshift(newComment);
        renderCommunityComments();
        
        var feedback = document.getElementById('community-feedback');
        if (feedback) {
            showFormMessage(feedback, '¡Comentario publicado exitosamente!', 'success');
            setTimeout(function() {
                feedback.classList.add('hidden');
            }, 4000);
        }
    }

    var stars = document.querySelectorAll('.star-rating .star');
    var selectedRating = 0;

    if (stars.length > 0) {
        stars.forEach(function(star) {
            star.addEventListener('click', function() {
                var value = parseInt(this.getAttribute('data-value'));
                selectedRating = value;
                updateStars(value);
                var label = document.getElementById('rating-label');
                if (label) {
                    var labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
                    label.textContent = labels[value] || 'Selecciona una calificación';
                }
            });
            
            star.addEventListener('mouseenter', function() {
                var value = parseInt(this.getAttribute('data-value'));
                updateStars(value);
            });
            
            star.addEventListener('mouseleave', function() {
                updateStars(selectedRating);
            });
            
            star.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    function updateStars(rating) {
        stars.forEach(function(star) {
            var value = parseInt(star.getAttribute('data-value'));
            if (value <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    var communityForm = document.getElementById('community-form');
    if (communityForm) {
        communityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var nameInput = document.getElementById('community-name');
            var commentInput = document.getElementById('community-comment');
            var feedback = document.getElementById('community-feedback');
            
            if (!nameInput || !commentInput) return;
            
            var name = nameInput.value.trim() || 'Anónimo';
            var text = commentInput.value.trim() || 'Sin comentario';
            
            var rating = selectedRating || 3;
            
            addCommunityComment(name, rating, text);
            
            nameInput.value = '';
            commentInput.value = '';
            selectedRating = 0;
            updateStars(0);
            var label = document.getElementById('rating-label');
            if (label) label.textContent = 'Selecciona una calificación';
            
            setTimeout(function() {
                if (feedback) feedback.classList.add('hidden');
            }, 5000);
        });
    }

    var campaignComments = [
        { name: 'Maria', text: 'La pizza estuvo deliciosa y la promocion fue genial.' },
        { name: 'Luis', text: 'Muy buena experiencia, volveria a pedirla sin duda.' }
    ];

    function renderCampaignComments() {
        var list = document.getElementById('campaign-comments-list');
        var count = document.getElementById('campaign-community-count');
        if (!list) return;
        list.innerHTML = '';
        for (var i = 0; i < campaignComments.length; i++) {
            var comment = campaignComments[i];
            var div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = '<strong>' + comment.name + '</strong><p>' + comment.text + '</p>';
            list.appendChild(div);
        }
        if (count) count.textContent = campaignComments.length;
    }

    var campaignCommentForm = document.getElementById('campaign-comment-form');
    if (campaignCommentForm) {
        campaignCommentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameInput = document.getElementById('campaign-comment-name');
            var textInput = document.getElementById('campaign-comment-text');
            if (!nameInput || !textInput) return;
            var name = nameInput.value.trim() || 'Anónimo';
            var text = textInput.value.trim() || 'Sin comentario';
            campaignComments.unshift({ name: name, text: text });
            renderCampaignComments();
            campaignCommentForm.reset();
        });
    }

    renderCampaignComments();
    renderCommunityComments();

    buildCategoryMenu();
    renderCatalog(selectedCategory);
    renderProductTable();
    renderClientsTable();
    renderOrdersTable();
    renderPromotionsAdmin();
    renderPublicPromotions();
    updateCartUI();
    updateNavVisibility();
    updateDashboardStats();
    showPage('inicio');
    renderComments();

});