const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {db} = require("../config/db"); // MySQL2 with pool.promise()
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");
require("dotenv").config({ path: "../.env" });

const router = express.Router();
const secretKey = process.env.JWT_SECRET; // Ensure this is set in .env

//  Register Route
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    console.log(" Register request received:", req.body);

    try {
        // Check if email already exists
        const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            console.log(" Email already exists");
            return res.status(400).json({ message: "Email already exists" });
        }

        // Check if an admin exists
        const [adminCount] = await db.query("SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin'");
        const isAdmin = adminCount[0].adminCount === 0 ? "admin" : "user";
        console.log("🔹 Assigned role:", isAdmin);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("🔹 Password hashed");

        // Insert new user into the database
        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, isAdmin]
        );

        console.log(" User registered successfully");
        return res.status(201).json({ message: "User registered successfully", role: isAdmin });
    } catch (error) {
        console.error(" Registration error:", error);
        return res.status(500).json({ error: error.message });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("🔹 Login request received:", req.body);

    try {
        // Check if the user exists
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            console.log("Invalid email");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Invalid password");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: "1h" });

        console.log("Login successful");
        return res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: error.message });
    }
});



// Get Current User (Protected Route)
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const [user] = await db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(user[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

// Export router
module.exports = router;
