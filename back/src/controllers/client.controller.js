const pool = require('../config/db');

const clientFields = 'id, name, email, company, phone, address, stage, status, orders, spent, registered_date, last_interaction_date, created_at';

function validStage(stage) {
    return ['prospecto', 'activo', 'frecuente', 'inactivo'].includes(stage);
}

// Obtener todos los clientes
const getClients = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${clientFields} FROM clientes ORDER BY id DESC`);
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
        const [clients] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [id]);
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
        const { name, email, company, phone, address, stage, status } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, teléfono)' });
        }

        const registeredDate = new Date().toISOString().slice(0, 10);
        const lastInteractionDate = registeredDate;

        const [result] = await pool.query(
            `INSERT INTO clientes (name, email, company, phone, address, stage, status, registered_date, last_interaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, company || '', phone, address || '', stage || 'prospecto', status || 'activo', registeredDate, lastInteractionDate]
        );

        const newClient = { 
            id: result.insertId, 
            name,
            email,
            company: company || '',
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
        const { name, email, company, phone, address, stage, status } = req.body;

        const [existing] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const current = existing[0];
        const updates = {
            name: name || current.name,
            email: email || current.email,
            company: company !== undefined ? company : current.company,
            phone: phone || current.phone,
            address: address || current.address,
            stage: stage || current.stage,
            status: status || current.status
        };

        await pool.query(
            `UPDATE clientes SET name = ?, email = ?, company = ?, phone = ?, address = ?, stage = ?, status = ? WHERE id = ?`,
            [updates.name, updates.email, updates.company, updates.phone, updates.address, updates.stage, updates.status, id]
        );

        const [updated] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

const updateClientStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        if (!validStage(stage)) {
            return res.status(400).json({ error: 'Etapa CRM no valida' });
        }
        const [result] = await pool.query('UPDATE clientes SET stage = ? WHERE id = ?', [stage, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        const [rows] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [id]);
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la etapa CRM' });
    }
};

const getClientMetrics = async (req, res) => {
    try {
        const [[summary]] = await pool.query(`
            SELECT
                COUNT(*) AS totalClients,
                COALESCE(SUM(status = 'activo'), 0) AS activeClients,
                COALESCE(SUM(status = 'inactivo'), 0) AS inactiveClients
            FROM clientes
        `);
        const [interactions] = await pool.query(`
            SELECT c.id AS clientId, c.name, COUNT(i.id) AS interactions
            FROM clientes c
            LEFT JOIN interacciones i ON i.cliente_id = c.id
            GROUP BY c.id, c.name
            ORDER BY interactions DESC, c.name
        `);
        const [atRisk] = await pool.query(`
            SELECT id, name, email, last_interaction_date
            FROM clientes
            WHERE last_interaction_date IS NULL
               OR last_interaction_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            ORDER BY last_interaction_date IS NULL DESC, last_interaction_date
        `);
        res.json({
            totalClients: Number(summary.totalClients),
            activeClients: Number(summary.activeClients),
            inactiveClients: Number(summary.inactiveClients),
            interactionsByClient: interactions.map(row => ({ ...row, interactions: Number(row.interactions) })),
            clientsAtRisk: atRisk
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener metricas CRM' });
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

module.exports = { getClients, getClientById, createClient, updateClient, updateClientStage, getClientMetrics, deleteClient };
