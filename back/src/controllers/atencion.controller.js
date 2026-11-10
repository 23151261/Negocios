const pool = require('../config/db');

async function createTicket(req, res) {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        const { asunto, mensaje } = req.body;
        const cId = Number(req.user?.id);

        if (req.user?.role !== 'usuario' || !Number.isSafeInteger(cId) || cId <= 0) {
            return res.status(400).json({ error: 'Cliente inválido' });
        }
        if (!asunto || typeof asunto !== 'string' || asunto.trim() === '') {
            return res.status(400).json({ error: 'El asunto es obligatorio' });
        }
        if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
            return res.status(400).json({ error: 'El mensaje es obligatorio' });
        }

        const [clients] = await connection.query('SELECT name, email FROM clientes WHERE id = ?', [cId]);
        if (clients.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        const clientName = clients[0].name;
        const clientEmail = clients[0].email;

        await connection.beginTransaction();
        transactionStarted = true;
        const [result] = await connection.query(`
            INSERT INTO tickets_atencion (folio, cliente_id, cliente_nombre, cliente_email, asunto, mensaje, estado, fecha)
            VALUES ('', ?, ?, ?, ?, ?, 'En proceso', NOW())
        `, [cId, clientName, clientEmail, asunto.trim(), mensaje.trim()]);
        const folio = `T-${result.insertId}`;
        await connection.query('UPDATE tickets_atencion SET folio = ? WHERE id = ?', [folio, result.insertId]);

        // Registrar interacción CRM
        await connection.query(`
            INSERT INTO interacciones (cliente_id, type, date, note, user)
            VALUES (?, 'nota', CURDATE(), ?, ?)
        `, [cId, `Ticket abierto (${folio}): ${asunto.trim()}`, clientEmail || 'Cliente']);

        await connection.commit();
        transactionStarted = false;
        res.status(201).json({
            id: result.insertId,
            folio,
            cliente_id: cId,
            cliente_nombre: clientName,
            asunto: asunto.trim(),
            mensaje: mensaje.trim(),
            estado: 'En proceso',
            fecha: new Date()
        });
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        console.error('Error al crear ticket:', error);
        res.status(500).json({ error: 'No se pudo crear el ticket de atención' });
    } finally {
        connection.release();
    }
}

async function getTickets(req, res) {
    try {
        const { estado, buscar } = req.query;
        let query = 'SELECT * FROM tickets_atencion WHERE 1=1';
        const params = [];

        if (estado && estado !== 'Todos') {
            query += ' AND estado = ?';
            params.push(estado);
        }
        if (buscar && buscar.trim()) {
            query += ' AND (folio LIKE ? OR asunto LIKE ? OR cliente_nombre LIKE ? OR cliente_email LIKE ?)';
            const term = `%${buscar.trim()}%`;
            params.push(term, term, term, term);
        }
        query += ' ORDER BY id DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar tickets:', error);
        res.status(500).json({ error: 'Error al consultar tickets de atención' });
    }
}

async function getTicketsByCliente(req, res) {
    try {
        const clienteId = Number(req.params.cliente_id);
        if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
            return res.status(400).json({ error: 'Cliente inválido' });
        }
        if (Number(req.user?.id) !== clienteId) {
            return res.status(403).json({ error: 'Solo puedes consultar tus propios tickets' });
        }

        const [rows] = await pool.query(
            'SELECT * FROM tickets_atencion WHERE cliente_id = ? ORDER BY id DESC',
            [clienteId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al consultar tickets del cliente:', error);
        res.status(500).json({ error: 'Error al consultar tickets' });
    }
}

async function getTicketById(req, res) {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query('SELECT * FROM tickets_atencion WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        if (req.user?.role === 'usuario' && Number(req.user.id) !== Number(rows[0].cliente_id)) {
            return res.status(403).json({ error: 'Solo puedes consultar tus propios tickets' });
        }
        if (!['usuario', 'admin', 'super_administrador', 'ventas', 'soporte'].includes(req.user?.role)) {
            return res.status(403).json({ error: 'No tienes permisos para consultar este ticket' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener ticket:', error);
        res.status(500).json({ error: 'Error al consultar ticket' });
    }
}

async function responderTicket(req, res) {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        const id = Number(req.params.id);
        const { respuesta, estado } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Ticket inválido' });
        }
        await connection.beginTransaction();
        transactionStarted = true;
        const [existing] = await connection.query('SELECT * FROM tickets_atencion WHERE id = ? FOR UPDATE', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const ticket = existing[0];
        const newEstado = estado || 'Respondido';
        const newRespuesta = respuesta !== undefined ? String(respuesta).trim() : ticket.respuesta;
        if (!['En proceso', 'Respondido', 'Cerrado'].includes(newEstado)) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(400).json({ error: 'Estado de ticket no válido' });
        }
        if (typeof respuesta !== 'string' || newRespuesta.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(400).json({ error: 'La respuesta es obligatoria' });
        }

        await connection.query(`
            UPDATE tickets_atencion 
            SET respuesta = ?, estado = ?, fecha_respuesta = NOW()
            WHERE id = ?
        `, [newRespuesta, newEstado, id]);

        // Registrar seguimiento en interacciones CRM
        if (ticket.cliente_id) {
            await connection.query(`
                INSERT INTO interacciones (cliente_id, type, date, note, user)
                VALUES (?, 'nota', CURDATE(), ?, ?)
            `, [ticket.cliente_id, `Ticket ${ticket.folio} ${newEstado}: ${newRespuesta ? newRespuesta.substring(0, 100) : ''}`, 'Soporte']);
        }

        await connection.commit();
        transactionStarted = false;
        res.json({
            id,
            folio: ticket.folio,
            estado: newEstado,
            respuesta: newRespuesta,
            fecha_respuesta: new Date()
        });
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        console.error('Error al responder ticket:', error);
        res.status(500).json({ error: 'Error al actualizar ticket' });
    } finally {
        connection.release();
    }
}

module.exports = {
    createTicket,
    getTickets,
    getTicketsByCliente,
    getTicketById,
    responderTicket
};
