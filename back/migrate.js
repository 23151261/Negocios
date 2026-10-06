/**
 * migrate.js — Migración de app_data → tablas relacionales
 * Ejecutar UNA SOLA VEZ: node migrate.js
 */
const pool = require('./src/config/db');

async function migrate() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // ─── 1. Tabla proveedores ───────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS proveedores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                contact VARCHAR(150) NOT NULL DEFAULT '',
                email VARCHAR(150) NOT NULL,
                phone VARCHAR(30) NOT NULL DEFAULT '',
                address VARCHAR(255) DEFAULT '',
                products VARCHAR(500) DEFAULT '',
                activo TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_prov_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // ─── 2. Columnas SCM en tabla productos ────────────────────────
        // min_stock
        const [minStockCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='min_stock'"
        );
        if (minStockCols.length === 0) {
            await conn.query("ALTER TABLE productos ADD COLUMN min_stock INT DEFAULT NULL AFTER stock");
        }
        // strategy
        const [strategyCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='strategy'"
        );
        if (strategyCols.length === 0) {
            await conn.query("ALTER TABLE productos ADD COLUMN strategy ENUM('PUSH','PULL') NOT NULL DEFAULT 'PUSH' AFTER min_stock");
        }
        // unit_cost
        const [unitCostCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='unit_cost'"
        );
        if (unitCostCols.length === 0) {
            await conn.query("ALTER TABLE productos ADD COLUMN unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER strategy");
        }
        // provider_id
        const [providerIdCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='provider_id'"
        );
        if (providerIdCols.length === 0) {
            await conn.query("ALTER TABLE productos ADD COLUMN provider_id INT DEFAULT NULL AFTER unit_cost");
        }
        const [activeProductCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='active'"
        );
        if (activeProductCols.length === 0) {
            await conn.query('ALTER TABLE productos ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1');
        }

        // ─── 3. Tabla movimientos_inventario ───────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS movimientos_inventario (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                product_id INT NOT NULL,
                type ENUM('Entrada','Salida') NOT NULL,
                quantity INT NOT NULL,
                reason VARCHAR(500) NOT NULL DEFAULT '',
                user VARCHAR(150) DEFAULT 'Usuario',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY fk_mov_prod (product_id) REFERENCES productos(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        const [movementProductNameCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='movimientos_inventario' AND COLUMN_NAME='product_name'"
        );
        if (movementProductNameCols.length === 0) {
            await conn.query('ALTER TABLE movimientos_inventario ADD COLUMN product_name VARCHAR(150) DEFAULT NULL AFTER product_id');
        }

        // ─── 4. Tabla pedidos_scm ──────────────────────────────────────
        await conn.query(`
            CREATE TABLE IF NOT EXISTS pedidos_scm (
                id BIGINT PRIMARY KEY,
                folio VARCHAR(20) NOT NULL,
                date VARCHAR(20) NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                type VARCHAR(30) NOT NULL DEFAULT 'Reposición',
                status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
                provider_id INT DEFAULT NULL,
                notes TEXT DEFAULT '',
                auto_generated TINYINT(1) NOT NULL DEFAULT 0,
                stock_received TINYINT(1) NOT NULL DEFAULT 0,
                retry_suppressed TINYINT(1) NOT NULL DEFAULT 0,
                product_name VARCHAR(150) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // ─── 5. Columna imagen_url en clientes ─────────────────────────
        const [imgClientCols] = await conn.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='clientes' AND COLUMN_NAME='imagen_url'"
        );
        if (imgClientCols.length === 0) {
            await conn.query("ALTER TABLE clientes ADD COLUMN imagen_url VARCHAR(500) DEFAULT NULL AFTER address");
        }

        await conn.commit();

        // ─── 6. Migrar datos de app_data → tablas nuevas ───────────────
        await migrarDatosAppData();

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function migrarDatosAppData() {
    // 6a. Migrar proveedores
    const [provRows] = await pool.query("SELECT data_value FROM app_data WHERE data_key='scm_providers'");
    if (provRows.length && provRows[0].data_value) {
        const proveedores = typeof provRows[0].data_value === 'string'
            ? JSON.parse(provRows[0].data_value)
            : provRows[0].data_value;
        for (const p of proveedores) {
            const [exists] = await pool.query('SELECT id FROM proveedores WHERE id=?', [p.id]);
            if (exists.length === 0) {
                await pool.query(
                    'INSERT INTO proveedores (id, name, contact, email, phone, address, products) VALUES (?,?,?,?,?,?,?)',
                    [p.id, p.name, p.contact||'', p.email||'', p.phone||'', p.address||'', p.products||'']
                );
            }
        }
        // Reset auto_increment to max+1
        const [maxRow] = await pool.query('SELECT MAX(id) AS m FROM proveedores');
        if (maxRow[0].m) {
            await pool.query(`ALTER TABLE proveedores AUTO_INCREMENT = ${Number(maxRow[0].m) + 1}`);
        }
    }

    // 6b. Migrar metadatos de productos (min_stock, strategy, unit_cost, provider_id)
    const [metaRows] = await pool.query("SELECT data_value FROM app_data WHERE data_key='scm_product_meta'");
    if (metaRows.length && metaRows[0].data_value) {
        const meta = typeof metaRows[0].data_value === 'string'
            ? JSON.parse(metaRows[0].data_value)
            : metaRows[0].data_value;
        for (const [prodId, m] of Object.entries(meta)) {
            await pool.query(
                'UPDATE productos SET min_stock=?, strategy=?, unit_cost=?, provider_id=? WHERE id=?',
                [
                    m.minStock != null ? Number(m.minStock) : null,
                    ['PUSH','PULL'].includes(String(m.strategy||'').toUpperCase()) ? String(m.strategy).toUpperCase() : 'PUSH',
                    Number(m.unitCost||0),
                    m.providerId ? Number(m.providerId) : null,
                    Number(prodId)
                ]
            );
        }
    }

    // 6c. Migrar movimientos
    const [movRows] = await pool.query("SELECT data_value FROM app_data WHERE data_key='scm_movements'");
    if (movRows.length && movRows[0].data_value) {
        const movs = typeof movRows[0].data_value === 'string'
            ? JSON.parse(movRows[0].data_value)
            : movRows[0].data_value;
        let migrated = 0;
        for (const m of movs) {
            const [exists] = await pool.query('SELECT id FROM movimientos_inventario WHERE id=?', [m.id]);
            if (exists.length === 0) {
                const [prodExists] = await pool.query('SELECT id FROM productos WHERE id=?', [m.productId]);
                if (prodExists.length === 0) continue;
                await pool.query(
                    'INSERT INTO movimientos_inventario (id, date, product_id, type, quantity, reason, user) VALUES (?,?,?,?,?,?,?)',
                    [
                        m.id,
                        m.date || new Date().toLocaleDateString('es-MX'),
                        Number(m.productId),
                        ['Entrada','Salida'].includes(m.type) ? m.type : 'Entrada',
                        Math.abs(Number(m.quantity)||1),
                        m.reason || '',
                        m.user || 'Usuario'
                    ]
                );
                migrated++;
            }
        }
    }

    // 6d. Migrar pedidos SCM
    const [ordRows] = await pool.query("SELECT data_value FROM app_data WHERE data_key='scm_orders'");
    if (ordRows.length && ordRows[0].data_value) {
        const orders = typeof ordRows[0].data_value === 'string'
            ? JSON.parse(ordRows[0].data_value)
            : ordRows[0].data_value;
        let migrated = 0;
        for (const o of orders) {
            const [exists] = await pool.query('SELECT id FROM pedidos_scm WHERE id=?', [o.id]);
            if (exists.length === 0) {
                const [prodExists] = await pool.query('SELECT id, name FROM productos WHERE id=?', [o.productId]);
                await pool.query(
                    'INSERT INTO pedidos_scm (id, folio, date, product_id, quantity, type, status, provider_id, notes, auto_generated, stock_received, retry_suppressed, product_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    [
                        o.id,
                        o.folio || `PC-${String(migrated+1).padStart(3,'0')}`,
                        o.date || new Date().toLocaleDateString('es-MX'),
                        Number(o.productId),
                        Number(o.quantity)||1,
                        o.type || 'Reposición',
                        o.status || 'Pendiente',
                        o.providerId ? Number(o.providerId) : null,
                        o.notes || '',
                        o.autoGenerated ? 1 : 0,
                        o.stockReceived ? 1 : 0,
                        o.retrySuppressedUntilStockRecovers ? 1 : 0,
                        prodExists.length > 0 ? prodExists[0].name : (o.productName || null)
                    ]
                );
                migrated++;
            }
        }
    }

}

migrate();
