const express = require("express");
const router = express.Router();
const {db} = require("../config/db.js");
const authMiddleware = require("../middleware/auth.js");

// ✅ Admin can assign roles to users
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { user_id, role_id } = req.body;
        const userRole = req.user.role; // Role from token

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can assign roles to users" });
        }

        await db.execute(
            "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = role_id",
            [user_id, role_id]
        );

        res.status(201).json({ message: "Role assigned to user successfully" });
    } catch (error) {
        console.error("Error assigning role:", error);
        res.status(500).json({ message: "Error assigning role", error });
    }
});

// ✅ Admin can remove roles from users
router.delete("/", authMiddleware, async (req, res) => {
    try {
        const { user_id, role_id } = req.body;
        const userRole = req.user.role; // Role from token

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can remove roles from users" });
        }

        await db.execute("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?", [user_id, role_id]);

        res.json({ message: "Role removed from user successfully" });
    } catch (error) {
        console.error("Error removing role:", error);
        res.status(500).json({ message: "Error removing role", error });
    }
});

// ✅ Get all roles assigned to a user
router.get("/:userId", authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        const [roles] = await db.execute(`
            SELECT r.id, r.name 
            FROM roles r
            INNER JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
        `, [userId]);

        res.json(roles);
    } catch (error) {
        console.error("Error fetching user roles:", error);
        res.status(500).json({ message: "Error fetching user roles", error });
    }
});

// ✅ Users can add themselves to a role
router.post("/join", authMiddleware, async (req, res) => {
    const { role_id } = req.body;
    const userId = req.user.id; // User ID from token

    try {
        // Check if user is already in the role
        const [existing] = await db.execute("SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?", [userId, role_id]);

        if (existing.length > 0) {
            return res.status(400).json({ message: "You are already in this role" });
        }

        // Add user to role
        await db.execute("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [userId, role_id]);

        res.json({ message: "Added to role successfully" });
    } catch (error) {
        console.error("Error joining role:", error);
        res.status(500).json({ error: "Error joining role", details: error.message });
    }
});

// ✅ Users can remove themselves from a role
router.post("/leave", authMiddleware, async (req, res) => {
    const { role_id } = req.body;
    const userId = req.user.id; // User ID from token

    try {
        // Remove user from role
        await db.execute("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?", [userId, role_id]);

        res.json({ message: "Removed from role successfully" });
    } catch (error) {
        console.error("Error leaving role:", error);
        res.status(500).json({ error: "Error leaving role", details: error.message });
    }
});

module.exports = router;
