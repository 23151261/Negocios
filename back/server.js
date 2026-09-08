const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de DeliciasResto funcionando' });
});

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const clientRoutes = require('./src/routes/client.routes');
const interactionRoutes = require('./src/routes/interaction.routes');
const dataRoutes = require('./src/routes/data.routes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/interacciones', interactionRoutes);
app.use('/api/data', dataRoutes);

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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@restogmail.com';
    await pool.query(
        "UPDATE usuarios SET role = 'super_administrador' WHERE email = ? AND role = 'usuario'",
        [adminEmail]
    );

    await pool.query(`
        CREATE TABLE IF NOT EXISTS app_data (
            data_key VARCHAR(50) NOT NULL PRIMARY KEY,
            data_value JSON NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

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
        SELECT u.name, u.email, u.password, '', '', 'prospecto', 'activo', 0, 0, CURDATE(), CURDATE()
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

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('No se pudo iniciar la API o preparar la base de datos:', error);
    process.exit(1);
});
