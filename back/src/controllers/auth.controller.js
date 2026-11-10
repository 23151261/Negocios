const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

function validateCredentials(name, email, password) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100
        || typeof email !== 'string' || email.trim().length > 150
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        || typeof password !== 'string' || password.length < 6 || password.length > 128) {
        return false;
    }
    return true;
}

const register = async (req, res) => {
    let connection;
    try {
        const { name, email, password, phone, address } = req.body || {};
        if (!validateCredentials(name, email, password)) {
            return res.status(400).json({ error: 'Ingresa nombre, correo válido y contraseña de 6 a 128 caracteres' });
        }
        const normalizedEmail = email.trim().toLowerCase();

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingClients] = await connection.query('SELECT id FROM clientes WHERE email = ?', [normalizedEmail]);
        const [existingAdmins] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [normalizedEmail]);
        if (existingClients.length > 0 || existingAdmins.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [clientResult] = await connection.query(
            `INSERT INTO clientes
                (name, email, company, password, phone, address, stage, status, orders, spent, registered_date, last_interaction_date, monedero_saldo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), normalizedEmail, '', hashedPassword, (phone || '').trim(), (address || '').trim(), 'prospecto', 'activo', 0, 0, new Date(), new Date(), 1200.00]
        );

        await connection.query(
            `INSERT INTO monedero_movimientos (cliente_id, folio, fecha, concepto, tipo, monto, saldo, metodo_pago)
             VALUES (?, 'REC-001', NOW(), 'Saldo de bienvenida / Promoción inicial', 'abono', 1200.00, 1200.00, 'Monedero')`,
            [clientResult.insertId]
        );

        await connection.query(
            `INSERT INTO interacciones (cliente_id, type, date, note, user)
             VALUES (?, ?, ?, ?, ?)`,
            [clientResult.insertId, 'registro', new Date(), 'Usuario registrado en la plataforma con saldo de bienvenida de $1,200.00.', normalizedEmail]
        );

        await connection.commit();

        const token = jwt.sign(
            { id: clientResult.insertId, email: normalizedEmail, role: 'usuario' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado con éxito',
            token,
            user: {
                id: clientResult.insertId,
                name: name.trim(),
                email: normalizedEmail,
                phone: (phone || '').trim(),
                address: (address || '').trim(),
                monedero_saldo: 1200.00,
                role: 'usuario'
            }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        if (connection) connection.release();
    }
};

const registerAdmin = async (req, res) => {
    let connection;
    try {
        if (!['admin', 'super_administrador'].includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos para crear administradores' });
        }

        const { name, email, password, role } = req.body || {};
        if (!validateCredentials(name, email, password)) {
            return res.status(400).json({ error: 'Ingresa nombre, correo válido y contraseña de 6 a 128 caracteres' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const validRoles = ['admin', 'ventas', 'logistica', 'soporte'];
        const assignedRole = validRoles.includes(role) ? role : 'admin';

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await connection.query(
            'INSERT INTO usuarios (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword, assignedRole]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Usuario registrado',
            user: { id: result.insertId, name: name.trim(), email: normalizedEmail, role: assignedRole }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        if (connection) connection.release();
    }
};

const getAdmins = async (req, res) => {
    try {
        if (!['admin', 'super_administrador'].includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos para consultar administradores' });
        }

        const [admins] = await pool.query(
            "SELECT id, name, email, role, 'activo' AS status FROM usuarios WHERE role IN ('admin', 'super_administrador', 'ventas', 'logistica', 'soporte') ORDER BY id"
        );
        res.json(admins);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener administradores' });
    }
};

const deleteAdmin = async (req, res) => {
    let connection;
    try {
        if (req.user.role !== 'super_administrador') {
            return res.status(403).json({ error: 'Solo el super administrador puede eliminar administradores' });
        }

        const adminId = Number(req.params.id);
        if (!Number.isInteger(adminId) || adminId === req.user.id) {
            return res.status(400).json({ error: 'Administrador no válido' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [admin] = await connection.query(
            'SELECT name, email FROM usuarios WHERE id = ? AND role IN (\'admin\', \'ventas\', \'logistica\', \'soporte\')',
            [adminId]
        );

        if (admin.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const [client] = await connection.query(
            'SELECT id FROM clientes WHERE email = ?',
            [admin[0].email]
        );

        const actorName = req.user.name || req.user.email || 'Administrador';
        if (client.length > 0) {
            await connection.query(
                `INSERT INTO interacciones (cliente_id, type, date, note, user)
                 VALUES (?, ?, ?, ?, ?)`,
                [client[0].id, 'nota', new Date(), `Administrador ${admin[0].name} eliminado por ${actorName}`, req.user.email]
            );
        }

        const [result] = await connection.query(
            "DELETE FROM usuarios WHERE id = ? AND role IN ('admin', 'ventas', 'logistica', 'soporte')",
            [adminId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await connection.commit();
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    } finally {
        if (connection) connection.release();
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (typeof email !== 'string' || email.trim().length > 150
            || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            || typeof password !== 'string' || password.length > 128) {
            return res.status(400).json({ error: 'Correo o contraseña no válidos' });
        }
        const normalizedEmail = email.trim().toLowerCase();

        const [admins] = await pool.query(
            "SELECT * FROM usuarios WHERE email = ? AND role IN ('admin', 'super_administrador', 'ventas', 'logistica', 'soporte')",
            [normalizedEmail]
        );
        const [clients] = admins.length === 0
            ? await pool.query('SELECT * FROM clientes WHERE email = ? AND password IS NOT NULL', [normalizedEmail])
            : [[]];
        const user = admins[0] || clients[0];
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role || 'usuario' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                address: user.address || '',
                monedero_saldo: user.monedero_saldo !== undefined ? Number(user.monedero_saldo) : 1200.00,
                role: user.role || 'usuario'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const getPerfil = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const role = req.user?.role;

        if (role && role !== 'usuario') {
            const [admins] = await pool.query('SELECT id, name, email, role FROM usuarios WHERE id = ?', [userId]);
            if (admins.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
            return res.json(admins[0]);
        }

        const [clients] = await pool.query(`
            SELECT id, name, email, phone, address, monedero_saldo, stage, status, orders, spent, registered_date
            FROM clientes WHERE id = ?
        `, [userId]);

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        const c = clients[0];
        res.json({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone || '',
            address: c.address || '',
            monedero_saldo: Number(c.monedero_saldo || 0),
            stage: c.stage,
            status: c.status,
            orders: c.orders,
            spent: Number(c.spent),
            registered_date: c.registered_date,
            role: 'usuario'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar perfil' });
    }
};

const updatePerfil = async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const { name, phone, address, password } = req.body || {};

        if (req.user?.role !== 'usuario') {
            return res.status(400).json({ error: 'Acción permitida solo para clientes' });
        }

        const [clients] = await pool.query('SELECT id FROM clientes WHERE id = ?', [userId]);
        if (clients.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        const updates = [];
        const params = [];

        if (name && name.trim()) {
            updates.push('name = ?');
            params.push(name.trim());
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(String(phone).trim());
        }
        if (address !== undefined) {
            updates.push('address = ?');
            params.push(String(address).trim());
        }
        if (password && password.trim().length >= 6) {
            const hashedPassword = await bcrypt.hash(password.trim(), 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length > 0) {
            params.push(userId);
            await pool.query(`UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        const [updated] = await pool.query('SELECT id, name, email, phone, address, monedero_saldo FROM clientes WHERE id = ?', [userId]);
        res.json({
            message: 'Perfil actualizado con éxito',
            user: {
                ...updated[0],
                monedero_saldo: Number(updated[0].monedero_saldo || 0),
                role: 'usuario'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

const logout = async (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
};

module.exports = {
    register,
    registerAdmin,
    getAdmins,
    deleteAdmin,
    login,
    getPerfil,
    updatePerfil,
    logout
};
