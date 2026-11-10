const pool = require('../config/db');

async function getPromociones(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM promociones ORDER BY id DESC');
        res.json(rows.map(r => ({
            id: r.id,
            nombre: r.nombre,
            descripcion: r.descripcion || '',
            descuento: r.descuento || `${r.valor || 10}%`,
            tipo_descuento: r.tipo_descuento || 'porcentaje',
            valor: Number(r.valor || parseFloat(r.descuento) || 10),
            productos: r.productos || 'Todos',
            vigencia: r.vigencia || '',
            fecha_inicio: r.fecha_inicio,
            fecha_fin: r.fecha_fin,
            estado: r.estado || 'Activa'
        })));
    } catch (error) {
        console.error('Error al obtener promociones:', error);
        res.status(500).json({ error: 'Error al consultar promociones' });
    }
}

async function createPromocion(req, res) {
    try {
        const { nombre, descripcion, tipo_descuento, valor, descuento, productos, vigencia, fecha_inicio, fecha_fin, estado } = req.body;
        if (!nombre || typeof nombre !== 'string') {
            return res.status(400).json({ error: 'El nombre de la promoción es obligatorio' });
        }

        const val = Number(valor || parseFloat(descuento) || 10);
        const tipo = tipo_descuento === 'monto' ? 'monto' : 'porcentaje';
        const descTexto = descuento || (tipo === 'porcentaje' ? `${val}%` : `$${val.toFixed(2)}`);
        const status = estado === 'Inactiva' ? 'Inactiva' : 'Activa';

        const [result] = await pool.query(`
            INSERT INTO promociones (nombre, descripcion, descuento, tipo_descuento, valor, productos, vigencia, fecha_inicio, fecha_fin, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre.trim(),
            descripcion || '',
            descTexto,
            tipo,
            val,
            productos || 'Todos los productos',
            vigencia || 'Hasta agotar existencias',
            fecha_inicio || null,
            fecha_fin || null,
            status
        ]);

        res.status(201).json({
            id: result.insertId,
            nombre: nombre.trim(),
            descripcion: descripcion || '',
            tipo_descuento: tipo,
            valor: val,
            descuento: descTexto,
            productos: productos || 'Todos los productos',
            vigencia: vigencia || '',
            estado: status
        });
    } catch (error) {
        console.error('Error al crear promoción:', error);
        res.status(500).json({ error: 'Error al crear la promoción' });
    }
}

async function updatePromocion(req, res) {
    try {
        const id = Number(req.params.id);
        const { nombre, descripcion, tipo_descuento, valor, descuento, productos, vigencia, fecha_inicio, fecha_fin, estado } = req.body;

        const [existing] = await pool.query('SELECT * FROM promociones WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        const current = existing[0];
        const newNombre = nombre ? String(nombre).trim() : current.nombre;
        const newDesc = descripcion !== undefined ? String(descripcion).trim() : current.descripcion;
        const newTipo = tipo_descuento || current.tipo_descuento || 'porcentaje';
        const newVal = valor !== undefined ? Number(valor) : (current.valor || 10);
        const newDescTexto = descuento || (newTipo === 'porcentaje' ? `${newVal}%` : `$${newVal.toFixed(2)}`);
        const newProds = productos !== undefined ? String(productos) : current.productos;
        const newVigencia = vigencia !== undefined ? String(vigencia) : current.vigencia;
        const newStatus = estado || current.estado;

        await pool.query(`
            UPDATE promociones
            SET nombre = ?, descripcion = ?, descuento = ?, tipo_descuento = ?, valor = ?,
                productos = ?, vigencia = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
            WHERE id = ?
        `, [
            newNombre, newDesc, newDescTexto, newTipo, newVal, newProds, newVigencia,
            fecha_inicio || current.fecha_inicio, fecha_fin || current.fecha_fin, newStatus, id
        ]);

        res.json({
            id,
            nombre: newNombre,
            descripcion: newDesc,
            tipo_descuento: newTipo,
            valor: newVal,
            descuento: newDescTexto,
            productos: newProds,
            vigencia: newVigencia,
            estado: newStatus
        });
    } catch (error) {
        console.error('Error al actualizar promoción:', error);
        res.status(500).json({ error: 'Error al actualizar promoción' });
    }
}

async function deletePromocion(req, res) {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query('DELETE FROM promociones WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }
        res.json({ success: true, message: 'Promoción eliminada' });
    } catch (error) {
        console.error('Error al eliminar promoción:', error);
        res.status(500).json({ error: 'Error al eliminar promoción' });
    }
}

module.exports = {
    getPromociones,
    createPromocion,
    updatePromocion,
    deletePromocion
};
