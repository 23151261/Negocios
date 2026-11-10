const http = require('http');

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch (_) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- INICIANDO PRUEBAS DE INTEGRACIÓN ETAPA 4 ---');

    // 1. Catálogo
    const cat = await request({ hostname: 'localhost', port: 5000, path: '/api/catalogo', method: 'GET' });
    console.log('[1] Catálogo status:', cat.status, 'Total productos:', cat.body.length);
    if (!Array.isArray(cat.body) || cat.body.length === 0) throw new Error('Fallo en catálogo');

    // 2. Impuestos
    const imp = await request({ hostname: 'localhost', port: 5000, path: '/api/impuestos', method: 'GET' });
    console.log('[2] Impuestos status:', imp.status, 'Impuestos:', imp.body.map(i => `${i.nombre} (${i.porcentaje}%) - ${i.estado}`).join(', '));

    // 3. Registro de cliente de prueba con bono de $1,200.00
    const testEmail = `test_etapa4_${Date.now()}@deliciasresto.com`;
    const reg = await request({
        hostname: 'localhost', port: 5000, path: '/api/auth/registro', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'Cliente Etapa Cuatro',
        email: testEmail,
        password: 'Password123',
        phone: '55 9876 5432',
        address: 'Av. Tecnológico #123, Querétaro'
    });
    console.log('[3] Registro cliente status:', reg.status, 'Monedero inicial:', reg.body.user?.monedero_saldo);
    const clienteId = reg.body.user.id;
    const clienteToken = reg.body.token;

    // 4. Consultar Monedero del cliente
    const mon = await request({
        hostname: 'localhost', port: 5000, path: `/api/monedero/${clienteId}`, method: 'GET',
        headers: { Authorization: `Bearer ${clienteToken}` }
    });
    console.log('[4] Monedero consultado:', mon.body.saldo, 'Movimientos:', mon.body.movimientos.length);

    // 5. Recarga de Monedero ($200.00)
    const rec = await request({
        hostname: 'localhost', port: 5000, path: '/api/monedero/recargar', method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clienteToken}` }
    }, {
        cliente_id: clienteId,
        monto: 200.00,
        metodo_pago: 'Tarjeta de crédito / débito'
    });
    console.log('[5] Recarga realizada:', rec.body.message, 'Nuevo saldo:', rec.body.nuevoSaldo);

    // 6. Procesar Compra Completa con Monedero (Flujo completo CRM + SCM + ERP + Pagos + Monedero)
    const primerProd = cat.body.find(p => p.stock_actual >= 2);
    const cart = await request({
        hostname: 'localhost', port: 5000, path: '/api/carrito', method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clienteToken}` }
    }, [{
        productId: primerProd.id,
        quantity: 2
    }]);
    if (cart.status !== 200) throw new Error('No se pudo persistir el carrito de prueba');

    const purchase = await request({
        hostname: 'localhost', port: 5000, path: '/api/pagos/procesar', method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clienteToken}` }
    }, {
        cliente_id: clienteId,
        cliente: { id: clienteId, name: 'Cliente Etapa Cuatro', email: testEmail },
        metodo_pago: 'Monedero',
        direccion: {
            nombre: 'Cliente Etapa Cuatro',
            email: testEmail,
            telefono: '55 9876 5432',
            direccion: 'Av. Tecnológico #123, Querétaro'
        },
        cart_session_key: `test-${Date.now()}`
    });
    console.log('[6] Pago procesado:', purchase.body.success, 'Orden:', purchase.body.orden, 'Saldo restante:', purchase.body.saldo_actual);

    // 7. Atención a clientes (Crear Ticket)
    const ticket = await request({
        hostname: 'localhost', port: 5000, path: '/api/atencion/ticket', method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clienteToken}` }
    }, {
        cliente_id: clienteId,
        asunto: 'Duda sobre mi pedido',
        mensaje: '¿Mi orden OR se encuentra en preparación para entrega hoy?'
    });
    console.log('[7] Ticket creado:', ticket.body.folio, 'Estado:', ticket.body.estado);

    // 8. Responder ticket desde Administración
    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@gmail.com';
    if (!process.env.SUPPORT_PASSWORD) {
        throw new Error('Define SUPPORT_PASSWORD para probar el acceso del equipo de soporte');
    }
    const supportLogin = await request({
        hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: supportEmail, password: process.env.SUPPORT_PASSWORD });
    if (supportLogin.status !== 200) throw new Error('No se pudo iniciar sesión como soporte');
    const supportToken = supportLogin.body.token;

    const resp = await request({
        hostname: 'localhost', port: 5000, path: `/api/atencion/ticket/${ticket.body.id}/respuesta`, method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supportToken}` }
    }, {
        respuesta: 'Estimado cliente, su pedido ya fue recibido en cocina y saldrá en breve con el repartidor.',
        estado: 'Respondido'
    });
    console.log('[8] Ticket respondido:', resp.body.folio, 'Nuevo estado:', resp.body.estado);

    console.log('--- ¡TODAS LAS PRUEBAS DE ETAPA 4 PASARON EXITOSAMENTE! ---');
}

runTests().catch(err => {
    console.error('Error en pruebas:', err);
    process.exit(1);
});
