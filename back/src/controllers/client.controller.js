const pool = require('../config/db');

// Obtener todos los clientes
const getClients = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

// Obtener cliente por ID (incluye sus interacciones)
const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const [clients] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        if (clients.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const [interactions] = await pool.query('SELECT * FROM interacciones WHERE cliente_id = ? ORDER BY date DESC', [id]);
        const client = clients[0];
        client.interactions = interactions;

        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
};

// Crear cliente
const createClient = async (req, res) => {
    try {
        const { name, email, phone, address, stage, status } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, teléfono)' });
        }

        const registeredDate = new Date().toISOString().slice(0, 10);
        const lastInteractionDate = registeredDate;

        const [result] = await pool.query(
            `INSERT INTO clientes (name, email, phone, address, stage, status, registered_date, last_interaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, address || '', stage || 'prospecto', status || 'activo', registeredDate, lastInteractionDate]
        );

        const newClient = { 
            id: result.insertId, 
            name, 
            email, 
            phone, 
            address: address || '', 
            stage: stage || 'prospecto', 
            status: status || 'activo', 
            orders: 0, 
            spent: 0, 
            registeredDate, 
            lastInteractionDate,
            interactions: []
        };
        res.status(201).json(newClient);
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El email ya está registrado para otro cliente' });
        }
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

// Actualizar cliente
const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, stage, status } = req.body;

        const [existing] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const current = existing[0];
        const updates = {
            name: name || current.name,
            email: email || current.email,
            phone: phone || current.phone,
            address: address || current.address,
            stage: stage || current.stage,
            status: status || current.status
        };

        await pool.query(
            `UPDATE clientes SET name = ?, email = ?, phone = ?, address = ?, stage = ?, status = ? WHERE id = ?`,
            [updates.name, updates.email, updates.phone, updates.address, updates.stage, updates.status, id]
        );

        const [updated] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

// Eliminar cliente
const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };