const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');

const LIMITE_ACTIVIDAD_POR_USUARIO = 25;

// ============================================================
// POST /registrar → Registra una actividad (con FIFO de 25)
// ============================================================
router.post('/registrar', verifyToken, async (req, res) => {
    try {
        const {
            usuario_email,
            usuario_nombre,
            usuario_role,
            tipo,
            descripcion,
            metadata
        } = req.body;

        if (!usuario_email || !tipo || !descripcion) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // 1. Insertar el nuevo registro
        await pool.query(
            `INSERT INTO actividad_usuarios
                (usuario_email, usuario_nombre, usuario_role, tipo, descripcion, metadata)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                usuario_email,
                usuario_nombre || 'Usuario',
                usuario_role || 'usuario',
                tipo,
                descripcion,
                JSON.stringify(metadata || {})
            ]
        );

        // 2. FIFO: mantener solo los últimos LIMITE_ACTIVIDAD_POR_USUARIO por usuario
        await pool.query(
            `DELETE a FROM actividad_usuarios a
             LEFT JOIN (
                 SELECT id
                 FROM actividad_usuarios
                 WHERE usuario_email = ?
                 ORDER BY fecha DESC, id DESC
                 LIMIT ${LIMITE_ACTIVIDAD_POR_USUARIO}
             ) keep ON a.id = keep.id
             WHERE a.usuario_email = ?
               AND keep.id IS NULL`,
            [usuario_email, usuario_email]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error registrando actividad:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET /usuarios → Actividad de clientes (excluye admins)
// ============================================================
router.get('/usuarios', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.*
            FROM actividad_usuarios a
            WHERE (a.usuario_role IS NULL OR a.usuario_role NOT IN ('admin', 'super_administrador'))
              AND NOT EXISTS (
                  SELECT 1 FROM usuarios u
                  WHERE u.email = a.usuario_email
                    AND u.role IN ('admin', 'super_administrador')
              )
            ORDER BY a.fecha DESC
            LIMIT 200
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener actividad de usuarios:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET /mi-actividad → Actividad del admin autenticado
// ============================================================
router.get('/mi-actividad', verifyToken, async (req, res) => {
    try {
        const { email, role } = req.user;

        let query = '';
        let params = [];

        if (role === 'super_administrador') {
            query = `
                SELECT a.*, u.role AS usuario_role
                FROM actividad_usuarios a
                LEFT JOIN usuarios u ON u.email = a.usuario_email
                ORDER BY a.fecha DESC
                LIMIT 200
            `;
        } else if (role === 'admin') {
            query = `
                SELECT a.*, u.role AS usuario_role
                FROM actividad_usuarios a
                LEFT JOIN usuarios u ON u.email = a.usuario_email
                WHERE a.usuario_email = ?
                ORDER BY a.fecha DESC
                LIMIT 200
            `;
            params = [email];
        } else {
            return res.status(403).json({ error: 'No tienes permisos para ver esta actividad' });
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener mi actividad:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET /usuarios/:email → Actividad de un usuario específico
// ============================================================
router.get('/usuarios/:email', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM actividad_usuarios WHERE usuario_email = ? ORDER BY fecha DESC',
            [req.params.email]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener actividad del usuario:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;