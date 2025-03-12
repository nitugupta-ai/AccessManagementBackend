const express = require("express");
const router = express.Router();
const {db} = require("../config/db");
const authMiddleware = require("../middleware/auth.js");

// ✅ Create a new role (Users can create roles)
router.post("/", authMiddleware, async (req, res) => {
    const { name } = req.body;
    const created_by = req.user.id;
    try {
        const [result] = await db.execute(
            "INSERT INTO roles (name, created_by) VALUES (?, ?)",
            [name, created_by]
        );

        const newRoleId = result.insertId;
        const [newRole] = await db.execute("SELECT id, name, created_by FROM roles WHERE id = ?", [newRoleId]);
        res.status(201).json(newRole[0]);
    } catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({ error: "Error creating role", details: error.message });
    }
});

// ✅ Get all roles (Users see only their roles and admin-created roles)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const query = "SELECT id, name, created_by FROM roles WHERE created_by = ? OR created_by IN (SELECT id FROM users WHERE role = 'admin')";
        const [roles] = await db.execute(query, [req.user.id]);
        res.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ message: "Error fetching roles", error });
    }
});

// ✅ Update role (Users can only update roles they created)
router.put("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    try {
        const [roles] = await db.execute("SELECT created_by FROM roles WHERE id = ?", [id]);
        if (roles.length === 0) return res.status(404).json({ message: "Role not found" });
        if (roles[0].created_by !== userId) return res.status(403).json({ message: "You can only update roles you created!" });

        await db.execute("UPDATE roles SET name = ? WHERE id = ?", [name, id]);
        res.json({ message: "Role updated successfully" });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: "Error updating role", details: error.message });
    }
});

// ✅ Delete role (Users can only delete roles they created)
router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [roles] = await db.execute("SELECT created_by FROM roles WHERE id = ?", [id]);
        if (roles.length === 0) return res.status(404).json({ message: "Role not found" });
        if (roles[0].created_by !== userId) return res.status(403).json({ message: "You can only delete roles you created!" });

        await db.execute("DELETE FROM roles WHERE id = ?", [id]);
        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({ error: "Error deleting role", details: error.message });
    }
});

module.exports = router;
