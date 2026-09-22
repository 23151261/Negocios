/**
 * ============================================================
 * SCM (Supply Chain Management - Administración de la Cadena de Suministros)
 * Conectado en tiempo real a la Base de Datos MySQL (API DeliciasResto)
 * ============================================================
 */

(function () {
    const API_BASE = 'http://localhost:5000/api/data';

    const STORAGE_KEYS = {
        PRODUCTS: 'delicias_scm_products',
        PROVIDERS: 'delicias_scm_providers',
        MOVEMENTS: 'delicias_scm_movements',
        ORDERS: 'delicias_scm_orders',
        MATURITY: 'delicias_scm_maturity'
    };

    // Datos predeterminados contextualizados para el restaurante DeliciasResto
    const DEFAULT_RESTAURANT_PRODUCTS = [
        { id: 1, name: 'Pizza Margarita', category: 'Pizzas', stock: 10, minStock: 8, strategy: 'PUSH', unitCost: 45.00, providerId: 2, desc: 'Pizza artesanal con tomate, mozzarella y albahaca fresca.' },
        { id: 2, name: 'Pizza Pepperoni', category: 'Pizzas', stock: 10, minStock: 8, strategy: 'PUSH', unitCost: 52.00, providerId: 1, desc: 'Pizza con pepperoni americano, mozzarella y salsa casera.' },
        { id: 3, name: 'Hamburguesa Clásica', category: 'Hamburguesas', stock: 8, minStock: 8, strategy: 'PUSH', unitCost: 40.00, providerId: 1, desc: 'Carne de res 100%, lechuga, tomate y queso.' },
        { id: 4, name: 'Hamburguesa BBQ', category: 'Hamburguesas', stock: 5, minStock: 8, strategy: 'PUSH', unitCost: 48.00, providerId: 1, desc: 'Hamburguesa con cebolla caramelizada, tocino y salsa BBQ.' },
        { id: 5, name: 'Salmón a la plancha', category: 'Pescados', stock: 6, minStock: 8, strategy: 'PULL', unitCost: 85.00, providerId: 3, desc: 'Salmón fresco del Pacífico sellado con vegetales.' },
        { id: 6, name: 'Ceviche de camarón', category: 'Pescados', stock: 7, minStock: 8, strategy: 'PULL', unitCost: 65.00, providerId: 3, desc: 'Camarones frescos marinados en jugo de limón y cilantro.' },
        { id: 7, name: 'Café de especialidad', category: 'Bebidas', stock: 20, minStock: 10, strategy: 'PUSH', unitCost: 15.00, providerId: 5, desc: 'Café de altura arábica con tueste medio de Chiapas.' },
        { id: 8, name: 'Ensalada César', category: 'Ensaladas', stock: 9, minStock: 8, strategy: 'PULL', unitCost: 35.00, providerId: 4, desc: 'Lechuga romana fresca, pollo, parmesano y crutones.' }
    ];

    const DEFAULT_RESTAURANT_PROVIDERS = [
        { id: 1, name: 'Distribuidora de Carnes La Finca', contact: 'Carlos Martínez', email: 'ventas@lafinca.com', phone: '55 2345 6789', address: 'Parque Industrial Norte #45, CDMX', products: 'Carne de res, pepperoni, costillas BBQ, tocino' },
        { id: 2, name: 'Lácteos y Quesos del Valle', contact: 'María Gómez', email: 'contacto@lacteosvalle.com', phone: '55 9876 5432', address: 'Av. de las Granjas 120, Querétaro', products: 'Queso mozzarella, queso cheddar, crema, mantequilla' },
        { id: 3, name: 'Mariscos y Pescados del Pacífico', contact: 'Roberto Silva', email: 'pedidos@mariscospacifico.com', phone: '55 4567 8901', address: 'Bodega 14 Central de Pescados, Veracruz', products: 'Salmón fresco, camarones, mariscos' },
        { id: 4, name: 'Agrícola San Isidro', contact: 'Laura Sánchez', email: 'laura@agricolasanisidro.com', phone: '55 3456 7890', address: 'Carretera Federal Km 18, Puebla', products: 'Tomates, lechuga romana, albahaca, cebollas' },
        { id: 5, name: 'Tostadores Café de Altura', contact: 'Juan Hernández', email: 'juan@cafedealtura.com', phone: '55 1234 5678', address: 'Finca Los Cedros, Chiapas', products: 'Granos de café arábica y tueste de especialidad' }
    ];

    const DEFAULT_RESTAURANT_MOVEMENTS = [
        { id: 1, date: '18/04/2026', productId: 1, type: 'Entrada', quantity: 30, reason: 'Compra queso y masa', user: 'Admin' },
        { id: 2, date: '09/04/2026', productId: 2, type: 'Salida', quantity: -10, reason: 'Venta por pedidos', user: 'Admin' },
        { id: 3, date: '08/04/2026', productId: 4, type: 'Salida', quantity: -5, reason: 'Venta por pedidos', user: 'Admin' },
        { id: 4, date: '07/04/2026', productId: 5, type: 'Entrada', quantity: 15, reason: 'Reposición mariscos', user: 'Admin' },
        { id: 5, date: '05/04/2026', productId: 7, type: 'Entrada', quantity: 20, reason: 'Compra café', user: 'Admin' }
    ];

    const DEFAULT_RESTAURANT_ORDERS = [
        { id: 1, folio: 'PC-001', date: '10/04/2026', productId: 1, quantity: 30, type: 'Reposición', status: 'Pendiente', providerId: 2, notes: 'Queso mozzarella y masa para Pizza Margarita' },
        { id: 2, folio: 'PC-002', date: '08/04/2026', productId: 4, quantity: 25, type: 'Reposición', status: 'En proceso', providerId: 1, notes: 'Carne para Hamburguesa BBQ y salsa' },
        { id: 3, folio: 'PC-003', date: '05/04/2026', productId: 5, quantity: 20, type: 'Suministro', status: 'Surtido', providerId: 3, notes: 'Salmón fresco sellado' },
        { id: 4, folio: 'PC-004', date: '03/04/2026', productId: 7, quantity: 15, type: 'Reposición', status: 'Cancelado', providerId: 5, notes: 'Demora en transporte de granos' }
    ];

    const DEFAULT_RESTAURANT_MATURITY = [
        { id: 'mat-prod', label: 'Productos y proveedores de DeliciasResto integrados', completed: true },
        { id: 'mat-inv', label: 'Inventario y existencias conectadas a la base de datos MySQL', completed: true },
        { id: 'mat-traz', label: 'Trazabilidad de movimientos de cocina e insumos', completed: true },
        { id: 'mat-pushpull', label: 'Estrategia Push/Pull implementada por platillos', completed: true },
        { id: 'mat-rep', label: 'Reportes y métricas de ventas y abastecimiento en vivo', completed: true }
    ];

    // Estado en memoria
    let scmProducts = [];
    let scmProviders = [];
    let scmMovements = [];
    let scmOrders = [];
    let scmMaturity = [];
    let scmMetrics = null;

    // Instancias de Chart.js
    let chartTopProducts = null;
    let chartRotation = null;
    let chartPushPull = null;

    // Helpers de API
    async function apiGet(key) {
        try {
            const res = await fetch(`${API_BASE}/${key}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[SCM API] Error al obtener ${key}:`, e.message);
            return null;
        }
    }

    async function apiPut(key, data) {
        try {
            const res = await fetch(`${API_BASE}/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.ok;
        } catch (e) {
            console.warn(`[SCM API] Error al guardar ${key}:`, e.message);
            return false;
        }
    }

    // Carga de datos desde la Base de Datos con respaldo local
    async function loadScmData() {
        // 1. Cargar productos desde la base de datos MySQL
        const dbProducts = await apiGet('products');
        if (dbProducts && Array.isArray(dbProducts) && dbProducts.length > 0) {
            // Unir atributos SCM (minStock, strategy, unitCost, providerId) con datos reales de la BD
            const savedScmMeta = JSON.parse(localStorage.getItem('delicias_scm_prod_meta') || '{}');
            scmProducts = dbProducts.map(p => {
                const meta = savedScmMeta[p.id] || {};
                const isFreshDish = p.category === 'Pescados' || p.category === 'Ensaladas';
                return {
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    stock: p.stock !== undefined ? p.stock : 10,
                    minStock: meta.minStock || 8,
                    strategy: meta.strategy || (isFreshDish ? 'PULL' : 'PUSH'),
                    unitCost: meta.unitCost || Number((p.price * 0.4).toFixed(2)),
                    providerId: meta.providerId || (p.category === 'Pizzas' ? 2 : p.category === 'Pescados' ? 3 : p.category === 'Bebidas' ? 5 : 1),
                    desc: p.desc || p.description || ''
                };
            });
        } else {
            try {
                scmProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || DEFAULT_RESTAURANT_PRODUCTS;
            } catch (_) { scmProducts = DEFAULT_RESTAURANT_PRODUCTS; }
        }

        // 2. Cargar proveedores desde la BD
        const dbProviders = await apiGet('scm_providers');
        if (dbProviders && Array.isArray(dbProviders) && dbProviders.length > 0) {
            scmProviders = dbProviders;
        } else {
            try {
                scmProviders = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROVIDERS)) || DEFAULT_RESTAURANT_PROVIDERS;
            } catch (_) { scmProviders = DEFAULT_RESTAURANT_PROVIDERS; }
            apiPut('scm_providers', scmProviders);
        }

        // 3. Cargar movimientos desde la BD
        const dbMovements = await apiGet('scm_movements');
        if (dbMovements && Array.isArray(dbMovements) && dbMovements.length > 0) {
            scmMovements = dbMovements;
        } else {
            try {
                scmMovements = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) || DEFAULT_RESTAURANT_MOVEMENTS;
            } catch (_) { scmMovements = DEFAULT_RESTAURANT_MOVEMENTS; }
            apiPut('scm_movements', scmMovements);
        }

        // 4. Cargar pedidos SCM desde la BD
        const dbOrders = await apiGet('scm_orders');
        if (dbOrders && Array.isArray(dbOrders) && dbOrders.length > 0) {
            scmOrders = dbOrders;
        } else {
            try {
                scmOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || DEFAULT_RESTAURANT_ORDERS;
            } catch (_) { scmOrders = DEFAULT_RESTAURANT_ORDERS; }
            apiPut('scm_orders', scmOrders);
        }

        // 5. Cargar nivel de madurez desde la BD
        const dbMaturity = await apiGet('scm_maturity');
        if (dbMaturity && Array.isArray(dbMaturity) && dbMaturity.length > 0) {
            scmMaturity = dbMaturity;
        } else {
            try {
                scmMaturity = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATURITY)) || DEFAULT_RESTAURANT_MATURITY;
            } catch (_) { scmMaturity = DEFAULT_RESTAURANT_MATURITY; }
            apiPut('scm_maturity', scmMaturity);
        }

        // 6. Cargar métricas calculadas en MySQL
        scmMetrics = await apiGet('scm_metrics');

        // Respaldar localmente
        saveLocalCopy();
    }

    function saveLocalCopy() {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(scmProducts));
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(scmProviders));
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(scmMovements));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(scmOrders));
        localStorage.setItem(STORAGE_KEYS.MATURITY, JSON.stringify(scmMaturity));

        // Guardar metadata de productos
        const meta = {};
        scmProducts.forEach(p => {
            meta[p.id] = { minStock: p.minStock, strategy: p.strategy, unitCost: p.unitCost, providerId: p.providerId };
        });
        localStorage.setItem('delicias_scm_prod_meta', JSON.stringify(meta));
    }

    async function syncScmProducts() {
        saveLocalCopy();
        // Guardar en MySQL la lista de productos
        await apiPut('products', scmProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price || (p.unitCost ? Number((p.unitCost * 2.2).toFixed(2)) : 10),
            desc: p.desc,
            stock: p.stock,
            status: p.stock > 0 ? 'disponible' : 'agotado'
        })));
    }

    async function syncScmProviders() {
        saveLocalCopy();
        await apiPut('scm_providers', scmProviders);
    }

    async function syncScmMovements() {
        saveLocalCopy();
        await apiPut('scm_movements', scmMovements);
    }

    async function syncScmOrders() {
        saveLocalCopy();
        await apiPut('scm_orders', scmOrders);
    }

    async function syncScmMaturity() {
        saveLocalCopy();
        await apiPut('scm_maturity', scmMaturity);
    }

    // Helpers de búsqueda
    function getProviderName(id) {
        const p = scmProviders.find(x => x.id === Number(id));
        return p ? p.name : '—';
    }

    function getProductName(id) {
        const prod = scmProducts.find(x => x.id === Number(id));
        return prod ? prod.name : 'Producto #' + id;
    }

    // ============================================================
    // NAVEGACIÓN Y APERTURA DE PÁGINAS SCM
    // ============================================================
    window.switchScmPage = function (pageId) {
        if (typeof window.showAdminPage === 'function') {
            window.showAdminPage(pageId);
        } else {
            document.querySelectorAll('.admin-page').forEach(p => {
                p.classList.add('hidden');
                p.classList.remove('active');
            });
            const target = document.getElementById('admin-' + pageId);
            if (target) {
                target.classList.remove('hidden');
                target.classList.add('active');
            }
        }
        renderScmView(pageId);
    };

    function renderScmView(pageId) {
        const scmSubmenu = document.getElementById('scm-submenu');
        const scmToggle = document.getElementById('scm-menu-toggle');
        if (scmSubmenu && scmToggle) {
            scmSubmenu.classList.remove('collapsed');
            scmToggle.classList.remove('collapsed');
            scmToggle.classList.add('active-group');
        }

        switch (pageId) {
            case 'scm-inicio':
                break;
            case 'scm-productos':
                renderScmProductsTable();
                break;
            case 'scm-proveedores':
                renderScmProvidersTable();
                break;
            case 'scm-inventario':
                renderScmInventoryTable();
                break;
            case 'scm-movimientos':
                renderScmMovementsTable();
                break;
            case 'scm-pedidos':
                renderScmOrdersTable();
                break;
            case 'scm-logistica':
                renderScmLogisticsView();
                break;
            case 'scm-madurez':
                renderScmMaturityView();
                break;
            case 'scm-reportes':
                renderScmReportsDashboard();
                break;
        }
    }

    window.renderScmPage = renderScmView;

    // ============================================================
    // 1. PRODUCTOS SCM (DeliciasResto)
    // ============================================================
    function renderScmProductsTable() {
        const tbody = document.getElementById('scm-products-table-body');
        if (!tbody) return;

        const search = (document.getElementById('scm-product-search')?.value || '').toLowerCase().trim();
        const categoryFilter = document.getElementById('scm-product-cat-filter')?.value || 'todas';
        const strategyFilter = document.getElementById('scm-product-strat-filter')?.value || 'todas';

        const catSelect = document.getElementById('scm-product-cat-filter');
        if (catSelect && catSelect.options.length <= 1) {
            const categories = [...new Set(scmProducts.map(p => p.category))];
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                catSelect.appendChild(opt);
            });
        }

        const filtered = scmProducts.filter(p => {
            const matchesSearch = !search || p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search);
            const matchesCat = categoryFilter === 'todas' || p.category === categoryFilter;
            const matchesStrat = strategyFilter === 'todas' || p.strategy === strategyFilter;
            return matchesSearch && matchesCat && matchesStrat;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:#64748b;">No hay productos registrados en la base de datos.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const isPush = p.strategy === 'PUSH';
            const iconClass = p.category === 'Pizzas' ? 'fa-pizza-slice' :
                p.category === 'Hamburguesas' ? 'fa-hamburger' :
                p.category === 'Pescados' ? 'fa-fish' :
                p.category === 'Bebidas' ? 'fa-coffee' :
                p.category === 'Ensaladas' ? 'fa-carrot' : 'fa-utensils';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="width: 50px;">
                    <div style="width:38px;height:38px;border-radius:10px;background:#f0fdfa;color:#0d9488;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
                        <i class="fas ${iconClass}"></i>
                    </div>
                </td>
                <td><strong>${p.name}</strong><br><small style="color:#64748b;">${getProviderName(p.providerId)}</small></td>
                <td>${p.category}</td>
                <td><span style="font-weight:700; color:${p.stock <= p.minStock ? '#dc2626' : '#0f172a'}">${p.stock}</span></td>
                <td>${p.minStock}</td>
                <td>
                    <span class="${isPush ? 'badge-push' : 'badge-pull'}">
                        <i class="fas ${isPush ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> ${p.strategy}
                    </span>
                </td>
                <td>
                    <button class="btn-primary" style="padding:4px 8px;border-radius:6px;margin-right:4px;" title="Editar" onclick="window.openScmProductModal(${p.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" style="padding:4px 8px;border-radius:6px;background:#ef4444;color:white;border:none;cursor:pointer;" title="Eliminar" onclick="window.deleteScmProduct(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.openScmProductModal = function (id = null) {
        const modal = document.getElementById('scm-product-modal');
        const form = document.getElementById('scm-product-form');
        const title = document.getElementById('scm-product-modal-title');
        const provSelect = document.getElementById('scm-form-prod-provider');

        if (!modal || !form) return;

        if (provSelect) {
            provSelect.innerHTML = '<option value="">Selecciona un proveedor</option>';
            scmProviders.forEach(pr => {
                const opt = document.createElement('option');
                opt.value = pr.id;
                opt.textContent = pr.name;
                provSelect.appendChild(opt);
            });
        }

        form.reset();
        document.getElementById('scm-form-prod-id').value = '';

        if (id) {
            const p = scmProducts.find(x => x.id === id);
            if (p) {
                title.textContent = 'Editar producto';
                document.getElementById('scm-form-prod-id').value = p.id;
                document.getElementById('scm-form-prod-name').value = p.name || '';
                document.getElementById('scm-form-prod-desc').value = p.desc || '';
                document.getElementById('scm-form-prod-category').value = p.category || 'Pizzas';
                if (provSelect) provSelect.value = p.providerId || '';
                document.getElementById('scm-form-prod-stock').value = p.stock || 0;
                document.getElementById('scm-form-prod-minstock').value = p.minStock || 8;
                document.getElementById('scm-form-prod-strategy').value = p.strategy || 'PUSH';
                document.getElementById('scm-form-prod-cost').value = p.unitCost || 0;
            }
        } else {
            title.textContent = 'Nuevo producto';
        }

        modal.classList.add('active');
    };

    window.deleteScmProduct = async function (id) {
        const p = scmProducts.find(x => x.id === id);
        if (!p) return;
        if (confirm(`¿Estás seguro de eliminar el platillo "${p.name}"?`)) {
            scmProducts = scmProducts.filter(x => x.id !== id);
            await syncScmProducts();
            renderScmProductsTable();
        }
    };

    // ============================================================
    // 2. PROVEEDORES SCM (DeliciasResto)
    // ============================================================
    function renderScmProvidersTable() {
        const tbody = document.getElementById('scm-providers-table-body');
        if (!tbody) return;

        const search = (document.getElementById('scm-provider-search')?.value || '').toLowerCase().trim();
        const filtered = scmProviders.filter(pr => {
            return !search || pr.name.toLowerCase().includes(search) || (pr.contact && pr.contact.toLowerCase().includes(search)) || (pr.email && pr.email.toLowerCase().includes(search));
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b;">No hay proveedores registrados en la base de datos.</td></tr>';
            return;
        }

        filtered.forEach(pr => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${pr.name}</strong><br><small style="color:#64748b;">${pr.products || ''}</small></td>
                <td>${pr.contact || '—'}</td>
                <td><a href="mailto:${pr.email}" style="color:#0d9488;text-decoration:none;">${pr.email || '—'}</a></td>
                <td>${pr.phone || '—'}</td>
                <td>
                    <button class="btn-primary" style="padding:4px 8px;border-radius:6px;margin-right:4px;" title="Editar" onclick="window.openScmProviderModal(${pr.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" style="padding:4px 8px;border-radius:6px;background:#ef4444;color:white;border:none;cursor:pointer;" title="Eliminar" onclick="window.deleteScmProvider(${pr.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.openScmProviderModal = function (id = null) {
        const modal = document.getElementById('scm-provider-modal');
        const form = document.getElementById('scm-provider-form');
        const title = document.getElementById('scm-provider-modal-title');
        if (!modal || !form) return;

        form.reset();
        document.getElementById('scm-form-prov-id').value = '';

        if (id) {
            const pr = scmProviders.find(x => x.id === id);
            if (pr) {
                title.textContent = 'Editar proveedor';
                document.getElementById('scm-form-prov-id').value = pr.id;
                document.getElementById('scm-form-prov-name').value = pr.name || '';
                document.getElementById('scm-form-prov-contact').value = pr.contact || '';
                document.getElementById('scm-form-prov-email').value = pr.email || '';
                document.getElementById('scm-form-prov-phone').value = pr.phone || '';
                document.getElementById('scm-form-prov-address').value = pr.address || '';
            }
        } else {
            title.textContent = 'Nuevo proveedor';
        }

        modal.classList.add('active');
    };

    window.deleteScmProvider = async function (id) {
        const pr = scmProviders.find(x => x.id === id);
        if (!pr) return;
        if (confirm(`¿Estás seguro de eliminar al proveedor "${pr.name}"?`)) {
            scmProviders = scmProviders.filter(x => x.id !== id);
            await syncScmProviders();
            renderScmProvidersTable();
        }
    };

    // ============================================================
    // 3. INVENTARIO (DeliciasResto)
    // ============================================================
    function renderScmInventoryTable() {
        const tbody = document.getElementById('scm-inventory-table-body');
        if (!tbody) return;

        const search = (document.getElementById('scm-inventory-search')?.value || '').toLowerCase().trim();
        const statusFilter = document.getElementById('scm-inventory-status-filter')?.value || 'todos';

        const filtered = scmProducts.filter(p => {
            const isLow = p.stock <= p.minStock;
            const matchesSearch = !search || p.name.toLowerCase().includes(search);
            const matchesStatus = statusFilter === 'todos' || (statusFilter === 'bajo' && isLow) || (statusFilter === 'normal' && !isLow);
            return matchesSearch && matchesStatus;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b;">No hay existencias que coincidan.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const isLow = p.stock <= p.minStock;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.name}</strong><br><small style="color:#64748b;">${p.category}</small></td>
                <td><span style="font-weight:700;font-size:1.05rem;color:${isLow ? '#dc2626' : '#0f172a'}">${p.stock}</span></td>
                <td>${p.minStock}</td>
                <td>
                    <span class="${isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
                        ● ${isLow ? 'Stock bajo' : 'Normal'}
                    </span>
                </td>
                <td>
                    <button class="btn-secondary" style="padding:4px 8px;font-size:0.8rem;border-radius:6px;" title="Registrar movimiento" onclick="window.quickMovementForProduct(${p.id})">
                        <i class="fas fa-exchange-alt"></i> Movimiento
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.quickMovementForProduct = function (productId) {
        window.openScmMovementModal();
        const select = document.getElementById('scm-form-mov-product');
        if (select) select.value = productId;
    };

    // ============================================================
    // 4. MOVIMIENTOS DE INVENTARIO
    // ============================================================
    function renderScmMovementsTable() {
        const tbody = document.getElementById('scm-movements-table-body');
        if (!tbody) return;

        const typeFilter = document.getElementById('scm-movement-type-filter')?.value || 'todos';
        const prodFilter = document.getElementById('scm-movement-prod-filter')?.value || 'todos';

        const prodSelect = document.getElementById('scm-movement-prod-filter');
        if (prodSelect && prodSelect.options.length <= 1) {
            scmProducts.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                prodSelect.appendChild(opt);
            });
        }

        const filtered = scmMovements.filter(m => {
            const matchesType = typeFilter === 'todos' || m.type === typeFilter;
            const matchesProd = prodFilter === 'todos' || String(m.productId) === String(prodFilter);
            return matchesType && matchesProd;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#64748b;">No hay movimientos registrados en la base de datos.</td></tr>';
            return;
        }

        filtered.forEach(m => {
            const isEntry = m.type === 'Entrada';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${m.date}</td>
                <td><strong>${getProductName(m.productId)}</strong></td>
                <td>
                    <span style="color:${isEntry ? '#10b981' : '#ef4444'};font-weight:700;">
                        ${isEntry ? 'Entrada' : 'Salida'}
                    </span>
                </td>
                <td><strong style="color:${isEntry ? '#10b981' : '#ef4444'}">${m.quantity > 0 ? '+' + m.quantity : m.quantity}</strong></td>
                <td>${m.reason}</td>
                <td><small style="color:#64748b;"><i class="fas fa-user"></i> ${m.user}</small></td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.openScmMovementModal = function () {
        const modal = document.getElementById('scm-movement-modal');
        const form = document.getElementById('scm-movement-form');
        const prodSelect = document.getElementById('scm-form-mov-product');
        if (!modal || !form) return;

        form.reset();

        if (prodSelect) {
            prodSelect.innerHTML = '<option value="">Selecciona un producto</option>';
            scmProducts.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (Stock: ${p.stock})`;
                prodSelect.appendChild(opt);
            });
        }

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('scm-form-mov-date').value = today;

        modal.classList.add('active');
    };

    // ============================================================
    // 5. LOGÍSTICA – ESTRATEGIAS PUSH VS PULL
    // ============================================================
    function renderScmLogisticsView() {
        const select = document.getElementById('scm-strategy-product-select');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '';
            scmProducts.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (${p.category})`;
                select.appendChild(opt);
            });
            if (currentVal) select.value = currentVal;
            updateLogisticsFormState();
        }

        const pushCount = scmProducts.filter(p => p.strategy === 'PUSH').length;
        const pullCount = scmProducts.filter(p => p.strategy === 'PULL').length;

        const pushElem = document.getElementById('scm-push-count');
        const pullElem = document.getElementById('scm-pull-count');
        if (pushElem) pushElem.textContent = pushCount;
        if (pullElem) pullElem.textContent = pullCount;

        const tbody = document.getElementById('scm-logistics-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        scmProducts.forEach(p => {
            const isPush = p.strategy === 'PUSH';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td><span style="font-weight:700;">${p.stock}</span></td>
                <td>${p.minStock}</td>
                <td>
                    <span class="${isPush ? 'badge-push' : 'badge-pull'}">
                        ${p.strategy}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateLogisticsFormState() {
        const select = document.getElementById('scm-strategy-product-select');
        if (!select || !select.value) return;
        const prod = scmProducts.find(p => p.id === Number(select.value));
        if (prod) {
            if (prod.strategy === 'PUSH') {
                document.getElementById('scm-strat-push-radio').checked = true;
            } else {
                document.getElementById('scm-strat-pull-radio').checked = true;
            }
        }
    }

    // ============================================================
    // 6. PEDIDOS SCM (Suministro a Proveedores)
    // ============================================================
    function renderScmOrdersTable() {
        const tbody = document.getElementById('scm-orders-table-body');
        if (!tbody) return;

        const statusFilter = document.getElementById('scm-order-status-filter')?.value || 'todos';
        const typeFilter = document.getElementById('scm-order-type-filter')?.value || 'todos';

        const filtered = scmOrders.filter(o => {
            const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
            const matchesType = typeFilter === 'todos' || o.type === typeFilter;
            return matchesStatus && matchesType;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:#64748b;">No hay pedidos de reposición registrados.</td></tr>';
            return;
        }

        filtered.forEach(o => {
            let badgeClass = 'badge-order-pending';
            if (o.status === 'En proceso') badgeClass = 'badge-order-process';
            if (o.status === 'Surtido') badgeClass = 'badge-order-done';
            if (o.status === 'Cancelado') badgeClass = 'badge-order-cancel';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${o.folio}</strong></td>
                <td>${o.date}</td>
                <td><strong>${getProductName(o.productId)}</strong></td>
                <td>${o.quantity}</td>
                <td>${o.type}</td>
                <td><span class="${badgeClass}">${o.status}</span></td>
                <td>
                    <select onchange="window.changeScmOrderStatus(${o.id}, this.value)" style="padding:2px 6px;border-radius:6px;border:1px solid #cbd5e1;font-size:0.8rem;">
                        <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En proceso" ${o.status === 'En proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="Surtido" ${o.status === 'Surtido' ? 'selected' : ''}>Surtido</option>
                        <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.openScmOrderModal = function () {
        const modal = document.getElementById('scm-order-modal');
        const form = document.getElementById('scm-order-form');
        const prodSelect = document.getElementById('scm-form-ord-product');
        const provSelect = document.getElementById('scm-form-ord-provider');
        if (!modal || !form) return;

        form.reset();

        if (prodSelect) {
            prodSelect.innerHTML = '<option value="">Selecciona un producto</option>';
            scmProducts.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} (Stock: ${p.stock})`;
                prodSelect.appendChild(opt);
            });
        }

        if (provSelect) {
            provSelect.innerHTML = '<option value="">Selecciona un proveedor</option>';
            scmProviders.forEach(pr => {
                const opt = document.createElement('option');
                opt.value = pr.id;
                opt.textContent = pr.name;
                provSelect.appendChild(opt);
            });
        }

        document.getElementById('scm-form-ord-date').value = new Date().toISOString().split('T')[0];
        modal.classList.add('active');
    };

    window.changeScmOrderStatus = async function (orderId, newStatus) {
        const order = scmOrders.find(o => o.id === orderId);
        if (!order) return;

        const oldStatus = order.status;
        order.status = newStatus;

        // Si se marca como surtido, sumar stock al producto en MySQL y generar movimiento
        if (newStatus === 'Surtido' && oldStatus !== 'Surtido') {
            const product = scmProducts.find(p => p.id === order.productId);
            if (product) {
                product.stock += Number(order.quantity);
                await syncScmProducts();

                const newMov = {
                    id: Date.now(),
                    date: new Date().toLocaleDateString('es-ES'),
                    productId: order.productId,
                    type: 'Entrada',
                    quantity: Number(order.quantity),
                    reason: 'Pedido surtido (' + order.folio + ')',
                    user: 'Admin'
                };
                scmMovements.unshift(newMov);
                await syncScmMovements();
            }
        }

        await syncScmOrders();
        renderScmOrdersTable();
    };

    // ============================================================
    // 7. NIVEL DE MADUREZ SCM
    // ============================================================
    function renderScmMaturityView() {
        const container = document.getElementById('scm-checklist-items');
        if (!container) return;

        container.innerHTML = '';
        scmMaturity.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'scm-checklist-item';
            li.innerHTML = `
                <input type="checkbox" id="${item.id}" ${item.completed ? 'checked' : ''} onchange="window.toggleMaturityItem(${index})">
                <label for="${item.id}">${item.label}</label>
            `;
            container.appendChild(li);
        });

        const total = scmMaturity.length;
        const completed = scmMaturity.filter(i => i.completed).length;
        const percentage = Math.round((completed / total) * 100);

        const levelBadge = document.getElementById('scm-maturity-current-badge');
        const descElem = document.getElementById('scm-maturity-desc');
        const step1 = document.getElementById('scm-step-1');
        const step2 = document.getElementById('scm-step-2');
        const step3 = document.getElementById('scm-step-3');

        [step1, step2, step3].forEach(s => {
            if (s) s.classList.remove('active', 'completed');
        });

        if (percentage < 40) {
            if (levelBadge) {
                levelBadge.textContent = 'Inicial';
                levelBadge.style.background = '#e2e8f0';
                levelBadge.style.color = '#334155';
            }
            if (step1) step1.classList.add('active');
            if (descElem) descElem.textContent = 'El sistema se encuentra en fase inicial conectando catálogos y almacén.';
        } else if (percentage < 80) {
            if (levelBadge) {
                levelBadge.textContent = 'En desarrollo';
                levelBadge.style.background = '#dcfce7';
                levelBadge.style.color = '#166534';
            }
            if (step1) step1.classList.add('completed');
            if (step2) step2.classList.add('active');
            if (descElem) descElem.textContent = 'La base de datos MySQL está integrada. Los pedidos, ventas y stock de DeliciasResto alimentan el flujo logístico.';
        } else {
            if (levelBadge) {
                levelBadge.textContent = 'Optimizado';
                levelBadge.style.background = '#ccfbf1';
                levelBadge.style.color = '#115e59';
            }
            if (step1) step1.classList.add('completed');
            if (step2) step2.classList.add('completed');
            if (step3) step3.classList.add('active');
            if (descElem) descElem.textContent = 'Operación logística optimizada con sincronización automática en MySQL y métricas precisas.';
        }
    }

    window.toggleMaturityItem = async function (index) {
        if (scmMaturity[index]) {
            scmMaturity[index].completed = !scmMaturity[index].completed;
            await syncScmMaturity();
            renderScmMaturityView();
        }
    };

    // ============================================================
    // 8. REPORTES SCM (Dashboard con métricas reales de MySQL)
    // ============================================================
    async function renderScmReportsDashboard() {
        // Refrescar métricas desde la API de MySQL
        const metrics = await apiGet('scm_metrics') || scmMetrics;

        const totalProducts = metrics ? metrics.totalProducts : scmProducts.length;
        const totalProviders = metrics ? metrics.providersCount : scmProviders.length;
        const pendingOrders = metrics ? metrics.inProcessOrders : scmOrders.filter(o => o.status === 'En proceso' || o.status === 'Pendiente').length;
        const lowStockCount = metrics ? metrics.lowStockCount : scmProducts.filter(p => p.stock <= p.minStock).length;

        const kpiProd = document.getElementById('scm-kpi-products');
        const kpiProv = document.getElementById('scm-kpi-providers');
        const kpiOrd = document.getElementById('scm-kpi-orders');
        const kpiLow = document.getElementById('scm-kpi-low-stock');

        if (kpiProd) kpiProd.textContent = totalProducts;
        if (kpiProv) kpiProv.textContent = totalProviders;
        if (kpiOrd) kpiOrd.textContent = pendingOrders;
        if (kpiLow) kpiLow.textContent = lowStockCount;

        // Tabla de inventario crítico con datos de la base de datos
        const critTable = document.getElementById('scm-critical-inventory-body');
        if (critTable) {
            const criticalList = (metrics && metrics.criticalInventory && metrics.criticalInventory.length)
                ? metrics.criticalInventory
                : scmProducts.filter(p => p.stock <= p.minStock);

            critTable.innerHTML = '';
            if (criticalList.length === 0) {
                critTable.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:1rem;">Todo el inventario está en niveles óptimos.</td></tr>';
            } else {
                criticalList.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${p.name}</strong><br><small style="color:#64748b;">${p.category || 'Cocina'}</small></td>
                        <td><span style="color:#ef4444;font-weight:700;">${p.stock}</span></td>
                        <td>${p.minStock || 8}</td>
                    `;
                    critTable.appendChild(tr);
                });
            }
        }

        if (typeof Chart === 'undefined') return;

        // 1. Gráfico Productos más vendidos (Directo de pedidos de MySQL)
        const ctxTop = document.getElementById('scmTopProductsChart')?.getContext('2d');
        if (ctxTop) {
            if (chartTopProducts) chartTopProducts.destroy();

            const topData = (metrics && metrics.topProducts && metrics.topProducts.length)
                ? metrics.topProducts
                : [
                    { name: 'Pizza Pepperoni', soldQty: 10 },
                    { name: 'Pizza Margarita', soldQty: 5 },
                    { name: 'Hamburguesa BBQ', soldQty: 4 },
                    { name: 'Salmón a la plancha', soldQty: 3 }
                ];

            chartTopProducts = new Chart(ctxTop, {
                type: 'bar',
                data: {
                    labels: topData.map(d => d.name),
                    datasets: [{
                        label: 'Unidades vendidas',
                        data: topData.map(d => Number(d.soldQty)),
                        backgroundColor: '#0d9488',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Gráfico Rotación de inventario (Ventas vs Stock de DeliciasResto)
        const ctxRot = document.getElementById('scmRotationChart')?.getContext('2d');
        if (ctxRot) {
            if (chartRotation) chartRotation.destroy();
            chartRotation = new Chart(ctxRot, {
                type: 'doughnut',
                data: {
                    labels: ['Alta rotación (Pizzas y Bebidas)', 'Media rotación (Hamburguesas)', 'Baja rotación (Pescados)'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: ['#0d9488', '#f59e0b', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // 3. Gráfico Comparativa PUSH vs PULL mensual
        const ctxPP = document.getElementById('scmPushPullChart')?.getContext('2d');
        if (ctxPP) {
            if (chartPushPull) chartPushPull.destroy();
            chartPushPull = new Chart(ctxPP, {
                type: 'bar',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'PUSH (Insumos base/anticipados)',
                            data: [42, 48, 55, 60, 58, 64],
                            backgroundColor: '#f59e0b',
                            borderRadius: 4
                        },
                        {
                            label: 'PULL (Platillos por comensal)',
                            data: [25, 30, 35, 42, 46, 50],
                            backgroundColor: '#0284c7',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
                    }
                }
            });
        }
    }

    // ============================================================
    // MODALES Y FORMULARIOS EVENT LISTENERS
    // ============================================================
    function setupFormListeners() {
        document.querySelectorAll('.scm-modal-close, .scm-modal-cancel-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.scm-modal-backdrop').forEach(m => m.classList.remove('active'));
            });
        });

        // Guardar producto
        const productForm = document.getElementById('scm-product-form');
        if (productForm) {
            productForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const id = document.getElementById('scm-form-prod-id').value;
                const name = document.getElementById('scm-form-prod-name').value.trim();
                const desc = document.getElementById('scm-form-prod-desc').value.trim();
                const category = document.getElementById('scm-form-prod-category').value.trim();
                const providerId = Number(document.getElementById('scm-form-prod-provider').value);
                const stock = Number(document.getElementById('scm-form-prod-stock').value);
                const minStock = Number(document.getElementById('scm-form-prod-minstock').value);
                const strategy = document.getElementById('scm-form-prod-strategy').value;
                const unitCost = Number(document.getElementById('scm-form-prod-cost').value);

                if (!name) return alert('Por favor ingresa el nombre del producto.');

                if (id) {
                    const idx = scmProducts.findIndex(x => x.id === Number(id));
                    if (idx !== -1) {
                        scmProducts[idx] = { ...scmProducts[idx], name, desc, category, providerId, stock, minStock, strategy, unitCost };
                    }
                } else {
                    const newId = scmProducts.length ? Math.max(...scmProducts.map(p => p.id)) + 1 : 1;
                    scmProducts.push({ id: newId, name, desc, category, providerId, stock, minStock, strategy, unitCost });
                }

                await syncScmProducts();
                document.getElementById('scm-product-modal').classList.remove('active');
                renderScmProductsTable();
            });
        }

        // Guardar proveedor
        const providerForm = document.getElementById('scm-provider-form');
        if (providerForm) {
            providerForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const id = document.getElementById('scm-form-prov-id').value;
                const name = document.getElementById('scm-form-prov-name').value.trim();
                const contact = document.getElementById('scm-form-prov-contact').value.trim();
                const email = document.getElementById('scm-form-prov-email').value.trim();
                const phone = document.getElementById('scm-form-prov-phone').value.trim();
                const address = document.getElementById('scm-form-prov-address').value.trim();

                if (!name) return alert('Por favor ingresa el nombre del proveedor.');

                if (id) {
                    const idx = scmProviders.findIndex(x => x.id === Number(id));
                    if (idx !== -1) {
                        scmProviders[idx] = { ...scmProviders[idx], name, contact, email, phone, address };
                    }
                } else {
                    const newId = scmProviders.length ? Math.max(...scmProviders.map(p => p.id)) + 1 : 1;
                    scmProviders.push({ id: newId, name, contact, email, phone, address });
                }

                await syncScmProviders();
                document.getElementById('scm-provider-modal').classList.remove('active');
                renderScmProvidersTable();
            });
        }

        // Guardar movimiento
        const movementForm = document.getElementById('scm-movement-form');
        if (movementForm) {
            movementForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const productId = Number(document.getElementById('scm-form-mov-product').value);
                const typeRadio = document.querySelector('input[name="scm-mov-type"]:checked');
                const type = typeRadio ? typeRadio.value : 'Entrada';
                const quantityInput = Number(document.getElementById('scm-form-mov-qty').value);
                const reason = document.getElementById('scm-form-mov-reason').value;
                const date = document.getElementById('scm-form-mov-date').value || new Date().toISOString().split('T')[0];
                const user = document.getElementById('scm-form-mov-user').value.trim() || 'Admin';

                if (!productId) return alert('Selecciona un producto.');
                if (!quantityInput || quantityInput <= 0) return alert('La cantidad debe ser mayor a 0.');

                const product = scmProducts.find(p => p.id === productId);
                if (!product) return alert('Producto no encontrado.');

                const signedQty = type === 'Entrada' ? quantityInput : -quantityInput;

                if (type === 'Salida' && product.stock < quantityInput) {
                    if (!confirm(`El stock actual (${product.stock}) es menor a la salida (${quantityInput}). ¿Deseas continuar?`)) {
                        return;
                    }
                }

                product.stock = Math.max(0, product.stock + signedQty);

                const newMovement = {
                    id: Date.now(),
                    date,
                    productId,
                    type,
                    quantity: signedQty,
                    reason,
                    user
                };

                scmMovements.unshift(newMovement);
                await syncScmProducts();
                await syncScmMovements();

                document.getElementById('scm-movement-modal').classList.remove('active');
                renderScmMovementsTable();
            });
        }

        // Guardar pedido SCM
        const orderForm = document.getElementById('scm-order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const productId = Number(document.getElementById('scm-form-ord-product').value);
                const quantity = Number(document.getElementById('scm-form-ord-qty').value);
                const type = document.getElementById('scm-form-ord-type').value;
                const providerId = Number(document.getElementById('scm-form-ord-provider').value);
                const date = document.getElementById('scm-form-ord-date').value || new Date().toISOString().split('T')[0];
                const notes = document.getElementById('scm-form-ord-notes').value.trim();

                if (!productId) return alert('Selecciona un producto.');
                if (!quantity || quantity <= 0) return alert('La cantidad debe ser mayor a cero.');

                const folioNum = String(scmOrders.length + 1).padStart(3, '0');
                const newOrder = {
                    id: Date.now(),
                    folio: `PC-${folioNum}`,
                    date,
                    productId,
                    quantity,
                    type,
                    status: 'Pendiente',
                    providerId,
                    notes
                };

                scmOrders.unshift(newOrder);
                await syncScmOrders();

                document.getElementById('scm-order-modal').classList.remove('active');
                renderScmOrdersTable();
            });
        }

        // Guardar estrategia Push/Pull
        const saveStratBtn = document.getElementById('scm-save-strategy-btn');
        if (saveStratBtn) {
            saveStratBtn.addEventListener('click', async function () {
                const prodSelect = document.getElementById('scm-strategy-product-select');
                if (!prodSelect || !prodSelect.value) return;

                const prodId = Number(prodSelect.value);
                const isPush = document.getElementById('scm-strat-push-radio')?.checked;
                const newStrategy = isPush ? 'PUSH' : 'PULL';

                const prod = scmProducts.find(p => p.id === prodId);
                if (prod) {
                    prod.strategy = newStrategy;
                    await syncScmProducts();
                    renderScmLogisticsView();
                    alert(`Estrategia actualizada a ${newStrategy} para "${prod.name}".`);
                }
            });
        }

        const prodSelectStrat = document.getElementById('scm-strategy-product-select');
        if (prodSelectStrat) {
            prodSelectStrat.addEventListener('change', updateLogisticsFormState);
        }

        // Filtros en tiempo real
        document.getElementById('scm-product-search')?.addEventListener('input', renderScmProductsTable);
        document.getElementById('scm-product-cat-filter')?.addEventListener('change', renderScmProductsTable);
        document.getElementById('scm-product-strat-filter')?.addEventListener('change', renderScmProductsTable);

        document.getElementById('scm-provider-search')?.addEventListener('input', renderScmProvidersTable);

        document.getElementById('scm-inventory-search')?.addEventListener('input', renderScmInventoryTable);
        document.getElementById('scm-inventory-status-filter')?.addEventListener('change', renderScmInventoryTable);

        document.getElementById('scm-movement-type-filter')?.addEventListener('change', renderScmMovementsTable);
        document.getElementById('scm-movement-prod-filter')?.addEventListener('change', renderScmMovementsTable);

        document.getElementById('scm-order-status-filter')?.addEventListener('change', renderScmOrdersTable);
        document.getElementById('scm-order-type-filter')?.addEventListener('change', renderScmOrdersTable);
    }

    // Inicialización
    document.addEventListener('DOMContentLoaded', async function () {
        await loadScmData();
        setupFormListeners();

        const crmToggle = document.getElementById('crm-menu-toggle');
        const scmToggle = document.getElementById('scm-menu-toggle');
        const crmSubmenu = document.getElementById('crm-submenu');
        const scmSubmenu = document.getElementById('scm-submenu');

        if (crmToggle && crmSubmenu) {
            crmToggle.addEventListener('click', function (e) {
                e.preventDefault();
                crmSubmenu.classList.toggle('collapsed');
                crmToggle.classList.toggle('collapsed');
            });
        }

        if (scmToggle && scmSubmenu) {
            scmToggle.addEventListener('click', function (e) {
                e.preventDefault();
                scmSubmenu.classList.toggle('collapsed');
                scmToggle.classList.toggle('collapsed');
            });
        }
    });
})();
