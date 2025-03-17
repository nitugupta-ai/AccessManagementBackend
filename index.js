const express = require("express");
const cors = require("cors");
const db = require("./config/db"); // Import database pool
const { setupDatabase, insertInitialData } = require("./config/db"); // Import setup functions

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const roleRoutes = require("./routes/role");
const moduleRoutes = require("./routes/module");
const roleModuleRoutes = require("./routes/roleModule");
const userRoleRoutes = require("./routes/userRole");
const userModuleRoutes = require("./routes/userModule.js");

const app = express();
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Enhanced health check endpoint
app.get('/', (req, res) => {
    console.log('Health check endpoint called');
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Simple Hello World route
app.get('/api/hello', (req, res) => {
    console.log('Hello endpoint called');
    res.status(200).json({ 
        message: "Hello World",
        timestamp: new Date().toISOString()
    });
});


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/role-modules", roleModuleRoutes);
app.use("/api/user-roles", userRoleRoutes);
app.use("/api/user-modules", userModuleRoutes);


app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;

// Start server first, then initialize database
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Available routes:');
    console.log('- GET /');
    console.log('- GET /api/hello');
    console.log('- /api/auth/*');
    console.log('- /api/users/*');
    console.log('- /api/roles/*');
    console.log('- /api/modules/*');
    console.log('- /api/role-modules/*');
});

// Initialize database after server is running
(async () => {
    try {
        console.log('Initializing database...');
        await setupDatabase();
        console.log('Database initialized successfully');
        console.log('Database Host:', process.env.DB_HOST);
    } catch (error) {
        console.error('Database initialization failed:', error);
        // Don't exit process, just log the error
        // This allows the health check to still work even if DB is down
    }
})();