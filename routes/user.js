const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");

// ✅ Get All Users (Admin Only)
router.get("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    try {
        const [users] = await db.execute("SELECT id, name, email, role FROM users");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Error fetching users", details: error.message });
    }
});

// ✅ Delete User (Prevent Admin Deletion)
router.delete("/:id", authMiddleware, async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if user exists
        const [users] = await db.execute("SELECT role FROM users WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userRole = users[0].role;

        // Prevent admin deletion
        if (userRole === "admin") {
            return res.status(403).json({ message: "Cannot delete an admin!" });
        }

        // Delete user
        await db.execute("DELETE FROM users WHERE id = ?", [userId]);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Error deleting user", details: error.message });
    }
});

// ✅ Create User (Only Admin Can Create Users)
router.post("/create", authMiddleware, async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Only admin can create users
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied! Only admin can create users." });
        }

        // Check if email already exists
        const [existingUsers] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into DB
        await db.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Error creating user", details: error.message });
    }
});

module.exports = router;
