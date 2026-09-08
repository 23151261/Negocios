const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'usuario']
        );

        await pool.query(
            `INSERT INTO clientes
                (name, email, phone, address, stage, status, orders, spent, registered_date, last_interaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, '', '', 'prospecto', 'activo', 0, 0, new Date(), new Date()]
        );

        const token = jwt.sign(
            { id: result.insertId, email, role: 'usuario' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado',
            token,
            user: { id: result.insertId, name, email, role: 'usuario' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const registerAdmin = async (req, res) => {
    try {
        if (!['admin', 'super_administrador'].includes(req.user.role)) {
            return res.status(403).json({ error: 'No tienes permisos para crear administradores' });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'admin']
        );

        res.status(201).json({
            message: 'Administrador registrado',
            user: { id: result.insertId, name, email, role: 'admin' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = { register, registerAdmin, login };