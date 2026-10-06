const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const clientFields = 'id, name, email, company, phone, address, imagen_url AS imageUrl, stage, status, orders, spent, registered_date AS registeredDate, last_interaction_date AS lastInteractionDate, created_at AS createdAt';
const clientStages = new Set(['prospecto', 'activo', 'frecuente', 'inactivo']);
const clientStatuses = new Set(['activo', 'inactivo']);

function validStage(stage) {
    return typeof stage === 'string' && clientStages.has(stage);
}

function validEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validOptionalText(value, field, maxLength) {
    if (value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
        return `${field} no es válido`;
    }
    return null;
}

function validClientId(value) {
    return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function isAdmin(req, res) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return true;
    res.status(403).json({ error: 'Solo un administrador puede gestionar clientes' });
    return false;
}

// Obtener todos los clientes
const getClients = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${clientFields} FROM clientes ORDER BY id DESC`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

// Obtener cliente por ID (incluye sus interacciones)
const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!validClientId(id)) return res.status(400).json({ error: 'ID de cliente inválido' });
        const [clients] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [id]);
        if (clients.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const [interactions] = await pool.query(
            `SELECT i.id, i.cliente_id AS clienteId, i.type, i.date, i.note, i.user,
                    i.usuario_id AS usuarioId, u.name AS usuario_nombre
             FROM interacciones i
             LEFT JOIN usuarios u ON u.id = i.usuario_id
             WHERE i.cliente_id = ? ORDER BY i.date DESC, i.id DESC`,
            [id]
        );
        const client = clients[0];
        client.interactions = interactions;

        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
};

// Crear cliente
const createClient = async (req, res) => {
    try {
        if (!isAdmin(req, res)) return;
        const { name, email, company, phone, address, stage, status, password } = req.body || {};

        if (typeof name !== 'string' || !name.trim() || !validEmail(email) || typeof phone !== 'string' || !phone.trim()) {
            return res.status(400).json({ error: 'Nombre, correo válido y teléfono son obligatorios' });
        }
        if (stage !== undefined && !validStage(stage)) {
            return res.status(400).json({ error: 'Etapa CRM no válida' });
        }
        if (status !== undefined && !clientStatuses.has(status)) {
            return res.status(400).json({ error: 'Estado de cliente no válido' });
        }
        for (const [value, field, maxLength] of [
            [name, 'Nombre', 100],
            [email, 'Correo', 150],
            [company, 'Empresa', 150],
            [phone, 'Teléfono', 30],
            [address, 'Dirección', 255]
        ]) {
            const error = validOptionalText(value, field, maxLength);
            if (error) return res.status(400).json({ error });
        }
        if (password !== undefined && password !== null
            && (typeof password !== 'string' || password.length < 6 || password.length > 128)) {
            return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 128 caracteres' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const [existing] = await pool.query('SELECT id FROM clientes WHERE email = ?', [normalizedEmail]);
        if (existing.length) return res.status(409).json({ error: 'El correo ya está registrado para otro cliente' });

        const registeredDate = new Date().toISOString().slice(0, 10);
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const [result] = await pool.query(
            `INSERT INTO clientes (name, email, company, password, phone, address, imagen_url, stage, status, registered_date, last_interaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), normalizedEmail, company || '', hashedPassword, phone.trim(), address || '',
             req.file ? `/uploads/clientes/${req.file.filename}` : null, stage || 'prospecto', status || 'activo', registeredDate, null]
        );

        const newClient = { 
            id: result.insertId,
            name: name.trim(),
            email: normalizedEmail,
            company: company || '',
            phone: String(phone).trim(),
            address: address || '', 
            imageUrl: req.file ? `/uploads/clientes/${req.file.filename}` : null,
            stage: stage || 'prospecto', 
            status: status || 'activo', 
            orders: 0, 
            spent: 0, 
            registeredDate, 
            lastInteractionDate: null,
            interactions: []
        };
        res.status(201).json(newClient);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El correo ya está registrado para otro cliente' });
        }
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

