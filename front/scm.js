/**
 * ============================================================
 * SCM (Supply Chain Management - Administración de la Cadena de Suministros)
 * Conectado en tiempo real a la Base de Datos MySQL (API DeliciasResto)
 * ============================================================
 */

(function () {
    const API_BASE = 'http://localhost:5000/api/data';
    const API_ROOT = 'http://localhost:5000/api';

    // Estado en memoria
    let scmProducts = [];
    let scmProviders = [];
    let scmMovements = [];
    let scmOrders = [];
    let scmMaturity = [];
    let scmLevel = 'Inicial';
    let scmMetrics = null;
    let scmAlerts = [];

    // Instancias de Chart.js
    let chartTopProducts = null;
    let chartRotation = null;
    let chartPushPull = null;

    // Helpers de API
    async function apiGet(key) {
        const res = await fetch(`${API_BASE}/${key}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `No se pudo cargar ${key} (HTTP ${res.status})`);
        return result;
    }

    async function apiPut(key, data) {
        const token = window.deliciasAuthToken;
        if (!token) throw new Error('Inicia sesión como administrador antes de guardar cambios SCM.');
        const res = await fetch(`${API_BASE}/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || `No se pudo guardar ${key} en SQL (HTTP ${res.status})`);
        return result;
    }

    async function apiScmRequest(path, method = 'GET', data) {
        const headers = {};
        const options = { method, headers };
        if (method !== 'GET') {
            const token = window.deliciasAuthToken;
            if (!token) throw new Error('Inicia sesión como administrador antes de guardar cambios SCM.');
            headers['Content-Type'] = 'application/json';
            headers.Authorization = `Bearer ${token}`;
            if (data !== undefined) options.body = JSON.stringify(data);
        }
        const response = await fetch(`${API_ROOT}${path}`, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `No se pudo completar ${method} ${path} (HTTP ${response.status})`);
        return result;
    }

    function showScmError(error) {
        const content = document.querySelector('.admin-content');
        if (!content) return;
        let message = document.getElementById('scm-save-error');
        if (!message) {
            message = document.createElement('div');
            message.id = 'scm-save-error';
            message.setAttribute('role', 'alert');
            message.style.cssText = 'margin:0 0 1rem;padding:0.85rem 1rem;border-radius:8px;background:#fee2e2;color:#991b1b;';
            content.prepend(message);
        }
        message.textContent = `Error de persistencia SCM en SQL: ${error.message}`;
    }

    function clearScmError() {
        document.getElementById('scm-save-error')?.remove();
    }

    function renderLowStockWarning() {
        document.querySelectorAll('[data-scm-low-stock-warning]').forEach(warning => {
            const list = warning.querySelector('[data-scm-low-stock-list]');
            if (!list) return;

            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.setAttribute('aria-label', 'Cerrar aviso');
            closeButton.className = 'scm-warning-close';
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => {
                warning.hidden = true;
            });

            const heading = document.createElement('h4');
            heading.className = 'scm-low-stock-title';
            heading.textContent = `Stock mínimo: ${scmAlerts.length} producto${scmAlerts.length === 1 ? '' : 's'} requiere${scmAlerts.length === 1 ? '' : 'n'} atención`;

            list.replaceChildren();
            warning.replaceChildren(closeButton, heading, list);
            warning.hidden = scmAlerts.length === 0;

            for (const alert of scmAlerts) {
                const item = document.createElement('li');
                item.className = 'scm-low-stock-item';

                const details = document.createElement('div');
                const productName = document.createElement('strong');
                productName.textContent = alert.productName;
                const stock = document.createElement('span');
                stock.className = 'scm-low-stock-details';
                stock.textContent = `Stock: ${alert.stock} / mínimo: ${alert.minStock} · Proveedor: ${alert.providerName}.`;
                const orderStatus = document.createElement('span');
                orderStatus.className = 'scm-low-stock-order';
                orderStatus.textContent = alert.order
                    ? `Pedido ${alert.order.folio}: ${alert.order.quantity} unidades · ${alert.order.status}${alert.order.autoGenerated ? ' (automático)' : ''}.`
                    : alert.strategy === 'PULL'
                        ? 'Aún no se ha solicitado; esta estrategia requiere pedido manual.'
                        : 'Aún no hay un pedido de reposición registrado.';
                details.append(productName, stock, orderStatus);

                const action = document.createElement('button');
                action.type = 'button';
                action.className = alert.order ? 'btn-secondary scm-low-stock-action' : 'btn-primary scm-low-stock-action';
                action.textContent = alert.order ? 'Ver pedidos' : 'Generar pedido';
                action.addEventListener('click', () => {
                    if (alert.order) {
                        window.switchScmPage('scm-pedidos');
                    } else {
                        window.openScmOrderModal(alert.productId);
                    }
                });

                item.append(details, action);
                list.appendChild(item);
            }
        });
    }

    async function persistScm(saveOperation) {
        try {
            await saveOperation();
            await loadScmData();
            clearScmError();
            return true;
        } catch (error) {
            console.error('[SCM SQL] No se pudieron guardar los cambios:', error);
            showScmError(error);
            try {
                await loadScmData();
            } catch (reloadError) {
                console.error('[SCM SQL] No se pudieron recuperar los datos guardados:', reloadError);
            }
            return false;
        }
    }

    // SQL es la fuente de verdad para todos los datos SCM.
    async function loadScmData() {
        const [
            dbProducts,
            dbProviders,
            dbMovements,
            dbOrders,
            scmState,
            scmMetricsData
        ] = await Promise.all([
            apiScmRequest('/productos'),
            apiScmRequest('/proveedores'),
            apiScmRequest('/inventario/movimientos'),
            apiScmRequest('/pedidos'),
            apiScmRequest('/scm/estado'),
            apiGet('scm_metrics')
        ]);
        const scmAlertsData = await apiGet('scm_alerts');
        scmProducts = dbProducts.map(product => {
            return {
                ...product,
                minStock: product.minStock ?? null,
                strategy: product.strategy || 'PUSH',
                unitCost: product.unitCost ?? Number((product.price * 0.4).toFixed(2)),
                desc: product.desc || product.description || ''
            };
        });
        scmProviders = dbProviders;
        scmMovements = dbMovements;
        scmOrders = dbOrders;
        scmMaturity = scmState.checklist || [];
        scmMetrics = scmMetricsData;
        scmAlerts = scmAlertsData;
        scmLevel = scmState.nivel_scm || 'Inicial';
        renderLowStockWarning();
        renderScmMaturityView();
        clearScmError();
    }

    async function syncScmMaturity() {
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

    async function refreshScmOrders() {
        try {
            scmOrders = await apiScmRequest('/pedidos');
            scmAlerts = await apiGet('scm_alerts');
            renderLowStockWarning();
            renderScmOrdersTable();
        } catch (error) {
            showScmError(error);
        }
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
        // Si el menú SCM está colapsado, expandirlo para mostrar la sección activa
        if (scmSubmenu && scmToggle && scmSubmenu.classList.contains('collapsed')) {
            scmSubmenu.classList.remove('collapsed');
            scmToggle.classList.remove('collapsed');
            scmToggle.setAttribute('aria-expanded', 'true');
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
                refreshScmOrders();
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
                <td><span style="font-weight:700; color:${p.minStock !== null && p.stock <= p.minStock ? '#dc2626' : '#0f172a'}">${p.stock}</span></td>
                <td>${p.minStock ?? 'Sin definir'}</td>
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
                document.getElementById('scm-form-prod-minstock').value = p.minStock ?? '';
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
            if (!await persistScm(() => apiScmRequest(`/productos/${id}`, 'DELETE'))) return;
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
            if (!await persistScm(() => apiScmRequest(`/proveedores/${id}`, 'DELETE'))) return;
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
            const isLow = p.minStock !== null && p.stock <= p.minStock;
            const hasNoMinimum = p.minStock === null;
            const matchesSearch = !search || p.name.toLowerCase().includes(search);
            const matchesStatus = statusFilter === 'todos'
                || (statusFilter === 'bajo' && isLow)
                || (statusFilter === 'normal' && !isLow && !hasNoMinimum)
                || (statusFilter === 'sin-minimo' && hasNoMinimum);
            return matchesSearch && matchesStatus;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b;">No hay existencias que coincidan.</td></tr>';
            return;
        }

        filtered.forEach(p => {
            const isLow = p.minStock !== null && p.stock <= p.minStock;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.name}</strong><br><small style="color:#64748b;">${p.category}</small></td>
                <td><span style="font-weight:700;font-size:1.05rem;color:${isLow ? '#dc2626' : '#0f172a'}">${p.stock}</span></td>
                <td>${p.minStock ?? 'Sin definir'}</td>
                <td>
                    <span class="${p.minStock === null ? 'badge-stock-normal' : isLow ? 'badge-stock-low' : 'badge-stock-normal'}">
                ● ${p.minStock === null ? 'Mínimo sin definir' : isLow ? 'Stock bajo' : 'Normal'}
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
                <td>${p.minStock ?? 'Sin definir'}</td>
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
                <td>
                    <strong>${getProductName(o.productId)}</strong>
                    ${o.autoGenerated ? '<br><small class="scm-auto-order-badge">Reposición automática por stock mínimo</small>' : ''}
                </td>
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

    window.openScmOrderModal = function (productId = null) {
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
        if (productId !== null) {
            const product = scmProducts.find(item => item.id === Number(productId));
            if (product) {
                prodSelect.value = String(product.id);
                document.getElementById('scm-form-ord-qty').value = product.minStock;
                document.getElementById('scm-form-ord-type').value = 'Reposición';
                if (provSelect) provSelect.value = String(product.providerId || '');
                document.getElementById('scm-form-ord-notes').value =
                    `Reposición por stock mínimo: ${product.stock} unidades disponibles de un mínimo de ${product.minStock}.`;
            }
        }
        modal.classList.add('active');
    };

    window.changeScmOrderStatus = async function (orderId, newStatus) {
        const order = scmOrders.find(o => o.id === orderId);
        if (!order) return;

        if (!await persistScm(() => apiScmRequest(`/pedidos/${order.id}/estado`, 'PUT', { status: newStatus }))) return;
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

        const levelBadge = document.getElementById('scm-maturity-current-badge');
        const descElem = document.getElementById('scm-maturity-desc');
        const levelSelect = document.getElementById('scm-maturity-level-select');
        const step1 = document.getElementById('scm-step-1');
        const step2 = document.getElementById('scm-step-2');
        const step3 = document.getElementById('scm-step-3');
        const levels = ['Inicial', 'En desarrollo', 'Optimizado'];
        const selectedLevel = levels.includes(scmLevel) ? scmLevel : levels[0];
        const currentIndex = levels.indexOf(selectedLevel);
        const steps = [step1, step2, step3];
        steps.forEach((step, index) => {
            if (!step) return;
            step.classList.toggle('active', index === currentIndex);
            step.classList.toggle('completed', index < currentIndex);
        });
        if (levelBadge) levelBadge.textContent = selectedLevel;
        if (levelSelect) levelSelect.value = selectedLevel;
        if (selectedLevel === 'Inicial') {
            if (levelBadge) {
                levelBadge.style.background = '#e2e8f0';
                levelBadge.style.color = '#334155';
            }
            if (descElem) descElem.textContent = 'El sistema se encuentra en fase inicial conectando catálogos y almacén.';
        } else if (selectedLevel === 'En desarrollo') {
            if (levelBadge) {
                levelBadge.style.background = '#dcfce7';
                levelBadge.style.color = '#166534';
            }
            if (descElem) descElem.textContent = 'La base de datos MySQL está integrada. Los pedidos, ventas y stock de DeliciasResto alimentan el flujo logístico.';
        } else {
            if (levelBadge) {
                levelBadge.style.background = '#ccfbf1';
                levelBadge.style.color = '#115e59';
            }
            if (descElem) descElem.textContent = 'Operación logística optimizada con sincronización automática en MySQL y métricas precisas.';
        }
    }

    window.toggleMaturityItem = async function (index) {
        if (scmMaturity[index]) {
            scmMaturity[index].completed = !scmMaturity[index].completed;
            if (!await persistScm(syncScmMaturity)) return;
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
        const lowStockCount = metrics ? metrics.lowStockCount : scmProducts.filter(p => p.minStock !== null && p.stock <= p.minStock).length;

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
                : scmProducts.filter(p => p.minStock !== null && p.stock <= p.minStock);

            critTable.innerHTML = '';
            if (criticalList.length === 0) {
                critTable.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:1rem;">Todo el inventario está en niveles óptimos.</td></tr>';
            } else {
                criticalList.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${p.name}</strong><br><small style="color:#64748b;">${p.category || 'Cocina'}</small></td>
                        <td><span style="color:#ef4444;font-weight:700;">${p.stock}</span></td>
                        <td>${p.minStock ?? 'Sin definir'}</td>
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
                const current = scmProducts.find(product => product.id === Number(id));
                const productData = {
                    name,
                    description: desc,
                    category,
                    providerId,
                    stock,
                    minStock,
                    strategy,
                    unitCost,
                    price: current?.price || Number((unitCost * 2.2).toFixed(2)),
                    image: current?.image || ''
                };
                if (!await persistScm(() => apiScmRequest(id ? `/productos/${id}` : '/productos', id ? 'PUT' : 'POST', productData))) return;
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

                const provider = scmProviders.find(item => item.id === Number(id));
                const providerData = {
                    name, contact, email, phone, address,
                    products: provider?.products || ''
                };
                if (!await persistScm(() => apiScmRequest(id ? `/proveedores/${id}` : '/proveedores', id ? 'PUT' : 'POST', providerData))) return;
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

                if (!productId) return alert('Selecciona un producto.');
                if (!quantityInput || quantityInput <= 0) return alert('La cantidad debe ser mayor a 0.');

                const product = scmProducts.find(p => p.id === productId);
                if (!product) return alert('Producto no encontrado.');
                if (!await persistScm(() => apiScmRequest('/inventario/movimiento', 'POST', {
                    productId,
                    type,
                    quantity: quantityInput,
                    reason,
                    date
                }))) return;

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

                if (!await persistScm(() => apiScmRequest('/pedidos', 'POST', {
                    productId,
                    quantity,
                    type,
                    providerId,
                    date,
                    notes
                }))) return;

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
                    if (!await persistScm(() => apiScmRequest(`/productos/${prodId}/estrategia`, 'PUT', { estrategia: newStrategy }))) return;
                    renderScmLogisticsView();
                    alert(`Estrategia actualizada a ${newStrategy} para "${prod.name}".`);
                }
            });
        }

        document.getElementById('scm-maturity-level-save')?.addEventListener('click', async function () {
            const level = document.getElementById('scm-maturity-level-select')?.value;
            if (!level) return;
            if (!await persistScm(async () => {
                const result = await apiScmRequest('/scm/nivel', 'PUT', { nivel_scm: level });
                scmLevel = result.nivel_scm;
            })) return;
            renderScmMaturityView();
        });

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
        try {
            await loadScmData();
        } catch (error) {
            console.error('[SCM SQL] No se pudieron cargar los datos:', error);
            showScmError(error);
        }
        setupFormListeners();

        const crmToggle = document.getElementById('crm-menu-toggle');
        const scmToggle = document.getElementById('scm-menu-toggle');
        const crmSubmenu = document.getElementById('crm-submenu');
        const scmSubmenu = document.getElementById('scm-submenu');

        if (crmToggle && crmSubmenu) {
            crmToggle.addEventListener('click', function (e) {
                e.preventDefault();
                const isCollapsed = crmSubmenu.classList.toggle('collapsed');
                crmToggle.classList.toggle('collapsed');
                crmToggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
            });
        }

        if (scmToggle && scmSubmenu) {
            scmToggle.addEventListener('click', function (e) {
                e.preventDefault();
                const isCollapsed = scmSubmenu.classList.toggle('collapsed');
                scmToggle.classList.toggle('collapsed');
                scmToggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
            });
        }
    });
})();
