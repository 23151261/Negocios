/**
 * ============================================================
 * ERP (Enterprise Resource Planning - Planificación de Recursos Empresariales)
 * Etapa 3 — Integración de CRM (Clientes) + SCM (Inventario/Productos) + ERP (Órdenes/Métricas)
 * DeliciasResto
 * ============================================================
 */

(function () {
    const API_ROOT = `${window.location.origin}/api`;

    // Estado local del módulo ERP
    let erpOrders = [];
    let erpMetrics = null;
    let erpState = null;
    let crmClientsList = [];
    let scmProductsList = [];

    // Estado del asistente de nueva orden
    let orderWizard = {
        step: 1, // 1: Cliente, 2: Productos, 3: Resumen, 4: Procesando, 5: Éxito
        selectedClient: null,
        items: [], // { productId, name, price, stock, quantity, subtotal }
        notes: '',
        createdOrder: null
    };

    // Instancias de Chart.js
    let chartErpSales = null;
    let chartErpTopProds = null;
    let chartReportSales = null;
    let chartReportTop = null;
    let chartReportRotation = null;

    // Helpers para peticiones HTTP
    function showErpError(context, error) {
        const detail = error instanceof Error ? error.message : String(error);
        window.showAppNotification(`${context}: ${detail}`, 'error');
    }

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const token = window.deliciasAuthToken || '';
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const options = { method, headers };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(`${API_ROOT}${endpoint}`, options);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || `Error en la solicitud HTTP ${res.status}`);
        }
        return data;
    }

    // ─────────────────────────────────────────────────────────────
    // CARGA DE DATOS DESDE LA BASE DE DATOS MYSQL
    // ─────────────────────────────────────────────────────────────

    async function loadErpOrders() {
        try {
            erpOrders = await apiRequest('/erp/ordenes');
            return erpOrders;
        } catch (err) {
            showErpError('No se pudieron cargar las órdenes ERP', err);
            erpOrders = [];
            return [];
        }
    }

    async function loadErpMetrics() {
        try {
            erpMetrics = await apiRequest('/erp/metricas');
            return erpMetrics;
        } catch (err) {
            showErpError('No se pudieron cargar las métricas ERP', err);
            return null;
        }
    }

    async function loadErpState() {
        try {
            erpState = await apiRequest('/erp/estado');
            return erpState;
        } catch (err) {
            showErpError('No se pudo cargar el estado ERP', err);
            return null;
        }
    }

    async function loadCrmClients() {
        try {
            crmClientsList = await apiRequest('/clientes');
            return crmClientsList;
        } catch (err) {
            showErpError('No se pudieron cargar los clientes del CRM', err);
            crmClientsList = [];
            return [];
        }
    }

    async function loadScmProducts() {
        try {
            scmProductsList = await apiRequest('/productos');
            return scmProductsList;
        } catch (err) {
            showErpError('No se pudieron cargar los productos del SCM', err);
            scmProductsList = [];
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. INICIO ERP (DASHBOARD GENERAL) - PANTALLA 1
    // ─────────────────────────────────────────────────────────────

    async function renderErpDashboard() {
        const container = document.getElementById('admin-erp-dashboard');
        if (!container) return;

        await Promise.all([loadErpMetrics(), loadErpOrders()]);

        const m = erpMetrics || {
            clientesActivos: 0,
            ordenesClientes: 0,
            ventasTotales: 0,
            ventasPorMes: [],
            productosMasVendidos: []
        };

        // Actualizar KPIs de la Pantalla 1
        const elClients = document.getElementById('erp-dash-clients');
        const elOrders = document.getElementById('erp-dash-orders');
        const elSales = document.getElementById('erp-dash-sales');

        if (elClients) elClients.textContent = m.clientesActivos || 0;
        if (elOrders) elOrders.textContent = m.ordenesClientes || 0;
        if (elSales) elSales.textContent = '$' + Number(m.ventasTotales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

        // Gráfica de Ventas (últimos 6 meses)
        renderDashboardSalesChart(m.ventasPorMes || []);

        // Gráfica de Productos más vendidos (Top)
        renderDashboardTopProductsChart(m.productosMasVendidos || []);
    }

    function renderDashboardSalesChart(salesData) {
        const canvas = document.getElementById('erpDashSalesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (chartErpSales) chartErpSales.destroy();

        const labels = salesData.map(d => d.mes);
        const data = salesData.map(d => d.monto);

        chartErpSales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ventas ($ MXN)',
                    data: data.length ? data : [15, 25, 45, 30, 80, 110],
                    backgroundColor: '#60a5fa',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return ' Ventas: $' + Number(ctx.parsed.y).toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '$' + value
                        },
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderDashboardTopProductsChart(topData) {
        const canvas = document.getElementById('erpDashTopProductsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (chartErpTopProds) chartErpTopProds.destroy();

        const labels = topData.map(p => p.name);
        const data = topData.map(p => p.cantidad);

        chartErpTopProds = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Pizza Margarita', 'Hamburguesa Clásica', 'Pizza Pepperoni', 'Hamburguesa BBQ'],
                datasets: [{
                    label: 'Unidades vendidas',
                    data: data.length ? data : [45, 38, 25, 18],
                    backgroundColor: '#34d399',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return ' Vendidos: ' + ctx.parsed.x + ' uds';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ÓRDENES DE CLIENTES (LISTADO) - PANTALLA 2
    // ─────────────────────────────────────────────────────────────

    async function renderErpOrdersList() {
        const tbody = document.getElementById('erp-orders-table-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando órdenes de clientes...</td></tr>';

        await loadErpOrders();

        const searchVal = (document.getElementById('erp-orders-search')?.value || '').toLowerCase().trim();
        const statusVal = document.getElementById('erp-orders-status-filter')?.value || 'todos';

        let filtered = erpOrders.filter(ord => {
            const matchesSearch = !searchVal
                || (ord.folio && ord.folio.toLowerCase().includes(searchVal))
                || (ord.client_name && ord.client_name.toLowerCase().includes(searchVal))
                || (ord.client_company && ord.client_company.toLowerCase().includes(searchVal));

            const matchesStatus = statusVal === 'todos' || ord.estado === statusVal;
            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:3rem 1rem;color:#64748b;">
                        <i class="fas fa-receipt" style="font-size:2.5rem;color:#cbd5e1;margin-bottom:0.75rem;display:block;"></i>
                        No se encontraron órdenes registradas con los criterios seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(ord => {
            let badgeClass = 'erp-badge-info';
            if (ord.estado === 'Procesada') badgeClass = 'erp-badge-success';
            else if (ord.estado === 'Procesando') badgeClass = 'erp-badge-warning';
            else if (ord.estado === 'Completada') badgeClass = 'erp-badge-primary';
            else if (ord.estado === 'Cancelada') badgeClass = 'erp-badge-danger';

            const fecha = ord.fecha_corta || ord.fecha_formateada || (ord.fecha ? new Date(ord.fecha).toLocaleDateString('es-MX') : '-');
            const total = Number(ord.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const companyTag = ord.client_company ? `<br><small style="color:#64748b;">(${escapeHtml(ord.client_company)})</small>` : '';

            return `
                <tr>
                    <td><strong>${escapeHtml(ord.folio || 'OR-000')}</strong></td>
                    <td>${escapeHtml(fecha)}</td>
                    <td>
                        <strong>${escapeHtml(ord.client_name || 'Cliente')}</strong>
                        ${companyTag}
                    </td>
                    <td><strong>$${total}</strong></td>
                    <td><span class="erp-badge ${badgeClass}">${escapeHtml(ord.estado || 'Procesada')}</span></td>
                    <td style="text-align:center;">
                        <button type="button" class="btn-secondary erp-order-view-btn" onclick="window.viewErpOrderDetail(${ord.id})" title="Ver detalle de la orden">
                            <i class="fas fa-eye" aria-hidden="true"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ─────────────────────────────────────────────────────────────
    // 3, 4, 5, 6, 7. ASISTENTE NUEVA ORDEN (ERP)
    // ─────────────────────────────────────────────────────────────

    async function openNewOrderWizard() {
        orderWizard = {
            step: 1,
            selectedClient: null,
            items: [],
            notes: '',
            createdOrder: null
        };

        if (window.showAdminPage) {
            window.showAdminPage('erp-nueva-orden');
        }

        await Promise.all([loadCrmClients(), loadScmProducts()]);
        renderWizardStep();
    }

    function renderWizardStep() {
        const step1 = document.getElementById('erp-wizard-step-1');
        const step2 = document.getElementById('erp-wizard-step-2');
        const step3 = document.getElementById('erp-wizard-step-3');
        const step4 = document.getElementById('erp-wizard-step-4'); // Procesando
        const step5 = document.getElementById('erp-wizard-step-5'); // Éxito

        // Ocultar todos los contenedores de paso
        [step1, step2, step3, step4, step5].forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Actualizar stepper visual
        updateStepperUI(orderWizard.step);

        if (orderWizard.step === 1) {
            if (step1) step1.style.display = 'block';
            renderWizardStep1();
        } else if (orderWizard.step === 2) {
            if (step2) step2.style.display = 'block';
            renderWizardStep2();
        } else if (orderWizard.step === 3) {
            if (step3) step3.style.display = 'block';
            renderWizardStep3();
        } else if (orderWizard.step === 4) {
            if (step4) step4.style.display = 'block';
            executeOrderProcessing();
        } else if (orderWizard.step === 5) {
            if (step5) step5.style.display = 'block';
            renderWizardStep5();
        }
    }

    function updateStepperUI(currentStep) {
        const steps = [
            { id: 'stepper-step-1', num: 1 },
            { id: 'stepper-step-2', num: 2 },
            { id: 'stepper-step-3', num: 3 }
        ];

        steps.forEach(s => {
            const el = document.getElementById(s.id);
            if (!el) return;
            el.classList.remove('active', 'completed');
            if (currentStep > s.num) {
                el.classList.add('completed');
            } else if (currentStep === s.num) {
                el.classList.add('active');
            }
        });
    }

    // ── Paso 1: Seleccionar Cliente ──
    function renderWizardStep1() {
        const clientListContainer = document.getElementById('erp-client-select-results');
        const selectedPreview = document.getElementById('erp-selected-client-preview');
        const nextBtn = document.getElementById('erp-btn-step1-next');
        const searchInput = document.getElementById('erp-client-search');

        const search = (searchInput?.value || '').toLowerCase().trim();

        let filtered = crmClientsList.filter(c => {
            return !search
                || (c.name && c.name.toLowerCase().includes(search))
                || (c.company && c.company.toLowerCase().includes(search))
                || (c.email && c.email.toLowerCase().includes(search))
                || (c.phone && c.phone.includes(search));
        });

        if (clientListContainer) {
            if (filtered.length === 0) {
                clientListContainer.innerHTML = `
                    <div style="padding:1.5rem;text-align:center;color:#64748b;">
                        No se encontraron clientes con "${escapeHtml(search)}".
                        <button type="button" class="btn-secondary" style="margin-top:0.5rem;" onclick="window.openQuickClientModal()">
                            <i class="fas fa-user-plus"></i> Registrar nuevo cliente
                        </button>
                    </div>
                `;
            } else {
                clientListContainer.innerHTML = filtered.map(c => {
                    const isSelected = orderWizard.selectedClient && orderWizard.selectedClient.id === c.id;
                    const initial = (c.name || 'C').charAt(0).toUpperCase();
                    return `
                        <div class="erp-client-card ${isSelected ? 'selected' : ''}" onclick="window.selectErpWizardClient(${c.id})">
                            <div class="erp-client-avatar">${initial}</div>
                            <div class="erp-client-info">
                                <div class="erp-client-name">${escapeHtml(c.name)}</div>
                                <div class="erp-client-company"><i class="fas fa-building"></i> ${escapeHtml(c.company || 'Particular')}</div>
                                <div class="erp-client-meta">
                                    <span><i class="fas fa-envelope"></i> ${escapeHtml(c.email || 'Sin correo')}</span>
                                    <span><i class="fas fa-phone"></i> ${escapeHtml(c.phone || 'Sin tel')}</span>
                                </div>
                            </div>
                            <div class="erp-client-check">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Vista previa de cliente seleccionado
        if (selectedPreview) {
            if (orderWizard.selectedClient) {
                const c = orderWizard.selectedClient;
                selectedPreview.style.display = 'block';
                selectedPreview.innerHTML = `
                    <div class="erp-selected-client-card">
                        <div class="erp-client-avatar large">${(c.name || 'C').charAt(0).toUpperCase()}</div>
                        <div class="erp-selected-client-body">
                            <h4>${escapeHtml(c.name)}</h4>
                            <p><strong>Empresa:</strong> ${escapeHtml(c.company || 'Cliente Particular')}</p>
                            <p><strong>Correo:</strong> ${escapeHtml(c.email || 'Sin correo')}</p>
                            <p><strong>Teléfono:</strong> ${escapeHtml(c.phone || 'Sin teléfono')}</p>
                        </div>
                    </div>
                `;
                if (nextBtn) nextBtn.disabled = false;
            } else {
                selectedPreview.style.display = 'none';
                if (nextBtn) nextBtn.disabled = true;
            }
        }
    }

    window.selectErpWizardClient = function (clientId) {
        orderWizard.selectedClient = crmClientsList.find(c => c.id === clientId) || null;
        renderWizardStep1();
    };

    // ── Paso 2: Agregar Productos ──
    function renderWizardStep2() {
        const prodTableBody = document.getElementById('erp-catalog-products-body');
        const cartTableBody = document.getElementById('erp-wizard-cart-body');
        const searchInput = document.getElementById('erp-product-search');
        const nextBtn = document.getElementById('erp-btn-step2-next');
        const totalBadge = document.getElementById('erp-wizard-cart-total');

        const search = (searchInput?.value || '').toLowerCase().trim();

        let filtered = scmProductsList.filter(p => {
            return !search || (p.name && p.name.toLowerCase().includes(search)) || (p.category && p.category.toLowerCase().includes(search));
        });

        // Tabla de catálogo con stock y botón agregar
        if (prodTableBody) {
            if (filtered.length === 0) {
                prodTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#64748b;">No hay productos que coincidan.</td></tr>';
            } else {
                prodTableBody.innerHTML = filtered.map(p => {
                    const stock = Number(p.stock || 0);
                    const stockClass = stock <= (p.min_stock || 5) ? 'erp-stock-low' : 'erp-stock-ok';
                    const price = Number(p.price || 0).toFixed(2);
                    const inCart = orderWizard.items.find(it => it.productId === p.id);
                    const currentQty = inCart ? inCart.quantity : 1;

                    return `
                        <tr>
                            <td>
                                <strong>${escapeHtml(p.name)}</strong>
                                <br><small style="color:#64748b;">${escapeHtml(p.category || 'General')}</small>
                            </td>
                            <td><span class="erp-stock-badge ${stockClass}">${stock} disponibles</span></td>
                            <td>$${price}</td>
                            <td>
                                <input type="number" id="erp-qty-${p.id}" class="erp-qty-input" min="1" max="${stock}" value="${currentQty}" ${stock === 0 ? 'disabled' : ''}>
                            </td>
                            <td>
                                <button type="button" class="btn-primary btn-sm" onclick="window.addErpWizardProduct(${p.id})" ${stock === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-plus"></i> ${inCart ? 'Actualizar' : 'Agregar'}
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Tabla de productos añadidos a la orden
        let cartTotal = 0;
        if (cartTableBody) {
            if (orderWizard.items.length === 0) {
                cartTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;padding:2rem;color:#94a3b8;">
                            <i class="fas fa-shopping-basket" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>
                            No has agregado productos a la orden. Selecciona productos del catálogo superior.
                        </td>
                    </tr>
                `;
            } else {
                cartTableBody.innerHTML = orderWizard.items.map((it, idx) => {
                    cartTotal += it.subtotal;
                    return `
                        <tr>
                            <td><strong>${escapeHtml(it.name)}</strong></td>
                            <td style="text-align:center;">${it.quantity}</td>
                            <td>$${it.price.toFixed(2)}</td>
                            <td><strong>$${it.subtotal.toFixed(2)}</strong></td>
                            <td style="text-align:center;">
                                <button type="button" class="btn-action-delete" onclick="window.removeErpWizardProduct(${idx})" title="Eliminar">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        if (totalBadge) totalBadge.textContent = '$' + cartTotal.toFixed(2);
        if (nextBtn) nextBtn.disabled = orderWizard.items.length === 0;
    }

    window.addErpWizardProduct = function (prodId) {
        const prod = scmProductsList.find(p => p.id === prodId);
        if (!prod) return;

        const qtyInput = document.getElementById(`erp-qty-${prodId}`);
        const qty = parseInt(qtyInput?.value || '1', 10);

        if (isNaN(qty) || qty <= 0) {
            window.showAppNotification('Por favor ingresa una cantidad válida mayor a 0.', 'warning');
            return;
        }

        if (qty > Number(prod.stock || 0)) {
            window.showAppNotification(`No hay stock suficiente para ${prod.name}. Stock disponible: ${prod.stock}.`, 'warning');
            return;
        }

        const price = Number(prod.price || 0);
        const subtotal = Number((price * qty).toFixed(2));

        const existingIdx = orderWizard.items.findIndex(it => it.productId === prodId);
        if (existingIdx !== -1) {
            orderWizard.items[existingIdx].quantity = qty;
            orderWizard.items[existingIdx].subtotal = subtotal;
        } else {
            orderWizard.items.push({
                productId: prod.id,
                name: prod.name,
                price: price,
                stock: prod.stock,
                quantity: qty,
                subtotal: subtotal
            });
        }

        renderWizardStep2();
    };

    window.removeErpWizardProduct = function (idx) {
        orderWizard.items.splice(idx, 1);
        renderWizardStep2();
    };

    // ── Paso 3: Resumen de la Orden y Confirmación ──
    function renderWizardStep3() {
        const clientSummary = document.getElementById('erp-summary-client-box');
        const itemsBody = document.getElementById('erp-summary-items-body');
        const subtotalEl = document.getElementById('erp-summary-subtotal');
        const totalEl = document.getElementById('erp-summary-total');

        if (clientSummary && orderWizard.selectedClient) {
            const c = orderWizard.selectedClient;
            clientSummary.innerHTML = `
                <div class="erp-summary-client-card">
                    <div class="erp-client-avatar">${(c.name || 'C').charAt(0).toUpperCase()}</div>
                    <div>
                        <h4 style="margin:0 0 0.25rem 0;color:#0f172a;">${escapeHtml(c.name)}</h4>
                        <p style="margin:0;font-size:0.9rem;color:#64748b;">
                            <strong>Empresa:</strong> ${escapeHtml(c.company || 'Particular')} |
                            <strong>Correo:</strong> ${escapeHtml(c.email || 'N/A')} |
                            <strong>Tel:</strong> ${escapeHtml(c.phone || 'N/A')}
                        </p>
                    </div>
                </div>
            `;
        }

        let total = 0;
        if (itemsBody) {
            itemsBody.innerHTML = orderWizard.items.map(it => {
                total += it.subtotal;
                return `
                    <tr>
                        <td><strong>${escapeHtml(it.name)}</strong></td>
                        <td style="text-align:center;">${it.quantity}</td>
                        <td>$${it.price.toFixed(2)}</td>
                        <td><strong>$${it.subtotal.toFixed(2)}</strong></td>
                    </tr>
                `;
            }).join('');
        }

        if (subtotalEl) subtotalEl.textContent = '$' + total.toFixed(2);
        if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    }

    // ── Paso 4: Procesamiento de la Orden (Pantalla 6 de la imagen) ──
    async function executeOrderProcessing() {
        const progressBar = document.getElementById('erp-process-progress-bar');
        const progressLabel = document.getElementById('erp-process-percentage');

        const stepItems = [
            document.getElementById('erp-proc-step-1'),
            document.getElementById('erp-proc-step-2'),
            document.getElementById('erp-proc-step-3'),
            document.getElementById('erp-proc-step-4'),
            document.getElementById('erp-proc-step-5')
        ];

        // Reset visual
        stepItems.forEach(item => {
            if (item) {
                item.classList.remove('done', 'active');
                item.querySelector('.proc-icon')?.classList.replace('fa-check-circle', 'fa-circle');
            }
        });

        function updateProcessStep(idx, pct) {
            if (progressBar) progressBar.style.width = pct + '%';
            if (progressLabel) progressLabel.textContent = pct + '%';

            for (let i = 0; i <= idx; i++) {
                if (stepItems[i]) {
                    stepItems[i].classList.add('done');
                    const icon = stepItems[i].querySelector('.proc-icon');
                    if (icon) {
                        icon.classList.remove('fa-circle', 'fa-spinner', 'fa-spin');
                        icon.classList.add('fa-check-circle');
                    }
                }
            }
        }

        try {
            // Paso 1: Creando orden (20%)
            updateProcessStep(0, 20);
            await new Promise(r => setTimeout(r, 400));

            // Paso 2: Validando stock (40%)
            updateProcessStep(1, 40);
            await new Promise(r => setTimeout(r, 400));

            // Paso 3: Actualizando inventario y registrando movimientos (60%)
            updateProcessStep(2, 60);

            // LLAMADA REAL A LA API BACKEND (MYSQL)
            const payload = {
                clienteId: orderWizard.selectedClient.id,
                items: orderWizard.items.map(it => ({
                    productId: it.productId,
                    quantity: it.quantity
                })),
                notas: document.getElementById('erp-order-notes')?.value || ''
            };

            const result = await apiRequest('/erp/ordenes', 'POST', payload);
            orderWizard.createdOrder = result.orden;

            // Paso 4: Guardando historial (80%)
            updateProcessStep(3, 80);
            await new Promise(r => setTimeout(r, 400));

            // Paso 5: Finalizando operación (100%)
            updateProcessStep(4, 100);
            await new Promise(r => setTimeout(r, 500));

            // Transicionar al Paso 7: Operación Exitosa
            orderWizard.step = 5;
            renderWizardStep();

            // Refrescar datos en segundo plano y sincronizar todos los módulos
            if (typeof window.syncAllModules === 'function') {
                await window.syncAllModules();
            } else {
                await Promise.all([loadErpOrders(), loadErpMetrics()]);
            }
            window.showAppNotification(`Orden ${orderWizard.createdOrder.folio} creada y sincronizada con CRM y SCM.`, 'success');
        } catch (error) {
            showErpError('No se pudo procesar la orden', error);
            orderWizard.step = 3;
            renderWizardStep();
        }
    }

    // ── Paso 5: Operación Exitosa (Pantalla 7 de la imagen) ──
    function renderWizardStep5() {
        const ord = orderWizard.createdOrder;
        if (!ord) return;

        const folioEl = document.getElementById('erp-success-folio');
        const clientEl = document.getElementById('erp-success-client');
        const totalEl = document.getElementById('erp-success-total');
        const dateEl = document.getElementById('erp-success-date');

        if (folioEl) folioEl.textContent = ord.folio || 'OR-000';
        if (clientEl) clientEl.textContent = ord.cliente || 'Cliente';
        if (totalEl) totalEl.textContent = '$' + Number(ord.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
        if (dateEl) dateEl.textContent = new Date().toLocaleString('es-MX');
    }

    // Botones de navegación del asistente
    window.erpWizardNext = function () {
        if (orderWizard.step === 1) {
            if (!orderWizard.selectedClient) {
                window.showAppNotification('Debes seleccionar un cliente del CRM para continuar.', 'warning');
                return;
            }
            orderWizard.step = 2;
        } else if (orderWizard.step === 2) {
            if (orderWizard.items.length === 0) {
                window.showAppNotification('Debes agregar al menos un producto a la orden.', 'warning');
                return;
            }
            orderWizard.step = 3;
        } else if (orderWizard.step === 3) {
            orderWizard.step = 4; // Ejecutar procesamiento
        }
        renderWizardStep();
    };

    window.erpWizardPrev = function () {
        if (orderWizard.step > 1 && orderWizard.step <= 3) {
            orderWizard.step--;
            renderWizardStep();
        }
    };

    window.cancelErpWizard = function () {
        if (typeof window.showConfirmModal !== 'function') {
            window.showAppNotification('No está disponible la confirmación para cancelar la orden.', 'error');
            return;
        }
        window.showConfirmModal('¿Estás seguro de cancelar esta orden? Los datos ingresados no se guardarán.', confirmed => {
            if (confirmed && window.showAdminPage) window.showAdminPage('erp-ordenes');
        });
    };

    // ─────────────────────────────────────────────────────────────
    // 8. NIVEL DE IMPLEMENTACIÓN ERP - PANTALLA 8
    // ─────────────────────────────────────────────────────────────

    async function renderErpMaturity() {
        await loadErpState();

        const s = erpState || {
            nivel: 'Integrado',
            descripcion: 'Los módulos de CRM, SCM y ERP se encuentran integrados y funcionando de manera coordinada.',
            checklist: []
        };

        const levelBadge = document.getElementById('erp-current-level-badge');
        const descEl = document.getElementById('erp-current-level-desc');
        const checklistContainer = document.getElementById('erp-maturity-checklist');
        const progressEl = document.getElementById('erp-maturity-progress-bar');
        const progressPctEl = document.getElementById('erp-maturity-percentage');

        if (levelBadge) levelBadge.textContent = 'Nivel actual: ' + (s.nivel || 'Integrado');
        if (descEl) descEl.textContent = s.descripcion;

        // Actualizar stepper de madurez
        const levels = ['Básico', 'Integrado', 'Automatizado', 'Optimizado'];
        levels.forEach(lvl => {
            const stepNode = document.getElementById(`erp-mat-step-${lvl.toLowerCase()}`);
            if (stepNode) {
                stepNode.classList.remove('active', 'completed');
                const idx = levels.indexOf(lvl);
                const currentIdx = levels.indexOf(s.nivel || 'Integrado');
                if (idx < currentIdx) stepNode.classList.add('completed');
                else if (idx === currentIdx) stepNode.classList.add('active');
            }
        });

        // Render checklist interactivo
        const defaultChecklist = [
            { id: 'chk-crm', label: 'Clientes integrados (CRM)', completed: true },
            { id: 'chk-scm', label: 'Productos e inventario (SCM)', completed: true },
            { id: 'chk-erp', label: 'Órdenes de clientes funcionando (ERP)', completed: true },
            { id: 'chk-mov', label: 'Movimientos de inventario automáticos', completed: true },
            { id: 'chk-rep', label: 'Reportes empresariales completos', completed: true },
            { id: 'chk-opt', label: 'Procesos optimizados', completed: false }
        ];

        const checklist = (s.checklist && s.checklist.length) ? s.checklist : defaultChecklist;

        const totalItems = checklist.length;
        const completedItems = checklist.filter(c => c.completed).length;
        const percentage = Math.round((completedItems / totalItems) * 100);

        if (progressEl) progressEl.style.width = percentage + '%';
        if (progressPctEl) progressPctEl.textContent = percentage + '% de madurez';

        if (checklistContainer) {
            checklistContainer.innerHTML = checklist.map((item, idx) => `
                <label class="erp-checklist-item">
                    <input type="checkbox" id="erp-chk-${idx}" ${item.completed ? 'checked' : ''} onchange="window.saveErpChecklistChange()">
                    <span class="checkmark"></span>
                    <span class="label-text">${escapeHtml(item.label)}</span>
                </label>
            `).join('');
        }
    }

    window.saveErpChecklistChange = async function () {
        const container = document.getElementById('erp-maturity-checklist');
        if (!container) return;

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const items = [];
        checkboxes.forEach((cb, idx) => {
            const labelText = cb.parentElement.querySelector('.label-text')?.textContent || `Punto ${idx + 1}`;
            items.push({
                id: `chk-${idx}`,
                label: labelText,
                completed: cb.checked
            });
        });

        // Calcular nuevo nivel automáticamente
        const completedCount = items.filter(it => it.completed).length;
        let nivel = 'Básico';
        if (completedCount >= 6) nivel = 'Optimizado';
        else if (completedCount >= 4) nivel = 'Automatizado';
        else if (completedCount >= 2) nivel = 'Integrado';

        const updated = {
            nivel,
            descripcion: nivel === 'Optimizado'
                ? 'Todos los procesos y recursos empresariales operan en su máxima eficiencia.'
                : 'Los módulos de CRM, SCM y ERP se encuentran integrados y funcionando de manera coordinada.',
            checklist: items
        };

        try {
            await apiRequest('/erp/estado', 'PUT', updated);
            erpState = updated;
            renderErpMaturity();
        } catch (err) {
            showErpError('No se pudo guardar el nivel de madurez ERP', err);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 9. REPORTES ERP (DASHBOARD EMPRESARIAL) - PANTALLA 9
    // ─────────────────────────────────────────────────────────────

    async function renderErpReports() {
        await loadErpMetrics();
        const m = erpMetrics || {
            ventasTotales: 0,
            ordenesClientes: 0,
            productosVendidos: 0,
            clientesActivos: 0,
            ventasPorMes: [],
            productosMasVendidos: [],
            rotacionInventario: { altaRotacion: 0, rotacionMedia: 0, rotacionBaja: 0 }
        };

        // Tarjetas KPI
        const kpiSales = document.getElementById('erp-rep-sales');
        const kpiOrders = document.getElementById('erp-rep-orders');
        const kpiProds = document.getElementById('erp-rep-prods');
        const kpiClients = document.getElementById('erp-rep-clients');

        if (kpiSales) kpiSales.textContent = '$' + Number(m.ventasTotales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
        if (kpiOrders) kpiOrders.textContent = m.ordenesClientes || 0;
        if (kpiProds) kpiProds.textContent = m.productosVendidos || 0;
        if (kpiClients) kpiClients.textContent = m.clientesActivos || 0;

        // Gráfica 1: Ventas por mes
        renderReportSalesChart(m.ventasPorMes || []);

        // Gráfica 2: Productos más vendidos
        renderReportTopProductsChart(m.productosMasVendidos || []);

        // Gráfica 3: Inventario disponible / Rotación (Dona)
        renderReportRotationChart(m.rotacionInventario || { altaRotacion: 2, rotacionMedia: 5, rotacionBaja: 1 });
    }

    function renderReportSalesChart(salesData) {
        const canvas = document.getElementById('erpRepSalesChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (chartReportSales) chartReportSales.destroy();

        const labels = salesData.map(d => d.mes);
        const data = salesData.map(d => d.monto);

        chartReportSales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ventas ($ MXN)',
                    data: data.length ? data : [1200, 2300, 4500, 3100, 5600, 12580],
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => '$' + v }
                    }
                }
            }
        });
    }

    function renderReportTopProductsChart(topData) {
        const canvas = document.getElementById('erpRepTopProductsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (chartReportTop) chartReportTop.destroy();

        const labels = topData.map(p => p.name);
        const data = topData.map(p => p.cantidad);

        chartReportTop = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Pizza Margarita', 'Hamburguesa Clásica', 'Pizza Pepperoni', 'Hamburguesa BBQ'],
                datasets: [{
                    label: 'Unidades vendidas',
                    data: data.length ? data : [45, 38, 25, 18],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function renderReportRotationChart(rotData) {
        const canvas = document.getElementById('erpRepRotationChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (chartReportRotation) chartReportRotation.destroy();

        chartReportRotation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Alta rotación', 'Rotación media', 'Rotación baja'],
                datasets: [{
                    data: [rotData.altaRotacion || 3, rotData.rotacionMedia || 5, rotData.rotacionBaja || 2],
                    backgroundColor: ['#0284c7', '#34d399', '#f87171'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12 }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // MODALES: DETALLE DE ORDEN & ALTA RÁPIDA DE CLIENTE CRM
    // ─────────────────────────────────────────────────────────────

    let currentOrderDetailClient = null;

    window.viewErpOrderDetail = async function (orderId) {
        try {
            const order = await apiRequest(`/erp/ordenes/${orderId}`);
            const modal = document.getElementById('erp-order-detail-modal');
            if (!modal) return;

            currentOrderDetailClient = order.cliente_id || null;

            document.getElementById('erp-modal-folio').textContent = order.folio || 'OR-000';
            document.getElementById('erp-modal-date').textContent = order.fecha_formateada || new Date(order.fecha).toLocaleString('es-MX');
            document.getElementById('erp-modal-client').textContent = order.client_name || 'Cliente';
            document.getElementById('erp-modal-company').textContent = order.client_company || 'Particular';
            document.getElementById('erp-modal-email').textContent = order.client_email || 'Sin correo';
            document.getElementById('erp-modal-phone').textContent = order.client_phone || 'Sin teléfono';
            document.getElementById('erp-modal-status-select').value = order.estado || 'Procesada';
            document.getElementById('erp-modal-order-id').value = order.id;

            const notesEl = document.getElementById('erp-modal-notes');
            if (notesEl) notesEl.value = order.notas || '';

            const viewCrmBtn = document.getElementById('erp-modal-view-crm-btn');
            if (viewCrmBtn) {
                viewCrmBtn.style.display = order.cliente_id ? 'inline-block' : 'none';
            }

            const tbody = document.getElementById('erp-modal-items-body');
            if (tbody) {
                tbody.innerHTML = (order.items || []).map(it => `
                    <tr>
                        <td><strong>${escapeHtml(it.name)}</strong></td>
                        <td style="text-align:center;">${it.quantity}</td>
                        <td>$${Number(it.unitPrice).toFixed(2)}</td>
                        <td><strong>$${Number(it.subtotal).toFixed(2)}</strong></td>
                    </tr>
                `).join('');
            }

            document.getElementById('erp-modal-total').textContent = '$' + Number(order.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

            modal.classList.add('active');
        } catch (err) {
            showErpError('No se pudo consultar el detalle de la orden', err);
        }
    };

    window.viewCrmClientFromErp = function () {
        if (!currentOrderDetailClient) return;
        window.closeErpModal('erp-order-detail-modal');
        if (typeof window.viewClientDetailById === 'function') {
            const activeAdminPage = document.querySelector('.admin-page.active')?.id.replace(/^admin-/, '');
            window.viewClientDetailById(currentOrderDetailClient, activeAdminPage || 'erp-ordenes');
        } else if (typeof window.showAdminPage === 'function') {
            window.showAdminPage('clientes');
        }
    };

    window.closeErpModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    };

    window.saveErpOrderStatusChange = async function () {
        const orderId = document.getElementById('erp-modal-order-id')?.value;
        const newStatus = document.getElementById('erp-modal-status-select')?.value;
        const notes = document.getElementById('erp-modal-notes')?.value || '';
        if (!orderId || !newStatus) return;

        try {
            await apiRequest(`/erp/ordenes/${orderId}`, 'PUT', { estado: newStatus, notas: notes });
            window.closeErpModal('erp-order-detail-modal');
            await Promise.all([renderErpOrdersList(), loadErpMetrics()]);
            if (typeof window.syncAllModules === 'function') {
                await window.syncAllModules();
            }
            window.showAppNotification('Orden y estado actualizados en todo el sistema.', 'success');
        } catch (err) {
            showErpError('No se pudo actualizar la orden', err);
        }
    };

    window.openQuickClientModal = function () {
        const modal = document.getElementById('erp-quick-client-modal');
        if (modal) {
            document.getElementById('erp-qc-form')?.reset();
            modal.classList.add('active');
        }
    };

    window.saveQuickClient = async function () {
        const name = document.getElementById('erp-qc-name')?.value.trim();
        const company = document.getElementById('erp-qc-company')?.value.trim();
        const email = document.getElementById('erp-qc-email')?.value.trim();
        const phone = document.getElementById('erp-qc-phone')?.value.trim();
        const address = document.getElementById('erp-qc-address')?.value.trim();

        if (!name || !email) {
            window.showAppNotification('El nombre y el correo electrónico son obligatorios.', 'warning');
            return;
        }

        try {
            const newClient = await apiRequest('/clientes', 'POST', {
                name,
                company: company || '',
                email,
                phone: phone || '',
                address: address || '',
                stage: 'prospecto',
                status: 'activo'
            });

            await loadCrmClients();
            window.closeErpModal('erp-quick-client-modal');

            // Seleccionar automáticamente al nuevo cliente
            orderWizard.selectedClient = newClient;
            renderWizardStep1();

            // Sincronizar inmediatamente con CRM
            if (typeof window.syncAllModules === 'function') {
                await window.syncAllModules();
            }
            window.showAppNotification('Cliente registrado en el CRM y disponible para la orden.', 'success');
        } catch (err) {
            showErpError('No se pudo registrar el cliente en el CRM', err);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // CONTROL DE ACCESOS Y MENÚ DINÁMICO POR ROL (REQUERIMIENTO 10)
    // ─────────────────────────────────────────────────────────────

    function applyRolePermissions() {
        const role = typeof window.getAdminRole === 'function' ? window.getAdminRole() : 'admin';
        const visiblePagesByRole = {
            ventas: new Set([
                'dashboard', 'clientes', 'client-detail', 'client-form', 'mi-actividad',
                'scm-productos', 'erp-ordenes', 'erp-nueva-orden', 'erp-reportes',
                'ecom-monedero', 'ecom-impuestos', 'ecom-tickets', 'ecom-pagos'
            ]),
            logistica: new Set(['dashboard', 'scm-productos', 'scm-inventario', 'erp-ordenes', 'erp-reportes']),
            soporte: new Set(['ecom-tickets'])
        };
        const restrictedPages = visiblePagesByRole[role];
        const menuLinks = document.querySelectorAll('.sidebar-menu a[data-admin-page]');

        menuLinks.forEach(link => {
            const page = link.getAttribute('data-admin-page');
            const parentLi = link.closest('li');
            if (!parentLi) return;

            const duplicateCrmHome = page === 'dashboard' && link.closest('#crm-submenu');
            const isVisible = !restrictedPages
                || (restrictedPages.has(page) && !duplicateCrmHome);

            parentLi.style.display = isVisible ? '' : 'none';

            if (page === 'erp-ordenes') {
                link.lastChild.textContent = restrictedPages ? ' Órdenes' : ' Órdenes de clientes';
            }
            if (page === 'erp-reportes') {
                link.lastChild.textContent = restrictedPages ? ' Reportes' : ' Reportes ERP';
            }
        });

        // Ocultar cabeceras de grupos si no tienen hijos visibles
        ['crm-submenu', 'scm-submenu', 'erp-submenu', 'ecom-submenu'].forEach(subId => {
            const sub = document.getElementById(subId);
            if (!sub) return;
            const parentGroup = sub.closest('.menu-group-header');
            if (!parentGroup) return;

            const visibleItems = Array.from(sub.querySelectorAll('li')).filter(li => li.style.display !== 'none');
            parentGroup.style.display = visibleItems.length > 0 ? '' : 'none';
        });

        // Ocultar link directo a usuarios y configuración si el rol no es admin
        const userMenu = document.querySelector('.sidebar-menu a[data-admin-page="usuarios"]')?.closest('li');
        const configMenu = document.querySelector('.sidebar-menu a[data-admin-page="configuracion"]')?.closest('li');
        if (role !== 'admin' && role !== 'super_administrador') {
            if (userMenu) userMenu.style.display = 'none';
            if (configMenu) configMenu.style.display = 'none';
        } else {
            if (userMenu) userMenu.style.display = '';
            if (configMenu) configMenu.style.display = '';
        }
    }

    // ─────────────────────────────────────────────────────────────
    // INVENTARIO INTEGRAL ERP (UNIFICANDO CRM Y SCM / CMM)
    // ─────────────────────────────────────────────────────────────

    let erpInventoryData = [];
    let erpInventoryKpis = null;
    let erpProvidersList = [];
    let currentDetailedProduct = null;

    async function loadErpInventory() {
        try {
            const data = await apiRequest('/erp/inventario');
            erpInventoryData = data.items || [];
            erpInventoryKpis = data.kpis || null;
            erpProvidersList = data.proveedores || [];
            return data;
        } catch (err) {
            erpInventoryData = [];
            erpInventoryKpis = null;
            erpProvidersList = [];
            showErpError('No se pudo cargar el inventario integrado CRM/SCM', err);
            return null;
        }
    }

    async function renderErpInventoryPage() {
        const tbody = document.getElementById('erp-inventory-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando inventario integrado con CRM y SCM desde la base de datos...</td></tr>';
        }

        await loadErpInventory();

        // Actualizar KPIs de inventario ERP
        if (erpInventoryKpis) {
            const valCostoEl = document.getElementById('erp-inv-kpi-valor-costo');
            const totalStockEl = document.getElementById('erp-inv-kpi-total-stock');
            const stockBajoEl = document.getElementById('erp-inv-kpi-stock-bajo');
            const demandaCrmEl = document.getElementById('erp-inv-kpi-demanda-crm');
            const scmCaminoEl = document.getElementById('erp-inv-kpi-scm-camino');

            if (valCostoEl) valCostoEl.textContent = `$${Number(erpInventoryKpis.valorTotalCosto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            if (totalStockEl) totalStockEl.textContent = `${Number(erpInventoryKpis.totalStock || 0).toLocaleString('es-MX')}`;
            if (stockBajoEl) stockBajoEl.textContent = `${Number(erpInventoryKpis.articulosStockBajo || 0)}`;
            if (demandaCrmEl) demandaCrmEl.textContent = `${Number(erpInventoryKpis.unidadesVendidasCrm || 0).toLocaleString('es-MX')}`;
            if (scmCaminoEl) scmCaminoEl.textContent = `${Number(erpInventoryKpis.unidadesEnCamino || 0).toLocaleString('es-MX')}`;
        }

        // Llenar select de proveedores si aún no está poblado
        const provSelect = document.getElementById('erp-inv-provider-filter');
        if (provSelect && provSelect.options.length <= 1) {
            erpProvidersList.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                provSelect.appendChild(opt);
            });
        }

        renderErpInventoryTable();
    }

    function renderErpInventoryTable() {
        const tbody = document.getElementById('erp-inventory-table-body');
        if (!tbody) return;

        const searchTerm = (document.getElementById('erp-inv-search')?.value || '').toLowerCase().trim();
        const statusFilter = document.getElementById('erp-inv-status-filter')?.value || 'todos';
        const strategyFilter = document.getElementById('erp-inv-strategy-filter')?.value || 'todas';
        const providerFilter = document.getElementById('erp-inv-provider-filter')?.value || 'todos';
        const sortFilter = document.getElementById('erp-inv-sort')?.value || 'name-asc';

        let list = [...erpInventoryData];

        // Filtro de búsqueda
        if (searchTerm) {
            list = list.filter(item =>
                (item.name || '').toLowerCase().includes(searchTerm) ||
                (item.category || '').toLowerCase().includes(searchTerm) ||
                (item.provider_name || '').toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de estado
        if (statusFilter !== 'todos') {
            list = list.filter(item => item.stock_status === statusFilter);
        }

        // Filtro de estrategia
        if (strategyFilter !== 'todas') {
            list = list.filter(item => (item.strategy || 'PUSH').toUpperCase() === strategyFilter.toUpperCase());
        }

        // Filtro de proveedor
        if (providerFilter !== 'todos') {
            list = list.filter(item => String(item.provider_id) === String(providerFilter));
        }

        // Ordenamiento
        list.sort((a, b) => {
            if (sortFilter === 'name-asc') return (a.name || '').localeCompare(b.name || '');
            if (sortFilter === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
            if (sortFilter === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
            if (sortFilter === 'crm-desc') return (b.crm?.unidades_vendidas || 0) - (a.crm?.unidades_vendidas || 0);
            if (sortFilter === 'valor-desc') return (b.valor_costo || 0) - (a.valor_costo || 0);
            return 0;
        });

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#64748b;">No se encontraron artículos que coincidan con los filtros aplicados.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => {
            let statusBadge = '<span class="erp-badge erp-badge-success">Normal</span>';
            if (item.stock_status === 'Agotado') {
                statusBadge = '<span class="erp-badge erp-badge-danger">Agotado</span>';
            } else if (item.stock_status === 'Bajo') {
                statusBadge = '<span class="erp-badge erp-badge-warning">Stock bajo</span>';
            }

            const strategyBadge = item.strategy === 'PULL'
                ? '<span style="font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:6px;background:#e0f2fe;color:#0369a1;font-weight:700;">PULL</span>'
                : '<span style="font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:6px;background:#f1f5f9;color:#475569;font-weight:700;">PUSH</span>';

            const pedidosInfo = item.scm?.pedidos_pendientes > 0
                ? `<span style="display:inline-block;margin-top:0.25rem;font-size:0.78rem;color:#7c3aed;background:#ede9fe;padding:0.15rem 0.45rem;border-radius:4px;"><i class="fas fa-truck-loading"></i> ${item.scm.pedidos_pendientes} en proceso (${item.scm.unidades_en_camino} u.)</span>`
                : `<small style="display:block;color:#94a3b8;font-size:0.78rem;">Sin pedidos pendientes</small>`;

            const crmInfo = item.crm?.unidades_vendidas > 0
                ? `<div><strong>${item.crm.unidades_vendidas}</strong> u. vendidas <small style="color:#64748b;">(${item.crm.clientes_distintos} cliente${item.crm.clientes_distintos > 1 ? 's' : ''})</small></div>
                   <small style="display:block;color:#059669;font-size:0.78rem;"><i class="fas fa-user-check"></i> Último: ${escapeHtml(item.crm.ultimo_cliente)}</small>`
                : `<small style="color:#94a3b8;font-size:0.78rem;">Sin órdenes registradas</small>`;

            return `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:0.75rem;">
                            <div style="width:38px;height:38px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:700;color:#6366f1;flex-shrink:0;">
                                <i class="fas fa-utensils"></i>
                            </div>
                            <div>
                                <strong style="color:#0f172a;display:block;font-size:0.95rem;">${escapeHtml(item.name)}</strong>
                                <small style="color:#64748b;">${escapeHtml(item.category || 'General')}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex;align-items:baseline;gap:0.5rem;">
                            <span style="font-size:1.15rem;font-weight:800;color:#0f172a;">${item.stock}</span>
                            <small style="color:#64748b;">/ mín. ${item.min_stock != null ? item.min_stock : '-'}</small>
                        </div>
                        <div style="margin-top:0.2rem;">${statusBadge}</div>
                    </td>
                    <td>
                        <div style="font-size:0.85rem;color:#0f172a;">
                            <div>Costo: <strong>$${Number(item.unit_cost).toFixed(2)}</strong> | Venta: <strong>$${Number(item.price).toFixed(2)}</strong></div>
                            <div style="color:#6366f1;font-weight:600;margin-top:0.15rem;">Valuación: $${Number(item.valor_costo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                            <small style="color:#10b981;font-weight:600;">Margen: ${item.margin_percent}%</small>
                        </div>
                    </td>
                    <td>
                        <div style="font-size:0.88rem;color:#0f172a;">
                            <div style="display:flex;align-items:center;gap:0.4rem;">
                                <strong style="font-size:0.88rem;">${escapeHtml(item.provider_name)}</strong>
                                ${strategyBadge}
                            </div>
                            ${pedidosInfo}
                        </div>
                    </td>
                    <td>
                        <div style="font-size:0.88rem;">
                            ${crmInfo}
                        </div>
                    </td>
                    <td style="text-align:center;">
                        <div style="display:inline-flex;gap:0.4rem;align-items:center;">
                            <button type="button" class="btn-primary" style="padding:0.4rem 0.75rem;font-size:0.82rem;background:#4f46e5;border-color:#4f46e5;" onclick="window.openErpInventory360Modal(${item.id})" title="Auditoría integral CRM + SCM">
                                <i class="fas fa-eye"></i> Auditoría 360°
                            </button>
                            <button type="button" class="btn-secondary" style="padding:0.4rem 0.65rem;font-size:0.82rem;" onclick="window.sellProductFromErpList(${item.id})" title="Crear orden con este producto">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function openErpInventory360Modal(productId) {
        currentDetailedProduct = null;
        const modal = document.getElementById('erp-inventory-detail-modal');
        if (!modal) return;

        modal.classList.add('active');

        const nameEl = document.getElementById('erp-inv-modal-prod-name');
        if (nameEl) nameEl.textContent = 'Cargando información integrada...';

        try {
            const data = await apiRequest(`/erp/inventario/${productId}`);
            if (!data || !data.product) throw new Error('No se encontró información del producto');

            currentDetailedProduct = data;
            const p = data.product;

            if (nameEl) nameEl.textContent = p.name;
            const catEl = document.getElementById('erp-inv-modal-category');
            if (catEl) catEl.textContent = p.category || 'General';

            const badgeEl = document.getElementById('erp-inv-modal-status-badge');
            if (badgeEl) {
                if (p.stock <= 0) {
                    badgeEl.className = 'erp-badge erp-badge-danger';
                    badgeEl.textContent = 'Agotado';
                } else if (p.min_stock != null && p.stock <= p.min_stock) {
                    badgeEl.className = 'erp-badge erp-badge-warning';
                    badgeEl.textContent = 'Stock bajo';
                } else {
                    badgeEl.className = 'erp-badge erp-badge-success';
                    badgeEl.textContent = 'Normal';
                }
            }

            document.getElementById('erp-inv-modal-stock').textContent = p.stock;
            document.getElementById('erp-inv-modal-min-stock').textContent = p.min_stock != null ? p.min_stock : 'Sin mínimo';
            document.getElementById('erp-inv-modal-val-costo').textContent = `$${Number(p.valor_costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            document.getElementById('erp-inv-modal-unit-cost').textContent = `$${Number(p.unit_cost || 0).toFixed(2)}`;
            document.getElementById('erp-inv-modal-price').textContent = `$${Number(p.price || 0).toFixed(2)}`;
            document.getElementById('erp-inv-modal-margin').textContent = `${p.margin_percent}%`;
            document.getElementById('erp-inv-modal-strategy').textContent = p.strategy || 'PUSH';

            const crmTotalUnits = (data.crm?.ordenes || []).reduce((acc, o) => acc + (Number(o.quantity) || 0), 0);
            const crmTotalMoney = (data.crm?.ordenes || []).reduce((acc, o) => acc + (Number(o.subtotal) || 0), 0);
            document.getElementById('erp-inv-modal-crm-qty').textContent = crmTotalUnits;
            document.getElementById('erp-inv-modal-crm-billed').textContent = `$${crmTotalMoney.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

            document.getElementById('erp-inv-modal-prov-name').textContent = p.provider?.name || 'Sin proveedor asignado';
            document.getElementById('erp-inv-modal-prov-contact').textContent = p.provider?.contact || '-';
            document.getElementById('erp-inv-modal-prov-phone').textContent = p.provider?.phone || '-';
            document.getElementById('erp-inv-modal-prov-email').textContent = p.provider?.email || '-';
            document.getElementById('erp-inv-modal-prov-strategy').textContent = `Estrategia ${p.strategy || 'PUSH'}`;

            const scmOrdersBody = document.getElementById('erp-inv-modal-scm-orders-body');
            if (scmOrdersBody) {
                const orders = data.scm?.pedidos || [];
                if (orders.length === 0) {
                    scmOrdersBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:1rem;">No hay pedidos de reposición registrados para este artículo.</td></tr>';
                } else {
                    scmOrdersBody.innerHTML = orders.map(ord => `
                        <tr>
                            <td><strong>${escapeHtml(ord.folio)}</strong></td>
                            <td>${escapeHtml(ord.date || '')}</td>
                            <td>${ord.quantity} u.</td>
                            <td>${escapeHtml(ord.type || 'Reposición')}</td>
                            <td><span class="erp-badge ${ord.status === 'Surtido' ? 'erp-badge-success' : ord.status === 'Cancelado' ? 'erp-badge-danger' : 'erp-badge-warning'}">${escapeHtml(ord.status || 'Pendiente')}</span></td>
                            <td>${escapeHtml(ord.provider_name || p.provider?.name || '-')}</td>
                        </tr>
                    `).join('');
                }
            }

            const scmMovsBody = document.getElementById('erp-inv-modal-scm-movs-body');
            if (scmMovsBody) {
                const movs = data.scm?.movimientos || [];
                if (movs.length === 0) {
                    scmMovsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:1rem;">Sin movimientos de inventario registrados.</td></tr>';
                } else {
                    scmMovsBody.innerHTML = movs.map(m => `
                        <tr>
                            <td>${escapeHtml(m.date || '')}</td>
                            <td><span class="erp-badge ${m.type === 'Entrada' ? 'erp-badge-success' : 'erp-badge-info'}">${escapeHtml(m.type)}</span></td>
                            <td><strong>${m.quantity > 0 ? '+' : ''}${m.quantity}</strong></td>
                            <td>${escapeHtml(m.reason || '-')}</td>
                            <td><small>${escapeHtml(m.user || 'Sistema')}</small></td>
                        </tr>
                    `).join('');
                }
            }

            const topClientsBody = document.getElementById('erp-inv-modal-crm-top-clients-body');
            if (topClientsBody) {
                const tops = data.crm?.topClientes || [];
                if (tops.length === 0) {
                    topClientsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:1rem;">Aún ningún cliente de CRM ha comprado este producto.</td></tr>';
                } else {
                    topClientsBody.innerHTML = tops.map(tc => `
                        <tr>
                            <td><strong>${escapeHtml(tc.client_name)}</strong></td>
                            <td>${escapeHtml(tc.client_company || '-')}</td>
                            <td>${tc.total_pedidos}</td>
                            <td><strong>${tc.unidades_compradas}</strong> u.</td>
                            <td style="color:#059669;font-weight:700;">$${Number(tc.monto_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `).join('');
                }
            }

            const crmOrdersBody = document.getElementById('erp-inv-modal-crm-orders-body');
            if (crmOrdersBody) {
                const ords = data.crm?.ordenes || [];
                if (ords.length === 0) {
                    crmOrdersBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:1rem;">Sin órdenes de clientes registradas en el ERP.</td></tr>';
                } else {
                    crmOrdersBody.innerHTML = ords.map(ord => `
                        <tr>
                            <td><strong>${escapeHtml(ord.folio)}</strong></td>
                            <td>${escapeHtml(ord.fecha ? new Date(ord.fecha).toLocaleDateString('es-MX') : '-')}</td>
                            <td>${escapeHtml(ord.client_name)}</td>
                            <td><strong>${ord.quantity}</strong> u.</td>
                            <td>$${Number(ord.subtotal || 0).toFixed(2)}</td>
                            <td><span class="erp-badge ${ord.estado === 'Completada' ? 'erp-badge-success' : ord.estado === 'Cancelada' ? 'erp-badge-danger' : 'erp-badge-primary'}">${escapeHtml(ord.estado)}</span></td>
                        </tr>
                    `).join('');
                }
            }

            switchErpInvModalTab('scm');

        } catch (err) {
            showErpError('No se pudieron consultar los datos integrados del producto', err);
            modal.classList.remove('active');
        }
    }

    function switchErpInvModalTab(tab) {
        const scmBtn = document.getElementById('erp-inv-tab-scm-btn');
        const crmBtn = document.getElementById('erp-inv-tab-crm-btn');
        const scmPanel = document.getElementById('erp-inv-panel-scm');
        const crmPanel = document.getElementById('erp-inv-panel-crm');

        if (tab === 'scm') {
            if (scmBtn) {
                scmBtn.style.borderBottom = '3px solid #6366f1';
                scmBtn.style.color = '#6366f1';
            }
            if (crmBtn) {
                crmBtn.style.borderBottom = 'none';
                crmBtn.style.color = '#64748b';
            }
            if (scmPanel) scmPanel.style.display = 'block';
            if (crmPanel) crmPanel.style.display = 'none';
        } else {
            if (crmBtn) {
                crmBtn.style.borderBottom = '3px solid #6366f1';
                crmBtn.style.color = '#6366f1';
            }
            if (scmBtn) {
                scmBtn.style.borderBottom = 'none';
                scmBtn.style.color = '#64748b';
            }
            if (crmPanel) crmPanel.style.display = 'block';
            if (scmPanel) scmPanel.style.display = 'none';
        }
    }

    function sellProductFromErpInventory() {
        const modal = document.getElementById('erp-inventory-detail-modal');
        if (modal) modal.classList.remove('active');
        if (currentDetailedProduct && currentDetailedProduct.product) {
            sellProductFromErpList(currentDetailedProduct.product.id);
        }
    }

    function sellProductFromErpList(productId) {
        const p = (erpInventoryData || []).find(item => item.id === productId);
        openNewOrderWizard();
        if (p && orderWizard) {
            const existing = orderWizard.items.find(i => i.productId === p.id);
            if (!existing) {
                orderWizard.items.push({
                    productId: p.id,
                    name: p.name,
                    price: Number(p.price),
                    stock: Number(p.stock),
                    quantity: 1,
                    subtotal: Number(p.price)
                });
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // ROUTER DE VISTAS ERP
    // ─────────────────────────────────────────────────────────────

    function renderErpView(pageId) {
        applyRolePermissions();

        if (pageId === 'erp-dashboard') {
            renderErpDashboard();
        } else if (pageId === 'erp-ordenes') {
            renderErpOrdersList();
        } else if (pageId === 'erp-inventario') {
            renderErpInventoryPage();
        } else if (pageId === 'erp-nueva-orden') {
            openNewOrderWizard();
        } else if (pageId === 'erp-nivel') {
            renderErpMaturity();
        } else if (pageId === 'erp-reportes') {
            renderErpReports();
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Inicialización al cargar el DOM
    document.addEventListener('DOMContentLoaded', function () {
        // Búsqueda en listado de órdenes
        const searchInput = document.getElementById('erp-orders-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => renderErpOrdersList());
        }
        const filterSelect = document.getElementById('erp-orders-status-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => renderErpOrdersList());
        }

        // Búsqueda y filtros en inventario ERP
        const invSearch = document.getElementById('erp-inv-search');
        if (invSearch) {
            invSearch.addEventListener('input', () => renderErpInventoryTable());
        }
        const invStatusFilter = document.getElementById('erp-inv-status-filter');
        if (invStatusFilter) {
            invStatusFilter.addEventListener('change', () => renderErpInventoryTable());
        }
        const invStrategyFilter = document.getElementById('erp-inv-strategy-filter');
        if (invStrategyFilter) {
            invStrategyFilter.addEventListener('change', () => renderErpInventoryTable());
        }
        const invProvFilter = document.getElementById('erp-inv-provider-filter');
        if (invProvFilter) {
            invProvFilter.addEventListener('change', () => renderErpInventoryTable());
        }
        const invSortFilter = document.getElementById('erp-inv-sort');
        if (invSortFilter) {
            invSortFilter.addEventListener('change', () => renderErpInventoryTable());
        }

        // Búsqueda en cliente del asistente
        const clientSearch = document.getElementById('erp-client-search');
        if (clientSearch) {
            clientSearch.addEventListener('input', () => renderWizardStep1());
        }

        // Búsqueda en productos del asistente
        const prodSearch = document.getElementById('erp-product-search');
        if (prodSearch) {
            prodSearch.addEventListener('input', () => renderWizardStep2());
        }

        // Aplicar permisos
        applyRolePermissions();
    });

    document.addEventListener('admin-authenticated', function () {
        applyRolePermissions();
    });

    // Sincronización de datos ERP desde otros módulos
    async function refreshErpData() {
        const role = typeof window.getAdminRole === 'function' ? window.getAdminRole() : 'admin';
        const tasks = [loadErpOrders(), loadErpMetrics(), loadScmProducts()];
        if (['admin', 'super_administrador', 'ventas'].includes(role)) {
            tasks.push(loadCrmClients());
        }
        if (['admin', 'super_administrador'].includes(role)) {
            tasks.push(loadErpInventory());
        }
        await Promise.all(tasks);
        const activeEl = document.querySelector('.admin-page.active');
        if (activeEl && activeEl.id && activeEl.id.startsWith('admin-erp-')) {
            const pageId = activeEl.id.replace('admin-', '');
            renderErpView(pageId);
        }
    }

    // Exponer API global
    window.renderErpPage = renderErpView;
    window.openErpOrderWizard = openNewOrderWizard;
    window.applyRolePermissions = applyRolePermissions;
    window.refreshErpData = refreshErpData;
    window.refreshErpInventory = renderErpInventoryPage;
    window.openErpInventory360Modal = openErpInventory360Modal;
    window.switchErpInvModalTab = switchErpInvModalTab;
    window.sellProductFromErpInventory = sellProductFromErpInventory;
    window.sellProductFromErpList = sellProductFromErpList;

})();
