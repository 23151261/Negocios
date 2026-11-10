/**
 * ecom.js — Módulo de Comercio Electrónico (Etapa 4)
 * DeliciasResto / Artesanía MX
 * Flujo de compra, Pagos, Monedero Digital, Impuestos y Atención a Clientes (Tickets)
 */

(function() {
    'use strict';

    const API_ROOT = window.location.origin;

    function apiHeaders(headers = {}) {
        const token = window.deliciasAuthToken
            || sessionStorage.getItem('delicias_admin_token')
            || localStorage.getItem('token')
            || sessionStorage.getItem('token');
        return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
    }

    // Utilidad de notificación visual en el DOM (sin alert de navegador)
    function notify(message, type = 'info') {
        if (typeof window.showAppNotification === 'function') {
            window.showAppNotification(message, type);
        } else {
            const container = document.getElementById('app-notifications') || createNotificationContainer();
            const toast = document.createElement('div');
            toast.className = `app-notification app-notification-${type}`;
            const title = document.createElement('strong');
            title.textContent = `${type.toUpperCase()}: `;
            const detail = document.createElement('span');
            detail.textContent = message;
            toast.append(title, detail);
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        }
    }

    function createNotificationContainer() {
        const c = document.createElement('div');
        c.id = 'app-notifications';
        c.className = 'app-notifications';
        document.body.appendChild(c);
        return c;
    }

    function getAuthToken() {
        return window.deliciasAuthToken || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    }

    function getStoredUser() {
        try {
            const raw = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        if (window.currentUser && window.currentUser.id) return window.currentUser;
        return null;
    }

    // ─── ESTADO GLOBAL ECOM ─────────────────────────────────────
    const ecomState = {
        monederoSaldo: 1200.00,
        impuestos: [{ id: 1, nombre: 'IVA', porcentaje: 16.00, estado: 'Activo' }],
        impuestoActivo: 16.00,
        tickets: [],
        ticketsAdmin: [],
        pagosAdmin: [],
        monederoMovimientos: []
    };

    // ─── 1. MONEDERO CLIENTE ────────────────────────────────────
    async function loadMonedero(clienteId) {
        if (!clienteId) clienteId = getStoredUser()?.id;
        if (!clienteId) return;
        try {
            const res = await fetch(`${API_ROOT}/api/monedero/${clienteId}`, {
                headers: apiHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                ecomState.monederoSaldo = Number(data.saldo || 0);
                ecomState.monederoMovimientos = data.movimientos || [];
                renderMonederoUI();
                updateCheckoutWalletDisplay();
            }
        } catch (err) {
            notify('No se pudo actualizar el monedero desde el servidor.', 'error');
        }
    }

    function renderMonederoUI() {
        const saldoEls = document.querySelectorAll('#monedero-saldo-display, #nav-monedero-saldo, #profile-monedero-saldo');
        saldoEls.forEach(el => {
            if (el) el.textContent = `$${ecomState.monederoSaldo.toFixed(2)}`;
        });

        const tbody = document.getElementById('monedero-movimientos-body');
        if (tbody) {
            if (ecomState.monederoMovimientos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#64748b;">No hay movimientos registrados en tu monedero</td></tr>';
            } else {
                tbody.innerHTML = ecomState.monederoMovimientos.map(m => {
                    const esCargo = m.tipo === 'cargo' || m.monto < 0;
                    const color = esCargo ? '#ef4444' : '#10b981';
                    const signo = esCargo ? '-' : '+';
                    const montoFmt = `${signo}$${Math.abs(Number(m.monto)).toFixed(2)}`;
                    const fechaFmt = new Date(m.fecha).toLocaleDateString('es-MX', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    return `
                        <tr>
                            <td>${fechaFmt}</td>
                            <td><strong>${m.folio}</strong><br><span style="font-size:0.85rem; color:#64748b;">${m.concepto}</span></td>
                            <td style="color:${color}; font-weight:700;">${montoFmt}</td>
                            <td style="font-weight:700;">$${Number(m.saldo).toFixed(2)}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    async function recargarMonedero(monto, metodoPago) {
        const user = getStoredUser();
        const clienteId = user?.id;
        if (!clienteId) {
            notify('Inicia sesión para consultar tu monedero.', 'warning');
            return false;
        }

        try {
            const res = await fetch(`${API_ROOT}/api/monedero/recargar`, {
                method: 'POST',
                headers: apiHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    cliente_id: clienteId,
                    monto: Number(monto),
                    metodo_pago: metodoPago
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                ecomState.monederoSaldo = Number(data.nuevoSaldo);
                notify(`¡Recarga exitosa! Se han abonado $${Number(monto).toFixed(2)} a tu monedero.`, 'success');
                await loadMonedero(clienteId);
                return true;
            } else {
                notify(data.error || 'No se pudo realizar la recarga', 'error');
                return false;
            }
        } catch (err) {
            notify('Error de conexión al procesar la recarga', 'error');
            return false;
        }
    }

    // ─── 2. IMPUESTOS ───────────────────────────────────────────
    async function loadImpuestos() {
        try {
            const res = await fetch(`${API_ROOT}/api/impuestos`);
            if (res.ok) {
                const data = await res.json();
                ecomState.impuestos = data;
                const activo = data.find(i => i.estado === 'Activo');
                if (activo) ecomState.impuestoActivo = Number(activo.porcentaje);
            }
        } catch (_) {}
    }

    // ─── 3. ATENCIÓN A CLIENTES (TICKETS) ────────────────────────
    async function loadTicketsCliente(clienteId) {
        if (!clienteId) clienteId = getStoredUser()?.id;
        if (!clienteId) return;
        try {
            const res = await fetch(`${API_ROOT}/api/atencion/tickets/cliente/${clienteId}`, {
                headers: apiHeaders()
            });
            if (res.ok) {
                ecomState.tickets = await res.json();
                renderTicketsUI();
            }
        } catch (_) {
            notify('No se pudo cargar el historial de atención.', 'error');
        }
    }

    function renderTicketsUI() {
        const container = document.getElementById('tickets-lista-container');
        if (!container) return;

        if (ecomState.tickets.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:#64748b;">
                    <i class="fas fa-headset" style="font-size:2.5rem; opacity:0.3; margin-bottom:0.75rem;"></i>
                    <p>No tienes solicitudes ni tickets registrados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = ecomState.tickets.map(t => {
            const estadoClase = t.estado === 'En proceso' ? 'en-proceso' : (t.estado === 'Respondido' ? 'respondido' : 'cerrado');
            const fechaFmt = new Date(t.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return `
                <div class="ticket-item-card" data-ticket-id="${t.id}">
                    <div class="ticket-item-top">
                        <span class="ticket-folio">${escapeHtml(t.folio)}</span>
                        <span class="ticket-badge ${estadoClase}">${escapeHtml(t.estado)}</span>
                    </div>
                    <div class="ticket-asunto">${escapeHtml(t.asunto)}</div>
                    <div class="ticket-meta">
                        <span><i class="far fa-calendar-alt"></i> ${fechaFmt}</span>
                    </div>
                    <p style="font-size:0.9rem; color:#475569; margin-top:0.4rem;">${escapeHtml(t.mensaje)}</p>
                    ${t.respuesta ? `
                        <div class="ticket-response-box">
                            <strong style="display:block; margin-bottom:0.25rem;"><i class="fas fa-reply"></i> Respuesta del soporte:</strong>
                            ${escapeHtml(t.respuesta)}
                            ${t.fecha_respuesta ? `<div style="font-size:0.75rem; opacity:0.8; margin-top:0.25rem;">Fecha: ${new Date(t.fecha_respuesta).toLocaleDateString('es-MX')}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    async function enviarTicket(asunto, mensaje) {
        const user = getStoredUser();
        const clienteId = user?.id;
        if (!clienteId) {
            notify('Inicia sesión para contactar a soporte.', 'warning');
            return false;
        }

        if (!asunto || !mensaje.trim()) {
            notify('Por favor completa el asunto y el mensaje del ticket', 'error');
            return false;
        }

        try {
            const res = await fetch(`${API_ROOT}/api/atencion/ticket`, {
                method: 'POST',
                headers: apiHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    cliente_id: clienteId,
                    asunto: asunto.trim(),
                    mensaje: mensaje.trim()
                })
            });

            const data = await res.json();
            if (res.ok) {
                notify(`¡Ticket ${data.folio} enviado con éxito! Recibirás atención de nuestro equipo.`, 'success');
                await loadTicketsCliente(clienteId);
                return true;
            } else {
                notify(data.error || 'No se pudo enviar el ticket', 'error');
                return false;
            }
        } catch (err) {
            notify('Error al comunicarse con el servidor', 'error');
            return false;
        }
    }

    // ─── 4. CHECKOUT INTEGRAL Y PAGO CON MONEDERO ────────────────
    function updateCheckoutWalletDisplay() {
        const walletBalanceLabel = document.getElementById('checkout-wallet-saldo');
        if (walletBalanceLabel) {
            walletBalanceLabel.textContent = `$${ecomState.monederoSaldo.toFixed(2)}`;
        }

        const totalPagarEl = document.getElementById('checkout-wallet-total-pagar');
        const saldoDespuesEl = document.getElementById('checkout-wallet-saldo-despues');
        const alertaEl = document.getElementById('checkout-wallet-alerta');
        const confirmBtn = document.getElementById('confirmar-compra-btn');

        if (totalPagarEl && window.checkoutData) {
            const total = Number(window.checkoutData.total || 0);
            totalPagarEl.textContent = `$${total.toFixed(2)}`;
            const saldoRestante = ecomState.monederoSaldo - total;
            
            if (saldoDespuesEl) {
                saldoDespuesEl.textContent = `$${Math.max(0, saldoRestante).toFixed(2)}`;
            }

            if (alertaEl) {
                if (saldoRestante < 0) {
                    alertaEl.style.display = 'flex';
                    if (confirmBtn && window.checkoutData.metodoPago === 'monedero') {
                        confirmBtn.disabled = true;
                    }
                } else {
                    alertaEl.style.display = 'none';
                    if (confirmBtn) confirmBtn.disabled = false;
                }
            }
        }
    }

    async function procesarCompraCompleta(orderPayload) {
        try {
            const res = await fetch(`${API_ROOT}/api/pagos/procesar`, {
                method: 'POST',
                headers: apiHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(orderPayload)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // Actualizar saldo de monedero si se utilizó
                if (data.saldo_actual !== null && data.saldo_actual !== undefined) {
                    ecomState.monederoSaldo = Number(data.saldo_actual);
                }
                renderMonederoUI();
                return { success: true, data };
            } else {
                return { success: false, error: data.error || 'Error al procesar el pago' };
            }
        } catch (err) {
            return { success: false, error: 'Error de red al procesar el pago' };
        }
    }

    // ─── 5. ADMINISTRACIÓN (SECCIÓN C DEL DIAGRAMA) ──────────────
    async function loadAdminMonedero() {
        try {
            const res = await fetch(`${API_ROOT}/api/monedero/reportes`, {
                headers: apiHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                renderAdminMonederoUI(data);
            }
        } catch (_) {
            notify('No se pudo cargar el reporte del monedero.', 'error');
        }
    }

    function renderAdminMonederoUI(data) {
        const circEl = document.getElementById('admin-monedero-circulacion');
        const clientesEl = document.getElementById('admin-monedero-clientes-count');
        const recargasEl = document.getElementById('admin-monedero-total-recargado');
        const consumosEl = document.getElementById('admin-monedero-total-gastado');

        if (circEl) circEl.textContent = `$${Number(data.saldoTotalEnCirculacion || 0).toFixed(2)}`;
        if (clientesEl) clientesEl.textContent = data.clientesConMonedero || 0;
        if (recargasEl) recargasEl.textContent = `$${Number(data.totalRecargado || 0).toFixed(2)}`;
        if (consumosEl) consumosEl.textContent = `$${Number(data.totalGastado || 0).toFixed(2)}`;

        const clientesTbody = document.getElementById('admin-monedero-clientes-tbody');
        if (clientesTbody && data.saldosClientes) {
            clientesTbody.innerHTML = data.saldosClientes.map(c => `
                <tr>
                    <td><strong>${escapeHtml(c.name)}</strong><br><span style="font-size:0.8rem; color:#64748b;">${escapeHtml(c.email)}</span></td>
                    <td>${escapeHtml(c.phone || 'Sin teléfono')}</td>
                    <td><span style="font-weight:700; color:#10b981;">$${Number(c.monedero_saldo || 0).toFixed(2)}</span></td>
                    <td>${c.orders || 0}</td>
                    <td>$${Number(c.spent || 0).toFixed(2)}</td>
                    <td>
                        <button class="btn-primary btn-sm admin-ajuste-btn" data-client-id="${c.id}" data-client-name="${escapeHtml(c.name)}" data-saldo="${c.monedero_saldo || 0}">
                            <i class="fas fa-edit"></i> Ajuste
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        const movsTbody = document.getElementById('admin-monedero-movimientos-tbody');
        if (movsTbody && data.ultimosMovimientos) {
            movsTbody.innerHTML = data.ultimosMovimientos.map(m => {
                const esCargo = m.tipo === 'cargo' || m.monto < 0;
                const color = esCargo ? '#ef4444' : '#10b981';
                const signo = esCargo ? '-' : '+';
                return `
                    <tr>
                        <td>${new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>${escapeHtml(m.folio || '-')}</td>
                        <td>${escapeHtml(m.cliente_nombre || 'Cliente')}<br><span style="font-size:0.8rem; color:#64748b;">${escapeHtml(m.cliente_email || '')}</span></td>
                        <td>${escapeHtml(m.concepto)}</td>
                        <td style="color:${color}; font-weight:700;">${signo}$${Math.abs(Number(m.monto)).toFixed(2)}</td>
                        <td style="font-weight:700;">$${Number(m.saldo).toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    async function loadAdminImpuestos() {
        try {
            const res = await fetch(`${API_ROOT}/api/impuestos`, {
                headers: apiHeaders()
            });
            if (res.ok) {
                const list = await res.json();
                ecomState.impuestos = list;
                const tbody = document.getElementById('admin-impuestos-tbody');
                if (tbody) {
                    tbody.innerHTML = list.map(imp => `
                        <tr>
                            <td><strong>${escapeHtml(imp.nombre)}</strong></td>
                            <td style="font-weight:700;">${Number(imp.porcentaje).toFixed(2)}%</td>
                            <td>
                                <span class="ticket-badge ${imp.estado === 'Activo' ? 'respondido' : 'cerrado'}">
                                    ${escapeHtml(imp.estado)}
                                </span>
                            </td>
                            <td>
                                <button class="btn-secondary btn-sm admin-edit-tax-btn" data-id="${imp.id}" data-nombre="${escapeHtml(imp.nombre)}" data-pct="${imp.porcentaje}" data-estado="${escapeHtml(imp.estado)}">
                                    <i class="fas fa-edit"></i> Modificar
                                </button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        } catch (_) {
            notify('No se pudieron cargar los impuestos.', 'error');
        }
    }

    async function loadAdminTickets() {
        try {
            const res = await fetch(`${API_ROOT}/api/atencion/tickets`, {
                headers: apiHeaders()
            });
            if (res.ok) {
                const list = await res.json();
                ecomState.ticketsAdmin = list;
                const tbody = document.getElementById('admin-tickets-tbody');
                if (tbody) {
                    if (list.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:#64748b;">No hay tickets de clientes</td></tr>';
                    } else {
                        tbody.innerHTML = list.map(t => {
                            const badgeClass = t.estado === 'En proceso' ? 'en-proceso' : (t.estado === 'Respondido' ? 'respondido' : 'cerrado');
                            const fechaFmt = new Date(t.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            return `
                                <tr>
                                    <td><strong style="color:var(--primary);">${escapeHtml(t.folio)}</strong></td>
                                    <td>${fechaFmt}</td>
                                    <td>${escapeHtml(t.cliente_nombre)}<br><span style="font-size:0.8rem; color:#64748b;">${escapeHtml(t.cliente_email)}</span></td>
                                    <td><strong>${escapeHtml(t.asunto)}</strong><br><span style="font-size:0.85rem; color:#475569;">${escapeHtml(t.mensaje.substring(0, 50))}...</span></td>
                                    <td><span class="ticket-badge ${badgeClass}">${escapeHtml(t.estado)}</span></td>
                                    <td>${t.respuesta ? `<span style="color:#10b981; font-size:0.85rem;"><i class="fas fa-check"></i> ${escapeHtml(t.respuesta.substring(0, 40))}...</span>` : '<span style="color:#94a3b8; font-size:0.85rem;">Pendiente</span>'}</td>
                                    <td>
                                        <button class="btn-primary btn-sm admin-responder-ticket-btn" data-id="${t.id}" data-folio="${escapeHtml(t.folio)}" data-cliente="${escapeHtml(t.cliente_nombre)}" data-asunto="${escapeHtml(t.asunto)}" data-mensaje="${escapeHtml(t.mensaje)}" data-respuesta="${escapeHtml(t.respuesta || '')}" data-estado="${escapeHtml(t.estado)}">
                                            <i class="fas fa-reply"></i> Responder
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }
                }
            }
        } catch (_) {
            notify('No se pudieron cargar los tickets de atención.', 'error');
        }
    }

    async function loadAdminPagos() {
        try {
            const res = await fetch(`${API_ROOT}/api/pagos`, {
                headers: apiHeaders()
            });
            if (res.ok) {
                const list = await res.json();
                ecomState.pagosAdmin = list;
                const tbody = document.getElementById('admin-pagos-tbody');
                if (tbody) {
                    if (list.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#64748b;">No hay pagos registrados</td></tr>';
                    } else {
                        tbody.innerHTML = list.map(p => `
                            <tr>
                                <td>${new Date(p.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td><strong>${p.pedido_id}</strong></td>
                                <td>${escapeHtml(p.cliente_nombre || 'Cliente')}<br><span style="font-size:0.8rem; color:#64748b;">${escapeHtml(p.cliente_email || '')}</span></td>
                                <td><span class="badge" style="background:#ede9fe; color:#6d28d9; padding:0.25rem 0.6rem; border-radius:10px;">${escapeHtml(p.metodo_pago)}</span></td>
                                <td style="font-weight:800; color:var(--primary);">$${Number(p.monto).toFixed(2)}</td>
                                <td><span class="ticket-badge respondido">${p.estado}</span></td>
                            </tr>
                        `).join('');
                    }
                }
            }
        } catch (_) {
            notify('No se pudo cargar el registro de pagos.', 'error');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    // ─── EVENTOS Y BINDINGS ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function() {
        loadImpuestos();
        const user = getStoredUser();
        if (user && user.id) {
            loadMonedero(user.id);
            loadTicketsCliente(user.id);
        }
        const refreshTicketsBtn = document.getElementById('admin-refresh-tickets');
        if (refreshTicketsBtn) {
            refreshTicketsBtn.addEventListener('click', loadAdminTickets);
        }

        // 1. Selector rápido de montos de recarga
        document.querySelectorAll('.btn-quick-amount').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.btn-quick-amount').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const customInput = document.getElementById('monedero-custom-amount');
                if (customInput) customInput.value = this.dataset.amount;
            });
        });

        // 2. Botón Recargar Monedero
        const recargarBtn = document.getElementById('monedero-recargar-btn');
        if (recargarBtn) {
            recargarBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const activeQuick = document.querySelector('.btn-quick-amount.active');
                const customInput = document.getElementById('monedero-custom-amount');
                const monto = customInput && customInput.value ? Number(customInput.value) : (activeQuick ? Number(activeQuick.dataset.amount) : 100);
                
                const metodoRadio = document.querySelector('input[name="recarga-metodo"]:checked');
                const metodo = metodoRadio ? metodoRadio.value : 'Tarjeta de crédito / débito';

                if (!monto || monto <= 0) {
                    notify('Ingresa un monto válido para recargar', 'error');
                    return;
                }

                recargarBtn.disabled = true;
                recargarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando recarga...';
                
                await recargarMonedero(monto, metodo);
                
                recargarBtn.disabled = false;
                recargarBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Recargar saldo';
            });
        }

        // 3. Botón Enviar Ticket
        const enviarTicketBtn = document.getElementById('enviar-ticket-btn');
        if (enviarTicketBtn) {
            enviarTicketBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const asuntoEl = document.getElementById('ticket-form-asunto');
                const mensajeEl = document.getElementById('ticket-form-mensaje');
                const asunto = asuntoEl ? asuntoEl.value : '';
                const mensaje = mensajeEl ? mensajeEl.value : '';

                if (!asunto || !mensaje.trim()) {
                    notify('Completa el asunto y tu mensaje', 'error');
                    return;
                }

                enviarTicketBtn.disabled = true;
                enviarTicketBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

                const ok = await enviarTicket(asunto, mensaje);
                if (ok && mensajeEl) {
                    mensajeEl.value = '';
                }

                enviarTicketBtn.disabled = false;
                enviarTicketBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar ticket';
            });
        }

        // 4. Atajos desde perfil
        const goMonederoBtn = document.getElementById('profile-go-monedero-btn');
        if (goMonederoBtn) {
            goMonederoBtn.addEventListener('click', () => {
                if (typeof window.showPage === 'function') window.showPage('monedero');
            });
        }

        const goTicketsBtn = document.getElementById('profile-go-tickets-btn');
        if (goTicketsBtn) {
            goTicketsBtn.addEventListener('click', () => {
                if (typeof window.showPage === 'function') window.showPage('tickets');
            });
        }

        const goOrdersBtn = document.getElementById('profile-go-orders-btn');
        if (goOrdersBtn) {
            goOrdersBtn.addEventListener('click', () => {
                if (typeof window.showPage === 'function') window.showPage('mis-compras');
            });
        }

        // 5. Ajuste manual de Monedero en Admin (delegación)
        document.addEventListener('click', async function(e) {
            // Modal de ajuste monedero
            const ajBtn = e.target.closest('.admin-ajuste-btn');
            if (ajBtn) {
                const cId = ajBtn.dataset.clientId;
                const cName = ajBtn.dataset.clientName;
                const modal = document.getElementById('admin-monedero-ajuste-modal');
                if (modal) {
                    document.getElementById('ajuste-client-id').value = cId;
                    document.getElementById('ajuste-client-name').textContent = cName;
                    modal.style.display = 'flex';
                }
            }

            // Modal de responder ticket
            const respBtn = e.target.closest('.admin-responder-ticket-btn');
            if (respBtn) {
                const modal = document.getElementById('admin-ticket-responder-modal');
                if (modal) {
                    document.getElementById('resp-ticket-id').value = respBtn.dataset.id;
                    document.getElementById('resp-ticket-folio').textContent = respBtn.dataset.folio;
                    document.getElementById('resp-ticket-cliente').textContent = respBtn.dataset.cliente;
                    document.getElementById('resp-ticket-asunto').textContent = respBtn.dataset.asunto;
                    document.getElementById('resp-ticket-mensaje').textContent = respBtn.dataset.mensaje;
                    document.getElementById('resp-ticket-texto').value = respBtn.dataset.respuesta || '';
                    document.getElementById('resp-ticket-estado').value = respBtn.dataset.estado || 'Respondido';
                    modal.style.display = 'flex';
                }
            }

            // Modal de impuesto
            const taxBtn = e.target.closest('.admin-edit-tax-btn');
            if (taxBtn) {
                const modal = document.getElementById('admin-impuesto-modal');
                if (modal) {
                    document.getElementById('impuesto-edit-id').value = taxBtn.dataset.id;
                    document.getElementById('impuesto-edit-nombre').value = taxBtn.dataset.nombre;
                    document.getElementById('impuesto-edit-pct').value = taxBtn.dataset.pct;
                    document.getElementById('impuesto-edit-estado').value = taxBtn.dataset.estado;
                    modal.style.display = 'flex';
                }
            }
        });

        // Guardar respuesta de ticket en Admin
        const saveRespBtn = document.getElementById('btn-guardar-respuesta-ticket');
        if (saveRespBtn) {
            saveRespBtn.addEventListener('click', async function() {
                const tId = document.getElementById('resp-ticket-id').value;
                const respuesta = document.getElementById('resp-ticket-texto').value;
                const estado = document.getElementById('resp-ticket-estado').value;

                try {
                    const res = await fetch(`${API_ROOT}/api/atencion/ticket/${tId}/respuesta`, {
                        method: 'PUT',
                        headers: apiHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ respuesta, estado })
                    });
                    if (res.ok) {
                        notify('Respuesta enviada y ticket actualizado', 'success');
                        document.getElementById('admin-ticket-responder-modal').style.display = 'none';
                        await loadAdminTickets();
                    } else {
                        notify('No se pudo guardar la respuesta', 'error');
                    }
                } catch (_) {
                    notify('Error de red al actualizar ticket', 'error');
                }
            });
        }

        // Guardar ajuste de monedero en Admin
        const saveAjusteBtn = document.getElementById('btn-guardar-ajuste-monedero');
        if (saveAjusteBtn) {
            saveAjusteBtn.addEventListener('click', async function() {
                const cId = document.getElementById('ajuste-client-id').value;
                const monto = document.getElementById('ajuste-monto').value;
                const tipo = document.getElementById('ajuste-tipo').value;
                const concepto = document.getElementById('ajuste-concepto').value;

                if (!monto || Number(monto) <= 0) {
                    notify('Ingresa un monto válido', 'error');
                    return;
                }

                try {
                    const res = await fetch(`${API_ROOT}/api/monedero/ajuste`, {
                        method: 'POST',
                        headers: apiHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({
                            cliente_id: Number(cId),
                            monto: Number(monto),
                            tipo,
                            concepto: concepto || 'Ajuste manual administrativo'
                        })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        notify('Ajuste de saldo realizado con éxito', 'success');
                        document.getElementById('admin-monedero-ajuste-modal').style.display = 'none';
                        await loadAdminMonedero();
                    } else {
                        notify(data.error || 'Error al realizar ajuste', 'error');
                    }
                } catch (_) {
                    notify('Error de red', 'error');
                }
            });
        }

        // Guardar impuesto en Admin
        const saveTaxBtn = document.getElementById('btn-guardar-impuesto');
        if (saveTaxBtn) {
            saveTaxBtn.addEventListener('click', async function() {
                const id = document.getElementById('impuesto-edit-id').value;
                const nombre = document.getElementById('impuesto-edit-nombre').value;
                const porcentaje = document.getElementById('impuesto-edit-pct').value;
                const estado = document.getElementById('impuesto-edit-estado').value;

                try {
                    const res = await fetch(`${API_ROOT}/api/impuestos/${id}`, {
                        method: 'PUT',
                        headers: apiHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ nombre, porcentaje, estado })
                    });
                    if (res.ok) {
                        notify('Impuesto actualizado con éxito', 'success');
                        document.getElementById('admin-impuesto-modal').style.display = 'none';
                        await loadAdminImpuestos();
                    }
                } catch (_) {
                    notify('Error al guardar impuesto', 'error');
                }
            });
        }
    });

    // Exponer API en ventana global
    window.ecom = {
        state: ecomState,
        loadMonedero,
        recargarMonedero,
        loadTicketsCliente,
        enviarTicket,
        procesarCompraCompleta,
        loadAdminMonedero,
        loadAdminImpuestos,
        loadAdminTickets,
        loadAdminPagos,
        updateCheckoutWalletDisplay
    };

})();
