const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/auth.js");

// ✅ Create a new role (Admin only)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const userRole = req.user.role;

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can create roles" });
        }

        await db.execute("INSERT INTO roles (name, created_by) VALUES (?, ?)", [name, req.user.id]);
        res.status(201).json({ message: "Role created successfully" });
    } catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({ message: "Error creating role", error });
    }
});

// ✅ Get roles (Admin sees all, users see their own)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        let query = "SELECT id, name, created_by FROM roles";
        let values = [];

        if (userRole !== "admin") {
            query = "SELECT id, name, created_by FROM roles WHERE created_by = ?";
            values = [userId];
        }

        console.log("Executing Query:", query, values); // Debugging

        const [roles] = await db.execute(query, values); // ✅ Correct destructuring

        console.log("Database Result:", roles); // Debugging

        if (!Array.isArray(roles)) {
            return res.status(500).json({ message: "Unexpected database response format", result: roles });
        }

        res.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: "Error fetching roles", error });
    }
});

// ✅ Update a role (Only admin)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const roleId = req.params.id;
        const userRole = req.user.role;

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can update roles" });
        }

        await db.execute("UPDATE roles SET name = ? WHERE id = ?", [name, roleId]);
        res.json({ message: "Role updated successfully" });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ message: "Error updating role", error });
    }
});

// ✅ Delete a role (Only admin)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const roleId = req.params.id;
        const userRole = req.user.role;

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Forbidden: Only admin can delete roles" });
        }

        await db.execute("DELETE FROM roles WHERE id = ?", [roleId]);
        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({ message: "Error deleting role", error });
    }
});

module.exports = router;