// Actualizar cliente
const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isAdmin(req, res)) return;
        if (!validClientId(id)) return res.status(400).json({ error: 'ID de cliente inválido' });
        const { name, email, company, phone, address, stage, status, password } = req.body || {};

        const [existing] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const current = existing[0];
        if (email !== undefined && !validEmail(email)) {
            return res.status(400).json({ error: 'Correo electrónico inválido' });
        }
        if ((name !== undefined && (typeof name !== 'string' || !name.trim()))
            || (phone !== undefined && (typeof phone !== 'string' || !phone.trim()))) {
            return res.status(400).json({ error: 'El nombre y el teléfono no pueden quedar vacíos' });
        }
        if (stage !== undefined && !validStage(stage)) {
            return res.status(400).json({ error: 'Etapa CRM no válida' });
        }
        if (status !== undefined && !clientStatuses.has(status)) {
            return res.status(400).json({ error: 'Estado de cliente no válido' });
        }
        for (const [value, field, maxLength] of [
            [name, 'Nombre', 100],
            [email, 'Correo', 150],
            [company, 'Empresa', 150],
            [phone, 'Teléfono', 30],
            [address, 'Dirección', 255]
        ]) {
            const error = validOptionalText(value, field, maxLength);
            if (error) return res.status(400).json({ error });
        }
        if (password !== undefined && password !== ''
            && (typeof password !== 'string' || password.length < 6 || password.length > 128)) {
            return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 128 caracteres' });
        }
        const updates = {
            name: name !== undefined ? String(name).trim() : current.name,
            email: email !== undefined ? String(email).trim().toLowerCase() : current.email,
            company: company !== undefined ? company : current.company,
            phone: phone !== undefined ? String(phone).trim() : current.phone,
            address: address !== undefined ? address : current.address,
            imageUrl: req.file ? `/uploads/clientes/${req.file.filename}` : current.imagen_url,
            stage: stage !== undefined ? stage : current.stage,
            status: status !== undefined ? status : current.status
        };
        const normalizedEmail = String(updates.email).trim().toLowerCase();
        const [duplicate] = await pool.query(
            'SELECT id FROM clientes WHERE email = ? AND id <> ?',
            [normalizedEmail, id]
        );
        if (duplicate.length) return res.status(409).json({ error: 'El correo ya está registrado para otro cliente' });

        const assignments = ['name = ?', 'email = ?', 'company = ?', 'phone = ?', 'address = ?', 'imagen_url = ?', 'stage = ?', 'status = ?'];
        const values = [updates.name, normalizedEmail, updates.company, updates.phone, updates.address, updates.imageUrl, updates.stage, updates.status];
        if (password) {
            assignments.push('password = ?');
            values.push(await bcrypt.hash(password, 10));
        }
        values.push(id);

        await pool.query(
            `UPDATE clientes SET ${assignments.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [id]);
        res.json(updated[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El correo ya está registrado para otro cliente' });
        }
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

const updateClientStage = async (req, res) => {
    try {
        if (!isAdmin(req, res)) return;
        const { id } = req.params;
        if (!validClientId(id)) return res.status(400).json({ error: 'ID de cliente inválido' });
        const { stage } = req.body || {};
        if (!validStage(stage)) {
            return res.status(400).json({ error: 'Etapa CRM no válida' });
        }
        const [existing] = await pool.query('SELECT id FROM clientes WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        await pool.query('UPDATE clientes SET stage = ? WHERE id = ?', [stage, id]);
        const [rows] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [id]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la etapa CRM' });
    }
};

const updateOwnClientProfile = async (req, res) => {
    try {
        if (req.user?.role !== 'usuario') {
            return res.status(403).json({ error: 'Este endpoint es solo para cuentas de cliente' });
        }
        const { name, email, phone, address } = req.body || {};
        if (typeof name !== 'string' || name.trim().length < 3
            || name.trim().length > 100
            || !validEmail(email)
            || email.trim().length > 150
            || typeof phone !== 'string' || phone.trim().length < 7
            || phone.trim().length > 30
            || typeof address !== 'string' || address.trim().length < 5) {
            return res.status(400).json({ error: 'Completa nombre, correo, teléfono y dirección válidos' });
        }
        if (address.trim().length > 255) {
            return res.status(400).json({ error: 'La dirección no puede exceder 255 caracteres' });
        }
        const clientId = Number(req.user.id);
        if (!validClientId(clientId)) return res.status(401).json({ error: 'Sesión de cliente inválida' });
        const normalizedEmail = email.trim().toLowerCase();
        const [duplicate] = await pool.query(
            'SELECT id FROM clientes WHERE email = ? AND id <> ?',
            [normalizedEmail, clientId]
        );
        if (duplicate.length) return res.status(409).json({ error: 'El correo ya está registrado para otro cliente' });
        const [result] = await pool.query(
            'UPDATE clientes SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name.trim(), normalizedEmail, phone.trim(), address.trim(), clientId]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Perfil de cliente no encontrado' });
        const [rows] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id = ?`, [clientId]);
        res.json(rows[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El correo ya está registrado para otro cliente' });
        }
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
};

const updateOwnClientImage = async (req, res) => {
    if (req.user?.role !== 'usuario') {
        return res.status(403).json({ error: 'Este endpoint es solo para cuentas de cliente' });
    }
    if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen JPG, PNG o WEBP' });
    const clientId = Number(req.user.id);
    if (!validClientId(clientId)) return res.status(401).json({ error: 'Sesión de cliente inválida' });
    try {
        const [result] = await pool.query(
            'UPDATE clientes SET imagen_url=? WHERE id=?',
            [`/uploads/clientes/${req.file.filename}`, clientId]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Perfil de cliente no encontrado' });
        const [rows] = await pool.query(`SELECT ${clientFields} FROM clientes WHERE id=?`, [clientId]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo guardar la imagen del perfil' });
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
            SELECT id, name, email, last_interaction_date AS lastInteractionDate
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
        res.status(500).json({ error: 'Error al obtener metricas CRM' });
    }
};

// Eliminar cliente
const deleteClient = async (req, res) => {
    try {
        if (!isAdmin(req, res)) return;
        const { id } = req.params;
        if (!validClientId(id)) return res.status(400).json({ error: 'ID de cliente inválido' });
        const connection = await pool.getConnection();
        let result;
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM interacciones WHERE cliente_id = ?', [id]);
            [result] = await connection.query('DELETE FROM clientes WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
};

module.exports = { getClients, getClientById, createClient, updateClient, updateClientStage, updateOwnClientProfile, updateOwnClientImage, getClientMetrics, deleteClient };
