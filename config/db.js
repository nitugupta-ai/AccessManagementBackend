
const mysql = require("mysql2");
require("dotenv").config();



const createConnection = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
                  user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true,
    });
};

//  Function to create the database and tables
const setupDatabase = async () => {
    const connection = await createConnection();

    console.log(" Creating Database...");
    await connection.query(`CREATE DATABASE IF NOT EXISTS access_management;`);
    await connection.changeUser({ database: "access_management" });

    console.log(" Creating Tables...");
    await connection.query(`
        -- Users Table
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Roles Table
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            created_by INT NOT NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Modules Table
        CREATE TABLE IF NOT EXISTS modules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT
        );

        -- User-Role Mapping
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id INT NOT NULL,
            role_id INT NOT NULL,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        );

        -- Role-Module Mapping
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

    return connection;
};

// Insert initial data if not exists
const insertInitialData = async (connection) => {
    console.log("Inserting Initial Data...");

    // Insert Admin User
    await connection.query(`
        INSERT INTO users (name, email, password, role) 
        VALUES ('Admin User', 'admin@example.com', '$2a$10$X9gLZ1ph0/UeO2l7FjWse.pH92r8yE7I5Of4BdFUX5cJ6mtgh/Su.', 'admin')
        ON DUPLICATE KEY UPDATE email = email;
    `);
    
    // Insert Default Roles
    await connection.query(`
        INSERT INTO roles (name, created_by) 
        VALUES ('Administrator', 1), ('Manager', 1), ('Editor', 1), ('Viewer', 1)
        ON DUPLICATE KEY UPDATE name = name;
    `);

    // Insert Default Modules
    await connection.query(`
        INSERT INTO modules (name, description) 
        VALUES ('Users', 'Manage Users'), ('Roles', 'Manage Roles'), ('Modules', 'Manage Modules')
        ON DUPLICATE KEY UPDATE name = name;
    `);

    // Insert Role-Module Permissions
    await connection.query(`
        INSERT INTO role_modules (role_id, module_id, permission)
        VALUES 
            (1, 1, 'write'), (1, 2, 'write'), (1, 3, 'write'),
            (2, 2, 'read'), (3, 3, 'read')
        ON DUPLICATE KEY UPDATE role_id = role_id;
    `);

    console.log("Initial Data Inserted!");
};

// Execute the setup
const run = async () => {
    try {
        const connection = await setupDatabase();
        await insertInitialData(connection);
        await connection.end();
        console.log("Database Setup Completed Successfully!");
    } catch (error) {
        console.error(" Error Setting Up Database:", error);
    }
};

run();
