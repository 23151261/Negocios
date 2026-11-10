const pool = require('../config/db');

async function getImpuestos(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM impuestos ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener impuestos:', error);
        res.status(500).json({ error: 'Error al obtener impuestos' });
    }
}

async function createImpuesto(req, res) {
    try {
        const { nombre, porcentaje, estado } = req.body;
        if (!nombre || typeof nombre !== 'string') {
            return res.status(400).json({ error: 'El nombre del impuesto es requerido' });
        }
        const pct = parseFloat(porcentaje);
        if (isNaN(pct) || pct < 0 || pct > 100) {
            return res.status(400).json({ error: 'El porcentaje debe estar entre 0 y 100' });
        }
        const status = estado === 'Inactivo' ? 'Inactivo' : 'Activo';

        const [result] = await pool.query(
            'INSERT INTO impuestos (nombre, porcentaje, estado) VALUES (?, ?, ?)',
            [nombre.trim(), pct, status]
        );

        res.status(201).json({
            id: result.insertId,
            nombre: nombre.trim(),
            porcentaje: pct,
            estado: status
        });
    } catch (error) {
        console.error('Error al crear impuesto:', error);
        res.status(500).json({ error: 'Error al registrar impuesto' });
    }
}

async function updateImpuesto(req, res) {
    try {
        const id = Number(req.params.id);
        const { nombre, porcentaje, estado } = req.body;

        const [existing] = await pool.query('SELECT * FROM impuestos WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Impuesto no encontrado' });
        }

        const current = existing[0];
        const newNombre = nombre ? String(nombre).trim() : current.nombre;
        const newPct = porcentaje !== undefined ? parseFloat(porcentaje) : current.porcentaje;
        const newStatus = estado !== undefined ? (estado === 'Inactivo' ? 'Inactivo' : 'Activo') : current.estado;

        await pool.query(
            'UPDATE impuestos SET nombre = ?, porcentaje = ?, estado = ? WHERE id = ?',
            [newNombre, newPct, newStatus, id]
        );

        res.json({
            id,
            nombre: newNombre,
            porcentaje: newPct,
            estado: newStatus
        });
    } catch (error) {
        console.error('Error al actualizar impuesto:', error);
        res.status(500).json({ error: 'Error al actualizar impuesto' });
    }
}

module.exports = {
    getImpuestos,
    createImpuesto,
    updateImpuesto
};
