const pool = require('../config/db');

const nonStaffClientCondition = `NOT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE LOWER(u.email) = LOWER(c.email)
      AND u.role IN ('admin', 'super_administrador', 'ventas', 'logistica', 'soporte')
)`;

async function getMonederoCliente(req, res) {
    try {
        const clienteId = Number(req.params.cliente_id);
        if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
            return res.status(400).json({ error: 'ID de cliente inválido' });
        }
        const role = req.user?.role;
        if (role === 'usuario' && Number(req.user.id) !== clienteId) {
            return res.status(403).json({ error: 'Solo puedes consultar tu propio monedero' });
        }
        if (!['usuario', 'admin', 'super_administrador'].includes(role)) {
            return res.status(403).json({ error: 'No tienes permisos para consultar este monedero' });
        }

        const [clients] = await pool.query(
            'SELECT id, name, email, monedero_saldo FROM clientes WHERE id = ?',
            [clienteId]
        );

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const client = clients[0];
        const saldoActual = Number(client.monedero_saldo || 0);

        const [movimientos] = await pool.query(
            `SELECT id, folio, fecha, concepto, tipo, monto, saldo, metodo_pago
             FROM monedero_movimientos
             WHERE cliente_id = ?
             ORDER BY id DESC LIMIT 50`,
            [clienteId]
        );

        res.json({
            cliente_id: client.id,
            nombre: client.name,
            email: client.email,
            saldo: saldoActual,
            movimientos: movimientos.map(m => ({
                id: m.id,
                folio: m.folio || `M-${m.id}`,
                fecha: m.fecha,
                concepto: m.concepto,
                tipo: m.tipo,
                monto: Number(m.monto),
                saldo: Number(m.saldo),
                metodo_pago: m.metodo_pago
            }))
        });
    } catch (error) {
        console.error('Error al obtener monedero:', error);
        res.status(500).json({ error: 'Error al consultar monedero' });
    }
}

