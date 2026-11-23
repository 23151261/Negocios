const pool = require('./db');

const catalogPriceUpdates = [
    { id: 1, name: 'Pizza Margarita', previousPrice: 12.50, price: 149.00 },
    { id: 2, name: 'Pizza Pepperoni', previousPrice: 14.90, price: 159.00 },
    { id: 3, name: 'Hamburguesa Clásica', previousPrice: 10.90, price: 99.00 },
    { id: 4, name: 'Hamburguesa BBQ', previousPrice: 13.50, price: 129.00 },
    { id: 5, name: 'Salmón a la plancha', previousPrice: 18.40, price: 269.00 },
    { id: 6, name: 'Ceviche de camarón', previousPrice: 15.20, price: 189.00 },
    { id: 7, name: 'Café de especialidad', previousPrice: 4.20, price: 55.00 },
    { id: 8, name: 'Ensalada César', previousPrice: 11.80, price: 139.00 },
    { id: 16, name: 'flavitron', previousPrice: 26.40, price: 139.00 }
];

async function updateCatalogPrices() {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        for (const update of catalogPriceUpdates) {
            await connection.query(
                'UPDATE productos SET price = ? WHERE id = ? AND name = ? AND price = ?',
                [update.price, update.id, update.name, update.previousPrice]
            );
        }
        await connection.commit();
        transactionStarted = false;
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function ensureColumn(table, column, definition) {
    const [rows] = await pool.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    if (rows.length === 0) {
        await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
}

async function initEtapa4() {
    await updateCatalogPrices();

    // 1. Columnas en clientes
    await ensureColumn('clientes', 'monedero_saldo', 'DECIMAL(12,2) NOT NULL DEFAULT 0.00');
    await pool.query('ALTER TABLE `clientes` MODIFY COLUMN `monedero_saldo` DECIMAL(12,2) NOT NULL DEFAULT 0.00');
    
    // 2. Tabla monedero_movimientos
    await pool.query(`
        CREATE TABLE IF NOT EXISTS monedero_movimientos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cliente_id INT NOT NULL,
            folio VARCHAR(40) NULL,
            fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            concepto VARCHAR(255) NOT NULL,
            tipo ENUM('cargo', 'abono') NOT NULL DEFAULT 'abono',
            monto DECIMAL(10,2) NOT NULL,
            saldo DECIMAL(10,2) NOT NULL,
            metodo_pago VARCHAR(50) DEFAULT 'Monedero',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_monedero_cliente (cliente_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 3. Tabla impuestos
    await pool.query(`
        CREATE TABLE IF NOT EXISTS impuestos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            porcentaje DECIMAL(5,2) NOT NULL DEFAULT 16.00,
            estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [impRows] = await pool.query('SELECT COUNT(*) AS total FROM impuestos');
    if (impRows[0].total === 0) {
        await pool.query(`
            INSERT INTO impuestos (nombre, porcentaje, estado) VALUES
            ('IVA', 16.00, 'Activo')
        `);
    }

    // 4. Tabla tickets_atencion
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tickets_atencion (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folio VARCHAR(30) NOT NULL,
            cliente_id INT NOT NULL,
            cliente_nombre VARCHAR(150) NOT NULL DEFAULT '',
            cliente_email VARCHAR(150) NOT NULL DEFAULT '',
            asunto VARCHAR(150) NOT NULL,
            mensaje TEXT NOT NULL,
            estado ENUM('En proceso', 'Respondido', 'Cerrado') NOT NULL DEFAULT 'En proceso',
            fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            respuesta TEXT NULL,
            fecha_respuesta DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_tickets_cliente (cliente_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed demo tickets si no hay ninguno
    const [ticketRows] = await pool.query('SELECT COUNT(*) AS total FROM tickets_atencion');
    if (ticketRows[0].total === 0) {
        const [clients] = await pool.query('SELECT id, name, email FROM clientes LIMIT 1');
        const cId = clients.length > 0 ? clients[0].id : 1;
        const cName = clients.length > 0 ? clients[0].name : 'Juan Pérez';
        const cEmail = clients.length > 0 ? clients[0].email : 'juan@ejemplo.com';

        await pool.query(`
            INSERT INTO tickets_atencion (folio, cliente_id, cliente_nombre, cliente_email, asunto, mensaje, estado, fecha, respuesta, fecha_respuesta)
            VALUES
            ('T-105', ?, ?, ?, 'Duda sobre mi pedido', '¿Aproximadamente cuánto tiempo demora la entrega en la zona centro?', 'En proceso', NOW() - INTERVAL 2 HOUR, NULL, NULL),
            ('T-104', ?, ?, ?, 'Cambio de producto', 'Solicito cambio de ensalada césar por ensalada mixta.', 'Respondido', NOW() - INTERVAL 1 DAY, 'Estimado cliente, su cambio ha sido procesado con éxito por el equipo de cocina.', NOW() - INTERVAL 12 HOUR),
            ('T-103', ?, ?, ?, 'Facturación', 'Requiero confirmación del timbrado fiscal de mi compra.', 'Cerrado', NOW() - INTERVAL 2 DAY, 'Factura timbrada y enviada a su correo electrónico.', NOW() - INTERVAL 1 DAY)
        `, [cId, cName, cEmail, cId, cName, cEmail, cId, cName, cEmail]);
    }

    // 5. Tabla pagos
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pagos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pedido_id VARCHAR(40) NOT NULL,
            cliente_id INT NULL,
            monto DECIMAL(10,2) NOT NULL,
            metodo_pago VARCHAR(50) NOT NULL,
            estado VARCHAR(40) NOT NULL DEFAULT 'Aprobado',
            fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_pagos_pedido (pedido_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 6. Tabla categorias
    await pool.query(`
        CREATE TABLE IF NOT EXISTS categorias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(80) NOT NULL UNIQUE,
            descripcion TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
        INSERT IGNORE INTO categorias (nombre, descripcion)
        SELECT DISTINCT category, CONCAT('Categoría de ', category)
        FROM productos
        WHERE category IS NOT NULL AND category != ''
    `);

    // 7. Columnas adicionales para promociones
    await ensureColumn('promociones', 'descripcion', "VARCHAR(255) NOT NULL DEFAULT ''");
    await ensureColumn('promociones', 'tipo_descuento', "VARCHAR(20) NOT NULL DEFAULT 'porcentaje'");
    await ensureColumn('promociones', 'valor', 'DECIMAL(10,2) NOT NULL DEFAULT 10.00');
    await ensureColumn('promociones', 'fecha_inicio', 'DATE NULL');
    await ensureColumn('promociones', 'fecha_fin', 'DATE NULL');

    // 8. Perfil y usuario oficial de Asistencia / Soporte
    const bcrypt = require('bcryptjs');
    const soporteEmail = (process.env.SUPPORT_EMAIL || 'soporte@gmail.com').trim().toLowerCase();
    const [existingSoporte] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [soporteEmail]);

    if (existingSoporte.length === 0) {
        if (process.env.SUPPORT_PASSWORD) {
            const soportePass = await bcrypt.hash(process.env.SUPPORT_PASSWORD, 10);
            await pool.query(
                'INSERT INTO usuarios (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Soporte y Asistencia', soporteEmail, soportePass, 'soporte']
            );
        }
    } else {
        await pool.query(
            'UPDATE usuarios SET role = ? WHERE email = ?',
            ['soporte', soporteEmail]
        );
    }
}

module.exports = { initEtapa4 };
