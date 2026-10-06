const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');
const { ensureLowStockOrders } = require('./src/controllers/data.controller');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de DeliciasResto funcionando' });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../front')));

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const clientRoutes = require('./src/routes/client.routes');
const interactionRoutes = require('./src/routes/interaction.routes');
const dataRoutes = require('./src/routes/data.routes');
const cartRoutes = require('./src/routes/cart.routes');
const scmRoutes = require('./src/routes/scm.routes');
const actividadRoutes = require('./src/routes/actividad.routes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/interacciones', interactionRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/carrito', cartRoutes);
app.use('/api', scmRoutes);
app.use('/api/actividad', actividadRoutes);

// Iniciar servidor
async function startServer() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(30) NOT NULL DEFAULT 'usuario',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS clientes (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            company VARCHAR(150) NOT NULL DEFAULT '',
            password VARCHAR(255) NULL,
            phone VARCHAR(30) NOT NULL DEFAULT '',
            address VARCHAR(255) NOT NULL DEFAULT '',
            stage VARCHAR(30) NOT NULL DEFAULT 'prospecto',
            status VARCHAR(20) NOT NULL DEFAULT 'activo',
            orders INT NOT NULL DEFAULT 0,
            spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
            registered_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_interaction_date DATE NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_clientes_email (email),
            INDEX idx_clientes_status (status),
            INDEX idx_clientes_stage (stage)
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS interacciones (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            cliente_id INT NOT NULL,
            type VARCHAR(30) NOT NULL,
            date DATE NOT NULL,
            note TEXT NOT NULL,
            user VARCHAR(150) NOT NULL DEFAULT '',
            usuario_id INT NULL,
            INDEX idx_interacciones_cliente_fecha (cliente_id, date),
            INDEX idx_interacciones_usuario (usuario_id)
        )
    `);

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

    const clientColumns = [
        ['name', "VARCHAR(100) NOT NULL DEFAULT ''"],
        ['email', "VARCHAR(150) NOT NULL DEFAULT ''"],
        ['company', "VARCHAR(150) NOT NULL DEFAULT ''"],
        ['password', 'VARCHAR(255) NULL'],
        ['phone', "VARCHAR(30) NOT NULL DEFAULT ''"],
        ['address', "VARCHAR(255) NOT NULL DEFAULT ''"],
        ['imagen_url', 'VARCHAR(500) NULL'],
        ['stage', "VARCHAR(30) NOT NULL DEFAULT 'prospecto'"],
        ['status', "VARCHAR(20) NOT NULL DEFAULT 'activo'"],
        ['orders', 'INT NOT NULL DEFAULT 0'],
        ['spent', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
        ['registered_date', 'DATETIME NULL'],
        ['last_interaction_date', 'DATE NULL'],
        ['created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP']
    ];
    for (const [column, definition] of clientColumns) {
        await ensureColumn('clientes', column, definition);
    }
    const [passwordColumn] = await pool.query(
        `SELECT IS_NULLABLE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'password'`
    );
    if (passwordColumn.length && passwordColumn[0].IS_NULLABLE === 'NO') {
        await pool.query('ALTER TABLE clientes MODIFY COLUMN password VARCHAR(255) NULL');
    }
    const [clientEmailIndex] = await pool.query(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes'
           AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0`
    );
    if (clientEmailIndex.length === 0) {
        await pool.query('CREATE UNIQUE INDEX uq_clientes_email ON clientes (email)');
    }

    const interactionColumns = [
        ['cliente_id', 'INT NULL'],
        ['type', "VARCHAR(30) NOT NULL DEFAULT 'nota'"],
        ['date', 'DATE NULL'],
        ['note', 'TEXT NULL'],
        ['user', "VARCHAR(150) NOT NULL DEFAULT ''"],
        ['usuario_id', 'INT NULL']
    ];
    for (const [column, definition] of interactionColumns) {
        await ensureColumn('interacciones', column, definition);
    }

    const [scmTables] = await pool.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('productos', 'movimientos_inventario')"
    );
    const existingScmTables = new Set(scmTables.map(row => row.TABLE_NAME));
    if (existingScmTables.has('productos')) {
        await ensureColumn('productos', 'active', 'TINYINT(1) NOT NULL DEFAULT 1');
    }
    if (existingScmTables.has('movimientos_inventario')) {
        await ensureColumn('movimientos_inventario', 'product_name', 'VARCHAR(150) NULL');
        await pool.query(`
            UPDATE movimientos_inventario m
            INNER JOIN productos p ON p.id = m.product_id
            SET m.product_name = p.name
            WHERE m.product_name IS NULL OR m.product_name = ''
        `);
    }

    const [roleColumn] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'usuarios'
          AND COLUMN_NAME = 'role'
    `);

    if (roleColumn[0].total === 0) {
        await pool.query("ALTER TABLE usuarios ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'usuario'");
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    await pool.query(
        "UPDATE usuarios SET role = 'super_administrador' WHERE email IN (?, 'admin@gmail.com', 'admin@restogmail.com') AND role != 'super_administrador'",
        [adminEmail]
    );

    await pool.query(`
        CREATE TABLE IF NOT EXISTS app_data (
            data_key VARCHAR(50) NOT NULL PRIMARY KEY,
            data_value JSON NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const [interactionUserColumn] = await pool.query(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'interacciones'
          AND COLUMN_NAME = 'usuario_id'
    `);
    if (interactionUserColumn.length === 0) {
        await pool.query('ALTER TABLE interacciones ADD COLUMN usuario_id INT NULL AFTER user');
    }

    const scmInitialData = {
        scm_product_meta: {
            1: { minStock: 8, strategy: 'PUSH', unitCost: 45, providerId: 2 },
            2: { minStock: 8, strategy: 'PUSH', unitCost: 52, providerId: 1 },
            3: { minStock: 8, strategy: 'PUSH', unitCost: 40, providerId: 1 },
            4: { minStock: 8, strategy: 'PUSH', unitCost: 48, providerId: 1 },
            5: { minStock: 8, strategy: 'PULL', unitCost: 85, providerId: 3 },
            6: { minStock: 8, strategy: 'PULL', unitCost: 65, providerId: 3 },
            7: { minStock: 10, strategy: 'PUSH', unitCost: 15, providerId: 5 },
            8: { minStock: 8, strategy: 'PULL', unitCost: 35, providerId: 4 }
        },
        scm_providers: [
            { id: 1, name: 'Distribuidora de Carnes La Finca', contact: 'Carlos Martínez', email: 'ventas@lafinca.com', phone: '55 2345 6789', address: 'Parque Industrial Norte #45, CDMX', products: 'Carne de res, pepperoni, costillas BBQ, tocino' },
            { id: 2, name: 'Lácteos y Quesos del Valle', contact: 'María Gómez', email: 'contacto@lacteosvalle.com', phone: '55 9876 5432', address: 'Av. de las Granjas 120, Querétaro', products: 'Queso mozzarella, queso cheddar, crema, mantequilla' },
            { id: 3, name: 'Mariscos y Pescados del Pacífico', contact: 'Roberto Silva', email: 'pedidos@mariscospacifico.com', phone: '55 4567 8901', address: 'Bodega 14 Central de Pescados, Veracruz', products: 'Salmón fresco, camarones, mariscos' },
            { id: 4, name: 'Agrícola San Isidro', contact: 'Laura Sánchez', email: 'laura@agricolasanisidro.com', phone: '55 3456 7890', address: 'Carretera Federal Km 18, Puebla', products: 'Tomates, lechuga romana, albahaca, cebollas' },
            { id: 5, name: 'Tostadores Café de Altura', contact: 'Juan Hernández', email: 'juan@cafedealtura.com', phone: '55 1234 5678', address: 'Finca Los Cedros, Chiapas', products: 'Granos de café arábica y tueste de especialidad' }
        ],
        scm_movements: [
            { id: 1, date: '18/04/2026', productId: 1, type: 'Entrada', quantity: 30, reason: 'Compra de ingredientes', user: 'Admin' },
            { id: 2, date: '09/04/2026', productId: 2, type: 'Salida', quantity: -10, reason: 'Venta por pedidos', user: 'Admin' },
            { id: 3, date: '08/04/2026', productId: 4, type: 'Salida', quantity: -5, reason: 'Venta por pedidos', user: 'Admin' },
            { id: 4, date: '07/04/2026', productId: 5, type: 'Entrada', quantity: 15, reason: 'Reposición mariscos', user: 'Admin' },
            { id: 5, date: '05/04/2026', productId: 7, type: 'Entrada', quantity: 20, reason: 'Compra café', user: 'Admin' }
        ],
        scm_orders: [
            { id: 1, folio: 'PC-001', date: '10/04/2026', productId: 1, quantity: 30, type: 'Reposición', status: 'Pendiente', providerId: 2, notes: 'Queso mozzarella y masa para Pizza Margarita' },
            { id: 2, folio: 'PC-002', date: '08/04/2026', productId: 4, quantity: 25, type: 'Reposición', status: 'En proceso', providerId: 1, notes: 'Carne para Hamburguesa BBQ y salsa' },
            { id: 3, folio: 'PC-003', date: '05/04/2026', productId: 5, quantity: 20, type: 'Suministro', status: 'Surtido', providerId: 3, notes: 'Salmón fresco sellado' },
            { id: 4, folio: 'PC-004', date: '03/04/2026', productId: 7, quantity: 15, type: 'Reposición', status: 'Cancelado', providerId: 5, notes: 'Demora en transporte de granos' }
        ],
        scm_logistics: [],
        scm_level: 'En desarrollo',
        scm_maturity: [
            { id: 'mat-prod', label: 'Productos y proveedores de DeliciasResto integrados', completed: true },
            { id: 'mat-inv', label: 'Inventario y existencias conectadas a la base de datos MySQL', completed: true },
            { id: 'mat-traz', label: 'Trazabilidad de movimientos de cocina e insumos', completed: true },
            { id: 'mat-pushpull', label: 'Estrategia Push/Pull implementada por platillos', completed: true },
            { id: 'mat-rep', label: 'Reportes y métricas de ventas y abastecimiento en vivo', completed: true }
        ]
    };

    for (const [key, value] of Object.entries(scmInitialData)) {
        await pool.query(
            'INSERT IGNORE INTO app_data (data_key, data_value) VALUES (?, ?)',
            [key, JSON.stringify(value)]
        );
    }

    function repairSeededAccents(value, expected) {
        if (typeof value === 'string' && typeof expected === 'string' && value.length === expected.length) {
            let repaired = false;
            const characters = Array.from(value);
            const expectedCharacters = Array.from(expected);
            if (characters.length !== expectedCharacters.length) return value;
            for (let index = 0; index < characters.length; index += 1) {
                if (characters[index] === '?' || characters[index] === '\uFFFD') {
                    characters[index] = expectedCharacters[index];
                    repaired = true;
                } else if (characters[index] !== expectedCharacters[index]) {
                    return value;
                }
            }
            return repaired ? expected : value;
        }
        if (Array.isArray(value) && Array.isArray(expected)) {
            const expectedById = new Map(expected.map(item => [String(item.id), item]));
            return value.map(item => repairSeededAccents(item, expectedById.get(String(item.id)) || {}));
        }
        if (value && expected && typeof value === 'object' && typeof expected === 'object') {
            const repaired = { ...value };
            for (const [key, item] of Object.entries(value)) {
                if (Object.prototype.hasOwnProperty.call(expected, key)) {
                    repaired[key] = repairSeededAccents(item, expected[key]);
                }
            }
            return repaired;
        }
        return value;
    }

    for (const key of ['scm_providers', 'scm_movements', 'scm_orders', 'scm_maturity']) {
        const [rows] = await pool.query('SELECT data_value FROM app_data WHERE data_key = ?', [key]);
        if (rows.length) {
            const stored = typeof rows[0].data_value === 'string' ? JSON.parse(rows[0].data_value) : rows[0].data_value;
            const repaired = repairSeededAccents(stored, scmInitialData[key]);
            if (JSON.stringify(repaired) !== JSON.stringify(stored)) {
                await pool.query('UPDATE app_data SET data_value = ? WHERE data_key = ?', [JSON.stringify(repaired), key]);
            }
        }
    }

    const productAccentRepairs = [
        { id: 3, name: 'Hamburguesa Clásica' },
        { id: 5, name: 'Salmón a la plancha', description: 'Salmón fresco sellado a la plancha con vegetales asados.' },
        { id: 6, name: 'Ceviche de camarón', description: 'Camarones frescos marinados en limón con cebolla y cilantro.' },
        { id: 7, name: 'Café de especialidad', description: 'Café de origen con tueste medio y notas de chocolate.' },
        { id: 8, name: 'Ensalada César', description: 'Lechuga romana, pollo a la plancha, parmesano y aderezo César.' }
    ];
    for (const expected of productAccentRepairs) {
        const [rows] = await pool.query('SELECT name, description FROM productos WHERE id = ?', [expected.id]);
        if (rows.length === 0) continue;
        const updates = {};
        for (const field of ['name', 'description']) {
            if (expected[field]) {
                const repaired = repairSeededAccents(rows[0][field], expected[field]);
                if (repaired !== rows[0][field]) updates[field] = repaired;
            }
        }
        if (Object.keys(updates).length > 0) {
            await pool.query(
                'UPDATE productos SET name = ?, description = ? WHERE id = ?',
                [updates.name || rows[0].name, updates.description || rows[0].description, expected.id]
            );
        }
    }

    const [clientPasswordColumn] = await pool.query(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'clientes'
          AND COLUMN_NAME = 'password'
    `);

    if (clientPasswordColumn.length === 0) {
        await pool.query('ALTER TABLE clientes ADD COLUMN password VARCHAR(255) NULL AFTER email');
    }

    const [clientCompanyColumn] = await pool.query(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'clientes'
          AND COLUMN_NAME = 'company'
    `);

    if (clientCompanyColumn.length === 0) {
        await pool.query("ALTER TABLE clientes ADD COLUMN company VARCHAR(150) NOT NULL DEFAULT '' AFTER password");
    }

    await pool.query(`
        INSERT INTO clientes (name, email, password, phone, address, stage, status, orders, spent, registered_date, last_interaction_date)
        SELECT u.name, u.email, u.password, '', '', 'prospecto', 'activo', 0, 0, CURDATE(), NULL
        FROM usuarios u
        LEFT JOIN clientes c ON LOWER(c.email) = LOWER(u.email)
        WHERE u.role = 'usuario' AND c.id IS NULL
    `);
    await pool.query(`
        UPDATE clientes c
        INNER JOIN usuarios u ON LOWER(c.email) = LOWER(u.email)
        SET c.password = u.password
        WHERE u.role = 'usuario' AND c.password IS NULL
    `);
    await pool.query("DELETE FROM usuarios WHERE role = 'usuario'");

    const [cartColumns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'carrito'
          AND COLUMN_NAME = 'publication_id'
    `);

    if (cartColumns.length === 0) {
        await pool.query('ALTER TABLE carrito MODIFY product_id INT NULL');
        await pool.query('ALTER TABLE carrito ADD COLUMN publication_id INT NULL AFTER product_id');
        await pool.query('ALTER TABLE carrito ADD CONSTRAINT carrito_publication_fk FOREIGN KEY (publication_id) REFERENCES publicaciones(id) ON DELETE CASCADE');
        await pool.query('ALTER TABLE carrito ADD UNIQUE KEY unique_cart_publication (session_key, publication_id)');
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await ensureLowStockOrders(connection);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('No se pudo iniciar la API o preparar la base de datos:', error);
    process.exit(1);
});