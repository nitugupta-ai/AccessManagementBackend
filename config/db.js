const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "access_management",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Setup Database & Tables
const setupDatabase = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true,
    });

    console.log("Creating Database...");
    await connection.query(`CREATE DATABASE IF NOT EXISTS access_management;`);
    await connection.changeUser({ database: "access_management" });

    console.log("Creating Tables...");
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            created_by INT NOT NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS modules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INT NOT NULL,
            role_id INT NOT NULL,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS role_modules (
            role_id INT NOT NULL,
            module_id INT NOT NULL,
            permission ENUM('read', 'write', 'delete') NOT NULL,
            PRIMARY KEY (role_id, module_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        );
    `);

    console.log("Database & Tables Created Successfully!");
    await connection.end();
};

// Insert Initial Data
const insertInitialData = async () => {
    console.log("Inserting Initial Data...");
    await db.query(`
        INSERT INTO users (name, email, password, role) 
        VALUES ('Admin User', 'admin@example.com', '$2b$10$I9t2RPmD94ojbSLg4qcsqeQcObz.3oqLEK.MKKiex1qfsyVY9L3Rm', 'admin')
        ON DUPLICATE KEY UPDATE email = email;
    `);

    await db.query(`
        INSERT INTO roles (name, created_by) 
        VALUES ('Administrator', 1), ('Manager', 1), ('Editor', 1), ('Viewer', 1)
        ON DUPLICATE KEY UPDATE name = name;
    `);

    await db.query(`
        INSERT INTO modules (name, description) 
        VALUES ('Users', 'Manage Users'), ('Roles', 'Manage Roles'), ('Modules', 'Manage Modules')
        ON DUPLICATE KEY UPDATE name = name;
    `);

        

    console.log("Initial Data Inserted!");
};

// Export Database Connection & Setup Functions
module.exports = { db, setupDatabase, insertInitialData };