async function recargarMonedero(req, res) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { cliente_id, monto, metodo_pago } = req.body;
        const cId = Number(cliente_id);
        const amount = Number(monto);

        if (req.user?.role !== 'usuario' || Number(req.user.id) !== cId) {
            await connection.rollback();
            return res.status(403).json({ error: 'Solo puedes recargar tu propio monedero' });
        }
        if (!Number.isSafeInteger(cId) || cId <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cliente no válido' });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El monto de recarga debe ser mayor a 0' });
        }

        const paymentMethod = (metodo_pago || 'Tarjeta de crédito / débito').trim();

        const [clients] = await connection.query(
            'SELECT id, name, email, monedero_saldo FROM clientes WHERE id = ? FOR UPDATE',
            [cId]
        );

        if (clients.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const saldoAnterior = Number(clients[0].monedero_saldo || 0);
        const nuevoSaldo = Number((saldoAnterior + amount).toFixed(2));
        const folio = 'REC-' + String(Math.floor(10000 + Math.random() * 90000));

        await connection.query(
            'UPDATE clientes SET monedero_saldo = ? WHERE id = ?',
            [nuevoSaldo, cId]
        );

        const concepto = `Recarga con ${paymentMethod}`;
        await connection.query(
            `INSERT INTO monedero_movimientos (cliente_id, folio, fecha, concepto, tipo, monto, saldo, metodo_pago)
             VALUES (?, ?, NOW(), ?, 'abono', ?, ?, ?)`,
            [cId, folio, concepto, amount, nuevoSaldo, paymentMethod]
        );

        // Registrar en interacciones CRM
        await connection.query(
            `INSERT INTO interacciones (cliente_id, type, date, note, user)
             VALUES (?, 'nota', CURDATE(), ?, ?)`,
            [cId, `Recarga de monedero por $${amount.toFixed(2)} (${paymentMethod}). Folio: ${folio}`, 'Sistema']
        );

        await connection.commit();

        res.json({
            success: true,
            message: `Recarga exitosa por $${amount.toFixed(2)}`,
            folio,
            saldoAnterior,
            nuevoSaldo,
            concepto,
            metodo_pago: paymentMethod
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al recargar monedero:', error);
        res.status(500).json({ error: 'No se pudo procesar la recarga del monedero' });
    } finally {
        connection.release();
    }
}

async function ajusteMonedero(req, res) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { cliente_id, monto, tipo, concepto } = req.body;
        const cId = Number(cliente_id);
        const amount = Number(monto);
        const movementType = tipo === 'cargo' ? 'cargo' : 'abono';
        const reason = (concepto || 'Ajuste manual administrativo').trim();

        if (!Number.isSafeInteger(cId) || cId <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cliente no válido' });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
        }

        const [clients] = await connection.query(
            'SELECT id, name, email, monedero_saldo FROM clientes WHERE id = ? FOR UPDATE',
            [cId]
        );

        if (clients.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const saldoAnterior = Number(clients[0].monedero_saldo || 0);
        let nuevoSaldo;
        if (movementType === 'cargo') {
            if (saldoAnterior < amount) {
                await connection.rollback();
                return res.status(400).json({ error: 'El saldo actual es menor que el cargo solicitado' });
            }
            nuevoSaldo = Number((saldoAnterior - amount).toFixed(2));
        } else {
            nuevoSaldo = Number((saldoAnterior + amount).toFixed(2));
        }

        const folio = 'AJU-' + String(Math.floor(10000 + Math.random() * 90000));

        await connection.query(
            'UPDATE clientes SET monedero_saldo = ? WHERE id = ?',
            [nuevoSaldo, cId]
        );

        await connection.query(
            `INSERT INTO monedero_movimientos (cliente_id, folio, fecha, concepto, tipo, monto, saldo, metodo_pago)
             VALUES (?, ?, NOW(), ?, ?, ?, ?, 'Administración')`,
            [cId, folio, reason, movementType, movementType === 'cargo' ? -amount : amount, nuevoSaldo]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Ajuste de monedero realizado con éxito',
            nuevoSaldo,
            folio
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al realizar ajuste:', error);
        res.status(500).json({ error: 'Error al realizar ajuste de monedero' });
    } finally {
        connection.release();
    }
}

async function getReportesMonedero(req, res) {
    try {
        const [[stats]] = await pool.query(`
            SELECT
                COUNT(DISTINCT c.id) AS clientesConMonedero,
                COALESCE(SUM(c.monedero_saldo), 0) AS saldoTotalEnCirculacion
            FROM clientes c
            WHERE ${nonStaffClientCondition}
        `);

        const [[movStats]] = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN m.tipo='abono' THEN m.monto ELSE 0 END), 0) AS totalRecargado,
                COALESCE(SUM(CASE WHEN m.tipo='cargo' THEN ABS(m.monto) ELSE 0 END), 0) AS totalGastado,
                COUNT(*) AS totalOperaciones
            FROM monedero_movimientos m
            JOIN clientes c ON c.id = m.cliente_id
            WHERE ${nonStaffClientCondition}
        `);

        const [ultimosMovimientos] = await pool.query(`
            SELECT m.id, m.folio, m.fecha, m.concepto, m.tipo, m.monto, m.saldo, m.metodo_pago,
                   c.name AS cliente_nombre, c.email AS cliente_email
            FROM monedero_movimientos m
            JOIN clientes c ON c.id = m.cliente_id
            WHERE ${nonStaffClientCondition}
            ORDER BY m.id DESC LIMIT 30
        `);

        const [saldosClientes] = await pool.query(`
            SELECT c.id, c.name, c.email, c.phone, c.monedero_saldo, c.spent, c.orders
            FROM clientes c
            WHERE ${nonStaffClientCondition}
            ORDER BY c.monedero_saldo DESC
        `);

        res.json({
            clientesConMonedero: stats.clientesConMonedero,
            saldoTotalEnCirculacion: Number(stats.saldoTotalEnCirculacion),
            totalRecargado: Number(movStats.totalRecargado),
            totalGastado: Number(movStats.totalGastado),
            totalOperaciones: movStats.totalOperaciones,
            ultimosMovimientos,
            saldosClientes
        });
    } catch (error) {
        console.error('Error al obtener reportes de monedero:', error);
        res.status(500).json({ error: 'Error al obtener reportes de monedero' });
    }
}

module.exports = {
    getMonederoCliente,
    recargarMonedero,
    ajusteMonedero,
    getReportesMonedero
};
