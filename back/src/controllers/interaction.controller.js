const pool = require('../config/db');

// Registrar interacción
const createInteraction = async (req, res) => {
    try {
        const { clienteId, type, date, note } = req.body;
        const user = req.user.email || 'Administrador';

        if (!clienteId || !type || !date || !note) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const [client] = await pool.query('SELECT id FROM clientes WHERE id = ?', [clienteId]);
        if (client.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const [result] = await pool.query(
            `INSERT INTO interacciones (cliente_id, type, date, note, user) VALUES (?, ?, ?, ?, ?)`,
            [clienteId, type, date, note, user]
        );

        await pool.query('UPDATE clientes SET last_interaction_date = ? WHERE id = ?', [date, clienteId]);

        const newInteraction = { id: result.insertId, clienteId, type, date, note, user };
        res.status(201).json(newInteraction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar interacción' });
    }
};

// Obtener interacciones de un cliente
const getInteractionsByClient = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const [rows] = await pool.query('SELECT * FROM interacciones WHERE cliente_id = ? ORDER BY date DESC', [clienteId]);
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