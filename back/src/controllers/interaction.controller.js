const pool = require('../config/db');

function toInteractionType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return {
        llamada: 'llamada',
        correo: 'correo',
        reunion: 'reunion',
        'reunión': 'reunion',
        compra: 'compra',
        pedido: 'compra',
        nota: 'nota',
        registro: 'nota',
        seguimiento: 'nota'
    }[normalized] || null;
}

function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// Registrar interacción
const createInteraction = async (req, res) => {
    let connection;
    try {
        const { clienteId, type, date, note } = req.body || {};
        const user = req.user.email || 'Usuario';
        const staffUserId = ['admin', 'super_administrador'].includes(req.user.role)
            ? Number(req.user.id)
            : null;

        const interactionType = toInteractionType(type);
        if (!Number.isSafeInteger(Number(clienteId)) || Number(clienteId) <= 0
            || !interactionType
            || !isValidDate(date)
            || typeof note !== 'string'
            || !note.trim()) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [client] = await connection.query('SELECT id FROM clientes WHERE id = ? FOR UPDATE', [Number(clienteId)]);
        if (client.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const [result] = await connection.query(
            `INSERT INTO interacciones (cliente_id, type, date, note, user, usuario_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [Number(clienteId), interactionType, date, note.trim(), user, staffUserId]
        );

        await connection.query(
            'UPDATE clientes SET last_interaction_date = IF(? <= CURDATE() AND (last_interaction_date IS NULL OR last_interaction_date < ?), ?, last_interaction_date) WHERE id = ?',
            [date, date, date, Number(clienteId)]
        );
        await connection.commit();

        const newInteraction = {
            id: result.insertId,
            clienteId: Number(clienteId),
            type: interactionType,
            date,
            note: note.trim(),
            user,
            usuario_id: staffUserId
        };
        res.status(201).json(newInteraction);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al registrar interacción' });
    } finally {
        if (connection) connection.release();
    }
};

// Obtener interacciones de un cliente
const getInteractionsByClient = async (req, res) => {
    try {
        const clienteId = Number(req.params.clienteId || req.params.id);
        if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
            return res.status(400).json({ error: 'ID de cliente inválido' });
        }
        const [rows] = await pool.query(
            'SELECT i.*, u.name AS usuario_nombre FROM interacciones i LEFT JOIN usuarios u ON u.id = i.usuario_id WHERE i.cliente_id = ? ORDER BY i.date DESC, i.id DESC',
            [clienteId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener interacciones' });
    }
};

// Obtener todas las interacciones (para "Mi actividad")
const getAllInteractions = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, c.name as cliente_nombre 
            FROM interacciones i 
            JOIN clientes c ON i.cliente_id = c.id 
            ORDER BY i.date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener interacciones' });
    }
};

module.exports = { createInteraction, getInteractionsByClient, getAllInteractions };
