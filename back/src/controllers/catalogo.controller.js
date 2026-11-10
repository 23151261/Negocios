const pool = require('../config/db');

async function getCatalogo(req, res) {
    try {
        const { categoria, buscar, ordenar } = req.query;
        let query = `
            SELECT id, name AS nombre, description AS descripcion, category AS categoria,
                   price AS precio, stock AS stock_actual, image AS imagen_url,
                   status AS estado, badge AS destacado, badge_text, min_stock, strategy
            FROM productos
            WHERE active = 1
        `;
        const params = [];

        if (categoria && categoria !== 'Todas' && categoria !== 'todas') {
            query += ' AND category = ?';
            params.push(categoria);
        }

        if (buscar && buscar.trim() !== '') {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            const term = `%${buscar.trim()}%`;
            params.push(term, term);
        }

        if (ordenar === 'menor_precio' || ordenar === 'precio_asc') {
            query += ' ORDER BY price ASC';
        } else if (ordenar === 'mayor_precio' || ordenar === 'precio_desc') {
            query += ' ORDER BY price DESC';
        } else {
            query += ' ORDER BY id DESC';
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener catálogo:', error);
        res.status(500).json({ error: 'Error al consultar catálogo de productos' });
    }
}

async function getProductoById(req, res) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT id, name AS nombre, description AS descripcion, category AS categoria,
                   price AS precio, stock AS stock_actual, image AS imagen_url,
                   status AS estado, badge AS destacado, badge_text, min_stock, strategy
            FROM productos
            WHERE id = ? AND active = 1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener detalle del producto:', error);
        res.status(500).json({ error: 'Error al consultar detalle del producto' });
    }
}

async function getCategorias(req, res) {
    try {
        const [rows] = await pool.query('SELECT DISTINCT category AS categoria FROM productos WHERE active = 1 ORDER BY category');
        res.json(rows.map(r => r.categoria));
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
}

module.exports = {
    getCatalogo,
    getProductoById,
    getCategorias
};
