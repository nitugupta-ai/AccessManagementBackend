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

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/role-modules", roleModuleRoutes);
app.use("/api/user-roles", userRoleRoutes);
app.use("/api/user-modules", userModuleRoutes);

// Function to Initialize Database
const initializeDatabase = async () => {
    try {
        console.log("Initializing Database...");
        await setupDatabase();
        await insertInitialData();
        console.log("Database Initialized Successfully!");
    } catch (error) {
        console.error("Error Initializing Database:", error);
        process.exit(1); // Exit process if database setup fails
    }
};

// Start Server After Database Initialization
const startServer = async () => {
    await initializeDatabase(); // Ensure DB setup before starting server

    const PORT = process.env.PORT;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

// Start the server
startServer();
